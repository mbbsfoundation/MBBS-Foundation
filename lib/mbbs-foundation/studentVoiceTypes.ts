/**
 * MBBS Foundation — Survey 2: Student & Intern Voice Types (V2 Locked)
 */

export interface StudentVoiceFormData {
  // Survey Version & Source
  surveyVersion?: string;
  source?: string;

  // Section 1: Where Are You Now?
  trainingStage: string;
  collegeType: string;
  state: string;
  stateCode?: string;
  institutionName?: string;
  otherInstitutionText?: string;

  // Section 2: Then MBBS Actually Started...
  q3RewardingExperiences: string[];
  q4HarderAspects: string[];

  // Section 3: The Things Nobody Really Tells You
  q5Surprises: string[];

  // Section 4: How Did the Transition Actually Feel?
  q6TransitionMatrix: Record<string, string>; // statement_1 ... statement_8 -> frequency

  // Section 5: If You Could Prepare the Next Batch...
  q7NextBatchPriorities: string[];

  // Section 6: What Would Actually Have Helped?
  q8UsefulPreparationTypes: string[];
  q9BestTiming: string;

  // Section 7: One Thing You Wish Someone Had Told You
  q10WishSomeoneTold: string;
  quotePermission: boolean;

  // Optional custom text for 'Other' options
  otherTexts?: Record<string, string>;

  // Historical V1 compatibility fields (optional)
  q4RewardingExperiences?: string[];
  q5FirstMonthsFeeling?: string;
  q6HarderAspects?: string[];
  q7UnexpectedAspects?: string[];
  q8FirstYearFeelings?: Record<string, string>;
  q9ShouldUnderstandBefore?: string[];
  q10HelpfulGuidanceTypes?: string[];
  q11BestTimingForGuidance?: string;
  q12GuideUsefulnessRating?: string;
  q13GuideEssentialComponents?: string[];
  q14TransitionFitStatement?: string;
  q15PriorKnowledgeWouldHaveHelped?: string;
  q16InterestedInHelping?: string;
  q17HelpMethods?: string[];
  q18OneThingWishTold?: string;

  // Optional Contributor Contact (Post-submission)
  interestedInContributing?: boolean;
  contributionInterests?: string[];
  consentForFollowup?: boolean;
  respondentName?: string;
  email?: string;
  mobileWhatsapp?: string;
  referralCode?: string | null;
}

export const INITIAL_STUDENT_VOICE_FORM_DATA: StudentVoiceFormData = {
  surveyVersion: "v2",
  source: "direct",
  trainingStage: "",
  collegeType: "",
  state: "",
  stateCode: "",
  institutionName: "",
  otherInstitutionText: "",
  q3RewardingExperiences: [],
  q4HarderAspects: [],
  q5Surprises: [],
  q6TransitionMatrix: {},
  q7NextBatchPriorities: [],
  q8UsefulPreparationTypes: [],
  q9BestTiming: "",
  q10WishSomeoneTold: "",
  quotePermission: false,
  otherTexts: {},
  interestedInContributing: false,
  contributionInterests: [],
  consentForFollowup: false,
  respondentName: "",
  email: "",
  mobileWhatsapp: "",
  referralCode: null,
};

export interface StudentContributorFormData {
  responseId: string;
  contributionInterests: string[];
  respondentName: string;
  email?: string;
  mobileWhatsapp?: string;
  consentForFollowup: boolean;
}

export interface StudentOptionMetric {
  option: string;
  count: number;
  percentage: number;
  group?: string;
}

export interface StudentQ6StatementMetric {
  id: string;
  code: string;
  label: string;
  ratings: Record<string, number>;
  totalRated: number;
  highFrequencyCount: number; // Often + Very often
  highFrequencyPercentage: number;
}

// Backward-compatibility alias
export type StudentQ8StatementMetric = StudentQ6StatementMetric;

export interface StudentVoiceCalculatedInsights {
  pctExcitingOrRewarding: number;
  pctMajorChallenges: number;
  pctDifficultTransition: number;
  pctWantingEarlyPreparation: number;
  pctQuotePermissionGranted: number;
  pctInterestedInContributing: number;
}

export interface StudentVoiceDashboardSummary {
  totalResponses: number;
  v2ResponseCount: number;
  v1ResponseCount: number;
  quotePermissionCount: number;
  quotePermissionPercentage: number;
  interestedContributorsCount: number;
  interestedContributorsPercentage: number;
  distinctStatesCount: number;

  sourceBreakdown: Array<{ source: string; label: string; count: number; percentage: number }>;
  trainingStageBreakdown: StudentOptionMetric[];
  collegeTypeBreakdown: StudentOptionMetric[];
  stateBreakdown: StudentOptionMetric[];

  // V2 Specific Metrics
  q3RewardingBreakdown: StudentOptionMetric[];
  q4HarderBreakdown: StudentOptionMetric[];
  q5SurprisesBreakdown: StudentOptionMetric[];
  q6MatrixBreakdown: StudentQ6StatementMetric[];
  q7NextBatchBreakdown: StudentOptionMetric[];
  q8PreparationTypesBreakdown: StudentOptionMetric[];
  q9TimingBreakdown: StudentOptionMetric[];

  // Post-submit Contributor Breakdown
  contributionMethodsBreakdown: StudentOptionMetric[];

  calculatedInsights: StudentVoiceCalculatedInsights;

  recentResponses: Array<{
    id: string;
    createdAt: string;
    surveyVersion: string;
    source: string;
    trainingStage: string;
    collegeType: string | null;
    state: string | null;
    institutionName: string | null;
    q10WishSomeoneTold: string | null;
    quotePermission: boolean;
    interestedInContributing: boolean;
    contributionInterests: string[] | null;
    respondentName: string | null;
    email: string | null;
    mobileWhatsapp: string | null;
    surveyResponses: any;
  }>;
}
