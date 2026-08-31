import "dotenv/config";
import { searchMedicalCollegesEvidence } from "@/lib/counselling/evidenceService";
import { getPrimaryOpenBenchmark } from "@/lib/counselling/pathwayOrdering";

async function runTests() {
  console.log("==================================================================");
  console.log("SEQUENCE 9H.1 TEST SUITE: Global Medical College Directory Sorting");
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

  function assertMonotonicAscending(
    items: any[],
    getValue: (item: any) => number | null,
    testPrefix: string
  ) {
    let lastNonNull: number | null = null;
    let sawNull = false;

    for (let i = 0; i < items.length; i++) {
      const val = getValue(items[i]);
      if (val === null) {
        sawNull = true;
      } else {
        if (sawNull) {
          assert(false, `${testPrefix} - Found non-null value ${val} AFTER null at index ${i}`);
          return;
        }
        if (lastNonNull !== null) {
          if (val < lastNonNull) {
            assert(
              false,
              `${testPrefix} - Non-monotonic sequence at index ${i}: prev=${lastNonNull}, curr=${val} (${items[i].collegeName})`
            );
            return;
          }
        }
        lastNonNull = val;
      }
    }
    assert(true, `${testPrefix} - Monotonic ascending order verified across ${items.length} items`);
  }

  function assertMonotonicDescending(
    items: any[],
    getValue: (item: any) => number | null,
    testPrefix: string
  ) {
    let lastNonNull: number | null = null;
    let sawNull = false;

    for (let i = 0; i < items.length; i++) {
      const val = getValue(items[i]);
      if (val === null) {
        sawNull = true;
      } else {
        if (sawNull) {
          assert(false, `${testPrefix} - Found non-null value ${val} AFTER null at index ${i}`);
          return;
        }
        if (lastNonNull !== null) {
          if (val > lastNonNull) {
            assert(
              false,
              `${testPrefix} - Non-monotonic sequence at index ${i}: prev=${lastNonNull}, curr=${val} (${items[i].collegeName})`
            );
            return;
          }
        }
        lastNonNull = val;
      }
    }
    assert(true, `${testPrefix} - Monotonic descending order verified across ${items.length} items`);
  }

  // -------------------------------------------------------------
  // Test Group 1: Global All States + All Types Median AIR Sort
  // -------------------------------------------------------------
  console.log("Test Group 1: Global All States + All College Types Median Sort");
  const globalMedianPage1 = await searchMedicalCollegesEvidence({
    collegeType: "ALL",
    sortBy: "TYPICAL_AIR",
    sortOrder: "asc",
    page: 1,
    pageSize: 50,
  });

  assert(globalMedianPage1.items.length === 50, "Page 1 returned exactly 50 items");
  assert(globalMedianPage1.total > 700, `Total matching colleges is ${globalMedianPage1.total} (>700)`);

  assertMonotonicAscending(
    globalMedianPage1.items,
    (item) => getPrimaryOpenBenchmark(item.allCategoryProfiles)?.medianAIR ?? null,
    "Global Median Sort (Top 50)"
  );

  // Top 5 colleges sanity verification
  const top1 = globalMedianPage1.items[0];
  const top1Bench = getPrimaryOpenBenchmark(top1.allCategoryProfiles);
  assert(top1.collegeName.includes("AIIMS, New Delhi"), `Rank 1 is AIIMS New Delhi (got ${top1.collegeName})`);
  assert(top1Bench?.medianAIR === 25.5, `AIIMS Delhi median is 25.5 (got ${top1Bench?.medianAIR})`);

  const top2 = globalMedianPage1.items[1];
  const top2Bench = getPrimaryOpenBenchmark(top2.allCategoryProfiles);
  assert(top2.collegeName.includes("Maulana Azad Medical College"), `Rank 2 is Maulana Azad Medical College (got ${top2.collegeName})`);
  assert(top2Bench?.medianAIR === 90, `MAMC median is 90 (got ${top2Bench?.medianAIR})`);

  const top3 = globalMedianPage1.items[2];
  const top3Bench = getPrimaryOpenBenchmark(top3.allCategoryProfiles);
  assert(top3.collegeName.includes("Vardhman Mahavir Medical College"), `Rank 3 is VMMC (got ${top3.collegeName})`);
  assert(top3Bench?.medianAIR === 99.5, `VMMC median is 99.5 (got ${top3Bench?.medianAIR})`);

  const top4 = globalMedianPage1.items[3];
  const top4Bench = getPrimaryOpenBenchmark(top4.allCategoryProfiles);
  assert(top4.collegeName.includes("Atal Bihari Vajpayee"), `Rank 4 is ABVIMS / RML (got ${top4.collegeName})`);
  assert(top4Bench?.medianAIR === 160, `ABVIMS median is 160 (got ${top4Bench?.medianAIR})`);

  const top5 = globalMedianPage1.items[4];
  const top5Bench = getPrimaryOpenBenchmark(top5.allCategoryProfiles);
  assert(top5.collegeName.includes("JIPMER"), `Rank 5 is JIPMER Puducherry (got ${top5.collegeName})`);
  assert(top5Bench?.medianAIR === 178, `JIPMER median is 178 (got ${top5Bench?.medianAIR})`);

  console.log("\n--- Top 20 Global Colleges ---");
  globalMedianPage1.items.slice(0, 20).forEach((c, idx) => {
    const bench = getPrimaryOpenBenchmark(c.allCategoryProfiles);
    console.log(`  ${(idx + 1).toString().padStart(2)}. [Median: ${bench?.medianAIR?.toString().padStart(6)}] Best: ${bench?.bestAIR?.toString().padStart(5)}, Last: ${bench?.highestAIR?.toString().padStart(5)} | ${c.collegeName} (${c.state})`);
  });

  // -------------------------------------------------------------
  // Test Group 2: Management & Institute Type Filtered Sorts
  // -------------------------------------------------------------
  console.log("\nTest Group 2: Management & Institute Type Filtered Sorts");

  // Government
  const govtResult = await searchMedicalCollegesEvidence({
    collegeType: "GOVERNMENT",
    sortBy: "TYPICAL_AIR",
    sortOrder: "asc",
    page: 1,
    pageSize: 50,
  });
  assert(govtResult.items.length === 50, "Government filter returned 50 items");
  assertMonotonicAscending(
    govtResult.items,
    (item) => getPrimaryOpenBenchmark(item.allCategoryProfiles)?.medianAIR ?? null,
    "Government Median Sort"
  );
  assert(
    govtResult.items[0].collegeName.includes("Maulana Azad"),
    `Top Government college is Maulana Azad (got ${govtResult.items[0].collegeName})`
  );

  // INI
  const iniResult = await searchMedicalCollegesEvidence({
    collegeType: "INI",
    sortBy: "TYPICAL_AIR",
    sortOrder: "asc",
    page: 1,
    pageSize: 50,
  });
  assert(iniResult.items.length >= 20, `INI filter returned ${iniResult.items.length} items (>=20)`);
  assertMonotonicAscending(
    iniResult.items,
    (item) => getPrimaryOpenBenchmark(item.allCategoryProfiles)?.medianAIR ?? null,
    "INI Median Sort"
  );
  assert(
    iniResult.items[0].collegeName.includes("AIIMS, New Delhi"),
    `Top INI college is AIIMS New Delhi (got ${iniResult.items[0].collegeName})`
  );

  // Deemed
  const deemedResult = await searchMedicalCollegesEvidence({
    collegeType: "DEEMED",
    sortBy: "TYPICAL_AIR",
    sortOrder: "asc",
    page: 1,
    pageSize: 50,
  });
  assert(deemedResult.items.length >= 30, `Deemed filter returned ${deemedResult.items.length} items (>=30)`);
  assertMonotonicAscending(
    deemedResult.items,
    (item) => getPrimaryOpenBenchmark(item.allCategoryProfiles)?.medianAIR ?? null,
    "Deemed Median Sort"
  );

  // Private
  const privateResult = await searchMedicalCollegesEvidence({
    collegeType: "PRIVATE",
    sortBy: "TYPICAL_AIR",
    sortOrder: "asc",
    page: 1,
    pageSize: 50,
  });
  assertMonotonicAscending(
    privateResult.items,
    (item) => getPrimaryOpenBenchmark(item.allCategoryProfiles)?.medianAIR ?? null,
    "Private Median Sort"
  );

  // Central
  const centralResult = await searchMedicalCollegesEvidence({
    collegeType: "CENTRAL",
    sortBy: "TYPICAL_AIR",
    sortOrder: "asc",
    page: 1,
    pageSize: 50,
  });
  assertMonotonicAscending(
    centralResult.items,
    (item) => getPrimaryOpenBenchmark(item.allCategoryProfiles)?.medianAIR ?? null,
    "Central University Median Sort"
  );

  // -------------------------------------------------------------
  // Test Group 3: State-Specific Median Sorts
  // -------------------------------------------------------------
  console.log("\nTest Group 3: State-Specific Median Sorts");
  const testStates = ["Delhi", "Rajasthan", "Karnataka", "Maharashtra", "Tamil Nadu", "Uttar Pradesh"];

  for (const st of testStates) {
    const stResult = await searchMedicalCollegesEvidence({
      state: st,
      collegeType: "ALL",
      sortBy: "TYPICAL_AIR",
      sortOrder: "asc",
      page: 1,
      pageSize: 50,
    });
    assert(stResult.items.length > 0, `State filter '${st}' returned ${stResult.items.length} colleges`);
    assertMonotonicAscending(
      stResult.items,
      (item) => getPrimaryOpenBenchmark(item.allCategoryProfiles)?.medianAIR ?? null,
      `State '${st}' Median Sort`
    );
  }

  // -------------------------------------------------------------
  // Test Group 4: Pagination Boundary Invariant (Pages 1, 2, 3)
  // -------------------------------------------------------------
  console.log("\nTest Group 4: Pagination Boundary Invariant");
  const p1 = await searchMedicalCollegesEvidence({
    collegeType: "ALL",
    sortBy: "TYPICAL_AIR",
    sortOrder: "asc",
    page: 1,
    pageSize: 24,
  });
  const p2 = await searchMedicalCollegesEvidence({
    collegeType: "ALL",
    sortBy: "TYPICAL_AIR",
    sortOrder: "asc",
    page: 2,
    pageSize: 24,
  });
  const p3 = await searchMedicalCollegesEvidence({
    collegeType: "ALL",
    sortBy: "TYPICAL_AIR",
    sortOrder: "asc",
    page: 3,
    pageSize: 24,
  });

  const p1LastVal = getPrimaryOpenBenchmark(p1.items[p1.items.length - 1].allCategoryProfiles)?.medianAIR ?? null;
  const p2FirstVal = getPrimaryOpenBenchmark(p2.items[0].allCategoryProfiles)?.medianAIR ?? null;
  const p2LastVal = getPrimaryOpenBenchmark(p2.items[p2.items.length - 1].allCategoryProfiles)?.medianAIR ?? null;
  const p3FirstVal = getPrimaryOpenBenchmark(p3.items[0].allCategoryProfiles)?.medianAIR ?? null;

  assert(
    p1LastVal !== null && p2FirstVal !== null && p1LastVal <= p2FirstVal,
    `Page 1 last median (${p1LastVal}) <= Page 2 first median (${p2FirstVal})`
  );
  assert(
    p2LastVal !== null && p3FirstVal !== null && p2LastVal <= p3FirstVal,
    `Page 2 last median (${p2LastVal}) <= Page 3 first median (${p3FirstVal})`
  );

  // -------------------------------------------------------------
  // Test Group 5: Other Sort Criteria
  // -------------------------------------------------------------
  console.log("\nTest Group 5: Other Sort Criteria");

  // 1. BEST_AIR
  const bestAirResult = await searchMedicalCollegesEvidence({
    collegeType: "ALL",
    sortBy: "BEST_AIR",
    sortOrder: "asc",
    page: 1,
    pageSize: 50,
  });
  assertMonotonicAscending(
    bestAirResult.items,
    (item) => getPrimaryOpenBenchmark(item.allCategoryProfiles)?.bestAIR ?? null,
    "Best Open AIR Sort"
  );
  assert(
    bestAirResult.items[0].collegeName.includes("AIIMS, New Delhi"),
    `Best AIR #1 is AIIMS New Delhi with Best AIR = 1`
  );

  // 2. LAST_AIR
  const lastAirResult = await searchMedicalCollegesEvidence({
    collegeType: "ALL",
    sortBy: "LAST_AIR",
    sortOrder: "asc",
    page: 1,
    pageSize: 50,
  });
  assertMonotonicAscending(
    lastAirResult.items,
    (item) => getPrimaryOpenBenchmark(item.allCategoryProfiles)?.highestAIR ?? null,
    "Last Observed Open AIR Sort"
  );

  // 3. TOTAL_SEATS
  const totalSeatsResult = await searchMedicalCollegesEvidence({
    collegeType: "ALL",
    sortBy: "TOTAL_SEATS",
    sortOrder: "desc",
    page: 1,
    pageSize: 50,
  });
  assertMonotonicDescending(
    totalSeatsResult.items,
    (item) => item.totalMBBSSeats2026,
    "Total MBBS Seats Sort (Descending)"
  );

  // 4. NAME
  const nameResult = await searchMedicalCollegesEvidence({
    collegeType: "ALL",
    sortBy: "NAME",
    sortOrder: "asc",
    page: 1,
    pageSize: 50,
  });
  let nameSorted = true;
  for (let i = 0; i < nameResult.items.length - 1; i++) {
    if (nameResult.items[i].collegeName.localeCompare(nameResult.items[i + 1].collegeName, undefined, { sensitivity: "base" }) > 0) {
      nameSorted = false;
      break;
    }
  }
  assert(nameSorted, "College Name Sort (Alphabetical Ascending)");

  // 5. STATE
  const stateResult = await searchMedicalCollegesEvidence({
    collegeType: "ALL",
    sortBy: "STATE",
    sortOrder: "asc",
    page: 1,
    pageSize: 50,
  });
  let stateSorted = true;
  for (let i = 0; i < stateResult.items.length - 1; i++) {
    const sCmp = stateResult.items[i].state.localeCompare(stateResult.items[i + 1].state, undefined, { sensitivity: "base" });
    if (sCmp > 0) {
      stateSorted = false;
      break;
    }
  }
  assert(stateSorted, "State Sort (Alphabetical Ascending)");

  // -------------------------------------------------------------
  // Test Group 6: Displayed Value === Sort Value Invariant
  // -------------------------------------------------------------
  console.log("\nTest Group 6: Displayed Value === Sort Value Invariant");
  let allCardValuesMatch = true;
  for (const item of globalMedianPage1.items) {
    const primaryOpen = getPrimaryOpenBenchmark(item.allCategoryProfiles);
    const cardOpen = item.openRound1Profiles[0];
    if (primaryOpen?.medianAIR !== cardOpen?.medianAIR) {
      allCardValuesMatch = false;
      console.error(`Mismatch for ${item.collegeName}: primaryOpen.median=${primaryOpen?.medianAIR}, card.median=${cardOpen?.medianAIR}`);
      break;
    }
  }
  assert(allCardValuesMatch, "Displayed Primary Open Benchmark on card strictly matches sorting value");

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
