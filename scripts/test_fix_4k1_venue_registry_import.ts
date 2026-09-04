import {
  getCanonicalVenuesByState,
  getFrozenBaselineVenueRegistry,
  CanonicalPhysicalVenue,
} from "../lib/cprVenueRegistry";
import {
  getCPRDayReconciliationReport,
  getCPRDayNationalConsolidatedReport,
  getAllCPRDayReconciliationReports,
  getCanonicalVenuesByState as reexportedGetCanonicalVenuesByState,
} from "../lib/cprReporting";
import { getLockedCensusStateList, getLockedOfficialStateCensus } from "../lib/cprStateCensus";
import fs from "fs";
import path from "path";

function runTests() {
  console.log("==================================================================");
  console.log("FIX 4K.1 REGRESSION TEST: getCanonicalVenuesByState & State Reports");
  console.log("==================================================================");

  let passed = true;

  // Test 1: Function export type
  console.log("\n[Test 1] Verify function export type:");
  const directType = typeof getCanonicalVenuesByState;
  const reexportedType = typeof reexportedGetCanonicalVenuesByState;
  console.log(`  - typeof getCanonicalVenuesByState (from cprVenueRegistry): ${directType}`);
  console.log(`  - typeof getCanonicalVenuesByState (re-exported from cprReporting): ${reexportedType}`);

  if (directType !== "function" || reexportedType !== "function") {
    console.error("  FAIL: getCanonicalVenuesByState is not a function!");
    passed = false;
  } else {
    console.log("  PASS: Function export confirmed.");
  }

  // Test 2: Direct call for Maharashtra, Madhya Pradesh, West Bengal, Sikkim
  console.log("\n[Test 2] Direct call to getCanonicalVenuesByState for key states:");
  const testStates = ["Maharashtra", "Madhya Pradesh", "West Bengal", "Sikkim"];
  for (const s of testStates) {
    try {
      const venues = getCanonicalVenuesByState(s);
      console.log(`  - ${s}: ${venues.length} canonical physical venues found.`);
      if (!Array.isArray(venues) || venues.length === 0) {
        console.error(`  FAIL: ${s} returned empty or invalid venues list.`);
        passed = false;
      }
    } catch (err: any) {
      console.error(`  FAIL: Exception calling getCanonicalVenuesByState("${s}"):`, err);
      passed = false;
    }
  }

  // Test 3: Reconciled State Report generation for Maharashtra, MP, WB, Sikkim
  console.log("\n[Test 3] Reconciled State Report generation for key states:");
  for (const s of testStates) {
    try {
      const r = getCPRDayReconciliationReport(s);
      if (!r) {
        console.error(`  FAIL: getCPRDayReconciliationReport("${s}") returned null/undefined`);
        passed = false;
        continue;
      }
      console.log(`  - ${s}:`);
      console.log(`      Baseline Courses: ${r.summary.baseline.courses}`);
      console.log(`      Baseline Physical Venues: ${r.summary.baseline.uniqueVenues}`);
      console.log(`      Baseline Reported Trained: ${r.summary.baseline.reportedTrained.toLocaleString()}`);
      console.log(`      Certified Records: ${r.summary.liveData.participantCertificatesFound.toLocaleString()}`);
      console.log(`      Reconciled Trained: ${r.summary.reconciledReport.participantsTrained.toLocaleString()}`);
      console.log(`      Reconciled Courses: ${r.summary.reconciledReport.coursesConducted}`);
      console.log(`      Reconciled Physical Venues: ${r.summary.reconciledReport.uniqueVenues}`);
      console.log(`      Coordinators: ${r.summary.reconciledReport.coordinatorsCount}, Champions: ${r.summary.reconciledReport.championsCount}`);
      console.log(`      Venue Rows: ${r.centres.length}`);
    } catch (err: any) {
      console.error(`  FAIL: Exception generating report for ${s}:`, err);
      passed = false;
    }
  }

  // Test 4: All 28 States/UTs report generation and accounting identity check
  console.log("\n[Test 4] Generate reports for all 28 locked States/UTs & verify accounting identities:");
  const lockedStates = getLockedCensusStateList();
  let totalBaselineCourses = 0;
  let totalBaselineVenues = 0;
  let totalBaselineTrained = 0;
  let totalDraftCourses = 0;
  let totalDraftVenues = 0;
  let totalDraftTrained = 0;
  let totalCertified = 0;
  let totalIncremental = 0;
  let totalReviewRequired = 0;

  for (const s of lockedStates) {
    const r = getCPRDayReconciliationReport(s.canonicalState);
    if (!r) {
      console.error(`  FAIL: Missing report for ${s.canonicalState}`);
      passed = false;
      continue;
    }

    // Verify accounting identity
    // Reconciled Trained = Baseline Reported Trained + confirmedNewIncrementalParticipants
    const bTrained = r.summary.baseline.reportedTrained;
    const totalInc = r.summary.reconciliation.confirmedNewIncrementalParticipants;
    const recTrained = r.summary.reconciledReport.participantsTrained;
    const expectedRecTrained = bTrained + totalInc;

    if (recTrained !== expectedRecTrained) {
      console.error(`  FAIL: Accounting identity mismatch for ${s.canonicalState}: ${recTrained} !== ${expectedRecTrained}`);
      passed = false;
    }

    totalBaselineCourses += r.summary.baseline.courses;
    totalBaselineVenues += r.summary.baseline.uniqueVenues;
    totalBaselineTrained += bTrained;
    totalDraftCourses += r.summary.reconciledReport.coursesConducted;
    totalDraftVenues += r.summary.reconciledReport.uniqueVenues;
    totalDraftTrained += recTrained;
    totalCertified += r.summary.liveData.participantCertificatesFound;
    totalIncremental += totalInc;
    totalReviewRequired += r.summary.reconciliation.reviewVenues;
  }
  console.log(`  All 28 States processed successfully. Total incremental: +${totalIncremental.toLocaleString()}`);

  // Test 5: National Consolidated Report
  console.log("\n[Test 5] National Consolidated Report Verification:");
  try {
    const nat = getCPRDayNationalConsolidatedReport();
    console.log(`  - Baseline Courses: ${nat.summary.baseline.courses} (Expected: 391)`);
    console.log(`  - Baseline Physical Venues: ${nat.summary.baseline.uniqueVenues} (Expected: 288)`);
    console.log(`  - Baseline Trained: ${nat.summary.baseline.reportedTrained.toLocaleString()} (Expected: 43,636)`);
    console.log(`  - Draft Courses: ${nat.summary.reconciledReport.coursesConducted} (Expected: 395)`);
    console.log(`  - Draft Physical Venues: ${nat.summary.reconciledReport.uniqueVenues} (Expected: 292)`);
    console.log(`  - Draft Reconciled Trained: ${nat.summary.reconciledReport.participantsTrained.toLocaleString()} (Expected: 47,033)`);
    console.log(`  - Participants Certified: ${nat.summary.reconciledReport.participantsCertified.toLocaleString()} (Expected: 33,477)`);
    console.log(`  - Total Increment: +${nat.summary.reconciliation.confirmedNewIncrementalParticipants.toLocaleString()} (Expected: +3,397)`);
    console.log(`  - Review Required Groups: ${nat.summary.reconciliation.reviewVenues} (Expected: 1)`);

    if (nat.summary.baseline.courses !== 391) { console.error("  FAIL: Baseline courses mismatch"); passed = false; }
    if (nat.summary.baseline.uniqueVenues !== 288) { console.error("  FAIL: Baseline venues mismatch"); passed = false; }
    if (nat.summary.baseline.reportedTrained !== 43636) { console.error("  FAIL: Baseline trained mismatch"); passed = false; }
    if (nat.summary.reconciledReport.coursesConducted !== 395) { console.error("  FAIL: Draft courses mismatch"); passed = false; }
    if (nat.summary.reconciledReport.uniqueVenues !== 292) { console.error("  FAIL: Draft venues mismatch"); passed = false; }
    if (nat.summary.reconciledReport.participantsTrained !== 47033) { console.error("  FAIL: Draft trained mismatch"); passed = false; }
    if (nat.summary.reconciledReport.participantsCertified !== 33477) { console.error("  FAIL: Certified mismatch"); passed = false; }
    if (nat.summary.reconciliation.confirmedNewIncrementalParticipants !== 3397) { console.error("  FAIL: Incremental mismatch"); passed = false; }
    if (nat.summary.reconciliation.reviewVenues !== 1) { console.error("  FAIL: Review groups mismatch"); passed = false; }
  } catch (err: any) {
    console.error("  FAIL: Exception calling getCPRDayNationalConsolidatedReport:", err);
    passed = false;
  }

  // Test 6: Snapshot file integrity
  console.log("\n[Test 6] Snapshot File Integrity Check:");
  const snapshotPath = path.join(process.cwd(), "data", "cpr_census_draft_v1_snapshot.json");
  if (fs.existsSync(snapshotPath)) {
    const snapshotContent = JSON.parse(fs.readFileSync(snapshotPath, "utf-8"));
    console.log(`  - Snapshot Version: ${snapshotContent.versionIdentifier}`);
    console.log(`  - Snapshot Reconciled Trained: ${snapshotContent.nationalTotals?.draftReconciledParticipantsTrained}`);
    console.log(`  - Snapshot Baseline Trained: ${snapshotContent.nationalTotals?.baselineParticipantsTrained}`);
    console.log(`  - Snapshot Reconciled Courses: ${snapshotContent.nationalTotals?.currentDraftCourses}`);
    console.log(`  - Snapshot Reconciled Venues: ${snapshotContent.nationalTotals?.currentDraftPhysicalVenues}`);
    console.log(`  - Snapshot Certified: ${snapshotContent.nationalTotals?.participantsCertified}`);

    if (
      snapshotContent.versionIdentifier === "CPRDAY_CENSUS_DRAFT_V1" &&
      snapshotContent.nationalTotals?.draftReconciledParticipantsTrained === 47033 &&
      snapshotContent.nationalTotals?.baselineParticipantsTrained === 43636 &&
      snapshotContent.nationalTotals?.currentDraftCourses === 395 &&
      snapshotContent.nationalTotals?.currentDraftPhysicalVenues === 292 &&
      snapshotContent.nationalTotals?.participantsCertified === 33477 &&
      snapshotContent.nationalTotals?.existingVenuePositiveIncrement === 2462 &&
      snapshotContent.nationalTotals?.confirmedSupplementaryIncrement === 935
    ) {
      console.log("  PASS: Snapshot integrity verified.");
    } else {
      console.error("  FAIL: Snapshot values mismatch!");
      passed = false;
    }
  } else {
    console.error("  FAIL: Snapshot file not found!");
    passed = false;
  }

  console.log("\n==================================================================");
  if (passed) {
    console.log("ALL FIX 4K.1 TESTS PASSED SUCCESSFULLY!");
  } else {
    console.error("SOME TESTS FAILED. PLEASE INSPECT LOGS.");
    process.exit(1);
  }
  console.log("==================================================================");
}

runTests();
