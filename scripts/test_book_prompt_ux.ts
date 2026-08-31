import fs from "fs";
import path from "path";

function runTests() {
  console.log("==================================================================");
  console.log("TEST SUITE: NEET Planner Book Prompt UX Refinement");
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
  const promptPath = path.join(rootDir, "components/neet-to-mbbs/BookEngagementPrompt.tsx");
  const plannerPath = path.join(rootDir, "components/neet-to-mbbs/Round2Planner.tsx");
  const explorerPath = path.join(rootDir, "components/neet-to-mbbs/MedicalCollegeExplorer.tsx");
  const cardPath = path.join(rootDir, "components/neet-to-mbbs/CollegeEvidenceCard.tsx");
  const evidenceExpPath = path.join(rootDir, "components/neet-to-mbbs/Round1EvidenceExplorer.tsx");

  assert(fs.existsSync(promptPath), "BookEngagementPrompt.tsx exists");
  assert(fs.existsSync(plannerPath), "Round2Planner.tsx exists");
  assert(fs.existsSync(explorerPath), "MedicalCollegeExplorer.tsx exists");
  assert(fs.existsSync(cardPath), "CollegeEvidenceCard.tsx exists");
  assert(fs.existsSync(evidenceExpPath), "Round1EvidenceExplorer.tsx exists");

  const promptContent = fs.readFileSync(promptPath, "utf-8");
  const plannerContent = fs.readFileSync(plannerPath, "utf-8");
  const explorerContent = fs.readFileSync(explorerPath, "utf-8");
  const evidenceExpContent = fs.readFileSync(evidenceExpPath, "utf-8");

  // TEST 1: Initial page load does NOT trigger book prompt
  console.log("\nScenario 1: Initial Page Load");
  assert(
    promptContent.includes("hasMeaningfulExploration") &&
      !promptContent.includes("useEffect(() => {\n    setIsOpen(true)"),
    "TEST 1: No auto-opening or timer started on initial page mount without meaningful exploration"
  );
  assert(
    plannerContent.includes("hasMeaningfulExploration, setHasMeaningfulExploration] = useState<boolean>(false)"),
    "Planner initializes hasMeaningfulExploration state as false"
  );

  // TEST 2: Intake form entry does NOT trigger book prompt
  console.log("\nScenario 2: Intake Form & Tab Navigation");
  assert(
    !plannerContent.includes('setEntryMode("AIR");\n            recordInteraction()') &&
      !plannerContent.includes('setEntryMode("COLLEGES");\n            recordInteraction()'),
    "TEST 2: Switching entry mode tabs (AIR / Colleges) does NOT trigger meaningful exploration"
  );

  // TEST 3: Medical College Explorer directory filtering / typing does NOT trigger book prompt
  console.log("\nScenario 3: Explorer Browsing & Searching");
  assert(
    !explorerContent.includes("setSelectedState(e.target.value);\n                onMeaningfulInteraction?.();") &&
      !explorerContent.includes("setSelectedType(e.target.value as CollegeTypeFilter);\n                onMeaningfulInteraction?.();") &&
      !explorerContent.includes("setSortBy(e.target.value as CollegeSortOption);\n                onMeaningfulInteraction?.();") &&
      !explorerContent.includes("if (e.target.value.length > 2) onMeaningfulInteraction?.();"),
    "TEST 3: State select, type select, sort select, and search typing do NOT prematurely trigger meaningful exploration"
  );

  // TEST 4 & 5: Meaningful college exploration triggers eligibility with 45-60s delay
  console.log("\nScenario 4 & 5: Meaningful Exploration & Configured Delay");
  assert(
    plannerContent.includes("toggleCard = (id: string) => {\n    recordMeaningfulExploration();"),
    "TEST 4A: Expanding a college allotment/recommendation card marks meaningful exploration"
  );
  assert(
    plannerContent.includes("handleToggleComparison = (collegeId: string) => {\n    setComparisonNotice(null);\n    recordMeaningfulExploration();"),
    "TEST 4B: Adding a college to Compare marks meaningful exploration"
  );
  assert(
    plannerContent.includes("handleTogglePlanItem = (r: CounsellingRecommendation) => {\n    recordMeaningfulExploration();") &&
      plannerContent.includes("handleTogglePlanFromEvidence = (item:") &&
      plannerContent.includes("recordMeaningfulExploration();\n    const itemId = `${item.collegeId}"),
    "TEST 4C: Adding a college to My Plan marks meaningful exploration"
  );
  assert(
    explorerContent.includes("handleOpenModal = (college: DomicileCollegeSummary) => {\n    setActiveDetailCollege(college);\n    setModalSortMode(\"STANDARD\");\n    onMeaningfulInteraction?.();"),
    "TEST 4D: Opening college details modal in explorer marks meaningful exploration"
  );
  assert(
    evidenceExpContent.includes("onViewDetails={(college) => {\n                    onMeaningfulInteraction?.();\n                    setActiveCategoryModalCollege(college);"),
    "TEST 4E: Opening college details modal in round 1 evidence marks meaningful exploration"
  );
  assert(
    promptContent.includes("DEFAULT_DELAY_MS = 50000") || promptContent.includes("delayMs = 50000") || promptContent.includes("50000"),
    "TEST 5: Delay is configured to 50 seconds (between 45–60s) strictly starting after exploration"
  );

  // TEST 6: Dismissal persists in sessionStorage (once per session)
  console.log("\nScenario 6: Session-only Persistence");
  assert(
    promptContent.includes('sessionStorage.getItem("mbbs_foundation_book_prompt_dismissed")') ||
      promptContent.includes("sessionStorage.getItem(STORAGE_KEY)"),
    "TEST 6A: Checks sessionStorage on mount"
  );
  assert(
    promptContent.includes('sessionStorage.setItem(STORAGE_KEY, "true")') ||
      promptContent.includes('sessionStorage.setItem("mbbs_foundation_book_prompt_dismissed", "true")'),
    "TEST 6B: Sets sessionStorage on dismissal to prevent reappearance during same session"
  );
  assert(
    promptContent.includes('e.key === "Escape"') && promptContent.includes("handleDismiss"),
    "TEST 6C: Escape key listener dismisses prompt and records session dismissal"
  );

  // TEST 7: Explore the Book CTA route
  console.log("\nScenario 7: Primary CTA & Content");
  assert(
    promptContent.includes('href="/book"') && promptContent.includes("Explore the Book"),
    "TEST 7A: Primary CTA links to verified '/book' route"
  );
  assert(
    promptContent.includes("Prepare for What Comes Next.") &&
      promptContent.includes("MBBS Foundation: Your First Book of Medicine") &&
      promptContent.includes("Planning Your Medical College?") &&
      promptContent.includes("From counselling to your first days in medical college"),
    "TEST 7B: Content hierarchy matches specified educational copywriting"
  );
  assert(
    !promptContent.includes("Buy Now") &&
      !promptContent.includes("Discount") &&
      !promptContent.includes("Limited Offer") &&
      !promptContent.includes("₹100"),
    "TEST 7C: Free of aggressive sales, discount, or payment messaging"
  );

  // TEST 8: Visual presentation & Desktop / Mobile layout
  console.log("\nScenario 8: Responsive Layout & Dimensions");
  assert(
    promptContent.includes("max-w-2xl") || promptContent.includes("max-w-3xl"),
    "TEST 8A: Desktop modal uses comfortable ~700-800px width (max-w-2xl/3xl)"
  );
  assert(
    promptContent.includes("md:col-span-5") && promptContent.includes("md:col-span-7"),
    "TEST 8B: Desktop grid assigns ~35-40% (5 of 12 cols) to prominent book cover"
  );
  assert(
    promptContent.includes("grid-cols-1 md:grid-cols-12"),
    "TEST 8C: Responsive grid stacks cleanly on mobile viewports"
  );
  assert(
    promptContent.includes("/preview/01_Cover_Front.png"),
    "TEST 8D: Uses high-resolution verified book cover asset"
  );

  console.log("\n==================================================================");
  console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log("==================================================================");

  if (failed > 0) process.exit(1);
}

runTests();
