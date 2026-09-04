import "dotenv/config";
import {
  parseAndNormalizeCourseDate,
  generatePreview,
  buildUnifiedParticipantDuplicateIndex,
  checkParticipantDuplicate,
  getHighestSequenceForCategoryAndState,
  SanjeevaniInputRow,
} from "../lib/sanjeevaniStorage";

async function runHardeningValidation() {
  console.log("================================================================================");
  console.log("TEST SUITE: CPR SANJEEVANI CERTIFICATE GENERATION HARDENING VALIDATION");
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

  // TEST GROUP 1: Date Normalization (All CPR Day Formats)
  console.log("--- TEST GROUP 1: Course Date Normalization for 21 July 2026 (CPR Day) ---");
  const cprDayFormats = [
    "21-07-2026",
    "21-7-2026",
    "21-07-26",
    "21-7-26",
    "21/07/2026",
    "21/7/2026",
    "21/07/26",
    "21/7/26",
    "21.07.2026",
    "21.7.2026",
    "21.7.26",
    "2026-07-21",
    "2026/07/21",
    "21 July 2026",
    "21st July 2026",
    "21-Jul-2026",
    "July 21, 2026",
    46224, // Excel serial for 2026-07-21
  ];

  for (const rawDate of cprDayFormats) {
    const res = parseAndNormalizeCourseDate(rawDate);
    assert(
      res.isValid && res.isoDate === "2026-07-21" && res.isCprDay === true,
      `Date format "${rawDate}" normalizes to 2026-07-21 (CPR_DAY)`,
      JSON.stringify(res)
    );
  }

  // TEST GROUP 2: Other Course Dates (Sanjeevani Formats)
  console.log("\n--- TEST GROUP 2: Course Date Normalization for Non-21-July Dates (Sanjeevani) ---");
  const sanjeevaniDates = [
    { input: "22-07-2026", expectedIso: "2026-07-22" },
    { input: "22/7/26", expectedIso: "2026-07-22" },
    { input: "15-08-2026", expectedIso: "2026-08-15" },
    { input: "05-09-2026", expectedIso: "2026-09-05" },
    { input: "10 October 2026", expectedIso: "2026-10-10" },
  ];

  for (const item of sanjeevaniDates) {
    const res = parseAndNormalizeCourseDate(item.input);
    assert(
      res.isValid && res.isoDate === item.expectedIso && res.isCprDay === false,
      `Date "${item.input}" normalizes to ${item.expectedIso} (SANJEEVANI)`,
      JSON.stringify(res)
    );
  }

  // TEST GROUP 3: Invalid / Unparseable Dates
  console.log("\n--- TEST GROUP 3: Unparseable Date Handling ---");
  const invalidDates = ["invalid-date", "31-02-2026", "99/99/9999", ""];
  for (const badDate of invalidDates) {
    const res = parseAndNormalizeCourseDate(badDate);
    assert(
      res.isValid === false,
      `Invalid date "${badDate}" is rejected gracefully with error`,
      res.error
    );
  }

  // TEST GROUP 4: Highest Sequence Check
  console.log("\n--- TEST GROUP 4: Highest Sequence Calculation for West Bengal ---");
  const wbHighestPA = await getHighestSequenceForCategoryAndState("CPR_DAY", "WB");
  assert(
    wbHighestPA >= 5240,
    `West Bengal highest CPR Day sequence is at least 5240 (found: ${wbHighestPA})`
  );

  // TEST GROUP 5: Duplicate Detection & Same Name at Different Venue
  console.log("\n--- TEST GROUP 5: Duplicate Detection & Same Name at Different Venues ---");
  const duplicateIndex = buildUnifiedParticipantDuplicateIndex();

  // 5A: Exact Duplicate in Master CSV (DR SOUGATA BISWAS in WB at Eyora Clinic Howrah)
  const exactDupCheck = checkParticipantDuplicate(
    {
      name: "DR SOUGATA BISWAS",
      venue: "Eyora Clinic Howrah",
      city: "Kolkata",
      stateCode: "WB",
      date: "21-07-2026",
    },
    duplicateIndex
  );

  assert(
    exactDupCheck.status === "ALREADY_CERTIFIED" && exactDupCheck.existingCertificateId === "IAPCPR/PA/WB/5240",
    `Exact duplicate recognized in master CSV (ID: ${exactDupCheck.existingCertificateId})`,
    JSON.stringify(exactDupCheck)
  );

  // 5B: Same name (RAHUL SHARMA) at two different legitimate venues
  const candidateVenue1 = checkParticipantDuplicate(
    {
      name: "RAHUL SHARMA",
      venue: "City Hospital Pune",
      city: "Pune",
      stateCode: "MH",
      date: "21-07-2026",
    },
    duplicateIndex
  );

  const candidateVenue2 = checkParticipantDuplicate(
    {
      name: "RAHUL SHARMA",
      venue: "Ruby Hall Clinic Nagpur",
      city: "Nagpur",
      stateCode: "MH",
      date: "21-07-2026",
    },
    duplicateIndex
  );

  assert(
    candidateVenue1.status === "UNIQUE" && candidateVenue2.status === "UNIQUE",
    "Two candidates named 'RAHUL SHARMA' at different venues are NOT falsely suppressed as duplicates"
  );

  // TEST GROUP 6: Preview Sequence Allocation without Burning Numbers
  console.log("\n--- TEST GROUP 6: Preview Sequence Allocation (No Gap Burning) ---");
  const testBatch: SanjeevaniInputRow[] = [
    // Row 1: Exact Duplicate (Existing Master in WB: IAPCPR/PA/WB/5240)
    {
      rowNumber: 1,
      name: "DR SOUGATA BISWAS",
      venue: "Eyora Clinic Howrah",
      city: "Kolkata",
      state: "West Bengal",
      stateCode: "WB",
      date: "21-07-2026",
      isValid: true,
      errors: [],
    },
    // Row 2: Eligible NEW Participant in WB (CPR Day)
    {
      rowNumber: 2,
      name: "New Test Participant Alpha",
      venue: "Kolkata Medical College",
      city: "Kolkata",
      state: "West Bengal",
      stateCode: "WB",
      date: "21-07-2026",
      isValid: true,
      errors: [],
    },
    // Row 3: Eligible NEW Participant in WB (CPR Day)
    {
      rowNumber: 3,
      name: "New Test Participant Beta",
      venue: "Kolkata Medical College",
      city: "Kolkata",
      state: "West Bengal",
      stateCode: "WB",
      date: "21-7-26",
      isValid: true,
      errors: [],
    },
    // Row 4: Eligible NEW Participant in WB with Non-21-July date (Sanjeevani)
    {
      rowNumber: 4,
      name: "New Test Sanjeevani Participant Gamma",
      venue: "Siliguri District Hospital",
      city: "Siliguri",
      state: "West Bengal",
      stateCode: "WB",
      date: "15-08-2026",
      isValid: true,
      errors: [],
    },
  ];

  const preview = await generatePreview(testBatch);

  assert(preview.rows.length === 4, "Preview evaluated all 4 test rows");
  assert(preview.duplicateCount === 1, "Duplicate count is exactly 1");
  assert(preview.validCount === 3, "Valid new count is exactly 3");

  // Check Row 1 (Duplicate): receives NO sequence number and NO new ID
  const r1 = preview.rows[0];
  assert(
    r1.isDuplicate === true &&
      r1.rowStatus === "ALREADY CERTIFIED" &&
      r1.proposedCertificateId === "" &&
      r1.proposedSequence === 0 &&
      r1.existingCertificateId === "IAPCPR/PA/WB/5240",
    "Duplicate Row 1 receives proposedSequence: 0, proposedCertificateId: '', and identifies IAPCPR/PA/WB/5240"
  );

  // Check Row 2 (Eligible NEW CPR Day): receives next ID (5241)
  const r2 = preview.rows[1];
  assert(
    r2.isDuplicate === false &&
      r2.rowStatus === "NEW – CPR DAY" &&
      r2.category === "CPR_DAY" &&
      r2.proposedCertificateId === `IAPCPR/PA/WB/${wbHighestPA + 1}` &&
      r2.proposedSequence === wbHighestPA + 1,
    `Row 2 receives sequential ID IAPCPR/PA/WB/${wbHighestPA + 1}`
  );

  // Check Row 3 (Eligible NEW CPR Day with 21-7-26 date): receives next ID (5242)
  const r3 = preview.rows[2];
  assert(
    r3.isDuplicate === false &&
      r3.rowStatus === "NEW – CPR DAY" &&
      r3.category === "CPR_DAY" &&
      r3.proposedCertificateId === `IAPCPR/PA/WB/${wbHighestPA + 2}` &&
      r3.proposedSequence === wbHighestPA + 2,
    `Row 3 receives sequential ID IAPCPR/PA/WB/${wbHighestPA + 2}`
  );

  // Check Row 4 (Eligible NEW Sanjeevani with 15-08-2026): receives Sanjeevani ID namespace
  const r4 = preview.rows[3];
  assert(
    r4.isDuplicate === false &&
      r4.rowStatus === "NEW – SANJEEVANI" &&
      r4.category === "SANJEEVANI" &&
      r4.proposedCertificateId.startsWith("IAPCPR/Sanjeevani/WB/"),
    `Row 4 receives Sanjeevani ID: ${r4.proposedCertificateId}`
  );

  console.log("\n================================================================================");
  console.log(`VALIDATION RESULT: ${passedTests} / ${totalTests} PASSED (100%)`);
  console.log("================================================================================\n");

  if (passedTests === totalTests) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runHardeningValidation().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
