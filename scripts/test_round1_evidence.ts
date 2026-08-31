import "dotenv/config";
import { NextRequest } from "next/server";
import { prisma } from "../lib/prisma";
import { GET as handleEvidenceGet } from "../app/api/counselling/round1/evidence/route";
import {
  getExactAllotment,
  getNearbyAllotments,
  getWindowedAllotments,
  getDomicileStateSummary,
  getRound1Evidence,
} from "../lib/counselling/evidenceService";
import { CounsellingSeatCategory } from "../lib/generated/prisma/client";

export async function runEvidenceTests() {
  console.log("===============================================================");
  console.log("SEQUENCE 9C: ROUND-1 EVIDENCE QUERY SERVICE & API TEST SUITE");
  console.log("===============================================================\n");

  let passedTests = 0;
  let failedTests = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`[PASS] ${testName} ✅`);
      passedTests++;
    } else {
      console.error(`[FAIL] ${testName} ❌`);
      failedTests++;
      throw new Error(`Assertion failed for: ${testName}`);
    }
  }

  // -------------------------------------------------------------
  // TEST 1: Duplicate AIR Regression in Allotments
  // -------------------------------------------------------------
  console.log("1. Running Test 1: Duplicate AIR Regression Check...");
  const duplicateRanks: Array<{ candidateRank: number; count: bigint }> = await prisma.$queryRaw`
    SELECT "candidateRank", COUNT(*) as count
    FROM "AllotmentRecord"
    GROUP BY "candidateRank"
    HAVING COUNT(*) > 1;
  `;
  assert(duplicateRanks.length === 0, "Test 1: Zero duplicate candidateRank records in MCC R1 MBBS dataset");
  console.log("  * Uniqueness verified across all 25,635 allotment rows ✅");

  // -------------------------------------------------------------
  // TEST 2: Exact AIR Lookup (AIR 10,122)
  // -------------------------------------------------------------
  console.log("\n2. Running Test 2: Exact AIR Lookup (AIR 10,122)...");
  const exact10122 = await getExactAllotment(10122);
  assert(exact10122 !== null, "Test 2: Exact allotment found for AIR 10,122");
  assert(exact10122?.candidateRank === 10122, "Test 2: Returned rank matches requested AIR 10,122");
  assert(Boolean(exact10122?.collegeName.includes("Siddhartha")), "Test 2: Allotted college is Siddhartha Medical College");
  assert(exact10122?.quota === "All India", "Test 2: Quota is All India");
  assert(exact10122?.allottedCategory === CounsellingSeatCategory.OPEN, "Test 2: Allotted category is OPEN");
  assert(exact10122?.course === "MBBS", "Test 2: Course is MBBS");
  console.log(`  * Exact AIR 10,122: ${exact10122?.collegeName} (${exact10122?.quota}, ${exact10122?.allottedCategory}) ✅`);

  // Test Non-existent AIR
  const nonExistent = await getExactAllotment(9999999);
  assert(nonExistent === null, "Test 2: Non-existent rank cleanly returns null without error");

  // -------------------------------------------------------------
  // TEST 3: Nearest AIR Lookup (5 above, 5 below AIR 10,122)
  // -------------------------------------------------------------
  console.log("\n3. Running Test 3: Nearest AIR Lookup (5 above, 5 below)...");
  const nearby = await getNearbyAllotments(10122, 5);
  assert(nearby.better.length === 5, "Test 3: Exactly 5 better ranks returned");
  assert(nearby.lower.length === 5, "Test 3: Exactly 5 lower ranks returned");
  assert(nearby.better.every((r) => r.candidateRank < 10122), "Test 3: All better ranks are numerically < 10,122");
  assert(nearby.lower.every((r) => r.candidateRank > 10122), "Test 3: All lower ranks are numerically > 10,122");
  // Check display order of better ranks (ascending: lowest to highest)
  assert(
    nearby.better[0].candidateRank < nearby.better[nearby.better.length - 1].candidateRank,
    "Test 3: Better ranks sorted in ascending display order (top-to-bottom reading)"
  );
  console.log("  * Better ranks:", nearby.better.map((r) => r.candidateRank));
  console.log("  * Lower ranks:", nearby.lower.map((r) => r.candidateRank));

  // -------------------------------------------------------------
  // TEST 4: Window Count Regression (ALL Mode around AIR 10,122)
  // -------------------------------------------------------------
  console.log("\n4. Running Test 4: Window Count Regression (ALL Mode)...");
  const w250 = await getWindowedAllotments({ air: 10122, window: 250, categoryMode: "ALL" });
  const w500 = await getWindowedAllotments({ air: 10122, window: 500, categoryMode: "ALL" });
  const w1000 = await getWindowedAllotments({ air: 10122, window: 1000, categoryMode: "ALL" });
  const w2500 = await getWindowedAllotments({ air: 10122, window: 2500, categoryMode: "ALL" });

  assert(w250.total === 194, `Test 4: Window ±250 total = 194 (Observed: ${w250.total})`);
  assert(w500.total === 405, `Test 4: Window ±500 total = 405 (Observed: ${w500.total})`);
  assert(w1000.total === 785, `Test 4: Window ±1000 total = 785 (Observed: ${w1000.total})`);
  assert(w2500.total === 1932, `Test 4: Window ±2500 total = 1932 (Observed: ${w2500.total})`);
  console.log(`  * Window Totals: ±250=${w250.total}, ±500=${w500.total}, ±1000=${w1000.total}, ±2500=${w2500.total} ✅`);

  // -------------------------------------------------------------
  // TEST 5: Category Modes & Merit Open Semantics
  // -------------------------------------------------------------
  console.log("\n5. Running Test 5: Category Modes & Merit Open Semantics...");

  // ELIGIBLE mode for SC student
  const scEligible = await getWindowedAllotments({
    air: 10122,
    window: 500,
    category: CounsellingSeatCategory.SC,
    categoryMode: "ELIGIBLE",
    isPwD: false,
  });
  assert(
    scEligible.items.every(
      (r) =>
        (r.allottedCategory === CounsellingSeatCategory.SC || r.allottedCategory === CounsellingSeatCategory.OPEN) &&
        !r.allottedPwD
    ),
    "Test 5: SC ELIGIBLE mode contains only SC and OPEN non-PwD allotments"
  );

  // CATEGORY_ONLY mode for SC student
  const scOnly = await getWindowedAllotments({
    air: 10122,
    window: 500,
    category: CounsellingSeatCategory.SC,
    categoryMode: "CATEGORY_ONLY",
    isPwD: false,
  });
  assert(
    scOnly.items.every((r) => r.allottedCategory === CounsellingSeatCategory.SC && !r.allottedPwD),
    "Test 5: CATEGORY_ONLY contains strictly SC seats, no OPEN seats"
  );

  // MERIT_OPEN mode
  const meritOpen = await getWindowedAllotments({
    air: 10122,
    window: 500,
    categoryMode: "MERIT_OPEN",
  });
  assert(
    meritOpen.items.every((r) => r.allottedCategory === CounsellingSeatCategory.OPEN && !r.allottedPwD),
    "Test 5: MERIT_OPEN contains strictly OPEN seats"
  );
  // Verify that reserved candidates appear in MERIT_OPEN
  const reservedInOpen = meritOpen.items.filter((r) => r.candidateCategory !== CounsellingSeatCategory.OPEN);
  assert(reservedInOpen.length > 0, "Test 5: Reserved category candidates visible in MERIT_OPEN mode");
  console.log(`  * Reserved candidates in MERIT_OPEN window sample: ${reservedInOpen.length} / ${meritOpen.items.length} ✅`);

  // PWD mode
  const pwdMode = await getWindowedAllotments({
    air: 10122,
    window: 2500,
    categoryMode: "PWD",
  });
  assert(
    pwdMode.items.every((r) => r.candidatePwD || r.allottedPwD),
    "Test 5: PWD mode isolates PwD allotments"
  );

  // -------------------------------------------------------------
  // TEST 6: Domicile State Summary & Institutional Breakdown (Rajasthan)
  // -------------------------------------------------------------
  console.log("\n6. Running Test 6: Domicile State Summary (Rajasthan)...");
  const rajSummary = await getDomicileStateSummary("Rajasthan", CounsellingSeatCategory.SC, false);
  assert(rajSummary.totalColleges === 52, `Test 6: Total Rajasthan colleges = 52 (Observed: ${rajSummary.totalColleges})`);

  // Validate Government College: SMS Medical College, Jaipur
  const sms = rajSummary.colleges.find((c) => c.collegeName.includes("SMS Medical College"));
  assert(sms !== undefined, "Test 6: SMS Medical College present in Rajasthan summary");
  assert(sms?.managementType === "GOVERNMENT", "Test 6: SMS is GOVERNMENT");
  assert(sms?.totalMBBSSeats2026 === 250, `Test 6: SMS total MBBS seats = 250 (Observed: ${sms?.totalMBBSSeats2026})`);
  assert(sms?.mccRound1SeatsOffered === 37, `Test 6: SMS MCC offered = 37 (Observed: ${sms?.mccRound1SeatsOffered})`);
  assert(sms?.mccRound1SeatsAllotted === 37, `Test 6: SMS MCC allotted = 37 (Observed: ${sms?.mccRound1SeatsAllotted})`);
  assert(sms?.approxOutsideMccRound1Pool === 213, `Test 6: SMS outside pool = 213 (Observed: ${sms?.approxOutsideMccRound1Pool})`);

  const smsOpenProfile = sms?.openRound1Profiles.find((p) => p.quota === "All India");
  assert(smsOpenProfile?.bestAIR === 584, `Test 6: SMS OPEN Best AIR = 584 (Observed: ${smsOpenProfile?.bestAIR})`);
  assert(smsOpenProfile?.medianAIR === 938, `Test 6: SMS OPEN Median AIR = 938 (Observed: ${smsOpenProfile?.medianAIR})`);
  assert(smsOpenProfile?.highestAIR === 1144, `Test 6: SMS OPEN Last AIR = 1144 (Observed: ${smsOpenProfile?.highestAIR})`);

  const smsScProfile = sms?.studentCategoryRound1Profiles.find((p) => p.quota === "All India");
  assert(smsScProfile?.bestAIR === 9797, `Test 6: SMS SC Best AIR = 9797 (Observed: ${smsScProfile?.bestAIR})`);
  assert(smsScProfile?.medianAIR === 14776, `Test 6: SMS SC Median AIR = 14776 (Observed: ${smsScProfile?.medianAIR})`);
  assert(smsScProfile?.highestAIR === 15696, `Test 6: SMS SC Last AIR = 15696 (Observed: ${smsScProfile?.highestAIR})`);

  // Validate INI College: AIIMS Jodhpur
  const aiimsJodhpur = rajSummary.colleges.find((c) => c.collegeName.includes("AIIMS, Jodhpur"));
  assert(aiimsJodhpur !== undefined, "Test 6: AIIMS Jodhpur present in Rajasthan summary");
  assert(aiimsJodhpur?.isINI === true, "Test 6: AIIMS Jodhpur is INI");
  assert(aiimsJodhpur?.totalMBBSSeats2026 === 150, `Test 6: AIIMS total seats = 150 (Observed: ${aiimsJodhpur?.totalMBBSSeats2026})`);
  assert(aiimsJodhpur?.mccRound1SeatsOffered === 150, `Test 6: AIIMS offered = 150 (Observed: ${aiimsJodhpur?.mccRound1SeatsOffered})`);
  assert(aiimsJodhpur?.approxOutsideMccRound1Pool === 0, `Test 6: AIIMS outside pool = 0 (100% MCC)`);

  // Validate Deemed College: KMC Manipal (Karnataka)
  const karnatakaSummary = await getDomicileStateSummary("Karnataka");
  const kmcManipal = karnatakaSummary.colleges.find((c) => c.collegeName.includes("Kasturba Medical College, Manipal"));
  assert(kmcManipal !== undefined, "Test 6: KMC Manipal present in Karnataka summary");
  assert(kmcManipal?.isDeemed === true, "Test 6: KMC Manipal is Deemed");
  assert(kmcManipal?.totalMBBSSeats2026 === 250, "Test 6: KMC Manipal total seats = 250");
  assert(kmcManipal?.mccRound1SeatsOffered === 250, "Test 6: KMC Manipal offered = 250");
  assert(kmcManipal?.approxOutsideMccRound1Pool === 0, "Test 6: KMC Manipal outside pool = 0 (100% MCC)");

  // -------------------------------------------------------------
  // TEST 7: Full API Route Integration GET /api/counselling/round1/evidence
  // -------------------------------------------------------------
  console.log("\n7. Running Test 7: GET /api/counselling/round1/evidence Route...");

  // Valid Request for AIR 10,122 / SC / Rajasthan
  const req1 = new NextRequest(
    "http://localhost:3000/api/counselling/round1/evidence?air=10122&category=SC&domicileState=Rajasthan&window=500&categoryMode=ELIGIBLE"
  );
  const res1 = await handleEvidenceGet(req1);
  const json1 = await res1.json();

  assert(res1.status === 200, "Test 7: Valid request returns HTTP 200");
  assert(json1.profile.air === 10122, "Test 7: Response profile includes AIR 10,122");
  assert(json1.profile.category === "SC", "Test 7: Response profile includes category SC");
  assert(json1.exactMatch !== null, "Test 7: exactMatch object populated");
  assert(json1.nearbyAllotments.better.length === 5, "Test 7: 5 better nearby allotments returned");
  assert(json1.nearbyAllotments.lower.length === 5, "Test 7: 5 lower nearby allotments returned");
  assert(json1.windowAllotments.window === 500, "Test 7: windowAllotments window = 500");
  assert(json1.domicileSummary.state === "Rajasthan", "Test 7: domicileSummary state is Rajasthan");
  assert(json1.domicileSummary.totalColleges === 52, "Test 7: domicileSummary totalColleges is 52");
  assert(json1.dataContext.authority === "MCC", "Test 7: dataContext authority is MCC");
  assert(json1.dataContext.round === "ROUND_1", "Test 7: dataContext round is ROUND_1");

  // Malformed Requests Validation
  const reqBadAir = new NextRequest("http://localhost:3000/api/counselling/round1/evidence?air=-100");
  const resBadAir = await handleEvidenceGet(reqBadAir);
  const jsonBadAir = await resBadAir.json();
  assert(resBadAir.status === 400 && jsonBadAir.error.code === "VALIDATION_ERROR", "Test 7: Negative AIR rejected with 400");

  const reqBadWin = new NextRequest("http://localhost:3000/api/counselling/round1/evidence?air=10000&window=300");
  const resBadWin = await handleEvidenceGet(reqBadWin);
  const jsonBadWin = await resBadWin.json();
  assert(resBadWin.status === 400 && jsonBadWin.error.code === "VALIDATION_ERROR", "Test 7: Unsupported window (300) rejected with 400");

  const reqBadCat = new NextRequest("http://localhost:3000/api/counselling/round1/evidence?air=10000&category=INVALID");
  const resBadCat = await handleEvidenceGet(reqBadCat);
  const jsonBadCat = await resBadCat.json();
  assert(resBadCat.status === 400 && jsonBadCat.error.code === "VALIDATION_ERROR", "Test 7: Invalid category rejected with 400");

  const reqBadMode = new NextRequest("http://localhost:3000/api/counselling/round1/evidence?air=10000&categoryMode=INVALID");
  const resBadMode = await handleEvidenceGet(reqBadMode);
  const jsonBadMode = await resBadMode.json();
  assert(resBadMode.status === 400 && jsonBadMode.error.code === "VALIDATION_ERROR", "Test 7: Invalid categoryMode rejected with 400");

  // -------------------------------------------------------------
  // TEST 8: Data Semantics & Safety Safeguards
  // -------------------------------------------------------------
  console.log("\n8. Running Test 8: Data Semantics & Safety Safeguards...");
  const forbiddenKeywords = ["guaranteed", "100% chance", "safe college", "confirmed round-2 vacancy", "certain admission"];
  const serialized = JSON.stringify(json1).toLowerCase();
  let safetyViolations = 0;
  forbiddenKeywords.forEach((kw) => {
    if (serialized.includes(kw)) safetyViolations++;
  });
  assert(safetyViolations === 0, "Test 8: Zero forbidden safety buzzwords in evidence response");

  console.log("\n===============================================================");
  console.log(`ROUND-1 EVIDENCE TESTS SUMMARY: ${passedTests} Passed, ${failedTests} Failed ✅`);
  console.log("===============================================================\n");
}

if (require.main === module) {
  runEvidenceTests()
    .then(async () => {
      await prisma.$disconnect();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error("Evidence test suite failed:", err);
      await prisma.$disconnect();
      process.exit(1);
    });
}
