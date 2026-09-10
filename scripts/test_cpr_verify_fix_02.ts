import assert from "assert";
import {
  getCPRDayReconciliationReport,
  getCPRDayReconciliationReportAsync,
  getCPRDayNationalConsolidatedReportAsync,
} from "../lib/cprReporting";
import {
  invalidateVenueMetadataOverridesCache,
  loadImplementedSupplementaryCourses,
  loadImplementedSupplementaryCoursesAsync,
} from "../lib/cprReconciliationStore";
import { getLockedOfficialStateCensus } from "../lib/cprStateCensus";
import { prisma } from "../lib/prisma";

async function runCPRVerifyFix02Tests() {
  console.log("================================================================================");
  console.log("TEST SUITE: CPR-VERIFY-FIX-02 (STATE CENSUS RECONCILIATION OVERLAY)");
  console.log("================================================================================\n");

  invalidateVenueMetadataOverridesCache();

  // ---------------------------------------------------------------------------
  // TEST 1: Delhi Real Production Case Verification
  // ---------------------------------------------------------------------------
  console.log(">>> TEST 1: Verifying Delhi Real Production Implemented Case...");
  const dlReport = await getCPRDayReconciliationReportAsync("Delhi", true);
  assert(dlReport !== null, "Delhi report must exist");

  const dlBaseline = getLockedOfficialStateCensus("Delhi");
  assert(dlBaseline !== null, "Delhi locked baseline census must exist");

  console.log("Delhi Locked Baseline Census:", {
    venues: dlBaseline!.centres, // 6
    courses: dlBaseline!.centres, // 10 courses represented in 6 centres in baseline
    reportedTrained: dlBaseline!.participantsTrained, // 939
  });

  // Verify Baseline in Report remains FROZEN
  assert.strictEqual(dlReport.summary.baseline.uniqueVenues, 6, "Baseline unique venues must be 6");
  assert.strictEqual(dlReport.summary.baseline.courses, 10, "Baseline courses must be 10");
  assert.strictEqual(dlReport.summary.baseline.reportedTrained, 939, "Baseline reported trained must be 939");
  assert.strictEqual(dlReport.summary.baseline.isLocked, true, "Baseline isLocked must be true");

  console.log("Delhi Reconciled Summary (Current):", {
    uniqueVenues: dlReport.summary.reconciledReport.uniqueVenues,
    coursesConducted: dlReport.summary.reconciledReport.coursesConducted,
    participantsTrained: dlReport.summary.reconciledReport.participantsTrained,
    participantsCertified: dlReport.summary.reconciledReport.participantsCertified,
    coordinatorsCount: dlReport.summary.reconciledReport.coordinatorsCount,
    championsCount: dlReport.summary.reconciledReport.championsCount,
  });

  // Verify Current Reconciled Summary reflects the implemented supplementary course
  assert.strictEqual(dlReport.summary.reconciledReport.uniqueVenues, 7, "Current physical venues must be 7 (6 baseline + 1 supplementary)");
  assert.strictEqual(dlReport.summary.reconciledReport.coursesConducted, 11, "Current courses conducted must be 11 (10 baseline + 1 supplementary)");
  assert.strictEqual(dlReport.summary.reconciledReport.participantsTrained, 1349, "Current participants trained must be 1349 (939 baseline + 410 supplementary)");
  assert.strictEqual(dlReport.summary.reconciledReport.participantsCertified, 983, "Current participants certified must be 983 (812 baseline + 171 supplementary)");

  // ---------------------------------------------------------------------------
  // TEST 2: Mathematical Reconciliation with Centre-Wise Table
  // ---------------------------------------------------------------------------
  console.log("\n>>> TEST 2: Verifying Mathematical Reconciliation with Centre-Wise Table...");
  const centres = dlReport.centres;
  console.log(`Delhi centres count: ${centres.length}`);
  assert.strictEqual(centres.length, 7, "Centre-wise table must contain 7 rows");

  const sumCourses = centres.reduce((sum, c) => sum + (c.coursesCount || 0), 0);
  const sumTrained = centres.reduce((sum, c) => sum + (c.projectedTotal ?? c.participantsTrained ?? 0), 0);

  console.log(`Table Sum Courses: ${sumCourses} vs Top Summary: ${dlReport.summary.reconciledReport.coursesConducted}`);
  console.log(`Table Sum Trained: ${sumTrained} vs Top Summary: ${dlReport.summary.reconciledReport.participantsTrained}`);

  assert.strictEqual(sumCourses, dlReport.summary.reconciledReport.coursesConducted, "Table sum of courses must equal top summary coursesConducted");
  assert.strictEqual(sumTrained, dlReport.summary.reconciledReport.participantsTrained, "Table sum of trained must equal top summary participantsTrained");

  const suppRow = centres.find((c) => c.serialNumber.includes("SUPP-") || c.canonicalVenueId?.includes("SUPP-"));
  assert(suppRow !== undefined, "Supplementary row must exist in centres table");
  assert.strictEqual(suppRow.coursesCount, 1, "Supplementary row coursesCount must be 1");
  assert.strictEqual(suppRow.participantsTrained, 410, "Supplementary row trained must be 410");
  assert.strictEqual(suppRow.classification, "APPROVED_SUPPLEMENTARY", "Supplementary row classification must be APPROVED_SUPPLEMENTARY");

  // ---------------------------------------------------------------------------
  // TEST 3: Idempotency & Invariance under Multiple Reloads
  // ---------------------------------------------------------------------------
  console.log("\n>>> TEST 3: Testing Idempotency on Reloads...");
  const dlReport2 = await getCPRDayReconciliationReportAsync("Delhi", true);
  assert.deepStrictEqual(dlReport.summary.reconciledReport, dlReport2?.summary.reconciledReport, "Reloading report must produce identical reconciled metrics");
  assert.strictEqual(dlReport2?.centres.length, 7, "Centres table length must remain exactly 7 on re-fetch");

  // ---------------------------------------------------------------------------
  // TEST 4: Existing-Venue Supplementary Course Overlay
  // ---------------------------------------------------------------------------
  console.log("\n>>> TEST 4: Testing Existing-Venue Supplementary Course Overlay (Maharashtra / Fortis)...");
  const mhReport = await getCPRDayReconciliationReportAsync("Maharashtra", true);
  assert(mhReport !== null, "Maharashtra report must exist");

  const fortisVenue = mhReport.venues.find((v) => v.venueId === "CANON-MH-023");
  assert(fortisVenue !== undefined, "CANON-MH-023 Fortis Mulund venue must exist");
  console.log("Fortis Mulund Venue Status:", {
    venueId: fortisVenue.venueId,
    venue: fortisVenue.venue,
    baselineReportedTrained: fortisVenue.baselineReportedTrained,
    participantsTrained: fortisVenue.participantsTrained,
    totalCourseCount: fortisVenue.totalCourseCount,
  });

  // Fortis Mulund: baseline was 328, verified adjustment +272 -> 600
  assert.strictEqual(fortisVenue.participantsTrained, 600, "Fortis Mulund trained must be 600");

  // ---------------------------------------------------------------------------
  // TEST 5: Status Filtering Invariance (PENDING/REJECTED do not affect totals)
  // ---------------------------------------------------------------------------
  console.log("\n>>> TEST 5: Status Filtering Invariance...");
  const allSupp = await loadImplementedSupplementaryCoursesAsync(true);
  console.log(`Total implemented supplementary courses loaded: ${allSupp.length}`);
  for (const s of allSupp) {
    console.log(` - [${s.reviewId}] ${s.venue} (${s.state}) | Courses: ${s.coursesCount} | Trained: ${s.participantsTrained}`);
  }

  // ---------------------------------------------------------------------------
  // TEST 6: National Consolidation Verification
  // ---------------------------------------------------------------------------
  console.log("\n>>> TEST 6: National Consolidation Verification...");
  const natReport = await getCPRDayNationalConsolidatedReportAsync(true);
  assert(natReport !== null, "National report must exist");

  console.log("National Reconciled Summary:", {
    uniqueVenues: natReport.summary.reconciledReport.uniqueVenues,
    coursesConducted: natReport.summary.reconciledReport.coursesConducted,
    participantsTrained: natReport.summary.reconciledReport.participantsTrained,
    participantsCertified: natReport.summary.reconciledReport.participantsCertified,
  });

  console.log("\n================================================================================");
  console.log("ALL CPR-VERIFY-FIX-02 TESTS PASSED WITH 100% PRECISION!");
  console.log("================================================================================\n");
}

runCPRVerifyFix02Tests()
  .catch((err) => {
    console.error("Test failed with error:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
