/**
 * MBBS Foundation — Professional Consultation Survey (Survey 1)
 * Configuration & Human-Readable Content Source
 *
 * This file is the SINGLE SOURCE OF TRUTH for all human-readable wording:
 * - Survey titles, subtitles, version
 * - Introduction texts (Faculty, CPR Network, Direct)
 * - Section titles, introductions, and instructions
 * - Questions Q1 through Q28 (labels, help text, options, selection rules)
 * - 14 Clinical Transition Readiness Domains (A through N)
 * - Branching logic explanations, privacy notices, and success text
 *
 * STABLE INTERNAL KEYS:
 * Persistent field names (e.g. `roles`, `specialty`, `wishTaughtAtEntry`,
 * `foundationCourseEffectiveness`) remain stable for database/API contracts,
 * while display labels and explanatory wording can be safely edited here.
 */

export const SURVEY_METADATA = {
  id: "survey_1_professional",
  version: "v1",
  statusBadge: "SURVEY 1 V1 — STRUCTURALLY STABLE / CONTENT EDITABLE",
  title: "MBBS Foundation — Professional Consultation Survey",
  subtitle: "National Consultation on Clinical Preparedness & The MBBS Foundation Workshop",
  organization: "AHA India Medical Education Initiative",
  estimatedTime: "8–12 minutes",
};

// -------------------------------------------------------------
// INTRODUCTORY TEXT VARIANTS
// -------------------------------------------------------------

export const SURVEY_INTRODUCTIONS = {
  faculty: {
    badge: "Medical Faculty Consultation",
    heading: "Consultation on Clinical Preparedness for Medical Faculty & Clinicians",
    lead: "Dear Colleague,",
    paragraphs: [
      "We invite you to participate in this national consultation on the preparedness of MBBS students as they transition from preclinical studies to clinical exposure.",
      "Your clinical and academic observations will directly shape the curriculum, workshop modules, and practical guidance resources of the MBBS Foundation Workshop — an initiative designed to bridge foundational gaps before students enter hospital wards.",
      "The survey takes approximately 8–12 minutes. You may respond anonymously or provide contact details if you would like to be acknowledged or collaborate as a contributor.",
    ],
  },
  cpr: {
    badge: "CPR Educator & Leader Consultation",
    heading: "Extending Your Contribution: From Lifesaving Skills to Building Future Doctors",
    lead: "Dear Colleague / CPR Educator,",
    paragraphs: [
      "You have already contributed to lifesaving education through CPR training and awareness. MBBS Foundation now invites you to extend that contribution into the broader preparation and development of future doctors.",
      "This national professional consultation is helping identify the gaps students face while entering MBBS and shape a practical MBBS Foundation Workshop that complements formal medical education.",
      "Your experience as a Course Coordinator, CPR Champion, instructor, clinician or educator can help define what future doctors need most — and how experienced professionals can contribute.",
      "The consultation takes approximately 8–12 minutes. You may respond anonymously or provide contact details if you wish to collaborate as a contributor, faculty member, coordinator, collaborator or advocate.",
    ],
  },
  direct: {
    badge: "National Medical Educator Consultation",
    heading: "National Consultation on Clinical Preparedness & The MBBS Foundation Workshop",
    lead: "Dear Colleague,",
    paragraphs: [
      "The transition from classroom learning to hospital wards is one of the most demanding phases in medical training. While students acquire substantial theoretical knowledge, faculty often observe noticeable gaps in practical preparedness, ward etiquette, patient communication, and coping with clinical responsibility.",
      "This national consultation gathers collective wisdom from medical college faculty, clinicians, and medical educators across India to refine the curriculum of the MBBS Foundation Workshop.",
      "Your insights will directly influence educational modules, clinical scenarios, and transition guidance for incoming batches. The survey takes 8–12 minutes.",
    ],
  },
};

// -------------------------------------------------------------
// 14 CLINICAL TRANSITION READINESS DOMAINS (Q7 & Q9)
// -------------------------------------------------------------

export interface ReadinessDomainConfig {
  id: string;
  code: string;
  label: string;
  category?: string;
}

