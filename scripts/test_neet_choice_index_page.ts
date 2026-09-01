import * as fs from "fs";
import * as path from "path";
import { getChoiceIndexDataset, getChoiceIndexTop25, getHeadlineContrasts } from "../lib/counselling/choiceIndexData";

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`  ❌ FAIL: ${msg}`);
    process.exit(1);
  }
  console.log(`  ✅ PASS: ${msg}`);
}

async function runTests() {
  console.log("\n==================================================================");
  console.log("RUNNING AUTOMATED TESTS: SEQUENCE 9J.2 — NEET CHOICE INDEX 2026 PAGE");
  console.log("==================================================================");

  // [TEST GROUP 1]: Data Loader Validation
  console.log("\n[TEST GROUP 1] Choice Index Data Loader");
  const dataset = getChoiceIndexDataset();
  assert(dataset.length === 515, `1. Dataset has 515 ranked colleges (found: ${dataset.length})`);

  const top25 = getChoiceIndexTop25();
  assert(top25.length === 25, `2. Top 25 loader returns exactly 25 items (found: ${top25.length})`);

  const contrasts = getHeadlineContrasts();
  assert(contrasts.length === 6, `3. Headline contrasts returns exactly 6 items (found: ${contrasts.length})`);

  // [TEST GROUP 2]: Specific College Data Verification
  console.log("\n[TEST GROUP 2] Specific College Values Verification");
  const mamc = dataset.find((c) => c.slug === "maulana-azad-medical-college-new-delhi")!;
  assert(mamc.choiceIndexRank === 2, `4. MAMC Choice Index rank is #2 (found: #${mamc.choiceIndexRank})`);
  assert(mamc.nirf2025Rank === 26, `5. MAMC NIRF 2025 rank is #26 (found: #${mamc.nirf2025Rank})`);
  assert(mamc.medianAIR === 90, `6. MAMC Median AIR is 90 (found: ${mamc.medianAIR})`);

  const vmmc = dataset.find((c) => c.slug === "vardhman-mahavir-medical-college-and-safdarjung-hospital-delhi")!;
  assert(vmmc.choiceIndexRank === 3, `7. VMMC Choice Index rank is #3 (found: #${vmmc.choiceIndexRank})`);
  assert(vmmc.nirf2025Rank === 22, `8. VMMC NIRF 2025 rank is #22 (found: #${vmmc.nirf2025Rank})`);
  assert(vmmc.medianAIR === 99.5, `9. VMMC Median AIR is 99.5 (found: ${vmmc.medianAIR})`);

  const ucms = dataset.find((c) => c.slug === "university-college-of-medical-sciences-and-gtb-hospital-new-delhi")!;
  assert(ucms.choiceIndexRank === 6, `10. UCMS Choice Index rank is #6 (found: #${ucms.choiceIndexRank})`);
  assert(ucms.nirf2025Rank === 38, `11. UCMS NIRF 2025 rank is #38 (found: #${ucms.nirf2025Rank})`);
  assert(ucms.medianAIR === 247, `12. UCMS Median AIR is 247 (found: ${ucms.medianAIR})`);

  const sms = dataset.find((c) => c.slug === "sms-medical-college-jaipur")!;
  assert(sms.choiceIndexRank === 19, `13. SMS Jaipur Choice Index rank is #19 (found: #${sms.choiceIndexRank})`);
  assert(sms.nirf2025Rank === 39, `14. SMS Jaipur NIRF 2025 rank is #39 (found: #${sms.nirf2025Rank})`);
  assert(sms.medianAIR === 938, `15. SMS Jaipur Median AIR is 938 (found: ${sms.medianAIR})`);

  const bhu = dataset.find((c) => c.slug === "institute-of-medical-sciences-bhu-varansi")!;
  assert(bhu.choiceIndexRank === 17, `16. IMS BHU Choice Index rank is #17 (found: #${bhu.choiceIndexRank})`);
  assert(bhu.nirf2025Rank === 6, `17. IMS BHU NIRF 2025 rank is #6 (found: #${bhu.nirf2025Rank})`);
  assert(bhu.medianAIR === 845, `18. IMS BHU Median AIR is 845 (found: ${bhu.medianAIR})`);

  const kgmu = dataset.find((c) => c.slug === "king-george-medical-university-lucknow")!;
  assert(kgmu.choiceIndexRank === 24, `19. KGMU Choice Index rank is #24 (found: #${kgmu.choiceIndexRank})`);
  assert(kgmu.nirf2025Rank === 8, `20. KGMU NIRF 2025 rank is #8 (found: #${kgmu.nirf2025Rank})`);
  assert(kgmu.medianAIR === 1194.5, `21. KGMU Median AIR is 1194.5 (found: ${kgmu.medianAIR})`);

  // [TEST GROUP 3]: Page File and Metadata Verification
  console.log("\n[TEST GROUP 3] Page Component & Metadata Structure");
  const pagePath = path.join(process.cwd(), "app/neet-to-mbbs/counselling/neet-choice-index-2026/page.tsx");
  assert(fs.existsSync(pagePath), "22. Page file exists at app/neet-to-mbbs/counselling/neet-choice-index-2026/page.tsx");

  const pageContent = fs.readFileSync(pagePath, "utf-8");
  assert(pageContent.includes("https://mbbsfoundation.com/neet-to-mbbs/counselling/neet-choice-index-2026"), "23. Canonical URL is set correctly in metadata");
  assert(pageContent.includes("https://mbbsfoundation.com/images/og-neet-planner-2026-custom.png?v=2"), "24. OG Image strictly points to stable static custom PNG with ?v=2");
  assert(pageContent.includes("summary_large_image"), "25. Twitter card is summary_large_image");
  assert(pageContent.includes("NEET Choice Index 2026 vs NIRF: Do Students and Rankings Agree?"), "26. OG Title is correctly configured");
  assert(pageContent.includes("Not in Top 50"), "27. Unranked NIRF colleges labeled with 'Not in Top 50' context");

  // Language check: Avoid forbidden words
  assert(!pageContent.toLowerCase().includes("overrated"), "28. No 'overrated' in page content");
  assert(!pageContent.toLowerCase().includes("underrated"), "29. No 'underrated' in page content");
  assert(!pageContent.includes("students preferred"), "30. No 'students preferred' in page content");
  assert(!pageContent.includes("students rejected"), "31. No 'students rejected' in page content");

  // [TEST GROUP 4]: Share Button Component
  console.log("\n[TEST GROUP 4] Share Button Implementation");
  const shareBtnPath = path.join(process.cwd(), "components/neet-to-mbbs/ShareChoiceIndexButton.tsx");
  assert(fs.existsSync(shareBtnPath), "32. ShareChoiceIndexButton.tsx exists");
  const shareBtnContent = fs.readFileSync(shareBtnPath, "utf-8");
  assert(shareBtnContent.includes("Share This Analysis"), "33. Button label is 'Share This Analysis'");
  assert(shareBtnContent.includes("Link copied ✓"), "34. Clipboard fallback feedback 'Link copied ✓' is supported");
  assert(shareBtnContent.includes("navigator.share"), "35. Web Share API is used when available");

  // [TEST GROUP 5]: Discovery Links & Sitemap
  console.log("\n[TEST GROUP 5] Discovery Links and Sitemap Integration");
  const plannerPath = path.join(process.cwd(), "components/neet-to-mbbs/Round2Planner.tsx");
  const plannerContent = fs.readFileSync(plannerPath, "utf-8");
  assert(plannerContent.includes("/neet-to-mbbs/counselling/neet-choice-index-2026"), "36. Round2Planner contains discovery link to NEET Choice Index");

  const explorerPath = path.join(process.cwd(), "components/neet-to-mbbs/MedicalCollegeExplorer.tsx");
  const explorerContent = fs.readFileSync(explorerPath, "utf-8");
  assert(explorerContent.includes("/neet-to-mbbs/counselling/neet-choice-index-2026"), "37. MedicalCollegeExplorer contains discovery link to NEET Choice Index");

  const sitemapPath = path.join(process.cwd(), "app/sitemap.ts");
  const sitemapContent = fs.readFileSync(sitemapPath, "utf-8");
  assert(sitemapContent.includes("/neet-to-mbbs/counselling/neet-choice-index-2026"), "38. Sitemap includes the new public route");

  console.log("\n==================================================================");
  console.log("TEST SUMMARY: ALL 38 TESTS PASSED SUCCESSFULLY");
  console.log("==================================================================");
}

runTests();
