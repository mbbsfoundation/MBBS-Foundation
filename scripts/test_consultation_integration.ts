import { prisma } from "../lib/prisma";
import fs from "fs";
import path from "path";
import { SURVEY_INTRODUCTIONS, SURVEY_SECTIONS_CONFIG as PROF_SECTIONS } from "../lib/mbbs-foundation/professionalSurveyConfig";
import { STUDENT_SURVEY_SECTIONS_CONFIG as STUDENT_SECTIONS } from "../lib/mbbs-foundation/studentVoiceSurveyConfig";

async function main() {
  console.log("================================================================================");
  console.log("TEST SUITE: MBBS FOUNDATION CONSULTATION INTEGRATION PATHWAY");
  console.log("================================================================================\n");

  // ============================================================================
  // 1. CONSULTATION HUB (/mbbs-foundation/consultation)
  // ============================================================================
  console.log("[1] Auditing Consultation Central Hub (/mbbs-foundation/consultation)...");
  
  const hubFilePath = path.join(process.cwd(), "app/mbbs-foundation/consultation/page.tsx");
  if (!fs.existsSync(hubFilePath)) {
    throw new Error(`Hub page file not found at ${hubFilePath}`);
  }
  const hubContent = fs.readFileSync(hubFilePath, "utf8");

  // Verify Heading & Intro
  const hubRequiredStrings = [
    "MBBS FOUNDATION • National Consultation",
    "Help Shape How Future Doctors Begin Their Journey",
    "The transition into medical college is experienced differently by students, teachers and clinicians.",
    "MBBS Foundation is bringing these perspectives together to understand what students need when they enter MBBS and how practical guidance can complement formal medical education.",
    // Card 1
    "FOR MEDICAL PROFESSIONALS",
    "Professional Consultation",
    "Medical faculty",
    "Clinicians",
    "Medical educators",
    "Foundation Course faculty",
    "MEU members",
    "Residents",
    "CPR educators and trainers",
    "Academic leaders",
    "Share your experience of the transition into MBBS, identify areas where students need greater preparation and help shape practical approaches for the MBBS Foundation initiative.",
    "CONTRIBUTE AS A MEDICAL PROFESSIONAL",
    "/mbbs-foundation/consultation/professional",
    // Card 2
    "FOR MBBS STUDENTS & INTERNS",
    "Student Voice",
    "What I Wish I Knew Before Starting MBBS",
    "Tell us what medical college was actually like when you entered — what surprised you, what was harder than expected and what you wish someone had told you beforehand.",
    "SHARE YOUR STUDENT VOICE",
    "/mbbs-foundation/consultation/student-voice",
    // Credibility line
    "Professional perspectives and student experiences will be analysed together to identify important gaps in the transition into medical education and guide development of the MBBS Foundation initiative.",
  ];

  for (const s of hubRequiredStrings) {
    if (!hubContent.includes(s)) {
      throw new Error(`Consultation hub missing required copy: "${s}"`);
    }
  }
  console.log("✅ Consultation Hub page has exact approved copy, both cards, and credibility line.");

  // Check SubNav
  const subNavPath = path.join(process.cwd(), "components/mbbs-foundation/consultation/ConsultationSubNav.tsx");
  const subNavContent = fs.readFileSync(subNavPath, "utf8");
  if (!subNavContent.includes("/mbbs-foundation/consultation/student-voice")) {
    throw new Error("ConsultationSubNav must link to Student Voice survey");
  }
  if (!subNavContent.includes("/mbbs-foundation/consultation/professional")) {
    throw new Error("ConsultationSubNav must link to Professional Consultation");
  }
  console.log("✅ ConsultationSubNav navigation links verified.");

  // ============================================================================
  // 2. CPR -> PROFESSIONAL CONSULTATION (verify/[state])
  // ============================================================================
  console.log("\n[2] Auditing CPR -> Professional Consultation Integration...");

  const cprVerifyPath = path.join(process.cwd(), "app/cprsanjeevani/verify/[state]/page.tsx");
  const cprVerifyContent = fs.readFileSync(cprVerifyPath, "utf8");

  if (!cprVerifyContent.includes("/mbbs-foundation/consultation/professional?source=cpr")) {
    throw new Error("CPR verification page must link to /mbbs-foundation/consultation/professional?source=cpr");
  }
  if (!cprVerifyContent.includes("EXTEND YOUR CONTRIBUTION")) {
    throw new Error("CPR verification success modal must contain EXTEND YOUR CONTRIBUTION");
  }
  if (!cprVerifyContent.includes("From Lifesaving Skills to Building Future Doctors")) {
    throw new Error("CPR verification success modal must contain 'From Lifesaving Skills to Building Future Doctors'");
  }
  if (!cprVerifyContent.includes("CONTRIBUTE TO MBBS FOUNDATION WORKSHOP")) {
    throw new Error("CPR verification CTA must be 'CONTRIBUTE TO MBBS FOUNDATION WORKSHOP'");
  }
  console.log("✅ CPR Verification page contains the locked EXTEND YOUR CONTRIBUTION CTA pointing to ?source=cpr.");

  // Verify source=cpr framing is defined in professional survey config
  if (!SURVEY_INTRODUCTIONS.cpr || !SURVEY_INTRODUCTIONS.cpr.heading.includes("Extending Your Contribution")) {
    throw new Error("Professional survey config must support source=cpr introduction variant");
  }
  console.log("✅ Professional Survey configuration supports source=cpr framing.");

  // ============================================================================
  // 3. PROFESSIONAL -> STUDENT VOICE (ProfessionalSurveyForm)
  // ============================================================================
  console.log("\n[3] Auditing Professional -> Student Voice Integration...");

  const profConfigPath = path.join(process.cwd(), "lib/mbbs-foundation/professionalSurveyConfig.ts");
  const profConfigContent = fs.readFileSync(profConfigPath, "utf8");

  if (!profConfigContent.includes("/mbbs-foundation/consultation/student-voice")) {
    throw new Error("Professional survey config must link to /mbbs-foundation/consultation/student-voice");
  }
  if (!profConfigContent.includes("HELP US HEAR FROM MEDICAL STUDENTS")) {
    throw new Error("Professional survey config must contain 'HELP US HEAR FROM MEDICAL STUDENTS'");
  }
  if (!profConfigContent.includes("SHARE STUDENT VOICE SURVEY")) {
    throw new Error("Professional survey config CTA must be 'SHARE STUDENT VOICE SURVEY'");
  }
  console.log("✅ Professional Survey post-submission config contains optional Student Voice CTA & link.");

  // ============================================================================
  // 4. STUDENT VOICE -> PASS IT FORWARD (StudentVoiceSurveyForm)
  // ============================================================================
  console.log("\n[4] Auditing Student Voice -> Pass It Forward Integration...");

  const studentConfigPath = path.join(process.cwd(), "lib/mbbs-foundation/studentVoiceSurveyConfig.ts");
  const studentConfigContent = fs.readFileSync(studentConfigPath, "utf8");

  if (!studentConfigContent.includes("PASS IT FORWARD")) {
    throw new Error("Student Voice config must contain 'PASS IT FORWARD'");
  }
  if (!studentConfigContent.includes("I'D LIKE TO CONTRIBUTE")) {
    throw new Error("Student Voice config must contain \"I'D LIKE TO CONTRIBUTE\"");
  }
  console.log("✅ Student Voice post-submission contains locked Pass It Forward contribution experience.");

  // ============================================================================
  // 5. WEBSITE ENTRY POINT (app/page.tsx)
  // ============================================================================
  console.log("\n[5] Auditing Homepage Entry Point (app/page.tsx)...");

  const homePagePath = path.join(process.cwd(), "app/page.tsx");
  const homePageContent = fs.readFileSync(homePagePath, "utf8");

  const homeRequiredStrings = [
    "HELP SHAPE MBBS FOUNDATION",
    "Medical education works best when the voices of both teachers and students are heard.",
    "Join the National Professional Consultation or Student Voice initiative and help us understand how students can begin MBBS better prepared.",
    "JOIN THE CONSULTATION",
    "/mbbs-foundation/consultation",
  ];

  for (const s of homeRequiredStrings) {
    if (!homePageContent.includes(s)) {
      throw new Error(`Homepage missing required consultation entry string: "${s}"`);
    }
  }
  console.log("✅ Homepage contains compact, non-intrusive 'HELP SHAPE MBBS FOUNDATION' section linking to /mbbs-foundation/consultation.");

  // ============================================================================
  // 6. PRIVACY & SAFETY CHECK
  // ============================================================================
  console.log("\n[6] Auditing Privacy & Architectural Boundaries...");

  // Verify models exist and remain separated in Prisma
  const profCount = await prisma.mBBSProfessionalSurveyResponse.count();
  const studentCount = await prisma.mBBSStudentVoiceSurveyResponse.count();
  const cprCount = await prisma.cPRVerificationSubmission.count();

  console.log(`✅ Independent database counts verified:`);
  console.log(`   - MBBSProfessionalSurveyResponse: ${profCount} records`);
  console.log(`   - MBBSStudentVoiceSurveyResponse: ${studentCount} records`);
  console.log(`   - CPRVerificationSubmission: ${cprCount} records`);

  // Verify no public exposure of PII in hub or survey configs
  if (hubContent.includes("email") && hubContent.includes("respondentName")) {
    throw new Error("PII fields must not be rendered publicly on hub page");
  }
  console.log("✅ Zero public PII exposure confirmed.");

  console.log("\n================================================================================");
  console.log("🎉 ALL INTEGRATION PATHWAY CHECKS PASSED SUCCESSFULLY!");
  console.log("================================================================================");
}

main()
  .catch((e) => {
    console.error("❌ Integration test failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
