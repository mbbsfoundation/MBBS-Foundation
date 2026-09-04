import { getCPRDayReconciliationReport } from "../lib/cprReporting";
import {
  getNormalizedCoordinatorsForDisplay,
  formatCoordinatorDisplayName,
  saveVerificationSubmissionAsync,
  loadAllVerificationsAsync,
  updateVerificationStatusAsync,
  slugToCanonicalState,
} from "../lib/cprVerificationStore";
import { prisma } from "../lib/prisma";
import { getLockedCensusStateList } from "../lib/cprStateCensus";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ [FAIL] ${message}`);
    throw new Error(message);
  }
  console.log(`  ✓ [PASS] ${message}`);
}

async function runStep4MTestSuite() {
  console.log("\n" + "=".repeat(80));
  console.log("STEP 4M COMPREHENSIVE TEST SUITE: STATE REPORT VERIFICATION & POSTGRESQL");
  console.log("=".repeat(80) + "\n");

  let passedTests = 0;

  // -------------------------------------------------------------------------
  // TEST GROUP 1: Public Report Data Structure & Identity
  // -------------------------------------------------------------------------
  console.log("--- TEST GROUP 1: Report Structure & Full State Report Visibility ---");
  const mhReport = getCPRDayReconciliationReport("Maharashtra");
  assert(mhReport !== null, "Maharashtra report loaded successfully");
  assert(Array.isArray(mhReport?.centres), "Maharashtra report contains centres array");
  assert(mhReport!.centres.length === 42, `Maharashtra has 42 reconciled centre rows (got: ${mhReport!.centres.length})`);
  assert(mhReport!.canonicalState === "Maharashtra", "Canonical state is Maharashtra");
  assert(mhReport!.stateCode === "MH", "State code is MH");
  assert(mhReport!.zone === "West Zone", "Zone is West Zone");
  passedTests += 6;

  // -------------------------------------------------------------------------
  // TEST GROUP 2: The Dr Gayatri Bhide / Alankar Hall Explicit Test
  // -------------------------------------------------------------------------
  console.log("\n--- TEST GROUP 2: Dr Gayatri Bhide & Alankar Hall Case (Dedup & Single Row) ---");
  const alankarRows = mhReport!.centres.filter((c) =>
    c.venue.toLowerCase().includes("alankar")
  );
  assert(alankarRows.length === 2, `Maharashtra has 2 distinct Alankar entries: Police Academy and Alankaran Hall (got: ${alankarRows.length})`);

  const alankaranHall = alankarRows.find((c) => c.venue.toUpperCase().includes("ALANKARAN HALL"));
  assert(alankaranHall !== undefined, "Alankaran Hall entry exists");
  assert(alankaranHall!.coursesCount === 4, `Alankaran Hall has 4 consolidated courses (got: ${alankaranHall!.coursesCount})`);
  assert(
    (alankaranHall!.projectedTotal ?? alankaranHall!.baselineParticipants) === 700,
    `Alankaran Hall represents 700 trained participants (got: ${alankaranHall!.projectedTotal ?? alankaranHall!.baselineParticipants})`
  );

  // Test coordinator name display normalization
  const sampleRawCoordinators = [
    "Dr Gayatri Bhide",
    "DR. GAYATRI BHIDE",
    "Dr. Gayatri Bhide",
    "Dr Sagar Lad",
    "DR. SAGAR LAD",
    "Dr Sanjay Bafna",
  ];
  const normalizedDisplayList = getNormalizedCoordinatorsForDisplay(sampleRawCoordinators);
  assert(
    normalizedDisplayList.length === 3,
    `6 raw coordinator variants deduplicated into exactly 3 displayed names (got: ${normalizedDisplayList.length})`
  );
  assert(
    normalizedDisplayList.includes("Dr Gayatri Bhide"),
    "Deduplicated list contains 'Dr Gayatri Bhide'"
  );
  assert(
    normalizedDisplayList.includes("Dr Sagar Lad"),
    "Deduplicated list contains 'Dr Sagar Lad'"
  );
  assert(
    normalizedDisplayList.includes("Dr Sanjay Bafna"),
    "Deduplicated list contains 'Dr Sanjay Bafna'"
  );
  passedTests += 8;

  // -------------------------------------------------------------------------
  // TEST GROUP 3: Multi-State Report Completeness
  // -------------------------------------------------------------------------
  console.log("\n--- TEST GROUP 3: Representative State Sampling ---");
  const mpReport = getCPRDayReconciliationReport("Madhya Pradesh");
  assert(mpReport !== null && mpReport.centres.length === 41, `Madhya Pradesh has 41 centres (got: ${mpReport?.centres.length})`);

  const wbReport = getCPRDayReconciliationReport("West Bengal");
  assert(wbReport !== null && wbReport.centres.length === 27, `West Bengal has 27 centres (got: ${wbReport?.centres.length})`);

  const anReport = getCPRDayReconciliationReport("Andaman & Nicobar Islands");
  assert(anReport !== null && anReport.centres.length === 2, `Andaman & Nicobar has 2 centres (got: ${anReport?.centres.length})`);

  const skReport = getCPRDayReconciliationReport("Sikkim");
  assert(skReport !== null && skReport.centres.length === 1, `Sikkim has 1 centre (got: ${skReport?.centres.length})`);
  passedTests += 4;

  // -------------------------------------------------------------------------
  // TEST GROUP 4: PostgreSQL Database CRUD Operations
  // -------------------------------------------------------------------------
  console.log("\n--- TEST GROUP 4: PostgreSQL Prisma Persistence & CRUD ---");
  const testMobile = "9876543210";
  const testState = "Maharashtra";

  // 1. Create submission
  const newSub = await saveVerificationSubmissionAsync({
    submissionType: "VERIFY_CORRECT",
    state: testState,
    stateCode: "MH",
    reportRowId: "374, 380, 381, 382",
    canonicalVenueId: "CANON-MH-ALANKAR",
    venue: "ALANKARAN HALL",
    city: "Pune",
    mappedCoordinatorName: "Dr Gayatri Bhide",
    submittedByName: "Dr Gayatri Bhide",
    submittedByMobile: testMobile,
    submittedByEmail: "drgayatri@example.com",
    identityStatus: "MAPPED_COORDINATOR_MATCHED",
    currentDataJson: {
      venue: "ALANKARAN HALL",
      city: "Pune",
      coursesCount: 4,
      participantsTrained: 700,
    },
    correctionNote: "[TEST_STEP_4M] Automated verification test record",
  });

  assert(newSub.id.startsWith("VERIF-"), `New submission created with ID ${newSub.id}`);
  assert(newSub.submissionStatus === "PENDING_ADMIN_REVIEW", "Initial status is PENDING_ADMIN_REVIEW");

  // 2. Query from PostgreSQL
  const loadedList = await loadAllVerificationsAsync({ state: testState });
  const fetchedSub = loadedList.find((s) => s.id === newSub.id);
  assert(fetchedSub !== undefined, "Submission found in PostgreSQL query");
  assert(fetchedSub!.venue === "ALANKARAN HALL", `Retrieved venue matches 'ALANKARAN HALL' (got: ${fetchedSub?.venue})`);
  assert(fetchedSub!.reportRowId === "374, 380, 381, 382", "Report row ID preserved in PostgreSQL");

  // 3. Update status in PostgreSQL
  const updatedSub = await updateVerificationStatusAsync(newSub.id, {
    status: "ACCEPTED",
    adminReviewedBy: "Administrator",
    adminNote: "Verified against State Programme roster",
  });
  assert(updatedSub !== null, "Submission updated successfully in PostgreSQL");
  assert(updatedSub!.submissionStatus === "ACCEPTED", "Updated status is ACCEPTED");
  assert(updatedSub!.adminDecision === "ACCEPTED", "adminDecision recorded as ACCEPTED");

  // 4. Clean up test submission from PostgreSQL
  await prisma.cPRVerificationSubmission.delete({
    where: { id: newSub.id },
  });
  const afterDelete = await loadAllVerificationsAsync({ state: testState });
  assert(!afterDelete.some((s) => s.id === newSub.id), "Test submission safely removed from PostgreSQL");
  passedTests += 9;

  // -------------------------------------------------------------------------
  // TEST GROUP 5: Frozen Census & Draft V1 Accounting Invariants
  // -------------------------------------------------------------------------
  console.log("\n--- TEST GROUP 5: Frozen Draft V1 Invariant Safety Check ---");
  const allStates = getLockedCensusStateList();
  assert(allStates.length === 28, `Authoritative locked States count = 28 (got: ${allStates.length})`);

  let sumDraftCourses = 0;
  let sumDraftTrained = 0;
  let sumDraftCertified = 0;

  for (const s of allStates) {
    const rep = getCPRDayReconciliationReport(s.canonicalState);
    assert(rep !== null, `Report for ${s.canonicalState} loads cleanly`);
    sumDraftCourses += rep!.summary.reconciledReport.coursesConducted;
    sumDraftTrained += rep!.summary.reconciledReport.participantsTrained;
    sumDraftCertified += rep!.summary.liveData.participantCertificatesFound;
  }

  assert(sumDraftCourses === 395, `National Draft Courses = 395 (got: ${sumDraftCourses})`);
  assert(sumDraftTrained === 47033, `National Draft Reconciled Trained = 47,033 (got: ${sumDraftTrained})`);
  assert(sumDraftCertified === 33477, `National Participants Certified = 33,477 (got: ${sumDraftCertified})`);
  passedTests += 32;

  console.log("\n" + "=".repeat(80));
  console.log(`STEP 4M TEST SUITE RESULT: ${passedTests} / ${passedTests} PASSED (100%)`);
  console.log("=".repeat(80) + "\n");
}

runStep4MTestSuite().catch((err) => {
  console.error("Test suite failed:", err);
  process.exit(1);
});
