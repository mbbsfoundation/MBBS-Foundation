import {
  slugToCanonicalState,
  stateNameToSlug,
  getDistinctCoordinatorsForState,
  getCoordinatorCoursesForState,
  saveVerificationSubmission,
  loadAllVerifications,
  updateVerificationStatus,
  persistAllVerifications,
} from "../lib/cprVerificationStore";
import { getLockedCensusStateList } from "../lib/cprStateCensus";
import { getCPRDayNationalConsolidatedReport } from "../lib/cprReporting";
import fs from "fs";
import path from "path";

function runVerificationSlugAndApiTests() {
  console.log("==================================================================");
  console.log("FIX 4L.1: VERIFICATION SLUG, ROUTING & API VALIDATION");
  console.log("==================================================================");

  let passed = true;

  // Test 1: All 28 States slug bidirectional translation
  console.log("\n[Test 1] Bidirectional slug to canonical state resolution (All 28 States/UTs):");
  const lockedStates = getLockedCensusStateList();
  for (const s of lockedStates) {
    const slug = stateNameToSlug(s.canonicalState);
    const resolved = slugToCanonicalState(slug);
    if (resolved !== s.canonicalState) {
      console.error(`  FAIL: Slug '${slug}' resolved to '${resolved}' (Expected '${s.canonicalState}')`);
      passed = false;
    } else {
      console.log(`  ✓ ${s.canonicalState} -> '${slug}' -> ${resolved}`);
    }
  }

  // Test 2: Specific slugs requested by user
  console.log("\n[Test 2] Specific user test slugs:");
  const testSlugs = [
    { slug: "maharashtra", expected: "Maharashtra" },
    { slug: "madhya-pradesh", expected: "Madhya Pradesh" },
    { slug: "west-bengal", expected: "West Bengal" },
    { slug: "andaman-nicobar-islands", expected: "Andaman & Nicobar Islands" },
    { slug: "andaman-and-nicobar-islands", expected: "Andaman & Nicobar Islands" },
    { slug: "jammu-kashmir", expected: "Jammu & Kashmir" },
    { slug: "sikkim", expected: "Sikkim" },
  ];

  for (const item of testSlugs) {
    const res = slugToCanonicalState(item.slug);
    if (res === item.expected) {
      console.log(`  ✓ '${item.slug}' correctly resolved to '${res}'`);
    } else {
      console.error(`  FAIL: '${item.slug}' resolved to '${res}' (Expected '${item.expected}')`);
      passed = false;
    }
  }

  // Test 3: Data availability for all 4 key states
  console.log("\n[Test 3] Coordinator & Course Data Availability:");
  const keyStates = ["Maharashtra", "Madhya Pradesh", "West Bengal", "Andaman & Nicobar Islands"];
  for (const st of keyStates) {
    const coords = getDistinctCoordinatorsForState(st);
    if (coords.length === 0) {
      console.error(`  FAIL: ${st} has 0 coordinators`);
      passed = false;
    } else {
      console.log(`  ✓ ${st}: ${coords.length} coordinators found (First: ${coords[0]})`);
      const mapped = getCoordinatorCoursesForState(st, coords[0]);
      console.log(`      Mapped courses for '${coords[0]}': ${mapped.length}`);
      if (mapped.length === 0) {
        console.error(`  FAIL: ${coords[0]} in ${st} has 0 mapped courses`);
        passed = false;
      }
    }
  }

  // Test 4: End-to-End Test Submission and Admin Verification Receipt
  console.log("\n[Test 4] End-to-End Submission & Admin Receipt Test:");
  const mhCoords = getDistinctCoordinatorsForState("Maharashtra");
  const testCoord = mhCoords[0];
  const testCourses = getCoordinatorCoursesForState("Maharashtra", testCoord);
  const testCourse = testCourses[0];

  const testSub = saveVerificationSubmission({
    submissionType: "VERIFY_CORRECT",
    state: "Maharashtra",
    stateCode: "MH",
    canonicalVenueId: testCourse.canonicalVenueId,
    venue: testCourse.venueName,
    city: testCourse.city,
    mappedCoordinatorName: testCoord,
    submittedByName: testCoord,
    submittedByMobile: "9999999999",
    identityStatus: "MAPPED_COORDINATOR_MOBILE_NOT_AVAILABLE",
    currentDataJson: {
      venue: testCourse.venueName,
      city: testCourse.city,
      state: "Maharashtra",
      participantsTrained: testCourse.reconciledTrained,
    },
    correctionNote: "AUTOMATED_TEST_SUBMISSION_STEP4L1",
    submissionStatus: "PENDING_ADMIN_REVIEW",
  });

  console.log(`  ✓ Created test submission ID: ${testSub.id}`);
  const allSubmissions = loadAllVerifications();
  const found = allSubmissions.find((s) => s.id === testSub.id);
  if (found && found.submissionStatus === "PENDING_ADMIN_REVIEW" && found.mappedCoordinatorName === testCoord) {
    console.log(`  ✓ Admin Verification Inbox successfully retrieves test submission ${found.id}`);
  } else {
    console.error("  FAIL: Test submission not found in store");
    passed = false;
  }

  // Clean up test submission
  const cleaned = allSubmissions.filter((s) => s.id !== testSub.id);
  persistAllVerifications(cleaned);
  console.log("  ✓ Test submission cleanly purged from store.");

  // Test 5: Draft V1 Invariant Check
  console.log("\n[Test 5] Invariant Protection Check:");
  const nat = getCPRDayNationalConsolidatedReport();
  console.log(`  - Baseline Courses: ${nat.summary.baseline.courses} (Expected: 391)`);
  console.log(`  - Baseline Venues: ${nat.summary.baseline.uniqueVenues} (Expected: 288)`);
  console.log(`  - Baseline Trained: ${nat.summary.baseline.reportedTrained} (Expected: 43,636)`);
  console.log(`  - Draft Courses: ${nat.summary.reconciledReport.coursesConducted} (Expected: 395)`);
  console.log(`  - Draft Physical Venues: ${nat.summary.reconciledReport.uniqueVenues} (Expected: 292)`);
  console.log(`  - Draft Reconciled Trained: ${nat.summary.reconciledReport.participantsTrained} (Expected: 47,033)`);
  console.log(`  - Certified Records: ${nat.summary.reconciledReport.participantsCertified} (Expected: 33,477)`);

  if (
    nat.summary.baseline.courses !== 391 ||
    nat.summary.baseline.uniqueVenues !== 288 ||
    nat.summary.baseline.reportedTrained !== 43636 ||
    nat.summary.reconciledReport.coursesConducted !== 395 ||
    nat.summary.reconciledReport.uniqueVenues !== 292 ||
    nat.summary.reconciledReport.participantsTrained !== 47033 ||
    nat.summary.reconciledReport.participantsCertified !== 33477
  ) {
    console.error("  FAIL: Draft V1 totals modified!");
    passed = false;
  } else {
    console.log("  ✓ All Draft V1 numbers strictly preserved.");
  }

  console.log("\n==================================================================");
  if (passed) {
    console.log("ALL FIX 4L.1 TESTS PASSED SUCCESSFULLY!");
  } else {
    console.error("SOME TESTS FAILED.");
    process.exit(1);
  }
  console.log("==================================================================");
}

runVerificationSlugAndApiTests();
