import { prisma } from "../lib/prisma";
import fs from "fs";
import path from "path";
import { COOKIE_NAME, ADMIN_PASSWORD, verifyAdminToken, createAdminToken } from "../lib/adminAuth";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`  ❌ [FAIL] ${message}`);
    process.exit(1);
  }
  console.log(`  ✓ [PASS] ${message}`);
}

async function runAdminShellTests() {
  console.log("================================================================================");
  console.log("STEP 3B — UNIFIED ADMIN PORTAL SHELL & NAVIGATION TEST SUITE");
  console.log("================================================================================\n");

  // --------------------------------------------------------------------------
  // TEST GROUP 1: Route & File Existence
  // --------------------------------------------------------------------------
  console.log("--- TEST GROUP 1: Route & Component Existence ---");
  const adminPagePath = path.join(process.cwd(), "app/admin/page.tsx");
  assert(fs.existsSync(adminPagePath), "Admin Home page exists at app/admin/page.tsx");

  const adminHeaderPath = path.join(process.cwd(), "components/admin/AdminHeader.tsx");
  assert(fs.existsSync(adminHeaderPath), "AdminHeader component exists at components/admin/AdminHeader.tsx");

  // Verify /admin/cpr/verifications route created in Step 4
  const verifPagePath = path.join(process.cwd(), "app/admin/cpr/verifications/page.tsx");
  assert(fs.existsSync(verifPagePath), "Verification Inbox route exists at app/admin/cpr/verifications/page.tsx");

  // --------------------------------------------------------------------------
  // TEST GROUP 2: Admin Home Structure & Surfaced Modules
  // --------------------------------------------------------------------------
  console.log("\n--- TEST GROUP 2: Admin Home Structure & Surfaced Modules ---");
  const adminPageContent = fs.readFileSync(adminPagePath, "utf8");

  // Sibling Programme Areas
  assert(adminPageContent.includes("CPR Sanjeevani"), "Admin Home contains CPR Sanjeevani card");
  assert(adminPageContent.includes("MBBS Foundation"), "Admin Home contains MBBS Foundation card");
  assert(adminPageContent.includes("Data & Exports") || adminPageContent.includes("Data &amp; Exports"), "Admin Home contains Data & Exports card");
  assert(adminPageContent.includes("System & Admin Tools") || adminPageContent.includes("System &amp; Admin Tools"), "Admin Home contains System & Admin Tools card");

  // Subtitle
  assert(adminPageContent.includes("Ayurvigyan / MBBS Foundation Operational Console"), "Admin Home displays locked console subtitle");

  // Links resolve to existing routes without route moves
  assert(adminPageContent.includes('href="/cprsanjeevani"'), "Links to Certificate Search (/cprsanjeevani)");
  assert(adminPageContent.includes('href="/cprsanjeevani/generate"'), "Links to Certificate Generator & Reports (/cprsanjeevani/generate)");
  assert(adminPageContent.includes('href="/admin/cpr/verifications"'), "Links to Verification Inbox (/admin/cpr/verifications)");
  assert(adminPageContent.includes('href="/admin/mbbs-foundation/consultation"'), "Links to Consultation Dashboard (/admin/mbbs-foundation/consultation)");

  // Export URLs
  assert(adminPageContent.includes('href="/api/admin/mbbs-foundation/consultation/export"'), "Surfaces Professional Consultation CSV export endpoint");
  assert(adminPageContent.includes('href="/api/admin/mbbs-foundation/consultation/student-voice/export"'), "Surfaces Student Voice CSV export endpoint");

  // --------------------------------------------------------------------------
  // TEST GROUP 3: Authentication & Security Integrity
  // --------------------------------------------------------------------------
  console.log("\n--- TEST GROUP 3: Authentication & Security Integrity ---");
  assert(COOKIE_NAME === "sanjeevani_admin_token", `Admin cookie identifier is preserved (got: ${COOKIE_NAME})`);
  assert(Boolean(ADMIN_PASSWORD), "Admin password is defined");

  // Verify HMAC signed token creation and verification
  const testToken = createAdminToken();
  assert(Boolean(testToken), "Generated valid HMAC signed admin token");
  assert(verifyAdminToken(testToken) === true, "Token verifies correctly");
  assert(verifyAdminToken("invalid-tampered-token") === false, "Tampered token is rejected");

  // Verify auth endpoint
  const authRoutePath = path.join(process.cwd(), "app/api/cprsanjeevani/auth/route.ts");
  const authRouteContent = fs.readFileSync(authRoutePath, "utf8");
  assert(authRouteContent.includes("createAdminToken"), "Auth route uses existing createAdminToken helper");
  assert(authRouteContent.includes("clearAdminCookie"), "Auth route uses existing clearAdminCookie helper");

  // Verify Admin Home uses existing /api/cprsanjeevani/auth endpoint
  assert(adminPageContent.includes('fetch("/api/cprsanjeevani/auth"'), "Admin Home uses /api/cprsanjeevani/auth for authentication");

  // --------------------------------------------------------------------------
  // TEST GROUP 4: Shared Navigation Integration on Existing Admin Pages
  // --------------------------------------------------------------------------
  console.log("\n--- TEST GROUP 4: Shared Navigation on Existing Admin Pages ---");

  // 1. Consultation Admin Page
  const consultAdminPath = path.join(process.cwd(), "app/admin/mbbs-foundation/consultation/page.tsx");
  const consultAdminContent = fs.readFileSync(consultAdminPath, "utf8");
  assert(consultAdminContent.includes("<AdminHeader"), "Consultation admin page renders AdminHeader");
  assert(consultAdminContent.includes('activeSurveyTab === "survey1"'), "Consultation admin preserves Professional Consultation tab");
  assert(consultAdminContent.includes('activeSurveyTab === "survey2"'), "Consultation admin preserves Student & Intern Voice tab");

  // 2. CPR Sanjeevani Generate Page
  const cprGenPath = path.join(process.cwd(), "app/cprsanjeevani/generate/page.tsx");
  const cprGenContent = fs.readFileSync(cprGenPath, "utf8");
  assert(cprGenContent.includes("<AdminHeader"), "CPR Sanjeevani generate page renders AdminHeader");
  assert(cprGenContent.includes('adminMode === "batch"'), "CPR Sanjeevani generate preserves Batch tab");
  assert(cprGenContent.includes('adminMode === "individual"'), "CPR Sanjeevani generate preserves Individual tab");
  assert(cprGenContent.includes('adminMode === "reports"'), "CPR Sanjeevani generate preserves Reports tab");

  // 3. CPR Sanjeevani Search Page
  const cprSearchPath = path.join(process.cwd(), "app/cprsanjeevani/page.tsx");
  const cprSearchContent = fs.readFileSync(cprSearchPath, "utf8");
  assert(cprSearchContent.includes("<AdminHeader"), "CPR Sanjeevani search page renders AdminHeader");
  assert(cprSearchContent.includes("activePortalFilter"), "CPR Sanjeevani search preserves category filter tabs");

  // --------------------------------------------------------------------------
  // TEST GROUP 5: Course Coordinator Isolation
  // --------------------------------------------------------------------------
  console.log("\n--- TEST GROUP 5: Course Coordinator Isolation ---");
  const adminHeaderContent = fs.readFileSync(adminHeaderPath, "utf8");
  assert(!adminHeaderContent.includes("/cprday/my-venues"), "AdminHeader does NOT include coordinator private portal routes");
  assert(!adminHeaderContent.includes("/cprday/login"), "AdminHeader does NOT merge coordinator login");

  // --------------------------------------------------------------------------
  // TEST GROUP 6: Frozen CPR Totals & Invariant Verification
  // --------------------------------------------------------------------------
  console.log("\n--- TEST GROUP 6: Frozen CPR Totals & Invariants ---");
  const snapshotPath = path.join(process.cwd(), "data/cpr_census_draft_v1_snapshot.json");
  const snapshot = JSON.parse(fs.readFileSync(snapshotPath, "utf8"));
  assert(snapshot.nationalTotals.currentDraftCourses === 395, "Snapshot draft courses = 395");
  assert(snapshot.nationalTotals.currentDraftPhysicalVenues === 292, "Snapshot draft venues = 292");
  assert(snapshot.nationalTotals.draftReconciledParticipantsTrained === 47033, "Snapshot draft trained = 47,033");
  assert(snapshot.nationalTotals.participantsCertified === 33477, "Snapshot certified = 33,477");

  console.log("\n================================================================================");
  console.log("🎉 ALL STEP 3B ADMIN SHELL TESTS PASSED (100%)!");
  console.log("================================================================================");
}

runAdminShellTests()
  .catch((e) => {
    console.error("❌ Admin shell test suite failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
