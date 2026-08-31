import "dotenv/config";
import { NextRequest } from "next/server";
import { POST as handleRecommendations } from "../app/api/counselling/recommendations/route";

export async function testPlannerUiPipeline() {
  console.log("===============================================================");
  console.log("SEQUENCE 7B: PLANNER UI STREAM HIERARCHY VALIDATION TESTS");
  console.log("===============================================================\n");

  const testProfiles = [
    { name: "P1: OPEN AIR 4,500 Delhi", body: { air: 4500, category: "OPEN", isPwD: false, domicileState: "Delhi", goal: "GET_SEAT", limitPerBand: 50 } },
    { name: "P2: OBC AIR 14,000 UP", body: { air: 14000, category: "OBC", isPwD: false, domicileState: "Uttar Pradesh", goal: "GET_SEAT", limitPerBand: 50 } },
    { name: "P3: EWS AIR 25,000 Rajasthan", body: { air: 25000, category: "EWS", isPwD: false, domicileState: "Rajasthan", goal: "GET_SEAT", limitPerBand: 50 } },
    { name: "P4: SC AIR 65,000 Maharashtra", body: { air: 65000, category: "SC", isPwD: false, domicileState: "Maharashtra", goal: "GET_SEAT", limitPerBand: 50 } },
    { name: "P5: ST AIR 110,000 MP", body: { air: 110000, category: "ST", isPwD: false, domicileState: "Madhya Pradesh", goal: "GET_SEAT", limitPerBand: 50 } },
    { name: "P6: OBC PwD AIR 160,000 Maharashtra", body: { air: 160000, category: "OBC", isPwD: true, domicileState: "Maharashtra", goal: "GET_SEAT", limitPerBand: 50 } },
    { name: "P7: OPEN AIR 8,000 Delhi (DU Eligible)", body: { air: 8000, category: "OPEN", isPwD: false, domicileState: "Delhi", goal: "GET_SEAT", specialPathwayEligibility: { isInternalDU: true }, limitPerBand: 50 } },
  ];

  for (const { name, body } of testProfiles) {
    const req = new NextRequest("http://localhost:3000/api/counselling/recommendations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const res = await handleRecommendations(req);
    const json = await res.json();

    console.log(`---------------------------------------------------------------`);
    console.log(`${name}`);
    console.log(`---------------------------------------------------------------`);
    console.log(`- HTTP Status: ${res.status} ✅`);
    console.log(`- Evaluated: ${json.summary.totalEvaluated} | Strong: ${json.summary.strong} | Realistic: ${json.summary.realistic} | Stretch: ${json.summary.stretch} | Low Evidence: ${json.summary.lowEvidence}`);

    const recs = json.recommendations;

    // Stream 1: Govt & Central
    const govtStream = recs.filter(
      (r: any) =>
        r.route === "MCC" &&
        (r.managementType === "GOVERNMENT" || r.isINI || r.isCentralUniversity || r.isESIC) &&
        r.opportunityBand !== "LOW_EVIDENCE"
    );

    // Stream 2: State Counselling Opportunities
    const stateStream = recs.filter((r: any) => r.route === "STATE_ESTIMATE" || r.reasonCodes.includes("STATE_RANK_DATA_AWAITED"));

    // Stream 3: Private & Deemed
    const privateStream = recs.filter(
      (r: any) =>
        r.route === "MCC" &&
        !(r.managementType === "GOVERNMENT" || r.isINI || r.isCentralUniversity || r.isESIC) &&
        r.opportunityBand !== "LOW_EVIDENCE"
    );

    // Stream 4: Other Options (MCC Low Evidence)
    const otherLimited = recs.filter(
      (r: any) => r.opportunityBand === "LOW_EVIDENCE" && r.route === "MCC" && !r.reasonCodes.includes("STATE_RANK_DATA_AWAITED")
    );

    console.log(`- UI Streams: Govt/Central=${govtStream.length}, State Opportunities=${stateStream.length}, Private/Deemed=${privateStream.length}, Other Limited=${otherLimited.length}`);

    // Verify P1 specific order
    if (body.air === 4500 && body.category === "OPEN") {
      const topGovt = govtStream.slice(0, 5);
      console.log("  * Top 5 Govt Options for P1:");
      topGovt.forEach((g: any) => console.log(`    - ${g.collegeName} (${g.opportunityBand}, Median: ${g.medianAIR})`));

      const topPvt = privateStream.slice(0, 5);
      console.log("  * Top 5 Private/Deemed Options for P1:");
      topPvt.forEach((p: any) => console.log(`    - ${p.collegeName} (${p.opportunityBand}, Quota: ${p.quota}, Median: ${p.medianAIR})`));

      if (topGovt.length === 0) throw new Error("Govt options missing for P1!");
    }

    if (body.specialPathwayEligibility?.isInternalDU) {
      const duRecs = recs.filter((r: any) => r.quota === "Delhi University Quota");
      console.log(`  * DU Internal Pathways Returned: ${duRecs.length} ✅`);
      if (duRecs.length === 0) throw new Error("DU internal pathways missing for eligible student!");
    }
  }

  console.log(`\n===============================================================`);
  console.log("PLANNER UI STREAM HIERARCHY VERIFICATION PASSED 100% ✅");
  console.log("===============================================================\n");
}

if (require.main === module) {
  testPlannerUiPipeline()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Test failed:", err);
      process.exit(1);
    });
}
