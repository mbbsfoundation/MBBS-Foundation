import { prisma } from "../lib/prisma";
import {
  SURVEY_METADATA,
  SURVEY_INTRODUCTIONS,
  READINESS_DOMAINS_CONFIG,
  READINESS_RATING_SCALE,
  SURVEY_SECTIONS_CONFIG,
  SUCCESS_SCREEN_CONFIG,
  generateSurveyPlainText,
} from "../lib/mbbs-foundation/professionalSurveyConfig";
import {
  PROFESSIONAL_ROLES_OPTIONS,
  SPECIALTY_OPTIONS,
  TEACHING_EXPERIENCE_OPTIONS,
  INDIAN_STATES_AND_UTS,
  READINESS_DOMAINS,
  Q7_FOUNDATION_COURSE_OPTIONS,
  Q8_LIMITATIONS_OPTIONS,
  Q10_WORKSHOP_FORMATS_OPTIONS,
  Q11_CONTRIBUTION_INTEREST_OPTIONS,
  Q12_CONTRIBUTION_PATHWAYS,
  Q20_CONTRIBUTION_TYPES_OPTIONS,
  Q28_CONSENT_OPTIONS,
} from "../lib/mbbs-foundation/consultationTypes";
import { validateProfessionalSurveyPayload } from "../lib/mbbs-foundation/professionalSurveyValidation";
import {
  getConsultationDashboardSummary,
  getConsultationResponses,
} from "../lib/mbbs-foundation/consultationAdmin";
import {
  getCPRDayReconciliationReport,
  getCPRDayNationalConsolidatedReport,
} from "../lib/cprReporting";
import { getLockedCensusStateList } from "../lib/cprStateCensus";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`  ❌ [FAIL] ${message}`);
    process.exit(1);
  }
  console.log(`  ✓ [PASS] ${message}`);
}

