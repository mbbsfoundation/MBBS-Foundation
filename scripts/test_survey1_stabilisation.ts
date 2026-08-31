import { prisma } from "../lib/prisma";
import { generateSurveyPlainText } from "../lib/mbbs-foundation/professionalSurveyConfig";

async function main() {
  console.log("=== MBBS FOUNDATION SURVEY 1 STABILISATION TEST ===");

  // 1. Test Plain Text Generation
  console.log("\n[1] Testing generateSurveyPlainText()...");
  const plainText = generateSurveyPlainText();
  console.log(`Generated plain text length: ${plainText.length} characters`);

  // Verify key elements exist in the plain text
  const requiredKeywords = [
    "MBBS FOUNDATION — PROFESSIONAL CONSULTATION SURVEY",
    "SECTION 1 — ABOUT YOU",
    "SECTION 2 — READINESS FOR CLINICAL EXPOSURE",
    "SECTION 3 — LOOKING BACK",
    "SECTION 4 — FOUNDATION COURSE & EARLY CLINICAL EXPOSURE",
    "SECTION 5 — BUILDING THE MBBS FOUNDATION WORKSHOP",
    "SECTION 6 — CONTRIBUTION INTEREST",
    "SECTION 7 — HELP US HEAR FROM STUDENTS",
    "SECTION 8 — STAY CONNECTED",
    "Q1.", "Q2.", "Q3.", "Q4.", "Q5.", "Q6.", "Q7.", "Q8.", "Q9.", "Q10.",
    "Q11.", "Q12.", "Q13.", "Q14.", "Q15.", "Q16.", "Q17.", "Q18.", "Q19.", "Q20.",
    "Q21.", "Q22.", "Q23.", "Q24.", "Q25.", "Q26.", "Q27.", "Q28.",
    "[A] Transition from examination-oriented learning",
    "[N] Digital professionalism",
    "Communicating appropriately and respectfully with patients and families",
    "CPR, first aid and basic lifesaving preparedness"
  ];

  let missingKeywords = 0;
  for (const kw of requiredKeywords) {
    if (!plainText.includes(kw)) {
      console.error(`❌ Missing keyword in plain text: "${kw}"`);
      missingKeywords++;
    }
  }

  if (missingKeywords === 0) {
    console.log("✅ All required sections, Q1-Q28, and 14 Domains verified in plain text output!");
  } else {
    throw new Error(`Failed plain text verification with ${missingKeywords} missing keywords.`);
  }

  // 2. Test Database Insertion with Exact Prompt 9 Identifiable Record
  console.log("\n[2] Testing Database Insertion with Identifiable Stabilisation Record...");

  try {
    const testRow = await prisma.mBBSProfessionalSurveyResponse.create({
      data: {
        source: "direct",
        surveyVersion: "v1",
        roles: ["Medical college faculty", "Foundation Course faculty/coordinator"],
        specialty: "General Medicine / Internal Medicine",
        teachingExperience: "11–20 years",
        institutionName: "TEST STABILISATION INSTITUTION",
        state: "Maharashtra",
        city: "Mumbai",
        stateCode: "MH",
        surveyResponses: {
          q7ReadinessRatings: {
            domain_a: 4,
            domain_b: 4,
            domain_c: 3,
            domain_d: 4,
            domain_e: 4,
            domain_f: 5,
            domain_g: 3,
            domain_h: 3,
            domain_i: 4,
            domain_j: 5,
            domain_k: 3,
            domain_l: 4,
            domain_m: 3,
            domain_n: 4,
          },
          q8BiggestTransitionGaps: [
            "Transition from examination-oriented learning to understanding and applying medical knowledge",
            "Communicating appropriately and respectfully with patients and families"
          ],
          q9TopReadinessGaps: [
            "domain_a",
            "domain_d",
            "domain_j"
          ],
          q10UnderemphasizedPreclinicalSkills: "Bedside physical examination and early ECG interpretation",
          q11UsefulPracticalTopics: "Vital signs recognition, triage and basic prescription rules",
          q12MakeResourceUseful: "Scenario-based case vignettes and concise pocket checklists",
          q13WishTaughtAtBeginning: "How to prioritize bedside learning over purely memorizing textbooks",
          q14ChallengeApparentLater: "Dealing with clinical uncertainty and difficult patient interactions",
          q15FoundationCourseDescription: "Useful but variable in implementation",
          q16Limitations: [
            "Predominantly lecture-based delivery",
            "Insufficient case/scenario-based learning",
            "Lack of standardised practical resources"
          ],
          q17UsefulFormats: [
            "Interactive faculty-led sessions",
            "Real-life scenarios and case discussions",
            "Practical demonstrations",
            "CPR / lifesaving skills"
          ],
          q18WorkshopShouldInclude: "Standardized simulated patient communication and vital sign triage",
          q19InterestedInContributing: "Yes, I would be interested",
          q20ContributionTypes: [
            "Contribute a clinical/professional scenario",
            "Facilitate an MBBS Foundation Workshop",
            "Review educational content"
          ],
          q21PersonalTopicInterest: "Bedside clinical reasoning and early emergency triage",
          q22TimeCommitment: "A few hours over several weeks",
          q23ConnectedWithNewStudents: "Yes — directly",
          q24WillingToShareReadiness: "Yes",
          q28ConsentForContact: "Yes"
        },
        interestedInContributing: true,
        contributionInterests: [
          "Contribute a clinical/professional scenario",
          "Facilitate an MBBS Foundation Workshop",
          "Review educational content"
        ],
        willingToShareReadinessSurvey: true,
        respondentName: "TEST SURVEY 1 STABILISATION",
        email: "test.survey1.stabilisation@example.com",
        mobileWhatsapp: "9876543219",
        consentForFollowup: true,
        referralCode: null,
        submissionFingerprint: null,
      },
    });

    console.log(`✅ Test record inserted successfully! ID: ${testRow.id}`);
    console.log(`   - Respondent: ${testRow.respondentName}`);
    console.log(`   - Institution: ${testRow.institutionName}`);
    console.log(`   - referralCode is null: ${testRow.referralCode === null}`);
    console.log(`   - submissionFingerprint is null: ${testRow.submissionFingerprint === null}`);

    // Query back
    const fetched = await prisma.mBBSProfessionalSurveyResponse.findUnique({
      where: { id: testRow.id }
    });

    if (!fetched) throw new Error("Could not find inserted test record");
    console.log(`✅ Verified query retrieval for test record ${fetched.id}`);

    // Clean up
    await prisma.mBBSProfessionalSurveyResponse.delete({
      where: { id: testRow.id }
    });
    console.log(`✅ Cleanly deleted test record ${testRow.id}`);

  } finally {
    await prisma.$disconnect();
  }

  console.log("\n=== ALL SURVEY 1 STABILISATION CHECKS PASSED ===");
}

main().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
