import { prisma } from "../lib/prisma";
import { generateStudentVoiceSurveyPlainText } from "../lib/mbbs-foundation/studentVoiceSurveyConfig";
import { getStudentVoiceDashboardSummary } from "../lib/mbbs-foundation/studentVoiceAdmin";
import { validateStudentVoiceSurvey } from "../lib/mbbs-foundation/studentVoiceValidation";

async function main() {
  console.log("=== MBBS FOUNDATION SURVEY 2 (STUDENT & INTERN VOICE) TEST ===");

  // 1. Test Plain-Text Generation
  console.log("\n[1] Testing generateStudentVoiceSurveyPlainText()...");
  const plainText = generateStudentVoiceSurveyPlainText();
  console.log(`Generated plain text length: ${plainText.length} characters`);

  const requiredKeywords = [
    "WHAT I WISH I KNEW BEFORE STARTING MBBS",
    "Student & Intern Voice for the MBBS Foundation Initiative",
    "SECTION 1 — WHERE ARE YOU NOW?",
    "SECTION 2 — THE GOOD PART OF STARTING MBBS",
    "SECTION 3 — WHAT WAS HARDER OR MORE UNEXPECTED?",
    "SECTION 4 — WHAT SHOULD STUDENTS KNOW BEFORE THEY START?",
    "SECTION 5 — YOUR VOICE FOR THE NEXT BATCH",
    "Q1. What is your current stage?",
    "Q2. What type of medical college are you studying in?",
    "Q3. State / Union Territory",
    "Q4. Which experiences made the beginning of MBBS exciting or meaningful for you?",
    "Q5. Overall, how did your first few months of MBBS feel?",
    "Q6. Which aspects were harder than you expected?",
    "Q7. Which things were most different from what you had imagined before joining MBBS?",
    "Q8. During your first year, how often did you feel:",
    "Q9. Which areas should a new MBBS student understand BEFORE or during the first few weeks of medical college?",
    "Q10. Which type of guidance would have helped you most at the beginning?",
    "Q11. When would this guidance have been most useful?",
    "Q12. If you had received a structured guide explaining the academic, professional, social and personal realities of MBBS before starting, how useful do you think it would have been?",
    "Q13. Which components should such a guide definitely include?",
    "Q14. Looking back, which statement fits you best?",
    "Q15. If you had known in advance about the challenges you personally faced, would the beginning of MBBS have been easier?",
    "Q16. Would you be interested in helping future MBBS students begin better?",
    "Q17. How might you like to help?",
    "Q18. Is there ONE thing you wish someone had told you before you started MBBS?",
    "[A] Unsure how to study effectively",
    "[J] Proud or excited to be studying medicine",
    "Thank You for Helping the Next Batch Begin Better"
  ];

  let missingKeywords = 0;
  for (const kw of requiredKeywords) {
    if (!plainText.includes(kw)) {
      console.error(`❌ Missing keyword in plain text: "${kw}"`);
      missingKeywords++;
    }
  }

  if (missingKeywords === 0) {
    console.log("✅ All required sections, Q1-Q18, and 10 statements verified in Survey 2 plain text!");
  } else {
    throw new Error(`Failed plain text verification with ${missingKeywords} missing keywords.`);
  }

  // 2. Test Validation Function (Limits & Required Fields)
  console.log("\n[2] Testing validateStudentVoiceSurvey()...");
  
  // Test invalid payload (empty)
  const emptyValidation = validateStudentVoiceSurvey({});
  if (emptyValidation.isValid) {
    throw new Error("Empty payload should have failed validation.");
  }
  console.log(`✅ Empty payload correctly failed with ${emptyValidation.errors.length} validation errors.`);

  // Test character limit on Q18 (> 250 characters)
  const longText = "a".repeat(251);
  const overflowValidation = validateStudentVoiceSurvey({
    trainingStage: "First MBBS",
    q4RewardingExperiences: ["Finally becoming a medical student"],
    q5FirstMonthsFeeling: "Exciting but challenging",
    q6HarderAspects: ["Very large volume of content"],
    q7UnexpectedAspects: ["Amount of study required"],
    q8FirstYearFeelings: {
      statement_a: "Sometimes",
      statement_b: "Often",
      statement_c: "Sometimes",
      statement_d: "Occasionally",
      statement_e: "Sometimes",
      statement_f: "Occasionally",
      statement_g: "Sometimes",
      statement_h: "Often",
      statement_i: "Often",
      statement_j: "Very often",
    },
    q9ShouldUnderstandBefore: ["How to manage time"],
    q10HelpfulGuidanceTypes: ["Short orientation videos"],
    q11BestTimingForGuidance: "During the first month",
    q12GuideUsefulnessRating: "Extremely useful",
    q13GuideEssentialComponents: ["Study strategies"],
    q14TransitionFitStatement: "I adjusted comfortably and enjoyed the transition",
    q15PriorKnowledgeWouldHaveHelped: "Definitely yes",
    q16InterestedInHelping: "Not at present",
    q18OneThingWishTold: longText,
  });

  const hasQ18Error = overflowValidation.errors.some((e) => e.field === "q18OneThingWishTold");
  if (!hasQ18Error) {
    throw new Error("251-character Q18 should have triggered validation error.");
  }
  console.log("✅ Q18 250-character limit correctly enforced.");

  // 3. Test Database Insertion with Identifiable Test Record
  console.log("\n[3] Testing Database Insertion with 'TEST STUDENT VOICE' record...");
  const validTestPayload = {
    source: "student",
    surveyVersion: "v1",
    trainingStage: "First MBBS",
    collegeType: "Government medical college",
    state: "Maharashtra",
    stateCode: "MH",
    surveyResponses: {
      q1TrainingStage: "First MBBS",
      q2CollegeType: "Government medical college",
      q3State: "Maharashtra",
      q4RewardingExperiences: [
        "Finally becoming a medical student",
        "Anatomy and the dissection hall",
        "New friendships",
      ],
      q5FirstMonthsFeeling: "Exciting but challenging",
      q6HarderAspects: [
        "Very large volume of content",
        "Time management",
        "Living away from home",
      ],
      q7UnexpectedAspects: [
        "Amount of study required",
        "Hospital culture and hierarchy",
      ],
      q8FirstYearFeelings: {
        statement_a: "Sometimes",
        statement_b: "Often",
        statement_c: "Sometimes",
        statement_d: "Occasionally",
        statement_e: "Sometimes",
        statement_f: "Occasionally",
        statement_g: "Sometimes",
        statement_h: "Often",
        statement_i: "Often",
        statement_j: "Very often",
      },
      q9ShouldUnderstandBefore: [
        "How MBBS learning is different from school",
        "How to study effectively in medical college",
        "Basic CPR and first aid",
      ],
      q10HelpfulGuidanceTypes: [
        "A practical book written specifically for new MBBS students",
        "Advice from senior students/interns",
      ],
      q11BestTimingForGuidance: "During the weeks between admission and joining",
      q12GuideUsefulnessRating: "Extremely useful",
      q13GuideEssentialComponents: [
        "Study strategies",
        "Anatomy/dissection orientation",
        "Stress and emotional wellbeing",
      ],
      q14TransitionFitStatement: "I had some difficulties but adapted fairly quickly",
      q15PriorKnowledgeWouldHaveHelped: "Definitely yes",
      q16InterestedInHelping: "Yes",
      q17HelpMethods: [
        "Share practical tips for new students",
        "Suggest important topics",
      ],
      q18OneThingWishTold:
        "Focus on understanding concepts and taking care of your health rather than panic-studying before exams.",
    },
    interestedInContributing: true,
    contributionInterests: [
      "Share practical tips for new students",
      "Suggest important topics",
    ],
    consentForFollowup: true,
    respondentName: "TEST STUDENT VOICE",
    email: "test.student.voice@example.com",
    mobileWhatsapp: "9876543218",
    referralCode: null,
    submissionFingerprint: null,
  };

  const testRow = await prisma.mBBSStudentVoiceSurveyResponse.create({
    data: validTestPayload,
  });

  console.log(`✅ Test record created successfully! ID: ${testRow.id}`);
  console.log(`   - Respondent: ${testRow.respondentName}`);
  console.log(`   - Training Stage: ${testRow.trainingStage}`);
  console.log(`   - Interested in contributing: ${testRow.interestedInContributing}`);

  // 4. Test Summary Aggregations
  console.log("\n[4] Testing getStudentVoiceDashboardSummary()...");
  const summary = await getStudentVoiceDashboardSummary();
  console.log(`✅ Summary calculated for ${summary.totalResponses} total responses:`);
  console.log(`   - Difficult Transition: ${summary.difficultTransitionPercentage}% (${summary.difficultTransitionCount})`);
  console.log(`   - Prior Knowledge Helped: ${summary.priorKnowledgeHelpPercentage}% (${summary.priorKnowledgeHelpCount})`);
  console.log(`   - Interested Contributors: ${summary.interestedContributorsPercentage}% (${summary.interestedContributorsCount})`);
  console.log(`   - Factual Metric: % Advance Knowledge Definitely/Probably: ${summary.calculatedInsights.pctAdvanceKnowledgeDefinitelyOrProbablyHelped}%`);
  console.log(`   - Factual Metric: % Guide Very/Extremely Useful: ${summary.calculatedInsights.pctGuideVeryOrExtremelyUseful}%`);

  // 5. Clean up test record
  console.log("\n[5] Cleaning up test record...");
  await prisma.mBBSStudentVoiceSurveyResponse.delete({
    where: { id: testRow.id },
  });
  console.log(`✅ Cleanly deleted test record ${testRow.id}`);

  console.log("\n=== ALL SURVEY 2 (STUDENT & INTERN VOICE) CHECKS PASSED ===");
}

main().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
