import "dotenv/config";
import { NextRequest } from "next/server";
import { POST as handleRecommendations } from "../app/api/counselling/recommendations/route";
import { generateRecommendations } from "../lib/counselling/recommendationEngine";
import { CounsellingSeatCategory } from "../lib/generated/prisma/client";

async function runReconciliation() {
  const profiles = [
    { id: "P1", name: "AIR 4,500 OPEN Delhi", body: { air: 4500, category: "OPEN", isPwD: false, domicileState: "Delhi", goal: "GET_SEAT" } },
    { id: "P2", name: "AIR 14,000 OBC UP", body: { air: 14000, category: "OBC", isPwD: false, domicileState: "Uttar Pradesh", goal: "GET_SEAT" } },
    { id: "P3", name: "AIR 25,000 EWS Rajasthan", body: { air: 25000, category: "EWS", isPwD: false, domicileState: "Rajasthan", goal: "GET_SEAT" } },
    { id: "P4", name: "AIR 65,000 SC Maharashtra", body: { air: 65000, category: "SC", isPwD: false, domicileState: "Maharashtra", goal: "GET_SEAT" } },
    { id: "P5", name: "AIR 110,000 ST MP", body: { air: 110000, category: "ST", isPwD: false, domicileState: "Madhya Pradesh", goal: "GET_SEAT" } },
    { id: "P6", name: "AIR 160,000 OBC PwD Maharashtra", body: { air: 160000, category: "OBC", isPwD: true, domicileState: "Maharashtra", goal: "GET_SEAT" } },
    { id: "P7", name: "AIR 8,000 OPEN Delhi + DU Internal", body: { air: 8000, category: "OPEN", isPwD: false, domicileState: "Delhi", goal: "GET_SEAT", specialPathwayEligibility: { isInternalDU: true } } },
  ];

  console.log("====================================================================================================");
  console.log("SEQUENCE 7A: RESULT-COUNT RECONCILIATION TABLE ACROSS ALL LAYERS");
  console.log("====================================================================================================\n");

  for (const p of profiles) {
    // 1. Direct Engine
    const directRes = await generateRecommendations({
      air: p.body.air,
      category: p.body.category as CounsellingSeatCategory,
      isPwD: p.body.isPwD,
      domicileState: p.body.domicileState,
      goal: p.body.goal as any,
      specialPathwayEligibility: p.body.specialPathwayEligibility,
    });

    // 2. API Call (Default limitPerBand = 25 or 50 as used in UI)
    const req = new NextRequest("http://localhost:3000/api/counselling/recommendations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...p.body, limitPerBand: 50 }),
    });
    const apiRes = await handleRecommendations(req);
    const apiJson = await apiRes.json();

    // 3. UI Section filtering (matching Round2Planner.tsx)
    const recs = apiJson.recommendations;
    const strong = recs.filter((r: any) => r.opportunityBand === "STRONG");
    const realistic = recs.filter((r: any) => r.opportunityBand === "REALISTIC");
    const stretch = recs.filter((r: any) => r.opportunityBand === "STRETCH");
    const stateOpp = recs.filter((r: any) => r.route === "STATE_ESTIMATE" || r.reasonCodes.includes("STATE_RANK_DATA_AWAITED"));
    const otherLimited = recs.filter((r: any) => r.opportunityBand === "LOW_EVIDENCE" && r.route === "MCC" && !r.reasonCodes.includes("STATE_RANK_DATA_AWAITED"));

    // Initial rendered counts in UI (before clicking "Show more", initially capped at 10)
    const renderedStrong = Math.min(strong.length, 10);
    const renderedRealistic = Math.min(realistic.length, 10);
    const renderedStretch = Math.min(stretch.length, 10);
    const renderedState = Math.min(stateOpp.length, 10);
    const renderedLimited = 0; // Collapsed by default

    console.log(`[${p.id}] ${p.name}`);
    console.log(`----------------------------------------------------------------------------------------------------`);
    console.log(`A. Direct Engine Full:      Total: ${directRes.totalEvaluated} | Strong: ${directRes.bandCounts.STRONG} | Realistic: ${directRes.bandCounts.REALISTIC} | Stretch: ${directRes.bandCounts.STRETCH} | LowEv: ${directRes.bandCounts.LOW_EVIDENCE}`);
    console.log(`B. API Summary Full:        Total: ${apiJson.summary.totalEvaluated} | Strong: ${apiJson.summary.strong} | Realistic: ${apiJson.summary.realistic} | Stretch: ${apiJson.summary.stretch} | LowEv: ${apiJson.summary.lowEvidence}`);
    console.log(`C. API Returned (Limit 50): Total: ${apiJson.recommendations.length} | Strong: ${strong.length} | Realistic: ${realistic.length} | Stretch: ${stretch.length} | LowEv: ${stateOpp.length + otherLimited.length}`);
    console.log(`D. UI Displayed Metric Top: Strong: ${apiJson.summary.strong} | Realistic: ${apiJson.summary.realistic} | Stretch: ${apiJson.summary.stretch} | State Identified: ${stateOpp.length}`);
    console.log(`E. UI Initial Render Cards: Strong: ${renderedStrong} | Realistic: ${renderedRealistic} | Stretch: ${renderedStretch} | State: ${renderedState} | Other: ${renderedLimited} (Collapsed)`);
    console.log(`----------------------------------------------------------------------------------------------------\n`);
  }
}

runReconciliation().then(() => process.exit(0));
