/**
 * MBBS Foundation Consultation Module — Core Types & Survey 1 Definitions
 */

export type ConsultationSource = "faculty" | "cpr" | "direct";

export type ConsultationModuleStatus = "OPEN" | "COMING_SOON" | "ARCHIVED";

export interface ConsultationModuleInfo {
  id: string;
  title: string;
  subtitle: string;
  status: ConsultationModuleStatus;
  path: string;
  targetAudience: string;
  description: string;
  badgeText?: string;
}

export function getSourceLabel(source?: string | null): string {
  const s = (source || "direct").toLowerCase().trim();
  if (s === "faculty") return "Faculty / Medical Education Network";
  if (s === "cpr") return "CPR Course Coordinator / Champion Network";
  return "Direct / Unattributed";
}

export interface SourcePerformanceMetrics {
  source: string;
  label: string;
  totalResponses: number;
  percentageOfTotal: number;
  interestedContributors: number;
  contributorPercentage: number;
  willingToShareReadiness: number;
  sharePercentage: number;
}

export interface SourceRoleCrossTabItem {
  role: string;
  facultyCount: number;
  cprCount: number;
  directCount: number;
  totalCount: number;
}

export interface SourceStateCrossTabItem {
  state: string;
  facultyCount: number;
  cprCount: number;
  directCount: number;
  totalCount: number;
}

export interface ConsultationDashboardSummary {
  totalResponses: number;
  interestedContributors: number;
  willingToShareReadiness: number;
  distinctStatesCount: number;
  responsesThisWeek: number;

  sourceBreakdown: Array<{
    source: string;
    label: string;
    count: number;
    percentage: number;
  }>;

  sourcePerformance: SourcePerformanceMetrics[];
  sourceRoleCrossTab: SourceRoleCrossTabItem[];
  sourceStateCrossTab: SourceStateCrossTabItem[];

  roleBreakdown: Array<{
    role: string;
    count: number;
    percentage: number;
  }>;

  stateBreakdown: Array<{
    state: string;
    count: number;
    percentage: number;
  }>;

  readinessDomainSummary: Array<{
    code: string;
    label: string;
    totalRated: number;
    ratings: Record<string, number>;
    significantGapCount: number;
    significantGapPercentage: number;
  }>;

  q8EffectivenessSummary: Array<{
    option: string;
    count: number;
    percentage: number;
  }>;

  q15DescriptionSummary: Array<{
    option: string;
    count: number;
    percentage: number;
  }>;

  q9TopPriorityAreas: Array<{
    code: string;
    label: string;
    count: number;
    percentage: number;
  }>;

  q17WorkshopFormatsSummary: Array<{
    format: string;
    count: number;
    percentage: number;
  }>;

  contributionInterestsSummary: Array<{
    type: string;
    count: number;
    percentage: number;
  }>;
}

export interface ConsultationFilterParams {
  source?: string;
  state?: string;
  interestedInContributing?: boolean;
  willingToShareReadinessSurvey?: boolean;
  search?: string;
}

// -------------------------------------------------------------
// SECTION 1: ABOUT YOU OPTIONS
// -------------------------------------------------------------

export const PROFESSIONAL_ROLES_OPTIONS = [
  "Medical college faculty",
  "Foundation Course faculty/coordinator",
  "Medical Education Unit / MEU member",
  "Dean / Principal / academic administrator",
  "Clinician / practising doctor",
  "CPR Course Coordinator",
  "CPR Instructor / Trainer",
  "CPR Champion",
  "Medical educator",
  "Resident / postgraduate doctor",
  "Other healthcare professional",
  "Other",
] as const;

export const SPECIALTY_OPTIONS = [
  "Anatomy",
  "Physiology",
  "Biochemistry",
  "Community Medicine",
  "Medicine",
  "Paediatrics",
  "Surgery",
  "Obstetrics & Gynaecology",
  "Anaesthesiology",
  "Emergency Medicine",
  "Psychiatry",
  "Other clinical specialty",
  "Other pre/paraclinical specialty",
  "Medical Education",
  "Administration",
  "Other",
] as const;

export const TEACHING_EXPERIENCE_OPTIONS = [
  "Less than 5 years",
  "5–10 years",
  "11–20 years",
  "More than 20 years",
  "Primarily clinical/training role rather than formal teaching",
] as const;

export const INDIAN_STATES_AND_UTS = [
  "Andaman & Nicobar Islands",
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chandigarh",
  "Chhattisgarh",
  "Dadra & Nagar Haveli and Daman & Diu",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jammu & Kashmir",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Ladakh",
  "Lakshadweep",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Puducherry",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Outside India / International",
] as const;

// -------------------------------------------------------------
// SECTION 2: READINESS DOMAINS (Q7 & Q9)
// -------------------------------------------------------------

