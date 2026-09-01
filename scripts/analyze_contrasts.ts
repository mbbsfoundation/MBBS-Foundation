import "dotenv/config";
import * as fs from "fs";
import * as path from "path";

interface CompRow {
  choiceIndexRank: number;
  collegeId: string;
  slug: string;
  collegeName: string;
  shortName: string;
  city: string;
  state: string;
  managementType: string;
  instituteType: string;
  primaryQuota: string;
  primaryCategory: string;
  bestAIR: number | null;
  medianAIR: number;
  lastObservedAIR: number | null;
  allotmentCount: number;
  totalMBBSSeats2026: number;
  mccR1SeatsOffered: number;
  mccR1SeatsAllotted: number;
  nirf2025Rank: number | null;
  nirf2025Score: number | null;
  nirfInstitutionName: string | null;
  nirfMatchStatus: string;
  rankDifference: number | null;
  sampleFlag: string;
}

const csvPath = path.join(process.cwd(), "mccug2026data/counselling/2026/derived/neet_choice_index_nirf_comparison_2026.csv");
const raw = fs.readFileSync(csvPath, "utf-8");
const lines = raw.trim().split("\n").slice(1);

const records: CompRow[] = lines.map(line => {
  const matches = line.match(/(?:^|,)("(?:[^"]|"")*"|[^,]*)/g);
  const cols = matches!.map(m => {
    let v = m.startsWith(",") ? m.slice(1) : m;
    if (v.startsWith('"') && v.endsWith('"')) {
      v = v.slice(1, -1).replace(/""/g, '"');
    }
    return v.trim();
  });

  return {
    choiceIndexRank: parseInt(cols[0], 10),
    collegeId: cols[1],
    slug: cols[2],
    collegeName: cols[3],
    shortName: cols[4],
    city: cols[5],
    state: cols[6],
    managementType: cols[7],
    instituteType: cols[8],
    primaryQuota: cols[9],
    primaryCategory: cols[10],
    bestAIR: cols[11] ? parseInt(cols[11], 10) : null,
    medianAIR: parseFloat(cols[12]),
    lastObservedAIR: cols[13] ? parseInt(cols[13], 10) : null,
    allotmentCount: parseInt(cols[14], 10),
    totalMBBSSeats2026: parseInt(cols[15], 10),
    mccR1SeatsOffered: parseInt(cols[16], 10),
    mccR1SeatsAllotted: parseInt(cols[17], 10),
    nirf2025Rank: cols[18] ? parseInt(cols[18], 10) : null,
    nirf2025Score: cols[19] ? parseFloat(cols[19]) : null,
    nirfInstitutionName: cols[20] || null,
    nirfMatchStatus: cols[21],
    rankDifference: cols[22] ? parseInt(cols[22], 10) : null,
    sampleFlag: cols[23],
  };
});

console.log("==================================================================");
console.log("SECTION 24: GOVERNMENT VS PRIVATE/DEEMED SUBSET QA");
console.log("==================================================================");

const govtSubset = records.filter(r => r.managementType === "GOVERNMENT" || r.instituteType === "INI" || r.instituteType === "CENTRAL" || r.instituteType === "ESIC");
const privateSubset = records.filter(r => r.managementType === "PRIVATE" || r.instituteType === "DEEMED");

console.log(`Government / Central / INI / ESIC: ${govtSubset.length} colleges`);
console.log(`Private / Deemed: ${privateSubset.length} colleges`);

console.log("\nTop 5 Private / Deemed by Choice Index:");
privateSubset.slice(0, 10).forEach(r => {
  console.log(`  Choice Rank #${r.choiceIndexRank} | ${r.collegeName} (${r.state}) | Median AIR: ${r.medianAIR} | Quota: ${r.primaryQuota} | NIRF: ${r.nirf2025Rank ? "#" + r.nirf2025Rank : "Unranked"}`);
});

console.log("\n==================================================================");
console.log("SECTION 25 & 26: HIGH-INTEREST CONTRASTS");
console.log("==================================================================");

const matched = records.filter(r => r.nirf2025Rank !== null);

// 1. Broad Agreement (|rankDifference| <= 5)
console.log("\n[A. BROAD AGREEMENT]");
matched.filter(r => Math.abs(r.rankDifference!) <= 5).forEach(r => {
  console.log(`  ${r.collegeName} -> Choice #${r.choiceIndexRank} vs NIRF #${r.nirf2025Rank} (Diff: ${r.rankDifference}) | Median AIR: ${r.medianAIR}`);
});

// 2. Higher in NEET Choice Index (rankDifference > 10)
console.log("\n[B. HIGHER IN NEET CHOICE INDEX (Allotments higher than NIRF rank)]");
matched.filter(r => r.rankDifference! > 10).sort((a,b) => b.rankDifference! - a.rankDifference!).slice(0, 10).forEach(r => {
  console.log(`  ${r.collegeName} -> Choice #${r.choiceIndexRank} vs NIRF #${r.nirf2025Rank} (Diff: +${r.rankDifference}) | Median AIR: ${r.medianAIR}`);
});

// 3. Higher in NIRF (rankDifference < -10)
console.log("\n[C. HIGHER IN NIRF (NIRF ranking higher than Choice Index)]");
matched.filter(r => r.rankDifference! < -10).sort((a,b) => a.rankDifference! - b.rankDifference!).slice(0, 10).forEach(r => {
  console.log(`  ${r.collegeName} -> Choice #${r.choiceIndexRank} vs NIRF #${r.nirf2025Rank} (Diff: ${r.rankDifference}) | Median AIR: ${r.medianAIR}`);
});

// 4. Strong Choice Index / Unranked in NIRF (Top 30 Choice Index with no NIRF rank)
console.log("\n[D. HIGH CHOICE INDEX / UNRANKED IN NIRF 2025]");
records.filter(r => r.choiceIndexRank <= 30 && r.nirf2025Rank === null).forEach(r => {
  console.log(`  Choice #${r.choiceIndexRank} | ${r.collegeName} (${r.state}) | Median AIR: ${r.medianAIR} | Quota: ${r.primaryQuota}`);
});
