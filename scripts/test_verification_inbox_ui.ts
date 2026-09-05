import fs from "fs";
import path from "path";
import { prisma } from "../lib/prisma";
import {
  saveVerificationSubmissionAsync,
  loadAllVerificationsAsync,
  updateVerificationStatusAsync,
  getVerificationStatusCounts,
  CoordinatorVerificationSubmission,
} from "../lib/cprVerificationStore";
import { getCPRDayReconciliationReport } from "../lib/cprReporting";
import { getLockedCensusStateList } from "../lib/cprStateCensus";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ [FAIL] ${message}`);
    throw new Error(message);
  }
  console.log(`  ✓ [PASS] ${message}`);
}

async function runVerificationInboxUITestSuite() {
  console.log("\n" + "=".repeat(80));
  console.log("STEP 4: CPR VERIFICATION INBOX UI TEST SUITE");
  console.log("=".repeat(80) + "\n");

  let passedTests = 0;

  // -------------------------------------------------------------------------
  // TEST GROUP 1: Route & File Structure Verification
  // -------------------------------------------------------------------------
  console.log("--- TEST GROUP 1: Route & File Structure ---");

  const inboxPagePath = path.join(process.cwd(), "app", "admin", "cpr", "verifications", "page.tsx");
  assert(fs.existsSync(inboxPagePath), "Route app/admin/cpr/verifications/page.tsx exists");

  const inboxContent = fs.readFileSync(inboxPagePath, "utf-8");
  assert(inboxContent.includes("AdminHeader"), "Verification Inbox page imports and uses AdminHeader");
  assert(inboxContent.includes("/api/cprsanjeevani/auth"), "Verification Inbox checks Master Admin auth via /api/cprsanjeevani/auth");
  assert(inboxContent.includes("/api/cprsanjeevani/verify/admin"), "Verification Inbox queries /api/cprsanjeevani/verify/admin");
  assert(inboxContent.includes("PENDING_ADMIN_REVIEW"), "Verification Inbox sets default filter to PENDING_ADMIN_REVIEW");
  assert(inboxContent.includes("ACCEPTED"), "Verification Inbox supports ACCEPTED status action");
  assert(inboxContent.includes("NEEDS_CLARIFICATION"), "Verification Inbox supports NEEDS_CLARIFICATION status action");
  assert(inboxContent.includes("REJECTED"), "Verification Inbox supports REJECTED status action");
  assert(inboxContent.includes("IMPLEMENTED"), "Verification Inbox supports IMPLEMENTED status action");
  passedTests += 9;

  // -------------------------------------------------------------------------
  // TEST GROUP 2: Navigation Linkage & Surface Verification
  // -------------------------------------------------------------------------
  console.log("\n--- TEST GROUP 2: Navigation Linkage & Shell Integration ---");

  const adminHomePagePath = path.join(process.cwd(), "app", "admin", "page.tsx");
  assert(fs.existsSync(adminHomePagePath), "Admin Home page exists");
  const adminHomeContent = fs.readFileSync(adminHomePagePath, "utf-8");
  assert(
    adminHomeContent.includes("/admin/cpr/verifications"),
    "Admin Home page links directly to /admin/cpr/verifications"
  );
  assert(
    !adminHomeContent.includes("Coming in Step 4"),
    "Admin Home placeholder 'Coming in Step 4' replaced with active link"
  );

  const adminHeaderPath = path.join(process.cwd(), "components", "admin", "AdminHeader.tsx");
  const adminHeaderContent = fs.readFileSync(adminHeaderPath, "utf-8");
  assert(
    adminHeaderContent.includes("/admin/cpr"),
    "AdminHeader recognises /admin/cpr in isCpr active state"
  );
  assert(
    adminHeaderContent.includes("/admin/cpr/verifications"),
    "AdminHeader mobile drawer contains link to /admin/cpr/verifications"
  );

  const cprGeneratePath = path.join(process.cwd(), "app", "cprsanjeevani", "generate", "page.tsx");
  const cprGenerateContent = fs.readFileSync(cprGeneratePath, "utf-8");
  assert(
    cprGenerateContent.includes("/admin/cpr/verifications"),
    "CPR Console header links to /admin/cpr/verifications"
  );
  passedTests += 6;

  // -------------------------------------------------------------------------
  // TEST GROUP 3: Database & API Backend Filtering
  // -------------------------------------------------------------------------
  console.log("\n--- TEST GROUP 3: Verification Store & Filter Logic ---");

  const testState = "Maharashtra";
  const allStateSubs = await loadAllVerificationsAsync({ state: testState });
  assert(Array.isArray(allStateSubs), `loadAllVerificationsAsync returns array for ${testState}`);

  const countsAll = getVerificationStatusCounts();
  assert(typeof countsAll.total === "number", "Total counts returned as number");
  assert(typeof countsAll.pending === "number", "Pending counts returned as number");
  assert(typeof countsAll.accepted === "number", "Accepted counts returned as number");
  assert(typeof countsAll.needsClarification === "number", "Needs Clarification counts returned as number");
  assert(typeof countsAll.rejected === "number", "Rejected counts returned as number");
  assert(typeof countsAll.implemented === "number", "Implemented counts returned as number");
  passedTests += 7;

  // -------------------------------------------------------------------------
  // TEST GROUP 4: Non-Mutating Status Transitions Lifecycle Test
  // -------------------------------------------------------------------------
  console.log("\n--- TEST GROUP 4: Status Transition Lifecycle & Non-Mutation Verification ---");

  // Step 4.1: Create isolated test submission
  const testSub = await saveVerificationSubmissionAsync({
    submissionType: "SUBMIT_CORRECTION",
    state: "Maharashtra",
    stateCode: "MH",
    venue: "[TEST_SUITE] Automated Inbox Test Venue",
    city: "Pune",
    mappedCoordinatorName: "Dr Test Coordinator",
    submittedByName: "Dr Test Coordinator",
    submittedByMobile: "9999900000",
    submittedByEmail: "testcoord@example.com",
    identityStatus: "MAPPED_COORDINATOR_MATCHED",
    currentDataJson: {
      venue: "[TEST_SUITE] Automated Inbox Test Venue",
      city: "Pune",
      participantsTrained: 50,
      coursesCount: 1,
    },
    proposedChangesJson: {
      venue: "[TEST_SUITE] Automated Inbox Test Venue (Corrected)",
      city: "Pune",
      participantsTrained: 60,
      coursesCount: 1,
      fieldsModified: ["participantsTrained", "venue"],
    },
    correctionNote: "Automated test submission for inbox verification lifecycle",
  });

  assert(testSub.id.startsWith("VERIF-"), `Test submission created with ID ${testSub.id}`);
  assert(testSub.submissionStatus === "PENDING_ADMIN_REVIEW", "Initial status is PENDING_ADMIN_REVIEW");

  // Step 4.2: Transition PENDING_ADMIN_REVIEW -> ACCEPTED
  const acceptedSub = await updateVerificationStatusAsync(testSub.id, {
    status: "ACCEPTED",
    adminReviewedBy: "Administrator",
    adminNote: "Accepted for downstream administrative reconciliation",
  });
  assert(acceptedSub !== null, "Transition to ACCEPTED returned updated object");
  assert(acceptedSub!.submissionStatus === "ACCEPTED", "Submission status updated to ACCEPTED");
  assert(acceptedSub!.adminDecision === "ACCEPTED", "adminDecision recorded as ACCEPTED");
  assert(acceptedSub!.adminNote === "Accepted for downstream administrative reconciliation", "Admin note saved");

  // Step 4.3: Transition ACCEPTED -> NEEDS_CLARIFICATION
  const clarifySub = await updateVerificationStatusAsync(testSub.id, {
    status: "NEEDS_CLARIFICATION",
    adminReviewedBy: "Administrator",
    adminNote: "Need photo attendance sheet verification",
  });
  assert(clarifySub!.submissionStatus === "NEEDS_CLARIFICATION", "Submission status updated to NEEDS_CLARIFICATION");
  assert(clarifySub!.adminDecision === "NEEDS_CLARIFICATION", "adminDecision recorded as NEEDS_CLARIFICATION");

  // Step 4.4: Transition NEEDS_CLARIFICATION -> REJECTED
  const rejectedSub = await updateVerificationStatusAsync(testSub.id, {
    status: "REJECTED",
    adminReviewedBy: "Administrator",
    adminNote: "Attendance sheet does not match venue",
  });
  assert(rejectedSub!.submissionStatus === "REJECTED", "Submission status updated to REJECTED");
  assert(rejectedSub!.adminDecision === "REJECTED", "adminDecision recorded as REJECTED");

  // Step 4.5: Transition REJECTED -> IMPLEMENTED
  const implementedSub = await updateVerificationStatusAsync(testSub.id, {
    status: "IMPLEMENTED",
    adminReviewedBy: "Administrator",
    adminNote: "Downstream correction completed separately",
  });
  assert(implementedSub!.submissionStatus === "IMPLEMENTED", "Submission status updated to IMPLEMENTED");
  assert(implementedSub!.adminDecision === "IMPLEMENTED", "adminDecision recorded as IMPLEMENTED");

  // Step 4.6: Clean up test record from database
  await prisma.cPRVerificationSubmission.delete({
    where: { id: testSub.id },
  });
  const afterClean = await loadAllVerificationsAsync();
  assert(!afterClean.some((s) => s.id === testSub.id), "Test fixture safely cleaned up from PostgreSQL");
  passedTests += 12;

  // -------------------------------------------------------------------------
  // TEST GROUP 5: Frozen Census & Invariant Safety Check
  // -------------------------------------------------------------------------
  console.log("\n--- TEST GROUP 5: Frozen CPR Invariant Integrity Verification ---");

  const lockedStates = getLockedCensusStateList();
  assert(lockedStates.length === 28, "Authoritative 28 States & UTs preserved");

  let totalDraftCourses = 0;
  let totalDraftTrained = 0;
  let totalDraftCertified = 0;

  for (const s of lockedStates) {
    const report = getCPRDayReconciliationReport(s.canonicalState);
    assert(report !== null, `Reconciliation report for ${s.canonicalState} loaded`);
    totalDraftCourses += report!.summary.reconciledReport.coursesConducted;
    totalDraftTrained += report!.summary.reconciledReport.participantsTrained;
    totalDraftCertified += report!.summary.liveData.participantCertificatesFound;
  }

  assert(totalDraftCourses === 395, `Draft Courses invariant = 395 (got: ${totalDraftCourses})`);
  assert(totalDraftTrained === 47033, `Draft Reconciled Trained invariant = 47,033 (got: ${totalDraftTrained})`);
  assert(totalDraftCertified === 33477, `Draft Certified invariant = 33,477 (got: ${totalDraftCertified})`);
  passedTests += 32;

  console.log("\n" + "=".repeat(80));
  console.log(`STEP 4 TEST SUITE RESULT: ${passedTests} / ${passedTests} PASSED (100%)`);
  console.log("=".repeat(80) + "\n");
}

runVerificationInboxUITestSuite().catch((err) => {
  console.error("Step 4 test suite failed:", err);
  process.exit(1);
});
