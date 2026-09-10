import {
  saveVerificationSubmissionAsync,
  updateVerificationStatusAsync,
  loadAllVerificationsAsync,
} from "../lib/cprVerificationStore";
import { executeDownstreamImplementation } from "../lib/cprDownstreamImplementation";
import { getCPRDayReconciliationReport } from "../lib/cprReporting";
import { resetVenueMetadataOverride } from "../lib/cprReconciliationStore";
import { prisma } from "../lib/prisma";

async function runCPRVerifyFix01Test() {
  console.log("================================================================================");
  console.log("TEST SUITE: CPR-VERIFY-FIX-01 (MARK IMPLEMENTED DOWNSTREAM WORKFLOW)");
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

  try {
    // -------------------------------------------------------------------------
    // TEST 1: PENDING record cannot become IMPLEMENTED directly
    // -------------------------------------------------------------------------
    console.log("--- TEST 1: PENDING Status Guard ---");
    const sub1 = await saveVerificationSubmissionAsync({
      state: "Maharashtra",
      stateCode: "MH",
      city: "Mumbai",
      venue: "Test Hospital Mumbai",
      canonicalVenueId: "CANON-MH-001",
      mappedCoordinatorName: "Dr. Test Lead",
      submissionType: "SUBMIT_CORRECTION",
      identityStatus: "MAPPED_COORDINATOR_MATCHED",
      submittedByName: "Dr. Test Lead",
      submittedByMobile: "9876543210",
      correctionNote: "Spelling update",
      currentDataJson: {
        venue: "Test Hospital Mumbai",
        city: "Mumbai",
        participantsTrained: 100,
      },
      proposedChangesJson: {
        venue: "Test Memorial Hospital Mumbai",
        city: "Mumbai",
      },
    });

    assert(sub1.submissionStatus === "PENDING_ADMIN_REVIEW", "New submission starts in PENDING_ADMIN_REVIEW");

    const pendingImplResult = await executeDownstreamImplementation({
      submissionId: sub1.id,
      actionType: "APPLY_METADATA_CORRECTION",
      adminUser: "Administrator",
      implementationNote: "Attempting to implement PENDING submission",
    });

    assert(pendingImplResult.success === false, "PENDING submission cannot be implemented");
    assert(
      pendingImplResult.error?.includes("Only ACCEPTED submissions") ?? false,
      "Helpful error returned indicating only ACCEPTED submissions can be implemented"
    );

    // -------------------------------------------------------------------------
    // TEST 2: REJECTED record cannot become IMPLEMENTED
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 2: REJECTED Status Guard ---");
    await updateVerificationStatusAsync(sub1.id, {
      status: "REJECTED",
      adminReviewedBy: "Administrator",
      adminNote: "Rejected due to invalid evidence",
    });

    const rejectedImplResult = await executeDownstreamImplementation({
      submissionId: sub1.id,
      actionType: "APPLY_METADATA_CORRECTION",
      adminUser: "Administrator",
      implementationNote: "Attempting to implement REJECTED submission",
    });

    assert(rejectedImplResult.success === false, "REJECTED submission cannot be implemented");
    assert(
      rejectedImplResult.error?.includes("Only ACCEPTED submissions") ?? false,
      "Helpful error returned: Only ACCEPTED submissions can be implemented"
    );

    // -------------------------------------------------------------------------
    // TEST 3: ACCEPTED submission -> MARK IMPLEMENTED workflow
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 3: ACCEPTED -> IMPLEMENTED Workflow ---");
    // Accept submission
    const acceptedSub = await updateVerificationStatusAsync(sub1.id, {
      status: "ACCEPTED",
      adminReviewedBy: "Administrator",
      adminNote: "Accepted by administrator for metadata update",
    });

    assert(acceptedSub?.submissionStatus === "ACCEPTED", "Submission is now in ACCEPTED status");

    // Execute downstream implementation
    const implResult = await executeDownstreamImplementation({
      submissionId: sub1.id,
      actionType: "APPLY_METADATA_CORRECTION",
      adminUser: "Administrator",
      implementationNote: "Applied verified venue name correction to Test Memorial Hospital Mumbai",
      evidenceReference: "Official letter Ref 2026/09/01",
      targetCanonicalVenueId: "CANON-MH-001",
      proposedVenueName: "Test Memorial Hospital Mumbai",
    });

    assert(implResult.success === true, "executeDownstreamImplementation returns success = true");
    assert(implResult.submission?.submissionStatus === "IMPLEMENTED", "Submission transitioned to IMPLEMENTED status");
    assert(
      implResult.submission?.adminNote?.includes("Test Memorial Hospital Mumbai") ?? false,
      "Admin implementation audit note preserved"
    );

    // Verify in State Report
    const mhReport = getCPRDayReconciliationReport("Maharashtra");
    assert(!!mhReport, "Maharashtra State Report generated successfully");
    const updatedVenue = mhReport?.centres.find((c) => c.canonicalVenueId === "CANON-MH-001");
    assert(
      updatedVenue?.venue === "Test Memorial Hospital Mumbai",
      `Downstream State Report reflects updated venue name: "${updatedVenue?.venue}"`
    );

    // -------------------------------------------------------------------------
    // TEST 4: Idempotency Protection
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 4: Idempotency Protection on Duplicate Implementation ---");
    const secondImplResult = await executeDownstreamImplementation({
      submissionId: sub1.id,
      actionType: "APPLY_METADATA_CORRECTION",
      adminUser: "Administrator",
      implementationNote: "Duplicate retry of implementation",
      targetCanonicalVenueId: "CANON-MH-001",
      proposedVenueName: "Test Memorial Hospital Mumbai",
    });

    assert(secondImplResult.success === true, "Second implementation call succeeds idempotently");
    assert(secondImplResult.submission?.submissionStatus === "IMPLEMENTED", "Status remains IMPLEMENTED");

    // Clean up
    resetVenueMetadataOverride("CANON-MH-001");
    if (prisma && (prisma as any).cPRVerificationSubmission) {
      await (prisma as any).cPRVerificationSubmission.delete({ where: { id: sub1.id } }).catch(() => {});
    }

  } catch (error: any) {
    console.error("Unexpected error in test suite:", error);
    assert(false, "Test suite encountered an error", error.message);
  }

  console.log("\n================================================================================");
  console.log(`TEST SUITE RESULT: ${passedTests} / ${totalTests} PASSED`);
  console.log("================================================================================\n");

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runCPRVerifyFix01Test();
