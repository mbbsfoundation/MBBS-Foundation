import { prisma } from "../lib/prisma";
import fs from "fs";
import path from "path";
import { validateProfessionalSurveyPayload } from "../lib/mbbs-foundation/professionalSurveyValidation";
import { validateStudentVoiceSurvey, validateStudentContributorPayload } from "../lib/mbbs-foundation/studentVoiceValidation";
import { searchColleges } from "../lib/counselling/counsellingService";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`  ❌ [FAIL] ${message}`);
    process.exit(1);
  }
  console.log(`  ✓ [PASS] ${message}`);
}

async function runStep3ATests() {
  console.log("================================================================================");
  console.log("STEP 3A — CONTROLLED SURVEY / PUBLIC CONSULTATION FIXES TEST SUITE");
  console.log("================================================================================\n");

  // --------------------------------------------------------------------------
  // TEST GROUP 1: Medical College Loading & State Normalization
  // --------------------------------------------------------------------------
  console.log("--- TEST GROUP 1: Medical College Loading & State Normalization ---");
  
  // Test Maharashtra query with limit=100
  const maharashtraResult = await searchColleges({ state: "Maharashtra", limit: 100 });
  assert(maharashtraResult.colleges.length > 0, `Maharashtra college query succeeds (found ${maharashtraResult.colleges.length} colleges)`);
  assert(maharashtraResult.colleges.length <= 100, "Result length does not exceed pageSize=100");

  // Test Uttar Pradesh query with limit=100
  const upResult = await searchColleges({ state: "Uttar Pradesh", limit: 100 });
  assert(upResult.colleges.length > 0, `Uttar Pradesh college query succeeds (found ${upResult.colleges.length} colleges)`);

  // Test Delhi query with limit=100
  const delhiResult = await searchColleges({ state: "Delhi", limit: 100 });
  assert(delhiResult.colleges.length > 0, `Delhi college query succeeds (found ${delhiResult.colleges.length} colleges)`);

  // Test Dadra & Nagar Haveli query normalization
  const rawDropdownState = "Dadra & Nagar Haveli and Daman & Diu";
  const normalizedState = rawDropdownState === "Dadra & Nagar Haveli and Daman & Diu"
    ? "Dadra and Nagar Haveli and Daman and Diu"
    : rawDropdownState;
  
  const dnhResult = await searchColleges({ state: normalizedState, limit: 100 });
  assert(dnhResult.colleges.length > 0, `Dadra & Nagar Haveli normalized query succeeds (found ${dnhResult.colleges.length} colleges)`);
  assert(dnhResult.colleges.some(c => c.collegeName.includes("NAMO Medical Education")), "Contains NAMO Medical Education Institute");

  // Verify client files never use pageSize=200
  const profFormPath = path.join(process.cwd(), "components/mbbs-foundation/consultation/ProfessionalSurveyForm.tsx");
  const profFormContent = fs.readFileSync(profFormPath, "utf8");
  assert(!profFormContent.includes("pageSize=200"), "ProfessionalSurveyForm.tsx does NOT contain pageSize=200");
  assert(profFormContent.includes("pageSize=100"), "ProfessionalSurveyForm.tsx contains pageSize=100");
  assert(profFormContent.includes("Dadra & Nagar Haveli and Daman & Diu"), "ProfessionalSurveyForm.tsx contains Dadra & Nagar Haveli normalization");

  const studentFormPath = path.join(process.cwd(), "components/mbbs-foundation/consultation/StudentVoiceSurveyForm.tsx");
  const studentFormContent = fs.readFileSync(studentFormPath, "utf8");
  assert(!studentFormContent.includes("pageSize=200"), "StudentVoiceSurveyForm.tsx does NOT contain pageSize=200");
  assert(studentFormContent.includes("pageSize=100"), "StudentVoiceSurveyForm.tsx contains pageSize=100");
  assert(studentFormContent.includes("Dadra & Nagar Haveli and Daman & Diu"), "StudentVoiceSurveyForm.tsx contains Dadra & Nagar Haveli normalization");

  // --------------------------------------------------------------------------
  // TEST GROUP 2: Section Viewport Positioning
  // --------------------------------------------------------------------------
  console.log("\n--- TEST GROUP 2: Section Viewport Positioning ---");
  assert(profFormContent.includes("surveyContainerRef"), "ProfessionalSurveyForm uses surveyContainerRef");
  assert(profFormContent.includes("scrollToSurveyTop"), "ProfessionalSurveyForm defines scrollToSurveyTop");
  assert(!profFormContent.includes("handleNext = () => {\n    if (validateCurrentStep()) {\n      setCurrentStep((prev) => Math.min(prev + 1, 7));\n      window.scrollTo({ top: 0, behavior: \"smooth\" });"), "ProfessionalSurveyForm handleNext does not use window.scrollTo 0");
  assert(profFormContent.includes("setIsSubmittedSuccess(true);\n        window.scrollTo({ top: 0, behavior: \"smooth\" });"), "ProfessionalSurveyForm preserves window.scrollTo 0 on final submission success");

  assert(studentFormContent.includes("surveyContainerRef"), "StudentVoiceSurveyForm uses surveyContainerRef");
  assert(studentFormContent.includes("scrollToSurveyTop"), "StudentVoiceSurveyForm defines scrollToSurveyTop");
  assert(studentFormContent.includes("setIsSubmittedSuccess(true);\n      window.scrollTo({ top: 0, behavior: \"smooth\" });"), "StudentVoiceSurveyForm preserves window.scrollTo 0 on final submission success");

  // --------------------------------------------------------------------------
  // TEST GROUP 3: Professional Consultation Mandatory Contact Fields
  // --------------------------------------------------------------------------
  console.log("\n--- TEST GROUP 3: Professional Consultation Mandatory Contact Fields ---");
  const validBaseProfessional = {
    surveyVersion: "v2",
    source: "direct",
    roles: ["Medical college faculty"],
    specialty: "General Medicine",
    teachingExperience: "5–10 years",
    state: "Maharashtra",
    readinessRatings: {
      domain_a: "Reasonably prepared",
      domain_b: "Reasonably prepared",
      domain_c: "Some preparation, but important gaps remain",
      domain_d: "Some preparation, but important gaps remain",
      domain_e: "Reasonably prepared",
      domain_f: "Poorly prepared",
      domain_g: "Poorly prepared",
      domain_h: "Some preparation, but important gaps remain",
      domain_i: "Poorly prepared",
      domain_j: "Poorly prepared",
      domain_k: "Some preparation, but important gaps remain",
      domain_l: "Poorly prepared",
      domain_m: "Poorly prepared",
      domain_n: "Some preparation, but important gaps remain",
    },
    q9EmphasisAreas: ["domain_a", "domain_j", "domain_g"],
    q15FoundationCourseDescription: "Useful, but several important gaps remain",
    q16Limitations: ["Limited time"],
    q13WishTaughtAtBeginning: "Understand early how medicine requires active clinical application.",
    q17UsefulFormats: ["Interactive faculty-led sessions"],
    q19InterestedInContributing: "Not at present",
    respondentName: "Dr. Test Professor",
    email: "test.professor@example.com",
    mobileWhatsapp: "9876543210",
    q28ConsentForContact: "Yes",
  };

  // PASS: Name + valid Email + Mobile + answered consent
  const fullProfPass = validateProfessionalSurveyPayload(validBaseProfessional);
  assert(fullProfPass.isValid === true, "PASS: Name + valid Email + Mobile + answered consent");

  // FAIL: Name present, Email absent, Mobile present
  const noEmailProf = validateProfessionalSurveyPayload({
    ...validBaseProfessional,
    email: "",
  });
  assert(noEmailProf.isValid === false, "FAIL: Name present, Email absent, Mobile present");

  // FAIL: Name present, Email present, Mobile absent
  const noMobileProf = validateProfessionalSurveyPayload({
    ...validBaseProfessional,
    mobileWhatsapp: "",
  });
  assert(noMobileProf.isValid === false, "FAIL: Name present, Email present, Mobile absent");

  // FAIL: Missing Name
  const noNameProf = validateProfessionalSurveyPayload({
    ...validBaseProfessional,
    respondentName: "",
  });
  assert(noNameProf.isValid === false, "FAIL: Name absent");

  // FAIL: Unanswered consent
  const noConsentProf = validateProfessionalSurveyPayload({
    ...validBaseProfessional,
    q28ConsentForContact: "",
  });
  assert(noConsentProf.isValid === false, "FAIL: Unanswered consent");

  // --------------------------------------------------------------------------
  // TEST GROUP 4: Student Voice Anonymous Core & Mandatory Contributor
  // --------------------------------------------------------------------------
  console.log("\n--- TEST GROUP 4: Student Voice Anonymous Core & Contributor ---");
  const validBaseStudent = {
    trainingStage: "First MBBS",
    collegeType: "Government Medical College",
    state: "Maharashtra",
    q3RewardingExperiences: ["Finally studying medicine and the human body in depth"],
    q4HarderAspects: ["The sheer amount of material to learn"],
    q5Surprises: ["The way you need to learn in MBBS is very different from how you studied before entering medical college"],
    q6TransitionMatrix: {
      statement_1: "Sometimes",
      statement_2: "Often",
      statement_3: "Sometimes",
      statement_4: "Rarely",
      statement_5: "Sometimes",
      statement_6: "Often",
      statement_7: "Often",
      statement_8: "Very often",
    },
    q7NextBatchPriorities: ["How studying MBBS differs from preparing for NEET"],
    q8UsefulPreparationTypes: ["A practical orientation to what MBBS is actually like before or around joining"],
    q9BestTiming: "Before joining medical college",
    q10WishSomeoneTold: "Consistency matters much more than cramming before exams.",
    quotePermission: true,
  };

  // PASS: Core Student Voice without any identity or contact fields (100% Anonymous)
  const coreStudentPass = validateStudentVoiceSurvey(validBaseStudent);
  assert(coreStudentPass.isValid === true, "PASS: Core Student Voice submits anonymously without identity/contact data");
  assert(coreStudentPass.sanitizedData?.respondentName === null, "Core response respondentName is null");
  assert(coreStudentPass.sanitizedData?.email === null, "Core response email is null");
  assert(coreStudentPass.sanitizedData?.mobileWhatsapp === null, "Core response mobileWhatsapp is null");

  // Contributor Validation (Post-Submit PATCH)
  // PASS: Name + Email + Mobile + consent
  const fullContributorPass = validateStudentContributorPayload({
    responseId: "dummy-uuid",
    respondentName: "Test Student Contributor",
    email: "student@example.com",
    mobileWhatsapp: "9876543210",
    consentForFollowup: true,
    contributionInterests: ["Share my experiences and practical tips"],
  });
  assert(fullContributorPass.isValid === true, "PASS: Contributor with Name + Email + Mobile + Consent");

  // FAIL: Name + Mobile but no Email
  const noEmailContributor = validateStudentContributorPayload({
    responseId: "dummy-uuid",
    respondentName: "Test Student Contributor",
    email: "",
    mobileWhatsapp: "9876543210",
    consentForFollowup: true,
  });
  assert(noEmailContributor.isValid === false, "FAIL: Contributor Name + Mobile but no Email");

  // FAIL: Name + Email but no Mobile
  const noMobileContributor = validateStudentContributorPayload({
    responseId: "dummy-uuid",
    respondentName: "Test Student Contributor",
    email: "student@example.com",
    mobileWhatsapp: "",
    consentForFollowup: true,
  });
  assert(noMobileContributor.isValid === false, "FAIL: Contributor Name + Email but no Mobile");

  // FAIL: Missing Consent
  const noConsentContributor = validateStudentContributorPayload({
    responseId: "dummy-uuid",
    respondentName: "Test Student Contributor",
    email: "student@example.com",
    mobileWhatsapp: "9876543210",
    consentForFollowup: false,
  });
  assert(noConsentContributor.isValid === false, "FAIL: Contributor missing consent");

  // --------------------------------------------------------------------------
  // TEST GROUP 5: Global Navigation & Sub-Navigation Help
  // --------------------------------------------------------------------------
  console.log("\n--- TEST GROUP 5: Navigation & Sub-Nav Help ---");
  const siteHeaderContent = fs.readFileSync(path.join(process.cwd(), "components/SiteHeader.tsx"), "utf8");
  assert(siteHeaderContent.includes('{ label: "Consultation", href: "/mbbs-foundation/consultation" }'), "SiteHeader includes Consultation link");
  assert(siteHeaderContent.includes('pathname.startsWith("/mbbs-foundation/consultation")'), "SiteHeader active state handles /mbbs-foundation/consultation");

  const subNavContent = fs.readFileSync(path.join(process.cwd(), "components/mbbs-foundation/consultation/ConsultationSubNav.tsx"), "utf8");
  assert(subNavContent.includes("Explore the MBBS Foundation consultation and choose the pathway relevant to you."), "SubNav includes Overview locked description");
  assert(subNavContent.includes("For faculty, clinicians and medical educators helping identify how students can begin MBBS better prepared."), "SubNav includes Professional locked description");
  assert(subNavContent.includes("For current MBBS students and interns to share what they wish they had known when they started."), "SubNav includes Student Voice locked description");
  assert(subNavContent.includes("A future readiness experience for students preparing to enter medical college."), "SubNav includes Entry Readiness locked description");
  assert(subNavContent.includes('badge: "Coming Soon"'), "Entry Readiness retains Coming Soon badge");
  assert(subNavContent.includes("disabled: true"), "Entry Readiness remains disabled");

  console.log("\n================================================================================");
  console.log("🎉 ALL STEP 3A TESTS PASSED SUCCESSFULLY!");
  console.log("================================================================================");
}

runStep3ATests()
  .catch((e) => {
    console.error("❌ Test suite failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