export const READINESS_DOMAINS_CONFIG: ReadinessDomainConfig[] = [
  {
    id: "domain_a",
    code: "A",
    label: "Transition from examination-oriented learning to understanding and applying medical knowledge",
    category: "Learning & Academics",
  },
  {
    id: "domain_b",
    code: "B",
    label: "Self-directed learning, study skills and taking responsibility for their own learning",
    category: "Learning & Academics",
  },
  {
    id: "domain_c",
    code: "C",
    label: "Understanding their evolving role, responsibilities and identity as a future doctor",
    category: "Professional Identity",
  },
  {
    id: "domain_d",
    code: "D",
    label: "Communicating appropriately and respectfully with patients and families",
    category: "Communication",
  },
  {
    id: "domain_e",
    code: "E",
    label: "Professional behaviour, ethics, confidentiality and appropriate boundaries",
    category: "Ethics & Professionalism",
  },
  {
    id: "domain_f",
    code: "F",
    label: "Approaching patients with empathy, dignity and respect",
    category: "Communication & Ethics",
  },
  {
    id: "domain_g",
    code: "G",
    label: "Basic clinical orientation — understanding the clinical environment, ward etiquette and how to behave during patient encounters",
    category: "Clinical Skills & Etiquette",
  },
  {
    id: "domain_h",
    code: "H",
    label: "Taking an appropriate introductory history and interacting with patients under supervision",
    category: "Clinical Skills",
  },
  {
    id: "domain_i",
    code: "I",
    label: "Working effectively with peers, seniors, nurses and other members of the healthcare team",
    category: "Teamwork & Systems",
  },
  {
    id: "domain_j",
    code: "J",
    label: "CPR, first aid and basic lifesaving preparedness",
    category: "Emergency Skills",
  },
  {
    id: "domain_k",
    code: "K",
    label: "Understanding the healthcare system and the different settings in which medical care is delivered",
    category: "Healthcare Systems",
  },
  {
    id: "domain_l",
    code: "L",
    label: "Awareness of basic medicolegal responsibilities and safe professional behaviour",
    category: "Ethics & Legal",
  },
  {
    id: "domain_m",
    code: "M",
    label: "Coping with stress, uncertainty, mistakes, feedback, competition and setbacks",
    category: "Resilience & Wellbeing",
  },
  {
    id: "domain_n",
    code: "N",
    label: "Digital professionalism, responsible social-media behaviour and appropriate use of AI/digital resources in medical learning",
    category: "Digital Professionalism",
  },
];

export const READINESS_RATING_SCALE = [
  "Well prepared",
  "Reasonably prepared",
  "Some preparation, but important gaps remain",
  "Poorly prepared",
  "Not prepared at all",
  "Unable to comment",
] as const;

// -------------------------------------------------------------
// SECTION & QUESTION DEFINITIONS (Q1 through Q28)
// -------------------------------------------------------------

