import "dotenv/config";
import { generateRecommendations } from "../lib/counselling/recommendationEngine";
import { CounsellingSeatCategory } from "../lib/generated/prisma/client";

async function inspectP4Diff() {
  const p4 = await generateRecommendations({
    air: 65000,
    category: CounsellingSeatCategory.SC,
    isPwD: false,
    domicileState: "Maharashtra",
    goal: "GET_SEAT",
  });

  console.log("P4 Total Evaluated:", p4.totalEvaluated);
  console.log("P4 Band Counts:", p4.bandCounts);

  const strong = p4.recommendations.filter(r => r.opportunityBand === "STRONG");
  const realistic = p4.recommendations.filter(r => r.opportunityBand === "REALISTIC");
  const stretch = p4.recommendations.filter(r => r.opportunityBand === "STRETCH");
  const lowEv = p4.recommendations.filter(r => r.opportunityBand === "LOW_EVIDENCE");

  console.log(`Strong: ${strong.length}, Realistic: ${realistic.length}, Stretch: ${stretch.length}, LowEv: ${lowEv.length}`);

  // Count by route & quota
  console.log("Realistic breakdown by quota:");
  const quotaMap: Record<string, number> = {};
  realistic.forEach(r => {
    quotaMap[r.quota] = (quotaMap[r.quota] || 0) + 1;
  });
  console.log(quotaMap);

  const p5 = await generateRecommendations({
    air: 110000,
    category: CounsellingSeatCategory.ST,
    isPwD: false,
    domicileState: "Madhya Pradesh",
    goal: "GET_SEAT",
  });
  console.log("\nP5 Total Evaluated:", p5.totalEvaluated);
  console.log("P5 Band Counts:", p5.bandCounts);
}

inspectP4Diff().then(() => process.exit(0));
