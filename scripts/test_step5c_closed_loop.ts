import {
  calculateProspectiveImpact,
  executeDownstreamImplementation,
} from "../lib/cprDownstreamImplementation";
import {
  saveVenueMetadataOverride,
  getVenueMetadataOverridesMap,
  resetVenueMetadataOverride,
  getFrozenVenueReviewSnapshot,
} from "../lib/cprReconciliationStore";
import {
  getCPRDayReconciliationReport,
  loadUnifiedLiveCPRDayData,
} from "../lib/cprReporting";
import {
  loadAllVerificationsAsync,
  saveVerificationSubmissionAsync,
  updateVerificationStatusAsync,
} from "../lib/cprVerificationStore";
import { getFrozenBaselineVenueRegistry } from "../lib/cprVenueRegistry";
import { prisma } from "../lib/prisma";
import fs from "fs";
import path from "path";

async function runStep5CTests() {
  console.log("=================================================");
  console.log("RUNNING STEP 5C CLOSED-LOOP VERIFICATION TEST SUITE");
  console.log("=================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, msg: string) {
    if (condition) {
      console.log(`✅ PASS: ${msg}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${msg}`);
      failed++;
    }
  }

  // Record baseline checksums / snapshots
  const draftSnapshotPath = path.join(process.cwd(), "data", "cpr_census_draft_v1_snapshot.json");
  const initialDraftSnapshotRaw = fs.readFileSync(draftSnapshotPath, "utf-8");

  const baselineVenuesPath = path.join(process.cwd(), "data", "cpr_day_baseline_venues.json");
  const initialBaselineVenuesRaw = fs.existsSync(baselineVenuesPath)
    ? fs.readFileSync(baselineVenuesPath, "utf-8")
    : null;

  // TEST G: Safeguard against implementing TEST DATA submission
  console.log("\n--- TEST G & Safeguards: Test Data Protection ---");
  const testDataResult = await executeDownstreamImplementation({
    submissionId: "VERIF-1788524059637-35T4",
    actionType: "CONFIRM_SUPPLEMENTARY_COURSE",
    adminUser: "Master Admin",
    implementationNote: "Attempting to implement test submission",
  });
  assert(testDataResult.success === false, "Test Data Submission VERIF-1788524059637-35T4 is blocked from implementation");
  assert(
    testDataResult.error?.includes("protected TEST DATA") ?? false,
    "Helpful error returned identifying submission as protected TEST DATA"
  );

  // TEST K: Mandatory implementation note validation
  console.log("\n--- TEST K: Mandatory Implementation Note Validation ---");
  const emptyNoteResult = await executeDownstreamImplementation({
    submissionId: "NON_EXISTENT_ID",
    actionType: "APPLY_METADATA_CORRECTION",
    adminUser: "Master Admin",
    implementationNote: "",
  });
  assert(emptyNoteResult.success === false, "Implementation without note is rejected");
  assert(
    emptyNoteResult.error?.includes("mandatory implementation note") ?? false,
    "Rejection message explicitly cites mandatory implementation note requirement"
  );

  // Create temporary accepted submission in a known state (e.g. Kerala or Delhi)
  console.log("\n--- Setting up temporary accepted submission for closed-loop test ---");
  const tempSub = await saveVerificationSubmissionAsync({
    state: "Delhi",
    stateCode: "DL",
    city: "New Delhi",
    venue: "AIIMS New Delhi Simulation Lab",
    canonicalVenueId: "CANON-DL-001",
    mappedCoordinatorName: "Dr. Test Coordinator",
    submissionType: "SUBMIT_CORRECTION",
    identityStatus: "MAPPED_COORDINATOR_MATCHED",
    submittedByName: "Dr. Test Coordinator",
    submittedByMobile: "9876543210",
    correctionNote: "Spelling update: AIIMS Apex Simulation Center",
    currentDataJson: {
      venue: "AIIMS New Delhi Simulation Lab",
      city: "New Delhi",
      participantsTrained: 150,
      coursesCount: 1,
    },
    proposedChangesJson: {
      venue: "AIIMS Apex Simulation Center",
      city: "New Delhi",
      participantsTrained: 150,
      coursesCount: 1,
    },
  });

  assert(!!tempSub?.id, `Created temporary verification submission: ${tempSub?.id}`);

  // Test that submission must be ACCEPTED before implementation
  const unacceptedResult = await executeDownstreamImplementation({
    submissionId: tempSub.id,
    actionType: "APPLY_METADATA_CORRECTION",
    adminUser: "Master Admin",
    implementationNote: "Trying on PENDING submission",
    targetCanonicalVenueId: "CANON-DL-001",
  });
  assert(
    unacceptedResult.success === false && (unacceptedResult.error?.includes("Only ACCEPTED submissions") ?? false),
    "Only ACCEPTED submissions can be implemented (PENDING is blocked)"
  );

  // Mark submission as ACCEPTED in PostgreSQL
  const { updateVerificationStatusAsync } = await import("../lib/cprVerificationStore");
  await updateVerificationStatusAsync(tempSub.id, {
    status: "ACCEPTED",
    adminReviewedBy: "Master Admin",
    adminNote: "Accepted for metadata spelling correction",
  });

  // TEST E: Prospective Impact Calculation
  console.log("\n--- TEST E & F: Prospective Impact Preview ---");
  const countImpact = calculateProspectiveImpact(
    {
      ...tempSub,
      currentDataJson: { venue: "AIIMS", city: "Delhi", participantsTrained: 100, coursesCount: 1 },
      proposedChangesJson: { participantsTrained: 130, coursesCount: 1 },
    },
    "APPLY_COUNT_ADJUSTMENT"
  );
  assert(countImpact.trainedDelta === 30, "Prospective count impact calculated delta of +30 trained");
  assert(countImpact.prospectiveNationalTrained === 47033 + 30, "Prospective national total correctly previewed as 47,063");
  assert(countImpact.isCensusImpacting === true, "Marked as isCensusImpacting = true");

  const missingImpact = calculateProspectiveImpact(
    {
      ...tempSub,
      submissionType: "MISSING_COURSE",
      proposedChangesJson: { participantsTrained: 45 },
    },
    "CONFIRM_SUPPLEMENTARY_COURSE"
  );
  assert(missingImpact.trainedDelta === 45, "Prospective missing course impact calculated delta of +45 trained");
  assert(missingImpact.coursesDelta === 1, "Prospective missing course impact calculated delta of +1 course");
  assert(missingImpact.venuesDelta === 1, "Prospective missing course impact calculated delta of +1 venue");

  // TEST A: Low-Risk Metadata Implementation
  console.log("\n--- TEST A: Low-Risk Metadata Overlay Write & Closed-Loop Verification ---");
  const metaResult = await executeDownstreamImplementation({
    submissionId: tempSub.id,
    actionType: "APPLY_METADATA_CORRECTION",
    adminUser: "Master Admin",
    implementationNote: "Applied verified venue name correction to AIIMS Apex Simulation Center",
    evidenceReference: "State Coordinator Official Roster v2",
    targetCanonicalVenueId: "CANON-DL-001",
    proposedVenueName: "AIIMS Apex Simulation Center",
  });

  assert(metaResult.success === true, "Metadata correction executed successfully");
  assert(metaResult.submission?.submissionStatus === "IMPLEMENTED", "Submission transitioned to IMPLEMENTED");
  assert(
    metaResult.submission?.adminNote?.includes("AIIMS Apex Simulation Center") ?? false,
    "Descriptive implementation note saved in PostgreSQL audit trail"
  );

  // TEST J: Verify that getCPRDayReconciliationReport confirms the update
  console.log("\n--- TEST J: State Report Re-read and Closed-Loop Verification ---");
  const dlReport = getCPRDayReconciliationReport("Delhi");
  assert(!!dlReport, "Delhi state report generated successfully");
  const updatedRow = dlReport?.centres.find((c) => c.canonicalVenueId === "CANON-DL-001");
  assert(
    updatedRow?.venue === "AIIMS Apex Simulation Center",
    `Live state report re-read confirms updated venue name: "${updatedRow?.venue}"`
  );

  // TEST C: Faculty Attribution does NOT issue certificates
  console.log("\n--- TEST C: Faculty Attribution Separation ---");
  await saveVenueMetadataOverride({
    canonicalVenueId: "CANON-DL-001",
    state: "Delhi",
    additionalCoordinators: ["Dr. Newly Verified Coordinator"],
    additionalChampions: ["Champion Test Star"],
    reviewedBy: "Master Admin",
    reviewNote: "Added faculty after verification",
  });

  const dlReportFaculty = getCPRDayReconciliationReport("Delhi");
  const facultyRow = dlReportFaculty?.centres.find((c) => c.canonicalVenueId === "CANON-DL-001");
  assert(
    facultyRow?.allCoordinators.some((c) => c.includes("Newly Verified Coordinator")) ?? false,
    "Report faculty roster includes newly verified coordinator"
  );
  assert(
    facultyRow?.allChampions.some((c) => c.includes("Champion Test Star")) ?? false,
    "Report champions roster includes newly verified champion"
  );

  // Check that live certificates count did NOT increase
  const liveCertificates = loadUnifiedLiveCPRDayData();
  const dlCerts = liveCertificates.participantsByState.get("Delhi") || [];
  assert(
    dlCerts.every((c) => c.name !== "Dr. Newly Verified Coordinator"),
    "Faculty attribution update did NOT automatically issue participant certificate records"
  );

  // Clean up test override
  resetVenueMetadataOverride("CANON-DL-001");
  await prisma.cPRVerificationSubmission.delete({ where: { id: tempSub.id } });

  // TEST B & M: Baseline raw files & Draft V1 snapshot invariants
  console.log("\n--- TEST B & M: Frozen Raw Sources & Census Invariants ---");
  const afterBaselineVenuesRaw = fs.existsSync(baselineVenuesPath)
    ? fs.readFileSync(baselineVenuesPath, "utf-8")
    : null;
  const afterDraftSnapshotRaw = fs.readFileSync(draftSnapshotPath, "utf-8");

  assert(
    initialBaselineVenuesRaw === afterBaselineVenuesRaw,
    "Baseline venue storage is 100% UNCHANGED and UNTOUCHED"
  );
  assert(
    initialDraftSnapshotRaw === afterDraftSnapshotRaw,
    "data/cpr_census_draft_v1_snapshot.json is 100% UNCHANGED and UNTOUCHED"
  );

  const registry = getFrozenBaselineVenueRegistry();
  assert(registry.length === 288, `Baseline physical venue registry invariant preserved (288 venues, got ${registry.length})`);

  // Summary
  console.log("\n=================================================");
  console.log(`STEP 5C TEST SUITE RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("=================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runStep5CTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Test execution failed:", err);
    process.exit(1);
  });