export const SURVEY_SECTIONS_CONFIG = [
  {
    sectionNumber: 1,
    key: "about_you",
    title: "About You",
    subtitle: "Professional background and context",
    description: "Please share your current academic or clinical role to help us contextualize your perspective.",
    questions: [
      {
        number: "Q1",
        key: "roles",
        label: "Which of the following best describe your professional role(s)?",
        helpText: "Select all that apply to your current work.",
        required: true,
        multiple: true,
        options: [
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
        ],
      },
      {
        number: "Q2",
        key: "specialty",
        label: "What is your broad specialty or department?",
        helpText: "Select the primary specialty that best reflects your discipline.",
        required: true,
        multiple: false,
        options: [
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
        ],
      },
      {
        number: "Q3",
        key: "teachingExperience",
        label: "How long have you been involved in teaching medical students or clinical training?",
        helpText: "Select your total approximate teaching or mentoring experience.",
        required: true,
        multiple: false,
        options: [
          "Less than 5 years",
          "5–10 years",
          "11–20 years",
          "More than 20 years",
          "Primarily clinical/training role rather than formal teaching",
        ],
      },
      {
        number: "Q4",
        key: "institutionName",
        label: "Name of Medical College / Hospital / Institution",
        helpText: "Optional: Helps understand institutional diversity across states.",
        required: false,
        type: "text",
        placeholder: "e.g., All India Institute of Medical Sciences, New Delhi",
      },
      {
        number: "Q5",
        key: "city",
        label: "City / Town",
        helpText: "Optional",
        required: false,
        type: "text",
        placeholder: "e.g., Mumbai, Bengaluru, Lucknow",
      },
      {
        number: "Q6",
        key: "state",
        label: "State / Union Territory",
        helpText: "Please select the State or UT of your institution.",
        required: true,
        type: "select",
        options: [
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
        ],
      },
    ],
  },
  {
    sectionNumber: 2,
    key: "readiness_for_clinical_exposure",
    title: "Readiness for Clinical Exposure",
    subtitle: "Evaluating student preparedness across key transition domains",
    description: "In your experience, when students begin clinical exposure, how well prepared are they across these 14 key domains?",
    questions: [
      {
        number: "Q7",
        key: "readinessRatings",
        label: "Rate student preparedness across all 14 clinical transition domains:",
        helpText: "Rate each domain on a 5-point scale from Well prepared to Not prepared at all (or Unable to comment).",
        required: true,
        type: "matrix",
        domains: READINESS_DOMAINS_CONFIG,
        ratingScale: READINESS_RATING_SCALE,
      },
      {
        number: "Q8",
        key: "q8OrientationEffectiveness",
        label: "Overall, how effectively do you feel current orientation / foundation programmes prepare students for the realities of clinical learning?",
        helpText: "Select the option that best reflects your overall observation.",
        required: true,
        multiple: false,
        options: [
          "Very effectively — students are generally well prepared",
          "Effectively in most important areas",
          "Partly effective — benefits are visible, but important gaps remain",
          "Variable — effectiveness differs considerably between areas, batches or institutions",
          "Limited effectiveness in preparing students for actual clinical exposure",
          "Unable to comment",
        ],
      },
      {
        number: "Q9",
        key: "q9EmphasisAreas",
        label: "Which 3 to 5 areas from the list above require the greatest emphasis before students begin hospital postings?",
        helpText: "Select up to 5 domains that you feel are most critical.",
        required: true,
        multiple: true,
        maxSelections: 5,
        optionsFromDomains: true,
      },
      {
        number: "Q10",
        key: "q10OneChangeSuggestion",
        label: "If you could change or improve ONE aspect of how students are prepared before entering the clinical environment, what would it be?",
        helpText: "Please share a brief reflection or recommendation.",
        required: false,
        type: "textarea",
        placeholder: "Your observation or suggestion...",
      },
      {
        number: "Q11",
        key: "q11NeedForComplementaryResource",
        label: "Do you believe there is a need for a practical, longitudinal guide or handbook that students can refer to throughout their transition into clinical training?",
        helpText: "Select one option.",
        required: false,
        multiple: false,
        options: [
          "Yes, definitely",
          "Probably yes",
          "Unsure",
          "Probably not",
          "No",
        ],
      },
      {
        number: "Q12",
        key: "q12MakeResourceUseful",
        label: "What would make such a guide genuinely useful to students rather than just another book?",
        helpText: "e.g., real-life scenarios, practical tips, concise format, student voices, checklists.",
        required: false,
        type: "textarea",
        placeholder: "Your thoughts on format, content or style...",
      },
    ],
  },
  {
    sectionNumber: 3,
    key: "looking_back",
    title: "Looking Back",
    subtitle: "Reflections from your own transition into medical training",
    description: "Looking back at your own journey and the generations of students you have mentored.",
    questions: [
      {
        number: "Q13",
        key: "q13WishTaughtAtBeginning",
        label: "Thinking back to your own entry into medical college or your early clinical postings, what is one thing you wish someone had explained or taught you at the very beginning?",
        helpText: "This personal insight is often the most valuable for incoming students.",
        required: true,
        type: "textarea",
        placeholder: "What you wish you had known earlier...",
      },
      {
        number: "Q14",
        key: "q14ChallengeApparentLater",
        label: "What is one challenge that students often do not realize they will face until they are already in the middle of their MBBS course?",
        helpText: "e.g., burnout, managing feedback, study strategy shifts, interpersonal dynamics.",
        required: false,
        type: "textarea",
        placeholder: "A challenge that appears later in the MBBS journey...",
      },
    ],
  },
  {
    sectionNumber: 4,
    key: "foundation_course_and_ece",
    title: "Foundation Course & Early Clinical Exposure",
    subtitle: "Current institutional implementation and structural limitations",
    description: "NMC CBME guidelines introduced the Foundation Course and Early Clinical Exposure (ECE). We welcome your candid observations.",
    questions: [
      {
        number: "Q15",
        key: "q15FoundationCourseDescription",
        label: "How would you describe the implementation of the Foundation Course in your institution or experience?",
        helpText: "Select the option that best characterizes current reality.",
        required: false,
        multiple: false,
        options: [
          "Comprehensive and highly effective",
          "Covers most important areas",
          "Useful but variable in implementation",
          "Several important gaps remain",
          "Often treated more as a formal requirement than an engaging transition programme",
          "I do not have enough experience to comment",
        ],
      },
      {
        number: "Q16",
        key: "q16Limitations",
        label: "What are the main limitations or difficulties faced in conducting effective Foundation Courses or Early Clinical Exposure? (Choose up to 3)",
        helpText: "Select up to 3 primary practical constraints.",
        required: false,
        multiple: true,
        maxSelections: 3,
        options: [
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
        ],
      },
    ],
  },
  {
    sectionNumber: 5,
    key: "building_the_workshop",
    title: "Building the MBBS Foundation Workshop",
    subtitle: "Designing practical, interactive learning experiences",
    description: "The MBBS Foundation Workshop is being designed as an interactive, case-based orientation programme for incoming students.",
    questions: [
      {
        number: "Q17",
        key: "q17UsefulFormats",
        label: "Which learning formats do you feel would be most effective for an MBBS Foundation Workshop? (Choose up to 5)",
        helpText: "Select up to 5 formats that drive genuine engagement.",
        required: false,
        multiple: true,
        maxSelections: 5,
        options: [
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
        ],
      },
      {
        number: "Q18",
        key: "q18WorkshopShouldInclude",
        label: "If this workshop were conducted for incoming medical students, what is one topic or activity that you feel it should definitely include?",
        helpText: "Please suggest a specific exercise, topic or scenario.",
        required: false,
        type: "textarea",
        placeholder: "A topic or practical activity that should definitely be included...",
      },
    ],
  },
  {
    sectionNumber: 6,
    key: "contribution_interest",
    title: "Contribution Interest",
    subtitle: "Collaborating on curriculum design and content creation",
    description: "The MBBS Foundation initiative is being shaped through collective contribution from medical faculty across India.",
    questions: [
      {
        number: "Q19",
        key: "q19InterestedInContributing",
        label: "Would you be interested in contributing to the MBBS Foundation initiative as an author, reviewer, scenario contributor or workshop facilitator?",
        helpText: "Selecting Yes opens optional contribution preference questions below.",
        required: true,
        multiple: false,
        options: [
          "Yes, I would be interested",
          "Possibly — depending on topic and time commitment",
          "I would first like to know more",
          "Not at present",
        ],
      },
      {
        number: "Q20",
        key: "q20ContributionTypes",
        label: "How would you be most interested in contributing? (Select all that apply)",
        helpText: "Shown when interested in contributing (Q19).",
        conditionalOn: "q19",
        required: false,
        multiple: true,
        options: [
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
        ],
      },
      {
        number: "Q21",
        key: "q21PersonalTopicInterest",
        label: "Is there a specific topic, domain or area where you would particularly like to contribute?",
        helpText: "Optional: e.g., communication skills, stress management, CPR, ethics, study methods.",
        conditionalOn: "q19",
        required: false,
        type: "textarea",
        placeholder: "Specific topic or area of interest...",
      },
      {
        number: "Q22",
        key: "q22TimeCommitment",
        label: "What level of initial involvement would suit you best?",
        helpText: "Select one option.",
        conditionalOn: "q19",
        required: false,
        multiple: false,
        options: [
          "One small contribution of 15–30 minutes",
          "Around 1 hour",
          "A few hours over several weeks",
          "I could contribute periodically",
          "I may be interested in a larger/ongoing role",
          "Not sure yet",
        ],
      },
    ],
  },
  {
    sectionNumber: 7,
    key: "help_us_hear_from_students",
    title: "Help Us Hear From Students",
    subtitle: "Bridging faculty perspectives with student voices",
    description: "In parallel with this faculty consultation, we are preparing the 'MBBS Entry Readiness Check' for incoming and 1st year students.",
    questions: [
      {
        number: "Q23",
        key: "q23ConnectedWithNewStudents",
        label: "Are you in regular contact with newly admitted or first-year medical students?",
        helpText: "Select one option.",
        required: false,
        multiple: false,
        options: [
          "Yes — directly",
          "Yes — indirectly",
          "Possibly",
          "Not currently",
        ],
      },
      {
        number: "Q24",
        key: "q24WillingToShareReadiness",
        label: "Would you be willing to share the brief, anonymous student readiness survey link with incoming students when it becomes available?",
        helpText: "This helps capture direct student perspectives nationwide.",
        required: true,
        multiple: false,
        options: [
          "Yes",
          "Possibly",
          "Please send me more information",
          "Not currently",
        ],
      },
    ],
  },
  {
    sectionNumber: 8,
    key: "stay_connected",
    title: "Stay Connected",
    subtitle: "Contact details and follow-up consent (Optional)",
    description: "You may complete this survey anonymously. If you would like to receive the summary findings or contribute, please provide your contact details.",
    questions: [
      {
        number: "Q25",
        key: "respondentName",
        label: "Full Name & Academic Title",
        helpText: "Optional — e.g., Dr. Rajesh Sharma, Professor",
        required: false,
        type: "text",
        placeholder: "e.g., Dr. Rajesh Sharma",
      },
      {
        number: "Q26",
        key: "email",
        label: "Email Address",
        helpText: "Optional — Used to send the consultation summary report.",
        required: false,
        type: "email",
        placeholder: "e.g., rajesh.sharma@institution.edu.in",
      },
      {
        number: "Q27",
        key: "mobileWhatsapp",
        label: "Mobile / WhatsApp Number",
        helpText: "Optional — For academic communication regarding the workshop.",
        required: false,
        type: "tel",
        placeholder: "e.g., 9876543210",
      },
      {
        number: "Q28",
        key: "q28ConsentForContact",
        label: "May we contact you with the consultation summary, contributor updates, or the student readiness check link?",
        helpText: "Your contact details will remain strictly confidential and will never be shared with third parties.",
        required: true,
        multiple: false,
        options: [
          "Yes",
          "No",
        ],
      },
    ],
  },
];

