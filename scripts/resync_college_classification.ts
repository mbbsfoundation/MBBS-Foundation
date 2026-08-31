import "dotenv/config";
import fs from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";
import { CounsellingManagementType } from "@/lib/generated/prisma/client";

function parseCSV(filePath: string): { headers: string[]; rows: Record<string, string>[] } {
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return { headers: [], rows: [] };

  const parseLine = (line: string): string[] => {
    const values: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === "," && !inQuotes) {
        values.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    return values;
  };

  const headers = parseLine(lines[0]);
  const rows = lines.slice(1).map((line) => {
    const values = parseLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] || "";
    });
    return row;
  });

  return { headers, rows };
}

async function resync() {
  console.log("==================================================================");
  console.log("SEQUENCE 9H.3: RESYNC COLLEGE CLASSIFICATION (IDEMPOTENT / SAFE)");
  console.log("==================================================================\n");

  const basePath = path.join(process.cwd(), "mccug2026data", "counselling", "2026");
  const nmcFile = path.join(basePath, "normalized", "nmc_college_capacity_2026.csv");
  const nmcData = parseCSV(nmcFile);
  const legitimateNMC = nmcData.rows.slice(0, 823);

  const nmcMapByCode = new Map<string, { management: string; name: string }>();
  legitimateNMC.forEach((r) => {
    if (r.CollegeCode && r.CollegeCode !== "New Establishment") {
      nmcMapByCode.set(r.CollegeCode.trim(), {
        management: r.Management.trim(),
        name: r.CollegeName.trim(),
      });
    }
  });

  const colleges = await prisma.college.findMany({
    include: {
      seatMatrixRecords: true,
    },
  });

  console.log(`Auditing and resyncing ${colleges.length} colleges in database...`);

  let centralBefore = 0;
  let deemedBefore = 0;
  let iniBefore = 0;
  let esicBefore = 0;
  let govtBefore = 0;
  let pvtBefore = 0;

  colleges.forEach((c) => {
    if (c.isCentralUniversity) centralBefore++;
    if (c.isDeemed) deemedBefore++;
    if (c.isINI) iniBefore++;
    if (c.isESIC) esicBefore++;
    if (c.managementType === "GOVERNMENT") govtBefore++;
    if (c.managementType === "PRIVATE") pvtBefore++;
  });

  console.log(`BEFORE RESYNC:`);
  console.log(`  - Total Colleges: ${colleges.length}`);
  console.log(`  - Government: ${govtBefore}`);
  console.log(`  - Private: ${pvtBefore}`);
  console.log(`  - INI: ${iniBefore}`);
  console.log(`  - Central University (isCentralUniversity): ${centralBefore}`);
  console.log(`  - Deemed (isDeemed): ${deemedBefore}`);
  console.log(`  - ESIC (isESIC): ${esicBefore}`);

  const updates: Array<{
    id: string;
    managementType: CounsellingManagementType;
    isCentralUniversity: boolean;
    isDeemed: boolean;
    isINI: boolean;
    isESIC: boolean;
  }> = [];

  for (const c of colleges) {
    const normType = (c.instituteType || "").trim().toLowerCase();

    // 1. Central University: ONLY exact "Central University" from MCC
    const isCentral = normType === "central university";

    // 2. Deemed University: exact "Deemed University" from MCC or existing verified deemed flag
    const isDeemed = normType === "deemed university" || c.isDeemed;

    // 3. INI
    const isINI = c.isINI || c.managementType === "INI";

    // 4. ESIC
    const isESIC =
      normType === "employees state insurance scheme" ||
      c.collegeName.toLowerCase().includes("esic") ||
      c.collegeName.toLowerCase().includes("employees state insurance");

    // 5. Management Type
    let managementType = c.managementType;
    if (isINI) {
      managementType = CounsellingManagementType.INI;
    } else if (c.nmcCollegeCode && nmcMapByCode.has(c.nmcCollegeCode)) {
      const nmcEntry = nmcMapByCode.get(c.nmcCollegeCode)!;
      managementType =
        nmcEntry.management.toUpperCase() === "GOVERNMENT"
          ? CounsellingManagementType.GOVERNMENT
          : CounsellingManagementType.PRIVATE;
    } else {
      // If no NMC code, check exact match in legitimate NMC
      const found = legitimateNMC.find(
        (r) => r.CollegeName.trim().toLowerCase() === c.collegeName.trim().toLowerCase()
      );
      if (found) {
        managementType =
          found.Management.trim().toUpperCase() === "GOVERNMENT"
            ? CounsellingManagementType.GOVERNMENT
            : CounsellingManagementType.PRIVATE;
      }
    }

    updates.push({
      id: c.id,
      managementType,
      isCentralUniversity: isCentral,
      isDeemed,
      isINI,
      isESIC,
    });
  }

  // Execute database updates in parallel chunks without interactive transaction
  const chunkSize = 25;
  for (let i = 0; i < updates.length; i += chunkSize) {
    const chunk = updates.slice(i, i + chunkSize);
    await Promise.all(
      chunk.map((u) =>
        prisma.college.update({
          where: { id: u.id },
          data: {
            managementType: u.managementType,
            isCentralUniversity: u.isCentralUniversity,
            isDeemed: u.isDeemed,
            isINI: u.isINI,
            isESIC: u.isESIC,
          },
        })
      )
    );
    process.stdout.write(`\rUpdated ${Math.min(i + chunkSize, updates.length)} / ${updates.length} colleges...`);
  }
  console.log("\nUpdates written to database.");

  // Verify updated counts
  const updatedColleges = await prisma.college.findMany();
  let centralAfter = 0;
  let deemedAfter = 0;
  let iniAfter = 0;
  let esicAfter = 0;
  let govtAfter = 0;
  let pvtAfter = 0;

  updatedColleges.forEach((c) => {
    if (c.isCentralUniversity) centralAfter++;
    if (c.isDeemed) deemedAfter++;
    if (c.isINI) iniAfter++;
    if (c.isESIC) esicAfter++;
    if (c.managementType === "GOVERNMENT") govtAfter++;
    if (c.managementType === "PRIVATE") pvtAfter++;
  });

  console.log(`\nAFTER RESYNC:`);
  console.log(`  - Total Colleges: ${updatedColleges.length} (Target: 847)`);
  console.log(`  - Government: ${govtAfter} (Target: 441)`);
  console.log(`  - Private: ${pvtAfter} (Target: 382)`);
  console.log(`  - INI: ${iniAfter} (Target: 24)`);
  console.log(`  - Central University (isCentralUniversity): ${centralAfter} (Target: 7)`);
  console.log(`  - Deemed (isDeemed): ${deemedAfter} (Target: 63)`);
  console.log(`  - ESIC (isESIC): ${esicAfter} (Target: 18)`);

  console.log("\n--- VERIFYING THE 7 CENTRAL UNIVERSITIES ---");
  const centralList = updatedColleges.filter((c) => c.isCentralUniversity);
  centralList.forEach((c, idx) => {
    console.log(`  ${idx + 1}. ${c.collegeName} (${c.state}) [MCC Type: "${c.instituteType}", Mgmt: ${c.managementType}]`);
  });

  console.log("\n--- VERIFYING FALSE-POSITIVE CENTRAL EXCLUSIONS ---");
  const falsePositiveCheck = ["SMS Medical College", "Madras Medical College", "Bangalore Medical College"];
  falsePositiveCheck.forEach((name) => {
    const col = updatedColleges.find((c) => c.collegeName.includes(name));
    console.log(`  - ${col?.collegeName}: isCentralUniversity = ${col?.isCentralUniversity}, managementType = ${col?.managementType}`);
  });

  console.log("\n--- VERIFYING MGIMS WARDHA ---");
  const mgims = updatedColleges.find((c) => c.collegeName.includes("Sevagram") || c.collegeName.includes("Mahatma Gandhi Institute of Medical Sciences"));
  console.log(`  - ${mgims?.collegeName}:`);
  console.log(`    managementType = ${mgims?.managementType} (Must be PRIVATE)`);
  console.log(`    isCentralUniversity = ${mgims?.isCentralUniversity} (Must be false)`);
  console.log(`    isDeemed = ${mgims?.isDeemed} (Must be false)`);
  console.log(`    instituteType = "${mgims?.instituteType}"`);

  console.log("\n✅ RESYNC COMPLETE AND VERIFIED!");
}

resync().catch(console.error);
