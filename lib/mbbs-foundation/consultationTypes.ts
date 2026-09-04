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
// SECTION 1: ABOUT YOU OPTIONS (V2 LOCKED)
// -------------------------------------------------------------

export const PROFESSIONAL_ROLES_OPTIONS = [
  "Medical college faculty",
  "Foundation Course faculty/coordinator",
  "Medical Education Unit (MEU) member",
  "Dean / Principal / Academic administrator",
  "Clinician / Practising doctor",
  "Medical educator",
  "Resident / Postgraduate doctor",
  "CPR Course Coordinator / CPR Instructor / Trainer / Champion",
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
  "Medical Education",
  "Administration",
  "Other clinical specialty",
  "Other pre/paraclinical specialty",
  "Other",
] as const;

export const TEACHING_EXPERIENCE_OPTIONS = [
  "Less than 5 years",
  "5–10 years",
  "11–20 years",
  "More than 20 years",
  "Primarily involved in clinical/skills training rather than formal teaching",
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
// SECTION 2: READINESS DOMAINS (Q5 & Q6 V2 LOCKED DISPLAY ORDER)
// -------------------------------------------------------------

export interface ReadinessDomainItem {
  id: string;
  code: string;
  internalCode: string;
  title: string;
  label: string;
  description: string;
  category?: string;
}

export const READINESS_DOMAINS: ReadinessDomainItem[] = [
  {
    id: "domain_a",
    code: "1",
    internalCode: "A",
    title: "Learning & study transition",
    label: "Learning & study transition",
    description: "Moving from examination-oriented learning to understanding and applying medical knowledge",
    category: "Learning & Academics",
  },
  {
    id: "domain_j",
    code: "2",
    internalCode: "J",
    title: "CPR, first aid & lifesaving skills",
    label: "CPR, first aid & lifesaving skills",
    description: "Basic CPR, first aid and lifesaving preparedness for common medical emergencies",
    category: "Emergency Skills",
  },
  {
    id: "domain_b",
    code: "3",
    internalCode: "B",
    title: "Self-directed learning",
    label: "Self-directed learning",
    description: "Developing effective study skills and taking responsibility for one's own learning",
    category: "Learning & Academics",
  },
  {
    id: "domain_c",
    code: "4",
    internalCode: "C",
    title: "Professional identity",
    label: "Professional identity",
    description: "Understanding the evolving role, responsibilities and identity of a future doctor",
    category: "Professional Identity",
  },
  {
    id: "domain_d",
    code: "5",
    internalCode: "D",
    title: "Patient communication",
    label: "Patient communication",
    description: "Communicating appropriately and respectfully with patients and families",
    category: "Communication",
  },
  {
    id: "domain_e",
    code: "6",
    internalCode: "E",
    title: "Ethics & professionalism",
    label: "Ethics & professionalism",
    description: "Professional behaviour, ethics, confidentiality and appropriate boundaries",
    category: "Ethics & Professionalism",
  },
  {
    id: "domain_f",
    code: "7",
    internalCode: "F",
    title: "Empathy & respect",
    label: "Empathy & respect",
    description: "Approaching patients with empathy, dignity and respect",
    category: "Communication & Ethics",
  },
  {
    id: "domain_g",
    code: "8",
    internalCode: "G",
    title: "Clinical environment & etiquette",
    label: "Clinical environment & etiquette",
    description: "Understanding the hospital/clinical environment, ward etiquette and appropriate behaviour during patient encounters",
    category: "Clinical Skills & Etiquette",
  },
  {
    id: "domain_h",
    code: "9",
    internalCode: "H",
    title: "Early patient interaction",
    label: "Early patient interaction",
    description: "Taking an introductory history and interacting appropriately with patients under supervision",
    category: "Clinical Skills",
  },
  {
    id: "domain_i",
    code: "10",
    internalCode: "I",
    title: "Teamwork",
    label: "Teamwork",
    description: "Working effectively with peers, seniors, nurses and other healthcare professionals",
    category: "Teamwork & Systems",
  },
  {
    id: "domain_k",
    code: "11",
    internalCode: "K",
    title: "Healthcare system orientation",
    label: "Healthcare system orientation",
    description: "Understanding how healthcare is organised and the different settings in which medical care is delivered",
    category: "Healthcare Systems",
  },
  {
    id: "domain_l",
    code: "12",
    internalCode: "L",
    title: "Medicolegal awareness",
    label: "Medicolegal awareness",
    description: "Understanding basic medicolegal responsibilities and safe professional behaviour",
    category: "Ethics & Legal",
  },
  {
    id: "domain_m",
    code: "13",
    internalCode: "M",
    title: "Coping, self-care & resilience",
    label: "Coping, self-care & resilience",
    description: "Coping with stress, uncertainty, mistakes, feedback, competition and setbacks",
    category: "Resilience & Wellbeing",
  },
  {
    id: "domain_n",
    code: "14",
    internalCode: "N",
    title: "Digital professionalism",
    label: "Digital professionalism",
    description: "Responsible social-media behaviour and appropriate use of AI and digital resources in medical learning",
    category: "Digital Professionalism",
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

// -------------------------------------------------------------
// SECTION 3: CURRENT FOUNDATION COURSE (Q7 & Q8 V2 LOCKED)
// -------------------------------------------------------------

export const Q7_FOUNDATION_COURSE_OPTIONS = [
  "Comprehensive and highly effective",
  "Covers most important areas effectively",
  "Useful, but implementation is variable",
  "Useful, but several important gaps remain",
  "Often functions more as a formal requirement than an engaging transition programme",
  "I do not have enough experience to comment",
] as const;

// Retained alias for V1 backward compatibility
export const Q15_OPTIONS = Q7_FOUNDATION_COURSE_OPTIONS;

export const Q8_LIMITATIONS_OPTIONS = [
  "Limited time",
  "Too many topics within the available time",
  "Variable faculty engagement",
  "Lack of standardised practical resources",
  "Predominantly lecture-based delivery",
  "Limited student interaction",
  "Insufficient case/scenario-based learning",
  "Difficulty sustaining student engagement",
  "Limited follow-up after the Foundation Course",
  "Variation between institutions",
  "Limited integration with subsequent MBBS learning",
  "No major limitation in my experience",
  "Other",
] as const;

// Retained alias for V1 backward compatibility
export const Q16_LIMITATIONS_OPTIONS = Q8_LIMITATIONS_OPTIONS;

// -------------------------------------------------------------
// SECTION 5: WORKSHOP LEARNING APPROACHES (Q10 V2 LOCKED)
// -------------------------------------------------------------

export const Q10_WORKSHOP_FORMATS_OPTIONS = [
  "Interactive faculty-led sessions",
  "Real-life scenarios and case discussions",
  "Small-group activities and peer interaction",
  "Practical demonstrations and skills",
  "CPR / first-aid and lifesaving workshops",
  "Reflection and guided discussion",
  "Short videos and digital learning resources",
  "Blended workshop + self-paced learning",
  "Other",
] as const;

// Retained alias for V1 backward compatibility
export const Q17_WORKSHOP_FORMATS_OPTIONS = Q10_WORKSHOP_FORMATS_OPTIONS;

// -------------------------------------------------------------
// SECTION 6: CONTRIBUTION OPTIONS (Q11 & Q12 V2 LOCKED)
// -------------------------------------------------------------

export const Q11_CONTRIBUTION_INTEREST_OPTIONS = [
  "Yes, I would be interested",
  "Possibly — depending on the topic and time required",
  "I would first like to know more",
  "Not at present",
] as const;

// Retained alias for V1 backward compatibility
export const Q19_CONTRIBUTION_INTEREST_OPTIONS = Q11_CONTRIBUTION_INTEREST_OPTIONS;

export interface ContributionPathwayOption {
  title: string;
  description: string;
}

export const Q12_CONTRIBUTION_PATHWAYS: ContributionPathwayOption[] = [
  {
    title: "Workshop Faculty / Facilitator",
    description: "facilitate MBBS Foundation sessions",
  },
  {
    title: "Content, Module or Scenario Contributor",
    description: "contribute practical educational content, cases or scenarios",
  },
  {
    title: "Academic Reviewer",
    description: "review educational material, modules or assessments",
  },
  {
    title: "CPR / First Aid Faculty",
    description: "contribute to practical lifesaving-skills training",
  },
  {
    title: "Institutional Coordinator",
    description: "help introduce or coordinate the MBBS Foundation initiative within my institution",
  },
  {
    title: "Student Mentor / Near-Peer Programme Contributor",
    description: "support student transition and mentoring activities",
  },
  {
    title: "Research, Evaluation & Educational Innovation",
    description: "contribute to programme evaluation, research or educational innovation",
  },
  {
    title: "Networking / Advocacy",
    description: "help connect the initiative with other faculty or institutions",
  },
  {
    title: "Other",
    description: "other contributions",
  },
];

export const Q20_CONTRIBUTION_TYPES_OPTIONS = [
  "Workshop Faculty / Facilitator",
  "Content, Module or Scenario Contributor",
  "Academic Reviewer",
  "CPR / First Aid Faculty",
  "Institutional Coordinator",
  "Student Mentor / Near-Peer Programme Contributor",
  "Research, Evaluation & Educational Innovation",
  "Networking / Advocacy",
  "Other",
] as const;

// Legacy V1 option constants (kept for backward compatibility with old records)
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

export const Q22_TIME_COMMITMENT_OPTIONS = [
  "One small contribution of 15–30 minutes",
  "Around 1 hour",
  "A few hours over several weeks",
  "I could contribute periodically",
  "I may be interested in a larger/ongoing role",
  "Not sure yet",
] as const;

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
// SECTION 7: CONTACT & CONSENT (Q28 / V2 CONTACT CONSENT)
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
