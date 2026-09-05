import fs from "fs";
import path from "path";
import { prisma } from "../lib/prisma";
import {
  generatePreview,
  saveGeneratedBatch,
  getHighestSequenceForCategoryAndState,
  searchSanjeevaniById,
  searchSanjeevaniByQuery,
  SanjeevaniInputRow,
} from "../lib/sanjeevaniStorage";

async function cleanupTestFixtures() {
  await prisma.adminCertificateRecord.deleteMany({
    where: {
      certificateId: { in: ["IAPCPR/PA/CH/1110", "IAPCPR/PA/CH/1111"] },
    },
  });
}

async function main() {
  console.log("===============================================================");
  console.log("TEST: CPR CERTIFICATE GENERATION & POSTGRESQL PERSISTENCE");
  console.log("===============================================================");

  // Ensure clean test baseline
  await cleanupTestFixtures();

  try {
    // Step 1: Verify Highest Existing Chandigarh Sequence
    console.log("\n--- 1. Testing Sequence Calculation for Chandigarh (CH) ---");
    const highestCH = await getHighestSequenceForCategoryAndState("CPR_DAY", "CH");
    console.log(`Current highest CH CPR_DAY sequence: ${highestCH}`);
    if (highestCH !== 1109) {
      throw new Error(`Expected highest sequence 1109 for CH, got ${highestCH}`);
    }
    const expectedNextSeq = 1110;
    console.log(`✓ Confirmed next sequence will be ${expectedNextSeq} (IAPCPR/PA/CH/1110)`);

    // Step 2: Test Preview with Mock Participant Data (DO NOT use the 74 genuine records)
    console.log("\n--- 2. Testing Preview Generation (CPR Day Participant) ---");
    const testRows: SanjeevaniInputRow[] = [
      {
        rowNumber: 1,
        name: "TEST PERSISTENCE PARTICIPANT ALPHA",
        state: "Chandigarh",
        stateCode: "CH",
        city: "Chandigarh",
        venue: "PGIMER Test Aud 1",
        date: "21 July 2026",
        mobileNumber: "9999900001",
        email: "test_alpha@example.com",
        isValid: true,
        errors: [],
      },
      {
        rowNumber: 2,
        name: "TEST PERSISTENCE PARTICIPANT BETA",
        state: "Chandigarh",
        stateCode: "CH",
        city: "Chandigarh",
        venue: "PGIMER Test Aud 1",
        date: "21 July 2026",
        mobileNumber: "9999900002",
        email: "test_beta@example.com",
        isValid: true,
        errors: [],
      },
    ];

    const preview = await generatePreview(testRows);
    console.log(`Preview summary: total=${preview.totalRows}, valid=${preview.validCount}, dup=${preview.duplicateCount}`);
    if (preview.validCount !== 2) {
      throw new Error(`Expected 2 valid preview rows, got ${preview.validCount}`);
    }
    if (preview.rows[0].proposedCertificateId !== "IAPCPR/PA/CH/1110") {
      throw new Error(`Expected proposed ID IAPCPR/PA/CH/1110, got ${preview.rows[0].proposedCertificateId}`);
    }
    if (preview.rows[1].proposedCertificateId !== "IAPCPR/PA/CH/1111") {
      throw new Error(`Expected proposed ID IAPCPR/PA/CH/1111, got ${preview.rows[1].proposedCertificateId}`);
    }
    console.log(`✓ Preview accurately allocated sequential IDs: ${preview.rows[0].proposedCertificateId} & ${preview.rows[1].proposedCertificateId}`);

    // Step 3: Test Runtime Zero-Filesystem-Write Guarantee
    console.log("\n--- 3. Testing Zero Filesystem Write during Generation ---");

    // Track any fs.writeFileSync attempts to data directory
    const originalWriteFileSync = fs.writeFileSync;
    let illegalFileWriteAttempted = false;
    let illegalPath = "";

    (fs as any).writeFileSync = function (file: any, data: any, options: any) {
      const fileStr = String(file);
      if (fileStr.includes("data/sanjeevani_certificates.json") || fileStr.includes("data/sanjeevani_batches.json")) {
        illegalFileWriteAttempted = true;
        illegalPath = fileStr;
        throw new Error(`EROFS: read-only file system, open '${fileStr}'`);
      }
      return originalWriteFileSync.apply(fs, arguments as any);
    };

    let genResult: any;
    try {
      genResult = await saveGeneratedBatch("TEST_AUTOMATED_BATCH_DO_NOT_DEPLOY", testRows, false, "CPR_DAY");
    } finally {
      fs.writeFileSync = originalWriteFileSync;
    }

    if (illegalFileWriteAttempted) {
      throw new Error(`CRITICAL DEFECT: Runtime generation attempted to write to ${illegalPath}`);
    }
    console.log(`✓ Confirmed ZERO writes to data/sanjeevani_*.json files during generation.`);
    console.log(`Generated certificates: count=${genResult.certificates.length}, skipped=${genResult.skippedCount}`);

    // Step 4: Verify PostgreSQL Persistence
    console.log("\n--- 4. Verifying PostgreSQL AdminCertificateRecord Persistence ---");
    const cert1 = await prisma.adminCertificateRecord.findUnique({
      where: { certificateId: "IAPCPR/PA/CH/1110" },
    });
    const cert2 = await prisma.adminCertificateRecord.findUnique({
      where: { certificateId: "IAPCPR/PA/CH/1111" },
    });

    if (!cert1 || !cert2) {
      throw new Error("Generated certificates were NOT persisted to PostgreSQL AdminCertificateRecord!");
    }
    console.log(`✓ Persisted record 1: ${cert1.certificateId} | ${cert1.name} | ${cert1.venueName} | ${cert1.state}`);
    console.log(`✓ Persisted record 2: ${cert2.certificateId} | ${cert2.name} | ${cert2.venueName} | ${cert2.state}`);

    // Step 5: Test Public Lookup Integration
    console.log("\n--- 5. Testing Public Certificate Search Integration ---");
    const lookupById = await searchSanjeevaniById("IAPCPR/PA/CH/1110");
    if (!lookupById || lookupById.participantName !== "TEST PERSISTENCE PARTICIPANT ALPHA") {
      throw new Error(`Public lookup by ID failed: expected ALPHA participant, got ${JSON.stringify(lookupById)}`);
    }
    console.log(`✓ Lookup by ID succeeded: ${lookupById.certificateId} (${lookupById.participantName})`);

    const lookupByQuery = await searchSanjeevaniByQuery("TEST PERSISTENCE PARTICIPANT BETA");
    if (lookupByQuery.length === 0 || lookupByQuery[0].certificateId !== "IAPCPR/PA/CH/1111") {
      throw new Error(`Public lookup by query failed: expected BETA participant, got ${JSON.stringify(lookupByQuery)}`);
    }
    console.log(`✓ Lookup by Query succeeded: ${lookupByQuery[0].certificateId} (${lookupByQuery[0].participantName})`);

    // Step 6: Test Idempotency / Duplicate Exclusion on Retry
    console.log("\n--- 6. Testing Idempotency & Duplicate Exclusion on Retry ---");
    const retryPreview = await generatePreview(testRows);
    console.log(`Retry preview: valid=${retryPreview.validCount}, dup=${retryPreview.duplicateCount}`);
    if (retryPreview.duplicateCount !== 2 || retryPreview.validCount !== 0) {
      throw new Error(`Expected 2 duplicates and 0 valid on retry, got dup=${retryPreview.duplicateCount}, valid=${retryPreview.validCount}`);
    }
    console.log(`✓ Duplicate protection accurately recognized existing DB records as ALREADY_CERTIFIED on retry.`);

    // Step 7: Test Other Categories (CPR Champion, Coordinator, Facility, Sanjeevani)
    console.log("\n--- 7. Testing Other Certificate Categories Persistence & Formats ---");
    
    // Non-21-Jul Sanjeevani
    const sanjeevaniRows: SanjeevaniInputRow[] = [
      {
        rowNumber: 1,
        name: "TEST SANJEEVANI RECIPIENT",
        state: "Punjab",
        stateCode: "PB",
        city: "Amritsar",
        venue: "Civil Hospital",
        date: "15 August 2026", // non 21-Jul
        isValid: true,
        errors: [],
      },
    ];
    const sanjPreview = await generatePreview(sanjeevaniRows);
    if (!sanjPreview.rows[0].proposedCertificateId.startsWith("IAPCPR/Sanjeevani/PB/")) {
      throw new Error(`Expected Sanjeevani ID format, got ${sanjPreview.rows[0].proposedCertificateId}`);
    }
    console.log(`✓ Non-21-Jul Sanjeevani format: ${sanjPreview.rows[0].proposedCertificateId}`);

    // Champion
    const champRows: SanjeevaniInputRow[] = [
      {
        rowNumber: 1,
        name: "TEST CHAMPION RECIPIENT",
        state: "Delhi",
        stateCode: "DL",
        city: "New Delhi",
        venue: "AIIMS",
        date: "21 July 2026",
        isValid: true,
        errors: [],
      },
    ];
    const champPreview = await generatePreview(champRows, "CPR_CHAMPION");
    if (!champPreview.rows[0].proposedCertificateId.startsWith("IAPCPR/CH/DL/")) {
      throw new Error(`Expected Champion ID format, got ${champPreview.rows[0].proposedCertificateId}`);
    }
    console.log(`✓ Champion ID format: ${champPreview.rows[0].proposedCertificateId}`);

    // Facility
    const facilityRows: SanjeevaniInputRow[] = [
      {
        rowNumber: 1,
        name: "TEST TRAINING CENTRE",
        venue: "TEST TRAINING CENTRE",
        state: "Haryana",
        stateCode: "HR",
        city: "Gurugram",
        date: "21 July 2026",
        isValid: true,
        errors: [],
      },
    ];
    const facilityPreview = await generatePreview(facilityRows, "CPR_FACILITY");
    if (!facilityPreview.rows[0].proposedCertificateId.startsWith("IAP-CPR-Day/Venue/HR-")) {
      throw new Error(`Expected Facility ID format, got ${facilityPreview.rows[0].proposedCertificateId}`);
    }
    console.log(`✓ Facility ID format: ${facilityPreview.rows[0].proposedCertificateId}`);
  } finally {
    // Step 8: Clean Up Isolated Test Records
    console.log("\n--- 8. Cleaning up Isolated Test Fixtures from PostgreSQL ---");
    await cleanupTestFixtures();
    console.log("✓ Successfully removed test records from PostgreSQL AdminCertificateRecord.");
  }

  // Step 9: Verify Sequence After Cleanup
  const highestAfterClean = await getHighestSequenceForCategoryAndState("CPR_DAY", "CH");
  console.log(`\nHighest sequence after test cleanup: ${highestAfterClean}`);
  if (highestAfterClean !== 1109) {
    throw new Error(`Expected highest sequence to return to 1109, got ${highestAfterClean}`);
  }
  console.log("✓ Sequence state cleanly restored to 1109.\n");

  console.log("===============================================================");
  console.log("ALL CPR CERTIFICATE GENERATION PERSISTENCE TESTS PASSED (100%)");
  console.log("===============================================================");
}

main()
  .catch((err) => {
    console.error("Test failed with error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
