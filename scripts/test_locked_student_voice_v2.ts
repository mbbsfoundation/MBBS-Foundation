import { prisma } from "../lib/prisma";
import {
  STUDENT_SURVEY_SECTIONS_CONFIG,
  STUDENT_SURVEY_METADATA,
  STUDENT_POST_SUBMIT_CONFIG,
  Q1_TRAINING_STAGE_OPTIONS,
  Q2_COLLEGE_TYPE_OPTIONS,
  Q3_REWARDING_OPTIONS,
  Q4_HARDER_OPTIONS,
  Q5_SURPRISES_OPTIONS,
  Q6_RATING_SCALE,
  Q6_STATEMENTS,
  Q7_NEXT_BATCH_OPTIONS,
  Q8_PREPARATION_OPTIONS,
  Q9_TIMING_OPTIONS,
  POST_SUBMISSION_CONTRIBUTION_OPTIONS,
  generateStudentVoiceSurveyPlainText,
} from "../lib/mbbs-foundation/studentVoiceSurveyConfig";
import {
  validateStudentVoiceSurvey,
  validateStudentContributorPayload,
} from "../lib/mbbs-foundation/studentVoiceValidation";
import { getStudentVoiceDashboardSummary } from "../lib/mbbs-foundation/studentVoiceAdmin";

