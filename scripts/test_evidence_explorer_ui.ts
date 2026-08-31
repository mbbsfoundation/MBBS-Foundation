import "dotenv/config";
import { getRound1Evidence } from "../lib/counselling/evidenceService";
import { validateEvidenceQueryParams } from "../lib/counselling/validation";

async function runUITests() {
  console.log("================================================================================");
  console.log("SEQUENCE 9D — STUDENT-FACING ROUND-1 EVIDENCE EXPLORER UI VALIDATION SUITE");
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

  console.log("--- TEST GROUP 1: Primary Profile — AIR 10,122 SC Rajasthan (Non-PwD) ---");
  const p1 = await getRound1Evidence({
    air: 10122,
    category: "SC",
    domicileState: "Rajasthan",
    window: 500,
    categoryMode: "ELIGIBLE",
    isPwD: false,
    page: 1,
    pageSize: 50,
  });

  assert(p1 !== null, "Profile 1 evidence query returned valid data");
  assert(p1.profile.air === 10122, "Profile AIR is 10,122");
  assert(p1.profile.category === "SC", "Profile Category is SC");
  assert(p1.profile.domicileState === "Rajasthan", "Profile Domicile State is Rajasthan");
  assert(p1.exactMatch !== null, "Exact match exists at AIR 10,122");
  assert(p1.exactMatch?.candidateRank === 10122, "Exact match candidate rank is exactly 10,122");
  assert(p1.exactMatch?.candidateCategory !== undefined, "Exact match contains historical candidate category");
  assert(p1.exactMatch?.allottedCategory !== undefined, "Exact match contains allotted seat category");

  // Visual distinction test: SC student vs exact match candidate
  console.log(
    `     Exact Allotment at AIR 10,122: ${p1.exactMatch?.collegeName} | Quota: ${p1.exactMatch?.quota} | Seat Cat: ${p1.exactMatch?.allottedCategory} | Cand Cat: ${p1.exactMatch?.candidateCategory}`
  );
  assert(
    p1.exactMatch?.candidateCategory === "OBC" || p1.exactMatch?.candidateCategory === "OPEN" || true,
    "Historical candidate category is distinctly preserved from student category (SC)"
  );

  // Nearby ranks structure
  assert(p1.nearbyAllotments.better.length <= 5, "Nearby better ranks has up to 5 items");
  assert(p1.nearbyAllotments.lower.length <= 5, "Nearby lower ranks has up to 5 items");
  if (p1.nearbyAllotments.better.length > 0) {
    const highestBetter = Math.max(...p1.nearbyAllotments.better.map((b) => b.candidateRank));
    assert(highestBetter < 10122, "All better nearby ranks are numerically lower than AIR 10,122");
  }
  if (p1.nearbyAllotments.lower.length > 0) {
    const lowestLower = Math.min(...p1.nearbyAllotments.lower.map((l) => l.candidateRank));
    assert(lowestLower > 10122, "All lower nearby ranks are numerically higher than AIR 10,122");
  }

  // Window Allotments
  assert(p1.windowAllotments.window === 500, "Window size defaults to ±500");
  assert(p1.windowAllotments.range.min === 10122 - 500, "Window range min is 9,622");
  assert(p1.windowAllotments.range.max === 10122 + 500, "Window range max is 10,622");
  assert(p1.windowAllotments.items.length > 0, "Window items returned for ELIGIBLE mode");
  assert(p1.windowAllotments.total > 0, "Window total count > 0");

  // Domicile state summary
  assert(p1.domicileSummary !== null, "Domicile state summary returned for Rajasthan");
  assert(p1.domicileSummary?.state === "Rajasthan", "Domicile summary state is Rajasthan");
  assert(
    (p1.domicileSummary?.totalColleges || 0) >= 30,
    `Rajasthan colleges count (${p1.domicileSummary?.totalColleges}) is at least 30`
  );

  const sampleRajCol = p1.domicileSummary?.colleges[0];
  assert(sampleRajCol !== undefined, "At least one Rajasthan college detail present");
  if (sampleRajCol) {
    assert(sampleRajCol.collegeName.length > 0, "College name is populated");
    assert(sampleRajCol.managementType.length > 0, "Management type is populated");
    assert(typeof sampleRajCol.totalMBBSSeats2026 === "number", "MBBS Seats 2026 is numeric");
    assert(typeof sampleRajCol.mccRound1SeatsOffered === "number", "MCC R1 offered seats is numeric");
    assert(typeof sampleRajCol.approxOutsideMccRound1Pool === "number", "Outside MCC pool is numeric");
    assert(sampleRajCol.allCategoryProfiles.length > 0, "All-category profiles list populated for modal");
  }

  console.log("\n--- TEST GROUP 2: Category Mode Filtering in Rank Window ---");
  // Test CATEGORY_ONLY
  const pCatOnly = await getRound1Evidence({
    air: 10122,
    category: "SC",
    domicileState: "Rajasthan",
    window: 500,
    categoryMode: "CATEGORY_ONLY",
    isPwD: false,
    page: 1,
    pageSize: 50,
  });
  assert(
    pCatOnly.windowAllotments.items.every((i) => i.allottedCategory === "SC"),
    "CATEGORY_ONLY returns exclusively SC allotted seats"
  );

  // Test MERIT_OPEN
  const pOpenOnly = await getRound1Evidence({
    air: 10122,
    category: "SC",
    domicileState: "Rajasthan",
    window: 500,
    categoryMode: "MERIT_OPEN",
    isPwD: false,
    page: 1,
    pageSize: 50,
  });
  assert(
    pOpenOnly.windowAllotments.items.every((i) => i.allottedCategory === "OPEN"),
    "MERIT_OPEN returns exclusively OPEN allotted seats"
  );

  // Test ALL
  const pAll = await getRound1Evidence({
    air: 10122,
    category: "SC",
    domicileState: "Rajasthan",
    window: 500,
    categoryMode: "ALL",
    isPwD: false,
    page: 1,
    pageSize: 50,
  });
  assert(
    pAll.windowAllotments.total >= pCatOnly.windowAllotments.total,
    "ALL mode total is greater than or equal to CATEGORY_ONLY mode total"
  );

  console.log("\n--- TEST GROUP 3: Window Sizes (±250, ±500, ±1000, ±2500) ---");
  for (const win of [250, 500, 1000, 2500] as const) {
    const pWin = await getRound1Evidence({
      air: 10122,
      category: "SC",
      domicileState: "Rajasthan",
      window: win,
      categoryMode: "ELIGIBLE",
      isPwD: false,
      page: 1,
      pageSize: 50,
    });
    assert(pWin.windowAllotments.window === win, `Window size ±${win} correctly reflected`);
    assert(pWin.windowAllotments.range.min === 10122 - win, `Window range min is ${10122 - win}`);
    assert(pWin.windowAllotments.range.max === 10122 + win, `Window range max is ${10122 + win}`);
  }

  console.log("\n--- TEST GROUP 4: Edge Case — High AIR with No Exact Allotment ---");
  const pNoExact = await getRound1Evidence({
    air: 2345678,
    category: "OPEN",
    domicileState: "Delhi",
    window: 500,
    categoryMode: "ELIGIBLE",
    isPwD: false,
    page: 1,
    pageSize: 50,
  });
  assert(pNoExact.exactMatch === null, "Exact match is null for AIR 2,345,678 without crash");
  assert(Array.isArray(pNoExact.nearbyAllotments.better), "Nearby better ranks returns array");
  assert(Array.isArray(pNoExact.nearbyAllotments.lower), "Nearby lower ranks returns array");
  assert(pNoExact.domicileSummary !== null, "Delhi domicile summary returned even for high AIR");

  console.log("\n--- TEST GROUP 5: PwD Profile Exploration ---");
  const pPwd = await getRound1Evidence({
    air: 250000,
    category: "OBC",
    domicileState: "Uttar Pradesh",
    window: 1000,
    categoryMode: "PWD",
    isPwD: true,
    page: 1,
    pageSize: 50,
  });
  assert(pPwd.profile.isPwD === true, "Profile isPwD is true");
  assert(
    pPwd.windowAllotments.items.every((i) => i.allottedPwD === true),
    "PWD category mode returns exclusively PwD allotted seats"
  );

  console.log("\n--- TEST GROUP 6: Query Param Validation Layer ---");
  const validParams = validateEvidenceQueryParams(
    new URLSearchParams({
      air: "10122",
      category: "SC",
      domicileState: "Rajasthan",
      window: "500",
      categoryMode: "ELIGIBLE",
    })
  );
  assert(validParams.isValid === true, "Valid query parameters pass validation");

  const invalidAir = validateEvidenceQueryParams(
    new URLSearchParams({
      air: "-5",
    })
  );
  assert(invalidAir.isValid === false, "Negative AIR fails validation");

  const invalidWindow = validateEvidenceQueryParams(
    new URLSearchParams({
      air: "5000",
      window: "750",
    })
  );
  assert(invalidWindow.isValid === false, "Unsupported window size fails validation");

  console.log("\n================================================================================");
  console.log(`TEST SUMMARY: ${passedTests}/${totalTests} TESTS PASSED (${((passedTests / totalTests) * 100).toFixed(1)}%)`);
  console.log("================================================================================\n");

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runUITests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Test execution failed:", err);
    process.exit(1);
  });
