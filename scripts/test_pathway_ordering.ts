import "dotenv/config";
import { prisma } from "../lib/prisma";
import {
  getPathwayPriorityTier,
  getPathwayGroup,
  getCategoryOrderWeight,
  getStudentFriendlyQuotaLabel,
  compareProfilesStandard,
  compareProfilesByBestAIR,
  sortCategoryProfiles,
  isPrimaryOpenBenchmark,
} from "../lib/counselling/pathwayOrdering";
import { getDomicileStateSummary, CollegeRound1CategoryProfile } from "../lib/counselling/evidenceService";
import { CounsellingSeatCategory } from "../lib/generated/prisma/client";

async function runPathwayOrderingTests() {
  console.log("================================================================================");
  console.log("SEQUENCE 9E — STANDARDIZE QUOTA / PATHWAY ORDERING IN COLLEGE EVIDENCE VIEW");
  console.log("================================================================================\n");

  let totalTests = 0;
  let passedTests = 0;

  function assert(condition: boolean, testName: string, details?: string) {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`  ✓ [PASS] ${testName}`);
    } else {
      console.error(`  ✗ [FAIL] ${testName}`);
      if (details) console.error(`     Details: ${details}`);
    }
  }

  // -------------------------------------------------------------
  // TEST GROUP 1: Fixed Category Hierarchy (OPEN -> EWS -> OBC -> SC -> ST)
  // -------------------------------------------------------------
  console.log("--- TEST GROUP 1: Fixed Category Hierarchy Weighting ---");
  assert(getCategoryOrderWeight("OPEN") === 1, "OPEN category weight is 1");
  assert(getCategoryOrderWeight("EWS") === 2, "EWS category weight is 2");
  assert(getCategoryOrderWeight("OBC") === 3, "OBC category weight is 3");
  assert(getCategoryOrderWeight("SC") === 4, "SC category weight is 4");
  assert(getCategoryOrderWeight("ST") === 5, "ST category weight is 5");

  const mockProfiles: CollegeRound1CategoryProfile[] = [
    { quota: "All India", seatCategory: CounsellingSeatCategory.ST, isPwD: false, specialPathway: null, seatsOffered: 5, seatsAllotted: 5, matrixGap: 0, bestAIR: 30000, medianAIR: 35000, highestAIR: 40000, sampleSize: 5 },
    { quota: "All India", seatCategory: CounsellingSeatCategory.OPEN, isPwD: false, specialPathway: null, seatsOffered: 15, seatsAllotted: 15, matrixGap: 0, bestAIR: 1000, medianAIR: 1500, highestAIR: 2000, sampleSize: 15 },
    { quota: "All India", seatCategory: CounsellingSeatCategory.OBC, isPwD: false, specialPathway: null, seatsOffered: 10, seatsAllotted: 10, matrixGap: 0, bestAIR: 5000, medianAIR: 6000, highestAIR: 7000, sampleSize: 10 },
    { quota: "All India", seatCategory: CounsellingSeatCategory.EWS, isPwD: false, specialPathway: null, seatsOffered: 5, seatsAllotted: 5, matrixGap: 0, bestAIR: 3000, medianAIR: 4000, highestAIR: 4500, sampleSize: 5 },
    { quota: "All India", seatCategory: CounsellingSeatCategory.SC, isPwD: false, specialPathway: null, seatsOffered: 8, seatsAllotted: 8, matrixGap: 0, bestAIR: 15000, medianAIR: 18000, highestAIR: 20000, sampleSize: 8 },
  ];

  const sortedCats = sortCategoryProfiles(mockProfiles, "STANDARD");
  assert(sortedCats[0].seatCategory === "OPEN", "1st sorted row is OPEN");
  assert(sortedCats[1].seatCategory === "EWS", "2nd sorted row is EWS");
  assert(sortedCats[2].seatCategory === "OBC", "3rd sorted row is OBC");
  assert(sortedCats[3].seatCategory === "SC", "4th sorted row is SC");
  assert(sortedCats[4].seatCategory === "ST", "5th sorted row is ST");

  // -------------------------------------------------------------
  // TEST GROUP 2: Pathway Hierarchy (Ordinary vs Special vs NRI)
  // -------------------------------------------------------------
  console.log("\n--- TEST GROUP 2: Pathway Priority Tiers & Grouping ---");
  assert(getPathwayPriorityTier("Open Seat Quota") === 1, "Open Seat Quota is Tier 1");
  assert(getPathwayPriorityTier("All India") === 1, "All India is Tier 1");
  assert(getPathwayPriorityTier("Self-Financed Merit") === 1, "Self-Financed Merit is Tier 1");
  assert(getPathwayPriorityTier("Delhi University Quota") === 2, "DU Quota is Tier 2");
  assert(getPathwayPriorityTier("AMU Quota") === 2, "AMU Quota is Tier 2");
  assert(getPathwayPriorityTier("IP University Quota") === 3, "IPU Quota is Tier 3");
  assert(getPathwayPriorityTier("Internal -Puducherry") === 3, "Internal Puducherry is Tier 3");
  assert(getPathwayPriorityTier("ESI") === 4, "ESI is Tier 4");
  assert(getPathwayPriorityTier("Delhi NCR CW") === 4, "CW is Tier 4");
  assert(getPathwayPriorityTier("Muslim Minority") === 5, "Muslim Minority is Tier 5");
  assert(getPathwayPriorityTier("Jain Minority Quota") === 5, "Jain Minority is Tier 5");
  assert(getPathwayPriorityTier("NRI") === 6, "NRI is Tier 6");
  assert(getPathwayPriorityTier("NRI-AMU") === 6, "NRI-AMU is Tier 6");
  assert(getPathwayPriorityTier("Foreign Country Quota") === 7, "Foreign Country Quota is Tier 7");

  assert(getPathwayGroup("All India") === "ORDINARY", "All India classified as ORDINARY");
  assert(getPathwayGroup("Self-Financed Merit") === "ORDINARY", "Self-Financed Merit classified as ORDINARY");
  assert(getPathwayGroup("Delhi University Quota") === "ORDINARY", "DU Quota classified as ORDINARY");
  assert(getPathwayGroup("IP University Quota") === "SPECIAL", "IPU Quota classified as SPECIAL");
  assert(getPathwayGroup("ESI") === "SPECIAL", "ESI classified as SPECIAL");
  assert(getPathwayGroup("NRI") === "SPECIAL", "NRI classified as SPECIAL");

  // -------------------------------------------------------------
  // TEST GROUP 3: NRI vs Ordinary Deemed Sorting Safety
  // -------------------------------------------------------------
  console.log("\n--- TEST GROUP 3: Deemed College — Self-Financed Merit vs NRI Safety ---");
  // Test scenario where NRI has a numerically lower AIR than Management
  const deemedProfiles: CollegeRound1CategoryProfile[] = [
    { quota: "NRI", seatCategory: CounsellingSeatCategory.OPEN, isPwD: false, specialPathway: "NRI", seatsOffered: 15, seatsAllotted: 15, matrixGap: 0, bestAIR: 5000, medianAIR: 15000, highestAIR: 25000, sampleSize: 15 },
    { quota: "Self-Financed Merit", seatCategory: CounsellingSeatCategory.OPEN, isPwD: false, specialPathway: null, seatsOffered: 85, seatsAllotted: 85, matrixGap: 0, bestAIR: 25000, medianAIR: 35000, highestAIR: 45000, sampleSize: 85 },
  ];

  const sortedDeemed = sortCategoryProfiles(deemedProfiles, "STANDARD");
  assert(sortedDeemed[0].quota === "Self-Financed Merit", "Self-Financed Merit precedes NRI even if NRI AIR is numerically lower");
  assert(sortedDeemed[1].quota === "NRI", "NRI is placed 2nd after ordinary merit");
  assert(isPrimaryOpenBenchmark(sortedDeemed[0], deemedProfiles) === true, "Self-Financed Merit OPEN is Primary Open Benchmark");

  // -------------------------------------------------------------
  // TEST GROUP 4: PwD Separation
  // -------------------------------------------------------------
  console.log("\n--- TEST GROUP 4: PwD Separation from Ordinary Categories ---");
  const pwdMixProfiles: CollegeRound1CategoryProfile[] = [
    { quota: "All India", seatCategory: CounsellingSeatCategory.OPEN, isPwD: true, specialPathway: null, seatsOffered: 2, seatsAllotted: 2, matrixGap: 0, bestAIR: 50000, medianAIR: 60000, highestAIR: 70000, sampleSize: 2 },
    { quota: "All India", seatCategory: CounsellingSeatCategory.ST, isPwD: false, specialPathway: null, seatsOffered: 5, seatsAllotted: 5, matrixGap: 0, bestAIR: 30000, medianAIR: 35000, highestAIR: 40000, sampleSize: 5 },
    { quota: "All India", seatCategory: CounsellingSeatCategory.OPEN, isPwD: false, specialPathway: null, seatsOffered: 15, seatsAllotted: 15, matrixGap: 0, bestAIR: 1000, medianAIR: 1500, highestAIR: 2000, sampleSize: 15 },
  ];

  const sortedPwd = sortCategoryProfiles(pwdMixProfiles, "STANDARD");
  assert(sortedPwd[0].seatCategory === "OPEN" && sortedPwd[0].isPwD === false, "1st is Non-PwD OPEN");
  assert(sortedPwd[1].seatCategory === "ST" && sortedPwd[1].isPwD === false, "2nd is Non-PwD ST");
  assert(sortedPwd[2].seatCategory === "OPEN" && sortedPwd[2].isPwD === true, "3rd is PwD OPEN (placed after non-PwD)");

  // -------------------------------------------------------------
  // TEST GROUP 5: Null / Zero-Allotment AIR Handling
  // -------------------------------------------------------------
  console.log("\n--- TEST GROUP 5: Null AIR Handling & Best AIR Tie-Break ---");
  const nullAirProfiles: CollegeRound1CategoryProfile[] = [
    { quota: "All India", seatCategory: CounsellingSeatCategory.OPEN, isPwD: false, specialPathway: null, seatsOffered: 2, seatsAllotted: 0, matrixGap: 2, bestAIR: null, medianAIR: null, highestAIR: null, sampleSize: 0 },
    { quota: "All India", seatCategory: CounsellingSeatCategory.OPEN, isPwD: false, specialPathway: null, seatsOffered: 10, seatsAllotted: 10, matrixGap: 0, bestAIR: 2500, medianAIR: 3000, highestAIR: 3500, sampleSize: 10 },
    { quota: "All India", seatCategory: CounsellingSeatCategory.OPEN, isPwD: false, specialPathway: null, seatsOffered: 10, seatsAllotted: 10, matrixGap: 0, bestAIR: 1200, medianAIR: 1500, highestAIR: 1800, sampleSize: 10 },
  ];

  const sortedNulls = sortCategoryProfiles(nullAirProfiles, "STANDARD");
  assert(sortedNulls[0].bestAIR === 1200, "Lowest Best AIR (1200) comes 1st among same quota/cat");
  assert(sortedNulls[1].bestAIR === 2500, "Higher Best AIR (2500) comes 2nd");
  assert(sortedNulls[2].bestAIR === null, "Null AIR row placed last");

  // -------------------------------------------------------------
  // TEST GROUP 6: Database Live Sample 1 — Government State College (SMS Jaipur)
  // -------------------------------------------------------------
  console.log("\n--- TEST GROUP 6: Live Database Sample 1 — SMS Medical College, Jaipur ---");
  const rajSummary = await getDomicileStateSummary("Rajasthan", CounsellingSeatCategory.SC, false);
  const sms = rajSummary.colleges.find(
    (c) => c.collegeName.toLowerCase().includes("sms") && c.collegeName.toLowerCase().includes("jaipur")
  );

  assert(sms !== undefined, "SMS Medical College found in Rajasthan dataset");
  if (sms) {
    const sortedSMS = sortCategoryProfiles(sms.allCategoryProfiles, "STANDARD");
    assert(sortedSMS.length > 0, "SMS has category profiles");
    assert(sortedSMS[0].seatCategory === "OPEN" && !sortedSMS[0].isPwD, "SMS 1st row is All India OPEN non-PwD");
    assert(sortedSMS[0].quota === "All India", "SMS 1st row quota is All India");
    assert(isPrimaryOpenBenchmark(sortedSMS[0], sms.allCategoryProfiles) === true, "SMS 1st row identified as Primary Open Benchmark");

    // Verify fixed category sequence for SMS All India
    const nonPwdAi = sortedSMS.filter((p) => p.quota === "All India" && !p.isPwD);
    const catSeq = nonPwdAi.map((p) => p.seatCategory);
    console.log("     SMS All India Non-PwD Categories:", catSeq.join(" -> "));
    assert(catSeq[0] === "OPEN", "SMS All India starts with OPEN");
    if (catSeq.includes("EWS" as any)) assert(catSeq.indexOf("EWS" as any) < catSeq.indexOf("SC" as any), "EWS precedes SC");
    if (catSeq.includes("OBC" as any)) assert(catSeq.indexOf("OBC" as any) < catSeq.indexOf("SC" as any), "OBC precedes SC");
    if (catSeq.includes("SC" as any) && catSeq.includes("ST" as any)) assert(catSeq.indexOf("SC" as any) < catSeq.indexOf("ST" as any), "SC precedes ST");

    // Verify all PwD rows appear after non-PwD rows
    const firstPwdIdx = sortedSMS.findIndex((p) => p.isPwD);
    const lastNonPwdIdx = sortedSMS.map((p) => !p.isPwD).lastIndexOf(true);
    if (firstPwdIdx !== -1) {
      assert(firstPwdIdx > lastNonPwdIdx, "All SMS PwD profiles appear after non-PwD profiles in standard view");
    }
  }

  // -------------------------------------------------------------
  // TEST GROUP 7: Database Live Sample 2 — AIIMS / INI (AIIMS Jodhpur)
  // -------------------------------------------------------------
  console.log("\n--- TEST GROUP 7: Live Database Sample 2 — AIIMS Jodhpur (INI) ---");
  const aiims = rajSummary.colleges.find((c) => c.collegeName.includes("AIIMS, Jodhpur"));
  assert(aiims !== undefined, "AIIMS Jodhpur found in Rajasthan dataset");
  if (aiims) {
    const sortedAIIMS = sortCategoryProfiles(aiims.allCategoryProfiles, "STANDARD");
    assert(sortedAIIMS[0].quota === "Open Seat Quota", "AIIMS Jodhpur highest priority quota is Open Seat Quota");
    assert(sortedAIIMS[0].seatCategory === "OPEN", "AIIMS Jodhpur 1st row category is OPEN");
    assert(!sortedAIIMS[0].isPwD, "AIIMS Jodhpur 1st row is non-PwD");
    assert(isPrimaryOpenBenchmark(sortedAIIMS[0], aiims.allCategoryProfiles) === true, "AIIMS 1st row is Primary Open Benchmark");
  }

  // -------------------------------------------------------------
  // TEST GROUP 8: Database Live Sample 3 — Deemed College (KMC Manipal)
  // -------------------------------------------------------------
  console.log("\n--- TEST GROUP 8: Live Database Sample 3 — KMC Manipal (Deemed) ---");
  const karSummary = await getDomicileStateSummary("Karnataka", CounsellingSeatCategory.OPEN, false);
  const kmc = karSummary.colleges.find((c) => c.collegeName.includes("Kasturba Medical College, Manipal"));
  assert(kmc !== undefined, "KMC Manipal found in Karnataka dataset");
  if (kmc) {
    const sortedKMC = sortCategoryProfiles(kmc.allCategoryProfiles, "STANDARD");
    assert(sortedKMC[0].quota === "Self-Financed Merit", "KMC Manipal 1st row is Self-Financed Merit");
    assert(sortedKMC[0].seatCategory === "OPEN", "KMC Manipal 1st row category is OPEN");
    assert(isPrimaryOpenBenchmark(sortedKMC[0], kmc.allCategoryProfiles) === true, "KMC Self-Financed Merit OPEN is Primary Benchmark");

    const nriRow = sortedKMC.find((p) => p.quota.toLowerCase().includes("nri"));
    if (nriRow) {
      const meritIdx = sortedKMC.indexOf(sortedKMC[0]);
      const nriIdx = sortedKMC.indexOf(nriRow);
      assert(meritIdx < nriIdx, "KMC Self-Financed Merit precedes NRI");
    }
  }

  // -------------------------------------------------------------
  // TEST GROUP 9: Database Live Sample 4 — Central / Institutional Quota (MAMC Delhi)
  // -------------------------------------------------------------
  console.log("\n--- TEST GROUP 9: Live Database Sample 4 — MAMC New Delhi (DU Quota) ---");
  const delSummary = await getDomicileStateSummary("Delhi", CounsellingSeatCategory.OPEN, false);
  const mamc = delSummary.colleges.find((c) => c.collegeName.includes("Maulana Azad Medical College"));
  assert(mamc !== undefined, "MAMC found in Delhi dataset");
  if (mamc) {
    const sortedMAMC = sortCategoryProfiles(mamc.allCategoryProfiles, "STANDARD");
    // All India is Tier 1, DU Quota is Tier 2, CW is Tier 4
    const aiRow = sortedMAMC.find((p) => p.quota === "All India" && p.seatCategory === "OPEN" && !p.isPwD);
    const duRow = sortedMAMC.find((p) => p.quota.includes("Delhi University") && p.seatCategory === "OPEN" && !p.isPwD);
    const cwRow = sortedMAMC.find((p) => p.quota.includes("CW"));

    assert(aiRow !== undefined, "MAMC All India OPEN row present");
    assert(duRow !== undefined, "MAMC DU Quota OPEN row present");

    if (aiRow && duRow) {
      assert(sortedMAMC.indexOf(aiRow) < sortedMAMC.indexOf(duRow), "All India Quota precedes DU Quota in Standard View");
    }
    if (duRow && cwRow) {
      assert(sortedMAMC.indexOf(duRow) < sortedMAMC.indexOf(cwRow), "DU Quota precedes CW Special Quota in Standard View");
    }
  }

  // -------------------------------------------------------------
  // TEST GROUP 10: Best AIR Sort Mode Functionality
  // -------------------------------------------------------------
  console.log("\n--- TEST GROUP 10: Best AIR Numerical Ordering Mode ---");
  if (sms) {
    const airSorted = sortCategoryProfiles(sms.allCategoryProfiles, "BEST_AIR");
    for (let i = 0; i < airSorted.length - 1; i++) {
      const current = airSorted[i].bestAIR;
      const next = airSorted[i + 1].bestAIR;
      if (current !== null && next !== null) {
        assert(current <= next, `Row ${i} (${current}) <= Row ${i + 1} (${next}) in BEST_AIR mode`);
      } else if (current === null && next !== null) {
        assert(false, "Null AIR appeared before valid AIR in BEST_AIR mode");
      }
    }
    assert(true, "All valid AIR rows are strictly ascending in BEST_AIR mode");
  }

  console.log("\n================================================================================");
  console.log(`TEST SUMMARY: ${passedTests}/${totalTests} TESTS PASSED (${((passedTests / totalTests) * 100).toFixed(1)}%)`);
  console.log("================================================================================\n");

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runPathwayOrderingTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Test execution failed:", err);
    process.exit(1);
  });
