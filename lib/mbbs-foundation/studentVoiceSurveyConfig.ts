/**
 * MBBS Foundation — Student & Intern Voice Survey (Survey 2) V2 Locked Configuration
 *
 * Single Source of Truth for all human-readable Student Voice text:
 * - Metadata, intro copy, 7 sections, 10 survey questions (Q1–Q10)
 * - Exact selection limits (Q3 max 4, Q4 max 5, Q5 max 5, Q7 max 7, Q8 max 5)
 * - Q6 8-statement matrix with 5-point scale
 * - Q10 open text and anonymous quote permission flag
 * - Post-submission Thank You and Pass It Forward contribution options
 * - Plain-text compiler for export and review
 */

export const STUDENT_SURVEY_METADATA = {
  id: "survey_2_student_voice_v2",
  version: "v2",
  statusBadge: "MBBS FOUNDATION — STUDENT & INTERN VOICE (V2 LOCKED)",
  publicTitle: "What I Wish I Knew Before Starting MBBS",
  subtitle: "Student & Intern Voice for the MBBS Foundation Initiative",
  supportingLine: "What was exciting, difficult or unexpected about entering medical college — and what could have made the journey easier?",
  organization: "Ayurvigyan Health Academy India Foundation",
  estimatedTime: "3–4 minutes",
  helperNote: "A retrospective consultation for current MBBS students and interns. Most questions take only a tap.",
};

