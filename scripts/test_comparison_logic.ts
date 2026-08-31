import "dotenv/config";
import { NextRequest } from "next/server";
import { POST as handleRecommendations } from "../app/api/counselling/recommendations/route";

export async function testComparisonLogic() {
  console.log("===============================================================");
  console.log("SEQUENCE 8A: EVIDENCE-BASED COLLEGE COMPARISON LOGIC TESTS");
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
  // TEST 1: AIR 4,500 OPEN Delhi (Govt vs Private Comparison)
  // -------------------------------------------------------------
  console.log("1. Running Test 1: AIR 4,500 OPEN Delhi Comparison...");
  const req1 = new NextRequest("http://localhost:3000/api/counselling/recommendations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ air: 4500, category: "OPEN", isPwD: false, domicileState: "Delhi", limitPerBand: 50 }),
  });
  const res1 = await handleRecommendations(req1);
  const json1 = await res1.json();
  const recs1 = json1.recommendations;

  const skims = recs1.find((r: any) => r.collegeName.includes("Sher-I-Kashmir"));
  const kmcManipal = recs1.find((r: any) => r.collegeName.includes("Kasturba Medical College, Manipal"));
  const nrsKolkata = recs1.find((r: any) => r.collegeName.includes("Nilratan Sircar"));

  assert(Boolean(skims && kmcManipal && nrsKolkata), "Test 1: Found Government and Private options for comparison");
  assert(skims.opportunityBand === "REALISTIC", "Test 1: SKIMS is REALISTIC (Government)");
  assert(kmcManipal.opportunityBand === "STRONG", "Test 1: KMC Manipal is STRONG (Private / Self-Financed)");
  assert(kmcManipal.quota === "Self-Financed Merit", "Test 1: KMC Manipal explicitly tagged as Self-Financed Merit");
  console.log(`  * Comparison: SKIMS (${skims.opportunityBand}, Govt), KMC (${kmcManipal.opportunityBand}, Pvt), NRS (${nrsKolkata.opportunityBand}, Govt) ✅`);

  // -------------------------------------------------------------
  // TEST 2: AIR 14,000 OBC UP (Cross-Stream Comparison)
  // -------------------------------------------------------------
  console.log("\n2. Running Test 2: AIR 14,000 OBC UP Cross-Stream Comparison...");
  const req2 = new NextRequest("http://localhost:3000/api/counselling/recommendations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ air: 14000, category: "OBC", isPwD: false, domicileState: "Uttar Pradesh", limitPerBand: 50 }),
  });
  const res2 = await handleRecommendations(req2);
  const json2 = await res2.json();
  const recs2 = json2.recommendations;

  const mccGovt2 = recs2.find((r: any) => r.route === "MCC" && r.managementType === "GOVERNMENT" && r.opportunityBand !== "LOW_EVIDENCE");
  const stateOpp2 = recs2.find((r: any) => r.route === "STATE_ESTIMATE" || r.reasonCodes.includes("STATE_RANK_DATA_AWAITED"));
  const deemed2 = recs2.find((r: any) => r.route === "MCC" && r.managementType !== "GOVERNMENT");

  assert(Boolean(mccGovt2 && stateOpp2 && deemed2), "Test 2: Found MCC Govt, State Opportunity, and Deemed options");
  assert(stateOpp2.reasonCodes.includes("STATE_RANK_DATA_AWAITED"), "Test 2: State opportunity explicitly carries STATE_RANK_DATA_AWAITED");
  assert(mccGovt2.dataStatus === "R1_INFORMED", "Test 2: MCC Govt is R1_INFORMED");
  console.log(`  * Comparison: MCC Govt (${mccGovt2.collegeName}), State Opp (${stateOpp2.collegeName}), Deemed (${deemed2.collegeName}) ✅`);

  // -------------------------------------------------------------
  // TEST 3: AIR 160,000 OBC PwD Maharashtra (Multiple Pathways in One College)
  // -------------------------------------------------------------
  console.log("\n3. Running Test 3: AIR 160,000 OBC PwD Maharashtra (Multi-Pathway College)...");
  const req3 = new NextRequest("http://localhost:3000/api/counselling/recommendations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ air: 160000, category: "OBC", isPwD: true, domicileState: "Maharashtra", limitPerBand: 50 }),
  });
  const res3 = await handleRecommendations(req3);
  const json3 = await res3.json();
  const recs3 = json3.recommendations;

  // Find a college with multiple pathways (e.g. AIIMS or BHU or UCMS or GMC)
  const collegeIdsWithMultiplePathways = new Set<string>();
  const seenIds = new Set<string>();
  recs3.forEach((r: any) => {
    if (seenIds.has(r.collegeId)) collegeIdsWithMultiplePathways.add(r.collegeId);
    else seenIds.add(r.collegeId);
  });

  assert(collegeIdsWithMultiplePathways.size > 0, "Test 3: Found colleges with multiple eligible pathways");
  const sampleMultiId = Array.from(collegeIdsWithMultiplePathways)[0];
  const pathwaysForCol = recs3.filter((r: any) => r.collegeId === sampleMultiId);

  assert(pathwaysForCol.length >= 2, "Test 3: College contains at least 2 distinct eligible pathways");
  console.log(`  * College: ${pathwaysForCol[0].collegeName} has ${pathwaysForCol.length} eligible pathways for PwD student:`);
  pathwaysForCol.forEach((p: any) => {
    console.log(`    - Pathway: Quota=${p.quota}, Cat=${p.seatCategory}, isPwD=${p.isPwD}, Band=${p.opportunityBand}, Median=${p.medianAIR}`);
  });

  // -------------------------------------------------------------
  // TEST 4: AIR 8,000 OPEN Delhi (DU Internal Quota Eligibility)
  // -------------------------------------------------------------
  console.log("\n4. Running Test 4: AIR 8,000 OPEN Delhi DU Internal Comparison...");
  const req4 = new NextRequest("http://localhost:3000/api/counselling/recommendations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      air: 8000,
      category: "OPEN",
      isPwD: false,
      domicileState: "Delhi",
      specialPathwayEligibility: { isInternalDU: true },
      limitPerBand: 50,
    }),
  });
  const res4 = await handleRecommendations(req4);
  const json4 = await res4.json();
  const recs4 = json4.recommendations;

  const mamcDu = recs4.find((r: any) => r.collegeName.includes("Maulana Azad") && r.quota === "Delhi University Quota");
  const ucmsDu = recs4.find((r: any) => r.collegeName.includes("University College of Medical") && r.quota === "Delhi University Quota");

  assert(Boolean(mamcDu && ucmsDu), "Test 4: DU internal pathways returned for MAMC and UCMS when explicitly eligible");
  console.log(`  * MAMC DU Quota: ${mamcDu.opportunityBand} (High: ${mamcDu.highestAIR}) | UCMS DU Quota: ${ucmsDu.opportunityBand} (High: ${ucmsDu.highestAIR}) ✅`);

  console.log("\n===============================================================");
  console.log(`COMPARISON LOGIC TESTS SUMMARY: ${passedTests} Passed, ${failedTests} Failed ✅`);
  console.log("===============================================================\n");
}

if (require.main === module) {
  testComparisonLogic()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Test failed:", err);
      process.exit(1);
    });
}
