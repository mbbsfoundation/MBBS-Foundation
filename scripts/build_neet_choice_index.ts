import "dotenv/config";
import * as fs from "fs";
import * as path from "path";
import { prisma } from "../lib/prisma";
import { CounsellingManagementType, CounsellingSeatCategory } from "../lib/generated/prisma/client";
import { getPrimaryOpenBenchmark, sortCategoryProfiles } from "../lib/counselling/pathwayOrdering";
import { getMccRound1Context } from "../lib/counselling/evidenceService";
import type { CollegeRound1CategoryProfile } from "../lib/counselling/evidenceTypes";

interface NirfEntry {
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

function parseNirfCsv(): NirfEntry[] {
  const csvPath = path.join(process.cwd(), "mccug2026data/counselling/2026/reference/nirf_medical_2025.csv");
  const raw = fs.readFileSync(csvPath, "utf-8");
  const lines = raw.trim().split("\n").slice(1);
  const list: NirfEntry[] = [];
  for (const line of lines) {
    if (!line.trim()) continue;
    // Simple CSV parser supporting quotes
    const regex = /(".*?"|[^",\s]+)(?=\s*,|\s*$)/g;
    const matches = line.match(/(?:^|,)("(?:[^"]|"")*"|[^,]*)/g);
    if (!matches) continue;
    const cols = matches.map(m => {
      let v = m.startsWith(",") ? m.slice(1) : m;
      if (v.startsWith('"') && v.endsWith('"')) {
        v = v.slice(1, -1).replace(/""/g, '"');
      }
      return v.trim();
    });

    list.push({
      nirfInstitutionId: cols[0],
      nirfInstitutionName: cols[1],
      city: cols[2],
      state: cols[3],
      nirf2025Score: cols[4] ? parseFloat(cols[4]) : null,
      nirf2025Rank: parseInt(cols[5], 10),
      sourceAuthority: cols[6],
      sourceYear: parseInt(cols[7], 10),
      sourceCategory: cols[8],
      sourceURL: cols[9],
    });
  }
  return list;
}

async function run() {
  console.log("==================================================================");
  console.log("SEQUENCE 9J.1: NEET CHOICE INDEX 2026 + NIRF 2025 COMPARISON BUILDER");
  console.log("==================================================================");

  // 1. Fetch Round 1 context
  const round1 = await getMccRound1Context();

  if (!round1) {
    console.error("MCC 2026 Round 1 not found");
    process.exit(1);
  }

  // 2. Fetch all active colleges with capacities, seat matrices, allotments, and analytics snapshots
  const allColleges = await prisma.college.findMany({
    where: { isActive: true },
    include: {
      capacities: { where: { academicYear: 2026 } },
      seatMatrixRecords: { where: { roundId: round1.id } },
      allotmentRecords: { where: { roundId: round1.id, course: "MBBS" } },
      analyticsSnapshots: { where: { roundId: round1.id } },
      aliases: true,
    },
  });

  console.log(`Total colleges evaluated in database: ${allColleges.length}`);

  // 3. Process each college's evidence
  interface EvaluatedCollege {
    collegeId: string;
    slug: string;
    collegeName: string;
    shortName: string | null;
    city: string | null;
    state: string;
    managementType: CounsellingManagementType;
    instituteType: string;
    totalMBBSSeats2026: number;
    mccR1SeatsOffered: number;
    mccR1SeatsAllotted: number;
    primaryBenchmark: CollegeRound1CategoryProfile | null;
    allCategoryProfiles: CollegeRound1CategoryProfile[];
    isINI: boolean;
    isDeemed: boolean;
    isCentralUniversity: boolean;
    isESIC: boolean;
    aliases: string[];
  }

  const evaluated: EvaluatedCollege[] = allColleges.map((col) => {
    const nmcCap = col.capacities[0]?.approvedSeats ?? 0;
    const mccOffered = col.seatMatrixRecords.reduce((acc, m) => acc + m.seatCount, 0);
    const mccAllotted = col.allotmentRecords.length;
    const totalMBBSSeats2026 = col.isINI && nmcCap === 0 ? mccOffered : nmcCap;

    const allCategoryProfiles: CollegeRound1CategoryProfile[] = col.analyticsSnapshots.map((s) => ({
      quota: s.quota,
      seatCategory: s.seatCategory,
      isPwD: s.isPwD,
      medianAIR: s.medianAIR,
      highestAIR: s.highestAIR,
      bestAIR: s.bestAIR,
      sampleSize: s.sampleSize,
      seatsOffered: s.seatsOffered,
      seatsAllotted: s.seatsAllotted,
      matrixGap: s.matrixGap,
      specialPathway: s.specialPathway,
    }));

    const primaryBenchmark = getPrimaryOpenBenchmark(allCategoryProfiles);

    let instituteType = col.managementType.toString();
    if (col.isINI) instituteType = "INI";
    else if (col.isDeemed) instituteType = "DEEMED";
    else if (col.isCentralUniversity) instituteType = "CENTRAL";
    else if (col.isESIC) instituteType = "ESIC";

    return {
      collegeId: col.id,
      slug: col.slug,
      collegeName: col.collegeName,
      shortName: col.shortName,
      city: col.city,
      state: col.state,
      managementType: col.managementType,
      instituteType,
      totalMBBSSeats2026,
      mccR1SeatsOffered: mccOffered,
      mccR1SeatsAllotted: mccAllotted,
      primaryBenchmark,
      allCategoryProfiles,
      isINI: col.isINI,
      isDeemed: col.isDeemed,
      isCentralUniversity: col.isCentralUniversity,
      isESIC: col.isESIC,
      aliases: col.aliases.map((a) => a.sourceName),
    };
  });

  // Filter for colleges with valid primary ordinary OPEN benchmark and valid medianAIR
  const eligibleColleges = evaluated.filter(
    (c) => c.primaryBenchmark !== null && c.primaryBenchmark.medianAIR !== null && c.primaryBenchmark.medianAIR !== undefined
  );

  const notRankedColleges = evaluated.filter(
    (c) => c.primaryBenchmark === null || c.primaryBenchmark.medianAIR === null || c.primaryBenchmark.medianAIR === undefined
  );

  console.log(`Colleges with valid primary ordinary OPEN benchmark: ${eligibleColleges.length}`);
  console.log(`Colleges NOT RANKED (insufficient comparable MCC Round-1 evidence): ${notRankedColleges.length}`);

  // Sort eligible colleges according to Section 4:
  // 1. lower Median AIR
  // 2. lower Best AIR
  // 3. lower Last Observed AIR (highestAIR)
  // 4. larger allotment count n (sampleSize / seatsAllotted)
  // 5. stable canonical College.id
  eligibleColleges.sort((a, b) => {
    const benchA = a.primaryBenchmark!;
    const benchB = b.primaryBenchmark!;

    const medA = benchA.medianAIR ?? Infinity;
    const medB = benchB.medianAIR ?? Infinity;
    if (medA !== medB) return medA - medB;

    const bestA = benchA.bestAIR ?? Infinity;
    const bestB = benchB.bestAIR ?? Infinity;
    if (bestA !== bestB) return bestA - bestB;

    const lastA = benchA.highestAIR ?? Infinity;
    const lastB = benchB.highestAIR ?? Infinity;
    if (lastA !== lastB) return lastA - lastB;

    const countA = benchA.sampleSize ?? benchA.seatsAllotted ?? 0;
    const countB = benchB.sampleSize ?? benchB.seatsAllotted ?? 0;
    if (countA !== countB) return countB - countA; // larger count first

    return a.collegeId.localeCompare(b.collegeId);
  });

  // Load NIRF 2025 official dataset
  const nirfRecords = parseNirfCsv();
  console.log(`NIRF 2025 records loaded: ${nirfRecords.length}`);

  // Matching NIRF records to canonical College records
  // Known non-comparable NIRF medical institutions (PG-only, research institutes, specialized non-NEET-UG destinations)
  const nonComparableNirfInstitutes = [
    "IR-D-U-0079", // PGIMER Chandigarh
    "IR-D-N-33",   // SGPGIMS Lucknow
    "IR-D-U-0236", // NIMHANS Bengaluru
    "IR-D-U-0266", // Sree Chitra Tirunal Institute Thiruvananthapuram
    "IR-D-C-16428", // IPGMER Kolkata (PG-focused in NIRF, though operates state UG under WBMC / R1) -> let's check if in MCC R1
    "IR-D-U-0106", // ILBS Delhi (Institute of Liver and Biliary Sciences - PG only)
    "IR-D-C-5838",  // Gujarat Cancer & Research Institute (PG only)
  ];

  // Map of manual / verified mappings between NIRF Institute ID -> canonical slug/name
  const verifiedNirfMappings: Record<string, { slug: string; matchStatus: "EXACT" | "VERIFIED_ALIAS" | "MANUAL_VERIFIED" | "NON_COMPARABLE" }> = {
    "IR-D-N-15": { slug: "aiims-delhi", matchStatus: "EXACT" }, // AIIMS New Delhi
    "IR-D-U-0079": { slug: "", matchStatus: "NON_COMPARABLE" }, // PGIMER Chandigarh
    "IR-D-C-45654": { slug: "christian-medical-college-vellore", matchStatus: "EXACT" }, // CMC Vellore
    "IR-D-U-0368": { slug: "jipmer-puducherry", matchStatus: "VERIFIED_ALIAS" }, // JIPMER Puducherry
    "IR-D-N-33": { slug: "", matchStatus: "NON_COMPARABLE" }, // SGPGIMS Lucknow
    "IR-D-U-0500": { slug: "institute-of-medical-sciences-bhu-varansi", matchStatus: "VERIFIED_ALIAS" }, // Banaras Hindu University / IMS BHU
    "IR-D-U-0236": { slug: "", matchStatus: "NON_COMPARABLE" }, // NIMHANS Bengaluru
    "IR-D-U-0523": { slug: "king-george-medical-university-lucknow", matchStatus: "VERIFIED_ALIAS" }, // KGMU Lucknow
    "IR-D-U-0436": { slug: "amrita-school-of-medicine-elamkara-kochi", matchStatus: "VERIFIED_ALIAS" }, // Amrita School of Medicine Kochi
    "IR-D-C-7242": { slug: "kasturba-medical-college-manipal", matchStatus: "EXACT" }, // KMC Manipal
    "IR-D-I-1441": { slug: "saveetha-medical-college-and-hospital-kanchipuram", matchStatus: "VERIFIED_ALIAS" }, // Saveetha Institute
    "IR-D-I-1110": { slug: "dr-d-y-patil-medical-college-hospital-and-research-centre-pimpri-pune", matchStatus: "VERIFIED_ALIAS" }, // Dr D.Y. Patil Vidyapeeth Pune
    "IR-D-U-0691": { slug: "aiims-uttarakhand", matchStatus: "VERIFIED_ALIAS" }, // AIIMS Rishikesh
    "IR-D-U-0688": { slug: "aiims-odisha", matchStatus: "VERIFIED_ALIAS" }, // AIIMS Bhubaneswar
    "IR-D-U-0363": { slug: "institute-of-medical-sciences-and-sum-hospital-bhubaneswar", matchStatus: "VERIFIED_ALIAS" }, // Siksha 'O' Anusandhan / IMS & SUM Hospital
    "IR-D-C-49008": { slug: "madras-medical-college-chennai", matchStatus: "VERIFIED_ALIAS" }, // Madras Medical College
    "IR-D-U-0266": { slug: "", matchStatus: "NON_COMPARABLE" }, // Sree Chitra Tirunal
    "IR-D-U-0473": { slug: "srm-medical-college-hospital-and-research-centre-kancheepuram", matchStatus: "VERIFIED_ALIAS" }, // SRM Institute
    "IR-D-U-0689": { slug: "aiims-rajasthan", matchStatus: "VERIFIED_ALIAS" }, // AIIMS Jodhpur
    "IR-D-U-0295": { slug: "jawaharlal-nehru-medical-college-sawangi-meghe-wardha", matchStatus: "VERIFIED_ALIAS" }, // Datta Meghe / JNMC Wardha
    "IR-D-I-1486": { slug: "sri-ramachandra-medical-college-and-research-institute-chennai", matchStatus: "VERIFIED_ALIAS" }, // Sri Ramachandra
    "IR-D-C-32922": { slug: "vardhman-mahavir-medical-college-and-safdarjung-hospital-delhi", matchStatus: "EXACT" }, // VMMC & Safdarjung
    "IR-D-C-16428": { slug: "institute-of-postgraduate-medical-education-and-research-kolkata", matchStatus: "EXACT" }, // IPGMER Kolkata
    "IR-D-U-0356": { slug: "kalinga-institute-of-medical-sciences-bhubaneswar", matchStatus: "VERIFIED_ALIAS" }, // KIIT / KIMS Bhubaneswar
    "IR-D-U-0687": { slug: "aiims-bhopal", matchStatus: "VERIFIED_ALIAS" }, // AIIMS Bhopal
    "IR-D-C-6414": { slug: "maulana-azad-medical-college-new-delhi", matchStatus: "EXACT" }, // MAMC Delhi
    "IR-D-U-0686": { slug: "aiims", matchStatus: "VERIFIED_ALIAS" }, // AIIMS Patna
    "IR-D-U-0106": { slug: "", matchStatus: "NON_COMPARABLE" }, // ILBS Delhi (PG only)
    "IR-D-U-0496": { slug: "jawaharlal-nehru-medical-college-aligarh", matchStatus: "VERIFIED_ALIAS" }, // AMU / JNMC Aligarh
    "IR-D-C-40453": { slug: "st-johns-medical-college-bangalore", matchStatus: "EXACT" }, // St. John's Bangalore
    "IR-D-U-0690": { slug: "aiims-chhattisgarh", matchStatus: "VERIFIED_ALIAS" }, // AIIMS Raipur
    "IR-D-C-22461": { slug: "lady-hardinge-medical-college-new-delhi", matchStatus: "EXACT" }, // Lady Hardinge
    "IR-D-U-0168": { slug: "maharishi-markandeshwar-institute-of-medical-sciences-and-research-mullana-ambal", matchStatus: "VERIFIED_ALIAS" }, // Maharishi Markandeshwar Ambala
    "IR-D-C-29442": { slug: "government-medical-college-chandigarh", matchStatus: "VERIFIED_ALIAS" }, // GMCH Chandigarh
    "IR-D-C-7251": { slug: "kasturba-medical-college-mangalore", matchStatus: "EXACT" }, // KMC Mangalore
    "IR-D-C-29255": { slug: "dayanand-medical-college-and-hospital-ludhiana", matchStatus: "VERIFIED_ALIAS" }, // Dayanand Medical College Ludhiana
    "IR-D-C-35009": { slug: "jss-medical-college-mysore", matchStatus: "EXACT" }, // JSS Medical College Mysore
    "IR-D-I-1409": { slug: "university-college-of-medical-sciences-and-gtb-hospital-new-delhi", matchStatus: "VERIFIED_ALIAS" }, // UCMS Delhi
    "IR-D-N-17": { slug: "sms-medical-college-jaipur", matchStatus: "VERIFIED_ALIAS" }, // SMS Jaipur
    "IR-D-U-0107": { slug: "hamdard-institute-of-medical-sciences-and-research-new-delhi", matchStatus: "VERIFIED_ALIAS" }, // Jamia Hamdard / HIMSR
    "IR-D-C-16424": { slug: "govt-medical-college-kolkata", matchStatus: "VERIFIED_ALIAS" }, // Medical College Kolkata
    "IR-D-C-47762": { slug: "mahatma-gandhi-medical-college-and-research-institute-pondicherry", matchStatus: "VERIFIED_ALIAS" }, // MGMCRI Puducherry
    "IR-D-C-45515": { slug: "psg-institute-of-medical-sciences-coimbatore", matchStatus: "EXACT" }, // PSG IMS Coimbatore
    "IR-D-C-5838": { slug: "", matchStatus: "NON_COMPARABLE" }, // Gujarat Cancer & Research Institute (Super-specialty Oncology/PG Only)
    "IR-D-C-6051": { slug: "b-j-medical-college-ahmedabad", matchStatus: "VERIFIED_ALIAS" }, // BJ Medical College Ahmedabad
    "IR-D-C-24503": { slug: "jawaharlal-nehru-medical-college-belgaum", matchStatus: "EXACT" }, // JNMC Belagavi
    "IR-D-C-29209": { slug: "christian-medical-college-ludhiana", matchStatus: "VERIFIED_ALIAS" }, // CMC Ludhiana
    "IR-D-C-30588": { slug: "osmania-medical-college-hyderabad", matchStatus: "EXACT" }, // Osmania Medical College
    "IR-D-U-0451": { slug: "chettinad-hospital-and-research-institute-kanchipuram", matchStatus: "VERIFIED_ALIAS" }, // Chettinad Academy
    "IR-D-C-40345": { slug: "m-s-ramaiah-medical-college-bangalore", matchStatus: "VERIFIED_ALIAS" }, // MS Ramaiah Medical College
  };

  // Build reverse lookup from slug -> NirfEntry
  const slugToNirf: Record<string, { nirf: NirfEntry; matchStatus: "EXACT" | "VERIFIED_ALIAS" | "MANUAL_VERIFIED" | "NON_COMPARABLE" }> = {};
  const matchedNirfIds = new Set<string>();

  for (const [nirfId, mapping] of Object.entries(verifiedNirfMappings)) {
    const nirf = nirfRecords.find((n) => n.nirfInstitutionId === nirfId);
    if (nirf && mapping.slug) {
      slugToNirf[mapping.slug] = { nirf, matchStatus: mapping.matchStatus };
      matchedNirfIds.add(nirfId);
    }
  }

  // Create Choice Index records
  interface ChoiceIndexRow {
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

  const choiceIndexDataset: ChoiceIndexRow[] = eligibleColleges.map((c, index) => {
    const rank = index + 1;
    const bench = c.primaryBenchmark!;
    const nirfMatch = slugToNirf[c.slug];

    const nirf2025Rank = nirfMatch ? nirfMatch.nirf.nirf2025Rank : null;
    const nirf2025Score = nirfMatch ? nirfMatch.nirf.nirf2025Score : null;
    const nirfInstitutionName = nirfMatch ? nirfMatch.nirf.nirfInstitutionName : null;
    const nirfMatchStatus = nirfMatch ? nirfMatch.matchStatus : "UNRESOLVED";

    // rankDifference = nirf2025Rank - choiceIndexRank
    // Positive = Choice Index is higher numerically (stronger rank, e.g. Choice #1 vs NIRF #10 -> 10 - 1 = +9)
    // Negative = NIRF is higher numerically (e.g. Choice #25 vs NIRF #10 -> 10 - 25 = -15)
    const rankDifference = nirf2025Rank !== null ? nirf2025Rank - rank : null;
    const allotmentCount = bench.sampleSize ?? bench.seatsAllotted ?? 0;
    const sampleFlag = allotmentCount < 10 ? "SMALL_SAMPLE" : "NORMAL";

    return {
      choiceIndexRank: rank,
      collegeId: c.collegeId,
      slug: c.slug,
      collegeName: c.collegeName,
      shortName: c.shortName || "",
      city: c.city || "",
      state: c.state,
      managementType: c.managementType.toString(),
      instituteType: c.instituteType,
      primaryQuota: bench.quota,
      primaryCategory: bench.seatCategory,
      bestAIR: bench.bestAIR ?? null,
      medianAIR: bench.medianAIR!,
      lastObservedAIR: bench.highestAIR ?? null,
      allotmentCount,
      totalMBBSSeats2026: c.totalMBBSSeats2026,
      mccR1SeatsOffered: c.mccR1SeatsOffered,
      mccR1SeatsAllotted: c.mccR1SeatsAllotted,
      nirf2025Rank,
      nirf2025Score,
      nirfInstitutionName,
      nirfMatchStatus,
      rankDifference,
      sampleFlag,
    };
  });

  // Write derived files
  const derivedDir = path.join(process.cwd(), "mccug2026data/counselling/2026/derived");
  fs.mkdirSync(derivedDir, { recursive: true });

  // 1. neet_choice_index_2026.csv
  const choiceIndexCsvPath = path.join(derivedDir, "neet_choice_index_2026.csv");
  const headerChoiceIndex = "choiceIndexRank,collegeId,slug,collegeName,shortName,city,state,managementType,instituteType,primaryQuota,primaryCategory,bestAIR,medianAIR,lastObservedAIR,allotmentCount,totalMBBSSeats2026,mccR1SeatsOffered,mccR1SeatsAllotted,sampleFlag\n";
  const rowsChoiceIndex = choiceIndexDataset.map((r) => {
    return `${r.choiceIndexRank},${r.collegeId},${r.slug},"${r.collegeName.replace(/"/g, '""')}","${r.shortName.replace(/"/g, '""')}","${r.city.replace(/"/g, '""')}","${r.state}",${r.managementType},${r.instituteType},"${r.primaryQuota}",${r.primaryCategory},${r.bestAIR ?? ""},${r.medianAIR},${r.lastObservedAIR ?? ""},${r.allotmentCount},${r.totalMBBSSeats2026},${r.mccR1SeatsOffered},${r.mccR1SeatsAllotted},${r.sampleFlag}`;
  }).join("\n");
  fs.writeFileSync(choiceIndexCsvPath, headerChoiceIndex + rowsChoiceIndex, "utf-8");
  console.log(`Saved: ${choiceIndexCsvPath} (${choiceIndexDataset.length} rows)`);

  // 2. neet_choice_index_nirf_comparison_2026.csv
  const comparisonCsvPath = path.join(derivedDir, "neet_choice_index_nirf_comparison_2026.csv");
  const headerComp = "choiceIndexRank,collegeId,slug,collegeName,shortName,city,state,managementType,instituteType,primaryQuota,primaryCategory,bestAIR,medianAIR,lastObservedAIR,allotmentCount,totalMBBSSeats2026,mccR1SeatsOffered,mccR1SeatsAllotted,nirf2025Rank,nirf2025Score,nirfInstitutionName,nirfMatchStatus,rankDifference,sampleFlag\n";
  const rowsComp = choiceIndexDataset.map((r) => {
    return `${r.choiceIndexRank},${r.collegeId},${r.slug},"${r.collegeName.replace(/"/g, '""')}","${r.shortName.replace(/"/g, '""')}","${r.city.replace(/"/g, '""')}","${r.state}",${r.managementType},${r.instituteType},"${r.primaryQuota}",${r.primaryCategory},${r.bestAIR ?? ""},${r.medianAIR},${r.lastObservedAIR ?? ""},${r.allotmentCount},${r.totalMBBSSeats2026},${r.mccR1SeatsOffered},${r.mccR1SeatsAllotted},${r.nirf2025Rank ?? ""},${r.nirf2025Score ?? ""},"${(r.nirfInstitutionName ?? "").replace(/"/g, '""')}",${r.nirfMatchStatus},${r.rankDifference ?? ""},${r.sampleFlag}`;
  }).join("\n");
  fs.writeFileSync(comparisonCsvPath, headerComp + rowsComp, "utf-8");
  console.log(`Saved: ${comparisonCsvPath} (${choiceIndexDataset.length} rows)`);

  // QA & Metrics
  const matchedColleges = choiceIndexDataset.filter((r) => r.nirf2025Rank !== null);
  const exactCount = choiceIndexDataset.filter((r) => r.nirfMatchStatus === "EXACT").length;
  const aliasCount = choiceIndexDataset.filter((r) => r.nirfMatchStatus === "VERIFIED_ALIAS").length;
  const manualCount = choiceIndexDataset.filter((r) => r.nirfMatchStatus === "MANUAL_VERIFIED").length;

  // Rank difference metrics
  const absDiffs = matchedColleges.map((r) => Math.abs(r.rankDifference!)).sort((a, b) => a - b);
  const medianAbsDiff = absDiffs.length > 0 ? absDiffs[Math.floor(absDiffs.length / 2)] : 0;

  const band0_5 = matchedColleges.filter((r) => Math.abs(r.rankDifference!) <= 5).length;
  const band6_15 = matchedColleges.filter((r) => Math.abs(r.rankDifference!) >= 6 && Math.abs(r.rankDifference!) <= 15).length;
  const bandOver15 = matchedColleges.filter((r) => Math.abs(r.rankDifference!) > 15).length;

  console.log("\n==================================================================");
  console.log("VALIDATION SUMMARY:");
  console.log(`Total colleges evaluated: ${evaluated.length}`);
  console.log(`Total Choice Index ranked colleges: ${choiceIndexDataset.length}`);
  console.log(`Total not ranked (insufficient evidence): ${notRankedColleges.length}`);
  console.log(`Total NIRF 2025 Medical records: ${nirfRecords.length}`);
  console.log(`Total NIRF records matched to Choice Index: ${matchedColleges.length}`);
  console.log(`Match breakdown: EXACT=${exactCount}, VERIFIED_ALIAS=${aliasCount}, MANUAL_VERIFIED=${manualCount}`);
  console.log(`Non-comparable NIRF records: ${nonComparableNirfInstitutes.length}`);
  console.log(`Median absolute rank difference: ${medianAbsDiff}`);
  console.log(`Rank difference distribution:`);
  console.log(`  0-5 (Broad Agreement): ${band0_5} (${((band0_5 / matchedColleges.length) * 100).toFixed(1)}%)`);
  console.log(`  6-15 (Moderate Difference): ${band6_15} (${((band6_15 / matchedColleges.length) * 100).toFixed(1)}%)`);
  console.log(`  >15 (Large Difference): ${bandOver15} (${((bandOver15 / matchedColleges.length) * 100).toFixed(1)}%)`);

  // Small sample in Top 50
  const top50 = choiceIndexDataset.slice(0, 50);
  const smallSampleTop50 = top50.filter((r) => r.sampleFlag === "SMALL_SAMPLE");
  console.log(`\nSmall sample (n < 10) in Top 50: ${smallSampleTop50.length}`);
  for (const s of smallSampleTop50) {
    console.log(`  Rank #${s.choiceIndexRank}: ${s.collegeName} (n=${s.allotmentCount}, Quota: ${s.primaryQuota})`);
  }

  // Print Top 25
  console.log("\n==================================================================");
  console.log("TOP 25 — NEET CHOICE INDEX 2026");
  console.log("==================================================================");
  console.log("| Rank | College | State | Type | Primary Pathway | Best AIR | Typical (Median) AIR | Last Observed AIR | n | NIRF 2025 Rank |");
  console.log("| :---: | :--- | :--- | :--- | :--- | :---: | :---: | :---: | :---: | :---: |");
  for (let i = 0; i < 25; i++) {
    const r = choiceIndexDataset[i];
    console.log(`| ${r.choiceIndexRank} | ${r.collegeName} | ${r.state} | ${r.instituteType} | ${r.primaryQuota} | ${r.bestAIR ?? "-"} | ${r.medianAIR} | ${r.lastObservedAIR ?? "-"} | ${r.allotmentCount} | ${r.nirf2025Rank ? "#" + r.nirf2025Rank : "Unranked"} |`);
  }
}

run()
  .then(() => prisma.$disconnect())
  .catch((err) => {
    console.error(err);
    prisma.$disconnect();
    process.exit(1);
  });
