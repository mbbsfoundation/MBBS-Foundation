import "dotenv/config";
import sitemap from "../app/sitemap";
import {
  getAllStateHubSlugs,
  getAllStateHubSummaries,
  getStateHubData,
  getStateSlug,
  CANONICAL_STATES,
} from "../lib/counselling/stateHubService";
import { generateMetadata as generateStateMetadata } from "../app/neet-to-mbbs/counselling/state/[state]/page";
import { generateMetadata as generateCollegeMetadata } from "../app/neet-to-mbbs/colleges/[slug]/counselling-2026/page";
import { prisma } from "../lib/prisma";

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`  ❌ FAIL: ${msg}`);
    process.exit(1);
  }
  console.log(`  ✅ PASS: ${msg}`);
}

async function runTests() {
  console.log("==================================================================");
  console.log("TEST SUITE: SEQUENCE 9K.2B — STATE SEO HUB ARCHITECTURE");
  console.log("==================================================================");

  // [TEST GROUP 1]: STATE INVENTORY VALIDATION
  console.log("\n[TEST GROUP 1] State Inventory & Canonical Mapping");
  const stateSlugs = getAllStateHubSlugs();
  console.log(`Total Canonical State Hubs: ${stateSlugs.length}`);
  assert(stateSlugs.length === 34, "1. Exactly 34 canonical States/UTs recognized");

  const slugSet = new Set<string>();
  for (const slug of stateSlugs) {
    assert(!slugSet.has(slug), `2. No duplicate state slug: ${slug}`);
    slugSet.add(slug);
    assert(Boolean(CANONICAL_STATES[slug]), `3. Slug '${slug}' maps to canonical name '${CANONICAL_STATES[slug]}'`);
  }

  const invalidState = await getStateHubData("non-existent-state");
  assert(invalidState === null, "4. Invalid state slug returns null (triggers 404 notFound)");

  // [TEST GROUP 2]: 100% COLLEGE COVERAGE ACROSS STATE HUBS
  console.log("\n[TEST GROUP 2] 100% (847/847) College Coverage Across State Hubs");
  const allDbColleges = await prisma.college.findMany({
    where: { isActive: true },
    select: { id: true, slug: true, collegeName: true, state: true },
  });
  console.log(`Total Active Colleges in DB: ${allDbColleges.length}`);

  const linkedCollegeSlugs = new Set<string>();
  const duplicateColleges: string[] = [];

  for (const slug of stateSlugs) {
    const data = await getStateHubData(slug);
    assert(data !== null, `State data loaded for ${slug}`);
    if (data) {
      for (const col of data.colleges) {
        if (linkedCollegeSlugs.has(col.slug)) {
          duplicateColleges.push(col.slug);
        }
        linkedCollegeSlugs.add(col.slug);
      }
    }
  }

  console.log(`Colleges linked across all 34 State Hubs: ${linkedCollegeSlugs.size}`);
  assert(duplicateColleges.length === 0, `5. Zero duplicate college assignments across state hubs (duplicates: ${duplicateColleges.length})`);
  assert(linkedCollegeSlugs.size === allDbColleges.length, `6. All ${allDbColleges.length} database colleges are covered across state hubs`);
  assert(linkedCollegeSlugs.size === 847, "7. Exactly 847 colleges linked through State Hubs");

  // [TEST GROUP 3]: REPRESENTATIVE STATE EVIDENCE INTEGRITY
  console.log("\n[TEST GROUP 3] Representative State Data Audits");

  // 1. Rajasthan
  const rajData = await getStateHubData("rajasthan");
  assert(rajData !== null, "8. Rajasthan state hub data exists");
  if (rajData) {
    console.log(`  Rajasthan: ${rajData.summary.totalColleges} colleges, ~${rajData.summary.totalSeats} seats, ${rajData.summary.collegesWithMccEvidence} MCC R1`);
    assert(rajData.summary.totalColleges === 52, `9. Rajasthan college count is 52 (found: ${rajData.summary.totalColleges})`);
    const sms = rajData.colleges.find((c) => c.slug === "sms-medical-college-jaipur");
    assert(sms !== undefined, "10. SMS Jaipur is present in Rajasthan hub");
    assert(sms?.primaryBenchmark?.medianAIR === 938, `11. SMS Jaipur Median AIR is 938 (found: ${sms?.primaryBenchmark?.medianAIR})`);
    const aiimsJodhpur = rajData.colleges.find((c) => c.slug === "aiims-rajasthan");
    assert(aiimsJodhpur !== undefined, "12. AIIMS Jodhpur is present in Rajasthan hub");
    assert(aiimsJodhpur?.primaryBenchmark?.medianAIR === 248, `13. AIIMS Jodhpur Median AIR is 248 (found: ${aiimsJodhpur?.primaryBenchmark?.medianAIR})`);
  }

  // 2. Uttar Pradesh
  const upData = await getStateHubData("uttar-pradesh");
  assert(upData !== null, "14. UP state hub data exists");
  if (upData) {
    console.log(`  UP: ${upData.summary.totalColleges} colleges, ~${upData.summary.totalSeats} seats, ${upData.summary.collegesWithMccEvidence} MCC R1`);
    assert(upData.summary.totalColleges === 90, `15. UP college count is 90 (found: ${upData.summary.totalColleges})`);
    const bhu = upData.colleges.find((c) => c.slug === "institute-of-medical-sciences-bhu-varansi");
    assert(bhu !== undefined, "16. IMS BHU is present in UP hub");
    assert(bhu?.primaryBenchmark?.medianAIR === 845, `17. IMS BHU Median AIR is 845 (found: ${bhu?.primaryBenchmark?.medianAIR})`);
    const kgmu = upData.colleges.find((c) => c.slug === "king-george-medical-university-lucknow");
    assert(kgmu !== undefined, "18. KGMU is present in UP hub");
    assert(kgmu?.primaryBenchmark?.medianAIR === 1194.5, `19. KGMU Median AIR is 1,194.5 (found: ${kgmu?.primaryBenchmark?.medianAIR})`);
  }

  // 3. Maharashtra
  const mhData = await getStateHubData("maharashtra");
  assert(mhData !== null, "20. Maharashtra state hub data exists");
  if (mhData) {
    console.log(`  Maharashtra: ${mhData.summary.totalColleges} colleges, ~${mhData.summary.totalSeats} seats, ${mhData.summary.collegesWithMccEvidence} MCC R1`);
    assert(mhData.summary.totalColleges === 87, `21. Maharashtra college count is 87 (found: ${mhData.summary.totalColleges})`);
    const sethGs = mhData.colleges.find((c) => c.slug === "seth-gs-medical-college-mumbai");
    assert(sethGs !== undefined, "22. Seth GS is present in Maharashtra hub");
    assert(sethGs?.primaryBenchmark?.medianAIR === 960, `23. Seth GS Median AIR is 960 (found: ${sethGs?.primaryBenchmark?.medianAIR})`);
  }

  // 4. Tamil Nadu
  const tnData = await getStateHubData("tamil-nadu");
  assert(tnData !== null, "24. Tamil Nadu state hub data exists");
  if (tnData) {
    console.log(`  Tamil Nadu: ${tnData.summary.totalColleges} colleges, ~${tnData.summary.totalSeats} seats, ${tnData.summary.collegesWithMccEvidence} MCC R1`);
    assert(tnData.summary.totalColleges === 79, `25. Tamil Nadu college count is 79 (found: ${tnData.summary.totalColleges})`);
    const mmc = tnData.colleges.find((c) => c.slug === "madras-medical-college-chennai");
    assert(mmc !== undefined, "26. Madras Medical College is present in TN hub");
    assert(mmc?.primaryBenchmark?.medianAIR === 486, `27. Madras Medical College Median AIR is 486 (found: ${mmc?.primaryBenchmark?.medianAIR})`);
  }

  // 5. Karnataka
  const kaData = await getStateHubData("karnataka");
  assert(kaData !== null, "28. Karnataka state hub data exists");
  if (kaData) {
    console.log(`  Karnataka: ${kaData.summary.totalColleges} colleges, ~${kaData.summary.totalSeats} seats, ${kaData.summary.collegesWithMccEvidence} MCC R1`);
    assert(kaData.summary.totalColleges === 75, `29. Karnataka college count is 75 (found: ${kaData.summary.totalColleges})`);
    const bmcri = kaData.colleges.find((c) => c.slug === "bangalore-medical-college-and-research-institute-bangalore");
    assert(bmcri !== undefined, "30. BMCRI Bangalore is present in Karnataka hub");
    assert(bmcri?.primaryBenchmark?.medianAIR === 1211, `31. BMCRI Median AIR is 1211 (found: ${bmcri?.primaryBenchmark?.medianAIR})`);
    const kmc = kaData.colleges.find((c) => c.slug === "kasturba-medical-college-manipal");
    assert(kmc !== undefined, "32. KMC Manipal is present in Karnataka hub");
    assert(kmc?.isDeemed === true, "33. KMC Manipal retains Deemed classification");
    assert(kmc?.primaryBenchmark?.medianAIR === 33398, `34. KMC Manipal Median AIR is 33,398 (found: ${kmc?.primaryBenchmark?.medianAIR})`);
  }

  // 6. Delhi
  const dlData = await getStateHubData("delhi");
  assert(dlData !== null, "35. Delhi state hub data exists");
  if (dlData) {
    console.log(`  Delhi: ${dlData.summary.totalColleges} colleges, ~${dlData.summary.totalSeats} seats, ${dlData.summary.collegesWithMccEvidence} MCC R1`);
    assert(dlData.summary.totalColleges === 12, `36. Delhi college count is 12 (found: ${dlData.summary.totalColleges})`);
    const mamc = dlData.colleges.find((c) => c.slug === "maulana-azad-medical-college-new-delhi");
    assert(mamc?.primaryBenchmark?.medianAIR === 90, `37. MAMC Median AIR is 90 (found: ${mamc?.primaryBenchmark?.medianAIR})`);
    const vmmc = dlData.colleges.find((c) => c.slug === "vardhman-mahavir-medical-college-and-safdarjung-hospital-delhi");
    assert(vmmc?.primaryBenchmark?.medianAIR === 99.5, `38. VMMC Median AIR is 99.5 (found: ${vmmc?.primaryBenchmark?.medianAIR})`);
    const aiimsDelhi = dlData.colleges.find((c) => c.slug === "aiims-delhi");
    assert(aiimsDelhi?.primaryBenchmark?.medianAIR === 25.5, `39. AIIMS Delhi Median AIR is 25.5 (found: ${aiimsDelhi?.primaryBenchmark?.medianAIR})`);
  }

  // [TEST GROUP 4]: METADATA & STRUCTURED DATA
  console.log("\n[TEST GROUP 4] Metadata & Structured Data Validation");
  const rajMeta = await generateStateMetadata({ params: Promise.resolve({ state: "rajasthan" }) });
  assert(rajMeta.title === "Rajasthan NEET 2026 Counselling & Medical Colleges | MBBS Foundation", `40. Rajasthan title is clean: "${rajMeta.title}"`);
  assert(String(rajMeta.description).includes("Explore 52 medical colleges and approximately"), "41. Rajasthan description has college count");
  assert(String(rajMeta.description).includes("approved MBBS seats in Rajasthan"), "41b. Rajasthan description has seat phrasing");
  assert(rajMeta.alternates?.canonical === "https://mbbsfoundation.com/neet-to-mbbs/counselling/state/rajasthan", "42. Canonical is self-referencing");

  // [TEST GROUP 5]: COUNSELLING HUB STATE DIRECTORY
  console.log("\n[TEST GROUP 5] Counselling Hub State Directory Summaries");
  const summaries = await getAllStateHubSummaries();
  assert(summaries.length === 34, `43. Master directory summaries return all 34 states (found: ${summaries.length})`);
  assert(summaries[0].stateName === "Uttar Pradesh", `44. First state by college count is Uttar Pradesh (${summaries[0].totalColleges} colleges)`);

  // [TEST GROUP 6]: SITEMAP EXPANSION INTEGRITY
  console.log("\n[TEST GROUP 6] Sitemap Validation");
  const sitemapEntries = await sitemap();
  const totalUrls = sitemapEntries.length;
  console.log(`Total Sitemap URLs generated: ${totalUrls}`);

  const stateUrls = sitemapEntries.filter((e) => e.url.includes("/neet-to-mbbs/counselling/state/"));
  const collegeUrls = sitemapEntries.filter((e) => e.url.includes("/neet-to-mbbs/colleges/"));
  const staticUrls = sitemapEntries.filter(
    (e) => !e.url.includes("/neet-to-mbbs/colleges/") && !e.url.includes("/neet-to-mbbs/counselling/state/")
  );

  console.log(`  Static URLs: ${staticUrls.length}`);
  console.log(`  State Hub URLs: ${stateUrls.length}`);
  console.log(`  College URLs: ${collegeUrls.length}`);

  assert(stateUrls.length === 34, `45. Exactly 34 State Hub URLs in sitemap (found: ${stateUrls.length})`);
  assert(collegeUrls.length === 847, `46. Exactly 847 College URLs in sitemap (found: ${collegeUrls.length})`);
  assert(staticUrls.length === 16, `47. Exactly 16 Static URLs in sitemap (found: ${staticUrls.length})`);
  assert(totalUrls === 897, `48. Total sitemap URLs is exactly 897 (found: ${totalUrls})`);

  // Check no duplicates in sitemap
  const urlSet = new Set<string>();
  let hasDup = false;
  for (const entry of sitemapEntries) {
    if (urlSet.has(entry.url)) {
      hasDup = true;
      console.error(`Duplicate URL: ${entry.url}`);
    }
    urlSet.add(entry.url);
  }
  assert(!hasDup, "49. Zero duplicate URLs in sitemap");

  console.log("\n==================================================================");
  console.log("ALL 49 TESTS PASSED SUCCESSFULLY!");
  console.log("==================================================================");
}

runTests().catch((e) => {
  console.error(e);
  process.exit(1);
});
