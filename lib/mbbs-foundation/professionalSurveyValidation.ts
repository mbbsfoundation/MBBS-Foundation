import {
  ProfessionalSurveyFormData,
  READINESS_DOMAINS,
  ConsultationSource,
} from "./consultationTypes";

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  sanitizedData?: {
    source: ConsultationSource;
    roles: string[];
    specialty: string | null;
    teachingExperience: string | null;
    institutionName: string | null;
    city: string | null;
    state: string | null;
    stateCode: string | null;
    readinessRatings: Record<string, string>;
    q8OrientationEffectiveness: string;
    q9EmphasisAreas: string[];
    q10OneChangeSuggestion: string | null;
    q11NeedForComplementaryResource: string;
    q12MakeResourceUseful: string | null;
    q13WishTaughtAtBeginning: string;
    q14ChallengeApparentLater: string | null;
    q15FoundationCourseDescription: string;
    q16Limitations: string[];
    q17UsefulFormats: string[];
    q18WorkshopShouldInclude: string | null;
    q19InterestedInContributing: string;
    interestedInContributing: boolean;
    q20ContributionTypes: string[];
    q21PersonalTopicInterest: string | null;
    q22TimeCommitment: string | null;
    q23ConnectedWithNewStudents: string;
    q24WillingToShareReadiness: string;
    willingToShareReadinessSurvey: boolean;
    respondentName: string | null;
    email: string | null;
    mobileWhatsapp: string | null;
    q28ConsentForContact: string;
    consentForFollowup: boolean;
    surveyResponses: Record<string, any>;
  };
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validates and sanitizes the incoming Professional Consultation Survey payload.
 */
