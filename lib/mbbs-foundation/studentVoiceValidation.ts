/**
 * Server & Client Validation for Survey 2 — Student & Intern Voice (V2 Locked)
 */

import {
  Q1_TRAINING_STAGE_OPTIONS,
  Q6_RATING_SCALE,
  Q6_STATEMENTS,
  Q9_TIMING_OPTIONS,
} from "./studentVoiceSurveyConfig";
import { StudentVoiceFormData, StudentContributorFormData } from "./studentVoiceTypes";

export interface StudentVoiceValidationError {
  field: string;
  message: string;
}

export interface StudentVoiceValidationResult {
  isValid: boolean;
  errors: StudentVoiceValidationError[];
  sanitizedData?: any;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateStudentVoiceSurvey(
  data: Partial<StudentVoiceFormData>,
  sourceParam?: string | null
): StudentVoiceValidationResult {
  const errors: StudentVoiceValidationError[] = [];

  // 1. Normalize Source
  let normalizedSource = (sourceParam || data.source || "direct").toLowerCase().trim();
  if (!["faculty", "cpr", "student", "direct"].includes(normalizedSource)) {
    normalizedSource = "direct";
  }

  // Section 1: Where Are You Now?
  if (!data.trainingStage || typeof data.trainingStage !== "string" || !data.trainingStage.trim()) {
    errors.push({ field: "trainingStage", message: "Please select where you are in your medical journey (Q1)." });
  } else if (!Q1_TRAINING_STAGE_OPTIONS.includes(data.trainingStage as any)) {
    errors.push({ field: "trainingStage", message: "Please select a valid stage of medical training (Q1)." });
  }

  // Section 2: Then MBBS Actually Started...
  if (!Array.isArray(data.q3RewardingExperiences) || data.q3RewardingExperiences.length === 0) {
    errors.push({ field: "q3RewardingExperiences", message: "Please select at least one exciting/rewarding experience (Q3)." });
  } else if (data.q3RewardingExperiences.length > 4) {
    errors.push({ field: "q3RewardingExperiences", message: "Please select up to 4 rewarding experiences only (Q3)." });
  }

  if (!Array.isArray(data.q4HarderAspects) || data.q4HarderAspects.length === 0) {
    errors.push({ field: "q4HarderAspects", message: "Please select at least one aspect that was harder than expected (Q4)." });
  } else if (data.q4HarderAspects.length > 5) {
    errors.push({ field: "q4HarderAspects", message: "Please select up to 5 harder aspects only (Q4)." });
  }

  // Section 3: The Things Nobody Really Tells You
  if (!Array.isArray(data.q5Surprises) || data.q5Surprises.length === 0) {
    errors.push({ field: "q5Surprises", message: "Please select at least one surprising aspect (Q5)." });
  } else if (data.q5Surprises.length > 5) {
    errors.push({ field: "q5Surprises", message: "Please select up to 5 surprises only (Q5)." });
  }

  // Section 4: How Did the Transition Actually Feel? (Q6 Matrix — 8 statements required)
  const q6Ratings = data.q6TransitionMatrix || {};
  for (const statement of Q6_STATEMENTS) {
    const rating = q6Ratings[statement.id];
    if (!rating || !(Q6_RATING_SCALE as readonly string[]).includes(rating)) {
      errors.push({
        field: `q6_${statement.id}`,
        message: `Please provide a frequency rating for statement ${statement.code}: "${statement.label}" (Q6).`,
      });
    }
  }

  // Section 5: If You Could Prepare the Next Batch...
  if (!Array.isArray(data.q7NextBatchPriorities) || data.q7NextBatchPriorities.length === 0) {
    errors.push({ field: "q7NextBatchPriorities", message: "Please select at least one area to help prepare the next batch (Q7)." });
  } else if (data.q7NextBatchPriorities.length > 7) {
    errors.push({ field: "q7NextBatchPriorities", message: "Please select up to 7 priority areas only (Q7)." });
  }

  // Section 6: What Would Actually Have Helped?
  if (!Array.isArray(data.q8UsefulPreparationTypes) || data.q8UsefulPreparationTypes.length === 0) {
    errors.push({ field: "q8UsefulPreparationTypes", message: "Please select at least one useful preparation type (Q8)." });
  } else if (data.q8UsefulPreparationTypes.length > 5) {
    errors.push({ field: "q8UsefulPreparationTypes", message: "Please select up to 5 preparation types only (Q8)." });
  }

  if (!data.q9BestTiming || typeof data.q9BestTiming !== "string" || !data.q9BestTiming.trim()) {
    errors.push({ field: "q9BestTiming", message: "Please select when preparation would have helped you most (Q9)." });
  } else if (!Q9_TIMING_OPTIONS.includes(data.q9BestTiming as any)) {
    errors.push({ field: "q9BestTiming", message: "Please select a valid timing option (Q9)." });
  }

  // Section 7: One Thing You Wish Someone Had Told You
  if (!data.q10WishSomeoneTold || typeof data.q10WishSomeoneTold !== "string" || !data.q10WishSomeoneTold.trim()) {
    errors.push({ field: "q10WishSomeoneTold", message: "Please complete the sentence: “Before I started MBBS, I wish someone had told me that...” (Q10)." });
  } else if (data.q10WishSomeoneTold.trim().length > 2000) {
    errors.push({ field: "q10WishSomeoneTold", message: "Response for Q10 must not exceed 2000 characters." });
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  // Construct Sanitize Data Payload for V2
  const quotePermission = Boolean(data.quotePermission);
  const institution = (data.institutionName || data.otherInstitutionText || "").trim();

  const sanitizedData = {
    surveyVersion: "v2",
    source: normalizedSource,
    trainingStage: (data.trainingStage || "").trim(),
    collegeType: data.collegeType ? data.collegeType.trim() : null,
    state: data.state ? data.state.trim() : null,
    stateCode: data.stateCode ? data.stateCode.trim() : null,
    interestedInContributing: false,
    contributionInterests: null,
    consentForFollowup: false,
    respondentName: null,
    email: null,
    mobileWhatsapp: null,
    referralCode: null,
    submissionFingerprint: null,
    surveyResponses: {
      surveyVersion: "v2",
      q1TrainingStage: data.trainingStage,
      q2CollegeType: data.collegeType || null,
      q2State: data.state || null,
      q2InstitutionName: institution || null,
      q3RewardingExperiences: data.q3RewardingExperiences,
      q4HarderAspects: data.q4HarderAspects,
      q5Surprises: data.q5Surprises,
      q6TransitionMatrix: q6Ratings,
      q7NextBatchPriorities: data.q7NextBatchPriorities,
      q8UsefulPreparationTypes: data.q8UsefulPreparationTypes,
      q9BestTiming: data.q9BestTiming,
      q10WishSomeoneTold: data.q10WishSomeoneTold!.trim(),
      quotePermission: quotePermission,
      otherTexts: data.otherTexts || {},
    },
  };

  return { isValid: true, errors: [], sanitizedData };
}

export function validateStudentContributorPayload(
  data: Partial<StudentContributorFormData>
): { isValid: boolean; errors: StudentVoiceValidationError[]; sanitizedContributorData?: any } {
  const errors: StudentVoiceValidationError[] = [];

  if (!data.responseId || typeof data.responseId !== "string" || !data.responseId.trim()) {
    errors.push({ field: "responseId", message: "Survey response ID is required to link contribution interest." });
  }

  if (!data.respondentName || typeof data.respondentName !== "string" || !data.respondentName.trim()) {
    errors.push({ field: "respondentName", message: "Please provide your name to join the initiative." });
  }

  const emailTrimmed = (data.email || "").trim().toLowerCase();
  const mobileTrimmed = (data.mobileWhatsapp || "").trim();

  if (!emailTrimmed) {
    errors.push({ field: "email", message: "Please enter your email address." });
  } else if (!EMAIL_REGEX.test(emailTrimmed)) {
    errors.push({ field: "email", message: "Please enter a valid email address." });
  }

  if (!mobileTrimmed) {
    errors.push({ field: "mobileWhatsapp", message: "Please enter your mobile / WhatsApp number." });
  } else if (mobileTrimmed.length < 7) {
    errors.push({ field: "mobileWhatsapp", message: "Please enter a valid mobile / WhatsApp number." });
  }

  if (!data.consentForFollowup) {
    errors.push({ field: "consentForFollowup", message: "Please check the consent box to be contacted regarding contribution opportunities." });
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  const sanitizedContributorData = {
    responseId: data.responseId!.trim(),
    respondentName: data.respondentName!.trim(),
    email: emailTrimmed,
    mobileWhatsapp: mobileTrimmed,
    contributionInterests: Array.isArray(data.contributionInterests) ? data.contributionInterests : [],
    consentForFollowup: true,
    interestedInContributing: true,
  };

  return { isValid: true, errors: [], sanitizedContributorData };
}
