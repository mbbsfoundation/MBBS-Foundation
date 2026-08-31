/**
 * MBBS Foundation — Survey 2: Student & Intern Voice Types
 */

export interface StudentVoiceFormData {
  // Section 1: Where Are You Now?
  trainingStage: string;
  collegeType: string;
  state: string;
  stateCode: string;

  // Section 2: The Good Part
  q4RewardingExperiences: string[];
  q5FirstMonthsFeeling: string;

  // Section 3: What Was Harder or More Unexpected?
  q6HarderAspects: string[];
  q7UnexpectedAspects: string[];
  q8FirstYearFeelings: Record<string, string>; // statement_a ... statement_j -> rating

  // Section 4: What Should Students Know Before They Start?
  q9ShouldUnderstandBefore: string[];
  q10HelpfulGuidanceTypes: string[];
  q11BestTimingForGuidance: string;
  q12GuideUsefulnessRating: string;
  q13GuideEssentialComponents: string[];

  // Section 5: Your Voice for the Next Batch
  q14TransitionFitStatement: string;
  q15PriorKnowledgeWouldHaveHelped: string;
  q16InterestedInHelping: string;
  interestedInContributing: boolean;
  q17HelpMethods: string[];
  q18OneThingWishTold: string;

  // Optional Contributor Contact
  consentForFollowup: boolean;
  respondentName: string;
  email: string;
  mobileWhatsapp: string;

  // Metadata
  referralCode?: string | null;
}

export const INITIAL_STUDENT_VOICE_FORM_DATA: StudentVoiceFormData = {
  trainingStage: "",
  collegeType: "",
  state: "",
  stateCode: "",
  q4RewardingExperiences: [],
  q5FirstMonthsFeeling: "",
  q6HarderAspects: [],
  q7UnexpectedAspects: [],
  q8FirstYearFeelings: {},
  q9ShouldUnderstandBefore: [],
  q10HelpfulGuidanceTypes: [],
  q11BestTimingForGuidance: "",
  q12GuideUsefulnessRating: "",
  q13GuideEssentialComponents: [],
  q14TransitionFitStatement: "",
  q15PriorKnowledgeWouldHaveHelped: "",
  q16InterestedInHelping: "",
  interestedInContributing: false,
  q17HelpMethods: [],
  q18OneThingWishTold: "",
  consentForFollowup: false,
  respondentName: "",
  email: "",
  mobileWhatsapp: "",
  referralCode: null,
};

export interface StudentOptionMetric {
  option: string;
  count: number;
  percentage: number;
  group?: string;
}

export interface StudentQ8StatementMetric {
  code: string;
  id: string;
  label: string;
  category: "academic" | "social_emotional" | "clinical" | "positive_growth";
  ratings: Record<string, number>;
  totalRated: number;
  highFrequencyCount: number; // Often + Very Often
  highFrequencyPercentage: number;
}

export interface StudentVoiceCalculatedInsights {
  pctExcitingChallengingOrMixed: number;
  pctMajorAcademicChallenges: number;
  pctPersonalSocialChallenges: number;
  pctWantingGuidanceEarly: number;
  pctGuideVeryOrExtremelyUseful: number;
  pctAdvanceKnowledgeDefinitelyOrProbablyHelped: number;
}

export interface StudentVoiceDashboardSummary {
  totalResponses: number;
  difficultTransitionCount: number;
  difficultTransitionPercentage: number;
  priorKnowledgeHelpCount: number;
  priorKnowledgeHelpPercentage: number;
  interestedContributorsCount: number;
  interestedContributorsPercentage: number;
  distinctStatesCount: number;

  sourceBreakdown: Array<{ source: string; label: string; count: number; percentage: number }>;
  trainingStageBreakdown: StudentOptionMetric[];
  collegeTypeBreakdown: StudentOptionMetric[];
  stateBreakdown: StudentOptionMetric[];

  q4RewardingBreakdown: StudentOptionMetric[];
  q5FeelingBreakdown: StudentOptionMetric[];
  q6HarderBreakdown: StudentOptionMetric[];
  q7UnexpectedBreakdown: StudentOptionMetric[];
  q8RatingsBreakdown: StudentQ8StatementMetric[];

  q9UnderstandBeforeBreakdown: StudentOptionMetric[];
  q10GuidanceTypesBreakdown: StudentOptionMetric[];
  q11TimingBreakdown: StudentOptionMetric[];
  q12UsefulnessBreakdown: StudentOptionMetric[];
  q13ComponentsBreakdown: StudentOptionMetric[];

  q14TransitionBreakdown: StudentOptionMetric[];
  q15PriorKnowledgeBreakdown: StudentOptionMetric[];
  q16ContributionInterestBreakdown: StudentOptionMetric[];
  q17HelpMethodsBreakdown: StudentOptionMetric[];

  calculatedInsights: StudentVoiceCalculatedInsights;
  recentResponses: Array<{
    id: string;
    createdAt: string;
    source: string;
    trainingStage: string;
    collegeType: string | null;
    state: string | null;
    q5FirstMonthsFeeling: string;
    q14TransitionFitStatement: string;
    q15PriorKnowledgeWouldHaveHelped: string;
    interestedInContributing: boolean;
    respondentName: string | null;
    email: string | null;
    mobileWhatsapp: string | null;
    q18OneThingWishTold: string | null;
    surveyResponses: any;
  }>;
}
