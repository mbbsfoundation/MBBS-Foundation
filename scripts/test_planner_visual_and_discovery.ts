import "dotenv/config";
import fs from "fs";
import path from "path";

async function runTests() {
  console.log("==================================================================");
  console.log("SEQUENCE 9G.1 TEST SUITE: Visual Hierarchy & Consolidated Bottom");
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
  // Test Group 1: Navigation & Breadcrumb Labeling
  // -------------------------------------------------------------
  console.log("Test Group 1: Navigation & Breadcrumb Labeling");
  const subNavPath = path.join(rootDir, "components/neet-to-mbbs/NeetSubNav.tsx");
  const subNavContent = fs.readFileSync(subNavPath, "utf-8");
  assert(
    subNavContent.includes('label: "NEET Counselling Planner"'),
    "NeetSubNav uses 'NEET Counselling Planner' as navigation label"
  );
  assert(
    !subNavContent.includes('label: "R2 Planner 🎯"'),
    "NeetSubNav removes old 'R2 Planner 🎯' label"
  );
  assert(
    subNavContent.includes("isPlanner"),
    "NeetSubNav contains dedicated isPlanner visual styling flag for prominent accent"
  );

  const pagePath = path.join(rootDir, "app/neet-to-mbbs/counselling/round-2-planner/page.tsx");
  const pageContent = fs.readFileSync(pagePath, "utf-8");
  assert(
    pageContent.includes('<span className="text-slate-900 font-bold">NEET Counselling Planner</span>'),
    "Page breadcrumb uses 'NEET Counselling Planner'"
  );
  assert(
    !pageContent.includes('<span className="text-slate-900 font-bold">Round-2 Planner</span>'),
    "Page breadcrumb removes old 'Round-2 Planner'"
  );

  // -------------------------------------------------------------
  // Test Group 2: Top Clean Hierarchy & Yellow Box Removal
  // -------------------------------------------------------------
  console.log("\nTest Group 2: Top Clean Hierarchy & Yellow Box Removal");
  assert(
    !pageContent.includes("<VerificationNotice"),
    "Top yellow box / VerificationNotice removed from top of page.tsx"
  );
  assert(
    pageContent.includes("<Round2Planner />"),
    "Page immediately mounts Round2Planner directly after Breadcrumb"
  );

  // -------------------------------------------------------------
  // Test Group 3: Compact Hero & Clean Status Indicators
  // -------------------------------------------------------------
  console.log("\nTest Group 3: Compact Hero & Clean Status Indicators");
  const plannerPath = path.join(rootDir, "components/neet-to-mbbs/Round2Planner.tsx");
  const plannerContent = fs.readFileSync(plannerPath, "utf-8");
  assert(
    plannerContent.includes("NEET 2026 • Counselling Decision Support"),
    "Hero contains compact decision-support badge"
  );
  assert(
    plannerContent.includes("NEET-UG 2026 Counselling Planner"),
    "Hero title is 'NEET-UG 2026 Counselling Planner'"
  );
  assert(
    plannerContent.includes("MCC Round-1 Evidence Available"),
    "Hero includes clear 'MCC Round-1 Evidence Available' status indicator"
  );
  assert(
    plannerContent.includes("Official Round-2 Vacancy: Awaiting Release"),
    "Hero includes clear 'Official Round-2 Vacancy: Awaiting Release' status indicator"
  );
  assert(
    !plannerContent.includes("State seats mapped — rank data awaited"),
    "Hero removes confusing 'State seats mapped — rank data awaited' badge from main banner"
  );

  // -------------------------------------------------------------
  // Test Group 4: Prominent Entry Radio-Cards
  // -------------------------------------------------------------
  console.log("\nTest Group 4: Prominent Entry Radio-Cards");
  assert(
    plannerContent.includes("EXPLORE BY AIR") && plannerContent.includes("I Have An AIR"),
    "Explore by AIR entry card present with clear title and subtitle"
  );
  assert(
    plannerContent.includes("EXPLORE MEDICAL COLLEGES") && plannerContent.includes("I Want To Explore Colleges"),
    "Explore Medical Colleges entry card present with clear title and subtitle"
  );
  assert(
    plannerContent.includes("grid-cols-1 md:grid-cols-2"),
    "Entry cards layout is side-by-side on desktop and stacked on mobile"
  );
  assert(
    plannerContent.includes("border-blue-600 shadow-md") && plannerContent.includes("border-indigo-600 shadow-md"),
    "Entry cards include distinct active border and accent styles"
  );

  // -------------------------------------------------------------
  // Test Group 5: Medical College Explorer Hierarchy & Terminology
  // -------------------------------------------------------------
  console.log("\nTest Group 5: Medical College Explorer Hierarchy & Terminology");
  const explorerPath = path.join(rootDir, "components/neet-to-mbbs/MedicalCollegeExplorer.tsx");
  const explorerContent = fs.readFileSync(explorerPath, "utf-8");
  assert(
    explorerContent.includes("Explore Medical Colleges & Round-1 AIR Patterns"),
    "Directory heading uses 'Round-1 AIR Patterns' rather than 'Cutoff Patterns'"
  );
  assert(
    explorerContent.includes("actual category-wise AIR patterns"),
    "Directory description uses 'actual category-wise AIR patterns'"
  );
  assert(
    !explorerContent.includes("rank cutoffs"),
    "Directory removes legacy 'rank cutoffs' terminology"
  );

  // Filter Order Check: State -> College Type -> Sort By should be in Primary Row
  const stateIndex = explorerContent.indexOf('id="college-state-select"');
  const typeIndex = explorerContent.indexOf('id="college-type-select"');
  const sortIndex = explorerContent.indexOf('id="college-sort-select"');
  const searchIndex = explorerContent.indexOf('id="college-search-input"');

  assert(stateIndex > 0 && typeIndex > 0 && sortIndex > 0 && searchIndex > 0, "All 4 filter controls are present");
  assert(
    stateIndex < typeIndex && typeIndex < sortIndex && sortIndex < searchIndex,
    "Filter order is strictly: State -> College Type -> Sort By in primary row, followed by Optional Search"
  );

  // -------------------------------------------------------------
  // Test Group 6: College Card Semantic Light Tints & Primary Metric
  // -------------------------------------------------------------
  console.log("\nTest Group 6: College Card Semantic Light Tints & Primary Metric");
  const sharedCardPath = path.join(rootDir, "components/neet-to-mbbs/CollegeEvidenceCard.tsx");
  const sharedCardContent = fs.readFileSync(sharedCardPath, "utf-8");

  assert(
    sharedCardContent.includes("from-emerald-50/30") && sharedCardContent.includes("border-emerald-200/80"),
    "Government college cards receive subtle mint/emerald tint"
  );
  assert(
    sharedCardContent.includes("from-indigo-50/35") && sharedCardContent.includes("border-indigo-200/80"),
    "INI college cards receive subtle indigo tint"
  );
  assert(
    sharedCardContent.includes("from-purple-50/35") && sharedCardContent.includes("border-purple-200/80"),
    "Deemed college cards receive subtle purple/lavender tint"
  );
  assert(
    sharedCardContent.includes("from-amber-50/25") && sharedCardContent.includes("border-amber-200/70"),
    "Private college cards receive subtle warm neutral/amber tint"
  );
  assert(
    sharedCardContent.includes("Typical (Median) AIR"),
    "Primary Open Benchmark Typical (Median) AIR metric is preserved"
  );

  // -------------------------------------------------------------
  // Test Group 7: MBBS Foundation Book Discovery Card
  // -------------------------------------------------------------
  console.log("\nTest Group 7: MBBS Foundation Book Discovery Card");
  const bookCardPath = path.join(rootDir, "components/neet-to-mbbs/BookDiscoveryCard.tsx");
  assert(fs.existsSync(bookCardPath), "BookDiscoveryCard component exists");
  const bookCardContent = fs.readFileSync(bookCardPath, "utf-8");
  assert(
    bookCardContent.includes("MBBS Foundation: Your First Book of Medicine"),
    "Book discovery card features 'MBBS Foundation: Your First Book of Medicine'"
  );
  assert(
    bookCardContent.includes('href="/book"'),
    "Book discovery card links to internal route '/book'"
  );
  assert(
    bookCardContent.includes("/preview/01_Cover_Front.png") || bookCardContent.includes("/book.png"),
    "Book discovery card uses verified existing book cover asset"
  );

  const promptPath = path.join(rootDir, "components/neet-to-mbbs/BookEngagementPrompt.tsx");
  assert(fs.existsSync(promptPath), "BookEngagementPrompt component exists");
  const promptContent = fs.readFileSync(promptPath, "utf-8");
  assert(
    promptContent.includes("sessionStorage"),
    "Book prompt utilizes sessionStorage for session-only persistence"
  );
  assert(
    promptContent.includes("hasMeaningfulExploration"),
    "Book prompt triggers only after meaningful exploration"
  );
  assert(
    promptContent.includes("Prepare for What Comes Next."),
    "Book prompt contains contextual headline 'Prepare for What Comes Next.'"
  );
  assert(
    promptContent.includes("MBBS Foundation: Your First Book of Medicine"),
    "Book prompt contains prominent title"
  );
  assert(
    promptContent.includes("Not Now"),
    "Book prompt includes clean 'Not Now' dismissal button"
  );

  // -------------------------------------------------------------
  // Test Group 8: Sequence 9G.1 Bottom Layout Sequence
  // -------------------------------------------------------------
  console.log("\nTest Group 8: Sequence 9G.1 Bottom Layout Sequence");
  const bookIndex = plannerContent.indexOf("<BookDiscoveryCard");
  const methodologyIndex = plannerContent.indexOf("How These Suggestions Are Generated");
  const disclaimerIndex = plannerContent.indexOf("Decision-Support & Official Verification");

  assert(bookIndex > 0 && methodologyIndex > 0 && disclaimerIndex > 0, "All 3 bottom sections exist in Round2Planner.tsx");
  assert(
    bookIndex < methodologyIndex,
    "Persistent Book Card is strictly placed ABOVE 'How These Suggestions Are Generated'"
  );
  assert(
    methodologyIndex < disclaimerIndex,
    "'How These Suggestions Are Generated' is strictly placed ABOVE the Consolidated Disclaimer"
  );

  // -------------------------------------------------------------
  // Test Group 9: Compact 3-Step Methodology & Consolidated Disclaimer
  // -------------------------------------------------------------
  console.log("\nTest Group 9: Compact 3-Step Methodology & Consolidated Disclaimer");
  assert(
    plannerContent.includes("1. Official Data") &&
      plannerContent.includes("2. Round-1 Evidence") &&
      plannerContent.includes("3. Decision Support"),
    "Methodology contains clean 3-step summary cards"
  );
  assert(
    plannerContent.includes("<details") &&
      plannerContent.includes("View Detailed Methodology & Statistical Architecture"),
    "Detailed methodology is enclosed in an expandable disclosure (<details>)"
  );
  assert(
    plannerContent.includes("AI-assisted analysis to organise and interpret counselling evidence"),
    "Consolidated disclaimer includes accurate AI-assisted analysis statement"
  );
  assert(
    plannerContent.includes("Before making or submitting counselling choices, always verify current seats"),
    "Consolidated disclaimer includes official verification instruction"
  );
  assert(
    plannerContent.includes("https://mcc.nic.in") && plannerContent.includes("MCC Official Portal"),
    "Consolidated disclaimer includes MCC Official Portal button"
  );
  assert(
    plannerContent.includes("https://www.nmc.org.in") && plannerContent.includes("NMC Official Portal"),
    "Consolidated disclaimer includes NMC Official Portal button"
  );

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
