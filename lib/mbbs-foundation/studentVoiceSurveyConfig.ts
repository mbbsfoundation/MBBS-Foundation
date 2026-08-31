/**
 * MBBS Foundation — Student & Intern Voice Survey (Survey 2)
 * Configuration & Human-Readable Content Source
 *
 * Single Source of Truth for all human-readable survey text:
 * - Titles, subtitles, metadata, completion estimate
 * - Introductory copy (free of NEET/entrance mentions and purchase CTAs)
 * - Section titles, instructions, and guidance
 * - Questions Q1 through Q18 (labels, options, category groups, selection limits)
 * - Q8 10-statement rating matrix
 * - Success screen copy and contributor follow-up
 * - Plain-text survey compiler for review / ChatGPT export
 */

export const STUDENT_SURVEY_METADATA = {
  id: "survey_2_student_voice",
  version: "v1",
  statusBadge: "SURVEY 2 V1 — STRUCTURALLY STABLE / CONTENT EDITABLE",
  publicTitle: "What I Wish I Knew Before Starting MBBS",
  subtitle: "Student & Intern Voice for the MBBS Foundation Initiative",
  supportingLine: "The good, the difficult, the unexpected — and what could have made the journey easier.",
  organization: "Ayurvigyan Health Academy India Foundation",
  estimatedTime: "3–4 minutes",
  helperNote: "Most questions only require a tap. There are no right or wrong answers.",
};

export const STUDENT_SURVEY_INTRO = {
  paragraphs: [
    "Starting MBBS is an exciting milestone. It also brings experiences that are difficult to understand until you actually enter medical college.",
    "Some things are inspiring. Some are challenging. Some are completely unexpected.",
    "We are asking current medical students and interns to look back at their own journey and tell us what future students should know before they begin.",
    "Your responses will help us develop the MBBS Foundation Workshop and supporting learning resources for students entering medical college.",
    "Most questions take only a few seconds to answer.",
  ],
};

