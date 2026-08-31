import "dotenv/config";
import { searchMedicalCollegesEvidence } from "../lib/counselling/evidenceService";
import { validateCollegeQueryParams } from "../lib/counselling/validation";
import {
  sortCategoryProfiles,
  isPrimaryOpenBenchmark,
  getPrimaryOpenBenchmark,
} from "../lib/counselling/pathwayOrdering";

async function runTests() {
  console.log("==================================================================");
  console.log("SEQUENCE 9F.1 TEST SUITE: Medical College Directory AIR Sorting");
  console.log("==================================================================\n");

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

  // -------------------------------------------------------------
  // Test 1: No AIR Required Default Search
  // -------------------------------------------------------------
  console.log("Test Group 1: Default Search (No AIR Required)");
  const defaultResult = await searchMedicalCollegesEvidence({ page: 1, pageSize: 20 });
  assert(defaultResult.total >= 800, `Returns all active medical colleges (got total = ${defaultResult.total})`);
  assert(defaultResult.items.length === 20, `Respects pageSize pagination (got ${defaultResult.items.length} items)`);
  assert(defaultResult.totalPages >= 40, `Calculates totalPages accurately (got ${defaultResult.totalPages})`);
  assert(
    defaultResult.items.every((c) => c.collegeId && c.collegeName && c.state),
    "All returned colleges contain essential identity fields (collegeId, collegeName, state)"
  );

  // -------------------------------------------------------------
  // Test 2: Search by College Name
  // -------------------------------------------------------------
  console.log("\nTest Group 2: Search by College Name");
  const smsResult = await searchMedicalCollegesEvidence({ query: "SMS Medical College" });
  assert(smsResult.total >= 1, `Finds SMS Medical College by text search (total = ${smsResult.total})`);
  const sms = smsResult.items.find((c) => c.collegeName.includes("SMS") || c.collegeName.includes("Sawai Man Singh"));
  assert(!!sms, "SMS Medical College is present in search results");
  if (sms) {
    assert(sms.state === "Rajasthan", `SMS state is Rajasthan (got '${sms.state}')`);
    assert(sms.managementType === "GOVERNMENT", `SMS management type is GOVERNMENT (got '${sms.managementType}')`);
    assert(sms.totalMBBSSeats2026 === 250, `SMS total MBBS seats is 250 (got ${sms.totalMBBSSeats2026})`);
    assert(sms.mccRound1SeatsOffered === 37, `SMS MCC R1 offered is 37 (got ${sms.mccRound1SeatsOffered})`);
    assert(sms.approxOutsideMccRound1Pool === 213, `SMS outside MCC pool is 213 (got ${sms.approxOutsideMccRound1Pool})`);
    assert(sms.openRound1Profiles.length >= 1, `SMS has open Round-1 profiles (got ${sms.openRound1Profiles.length})`);
    const openProf = getPrimaryOpenBenchmark(sms.allCategoryProfiles);
    assert(!!openProf, "SMS Primary Open Benchmark resolved");
    assert(openProf?.bestAIR !== null && (openProf?.bestAIR ?? 0) < 2000, `SMS Best AIR is realistic (got ${openProf?.bestAIR})`);
    assert(openProf?.highestAIR !== null && (openProf?.highestAIR ?? 0) < 5000, `SMS Last AIR is realistic (got ${openProf?.highestAIR})`);
  }

  // -------------------------------------------------------------
  // Test 3: AIIMS Delhi Primary Open Benchmark Resolution
  // -------------------------------------------------------------
  console.log("\nTest Group 3: AIIMS Delhi Primary Open Benchmark Resolution");
  const aiimsDelhiResult = await searchMedicalCollegesEvidence({ query: "AIIMS, New Delhi" });
  const aiimsDelhi = aiimsDelhiResult.items.find((c) => c.collegeName.includes("AIIMS, New Delhi"));
  assert(!!aiimsDelhi, "Found AIIMS New Delhi in directory search");
  if (aiimsDelhi) {
    const primaryBench = getPrimaryOpenBenchmark(aiimsDelhi.allCategoryProfiles);
    assert(!!primaryBench, "AIIMS Delhi has a resolved Primary Open Benchmark");
    assert(
      primaryBench?.quota === "Open Seat Quota",
      `AIIMS Delhi Primary Open Benchmark quota is 'Open Seat Quota' (got '${primaryBench?.quota}')`
    );
    assert(
      primaryBench?.seatCategory === "OPEN",
      `AIIMS Delhi Primary Open Benchmark category is 'OPEN' (got '${primaryBench?.seatCategory}')`
    );
    assert(
      primaryBench?.isPwD === false,
      `AIIMS Delhi Primary Open Benchmark is non-PwD (got isPwD = ${primaryBench?.isPwD})`
    );
    assert(
      primaryBench?.bestAIR === 1,
      `AIIMS Delhi Primary Open Benchmark Best AIR is 1 (got ${primaryBench?.bestAIR})`
    );
    assert(
      primaryBench?.medianAIR === 25.5,
      `AIIMS Delhi Primary Open Benchmark Typical AIR is 25.5 (got ${primaryBench?.medianAIR})`
    );
    assert(
      primaryBench?.highestAIR === 52,
      `AIIMS Delhi Primary Open Benchmark Last AIR is 52 (got ${primaryBench?.highestAIR})`
    );

    // Verify foreign country quota (8738) and PwD (5014) are not selected as primary benchmark
    assert(
      primaryBench?.quota !== "Foreign Country Quota",
      "Special pathway 'Foreign Country Quota' correctly excluded from Primary Open Benchmark"
    );
    assert(
      primaryBench?.medianAIR !== 8738,
      "Foreign Country Quota median AIR (8738) not assigned to AIIMS Delhi Primary Open Benchmark"
    );
  }

  // -------------------------------------------------------------
  // Test 4: INI Institutions Sorted by Typical Open AIR (Ascending)
  // -------------------------------------------------------------
  console.log("\nTest Group 4: INI Institutions Sorted by Typical Open AIR (Ascending)");
  const iniSortedTypical = await searchMedicalCollegesEvidence({
    collegeType: "INI",
    sortBy: "TYPICAL_AIR",
    sortOrder: "asc",
    pageSize: 25,
  });

  assert(iniSortedTypical.total === 24, `Found all 24 INI institutions (got ${iniSortedTypical.total})`);

  console.log("  Top 5 INI Colleges by Typical Open AIR:");
  iniSortedTypical.items.slice(0, 5).forEach((c, idx) => {
    const bench = getPrimaryOpenBenchmark(c.allCategoryProfiles);
    console.log(
      `    ${idx + 1}. ${c.collegeName.slice(0, 35).padEnd(35)} | Quota: ${bench?.quota.padEnd(16)} | Typical: ${bench?.medianAIR}`
    );
  });

  const rank1Ini = iniSortedTypical.items[0];
  assert(
    rank1Ini.collegeName.includes("AIIMS, New Delhi"),
    `AIIMS New Delhi is ranked #1 in INI Typical Open AIR sort (got '${rank1Ini.collegeName.slice(0, 40)}')`
  );

  const rank2Ini = iniSortedTypical.items[1];
  assert(
    rank2Ini.collegeName.includes("JIPMER PUDUCHERRY"),
    `JIPMER Puducherry is ranked #2 in INI Typical Open AIR sort (got '${rank2Ini.collegeName.slice(0, 40)}')`
  );

  const rank3Ini = iniSortedTypical.items[2];
  assert(
    rank3Ini.collegeName.includes("AIIMS, Jodhpur"),
    `AIIMS Jodhpur is ranked #3 in INI Typical Open AIR sort (got '${rank3Ini.collegeName.slice(0, 40)}')`
  );

  // Verify strictly ascending numerical order across all INI colleges
  let isStrictlyAscending = true;
  for (let i = 0; i < iniSortedTypical.items.length - 1; i++) {
    const benchA = getPrimaryOpenBenchmark(iniSortedTypical.items[i].allCategoryProfiles);
    const benchB = getPrimaryOpenBenchmark(iniSortedTypical.items[i + 1].allCategoryProfiles);
    const airA = benchA?.medianAIR ?? 9999999;
    const airB = benchB?.medianAIR ?? 9999999;
    if (airA > airB) {
      isStrictlyAscending = false;
      console.error(`Sort violation at pos ${i}: ${airA} > ${airB}`);
      break;
    }
  }
  assert(isStrictlyAscending, "All 24 INI colleges are strictly in ascending numerical order of Typical Open AIR");

  // -------------------------------------------------------------
  // Test 5: INI Institutions Sorted by Best Open AIR (Ascending)
  // -------------------------------------------------------------
  console.log("\nTest Group 5: INI Institutions Sorted by Best Open AIR (Ascending)");
  const iniSortedBest = await searchMedicalCollegesEvidence({
    collegeType: "INI",
    sortBy: "BEST_AIR",
    sortOrder: "asc",
    pageSize: 25,
  });

  const rank1Best = iniSortedBest.items[0];
  assert(
    rank1Best.collegeName.includes("AIIMS, New Delhi"),
    `AIIMS New Delhi is ranked #1 in INI Best Open AIR sort with Best AIR = 1 (got '${rank1Best.collegeName.slice(0, 40)}')`
  );

  let isBestAscending = true;
  for (let i = 0; i < iniSortedBest.items.length - 1; i++) {
    const benchA = getPrimaryOpenBenchmark(iniSortedBest.items[i].allCategoryProfiles);
    const benchB = getPrimaryOpenBenchmark(iniSortedBest.items[i + 1].allCategoryProfiles);
    const airA = benchA?.bestAIR ?? 9999999;
    const airB = benchB?.bestAIR ?? 9999999;
    if (airA > airB) {
      isBestAscending = false;
      break;
    }
  }
  assert(isBestAscending, "All INI colleges are strictly in ascending numerical order of Best Open AIR");

  // -------------------------------------------------------------
  // Test 6: INI Institutions Sorted by Last Open AIR (Ascending)
  // -------------------------------------------------------------
  console.log("\nTest Group 6: INI Institutions Sorted by Last Open AIR (Ascending)");
  const iniSortedLast = await searchMedicalCollegesEvidence({
    collegeType: "INI",
    sortBy: "LAST_AIR",
    sortOrder: "asc",
    pageSize: 25,
  });

  const rank1Last = iniSortedLast.items[0];
  assert(
    rank1Last.collegeName.includes("AIIMS, New Delhi"),
    `AIIMS New Delhi is ranked #1 in INI Last Open AIR sort with Last AIR = 50 (got '${rank1Last.collegeName.slice(0, 40)}')`
  );

  // -------------------------------------------------------------
  // Test 7: Numeric vs String Sorting Verification
  // -------------------------------------------------------------
  console.log("\nTest Group 7: Numeric vs String Sorting Verification");
  // INI rankings: AIIMS Jodhpur (Typical: 248) vs AIIMS Mangalagiri (Typical: 1010)
  // String sort would place "1010" before "248". Numeric sort places 248 before 1010.
  const jodhpurIdx = iniSortedTypical.items.findIndex((c) => c.collegeName.includes("Jodhpur"));
  const mangalagiriIdx = iniSortedTypical.items.findIndex((c) => c.collegeName.includes("Mangalagiri"));
  assert(
    jodhpurIdx < mangalagiriIdx,
    `Numeric sorting verified: AIIMS Jodhpur (AIR 248 at pos ${jodhpurIdx + 1}) precedes AIIMS Mangalagiri (AIR 1010 at pos ${mangalagiriIdx + 1})`
  );

  // -------------------------------------------------------------
  // Test 8: Government Medical Colleges Typical Open AIR Sort
  // -------------------------------------------------------------
  console.log("\nTest Group 8: Government Medical Colleges Typical Open AIR Sort");
  const govtSorted = await searchMedicalCollegesEvidence({
    collegeType: "GOVERNMENT",
    sortBy: "TYPICAL_AIR",
    sortOrder: "asc",
    pageSize: 10,
  });

  console.log("  Top 5 Government Colleges by Typical Open AIR:");
  govtSorted.items.slice(0, 5).forEach((c, idx) => {
    const bench = getPrimaryOpenBenchmark(c.allCategoryProfiles);
    console.log(
      `    ${idx + 1}. ${c.collegeName.slice(0, 45).padEnd(45)} | Quota: ${bench?.quota.padEnd(16)} | Typical: ${bench?.medianAIR}`
    );
  });

  assert(govtSorted.items.length === 10, "Returns top 10 Government colleges");
  assert(
    govtSorted.items.every((c) => c.managementType === "GOVERNMENT"),
    "All colleges in government sort have managementType === 'GOVERNMENT'"
  );
  const topGovtBench = getPrimaryOpenBenchmark(govtSorted.items[0].allCategoryProfiles);
  assert((topGovtBench?.medianAIR ?? 999999) < 500, `Top government college has strong Typical AIR (got ${topGovtBench?.medianAIR})`);

  // -------------------------------------------------------------
  // Test 9: Deemed Universities Typical Open AIR Sort (Self-Financed before NRI)
  // -------------------------------------------------------------
  console.log("\nTest Group 9: Deemed Universities Typical Open AIR Sort");
  const deemedSorted = await searchMedicalCollegesEvidence({
    collegeType: "DEEMED",
    sortBy: "TYPICAL_AIR",
    sortOrder: "asc",
    pageSize: 10,
  });

  console.log("  Top 5 Deemed Universities by Typical Open AIR:");
  deemedSorted.items.slice(0, 5).forEach((c, idx) => {
    const bench = getPrimaryOpenBenchmark(c.allCategoryProfiles);
    console.log(
      `    ${idx + 1}. ${c.collegeName.slice(0, 45).padEnd(45)} | Quota: ${bench?.quota.padEnd(20)} | Typical: ${bench?.medianAIR}`
    );
  });

  assert(deemedSorted.items.length === 10, "Returns top 10 Deemed universities");
  assert(
    deemedSorted.items.every((c) => c.isDeemed === true),
    "All colleges in deemed sort have isDeemed === true"
  );
  // Verify NRI is not used as benchmark
  assert(
    deemedSorted.items.every((c) => {
      const b = getPrimaryOpenBenchmark(c.allCategoryProfiles);
      return !b?.quota.toLowerCase().includes("nri");
    }),
    "NRI quota is never selected as Primary Open Benchmark when ordinary Self-Financed Merit exists"
  );

  // -------------------------------------------------------------
  // Test 10: State + Type Filters with Sorting (Rajasthan Government)
  // -------------------------------------------------------------
  console.log("\nTest Group 10: State + Type Filters with Sorting");
  const rajGovtSorted = await searchMedicalCollegesEvidence({
    state: "Rajasthan",
    collegeType: "GOVERNMENT",
    sortBy: "TYPICAL_AIR",
    sortOrder: "asc",
  });

  assert(rajGovtSorted.total >= 25, `Found Rajasthan Government colleges (got ${rajGovtSorted.total})`);
  assert(
    rajGovtSorted.items.every((c) => c.state === "Rajasthan" && c.managementType === "GOVERNMENT"),
    "All items match both state: Rajasthan and managementType: GOVERNMENT"
  );
  // SMS Medical College should be #1 in Rajasthan Government
  assert(
    rajGovtSorted.items[0].collegeName.includes("SMS Medical College") || rajGovtSorted.items[0].collegeName.includes("Sawai Man Singh"),
    `SMS Medical College is #1 government medical college in Rajasthan (got '${rajGovtSorted.items[0].collegeName.slice(0, 35)}')`
  );

  // -------------------------------------------------------------
  // Test 11: Displayed Benchmark Matches Sort Benchmark
  // -------------------------------------------------------------
  console.log("\nTest Group 11: Display / Sort Consistency Invariant");
  const mixedSample = await searchMedicalCollegesEvidence({ sortBy: "TYPICAL_AIR", sortOrder: "asc", pageSize: 25 });
  const allConsistent = mixedSample.items.every((c) => {
    const primaryBenchmark = getPrimaryOpenBenchmark(c.allCategoryProfiles);
    const sortedOpenList = sortCategoryProfiles(c.openRound1Profiles, "STANDARD");
    const displayedProfile = sortedOpenList[0] || null;
    return primaryBenchmark?.medianAIR === displayedProfile?.medianAIR && primaryBenchmark?.quota === displayedProfile?.quota;
  });
  assert(allConsistent, "Displayed Primary Open Benchmark on card strictly equals the sorting benchmark for all colleges");

  // -------------------------------------------------------------
  // Test 12: Sequence 9F.2 Default Directory Sort Criterion
  // -------------------------------------------------------------
  console.log("\nTest Group 12: Sequence 9F.2 Default Directory Sort Criterion");
  const validatedDefault = validateCollegeQueryParams(new URLSearchParams());
  assert(validatedDefault.isValid === true, "Empty search params validate successfully");
  assert(
    validatedDefault.params?.sortBy === "TYPICAL_AIR",
    `Default validator sortBy is 'TYPICAL_AIR' (got '${validatedDefault.params?.sortBy}')`
  );
  assert(
    validatedDefault.params?.sortOrder === "asc",
    `Default validator sortOrder is 'asc' (got '${validatedDefault.params?.sortOrder}')`
  );

  // When no sortBy is passed to searchMedicalCollegesEvidence, it must sort by Typical Open AIR strongest first
  const defaultQueryRes = await searchMedicalCollegesEvidence({ pageSize: 10 });
  const firstDefaultCol = defaultQueryRes.items[0];
  const firstBench = getPrimaryOpenBenchmark(firstDefaultCol.allCategoryProfiles);
  assert(
    firstDefaultCol.collegeName.includes("AIIMS, New Delhi"),
    `Default search returns nation's strongest institution (AIIMS New Delhi) at position #1 (got '${firstDefaultCol.collegeName.slice(0, 35)}')`
  );
  assert(
    firstBench?.medianAIR === 25.5,
    `Position #1 college has Typical (Median) AIR = 25.5 (got ${firstBench?.medianAIR})`
  );

  // Verify top 5 default colleges are strictly ascending
  let isStrictlyAscendingDefault = true;
  for (let i = 0; i < defaultQueryRes.items.length - 1; i++) {
    const benchA = getPrimaryOpenBenchmark(defaultQueryRes.items[i].allCategoryProfiles);
    const benchB = getPrimaryOpenBenchmark(defaultQueryRes.items[i + 1].allCategoryProfiles);
    const airA = benchA?.medianAIR ?? 9999999;
    const airB = benchB?.medianAIR ?? 9999999;
    if (airA > airB) {
      isStrictlyAscendingDefault = false;
      break;
    }
  }
  assert(isStrictlyAscendingDefault, "Default search colleges are strictly sorted in ascending order of Typical (Median) AIR");

  // -------------------------------------------------------------
  // Test 13: Explicit Sort Override & Persistence
  // -------------------------------------------------------------
  console.log("\nTest Group 13: Explicit Sort Override & Persistence");
  const nameSorted = await searchMedicalCollegesEvidence({ sortBy: "NAME", sortOrder: "asc", pageSize: 5 });
  assert(
    nameSorted.items[0].collegeName <= nameSorted.items[1].collegeName,
    "Explicitly requested 'NAME' sort is honored and alphabetical"
  );

  const seatsSorted = await searchMedicalCollegesEvidence({ sortBy: "TOTAL_SEATS", sortOrder: "desc", pageSize: 5 });
  assert(
    seatsSorted.items[0].totalMBBSSeats2026 >= seatsSorted.items[1].totalMBBSSeats2026,
    "Explicitly requested 'TOTAL_SEATS' sort is honored and descending"
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

runTests().catch((err) => {
  console.error("Test execution failed with error:", err);
  process.exit(1);
});
