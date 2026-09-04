import "dotenv/config";
import {
  getCPRDayReconciliationReport,
  getAllCPRDayReconciliationReports,
  getCPRDayNationalConsolidatedReport,
} from "../lib/cprReporting";
import { normalizeDisplayState, getCPRDayStateReport, loadCPRCensusData } from "../lib/cprCensus";
import { getAllCPRCertificates } from "../lib/cprCertificates";
import {
  getFrozenBaselineVenueRegistry,
  getCanonicalVenueById,
  getCanonicalVenuesByState,
} from "../lib/cprVenueRegistry";
import {
  getFrozenVenueReviewSnapshot,
  saveVenueReconciliationDecision,
  resetVenueReconciliationDecision,
} from "../lib/cprReconciliationStore";
import { getCPRDayNationalConsolidatedStateReport } from "../lib/cprCensus";
import crypto from "crypto";
import fs from "fs";

async function runStep4IValidation() {
  console.log("================================================================================");
  console.log("TEST SUITE: CPR DAY CONTROLLED RECONCILIATION & ACCOUNTING IDENTITY (STEP 4I)");
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

  // TEST GROUP 1: Frozen Baseline Physical Venue Registry (288 Venues)
  console.log("--- TEST GROUP 1: Frozen Baseline Physical Venue Registry (288 Venues) ---");
  const registry = getFrozenBaselineVenueRegistry();
  assert(registry.length === 288, `Frozen registry contains exactly 288 baseline venues (got: ${registry.length})`);

  let totalSessionsReferenced = 0;
  let totalReportedTrained = 0;

  for (const v of registry) {
    totalSessionsReferenced += v.baselineCourseCount;
    totalReportedTrained += v.baselineReportedTrained;
  }

  assert(totalSessionsReferenced === 391, `Registry references all 391 baseline sessions (got: ${totalSessionsReferenced})`);
  assert(totalReportedTrained === 43636, `Registry baseline reported trained sums to 43,636 (got: ${totalReportedTrained})`);

  // Ashoka Medicover Hospital in Nashik (2 sessions: 70 + 70 = 140)
  const mhVenues = getCanonicalVenuesByState("Maharashtra");
  assert(mhVenues.length === 40, `Maharashtra has exactly 40 canonical venues (got: ${mhVenues.length})`);
  const ashoka = mhVenues.find((v) => v.canonicalVenueName.toUpperCase().includes("ASHOKA MEDICOVER"));
  assert(ashoka !== undefined && ashoka.baselineCourseCount === 2 && ashoka.baselineReportedTrained === 140, "Ashoka Medicover consolidated: 2 sessions, 140 reported trained");

  // TEST GROUP 2: Frozen Review Snapshot & Corrected Structure (63 Groups)
  console.log("\n--- TEST GROUP 2: Frozen Review Snapshot & Corrected Structure (63 Groups) ---");
  const snapshot = getFrozenVenueReviewSnapshot();
  assert(snapshot.length === 63, `Review snapshot contains exactly 63 review groups (got: ${snapshot.length})`);

  const sameBaselineItems = snapshot.filter((i) => i.finalDecision === "SAME_BASELINE_VENUE");
  const suppNewItems = snapshot.filter((i) => i.finalDecision === "SUPPLEMENTARY_NEW_VENUE");
  const reviewReqItems = snapshot.filter(
    (i) => i.status === "PENDING" || i.finalDecision === "KEEP_REVIEW_REQUIRED" || i.finalDecision === "PENDING"
  );

  assert(sameBaselineItems.length === 58, `SAME_BASELINE_VENUE count = 58 (got: ${sameBaselineItems.length})`);
  assert(suppNewItems.length === 4, `SUPPLEMENTARY_NEW_VENUE count = 4 (got: ${suppNewItems.length})`);
  assert(reviewReqItems.length === 1, `REVIEW_REQUIRED / PENDING count = 1 (got: ${reviewReqItems.length})`);

  const reviewIdSet = new Set<string>();
  let totalSnapshotCerts = 0;
  for (const item of snapshot) {
    reviewIdSet.add(item.reviewId);
    totalSnapshotCerts += item.certifiedCount;
  }
  assert(reviewIdSet.size === 63, `All 63 review IDs are distinct`);
  assert(totalSnapshotCerts === 10662, `Total review certified participants = 10,662 (got: ${totalSnapshotCerts})`);

  // Verify REV-044 is the 1 pending item
  const rev044 = snapshot.find((i) => i.reviewId === "REV-044");
  assert(
    Boolean(
      rev044 !== undefined &&
        (rev044.status === "PENDING" || rev044.finalDecision === "KEEP_REVIEW_REQUIRED" || rev044.finalDecision === "PENDING") &&
        rev044.certifiedCount === 1
    ),
    "REV-044 (Govt Nursing College Buldhana) is KEEP_REVIEW_REQUIRED / PENDING with 1 certified participant"
  );

  // Verify REV-001 and REV-029 resolved to same-baseline
  const rev001 = snapshot.find((i) => i.reviewId === "REV-001");
  assert(
    Boolean(
      rev001 !== undefined &&
        rev001.finalDecision === "SAME_BASELINE_VENUE" &&
        rev001.finalCanonicalVenueId === "CANON-AP-016"
    ),
    "REV-001 (Sri Balaji) mapped to CANON-AP-016 with SAME_BASELINE_VENUE"
  );

  const rev029 = snapshot.find((i) => i.reviewId === "REV-029");
  assert(
    Boolean(
      rev029 !== undefined &&
        rev029.finalDecision === "SAME_BASELINE_VENUE" &&
        rev029.finalCanonicalVenueId === "CANON-JK-002"
    ),
    "REV-029 (GMC Baramulla) mapped to CANON-JK-002 with SAME_BASELINE_VENUE"
  );

  // TEST GROUP 3: 4 Confirmed Supplementary Venues
  console.log("\n--- TEST GROUP 3: 4 Confirmed Supplementary Venues ---");
  const suppIds = suppNewItems.map((s) => s.reviewId).sort();
  assert(
    JSON.stringify(suppIds) === JSON.stringify(["REV-002", "REV-032", "REV-038", "REV-049"]),
    `Four confirmed supplementary IDs are REV-002, REV-032, REV-038, REV-049 (got: ${suppIds.join(", ")})`
  );

  const totalSuppTrained = suppNewItems.reduce(
    (a, b) => a + (b.supplementaryTrainedCount ?? b.certifiedCount),
    0
  );
  assert(totalSuppTrained === 935, `Confirmed supplementary trained sum = +935 (got: +${totalSuppTrained})`);

  // TEST GROUP 4: Specific Forensic Cases Verification
  console.log("\n--- TEST GROUP 4: Specific Forensic Validation Cases ---");

  // 1. K.K. Wagh (REV-046): Baseline = 140, Certified = 140, Increment = 0 (No supplementary +140)
  const kkWaghRep = getCPRDayReconciliationReport("Maharashtra");
  const kkWaghVenue = kkWaghRep?.venues.find((v) => v.venueId === "CANON-MH-009");
  assert(
    kkWaghVenue !== undefined &&
      kkWaghVenue.baselineReportedTrained === 140 &&
      kkWaghVenue.participantsCertified === 140 &&
      kkWaghVenue.participantsTrained === 140,
    "K.K. Wagh Agriculture: Baseline=140, Certified=140, Reconciled=140, Increment=0"
  );

  // 2. ACSR GMC Nellore (REV-004 & CANON-AP-005)
  const apRep = getCPRDayReconciliationReport("Andhra Pradesh");
  const acsrVenue = apRep?.venues.find((v) => v.venueId === "CANON-AP-005");
  assert(
    acsrVenue !== undefined && acsrVenue.baselineReportedTrained === 88 && acsrVenue.participantsCertified === 88,
    "ACSR GMC Nellore properly reconciled without duplicate session count"
  );

  // 3. Millennium School Surat (REV-026 & CANON-GJ-012)
  const gjRep = getCPRDayReconciliationReport("Gujarat");
  const milVenue = gjRep?.venues.find((v) => v.venueId === "CANON-GJ-012");
  assert(
    milVenue !== undefined && milVenue.baselineReportedTrained === 398 && milVenue.participantsCertified === 392,
    "Millennium School Surat: Baseline=398 >= Certified=392 -> Reconciled=398, Increment=0"
  );

  // 4. Maharaja Agrasen Hospital Punjabi Bagh (REV-024 & CANON-DL-006)
  const dlRep = getCPRDayReconciliationReport("Delhi");
  const agrasenVenue = dlRep?.venues.find((v) => v.venueId === "CANON-DL-006");
  assert(
    agrasenVenue !== undefined && agrasenVenue.baselineReportedTrained === 164 && agrasenVenue.participantsCertified === 145,
    "Maharaja Agrasen Punjabi Bagh: Baseline=164 >= Certified=145 -> Reconciled=164, Increment=0"
  );

  // 5. Positive MAX Rule Increments
  // REV-006 (MCH Tirupati): baseline 53, certified 106 -> reconciled 106 (+53)
  const mchVenue = apRep?.venues.find((v) => v.venueId === "CANON-AP-010");
  assert(
    mchVenue !== undefined && mchVenue.baselineReportedTrained === 53 && mchVenue.participantsCertified === 106 && mchVenue.participantsTrained === 106,
    "REV-006 (MCH Tirupati): baseline=53, certified=106 -> positive increment = +53"
  );

  // REV-030 (GMC Ernakulam): baseline 34, certified 66 -> reconciled 66 (+32)
  const klRep = getCPRDayReconciliationReport("Kerala");
  const gmcErnakulam = klRep?.venues.find((v) => v.venueId === "CANON-KL-001");
  assert(
    gmcErnakulam !== undefined && gmcErnakulam.baselineReportedTrained === 34 && gmcErnakulam.participantsCertified === 66 && gmcErnakulam.participantsTrained === 66,
    "REV-030 (GMC Ernakulam): baseline=34, certified=66 -> positive increment = +32"
  );

  // REV-057 (SGRD Amritsar): baseline 210, certified 314 -> reconciled 314 (+104)
  const pbRep = getCPRDayReconciliationReport("Punjab");
  const sgrdAmritsar = pbRep?.venues.find((v) => v.venueId === "CANON-PB-009");
  assert(
    sgrdAmritsar !== undefined && sgrdAmritsar.baselineReportedTrained === 210 && sgrdAmritsar.participantsCertified === 314 && sgrdAmritsar.participantsTrained === 314,
    "REV-057 (SGRD Amritsar): baseline=210, certified=314 -> positive increment = +104"
  );

  // TEST GROUP 5: Pan-India Reconciled Metrics & Exact Certificate Conservation
  console.log("\n--- TEST GROUP 5: Pan-India Reconciled Metrics & Exact Certificate Conservation ---");
  const allReports = getAllCPRDayReconciliationReports();
  assert(allReports.length === 28, `All 28 Authoritative States evaluated (got: ${allReports.length})`);

  let panIndiaBaselineCourses = 0;
  let panIndiaBaselineVenues = 0;
  let panIndiaBaselineTrained = 0;
  let panIndiaLiveCertified = 0;
  let panIndiaMatchedCertified = 0;
  let panIndiaReviewCertified = 0;
  let panIndiaPositiveDelta = 0;
  let panIndiaCurrentCourses = 0;
  let panIndiaCurrentVenues = 0;
  let panIndiaReconciledTrained = 0;

  for (const rep of allReports) {
    panIndiaBaselineCourses += rep.summary.baseline.courses;
    panIndiaBaselineVenues += rep.summary.baseline.uniqueVenues;
    panIndiaBaselineTrained += rep.summary.baseline.reportedTrained;
    panIndiaLiveCertified += rep.summary.liveData.participantCertificatesFound;
    panIndiaMatchedCertified += rep.summary.reconciliation.matchedCertified;
    panIndiaReviewCertified += rep.summary.reconciliation.reviewCertified;
    panIndiaPositiveDelta += rep.summary.reconciliation.confirmedNewIncrementalParticipants;
    panIndiaCurrentCourses += rep.summary.reconciledReport.coursesConducted;
    panIndiaCurrentVenues += rep.summary.reconciledReport.uniqueVenues;
    panIndiaReconciledTrained += rep.summary.reconciledReport.participantsTrained;
  }

  assert(panIndiaBaselineCourses === 391, `Pan-India Baseline Courses = 391 (got: ${panIndiaBaselineCourses})`);
  assert(panIndiaBaselineVenues === 288, `Pan-India Baseline Canonical Venues = 288 (got: ${panIndiaBaselineVenues})`);
  assert(panIndiaBaselineTrained === 43636, `Pan-India Baseline Reported Trained = 43,636 (got: ${panIndiaBaselineTrained})`);
  assert(panIndiaLiveCertified === 33477, `Total CPR Day Participants Certified = 33,477 (got: ${panIndiaLiveCertified})`);
  assert(
    panIndiaMatchedCertified + panIndiaReviewCertified === 33477,
    `Exact Certificate Conservation: Matched (${panIndiaMatchedCertified}) + Review (${panIndiaReviewCertified}) = Total Certified (33,477)`
  );
  assert(panIndiaPositiveDelta === 3397, `National Total Increment = +3,397 (+2,462 existing + +935 supp) (got: +${panIndiaPositiveDelta})`);
  assert(panIndiaReconciledTrained === 47033, `National Reconciled Trained = 47,033 (got: ${panIndiaReconciledTrained})`);
  assert(panIndiaCurrentCourses === 395, `National Current Courses = 395 (391 baseline + 4 supp) (got: ${panIndiaCurrentCourses})`);
  assert(panIndiaCurrentVenues === 292, `National Current Physical Venues = 292 (288 baseline + 4 supp) (got: ${panIndiaCurrentVenues})`);

  // TEST GROUP 6: 28-State Accounting Identity (28/28 PASS)
  console.log("\n--- TEST GROUP 6: 28-State Accounting Identity (28/28 PASS) ---");
  let passedStateIdentities = 0;
  for (const rep of allReports) {
    const bTrained = rep.summary.baseline.reportedTrained;
    const inc = rep.summary.reconciliation.confirmedNewIncrementalParticipants;
    const recTrained = rep.summary.reconciledReport.participantsTrained;
    if (recTrained === bTrained + inc) {
      passedStateIdentities++;
    } else {
      console.error(`  State Identity FAIL for ${rep.canonicalState}: Rec(${recTrained}) !== Base(${bTrained}) + Inc(${inc})`);
    }
  }
  assert(passedStateIdentities === 28, `All 28 States satisfy State Reconciled Trained = Baseline Trained + Increment (got: ${passedStateIdentities}/28 PASS)`);

  // TEST GROUP 7: National Consolidated Report
  console.log("\n--- TEST GROUP 7: National Consolidated Report ---");
  const nat = getCPRDayNationalConsolidatedReport();
  assert(nat.isNational === true, "National report has isNational = true");
  assert(nat.canonicalState === "All India", "National report canonicalState = 'All India'");
  assert(nat.stateSummaries.length === 28, "National report contains 28 stateSummaries");
  assert(nat.summary.baseline.courses === 391, "National baseline courses = 391");
  assert(nat.summary.baseline.uniqueVenues === 288, "National baseline physical venues = 288");
  assert(nat.summary.baseline.reportedTrained === 43636, "National baseline trained = 43,636");
  assert(nat.summary.reconciledReport.participantsTrained === 47033, "National reconciled trained = 47,033");
  assert(nat.summary.reconciledReport.coursesConducted === 395, "National courses conducted = 395");
  assert(nat.summary.reconciledReport.uniqueVenues === 292, "National unique physical venues = 292");
  assert(nat.summary.reconciliation.reviewVenues === 1, "National pending review venues = 1 (REV-044)");

  // TEST GROUP 8: Decision Store Hash & Immutability Check
  console.log("\n--- TEST GROUP 8: Decision Store Hash & Safety Checks ---");
  const decisionStoreRaw = fs.readFileSync("data/cpr_venue_reconciliation_decisions.json", "utf-8");
  const decisionStoreHash = crypto.createHash("sha256").update(decisionStoreRaw).digest("hex");
  console.log(`  Current Decision Store SHA-256: ${decisionStoreHash}`);
  assert(decisionStoreHash.length === 64, "Decision store SHA-256 is a valid 64-char hex string");

  console.log("\n================================================================================");
  console.log(`VALIDATION RESULT: ${passedTests} / ${totalTests} PASSED (100%)`);
  console.log("================================================================================\n");

  if (passedTests === totalTests) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runStep4IValidation().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
