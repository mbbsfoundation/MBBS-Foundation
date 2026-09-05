import {
  classifyVerificationSubmission,
} from "../lib/cprVerificationClassifier";
import { CoordinatorVerificationSubmission } from "../lib/cprVerificationStore";
import { getFrozenBaselineVenueRegistry } from "../lib/cprVenueRegistry";
import fs from "fs";
import path from "path";

async function runStep5BTests() {
  console.log("================================================================================");
  console.log("STEP 5B VERIFICATION WORKFLOW & CLASSIFIER TEST SUITE");
  console.log("================================================================================");

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, msg: string) {
    total++;
    if (condition) {
      console.log(`✅ PASS: ${msg}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${msg}`);
      process.exitCode = 1;
    }
  }

  // ---------------------------------------------------------------------------
  // Test 1: MISSING_COURSE Classification
  // ---------------------------------------------------------------------------
  const missingCourseSub: CoordinatorVerificationSubmission = {
    id: "TEST-MC-001",
    submissionType: "MISSING_COURSE",
    submissionStatus: "ACCEPTED",
    state: "Maharashtra",
    stateCode: "MH",
    venue: "Test Venue",
    city: "Test City",
    mappedCoordinatorName: "Dr. Coordinator",
    submittedByName: "Dr. Coordinator",
    submittedByMobile: "9876543210",
    identityStatus: "MAPPED_COORDINATOR_MATCHED",
    proposedChangesJson: {
      venue: "Test Venue",
      city: "Test City",
      participantsTrained: 25,
      coordinators: ["Dr. Coordinator"],
      champions: ["Dr. Champion"],
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mcClass = classifyVerificationSubmission(missingCourseSub);
  assert(mcClass.riskLevel === "HIGH_RISK", "MISSING_COURSE is classified as HIGH_RISK");
  assert(mcClass.censusImpact === "YES", "MISSING_COURSE has censusImpact === 'YES'");
  assert(
    mcClass.recommendedAction.includes("supplementary reconciliation entry"),
    "MISSING_COURSE recommends attendance verification before supplementary entry"
  );

  // ---------------------------------------------------------------------------
  // Test 2: participantsTrained Correction Classification
  // ---------------------------------------------------------------------------
  const trainedCorrSub: CoordinatorVerificationSubmission = {
    id: "TEST-TC-002",
    submissionType: "SUBMIT_CORRECTION",
    submissionStatus: "ACCEPTED",
    state: "Karnataka",
    stateCode: "KA",
    venue: "GMC Bangalore",
    city: "Bangalore",
    mappedCoordinatorName: "Dr. Ramesh",
    submittedByName: "Dr. Ramesh",
    submittedByMobile: "9876543211",
    identityStatus: "MAPPED_COORDINATOR_MATCHED",
    currentDataJson: {
      venue: "GMC Bangalore",
      city: "Bangalore",
      participantsTrained: 100,
      coursesCount: 1,
    },
    proposedChangesJson: {
      participantsTrained: 150,
      fieldsModified: ["trainedCount"],
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const tcClass = classifyVerificationSubmission(trainedCorrSub);
  assert(tcClass.riskLevel === "HIGH_RISK", "participantsTrained change is classified as HIGH_RISK");
  assert(tcClass.censusImpact === "YES", "participantsTrained change has censusImpact === 'YES'");
  assert(tcClass.affectedDomain === "CENSUS / COUNTS", "Single participantsTrained change domain is CENSUS / COUNTS");

  // ---------------------------------------------------------------------------
  // Test 3: coursesCount Correction Classification
  // ---------------------------------------------------------------------------
  const sessionCorrSub: CoordinatorVerificationSubmission = {
    id: "TEST-SC-003",
    submissionType: "SUBMIT_CORRECTION",
    submissionStatus: "ACCEPTED",
    state: "Tamil Nadu",
    stateCode: "TN",
    venue: "Madras Medical College",
    city: "Chennai",
    mappedCoordinatorName: "Dr. Suresh",
    submittedByName: "Dr. Suresh",
    submittedByMobile: "9876543212",
    identityStatus: "MAPPED_COORDINATOR_MATCHED",
    currentDataJson: {
      venue: "Madras Medical College",
      city: "Chennai",
      participantsTrained: 200,
      coursesCount: 1,
    },
    proposedChangesJson: {
      coursesCount: 2,
      fieldsModified: ["coursesCount"],
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const scClass = classifyVerificationSubmission(sessionCorrSub);
  assert(scClass.riskLevel === "HIGH_RISK", "coursesCount change is classified as HIGH_RISK");
  assert(scClass.censusImpact === "YES", "coursesCount change has censusImpact === 'YES'");

  // ---------------------------------------------------------------------------
  // Test 4: Venue / City Spelling Correction Classification
  // ---------------------------------------------------------------------------
  const spellingCorrSub: CoordinatorVerificationSubmission = {
    id: "TEST-SP-004",
    submissionType: "SUBMIT_CORRECTION",
    submissionStatus: "ACCEPTED",
    state: "Gujarat",
    stateCode: "GJ",
    venue: "BJ Medical Collg",
    city: "Ahmdabad",
    mappedCoordinatorName: "Dr. Patel",
    submittedByName: "Dr. Patel",
    submittedByMobile: "9876543213",
    identityStatus: "MAPPED_COORDINATOR_MATCHED",
    currentDataJson: {
      venue: "BJ Medical Collg",
      city: "Ahmdabad",
      participantsTrained: 80,
      coursesCount: 1,
    },
    proposedChangesJson: {
      venue: "B.J. Medical College",
      city: "Ahmedabad",
      fieldsModified: ["venueName", "city"],
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const spClass = classifyVerificationSubmission(spellingCorrSub);
  assert(spClass.riskLevel === "LOW_RISK", "Venue/city spelling change is classified as LOW_RISK");
  assert(spClass.censusImpact === "NO", "Venue/city spelling change has censusImpact === 'NO'");
  assert(spClass.affectedDomain === "REPORT METADATA", "Venue/city spelling change domain is REPORT METADATA");
  assert(
    spClass.recommendedAction.includes("reconciliation/report metadata layer"),
    "Recommends reconciliation/report metadata layer review"
  );

  // ---------------------------------------------------------------------------
  // Test 5: Faculty Attribution Classification
  // ---------------------------------------------------------------------------
  const facultyCorrSub: CoordinatorVerificationSubmission = {
    id: "TEST-FA-005",
    submissionType: "SUBMIT_CORRECTION",
    submissionStatus: "ACCEPTED",
    state: "Delhi",
    stateCode: "DL",
    venue: "MAMC Delhi",
    city: "New Delhi",
    mappedCoordinatorName: "Dr. Gupta",
    submittedByName: "Dr. Gupta",
    submittedByMobile: "9876543214",
    identityStatus: "MAPPED_COORDINATOR_MATCHED",
    currentDataJson: {
      venue: "MAMC Delhi",
      city: "New Delhi",
      coordinators: ["Dr. Gupta"],
      champions: [],
    },
    proposedChangesJson: {
      coordinators: ["Dr. Gupta", "Dr. Sharma"],
      champions: ["Dr. Verma"],
      fieldsModified: ["coordinators", "champions"],
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const faClass = classifyVerificationSubmission(facultyCorrSub);
  assert(faClass.riskLevel === "MEDIUM_RISK", "Faculty change is classified as MEDIUM_RISK");
  assert(faClass.censusImpact === "NO", "Faculty change has censusImpact === 'NO'");
  assert(
    faClass.affectedDomain === "MULTIPLE SOURCES" || faClass.affectedDomain === "FACULTY ATTRIBUTION",
    "Faculty change domain is FACULTY ATTRIBUTION or MULTIPLE SOURCES"
  );
  assert(
    faClass.recommendedAction.includes("faculty attribution"),
    "Recommends faculty attribution verification"
  );

  // ---------------------------------------------------------------------------
  // Test 6: VERIFY_CORRECT Classification
  // ---------------------------------------------------------------------------
  const verifyCorrectSub: CoordinatorVerificationSubmission = {
    id: "TEST-VC-006",
    submissionType: "VERIFY_CORRECT",
    submissionStatus: "PENDING_ADMIN_REVIEW",
    state: "Maharashtra",
    stateCode: "MH",
    venue: "KEM Hospital",
    city: "Mumbai",
    mappedCoordinatorName: "Dr. Joshi",
    submittedByName: "Dr. Joshi",
    submittedByMobile: "9876543215",
    identityStatus: "MAPPED_COORDINATOR_MATCHED",
    currentDataJson: {
      venue: "KEM Hospital",
      city: "Mumbai",
      participantsTrained: 120,
      coursesCount: 1,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const vcClass = classifyVerificationSubmission(verifyCorrectSub);
  assert(vcClass.riskLevel === "LOW_RISK", "VERIFY_CORRECT is classified as LOW_RISK");
  assert(vcClass.censusImpact === "NO", "VERIFY_CORRECT has censusImpact === 'NO'");
  assert(
    vcClass.recommendedAction.includes("No downstream change required"),
    "VERIFY_CORRECT recommends no downstream change"
  );

  // ---------------------------------------------------------------------------
  // Test 7: Verify Invariants (No File Mutations in Data/Snapshots)
  // ---------------------------------------------------------------------------
  const baselineVenues = getFrozenBaselineVenueRegistry();
  assert(baselineVenues.length === 288, `Baseline venues count is unchanged at 288 (actual: ${baselineVenues.length})`);

  const reconcDecisionsPath = path.join(process.cwd(), "data", "cpr_venue_reconciliation_decisions.json");
  const reconcDecisions = JSON.parse(fs.readFileSync(reconcDecisionsPath, "utf-8"));
  assert(reconcDecisions.length === 63, `Reconciliation decisions count is unchanged at 63 (actual: ${reconcDecisions.length})`);

  const censusSnapshotPath = path.join(process.cwd(), "data", "cpr_census_draft_v1_snapshot.json");
  const censusSnapshot = JSON.parse(fs.readFileSync(censusSnapshotPath, "utf-8"));
  assert(censusSnapshot.nationalTotals.currentDraftCourses === 395, `Census courses total unchanged: 395 (actual: ${censusSnapshot.nationalTotals.currentDraftCourses})`);
  assert(censusSnapshot.nationalTotals.currentDraftPhysicalVenues === 292, `Census unique venues total unchanged: 292 (actual: ${censusSnapshot.nationalTotals.currentDraftPhysicalVenues})`);
  assert(censusSnapshot.nationalTotals.draftReconciledParticipantsTrained === 47033, `Census reported trained total unchanged: 47,033 (actual: ${censusSnapshot.nationalTotals.draftReconciledParticipantsTrained})`);
  assert(censusSnapshot.nationalTotals.participantsCertified === 33477, `Census certified total unchanged: 33,477 (actual: ${censusSnapshot.nationalTotals.participantsCertified})`);

  console.log("\n--------------------------------------------------------------------------------");
  console.log(`SUMMARY: ${passed} / ${total} checks passed successfully.`);
  console.log("--------------------------------------------------------------------------------\n");

  if (passed !== total) {
    process.exit(1);
  }
}

runStep5BTests().catch((e) => {
  console.error("Test execution failed:", e);
  process.exit(1);
});
