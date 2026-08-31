import "dotenv/config";
import fs from "fs";
import path from "path";
import { prisma } from "../lib/prisma";
import Image, { size } from "../app/neet-to-mbbs/colleges/[slug]/counselling-2026/opengraph-image";
import { generateMetadata } from "../app/neet-to-mbbs/colleges/[slug]/counselling-2026/page";

async function runTests() {
  console.log("==================================================================");
  console.log("RUNNING AUTOMATED TESTS: COLLEGE DYNAMIC OPEN GRAPH GENERATOR (V2)");
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

  const smsPreviewPath = path.join(tmpDir, "college-og-v2-sms-jaipur.png");
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
      "https://mbbsfoundation.com/neet-to-mbbs/colleges/sms-medical-college-jaipur/counselling-2026/opengraph-image?v=v2",
    "OG Image points to versioned dynamic endpoint (v2)"
  );
  assert(
    smsOg?.images?.[0]?.width === 1200 && smsOg?.images?.[0]?.height === 630,
    "OG Image dimensions are 1200x630"
  );
  const smsTwitter = smsMeta.twitter as any;
  assert(smsTwitter?.card === "summary_large_image", "Twitter card is summary_large_image");
  assert(
    smsTwitter?.images?.[0] ===
      "https://mbbsfoundation.com/neet-to-mbbs/colleges/sms-medical-college-jaipur/counselling-2026/opengraph-image?v=v2",
    "Twitter image matches OG image (v2)"
  );

  // -------------------------------------------------------------
  // TEST 2: AIIMS Jodhpur (INI)
  // -------------------------------------------------------------
  console.log("\n[TEST 2] AIIMS Jodhpur (aiims-rajasthan)");
  const aiimsSlug = "aiims-rajasthan";
  const aiimsOgResponse = await Image({ params: Promise.resolve({ slug: aiimsSlug }) });
  assert(aiimsOgResponse.status === 200, "AIIMS Jodhpur OG HTTP status is 200");
  const aiimsBuffer = Buffer.from(await aiimsOgResponse.arrayBuffer());
  assert(aiimsBuffer.length > 5000, `AIIMS Jodhpur PNG size healthy (${aiimsBuffer.length} bytes)`);
  const aiimsPreviewPath = path.join(tmpDir, "college-og-v2-aiims-jodhpur.png");
  fs.writeFileSync(aiimsPreviewPath, aiimsBuffer);
  console.log(`  📁 Saved AIIMS Jodhpur visual preview to: ${aiimsPreviewPath}`);

  const aiimsMeta = await generateMetadata({ params: Promise.resolve({ slug: aiimsSlug }) });
  const aiimsOg = aiimsMeta.openGraph as any;
  assert(
    aiimsOg?.images?.[0]?.url ===
      "https://mbbsfoundation.com/neet-to-mbbs/colleges/aiims-rajasthan/counselling-2026/opengraph-image?v=v2",
    "AIIMS Jodhpur OG image points to its own slug with v2"
  );

  // -------------------------------------------------------------
  // TEST 3: Kasturba Medical College Manipal (Deemed Private)
  // -------------------------------------------------------------
  console.log("\n[TEST 3] Kasturba Medical College Manipal (kasturba-medical-college-manipal)");
  const kmcSlug = "kasturba-medical-college-manipal";
  const kmcOgResponse = await Image({ params: Promise.resolve({ slug: kmcSlug }) });
  assert(kmcOgResponse.status === 200, "KMC Manipal OG HTTP status is 200");
  const kmcBuffer = Buffer.from(await kmcOgResponse.arrayBuffer());
  assert(kmcBuffer.length > 5000, `KMC Manipal PNG size healthy (${kmcBuffer.length} bytes)`);
  const kmcPreviewPath = path.join(tmpDir, "college-og-v2-kmc-manipal.png");
  fs.writeFileSync(kmcPreviewPath, kmcBuffer);
  console.log(`  📁 Saved KMC Manipal visual preview to: ${kmcPreviewPath}`);

  const kmcMeta = await generateMetadata({ params: Promise.resolve({ slug: kmcSlug }) });
  const kmcOg = kmcMeta.openGraph as any;
  assert(
    kmcOg?.images?.[0]?.url ===
      "https://mbbsfoundation.com/neet-to-mbbs/colleges/kasturba-medical-college-manipal/counselling-2026/opengraph-image?v=v2",
    "KMC Manipal OG image points to its own slug with v2"
  );

  // -------------------------------------------------------------
  // TEST 4: Long Canonical College Name
  // -------------------------------------------------------------
  console.log("\n[TEST 4] Long Canonical College Name");
  const longCollege = await prisma.college.findFirst({
    where: {
      collegeName: {
        contains: "NAMO Medical Education and Research Institute",
      },
    },
    select: { slug: true, collegeName: true },
  });

  if (longCollege) {
    console.log(
      `  Testing with: [${longCollege.collegeName.length} chars] ${longCollege.collegeName}`
    );
    const longOgResponse = await Image({ params: Promise.resolve({ slug: longCollege.slug }) });
    assert(longOgResponse.status === 200, "Long Name College OG HTTP status is 200");
    const longBuffer = Buffer.from(await longOgResponse.arrayBuffer());
    assert(longBuffer.length > 5000, `Long Name PNG size healthy (${longBuffer.length} bytes)`);
    const longPreviewPath = path.join(tmpDir, "college-og-v2-long-name.png");
    fs.writeFileSync(longPreviewPath, longBuffer);
    console.log(`  📁 Saved Long Name visual preview to: ${longPreviewPath}`);
  }

  // -------------------------------------------------------------
  // TEST 5: College with No MCC Round-1 Open Benchmark (Fallback)
  // -------------------------------------------------------------
  console.log(
    "\n[TEST 5] College with No MCC Round-1 Open Benchmark (Pure State / Non-MCC)"
  );
  const nonMccCollege = await prisma.college.findFirst({
    where: {
      isActive: true,
      seatMatrixRecords: {
        none: {},
      },
    },
    select: { slug: true, collegeName: true },
  });

  if (nonMccCollege) {
    console.log(`  Testing non-MCC college: ${nonMccCollege.collegeName} (${nonMccCollege.slug})`);
    const nonMccOgResponse = await Image({
      params: Promise.resolve({ slug: nonMccCollege.slug }),
    });
    assert(nonMccOgResponse.status === 200, "Non-MCC College OG HTTP status is 200");
    const nonMccBuffer = Buffer.from(await nonMccOgResponse.arrayBuffer());
    assert(nonMccBuffer.length > 5000, `Non-MCC PNG size healthy (${nonMccBuffer.length} bytes)`);
    const nonMccPreviewPath = path.join(tmpDir, "college-og-v2-no-air.png");
    fs.writeFileSync(nonMccPreviewPath, nonMccBuffer);
    console.log(`  📁 Saved Non-MCC visual preview to: ${nonMccPreviewPath}`);

    const nonMccMeta = await generateMetadata({
      params: Promise.resolve({ slug: nonMccCollege.slug }),
    });
    const nonMccOg = nonMccMeta.openGraph as any;
    assert(
      nonMccOg?.description?.includes("available counselling evidence"),
      "Non-MCC OG description uses fallback pattern"
    );
    assert(!nonMccOg?.description?.includes("N/A"), "No messy N/A strings in description");
  }

  // -------------------------------------------------------------
  // TEST 6: Invalid / Non-existent Slug
  // -------------------------------------------------------------
  console.log("\n[TEST 6] Invalid / Non-existent Slug");
  const invalidOgResponse = await Image({
    params: Promise.resolve({ slug: "invalid-non-existent-college-slug-12345" }),
  });
  assert(
    invalidOgResponse.status === 200,
    "Invalid slug returns graceful fallback HTTP 200 image"
  );
  const invalidBuffer = Buffer.from(await invalidOgResponse.arrayBuffer());
  assert(invalidBuffer.length > 3000, `Invalid slug PNG size valid (${invalidBuffer.length} bytes)`);

  const invalidMeta = await generateMetadata({
    params: Promise.resolve({ slug: "invalid-non-existent-college-slug-12345" }),
  });
  assert(
    String(invalidMeta.title).includes("Not Found"),
    "Invalid slug returns Not Found SEO title"
  );

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