export function validateProfessionalSurveyPayload(
  payload: any
): ValidationResult {
  const errors: string[] = [];

  if (!payload || typeof payload !== "object") {
    return { isValid: false, errors: ["Invalid payload format. Expected JSON object."] };
  }

  // 1. Source resolution
  let source: ConsultationSource = "direct";
  if (typeof payload.source === "string") {
    const rawSource = payload.source.trim().toLowerCase();
    if (rawSource === "faculty" || rawSource === "cpr") {
      source = rawSource;
    }
  }

  // 2. Roles validation (Required, at least 1)
  const rawRoles = Array.isArray(payload.roles) ? payload.roles : [];
  const roles = rawRoles
    .filter((r: any) => typeof r === "string" && r.trim().length > 0)
    .map((r: string) => r.trim());

  if (roles.length === 0) {
    errors.push("At least one professional role must be selected in Q1.");
  }

  // 3. Optional Section 1 fields
  const specialty = typeof payload.specialty === "string" && payload.specialty.trim() ? payload.specialty.trim() : null;
  const teachingExperience = typeof payload.teachingExperience === "string" && payload.teachingExperience.trim() ? payload.teachingExperience.trim() : null;
  const institutionName = typeof payload.institutionName === "string" && payload.institutionName.trim() ? payload.institutionName.trim() : null;
  const city = typeof payload.city === "string" && payload.city.trim() ? payload.city.trim() : null;
  const state = typeof payload.state === "string" && payload.state.trim() ? payload.state.trim() : null;
  const stateCode = typeof payload.stateCode === "string" && payload.stateCode.trim() ? payload.stateCode.trim() : null;

  // 4. Section 2: Readiness Ratings (Q7 - All 14 domains required)
  const rawReadiness = payload.readinessRatings && typeof payload.readinessRatings === "object" ? payload.readinessRatings : {};
  const readinessRatings: Record<string, string> = {};

  for (const domain of READINESS_DOMAINS) {
    const val = rawReadiness[domain.id];
    if (typeof val !== "string" || !val.trim()) {
      errors.push(`Missing rating for readiness domain ${domain.code} (${domain.label.substring(0, 30)}...).`);
    } else {
      readinessRatings[domain.id] = val.trim();
    }
  }

  // Q8 (Required)
  const q8 = typeof payload.q8OrientationEffectiveness === "string" ? payload.q8OrientationEffectiveness.trim() : "";
  if (!q8) {
    errors.push("Q8 (Orientation effectiveness) is required.");
  }

  // Q9 (Required: 1 to 5 selections)
  const rawQ9 = Array.isArray(payload.q9EmphasisAreas) ? payload.q9EmphasisAreas : [];
  const q9EmphasisAreas = rawQ9.filter((i: any) => typeof i === "string" && i.trim().length > 0).map((i: string) => i.trim());
  if (q9EmphasisAreas.length === 0) {
    errors.push("At least one priority area must be selected in Q9.");
  } else if (q9EmphasisAreas.length > 5) {
    errors.push("A maximum of 5 priority areas can be selected in Q9.");
  }

  const q10 = typeof payload.q10OneChangeSuggestion === "string" && payload.q10OneChangeSuggestion.trim() ? payload.q10OneChangeSuggestion.trim() : null;

  // Q11 (Required)
  const q11 = typeof payload.q11NeedForComplementaryResource === "string" ? payload.q11NeedForComplementaryResource.trim() : "";
  if (!q11) {
    errors.push("Q11 (Need for complementary resource) is required.");
  }

  const q12 = typeof payload.q12MakeResourceUseful === "string" && payload.q12MakeResourceUseful.trim() ? payload.q12MakeResourceUseful.trim() : null;

  // 5. Section 3: Looking Back (Q13 Required)
  const q13 = typeof payload.q13WishTaughtAtBeginning === "string" ? payload.q13WishTaughtAtBeginning.trim() : "";
  if (!q13) {
    errors.push("Q13 (What one thing wish taught at beginning) is required.");
  }

  const q14 = typeof payload.q14ChallengeApparentLater === "string" && payload.q14ChallengeApparentLater.trim() ? payload.q14ChallengeApparentLater.trim() : null;

  // 6. Section 4: Foundation Course & ECE (Q15 Required, Q16 max 3)
  const q15 = typeof payload.q15FoundationCourseDescription === "string" ? payload.q15FoundationCourseDescription.trim() : "";
  if (!q15) {
    errors.push("Q15 (Foundation Course description) is required.");
  }

  const rawQ16 = Array.isArray(payload.q16Limitations) ? payload.q16Limitations : [];
  const q16Limitations = rawQ16.filter((i: any) => typeof i === "string" && i.trim().length > 0).map((i: string) => i.trim());
  if (q16Limitations.length > 3) {
    errors.push("A maximum of 3 limitations can be selected in Q16.");
  }

  // 7. Section 5: Workshop Formats (Q17 max 5)
  const rawQ17 = Array.isArray(payload.q17UsefulFormats) ? payload.q17UsefulFormats : [];
  const q17UsefulFormats = rawQ17.filter((i: any) => typeof i === "string" && i.trim().length > 0).map((i: string) => i.trim());
  if (q17UsefulFormats.length > 5) {
    errors.push("A maximum of 5 workshop formats can be selected in Q17.");
  }

  const q18 = typeof payload.q18WorkshopShouldInclude === "string" && payload.q18WorkshopShouldInclude.trim() ? payload.q18WorkshopShouldInclude.trim() : null;

  // 8. Section 6: Contribution Interest (Q19 Required)
  const q19 = typeof payload.q19InterestedInContributing === "string" ? payload.q19InterestedInContributing.trim() : "";
  if (!q19) {
    errors.push("Q19 (Contribution interest) is required.");
  }

  const interestedInContributing = q19.length > 0 && q19 !== "Not at present";

  const rawQ20 = Array.isArray(payload.q20ContributionTypes) ? payload.q20ContributionTypes : [];
  const q20ContributionTypes = rawQ20.filter((i: any) => typeof i === "string" && i.trim().length > 0).map((i: string) => i.trim());
  const q21 = typeof payload.q21PersonalTopicInterest === "string" && payload.q21PersonalTopicInterest.trim() ? payload.q21PersonalTopicInterest.trim() : null;
  const q22 = typeof payload.q22TimeCommitment === "string" && payload.q22TimeCommitment.trim() ? payload.q22TimeCommitment.trim() : null;

  // 9. Section 7: Student Connection & Readiness Sharing (Q23 & Q24 Required)
  const q23 = typeof payload.q23ConnectedWithNewStudents === "string" ? payload.q23ConnectedWithNewStudents.trim() : "";
  if (!q23) {
    errors.push("Q23 (Connection with newly admitted students) is required.");
  }

  const q24 = typeof payload.q24WillingToShareReadiness === "string" ? payload.q24WillingToShareReadiness.trim() : "";
  if (!q24) {
    errors.push("Q24 (Willingness to share readiness check) is required.");
  }
  const willingToShareReadinessSurvey = q24 === "Yes";

  // 10. Section 8: Stay Connected (Q28 Required, Contact optional with email format validation)
  const respondentName = typeof payload.respondentName === "string" && payload.respondentName.trim() ? payload.respondentName.trim() : null;
  const rawEmail = typeof payload.email === "string" && payload.email.trim() ? payload.email.trim() : null;
  let email: string | null = null;
  if (rawEmail) {
    if (!EMAIL_REGEX.test(rawEmail)) {
      errors.push("Invalid email format provided.");
    } else {
      email = rawEmail.toLowerCase();
    }
  }

  const mobileWhatsapp = typeof payload.mobileWhatsapp === "string" && payload.mobileWhatsapp.trim() ? payload.mobileWhatsapp.trim() : null;

  const q28 = typeof payload.q28ConsentForContact === "string" ? payload.q28ConsentForContact.trim() : "";
  if (!q28) {
    errors.push("Q28 (Consent for follow-up contact) is required.");
  }
  const consentForFollowup = q28 === "Yes";

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  // Structured Survey Responses JSON for future analysis
  const surveyResponses = {
    readinessRatings,
    foundationCourseEffectiveness: q8,
    greaterEmphasisAreas: q9EmphasisAreas,
    improvementSuggestion: q10,
    needForLongitudinalResource: q11,
    usefulResourceSuggestion: q12,
    wishTaughtAtEntry: q13,
    laterEmergingChallenge: q14,
    currentFoundationCourseDescription: q15,
    foundationCourseLimitations: q16Limitations,
    preferredWorkshopFormats: q17UsefulFormats,
    workshopMustInclude: q18,
    contributionInterestLevel: q19,
    contributionTypes: q20ContributionTypes,
    preferredContributionTopic: q21,
    contributionTimeCommitment: q22,
    connectionWithNewStudents: q23,
    readinessSurveySharingResponse: q24,
    consentForContactResponse: q28,
  };

  return {
    isValid: true,
    errors: [],
    sanitizedData: {
      source,
      roles,
      specialty,
      teachingExperience,
      institutionName,
      city,
      state,
      stateCode,
      readinessRatings,
      q8OrientationEffectiveness: q8,
      q9EmphasisAreas,
      q10OneChangeSuggestion: q10,
      q11NeedForComplementaryResource: q11,
      q12MakeResourceUseful: q12,
      q13WishTaughtAtBeginning: q13,
      q14ChallengeApparentLater: q14,
      q15FoundationCourseDescription: q15,
      q16Limitations,
      q17UsefulFormats,
      q18WorkshopShouldInclude: q18,
      q19InterestedInContributing: q19,
      interestedInContributing,
      q20ContributionTypes,
      q21PersonalTopicInterest: q21,
      q22TimeCommitment: q22,
      q23ConnectedWithNewStudents: q23,
      q24WillingToShareReadiness: q24,
      willingToShareReadinessSurvey,
      respondentName,
      email,
      mobileWhatsapp,
      q28ConsentForContact: q28,
      consentForFollowup,
      surveyResponses,
    },
  };
}
