import assert from "assert";
import fs from "fs";
import path from "path";
import { NextRequest } from "next/server";
import { prisma } from "../lib/prisma";
import { resolveCPRVenue, resolveCPRVenueAsync } from "../lib/cprVenueResolution";
import { getLockedOfficialStateCensus } from "../lib/cprStateCensus";
import {
  getCPRDayReconciliationReport,
  getCPRDayReconciliationReportAsync,
  getCPRDayNationalConsolidatedReportAsync,
  loadUnifiedLiveCPRDayData,
  loadUnifiedLiveCPRDayDataAsync,
} from "../lib/cprReporting";
import { GET as getCertificatesApi } from "../app/api/cprday/certificates/route";
import { POST as postAdminCertApi } from "../app/api/cprsanjeevani/admin-certificate/route";
import { createAdminToken } from "../lib/adminAuth";

async function runCPRVerifyFix03Tests() {
  console.log("================================================================================");
  console.log("TEST SUITE: CPR-VERIFY-FIX-03 (UNIFIED BULK PARTICIPANT -> VENUE -> CERTIFICATE)");
  console.log("================================================================================\n");

  let passed = 0;
  let failed = 0;

  function testPass(msg: string) {
    console.log(`  ✓ [PASS] ${msg}`);
    passed++;
  }

  function testFail(msg: string, err?: any) {
    console.error(`  ❌ [FAIL] ${msg}`, err || "");
    failed++;
  }

  // ============================================================================
  // TEST 1: CENTRAL VENUE RESOLUTION SERVICE UNIT TESTS
  // ============================================================================
  console.log(">>> TEST 1: Central Venue Resolution Service...");
  try {
    // 1A. Exact ID match
    const canonMatch = resolveCPRVenue({
      state: "Delhi",
      venueName: "Any Name",
      venueId: "CANON-DL-001",
    });
    assert.strictEqual(canonMatch.status, "EXACT_CANONICAL");
    assert.strictEqual(canonMatch.resolvedVenueId, "CANON-DL-001");
    testPass("Exact ID matches canonical venue CANON-DL-001");

    const suppMatch = await resolveCPRVenueAsync({
      state: "Delhi",
      venueName: "Any Name",
      venueId: "SUPP-65DLJ6",
    }, true);
    assert.strictEqual(suppMatch.status, "EXACT_SUPPLEMENTARY");
    assert.strictEqual(suppMatch.resolvedVenueId, "SUPP-65DLJ6");
    testPass("Exact ID matches supplementary venue SUPP-65DLJ6");

    // 1B. Normalized match: BR AMBEDKAR CM SHRI SCHOOL -> SUPP-65DLJ6
    const normMatch = await resolveCPRVenueAsync({
      state: "Delhi",
      city: "New Delhi",
      venueName: "BR AMBEDKAR CM SHRI SCHOOL",
    });
    assert.strictEqual(normMatch.status, "NORMALIZED_MATCH");
    assert.strictEqual(normMatch.resolvedVenueId, "SUPP-65DLJ6");
    assert.strictEqual(normMatch.canonicalVenueName, "B R AMBEDKAR CM SHRI SCHOOL DESU CPLONY JANAKPURI");
    assert.strictEqual(normMatch.isExistingVenue, true);
    testPass("Bulk upload string 'BR AMBEDKAR CM SHRI SCHOOL' cleanly resolves to SUPP-65DLJ6");

    // 1C. Institution Discrimination: Sector 10 Dwarka vs Janakpuri CM Shri
    const dwarkaMatch = await resolveCPRVenueAsync({
      state: "Delhi",
      city: "DWARKA",
      venueName: "B.R. AMBEDKAR SCHOOL, SECTOR 10",
    });
    assert.strictEqual(dwarkaMatch.status, "EXACT_CANONICAL");
    assert.strictEqual(dwarkaMatch.resolvedVenueId, "CANON-DL-002");
    assert.strictEqual(dwarkaMatch.canonicalVenueName, "B.R. AMBEDKAR SCHOOL, SECTOR 10");
    testPass("Distinct institution 'B.R. AMBEDKAR SCHOOL, SECTOR 10' in DWARKA resolves to CANON-DL-002 (never merged with SUPP-65DLJ6)");

    // 1D. Genuinely new venue
    const newVenueMatch = await resolveCPRVenueAsync({
      state: "Delhi",
      city: "New Delhi",
      venueName: "XYZ NONEXISTENT MODEL GLOBAL SCHOOL",
    });
    assert.strictEqual(newVenueMatch.status, "GENUINELY_NEW");
    assert.strictEqual(newVenueMatch.isExistingVenue, false);
    testPass("Genuinely new venue is correctly classified as GENUINELY_NEW");
  } catch (e) {
    testFail("Test 1 venue resolution failed", e);
  }

  // ============================================================================
  // TEST 2: STRICT CATEGORY ISOLATION IN PUBLIC API
  // ============================================================================
  console.log("\n>>> TEST 2: Category Isolation in Public Portal Hierarchy API...");
  try {
    // 2A. Participant Portal Dropdown for Delhi Supplementary Venue
    const reqPart = new NextRequest(
      "http://localhost:3000/api/cprday/certificates?action=participants&state=Delhi&city=Delhi&venue=B%20R%20AMBEDKAR%20CM%20SHRI%20SCHOOL%20DESU%20CPLONY%20JANAKPURI&portal=participant"
    );
    const resPart = await getCertificatesApi(reqPart);
    const dataPart = await resPart.json();

    assert.strictEqual(dataPart.success, true);
    assert.strictEqual(dataPart.participants.length, 171, `Participant count must be 171 (got: ${dataPart.participants?.length})`);
    assert.strictEqual(dataPart.participants.includes("B R AMBEDKAR CM SHRI SCHOOL DESU CPLONY JANAKPURI"), false, "Venue name must NOT be in participant dropdown");
    assert.strictEqual(dataPart.participants.includes("Dr Pankaj Goel"), false, "Course coordinator must NOT be in participant dropdown");
    testPass("Participant portal dropdown returns exactly 171 participant names with zero venue/coordinator leakage");

    // 2B. Coordinator Portal Dropdown
    const reqCoord = new NextRequest(
      "http://localhost:3000/api/cprday/certificates?action=participants&state=Delhi&city=Delhi&venue=B%20R%20AMBEDKAR%20CM%20SHRI%20SCHOOL%20DESU%20CPLONY%20JANAKPURI&portal=coordinator"
    );
    const resCoord = await getCertificatesApi(reqCoord);
    const dataCoord = await resCoord.json();
    assert.strictEqual(dataCoord.success, true);
    assert.deepStrictEqual(dataCoord.participants, ["Dr Pankaj Goel"]);
    testPass("Coordinator portal dropdown returns exclusively ['Dr Pankaj Goel']");

    // 2C. Facility Portal Dropdown (Must be empty since facility is a venue, not a person)
    const reqFac = new NextRequest(
      "http://localhost:3000/api/cprday/certificates?action=participants&state=Delhi&city=Delhi&venue=B%20R%20AMBEDKAR%20CM%20SHRI%20SCHOOL%20DESU%20CPLONY%20JANAKPURI&portal=facility"
    );
    const resFac = await getCertificatesApi(reqFac);
    const dataFac = await resFac.json();
    assert.strictEqual(dataFac.success, true);
    assert.deepStrictEqual(dataFac.participants, []);
    testPass("Facility portal dropdown returns []");
  } catch (e) {
    testFail("Test 2 category isolation failed", e);
  }

  // ============================================================================
  // TEST 3: DELHI REAL PRODUCTION CASE RECONCILIATION
  // ============================================================================
  console.log("\n>>> TEST 3: Delhi Real Case State Census & Centre-Wise Reconciliation...");
  try {
    const report = await getCPRDayReconciliationReportAsync("Delhi", true);
    assert(report !== null, "Delhi report must exist");

    // 3A. Baseline Invariant
    assert.strictEqual(report.summary.baseline.uniqueVenues, 6, "Delhi baseline unique venues = 6");
    assert.strictEqual(report.summary.baseline.courses, 10, "Delhi baseline courses = 10");
    assert.strictEqual(report.summary.baseline.reportedTrained, 939, "Delhi baseline reported trained = 939");
    assert.strictEqual(report.summary.baseline.isLocked, true, "Delhi baseline isLocked = true");
    testPass("Delhi baseline summary is strictly frozen (6 venues, 10 courses, 939 trained)");

    // 3B. Reconciled State Summary
    assert.strictEqual(report.summary.reconciledReport.uniqueVenues, 7, "Delhi reconciled physical venues = 7");
    assert.strictEqual(report.summary.reconciledReport.coursesConducted, 11, "Delhi reconciled courses = 11");
    assert.strictEqual(report.summary.reconciledReport.participantsTrained, 1349, "Delhi reconciled participants trained = 1,349 (939 baseline + 410 supplementary)");
    assert.strictEqual(report.summary.reconciledReport.participantsCertified, 983, "Delhi reconciled participants certified = 983 (812 + 171)");
    assert.strictEqual(report.summary.reconciledReport.coordinatorsCount, 6, "Delhi reconciled coordinators count = 6");
    testPass("Delhi reconciled state summary accurately reflects +1 venue, +1 course, 410 trained, 983 certified (total trained: 1,349)");

    // 3C. Supplementary Venue Centre Row SUPP-65DLJ6
    const suppRow = report.centres.find((c) => c.canonicalVenueId === "SUPP-65DLJ6");
    assert(suppRow !== undefined, "SUPP-65DLJ6 centre row must exist in Delhi report");
    assert.strictEqual(suppRow?.projectedTotal, 410, "SUPP-65DLJ6 participantsTrained = 410");
    assert.strictEqual(suppRow?.liveRecords, 171, "SUPP-65DLJ6 participantsCertified = 171");
    assert.strictEqual(suppRow?.coursesCount, 1, "SUPP-65DLJ6 coursesCount = 1");
    assert.strictEqual(suppRow?.classification, "APPROVED_SUPPLEMENTARY");
    testPass("Centre row SUPP-65DLJ6 displays Trained: 410, Certified: 171, Courses: 1");

    // 3D. Mathematical Invariant: Centre-Wise Sum == Top Summary Card
    const sumCourses = report.centres.reduce((sum, c) => sum + (c.coursesCount || 0), 0);
    const sumCertified = report.centres.reduce((sum, c) => sum + (c.liveRecords || 0), 0);
    assert.strictEqual(sumCourses, report.summary.reconciledReport.coursesConducted, "Table sum courses matches top summary");
    assert.strictEqual(sumCertified, report.summary.reconciledReport.participantsCertified, "Table sum certified matches top summary");
    testPass("Centre-wise table mathematical sum matches top summary card with 100% precision");
  } catch (e) {
    testFail("Test 3 Delhi real case failed", e);
  }

  // ============================================================================
  // TEST 4: SEARCH BY CERTIFICATE ID & CERTIFICATE ACCESS
  // ============================================================================
  console.log("\n>>> TEST 4: Search by Certificate ID & Certificate Access...");
  try {
    // 4A. First Participant in Batch: Prashant (IAPCPR/PA/DLI/1316)
    const req1 = new NextRequest("http://localhost:3000/api/cprday/certificates?id=IAPCPR/PA/DLI/1316&portal=participant");
    const res1 = await getCertificatesApi(req1);
    const data1 = await res1.json();
    assert.strictEqual(data1.success, true);
    assert.strictEqual(data1.certificate.certificateId, "IAPCPR/PA/DLI/1316");
    assert.strictEqual(data1.certificate.participantName, "Prashant");
    assert.strictEqual(data1.certificate.portalType, "participant");
    testPass("First certificate ID IAPCPR/PA/DLI/1316 resolves to Prashant");

    // 4B. Last Participant in Batch: Pauptria (IAPCPR/PA/DLI/1486)
    const req2 = new NextRequest("http://localhost:3000/api/cprday/certificates?id=IAPCPR/PA/DLI/1486&portal=participant");
    const res2 = await getCertificatesApi(req2);
    const data2 = await res2.json();
    assert.strictEqual(data2.success, true);
    assert.strictEqual(data2.certificate.certificateId, "IAPCPR/PA/DLI/1486");
    assert.strictEqual(data2.certificate.participantName, "Pauptria");
    assert.strictEqual(data2.certificate.portalType, "participant");
    testPass("Last certificate ID IAPCPR/PA/DLI/1486 resolves to Pauptria");

    // 4C. Coordinator Certificate: Dr Pankaj Goel (IAPCPR/CC/DL/0101)
    const reqCoord = new NextRequest("http://localhost:3000/api/cprday/certificates?id=IAPCPR/CC/DL/0101&portal=coordinator");
    const resCoord = await getCertificatesApi(reqCoord);
    const dataCoord = await resCoord.json();
    assert.strictEqual(dataCoord.success, true);
    assert.strictEqual(dataCoord.certificate.certificateId, "IAPCPR/CC/DL/0101");
    assert.strictEqual(dataCoord.certificate.participantName, "Dr Pankaj Goel");
    assert.strictEqual(dataCoord.certificate.portalType, "coordinator");
    testPass("Coordinator certificate IAPCPR/CC/DL/0101 resolves to Dr Pankaj Goel (coordinator)");
  } catch (e) {
    testFail("Test 4 certificate search failed", e);
  }

  // ============================================================================
  // TEST 5: DUPLICATE VENUE PREVENTION IN INDIVIDUAL VENUE ADDITION
  // ============================================================================
  console.log("\n>>> TEST 5: Duplicate Venue Prevention in Individual Venue Addition...");
  try {
    const adminToken = createAdminToken();
    // Attempt to add duplicate of B R Ambedkar school via individual addition
    const duplicatePayload = {
      category: "CPR_FACILITY",
      name: "B R AMBEDKAR CM SHRI SCHOOL DESU CPLONY JANAKPURI",
      venueName: "B R AMBEDKAR CM SHRI SCHOOL DESU CPLONY JANAKPURI",
      state: "Delhi",
      stateCode: "DL",
      city: "Delhi",
    };

    const res = await postAdminCertApi(
      new NextRequest("http://localhost:3000/api/cprsanjeevani/admin-certificate", {
        method: "POST",
        body: JSON.stringify(duplicatePayload),
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
      })
    );
    const data = await res.json();
    assert.strictEqual(res.status, 409, "Duplicate venue creation must return 409 Conflict");
    assert.strictEqual(data.success, false);
    assert(data.error.includes("Venue already exists"), "Error message must state 'Venue already exists'");
    testPass("Individual venue addition correctly blocks duplicate creation of SUPP-65DLJ6 (409 Conflict)");
  } catch (e) {
    testFail("Test 5 duplicate prevention failed", e);
  }

  // ============================================================================
  // TEST 6: NATIONAL RECONCILIATION AGGREGATION
  // ============================================================================
  console.log("\n>>> TEST 6: National Consolidation Dynamic Certified Aggregation...");
  try {
    const natReport = await getCPRDayNationalConsolidatedReportAsync(true);
    assert(natReport.summary.reconciledReport.uniqueVenues >= 295, "National unique venues >= 295");
    assert(natReport.summary.reconciledReport.coursesConducted >= 398, "National courses conducted >= 398");
    assert(natReport.summary.reconciledReport.participantsCertified >= 33648, `National certified includes valid DB certs (got: ${natReport.summary.reconciledReport.participantsCertified})`);
    testPass("National consolidated report dynamically aggregates certified participants across all states");
  } catch (e) {
    testFail("Test 6 national aggregation failed", e);
  }

  // ============================================================================
  // SUMMARY
  // ============================================================================
  console.log("\n================================================================================");
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("================================================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runCPRVerifyFix03Tests().catch((err) => {
  console.error("Test runner encountered an unhandled error:", err);
  process.exit(1);
});
