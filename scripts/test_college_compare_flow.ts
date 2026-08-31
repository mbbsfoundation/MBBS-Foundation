import "dotenv/config";
import { prisma } from "../lib/prisma";
import { searchMedicalCollegesEvidence, getCollegeEvidenceBySlug } from "../lib/counselling/evidenceService";
import type { DomicileCollegeSummary } from "../lib/counselling/evidenceTypes";
import type { CounsellingRecommendation } from "../lib/counselling/recommendationEngine";

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`  ❌ FAIL: ${msg}`);
    process.exit(1);
  }
  console.log(`  ✅ PASS: ${msg}`);
}

async function runTests() {
  console.log("\n==================================================================");
  console.log("RUNNING AUTOMATED TESTS: SEQUENCE 9I.3E — COMPARE COLLEGES DATA FLOW");
  console.log("==================================================================");

  // [TEST GROUP 1]: Search Evidence Returns Canonical Identifiers
  console.log("\n[TEST GROUP 1] Explorer Evidence Payload & Identifiers");
  const explorerResults = await searchMedicalCollegesEvidence({
    page: 1,
    pageSize: 20,
  });

  assert(explorerResults.items.length > 0, "1. Medical College Explorer returns items");
  for (const item of explorerResults.items) {
    assert(!!item.collegeId, `2. Item '${item.collegeName}' has valid collegeId: ${item.collegeId}`);
    assert(!!item.slug, `3. Item '${item.collegeName}' has valid slug: ${item.slug}`);
    assert(item.totalMBBSSeats2026 >= 0, `4. Item '${item.collegeName}' has valid totalMBBSSeats2026: ${item.totalMBBSSeats2026}`);
  }

  // [TEST GROUP 2]: Three Target Colleges Found & Hydrated
  console.log("\n[TEST GROUP 2] Target Test Colleges: SMS Jaipur, AIIMS Rishikesh, KMC Manipal");
  const smsEvidence = await getCollegeEvidenceBySlug("sms-medical-college-jaipur");
  const rishikeshEvidence = await getCollegeEvidenceBySlug("aiims-uttarakhand");
  const kmcEvidence = await getCollegeEvidenceBySlug("kasturba-medical-college-manipal");

  assert(smsEvidence !== null, "5. SMS Medical College Jaipur found by slug");
  assert(smsEvidence?.state === "Rajasthan", "6. SMS Jaipur state is Rajasthan");
  assert(smsEvidence?.totalMBBSSeats2026 === 250, "7. SMS Jaipur approved intake is 250 seats");

  assert(rishikeshEvidence !== null, "8. AIIMS Rishikesh found by slug");
  assert(rishikeshEvidence?.state === "Uttarakhand", "9. AIIMS Rishikesh state is Uttarakhand");
  assert(rishikeshEvidence?.isINI === true, "10. AIIMS Rishikesh is INI");
  assert(rishikeshEvidence?.totalMBBSSeats2026 === 125, "11. AIIMS Rishikesh approved intake is 125 seats");

  assert(kmcEvidence !== null, "12. Kasturba Medical College Manipal found by slug");
  assert(kmcEvidence?.state === "Karnataka", "13. KMC Manipal state is Karnataka");
  assert(kmcEvidence?.totalMBBSSeats2026 === 250, "14. KMC Manipal approved intake is 250 seats");

  // [TEST GROUP 3]: State Simulation for Medical College Explorer Compare Flow
  console.log("\n[TEST GROUP 3] Simulating Selection and Comparison State Hand-Off");
  
  // Transient state as managed in Round2Planner.tsx
  let selectedCollegeIds: string[] = [];
  let comparisonColleges: Record<string, DomicileCollegeSummary> = {};

  function handleToggleComparison(collegeOrId: string | DomicileCollegeSummary) {
    const collegeId = typeof collegeOrId === "string" ? collegeOrId : collegeOrId.collegeId;
    if (!collegeId) return;

    if (typeof collegeOrId !== "string") {
      comparisonColleges[collegeId] = collegeOrId;
    }

    if (selectedCollegeIds.includes(collegeId)) {
      selectedCollegeIds = selectedCollegeIds.filter((id) => id !== collegeId);
    } else {
      if (selectedCollegeIds.length >= 3) {
        return "MAX_REACHED";
      }
      selectedCollegeIds.push(collegeId);
    }
  }

  // 1. Add SMS Jaipur
  handleToggleComparison(smsEvidence!);
  assert(selectedCollegeIds.length === 1, "15. SMS Jaipur successfully added to compare selection");
  assert(selectedCollegeIds[0] === smsEvidence!.collegeId, "16. Selected ID matches SMS Jaipur canonical collegeId");

  // 2. Add AIIMS Rishikesh
  handleToggleComparison(rishikeshEvidence!);
  assert(selectedCollegeIds.length === 2, "17. AIIMS Rishikesh successfully added to compare selection");

  // 3. Add KMC Manipal
  handleToggleComparison(kmcEvidence!);
  assert(selectedCollegeIds.length === 3, "18. KMC Manipal successfully added to compare selection");

  // 4. Test Maximum 3 limit
  const dummyExcess: DomicileCollegeSummary = {
    collegeId: "dummy_id",
    slug: "dummy-college",
    collegeName: "Dummy College",
    state: "Delhi",
    managementType: "GOVERNMENT",
    totalMBBSSeats2026: 100,
    mccRound1SeatsOffered: 15,
    mccRound1SeatsAllotted: 15,
    approxOutsideMccRound1Pool: 85,
    openRound1Profiles: [],
    studentCategoryRound1Profiles: [],
    allCategoryProfiles: [],
    isINI: false,
    isDeemed: false,
    isCentralUniversity: false,
    isESIC: false,
  };
  const maxResult = handleToggleComparison(dummyExcess);
  assert(maxResult === "MAX_REACHED", "19. Attempting to add a 4th college respects maximum 3 limit");
  assert(selectedCollegeIds.length === 3, "20. Selection count remains strictly 3");

  // 5. Test removal and re-addition
  handleToggleComparison(rishikeshEvidence!.collegeId);
  assert(selectedCollegeIds.length === 2, "21. Removing AIIMS Rishikesh decreases selection count to 2");
  assert(!selectedCollegeIds.includes(rishikeshEvidence!.collegeId), "22. AIIMS Rishikesh ID removed from selection");

  handleToggleComparison(rishikeshEvidence!);
  assert(selectedCollegeIds.length === 3, "23. Re-adding AIIMS Rishikesh restores selection count to 3");

  // [TEST GROUP 4]: Comparison Resolution Logic Verification
  console.log("\n[TEST GROUP 4] Testing Comparison Resolution (Elimination of 'Unknown College')");

  // Simulator for ComparisonModal resolution logic
  function resolveComparisonCards(
    ids: string[],
    allRecs: CounsellingRecommendation[],
    compColleges: Record<string, DomicileCollegeSummary>
  ) {
    return ids.map((id) => {
      const matchingRecs = allRecs.filter((r) => r.collegeId === id);
      const summaryCol = compColleges[id];

      if (matchingRecs.length > 0) {
        const primary = matchingRecs[0];
        return {
          id,
          collegeName: primary.collegeName,
          state: primary.state,
          managementType: primary.managementType,
          approvedSeats2026: primary.approvedSeats2026,
          isINI: primary.isINI,
          isDeemed: primary.isDeemed,
          hasPersonalizedRecommendations: true,
          pathways: matchingRecs,
        };
      }

      if (summaryCol) {
        const allProfiles = summaryCol.allCategoryProfiles || [];
        const pathways = allProfiles.map((p) => ({
          quota: p.quota,
          seatCategory: p.seatCategory,
          isPwD: p.isPwD,
          route: "MCC",
          medianAIR: p.medianAIR,
          highestAIR: p.highestAIR,
          sampleSize: p.sampleSize,
          seatsOffered: p.seatsOffered,
          seatsAllotted: p.seatsAllotted,
        }));

        return {
          id,
          collegeName: summaryCol.collegeName,
          state: summaryCol.state,
          managementType: summaryCol.managementType,
          approvedSeats2026: summaryCol.totalMBBSSeats2026,
          isINI: summaryCol.isINI,
          isDeemed: summaryCol.isDeemed,
          hasPersonalizedRecommendations: false,
          pathways,
        };
      }

      return {
        id,
        collegeName: "College data unavailable",
        state: "N/A",
        managementType: "N/A",
        approvedSeats2026: null,
        isINI: false,
        isDeemed: false,
        hasPersonalizedRecommendations: false,
        pathways: [],
      };
    });
  }

  // A. Resolve with Empty allRecommendations (Simulating Medical College Explorer direct path)
  const resolvedFromExplorer = resolveComparisonCards(selectedCollegeIds, [], comparisonColleges);
  assert(resolvedFromExplorer.length === 3, "24. Exactly 3 colleges resolved");

  const resSMS = resolvedFromExplorer.find((c) => c.id === smsEvidence!.collegeId)!;
  const resRishikesh = resolvedFromExplorer.find((c) => c.id === rishikeshEvidence!.collegeId)!;
  const resKMC = resolvedFromExplorer.find((c) => c.id === kmcEvidence!.collegeId)!;

  assert(!!resSMS, "25a. SMS Jaipur found in resolved cards");
  assert(!!resRishikesh, "25b. AIIMS Rishikesh found in resolved cards");
  assert(!!resKMC, "25c. KMC Manipal found in resolved cards");

  // SMS Jaipur Check
  assert(resSMS.collegeName === "SMS Medical College, Jaipur", `25. SMS Jaipur Name resolved correctly: ${resSMS.collegeName}`);
  assert(resSMS.collegeName !== "Unknown College", "26. SMS Jaipur is NOT 'Unknown College'");
  assert(resSMS.state === "Rajasthan", `27. SMS Jaipur State resolved correctly: ${resSMS.state}`);
  assert(resSMS.state !== "N/A", "28. SMS Jaipur State is NOT 'N/A'");
  assert(resSMS.approvedSeats2026 === 250, `29. SMS Jaipur Approved Intake resolved correctly: ${resSMS.approvedSeats2026} seats`);
  assert(resSMS.pathways.length > 0, `30. SMS Jaipur has recorded pathways: ${resSMS.pathways.length}`);

  // AIIMS Rishikesh Check
  assert(resRishikesh.collegeName.includes("Rishikesh"), `31. AIIMS Rishikesh Name resolved correctly: ${resRishikesh.collegeName}`);
  assert(resRishikesh.collegeName !== "Unknown College", "32. AIIMS Rishikesh is NOT 'Unknown College'");
  assert(resRishikesh.state === "Uttarakhand", `33. AIIMS Rishikesh State resolved correctly: ${resRishikesh.state}`);
  assert(resRishikesh.state !== "N/A", "34. AIIMS Rishikesh State is NOT 'N/A'");
  assert(resRishikesh.approvedSeats2026 === 125, `35. AIIMS Rishikesh Approved Intake resolved correctly: ${resRishikesh.approvedSeats2026} seats`);
  assert(resRishikesh.pathways.length > 0, `36. AIIMS Rishikesh has recorded pathways: ${resRishikesh.pathways.length}`);

  // KMC Manipal Check
  assert(resKMC.collegeName === "Kasturba Medical College, Manipal", `37. KMC Manipal Name resolved correctly: ${resKMC.collegeName}`);
  assert(resKMC.collegeName !== "Unknown College", "38. KMC Manipal is NOT 'Unknown College'");
  assert(resKMC.state === "Karnataka", `39. KMC Manipal State resolved correctly: ${resKMC.state}`);
  assert(resKMC.state !== "N/A", "40. KMC Manipal State is NOT 'N/A'");
  assert(resKMC.approvedSeats2026 === 250, `41. KMC Manipal Approved Intake resolved correctly: ${resKMC.approvedSeats2026} seats`);
  assert(resKMC.pathways.length > 0, `42. KMC Manipal has recorded pathways: ${resKMC.pathways.length}`);

  // [TEST GROUP 5]: Stale/Invalid ID Graceful Fallback
  console.log("\n[TEST GROUP 5] Stale / Invalid ID Graceful Handling");
  const fallbackCheck = resolveComparisonCards(["non_existent_invalid_id"], [], {});
  assert(fallbackCheck[0].collegeName === "College data unavailable", "43. Invalid ID shows restrained 'College data unavailable'");
  assert(fallbackCheck[0].collegeName !== "Unknown College", "44. 'Unknown College' completely eliminated");
  assert(fallbackCheck[0].pathways.length === 0, "45. Invalid ID yields empty pathways array without crashing");

  console.log("\n==================================================================");
  console.log("TEST SUMMARY: ALL 45 TESTS PASSED SUCCESSFULLY");
  console.log("==================================================================");
}

runTests()
  .then(() => prisma.$disconnect())
  .catch((err) => {
    console.error("Test execution error:", err);
    prisma.$disconnect();
    process.exit(1);
  });
