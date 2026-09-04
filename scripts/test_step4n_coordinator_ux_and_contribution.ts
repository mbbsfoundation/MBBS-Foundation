import "dotenv/config";
import {
  getWhatsAppVerificationMessage,
  slugToCanonicalState,
  stateNameToSlug,
} from "../lib/cprSlug";
import {
  SURVEY_INTRODUCTIONS,
  SURVEY_SECTIONS_CONFIG,
  SURVEY_METADATA,
} from "../lib/mbbs-foundation/professionalSurveyConfig";
import {
  getCPRDayReconciliationReport,
  getCPRDayNationalConsolidatedReport,
} from "../lib/cprReporting";
import { getLockedCensusStateList } from "../lib/cprStateCensus";
import { prisma } from "../lib/prisma";

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, message: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ [PASS] ${message}`);
  } else {
    console.error(`  ✗ [FAIL] ${message}`);
  }
}

async function runStep4NTestSuite() {
  console.log("================================================================================");
  console.log("STEP 4N COMPREHENSIVE TEST SUITE: COORDINATOR UX, DEADLINE & CONTRIBUTION LOOP");
  console.log("================================================================================\n");

  // --------------------------------------------------------------------------
  // TEST GROUP 1: WhatsApp Announcement Message & Sharing Logic
  // --------------------------------------------------------------------------
  console.log("--- TEST GROUP 1: WhatsApp Announcement Message & Sharing Logic ---");

  const testStates = [
    { name: "Maharashtra", slug: "maharashtra" },
    { name: "Madhya Pradesh", slug: "madhya-pradesh" },
    { name: "West Bengal", slug: "west-bengal" },
    { name: "Andaman & Nicobar Islands", slug: "andaman-and-nicobar-islands" },
  ];

  for (const st of testStates) {
    const msg = getWhatsAppVerificationMessage(st.name);
    assert(msg.includes(`Draft Programme Report for ${st.name}`), `${st.name}: Contains state name in draft announcement`);
    assert(msg.includes(`https://mbbsfoundation.com/cprsanjeevani/verify/${st.slug}`), `${st.name}: Contains correct canonical URL`);
    assert(msg.includes("7 September 2026 • 23:59 hrs IST"), `${st.name}: Contains explicit deadline 7 September 2026 • 23:59 hrs IST`);
    assert(msg.includes("National IAP CPR Day 2026 — State Report Verification"), `${st.name}: Header matches official title`);
    assert(msg.includes("✓ Verify the information as correct"), `${st.name}: Instructions contain Verify option`);
    assert(msg.includes("✎ Suggest any required correction"), `${st.name}: Instructions contain Suggest Correction option`);
    assert(msg.includes("Report Missing Course"), `${st.name}: Instructions contain Missing Course option`);
  }

  // --------------------------------------------------------------------------
  // TEST GROUP 2: Professional Consultation Survey (source=cpr) Audit
  // --------------------------------------------------------------------------
  console.log("\n--- TEST GROUP 2: Professional Consultation Survey (source=cpr) Audit ---");

  assert(Boolean(SURVEY_INTRODUCTIONS.cpr), "CPR intro variant exists in professionalSurveyConfig");
  assert(Boolean(SURVEY_INTRODUCTIONS.cpr.badge), "CPR badge updated properly");
  assert(SURVEY_INTRODUCTIONS.cpr.paragraphs.some((p) => p.includes("You have already contributed to lifesaving education through CPR training and awareness.")), "CPR intro recognizes CPR contribution");
  assert(SURVEY_INTRODUCTIONS.cpr.paragraphs.some((p) => p.includes("MBBS Foundation now invites you to extend that contribution into the broader preparation and development of future doctors.")), "CPR intro invites contribution to future doctors");
  assert(SURVEY_INTRODUCTIONS.cpr.paragraphs.some((p) => p.includes("This national professional consultation is helping identify the gaps students face while entering MBBS")), "CPR intro explains workshop purpose");
  assert(SURVEY_INTRODUCTIONS.cpr.paragraphs.some((p) => p.includes("Your experience as a Course Coordinator, CPR Champion, instructor, clinician or educator")), "CPR intro mentions Course Coordinator & CPR Champion roles");

  // Verify V2 7-section structure
  assert(SURVEY_SECTIONS_CONFIG.length === 7, `Survey has exactly 7 sections (got: ${SURVEY_SECTIONS_CONFIG.length})`);
  assert(SURVEY_METADATA.version === "v2", `Survey version is v2 (got: ${SURVEY_METADATA.version})`);

  // Check contribution pathways in Q12/Q20
  const allQuestions: any[] = [];
  SURVEY_SECTIONS_CONFIG.forEach((s) => allQuestions.push(...s.questions));
  const q20 = allQuestions.find((q: any) => q.key === "q20ContributionTypes");
  assert(Boolean(q20), "Q20 Contribution Types question exists");
  assert(q20.options.some((opt: string) => opt.includes("Workshop Faculty")), "Q20 includes Workshop Facilitation");
  assert(q20.options.some((opt: string) => opt.includes("CPR / First Aid")), "Q20 includes CPR/first-aid components");
  assert(q20.options.some((opt: string) => opt.includes("Student Mentor")), "Q20 includes Mentorship");

  // --------------------------------------------------------------------------
  // TEST GROUP 3: Read-Only Student Survey Audit
  // --------------------------------------------------------------------------
  console.log("\n--- TEST GROUP 3: Read-Only Student Survey Audit ---");

  // Verify Prisma model exists
  assert(typeof (prisma as any).mBBSStudentVoiceSurveyResponse !== "undefined", "Prisma model MBBSStudentVoiceSurveyResponse exists in client");

  // --------------------------------------------------------------------------
  // TEST GROUP 4: Representative State Reports Load Cleanly
  // --------------------------------------------------------------------------
  console.log("\n--- TEST GROUP 4: Representative State Reports Load Cleanly ---");

  for (const st of testStates) {
    const report = getCPRDayReconciliationReport(st.name);
    assert(Boolean(report && report.centres), `Report for ${st.name} loaded cleanly with centres`);
    assert((report?.centres?.length || 0) > 0, `${st.name} has non-empty centres list (${report?.centres?.length || 0} centres)`);
  }

  // --------------------------------------------------------------------------
  // TEST GROUP 5: Frozen Draft V1 Census Invariants Protection
  // --------------------------------------------------------------------------
  console.log("\n--- TEST GROUP 5: Frozen Draft V1 Census Invariants Protection ---");

  const lockedStates = getLockedCensusStateList();
  assert(lockedStates.length === 28, `Authoritative locked States count = 28 (got: ${lockedStates.length})`);

  for (const stateObj of lockedStates) {
    const rep = getCPRDayReconciliationReport(stateObj.canonicalState);
    assert(Boolean(rep), `Report for ${stateObj.canonicalState} loads cleanly`);
  }

  const national = getCPRDayNationalConsolidatedReport();
  assert(national.summary.reconciledReport.coursesConducted === 395, `National Draft Courses = 395 (got: ${national.summary.reconciledReport.coursesConducted})`);
  assert(national.summary.reconciledReport.participantsTrained === 47033, `National Draft Reconciled Trained = 47,033 (got: ${national.summary.reconciledReport.participantsTrained})`);
  assert(national.summary.reconciledReport.participantsCertified === 33477, `National Participants Certified = 33,477 (got: ${national.summary.reconciledReport.participantsCertified})`);

  console.log("\n================================================================================");
  console.log(`STEP 4N TEST SUITE RESULT: ${passedTests} / ${totalTests} PASSED (${Math.round((passedTests / totalTests) * 100)}%)`);
  console.log("================================================================================\n");

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runStep4NTestSuite().catch((err) => {
  console.error("Test Suite execution failed:", err);
  process.exit(1);
}).finally(() => {
  prisma.$disconnect();
});
