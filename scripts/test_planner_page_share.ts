import * as fs from "fs";
import * as path from "path";

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`  ❌ FAIL: ${msg}`);
    process.exit(1);
  }
  console.log(`  ✅ PASS: ${msg}`);
}

async function runTests() {
  console.log("\n==================================================================");
  console.log("RUNNING AUTOMATED TESTS: PLANNER PAGE SHARE BUTTON & OG IMAGE");
  console.log("==================================================================");

  const pagePath = path.join(process.cwd(), "app/neet-to-mbbs/counselling/round-2-planner/page.tsx");
  const plannerPath = path.join(process.cwd(), "components/neet-to-mbbs/Round2Planner.tsx");
  const shareBtnPath = path.join(process.cwd(), "components/neet-to-mbbs/SharePageButton.tsx");
  const staticImgPath = path.join(process.cwd(), "public/images/og-neet-planner-2026-custom.png");

  // [TEST 1]: File existence
  assert(fs.existsSync(pagePath), "1. round-2-planner page.tsx exists");
  assert(fs.existsSync(plannerPath), "2. Round2Planner.tsx exists");
  assert(fs.existsSync(shareBtnPath), "3. SharePageButton.tsx exists");
  assert(fs.existsSync(staticImgPath), "4. Static OG image file exists in public/images/og-neet-planner-2026-custom.png");

  const pageContent = fs.readFileSync(pagePath, "utf-8");
  const plannerContent = fs.readFileSync(plannerPath, "utf-8");
  const shareBtnContent = fs.readFileSync(shareBtnPath, "utf-8");

  // [TEST 2]: Metadata Configuration
  assert(pageContent.includes("https://mbbsfoundation.com/images/og-neet-planner-2026-custom.png"), "5. Page metadata og:image points to og-neet-planner-2026-custom.png");
  assert(pageContent.includes("summary_large_image"), "6. Twitter card is summary_large_image");
  assert(pageContent.includes("https://mbbsfoundation.com/neet-to-mbbs/counselling/round-2-planner"), "7. Canonical URL is round-2-planner");

  // [TEST 3]: Share Button Integration
  assert(plannerContent.includes("<SharePageButton"), "8. SharePageButton is rendered in Round2Planner component");
  assert(shareBtnContent.includes("Share Page"), "9. Button label is 'Share Page'");
  assert(shareBtnContent.includes("Link copied ✓"), "10. Clipboard feedback 'Link copied ✓' is supported");
  assert(shareBtnContent.includes("navigator.share"), "11. Web Share API is used when available");

  console.log("\n==================================================================");
  console.log("TEST SUMMARY: ALL 11 TESTS PASSED SUCCESSFULLY");
  console.log("==================================================================");
}

runTests();
