import "dotenv/config";
import fs from "fs";
import path from "path";
import nextConfig from "@/next.config";
import sitemap from "@/app/sitemap";
import robots from "@/app/robots";
import { getCollegeEvidenceBySlug } from "@/lib/counselling/evidenceService";
import { getPrimaryOpenBenchmark } from "@/lib/counselling/pathwayOrdering";
import { prisma } from "@/lib/prisma";

async function runTests() {
  console.log("==================================================================");
  console.log("SEQUENCE 9H TEST SUITE: Pre-Public-Launch Security & SEO Hardening");
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

  const rootDir = process.cwd();

  // -------------------------------------------------------------
  // Test Group 1: Dataset & Raw PDF Protection
  // -------------------------------------------------------------
  console.log("Test Group 1: Dataset & Raw PDF Protection");
  const mccDataDir = path.join(rootDir, "mccug2026data");
  const publicDir = path.join(rootDir, "public");
  const publicMccData = path.join(publicDir, "mccug2026data");

  assert(fs.existsSync(mccDataDir), "mccug2026data directory exists at root");
  assert(!fs.existsSync(publicMccData), "mccug2026data is NOT under /public directory");

  const publicPdfsDir = path.join(publicDir, "pdfs");
  if (fs.existsSync(publicPdfsDir)) {
    const publicPdfFiles = fs.readdirSync(publicPdfsDir);
    const hasSourcePdfs = publicPdfFiles.some(
      (f) => f.toLowerCase().includes("allotment") || f.toLowerCase().includes("seat_matrix") || f.toLowerCase().includes("mcc")
    );
    assert(!hasSourcePdfs, "public/pdfs does not contain raw official MCC seed allotment/matrix PDFs");
  } else {
    assert(true, "public/pdfs directory is secure");
  }

  // -------------------------------------------------------------
  // Test Group 2: Environment Variables & Secrets Leakage Audit
  // -------------------------------------------------------------
  console.log("\nTest Group 2: Environment Variables & Secrets Leakage Audit");
  const envContent = fs.existsSync(path.join(rootDir, ".env"))
    ? fs.readFileSync(path.join(rootDir, ".env"), "utf-8")
    : "";
  const envLocalContent = fs.existsSync(path.join(rootDir, ".env.local"))
    ? fs.readFileSync(path.join(rootDir, ".env.local"), "utf-8")
    : "";

  const combinedEnv = envContent + "\n" + envLocalContent;
  const nextPublicSecrets = combinedEnv
    .split("\n")
    .filter((line) => line.trim().startsWith("NEXT_PUBLIC_"))
    .filter(
      (line) =>
        line.toLowerCase().includes("database") ||
        line.toLowerCase().includes("secret") ||
        line.toLowerCase().includes("password") ||
        line.toLowerCase().includes("token") ||
        line.toLowerCase().includes("key")
    );

  assert(nextPublicSecrets.length === 0, "No secrets or database URLs are exposed with NEXT_PUBLIC_ prefix");

  const gitignoreContent = fs.readFileSync(path.join(rootDir, ".gitignore"), "utf-8");
  assert(gitignoreContent.includes(".env"), ".env is ignored in .gitignore");
  assert(gitignoreContent.includes(".env.local"), ".env.local is ignored in .gitignore");

  // -------------------------------------------------------------
  // Test Group 3: Next.js Configuration & Security Headers
  // -------------------------------------------------------------
  console.log("\nTest Group 3: Next.js Configuration & Security Headers");
  assert(
    nextConfig.productionBrowserSourceMaps === false,
    "productionBrowserSourceMaps is set to false in next.config.ts"
  );

  const headersFn = nextConfig.headers;
  assert(typeof headersFn === "function", "Security headers function is configured in next.config.ts");

  if (typeof headersFn === "function") {
    const configuredHeaders = await headersFn();
    const globalHeaderConfig = configuredHeaders.find((h: any) => h.source === "/:path*");
    assert(!!globalHeaderConfig, "Global security header rule /:path* exists");

    if (globalHeaderConfig) {
      const headerKeys = globalHeaderConfig.headers.map((h: any) => h.key);
      assert(headerKeys.includes("X-Content-Type-Options"), "Header X-Content-Type-Options is present");
      assert(headerKeys.includes("Referrer-Policy"), "Header Referrer-Policy is present");
      assert(headerKeys.includes("X-Frame-Options"), "Header X-Frame-Options is present");
      assert(headerKeys.includes("Permissions-Policy"), "Header Permissions-Policy is present");
      assert(headerKeys.includes("X-XSS-Protection"), "Header X-XSS-Protection is present");
    }
  }

  // -------------------------------------------------------------
  // Test Group 4: Robots.txt Disallow Rules
  // -------------------------------------------------------------
  console.log("\nTest Group 4: Robots.txt Disallow Rules");
  const robotsConfig = robots();
  const rules = Array.isArray(robotsConfig.rules) ? robotsConfig.rules[0] : robotsConfig.rules;
  const disallowList = Array.isArray(rules?.disallow) ? rules.disallow : [rules?.disallow];

  assert(disallowList.includes("/api/"), "robots.txt disallows /api/");
  assert(disallowList.includes("/admin/"), "robots.txt disallows /admin/");
  assert(disallowList.includes("/cprday/my-venues/"), "robots.txt disallows /cprday/my-venues/");
  assert(disallowList.includes("/cprsanjeevani/admin-certificate"), "robots.txt disallows /cprsanjeevani/admin-certificate");
  assert(robotsConfig.sitemap === "https://mbbsfoundation.com/sitemap.xml", "robots.txt points to correct sitemap URL");

  // -------------------------------------------------------------
  // Test Group 5: Sitemap Indexation & Dynamic College Coverage
  // -------------------------------------------------------------
  console.log("\nTest Group 5: Sitemap Indexation & Dynamic College Coverage");
  const sitemapEntries = await sitemap();
  const sitemapUrls = sitemapEntries.map((e) => e.url);

  assert(
    sitemapUrls.includes("https://mbbsfoundation.com/neet-to-mbbs/counselling/round-2-planner"),
    "Sitemap includes NEET Counselling Planner"
  );
  assert(
    sitemapUrls.includes("https://mbbsfoundation.com/book"),
    "Sitemap includes MBBS Foundation Book"
  );
  assert(
    sitemapUrls.includes("https://mbbsfoundation.com/neet-to-mbbs"),
    "Sitemap includes NEET-to-MBBS hub"
  );

  const collegeEntries = sitemapUrls.filter((u) => u.includes("/neet-to-mbbs/colleges/"));
  assert(collegeEntries.length > 50, `Sitemap dynamically indexes ${collegeEntries.length} individual medical college pages (>50)`);

  // Verify no admin or api routes leaked into sitemap
  const leakedAdmin = sitemapUrls.filter((u) => u.includes("/admin/") || u.includes("/api/"));
  assert(leakedAdmin.length === 0, "No admin or API routes exist in sitemap");

  // -------------------------------------------------------------
  // Test Group 6: Main Planner SEO Metadata & Structured Data
  // -------------------------------------------------------------
  console.log("\nTest Group 6: Main Planner SEO Metadata & Structured Data");
  const plannerPagePath = path.join(
    rootDir,
    "app/neet-to-mbbs/counselling/round-2-planner/page.tsx"
  );
  const plannerPageContent = fs.readFileSync(plannerPagePath, "utf-8");

  assert(
    plannerPageContent.includes("NEET UG 2026 Counselling Planner | MCC Round-1 AIR & Medical College Explorer"),
    "Main Planner title matches locked SEO standard"
  );
  assert(
    plannerPageContent.includes("https://mbbsfoundation.com/neet-to-mbbs/counselling/round-2-planner"),
    "Main Planner canonical URL is configured"
  );
  assert(
    plannerPageContent.includes('"@type": "WebSite"') && plannerPageContent.includes('"@type": "BreadcrumbList"'),
    "Main Planner contains WebSite and BreadcrumbList JSON-LD structured data"
  );

  // -------------------------------------------------------------
  // Test Group 7: Server-Rendered Individual College Page Evidence
  // -------------------------------------------------------------
  console.log("\nTest Group 7: Server-Rendered Individual College Page Evidence");
  const collegePagePath = path.join(
    rootDir,
    "app/neet-to-mbbs/colleges/[slug]/counselling-2026/page.tsx"
  );
  const aiimsCollege = await prisma.college.findFirst({
    where: { isINI: true, collegeName: { contains: "Delhi", mode: "insensitive" } },
  });
  assert(!!aiimsCollege, "Found AIIMS Delhi in database");

  if (aiimsCollege) {
    const aiimsDelhi = await getCollegeEvidenceBySlug(aiimsCollege.slug);
    assert(!!aiimsDelhi, `Successfully retrieved AIIMS New Delhi by slug '${aiimsCollege.slug}'`);

    if (aiimsDelhi) {
      const openBench = getPrimaryOpenBenchmark(aiimsDelhi.allCategoryProfiles);
      assert(openBench?.medianAIR === 25.5, `AIIMS Delhi Typical (Median) AIR is 25.5 (got ${openBench?.medianAIR})`);
      assert(openBench?.bestAIR === 1, `AIIMS Delhi Best AIR is 1 (got ${openBench?.bestAIR})`);
      assert(aiimsDelhi.totalMBBSSeats2026 === 132, `AIIMS Delhi total MBBS seats is 132 (got ${aiimsDelhi.totalMBBSSeats2026})`);
    }
  }

  const smsJaipur = await getCollegeEvidenceBySlug("sms-medical-college-jaipur");
  assert(!!smsJaipur, "Successfully retrieved SMS Medical College Jaipur by slug 'sms-medical-college-jaipur'");

  if (smsJaipur) {
    const openBench = getPrimaryOpenBenchmark(smsJaipur.allCategoryProfiles);
    assert(openBench?.medianAIR === 938, `SMS Jaipur Typical (Median) AIR is 938 (got ${openBench?.medianAIR})`);
    assert(openBench?.highestAIR === 1144, `SMS Jaipur Last Observed AIR is 1144 (got ${openBench?.highestAIR})`);
    assert(smsJaipur.totalMBBSSeats2026 === 250, `SMS Jaipur total MBBS seats is 250 (got ${smsJaipur.totalMBBSSeats2026})`);
    assert(smsJaipur.mccRound1SeatsOffered === 37, `SMS Jaipur MCC Offered is 37 (got ${smsJaipur.mccRound1SeatsOffered})`);
    assert(smsJaipur.approxOutsideMccRound1Pool === 213, `SMS Jaipur Outside MCC pool is ~213 (got ${smsJaipur.approxOutsideMccRound1Pool})`);
  }

  // -------------------------------------------------------------
  // Test Group 8: No Security Theatre & Clean Terminology
  // -------------------------------------------------------------
  console.log("\nTest Group 8: No Security Theatre & Clean Terminology");
  const allTsxFiles = [
    plannerPagePath,
    collegePagePath,
    path.join(rootDir, "components/neet-to-mbbs/CollegeEvidenceCard.tsx"),
    path.join(rootDir, "components/neet-to-mbbs/MedicalCollegeExplorer.tsx"),
    path.join(rootDir, "components/neet-to-mbbs/Round1EvidenceExplorer.tsx"),
  ];

  let hasSecurityTheatre = false;
  for (const filePath of allTsxFiles) {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, "utf-8");
      if (
        content.includes("onContextMenu") ||
        content.includes("preventDefault") && content.includes("selectstart") ||
        content.includes("debugger") ||
        content.includes("user-select: none")
      ) {
        hasSecurityTheatre = true;
      }
    }
  }
  assert(!hasSecurityTheatre, "Zero security theatre (no right-click blocking, no text-selection blocking, no devtools tricks)");

  // -------------------------------------------------------------
  // Test Group 9: Trademark, Copyright & Data/IP Notice Verification
  // -------------------------------------------------------------
  console.log("\nTest Group 9: Trademark, Copyright & Data/IP Notice Verification");
  const layoutPath = path.join(rootDir, "app/layout.tsx");
  const layoutContent = fs.readFileSync(layoutPath, "utf-8");
  const plannerComponentPath = path.join(rootDir, "components/neet-to-mbbs/Round2Planner.tsx");
  const plannerCompContent = fs.readFileSync(plannerComponentPath, "utf-8");

  assert(
    layoutContent.includes("© 2026 MBBS Foundation™. All rights reserved."),
    "Global footer includes '© 2026 MBBS Foundation™. All rights reserved.'"
  );
  assert(
    layoutContent.includes("MBBS Foundation™ is a trademark-applied brand."),
    "Global footer includes 'MBBS Foundation™ is a trademark-applied brand.'"
  );
  assert(
    plannerCompContent.includes("COPYRIGHT & DATA NOTICE") || plannerCompContent.includes("Copyright & Data Notice"),
    "Planner includes Copyright & Data Notice"
  );
  assert(
    plannerCompContent.includes("© 2026 MBBS Foundation™. All rights reserved."),
    "Planner disclaimer includes '© 2026 MBBS Foundation™. All rights reserved.'"
  );
  const normalizedCompContent = plannerCompContent.replace(/\s+/g, " ");
  assert(
    normalizedCompContent.includes("not affiliated with or endorsed by MCC, NMC, NEET-UG"),
    "Planner disclaimer includes non-affiliation statement"
  );

  // Ensure no false registered trademark claim (®) exists across codebase
  const hasRegisteredMark = layoutContent.includes("MBBS Foundation®") || plannerCompContent.includes("MBBS Foundation®");
  assert(!hasRegisteredMark, "Zero false trademark claims (no 'MBBS Foundation®' used, strictly '™')");

  // -------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------
  console.log("\n==================================================================");
  console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log("==================================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test execution failed with error:", err);
  process.exit(1);
});
