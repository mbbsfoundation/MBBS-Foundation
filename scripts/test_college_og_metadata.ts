import "dotenv/config";
import fs from "fs";
import path from "path";
import { prisma } from "../lib/prisma";
import Image, { size } from "../app/neet-to-mbbs/colleges/[slug]/counselling-2026/opengraph-image";
import { generateMetadata } from "../app/neet-to-mbbs/colleges/[slug]/counselling-2026/page";
import { generateCollegeSocialCardSvg } from "../lib/counselling/collegeSocialCardSvg";
import { getCollegeEvidenceBySlug } from "../lib/counselling/evidenceService";
import { getPrimaryOpenBenchmark } from "../lib/counselling/pathwayOrdering";

async function runTests() {
  console.log("==================================================================");
  console.log("RUNNING AUTOMATED TESTS: COLLEGE DYNAMIC OPEN GRAPH GENERATOR (V3)");
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

  // Ensure tmp directory exists
  const tmpDir = path.join(process.cwd(), "tmp");
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
  }

  // -------------------------------------------------------------
  // TEST 0: Self-Contained Font Embedding Check
  // -------------------------------------------------------------
  console.log("\n[TEST 0] Self-Contained Font Embedding Verification");
  const testCollege = await getCollegeEvidenceBySlug("sms-medical-college-jaipur");
  const testBench = testCollege ? getPrimaryOpenBenchmark(testCollege.allCategoryProfiles) : null;
  const rawSvg = generateCollegeSocialCardSvg(testCollege, testBench);

  assert(rawSvg.includes("@font-face"), "SVG includes @font-face definition");
  assert(rawSvg.includes("CardInter"), "SVG defines CardInter font family");
  assert(rawSvg.includes("CardCinzel"), "SVG defines CardCinzel font family");
  assert(rawSvg.includes("data:font/woff;charset=utf-8;base64,"), "SVG embeds base64 font data URI");
  assert(!rawSvg.includes("fonts.googleapis.com"), "SVG has NO remote Google Fonts HTTP dependency");

  // -------------------------------------------------------------
  // TEST 1: SMS Medical College Jaipur
  // -------------------------------------------------------------
  console.log("\n[TEST 1] SMS Medical College Jaipur (sms-medical-college-jaipur)");
  const smsSlug = "sms-medical-college-jaipur";
  const smsOgResponse = await Image({ params: Promise.resolve({ slug: smsSlug }) });

  assert(smsOgResponse instanceof Response, "Returns a valid Response instance");
  assert(smsOgResponse.status === 200, "Response HTTP status is 200");
  assert(
    smsOgResponse.headers.get("content-type")?.includes("image/png") === true,
    "Content-Type is image/png"
  );

  const smsBuffer = Buffer.from(await smsOgResponse.arrayBuffer());
  assert(smsBuffer.length > 5000, `Generated PNG size is healthy (${smsBuffer.length} bytes)`);

  const smsPreviewPath = path.join(tmpDir, "college-og-v3-sms-jaipur.png");
  fs.writeFileSync(smsPreviewPath, smsBuffer);
  console.log(`  📁 Saved SMS Jaipur visual preview to: ${smsPreviewPath}`);

  // Test generateMetadata for SMS Jaipur
  const smsMeta = await generateMetadata({ params: Promise.resolve({ slug: smsSlug }) });
  assert(
    smsMeta.title === "SMS Medical College, Jaipur NEET 2026 | Round-1 AIR Pattern & MBBS Seats",
    "SEO Title preserved"
  );
  assert(
    smsMeta.alternates?.canonical ===
      "https://mbbsfoundation.com/neet-to-mbbs/colleges/sms-medical-college-jaipur/counselling-2026",
    "Canonical URL preserved"
  );
  const smsOg = smsMeta.openGraph as any;
  assert(
    smsOg?.title === "SMS Medical College, Jaipur — NEET-UG 2026 Round-1 AIR Pattern",
    "OG Title matches pattern"
  );
  assert(
    smsOg?.description?.includes("Typical (Median) AIR") &&
      smsOg?.description?.includes("Best AIR") &&
      smsOg?.description?.includes("Last Observed AIR"),
    "OG Description includes locked terms"
  );
  assert(
    smsOg?.images?.[0]?.url ===
      "https://mbbsfoundation.com/neet-to-mbbs/colleges/sms-medical-college-jaipur/counselling-2026/opengraph-image?v=v3",
    "OG Image points to versioned dynamic endpoint (v3)"
  );
  assert(
    smsOg?.images?.[0]?.width === 1200 && smsOg?.images?.[0]?.height === 630,
    "OG Image dimensions are 1200x630"
  );
  const smsTwitter = smsMeta.twitter as any;
  assert(smsTwitter?.card === "summary_large_image", "Twitter card is summary_large_image");
  assert(
    smsTwitter?.images?.[0] ===
      "https://mbbsfoundation.com/neet-to-mbbs/colleges/sms-medical-college-jaipur/counselling-2026/opengraph-image?v=v3",
    "Twitter image matches OG image (v3)"
  );

  // -------------------------------------------------------------
  // TEST 2: AIIMS Jodhpur (INI College)
  // -------------------------------------------------------------
  console.log("\n[TEST 2] AIIMS Jodhpur (aiims-rajasthan)");
  const aiimsSlug = "aiims-rajasthan";
  const aiimsOgResponse = await Image({ params: Promise.resolve({ slug: aiimsSlug }) });
  assert(aiimsOgResponse.status === 200, "AIIMS Jodhpur OG HTTP status is 200");
  const aiimsBuffer = Buffer.from(await aiimsOgResponse.arrayBuffer());
  assert(aiimsBuffer.length > 5000, `AIIMS Jodhpur PNG size healthy (${aiimsBuffer.length} bytes)`);

  const aiimsPreviewPath = path.join(tmpDir, "college-og-v3-aiims-jodhpur.png");
  fs.writeFileSync(aiimsPreviewPath, aiimsBuffer);
  console.log(`  📁 Saved AIIMS Jodhpur visual preview to: ${aiimsPreviewPath}`);

  const aiimsMeta = await generateMetadata({ params: Promise.resolve({ slug: aiimsSlug }) });
  const aiimsOg = aiimsMeta.openGraph as any;
  assert(
    aiimsOg?.images?.[0]?.url ===
      `https://mbbsfoundation.com/neet-to-mbbs/colleges/${aiimsSlug}/counselling-2026/opengraph-image?v=v3`,
    "AIIMS Jodhpur OG image points to its own slug with v3"
  );

  // -------------------------------------------------------------
  // TEST 3: Kasturba Medical College Manipal (Deemed College)
  // -------------------------------------------------------------
  console.log("\n[TEST 3] Kasturba Medical College Manipal (kasturba-medical-college-manipal)");
  const kmcSlug = "kasturba-medical-college-manipal";
  const kmcOgResponse = await Image({ params: Promise.resolve({ slug: kmcSlug }) });
  assert(kmcOgResponse.status === 200, "KMC Manipal OG HTTP status is 200");
  const kmcBuffer = Buffer.from(await kmcOgResponse.arrayBuffer());
  assert(kmcBuffer.length > 5000, `KMC Manipal PNG size healthy (${kmcBuffer.length} bytes)`);

  const kmcPreviewPath = path.join(tmpDir, "college-og-v3-kmc-manipal.png");
  fs.writeFileSync(kmcPreviewPath, kmcBuffer);
  console.log(`  📁 Saved KMC Manipal visual preview to: ${kmcPreviewPath}`);

  const kmcMeta = await generateMetadata({ params: Promise.resolve({ slug: kmcSlug }) });
  const kmcOg = kmcMeta.openGraph as any;
  assert(
    kmcOg?.images?.[0]?.url ===
      `https://mbbsfoundation.com/neet-to-mbbs/colleges/${kmcSlug}/counselling-2026/opengraph-image?v=v3`,
    "KMC Manipal OG image points to its own slug with v3"
  );

  // -------------------------------------------------------------
  // TEST 4: Long Canonical College Name
  // -------------------------------------------------------------
  console.log("\n[TEST 4] Long Canonical College Name");
  const longNameCol = await prisma.college.findFirst({
    where: {
      collegeName: { contains: "Silvassa" },
      isActive: true,
    },
  });
  const longSlug = longNameCol?.slug || "namo-medical-education-and-research-institute-silvassa";
  console.log(`  Testing with: [${longNameCol?.collegeName.length || 0} chars] ${longNameCol?.collegeName}`);

  const longOgResponse = await Image({ params: Promise.resolve({ slug: longSlug }) });
  assert(longOgResponse.status === 200, "Long Name College OG HTTP status is 200");
  const longBuffer = Buffer.from(await longOgResponse.arrayBuffer());
  assert(longBuffer.length > 5000, `Long Name PNG size healthy (${longBuffer.length} bytes)`);

  const longPreviewPath = path.join(tmpDir, "college-og-v3-long-name.png");
  fs.writeFileSync(longPreviewPath, longBuffer);
  console.log(`  📁 Saved Long Name visual preview to: ${longPreviewPath}`);

  // -------------------------------------------------------------
  // TEST 5: Non-MCC College (No MCC Round-1 Evidence)
  // -------------------------------------------------------------
  console.log("\n[TEST 5] College with No MCC Round-1 Open Benchmark (Pure State / Non-MCC)");
  const nonMccCol = await prisma.college.findFirst({
    where: {
      slug: { contains: "father-muller" },
      isActive: true,
    },
  });
  const nonMccSlug = nonMccCol?.slug || "father-mullers-medical-college-mangalore";
  console.log(`  Testing non-MCC college: ${nonMccCol?.collegeName} (${nonMccSlug})`);

  const nonMccOgResponse = await Image({ params: Promise.resolve({ slug: nonMccSlug }) });
  assert(nonMccOgResponse.status === 200, "Non-MCC College OG HTTP status is 200");
  const nonMccBuffer = Buffer.from(await nonMccOgResponse.arrayBuffer());
  assert(nonMccBuffer.length > 5000, `Non-MCC PNG size healthy (${nonMccBuffer.length} bytes)`);

  const nonMccPreviewPath = path.join(tmpDir, "college-og-v3-no-air.png");
  fs.writeFileSync(nonMccPreviewPath, nonMccBuffer);
  console.log(`  📁 Saved Non-MCC visual preview to: ${nonMccPreviewPath}`);

  const nonMccMeta = await generateMetadata({ params: Promise.resolve({ slug: nonMccSlug }) });
  const nonMccOg = nonMccMeta.openGraph as any;
  assert(
    nonMccOg?.description?.includes("Explore 2026 MBBS seat information and available counselling evidence"),
    "Non-MCC OG description uses fallback pattern"
  );
  assert(!nonMccOg?.description?.includes("N/A"), "No messy N/A strings in description");

  // -------------------------------------------------------------
  // TEST 6: Invalid / Non-existent Slug
  // -------------------------------------------------------------
  console.log("\n[TEST 6] Invalid / Non-existent Slug");
  const invalidSlug = "non-existent-medical-college-slug-xyz-999";
  const invalidResponse = await Image({ params: Promise.resolve({ slug: invalidSlug }) });
  assert(invalidResponse.status === 200, "Invalid slug returns graceful fallback HTTP 200 image");
  const invalidBuffer = Buffer.from(await invalidResponse.arrayBuffer());
  assert(invalidBuffer.length > 3000, `Invalid slug PNG size valid (${invalidBuffer.length} bytes)`);

  const invalidMeta = await generateMetadata({ params: Promise.resolve({ slug: invalidSlug }) });
  assert(
    invalidMeta.title === "Medical College Not Found | MBBS Foundation",
    "Invalid slug returns Not Found SEO title"
  );

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
