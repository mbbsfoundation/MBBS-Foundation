import * as fs from "fs";
import * as path from "path";

export interface NirfRecord {
  nirfInstitutionId: string;
  nirfInstitutionName: string;
  city: string;
  state: string;
  nirf2025Score: number | null;
  nirf2025Rank: number;
  sourceAuthority: string;
  sourceYear: number;
  sourceCategory: string;
  sourceURL: string;
}

const htmlPath = "/Users/lokeshtiwari/.gemini/antigravity-ide/brain/0a2e84e6-a4ca-48f8-8a09-da3570fd2a5d/.system_generated/steps/4538/content.md";
const html = fs.readFileSync(htmlPath, "utf-8");

const rowPattern = /<td>\s*(IR-[A-Za-z0-9\-]+)\s*<\/td>[\s\S]*?<td>\s*([\s\S]*?)<div[\s\S]*?<\/div>\s*<\/td>\s*<td>\s*([^<]+?)\s*<\/td>\s*<td>\s*([^<]+?)\s*<\/td>\s*<td>\s*([^<]+?)\s*<\/td>\s*<td>\s*([^<]+?)\s*<\/td>/gi;

const records: NirfRecord[] = [];
let match: RegExpExecArray | null;

while ((match = rowPattern.exec(html)) !== null) {
  const instId = match[1].trim();
  let rawName = match[2].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
  const city = match[3].trim();
  const state = match[4].trim();
  const scoreStr = match[5].trim();
  const rankStr = match[6].trim();

  const score = parseFloat(scoreStr);
  const rank = parseInt(rankStr, 10);

  if (!isNaN(rank)) {
    records.push({
      nirfInstitutionId: instId,
      nirfInstitutionName: rawName,
      city,
      state,
      nirf2025Score: isNaN(score) ? null : score,
      nirf2025Rank: rank,
      sourceAuthority: "NIRF",
      sourceYear: 2025,
      sourceCategory: "Medical",
      sourceURL: "https://www.nirfindia.org/Rankings/2025/MedicalRanking.html",
    });
  }
}

console.log(`Total NIRF Medical 2025 records parsed: ${records.length}`);

// Verification checklist as explicitly demanded by Prompt Section 12
const verificationList: { instId: string; expectedName: string; expectedRank: number; label: string }[] = [
  { instId: "IR-D-N-15", expectedName: "All India Institute of Medical Sciences, Delhi", expectedRank: 1, label: "AIIMS New Delhi — NIRF #1" },
  { instId: "IR-D-C-45654", expectedName: "Christian Medical College", expectedRank: 3, label: "Christian Medical College Vellore — #3" },
  { instId: "IR-D-U-0368", expectedName: "Jawaharlal Institute of Post Graduate Medical Education & Research", expectedRank: 4, label: "JIPMER Puducherry — #4" },
  { instId: "IR-D-U-0500", expectedName: "Banaras Hindu University", expectedRank: 6, label: "Institute of Medical Sciences, BHU — #6" },
  { instId: "IR-D-U-0523", expectedName: "King George`s Medical University", expectedRank: 8, label: "KGMU Lucknow — #8" },
  { instId: "IR-D-C-7242", expectedName: "Kasturba Medical College, Manipal", expectedRank: 10, label: "Kasturba Medical College Manipal — #10" },
  { instId: "IR-D-U-0691", expectedName: "All India Institute of Medical Sciences Rishikesh", expectedRank: 13, label: "AIIMS Rishikesh — #13" },
  { instId: "IR-D-C-49008", expectedName: "Madras Medical College & Government General Hospital, Chennai", expectedRank: 16, label: "Madras Medical College — #16" },
  { instId: "IR-D-U-0689", expectedName: "All India Institute of Medical Sciences Jodhpur", expectedRank: 19, label: "AIIMS Jodhpur — #19" },
  { instId: "IR-D-C-32922", expectedName: "Vardhman Mahavir Medical College & Safdarjung Hospital", expectedRank: 22, label: "VMMC & Safdarjung — #22" },
  { instId: "IR-D-U-0687", expectedName: "All India Institute of Medical Sciences Bhopal", expectedRank: 25, label: "AIIMS Bhopal — #25" },
  { instId: "IR-D-C-6414", expectedName: "Maulana Azad Medical College", expectedRank: 26, label: "MAMC Delhi — #26" },
  { instId: "IR-D-I-1409", expectedName: "University College of Medical Sciences", expectedRank: 38, label: "UCMS Delhi — #38" },
  { instId: "IR-D-N-17", expectedName: "Sawai Man Singh Medical College", expectedRank: 39, label: "SMS Medical College Jaipur — #39" },
];

console.log("\n--- SECTION 12 NIRF EXTRACTION VERIFICATION ---");
let allMatched = true;
for (const v of verificationList) {
  const found = records.find(r => r.nirfInstitutionId === v.instId);
  if (!found) {
    console.error(`❌ NOT FOUND by ID: ${v.label} (ID: ${v.instId})`);
    allMatched = false;
  } else if (found.nirf2025Rank !== v.expectedRank) {
    console.error(`❌ RANK MISMATCH for ${v.label}: Expected #${v.expectedRank}, found #${found.nirf2025Rank} ('${found.nirfInstitutionName}')`);
    allMatched = false;
  } else {
    console.log(`✅ VERIFIED: ${v.label} -> NIRF 2025 Rank #${found.nirf2025Rank} (${found.nirfInstitutionName}, ${found.city}, ${found.state}, Score: ${found.nirf2025Score})`);
  }
}

if (!allMatched) {
  console.error("Stopping due to NIRF verification mismatch!");
  process.exit(1);
}

// Write to reference CSV
const refDir = path.join(process.cwd(), "mccug2026data/counselling/2026/reference");
fs.mkdirSync(refDir, { recursive: true });
const csvPath = path.join(refDir, "nirf_medical_2025.csv");

const header = "nirfInstitutionId,nirfInstitutionName,city,state,nirf2025Score,nirf2025Rank,sourceAuthority,sourceYear,sourceCategory,sourceURL\n";
const rows = records.map(r => {
  const nameEscaped = `"${r.nirfInstitutionName.replace(/"/g, '""')}"`;
  const cityEscaped = `"${r.city.replace(/"/g, '""')}"`;
  const stateEscaped = `"${r.state.replace(/"/g, '""')}"`;
  return `${r.nirfInstitutionId},${nameEscaped},${cityEscaped},${stateEscaped},${r.nirf2025Score ?? ""},${r.nirf2025Rank},${r.sourceAuthority},${r.sourceYear},${r.sourceCategory},"${r.sourceURL}"`;
}).join("\n");

fs.writeFileSync(csvPath, header + rows, "utf-8");
console.log(`\nSuccessfully saved frozen reference dataset (${records.length} records) to: ${csvPath}`);
