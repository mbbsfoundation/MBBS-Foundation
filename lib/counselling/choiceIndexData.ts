import * as fs from "fs";
import * as path from "path";

export interface ChoiceIndexItem {
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
  sampleFlag: "SMALL_SAMPLE" | "NORMAL";
}

let cachedDataset: ChoiceIndexItem[] | null = null;

export function getChoiceIndexDataset(): ChoiceIndexItem[] {
  if (cachedDataset) return cachedDataset;

  const csvPath = path.join(
    process.cwd(),
    "mccug2026data/counselling/2026/derived/neet_choice_index_nirf_comparison_2026.csv"
  );

  if (!fs.existsSync(csvPath)) {
    console.error(`Choice index CSV file not found at ${csvPath}`);
    return [];
  }

  const raw = fs.readFileSync(csvPath, "utf-8");
  const lines = raw.trim().split("\n").slice(1);

  const items: ChoiceIndexItem[] = lines.map((line) => {
    const matches = line.match(/(?:^|,)("(?:[^"]|"")*"|[^,]*)/g);
    const cols = (matches || []).map((m) => {
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
      shortName: cols[4] || "",
      city: cols[5] || "",
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
      sampleFlag: cols[23] === "SMALL_SAMPLE" ? "SMALL_SAMPLE" : "NORMAL",
    };
  });

  cachedDataset = items;
  return items;
}

export function getChoiceIndexTop25(): ChoiceIndexItem[] {
  return getChoiceIndexDataset().slice(0, 25);
}

export function getHeadlineContrasts(): ChoiceIndexItem[] {
  const all = getChoiceIndexDataset();
  // 6 specific curated contrast colleges from 9J.1
  const contrastSlugs = [
    "maulana-azad-medical-college-new-delhi",
    "vardhman-mahavir-medical-college-and-safdarjung-hospital-delhi",
    "university-college-of-medical-sciences-and-gtb-hospital-new-delhi",
    "sms-medical-college-jaipur",
    "institute-of-medical-sciences-bhu-varansi",
    "king-george-medical-university-lucknow",
  ];

  return contrastSlugs
    .map((slug) => all.find((item) => item.slug === slug))
    .filter((item): item is ChoiceIndexItem => item !== undefined);
}
