/**
 * Server & Client Validation for Survey 2 — Student & Intern Voice
 */

import {
  Q8_RATING_SCALE,
  Q8_STATEMENTS,
  STUDENT_SURVEY_SECTIONS_CONFIG,
} from "./studentVoiceSurveyConfig";
import { StudentVoiceFormData } from "./studentVoiceTypes";

export interface StudentVoiceValidationError {
  field: string;
  message: string;
}

export interface StudentVoiceValidationResult {
  isValid: boolean;
  errors: StudentVoiceValidationError[];
  sanitizedData?: any;
}

export function validateStudentVoiceSurvey(
  data: Partial<StudentVoiceFormData>,
  sourceParam?: string | null
): StudentVoiceValidationResult {
  const errors: StudentVoiceValidationError[] = [];

  // Normalize Source
  let normalizedSource = (sourceParam || "direct").toLowerCase().trim();
  if (!["faculty", "cpr", "student", "direct"].includes(normalizedSource)) {
    normalizedSource = "direct";
  }

  // Section 1 Validation
  if (!data.trainingStage || typeof data.trainingStage !== "string" || !data.trainingStage.trim()) {
    errors.push({ field: "trainingStage", message: "Please select your current training stage (Q1)." });
  }

  // Section 2 Validation
  if (!Array.isArray(data.q4RewardingExperiences) || data.q4RewardingExperiences.length === 0) {
    errors.push({ field: "q4RewardingExperiences", message: "Please select at least one rewarding experience (Q4)." });
  } else if (data.q4RewardingExperiences.length > 5) {
    errors.push({ field: "q4RewardingExperiences", message: "Please select up to 5 rewarding experiences only (Q4)." });
  }

  if (!data.q5FirstMonthsFeeling || typeof data.q5FirstMonthsFeeling !== "string" || !data.q5FirstMonthsFeeling.trim()) {
    errors.push({ field: "q5FirstMonthsFeeling", message: "Please select how your first few months felt overall (Q5)." });
  }

  // Section 3 Validation
  if (!Array.isArray(data.q6HarderAspects) || data.q6HarderAspects.length === 0) {
    errors.push({ field: "q6HarderAspects", message: "Please select at least one aspect that was harder than expected (Q6)." });
  } else if (data.q6HarderAspects.length > 6) {
    errors.push({ field: "q6HarderAspects", message: "Please select up to 6 harder aspects only (Q6)." });
  }

  if (!Array.isArray(data.q7UnexpectedAspects) || data.q7UnexpectedAspects.length === 0) {
    errors.push({ field: "q7UnexpectedAspects", message: "Please select at least one aspect that was unexpected (Q7)." });
  } else if (data.q7UnexpectedAspects.length > 5) {
    errors.push({ field: "q7UnexpectedAspects", message: "Please select up to 5 unexpected aspects only (Q7)." });
  }

  // Q8 Matrix Validation (all 10 statements required)
  const q8Ratings = data.q8FirstYearFeelings || {};
  for (const statement of Q8_STATEMENTS) {
    const rating = q8Ratings[statement.id];
    if (!rating || !(Q8_RATING_SCALE as readonly string[]).includes(rating)) {
      errors.push({
        field: `q8_${statement.id}`,
        message: `Please provide a rating for statement ${statement.code}: "${statement.label}".`,
      });
    }
  }

  // Section 4 Validation
  if (!Array.isArray(data.q9ShouldUnderstandBefore) || data.q9ShouldUnderstandBefore.length === 0) {
    errors.push({ field: "q9ShouldUnderstandBefore", message: "Please select at least one area students should understand (Q9)." });
  } else if (data.q9ShouldUnderstandBefore.length > 7) {
    errors.push({ field: "q9ShouldUnderstandBefore", message: "Please select up to 7 areas only (Q9)." });
  }

  if (!Array.isArray(data.q10HelpfulGuidanceTypes) || data.q10HelpfulGuidanceTypes.length === 0) {
    errors.push({ field: "q10HelpfulGuidanceTypes", message: "Please select at least one guidance type (Q10)." });
  } else if (data.q10HelpfulGuidanceTypes.length > 5) {
    errors.push({ field: "q10HelpfulGuidanceTypes", message: "Please select up to 5 guidance types only (Q10)." });
  }

  if (!data.q11BestTimingForGuidance || typeof data.q11BestTimingForGuidance !== "string" || !data.q11BestTimingForGuidance.trim()) {
    errors.push({ field: "q11BestTimingForGuidance", message: "Please select when guidance would be most useful (Q11)." });
  }

  if (!data.q12GuideUsefulnessRating || typeof data.q12GuideUsefulnessRating !== "string" || !data.q12GuideUsefulnessRating.trim()) {
    errors.push({ field: "q12GuideUsefulnessRating", message: "Please rate the usefulness of a structured guide (Q12)." });
  }

  if (!Array.isArray(data.q13GuideEssentialComponents) || data.q13GuideEssentialComponents.length === 0) {
    errors.push({ field: "q13GuideEssentialComponents", message: "Please select at least one essential component for the guide (Q13)." });
  } else if (data.q13GuideEssentialComponents.length > 7) {
    errors.push({ field: "q13GuideEssentialComponents", message: "Please select up to 7 guide components only (Q13)." });
  }

  // Section 5 Validation
  if (!data.q14TransitionFitStatement || typeof data.q14TransitionFitStatement !== "string" || !data.q14TransitionFitStatement.trim()) {
    errors.push({ field: "q14TransitionFitStatement", message: "Please select the statement that fits your transition best (Q14)." });
  }

  if (!data.q15PriorKnowledgeWouldHaveHelped || typeof data.q15PriorKnowledgeWouldHaveHelped !== "string" || !data.q15PriorKnowledgeWouldHaveHelped.trim()) {
    errors.push({ field: "q15PriorKnowledgeWouldHaveHelped", message: "Please indicate whether prior knowledge would have helped (Q15)." });
  }

  if (!data.q16InterestedInHelping || typeof data.q16InterestedInHelping !== "string" || !data.q16InterestedInHelping.trim()) {
    errors.push({ field: "q16InterestedInHelping", message: "Please indicate if you are interested in helping future students (Q16)." });
  }

  // Q18 Character limit
  if (data.q18OneThingWishTold && typeof data.q18OneThingWishTold === "string") {
    if (data.q18OneThingWishTold.length > 250) {
      errors.push({ field: "q18OneThingWishTold", message: "Q18 reflection must not exceed 250 characters." });
    }
  }

  // Optional Contact Email Validation
  if (data.email && typeof data.email === "string" && data.email.trim()) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email.trim())) {
      errors.push({ field: "email", message: "Please enter a valid email address." });
    }
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  // Determine contributor status
  const interestedInHelping = data.q16InterestedInHelping || "";
  const isInterestedInContributing = [
    "Yes",
    "Possibly",
    "I would like to know more",
  ].includes(interestedInHelping);

  // Construct Sanitize Data Payload
  const sanitizedData = {
    surveyVersion: "v1",
    source: normalizedSource,
    trainingStage: (data.trainingStage || "").trim(),
    collegeType: data.collegeType ? data.collegeType.trim() : null,
    state: data.state ? data.state.trim() : null,
    stateCode: data.stateCode ? data.stateCode.trim() : null,
    interestedInContributing: isInterestedInContributing,
    contributionInterests: isInterestedInContributing && Array.isArray(data.q17HelpMethods) ? data.q17HelpMethods : null,
    consentForFollowup: Boolean(data.consentForFollowup),
    respondentName: data.respondentName ? data.respondentName.trim() : null,
    email: data.email ? data.email.trim().toLowerCase() : null,
    mobileWhatsapp: data.mobileWhatsapp ? data.mobileWhatsapp.trim() : null,
    referralCode: null,
    submissionFingerprint: null,
    surveyResponses: {
      q1TrainingStage: data.trainingStage,
      q2CollegeType: data.collegeType || null,
      q3State: data.state || null,
      q4RewardingExperiences: data.q4RewardingExperiences,
      q5FirstMonthsFeeling: data.q5FirstMonthsFeeling,
      q6HarderAspects: data.q6HarderAspects,
      q7UnexpectedAspects: data.q7UnexpectedAspects,
      q8FirstYearFeelings: q8Ratings,
      q9ShouldUnderstandBefore: data.q9ShouldUnderstandBefore,
      q10HelpfulGuidanceTypes: data.q10HelpfulGuidanceTypes,
      q11BestTimingForGuidance: data.q11BestTimingForGuidance,
      q12GuideUsefulnessRating: data.q12GuideUsefulnessRating,
      q13GuideEssentialComponents: data.q13GuideEssentialComponents,
      q14TransitionFitStatement: data.q14TransitionFitStatement,
      q15PriorKnowledgeWouldHaveHelped: data.q15PriorKnowledgeWouldHaveHelped,
      q16InterestedInHelping: data.q16InterestedInHelping,
      q17HelpMethods: data.q17HelpMethods || [],
      q18OneThingWishTold: data.q18OneThingWishTold ? data.q18OneThingWishTold.trim() : null,
    },
  };

  return { isValid: true, errors: [], sanitizedData };
}