export const STUDENT_SURVEY_INTRO = {
  paragraphs: [
    "Starting MBBS is an exciting milestone. It also brings experiences, surprises, and challenges that are difficult to understand until you actually enter medical college.",
    "This consultation is for current MBBS students and interns looking back on their transition into medical college.",
    "Your responses will be considered alongside the perspectives of clinicians and medical educators to help identify what students genuinely need when entering MBBS.",
    "Most questions take only a few seconds to complete.",
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

// Q1 Options
export const Q1_TRAINING_STAGE_OPTIONS = [
  "First MBBS",
  "Second MBBS",
  "Third MBBS Part I",
  "Final MBBS",
  "Internship",
] as const;

// Q2 College Types
export const Q2_COLLEGE_TYPE_OPTIONS = [
  "Government Medical College",
  "Central Government / Institute of National Importance",
  "Private Medical College",
  "Deemed University Medical College",
  "Other",
  "Prefer not to say",
] as const;

// Q3 Rewarding Options (Choose up to 4)
export const Q3_REWARDING_OPTIONS = [
  "Finally studying medicine and the human body in depth",
  "Anatomy dissection and practical learning",
  "Entering hospitals and seeing real clinical care",
  "Interacting with patients",
  "Learning practical and lifesaving skills",
  "Meeting people with similar ambitions",
  "Making close friends",
  "Becoming more independent",
  "Beginning to feel like a future doctor",
  "Meeting inspiring teachers, seniors or doctors",
  "Discovering subjects or areas of medicine I genuinely enjoy",
  "College life, hostel life or other new experiences",
  "Nothing particularly surprised me",
  "Other",
] as const;

// Q4 Harder Aspects Options (Choose up to 5)
export const Q4_HARDER_OPTIONS = [
  "The sheer amount of material to learn",
  "Figuring out how to study effectively in MBBS",
  "Remembering what I had studied",
  "Managing time and staying consistent",
  "Understanding what teachers expected",
  "Practicals, viva and assessments",
  "Communicating with faculty or seniors",
  "Hospital and patient interactions",
  "Hostel life or living away from home",
  "Making friends or fitting in",
  "Stress, comparison and self-doubt",
  "Sleep, health and self-care",
  "Balancing studies with life outside academics",
  "Taking responsibility for my own learning",
  "Nothing was significantly harder than I expected",
  "Other",
] as const;

// Q5 Surprises Options (Choose up to 5) — Exact locked display order with CPR 2nd
export const Q5_SURPRISES_OPTIONS = [
  "The way you need to learn in MBBS is very different from how you studied before entering medical college",
  "Knowing about CPR, first aid and emergencies is very different from actually being prepared to respond",
  "There is far more to becoming a doctor than learning from textbooks",
  "Nobody really tells you exactly how to study in MBBS — you have to figure out much of it yourself",
  "Being academically strong before MBBS does not automatically make the transition easy",
  "Communication and confidence matter much more than I expected",
  "Professional behaviour begins much earlier than I realised",
  "You may start meeting patients before you feel fully ready",
  "Teamwork with seniors, nurses and other healthcare professionals matters a lot",
  "Viva, practicals and clinical discussions require a different kind of preparation",
  "Being surrounded by high-performing peers can affect your confidence",
  "Asking for help can sometimes feel harder than expected",
  "Mistakes, criticism and feedback are a normal part of medical training",
  "Taking care of your health and wellbeing can become difficult",
  "Social media, AI and digital tools create new opportunities, problems and responsibilities",
  "Nothing particularly surprised me",
  "Other",
] as const;

// Q6 Frequency Rating Scale (5 choices)
export const Q6_RATING_SCALE = [
  "Never",
  "Rarely",
  "Sometimes",
  "Often",
  "Very often",
] as const;

// Q6 8 Matrix Statements
export interface Q6StatementConfig {
  id: string;
  code: string;
  label: string;
}

export const Q6_STATEMENTS: Q6StatementConfig[] = [
  {
    id: "statement_1",
    code: "1",
    label: "I felt unsure about how to study effectively for MBBS",
  },
  {
    id: "statement_2",
    code: "2",
    label: "I felt overwhelmed by the amount I was expected to learn",
  },
  {
    id: "statement_3",
    code: "3",
    label: "I sometimes wondered whether everyone else was coping better than I was",
  },
  {
    id: "statement_4",
    code: "4",
    label: "I was not always sure what was expected of me as a medical student and future doctor",
  },
  {
    id: "statement_5",
    code: "5",
    label: "I felt unprepared for some of my early patient or hospital interactions",
  },
  {
    id: "statement_6",
    code: "6",
    label: "I found it difficult to balance studies, health and life outside academics",
  },
  {
    id: "statement_7",
    code: "7",
    label: "I gradually became more confident and independent",
  },
  {
    id: "statement_8",
    code: "8",
    label: "I felt excited or proud that I was finally becoming a doctor",
  },
];

// Q7 Next Batch Preparation Priorities (Choose up to 7)
export const Q7_NEXT_BATCH_OPTIONS = [
  "How studying MBBS differs from preparing for NEET",
  "How to study effectively without trying to read everything",
  "Time management and building a sustainable routine",
  "How exams, practicals and viva work",
  "Independent learning and choosing useful learning resources",
  "What the first year of MBBS is actually like",
  "How to interact with faculty and seniors",
  "How to communicate with patients",
  "Hospital and ward etiquette",
  "Professionalism, ethics and responsibilities of a medical student",
  "Empathy and respectful patient care",
  "Teamwork with peers, nurses and other healthcare professionals",
  "CPR, first aid and lifesaving skills",
  "Handling stress, comparison, mistakes and setbacks",
  "Self-care, sleep and maintaining health",
  "Hostel life and adjusting to living away from home",
  "Friendships and building a support system",
  "Responsible use of social media",
  "Appropriate use of AI and digital learning resources",
  "Understanding the healthcare system",
  "Basic medicolegal awareness and safe professional behaviour",
  "Other",
] as const;

// Q8 Useful Preparation Formats (Choose up to 5) — Neutral 1st option
export const Q8_PREPARATION_OPTIONS = [
  "A practical orientation to what MBBS is actually like before or around joining",
  "Honest guidance from current medical students or interns",
  "Sessions with experienced medical faculty or clinicians",
  "Real-life situations and scenario-based discussions",
  "Practical demonstrations and basic clinical orientation",
  "CPR, first aid and lifesaving skills",
  "Small-group interaction with other incoming students",
  "Short videos and digital learning resources",
  "A practical guide or checklist",
  "Mentoring or near-peer support during the early months",
  "I don't think additional preparation would have made much difference",
  "Other",
] as const;

// Q9 Best Timing Options (Single select)
export const Q9_TIMING_OPTIONS = [
  "Before joining medical college",
  "In the first few days after joining",
  "During the first month",
  "Throughout the first few months",
  "I don't think additional preparation was necessary",
] as const;

// Post-Submission Contribution Pathways
export const POST_SUBMISSION_CONTRIBUTION_OPTIONS = [
  "Share my experiences and practical tips",
  "Join a Student Voice discussion / panel",
  "Mentor or guide incoming students",
  "Contribute to MBBS Foundation student resources",
  "Help with student research / evaluation",
  "Help take Student Voice to more medical students",
  "Other",
] as const;

// -------------------------------------------------------------
// EXACT 7 SECTIONS CONFIGURATION
// -------------------------------------------------------------

export interface StudentSurveyQuestionConfig {
  number: string;
  key: string;
  label: string;
  instruction?: string;
  helpText?: string;
  required: boolean;
  type: "single" | "multiple" | "matrix" | "textarea" | "select";
  maxSelections?: number;
  options?: readonly string[] | string[];
  placeholder?: string;
  charLimit?: number;
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
    subtitle: "Your stage in the medical journey and college background",
    description: "Tell us where you are currently in your medical education.",
    questions: [
      {
        number: "Q1",
        key: "trainingStage",
        label: "Where are you currently in your medical journey?",
        instruction: "Select one option.",
        required: true,
        type: "single",
        options: Q1_TRAINING_STAGE_OPTIONS,
      },
      {
        number: "Q2",
        key: "collegeType",
        label: "Tell us a little about your medical college.",
        instruction: "College type, State/UT, and Medical College (Optional).",
        required: false,
        type: "single",
        options: Q2_COLLEGE_TYPE_OPTIONS,
      },
    ],
  },
  {
    sectionNumber: 2,
    key: "then_mbbs_started",
    title: "Then MBBS Actually Started...",
    subtitle: "The exciting, rewarding, and difficult realities",
    description: "Reflect on what stood out during your initial experience of medical college.",
    questions: [
      {
        number: "Q3",
        key: "q3RewardingExperiences",
        label: "What turned out to be more exciting or rewarding about MBBS than you had expected?",
        instruction: "Choose up to 4.",
        required: true,
        type: "multiple",
        maxSelections: 4,
        options: Q3_REWARDING_OPTIONS,
      },
      {
        number: "Q4",
        key: "q4HarderAspects",
        label: "Now the other side: what was harder than you expected when you entered MBBS?",
        instruction: "Choose up to 5.",
        required: true,
        type: "multiple",
        maxSelections: 5,
        options: Q4_HARDER_OPTIONS,
      },
    ],
  },
  {
    sectionNumber: 3,
    key: "the_things_nobody_tells_you",
    title: "The Things Nobody Really Tells You",
    subtitle: "Unexpected discoveries and hidden transitions",
    description: "Things that become apparent only after entering the medical environment.",
    questions: [
      {
        number: "Q5",
        key: "q5Surprises",
        label: "Which of these surprised you after entering medical college?",
        instruction: "Choose up to 5.",
        required: true,
        type: "multiple",
        maxSelections: 5,
        options: Q5_SURPRISES_OPTIONS,
      },
    ],
  },
  {
    sectionNumber: 4,
    key: "how_did_the_transition_feel",
    title: "How Did the Transition Actually Feel?",
    subtitle: "Frequency of early medical college experiences",
    description: "Thinking back to your early months in MBBS, rate each statement.",
    questions: [
      {
        number: "Q6",
        key: "q6TransitionMatrix",
        label: "During your early months in MBBS, how often did you experience the following?",
        instruction: "Rate all 8 statements on the 5-point scale.",
        required: true,
        type: "matrix",
      },
    ],
  },
  {
    sectionNumber: 5,
    key: "prepare_the_next_batch",
    title: "If You Could Prepare the Next Batch...",
    subtitle: "High-priority advice for incoming medical students",
    description: "Imagine you have 3 hours with a NEET-qualified student before their first day of medical college.",
    questions: [
      {
        number: "Q7",
        key: "q7NextBatchPriorities",
        label: "Imagine you have 3 hours with a NEET-qualified student before their first day of medical college. What would you make sure they understood?",
        instruction: "Choose up to 7.",
        required: true,
        type: "multiple",
        maxSelections: 7,
        options: Q7_NEXT_BATCH_OPTIONS,
      },
    ],
  },
  {
    sectionNumber: 6,
    key: "what_would_actually_have_helped",
    title: "What Would Actually Have Helped?",
    subtitle: "Effective preparation approaches and optimal timing",
    description: "Looking back at the weeks before you joined, what preparation would have made a difference?",
    questions: [
      {
        number: "Q8",
        key: "q8UsefulPreparationTypes",
        label: "If you could go back to the weeks before you entered MBBS, which kind of preparation would you genuinely have found useful?",
        instruction: "Choose up to 5.",
        required: true,
        type: "multiple",
        maxSelections: 5,
        options: Q8_PREPARATION_OPTIONS,
      },
      {
        number: "Q9",
        key: "q9BestTiming",
        label: "Looking back, when would this preparation have helped you most?",
        instruction: "Select one option.",
        required: true,
        type: "single",
        options: Q9_TIMING_OPTIONS,
      },
    ],
  },
  {
    sectionNumber: 7,
    key: "one_thing_wish_told",
    title: "One Thing You Wish Someone Had Told You",
    subtitle: "A personal word of wisdom for incoming students",
    description: "Complete the sentence in your own words.",
    questions: [
      {
        number: "Q10",
        key: "q10WishSomeoneTold",
        label: "Complete this sentence: “Before I started MBBS, I wish someone had told me that...”",
        instruction: "It can be serious, practical, surprising, funny—or something you learned the hard way.",
        required: true,
        type: "textarea",
        placeholder: "Before I started MBBS, I wish someone had told me that...",
        charLimit: 2000,
      },
    ],
  },
];

// Post-Submission Thank You and Pass It Forward Screen Copy
export const STUDENT_POST_SUBMIT_CONFIG = {
  thankYou: {
    badge: "RESPONSE RECORDED",
    headline: "Your experience can make someone else's first few months of MBBS easier.",
    body: [
      "Thank you for telling us what medical college was actually like for you.",
      "Your experience will be considered alongside the perspectives of other medical students, interns, faculty and clinicians to help identify what students need when making the transition into MBBS.",
      "And what you just shared may help the next batch begin that journey better prepared.",
    ],
    quoteReflectionNote: "And your answer to: ‘Before I started MBBS, I wish someone had told me that...’ may become one of the most valuable messages we can pass on to the next batch of medical students.",
  },
  passItForward: {
    badge: "PASS IT FORWARD",
    headline: "You know what it feels like to enter MBBS without knowing what lies ahead.",
    subheadline: "Now you can make it easier for someone who comes after you.",
    body: [
      "MBBS Foundation is bringing together students, interns, faculty and clinicians to help future medical students begin their journey with greater clarity, confidence and practical preparedness.",
      "Your experience matters.",
      "You don't need to be an expert. What you learned by actually going through MBBS is precisely what an incoming student doesn't yet know.",
    ],
    prominentLine: "Be the senior you wish you had when you started MBBS.",
    ctaLabel: "I'D LIKE TO CONTRIBUTE",
  },
  contributorForm: {
    heading: "How would you like to contribute?",
    subheading: "Select all that apply:",
    options: POST_SUBMISSION_CONTRIBUTION_OPTIONS,
    nameLabel: "Your Name",
    namePlaceholder: "e.g., Ayush Sharma",
    contactHeading: "Contact Details (Provide at least one)",
    emailLabel: "Email Address",
    emailPlaceholder: "student@medical.edu",
    mobileLabel: "Mobile / WhatsApp Number",
    mobilePlaceholder: "9876543210",
    consentText: "I agree to be contacted regarding Student Voice / MBBS Foundation contribution opportunities.",
    submitCta: "JOIN THE MBBS FOUNDATION INITIATIVE",
    successMessage: "Thank you for joining the MBBS Foundation initiative! We will reach out with relevant student contributor and near-peer opportunities.",
  },
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
      if (q.instruction) {
        lines.push(`   Instruction: ${q.instruction}`);
      }
      if (q.charLimit) {
        lines.push(`   Character Limit: ${q.charLimit}`);
      }

      if (q.type === "matrix") {
        lines.push("   Rating Scale: " + Q6_RATING_SCALE.join(" | "));
        lines.push("   8 Statements:");
        Q6_STATEMENTS.forEach((s) => {
          lines.push(`     [${s.code}] ${s.label}`);
        });
      } else if (q.options && Array.isArray(q.options)) {
        lines.push("   Options:");
        q.options.forEach((opt: string) => {
          lines.push(`     - ${opt}`);
        });
      }

      if (q.key === "q10WishSomeoneTold") {
        lines.push("   Optional Permission Checkbox:");
        lines.push("   [ ] I am comfortable with this response being quoted anonymously in MBBS Foundation educational or awareness material.");
      }

      lines.push("");
    });

    lines.push("--------------------------------------------------------------------------------\n");
  });

  lines.push("--- SUBMISSION BUTTON ---");
  lines.push("SUBMIT MY STUDENT VOICE\n");

  lines.push("--- POST-SUBMISSION THANK YOU & PASS IT FORWARD ---");
  lines.push(`Headline: ${STUDENT_POST_SUBMIT_CONFIG.thankYou.headline}`);
  STUDENT_POST_SUBMIT_CONFIG.thankYou.body.forEach((b) => lines.push(b));
  lines.push(`Quote Note: ${STUDENT_POST_SUBMIT_CONFIG.thankYou.quoteReflectionNote}`);
  lines.push("");
  lines.push(`Pass It Forward Headline: ${STUDENT_POST_SUBMIT_CONFIG.passItForward.headline}`);
  lines.push(`Pass It Forward Subheadline: ${STUDENT_POST_SUBMIT_CONFIG.passItForward.subheadline}`);
  STUDENT_POST_SUBMIT_CONFIG.passItForward.body.forEach((b) => lines.push(b));
  lines.push(`Prominent Line: ${STUDENT_POST_SUBMIT_CONFIG.passItForward.prominentLine}`);
  lines.push(`CTA: ${STUDENT_POST_SUBMIT_CONFIG.passItForward.ctaLabel}`);
  lines.push("");
  lines.push("--- OPTIONAL CONTRIBUTOR FORM ---");
  lines.push("Options:");
  POST_SUBMISSION_CONTRIBUTION_OPTIONS.forEach((o) => lines.push(`  - ${o}`));
  lines.push("Fields: Name, Email OR Mobile / WhatsApp, Consent Checkbox");
  lines.push(`CTA: ${STUDENT_POST_SUBMIT_CONFIG.contributorForm.submitCta}`);
  lines.push("================================================================================");

  return lines.join("\n");
}
