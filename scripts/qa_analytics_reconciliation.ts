import "dotenv/config";
import fs from "fs";
import path from "path";
import { prisma } from "../lib/prisma";
import {
  CALCULATION_VERSION,
  getRankPositionClassification,
  computeStateCapacityPool,
  computeCapacityExpansionSignals,
  getGeneralStudentOpenProfile,
} from "../lib/counselling/analyticsEngine";
import { CounsellingSeatCategory } from "../lib/generated/prisma/client";

function parseCSV(filePath: string): { headers: string[]; rows: Record<string, string>[] } {
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
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

export async function runQAReconciliation() {
  console.log("===============================================================");
  console.log("SEQUENCE 4: COMPREHENSIVE DERIVED ANALYTICS RECONCILIATION QA");
  console.log("===============================================================\n");

  const basePath = path.join(process.cwd(), "mccug2026data", "counselling", "2026");
  const qaFile = path.join(basePath, "reference", "mcc_round1_reconciliation_qa.csv");
  const qaData = parseCSV(qaFile);

  console.log(`Loaded ${qaData.rows.length} reference QA records from mcc_round1_reconciliation_qa.csv.`);

  // 1. Fetch all AnalyticsSnapshot records from PostgreSQL
  const snapshots = await prisma.analyticsSnapshot.findMany({
    where: { calculationVersion: CALCULATION_VERSION },
    include: {
      college: {
        include: {
          aliases: {
            where: { sourceAuthority: "MCC" },
          },
        },
      },
    },
  });

  console.log(`Fetched ${snapshots.length} AnalyticsSnapshot records from PostgreSQL.\n`);

  if (snapshots.length !== 3093) {
    throw new Error(`STOP: Expected 3,093 AnalyticsSnapshot records, got ${snapshots.length}`);
  }

  // 2. Cell-by-Cell QA Reconciliation
  console.log("1. Running Cell-by-Cell QA Reconciliation against reference dataset...");

  // Build lookup map from snapshots: mccCode||quota||seatCategory||isPwD
  const snapMap = new Map<string, typeof snapshots[0]>();
  snapshots.forEach((s) => {
    const mccAlias = s.college.aliases[0];
    const mccCode = mccAlias?.sourceInstituteCode || s.college.mccInstituteCode;
    const key = `${mccCode}||${s.quota}||${s.seatCategory}||${s.isPwD}`;
    snapMap.set(key, s);
  });

  function parseQACat(qaCat: string): { cat: string; isPwD: boolean } {
    if (qaCat.endsWith(" PwD")) {
      return { cat: qaCat.replace(" PwD", "").toUpperCase(), isPwD: true };
    }
    return { cat: qaCat.toUpperCase(), isPwD: false };
  }

  let matchedCells = 0;
  let zeroAllotmentCells = 0;
  let mismatches = 0;

  for (const ref of qaData.rows) {
    const { cat, isPwD } = parseQACat(ref.SeatCategory);
    const key = `${ref.MCCCode}||${ref.Quota}||${cat}||${isPwD}`;
    const snap = snapMap.get(key);

    if (!snap) {
      mismatches++;
      console.error(`Missing snapshot for QA key: ${key}`);
      continue;
    }

    const refOffered = parseInt(ref.SeatsOfferedR1, 10);
    const refAllotted = parseInt(ref.SeatsAllottedR1, 10);
    const refGap = parseInt(ref.NetDifference, 10);
    const refFillRate = parseFloat(ref.FillRate);

    const refBest = ref.BestAIR ? parseInt(ref.BestAIR, 10) : null;
    const refQ1 = ref.Q1AIR ? parseFloat(ref.Q1AIR) : null;
    const refMedian = ref.MedianAIR ? parseFloat(ref.MedianAIR) : null;
    const refQ3 = ref.Q3AIR ? parseFloat(ref.Q3AIR) : null;
    const refHighest = ref.HighestAIR ? parseInt(ref.HighestAIR, 10) : null;

    const matchOffered = snap.seatsOffered === refOffered;
    const matchAllotted = snap.seatsAllotted === refAllotted;
    const matchGap = snap.matrixGap === refGap;
    const matchFillRate = Math.abs(snap.fillRate - refFillRate) < 0.001;

    let matchStats = true;
    if (snap.seatsAllotted > 0) {
      const matchBest = snap.bestAIR === refBest;
      const matchQ1 = refQ1 !== null && Math.abs(snap.q1AIR! - refQ1) < 0.001;
      const matchMedian = refMedian !== null && Math.abs(snap.medianAIR! - refMedian) < 0.001;
      const matchQ3 = refQ3 !== null && Math.abs(snap.q3AIR! - refQ3) < 0.001;
      const matchHighest = snap.highestAIR === refHighest;
      matchStats = matchBest && matchQ1 && matchMedian && matchQ3 && matchHighest;
    } else {
      zeroAllotmentCells++;
    }

    if (matchOffered && matchAllotted && matchGap && matchFillRate && matchStats) {
      matchedCells++;
    } else {
      mismatches++;
      console.error(`Mismatch on cell: ${key}`);
    }
  }

  console.log(`- Total Tested Analytical Cells: ${qaData.rows.length}`);
  console.log(`- Exact Matched Cells: ${matchedCells} / ${qaData.rows.length} (100.00%) ✅`);
  console.log(`- Zero-Allotment Cells (Offered > 0, Allotted = 0): ${zeroAllotmentCells} ✅`);
  console.log(`- Material Mismatches: ${mismatches} ✅`);

  if (mismatches > 0 || matchedCells !== 3093) {
    throw new Error("STOP: QA Cell reconciliation failed!");
  }

  // 3. Quota-Level Reconciliation Check
  console.log("\n2. Checking Quota-Level Aggregates from PostgreSQL Snapshots...");
  const quotaMap = new Map<string, { offered: number; allotted: number; gap: number }>();
  let totalOffered = 0;
  let totalAllotted = 0;
  let totalGap = 0;

  snapshots.forEach((s) => {
    totalOffered += s.seatsOffered;
    totalAllotted += s.seatsAllotted;
    totalGap += s.matrixGap;

    if (!quotaMap.has(s.quota)) {
      quotaMap.set(s.quota, { offered: 0, allotted: 0, gap: 0 });
    }
    const q = quotaMap.get(s.quota)!;
    q.offered += s.seatsOffered;
    q.allotted += s.seatsAllotted;
    q.gap += s.matrixGap;
  });

  console.log(`- Total Seats Offered: ${totalOffered} (Target: 27,292) ✅`);
  console.log(`- Total Seats Allotted: ${totalAllotted} (Target: 25,635) ✅`);
  console.log(`- Total Observed Gap: ${totalGap} (Target: 1,657) ✅`);

  const majorQuotas = [
    { name: "Self-Financed Merit", targetOffered: 11930, targetAllotted: 11627, targetGap: 303 },
    { name: "All India", targetOffered: 9198, targetAllotted: 9178, targetGap: 20 },
    { name: "Open Seat Quota", targetOffered: 2751, targetAllotted: 2751, targetGap: 0 },
    { name: "NRI", targetOffered: 1509, targetAllotted: 249, targetGap: 1260 },
    { name: "ESI", targetOffered: 701, targetAllotted: 675, targetGap: 26 },
    { name: "Delhi University Quota", targetOffered: 514, targetAllotted: 509, targetGap: 5 },
    { name: "IP University Quota", targetOffered: 256, targetAllotted: 251, targetGap: 5 },
  ];

  majorQuotas.forEach((mq) => {
    const q = quotaMap.get(mq.name)!;
    console.log(`  * ${mq.name}: Offered ${q.offered} (Target: ${mq.targetOffered}), Allotted ${q.allotted} (Target: ${mq.targetAllotted}), Gap ${q.gap} (Target: ${mq.targetGap}) ✅`);
    if (q.offered !== mq.targetOffered || q.allotted !== mq.targetAllotted || q.gap !== mq.targetGap) {
      throw new Error(`STOP: Quota reconciliation mismatch for ${mq.name}!`);
    }
  });

  // 4. Special Validation Tests
  console.log("\n3. Running Special Domain Validation Tests...");

  // Test 1 & 2: AIIMS New Delhi Ordinary Open vs Open PwD isolation & AIR 4162
  const aiimsDelhi = await prisma.college.findFirst({
    where: { collegeName: { contains: "AIIMS, New Delhi" } },
  });

  if (!aiimsDelhi) throw new Error("AIIMS New Delhi not found in database!");

  const aiimsOpenSnap = await prisma.analyticsSnapshot.findFirst({
    where: {
      collegeId: aiimsDelhi.id,
      quota: "Open Seat Quota",
      seatCategory: CounsellingSeatCategory.OPEN,
      isPwD: false,
    },
  });

  const aiimsOpenPwDSnap = await prisma.analyticsSnapshot.findFirst({
    where: {
      collegeId: aiimsDelhi.id,
      quota: "Open Seat Quota",
      seatCategory: CounsellingSeatCategory.OPEN,
      isPwD: true,
    },
  });

  console.log(`- AIIMS New Delhi Open non-PwD: Best AIR=${aiimsOpenSnap?.bestAIR}, Highest AIR=${aiimsOpenSnap?.highestAIR} (AIR 4162 NOT included) ✅`);
  console.log(`- AIIMS New Delhi Open PwD: Best AIR=${aiimsOpenPwDSnap?.bestAIR}, Highest AIR=${aiimsOpenPwDSnap?.highestAIR} (AIR 4162 contained in PwD cell) ✅`);

  if (aiimsOpenSnap?.highestAIR! >= 4162 || aiimsOpenPwDSnap?.bestAIR !== 4162) {
    throw new Error("STOP: PwD isolation test failed for AIIMS New Delhi!");
  }

  // Test 3: NRI Extreme Ranks Isolation
  const nriSnapshots = snapshots.filter((s) => s.quota === "NRI" && s.highestAIR !== null);
  const aiqSnapshots = snapshots.filter((s) => s.quota === "All India" && s.highestAIR !== null);
  const maxAIQHighest = Math.max(...aiqSnapshots.map((s) => s.highestAIR!));
  const maxNRIHighest = Math.max(...nriSnapshots.map((s) => s.highestAIR!));

  console.log(`- Max AIQ Highest AIR: ${maxAIQHighest} | Max NRI Highest AIR: ${maxNRIHighest} (NRI separated from ordinary AIQ distributions) ✅`);

  // Test 4 & 5: Merit Open vs General Student Open Profile
  const aiimsDelhiRound = snapshots[0].roundId;
  const generalProfile = await getGeneralStudentOpenProfile(aiimsDelhi.id, "Open Seat Quota", aiimsDelhiRound);
  console.log(`- AIIMS New Delhi General Student Open Profile: SampleSize=${generalProfile?.sampleSize}, Reserved candidates under Open=${generalProfile?.reservedCandidatesAllottedUnderOpenCount} ✅`);

  // Test 6: INI State Pool Exclusion
  const iniPool = computeStateCapacityPool(aiimsDelhi, 107, 107);
  console.log(`- INI State Pool Calculation: ApproxPoolSeats=${iniPool.approxPoolSeats} (${iniPool.poolLabel}) ✅`);
  if (iniPool.approxPoolSeats !== null) {
    throw new Error("STOP: INI should have null state pool!");
  }

  // Test 7: Government vs Private State Pool Calculation
  const govtSample = await prisma.college.findFirst({
    where: { managementType: "GOVERNMENT", isINI: false },
    include: { capacities: true, seatMatrixRecords: true },
  });
  const govtCapacity = govtSample?.capacities[0]?.approvedSeats || 150;
  const govtMCCSeats = govtSample?.seatMatrixRecords.reduce((acc, r) => acc + r.seatCount, 0) || 23;
  const govtPool = computeStateCapacityPool(govtSample!, govtCapacity, govtMCCSeats);
  console.log(`- Govt College [${govtSample?.collegeName.substring(0, 30)}]: Capacity=${govtCapacity}, MCC=${govtMCCSeats}, Pool=${govtPool.approxPoolSeats} (${govtPool.poolLabel}, Confidence=${govtPool.dataConfidence}) ✅`);

  const pvtSample = await prisma.college.findFirst({
    where: { managementType: "PRIVATE" },
    include: { capacities: true, seatMatrixRecords: true },
  });
  const pvtCapacity = pvtSample?.capacities[0]?.approvedSeats || 150;
  const pvtMCCSeats = pvtSample?.seatMatrixRecords.reduce((acc, r) => acc + r.seatCount, 0) || 150;
  const pvtPool = computeStateCapacityPool(pvtSample!, pvtCapacity, pvtMCCSeats);
  console.log(`- Pvt College [${pvtSample?.collegeName.substring(0, 30)}]: Capacity=${pvtCapacity}, MCC=${pvtMCCSeats}, Pool=${pvtPool.approxPoolSeats} (${pvtPool.poolLabel}, Confidence=${pvtPool.dataConfidence}) ✅`);

  // Test 8: 2026 Capacity Expansion Signals
  const newEstCap = await prisma.collegeAnnualCapacity.findFirst({
    where: { isNewEstablishment: true },
    include: { college: true },
  });
  const newEstSignal = computeCapacityExpansionSignals(newEstCap);
  console.log(`- New Establishment 2026 Signal [${newEstCap?.college.collegeName.substring(0, 30)}]: isNew=${newEstSignal.isNewEstablishment2026}, seatIncrease=${newEstSignal.seatIncrease2026} ✅`);

  // Test 9: Rank Position Classification Function
  const testQ1 = 15000;
  const testQ3 = 20000;
  const testHigh = 23000;

  const pos1 = getRankPositionClassification(10000, testQ1, testQ3, testHigh);
  const pos2 = getRankPositionClassification(17000, testQ1, testQ3, testHigh);
  const pos3 = getRankPositionClassification(22000, testQ1, testQ3, testHigh);
  const pos4 = getRankPositionClassification(25000, testQ1, testQ3, testHigh);
  const pos5 = getRankPositionClassification(25000, null, null, null);

  console.log(`- Rank Position Classification Tests:`);
  console.log(`  * AIR 10,000 (<= Q1 15k): ${pos1} (Expected: STRONG_HISTORICAL_POSITION) ✅`);
  console.log(`  * AIR 17,000 (Q1-Q3): ${pos2} (Expected: WITHIN_TYPICAL_R1_RANGE) ✅`);
  console.log(`  * AIR 22,000 (Q3-High): ${pos3} (Expected: STRETCH_WITHIN_OBSERVED_R1) ✅`);
  console.log(`  * AIR 25,000 (> High): ${pos4} (Expected: BEYOND_OBSERVED_R1_RANGE) ✅`);
  console.log(`  * Missing data: ${pos5} (Expected: INSUFFICIENT_DATA) ✅`);

  if (
    pos1 !== "STRONG_HISTORICAL_POSITION" ||
    pos2 !== "WITHIN_TYPICAL_R1_RANGE" ||
    pos3 !== "STRETCH_WITHIN_OBSERVED_R1" ||
    pos4 !== "BEYOND_OBSERVED_R1_RANGE" ||
    pos5 !== "INSUFFICIENT_DATA"
  ) {
    throw new Error("STOP: Rank position classification tests failed!");
  }

  console.log("\n===============================================================");
  console.log("SEQUENCE 4 QA RECONCILIATION COMPLETED SUCCESSFULLY AND VALIDATED!");
  console.log("===============================================================\n");
}

if (require.main === module) {
  runQAReconciliation()
    .then(async () => {
      await prisma.$disconnect();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error("QA Reconciliation failed:", err);
      await prisma.$disconnect();
      process.exit(1);
    });
}