// -------------------------------------------------------------
// POST-SUBMISSION THANK YOU SCREEN CONFIGURATION
// -------------------------------------------------------------

export const SUCCESS_SCREEN_CONFIG = {
  badge: "Consultation Response Submitted",
  heading: "Thank You for Contributing to Medical Education",
  leadMessage: "Your insights and clinical reflections have been securely recorded.",
  summaryNote: "The collective findings from this national consultation will directly shape the curriculum, clinical case scenarios, and transition modules of the MBBS Foundation Workshop.",
  contributorFollowupNote: "Thank you for offering to contribute to this national initiative. Our academic coordination team will reach out with specific module themes and editorial outlines.",
  initiativeCard: {
    title: "About the MBBS Foundation Initiative",
    description: "The MBBS Foundation is an academic initiative dedicated to supporting medical students during their critical transition into clinical training. Designed in consultation with medical college faculty and healthcare professionals across India, it provides practical, evidence-informed orientation in clinical communication, professional ethics, lifesaving skills, and ward preparedness.",
  },
  readinessNotice: "The student readiness assessment is currently being finalized. The link will be shared with participating institutions shortly.",
};

// -------------------------------------------------------------
// PLAIN TEXT SURVEY COMPILATION GENERATOR
// Used by Admin Dashboard to copy full survey text for review/ChatGPT
// -------------------------------------------------------------

