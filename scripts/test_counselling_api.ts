import "dotenv/config";
import { NextRequest } from "next/server";
import { prisma } from "../lib/prisma";
import { POST as handleRecommendations } from "../app/api/counselling/recommendations/route";
import { GET as handleCollegesList } from "../app/api/counselling/colleges/route";
import { GET as handleCollegeDetail } from "../app/api/counselling/colleges/[id]/route";
import { generateRecommendations } from "../lib/counselling/recommendationEngine";
import { CounsellingSeatCategory } from "../lib/generated/prisma/client";

export async function runApiIntegrationTests() {
  console.log("===============================================================");
  console.log("SEQUENCE 6: COUNSELLING API ENDPOINTS INTEGRATION TEST SUITE");
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
  // PART 1: POST /api/counselling/recommendations Valid Requests
  // -------------------------------------------------------------
  console.log("1. Testing Valid Recommendation Requests...");

  // Test 1: Valid OPEN Non-PwD
  const req1 = new NextRequest("http://localhost:3000/api/counselling/recommendations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      air: 4500,
      category: "OPEN",
      isPwD: false,
      domicileState: "Delhi",
      goal: "GET_SEAT",
      limitPerBand: 25,
    }),
  });
  const t0 = Date.now();
  const res1 = await handleRecommendations(req1);
  const dur1 = Date.now() - t0;
  const json1 = await res1.json();

  assert(res1.status === 200, "Test 1: Valid OPEN Non-PwD returns HTTP 200");
  assert(json1.profile.air === 4500, "Test 1: Response includes profile AIR 4,500");
  assert(json1.summary.totalEvaluated === 521, "Test 1: Total evaluated matches engine (521)");
  assert(json1.summary.strong === 376, "Test 1: Strong count matches engine (376)");
  assert(json1.recommendations.length <= 100, "Test 1: Response bounded by limitPerBand");
  console.log(`  * Request 1 processed in ${dur1}ms`);

  // Test 2: Valid OBC Request
  const req2 = new NextRequest("http://localhost:3000/api/counselling/recommendations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      air: 14000,
      category: "OBC",
      isPwD: false,
      domicileState: "Uttar Pradesh",
      goal: "GET_SEAT",
      limitPerBand: 25,
    }),
  });
  const res2 = await handleRecommendations(req2);
  const json2 = await res2.json();

  assert(res2.status === 200, "Test 2: Valid OBC returns HTTP 200");
  assert(json2.summary.totalEvaluated === 1050, "Test 2: OBC evaluated count matches engine (1,050)");
  assert(json2.summary.strong === 249, "Test 2: OBC strong count matches engine (249)");

  // Test 3: Valid PwD Request
  const req3 = new NextRequest("http://localhost:3000/api/counselling/recommendations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      air: 160000,
      category: "OBC",
      isPwD: true,
      domicileState: "Maharashtra",
      goal: "GET_SEAT",
      limitPerBand: 25,
    }),
  });
  const res3 = await handleRecommendations(req3);
  const json3 = await res3.json();

  assert(res3.status === 200, "Test 3: Valid OBC PwD returns HTTP 200");
  assert(json3.summary.totalEvaluated === 1388, "Test 3: PwD evaluated count matches engine (1,388)");
  assert(json3.summary.strong === 50, "Test 3: PwD strong count matches engine (50)");

  // Test 4 & 5: DU Internal vs Ordinary Delhi Profile
  const req4 = new NextRequest("http://localhost:3000/api/counselling/recommendations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      air: 8000,
      category: "OPEN",
      isPwD: false,
      domicileState: "Delhi",
      goal: "GET_SEAT",
      specialPathwayEligibility: { isInternalDU: true },
      limitPerBand: 50,
    }),
  });
  const res4 = await handleRecommendations(req4);
  const json4 = await res4.json();

  const req5 = new NextRequest("http://localhost:3000/api/counselling/recommendations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      air: 8000,
      category: "OPEN",
      isPwD: false,
      domicileState: "Delhi",
      goal: "GET_SEAT",
      limitPerBand: 50,
    }),
  });
  const res5 = await handleRecommendations(req5);
  const json5 = await res5.json();

  assert(res4.status === 200 && res5.status === 200, "Test 4 & 5: DU queries return HTTP 200");
  assert(json4.summary.totalEvaluated === 524, "Test 4: DU-eligible totalEvaluated = 524 (+3 over ordinary)");
  assert(json5.summary.totalEvaluated === 521, "Test 5: Ordinary Delhi totalEvaluated = 521 (0 DU records)");

  // -------------------------------------------------------------
  // PART 2: POST /api/counselling/recommendations Validation Errors
  // -------------------------------------------------------------
  console.log("\n2. Testing Validation Error Handling (Malformed Requests)...");

  // Test 6: Malformed AIR
  const req6 = new NextRequest("http://localhost:3000/api/counselling/recommendations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ air: -50, category: "OPEN", isPwD: false, domicileState: "Delhi" }),
  });
  const res6 = await handleRecommendations(req6);
  const json6 = await res6.json();
  assert(res6.status === 400 && json6.error.code === "VALIDATION_ERROR", "Test 6: Negative AIR rejected with 400 VALIDATION_ERROR");

  // Test 7: Invalid Category
  const req7 = new NextRequest("http://localhost:3000/api/counselling/recommendations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ air: 10000, category: "INVALID_CAT", isPwD: false, domicileState: "Delhi" }),
  });
  const res7 = await handleRecommendations(req7);
  const json7 = await res7.json();
  assert(res7.status === 400 && json7.error.details.some((d: any) => d.field === "category"), "Test 7: Invalid category rejected with 400");

  // Test 8: Missing domicileState
  const req8 = new NextRequest("http://localhost:3000/api/counselling/recommendations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ air: 10000, category: "OPEN", isPwD: false }),
  });
  const res8 = await handleRecommendations(req8);
  const json8 = await res8.json();
  assert(res8.status === 400 && json8.error.details.some((d: any) => d.field === "domicileState"), "Test 8: Missing domicileState rejected with 400");

  // Test 9: Invalid goal
  const req9 = new NextRequest("http://localhost:3000/api/counselling/recommendations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ air: 10000, category: "OPEN", isPwD: false, domicileState: "Delhi", goal: "INVALID_GOAL" }),
  });
  const res9 = await handleRecommendations(req9);
  const json9 = await res9.json();
  assert(res9.status === 400 && json9.error.details.some((d: any) => d.field === "goal"), "Test 9: Invalid goal rejected with 400");

  // Test 10: Invalid specialPathwayEligibility field type
  const req10 = new NextRequest("http://localhost:3000/api/counselling/recommendations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      air: 10000,
      category: "OPEN",
      isPwD: false,
      domicileState: "Delhi",
      specialPathwayEligibility: { isNRI: "yes" }, // String instead of boolean
    }),
  });
  const res10 = await handleRecommendations(req10);
  const json10 = await res10.json();
  assert(res10.status === 400 && json10.error.details.some((d: any) => d.field === "specialPathwayEligibility.isNRI"), "Test 10: Non-boolean isNRI rejected with 400");

  // -------------------------------------------------------------
  // PART 3: GET /api/counselling/colleges Tests
  // -------------------------------------------------------------
  console.log("\n3. Testing College Listing & Search Endpoints...");

  // Test 11: Default pagination
  const req11 = new NextRequest("http://localhost:3000/api/counselling/colleges");
  const res11 = await handleCollegesList(req11);
  const json11 = await res11.json();
  assert(res11.status === 200, "Test 11: GET /api/counselling/colleges returns HTTP 200");
  assert(json11.page === 1 && json11.pageSize === 25, "Test 11: Default pagination page=1, pageSize=25");
  assert(json11.items.length === 25, "Test 11: Items length is 25");
  assert(json11.total === 847, "Test 11: Total colleges count is 847");

  // Test 12: Search by state
  const req12 = new NextRequest("http://localhost:3000/api/counselling/colleges?state=Delhi");
  const res12 = await handleCollegesList(req12);
  const json12 = await res12.json();
  assert(res12.status === 200, "Test 12: Search by state=Delhi returns HTTP 200");
  assert(json12.total > 0 && json12.items.every((c: any) => c.state.toLowerCase() === "delhi"), "Test 12: All items belong to Delhi");

  // Test 13: Search by management type
  const req13 = new NextRequest("http://localhost:3000/api/counselling/colleges?managementType=GOVERNMENT&pageSize=10");
  const res13 = await handleCollegesList(req13);
  const json13 = await res13.json();
  assert(res13.status === 200, "Test 13: Search by managementType=GOVERNMENT returns HTTP 200");
  assert(json13.items.every((c: any) => c.managementType === "GOVERNMENT"), "Test 13: All items are GOVERNMENT");

  // -------------------------------------------------------------
  // PART 4: GET /api/counselling/colleges/[id] Tests
  // -------------------------------------------------------------
  console.log("\n4. Testing College Detail Endpoint...");

  const sampleCol = json11.items[0];

  // Test 14: Valid college ID
  const req14 = new NextRequest(`http://localhost:3000/api/counselling/colleges/${sampleCol.id}`);
  const res14 = await handleCollegeDetail(req14, { params: Promise.resolve({ id: sampleCol.id }) });
  const json14 = await res14.json();
  assert(res14.status === 200, "Test 14: Valid college ID returns HTTP 200");
  assert(json14.college.id === sampleCol.id, "Test 14: College ID matches requested ID");
  assert(Array.isArray(json14.college.aliases), "Test 14: Aliases array returned");
  assert(Array.isArray(json14.college.analyticsSnapshots), "Test 14: Analytics snapshots array returned");

  // Test 15: Invalid college ID returns 404
  const req15 = new NextRequest("http://localhost:3000/api/counselling/colleges/non_existent_id");
  const res15 = await handleCollegeDetail(req15, { params: Promise.resolve({ id: "non_existent_id" }) });
  const json15 = await res15.json();
  assert(res15.status === 404 && json15.error.code === "NOT_FOUND", "Test 15: Non-existent college ID returns HTTP 404 NOT_FOUND");

  // -------------------------------------------------------------
  // PART 5: Domain Invariant Verifications over API Responses
  // -------------------------------------------------------------
  console.log("\n5. Verifying Domain Invariants across API Serialization...");

  // Test 16 & 17: State Capacity Estimates remain LOW_EVIDENCE with STATE_RANK_DATA_AWAITED
  const req16 = new NextRequest("http://localhost:3000/api/counselling/recommendations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      air: 14000,
      category: "OBC",
      isPwD: false,
      domicileState: "Uttar Pradesh",
      goal: "GET_SEAT",
      opportunityBands: ["LOW_EVIDENCE"],
      limitPerBand: 100,
    }),
  });
  const res16 = await handleRecommendations(req16);
  const json16 = await res16.json();
  const stateEsts = json16.recommendations.filter((r: any) => r.route === "STATE_ESTIMATE");

  assert(stateEsts.length > 0, "Test 16: State estimates returned in response");
  assert(
    stateEsts.every((r: any) => r.opportunityBand === "LOW_EVIDENCE" && r.reasonCodes.includes("STATE_RANK_DATA_AWAITED")),
    "Test 16 & 17: All State estimates are LOW_EVIDENCE with STATE_RANK_DATA_AWAITED"
  );

  // Test 18: Engine vs API Regression Check
  const directP1 = await generateRecommendations({
    air: 4500,
    category: CounsellingSeatCategory.OPEN,
    isPwD: false,
    domicileState: "Delhi",
    goal: "GET_SEAT",
  });
  assert(json1.summary.strong === directP1.bandCounts.STRONG, "Test 18: OPEN API strong count matches direct engine");
  assert(json1.summary.realistic === directP1.bandCounts.REALISTIC, "Test 18: OPEN API realistic count matches direct engine");
  assert(json1.summary.stretch === directP1.bandCounts.STRETCH, "Test 18: OPEN API stretch count matches direct engine");
  assert(json1.summary.lowEvidence === directP1.bandCounts.LOW_EVIDENCE, "Test 18: OPEN API lowEvidence count matches direct engine");

  // Test 21 & 22: Limiting enforcement
  const req21 = new NextRequest("http://localhost:3000/api/counselling/recommendations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      air: 4500,
      category: "OPEN",
      isPwD: false,
      domicileState: "Delhi",
      limitPerBand: 10,
    }),
  });
  const res21 = await handleRecommendations(req21);
  const json21 = await res21.json();
  const strongs21 = json21.recommendations.filter((r: any) => r.opportunityBand === "STRONG");
  assert(strongs21.length === 10, "Test 21: limitPerBand=10 correctly limits returned strong items to 10");

  const req22 = new NextRequest("http://localhost:3000/api/counselling/recommendations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      air: 4500,
      category: "OPEN",
      isPwD: false,
      domicileState: "Delhi",
      limitPerBand: 200, // Exceeds max 100
    }),
  });
  const res22 = await handleRecommendations(req22);
  const json22 = await res22.json();
  assert(res22.status === 400 && json22.error.details.some((d: any) => d.field === "limitPerBand"), "Test 22: limitPerBand > 100 rejected with 400");

  // Test 23: Safety Language check across API response
  const forbiddenBuzzwords = ["guaranteed", "100% chance", "safe college", "confirmed admission", "confirmed round-2 vacancy", "certain admission"];
  let apiSafetyViolations = 0;
  json1.recommendations.forEach((r: any) => {
    const lower = r.reasonSummary.toLowerCase();
    forbiddenBuzzwords.forEach((bw) => {
      if (lower.includes(bw)) apiSafetyViolations++;
    });
  });
  assert(apiSafetyViolations === 0, "Test 23: Zero safety buzzwords in API serialized recommendations");

  // -------------------------------------------------------------
  // PART 6: PERFORMANCE MEASUREMENTS
  // -------------------------------------------------------------
  console.log("\n6. Running API Performance Benchmarks...");

  const runs = 5;
  let totalRecTime = 0;
  let totalListTime = 0;
  let totalDetailTime = 0;

  for (let i = 0; i < runs; i++) {
    const tA = Date.now();
    await handleRecommendations(
      new NextRequest("http://localhost:3000/api/counselling/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ air: 14000, category: "OBC", isPwD: false, domicileState: "Uttar Pradesh", limitPerBand: 25 }),
      })
    );
    totalRecTime += Date.now() - tA;

    const tB = Date.now();
    await handleCollegesList(new NextRequest("http://localhost:3000/api/counselling/colleges?pageSize=25"));
    totalListTime += Date.now() - tB;

    const tC = Date.now();
    await handleCollegeDetail(
      new NextRequest(`http://localhost:3000/api/counselling/colleges/${sampleCol.id}`),
      { params: Promise.resolve({ id: sampleCol.id }) }
    );
    totalDetailTime += Date.now() - tC;
  }

  const avgRec = totalRecTime / runs;
  const avgList = totalListTime / runs;
  const avgDetail = totalDetailTime / runs;

  console.log(`- Average POST /api/counselling/recommendations: ${avgRec.toFixed(1)}ms`);
  console.log(`- Average GET /api/counselling/colleges:        ${avgList.toFixed(1)}ms`);
  console.log(`- Average GET /api/counselling/colleges/[id]:    ${avgDetail.toFixed(1)}ms`);

  console.log("\n===============================================================");
  console.log(`INTEGRATION TESTS SUMMARY: ${passedTests} Passed, ${failedTests} Failed ✅`);
  console.log("===============================================================\n");
}

if (require.main === module) {
  runApiIntegrationTests()
    .then(async () => {
      await prisma.$disconnect();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error("Integration tests failed:", err);
      await prisma.$disconnect();
      process.exit(1);
    });
}
