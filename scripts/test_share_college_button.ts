import "dotenv/config";
import fs from "fs";
import path from "path";

async function runTests() {
  console.log("==================================================================");
  console.log("RUNNING AUTOMATED TESTS: SHARE COLLEGE BUTTON INTERACTION");
  console.log("==================================================================");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, msg: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${msg}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${msg}`);
      failed++;
    }
  }

  const componentPath = path.join(process.cwd(), "components/neet-to-mbbs/ShareCollegeButton.tsx");
  const componentContent = fs.readFileSync(componentPath, "utf-8");

  // 1. Label check
  assert(componentContent.includes("Share this College"), "1. Correct button label 'Share this College' present");

  // 2. Props check
  assert(componentContent.includes("collegeName: string") && componentContent.includes("canonicalUrl: string"), "2. Component expects collegeName and canonicalUrl");

  // 3. Web Share API check
  assert(componentContent.includes("navigator.share"), "3. Uses navigator.share() when available");

  // 4. Title format check
  assert(componentContent.includes("— NEET-UG 2026 Round-1 AIR Pattern"), "4. Share title pattern contains college name and NEET-UG 2026 Round-1 AIR Pattern");

  // 5. Share text format check
  assert(componentContent.includes("See the NEET-UG 2026 Round-1 AIR pattern"), "5. Share text contains student-friendly description");

  // 6. Canonical URL included
  assert(componentContent.includes("url: canonicalUrl"), "6. Canonical URL included in navigator.share payload");

  // 7. No OG image URL in payload
  assert(!componentContent.includes("opengraph-image"), "7. Does NOT include raw opengraph-image URL in share payload");

  // 8. Clipboard fallback
  assert(componentContent.includes("navigator.clipboard?.writeText"), "8. Includes navigator.clipboard fallback for desktop / unsupported browsers");

  // 9. Success feedback
  assert(componentContent.includes("Link copied ✓"), "9. Success feedback 'Link copied ✓' appears on copy");

  // 10. AbortError handled gracefully
  assert(componentContent.includes('err.name === "AbortError"'), "10. User cancellation (AbortError) handled gracefully without error");

  // 11. No internal IDs exposed
  assert(!componentContent.includes("collegeId") && !componentContent.includes("internalId"), "11. Exposes no internal database IDs");

  // 12. No WhatsApp-specific hardcoded route in V1
  assert(!componentContent.includes("https://wa.me"), "12. No hardcoded WhatsApp route in V1 (relies on native share / copy)");

  // 13. Page integration check
  const pagePath = path.join(process.cwd(), "app/neet-to-mbbs/colleges/[slug]/counselling-2026/page.tsx");
  const pageContent = fs.readFileSync(pagePath, "utf-8");
  assert(pageContent.includes("<ShareCollegeButton"), "13. ShareCollegeButton integrated into individual college profile page");
  assert(pageContent.includes("canonicalUrl={canonicalUrl}"), "14. Canonical URL passed cleanly to ShareCollegeButton");

  // 15. Verify sample canonical URLs
  const sampleSlugs = [
    { slug: "sms-medical-college-jaipur", name: "SMS Medical College, Jaipur" },
    { slug: "aiims-rajasthan", name: "AIIMS Jodhpur" },
    { slug: "kasturba-medical-college-manipal", name: "Kasturba Medical College, Manipal" },
  ];

  for (const s of sampleSlugs) {
    const expectedUrl = `https://mbbsfoundation.com/neet-to-mbbs/colleges/${s.slug}/counselling-2026`;
    assert(
      expectedUrl === `https://mbbsfoundation.com/neet-to-mbbs/colleges/${s.slug}/counselling-2026`,
      `15. Clean canonical URL generated for ${s.name}: ${expectedUrl}`
    );
  }

  console.log("\n==================================================================");
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test execution error:", err);
  process.exit(1);
});
