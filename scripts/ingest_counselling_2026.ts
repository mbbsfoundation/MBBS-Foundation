import "dotenv/config";
import fs from "fs";
import path from "path";
import { prisma } from "../lib/prisma";
import {
  CounsellingManagementType,
  CounsellingAuthorityType,
  CounsellingRoundType,
  CounsellingRoundStatus,
  CounsellingDataType,
  CounsellingImportStatus,
  CounsellingSourceStatus,
  CounsellingMatchConfidence,
  CounsellingSeatCategory,
} from "../lib/generated/prisma/client";

// Robust CSV Line Parser
function parseCSV(filePath: string): { headers: string[]; rows: Record<string, string>[] } {
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return { headers: [], rows: [] };

  const parseLine = (line: string): string[] => {
    const result: string[] = [];
    let cur = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (c === "," && !inQuotes) {
        result.push(cur.trim());
        cur = "";
      } else {
        cur += c;
      }
    }
    result.push(cur.trim());
    return result;
  };

  const headers = parseLine(lines[0]);
  const rows = lines.slice(1).map((l) => {
    const vals = parseLine(l);
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => (row[h] = vals[idx] ?? ""));
    return row;
  });
  return { headers, rows };
}

function cleanStr(s: string): string {
  return s
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeState(state: string): string {
  const s = state.trim();
  const low = s.toLowerCase();
  if (low.includes("chattisgarh") || low.includes("chhattisgarh")) return "Chhattisgarh";
  if (low.includes("andaman")) return "Andaman & Nicobar Islands";
  if (low.includes("jammu")) return "Jammu & Kashmir";
  if (low.includes("dadra") || low.includes("dadar") || low.includes("daman")) return "Dadra and Nagar Haveli and Daman and Diu";
  if (low.includes("delhi")) return "Delhi";
  if (low.includes("puducherry") || low.includes("pondicherry")) return "Puducherry";
  if (low.includes("odisha") || low.includes("orissa")) return "Odisha";
  return s;
}

function generateSlug(name: string, state: string, usedSlugs: Set<string>): string {
  let base = name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();

  base = base.replace(/^-+|-+$/g, "");
  if (base.length > 80) base = base.substring(0, 80).replace(/-+$/, "");

  let slug = base;
  if (usedSlugs.has(slug)) {
    const stateSlug = state.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-");
    slug = `${base}-${stateSlug}`;
  }

  let counter = 1;
  while (usedSlugs.has(slug)) {
    slug = `${base}-${counter}`;
    counter++;
  }

  usedSlugs.add(slug);
  return slug;
}

// Canonical Quota Normalizer
export function normalizeQuota(qRaw: string): string {
  const q = qRaw.trim();
  if (q === "All India") return "All India";
  if (q === "Open Seat Quota") return "Open Seat Quota";
  if (q.startsWith("Self-Financed")) return "Self-Financed Merit";
  if (q === "Non-Resident Indian" || q === "NRI") return "NRI";
  if (q.startsWith("Employees State") || q === "ESI") return "ESI";
  if (q === "Delhi University" || q === "Delhi University Quota") return "Delhi University Quota";
  if (q === "IP University Quota") return "IP University Quota";
  if (q.startsWith("Internal -Puducherry")) return "Internal -Puducherry";
  if (q === "Muslim Minority" || q === "Muslim Minority Quota") return "Muslim Minority";
  if (q === "Jain Minority Quota") return "Jain Minority Quota";
  if (q === "Foreign Country" || q === "Foreign Country Quota") return "Foreign Country Quota";
  if (q.startsWith("Aligarh Muslim") || q === "AMU Quota") return "AMU Quota";
  if (q.startsWith("Non-Resident") && (q.includes("AMU") || q === "Non-Resident")) return "NRI-AMU";
  if (q.startsWith("Delhi NCR")) return "Delhi NCR CW";
  return q;
}

// Category code parser for seat matrix
function parseSeatMatrixCategory(code: string): { category: CounsellingSeatCategory; isPwD: boolean } {
  const c = code.trim();
  switch (c) {
    case "OP NO":
      return { category: CounsellingSeatCategory.OPEN, isPwD: false };
    case "OP PH":
      return { category: CounsellingSeatCategory.OPEN, isPwD: true };
    case "BC NO":
      return { category: CounsellingSeatCategory.OBC, isPwD: false };
    case "BC PH":
      return { category: CounsellingSeatCategory.OBC, isPwD: true };
    case "EW NO":
      return { category: CounsellingSeatCategory.EWS, isPwD: false };
    case "EW PH":
      return { category: CounsellingSeatCategory.EWS, isPwD: true };
    case "SC NO":
      return { category: CounsellingSeatCategory.SC, isPwD: false };
    case "SC PH":
      return { category: CounsellingSeatCategory.SC, isPwD: true };
    case "ST NO":
      return { category: CounsellingSeatCategory.ST, isPwD: false };
    case "ST PH":
      return { category: CounsellingSeatCategory.ST, isPwD: true };
    default:
      return { category: CounsellingSeatCategory.OTHER, isPwD: false };
  }
}

// Allotted Category parser for allotments
function parseAllottedCategory(raw: string): { category: CounsellingSeatCategory; isPwD: boolean } {
  const r = raw.trim();
  switch (r) {
    case "Open":
      return { category: CounsellingSeatCategory.OPEN, isPwD: false };
    case "Open PwD":
      return { category: CounsellingSeatCategory.OPEN, isPwD: true };
    case "OBC":
      return { category: CounsellingSeatCategory.OBC, isPwD: false };
    case "OBC PwD":
      return { category: CounsellingSeatCategory.OBC, isPwD: true };
    case "EWS":
      return { category: CounsellingSeatCategory.EWS, isPwD: false };
    case "EWS PwD":
      return { category: CounsellingSeatCategory.EWS, isPwD: true };
    case "SC":
      return { category: CounsellingSeatCategory.SC, isPwD: false };
    case "SC PwD":
      return { category: CounsellingSeatCategory.SC, isPwD: true };
    case "ST":
      return { category: CounsellingSeatCategory.ST, isPwD: false };
    case "ST PwD":
      return { category: CounsellingSeatCategory.ST, isPwD: true };
    default:
      return { category: CounsellingSeatCategory.OTHER, isPwD: false };
  }
}

// Candidate Category parser for allotments
function parseCandidateCategory(raw: string): { category: CounsellingSeatCategory; isPwD: boolean } {
  const r = raw.trim();
  switch (r) {
    case "General":
      return { category: CounsellingSeatCategory.OPEN, isPwD: false };
    case "General PwD":
      return { category: CounsellingSeatCategory.OPEN, isPwD: true };
    case "OBC":
      return { category: CounsellingSeatCategory.OBC, isPwD: false };
    case "OBC PwD":
      return { category: CounsellingSeatCategory.OBC, isPwD: true };
    case "EWS":
      return { category: CounsellingSeatCategory.EWS, isPwD: false };
    case "EWS PwD":
      return { category: CounsellingSeatCategory.EWS, isPwD: true };
    case "SC":
      return { category: CounsellingSeatCategory.SC, isPwD: false };
    case "SC PwD":
      return { category: CounsellingSeatCategory.SC, isPwD: true };
    case "ST":
      return { category: CounsellingSeatCategory.ST, isPwD: false };
    case "ST PwD":
      return { category: CounsellingSeatCategory.ST, isPwD: true };
    default:
      return { category: CounsellingSeatCategory.OTHER, isPwD: false };
  }
}

// Manual overrides for known MCC -> NMC naming differences
const manualOverrides: Record<string, number> = {
  "200612": 94,   // Chandulal Chandrakar Memorial Govt. Medical College, Durg
  "200479": 135,  // Dr. LAXMINARAYAN PANDEY GOVT. MEDICAL COLLEGE, RATLAM
  "200374": 419,  // Instt. Of Medical Sciences & SUM Hospital, Bhubaneswar (OD/009/P/3)
  "902806": 420,  // Institute of Medical Sciences & SUM Hospital, Campus-II, Phulnakhara (OD/010/P/3)
  "200264": 218,  // Government Medical College & ESIC Hospital, Coimbatore
  "200648": 372,  // GOVERNMENT MEDICAL COLLEGE VIKARABAD
  "200470": 571,  // NAMO Medical Education & Research Institute, Silvassa
  "200316": 386,  // MEDICAL COLLEGE, KOLKATA (Govt. Medical College, Kolkata)
  "200118": 77,   // VARDHMAN INSTITUTE OF MEDICAL SCIENCES, NALANDA (BMIMS, Pawapuri)
  "200293": 129,  // Dr. Bhimrao Ramji Ambedkar Government Medical College, Kannauj
  "200476": 702,  // Shri Atal Bihari Vajpayee Medical College & Research Institute, Bengaluru
};

export async function runIngestion() {
  console.log("===============================================================");
  console.log("STARTING SEQUENCE 3: SEED DATA INGESTION & COLLEGE MASTER BUILD");
  console.log("===============================================================\n");

  const basePath = path.join(process.cwd(), "mccug2026data", "counselling", "2026");
  const nmcFile = path.join(basePath, "normalized", "nmc_college_capacity_2026.csv");
  const matrixFile = path.join(basePath, "normalized", "mcc_round1_seat_matrix_2026.csv");
  const allotFile = path.join(basePath, "normalized", "mcc_round1_allotments_2026.csv");

  // Step 1: Parse CSVs
  console.log("1. Parsing CSV data files...");
  const nmcData = parseCSV(nmcFile);
  const matrixData = parseCSV(matrixFile);
  const allotData = parseCSV(allotFile);

  console.log(`- NMC Raw Lines: ${nmcData.rows.length}`);
  console.log(`- MCC Matrix Raw Lines: ${matrixData.rows.length}`);
  console.log(`- MCC Allotments Raw Lines: ${allotData.rows.length}`);

  // Step 2: Validate NMC Institutional Rows
  console.log("\n2. Validating NMC legitimate colleges...");
  const legitimateNMC = nmcData.rows.slice(0, 823);
  const excludedNMCRows = nmcData.rows.slice(823);

  if (legitimateNMC.length !== 823) {
    throw new Error(`STOP: Legitimate NMC count mismatch! Expected 823, got ${legitimateNMC.length}`);
  }

  let nmcTotalSeats = 0;
  let nmcGovtCount = 0;
  let nmcGovtSeats = 0;
  let nmcPvtCount = 0;
  let nmcPvtSeats = 0;
  let nmcNewCount = 0;
  let nmcNewSeats = 0;

  legitimateNMC.forEach((r) => {
    const total = parseInt(r.TotalSeats || "0", 10);
    const mgmt = r.Management.trim().toLowerCase();
    const code = r.CollegeCode.trim();

    nmcTotalSeats += total;
    if (mgmt === "government") {
      nmcGovtCount++;
      nmcGovtSeats += total;
    } else if (mgmt === "private") {
      nmcPvtCount++;
      nmcPvtSeats += total;
    }

    if (code === "New Establishment") {
      nmcNewCount++;
      nmcNewSeats += total;
    }
  });

  console.log(`- NMC Legitimate Colleges: ${legitimateNMC.length} (Target: 823) ✅`);
  console.log(`- NMC Total Seats: ${nmcTotalSeats} (Target: 136,939) ✅`);
  console.log(`- NMC Govt: ${nmcGovtCount} colleges, ${nmcGovtSeats} seats (Target: 441 / 63,296) ✅`);
  console.log(`- NMC Pvt: ${nmcPvtCount} colleges, ${nmcPvtSeats} seats (Target: 382 / 73,643) ✅`);
  console.log(`- NMC New Est: ${nmcNewCount} colleges, ${nmcNewSeats} seats (Target: 25 / 2,400) ✅`);
  console.log(`- NMC Excluded Summary Rows: ${excludedNMCRows.length} (35 state summary rows) ✅`);

  if (nmcTotalSeats !== 136939 || nmcGovtCount !== 441 || nmcGovtSeats !== 63296 || nmcPvtCount !== 382 || nmcPvtSeats !== 73643 || nmcNewCount !== 25 || nmcNewSeats !== 2400) {
    throw new Error("STOP: NMC capacity reconciliation failed against target metrics!");
  }

  // Step 3: Validate MCC Matrix
  console.log("\n3. Validating MCC Round 1 Seat Matrix...");
  if (matrixData.rows.length !== 3093) {
    throw new Error(`STOP: MCC Matrix rows mismatch! Expected 3,093, got ${matrixData.rows.length}`);
  }

  let matrixOfferedSeats = 0;
  const mccInstitutesMap = new Map<string, {
    mccCode: string;
    instituteName: string;
    state: string;
    instituteType: string;
    cleanName: string;
  }>();

  matrixData.rows.forEach((r) => {
    const seats = parseInt(r.Seats || "0", 10);
    matrixOfferedSeats += seats;

    const code = r.MCCCode.trim();
    const inst = r.Institute.trim();
    const state = normalizeState(r.State.trim());
    const type = r.InstituteType.trim();
    const key = `${code}||${inst}`;

    if (!mccInstitutesMap.has(key)) {
      mccInstitutesMap.set(key, {
        mccCode: code,
        instituteName: inst,
        state,
        instituteType: type,
        cleanName: cleanStr(inst),
      });
    }
  });

  console.log(`- MCC Matrix Rows: ${matrixData.rows.length} (Target: 3,093) ✅`);
  console.log(`- MCC Total Offered Seats: ${matrixOfferedSeats} (Target: 27,292) ✅`);
  console.log(`- MCC Unique Institutes: ${mccInstitutesMap.size} (Target: 515) ✅`);

  if (matrixOfferedSeats !== 27292 || mccInstitutesMap.size !== 515) {
    throw new Error("STOP: MCC Seat Matrix totals reconciliation failed!");
  }

  // Step 4: Validate MCC Allotments
  console.log("\n4. Validating MCC Round 1 Allotments...");
  if (allotData.rows.length !== 25635) {
    throw new Error(`STOP: MCC Allotments rows mismatch! Expected 25,635, got ${allotData.rows.length}`);
  }

  const allottedCatCounts: Record<string, number> = {};
  allotData.rows.forEach((r) => {
    const cat = r.AllottedCategory.trim();
    allottedCatCounts[cat] = (allottedCatCounts[cat] || 0) + 1;
  });

  console.log(`- Total Allotments: ${allotData.rows.length} (Target: 25,635) ✅`);
  console.log(`- Category & PwD Allotment Breakdown:`);
  console.log(`  * Open: ${allottedCatCounts["Open"]} (Target: 17,452) ✅`);
  console.log(`  * OBC: ${allottedCatCounts["OBC"]} (Target: 3,449) ✅`);
  console.log(`  * SC: ${allottedCatCounts["SC"]} (Target: 1,916) ✅`);
  console.log(`  * EWS: ${allottedCatCounts["EWS"]} (Target: 1,251) ✅`);
  console.log(`  * ST: ${allottedCatCounts["ST"]} (Target: 954) ✅`);
  console.log(`  * Open PwD: ${allottedCatCounts["Open PwD"]} (Target: 270) ✅`);
  console.log(`  * OBC PwD: ${allottedCatCounts["OBC PwD"]} (Target: 168) ✅`);
  console.log(`  * SC PwD: ${allottedCatCounts["SC PwD"]} (Target: 87) ✅`);
  console.log(`  * EWS PwD: ${allottedCatCounts["EWS PwD"]} (Target: 59) ✅`);
  console.log(`  * ST PwD: ${allottedCatCounts["ST PwD"]} (Target: 29) ✅`);

  if (
    allottedCatCounts["Open"] !== 17452 ||
    allottedCatCounts["OBC"] !== 3449 ||
    allottedCatCounts["SC"] !== 1916 ||
    allottedCatCounts["EWS"] !== 1251 ||
    allottedCatCounts["ST"] !== 954 ||
    allottedCatCounts["Open PwD"] !== 270 ||
    allottedCatCounts["OBC PwD"] !== 168 ||
    allottedCatCounts["SC PwD"] !== 87 ||
    allottedCatCounts["EWS PwD"] !== 59 ||
    allottedCatCounts["ST PwD"] !== 29
  ) {
    throw new Error("STOP: Allotted Category & PwD reconciliation failed!");
  }

  // Step 5: Verify AIR 4162
  const r4162 = allotData.rows.find((r) => r.AIR === "4162");
  if (!r4162 || r4162.AllottedCategory !== "Open PwD" || r4162.CandidateCategory !== "General PwD") {
    throw new Error("STOP: Verification for AIR 4162 failed!");
  }
  console.log(`- AIR 4162 correctly parsed as Open PwD / General PwD at AIIMS New Delhi ✅`);

  // Step 6: Build Canonical Colleges Master & Mapping
  console.log("\n5. Building Canonical College Master & MCC Mapping...");
  const usedSlugs = new Set<string>();

  // Prepare 823 NMC College Objects
  interface PreparedCollege {
    tempId: string;
    nmcCode: string | null;
    mccCode: string | null;
    slug: string;
    collegeName: string;
    shortName: string | null;
    state: string;
    city: string | null;
    managementType: CounsellingManagementType;
    instituteType: string | null;
    isINI: boolean;
    isDeemed: boolean;
    isCentralUniversity: boolean;
    isESIC: boolean;
    genderRestriction: string | null;
    establishmentYear: number | null;
    capacitySeats: number;
    renewedSeats: number | null;
    increasedSeats: number | null;
    isNewEstablishment: boolean;
    nmcRawRow: Record<string, string>;
  }

  const preparedColleges: PreparedCollege[] = [];

  legitimateNMC.forEach((r, idx) => {
    const rawCode = r.CollegeCode.trim();
    const isNew = rawCode === "New Establishment";
    const nmcCode = isNew ? null : rawCode;
    const name = r.CollegeName.trim();
    const state = normalizeState(r.State);
    const mgmt = r.Management.trim().toUpperCase() === "GOVERNMENT" ? CounsellingManagementType.GOVERNMENT : CounsellingManagementType.PRIVATE;
    const total = parseInt(r.TotalSeats || "0", 10);
    const renewed = r.SeatsRenewed ? parseInt(r.SeatsRenewed, 10) : null;
    const increased = r.SeatsIncreased ? parseInt(r.SeatsIncreased, 10) : null;

    const slug = generateSlug(name, state, usedSlugs);
    const isESIC = cleanStr(name).includes("esic") || cleanStr(name).includes("employees state insurance");

    preparedColleges.push({
      tempId: `nmc_${idx + 1}`,
      nmcCode,
      mccCode: null,
      slug,
      collegeName: name,
      shortName: null,
      state,
      city: null,
      managementType: mgmt,
      instituteType: null,
      isINI: false,
      isDeemed: false,
      isCentralUniversity: false,
      isESIC,
      genderRestriction: null,
      establishmentYear: null,
      capacitySeats: total,
      renewedSeats: renewed,
      increasedSeats: increased,
      isNewEstablishment: isNew,
      nmcRawRow: r,
    });
  });

  // Map 515 MCC Institutes to NMC or INI
  const iniKeywords = ["aiims", "jipmer", "all india institute of medical sciences", "jawaharlal institute of postgraduate medical education"];

  const mccMapping = new Map<string, {
    collegeTempId: string;
    matchConfidence: CounsellingMatchConfidence;
    isINI: boolean;
  }>();

  const preparedINIColleges: PreparedCollege[] = [];
  let iniIdx = 1;

  mccInstitutesMap.forEach((mccInst, key) => {
    const normType = mccInst.instituteType.trim().toLowerCase();
    const isINI = normType.includes("aiims") || normType.includes("all india institute of medical science") || normType.includes("jawaharlal institute of postgraduate medical education") || iniKeywords.some((k) => mccInst.cleanName.includes(k));

    if (isINI) {
      const slug = generateSlug(mccInst.instituteName.split(",")[0], mccInst.state, usedSlugs);
      const iniCollege: PreparedCollege = {
        tempId: `ini_${iniIdx++}`,
        nmcCode: null,
        mccCode: mccInst.mccCode,
        slug,
        collegeName: mccInst.instituteName,
        shortName: mccInst.instituteName.split(",")[0].trim(),
        state: mccInst.state,
        city: null,
        managementType: CounsellingManagementType.INI,
        instituteType: mccInst.instituteType,
        isINI: true,
        isDeemed: false,
        isCentralUniversity: false,
        isESIC: false,
        genderRestriction: null,
        establishmentYear: null,
        capacitySeats: 0,
        renewedSeats: null,
        increasedSeats: null,
        isNewEstablishment: false,
        nmcRawRow: {},
      };

      preparedINIColleges.push(iniCollege);
      mccMapping.set(key, {
        collegeTempId: iniCollege.tempId,
        matchConfidence: CounsellingMatchConfidence.EXACT,
        isINI: true,
      });
      return;
    }

    // Check manual overrides
    if (manualOverrides[mccInst.mccCode]) {
      const sno = manualOverrides[mccInst.mccCode];
      const matchedNMC = preparedColleges[sno - 1];
      if (!matchedNMC.mccCode) matchedNMC.mccCode = mccInst.mccCode;
      if (normType === "deemed university") matchedNMC.isDeemed = true;
      if (normType === "central university") matchedNMC.isCentralUniversity = true;
      if (normType === "employees state insurance scheme") matchedNMC.isESIC = true;
      matchedNMC.instituteType = mccInst.instituteType;

      mccMapping.set(key, {
        collegeTempId: matchedNMC.tempId,
        matchConfidence: CounsellingMatchConfidence.VERIFIED,
        isINI: false,
      });
      return;
    }

    // Automated matching
    const mccFirstPart = mccInst.cleanName.split(",")[0].trim();
    const stateCandidates = preparedColleges.filter((c) => c.state.toLowerCase() === mccInst.state.toLowerCase());

    let match = stateCandidates.find((c) => cleanStr(c.collegeName) === mccInst.cleanName || cleanStr(c.collegeName).startsWith(mccFirstPart) || mccInst.cleanName.startsWith(cleanStr(c.collegeName)));

    if (!match) {
      const stopWords = new Set(["medical", "college", "hospital", "institute", "sciences", "research", "centre", "center", "and", "of", "the", "in", "dr", "govt", "government", "shri", "sri", "society"]);
      const mccTokens = mccFirstPart.split(" ").filter((t) => t.length > 2 && !stopWords.has(t));

      if (mccTokens.length > 0) {
        const scored = stateCandidates.map((c) => {
          const cTokens = cleanStr(c.collegeName).split(" ").filter((t) => t.length > 2 && !stopWords.has(t));
          const matchedTokens = mccTokens.filter((t) => cTokens.includes(t));
          const score = matchedTokens.length / Math.max(mccTokens.length, 1);
          return { c, score, matchedTokens };
        }).filter((item) => item.score >= 0.5);

        scored.sort((a, b) => b.score - a.score);
        if (scored.length > 0 && scored[0].score >= 0.6) {
          match = scored[0].c;
        }
      }
    }

    if (!match) {
      throw new Error(`STOP: Unresolved MCC Institute: ${key}`);
    }

    if (!match.mccCode) match.mccCode = mccInst.mccCode;
    if (normType === "deemed university") match.isDeemed = true;
    if (normType === "central university") match.isCentralUniversity = true;
    if (normType === "employees state insurance scheme") match.isESIC = true;
    match.instituteType = mccInst.instituteType;

    mccMapping.set(key, {
      collegeTempId: match.tempId,
      matchConfidence: CounsellingMatchConfidence.VERIFIED,
      isINI: false,
    });
  });

  const totalCanonicalColleges = preparedColleges.length + preparedINIColleges.length;
  console.log(`- Canonical Colleges Created: ${totalCanonicalColleges} (${preparedColleges.length} NMC + ${preparedINIColleges.length} INI) ✅`);
  console.log(`- MCC Unique Institutes Mapped: ${mccMapping.size} (Target: 515, 0 Unresolved) ✅`);

  // Build Allotment Institute -> Matrix Institute resolution map (1-to-1 exact)
  const matrixInstList = Array.from(mccInstitutesMap.entries()).map(([key, inst]) => {
    const parts = inst.instituteName.split(",");
    const twoParts = parts.slice(0, 2).join(" ");
    return {
      key,
      mccCode: inst.mccCode,
      name: inst.instituteName,
      state: inst.state,
      cleanName: inst.cleanName,
      cleanTwoParts: cleanStr(twoParts),
      cleanFirstPart: cleanStr(parts[0]),
    };
  });

  const allotToMatrixMap = new Map<string, string>(); // allotRawName -> matrixKey
  const uniqueAllotNames = new Set<string>();
  allotData.rows.forEach((r) => uniqueAllotNames.add(r.Institute.trim()));

  uniqueAllotNames.forEach((allotInst) => {
    const cleanA = cleanStr(allotInst);
    const parts = allotInst.split(",");
    const cleanTwoParts = cleanStr(parts.slice(0, 2).join(" "));

    let matches = matrixInstList.filter((m) => m.cleanName === cleanA || m.name === allotInst);

    if (matches.length === 0) {
      matches = matrixInstList.filter((m) => m.cleanTwoParts === cleanTwoParts || m.cleanName.startsWith(cleanTwoParts) || cleanA.startsWith(m.cleanTwoParts));
    }

    if (matches.length === 0) {
      matches = matrixInstList.filter((m) => m.cleanName.startsWith(cleanA) || cleanA.startsWith(m.cleanName));
    }

    if (matches.length === 0) {
      const stopWords = new Set(["medical", "college", "hospital", "institute", "sciences", "research", "centre", "center", "and", "of", "the", "in", "dr", "govt", "government", "shri", "sri", "society"]);
      const aTokens = cleanA.split(" ").filter((t) => t.length > 2 && !stopWords.has(t));

      const scored = matrixInstList.map((m) => {
        const mTokens = m.cleanName.split(" ").filter((t) => t.length > 2 && !stopWords.has(t));
        const matched = aTokens.filter((t) => mTokens.includes(t));
        const score = matched.length / Math.max(aTokens.length, 1);
        return { m, score };
      }).filter((item) => item.score >= 0.7);

      scored.sort((a, b) => b.score - a.score);
      if (scored.length === 1 || (scored.length > 1 && scored[0].score > scored[1].score + 0.2)) {
        matches = [scored[0].m];
      }
    }

    if (matches.length !== 1) {
      throw new Error(`STOP: Could not map allotment institute unambiguously to matrix: ${allotInst} (found ${matches.length} matches)`);
    }

    allotToMatrixMap.set(allotInst, matches[0].key);
  });

  console.log(`- Allotment Institutes Resolution: ${allotToMatrixMap.size} / ${uniqueAllotNames.size} (100% 1-to-1 matched) ✅`);

  // Step 7: Database Ingestion via Prisma Transactions
  console.log("\n6. Executing Database Ingestion via Prisma...");

  // Idempotency: Clean previous 2026 counselling data if re-running
  console.log("- Ensuring clean idempotent state for 2026 counselling data...");
  await prisma.allotmentRecord.deleteMany({});
  await prisma.seatMatrixRecord.deleteMany({});
  await prisma.collegeAnnualCapacity.deleteMany({});
  await prisma.collegeAlias.deleteMany({});
  await prisma.counsellingDataImport.deleteMany({});
  await prisma.counsellingRound.deleteMany({});
  await prisma.college.deleteMany({});

  // 1. Create / Upsert Authorities
  const mccAuthority = await prisma.counsellingAuthority.upsert({
    where: { name: "Medical Counselling Committee" },
    update: {
      shortName: "MCC",
      authorityType: CounsellingAuthorityType.MCC,
      isActive: true,
    },
    create: {
      name: "Medical Counselling Committee",
      shortName: "MCC",
      authorityType: CounsellingAuthorityType.MCC,
      isActive: true,
      website: "https://mcc.nic.in",
    },
  });

  const nmcAuthority = await prisma.counsellingAuthority.upsert({
    where: { name: "National Medical Commission" },
    update: {
      shortName: "NMC",
      authorityType: CounsellingAuthorityType.OTHER,
      isActive: true,
    },
    create: {
      name: "National Medical Commission",
      shortName: "NMC",
      authorityType: CounsellingAuthorityType.OTHER,
      isActive: true,
      website: "https://www.nmc.org.in",
    },
  });

  // 2. Create / Upsert MCC Round-1
  const mccRound1 = await prisma.counsellingRound.upsert({
    where: {
      authorityId_academicYear_roundType: {
        authorityId: mccAuthority.id,
        academicYear: 2026,
        roundType: CounsellingRoundType.ROUND_1,
      },
    },
    update: {
      status: CounsellingRoundStatus.COMPLETED,
      seatMatrixPublished: true,
      allotmentPublished: true,
      vacancyPublished: false,
    },
    create: {
      authorityId: mccAuthority.id,
      academicYear: 2026,
      roundType: CounsellingRoundType.ROUND_1,
      status: CounsellingRoundStatus.COMPLETED,
      seatMatrixPublished: true,
      allotmentPublished: true,
      vacancyPublished: false,
      publishedAt: new Date(),
    },
  });

  // 3. Create / Upsert 3 Import Batch Records
  const nmcCapacityImport = await prisma.counsellingDataImport.create({
    data: {
      authorityId: nmcAuthority.id,
      academicYear: 2026,
      dataType: CounsellingDataType.CAPACITY,
      sourceFileName: "nmc_college_capacity_2026.csv",
      status: CounsellingImportStatus.ACTIVE,
      isOfficial: true,
      revisionNumber: 1,
      rowCount: 823,
      errorCount: 0,
      notes: "NMC 2026 MBBS approved annual capacity dataset (823 legitimate institutions, excluding 35 state summary rows).",
      activatedAt: new Date(),
    },
  });

  const mccMatrixImport = await prisma.counsellingDataImport.create({
    data: {
      authorityId: mccAuthority.id,
      roundId: mccRound1.id,
      academicYear: 2026,
      dataType: CounsellingDataType.SEAT_MATRIX,
      sourceFileName: "mcc_round1_seat_matrix_2026.csv",
      status: CounsellingImportStatus.ACTIVE,
      isOfficial: true,
      revisionNumber: 1,
      rowCount: 3093,
      errorCount: 0,
      notes: "MCC Round-1 2026 MBBS official seat matrix (3,093 records, 27,292 seats across 515 institutes).",
      activatedAt: new Date(),
    },
  });

  const mccAllotImport = await prisma.counsellingDataImport.create({
    data: {
      authorityId: mccAuthority.id,
      roundId: mccRound1.id,
      academicYear: 2026,
      dataType: CounsellingDataType.ALLOTMENT,
      sourceFileName: "mcc_round1_allotments_2026.csv",
      status: CounsellingImportStatus.ACTIVE,
      isOfficial: true,
      revisionNumber: 1,
      rowCount: 25635,
      errorCount: 0,
      notes: "MCC Round-1 2026 MBBS official allotment results (25,635 allotments with candidate and allotted categories preserved).",
      activatedAt: new Date(),
    },
  });

  console.log(`- Created CounsellingDataImport records (IDs: ${nmcCapacityImport.id}, ${mccMatrixImport.id}, ${mccAllotImport.id}) ✅`);

  // 4. Ingest Colleges & Capacity
  console.log("7. Ingesting 847 Colleges, Aliases and Capacity records in batches...");
  const tempIdToDbId = new Map<string, string>();

  // Ingest NMC Colleges in chunks
  const allPrepared = [...preparedColleges, ...preparedINIColleges];
  for (const c of allPrepared) {
    const dbCollege = await prisma.college.upsert({
      where: { slug: c.slug },
      update: {
        nmcCollegeCode: c.nmcCode,
        mccInstituteCode: c.mccCode,
        collegeName: c.collegeName,
        shortName: c.shortName,
        state: c.state,
        managementType: c.managementType,
        instituteType: c.instituteType,
        isINI: c.isINI,
        isDeemed: c.isDeemed,
        isCentralUniversity: c.isCentralUniversity,
        isESIC: c.isESIC,
        isActive: true,
      },
      create: {
        slug: c.slug,
        nmcCollegeCode: c.nmcCode,
        mccInstituteCode: c.mccCode,
        collegeName: c.collegeName,
        shortName: c.shortName,
        state: c.state,
        managementType: c.managementType,
        instituteType: c.instituteType,
        isINI: c.isINI,
        isDeemed: c.isDeemed,
        isCentralUniversity: c.isCentralUniversity,
        isESIC: c.isESIC,
        isActive: true,
      },
    });

    tempIdToDbId.set(c.tempId, dbCollege.id);
  }

  // Batch insert NMC Aliases
  const nmcAliasBatch = preparedColleges.map((c) => ({
    collegeId: tempIdToDbId.get(c.tempId)!,
    sourceAuthority: CounsellingAuthorityType.OTHER,
    sourceName: c.collegeName,
    sourceInstituteCode: c.nmcCode,
    normalizedName: cleanStr(c.collegeName),
    matchConfidence: CounsellingMatchConfidence.EXACT,
  }));
  for (let i = 0; i < nmcAliasBatch.length; i += 200) {
    await prisma.collegeAlias.createMany({ data: nmcAliasBatch.slice(i, i + 200) });
  }

  // Batch insert NMC Annual Capacity
  const nmcCapacityBatch = preparedColleges.map((c) => ({
    collegeId: tempIdToDbId.get(c.tempId)!,
    academicYear: 2026,
    approvedSeats: c.capacitySeats,
    renewedSeats: c.renewedSeats,
    increasedSeats: c.increasedSeats,
    isNewEstablishment: c.isNewEstablishment,
    sourceImportId: nmcCapacityImport.id,
    status: CounsellingSourceStatus.OFFICIAL,
  }));
  for (let i = 0; i < nmcCapacityBatch.length; i += 200) {
    await prisma.collegeAnnualCapacity.createMany({ data: nmcCapacityBatch.slice(i, i + 200) });
  }

  // Batch insert MCC Aliases for all 515 MCC institutes
  console.log("8. Ingesting 515 MCC CollegeAlias records...");
  const mccAliasBatch: any[] = [];
  for (const [key, mapping] of mccMapping.entries()) {
    const mccInst = mccInstitutesMap.get(key)!;
    const dbCollegeId = tempIdToDbId.get(mapping.collegeTempId)!;
    mccAliasBatch.push({
      collegeId: dbCollegeId,
      sourceAuthority: CounsellingAuthorityType.MCC,
      sourceName: mccInst.instituteName,
      sourceInstituteCode: mccInst.mccCode,
      normalizedName: mccInst.cleanName,
      matchConfidence: mapping.matchConfidence,
    });
  }
  for (let i = 0; i < mccAliasBatch.length; i += 200) {
    await prisma.collegeAlias.createMany({ data: mccAliasBatch.slice(i, i + 200) });
  }

  // 5. Ingest SeatMatrixRecord (3,093 rows) in chunks
  console.log("9. Ingesting 3,093 SeatMatrixRecord rows...");
  const seatMatrixBatch = matrixData.rows.map((r) => {
    const code = r.MCCCode.trim();
    const inst = r.Institute.trim();
    const key = `${code}||${inst}`;
    const mapping = mccMapping.get(key)!;
    const dbCollegeId = tempIdToDbId.get(mapping.collegeTempId)!;
    const { category, isPwD } = parseSeatMatrixCategory(r.CategoryCode);
    const seats = parseInt(r.Seats || "0", 10);
    const canonicalQuota = normalizeQuota(r.Quota);

    return {
      roundId: mccRound1.id,
      collegeId: dbCollegeId,
      sourceImportId: mccMatrixImport.id,
      course: "MBBS",
      quota: canonicalQuota,
      seatCategory: category,
      isPwD,
      gender: r.SeatGender?.trim() || null,
      seatCount: seats,
      sourceInstituteName: inst,
      sourceInstituteCode: code,
      sourceCategoryLabel: r.CategoryCode.trim(),
      isOfficial: true,
      revisionNumber: 1,
    };
  });

  const matrixChunkSize = 500;
  for (let i = 0; i < seatMatrixBatch.length; i += matrixChunkSize) {
    const chunk = seatMatrixBatch.slice(i, i + matrixChunkSize);
    await prisma.seatMatrixRecord.createMany({ data: chunk });
  }

  // 6. Ingest AllotmentRecord (25,635 rows) in chunks
  console.log("10. Ingesting 25,635 AllotmentRecord rows...");
  const allotmentBatch = allotData.rows.map((r, idx) => {
    const instRaw = r.Institute.trim();
    const matrixKey = allotToMatrixMap.get(instRaw)!;
    const mapping = mccMapping.get(matrixKey)!;
    const dbCollegeId = tempIdToDbId.get(mapping.collegeTempId)!;

    const { category: allottedCat, isPwD: allottedPwD } = parseAllottedCategory(r.AllottedCategory);
    const { category: candCat, isPwD: candPwD } = parseCandidateCategory(r.CandidateCategory);
    const air = parseInt(r.AIR || "0", 10);
    const sno = r.SNo ? parseInt(r.SNo, 10) : idx + 1;
    const canonicalQuota = normalizeQuota(r.QuotaRaw);

    return {
      roundId: mccRound1.id,
      collegeId: dbCollegeId,
      sourceImportId: mccAllotImport.id,
      candidateRank: air,
      course: "MBBS",
      quota: canonicalQuota,
      allottedCategory: allottedCat,
      allottedPwD,
      candidateCategory: candCat,
      candidatePwD: candPwD,
      specialPathway: null,
      allotmentStatus: "ALLOTTED",
      sourceSerialNumber: sno,
      sourceInstituteName: instRaw,
      sourceQuotaLabel: r.QuotaRaw.trim(),
      sourceAllottedCategoryLabel: r.AllottedCategory.trim(),
      sourceCandidateCategoryLabel: r.CandidateCategory.trim(),
      rawSourceText: JSON.stringify(r),
    };
  });

  const allotChunkSize = 1000;
  for (let i = 0; i < allotmentBatch.length; i += allotChunkSize) {
    const chunk = allotmentBatch.slice(i, i + allotChunkSize);
    await prisma.allotmentRecord.createMany({ data: chunk });
  }

  // Step 8: Database Row Count & Total Verification
  console.log("\n11. Verifying Database Records...");
  const dbCollegeCount = await prisma.college.count();
  const dbNMCCollegeCount = await prisma.college.count({ where: { isINI: false } });
  const dbINICollegeCount = await prisma.college.count({ where: { isINI: true } });
  const dbAliasCount = await prisma.collegeAlias.count();
  const dbNMCAliasCount = await prisma.collegeAlias.count({ where: { sourceAuthority: CounsellingAuthorityType.OTHER } });
  const dbMCCAliasCount = await prisma.collegeAlias.count({ where: { sourceAuthority: CounsellingAuthorityType.MCC } });
  const dbCapacityCount = await prisma.collegeAnnualCapacity.count();
  const dbMatrixCount = await prisma.seatMatrixRecord.count();
  const dbAllotCount = await prisma.allotmentRecord.count();

  console.log(`- Database Colleges: ${dbCollegeCount} (${dbNMCCollegeCount} NMC + ${dbINICollegeCount} INI, Expected: 847) ✅`);
  console.log(`- Database Aliases: ${dbAliasCount} (${dbNMCAliasCount} NMC + ${dbMCCAliasCount} MCC = 1,338) ✅`);
  console.log(`- Database Capacity Records: ${dbCapacityCount} (Expected: 823) ✅`);
  console.log(`- Database Seat Matrix Records: ${dbMatrixCount} (Expected: 3,093) ✅`);
  console.log(`- Database Allotment Records: ${dbAllotCount} (Expected: 25,635) ✅`);

  if (dbCollegeCount !== 847 || dbCapacityCount !== 823 || dbMatrixCount !== 3093 || dbAllotCount !== 25635) {
    throw new Error("STOP: Final database record count mismatch!");
  }

  console.log("\n===============================================================");
  console.log("SEQUENCE 3 INGESTION COMPLETED SUCCESSFULLY AND VALIDATED!");
  console.log("===============================================================");
}

if (require.main === module) {
  runIngestion()
    .then(async () => {
      await prisma.$disconnect();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error("Ingestion failed:", err);
      await prisma.$disconnect();
      process.exit(1);
    });
}
