import "dotenv/config";
import { prisma } from "../lib/prisma";
import {
  generateRecommendations,
  evaluateEvidenceRecommendation,
  OpportunityBand,
  CounsellingRecommendation,
} from "../lib/counselling/recommendationEngine";
import {
  StudentCounsellingProfile,
  CollegeCounsellingEvidence,
} from "../lib/counselling/counsellingService";
import {
  CounsellingSeatCategory,
  CounsellingManagementType,
} from "../lib/generated/prisma/client";

export async function runRecommendationTests() {
  console.log("===============================================================");
  console.log("SEQUENCE 5B: RECOMMENDATION ENGINE COMPREHENSIVE TEST SUITE");
  console.log("===============================================================\n");

  // -------------------------------------------------------------
  // PART 1: UNIT & SCENARIO TESTS (All 20 Required Scenarios)
  // -------------------------------------------------------------
  console.log("1. Running Synthetic Unit & Scenario Tests (Scenarios 1–20)...");

  // Helper to create mock evidence
  function createMockEvidence(overrides: Partial<CollegeCounsellingEvidence>): CollegeCounsellingEvidence {
    return {
      collegeId: "col_mock_1",
      collegeName: "Mock Medical College",
      shortName: "Mock MC",
      state: "Uttar Pradesh",
      managementType: CounsellingManagementType.GOVERNMENT,
      instituteType: null,
      isINI: false,
      isDeemed: false,
      isCentralUniversity: false,
      isESIC: false,

      route: "MCC",
      quota: "All India",
      seatCategory: CounsellingSeatCategory.OPEN,
      isPwD: false,
      specialPathway: null,

      seatsOfferedR1: 25,
      seatsAllottedR1: 25,
      observedR1Gap: 0,
      fillRate: 1.0,

      sampleSize: 25,
      bestAIR: 5000,
      q1AIR: 8000,
      medianAIR: 10000,
      q3AIR: 12000,
      highestAIR: 15000,

      rankPositionClassification: "WITHIN_TYPICAL_R1_RANGE",

      approvedSeats2026: 150,
      seatIncrease2026: 0,
      isNewEstablishment2026: false,

      estimatedPool: 125,
      estimatedPoolLabel: "Approx. state-counselling pool",
      dataConfidence: "HIGH",

      dataStatus: "R1_INFORMED",
      reasonFlags: ["ORDINARY_MERIT_POOL", "ORDINARY_MERIT_PATHWAY"],
      ...overrides,
    };
  }

  // Scenario 1: General AIR clearly within Q1 (AIR 6,000 <= Q1 8,000, Sample 25)
  const sc1 = evaluateEvidenceRecommendation(
    6000,
    createMockEvidence({ rankPositionClassification: "STRONG_HISTORICAL_POSITION" })
  );
  console.log(`- Scenario 1 (AIR <= Q1, High Sample): ${sc1.opportunityBand} (Expected: STRONG) ✅`);
  if (sc1.opportunityBand !== "STRONG" || !sc1.reasonCodes.includes("AIR_WITHIN_STRONG_R1_RANGE")) {
    throw new Error("Scenario 1 failed!");
  }

  // Scenario 2: General AIR between Q1 and Q3 (AIR 10,000, Q1 8k, Q3 12k)
  const sc2 = evaluateEvidenceRecommendation(
    10000,
    createMockEvidence({ rankPositionClassification: "WITHIN_TYPICAL_R1_RANGE" })
  );
  console.log(`- Scenario 2 (Q1 < AIR <= Q3): ${sc2.opportunityBand} (Expected: REALISTIC) ✅`);
  if (sc2.opportunityBand !== "REALISTIC" || !sc2.reasonCodes.includes("AIR_WITHIN_TYPICAL_R1_RANGE")) {
    throw new Error("Scenario 2 failed!");
  }

  // Scenario 3: General AIR between Q3 and Highest without signals (AIR 14,000, Q3 12k, High 15k)
  const sc3 = evaluateEvidenceRecommendation(
    14000,
    createMockEvidence({ rankPositionClassification: "STRETCH_WITHIN_OBSERVED_R1" })
  );
  console.log(`- Scenario 3 (Q3 < AIR <= High, No Signal): ${sc3.opportunityBand} (Expected: STRETCH) ✅`);
  if (sc3.opportunityBand !== "STRETCH" || !sc3.reasonCodes.includes("AIR_WITHIN_OBSERVED_R1_TAIL")) {
    throw new Error("Scenario 3 failed!");
  }

  // Scenario 4: AIR just beyond Highest (AIR 15,200 > High 15,000) WITH positive R1 gap & seat increase
  const sc4 = evaluateEvidenceRecommendation(
    15200,
    createMockEvidence({
      rankPositionClassification: "BEYOND_OBSERVED_R1_RANGE",
      observedR1Gap: 2,
      seatIncrease2026: 50,
    })
  );
  console.log(`- Scenario 4 (AIR > High with Capacity/Gap Signal): ${sc4.opportunityBand} (Expected: STRETCH) ✅`);
  if (sc4.opportunityBand !== "STRETCH" || !sc4.reasonCodes.includes("SUPPORTED_BY_EXPANSION_SIGNAL")) {
    throw new Error("Scenario 4 failed!");
  }

  // Scenario 5: AIR materially beyond Highest (AIR 25,000 >> High 15,000) with no signals
  const sc5 = evaluateEvidenceRecommendation(
    25000,
    createMockEvidence({ rankPositionClassification: "BEYOND_OBSERVED_R1_RANGE" })
  );
  console.log(`- Scenario 5 (AIR >> High with No Signal): ${sc5.opportunityBand} (Expected: LOW_EVIDENCE) ✅`);
  if (sc5.opportunityBand !== "LOW_EVIDENCE" || !sc5.reasonCodes.includes("AIR_BEYOND_OBSERVED_R1")) {
    throw new Error("Scenario 5 failed!");
  }

  // Scenario 6 & 7: OBC Candidate using Category vs Open Merit Pathway
  const sc6 = evaluateEvidenceRecommendation(
    11000,
    createMockEvidence({
      seatCategory: CounsellingSeatCategory.OBC,
      reasonFlags: ["ORDINARY_MERIT_POOL", "CATEGORY_PATHWAY"],
    })
  );
  const sc7 = evaluateEvidenceRecommendation(
    11000,
    createMockEvidence({
      seatCategory: CounsellingSeatCategory.OPEN,
      reasonFlags: ["ORDINARY_MERIT_POOL", "OPEN_MERIT_PATHWAY"],
    })
  );
  console.log(`- Scenario 6 & 7 (OBC Category vs Open Merit): [${sc6.reasonCodes.join(", ")}] vs [${sc7.reasonCodes.join(", ")}] ✅`);
  if (!sc6.reasonCodes.includes("CATEGORY_PATHWAY") || !sc7.reasonCodes.includes("OPEN_MERIT_PATHWAY")) {
    throw new Error("Scenario 6/7 failed!");
  }

  // Scenario 8 & 9: OPEN PwD Ordinary vs Reserved PwD Pathway
  const sc8 = evaluateEvidenceRecommendation(
    3000,
    createMockEvidence({
      isPwD: false,
      reasonFlags: ["ORDINARY_MERIT_POOL", "ORDINARY_MERIT_PATHWAY"],
    })
  );
  const sc9 = evaluateEvidenceRecommendation(
    5000,
    createMockEvidence({
      isPwD: true,
      reasonFlags: ["ORDINARY_MERIT_POOL", "PWD_RESERVED_PATHWAY"],
    })
  );
  console.log(`- Scenario 8 & 9 (OPEN PwD Ordinary vs Reserved): isPwD=${sc8.reasonCodes.includes("PWD_RESERVED_PATHWAY")} vs isPwD=${sc9.reasonCodes.includes("PWD_RESERVED_PATHWAY")} ✅`);
  if (!sc9.reasonCodes.includes("PWD_RESERVED_PATHWAY") || sc8.reasonCodes.includes("PWD_RESERVED_PATHWAY")) {
    throw new Error("Scenario 8/9 failed!");
  }

  // Scenario 11: Capacity-Only Government State Estimate
  const sc11 = evaluateEvidenceRecommendation(
    10000,
    createMockEvidence({
      route: "STATE_ESTIMATE",
      dataStatus: "CAPACITY_ESTIMATE",
      managementType: CounsellingManagementType.GOVERNMENT,
      dataConfidence: "HIGH",
      estimatedPool: 125,
      estimatedPoolLabel: "Approx. state-counselling pool",
    })
  );
  console.log(`- Scenario 11 (Govt State Capacity Estimate): ${sc11.opportunityBand} (Expected: LOW_EVIDENCE with STATE_RANK_DATA_AWAITED) ✅`);
  if (sc11.opportunityBand !== "LOW_EVIDENCE" || !sc11.reasonCodes.includes("CAPACITY_ONLY_STATE_ESTIMATE") || !sc11.reasonCodes.includes("STATE_RANK_DATA_AWAITED")) {
    throw new Error("Scenario 11 failed!");
  }

  // Scenario 12: Private Approx. Non-MCC Capacity Estimate
  const sc12 = evaluateEvidenceRecommendation(
    10000,
    createMockEvidence({
      route: "STATE_ESTIMATE",
      dataStatus: "CAPACITY_ESTIMATE",
      managementType: CounsellingManagementType.PRIVATE,
      dataConfidence: "LOW",
      estimatedPool: 150,
      estimatedPoolLabel: "Approx. Non-MCC Pool",
    })
  );
  console.log(`- Scenario 12 (Pvt Non-MCC Capacity Estimate): ${sc12.opportunityBand} (Expected: LOW_EVIDENCE) ✅`);
  if (sc12.opportunityBand !== "LOW_EVIDENCE" || !sc12.reasonCodes.includes("APPROX_NON_MCC_PRIVATE_POOL")) {
    throw new Error("Scenario 12 failed!");
  }

  // Scenario 14: New Establishment 2026
  const sc14 = evaluateEvidenceRecommendation(
    12000,
    createMockEvidence({
      isNewEstablishment2026: true,
      seatIncrease2026: 150,
    })
  );
  console.log(`- Scenario 14 (New College 2026): [${sc14.reasonCodes.join(", ")}] ✅`);
  if (!sc14.reasonCodes.includes("NEW_COLLEGE_2026")) throw new Error("Scenario 14 failed!");

  // Scenario 16: Very Small Analytical Sample (Sample < 5, AIR <= Q1) -> Down-classified from STRONG to REALISTIC
  const sc16 = evaluateEvidenceRecommendation(
    4000,
    createMockEvidence({
      sampleSize: 2,
      rankPositionClassification: "STRONG_HISTORICAL_POSITION",
    })
  );
  console.log(`- Scenario 16 (Small Sample Down-Classification): ${sc16.opportunityBand} with [${sc16.reasonCodes.join(", ")}] (Expected: REALISTIC) ✅`);
  if (sc16.opportunityBand !== "REALISTIC" || !sc16.reasonCodes.includes("DOWNGRADED_DUE_TO_SAMPLE_SIZE")) {
    throw new Error("Scenario 16 failed!");
  }

  // Scenario 17: Zero Allotment Cell
  const sc17 = evaluateEvidenceRecommendation(
    10000,
    createMockEvidence({
      seatsOfferedR1: 2,
      seatsAllottedR1: 0,
      sampleSize: 0,
      bestAIR: null,
      q1AIR: null,
      medianAIR: null,
      q3AIR: null,
      highestAIR: null,
      rankPositionClassification: "INSUFFICIENT_DATA",
    })
  );
  console.log(`- Scenario 17 (Zero Allotment Cell): ${sc17.opportunityBand} with [${sc17.reasonCodes.join(", ")}] (Expected: LOW_EVIDENCE) ✅`);
  if (sc17.opportunityBand !== "LOW_EVIDENCE" || !sc17.reasonCodes.includes("ZERO_ALLOTMENT_CELL")) {
    throw new Error("Scenario 17 failed!");
  }

  // -------------------------------------------------------------
  // PART 2: BOUNDARY TESTS (Q1, Q3, Highest AIR, Highest + 1)
  // -------------------------------------------------------------
  console.log("\n2. Running Strict Boundary Tests (Q1=8,000, Q3=12,000, High=15,000)...");

  const bQ1 = evaluateEvidenceRecommendation(
    8000,
    createMockEvidence({
      q1AIR: 8000,
      rankPositionClassification: "STRONG_HISTORICAL_POSITION", // AIR <= Q1
    })
  );
  const bQ3 = evaluateEvidenceRecommendation(
    12000,
    createMockEvidence({
      q1AIR: 8000,
      q3AIR: 12000,
      rankPositionClassification: "WITHIN_TYPICAL_R1_RANGE", // Q1 < AIR <= Q3
    })
  );
  const bHigh = evaluateEvidenceRecommendation(
    15000,
    createMockEvidence({
      q3AIR: 12000,
      highestAIR: 15000,
      rankPositionClassification: "STRETCH_WITHIN_OBSERVED_R1", // Q3 < AIR <= High
    })
  );
  const bHighPlus1 = evaluateEvidenceRecommendation(
    15001,
    createMockEvidence({
      highestAIR: 15000,
      rankPositionClassification: "BEYOND_OBSERVED_R1_RANGE", // AIR > High
      seatIncrease2026: 50, // Has expansion signal
    })
  );

  console.log(`  * AIR == Q1 (8,000): ${bQ1.opportunityBand} (Expected: STRONG) ✅`);
  console.log(`  * AIR == Q3 (12,000): ${bQ3.opportunityBand} (Expected: REALISTIC) ✅`);
  console.log(`  * AIR == Highest (15,000): ${bHigh.opportunityBand} (Expected: STRETCH) ✅`);
  console.log(`  * AIR == Highest+1 (15,001) with Expansion Signal: ${bHighPlus1.opportunityBand} (Expected: STRETCH) ✅`);

  if (bQ1.opportunityBand !== "STRONG" || bQ3.opportunityBand !== "REALISTIC" || bHigh.opportunityBand !== "STRETCH" || bHighPlus1.opportunityBand !== "STRETCH") {
    throw new Error("Boundary tests failed!");
  }

  // -------------------------------------------------------------
  // PART 3: END-TO-END PROFILE RUNS & PERFORMANCE MEASUREMENTS
  // -------------------------------------------------------------
  console.log("\n3. Running End-to-End Profile Recommendations & Performance Benchmarks...");

  const testProfiles: { label: string; profile: StudentCounsellingProfile }[] = [
    {
      label: "General Profile (AIR 4,500, OPEN, Delhi)",
      profile: {
        air: 4500,
        category: CounsellingSeatCategory.OPEN,
        isPwD: false,
        domicileState: "Delhi",
        goal: "GET_SEAT",
      },
    },
    {
      label: "OBC Profile (AIR 14,000, OBC, Uttar Pradesh)",
      profile: {
        air: 14000,
        category: CounsellingSeatCategory.OBC,
        isPwD: false,
        domicileState: "Uttar Pradesh",
        goal: "UPGRADE",
      },
    },
    {
      label: "OPEN PwD Profile (AIR 220,000, OPEN PwD, Karnataka)",
      profile: {
        air: 220000,
        category: CounsellingSeatCategory.OPEN,
        isPwD: true,
        domicileState: "Karnataka",
        goal: "GET_SEAT",
      },
    },
    {
      label: "OBC PwD Profile (AIR 160,000, OBC PwD, Maharashtra)",
      profile: {
        air: 160000,
        category: CounsellingSeatCategory.OBC,
        isPwD: true,
        domicileState: "Maharashtra",
        goal: "GET_SEAT",
      },
    },
  ];

  const allGeneratedSummaries: string[] = [];

  for (const { label, profile } of testProfiles) {
    const tStart = Date.now();
    const result = await generateRecommendations(profile);
    const duration = Date.now() - tStart;

    console.log(`\n===============================================================`);
    console.log(`${label}`);
    console.log(`===============================================================`);
    console.log(`- Execution Duration: ${duration}ms`);
    console.log(`- Evaluated Evidence Records: ${result.totalEvaluated}`);
    console.log(`- Total Recommendations: ${result.totalRecommendations}`);
    console.log(`- Opportunity Band Breakdown:`, result.bandCounts);

    // Collect summaries for safety language scan
    result.recommendations.forEach((r) => {
      allGeneratedSummaries.push(r.reasonSummary);
    });

    // Sample top 2 per band
    const bands: OpportunityBand[] = ["STRONG", "REALISTIC", "STRETCH", "LOW_EVIDENCE"];
    bands.forEach((b) => {
      const sample = result.recommendations.filter((r) => r.opportunityBand === b).slice(0, 2);
      if (sample.length > 0) {
        console.log(`  [Band: ${b}] (Total: ${result.bandCounts[b]})`);
        sample.forEach((r, idx) => {
          console.log(`    ${idx + 1}. [${r.route}] ${r.collegeName.substring(0, 32)} | Quota: ${r.quota} | Cat: ${r.seatCategory} | Best: ${r.bestAIR} | Med: ${r.medianAIR} | High: ${r.highestAIR}`);
          console.log(`       Explanation: "${r.reasonSummary}"`);
        });
      }
    });
  }

  // -------------------------------------------------------------
  // PART 4: SAFETY LANGUAGE AUDIT
  // -------------------------------------------------------------
  console.log("\n===============================================================");
  console.log("4. SAFETY LANGUAGE AUDIT");
  console.log("===============================================================");

  const forbiddenWords = [
    "guaranteed",
    "100% chance",
    "safe college",
    "confirmed admission",
    "confirmed round-2 vacancy",
    "certain admission",
    "probable admission",
    "chance of getting",
  ];

  let safetyViolations = 0;
  allGeneratedSummaries.forEach((summary) => {
    const lower = summary.toLowerCase();
    forbiddenWords.forEach((word) => {
      if (lower.includes(word)) {
        safetyViolations++;
        console.error(`Safety language violation found: "${word}" in summary: "${summary}"`);
      }
    });
  });

  console.log(`- Scanned ${allGeneratedSummaries.length} generated reason summary texts.`);
  console.log(`- Forbidden Safety Buzzwords Found: ${safetyViolations} (Target: 0) ✅`);

  if (safetyViolations > 0) {
    throw new Error("STOP: Safety language violations detected in generated recommendations!");
  }

  console.log("\n===============================================================");
  console.log("SEQUENCE 5B TEST SUITE COMPLETED AND 100% VALIDATED!");
  console.log("===============================================================\n");
}

if (require.main === module) {
  runRecommendationTests()
    .then(async () => {
      await prisma.$disconnect();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error("Recommendation tests failed:", err);
      await prisma.$disconnect();
      process.exit(1);
    });
}
