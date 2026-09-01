import "dotenv/config";
import sitemap from "../app/sitemap";
import { generateMetadata } from "../app/neet-to-mbbs/colleges/[slug]/counselling-2026/page";
import { getCleanCollegeDisplayName } from "../lib/counselling/pathwayOrdering";
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
  console.log("TEST SUITE: SEQUENCE 9K.2A — SITEMAP COMPLETENESS & METADATA HYGIENE");
  console.log("==================================================================");

  // [TEST GROUP 1]: SITEMAP VALIDATION
  console.log("\n[TEST GROUP 1] Sitemap Scale & Integrity Validation");
  const sitemapEntries = await sitemap();
  const totalUrls = sitemapEntries.length;
  console.log(`Total Sitemap URLs generated: ${totalUrls}`);

  const collegeUrls = sitemapEntries.filter((e) => e.url.includes("/neet-to-mbbs/colleges/"));
  const staticUrls = sitemapEntries.filter((e) => !e.url.includes("/neet-to-mbbs/colleges/"));

  console.log(`  College URLs: ${collegeUrls.length}`);
  console.log(`  Static / Other URLs: ${staticUrls.length}`);

  const activeCollegeCount = await prisma.college.count({ where: { isActive: true } });
  assert(collegeUrls.length === activeCollegeCount, `1. College URL count (${collegeUrls.length}) matches active DB college count (${activeCollegeCount})`);
  assert(totalUrls === activeCollegeCount + staticUrls.length, `2. Total URLs (${totalUrls}) equals college count + static routes (${activeCollegeCount + staticUrls.length})`);

  // Check for duplicates
  const urlSet = new Set<string>();
  let hasDuplicates = false;
  for (const entry of sitemapEntries) {
    if (urlSet.has(entry.url)) {
      hasDuplicates = true;
      console.error(`Duplicate URL: ${entry.url}`);
    }
    urlSet.add(entry.url);
  }
  assert(!hasDuplicates, "3. No duplicate URLs found in sitemap");

  // Check for query strings, admin, API URLs
  const hasQueryString = sitemapEntries.some((e) => e.url.includes("?"));
  const hasAdmin = sitemapEntries.some((e) => e.url.includes("/admin") || e.url.includes("/api"));
  assert(!hasQueryString, "4. No query-string URLs in sitemap");
  assert(!hasAdmin, "5. No admin or API URLs in sitemap");

  // Check key static routes present
  const requiredStatic = [
    "https://mbbsfoundation.com",
    "https://mbbsfoundation.com/neet-to-mbbs",
    "https://mbbsfoundation.com/neet-to-mbbs/counselling",
    "https://mbbsfoundation.com/neet-to-mbbs/counselling/round-2-planner",
    "https://mbbsfoundation.com/neet-to-mbbs/counselling/neet-choice-index-2026",
  ];
  for (const req of requiredStatic) {
    assert(sitemapEntries.some((e) => e.url === req), `6. Sitemap includes required route: ${req}`);
  }

  // [TEST GROUP 2]: COLLEGE NAME CLEANER TESTS
  console.log("\n[TEST GROUP 2] Name Cleaner Unit Tests");
  assert(
    getCleanCollegeDisplayName("AIIMS, New Delhi, ANSARI NAGAR EAST, AUROBINDO MARG, NEW DELHI 110029") === "AIIMS New Delhi",
    "7. AIIMS Delhi address cleaned to 'AIIMS New Delhi'"
  );
  assert(
    getCleanCollegeDisplayName("AIIMS, Jodhpur, BASNI PHASE - II, JODHPUR-342005") === "AIIMS Jodhpur",
    "8. AIIMS Jodhpur address cleaned to 'AIIMS Jodhpur'"
  );
  assert(
    getCleanCollegeDisplayName("AIIMS, Bhubaneswar, AT - Sijua, POST - DUMUDUMA, BHUBANESWAR-751019") === "AIIMS Bhubaneswar",
    "9. AIIMS Bhubaneswar address cleaned to 'AIIMS Bhubaneswar'"
  );
  assert(
    getCleanCollegeDisplayName("Maulana Azad Medical College, New Delhi") === "Maulana Azad Medical College, New Delhi",
    "10. Standard college name preserved unmodified"
  );
  assert(
    getCleanCollegeDisplayName("Vardhman Mahavir Medical College & Safdarjung Hospital, Delhi") === "Vardhman Mahavir Medical College & Safdarjung Hospital, Delhi",
    "11. Complex standard name preserved unmodified"
  );

  // [TEST GROUP 3]: REPRESENTATIVE METADATA GENERATION
  console.log("\n[TEST GROUP 3] Representative College Page Metadata Checks");

  // 1. AIIMS New Delhi
  const aiimsMeta = await generateMetadata({ params: Promise.resolve({ slug: "aiims-delhi" }) });
  assert(aiimsMeta.title === "AIIMS New Delhi NEET 2026 | Round-1 AIR Pattern & MBBS Seats", `12. AIIMS Delhi title is clean: "${aiimsMeta.title}"`);
  assert(!String(aiimsMeta.title).includes("ANSARI NAGAR"), "13. AIIMS Delhi title has no address contamination");
  assert(String(aiimsMeta.description).includes("Official MCC Round-1 Open Typical Median AIR: 25.5"), "14. AIIMS Delhi description has Open Typical Median AIR: 25.5");

  // 2. AIIMS Jodhpur
  const jodhpurMeta = await generateMetadata({ params: Promise.resolve({ slug: "aiims-rajasthan" }) });
  assert(jodhpurMeta.title === "AIIMS Jodhpur NEET 2026 | Round-1 AIR Pattern & MBBS Seats", `15. AIIMS Jodhpur title is clean: "${jodhpurMeta.title}"`);
  assert(!String(jodhpurMeta.title).includes("BASNI PHASE"), "16. AIIMS Jodhpur title has no address contamination");
  assert(String(jodhpurMeta.description).includes("Official MCC Round-1 Open Typical Median AIR: 248"), "17. AIIMS Jodhpur description has Open Typical Median AIR: 248");

  // 3. MAMC
  const mamcMeta = await generateMetadata({ params: Promise.resolve({ slug: "maulana-azad-medical-college-new-delhi" }) });
  assert(mamcMeta.title === "Maulana Azad Medical College, New Delhi NEET 2026 | Round-1 AIR Pattern & MBBS Seats", `18. MAMC title is accurate: "${mamcMeta.title}"`);
  assert(String(mamcMeta.description).includes("Official MCC Round-1 Open Typical Median AIR: 90"), "19. MAMC description has Open Typical Median AIR: 90");

  // 4. KMC Manipal (Deemed / Self-Financed)
  const kmcMeta = await generateMetadata({ params: Promise.resolve({ slug: "kasturba-medical-college-manipal" }) });
  assert(kmcMeta.title === "Kasturba Medical College, Manipal NEET 2026 | Round-1 AIR Pattern & MBBS Seats", `20. KMC Manipal title is clean: "${kmcMeta.title}"`);
  assert(String(kmcMeta.description).includes("Self-Financed Merit Typical Median AIR: 33,398"), `21. KMC Manipal description accurately states 'Self-Financed Merit Typical Median AIR: 33,398'`);
  assert(!String(kmcMeta.description).includes("MCC Round-1 Open Typical"), "22. KMC Manipal does not falsely claim standard Open AIQ pathway");

  // 5. SMS Jaipur
  const smsMeta = await generateMetadata({ params: Promise.resolve({ slug: "sms-medical-college-jaipur" }) });
  assert(smsMeta.title === "SMS Medical College, Jaipur NEET 2026 | Round-1 AIR Pattern & MBBS Seats", `23. SMS Jaipur title is accurate: "${smsMeta.title}"`);
  assert(String(smsMeta.description).includes("Official MCC Round-1 Open Typical Median AIR: 938"), "24. SMS Jaipur description has Open Typical Median AIR: 938");

  // 6. KGMU Lucknow
  const kgmuMeta = await generateMetadata({ params: Promise.resolve({ slug: "king-george-medical-university-lucknow" }) });
  assert(kgmuMeta.title === "King George Medical University, Lucknow NEET 2026 | Round-1 AIR Pattern & MBBS Seats", `25. KGMU title is accurate: "${kgmuMeta.title}"`);
  assert(String(kgmuMeta.description).includes("Official MCC Round-1 Open Typical Median AIR: 1,194.5"), "26. KGMU description has Open Typical Median AIR: 1,194.5");

  console.log("\n==================================================================");
  console.log("ALL 26 TESTS PASSED SUCCESSFULLY!");
  console.log("==================================================================");
}

runTests().catch((e) => {
  console.error(e);
  process.exit(1);
});
