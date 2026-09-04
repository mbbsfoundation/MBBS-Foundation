async function verifyLiveStateHubs() {
  console.log("==================================================================");
  console.log("LIVE PRODUCTION VERIFICATION: SEQUENCE 9K.2B STATE SEO HUBS");
  console.log("==================================================================");

  // 1. Check representative state hubs
  const testStates = [
    { slug: "rajasthan", name: "Rajasthan", colleges: ["sms-medical-college-jaipur", "aiims-rajasthan"] },
    { slug: "uttar-pradesh", name: "Uttar Pradesh", colleges: ["institute-of-medical-sciences-bhu-varansi", "king-george-medical-university-lucknow"] },
    { slug: "maharashtra", name: "Maharashtra", colleges: ["seth-gs-medical-college-mumbai", "aiims-maharashtra"] },
    { slug: "tamil-nadu", name: "Tamil Nadu", colleges: ["madras-medical-college-chennai"] },
    { slug: "karnataka", name: "Karnataka", colleges: ["bangalore-medical-college-and-research-institute-bangalore", "kasturba-medical-college-manipal"] },
    { slug: "delhi", name: "Delhi", colleges: ["maulana-azad-medical-college-new-delhi", "aiims-delhi"] },
  ];

  for (const st of testStates) {
    const url = `https://mbbsfoundation.com/neet-to-mbbs/counselling/state/${st.slug}`;
    console.log(`\nChecking ${st.name} State Hub: ${url}`);
    const res = await fetch(url, { cache: "no-store" });
    console.log(`  HTTP Status: ${res.status}`);
    const html = await res.text();
    const titleMatch = html.match(/<title>(.*?)<\/title>/);
    console.log(`  Title: "${titleMatch ? titleMatch[1] : "N/A"}"`);
    for (const cSlug of st.colleges) {
      const hasLink = html.includes(`/neet-to-mbbs/colleges/${cSlug}/counselling-2026`);
      console.log(`  Contains link to ${cSlug}: ${hasLink ? "YES ✓" : "NO ❌"}`);
    }
  }

  // 2. Check Counselling Hub State Directory
  console.log("\nChecking Master Counselling Hub state links...");
  const counselRes = await fetch("https://mbbsfoundation.com/neet-to-mbbs/counselling", { cache: "no-store" });
  console.log(`  HTTP Status: ${counselRes.status}`);
  const counselHtml = await counselRes.text();
  const hasRaj = counselHtml.includes("/neet-to-mbbs/counselling/state/rajasthan");
  const hasUP = counselHtml.includes("/neet-to-mbbs/counselling/state/uttar-pradesh");
  const hasMH = counselHtml.includes("/neet-to-mbbs/counselling/state/maharashtra");
  console.log(`  Contains Rajasthan state link: ${hasRaj ? "YES ✓" : "NO ❌"}`);
  console.log(`  Contains UP state link: ${hasUP ? "YES ✓" : "NO ❌"}`);
  console.log(`  Contains Maharashtra state link: ${hasMH ? "YES ✓" : "NO ❌"}`);

  // 3. Check College Breadcrumb backlink
  console.log("\nChecking SMS Jaipur college page breadcrumb backlink...");
  const smsRes = await fetch("https://mbbsfoundation.com/neet-to-mbbs/colleges/sms-medical-college-jaipur/counselling-2026", { cache: "no-store" });
  console.log(`  HTTP Status: ${smsRes.status}`);
  const smsHtml = await smsRes.text();
  const hasStateBacklink = smsHtml.includes("/neet-to-mbbs/counselling/state/rajasthan");
  console.log(`  Contains backlink to Rajasthan State Hub: ${hasStateBacklink ? "YES ✓" : "NO ❌"}`);

  // 4. Check live sitemap.xml
  console.log("\nChecking live sitemap.xml...");
  const sitemapRes = await fetch("https://mbbsfoundation.com/sitemap.xml", { cache: "no-store" });
  console.log(`  HTTP Status: ${sitemapRes.status}`);
  const sitemapXml = await sitemapRes.text();
  const urlMatches = sitemapXml.match(/<loc>(.*?)<\/loc>/g) || [];
  const stateMatches = urlMatches.filter((u) => u.includes("/neet-to-mbbs/counselling/state/"));
  const collegeMatches = urlMatches.filter((u) => u.includes("/neet-to-mbbs/colleges/"));
  console.log(`  Total URLs in sitemap: ${urlMatches.length}`);
  console.log(`  State Hub URLs in sitemap: ${stateMatches.length}`);
  console.log(`  College URLs in sitemap: ${collegeMatches.length}`);

  console.log("\n==================================================================");
}

verifyLiveStateHubs().catch(console.error);
