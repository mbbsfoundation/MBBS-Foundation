import fs from "fs";
import path from "path";
import { prisma } from "../lib/prisma";
import {
  getCPRDayReconciliationReport,
  getCPRDayReconciliationReportAsync,
  getCPRDayNationalConsolidatedReport,
  getCPRDayNationalConsolidatedReportAsync,
} from "../lib/cprReporting";
import {
  getVenueMetadataOverridesMap,
  getVenueMetadataOverridesMapAsync,
  saveVenueMetadataOverride,
  resetVenueMetadataOverride,
  invalidateVenueMetadataOverridesCache,
  primeVenueMetadataOverridesCache,
  loadFrozenHistoricalMetadataOverrides,
} from "../lib/cprReconciliationStore";
import {
  calculateProspectiveImpact,
  executeDownstreamImplementation,
} from "../lib/cprDownstreamImplementation";
import {
  saveVerificationSubmissionAsync,
  updateVerificationStatusAsync,
  loadAllVerificationsAsync,
} from "../lib/cprVerificationStore";
import { getFrozenBaselineVenueRegistry, getCanonicalVenuesByState } from "../lib/cprVenueRegistry";

async function runPersistenceBridgeTests() {
  console.log("================================================================================");
  console.log("TEST SUITE: PERSISTENT RECONCILIATION BRIDGE & TRAINED-COUNT LOOP (PHASE 12)");
  console.log("================================================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, msg: string) {
    if (condition) {
      console.log(`  ✓ [PASS] ${msg}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${msg}`);
      failed++;
    }
  }

  // 0. Snapshot check: Ensure historical JSON files exist and record baseline modification times
  const draftV1Path = path.join(process.cwd(), "data", "cpr_census_draft_v1_snapshot.json");
  const overridesPath = path.join(process.cwd(), "data", "cpr_venue_metadata_overrides.json");
  const decisionsPath = path.join(process.cwd(), "data", "cpr_venue_reconciliation_decisions.json");

  const initialDraftV1Raw = fs.readFileSync(draftV1Path, "utf-8");
  const initialOverridesMtime = fs.statSync(overridesPath).mtimeMs;
  const initialDraftV1Mtime = fs.statSync(draftV1Path).mtimeMs;

  // TEST 1 & 2: Mathematical correctness of absolute total (600) vs increment (+272)
  console.log("--- 1. Mathematical Model: Baseline 328 + Final 600 -> Delta +272 ---");
  const mhVenues = getCanonicalVenuesByState("Maharashtra");
  const fortisCanon = mhVenues.find((v) => v.canonicalVenueId === "CANON-MH-023");
  assert(!!fortisCanon && fortisCanon.baselineReportedTrained === 328, "CANON-MH-023 baseline reported trained is exactly 328");
  assert(fortisCanon?.baselineCourseCount === 5, "CANON-MH-023 baseline course count is exactly 5");

  const targetTrained = 600;
  const computedDelta = targetTrained - (fortisCanon?.baselineReportedTrained ?? 0);
  assert(computedDelta === 272, "Delta is exactly +272, NOT +600");

  // TEST 3 & 17: Idempotency protection against repeated executions
  console.log("\n--- 2. Idempotency Invariant: Repeated overrides do not double count ---");
  const tempTestOverrideId = "TEST-CANON-MH-099";
  saveVenueMetadataOverride({
    canonicalVenueId: tempTestOverrideId,
    state: "Maharashtra",
    verifiedTrainedAdjustment: 272,
    reviewedBy: "Test Suite",
    reviewNote: "Idempotency test 1",
  });
  // Apply second time
  saveVenueMetadataOverride({
    canonicalVenueId: tempTestOverrideId,
    state: "Maharashtra",
    verifiedTrainedAdjustment: 272,
    reviewedBy: "Test Suite",
    reviewNote: "Idempotency test 2",
  });

  const currentMap = getVenueMetadataOverridesMap();
  const testOverrideEntry = currentMap.get(tempTestOverrideId);
  assert(testOverrideEntry?.verifiedTrainedAdjustment === 272, "Repeated override execution maintains delta = 272 (not 544)");
  resetVenueMetadataOverride(tempTestOverrideId);

  // TEST 4 & 5: State Transition Safety: IMPLEMENTED only after validation
  console.log("\n--- 3. State Transition Safety: Verification before IMPLEMENTED ---");
  // Test 5A: Protected test submission rejection
  const protectedRes = await executeDownstreamImplementation({
    submissionId: "VERIF-1788524059637-35T4",
    actionType: "APPLY_COUNT_ADJUSTMENT",
    adminUser: "Test Admin",
    implementationNote: "Trying protected test data",
    targetCanonicalVenueId: "CANON-MH-023",
  });
  assert(protectedRes.success === false, "Protected test data cannot be implemented");

  // Test 5B: Unaccepted submission rejection
  const tempSub = await saveVerificationSubmissionAsync({
    state: "Maharashtra",
    stateCode: "MH",
    city: "Mumbai",
    venue: "Test Temp Hospital",
    canonicalVenueId: "CANON-MH-023",
    mappedCoordinatorName: "Test Coordinator",
    submissionType: "SUBMIT_CORRECTION",
    identityStatus: "MAPPED_COORDINATOR_MATCHED",
    submittedByName: "Test Coordinator",
    submittedByMobile: "9876543210",
    submissionStatus: "PENDING_ADMIN_REVIEW",
    currentDataJson: { participantsTrained: 328, coursesCount: 5 },
    proposedChangesJson: { participantsTrained: 600, coursesCount: 5 },
  });

  const pendingExecRes = await executeDownstreamImplementation({
    submissionId: tempSub.id,
    actionType: "APPLY_COUNT_ADJUSTMENT",
    adminUser: "Test Admin",
    implementationNote: "Attempting on pending submission",
    targetCanonicalVenueId: "CANON-MH-023",
  });
  assert(pendingExecRes.success === false, "Pending submission is rejected from implementation");

  // Clean up tempSub
  await prisma.cPRVerificationSubmission.delete({ where: { id: tempSub.id } });

  // TEST 6, 7 & 8: PostgreSQL Reading & Zero Filesystem Write Invariant
  console.log("\n--- 4. Persistence Architecture: PostgreSQL Bridge & Zero Runtime File Writes ---");
  const overridesMap = await getVenueMetadataOverridesMapAsync(true);
  assert(overridesMap instanceof Map, "getVenueMetadataOverridesMapAsync returns valid Map");

  const frozenHistorical = loadFrozenHistoricalMetadataOverrides();
  assert(frozenHistorical instanceof Map, "loadFrozenHistoricalMetadataOverrides reads historical frozen source safely");

  const currentOverridesMtime = fs.statSync(overridesPath).mtimeMs;
  assert(initialOverridesMtime === currentOverridesMtime, "Zero runtime filesystem writes occurred to data/cpr_venue_metadata_overrides.json");

  // TEST 9, 10, 11, 12, 13: Full State and National Report Integration
  console.log("\n--- 5. Full Reconciliation Integration: Venue, State, and National Metrics ---");
  const mhReport = await getCPRDayReconciliationReportAsync("Maharashtra", true);
  const fortisRow = mhReport?.venues.find((v) => v.venueId === "CANON-MH-023");

  assert(!!mhReport, "Maharashtra reconciliation report generated successfully");
  assert(fortisRow?.venueId === "CANON-MH-023", "Fortis Hospital Mulund canonical row present in Maharashtra report");
  assert(fortisRow?.baselineCourseCount === 5, "Fortis course count remains 5 (no new course added)");
  assert(fortisRow?.participantsCertified === 0, "Fortis certified count is 0 (no certificates added)");
  assert(fortisRow?.participantsTrained === 600, `Fortis trained count resolved to exactly 600 (got: ${fortisRow?.participantsTrained})`);

  // Maharashtra totals
  assert(mhReport?.summary.reconciledReport.uniqueVenues === 41, `Maharashtra unique venues = 41 (got: ${mhReport?.summary.reconciledReport.uniqueVenues})`);
  assert(mhReport?.summary.reconciledReport.coursesConducted === 50, `Maharashtra courses conducted = 50 (got: ${mhReport?.summary.reconciledReport.coursesConducted})`);
  assert(mhReport?.summary.reconciledReport.participantsCertified === 3219, `Maharashtra certified count = 3,219 (got: ${mhReport?.summary.reconciledReport.participantsCertified})`);
  assert(mhReport?.summary.reconciledReport.participantsTrained === 5937, `Maharashtra participants trained = 5,937 (got: ${mhReport?.summary.reconciledReport.participantsTrained})`);

  // National totals
  const natReport = await getCPRDayNationalConsolidatedReportAsync(true);
  assert(natReport.summary.reconciledReport.uniqueVenues === 292, `National unique physical venues = 292 (got: ${natReport.summary.reconciledReport.uniqueVenues})`);
  assert(natReport.summary.reconciledReport.coursesConducted === 395, `National courses conducted = 395 (got: ${natReport.summary.reconciledReport.coursesConducted})`);
  assert(natReport.summary.reconciledReport.participantsCertified === 33924, `National participants certified = 33,924 (got: ${natReport.summary.reconciledReport.participantsCertified})`);
  assert(natReport.summary.reconciledReport.participantsTrained === 47330, `National participants trained = 47,330 (got: ${natReport.summary.reconciledReport.participantsTrained})`);

  // TEST 14 & 15: Existing Working Certificate Cases Unaffected
  console.log("\n--- 6. Regression Immunity: Kaushalya Hospital & Gulabrao Patil ---");
  const kaushalya = mhReport?.venues.find((v) => v.venueId === "CANON-MH-024");
  assert(!!kaushalya, "Kaushalya Hospital (CANON-MH-024) present");
  assert(kaushalya?.baselineReportedTrained === 104, "Kaushalya baseline reported trained = 104");
  assert(kaushalya?.participantsCertified === 110, "Kaushalya participants certified = 110");
  assert(kaushalya?.participantsTrained === 110, "Kaushalya reconciled participants trained = 110");

  const gulabrao = mhReport?.venues.find((v) => v.venueId === "CANON-MH-039");
  assert(!!gulabrao, "Gulabrao Patil Homoeopathic Medical College (CANON-MH-039) present");
  assert(gulabrao?.baselineReportedTrained === 110, "Gulabrao baseline reported trained = 110");
  assert(gulabrao?.participantsCertified === 110, "Gulabrao participants certified = 110");
  assert(gulabrao?.participantsTrained === 110, "Gulabrao reconciled participants trained = 110");

  // TEST 16: Historical Draft V1 Snapshot Unchanged
  console.log("\n--- 7. Draft V1 Snapshot Invariant ---");
  const afterDraftV1Raw = fs.readFileSync(draftV1Path, "utf-8");
  assert(initialDraftV1Raw === afterDraftV1Raw, "data/cpr_census_draft_v1_snapshot.json is 100% UNCHANGED and FROZEN");
  const draftObj = JSON.parse(afterDraftV1Raw);
  assert(draftObj.nationalTotals.draftReconciledParticipantsTrained === 47033, "Draft V1 trained invariant = 47,033");
  assert(draftObj.nationalTotals.participantsCertified === 33477, "Draft V1 certified invariant = 33,477");

  // TEST 18: VERIFY_CORRECT with zero delta
  console.log("\n--- 8. Zero Delta VERIFY_CORRECT Submission Safety ---");
  const ladakhSub = await prisma.cPRVerificationSubmission.findUnique({
    where: { id: "VERIF-1788594232251-6Y3V" },
  });
  assert(!!ladakhSub, "Ladakh VERIFY_CORRECT submission exists");
  const laReport = await getCPRDayReconciliationReportAsync("Ladakh", true);
  const bagriya = laReport?.venues.find((v) => v.venueId === "CANON-LA-002");
  assert(bagriya?.participantsTrained === 71, "Ladakh CANON-LA-002 participants trained remains 71 (zero delta preserved)");

  // Summary
  console.log("\n================================================================================");
  console.log(`PERSISTENCE BRIDGE TEST SUITE RESULT: ${passed} PASSED, ${failed} FAILED`);
  console.log("================================================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runPersistenceBridgeTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Test execution failed:", err);
    process.exit(1);
  });
