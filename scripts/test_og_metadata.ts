import fs from "fs";
import path from "path";
import { metadata } from "../app/neet-to-mbbs/counselling/round-2-planner/page";

function runTests() {
  console.log("==================================================================");
  console.log("TEST SUITE: NEET-UG 2026 Social Sharing / Open Graph Metadata");
  console.log("==================================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`  ✓ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${testName}`);
      if (detail) console.error(`    Detail: ${detail}`);
      failed++;
    }
  }

  // 1. Google Browser SEO Title Preserved
  assert(
    metadata.title === "NEET UG 2026 Counselling Planner | MCC Round-1 AIR & Medical College Explorer",
    "Google SEO Title is preserved exactly",
    String(metadata.title)
  );

  // 2. Canonical URL Preserved
  assert(
    metadata.alternates?.canonical === "https://mbbsfoundation.com/neet-to-mbbs/counselling/round-2-planner",
    "Canonical URL is preserved exactly",
    String(metadata.alternates?.canonical)
  );

  // 3. Open Graph Title
  assert(
    (metadata.openGraph as any)?.title === "NEET-UG 2026: Where Do YOU Stand?",
    "Open Graph title is 'NEET-UG 2026: Where Do YOU Stand?'",
    String((metadata.openGraph as any)?.title)
  );

  // 4. Open Graph Description
  assert(
    (metadata.openGraph as any)?.description ===
      "Enter your AIR and explore medical colleges, Round-1 AIR patterns, seats and category-wise evidence using MCC NEET-UG 2026 and NMC official-source data.",
    "Open Graph description matches required copy",
    String((metadata.openGraph as any)?.description)
  );

  // 5. Open Graph URL & Type
  assert(
    (metadata.openGraph as any)?.url === "https://mbbsfoundation.com/neet-to-mbbs/counselling/round-2-planner",
    "Open Graph URL is canonical clean share URL",
    String((metadata.openGraph as any)?.url)
  );
  assert(
    (metadata.openGraph as any)?.type === "website",
    "Open Graph type is 'website'",
    String((metadata.openGraph as any)?.type)
  );

  // 6. Open Graph Image
  const ogImages = (metadata.openGraph as any)?.images;
  assert(Array.isArray(ogImages) && ogImages.length > 0, "Open Graph images array is populated");
  const firstOgImg = ogImages?.[0];
  assert(
    firstOgImg?.url === "https://mbbsfoundation.com/images/og-neet-planner-2026-custom.png",
    "Open Graph image URL is 'https://mbbsfoundation.com/images/og-neet-planner-2026-custom.png'",
    String(firstOgImg?.url)
  );
  assert(firstOgImg?.width === 1200, "Open Graph image declared width is 1200");
  assert(firstOgImg?.height === 630, "Open Graph image declared height is 630");

  // 7. Twitter / X Card
  const twitter = metadata.twitter as any;
  assert(twitter?.card === "summary_large_image", "Twitter card is 'summary_large_image'");
  assert(twitter?.title === "NEET-UG 2026: Where Do YOU Stand?", "Twitter title matches Open Graph title");
  assert(
    twitter?.description ===
      "Enter your AIR and explore medical colleges, Round-1 AIR patterns, seats and category-wise evidence using MCC NEET-UG 2026 and NMC official-source data.",
    "Twitter description matches Open Graph description"
  );
  assert(
    twitter?.images?.[0] === "https://mbbsfoundation.com/images/og-neet-planner-2026-custom.png",
    "Twitter image matches Open Graph image URL"
  );

  // 8. Public Static Image File Verification
  const imgPath = path.join(process.cwd(), "public/images/og-neet-planner-2026-custom.png");
  assert(fs.existsSync(imgPath), "Public static image file exists in public/images/og-neet-planner-2026-custom.png");
  const stats = fs.statSync(imgPath);
  assert(stats.size > 10000, `Image file size is substantial (${stats.size} bytes)`);

  console.log("\n==================================================================");
  console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log("==================================================================");

  if (failed > 0) process.exit(1);
}

runTests();