export function generateSurveyPlainText(): string {
  const lines: string[] = [];

  lines.push("================================================================================");
  lines.push(`${SURVEY_METADATA.title.toUpperCase()}`);
  lines.push(`Version: ${SURVEY_METADATA.version}`);
  lines.push(`Status: ${SURVEY_METADATA.statusBadge}`);
  lines.push(`Organization: ${SURVEY_METADATA.organization}`);
  lines.push(`Subtitle: ${SURVEY_METADATA.subtitle}`);
  lines.push(`Estimated Time: ${SURVEY_METADATA.estimatedTime}`);
  lines.push("================================================================================\n");

  // Introductions
  lines.push("--- INTRODUCTION VARIANTS ---\n");
  lines.push("1. FACULTY VERSION INTRODUCTION:");
  lines.push(`Heading: ${SURVEY_INTRODUCTIONS.faculty.heading}`);
  lines.push(SURVEY_INTRODUCTIONS.faculty.lead);
  SURVEY_INTRODUCTIONS.faculty.paragraphs.forEach((p) => lines.push(p));
  lines.push("");

  lines.push("2. CPR NETWORK VERSION INTRODUCTION:");
  lines.push(`Heading: ${SURVEY_INTRODUCTIONS.cpr.heading}`);
  lines.push(SURVEY_INTRODUCTIONS.cpr.lead);
  SURVEY_INTRODUCTIONS.cpr.paragraphs.forEach((p) => lines.push(p));
  lines.push("");

  lines.push("3. DIRECT / GENERAL INTRODUCTION:");
  lines.push(`Heading: ${SURVEY_INTRODUCTIONS.direct.heading}`);
  lines.push(SURVEY_INTRODUCTIONS.direct.lead);
  SURVEY_INTRODUCTIONS.direct.paragraphs.forEach((p) => lines.push(p));
  lines.push("\n================================================================================\n");

  // Sections and Questions
  SURVEY_SECTIONS_CONFIG.forEach((sec) => {
    lines.push(`SECTION ${sec.sectionNumber} — ${sec.title.toUpperCase()}`);
    lines.push(`Subtitle: ${sec.subtitle}`);
    lines.push(`Description: ${sec.description}\n`);

    sec.questions.forEach((q: any) => {
      lines.push(`${q.number}. ${q.label}`);
      lines.push(`   Internal Key: ${q.key}`);
      lines.push(`   Required: ${q.required ? "Yes" : "Optional"}`);
      if (q.multiple) {
        lines.push(`   Type: Multiple selection${q.maxSelections ? ` (Choose up to ${q.maxSelections})` : ""}`);
      } else if (q.type) {
        lines.push(`   Type: ${q.type}`);
      } else {
        lines.push("   Type: Single choice");
      }

      if (q.helpText) {
        lines.push(`   Guidance: ${q.helpText}`);
      }

      if (q.conditionalOn) {
        lines.push(`   Condition: Displayed only if respondent expresses interest in Q19.`);
      }

      if (q.type === "matrix") {
        lines.push("   Rating Scale: " + READINESS_RATING_SCALE.join(" | "));
        lines.push("   14 Evaluation Domains:");
        READINESS_DOMAINS_CONFIG.forEach((d) => {
          lines.push(`     [${d.code}] ${d.label}`);
        });
      } else if (q.optionsFromDomains) {
        lines.push("   Options (14 Readiness Domains):");
        READINESS_DOMAINS_CONFIG.forEach((d) => {
          lines.push(`     - [${d.code}] ${d.label}`);
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

  // Post Submission Text
  lines.push("--- POST-SUBMISSION CONFIRMATION MESSAGE ---");
  lines.push(`Heading: ${SUCCESS_SCREEN_CONFIG.heading}`);
  lines.push(`Lead: ${SUCCESS_SCREEN_CONFIG.leadMessage}`);
  lines.push(`Summary Note: ${SUCCESS_SCREEN_CONFIG.summaryNote}`);
  lines.push(`Contributor Note: ${SUCCESS_SCREEN_CONFIG.contributorFollowupNote}`);
  lines.push(`Initiative Summary: ${SUCCESS_SCREEN_CONFIG.initiativeCard.description}`);
  lines.push("================================================================================");

  return lines.join("\n");
}
