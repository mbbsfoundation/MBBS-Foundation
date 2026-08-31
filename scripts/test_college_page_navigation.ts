import "dotenv/config";
import fs from "fs";
import path from "path";
import { prisma } from "../lib/prisma";
import { getCollegeEvidenceBySlug, searchMedicalCollegesEvidence } from "../lib/counselling/evidenceService";

async function runTests() {
  console.log("==================================================================");
  console.log("RUNNING AUTOMATED TESTS: COLLEGE PAGE DISCOVERABILITY & NAVIGATION");
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

  // 1. Audit Round1EvidenceExplorer.tsx
  const r1Path = path.join(process.cwd(), "components/neet-to-mbbs/Round1EvidenceExplorer.tsx");
  const r1Content = fs.readFileSync(r1Path, "utf-8");

  assert(r1Content.includes("View College Page"), "1. Round1EvidenceExplorer modal contains 'View College Page'");
  assert(r1Content.includes("activeCategoryModalCollege.slug"), "2. Uses activeCategoryModalCollege.slug (verified DB slug)");
  assert(r1Content.includes("/neet-to-mbbs/colleges/${activeCategoryModalCollege.slug}/counselling-2026"), "3. Navigates to canonical /neet-to-mbbs/colleges/[slug]/counselling-2026");
  assert(!r1Content.includes("toLowerCase().replace"), "4. Does NOT derive URLs via name string manipulation");
  assert(!r1Content.includes("ShareCollegeButton"), "5. Does NOT duplicate ShareCollegeButton inside modal");
  assert(r1Content.includes("Close"), "6. Close button is preserved in modal footer");

  // 2. Audit MedicalCollegeExplorer.tsx
  const mcePath = path.join(process.cwd(), "components/neet-to-mbbs/MedicalCollegeExplorer.tsx");
  const mceContent = fs.readFileSync(mcePath, "utf-8");

  assert(mceContent.includes("View College Page"), "7. MedicalCollegeExplorer modal contains 'View College Page'");
  assert(mceContent.includes("activeDetailCollege.slug"), "8. Uses activeDetailCollege.slug (verified DB slug)");
  assert(mceContent.includes("/neet-to-mbbs/colleges/${activeDetailCollege.slug}/counselling-2026"), "9. Navigates to canonical /neet-to-mbbs/colleges/[slug]/counselling-2026");
  assert(!mceContent.includes("toLowerCase().replace"), "10. Does NOT derive URLs via name string manipulation");
  assert(!mceContent.includes("ShareCollegeButton"), "11. Does NOT duplicate ShareCollegeButton inside modal");
  assert(mceContent.includes("Close"), "12. Close button is preserved in modal footer");

  // 3. Test Verified Slugs in Database
  console.log("\n[TEST GROUP 2] College Slugs and Standalone Route Resolution");

  const testColleges = [
    { name: "SMS Medical College, Jaipur", search: "SMS Medical College" },
    { name: "AIIMS Rishikesh", search: "Rishikesh" },
    { name: "AIIMS Jodhpur", search: "aiims-rajasthan" },
    { name: "Kasturba Medical College, Manipal", search: "kasturba-medical-college-manipal" },
    { name: "MGIMS Wardha", search: "Mahatma Gandhi Institute of Medical Sciences" },
  ];

  for (const tc of testColleges) {
    const col = await prisma.college.findFirst({
      where: {
        OR: [
          { slug: tc.search },
          { collegeName: { contains: tc.search } },
        ],
        isActive: true,
      },
    });

    assert(col !== null, `13. College '${tc.name}' found in database`);
    if (col) {
      assert(Boolean(col.slug) && col.slug.length > 3, `14. College '${tc.name}' has valid slug: ${col.slug}`);
      const expectedUrl = `/neet-to-mbbs/colleges/${col.slug}/counselling-2026`;
      console.log(`     -> ${tc.name} standalone URL: ${expectedUrl}`);

      // Verify that getCollegeEvidenceBySlug resolves this slug
      const evidence = await getCollegeEvidenceBySlug(col.slug);
      assert(evidence !== null, `15. Evidence loaded cleanly for slug '${col.slug}'`);
    }
  }

  // 4. Test Search Colleges returns slug in DomicileCollegeSummary
  console.log("\n[TEST GROUP 3] Explorer Search Results Payload Verification");
  const searchResults = await searchMedicalCollegesEvidence({ query: "AIIMS", page: 1, pageSize: 5 });
  assert(searchResults.items.length > 0, "16. searchMedicalCollegesEvidence returns results");
  for (const c of searchResults.items) {
    assert(Boolean(c.slug) && typeof c.slug === "string", `17. Search result '${c.collegeName}' has slug: ${c.slug}`);
  }

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
