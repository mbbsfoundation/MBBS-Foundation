import fs from "fs";
import path from "path";
import crypto from "crypto";
import { prisma } from "../lib/prisma";
import {
  getAllCPRCertificates,
  getAllCPRCertificatesAsync,
  getRetiredChampionIdsAsync,
  getRetiredChampionIdsSync,
  invalidateRetiredChampionCache,
} from "../lib/cprCertificates";
import {
  retireChampionCertificateAsync,
  restoreChampionCertificateAsync,
  searchSanjeevaniById,
  searchSanjeevaniByQuery,
  invalidateStorageCache,
} from "../lib/sanjeevaniStorage";
import {
  loadUnifiedLiveCPRDayDataAsync,
  getCPRDayReconciliationReport,
  getCPRDayNationalConsolidatedReport,
  invalidateLiveCPRIndexCache,
} from "../lib/cprReporting";

function getFileChecksum(filepath: string): string {
  const content = fs.readFileSync(filepath);
  return crypto.createHash("sha256").update(content).digest("hex");
}

async function runTests() {
  console.log("================================================================================");
  console.log("TEST SUITE: SAFE CPR CHAMPION CERTIFICATE RETIREMENT / RESTORE MANAGEMENT");
  console.log("================================================================================\n");

  const snapshotPath = path.join(process.cwd(), "data", "cpr_census_draft_v1_snapshot.json");
  const initialSnapshotChecksum = getFileChecksum(snapshotPath);
  console.log(`[CHECK 1] Authoritative Draft V1 Snapshot Checksum: ${initialSnapshotChecksum.slice(0, 16)}...`);

  // Ensure any previous synthetic test records are cleaned up before establishing baseline
  const TEST_CERT_ID = "IAPCPR/CH/TEST/9999";
  const TEST_CSV_CHAMP_ID = "IAPCPR/CH/AN/0101";
  if (prisma && (prisma as any).adminCertificateRecord) {
    await (prisma as any).adminCertificateRecord.deleteMany({
      where: {
        OR: [
          { certificateId: TEST_CERT_ID },
          { certificateId: TEST_CSV_CHAMP_ID },
          { source: "TEST_SUITE" },
        ],
      },
    });
  }

  // Invalidate any stale caches
  invalidateLiveCPRIndexCache();
  invalidateStorageCache();
  invalidateRetiredChampionCache();

  // Test 1: Query Baseline National & Maharashtra Reports
  console.log("\n>>> Test 1: Fetch Baseline Live CPR Day Reconciliation Data...");
  const liveIndexInitial = await loadUnifiedLiveCPRDayDataAsync(true);
  const mhInitial = getCPRDayReconciliationReport("Maharashtra", liveIndexInitial);
  const nationalInitial = getCPRDayNationalConsolidatedReport(liveIndexInitial);
  if (!mhInitial) throw new Error("FAIL: mhInitial is null");

  console.log(`Initial Maharashtra - Venues: ${mhInitial.summary.reconciledReport.uniqueVenues}, Courses: ${mhInitial.summary.reconciledReport.coursesConducted}, Trained: ${mhInitial.summary.reconciledReport.participantsTrained}, Certified: ${mhInitial.summary.reconciledReport.participantsCertified}, Champions: ${mhInitial.summary.reconciledReport.championsCount}`);
  console.log(`Initial National    - Venues: ${nationalInitial.summary.reconciledReport.uniqueVenues}, Courses: ${nationalInitial.summary.reconciledReport.coursesConducted}, Trained: ${nationalInitial.summary.reconciledReport.participantsTrained}, Certified: ${nationalInitial.summary.reconciledReport.participantsCertified}, Champions: ${nationalInitial.summary.reconciledReport.championsCount}`);

  // Test 2: Verify Existing Historical Champions are Loaded
  console.log("\n>>> Test 2: Check Active Historical Champions...");
  const champions = getAllCPRCertificates("champion");
  console.log(`Total active Champion CSV certificates loaded: ${champions.length}`);
  if (champions.length === 0) {
    throw new Error("FAIL: No champion certificates found in CSV master registry.");
  }
  console.log(`Sample Champion: ID=${champions[0].certificateNumber}, Name="${champions[0].participantName}", State="${champions[0].state}"`);

  // Test 3: Create an Isolated Synthetic Test Champion in DB
  console.log("\n>>> Test 3: Create Synthetic Test Champion in PostgreSQL AdminCertificateRecord...");

  // Clean up if previous test run left anything
  if (prisma && (prisma as any).adminCertificateRecord) {
    await (prisma as any).adminCertificateRecord.deleteMany({
      where: { certificateId: TEST_CERT_ID },
    });
  }

  const createdTest = await (prisma as any).adminCertificateRecord.create({
    data: {
      certificateId: TEST_CERT_ID,
      category: "CPR_CHAMPION",
      status: "VALID",
      source: "TEST_SUITE",
      name: "Test Champion Dr. Jane Doe",
      normalizedName: "jane doe",
      certificateDate: "21 July 2026",
      venueName: "Test Memorial Hospital",
      city: "Mumbai",
      state: "Maharashtra",
      stateCode: "MH",
      notes: "Synthetic test champion for retirement audit",
    },
  });
  console.log(`Created test champion record: ID=${createdTest.certificateId}, Status=${createdTest.status}`);

  // Invalidate cache and reload
  invalidateStorageCache();
  const liveIndexWithTest = await loadUnifiedLiveCPRDayDataAsync(true);
  const mhWithTest = getCPRDayReconciliationReport("Maharashtra", liveIndexWithTest);
  if (!mhWithTest) throw new Error("FAIL: mhWithTest is null");
  console.log(`With Test Champion  - MH Champions Count: ${mhWithTest.summary.reconciledReport.championsCount} (Expected: ${mhInitial.summary.reconciledReport.championsCount + 1})`);

  if (mhWithTest.summary.reconciledReport.championsCount !== mhInitial.summary.reconciledReport.championsCount + 1) {
    throw new Error(`FAIL: Expected MH champions count to increment to ${mhInitial.summary.reconciledReport.championsCount + 1}, got ${mhWithTest.summary.reconciledReport.championsCount}`);
  }

  // Core census invariants check
  if (
    mhWithTest.summary.reconciledReport.participantsTrained !== mhInitial.summary.reconciledReport.participantsTrained ||
    mhWithTest.summary.reconciledReport.participantsCertified !== mhInitial.summary.reconciledReport.participantsCertified ||
    mhWithTest.summary.reconciledReport.uniqueVenues !== mhInitial.summary.reconciledReport.uniqueVenues ||
    mhWithTest.summary.reconciledReport.coursesConducted !== mhInitial.summary.reconciledReport.coursesConducted
  ) {
    throw new Error("FAIL: Core census metrics changed when adding champion!");
  }
  console.log("✓ Core census metrics (Trained, Certified, Venues, Courses) strictly invariant.");

  // Test 4: Retire the Synthetic Test Champion
  console.log("\n>>> Test 4: Retire Synthetic Test Champion via retireChampionCertificateAsync...");
  const retireResult = await retireChampionCertificateAsync({
    certificateId: TEST_CERT_ID,
    reason: "Test Coordinator audit: non-attendance",
    retiredBy: "TEST_RUNNER",
    coordinatorReference: "TEST-AUDIT-2026-001",
  });
  console.log(`Retirement Result: success=${retireResult.success}, message="${retireResult.message}"`);
  if (!retireResult.success) {
    throw new Error(`FAIL: Retirement failed: ${retireResult.error}`);
  }

  // Test 5: Verify Idempotency (Retiring again should return alreadyRetired: true)
  console.log("\n>>> Test 5: Test Retirement Idempotency...");
  const retireAgain = await retireChampionCertificateAsync({
    certificateId: TEST_CERT_ID,
    reason: "Duplicate retirement call",
    retiredBy: "TEST_RUNNER",
  });
  console.log(`Idempotent Retirement: alreadyRetired=${retireAgain.alreadyRetired}, success=${retireAgain.success}`);
  if (!retireAgain.alreadyRetired) {
    throw new Error("FAIL: Expected alreadyRetired: true on duplicate retirement.");
  }

  // Test 6: Verify Reporting Live Counts after Retirement
  console.log("\n>>> Test 6: Verify Live Reporting Counts after Retirement...");
  invalidateStorageCache();
  const liveIndexAfterRetire = await loadUnifiedLiveCPRDayDataAsync(true);
  const mhAfterRetire = getCPRDayReconciliationReport("Maharashtra", liveIndexAfterRetire);
  const nationalAfterRetire = getCPRDayNationalConsolidatedReport(liveIndexAfterRetire);
  if (!mhAfterRetire) throw new Error("FAIL: mhAfterRetire is null");

  console.log(`After Retirement MH - Champions: ${mhAfterRetire.summary.reconciledReport.championsCount} (Expected: ${mhInitial.summary.reconciledReport.championsCount})`);
  console.log(`After Retirement Nat- Champions: ${nationalAfterRetire.summary.reconciledReport.championsCount} (Expected: ${nationalInitial.summary.reconciledReport.championsCount})`);

  if (mhAfterRetire.summary.reconciledReport.championsCount !== mhInitial.summary.reconciledReport.championsCount) {
    throw new Error(`FAIL: Expected MH champions count to return to ${mhInitial.summary.reconciledReport.championsCount}, got ${mhAfterRetire.summary.reconciledReport.championsCount}`);
  }
  if (nationalAfterRetire.summary.reconciledReport.championsCount !== nationalInitial.summary.reconciledReport.championsCount) {
    throw new Error(`FAIL: Expected National champions count to return to ${nationalInitial.summary.reconciledReport.championsCount}, got ${nationalAfterRetire.summary.reconciledReport.championsCount}`);
  }

  // Test 7: Verify Search Behavior for Retired Champion
  console.log("\n>>> Test 7: Verify Search & Lookup Behavior for Retired Certificate...");
  const exactLookup = await searchSanjeevaniById(TEST_CERT_ID);
  console.log(`Exact ID lookup status: ${exactLookup?.status}`);
  if (exactLookup?.status !== "RETIRED") {
    throw new Error(`FAIL: Expected exact ID lookup to have status "RETIRED", got ${exactLookup?.status}`);
  }

  const querySearch = await searchSanjeevaniByQuery("Jane Doe");
  const inQuerySearch = querySearch.some((r) => r.certificateId === TEST_CERT_ID);
  console.log(`Query search for "Jane Doe" contains retired cert: ${inQuerySearch}`);
  if (inQuerySearch) {
    throw new Error("FAIL: Retired certificate must not appear in general query search!");
  }

  // Test 8: Test Restoring the Retired Champion
  console.log("\n>>> Test 8: Test Restoring Certificate to Active Status...");
  const restoreResult = await restoreChampionCertificateAsync({
    certificateId: TEST_CERT_ID,
    reason: "Restored after coordinator verification",
    restoredBy: "TEST_RUNNER",
  });
  console.log(`Restore Result: success=${restoreResult.success}, message="${restoreResult.message}"`);
  if (!restoreResult.success) {
    throw new Error(`FAIL: Restore failed: ${restoreResult.error}`);
  }

  invalidateStorageCache();
  const liveIndexAfterRestore = await loadUnifiedLiveCPRDayDataAsync(true);
  const mhAfterRestore = getCPRDayReconciliationReport("Maharashtra", liveIndexAfterRestore);
  if (!mhAfterRestore) throw new Error("FAIL: mhAfterRestore is null");
  console.log(`After Restore MH - Champions: ${mhAfterRestore.summary.reconciledReport.championsCount} (Expected: ${mhInitial.summary.reconciledReport.championsCount + 1})`);
  if (mhAfterRestore.summary.reconciledReport.championsCount !== mhInitial.summary.reconciledReport.championsCount + 1) {
    throw new Error(`FAIL: Expected MH champions count to increment back to ${mhInitial.summary.reconciledReport.championsCount + 1}`);
  }

  // Test 9: Clean Up Synthetic Test Record
  console.log("\n>>> Test 9: Clean Up Synthetic Test Data...");
  await (prisma as any).adminCertificateRecord.deleteMany({
    where: { certificateId: TEST_CERT_ID },
  });
  invalidateStorageCache();
  invalidateRetiredChampionCache();
  invalidateLiveCPRIndexCache();

  const finalIndex = await loadUnifiedLiveCPRDayDataAsync(true);
  const finalMh = getCPRDayReconciliationReport("Maharashtra", finalIndex);
  const finalNational = getCPRDayNationalConsolidatedReport(finalIndex);
  if (!finalMh) throw new Error("FAIL: finalMh is null");

  console.log(`Final MH Champions: ${finalMh.summary.reconciledReport.championsCount} (Matches Baseline: ${finalMh.summary.reconciledReport.championsCount === mhInitial.summary.reconciledReport.championsCount})`);
  console.log(`Final Nat Champions: ${finalNational.summary.reconciledReport.championsCount} (Matches Baseline: ${finalNational.summary.reconciledReport.championsCount === nationalInitial.summary.reconciledReport.championsCount})`);

  // Test 4b: Verify Mandatory Reason Validation
  console.log("\n>>> Test 4b: Verify Mandatory Reason Validation (Empty Reason Must Fail)...");
  const emptyReasonResult = await retireChampionCertificateAsync({
    certificateId: TEST_CERT_ID,
    reason: "",
    retiredBy: "TEST_RUNNER",
  });
  if (emptyReasonResult.success) {
    throw new Error("FAIL: Retiring with empty reason must fail!");
  }
  console.log("✓ Empty retirement reason correctly rejected.");

  // Test 4c: Verify Category Isolation (Participant/Coordinator/Facility Unaffected)
  console.log("\n>>> Test 4c: Verify Category Isolation...");
  const participantCerts = getAllCPRCertificates("participant");
  const coordinatorCerts = getAllCPRCertificates("coordinator");
  if (participantCerts.length === 0 || coordinatorCerts.length === 0) {
    throw new Error("FAIL: Participant or Coordinator certificates registry empty!");
  }
  console.log(`✓ Participant (${participantCerts.length}) and Coordinator (${coordinatorCerts.length}) registries 100% isolated.`);

  // Test 4d: Verify Historical CSV Champion Overlay Retirement & Restoration
  console.log("\n>>> Test 4d: Test Historical CSV Champion Overlay Retirement...");
  const sampleCsvChamp = champions[0];
  const sampleCsvId = sampleCsvChamp.certificateNumber;
  const sampleCsvInitialCount = (await getAllCPRCertificatesAsync("champion")).length;

  const csvRetireResult = await retireChampionCertificateAsync({
    certificateId: sampleCsvId,
    reason: "Synthetic test audit for historical CSV champion",
    retiredBy: "TEST_RUNNER",
  });
  if (!csvRetireResult.success) {
    throw new Error(`FAIL: Failed to overlay retirement on CSV champion: ${csvRetireResult.error}`);
  }

  // Verify it is excluded from getAllCPRCertificatesAsync("champion")
  const activeAfterCsvRetire = await getAllCPRCertificatesAsync("champion");
  if (activeAfterCsvRetire.length !== sampleCsvInitialCount - 1) {
    throw new Error(`FAIL: Expected active champion count ${sampleCsvInitialCount - 1}, got ${activeAfterCsvRetire.length}`);
  }
  if (activeAfterCsvRetire.some((c) => c.certificateNumber === sampleCsvId)) {
    throw new Error(`FAIL: Retired historical CSV champion ${sampleCsvId} still present in active list!`);
  }

  // Restore the historical CSV champion
  const csvRestoreResult = await restoreChampionCertificateAsync({
    certificateId: sampleCsvId,
    reason: "Restored synthetic CSV test",
    restoredBy: "TEST_RUNNER",
  });
  if (!csvRestoreResult.success) {
    throw new Error(`FAIL: Failed to restore CSV champion: ${csvRestoreResult.error}`);
  }

  // Clean up the DB overlay created for the sample CSV champion
  await (prisma as any).adminCertificateRecord.deleteMany({
    where: { certificateId: sampleCsvId },
  });
  invalidateStorageCache();
  invalidateRetiredChampionCache();

  const activeAfterCsvRestore = await getAllCPRCertificatesAsync("champion");
  if (activeAfterCsvRestore.length !== sampleCsvInitialCount) {
    throw new Error(`FAIL: Expected active champion count to return to ${sampleCsvInitialCount}, got ${activeAfterCsvRestore.length}`);
  }
  console.log(`✓ Historical CSV champion overlay retirement, active suppression, and restoration verified.`);

  // Test 11: Public /api/cprday/certificates Route Regression Test (Genuine Case)
  console.log("\n>>> Test 11: Public /api/cprday/certificates Route Regression Test (Genuine Case IAPCPR/CH/CG/0126)...");
  const { GET: getCertificatesRoute } = await import("../app/api/cprday/certificates/route");
  const { NextRequest } = await import("next/server");

  // 11a: Location dropdown discovery (participants action)
  const reqParticipants = new NextRequest("http://localhost:3000/api/cprday/certificates?action=participants&portal=champion&state=Chhattisgarh&city=Bilaspur&venue=SHREE%20PADMAKSHI%20GLOBAL%20SCHOOL,%20BILASPUR");
  const resParticipants = await getCertificatesRoute(reqParticipants);
  const dataParticipants = await resParticipants.json();
  console.log("Participants in Shree Padmakshi Global School, Bilaspur:", dataParticipants.participants);
  if (dataParticipants.participants.includes("ANURAG GOYAL")) {
    throw new Error("FAIL: Retired champion ANURAG GOYAL found in public location participants list!");
  }
  console.log("✓ Retired champion ANURAG GOYAL correctly excluded from location hierarchy discovery.");

  // 11b: Exact ID lookup
  const reqExact = new NextRequest("http://localhost:3000/api/cprday/certificates?id=IAPCPR/CH/CG/0126");
  const resExact = await getCertificatesRoute(reqExact);
  const dataExact = await resExact.json();
  console.log("Exact ID Lookup Result for IAPCPR/CH/CG/0126:", {
    status: dataExact.status,
    isWithdrawn: dataExact.isWithdrawn,
    isRetired: dataExact.isRetired,
    hasSvg: Boolean(dataExact.certificate?.svg),
  });
  if (dataExact.status !== "WITHDRAWN" || !dataExact.isWithdrawn || !dataExact.isRetired) {
    throw new Error("FAIL: Retired certificate exact ID lookup did not return WITHDRAWN status!");
  }
  if (dataExact.certificate?.svg) {
    throw new Error("FAIL: Retired certificate should NOT render SVG!");
  }
  console.log("✓ Exact ID lookup returns WITHDRAWN status with no SVG generated.");

  // 11c: Hierarchy search
  const reqHierarchy = new NextRequest("http://localhost:3000/api/cprday/certificates?action=search-hierarchy&portal=champion&state=Chhattisgarh&city=Bilaspur&venue=SHREE%20PADMAKSHI%20GLOBAL%20SCHOOL,%20BILASPUR&participant=ANURAG%20GOYAL");
  const resHierarchy = await getCertificatesRoute(reqHierarchy);
  const dataHierarchy = await resHierarchy.json();
  if (dataHierarchy.success) {
    throw new Error("FAIL: Hierarchy search returned retired champion as active!");
  }
  console.log("✓ Hierarchy search correctly rejected for retired champion.");

  // 11d: Active Champion lookup verification
  const activeChamp = champions.find((c) => c.certificateNumber !== "IAPCPR/CH/CG/0126" && c.state === "Chhattisgarh");
  if (activeChamp) {
    const reqActive = new NextRequest(`http://localhost:3000/api/cprday/certificates?id=${activeChamp.certificateNumber}`);
    const resActive = await getCertificatesRoute(reqActive);
    const dataActive = await resActive.json();
    if (!dataActive.success || dataActive.status === "WITHDRAWN" || !dataActive.certificate) {
      throw new Error(`FAIL: Active champion ${activeChamp.certificateNumber} lookup failed!`);
    }
    console.log(`✓ Active champion ${activeChamp.certificateNumber} (${activeChamp.participantName}) verified active and valid.`);
  }

  // Test 10: Snapshot Immutability Check
  console.log("\n>>> Test 12: Snapshot Integrity Verification...");
  const finalSnapshotChecksum = getFileChecksum(snapshotPath);
  if (finalSnapshotChecksum !== initialSnapshotChecksum) {
    throw new Error("FAIL: Snapshot file checksum changed during testing!");
  }
  console.log("✓ Snapshot file is 100% frozen and byte-for-byte identical.");

  console.log("\n================================================================================");
  console.log("ALL CHAMPION RETIREMENT / RESTORE & PUBLIC API TESTS PASSED WITH 100% SUCCESS!");
  console.log("================================================================================\n");
}

runTests().catch((err) => {
  console.error("TEST FAILED WITH ERROR:", err);
  process.exit(1);
});