export const INDIA_STATES_LIST = [
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

export const Q8_RATING_SCALE = [
  "Never",
  "Occasionally",
  "Sometimes",
  "Often",
  "Very often",
] as const;

export interface Q8StatementConfig {
  id: string;
  code: string;
  label: string;
  category: "academic" | "social_emotional" | "clinical" | "positive_growth";
}

export const Q8_STATEMENTS: Q8StatementConfig[] = [
  {
    id: "statement_a",
    code: "A",
    label: "Unsure how to study effectively",
    category: "academic",
  },
  {
    id: "statement_b",
    code: "B",
    label: "Overwhelmed by the amount to learn",
    category: "academic",
  },
  {
    id: "statement_c",
    code: "C",
    label: "Worried that others were doing better than me",
    category: "social_emotional",
  },
  {
    id: "statement_d",
    code: "D",
    label: "Hesitant to ask teachers/seniors for help",
    category: "social_emotional",
  },
  {
    id: "statement_e",
    code: "E",
    label: "Homesick or emotionally unsettled",
    category: "social_emotional",
  },
  {
    id: "statement_f",
    code: "F",
    label: "Unsure about professional expectations",
    category: "clinical",
  },
  {
    id: "statement_g",
    code: "G",
    label: "Unsure how to interact with patients",
    category: "clinical",
  },
  {
    id: "statement_h",
    code: "H",
    label: "Unsure how to balance study and personal life",
    category: "social_emotional",
  },
  {
    id: "statement_i",
    code: "I",
    label: "More confident and independent than before",
    category: "positive_growth",
  },
  {
    id: "statement_j",
    code: "J",
    label: "Proud or excited to be studying medicine",
    category: "positive_growth",
  },
];

export interface StudentSurveyQuestionConfig {
  number: string;
  key: string;
  label: string;
  helpText?: string;
  required: boolean;
  type?: "single" | "multiple" | "matrix" | "text" | "textarea" | "select";
  maxSelections?: number;
  options?: string[] | readonly string[];
  groupedOptions?: Array<{
    groupName: string;
    items: string[];
  }>;
  placeholder?: string;
  charLimit?: number;
  conditionalOn?: string;
}

export interface StudentSurveySectionConfig {
  sectionNumber: number;
  key: string;
  title: string;
  subtitle: string;
  description?: string;
  questions: StudentSurveyQuestionConfig[];
}

export const STUDENT_SURVEY_SECTIONS_CONFIG: StudentSurveySectionConfig[] = [
  {
    sectionNumber: 1,
    key: "where_are_you_now",
    title: "Where Are You Now?",
    subtitle: "Your current stage and medical college background",
    description: "Please tell us your current phase of medical education.",
    questions: [
      {
        number: "Q1",
        key: "trainingStage",
        label: "What is your current stage?",
        helpText: "Select one option.",
        required: true,
        type: "single",
        options: [
          "First MBBS",
          "Second MBBS",
          "Third MBBS — Part I",
          "Final MBBS / Third MBBS — Part II",
          "Internship / CRRI",
        ],
      },
      {
        number: "Q2",
        key: "collegeType",
        label: "What type of medical college are you studying in?",
        helpText: "Optional",
        required: false,
        type: "single",
        options: [
          "Government medical college",
          "Central government / institute of national importance",
          "Private medical college",
          "Deemed university medical college",
          "Other",
          "Prefer not to say",
        ],
      },
      {
        number: "Q3",
        key: "state",
        label: "State / Union Territory",
        helpText: "Optional: State or UT where your medical college is located.",
        required: false,
        type: "select",
        options: INDIA_STATES_LIST,
      },
    ],
  },
  {
    sectionNumber: 2,
    key: "the_good_part",
    title: "The Good Part of Starting MBBS",
    subtitle: "What felt exciting, meaningful, or rewarding",
    description: "First, tell us what felt exciting or rewarding when you entered medical college.",
    questions: [
      {
        number: "Q4",
        key: "q4RewardingExperiences",
        label: "Which experiences made the beginning of MBBS exciting or meaningful for you? (Choose up to 5)",
        helpText: "Select up to 5 experiences.",
        required: true,
        type: "multiple",
        maxSelections: 5,
        options: [
          "Finally becoming a medical student",
          "Wearing the white coat / entering the medical profession",
          "Anatomy and the dissection hall",
          "Learning about the human body in depth",
          "First interaction with patients",
          "Clinical exposure / hospital environment",
          "Learning practical skills",
          "Meeting people with similar goals",
          "New friendships",
          "Living independently",
          "Hostel/campus life",
          "Feeling a stronger sense of purpose",
          "Becoming more confident",
          "Becoming more mature/responsible",
          "Learning from inspiring teachers/doctors",
          "Other",
        ],
      },
      {
        number: "Q5",
        key: "q5FirstMonthsFeeling",
        label: "Overall, how did your first few months of MBBS feel?",
        helpText: "Select the option that best summarizes your initial months.",
        required: true,
        type: "single",
        options: [
          "Exciting and comfortable",
          "Exciting but challenging",
          "More difficult than expected",
          "Overwhelming initially but improved with time",
          "Mixed — some very good and some very difficult experiences",
          "Difficult for a prolonged period",
        ],
      },
    ],
  },
  {
    sectionNumber: 3,
    key: "what_was_harder",
    title: "What Was Harder or More Unexpected?",
    subtitle: "Surprises, challenges, and personal adjustments",
    description: "Now think about the things that surprised you or took time to adjust to.",
    questions: [
      {
        number: "Q6",
        key: "q6HarderAspects",
        label: "Which aspects were harder than you expected? (Choose up to 6)",
        helpText: "Select up to 6 challenges across learning, medical environment, and personal life.",
        required: true,
        type: "multiple",
        maxSelections: 6,
        groupedOptions: [
          {
            groupName: "Learning & Academics",
            items: [
              "Very large volume of content",
              "Understanding how to study in MBBS",
              "Remembering and integrating information",
              "Self-directed learning",
              "Managing multiple subjects simultaneously",
              "Assessments / examinations",
            ],
          },
          {
            groupName: "Medical Environment & Training",
            items: [
              "Anatomy / cadaver / dissection experience",
              "Entering hospitals/wards",
              "Talking to patients",
              "Medical terminology",
              "Understanding how doctors and healthcare teams work",
              "Professional expectations",
            ],
          },
          {
            groupName: "Personal & Social Adjustment",
            items: [
              "Time management",
              "Living away from home",
              "Hostel adjustment",
              "Making new friends",
              "Feeling lonely or isolated",
              "Comparing myself with classmates",
              "Loss of confidence",
              "Stress / anxiety / emotional pressure",
              "Balancing study and personal life",
              "Asking for help when struggling",
            ],
          },
          {
            groupName: "Other",
            items: [
              "Nothing was particularly difficult",
              "Other",
            ],
          },
        ],
      },
      {
        number: "Q7",
        key: "q7UnexpectedAspects",
        label: "Which things were most different from what you had imagined before joining MBBS? (Choose up to 5)",
        helpText: "Select up to 5 things that were different from your expectations.",
        required: true,
        type: "multiple",
        maxSelections: 5,
        options: [
          "Amount of study required",
          "Teaching and learning style",
          "Need to study independently",
          "Frequency of assessments",
          "Importance of communication skills",
          "Importance of professionalism and behaviour",
          "Interaction with patients",
          "Dissection/cadaver experience",
          "Hospital culture and hierarchy",
          "Relationship with seniors",
          "Relationship with teachers",
          "Emotional side of seeing illness/suffering",
          "Importance of teamwork",
          "Need to manage stress and uncertainty",
          "Level of personal responsibility",
          "Hostel/campus life",
          "How much I changed personally",
          "Nothing was very different",
          "Other",
        ],
      },
      {
        number: "Q8",
        key: "q8FirstYearFeelings",
        label: "During your first year, how often did you feel:",
        helpText: "Quick tap rating for each of the 10 statements below.",
        required: true,
        type: "matrix",
      },
    ],
  },
  {
    sectionNumber: 4,
    key: "what_should_students_know",
    title: "What Should Students Know Before They Start?",
    subtitle: "Essential guidance, optimal formats, and timing",
    description: "Imagine a student who is joining MBBS next month. What would genuinely help them start better?",
    questions: [
      {
        number: "Q9",
        key: "q9ShouldUnderstandBefore",
        label: "Which areas should a new MBBS student understand BEFORE or during the first few weeks of medical college? (Choose up to 7)",
        helpText: "Select up to 7 high-priority transition areas.",
        required: true,
        type: "multiple",
        maxSelections: 7,
        options: [
          "How MBBS learning is different from school",
          "How to study effectively in medical college",
          "How to manage the large volume of content",
          "How to manage time",
          "What happens in the dissection hall",
          "How to approach the cadaver respectfully",
          "What early patient interaction feels like",
          "How to communicate with patients",
          "How to interact with teachers and seniors",
          "Professional behaviour and medical etiquette",
          "Ethics, confidentiality and patient dignity",
          "Basic CPR and first aid",
          "Understanding the hospital and healthcare system",
          "Basic medicolegal awareness",
          "Teamwork",
          "Dealing with stress and setbacks",
          "Managing comparison and competition",
          "Building confidence",
          "Living away from home / hostel adjustment",
          "Making friends and building support systems",
          "Asking for help",
          "Balancing study and personal life",
          "Digital professionalism",
          "Appropriate use of social media and AI",
          "Understanding what becoming a doctor really involves",
        ],
      },
      {
        number: "Q10",
        key: "q10HelpfulGuidanceTypes",
        label: "Which type of guidance would have helped you most at the beginning? (Choose up to 5)",
        helpText: "Select up to 5 guidance methods.",
        required: true,
        type: "multiple",
        maxSelections: 5,
        options: [
          "A practical book written specifically for new MBBS students",
          "Short orientation videos",
          "Advice from senior students/interns",
          "Real student experiences and stories",
          "Faculty-led discussion",
          "Small-group workshop",
          "Practical demonstrations",
          "Scenarios: “What would you do?”",
          "Questions/quizzes",
          "Checklist for the first few weeks",
          "Guidance for parents/family",
          "Self-paced online resource",
          "Workshop + book + digital resources together",
          "I did not need additional guidance",
        ],
      },
      {
        number: "Q11",
        key: "q11BestTimingForGuidance",
        label: "When would this guidance have been most useful?",
        helpText: "Select one option.",
        required: true,
        type: "single",
        options: [
          "Before joining medical college",
          "During the weeks between admission and joining",
          "During the Foundation Course",
          "During the first month",
          "During the first 3 months",
          "Throughout first MBBS",
          "Only when specific problems arose",
        ],
      },
      {
        number: "Q12",
        key: "q12GuideUsefulnessRating",
        label: "If you had received a structured guide explaining the academic, professional, social and personal realities of MBBS before starting, how useful do you think it would have been?",
        helpText: "Select one option.",
        required: true,
        type: "single",
        options: [
          "Extremely useful",
          "Very useful",
          "Moderately useful",
          "Slightly useful",
          "Probably not useful",
        ],
      },
      {
        number: "Q13",
        key: "q13GuideEssentialComponents",
        label: "Which components should such a guide definitely include? (Choose up to 7)",
        helpText: "Select up to 7 components.",
        required: true,
        type: "multiple",
        maxSelections: 7,
        options: [
          "Understanding MBBS and medical college culture",
          "Study strategies",
          "Anatomy/dissection orientation",
          "First patient interaction",
          "Communication skills",
          "Professionalism and ethics",
          "CPR and first aid",
          "Hospital orientation",
          "Healthcare system",
          "Medicolegal basics",
          "Stress and emotional wellbeing",
          "Confidence and self-growth",
          "Hostel/living-away-from-home adjustment",
          "Friendships and peer relationships",
          "Managing comparison/competition",
          "Time management",
          "Handling feedback and failure",
          "Asking for help",
          "Digital professionalism",
          "Social media and AI use",
          "Reflections from senior students",
          "Real-life scenarios",
          "Practical checklists",
        ],
      },
    ],
  },
  {
    sectionNumber: 5,
    key: "your_voice",
    title: "Your Voice for the Next Batch",
    subtitle: "Reflections, contributor opportunities, and a word for incoming students",
    description: "Your concluding insights will help shape guidance for the upcoming batch.",
    questions: [
      {
        number: "Q14",
        key: "q14TransitionFitStatement",
        label: "Looking back, which statement fits you best?",
        helpText: "Select one statement.",
        required: true,
        type: "single",
        options: [
          "I adjusted comfortably and enjoyed the transition",
          "I had some difficulties but adapted fairly quickly",
          "I struggled initially and wish I had been better prepared",
          "I faced significant difficulties that took time to understand/manage",
          "My experience had both major joys and major struggles",
        ],
      },
      {
        number: "Q15",
        key: "q15PriorKnowledgeWouldHaveHelped",
        label: "If you had known in advance about the challenges you personally faced, would the beginning of MBBS have been easier?",
        helpText: "Select one option.",
        required: true,
        type: "single",
        options: [
          "Definitely yes",
          "Probably yes",
          "Maybe",
          "Probably not",
          "No",
        ],
      },
      {
        number: "Q16",
        key: "q16InterestedInHelping",
        label: "Would you be interested in helping future MBBS students begin better?",
        helpText: "Selecting Yes/Possibly opens contributor options below.",
        required: true,
        type: "single",
        options: [
          "Yes",
          "Possibly",
          "I would like to know more",
          "Not at present",
        ],
      },
      {
        number: "Q17",
        key: "q17HelpMethods",
        label: "How might you like to help? (Select all that apply)",
        helpText: "Shown when interested in contributing (Q16).",
        conditionalOn: "q16",
        required: false,
        type: "multiple",
        options: [
          "Share practical tips for new students",
          "Share a short personal experience",
          "Suggest important topics",
          "Participate in student discussion/panel",
          "Review student learning material",
          "Record a short video/message",
          "Help with workshop activities",
          "Help with CPR/first-aid activities",
          "Support near-peer/student guidance",
          "Help evaluate the programme",
          "Share the initiative with new MBBS students",
          "Other",
        ],
      },
      {
        number: "Q18",
        key: "q18OneThingWishTold",
        label: "Is there ONE thing you wish someone had told you before you started MBBS?",
        helpText: "Optional — one sentence is enough.",
        required: false,
        type: "textarea",
        placeholder: "One thing I wish I had known...",
        charLimit: 250,
      },
    ],
  },
];

export const STUDENT_SUCCESS_SCREEN_CONFIG = {
  heading: "Thank You for Helping the Next Batch Begin Better",
  leadMessage: "Your experience has been securely received.",
  bodyMessage: "What students enjoy, struggle with and wish they had known will help us design better guidance for those entering medical college.",
  initiativeNote: "These insights will contribute to the development of the MBBS Foundation Workshop and supporting learning resources.",
  contributorHeading: "Your Experience Can Help Someone Starting Out",
  contributorMessage: "You indicated that you may be interested in contributing. AHA India may contact you about suitable student-contributor or near-peer opportunities as the initiative develops.",
  comingNextHeading: "Coming Next",
  comingNextDescription: "MBBS Entry Readiness Check for newly admitted and first-year MBBS students.",
  comingNextButtonText: "Coming Soon",
  privacyStatement: "Contact information will be used only for communication related to the MBBS Foundation initiative and will not be shared with third parties for marketing.",
};

// -------------------------------------------------------------
// PLAIN TEXT SURVEY COMPILATION GENERATOR
// Used by Admin Dashboard to copy full survey text for review/ChatGPT
// -------------------------------------------------------------

export function generateStudentVoiceSurveyPlainText(): string {
  const lines: string[] = [];

  lines.push("================================================================================");
  lines.push(`${STUDENT_SURVEY_METADATA.publicTitle.toUpperCase()}`);
  lines.push(`Subtitle: ${STUDENT_SURVEY_METADATA.subtitle}`);
  lines.push(`Supporting Line: ${STUDENT_SURVEY_METADATA.supportingLine}`);
  lines.push(`Version: ${STUDENT_SURVEY_METADATA.version}`);
  lines.push(`Status: ${STUDENT_SURVEY_METADATA.statusBadge}`);
  lines.push(`Estimated Time: ${STUDENT_SURVEY_METADATA.estimatedTime}`);
  lines.push(`Note: ${STUDENT_SURVEY_METADATA.helperNote}`);
  lines.push("================================================================================\n");

  lines.push("--- INTRODUCTION ---\n");
  STUDENT_SURVEY_INTRO.paragraphs.forEach((p) => lines.push(p));
  lines.push("\n================================================================================\n");

  STUDENT_SURVEY_SECTIONS_CONFIG.forEach((sec) => {
    lines.push(`SECTION ${sec.sectionNumber} — ${sec.title.toUpperCase()}`);
    lines.push(`Subtitle: ${sec.subtitle}`);
    if (sec.description) {
      lines.push(`Description: ${sec.description}`);
    }
    lines.push("");

    sec.questions.forEach((q) => {
      lines.push(`${q.number}. ${q.label}`);
      lines.push(`   Internal Key: ${q.key}`);
      lines.push(`   Required: ${q.required ? "Yes" : "Optional"}`);
      lines.push(`   Type: ${q.type || "single"}${q.maxSelections ? ` (Choose up to ${q.maxSelections})` : ""}`);
      if (q.charLimit) {
        lines.push(`   Character Limit: ${q.charLimit}`);
      }
      if (q.helpText) {
        lines.push(`   Guidance: ${q.helpText}`);
      }
      if (q.conditionalOn) {
        lines.push(`   Condition: Displayed if respondent shows interest in Q16.`);
      }

      if (q.type === "matrix") {
        lines.push("   Rating Scale: " + Q8_RATING_SCALE.join(" | "));
        lines.push("   10 Statements:");
        Q8_STATEMENTS.forEach((s) => {
          lines.push(`     [${s.code}] ${s.label} (${s.category})`);
        });
      } else if (q.groupedOptions) {
        lines.push("   Grouped Options:");
        q.groupedOptions.forEach((grp) => {
          lines.push(`     • ${grp.groupName}:`);
          grp.items.forEach((item) => {
            lines.push(`       - ${item}`);
          });
        });
      } else if (q.options && Array.isArray(q.options)) {
        lines.push("   Options:");
        q.options.forEach((opt: string) => {
          lines.push(`     - ${opt}`);
        });
      }

      lines.push("");
    });

    lines.push("--------------------------------------------------------------------------------\n");
  });

  lines.push("--- OPTIONAL CONTRIBUTOR CONTACT ---");
  lines.push("Shown if Q16 is Yes / Possibly / I would like to know more:");
  lines.push("- May AHA India contact you about future student-contributor opportunities? (Yes/No)");
  lines.push("- Full Name (Optional)");
  lines.push("- Email Address (Optional)");
  lines.push("- Mobile / WhatsApp Number (Optional)");
  lines.push(`- Privacy Statement: ${STUDENT_SUCCESS_SCREEN_CONFIG.privacyStatement}`);
  lines.push("\n--- POST-SUBMISSION MESSAGE ---");
  lines.push(`Heading: ${STUDENT_SUCCESS_SCREEN_CONFIG.heading}`);
  lines.push(`Lead: ${STUDENT_SUCCESS_SCREEN_CONFIG.leadMessage}`);
  lines.push(`Body: ${STUDENT_SUCCESS_SCREEN_CONFIG.bodyMessage}`);
  lines.push(`Initiative Note: ${STUDENT_SUCCESS_SCREEN_CONFIG.initiativeNote}`);
  lines.push(`Contributor Note: ${STUDENT_SUCCESS_SCREEN_CONFIG.contributorMessage}`);
  lines.push("================================================================================");

  return lines.join("\n");
}
