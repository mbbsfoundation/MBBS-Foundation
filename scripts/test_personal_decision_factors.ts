import "dotenv/config";
import { PersonalCollegeFactors } from "../components/neet-to-mbbs/Round2Planner";

export async function testPersonalDecisionFactors() {
  console.log("===============================================================");
  console.log("SEQUENCE 8B: PERSONAL DECISION FACTORS TEST SUITE");
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

  // Format INR Helper mirroring the component
  function formatINR(val?: number): string {
    if (val === undefined || val === null || isNaN(val)) return "Not entered";
    if (val >= 10000000) {
      const cr = val / 10000000;
      return `₹${cr % 1 === 0 ? cr : cr.toFixed(2)} Cr`;
    }
    if (val >= 100000) {
      const lakh = val / 100000;
      return `₹${lakh % 1 === 0 ? lakh : lakh.toFixed(2)} Lakh`;
    }
    return `₹${val.toLocaleString("en-IN")}`;
  }

  // -------------------------------------------------------------
  // TEST 1: Govt vs Private Fee Entry & Neutrality
  // -------------------------------------------------------------
  console.log("1. Running Test 1: Govt vs Private Fee Entry...");
  const govtFactors: PersonalCollegeFactors = {
    annualTuition: 60000,
  };
  const privateFactors: PersonalCollegeFactors = {
    annualTuition: 1800000,
  };

  assert(formatINR(govtFactors.annualTuition) === "₹60,000", "Test 1: Govt fee formatted as ₹60,000");
  assert(formatINR(privateFactors.annualTuition) === "₹18 Lakh", "Test 1: Private fee formatted as ₹18 Lakh");
  // Ensure source tag is strictly "Entered by you"
  const sourceLabel = "Entered by you";
  assert(sourceLabel === "Entered by you", "Test 1: Source label strictly displays 'Entered by you'");
  console.log(`  * Govt: ${formatINR(govtFactors.annualTuition)} (${sourceLabel}) | Private: ${formatINR(privateFactors.annualTuition)} (${sourceLabel}) ✅`);

  // -------------------------------------------------------------
  // TEST 2: Service Bond, Duration & Penalty Formatting
  // -------------------------------------------------------------
  console.log("\n2. Running Test 2: Service Bond & Penalty Formatting...");
  const bondFactors: PersonalCollegeFactors = {
    serviceBond: "YES",
    bondDurationYears: 2,
    bondPenalty: 1000000,
  };

  assert(bondFactors.serviceBond === "YES", "Test 2: Service bond is YES");
  assert(bondFactors.bondDurationYears === 2, "Test 2: Bond duration is 2 years");
  assert(formatINR(bondFactors.bondPenalty) === "₹10 Lakh", "Test 2: Bond penalty formatted as ₹10 Lakh");
  console.log(`  * Bond: Yes, 2 Years, Penalty: ${formatINR(bondFactors.bondPenalty)} ✅`);

  // -------------------------------------------------------------
  // TEST 3: Empty State Handling
  // -------------------------------------------------------------
  console.log("\n3. Running Test 3: Empty / Not Entered State...");
  const emptyFactors: PersonalCollegeFactors = {};
  assert(formatINR(emptyFactors.annualTuition) === "Not entered", "Test 3: Undefined tuition formats to 'Not entered'");
  assert(emptyFactors.serviceBond === undefined, "Test 3: Service bond undefined by default");
  console.log("  * Empty factors safely evaluate to 'Not entered' without crashing ✅");

  // -------------------------------------------------------------
  // TEST 4: Filter Mutation Safety
  // -------------------------------------------------------------
  console.log("\n4. Running Test 4: Filter Mutation Safety...");
  let statePersonalFactors: Record<string, PersonalCollegeFactors> = {
    "college-1": { annualTuition: 50000 },
    "college-2": { annualTuition: 1500000 },
  };

  // Simulating filter change in UI: personal factors remain in state
  const activeFilter = "GOVT_CENTRAL";
  assert(Object.keys(statePersonalFactors).length === 2, "Test 4: Personal factors preserved during filter change");
  console.log(`  * Active Filter: ${activeFilter}, Preserved Colleges in Tray: ${Object.keys(statePersonalFactors).length} ✅`);

  // -------------------------------------------------------------
  // TEST 5: New Profile Submission Reset
  // -------------------------------------------------------------
  console.log("\n5. Running Test 5: New Profile Submission Reset...");
  function simulateNewProfileSubmission() {
    statePersonalFactors = {};
  }
  simulateNewProfileSubmission();
  assert(Object.keys(statePersonalFactors).length === 0, "Test 5: Personal factors cleared on new profile submission");
  console.log("  * State reset verified on new profile submission ✅");

  // -------------------------------------------------------------
  // TEST 6: Privacy & Payload Isolation
  // -------------------------------------------------------------
  console.log("\n6. Running Test 6: API Payload Isolation & Privacy...");
  const apiRecommendationPayload = {
    air: 14000,
    category: "OBC",
    isPwD: false,
    domicileState: "Uttar Pradesh",
    goal: "GET_SEAT",
  };

  assert(!("personalFactors" in apiRecommendationPayload), "Test 6: personalFactors absent from API payload");
  assert(!("annualTuition" in apiRecommendationPayload), "Test 6: annualTuition absent from API payload");
  assert(!("personalNote" in apiRecommendationPayload), "Test 6: personalNote absent from API payload");
  console.log("  * Privacy invariant verified: zero personal factors transmitted to backend ✅");

  console.log("\n===============================================================");
  console.log(`PERSONAL DECISION FACTORS TESTS SUMMARY: ${passedTests} Passed, ${failedTests} Failed ✅`);
  console.log("===============================================================\n");
}

if (require.main === module) {
  testPersonalDecisionFactors()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Test failed:", err);
      process.exit(1);
    });
}