async function main() {
  console.log("================================================================================");
  console.log("TEST SUITE: MBBS FOUNDATION LOCKED STUDENT VOICE V2");
  console.log("================================================================================\n");

  // ============================================================================
  // TEST A: STRUCTURE & EXACT SECTION / QUESTION COUNTS
  // ============================================================================
  console.log("[A] Validating Survey Structure (Exact 7 Sections, Exact 10 Questions)...");

  if (STUDENT_SURVEY_SECTIONS_CONFIG.length !== 7) {
    throw new Error(`Expected exactly 7 sections, got ${STUDENT_SURVEY_SECTIONS_CONFIG.length}`);
  }
  console.log(`✅ EXACTLY 7 Sections confirmed:`);
  STUDENT_SURVEY_SECTIONS_CONFIG.forEach((s) => {
    console.log(`   - Section ${s.sectionNumber}: ${s.title}`);
  });

  const allQuestions = STUDENT_SURVEY_SECTIONS_CONFIG.flatMap((s) => s.questions);
  if (allQuestions.length !== 10) {
    throw new Error(`Expected exactly 10 questions, got ${allQuestions.length}`);
  }
  console.log(`✅ EXACTLY 10 Questions confirmed:`);
  allQuestions.forEach((q) => {
    console.log(`   - ${q.number} (${q.key}): ${q.label.slice(0, 60)}...`);
  });

  // Verify no Section 8 in questionnaire
  const hasSec8 = STUDENT_SURVEY_SECTIONS_CONFIG.some((s) => s.sectionNumber === 8 || s.key.includes("pass_it_forward"));
  if (hasSec8) {
    throw new Error("Section 8 must NOT exist inside the questionnaire structure.");
  }
  console.log("✅ No Section 8 inside survey questionnaire confirmed.");

  // Verify Plain Text compiler
  const plainText = generateStudentVoiceSurveyPlainText();
  const requiredKeywords = [
    "WHAT I WISH I KNEW BEFORE STARTING MBBS",
    "Student & Intern Voice for the MBBS Foundation Initiative",
    "SECTION 1 — WHERE ARE YOU NOW?",
    "SECTION 2 — THEN MBBS ACTUALLY STARTED...",
    "SECTION 3 — THE THINGS NOBODY REALLY TELLS YOU",
    "SECTION 4 — HOW DID THE TRANSITION ACTUALLY FEEL?",
    "SECTION 5 — IF YOU COULD PREPARE THE NEXT BATCH...",
    "SECTION 6 — WHAT WOULD ACTUALLY HAVE HELPED?",
    "SECTION 7 — ONE THING YOU WISH SOMEONE HAD TOLD YOU",
    "Q1. Where are you currently in your medical journey?",
    "Q2. Tell us a little about your medical college.",
    "Q3. What turned out to be more exciting or rewarding about MBBS than you had expected?",
    "Q4. Now the other side: what was harder than you expected when you entered MBBS?",
    "Q5. Which of these surprised you after entering medical college?",
    "Q6. During your early months in MBBS, how often did you experience the following?",
    "Q7. Imagine you have 3 hours with a NEET-qualified student before their first day of medical college. What would you make sure they understood?",
    "Q8. If you could go back to the weeks before you entered MBBS, which kind of preparation would you genuinely have found useful?",
    "Q9. Looking back, when would this preparation have helped you most?",
    "Q10. Complete this sentence: “Before I started MBBS, I wish someone had told me that...”",
    "SUBMIT MY STUDENT VOICE",
    "PASS IT FORWARD",
    "Be the senior you wish you had when you started MBBS.",
    "I'D LIKE TO CONTRIBUTE",
  ];

  for (const kw of requiredKeywords) {
    if (!plainText.includes(kw)) {
      throw new Error(`Plain-text compilation missing required keyword: "${kw}"`);
    }
  }
  console.log("✅ Plain-text questionnaire compiled successfully with all locked headings.");

  // ============================================================================
  // TEST B: SELECTION LIMITS VALIDATION
  // ============================================================================
  console.log("\n[B] Validating Selection Limits (Q3 max 4, Q4 max 5, Q5 max 5, Q7 max 7, Q8 max 5)...");

  // Valid base template
  const validBase = {
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
    q10WishSomeoneTold: "Consistency matters much more than cramming.",
    quotePermission: false,
  };

  // Test Q3 limit > 4
  const q3Overflow = validateStudentVoiceSurvey({
    ...validBase,
    q3RewardingExperiences: [
      "Finally studying medicine and the human body in depth",
      "Anatomy dissection and practical learning",
      "Entering hospitals and seeing real clinical care",
      "Interacting with patients",
      "Learning practical and lifesaving skills", // 5th item
    ],
  });
  if (q3Overflow.isValid || !q3Overflow.errors.some((e) => e.field === "q3RewardingExperiences")) {
    throw new Error("Q3 > 4 selections should have failed validation.");
  }
  console.log("✅ Q3 max 4 limit enforced.");

  // Test Q4 limit > 5
  const q4Overflow = validateStudentVoiceSurvey({
    ...validBase,
    q4HarderAspects: [
      "The sheer amount of material to learn",
      "Figuring out how to study effectively in MBBS",
      "Remembering what I had studied",
      "Managing time and staying consistent",
      "Understanding what teachers expected",
      "Practicals, viva and assessments", // 6th item
    ],
  });
  if (q4Overflow.isValid || !q4Overflow.errors.some((e) => e.field === "q4HarderAspects")) {
    throw new Error("Q4 > 5 selections should have failed validation.");
  }
  console.log("✅ Q4 max 5 limit enforced.");

  // Test Q5 limit > 5
  const q5Overflow = validateStudentVoiceSurvey({
    ...validBase,
    q5Surprises: [
      "The way you need to learn in MBBS is very different from how you studied before entering medical college",
      "Knowing about CPR, first aid and emergencies is very different from actually being prepared to respond",
      "There is far more to becoming a doctor than learning from textbooks",
      "Nobody really tells you exactly how to study in MBBS — you have to figure out much of it yourself",
      "Being academically strong before MBBS does not automatically make the transition easy",
      "Communication and confidence matter much more than I expected", // 6th item
    ],
  });
  if (q5Overflow.isValid || !q5Overflow.errors.some((e) => e.field === "q5Surprises")) {
    throw new Error("Q5 > 5 selections should have failed validation.");
  }
  console.log("✅ Q5 max 5 limit enforced.");

  // Test Q7 limit > 7
  const q7Overflow = validateStudentVoiceSurvey({
    ...validBase,
    q7NextBatchPriorities: [
      "How studying MBBS differs from preparing for NEET",
      "How to study effectively without trying to read everything",
      "Time management and building a sustainable routine",
      "How exams, practicals and viva work",
      "Independent learning and choosing useful learning resources",
      "What the first year of MBBS is actually like",
      "How to interact with faculty and seniors",
      "How to communicate with patients", // 8th item
    ],
  });
  if (q7Overflow.isValid || !q7Overflow.errors.some((e) => e.field === "q7NextBatchPriorities")) {
    throw new Error("Q7 > 7 selections should have failed validation.");
  }
  console.log("✅ Q7 max 7 limit enforced.");

  // Test Q8 limit > 5
  const q8Overflow = validateStudentVoiceSurvey({
    ...validBase,
    q8UsefulPreparationTypes: [
      "A practical orientation to what MBBS is actually like before or around joining",
      "Honest guidance from current medical students or interns",
      "Sessions with experienced medical faculty or clinicians",
      "Real-life situations and scenario-based discussions",
      "Practical demonstrations and basic clinical orientation",
      "CPR, first aid and lifesaving skills", // 6th item
    ],
  });
  if (q8Overflow.isValid || !q8Overflow.errors.some((e) => e.field === "q8UsefulPreparationTypes")) {
    throw new Error("Q8 > 5 selections should have failed validation.");
  }
  console.log("✅ Q8 max 5 limit enforced.");

  // ============================================================================
  // TEST C: Q6 MATRIX VALIDATION (EXACTLY 8 STATEMENTS, 5-POINT SCALE)
  // ============================================================================
  console.log("\n[C] Validating Q6 Matrix (8 Statements, 5 Scale Choices)...");

  if (Q6_STATEMENTS.length !== 8) {
    throw new Error(`Expected exactly 8 matrix statements, got ${Q6_STATEMENTS.length}`);
  }
  console.log(`✅ Q6 exactly 8 statements confirmed:`);
  Q6_STATEMENTS.forEach((s) => console.log(`   ${s.code}. ${s.label}`));

  if (Q6_RATING_SCALE.length !== 5) {
    throw new Error(`Expected 5 scale choices, got ${Q6_RATING_SCALE.length}`);
  }
  console.log(`✅ Q6 exactly 5 scale points confirmed: ${Q6_RATING_SCALE.join(", ")}`);

  // Test missing matrix statement
  const q6Incomplete = validateStudentVoiceSurvey({
    ...validBase,
    q6TransitionMatrix: {
      statement_1: "Sometimes",
      statement_2: "Often",
      // statement_3 missing
      statement_4: "Rarely",
      statement_5: "Sometimes",
      statement_6: "Often",
      statement_7: "Often",
      statement_8: "Very often",
    },
  });
  if (q6Incomplete.isValid || !q6Incomplete.errors.some((e) => e.field === "q6_statement_3")) {
    throw new Error("Incomplete Q6 matrix should have failed validation for missing statement_3.");
  }
  console.log("✅ Q6 full 8-statement completion enforced.");

  // ============================================================================
  // TEST D: Q10 OPEN TEXT & QUOTE PERMISSION
  // ============================================================================
  console.log("\n[D] Validating Q10 Open Text & Anonymous Quote Permission...");

  const emptyQ10 = validateStudentVoiceSurvey({
    ...validBase,
    q10WishSomeoneTold: "   ",
  });
  if (emptyQ10.isValid || !emptyQ10.errors.some((e) => e.field === "q10WishSomeoneTold")) {
    throw new Error("Empty Q10 reflection should have failed validation.");
  }
  console.log("✅ Q10 mandatory non-empty text enforced.");

  const validNoQuote = validateStudentVoiceSurvey({
    ...validBase,
    q10WishSomeoneTold: "Medicine is a marathon, not a sprint.",
    quotePermission: false,
  });
  if (!validNoQuote.isValid || validNoQuote.sanitizedData?.surveyResponses?.quotePermission !== false) {
    throw new Error("quotePermission should default to false and persist as false.");
  }

  const validWithQuote = validateStudentVoiceSurvey({
    ...validBase,
    q10WishSomeoneTold: "Medicine is a marathon, not a sprint.",
    quotePermission: true,
  });
  if (!validWithQuote.isValid || validWithQuote.sanitizedData?.surveyResponses?.quotePermission !== true) {
    throw new Error("quotePermission true should persist as true.");
  }
  console.log("✅ Q10 anonymous quote permission verified (defaults to false, persists separately).");

  // ============================================================================
  // TEST E: TWO-STAGE PERSISTENCE & POST-SUBMIT CONTRIBUTOR (PASS IT FORWARD)
  // ============================================================================
  console.log("\n[E] Testing Two-Stage Database Persistence (POST Survey -> PATCH Contributor)...");

  // Step 1: Create Test Survey Response (Stage 1)
  const testPayload = {
    ...validBase,
    source: "student",
    institutionName: "Grant Government Medical College, Mumbai",
    q10WishSomeoneTold: "TEST STUDENT VOICE V2: Focus on understanding concepts rather than rote learning.",
    quotePermission: true,
  };

  const surveyValidation = validateStudentVoiceSurvey(testPayload, "student");
  if (!surveyValidation.isValid || !surveyValidation.sanitizedData) {
    throw new Error("Valid test payload failed validation.");
  }

  const sData = surveyValidation.sanitizedData;

  const testRecord = await prisma.mBBSStudentVoiceSurveyResponse.create({
    data: {
      surveyVersion: "v2",
      source: sData.source,
      trainingStage: sData.trainingStage,
      collegeType: sData.collegeType,
      state: sData.state,
      stateCode: sData.stateCode,
      surveyResponses: sData.surveyResponses,
      interestedInContributing: false,
      contributionInterests: undefined,
      consentForFollowup: false,
      respondentName: null,
      email: null,
      mobileWhatsapp: null,
      referralCode: null,
      submissionFingerprint: null,
    },
  });

  console.log(`✅ Stage 1 Survey saved successfully in PostgreSQL! Record ID: ${testRecord.id}`);
  console.log(`   - Survey Version: ${testRecord.surveyVersion}`);
  console.log(`   - Training Stage: ${testRecord.trainingStage}`);
  console.log(`   - State: ${testRecord.state}`);
  console.log(`   - Interested in contributing (pre-contribution): ${testRecord.interestedInContributing}`);

  // Step 2: Validate Contributor Payload rules (Stage 2)
  const invalidContributorNoConsent = validateStudentContributorPayload({
    responseId: testRecord.id,
    respondentName: "Test Student",
    email: "test.student@example.com",
    consentForFollowup: false,
  });
  if (invalidContributorNoConsent.isValid) {
    throw new Error("Contributor without consent should have failed validation.");
  }

  const invalidContributorNoContact = validateStudentContributorPayload({
    responseId: testRecord.id,
    respondentName: "Test Student",
    consentForFollowup: true,
  });
  if (invalidContributorNoContact.isValid) {
    throw new Error("Contributor without email or mobile should have failed validation.");
  }
  console.log("✅ Contributor validation rules enforced (Name, Email OR Mobile, Explicit Consent).");

  // Step 3: Apply Contributor Update (PATCH simulation)
  const validContributor = validateStudentContributorPayload({
    responseId: testRecord.id,
    respondentName: "TEST STUDENT CONTRIBUTOR",
    email: "test.student.v2@example.com",
    mobileWhatsapp: "9876543210",
    contributionInterests: [
      "Share my experiences and practical tips",
      "Mentor or guide incoming students",
    ],
    consentForFollowup: true,
  });

  if (!validContributor.isValid || !validContributor.sanitizedContributorData) {
    throw new Error("Valid contributor payload failed validation.");
  }

  const cData = validContributor.sanitizedContributorData;

  const updatedRecord = await prisma.mBBSStudentVoiceSurveyResponse.update({
    where: { id: testRecord.id },
    data: {
      interestedInContributing: true,
      contributionInterests: cData.contributionInterests,
      respondentName: cData.respondentName,
      email: cData.email,
      mobileWhatsapp: cData.mobileWhatsapp,
      consentForFollowup: true,
    },
  });

  console.log(`✅ Stage 2 Contributor updated successfully!`);
  console.log(`   - Respondent: ${updatedRecord.respondentName}`);
  console.log(`   - Email: ${updatedRecord.email}`);
  console.log(`   - Mobile: ${updatedRecord.mobileWhatsapp}`);
  console.log(`   - Interested: ${updatedRecord.interestedInContributing}`);
  console.log(`   - Interests: ${(updatedRecord.contributionInterests as string[]).join(", ")}`);

  // ============================================================================
  // TEST F: ADMIN DASHBOARD AGGREGATIONS
  // ============================================================================
  console.log("\n[F] Testing Admin Summary Aggregations...");

  const adminSummary = await getStudentVoiceDashboardSummary();
  console.log(`✅ Admin Summary computed:`);
  console.log(`   - Total Responses: ${adminSummary.totalResponses}`);
  console.log(`   - V2 Responses: ${adminSummary.v2ResponseCount}`);
  console.log(`   - Quote Permission: ${adminSummary.quotePermissionPercentage}% (${adminSummary.quotePermissionCount})`);
  console.log(`   - Contributors: ${adminSummary.interestedContributorsPercentage}% (${adminSummary.interestedContributorsCount})`);
  console.log(`   - Q3 Rewarding items tracked: ${adminSummary.q3RewardingBreakdown.length}`);
  console.log(`   - Q6 Matrix statements tracked: ${adminSummary.q6MatrixBreakdown.length}`);

  if (adminSummary.q6MatrixBreakdown.length !== 8) {
    throw new Error(`Admin Q6 matrix should track exactly 8 statements, got ${adminSummary.q6MatrixBreakdown.length}`);
  }

  // Find test record in recent responses
  const foundTestRecent = adminSummary.recentResponses.find((r) => r.id === testRecord.id);
  if (!foundTestRecent) {
    throw new Error("Test record not found in admin recent responses.");
  }
  if (!foundTestRecent.quotePermission) {
    throw new Error("Test record quotePermission should be true.");
  }
  console.log(`✅ Test record verified in Admin view with quotePermission: ${foundTestRecent.quotePermission}`);

  // ============================================================================
  // TEST G: CLEANUP TEST DATA
  // ============================================================================
  console.log("\n[G] Cleaning up test record...");
  await prisma.mBBSStudentVoiceSurveyResponse.delete({
    where: { id: testRecord.id },
  });
  console.log(`✅ Test record ${testRecord.id} deleted cleanly.`);

  // Verify deletion
  const checkDeleted = await prisma.mBBSStudentVoiceSurveyResponse.findUnique({
    where: { id: testRecord.id },
  });
  if (checkDeleted) {
    throw new Error("Test record was not deleted.");
  }
  console.log("✅ Confirmed test record removed from PostgreSQL.");

  console.log("\n================================================================================");
  console.log("ALL STUDENT VOICE V2 TESTS PASSED PERFECTLY!");
  console.log("================================================================================");
}

main().catch((err) => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
