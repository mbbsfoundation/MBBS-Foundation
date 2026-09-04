import {
  READINESS_DOMAINS,
  ConsultationSource,
} from "./consultationTypes";

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  sanitizedData?: {
    surveyVersion: string;
    source: ConsultationSource;
    roles: string[];
    specialty: string | null;
    teachingExperience: string | null;
    institutionName: string | null;
    city: string | null;
    state: string | null;
    stateCode: string | null;
    readinessRatings: Record<string, string>;
    q8OrientationEffectiveness?: string | null;
    q9EmphasisAreas: string[];
    q10OneChangeSuggestion?: string | null;
    q11NeedForComplementaryResource?: string | null;
    q12MakeResourceUseful?: string | null;
    q13WishTaughtAtBeginning: string;
    q14ChallengeApparentLater?: string | null;
    q15FoundationCourseDescription: string;
    q16Limitations: string[];
    q17UsefulFormats: string[];
    q18WorkshopShouldInclude?: string | null;
    q19InterestedInContributing: string;
    interestedInContributing: boolean;
    q20ContributionTypes: string[];
    q21PersonalTopicInterest: string | null;
    q22TimeCommitment?: string | null;
    q23ConnectedWithNewStudents?: string | null;
    q24WillingToShareReadiness?: string | null;
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
 * Validates and sanitizes the incoming Professional Consultation Survey V2 payload.
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

  // 2. Section 1: About You
  // Q1 Roles (Required, at least 1)
  const rawRoles = Array.isArray(payload.roles) ? payload.roles : [];
  const roles = rawRoles
    .filter((r: any) => typeof r === "string" && r.trim().length > 0)
    .map((r: string) => r.trim());

  if (roles.length === 0) {
    errors.push("Please select at least one professional role in Q1.");
  }

  // Q2 Specialty (Required)
  const specialty = typeof payload.specialty === "string" && payload.specialty.trim()
    ? payload.specialty.trim()
    : null;
  if (!specialty) {
    errors.push("Please select your broad specialty or department in Q2.");
  }

  // Q3 Teaching Experience (Required)
  const teachingExperience = typeof payload.teachingExperience === "string" && payload.teachingExperience.trim()
    ? payload.teachingExperience.trim()
    : null;
  if (!teachingExperience) {
    errors.push("Please select your teaching/training experience in Q3.");
  }

  // Q4 State (Required) & Institution Name (Optional string)
  const state = typeof payload.state === "string" && payload.state.trim()
    ? payload.state.trim()
    : null;
  if (!state) {
    errors.push("Please select your State or Union Territory in Q4.");
  }

  const institutionName = typeof payload.institutionName === "string" && payload.institutionName.trim()
    ? payload.institutionName.trim()
    : null;
  const stateCode = typeof payload.stateCode === "string" && payload.stateCode.trim()
    ? payload.stateCode.trim()
    : null;
  const city = typeof payload.city === "string" && payload.city.trim()
    ? payload.city.trim()
    : null;

  // 3. Section 2: How Prepared Are Students?
  // Q5 Readiness Ratings (All 14 domains required)
  const rawReadiness = payload.readinessRatings && typeof payload.readinessRatings === "object"
    ? payload.readinessRatings
    : {};
  const readinessRatings: Record<string, string> = {};

  for (const domain of READINESS_DOMAINS) {
    const val = rawReadiness[domain.id];
    if (typeof val !== "string" || !val.trim()) {
      errors.push(`Missing rating for readiness domain: "${domain.title || domain.label}".`);
    } else {
      readinessRatings[domain.id] = val.trim();
    }
  }

  // Q6 Emphasis Areas (Required: 1 to 5 selections)
  const rawQ6 = Array.isArray(payload.q9EmphasisAreas)
    ? payload.q9EmphasisAreas
    : Array.isArray(payload.emphasisAreas)
    ? payload.emphasisAreas
    : [];
  const q9EmphasisAreas = rawQ6
    .filter((i: any) => typeof i === "string" && i.trim().length > 0)
    .map((i: string) => i.trim());

  if (q9EmphasisAreas.length === 0) {
    errors.push("Please select 1 to 5 priority areas in Q6.");
  } else if (q9EmphasisAreas.length > 5) {
    errors.push("A maximum of 5 priority areas can be selected in Q6.");
  }

  // 4. Section 3: Current Foundation Course
  // Q7 Foundation Course Description (Required)
  const q15 = typeof payload.q15FoundationCourseDescription === "string" && payload.q15FoundationCourseDescription.trim()
    ? payload.q15FoundationCourseDescription.trim()
    : typeof payload.foundationCourseDescription === "string" && payload.foundationCourseDescription.trim()
    ? payload.foundationCourseDescription.trim()
    : "";

  if (!q15) {
    errors.push("Please describe current Foundation Course implementation in Q7.");
  }

  // Q8 Limitations (Optional: max 3)
  const rawQ8Lim = Array.isArray(payload.q16Limitations)
    ? payload.q16Limitations
    : Array.isArray(payload.foundationCourseLimitations)
    ? payload.foundationCourseLimitations
    : [];
  const q16Limitations = rawQ8Lim
    .filter((i: any) => typeof i === "string" && i.trim().length > 0)
    .map((i: string) => i.trim());

  if (q16Limitations.length > 3) {
    errors.push("A maximum of 3 limitations can be selected in Q8.");
  }

  // 5. Section 4: Your Experience Matters
  // Q9 Wish Taught At Beginning (Required)
  const q13 = typeof payload.q13WishTaughtAtBeginning === "string" && payload.q13WishTaughtAtBeginning.trim()
    ? payload.q13WishTaughtAtBeginning.trim()
    : typeof payload.wishTaughtAtEntry === "string" && payload.wishTaughtAtEntry.trim()
    ? payload.wishTaughtAtEntry.trim()
    : "";

  if (!q13) {
    errors.push("Please share one observation/recommendation in Q9.");
  }

  // 6. Section 5: Building the MBBS Foundation Workshop
  // Q10 Workshop Formats (Optional: max 5)
  const rawQ10Fmt = Array.isArray(payload.q17UsefulFormats)
    ? payload.q17UsefulFormats
    : Array.isArray(payload.preferredWorkshopFormats)
    ? payload.preferredWorkshopFormats
    : [];
  const q17UsefulFormats = rawQ10Fmt
    .filter((i: any) => typeof i === "string" && i.trim().length > 0)
    .map((i: string) => i.trim());

  if (q17UsefulFormats.length > 5) {
    errors.push("A maximum of 5 workshop formats can be selected in Q10.");
  }

  // 7. Section 6: Extend Your Contribution
  // Q11 Contribution Interest (Required)
  const q19 = typeof payload.q19InterestedInContributing === "string" && payload.q19InterestedInContributing.trim()
    ? payload.q19InterestedInContributing.trim()
    : "";

  if (!q19) {
    errors.push("Please indicate your contribution interest in Q11.");
  }

  const interestedInContributing = q19.length > 0 && q19 !== "Not at present";

  // Q12 Contribution Types (Conditional on Q11)
  const rawQ12Types = Array.isArray(payload.q20ContributionTypes)
    ? payload.q20ContributionTypes
    : Array.isArray(payload.contributionTypes)
    ? payload.contributionTypes
    : [];
  const q20ContributionTypes = interestedInContributing
    ? rawQ12Types
        .filter((i: any) => typeof i === "string" && i.trim().length > 0)
        .map((i: string) => i.trim())
    : [];

  const q21 = interestedInContributing && typeof payload.q21PersonalTopicInterest === "string" && payload.q21PersonalTopicInterest.trim()
    ? payload.q21PersonalTopicInterest.trim()
    : null;

  // 8. Section 7: Stay Connected
  // Name & Academic Title (Required)
  const respondentName = typeof payload.respondentName === "string" && payload.respondentName.trim()
    ? payload.respondentName.trim()
    : null;

  if (!respondentName) {
    errors.push("Name & Academic Title is required in Section 7.");
  }

  // Contact Method: At least Email OR Mobile/WhatsApp required
  const rawEmail = typeof payload.email === "string" && payload.email.trim()
    ? payload.email.trim()
    : null;
  let email: string | null = null;
  if (rawEmail) {
    if (!EMAIL_REGEX.test(rawEmail)) {
      errors.push("Please enter a valid email address.");
    } else {
      email = rawEmail.toLowerCase();
    }
  }

  const mobileWhatsapp = typeof payload.mobileWhatsapp === "string" && payload.mobileWhatsapp.trim()
    ? payload.mobileWhatsapp.trim()
    : null;

  if (!email && !mobileWhatsapp) {
    errors.push("Please provide at least one contact method (Email or Mobile/WhatsApp) in Section 7.");
  }

  // Consent for contact (Required)
  const q28 = typeof payload.q28ConsentForContact === "string" && payload.q28ConsentForContact.trim()
    ? payload.q28ConsentForContact.trim()
    : "";

  if (!q28) {
    errors.push("Please select whether we may contact you in Section 7.");
  }
  const consentForFollowup = q28 === "Yes";

  // Optional backward compatible fields from V1
  const q8 = typeof payload.q8OrientationEffectiveness === "string" ? payload.q8OrientationEffectiveness.trim() : null;
  const q10 = typeof payload.q10OneChangeSuggestion === "string" ? payload.q10OneChangeSuggestion.trim() : null;
  const q11 = typeof payload.q11NeedForComplementaryResource === "string" ? payload.q11NeedForComplementaryResource.trim() : null;
  const q12 = typeof payload.q12MakeResourceUseful === "string" ? payload.q12MakeResourceUseful.trim() : null;
  const q14 = typeof payload.q14ChallengeApparentLater === "string" ? payload.q14ChallengeApparentLater.trim() : null;
  const q18 = typeof payload.q18WorkshopShouldInclude === "string" ? payload.q18WorkshopShouldInclude.trim() : null;
  const q22 = typeof payload.q22TimeCommitment === "string" ? payload.q22TimeCommitment.trim() : null;
  const q23 = typeof payload.q23ConnectedWithNewStudents === "string" ? payload.q23ConnectedWithNewStudents.trim() : null;
  const q24 = typeof payload.q24WillingToShareReadiness === "string" ? payload.q24WillingToShareReadiness.trim() : null;
  const willingToShareReadinessSurvey = q24 === "Yes" || q24 === "Possibly";

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  // Structured Survey Responses JSON for analytics and audit
  const surveyResponses = {
    surveyVersion: "v2",
    readinessRatings,
    greaterEmphasisAreas: q9EmphasisAreas,
    currentFoundationCourseDescription: q15,
    foundationCourseLimitations: q16Limitations,
    wishTaughtAtEntry: q13,
    preferredWorkshopFormats: q17UsefulFormats,
    contributionInterestLevel: q19,
    contributionTypes: q20ContributionTypes,
    preferredContributionTopic: q21,
    consentForContactResponse: q28,
    // Preserved V1 keys if present
    ...(q8 && { foundationCourseEffectiveness: q8 }),
    ...(q10 && { improvementSuggestion: q10 }),
    ...(q11 && { needForLongitudinalResource: q11 }),
    ...(q12 && { usefulResourceSuggestion: q12 }),
    ...(q14 && { laterEmergingChallenge: q14 }),
    ...(q18 && { workshopMustInclude: q18 }),
    ...(q22 && { contributionTimeCommitment: q22 }),
    ...(q23 && { connectionWithNewStudents: q23 }),
    ...(q24 && { readinessSurveySharingResponse: q24 }),
  };

  return {
    isValid: true,
    errors: [],
    sanitizedData: {
      surveyVersion: "v2",
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
