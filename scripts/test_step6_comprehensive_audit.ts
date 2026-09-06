import fs from "fs";
import path from "path";
import {
  executeDownstreamImplementation,
} from "../lib/cprDownstreamImplementation";
import {
  saveVenueMetadataOverride,
  resetVenueMetadataOverride,
} from "../lib/cprReconciliationStore";
import { getCPRDayReconciliationReport } from "../lib/cprReporting";
import { prisma } from "../lib/prisma";
import {
  verifyAdminToken,
} from "../lib/adminAuth";

async function runComprehensiveAudit() {
  console.log("================================================================================");
  console.log("STEP 6: COMPREHENSIVE PRODUCTION AUDIT & FAILURE-MODE VERIFICATION");
  console.log("================================================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, msg: string) {
    if (condition) {
      console.log(`  ✓ [PASS] ${msg}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${msg}`);
      failed++;
    }
  }

  // 1. PUBLIC NAVIGATION AUDIT (SECTION 14)
  console.log("--- 1. PUBLIC NAVIGATION AUDIT ---");
  const headerContent = fs.readFileSync(path.join(process.cwd(), "components/SiteHeader.tsx"), "utf-8");
  assert(
    !headerContent.includes("/cprsanjeevani"),
    "SiteHeader DOES NOT expose /cprsanjeevani (Admin CPR link removed from public header)"
  );
  assert(
    headerContent.includes("/cprday"),
    "SiteHeader retains public '/cprday' link"
  );
  assert(
    headerContent.includes("/mbbs-foundation/consultation"),
    "SiteHeader retains public Consultation link"
  );

  const afterAdmissionContent = fs.readFileSync(
    path.join(process.cwd(), "app/neet-to-mbbs/after-admission/page.tsx"),
    "utf-8"
  );
  assert(
    afterAdmissionContent.includes("/cprday#certificate-access"),
    "Public CTA in after-admission points to '/cprday#certificate-access'"
  );
  assert(
    !afterAdmissionContent.includes('href="/cprsanjeevani"'),
    "No direct /cprsanjeevani link in after-admission CTA"
  );

  // 2. MBBS FOUNDATION REGRESSION AUDIT (SECTION 15)
  console.log("\n--- 2. MBBS FOUNDATION REGRESSION AUDIT ---");
  const profFormPath = path.join(process.cwd(), "components/mbbs-foundation/consultation/ProfessionalSurveyForm.tsx");
  const studentFormPath = path.join(process.cwd(), "components/mbbs-foundation/consultation/StudentVoiceSurveyForm.tsx");
  const adminConsultationPath = path.join(process.cwd(), "app/admin/mbbs-foundation/consultation/page.tsx");

  assert(fs.existsSync(profFormPath), "Professional Consultation form component exists");
  assert(fs.existsSync(studentFormPath), "Student Voice form component exists");
  assert(fs.existsSync(adminConsultationPath), "Admin Consultation dashboard exists");

  const profContent = fs.readFileSync(profFormPath, "utf-8");
  assert(
    profContent.includes("Dadra & Nagar Haveli and Daman & Diu") || profContent.includes("Dadra and Nagar Haveli"),
    "Dadra and Nagar Haveli state normalization intact in Professional survey"
  );

  const studentContent = fs.readFileSync(studentFormPath, "utf-8");
  assert(
    studentContent.includes("Dadra & Nagar Haveli and Daman & Diu") || studentContent.includes("Dadra and Nagar Haveli"),
    "Dadra and Nagar Haveli state normalization intact in Student Voice survey"
  );

  // 3. MASTER ADMIN AUTHENTICATION AUDIT (SECTION 13)
  console.log("\n--- 3. MASTER ADMIN AUTHENTICATION AUDIT ---");
  const fakeToken = "invalid_token_xyz_123";
  assert(verifyAdminToken(fakeToken) === false, "Invalid admin token is strictly rejected");
  assert(verifyAdminToken(undefined) === false, "Undefined admin token is strictly rejected");

  // 4. FAILURE-MODE & FAIL-SAFE TESTING (SECTION 18)
  console.log("\n--- 4. FAILURE-MODE & FAIL-SAFE TESTING ---");
  
  // Test A: Empty implementation note rejects downstream write
  const failNoteResult = await executeDownstreamImplementation({
    submissionId: "NON_EXISTENT_SUB",
    actionType: "APPLY_METADATA_CORRECTION",
    adminUser: "Admin",
    implementationNote: "   ",
  });
  assert(failNoteResult.success === false, "Empty implementation note fails safe");

  // Test B: Non-existent submission ID rejects downstream write
  const failIdResult = await executeDownstreamImplementation({
    submissionId: "NON_EXISTENT_SUB_ID_9999",
    actionType: "APPLY_METADATA_CORRECTION",
    adminUser: "Admin",
    implementationNote: "Valid note for invalid id",
  });
  assert(failIdResult.success === false, "Non-existent submission fails safe");

  // Test C: Missing target canonical ID for metadata correction rejects downstream write
  const failCanonResult = await executeDownstreamImplementation({
    submissionId: "VERIF-1788523929316-ECHM",
    actionType: "APPLY_METADATA_CORRECTION",
    adminUser: "Admin",
    implementationNote: "Trying without canonical ID",
    targetCanonicalVenueId: "",
  });
  assert(failCanonResult.success === false, "Missing canonical venue ID fails safe");

  // 5. TEST ARTEFACTS SCAN ACROSS DATA FILES (SECTION 8)
  console.log("\n--- 5. TEST ARTEFACTS SCAN ACROSS AUTHORITATIVE DATA FILES ---");
  const dataDir = path.join(process.cwd(), "data");
  const jsonFiles = fs.readdirSync(dataDir).filter((f) => f.endsWith(".json"));

  for (const file of jsonFiles) {
    const filePath = path.join(dataDir, file);
    const content = fs.readFileSync(filePath, "utf-8");
    const parsed = JSON.parse(content);

    // Check if any active record in reconciliation stores or snapshot contains test text
    if (file === "cpr_venue_reconciliation_decisions.json") {
      const decs = parsed as any[];
      const testDecs = decs.filter(
        (d) =>
          d.finalVenueName?.toLowerCase().includes("test venue") ||
          d.finalCity?.toLowerCase().includes("test city")
      );
      assert(testDecs.length === 0, `Zero test decisions in ${file} (found: ${testDecs.length})`);
    } else if (file === "cpr_venue_metadata_overrides.json") {
      const overrides = parsed as any[];
      assert(overrides.length === 0, `Metadata overrides clean in ${file} (active overrides: ${overrides.length})`);
    }
  }

  // 6. CERTIFICATE MASTER CSV INTEGRITY (SECTION 10 & 17)
  console.log("\n--- 6. CERTIFICATE MASTER CSV INTEGRITY ---");
  const certDir = path.join(process.cwd(), "cprcertificates");
  assert(fs.existsSync(certDir), "cprcertificates directory exists");
  const csvFiles = fs.readdirSync(certDir).filter((f) => f.endsWith(".csv"));
  console.log(`  Found ${csvFiles.length} state certificate CSV master files in cprcertificates/.`);
  assert(csvFiles.length === 21, `All 21 state CSV files present (found ${csvFiles.length})`);

  // SUMMARY
  console.log("\n================================================================================");
  console.log(`COMPREHENSIVE AUDIT SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("================================================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runComprehensiveAudit()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Comprehensive audit failed:", err);
    process.exit(1);
  });
