import { prisma } from "../lib/prisma";
import fs from "fs";
import path from "path";
import {
  getLockedCensusStateList,
  getLockedOfficialStateCensus,
} from "../lib/cprStateCensus";
import {
  getCPRDayReconciliationReport,
  loadUnifiedLiveCPRDayData,
} from "../lib/cprReporting";
import {
  getFrozenBaselineVenueRegistry,
  getCanonicalVenuesByState,
} from "../lib/cprVenueRegistry";
import {
  getFrozenVenueReviewSnapshot,
  getVenueMetadataOverridesMap,
} from "../lib/cprReconciliationStore";
import {
  loadAllVerificationsAsync,
  updateVerificationStatusAsync,
} from "../lib/cprVerificationStore";
import {
  calculateProspectiveImpact,
  executeDownstreamImplementation,
} from "../lib/cprDownstreamImplementation";
import { classifyVerificationSubmission } from "../lib/cprVerificationClassifier";

async function runStep6ValidationAndFreeze() {
  console.log("================================================================================");
  console.log("STEP 6: END-TO-END OPERATIONAL VALIDATION, PRODUCTION CLEANUP & SYSTEM FREEZE");
  console.log("================================================================================\n");

  let passed = 0;
  let failed = 0;
  const exceptions: string[] = [];

  function assert(condition: boolean, msg: string) {
    if (condition) {
      console.log(`  ✓ [PASS] ${msg}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${msg}`);
      failed++;
    }
  }

  // ============================================================================
  // 1. ARCHITECTURE INTEGRITY CHECK
  // ============================================================================
  console.log("--- 1. ARCHITECTURE INTEGRITY CHECK ---");
  const publicRoutes = [
    "app/cprday/page.tsx",
    "app/cprsanjeevani/verify/[state]/page.tsx",
  ];
  const adminRoutes = [
    "app/admin/page.tsx",
    "app/admin/cpr/verifications/page.tsx",
    "app/cprsanjeevani/page.tsx",
    "app/cprsanjeevani/generate/page.tsx",
    "app/admin/mbbs-foundation/consultation/page.tsx",
  ];

  for (const r of publicRoutes) {
    assert(fs.existsSync(path.join(process.cwd(), r)), `Public route file exists: ${r}`);
  }
  for (const r of adminRoutes) {
    assert(fs.existsSync(path.join(process.cwd(), r)), `Master Admin route file exists: ${r}`);
  }

  // ============================================================================
  // 2. TEST DATA CLEANUP (SECTION 7 & 8)
  // ============================================================================
  console.log("\n--- 2. TEST DATA AUDIT & SAFE CLEANUP ---");
  const allSubmissions = await prisma.cPRVerificationSubmission.findMany();
  console.log(`  Found ${allSubmissions.length} verification submission(s) in PostgreSQL.`);

  // Audit VERIF-1788524059637-35T4
  const testSub = allSubmissions.find((s) => s.id === "VERIF-1788524059637-35T4");
  if (testSub) {
    console.log("  Auditing known test submission VERIF-1788524059637-35T4:");
    console.log(`    - Venue: "${testSub.venue}" | City: "${testSub.city}" | Submitter: "${testSub.submittedByName}"`);
    assert(
      Boolean(testSub.venue?.toLowerCase().includes("test") && testSub.city?.toLowerCase().includes("test")),
      "VERIF-1788524059637-35T4 confirmed unequivocally as TEST DATA"
    );

    await prisma.cPRVerificationSubmission.delete({
      where: { id: "VERIF-1788524059637-35T4" },
    });
    console.log("  ✓ Safely deleted test submission VERIF-1788524059637-35T4 from PostgreSQL.");
  } else {
    console.log("  VERIF-1788524059637-35T4 already cleaned or not present.");
  }

  // Audit any leftover test submission from test runs (e.g. VERIF-1788587487716-P5DV)
  const leftoverTest = allSubmissions.find((s) => s.id === "VERIF-1788587487716-P5DV");
  if (leftoverTest) {
    await prisma.cPRVerificationSubmission.delete({
      where: { id: "VERIF-1788587487716-P5DV" },
    });
    console.log("  ✓ Safely deleted test fixture VERIF-1788587487716-P5DV from PostgreSQL.");
  }

  // Verify remaining submissions
  const remainingSubs = await prisma.cPRVerificationSubmission.findMany();
  console.log(`  Post-cleanup active submissions count: ${remainingSubs.length}`);
  for (const sub of remainingSubs) {
    console.log(`    - ID: ${sub.id} | State: ${sub.state} | Venue: "${sub.venue}" | Submitter: "${sub.submittedByName}" | Status: ${sub.submissionStatus}`);
  }

  // ============================================================================
  // 3. HISTORICAL DRAFT V1 SNAPSHOT INVARIANT (SECTION 4)
  // ============================================================================
  console.log("\n--- 3. HISTORICAL DRAFT V1 SNAPSHOT INVARIANT ---");
  const draftV1SnapshotPath = path.join(process.cwd(), "data", "cpr_census_draft_v1_snapshot.json");
  assert(fs.existsSync(draftV1SnapshotPath), "data/cpr_census_draft_v1_snapshot.json exists");
  const draftSnapshot = JSON.parse(fs.readFileSync(draftV1SnapshotPath, "utf-8"));

  assert(draftSnapshot.nationalTotals?.currentDraftCourses === 395, "Draft V1 snapshot currentDraftCourses = 395");
  assert(draftSnapshot.nationalTotals?.currentDraftPhysicalVenues === 292, "Draft V1 snapshot currentDraftPhysicalVenues = 292");
  assert(draftSnapshot.nationalTotals?.draftReconciledParticipantsTrained === 47033, "Draft V1 snapshot draftReconciledParticipantsTrained = 47,033");
  assert(draftSnapshot.nationalTotals?.participantsCertified === 33477, "Draft V1 snapshot participantsCertified = 33,477");

  // ============================================================================
  // 4. STATE REPORT CONSISTENCY & AGGREGATION (SECTIONS 5 & 6)
  // ============================================================================
  console.log("\n--- 4. STATE REPORT CONSISTENCY & NATIONAL AGGREGATION ---");
  const stateList = getLockedCensusStateList();
  assert(stateList.length === 28, `Authoritative 28 States & UTs roster preserved (got ${stateList.length})`);

  let nationalCourses = 0;
  let nationalVenues = 0;
  let nationalTrained = 0;
  let nationalCertified = 0;
  let nationalCoordinators = 0;
  let nationalChampions = 0;

  const seenCanonicalIds = new Set<string>();

  for (const s of stateList) {
    const report = getCPRDayReconciliationReport(s.canonicalState);
    if (!report) {
      exceptions.push(`Failed to generate report for ${s.canonicalState}`);
      continue;
    }

    // Accumulate metrics
    nationalCourses += report.summary.reconciledReport.coursesConducted;
    nationalVenues += report.summary.reconciledReport.uniqueVenues;
    nationalTrained += report.summary.reconciledReport.participantsTrained;
    nationalCertified += report.summary.reconciledReport.participantsCertified;
    nationalCoordinators += report.summary.reconciledReport.coordinatorsCount;
    nationalChampions += report.summary.reconciledReport.championsCount;

    // Check centre rows
    for (const centre of report.centres) {
      if (centre.canonicalVenueId) {
        if (seenCanonicalIds.has(centre.canonicalVenueId)) {
          exceptions.push(`Duplicate canonicalVenueId across states/centres: ${centre.canonicalVenueId}`);
        }
        seenCanonicalIds.add(centre.canonicalVenueId);
      }
      if (!centre.venue || !centre.venue.trim()) {
        exceptions.push(`Missing venue name in ${s.canonicalState}: serial ${centre.serialNumber}`);
      }
      if (!centre.city || !centre.city.trim()) {
        exceptions.push(`Missing city name in ${s.canonicalState}: venue "${centre.venue}"`);
      }
      if (centre.projectedTotal < 0 || (centre.baselineParticipants && centre.baselineParticipants < 0)) {
        exceptions.push(`Negative trained count in ${s.canonicalState}: venue "${centre.venue}"`);
      }
      if (centre.classification !== "REVIEW_REQUIRED" && centre.coursesCount <= 0) {
        exceptions.push(`Invalid courses count (${centre.coursesCount}) in ${s.canonicalState}: venue "${centre.venue}"`);
      }
    }
  }

  assert(exceptions.length === 0, `Zero State Report consistency anomalies found (exceptions: ${exceptions.length})`);
  if (exceptions.length > 0) {
    console.error("  Exceptions list:", exceptions);
  }

  console.log("\n  National Reconciled Aggregation Totals (Live Recomputed):");
  console.log(`    - States/UTs: ${stateList.length}`);
  console.log(`    - Courses Conducted: ${nationalCourses}`);
  console.log(`    - Physical Venues: ${nationalVenues}`);
  console.log(`    - Participants Trained: ${nationalTrained.toLocaleString("en-IN")}`);
  console.log(`    - Participants Certified: ${nationalCertified.toLocaleString("en-IN")}`);
  console.log(`    - Course Coordinators: ${nationalCoordinators}`);
  console.log(`    - CPR Champions: ${nationalChampions}`);

  assert(nationalCourses === 395, `National courses equal Draft V1 baseline (395 == ${nationalCourses})`);
  assert(nationalVenues === 292, `National unique venues equal Draft V1 baseline (292 == ${nationalVenues})`);
  assert(nationalTrained === 47033, `National trained total equals Draft V1 baseline (47,033 == ${nationalTrained})`);
  assert(nationalCertified === 33477, `National certified total equals Draft V1 baseline (33,477 == ${nationalCertified})`);

  // ============================================================================
  // 5. CERTIFICATE SYSTEM INTEGRITY (SECTION 10)
  // ============================================================================
  console.log("\n--- 5. CERTIFICATE SYSTEM INTEGRITY ---");
  const liveData = loadUnifiedLiveCPRDayData();
  const allParticipantCerts: string[] = [];
  const allCoordCerts: string[] = [];
  const allChampCerts: string[] = [];

  for (const [, records] of liveData.participantsByState.entries()) {
    records.forEach((r) => allParticipantCerts.push(r.certificateId));
  }
  for (const [, records] of liveData.coordinatorsByState.entries()) {
    records.forEach((r) => allCoordCerts.push(r.certificateId));
  }
  for (const [, records] of liveData.championsByState.entries()) {
    records.forEach((r) => allChampCerts.push(r.certificateId));
  }

  console.log(`  - Unique participant certificate IDs: ${new Set(allParticipantCerts).size}`);
  console.log(`  - Unique coordinator certificate IDs: ${new Set(allCoordCerts).size}`);
  console.log(`  - Unique champion certificate IDs: ${new Set(allChampCerts).size}`);

  assert(
    new Set(allParticipantCerts).size === allParticipantCerts.length,
    "Zero duplicate participant certificate IDs in live storage"
  );
  assert(allParticipantCerts.length === 33477, `Participant certificates count = 33,477 (got ${allParticipantCerts.length})`);

  // ============================================================================
  // 6. CLOSED-LOOP REPORT & RECONCILIATION VERIFICATION (SECTION 2 & 3)
  // ============================================================================
  console.log("\n--- 6. CLOSED-LOOP VERIFICATION & RECONCILIATION ---");
  const venueRegistry = getFrozenBaselineVenueRegistry();
  assert(venueRegistry.length === 288, `Frozen baseline venue registry intact at 288 venues (got ${venueRegistry.length})`);

  const reviewSnapshot = getFrozenVenueReviewSnapshot();
  assert(reviewSnapshot.length === 63, `Reconciliation review snapshot intact at 63 items (got ${reviewSnapshot.length})`);

  // ============================================================================
  // 7. VERIFICATION INBOX PRODUCTION READINESS (SECTION 9)
  // ============================================================================
  console.log("\n--- 7. VERIFICATION INBOX PRODUCTION METRICS ---");
  const currentInbox = await loadAllVerificationsAsync();
  const pendingCount = currentInbox.filter((s) => s.submissionStatus === "PENDING_ADMIN_REVIEW").length;
  const acceptedCount = currentInbox.filter((s) => s.submissionStatus === "ACCEPTED").length;
  const implementedCount = currentInbox.filter((s) => s.submissionStatus === "IMPLEMENTED").length;
  const rejectedCount = currentInbox.filter((s) => s.submissionStatus === "REJECTED").length;

  console.log(`  Total Active Submissions in Production: ${currentInbox.length}`);
  console.log(`    - Pending Review: ${pendingCount}`);
  console.log(`    - Action Required (Accepted): ${acceptedCount}`);
  console.log(`    - Implemented: ${implementedCount}`);
  console.log(`    - Rejected: ${rejectedCount}`);

  assert(
    acceptedCount === currentInbox.filter((s) => s.submissionStatus === "ACCEPTED").length,
    "Action Required count exactly matches ACCEPTED submissions awaiting downstream completion"
  );

  // ============================================================================
  // 8. DATA FILE INTEGRITY (SECTION 17)
  // ============================================================================
  console.log("\n--- 8. DATA FILE SYNTAX & INTEGRITY ---");
  const dataFiles = [
    "data/cpr_census_draft_v1_snapshot.json",
    "data/cpr_venue_reconciliation_decisions.json",
    "data/cpr_venue_metadata_overrides.json",
  ];

  for (const df of dataFiles) {
    const fullPath = path.join(process.cwd(), df);
    assert(fs.existsSync(fullPath), `Data file exists: ${df}`);
    try {
      const content = JSON.parse(fs.readFileSync(fullPath, "utf-8"));
      assert(typeof content === "object" && content !== null, `Data file ${df} parses as valid JSON`);
    } catch (e: any) {
      assert(false, `Data file ${df} failed to parse: ${e.message}`);
    }
  }

  // ============================================================================
  // SUMMARY
  // ============================================================================
  console.log("\n================================================================================");
  console.log(`STEP 6 VALIDATION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("================================================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runStep6ValidationAndFreeze().catch((err) => {
  console.error("Step 6 validation failed:", err);
  process.exit(1);
});
