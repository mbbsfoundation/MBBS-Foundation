import "dotenv/config";
import fs from "fs";
import path from "path";
import { searchMedicalCollegesEvidence } from "@/lib/counselling/evidenceService";
import { getPrimaryOpenBenchmark } from "@/lib/counselling/pathwayOrdering";
import { prisma } from "@/lib/prisma";

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${testName}`);
    if (detail) console.error(`    Detail: ${detail}`);
    failed++;
  }
}

function assertMonotonicAscending(items: any[], extractor: (item: any) => number | null, testName: string) {
  let prevVal: number | null = null;
  let isSorted = true;
  let failureDetail = "";

  for (let i = 0; i < items.length; i++) {
    const val = extractor(items[i]);
    if (val !== null) {
      if (prevVal !== null && val < prevVal) {
        isSorted = false;
        failureDetail = `Index ${i} (${items[i].collegeName}): current ${val} < prev ${prevVal}`;
        break;
      }
      prevVal = val;
    }
  }

  assert(isSorted, `${testName} - Monotonic ascending order verified across ${items.length} items`, failureDetail);
}

async function runClassificationTests() {
  console.log("==================================================================");
  console.log("SEQUENCE 9H.3 TEST SUITE: Official College Classification & Filters");
  console.log("==================================================================\n");

  // -------------------------------------------------------------
  // Test Group 1: Database Source Alignment
  // -------------------------------------------------------------
  console.log("Test Group 1: Database Source Alignment");
  const allColleges = await prisma.college.findMany();
  assert(allColleges.length === 847, `Canonical directory total is 847 (got ${allColleges.length})`);

  const govtCount = allColleges.filter((c) => c.managementType === "GOVERNMENT").length;
  const pvtCount = allColleges.filter((c) => c.managementType === "PRIVATE").length;
  const iniCount = allColleges.filter((c) => c.isINI).length;
  const deemedCount = allColleges.filter((c) => c.isDeemed).length;
  const centralCount = allColleges.filter((c) => c.isCentralUniversity).length;
  const esicCount = allColleges.filter((c) => c.isESIC).length;

  assert(govtCount === 441, `NMC Government colleges total is 441 (got ${govtCount})`);
  assert(pvtCount === 382, `NMC Private colleges total is 382 (got ${pvtCount})`);
  assert(iniCount === 24, `Canonical INI colleges total is 24 (got ${iniCount})`);
  assert(deemedCount === 63, `MCC Deemed Universities total is 63 (got ${deemedCount})`);
  assert(centralCount === 7, `True Central Universities total is 7 (got ${centralCount})`);
  assert(esicCount >= 18, `ESIC colleges total is >= 18 (got ${esicCount})`);

  // -------------------------------------------------------------
  // Test Group 2: The 7 True Central Universities
  // -------------------------------------------------------------
  console.log("\nTest Group 2: The 7 True Central Universities");
  const centralResult = await searchMedicalCollegesEvidence({
    collegeType: "CENTRAL",
    sortBy: "TYPICAL_AIR",
    sortOrder: "asc",
    page: 1,
    pageSize: 50,
  });

  assert(centralResult.total === 7, `Central Universities query returns exactly 7 colleges (got ${centralResult.total})`);
  assert(centralResult.items.length === 7, `Central page items count is 7 (got ${centralResult.items.length})`);

  const expectedCentralNames = [
    "Maulana Azad Medical College",
    "Vardhman Mahavir Medical College",
    "Atal Bihari Vajpayee Institute of Medical Sciences",
    "University College of Medical Sciences",
    "Lady Hardinge Medical College",
    "Institute of Medical Sciences, BHU",
    "Jawaharlal Nehru Medical College, Aligarh",
  ];

  for (const expName of expectedCentralNames) {
    const found = centralResult.items.some((c) => c.collegeName.toLowerCase().includes(expName.toLowerCase()));
    assert(found, `Central Universities list includes: ${expName}`);
  }

  for (const c of centralResult.items) {
    assert(c.isCentralUniversity === true, `${c.collegeName} has isCentralUniversity = true`);
    assert(c.managementType === "GOVERNMENT", `${c.collegeName} has NMC Management = GOVERNMENT`);
  }

  // -------------------------------------------------------------
  // Test Group 3: False-Positive Central Prevention
  // -------------------------------------------------------------
  console.log("\nTest Group 3: False-Positive Central Prevention ('All India except Central University')");
  const falsePositiveColleges = [
    "SMS Medical College",
    "Madras Medical College",
    "Bangalore Medical College",
    "King George Medical University",
    "Government Medical College, Kozhikode",
  ];

  for (const name of falsePositiveColleges) {
    const col = allColleges.find((c) => c.collegeName.toLowerCase().includes(name.toLowerCase()));
    assert(
      col !== undefined && col.isCentralUniversity === false,
      `False-positive Central check: ${name} isCentralUniversity is FALSE`
    );
    const inCentralQuery = centralResult.items.some((c) => c.collegeName.toLowerCase().includes(name.toLowerCase()));
    assert(!inCentralQuery, `False-positive Central check: ${name} is NOT in Central Universities query`);
  }

  // -------------------------------------------------------------
  // Test Group 4: MGIMS Sevagram Wardha Trace & Alignment
  // -------------------------------------------------------------
  console.log("\nTest Group 4: MGIMS Sevagram Wardha");
  const mgims = allColleges.find(
    (c) => c.collegeName.includes("Sevagram") || c.collegeName.includes("Mahatma Gandhi Institute of Medical Sciences")
  );

  assert(mgims !== undefined, "MGIMS Wardha found in database");
  if (mgims) {
    assert(mgims.managementType === "PRIVATE", "MGIMS managementType is strictly PRIVATE (NMC Management = Private)");
    assert(mgims.isCentralUniversity === false, "MGIMS isCentralUniversity is strictly FALSE");
    assert(mgims.isDeemed === false, "MGIMS isDeemed is strictly FALSE");
    assert(mgims.isINI === false, "MGIMS isINI is strictly FALSE");
  }

  const pvtResult = await searchMedicalCollegesEvidence({
    collegeType: "PRIVATE",
    query: "Wardha",
    page: 1,
    pageSize: 10,
  });
  const mgimsInPvt = pvtResult.items.some((c) => c.collegeName.includes("Sevagram") || c.collegeName.includes("Mahatma Gandhi Institute of Medical Sciences"));
  assert(mgimsInPvt, "MGIMS Wardha appears in Private Medical Colleges filter search");

  const govtMgimsResult = await searchMedicalCollegesEvidence({
    collegeType: "GOVERNMENT",
    query: "Sevagram",
    page: 1,
    pageSize: 10,
  });
  assert(govtMgimsResult.total === 0, "MGIMS Wardha does NOT appear in Government filter");

  // -------------------------------------------------------------
  // Test Group 5: Deemed Universities Filter
  // -------------------------------------------------------------
  console.log("\nTest Group 5: Deemed Universities Filter");
  const deemedResult = await searchMedicalCollegesEvidence({
    collegeType: "DEEMED",
    sortBy: "TYPICAL_AIR",
    sortOrder: "asc",
    page: 1,
    pageSize: 50,
  });

  assert(deemedResult.total === 63, `Deemed Universities query returns exactly 63 colleges (got ${deemedResult.total})`);
  assert(deemedResult.items.every((c) => c.isDeemed === true), "All returned Deemed colleges have isDeemed === true");

  const kmcManipal = deemedResult.items.find((c) => c.collegeName.includes("Kasturba") && c.collegeName.includes("Manipal"));
  assert(kmcManipal !== undefined, "KMC Manipal is present in Deemed Universities filter");

  // -------------------------------------------------------------
  // Test Group 6: INI Institutions Filter
  // -------------------------------------------------------------
  console.log("\nTest Group 6: INI Institutions Filter");
  const iniResult = await searchMedicalCollegesEvidence({
    collegeType: "INI",
    sortBy: "TYPICAL_AIR",
    sortOrder: "asc",
    page: 1,
    pageSize: 50,
  });

  assert(iniResult.total === 24, `INI query returns exactly 24 colleges (got ${iniResult.total})`);
  assert(iniResult.items.every((c) => c.isINI === true), "All returned INI colleges have isINI === true");
  assert(iniResult.items[0].collegeName.includes("AIIMS, New Delhi"), "INI rank #1 is AIIMS New Delhi");

  // -------------------------------------------------------------
  // Test Group 7: ESIC Medical Colleges Filter
  // -------------------------------------------------------------
  console.log("\nTest Group 7: ESIC Medical Colleges Filter");
  const esicResult = await searchMedicalCollegesEvidence({
    collegeType: "ESIC",
    sortBy: "TYPICAL_AIR",
    sortOrder: "asc",
    page: 1,
    pageSize: 50,
  });

  assert(esicResult.total === 19, `ESIC query returns exactly 19 colleges (got ${esicResult.total})`);
  assert(esicResult.items.every((c) => c.isESIC === true), "All returned ESIC colleges have isESIC === true");

  // -------------------------------------------------------------
  // Test Group 8: Government Medical Colleges Filter
  // -------------------------------------------------------------
  console.log("\nTest Group 8: Government Medical Colleges Filter");
  const govtResult = await searchMedicalCollegesEvidence({
    collegeType: "GOVERNMENT",
    sortBy: "TYPICAL_AIR",
    sortOrder: "asc",
    page: 1,
    pageSize: 50,
  });

  assert(govtResult.total === 441, `Government query returns exactly 441 colleges (got ${govtResult.total})`);
  assert(govtResult.items.every((c) => c.managementType === "GOVERNMENT"), "All returned Government colleges have managementType === 'GOVERNMENT'");

  // -------------------------------------------------------------
  // Test Group 9: Ordinary Private Medical Colleges Filter (Non-Deemed)
  // -------------------------------------------------------------
  console.log("\nTest Group 9: Ordinary Private Medical Colleges Filter (Non-Deemed)");
  const ordinaryPvtResult = await searchMedicalCollegesEvidence({
    collegeType: "PRIVATE",
    sortBy: "NAME",
    sortOrder: "asc",
    page: 1,
    pageSize: 50,
  });

  // 382 Private - 63 Deemed = 319 (or 318 depending on 1 new deemed without NMC row)
  assert(
    ordinaryPvtResult.total === 319 || ordinaryPvtResult.total === 318,
    `Ordinary Private query returns 319 non-deemed private colleges (got ${ordinaryPvtResult.total})`
  );
  assert(
    ordinaryPvtResult.items.every((c) => c.managementType === "PRIVATE" && c.isDeemed === false),
    "All returned ordinary Private colleges have managementType === 'PRIVATE' and isDeemed === false"
  );

  // -------------------------------------------------------------
  // Test Group 10: Sorting Invariant Across All Filters
  // -------------------------------------------------------------
  console.log("\nTest Group 10: Numeric Sorting Invariant Across All Classification Filters");

  const filtersToTest: Array<"ALL" | "GOVERNMENT" | "PRIVATE" | "DEEMED" | "CENTRAL" | "INI" | "ESIC"> = [
    "ALL",
    "GOVERNMENT",
    "PRIVATE",
    "DEEMED",
    "CENTRAL",
    "INI",
    "ESIC",
  ];

  for (const filter of filtersToTest) {
    const res = await searchMedicalCollegesEvidence({
      collegeType: filter,
      sortBy: "TYPICAL_AIR",
      sortOrder: "asc",
      page: 1,
      pageSize: 50,
    });

    assertMonotonicAscending(
      res.items,
      (item) => getPrimaryOpenBenchmark(item.allCategoryProfiles)?.medianAIR ?? null,
      `Filter '${filter}' Typical (Median) AIR Sort`
    );
  }

  // -------------------------------------------------------------
  // Test Group 11: Dropdown Labels & Source Note Verification
  // -------------------------------------------------------------
  console.log("\nTest Group 11: Dropdown Labels & Source Note Verification");
  const explorerSource = fs.readFileSync(
    path.join(process.cwd(), "components", "neet-to-mbbs", "MedicalCollegeExplorer.tsx"),
    "utf-8"
  );

  assert(
    explorerSource.includes("Deemed University (MCC UG NEET Seat Matrix 2026)"),
    "Dropdown contains exact label: 'Deemed University (MCC UG NEET Seat Matrix 2026)'"
  );
  assert(
    explorerSource.includes("Central University (MCC UG NEET Seat Matrix 2026)"),
    "Dropdown contains exact label: 'Central University (MCC UG NEET Seat Matrix 2026)'"
  );
  assert(
    explorerSource.includes("Institutes of National Importance (AIIMS / JIPMER)"),
    "Dropdown contains exact label: 'Institutes of National Importance (AIIMS / JIPMER)'"
  );
  assert(
    explorerSource.includes("ESIC Medical Colleges"),
    "Dropdown contains exact label: 'ESIC Medical Colleges'"
  );
  assert(
    explorerSource.includes(
      "Government/Private classification follows NMC Management; Deemed/Central University grouping follows MCC UG NEET Seat Matrix 2026."
    ),
    "UI contains exact informational source note: 'Government/Private classification follows NMC Management; Deemed/Central University grouping follows MCC UG NEET Seat Matrix 2026.'"
  );

  // -------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------
  console.log("\n==================================================================");
  console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log("==================================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runClassificationTests().catch((err) => {
  console.error("Test execution failed with error:", err);
  process.exit(1);
});
