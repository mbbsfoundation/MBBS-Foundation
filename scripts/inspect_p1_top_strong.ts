import "dotenv/config";
import { generateRecommendations } from "../lib/counselling/recommendationEngine";
import { CounsellingSeatCategory } from "../lib/generated/prisma/client";

async function inspectP1TopStrong() {
  const p1 = await generateRecommendations({
    air: 4500,
    category: CounsellingSeatCategory.OPEN,
    isPwD: false,
    domicileState: "Delhi",
    goal: "GET_SEAT",
  });

  const strong = p1.recommendations.filter(r => r.opportunityBand === "STRONG");

  console.log("Top 10 Strong Recommendations for P1 (AIR 4,500 OPEN Delhi):");
  strong.slice(0, 10).forEach((r, i) => {
    console.log(`[#${i + 1}] ${r.collegeName} | State: ${r.state} | Mgmt: ${r.managementType} | Quota: ${r.quota} | Med AIR: ${r.medianAIR} | High AIR: ${r.highestAIR} | Best: ${r.bestAIR}`);
  });
}

inspectP1TopStrong().then(() => process.exit(0));
