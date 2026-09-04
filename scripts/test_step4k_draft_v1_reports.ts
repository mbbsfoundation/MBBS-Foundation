import "dotenv/config";
import {
  getCPRDayReconciliationReport,
  getAllCPRDayReconciliationReports,
  getCPRDayNationalConsolidatedReport,
} from "../lib/cprReporting";
import { getFrozenBaselineVenueRegistry } from "../lib/cprVenueRegistry";
import {
  getFrozenVenueReviewSnapshot,
  CPRDAY_CENSUS_DRAFT_VERSION,
} from "../lib/cprReconciliationStore";
import fs from "fs";
import path from "path";

async function runStep4KReportValidation() {
  console.log("================================================================================");
  console.log("STEP 4K: VALIDATION OF DRAFT VERSION 1 REPORTS & ACCOUNTING IDENTITIES");
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

  // 1. Version Identifier Check
  console.log("--- 1. Version Identifier Verification ---");
  assert(CPRDAY_CENSUS_DRAFT_VERSION === "CPRDAY_CENSUS_DRAFT_V1", `Draft Version Identifier is CPRDAY_CENSUS_DRAFT_V1`);

  const snapshotPath = path.join(process.cwd(), "data", "cpr_census_draft_v1_snapshot.json");
  assert(fs.existsSync(snapshotPath), "Draft V1 Snapshot file exists at data/cpr_census_draft_v1_snapshot.json");

  const snapshotRaw = JSON.parse(fs.readFileSync(snapshotPath, "utf-8"));
  assert(snapshotRaw.versionIdentifier === "CPRDAY_CENSUS_DRAFT_V1", "Snapshot versionIdentifier is CPRDAY_CENSUS_DRAFT_V1");
  assert(snapshotRaw.nationalTotals.draftReconciledParticipantsTrained === 47033, "Snapshot national draft reconciled trained = 47,033");
  assert(snapshotRaw.nationalTotals.participantsCertified === 33477, "Snapshot national participants certified = 33,477");
  assert(snapshotRaw.nationalTotals.currentDraftCourses === 395, "Snapshot national draft courses = 395");
  assert(snapshotRaw.nationalTotals.currentDraftPhysicalVenues === 292, "Snapshot national draft physical venues = 292");

  // 2. National Consolidated Metrics Verification
  console.log("\n--- 2. National Consolidated Metrics Verification ---");
  const natReport = getCPRDayNationalConsolidatedReport();
  assert(natReport.summary.baseline.courses === 391, `National Baseline Courses = 391 (got: ${natReport.summary.baseline.courses})`);
  assert(natReport.summary.baseline.uniqueVenues === 288, `National Baseline Venues = 288 (got: ${natReport.summary.baseline.uniqueVenues})`);
  assert(natReport.summary.baseline.reportedTrained === 43636, `National Baseline Trained = 43,636 (got: ${natReport.summary.baseline.reportedTrained})`);
  assert(natReport.summary.reconciledReport.coursesConducted === 395, `National Draft Courses = 395 (got: ${natReport.summary.reconciledReport.coursesConducted})`);
  assert(natReport.summary.reconciledReport.uniqueVenues === 292, `National Draft Physical Venues = 292 (got: ${natReport.summary.reconciledReport.uniqueVenues})`);
  assert(natReport.summary.reconciledReport.participantsTrained === 47033, `National Draft Reconciled Trained = 47,033 (got: ${natReport.summary.reconciledReport.participantsTrained})`);
  assert(natReport.summary.reconciledReport.participantsCertified === 33477, `National Participants Certified = 33,477 (got: ${natReport.summary.reconciledReport.participantsCertified})`);
  assert(natReport.summary.reconciliation.confirmedNewIncrementalParticipants === 3397, `National Total Increment = +3,397 (+2,462 existing + +935 supp) (got: +${natReport.summary.reconciliation.confirmedNewIncrementalParticipants})`);
  assert(natReport.summary.reconciliation.reviewVenues === 1, `National Review Required = 1 (REV-044) (got: ${natReport.summary.reconciliation.reviewVenues})`);

  // 3. Representative State Sampling (Small, Medium, Large, Maharashtra)
  console.log("\n--- 3. Representative State Sampling ---");

  // Small State: Sikkim (1 venue, 1 session, 93 trained, 92 certified)
  const sikkimRep = getCPRDayReconciliationReport("Sikkim");
  assert(
    Boolean(
      sikkimRep &&
      sikkimRep.summary.baseline.courses === 1 &&
      sikkimRep.summary.baseline.uniqueVenues === 1 &&
      sikkimRep.summary.baseline.reportedTrained === 93 &&
      sikkimRep.summary.reconciledReport.participantsTrained === 93 &&
      sikkimRep.summary.liveData.participantCertificatesFound === 92
    ),
    "Sikkim (Small State): 1 venue, 1 course, 93 baseline trained, 92 certified, 93 reconciled trained"
  );

  // Small State: Tripura (2 venues, 2 sessions, 49 trained, 49 certified)
  const tripuraRep = getCPRDayReconciliationReport("Tripura");
  assert(
    Boolean(
      tripuraRep &&
      tripuraRep.summary.baseline.courses === 2 &&
      tripuraRep.summary.baseline.uniqueVenues === 2 &&
      tripuraRep.summary.baseline.reportedTrained === 49 &&
      tripuraRep.summary.reconciledReport.participantsTrained === 49 &&
      tripuraRep.summary.liveData.participantCertificatesFound === 49
    ),
    "Tripura (Small State): 2 venues, 2 courses, 49 trained, 49 certified"
  );

  // Medium State: Kerala (11 sessions, 10 venues, 698 baseline trained, 254 certified -> 734 reconciled trained, +36 reach)
  const klRep = getCPRDayReconciliationReport("Kerala");
  assert(
    Boolean(
      klRep &&
      klRep.summary.baseline.courses === 11 &&
      klRep.summary.baseline.uniqueVenues === 10 &&
      klRep.summary.baseline.reportedTrained === 698 &&
      klRep.summary.reconciledReport.participantsTrained === 734 &&
      klRep.summary.reconciliation.confirmedNewIncrementalParticipants === 36
    ),
    "Kerala (Medium State): 11 courses, 10 venues, 698 baseline -> 734 reconciled trained (+36 reach)"
  );

  // Medium State: Punjab (24 sessions, 18 venues, 2,567 baseline trained, 2,207 certified -> 3,054 reconciled trained, +487 reach)
  const pbRep = getCPRDayReconciliationReport("Punjab");
  assert(
    Boolean(
      pbRep &&
      pbRep.summary.baseline.courses === 24 &&
      pbRep.summary.baseline.uniqueVenues === 18 &&
      pbRep.summary.baseline.reportedTrained === 2567 &&
      pbRep.summary.reconciledReport.participantsTrained === 3054 &&
      pbRep.summary.reconciliation.confirmedNewIncrementalParticipants === 487
    ),
    "Punjab (Medium State): 24 courses, 18 venues, 2,567 baseline -> 3,054 reconciled trained (+487 reach)"
  );

  // Large State: West Bengal (41 sessions, 27 venues, 4,921 baseline trained, 4,328 certified -> 5,046 reconciled trained, +125 reach)
  const wbRep = getCPRDayReconciliationReport("West Bengal");
  assert(
    Boolean(
      wbRep &&
      wbRep.summary.baseline.courses === 41 &&
      wbRep.summary.baseline.uniqueVenues === 27 &&
      wbRep.summary.baseline.reportedTrained === 4921 &&
      wbRep.summary.reconciledReport.participantsTrained === 5046 &&
      wbRep.summary.reconciliation.confirmedNewIncrementalParticipants === 125
    ),
    "West Bengal (Large State): 41 courses, 27 venues, 4,921 baseline -> 5,046 reconciled trained (+125 reach)"
  );

  // Large State: Madhya Pradesh (63 baseline sessions + 2 supplementary [REV-032, REV-038] = 65 courses; 39 baseline venues + 2 supplementary = 41 venues; 6,448 baseline trained -> 7,281 reconciled trained, +833 reach)
  const mpRep = getCPRDayReconciliationReport("Madhya Pradesh");
  assert(
    Boolean(
      mpRep &&
      mpRep.summary.baseline.courses === 63 &&
      mpRep.summary.baseline.uniqueVenues === 39 &&
      mpRep.summary.reconciledReport.coursesConducted === 65 &&
      mpRep.summary.reconciledReport.uniqueVenues === 41 &&
      mpRep.summary.baseline.reportedTrained === 6448 &&
      mpRep.summary.reconciledReport.participantsTrained === 7281 &&
      mpRep.summary.reconciliation.confirmedNewIncrementalParticipants === 833
    ),
    "Madhya Pradesh (Large State): 65 draft courses (63 base + 2 supp), 41 draft venues (39 base + 2 supp), 6,448 baseline -> 7,281 reconciled trained (+833 reach)"
  );

  // Maharashtra: (49 baseline sessions + 1 supplementary [REV-049] = 50 courses; 40 canonical venues + 1 supplementary = 41 venues; 5,523 baseline trained -> 5,659 reconciled trained (+136 reach); REV-044 pending)
  const mhRep = getCPRDayReconciliationReport("Maharashtra");
  assert(
    Boolean(
      mhRep &&
      mhRep.summary.baseline.courses === 49 &&
      mhRep.summary.baseline.uniqueVenues === 40 &&
      mhRep.summary.reconciledReport.coursesConducted === 50 &&
      mhRep.summary.reconciledReport.uniqueVenues === 41 &&
      mhRep.summary.baseline.reportedTrained === 5523 &&
      mhRep.summary.reconciledReport.participantsTrained === 5659 &&
      mhRep.summary.reconciliation.confirmedNewIncrementalParticipants === 136 &&
      mhRep.summary.reconciliation.reviewVenues === 1
    ),
    "Maharashtra: 50 draft courses (49 base + 1 supp), 41 draft venues (40 base + 1 supp), 5,523 baseline -> 5,659 reconciled trained (+136 reach), 1 review required (REV-044)"
  );

  // 4. All 28 State Accounting Identities
  console.log("\n--- 4. All 28 State Accounting Identities ---");
  const allReports = getAllCPRDayReconciliationReports();
  assert(allReports.length === 28, "All 28 States loaded");

  let identitiesPassed = 0;
  for (const r of allReports) {
    const base = r.summary.baseline.reportedTrained;
    const inc = r.summary.reconciliation.confirmedNewIncrementalParticipants;
    const rec = r.summary.reconciledReport.participantsTrained;
    if (rec === base + inc) {
      identitiesPassed++;
    } else {
      console.error(`  Accounting Identity Mismatch for ${r.canonicalState}: ${rec} !== ${base} + ${inc}`);
    }
  }
  assert(identitiesPassed === 28, `All 28 State accounting identities PASS: Reconciled Trained === Baseline Trained + Increment (28/28)`);

  console.log("\n================================================================================");
  console.log(`STEP 4K VALIDATION RESULT: ${passedTests} / ${totalTests} PASSED (${Math.round((passedTests / totalTests) * 100)}%)`);
  console.log("================================================================================\n");
}

runStep4KReportValidation().catch(console.error);
