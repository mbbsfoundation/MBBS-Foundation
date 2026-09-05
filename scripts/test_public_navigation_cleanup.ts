import fs from "fs";
import path from "path";
import { getCPRDayReconciliationReport } from "../lib/cprReporting";
import { getLockedCensusStateList } from "../lib/cprStateCensus";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ [FAIL] ${message}`);
    throw new Error(message);
  }
  console.log(`  ✓ [PASS] ${message}`);
}

async function runPublicNavigationCleanupTestSuite() {
  console.log("\n" + "=".repeat(80));
  console.log("PUBLIC NAVIGATION CLEANUP TEST SUITE");
  console.log("=".repeat(80) + "\n");

  let passedTests = 0;

  // -------------------------------------------------------------------------
  // TEST GROUP 1: Public Header & Mobile Navigation Audit
  // -------------------------------------------------------------------------
  console.log("--- TEST GROUP 1: Public SiteHeader Audit ---");
  const siteHeaderPath = path.join(process.cwd(), "components", "SiteHeader.tsx");
  assert(fs.existsSync(siteHeaderPath), "SiteHeader.tsx exists");
  const siteHeaderContent = fs.readFileSync(siteHeaderPath, "utf-8");

  assert(
    !siteHeaderContent.includes("Sanjeevani Certificates"),
    "SiteHeader no longer contains 'Sanjeevani Certificates'"
  );
  assert(
    !siteHeaderContent.includes('href: "/cprsanjeevani"'),
    "NAV_ITEMS no longer contains /cprsanjeevani"
  );
  assert(
    siteHeaderContent.includes('{ label: "CPR Day", href: "/cprday" }'),
    "SiteHeader preserves 'CPR Day' pointing to /cprday"
  );
  assert(
    siteHeaderContent.includes('{ label: "Consultation", href: "/mbbs-foundation/consultation" }'),
    "SiteHeader preserves 'Consultation' link"
  );
  assert(
    !siteHeaderContent.includes("special: \"cpr\""),
    "Special CPR header styling cleanly removed"
  );
  passedTests += 6;

  // -------------------------------------------------------------------------
  // TEST GROUP 2: Corrected Public Certificate CTA
  // -------------------------------------------------------------------------
  console.log("\n--- TEST GROUP 2: NEET to MBBS After-Admission Public Link Audit ---");
  const afterAdmissionPath = path.join(
    process.cwd(),
    "app",
    "neet-to-mbbs",
    "after-admission",
    "page.tsx"
  );
  assert(fs.existsSync(afterAdmissionPath), "after-admission page exists");
  const afterAdmissionContent = fs.readFileSync(afterAdmissionPath, "utf-8");

  assert(
    afterAdmissionContent.includes('href="/cprday#certificate-access"'),
    "Verify CPR Certificates CTA points to /cprday#certificate-access"
  );
  assert(
    afterAdmissionContent.includes("Verify CPR Certificates"),
    "Wording 'Verify CPR Certificates' preserved"
  );
  passedTests += 3;

  // -------------------------------------------------------------------------
  // TEST GROUP 3: Discreet Footer Admin Portal Link
  // -------------------------------------------------------------------------
  console.log("\n--- TEST GROUP 3: Global Footer Admin Link Audit ---");
  const layoutPath = path.join(process.cwd(), "app", "layout.tsx");
  assert(fs.existsSync(layoutPath), "layout.tsx exists");
  const layoutContent = fs.readFileSync(layoutPath, "utf-8");

  assert(
    layoutContent.includes('href="/admin"'),
    "Global layout footer contains link to /admin"
  );
  assert(
    layoutContent.includes("Admin Portal"),
    "Footer link text is 'Admin Portal'"
  );
  passedTests += 3;

  // -------------------------------------------------------------------------
  // TEST GROUP 4: Public Certificate Retrieval Preservation
  // -------------------------------------------------------------------------
  console.log("\n--- TEST GROUP 4: Public Certificate Access Preservation ---");
  const cprDayPath = path.join(process.cwd(), "app", "cprday", "page.tsx");
  assert(fs.existsSync(cprDayPath), "app/cprday/page.tsx exists");
  const cprDayContent = fs.readFileSync(cprDayPath, "utf-8");
  assert(
    cprDayContent.includes("<CertificateAccessSection />") ||
    cprDayContent.includes("<CertificateAccessSection"),
    "cprday page renders CertificateAccessSection"
  );

  const certAccessSectionPath = path.join(
    process.cwd(),
    "components",
    "cprday",
    "CertificateAccessSection.tsx"
  );
  assert(fs.existsSync(certAccessSectionPath), "CertificateAccessSection.tsx exists");

  const certApiPath = path.join(process.cwd(), "app", "api", "cprday", "certificates", "route.ts");
  assert(fs.existsSync(certApiPath), "Public API app/api/cprday/certificates/route.ts exists");
  passedTests += 4;

  // -------------------------------------------------------------------------
  // TEST GROUP 5: Master Admin Internal Routes & Linkage Preservation
  // -------------------------------------------------------------------------
  console.log("\n--- TEST GROUP 5: Internal Admin Routes Preservation ---");
  const cprSanjeevaniPath = path.join(process.cwd(), "app", "cprsanjeevani", "page.tsx");
  assert(fs.existsSync(cprSanjeevaniPath), "Internal admin search route app/cprsanjeevani/page.tsx exists");

  const adminHomePagePath = path.join(process.cwd(), "app", "admin", "page.tsx");
  assert(fs.existsSync(adminHomePagePath), "Admin Home page exists at app/admin/page.tsx");
  const adminHomeContent = fs.readFileSync(adminHomePagePath, "utf-8");

  assert(
    adminHomeContent.includes('href="/cprsanjeevani"'),
    "Admin Home links internally to /cprsanjeevani (Master Search)"
  );
  assert(
    adminHomeContent.includes('href="/cprsanjeevani/generate"'),
    "Admin Home links internally to /cprsanjeevani/generate (Generator)"
  );
  assert(
    adminHomeContent.includes('href="/admin/cpr/verifications"'),
    "Admin Home links internally to /admin/cpr/verifications (Verification Inbox)"
  );
  assert(
    adminHomeContent.includes('href="/admin/mbbs-foundation/consultation"'),
    "Admin Home links internally to /admin/mbbs-foundation/consultation"
  );
  passedTests += 6;

  // -------------------------------------------------------------------------
  // TEST GROUP 6: Frozen CPR Totals & Invariants Preservation
  // -------------------------------------------------------------------------
  console.log("\n--- TEST GROUP 6: Frozen CPR Totals & Invariant Verification ---");
  const lockedStates = getLockedCensusStateList();
  assert(lockedStates.length === 28, "Authoritative 28 States & UTs preserved");

  let totalDraftCourses = 0;
  let totalDraftTrained = 0;
  let totalDraftCertified = 0;

  for (const s of lockedStates) {
    const report = getCPRDayReconciliationReport(s.canonicalState);
    assert(report !== null, `Reconciliation report for ${s.canonicalState} loaded`);
    totalDraftCourses += report!.summary.reconciledReport.coursesConducted;
    totalDraftTrained += report!.summary.reconciledReport.participantsTrained;
    totalDraftCertified += report!.summary.liveData.participantCertificatesFound;
  }

  assert(totalDraftCourses === 395, `Draft Courses invariant = 395 (got: ${totalDraftCourses})`);
  assert(totalDraftTrained === 47033, `Draft Reconciled Trained invariant = 47,033 (got: ${totalDraftTrained})`);
  assert(totalDraftCertified === 33477, `Draft Certified invariant = 33,477 (got: ${totalDraftCertified})`);
  passedTests += 32;

  console.log("\n" + "=".repeat(80));
  console.log(`PUBLIC NAVIGATION CLEANUP TEST SUITE RESULT: ${passedTests} / ${passedTests} PASSED (100%)`);
  console.log("=".repeat(80) + "\n");
}

runPublicNavigationCleanupTestSuite().catch((err) => {
  console.error("Test suite failed:", err);
  process.exit(1);
});
