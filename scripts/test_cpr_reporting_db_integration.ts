import "dotenv/config";
import fs from "fs";
import path from "path";
import { prisma } from "../lib/prisma";
import {
  loadUnifiedLiveCPRDayData,
  loadUnifiedLiveCPRDayDataAsync,
  getCPRDayReconciliationReport,
  getCPRDayReconciliationReportAsync,
  getCPRDayNationalConsolidatedReport,
  getCPRDayNationalConsolidatedReportAsync,
  getAllCPRDayReconciliationReports,
  getAllCPRDayReconciliationReportsAsync,
  buildUnifiedLiveCPRDayIndex,
  primeCPRReportingDbCache,
  invalidateLiveCPRIndexCache,
  scoreVenueMatch,
} from "../lib/cprReporting";
import { normalizeVenueKey, getCanonicalVenuesByState } from "../lib/cprVenueRegistry";
import { getLockedOfficialStateCensus } from "../lib/cprStateCensus";

async function runReportingDBIntegrationTests() {
  console.log("================================================================================");
  console.log("TEST SUITE: DATABASE-GENERATED PARTICIPANT CERTIFICATES IN CPR REPORTING");
  console.log("================================================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, msg: string, details?: string) {
    if (condition) {
      console.log(`  ✓ [PASS] ${msg}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${msg}`);
      if (details) console.error(`     Details: ${details}`);
      failed++;
    }
  }

  // --------------------------------------------------------------------------
  // TEST 1: Valid AdminCertificateRecord Participant for 21-Jul-2026 enters current certified reporting
  // --------------------------------------------------------------------------
  console.log("--- TEST 1: Live DB Participant Inclusion ---");
  const liveDataAsync = await loadUnifiedLiveCPRDayDataAsync(true);
  const chLiveParticipants = liveDataAsync.participantsByState.get("Chandigarh") || [];
  const ch1110 = chLiveParticipants.find((p) => p.certificateId === "IAPCPR/PA/CH/1110");
  const ch1183 = chLiveParticipants.find((p) => p.certificateId === "IAPCPR/PA/CH/1183");

  assert(
    Boolean(ch1110 && ch1183),
    "Genuine Chandigarh batch participants (IAPCPR/PA/CH/1110 & 1183) present in live data index",
    `Found: ch1110=${Boolean(ch1110)}, ch1183=${Boolean(ch1183)}`
  );
  assert(
    ch1110?.sourceType === "PRISMA_DB",
    `Participant record IAPCPR/PA/CH/1110 correctly attributed to sourceType 'PRISMA_DB' (got: ${ch1110?.sourceType})`
  );

  // --------------------------------------------------------------------------
  // TEST 2: Historical CSV and identical DB participant count once (Duplicate Suppression)
  // --------------------------------------------------------------------------
  console.log("\n--- TEST 2: Historical Source Precedence & Duplicate Suppression ---");
  const existingCsvCertId = "IAPCPR/PA/CH/0975"; // Known Chandigarh CSV record
  const mockDbWithDuplicate = [
    {
      certificateId: existingCsvCertId,
      category: "PARTICIPANT",
      name: "Duplicate Tester Name",
      certificateDate: "21 July 2026",
      venueName: "CLOUDNINE HOSPITAL",
      city: "Chandigarh",
      state: "Chandigarh",
      stateCode: "CH",
      status: "VALID",
    },
  ];

  const testIndex = buildUnifiedLiveCPRDayIndex(mockDbWithDuplicate);
  const chRecs = testIndex.participantsByState.get("Chandigarh") || [];
  const matchingRecs = chRecs.filter((r) => r.certificateId === existingCsvCertId);

  assert(
    matchingRecs.length === 1,
    `Exact duplicate certificateId (${existingCsvCertId}) counted exactly ONCE (got ${matchingRecs.length})`
  );
  assert(
    matchingRecs[0].sourceType === "CSV_MASTER",
    `Historical CSV source preserved with higher precedence over DB duplicate (source: ${matchingRecs[0].sourceType})`
  );

  // --------------------------------------------------------------------------
  // TEST 3, 4, 5: Champions, Coordinators, Facilities DO NOT increase Participant Certified
  // --------------------------------------------------------------------------
  console.log("\n--- TEST 3, 4, 5: Category Isolation (Non-Participants Excluded) ---");
  const nonParticipantMock = [
    {
      certificateId: "IAPCPR/CH/CH/9991",
      category: "CPR_CHAMPION",
      name: "Champion Test",
      certificateDate: "21 July 2026",
      venueName: "CLOUDNINE HOSPITAL",
      city: "Chandigarh",
      state: "Chandigarh",
      stateCode: "CH",
      status: "VALID",
    },
    {
      certificateId: "IAPCPR/CC/CH/9992",
      category: "COURSE_COORDINATOR",
      name: "Coordinator Test",
      certificateDate: "21 July 2026",
      venueName: "CLOUDNINE HOSPITAL",
      city: "Chandigarh",
      state: "Chandigarh",
      stateCode: "CH",
      status: "VALID",
    },
    {
      certificateId: "IAP-CPR-DAY/VENUE/CH/9993",
      category: "CPR_FACILITY",
      name: "Facility Test",
      certificateDate: "21 July 2026",
      venueName: "CLOUDNINE HOSPITAL",
      city: "Chandigarh",
      state: "Chandigarh",
      stateCode: "CH",
      status: "VALID",
    },
  ];

  const catIndex = buildUnifiedLiveCPRDayIndex(nonParticipantMock);
  const catChParticipants = catIndex.participantsByState.get("Chandigarh") || [];
  const hasChampInParticipants = catChParticipants.some((p) => p.certificateId === "IAPCPR/CH/CH/9991");
  const hasCoordInParticipants = catChParticipants.some((p) => p.certificateId === "IAPCPR/CC/CH/9992");
  const hasFacInParticipants = catChParticipants.some((p) => p.certificateId === "IAP-CPR-DAY/VENUE/CH/9993");

  assert(!hasChampInParticipants, "Champion DB record DOES NOT enter Participant Certified count");
  assert(!hasCoordInParticipants, "Course Coordinator DB record DOES NOT enter Participant Certified count");
  assert(!hasFacInParticipants, "Facility DB record DOES NOT enter Participant Certified count");

  // --------------------------------------------------------------------------
  // TEST 6: Cloudnine Hospital Reconciliation Logic (Baseline 80, Certified 74 -> Trained 80)
  // --------------------------------------------------------------------------
  console.log("\n--- TEST 6: Cloudnine Hospital Reconciliation Formula ---");
  const chReport = await getCPRDayReconciliationReportAsync("Chandigarh");
  const cloudnineVenue = chReport?.venues.find((v) =>
    v.venue.toUpperCase().includes("CLOUDNINE")
  );

  assert(cloudnineVenue !== undefined, "Cloudnine Hospital found in Chandigarh report venues");
  assert(
    cloudnineVenue?.baselineReportedTrained === 80,
    `Cloudnine baseline reported trained is 80 (got: ${cloudnineVenue?.baselineReportedTrained})`
  );
  assert(
    cloudnineVenue?.participantsCertified === 74,
    `Cloudnine participants certified is exactly 74 from DB batch (got: ${cloudnineVenue?.participantsCertified})`
  );
  assert(
    cloudnineVenue?.participantsTrained === 80,
    `Cloudnine participants trained remains max(80, 74) = 80 (got: ${cloudnineVenue?.participantsTrained})`
  );

  // --------------------------------------------------------------------------
  // TEST 7: Reconciliation Formula when Certified exceeds Baseline (e.g. 81 > 80 -> 81)
  // --------------------------------------------------------------------------
  console.log("\n--- TEST 7: Reconciliation Formula when Certified > Baseline ---");
  const synthetic81DbRecords = Array.from({ length: 81 }, (_, i) => ({
    certificateId: `IAPCPR/PA/CH/980${i.toString().padStart(2, "0")}`,
    category: "PARTICIPANT",
    name: `Test Participant ${i}`,
    certificateDate: "21 July 2026",
    venueName: "CLOUDNINE HOSPITAL",
    city: "Chandigarh",
    state: "Chandigarh",
    stateCode: "CH",
    status: "VALID",
  }));

  const index81 = buildUnifiedLiveCPRDayIndex(synthetic81DbRecords);
  const chReport81 = getCPRDayReconciliationReport("Chandigarh", index81);
  const cloudnine81 = chReport81?.venues.find((v) =>
    v.venue.toUpperCase().includes("CLOUDNINE")
  );

  assert(
    cloudnine81?.participantsCertified === 81,
    `Synthetic certified count is 81 (got: ${cloudnine81?.participantsCertified})`
  );
  assert(
    cloudnine81?.participantsTrained === 81,
    `When certified (81) > baseline (80), participantsTrained becomes max(80, 81) = 81 (got: ${cloudnine81?.participantsTrained})`
  );

  // --------------------------------------------------------------------------
  // TEST 8: Historical Draft V1 Invariant (Frozen Snapshot)
  // --------------------------------------------------------------------------
  console.log("\n--- TEST 8: Historical Draft V1 Invariant ---");
  const snapshotRaw = fs.readFileSync("data/cpr_census_draft_v1_snapshot.json", "utf-8");
  const snapshot = JSON.parse(snapshotRaw);

  assert(snapshot.nationalTotals.currentDraftCourses === 395, "Draft V1 snapshot currentDraftCourses = 395");
  assert(snapshot.nationalTotals.currentDraftPhysicalVenues === 292, "Draft V1 snapshot currentDraftPhysicalVenues = 292");
  assert(snapshot.nationalTotals.draftReconciledParticipantsTrained === 47033, "Draft V1 snapshot draftReconciledParticipantsTrained = 47,033");
  assert(snapshot.nationalTotals.participantsCertified === 33477, "Draft V1 snapshot participantsCertified = 33,477");

  // --------------------------------------------------------------------------
  // TEST 9: State Certified Aggregation Updates Correctly (Chandigarh: 789 -> 863)
  // --------------------------------------------------------------------------
  console.log("\n--- TEST 9: State Certified Aggregation (Chandigarh) ---");
  assert(
    chReport?.summary.baseline.courses === 13,
    `Chandigarh baseline courses = 13 (got: ${chReport?.summary.baseline.courses})`
  );
  assert(
    chReport?.summary.baseline.uniqueVenues === 9,
    `Chandigarh physical venues = 9 (got: ${chReport?.summary.baseline.uniqueVenues})`
  );
  assert(
    chReport?.summary.reconciledReport.participantsTrained === 1387,
    `Chandigarh participants trained remains 1,387 (got: ${chReport?.summary.reconciledReport.participantsTrained})`
  );
  assert(
    chReport?.summary.reconciledReport.participantsCertified === 863,
    `Chandigarh participants certified updated to 863 (789 + 74) (got: ${chReport?.summary.reconciledReport.participantsCertified})`
  );

  // --------------------------------------------------------------------------
  // TEST 10: National Reconciled Aggregation Validation
  // --------------------------------------------------------------------------
  console.log("\n--- TEST 10: National Reconciled Aggregation ---");
  
  // 10A: Isolated Chandigarh batch scenario
  const chOnlyDbRecords = (liveDataAsync.participantsByState.get("Chandigarh") || [])
    .filter((p) => p.sourceType === "PRISMA_DB")
    .map((p) => ({
      certificateId: p.certificateId,
      category: "PARTICIPANT",
      name: p.name,
      certificateDate: p.courseDate,
      venueName: p.venue,
      city: p.city,
      state: p.state,
      stateCode: p.stateCode,
      status: "VALID",
    }));

  const chIsolatedIndex = buildUnifiedLiveCPRDayIndex(chOnlyDbRecords);
  const chIsolatedNational = getCPRDayNationalConsolidatedReport(chIsolatedIndex);

  assert(
    chIsolatedNational.summary.reconciledReport.participantsCertified === 33551,
    `Isolated Chandigarh batch yields National Certified = 33,551 (33,477 + 74) (got: ${chIsolatedNational.summary.reconciledReport.participantsCertified})`
  );
  assert(
    chIsolatedNational.summary.reconciledReport.participantsTrained === 47033,
    `Isolated Chandigarh batch yields National Trained = 47,033 (got: ${chIsolatedNational.summary.reconciledReport.participantsTrained})`
  );

  // 10B: Live full production aggregation
  const nationalReport = await getCPRDayNationalConsolidatedReportAsync(true);
  assert(
    nationalReport.summary.reconciledReport.coursesConducted === 395,
    `National courses conducted = 395 (got: ${nationalReport.summary.reconciledReport.coursesConducted})`
  );
  assert(
    nationalReport.summary.reconciledReport.uniqueVenues === 292,
    `National unique physical venues = 292 (got: ${nationalReport.summary.reconciledReport.uniqueVenues})`
  );
  assert(
    nationalReport.summary.reconciledReport.participantsCertified >= 33551,
    `Live National certified includes genuine batches (>= 33,551) (got: ${nationalReport.summary.reconciledReport.participantsCertified})`
  );

  // --------------------------------------------------------------------------
  // TEST 11: Venue Mapping & Normalization (Cloudenine Hospital vs CLOUDNINE HOSPITAL)
  // --------------------------------------------------------------------------
  console.log("\n--- TEST 11: Venue Mapping & Alias Normalization ---");
  const spellingVariantMatch = scoreVenueMatch(
    "Cloudenine Hospital",
    "Chandigarh",
    "CLOUDNINE HOSPITAL",
    "Chandigarh"
  );

  assert(
    spellingVariantMatch.score >= 0.75,
    `Spelling variant 'Cloudenine Hospital' matches 'CLOUDNINE HOSPITAL' with high confidence (score: ${spellingVariantMatch.score})`
  );
  assert(
    chReport?.summary.reconciledReport.uniqueVenues === 9,
    `Zero new physical venues created for Chandigarh (unique physical venues remains 9, got: ${chReport?.summary.reconciledReport.uniqueVenues})`
  );

  // --------------------------------------------------------------------------
  // TEST 12: Non-21-Jul Sanjeevani Participant Scope Isolation
  // --------------------------------------------------------------------------
  console.log("\n--- TEST 12: Programme-Scope Distinction ---");
  const nonCprDayMock = [
    {
      certificateId: "IAPCPR/Sanjeevani/CH/9999",
      category: "SANJEEVANI",
      name: "Non-CPR Day Participant",
      certificateDate: "15 August 2026",
      venueName: "CLOUDNINE HOSPITAL",
      city: "Chandigarh",
      state: "Chandigarh",
      stateCode: "CH",
      status: "VALID",
    },
  ];

  const nonCprIndex = buildUnifiedLiveCPRDayIndex(nonCprDayMock);
  const nonCprParticipants = nonCprIndex.participantsByState.get("Chandigarh") || [];
  const hasNonCprInList = nonCprParticipants.some((p) => p.certificateId === "IAPCPR/Sanjeevani/CH/9999");

  assert(
    !hasNonCprInList,
    "Non-21-Jul Sanjeevani certificate DOES NOT enter CPR Day census report"
  );

  // --------------------------------------------------------------------------
  // SUMMARY
  // --------------------------------------------------------------------------
  console.log("\n================================================================================");
  console.log(`REPORTING INTEGRATION TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("================================================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runReportingDBIntegrationTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
