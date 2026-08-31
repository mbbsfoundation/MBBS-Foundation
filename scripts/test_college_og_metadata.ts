import "dotenv/config";
import fs from "fs";
import path from "path";
import { prisma } from "../lib/prisma";
import { generateMetadata } from "../app/neet-to-mbbs/colleges/[slug]/counselling-2026/page";

const EXPECTED_STATIC_OG_IMAGE = "https://mbbsfoundation.com/images/og-neet-planner-2026-custom.png?v=2";

async function runTests() {
  console.log("==================================================================");
  console.log("RUNNING AUTOMATED TESTS: INDIVIDUAL COLLEGE SOCIAL METADATA (STATIC OG)");
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

  // -------------------------------------------------------------
  // TEST 1: SMS Medical College Jaipur
  // -------------------------------------------------------------
  console.log("\n[TEST 1] SMS Medical College Jaipur (sms-medical-college-jaipur)");
  const smsSlug = "sms-medical-college-jaipur";
  const smsMeta = await generateMetadata({ params: Promise.resolve({ slug: smsSlug }) });
  const smsOg = smsMeta.openGraph as any;
  const smsTwitter = smsMeta.twitter as any;

  assert(
    smsMeta.title === "SMS Medical College, Jaipur NEET 2026 | Round-1 AIR Pattern & MBBS Seats",
    "1. SMS Jaipur Google SEO Title is college-specific"
  );
  assert(
    smsMeta.alternates?.canonical ===
      "https://mbbsfoundation.com/neet-to-mbbs/colleges/sms-medical-college-jaipur/counselling-2026",
    "2. SMS Jaipur Canonical URL is college-specific"
  );
  assert(
    smsOg?.title === "SMS Medical College, Jaipur — NEET-UG 2026 Round-1 AIR Pattern",
    "3. SMS Jaipur OG Title is college-specific"
  );
  assert(
    smsOg?.description?.includes("Typical (Median) AIR") &&
      smsOg?.description?.includes("SMS Medical College, Jaipur"),
    "4. SMS Jaipur OG Description is college-specific and mentions college"
  );
  assert(
    smsOg?.images?.[0]?.url === EXPECTED_STATIC_OG_IMAGE,
    `5. SMS Jaipur OG Image points to common static image: ${EXPECTED_STATIC_OG_IMAGE}`
  );
  assert(
    smsOg?.images?.[0]?.width === 1200 && smsOg?.images?.[0]?.height === 630,
    "6. SMS Jaipur OG Image dimensions are 1200x630"
  );
  assert(
    smsTwitter?.card === "summary_large_image",
    "7. SMS Jaipur Twitter card is summary_large_image"
  );
  assert(
    smsTwitter?.images?.[0] === EXPECTED_STATIC_OG_IMAGE,
    "8. SMS Jaipur Twitter image matches static OG image"
  );

  // -------------------------------------------------------------
  // TEST 2: AIIMS Jodhpur (INI College)
  // -------------------------------------------------------------
  console.log("\n[TEST 2] AIIMS Jodhpur (aiims-rajasthan)");
  const aiimsSlug = "aiims-rajasthan";
  const aiimsMeta = await generateMetadata({ params: Promise.resolve({ slug: aiimsSlug }) });
  const aiimsOg = aiimsMeta.openGraph as any;

  assert(
    aiimsOg?.title?.includes("AIIMS"),
    "9. AIIMS Jodhpur OG Title is college-specific"
  );
  assert(
    aiimsOg?.description?.includes("AIIMS"),
    "10. AIIMS Jodhpur OG Description is college-specific"
  );
  assert(
    aiimsMeta.alternates?.canonical ===
      "https://mbbsfoundation.com/neet-to-mbbs/colleges/aiims-rajasthan/counselling-2026",
    "11. AIIMS Jodhpur Canonical is college-specific"
  );
  assert(
    aiimsOg?.images?.[0]?.url === EXPECTED_STATIC_OG_IMAGE,
    "12. AIIMS Jodhpur OG Image points to the same common static image"
  );

  // -------------------------------------------------------------
  // TEST 3: Kasturba Medical College Manipal (Deemed College)
  // -------------------------------------------------------------
  console.log("\n[TEST 3] Kasturba Medical College Manipal (kasturba-medical-college-manipal)");
  const kmcSlug = "kasturba-medical-college-manipal";
  const kmcMeta = await generateMetadata({ params: Promise.resolve({ slug: kmcSlug }) });
  const kmcOg = kmcMeta.openGraph as any;

  assert(
    kmcOg?.title?.includes("Kasturba Medical College"),
    "13. KMC Manipal OG Title is college-specific"
  );
  assert(
    kmcOg?.description?.includes("Kasturba Medical College"),
    "14. KMC Manipal OG Description is college-specific"
  );
  assert(
    kmcMeta.alternates?.canonical ===
      "https://mbbsfoundation.com/neet-to-mbbs/colleges/kasturba-medical-college-manipal/counselling-2026",
    "15. KMC Manipal Canonical is college-specific"
  );
  assert(
    kmcOg?.images?.[0]?.url === EXPECTED_STATIC_OG_IMAGE,
    "16. KMC Manipal OG Image points to the same common static image"
  );

  // -------------------------------------------------------------
  // TEST 4: Differentiation & Commonality Invariants
  // -------------------------------------------------------------
  console.log("\n[TEST 4] Verification of College Differentiation & Common Static Image");
  assert(smsOg?.title !== aiimsOg?.title, "17. Titles differ across colleges");
  assert(smsOg?.title !== kmcOg?.title, "18. Titles differ across colleges");
  assert(smsMeta.alternates?.canonical !== aiimsMeta.alternates?.canonical, "19. Canonicals differ across colleges");
  assert(smsOg?.images?.[0]?.url === aiimsOg?.images?.[0]?.url, "20. OG Image is identically common across colleges");
  assert(smsOg?.images?.[0]?.url === kmcOg?.images?.[0]?.url, "21. OG Image is identically common across colleges");

  // -------------------------------------------------------------
  // TEST 5: No Dynamic OG Image Endpoint References in Metadata
  // -------------------------------------------------------------
  console.log("\n[TEST 5] Absence of Dynamic /opengraph-image references");
  assert(
    !smsOg?.images?.[0]?.url.includes("/opengraph-image"),
    "22. SMS Jaipur metadata does NOT point to /opengraph-image"
  );
  assert(
    !aiimsOg?.images?.[0]?.url.includes("/opengraph-image"),
    "23. AIIMS Jodhpur metadata does NOT point to /opengraph-image"
  );
  assert(
    !kmcOg?.images?.[0]?.url.includes("/opengraph-image"),
    "24. KMC Manipal metadata does NOT point to /opengraph-image"
  );
  assert(
    !smsOg?.images?.[0]?.url.includes("?v=v3") && !smsOg?.images?.[0]?.url.includes("?v=v2"),
    "25. Metadata does NOT use dynamic version parameters like ?v=v3"
  );

  // -------------------------------------------------------------
  // TEST 6: Static File Physical Verification
  // -------------------------------------------------------------
  console.log("\n[TEST 6] Static Image File Check");
  const staticFilePath = path.join(process.cwd(), "public/images/og-neet-planner-2026-custom.png");
  assert(fs.existsSync(staticFilePath), "26. Static image file exists in public/images/");
  const stats = fs.statSync(staticFilePath);
  assert(stats.size > 100000, `27. Static image size is healthy (${stats.size} bytes)`);

  console.log("\n==================================================================");
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests()
  .catch((err) => {
    console.error("Test execution error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