export interface ReadinessDomainItem {
  id: string;
  code: string;
  label: string;
}

export const READINESS_DOMAINS: ReadinessDomainItem[] = [
  {
    id: "domain_a",
    code: "A",
    label: "Transition from examination-oriented learning to understanding and applying medical knowledge",
  },
  {
    id: "domain_b",
    code: "B",
    label: "Self-directed learning, study skills and taking responsibility for their own learning",
  },
  {
    id: "domain_c",
    code: "C",
    label: "Understanding their evolving role, responsibilities and identity as a future doctor",
  },
  {
    id: "domain_d",
    code: "D",
    label: "Communicating appropriately and respectfully with patients and families",
  },
  {
    id: "domain_e",
    code: "E",
    label: "Professional behaviour, ethics, confidentiality and appropriate boundaries",
  },
  {
    id: "domain_f",
    code: "F",
    label: "Approaching patients with empathy, dignity and respect",
  },
  {
    id: "domain_g",
    code: "G",
    label: "Basic clinical orientation — understanding the clinical environment, ward etiquette and how to behave during patient encounters",
  },
  {
    id: "domain_h",
    code: "H",
    label: "Taking an appropriate introductory history and interacting with patients under supervision",
  },
  {
    id: "domain_i",
    code: "I",
    label: "Working effectively with peers, seniors, nurses and other members of the healthcare team",
  },
  {
    id: "domain_j",
    code: "J",
    label: "CPR, first aid and basic lifesaving preparedness",
  },
  {
    id: "domain_k",
    code: "K",
    label: "Understanding the healthcare system and the different settings in which medical care is delivered",
  },
  {
    id: "domain_l",
    code: "L",
    label: "Awareness of basic medicolegal responsibilities and safe professional behaviour",
  },
  {
    id: "domain_m",
    code: "M",
    label: "Coping with stress, uncertainty, mistakes, feedback, competition and setbacks",
  },
  {
    id: "domain_n",
    code: "N",
    label: "Digital professionalism, responsible social-media behaviour and appropriate use of AI/digital resources in medical learning",
  },
];

export const READINESS_RATING_OPTIONS = [
  "Well prepared",
  "Reasonably prepared",
  "Some preparation, but important gaps remain",
  "Poorly prepared",
  "Not prepared at all",
  "Unable to comment",
] as const;

export const Q8_OPTIONS = [
  "Very effectively — students are generally well prepared",
  "Effectively in most important areas",
  "Partly effective — benefits are visible, but important gaps remain",
  "Variable — effectiveness differs considerably between areas, batches or institutions",
  "Limited effectiveness in preparing students for actual clinical exposure",
  "Unable to comment",
] as const;

export const Q11_OPTIONS = [
  "Yes, definitely",
  "Probably yes",
  "Unsure",
  "Probably not",
  "No",
] as const;

// -------------------------------------------------------------
// SECTION 4: FOUNDATION COURSE & ECE (Q15, Q16)
// -------------------------------------------------------------

export const Q15_OPTIONS = [
  "Comprehensive and highly effective",
  "Covers most important areas",
  "Useful but variable in implementation",
  "Several important gaps remain",
  "Often treated more as a formal requirement than an engaging transition programme",
  "I do not have enough experience to comment",
] as const;

export const Q16_LIMITATIONS_OPTIONS = [
  "Limited time",
  "Large number of topics",
  "Variable faculty engagement",
  "Lack of standardised practical resources",
  "Predominantly lecture-based delivery",
  "Limited student interaction",
  "Insufficient case/scenario-based learning",
  "Difficulty sustaining student interest",
  "Limited follow-up after the Foundation Course",
  "Variation between institutions",
  "Limited integration with later MBBS learning",
  "No major limitation in my experience",
  "Other",
] as const;

// -------------------------------------------------------------
// SECTION 5: WORKSHOP FORMATS (Q17)
// -------------------------------------------------------------

export const Q17_WORKSHOP_FORMATS_OPTIONS = [
  "Interactive faculty-led sessions",
  "Real-life scenarios and case discussions",
  "Small-group activities",
  "Reflective exercises",
  "Short videos",
  "Question-and-answer modules",
  "Quizzes and challenges",
  "Practical demonstrations",
  "CPR / lifesaving skills",
  "Student / near-peer interaction",
  "Self-paced online learning",
  "Book-linked reading activities",
  "Blended workshop + digital learning",
  "Other",
] as const;

// -------------------------------------------------------------
// SECTION 6: CONTRIBUTION OPTIONS (Q19, Q20, Q22)
// -------------------------------------------------------------

export const Q19_CONTRIBUTION_INTEREST_OPTIONS = [
  "Yes, I would be interested",
  "Possibly — depending on topic and time commitment",
  "I would first like to know more",
  "Not at present",
] as const;