async function runTestSuite() {
  console.log("================================================================================");
  console.log("LOCKED PROFESSIONAL CONSULTATION V2 COMPREHENSIVE TEST SUITE");
  console.log("================================================================================");

  // --------------------------------------------------------------------------
  // TEST GROUP 1: Survey Metadata & Introductions
  // --------------------------------------------------------------------------
  console.log("\n--- TEST GROUP 1: Metadata & Introductions ---");
  assert(SURVEY_METADATA.version === "v2", `Survey metadata version is v2 (got: ${SURVEY_METADATA.version})`);
  assert(SURVEY_METADATA.estimatedTime === "5–7 minutes", `Estimated time is 5–7 minutes (got: ${SURVEY_METADATA.estimatedTime})`);
  assert(SURVEY_METADATA.title === "MBBS FOUNDATION — National Professional Consultation", "Survey metadata title is locked");

  assert(Boolean(SURVEY_INTRODUCTIONS.faculty), "Faculty intro exists");
  assert(Boolean(SURVEY_INTRODUCTIONS.cpr), "CPR intro exists");
  assert(Boolean(SURVEY_INTRODUCTIONS.direct), "Direct intro exists");
  assert(SURVEY_INTRODUCTIONS.cpr.heading === "Extending Your Contribution: From Lifesaving Skills to Building Future Doctors", "CPR heading matches locked wording");
  assert(SURVEY_INTRODUCTIONS.cpr.lead === "Dear Colleague / CPR Educator,", "CPR lead matches locked wording");

  // --------------------------------------------------------------------------
  // TEST GROUP 2: Exactly 7 Sections & Locked Question Catalog
  // --------------------------------------------------------------------------
  console.log("\n--- TEST GROUP 2: Exactly 7 Sections Structure ---");
  assert(SURVEY_SECTIONS_CONFIG.length === 7, `Survey has exactly 7 sections (got: ${SURVEY_SECTIONS_CONFIG.length})`);
  assert(SURVEY_SECTIONS_CONFIG[0].title === "About You", "Section 1 is About You");
  assert(SURVEY_SECTIONS_CONFIG[1].title === "How Prepared Are Students?", "Section 2 is How Prepared Are Students?");
  assert(SURVEY_SECTIONS_CONFIG[2].title === "Current Foundation Course", "Section 3 is Current Foundation Course");
  assert(SURVEY_SECTIONS_CONFIG[3].title === "Your Experience Matters", "Section 4 is Your Experience Matters");
  assert(SURVEY_SECTIONS_CONFIG[4].title === "Building the MBBS Foundation Workshop", "Section 5 is Building the MBBS Foundation Workshop");
  assert(SURVEY_SECTIONS_CONFIG[5].title === "Extend Your Contribution", "Section 6 is Extend Your Contribution");
  assert(SURVEY_SECTIONS_CONFIG[6].title === "SECTION 7 — STAY CONNECTED", "Section 7 is SECTION 7 — STAY CONNECTED");

  // Section 1 questions
  const sec1 = SURVEY_SECTIONS_CONFIG[0].questions;
  assert(sec1.some((q: any) => q.key === "roles" && q.multiple === true), "Q1 roles is multi-select");
  assert(sec1.some((q: any) => q.key === "specialty" && q.multiple === false), "Q2 specialty is single-select");
  assert(sec1.some((q: any) => q.key === "teachingExperience" && q.multiple === false), "Q3 teachingExperience is single-select");
  assert(sec1.some((q: any) => q.key === "stateAndInstitution"), "Q4 stateAndInstitution exists");

  // Section 2 questions
  const sec2 = SURVEY_SECTIONS_CONFIG[1].questions;
  assert(sec2.some((q: any) => q.key === "readinessRatings" && q.type === "matrix"), "Q5 readinessRatings is matrix");
  assert(sec2.some((q: any) => q.key === "q9EmphasisAreas" && q.maxSelections === 5), "Q6 emphasis areas max 5");

  // Section 3 questions
  const sec3 = SURVEY_SECTIONS_CONFIG[2].questions;
  assert(sec3.some((q: any) => q.key === "q15FoundationCourseDescription" && q.multiple === false), "Q7 Foundation Course description is single-select");
  assert(sec3.some((q: any) => q.key === "q16Limitations" && q.maxSelections === 3), "Q8 limitations max 3");

  // Section 4 question
  const sec4 = SURVEY_SECTIONS_CONFIG[3].questions;
  assert(sec4.some((q: any) => q.key === "q13WishTaughtAtBeginning" && q.type === "textarea" && q.required === true), "Q9 wish taught at beginning is required textarea");

  // Section 5 question
  const sec5 = SURVEY_SECTIONS_CONFIG[4].questions;
  assert(sec5.some((q: any) => q.key === "q17UsefulFormats" && q.maxSelections === 5), "Q10 workshop formats max 5");

  // Section 6 questions
  const sec6 = SURVEY_SECTIONS_CONFIG[5].questions;
  assert(sec6.some((q: any) => q.key === "q19InterestedInContributing" && q.multiple === false), "Q11 contribution interest is single-select");
  assert(sec6.some((q: any) => q.key === "q20ContributionTypes" && q.conditionalOn === "q19_interested"), "Q12 contribution types is conditional on Q11");

  // Section 7 questions
  const sec7 = SURVEY_SECTIONS_CONFIG[6].questions;
  assert(sec7.some((q: any) => q.key === "respondentName" && q.required === true), "Section 7 Name is required");
  assert(sec7.some((q: any) => q.key === "email"), "Section 7 Email exists");
  assert(sec7.some((q: any) => q.key === "mobileWhatsapp"), "Section 7 Mobile/WhatsApp exists");
  assert(sec7.some((q: any) => q.key === "q28ConsentForContact" && q.required === true), "Section 7 Contact Consent is required");

  // --------------------------------------------------------------------------
  // TEST GROUP 3: 14 Readiness Domains Exact Display Order & Semantic Keys
  // --------------------------------------------------------------------------
  console.log("\n--- TEST GROUP 3: 14 Readiness Domains Display Order & Semantic Keys ---");
  assert(READINESS_DOMAINS_CONFIG.length === 14, `Exactly 14 domains configured (got: ${READINESS_DOMAINS_CONFIG.length})`);
  assert(READINESS_DOMAINS.length === 14, `Exactly 14 domains in consultationTypes (got: ${READINESS_DOMAINS.length})`);

  const expectedOrder = [
    { id: "domain_a", code: "1", internalCode: "A", title: "Learning & study transition" },
    { id: "domain_j", code: "2", internalCode: "J", title: "CPR, first aid & lifesaving skills" },
    { id: "domain_b", code: "3", internalCode: "B", title: "Self-directed learning" },
    { id: "domain_c", code: "4", internalCode: "C", title: "Professional identity" },
    { id: "domain_d", code: "5", internalCode: "D", title: "Patient communication" },
    { id: "domain_e", code: "6", internalCode: "E", title: "Ethics & professionalism" },
    { id: "domain_f", code: "7", internalCode: "F", title: "Empathy & respect" },
    { id: "domain_g", code: "8", internalCode: "G", title: "Clinical environment & etiquette" },
    { id: "domain_h", code: "9", internalCode: "H", title: "Early patient interaction" },
    { id: "domain_i", code: "10", internalCode: "I", title: "Teamwork" },
    { id: "domain_k", code: "11", internalCode: "K", title: "Healthcare system orientation" },
    { id: "domain_l", code: "12", internalCode: "L", title: "Medicolegal awareness" },
    { id: "domain_m", code: "13", internalCode: "M", title: "Coping, self-care & resilience" },
    { id: "domain_n", code: "14", internalCode: "N", title: "Digital professionalism" },
  ];

  for (let i = 0; i < expectedOrder.length; i++) {
    const exp = expectedOrder[i];
    const actualConfig = READINESS_DOMAINS_CONFIG[i];
    const actualType = READINESS_DOMAINS[i];

    assert(actualConfig.id === exp.id, `Domain #${i + 1} config id is ${exp.id} (got: ${actualConfig.id})`);
    assert(actualConfig.code === exp.code, `Domain #${i + 1} config display code is ${exp.code} (got: ${actualConfig.code})`);
    assert(actualConfig.internalCode === exp.internalCode, `Domain #${i + 1} config internal code is ${exp.internalCode} (got: ${actualConfig.internalCode})`);
    assert(actualConfig.title === exp.title, `Domain #${i + 1} config title matches "${exp.title}"`);

    assert(actualType.id === exp.id, `Domain #${i + 1} type id is ${exp.id} (got: ${actualType.id})`);
    assert(actualType.internalCode === exp.internalCode, `Domain #${i + 1} type internal code is ${exp.internalCode} (got: ${actualType.internalCode})`);
  }

  // Confirm CPR is #2 visually but domain_j internally
  assert(READINESS_DOMAINS_CONFIG[1].id === "domain_j", "CPR domain is #2 display item with domain_j internal key");
  assert(READINESS_DOMAINS_CONFIG[1].title === "CPR, first aid & lifesaving skills", "CPR domain title is correct");

  // --------------------------------------------------------------------------
  // TEST GROUP 4: Payload Validation Logic
  // --------------------------------------------------------------------------
  console.log("\n--- TEST GROUP 4: Server-Side Payload Validation ---");

  const validMockPayload = {
    source: "faculty",
    roles: ["Medical college faculty", "Medical Education Unit (MEU) member"],
    specialty: "Paediatrics",
    teachingExperience: "11–20 years",
    state: "Maharashtra",
    institutionName: "Grant Government Medical College, Mumbai",
    readinessRatings: {
      domain_a: "Well prepared",
      domain_j: "Poorly prepared",
      domain_b: "Reasonably prepared",
      domain_c: "Some preparation, but important gaps remain",
      domain_d: "Some preparation, but important gaps remain",
      domain_e: "Reasonably prepared",
      domain_f: "Well prepared",
      domain_g: "Poorly prepared",
      domain_h: "Some preparation, but important gaps remain",
      domain_i: "Reasonably prepared",
      domain_k: "Some preparation, but important gaps remain",
      domain_l: "Poorly prepared",
      domain_m: "Poorly prepared",
      domain_n: "Some preparation, but important gaps remain",
    },
    q9EmphasisAreas: ["domain_a", "domain_j", "domain_g", "domain_m"],
    q15FoundationCourseDescription: "Useful, but several important gaps remain",
    q16Limitations: ["Limited time", "Predominantly lecture-based delivery"],
    q13WishTaughtAtBeginning: "Learn to listen deeply to patients and manage clinical stress early.",
    q17UsefulFormats: ["Interactive faculty-led sessions", "Real-life scenarios and case discussions", "CPR / first-aid and lifesaving workshops"],
    q19InterestedInContributing: "Yes, I would be interested",
    q20ContributionTypes: ["Workshop Faculty / Facilitator", "CPR / First Aid Faculty"],
    q21PersonalTopicInterest: "Pediatric emergency resuscitation and communication",
    respondentName: "Dr. Ananya Joshi, Professor of Paediatrics",
    email: "ananya.joshi@example.ac.in",
    mobileWhatsapp: "9876543210",
    q28ConsentForContact: "Yes",
  };

  const validResult = validateProfessionalSurveyPayload(validMockPayload);
  assert(validResult.isValid === true, "Valid complete V2 payload passes validation");
  assert(validResult.sanitizedData?.surveyVersion === "v2", "Sanitized payload has surveyVersion = v2");
  assert(validResult.sanitizedData?.interestedInContributing === true, "interestedInContributing flag is true");
  assert(validResult.sanitizedData?.consentForFollowup === true, "consentForFollowup flag is true");

  // Test Email Only (without Mobile)
  const emailOnlyPayload = { ...validMockPayload, mobileWhatsapp: "" };
  const emailOnlyResult = validateProfessionalSurveyPayload(emailOnlyPayload);
  assert(emailOnlyResult.isValid === true, "Valid payload with Email only (no mobile) passes validation");

  // Test Mobile Only (without Email)
  const mobileOnlyPayload = { ...validMockPayload, email: "" };
  const mobileOnlyResult = validateProfessionalSurveyPayload(mobileOnlyPayload);
  assert(mobileOnlyResult.isValid === true, "Valid payload with Mobile only (no email) passes validation");

  // Test Rejection: Missing Name
  const missingNamePayload = { ...validMockPayload, respondentName: "" };
  const missingNameResult = validateProfessionalSurveyPayload(missingNamePayload);
  assert(missingNameResult.isValid === false, "Fails validation when respondentName is missing");

  // Test Rejection: Missing both Email and Mobile
  const noContactPayload = { ...validMockPayload, email: "", mobileWhatsapp: "" };
  const noContactResult = validateProfessionalSurveyPayload(noContactPayload);
  assert(noContactResult.isValid === false, "Fails validation when both email and mobile are missing");

  // Test Rejection: Invalid Email
  const badEmailPayload = { ...validMockPayload, email: "invalid-email-address" };
  const badEmailResult = validateProfessionalSurveyPayload(badEmailPayload);
  assert(badEmailResult.isValid === false, "Fails validation when email format is invalid");

  // Test Rejection: Missing Roles
  const noRolesPayload = { ...validMockPayload, roles: [] };
  const noRolesResult = validateProfessionalSurveyPayload(noRolesPayload);
  assert(noRolesResult.isValid === false, "Fails validation when roles array is empty");

  // Test Rejection: Missing one of 14 domains in Q5
  const missingDomainPayload = {
    ...validMockPayload,
    readinessRatings: { ...validMockPayload.readinessRatings, domain_j: "" },
  };
  const missingDomainResult = validateProfessionalSurveyPayload(missingDomainPayload);
  assert(missingDomainResult.isValid === false, "Fails validation when any domain in Q5 is missing rating");

  // Test Rejection: >5 selections in Q6
  const excessQ6Payload = {
    ...validMockPayload,
    q9EmphasisAreas: ["domain_a", "domain_j", "domain_b", "domain_c", "domain_d", "domain_e"],
  };
  const excessQ6Result = validateProfessionalSurveyPayload(excessQ6Payload);
  assert(excessQ6Result.isValid === false, "Fails validation when Q6 has >5 selections");

  // Test Rejection: >3 selections in Q8
  const excessQ8Payload = {
    ...validMockPayload,
    q16Limitations: ["Limited time", "Variable faculty engagement", "Predominantly lecture-based delivery", "Other"],
  };
  const excessQ8Result = validateProfessionalSurveyPayload(excessQ8Payload);
  assert(excessQ8Result.isValid === false, "Fails validation when Q8 has >3 selections");

  // --------------------------------------------------------------------------
  // TEST GROUP 5: Database Persistence, Admin Aggregation & Cleanup
  // --------------------------------------------------------------------------
  console.log("\n--- TEST GROUP 5: Database Persistence & Cleanup ---");

  const testPayload = {
    ...validMockPayload,
    respondentName: "TEST_AUTOMATED_V2_AUDIT_USER",
    email: "test_v2_audit@mbbsfoundation.test",
  };

  const validated = validateProfessionalSurveyPayload(testPayload);
  assert(validated.isValid && Boolean(validated.sanitizedData), "Test submission payload validated");

  const d = validated.sanitizedData!;
  const createdRecord = await prisma.mBBSProfessionalSurveyResponse.create({
    data: {
      surveyVersion: d.surveyVersion,
      source: d.source,
      roles: d.roles,
      specialty: d.specialty,
      teachingExperience: d.teachingExperience,
      institutionName: d.institutionName,
      city: d.city,
      state: d.state,
      stateCode: d.stateCode,
      surveyResponses: d.surveyResponses,
      interestedInContributing: d.interestedInContributing,
      contributionInterests: d.q20ContributionTypes,
      willingToShareReadinessSurvey: d.willingToShareReadinessSurvey,
      respondentName: d.respondentName,
      email: d.email,
      mobileWhatsapp: d.mobileWhatsapp,
      consentForFollowup: d.consentForFollowup,
      referralCode: null,
      submissionFingerprint: null,
    },
  });

  assert(Boolean(createdRecord.id), `Test record persisted with ID: ${createdRecord.id}`);
  assert(createdRecord.surveyVersion === "v2", `Persisted record has surveyVersion = v2 (got: ${createdRecord.surveyVersion})`);
  assert(createdRecord.respondentName === "TEST_AUTOMATED_V2_AUDIT_USER", "Respondent name persisted accurately");
  assert(createdRecord.interestedInContributing === true, "interestedInContributing persisted as true");

  // Verify Admin Summary includes this response
  const summary = await getConsultationDashboardSummary();
  assert(summary.totalResponses >= 1, `Dashboard summary includes test record (total: ${summary.totalResponses})`);
  assert(summary.interestedContributors >= 1, `Dashboard summary contributors count >= 1`);

  // Verify Admin Responses List finds this response
  const fetchedResponses = await getConsultationResponses({ search: "TEST_AUTOMATED_V2_AUDIT_USER" });
  assert(fetchedResponses.length === 1, "Admin filter search finds the test record");
  assert(fetchedResponses[0].id === createdRecord.id, "Admin fetched ID matches created ID");

  // Clean up test submission
  await prisma.mBBSProfessionalSurveyResponse.delete({
    where: { id: createdRecord.id },
  });
  console.log(`  ✓ [PASS] Test record ${createdRecord.id} successfully removed from PostgreSQL.`);

  // --------------------------------------------------------------------------
  // TEST GROUP 6: Protected CPR Systems & Invariant Integrity
  // --------------------------------------------------------------------------
  console.log("\n--- TEST GROUP 6: Protected CPR Systems & Invariant Integrity ---");

  const mhReport = getCPRDayReconciliationReport("Maharashtra");
  assert(Boolean(mhReport && mhReport.centres), "Maharashtra CPR report loaded cleanly");
  assert((mhReport?.centres?.length || 0) === 42, `Maharashtra has 42 centres (got: ${mhReport?.centres?.length})`);

  const wbReport = getCPRDayReconciliationReport("West Bengal");
  assert(Boolean(wbReport && wbReport.centres), "West Bengal CPR report loaded cleanly");
  assert((wbReport?.centres?.length || 0) === 27, `West Bengal has 27 centres (got: ${wbReport?.centres?.length})`);

  const lockedStates = getLockedCensusStateList();
  assert(lockedStates.length === 28, `Authoritative locked States count = 28 (got: ${lockedStates.length})`);

  const national = getCPRDayNationalConsolidatedReport();
  assert(national.summary.reconciledReport.coursesConducted === 395, `National Draft Courses = 395 (got: ${national.summary.reconciledReport.coursesConducted})`);
  assert(national.summary.reconciledReport.participantsTrained === 47033, `National Draft Reconciled Trained = 47,033 (got: ${national.summary.reconciledReport.participantsTrained})`);
  assert(national.summary.reconciledReport.participantsCertified === 33477, `National Participants Certified = 33,477 (got: ${national.summary.reconciledReport.participantsCertified})`);

  // Student Voice Model & Config Check
  assert(typeof (prisma as any).mBBSStudentVoiceSurveyResponse !== "undefined", "MBBSStudentVoiceSurveyResponse model intact");

  console.log("\n================================================================================");
  console.log("ALL LOCKED PROFESSIONAL CONSULTATION V2 TESTS PASSED (100%)");
  console.log("================================================================================");
}

runTestSuite().catch((err) => {
  console.error("Test Suite crashed:", err);
  process.exit(1);
});