export const Q20_CONTRIBUTION_TYPES_OPTIONS = [
  "Suggest important topics/gaps",
  "Develop a short teaching module",
  "Contribute a clinical/professional scenario",
  "Develop questions or quizzes",
  "Contribute a reflective activity",
  "Review educational content",
  "Record a short educational video",
  "Facilitate an MBBS Foundation Workshop",
  "Contribute to CPR/first-aid components",
  "Mentor students/near-peer contributors",
  "Participate in programme evaluation/research",
  "Help introduce the initiative within my institution",
  "Help connect the initiative with other faculty/institutions",
  "Contribute to digital/online learning resources",
  "Other",
] as const;

export const Q22_TIME_COMMITMENT_OPTIONS = [
  "One small contribution of 15–30 minutes",
  "Around 1 hour",
  "A few hours over several weeks",
  "I could contribute periodically",
  "I may be interested in a larger/ongoing role",
  "Not sure yet",
] as const;

// -------------------------------------------------------------
// SECTION 7: STUDENT CONNECTION (Q23, Q24)
// -------------------------------------------------------------

export const Q23_STUDENT_CONNECTION_OPTIONS = [
  "Yes — directly",
  "Yes — indirectly",
  "Possibly",
  "Not currently",
] as const;

export const Q24_READINESS_SHARING_OPTIONS = [
  "Yes",
  "Possibly",
  "Please send me more information",
  "Not currently",
] as const;

// -------------------------------------------------------------
// SECTION 8: CONTACT & CONSENT (Q28)
// -------------------------------------------------------------

export const Q28_CONSENT_OPTIONS = [
  "Yes",
  "No",
] as const;

// -------------------------------------------------------------
// COMPLETE SURVEY FORM STATE INTERFACE
// -------------------------------------------------------------

export interface ProfessionalSurveyFormData {
  // Source Tracking
  source?: ConsultationSource | string;
  referralCode?: string;

  // Section 1: About You
  roles: string[];
  specialty?: string;
  teachingExperience?: string;
  institutionName?: string;
  city?: string;
  state?: string;
  stateCode?: string;

  // Section 2: Readiness for Clinical Exposure
  readinessRatings: Record<string, string>; // domain_a -> rating
  q8OrientationEffectiveness?: string;
  q9EmphasisAreas: string[]; // up to 5 domain IDs
  q10OneChangeSuggestion?: string;
  q11NeedForComplementaryResource?: string;
  q12MakeResourceUseful?: string;

  // Section 3: Looking Back
  q13WishTaughtAtBeginning: string;
  q14ChallengeApparentLater?: string;

  // Section 4: Foundation Course & ECE
  q15FoundationCourseDescription?: string;
  q16Limitations: string[]; // up to 3 options

  // Section 5: Building the MBBS Foundation Workshop
  q17UsefulFormats: string[]; // up to 5 options
  q18WorkshopShouldInclude?: string;

  // Section 6: Contribution Interest
  q19InterestedInContributing?: string;
  interestedInContributing: boolean; // boolean flag for DB column
  q20ContributionTypes: string[];
  q21PersonalTopicInterest?: string;
  q22TimeCommitment?: string;

  // Section 7: Student Voice & Readiness Check
  q23ConnectedWithNewStudents?: string;
  q24WillingToShareReadiness?: string;
  willingToShareReadinessSurvey: boolean; // boolean flag for DB column

  // Section 8: Stay Connected
  respondentName?: string;
  email?: string;
  mobileWhatsapp?: string;
  q28ConsentForContact?: string;
  consentForFollowup: boolean; // boolean flag for DB column
}

export const INITIAL_PROFESSIONAL_SURVEY_FORM_DATA: ProfessionalSurveyFormData = {
  roles: [],
  specialty: "",
  teachingExperience: "",
  institutionName: "",
  city: "",
  state: "",
  stateCode: "",

  readinessRatings: {},
  q8OrientationEffectiveness: "",
  q9EmphasisAreas: [],
  q10OneChangeSuggestion: "",
  q11NeedForComplementaryResource: "",
  q12MakeResourceUseful: "",

  q13WishTaughtAtBeginning: "",
  q14ChallengeApparentLater: "",

  q15FoundationCourseDescription: "",
  q16Limitations: [],

  q17UsefulFormats: [],
  q18WorkshopShouldInclude: "",

  q19InterestedInContributing: "",
  interestedInContributing: false,
  q20ContributionTypes: [],
  q21PersonalTopicInterest: "",
  q22TimeCommitment: "",

  q23ConnectedWithNewStudents: "",
  q24WillingToShareReadiness: "",
  willingToShareReadinessSurvey: false,

  respondentName: "",
  email: "",
  mobileWhatsapp: "",
  q28ConsentForContact: "",
  consentForFollowup: false,
};
