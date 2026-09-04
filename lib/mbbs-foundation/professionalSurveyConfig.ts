/**
 * MBBS Foundation — Professional Consultation Survey (Survey 1)
 * Configuration & Human-Readable Content Source — Version 2 (Locked)
 *
 * This file is the SINGLE SOURCE OF TRUTH for all human-readable wording:
 * - Survey titles, subtitles, version (V2)
 * - Introduction texts (Faculty, CPR Network, Direct)
 * - 7 Section titles, subtitles, and instructions
 * - Questions Q1 through Q12 + Section 7 Contact & Consent
 * - 14 Clinical Transition Readiness Domains (exact display order 1 to 14 with persistent internal keys)
 * - Conditional branching logic (Q12 conditioned on Q11), privacy notices, and success text
 *
 * STABLE INTERNAL KEYS:
 * Persistent field names (e.g. `roles`, `specialty`, `teachingExperience`, `institutionName`,
 * `state`, `readinessRatings`, `q9EmphasisAreas`, `q15FoundationCourseDescription`,
 * `q16Limitations`, `q13WishTaughtAtBeginning`, `q17UsefulFormats`, `q19InterestedInContributing`,
 * `q20ContributionTypes`, `q21PersonalTopicInterest`, `respondentName`, `email`, `mobileWhatsapp`,
 * `q28ConsentForContact`) remain strictly backward-compatible for PostgreSQL persistence and admin analysis.
 */

export const SURVEY_METADATA = {
  id: "survey_1_professional",
  version: "v2",
  statusBadge: "PROFESSIONAL CONSULTATION V2 — LOCKED",
  title: "MBBS FOUNDATION — National Professional Consultation",
  subtitle: "Preparing Students for the Transition into MBBS and Medical Training",
  organization: "Ayurvigyan Health Academy India Foundation (AHA India)",
  estimatedTime: "5–7 minutes",
};

// -------------------------------------------------------------
// INTRODUCTORY TEXT VARIANTS
// -------------------------------------------------------------

export const SURVEY_INTRODUCTIONS = {
  faculty: {
    badge: "Medical Faculty & Clinicians Consultation",
    heading: "Consultation on Clinical Preparedness for Medical Faculty & Clinicians",
    lead: "Dear Colleague,",
    paragraphs: [
      "Entering medical college is a major transition. Students move from an examination-oriented learning environment into a demanding professional course that requires new ways of learning, communicating, behaving, coping and taking responsibility.",
      "The MBBS Foundation initiative aims to understand these transition gaps and develop practical, interactive guidance and workshops that complement the formal medical curriculum and existing Foundation Course.",
      "We invite medical faculty, clinicians, medical educators and professionals involved in student training to share their experience and priorities.",
      "Your responses will help shape the MBBS Foundation Workshop and identify opportunities for experienced professionals to contribute to the preparation of future doctors.",
    ],
    note: "Estimated time: 5–7 minutes. Your responses will be used for analysis of professional perspectives on MBBS preparedness. Basic professional and contact details will also help us understand the diversity of respondents and connect with those interested in contributing further.",
  },
  cpr: {
    badge: "CPR Course Coordinators, Champions & Instructors",
    heading: "Extending Your Contribution: From Lifesaving Skills to Building Future Doctors",
    lead: "Dear Colleague / CPR Educator,",
    paragraphs: [
      "You have already contributed to lifesaving education through CPR training and awareness. MBBS Foundation now invites you to extend that contribution into the broader preparation and development of future doctors.",
      "This national professional consultation is helping identify the gaps students face while entering MBBS and shape a practical MBBS Foundation Workshop that complements formal medical education.",
      "Your experience as a Course Coordinator, CPR Champion, instructor, clinician or educator can help define what future doctors need most — and how experienced professionals can contribute.",
      "Your responses will help shape the MBBS Foundation Workshop and identify opportunities for experienced professionals to contribute to the preparation of future doctors.",
    ],
    note: "Estimated time: 5–7 minutes. Your responses will be used for analysis of professional perspectives on MBBS preparedness. Basic professional and contact details will also help us understand the diversity of respondents and connect with those interested in contributing further.",
  },
  direct: {
    badge: "National Professional Consultation",
    heading: "Preparing Students for the Transition into MBBS and Medical Training",
    lead: "Dear Colleague,",
    paragraphs: [
      "Entering medical college is a major transition. Students move from an examination-oriented learning environment into a demanding professional course that requires new ways of learning, communicating, behaving, coping and taking responsibility.",
      "The MBBS Foundation initiative aims to understand these transition gaps and develop practical, interactive guidance and workshops that complement the formal medical curriculum and existing Foundation Course.",
      "We invite medical faculty, clinicians, medical educators and professionals involved in student training to share their experience and priorities.",
      "Your responses will help shape the MBBS Foundation Workshop and identify opportunities for experienced professionals to contribute to the preparation of future doctors.",
    ],
    note: "Estimated time: 5–7 minutes. Your responses will be used for analysis of professional perspectives on MBBS preparedness. Basic professional and contact details will also help us understand the diversity of respondents and connect with those interested in contributing further.",
  },
};

// -------------------------------------------------------------
// 14 CLINICAL TRANSITION READINESS DOMAINS (Q5 & Q6 V2 LOCKED)
// Display order: 1 to 14. Underlying database keys remain domain_a ... domain_n.
// -------------------------------------------------------------

export interface ReadinessDomainConfig {
  id: string;
  code: string;
  internalCode: string;
  title: string;
  label: string;
  description: string;
  category?: string;
}

export const READINESS_DOMAINS_CONFIG: ReadinessDomainConfig[] = [
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

export const READINESS_RATING_SCALE = [
  "Well prepared",
  "Reasonably prepared",
  "Some preparation, but important gaps remain",
  "Poorly prepared",
  "Not prepared at all",
  "Unable to comment",
] as const;

// -------------------------------------------------------------
// EXACT 7 SECTIONS CONFIGURATION (V2 LOCKED)
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
        helpText: "Select all that apply.",
        required: true,
        multiple: true,
        options: [
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
        ],
      },
      {
        number: "Q2",
        key: "specialty",
        label: "What is your broad specialty or department?",
        helpText: "Select one primary specialty.",
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
          "Medical Education",
          "Administration",
          "Other clinical specialty",
          "Other pre/paraclinical specialty",
          "Other",
        ],
      },
      {
        number: "Q3",
        key: "teachingExperience",
        label: "How long have you been involved in teaching, mentoring or training medical students?",
        helpText: "Select one option.",
        required: true,
        multiple: false,
        options: [
          "Less than 5 years",
          "5–10 years",
          "11–20 years",
          "More than 20 years",
          "Primarily involved in clinical/skills training rather than formal teaching",
        ],
      },
      {
        number: "Q4",
        key: "stateAndInstitution",
        label: "State / Union Territory & Medical College / Institution",
        helpText: "Select your State/UT, then search or select your Medical College (or specify institution).",
        required: true,
        type: "stateAndInstitution",
      },
    ],
  },
  {
    sectionNumber: 2,
    key: "how_prepared_are_students",
    title: "How Prepared Are Students?",
    subtitle: "Evaluating student preparedness across key transition domains",
    description: "Thinking about students entering medical college and progressing through the early phase of MBBS, how well prepared do you feel they are in the following areas?",
    questions: [
      {
        number: "Q5",
        key: "readinessRatings",
        label: "In your experience, how well prepared are students across these areas?",
        helpText: "Rate each domain on a 5-point scale from Well prepared to Not prepared at all (or Unable to comment).",
        required: true,
        type: "matrix",
        domains: READINESS_DOMAINS_CONFIG,
        ratingScale: READINESS_RATING_SCALE,
      },
      {
        number: "Q6",
        key: "q9EmphasisAreas",
        label: "Which 3–5 areas above require the greatest emphasis during the transition into MBBS and early medical training?",
        helpText: "Select up to 5 domains that require the greatest emphasis.",
        required: true,
        multiple: true,
        maxSelections: 5,
        optionsFromDomains: true,
      },
    ],
  },
  {
    sectionNumber: 3,
    key: "current_foundation_course",
    title: "Current Foundation Course",
    subtitle: "Implementation and practical limitations in medical colleges",
    description: "Your observations on the current Foundation Course implementation in medical colleges.",
    questions: [
      {
        number: "Q7",
        key: "q15FoundationCourseDescription",
        label: "Based on your experience, how would you describe the implementation of the current Foundation Course in medical colleges?",
        helpText: "Select one option.",
        required: true,
        multiple: false,
        options: [
          "Comprehensive and highly effective",
          "Covers most important areas effectively",
          "Useful, but implementation is variable",
          "Useful, but several important gaps remain",
          "Often functions more as a formal requirement than an engaging transition programme",
          "I do not have enough experience to comment",
        ],
      },
      {
        number: "Q8",
        key: "q16Limitations",
        label: "What are the main limitations in delivering an effective Foundation Course?",
        helpText: "Choose up to 3 limitations.",
        required: false,
        multiple: true,
        maxSelections: 3,
        options: [
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
        ],
      },
    ],
  },
  {
    sectionNumber: 4,
    key: "your_experience_matters",
    title: "Your Experience Matters",
    subtitle: "Key wisdom and advice for incoming students",
    description: "Thinking about the students you have taught—and your own journey through medicine.",
    questions: [
      {
        number: "Q9",
        key: "q13WishTaughtAtBeginning",
        label: "Thinking about the students you have taught—and your own journey through medicine—what is ONE thing you wish every student understood or learned at the beginning of MBBS?",
        helpText: "One brief observation or recommendation is enough.",
        required: true,
        type: "textarea",
        placeholder: "One brief observation or recommendation...",
      },
    ],
  },
  {
    sectionNumber: 5,
    key: "building_the_workshop",
    title: "Building the MBBS Foundation Workshop",
    subtitle: "Designing practical, interactive learning experiences",
    description: "The MBBS Foundation Workshop is envisaged as a practical, interactive programme that complements the formal Foundation Course and helps students navigate the transition into medical education.",
    questions: [
      {
        number: "Q10",
        key: "q17UsefulFormats",
        label: "Which learning approaches would be most useful for such a workshop?",
        helpText: "Choose up to 5.",
        required: false,
        multiple: true,
        maxSelections: 5,
        options: [
          "Interactive faculty-led sessions",
          "Real-life scenarios and case discussions",
          "Small-group activities and peer interaction",
          "Practical demonstrations and skills",
          "CPR / first-aid and lifesaving workshops",
          "Reflection and guided discussion",
          "Short videos and digital learning resources",
          "Blended workshop + self-paced learning",
          "Other",
        ],
      },
    ],
  },
  {
    sectionNumber: 6,
    key: "extend_your_contribution",
    title: "Extend Your Contribution",
    subtitle: "From educating students to helping shape how future doctors begin",
    description: "The MBBS Foundation initiative is being developed through contributions from medical faculty, clinicians, educators and professionals from across India.",
    questions: [
      {
        number: "Q11",
        key: "q19InterestedInContributing",
        label: "Would you be interested in contributing to the MBBS Foundation initiative?",
        helpText: "Select one option.",
        required: true,
        multiple: false,
        options: [
          "Yes, I would be interested",
          "Possibly — depending on the topic and time required",
          "I would first like to know more",
          "Not at present",
        ],
      },
      {
        number: "Q12",
        key: "q20ContributionTypes",
        label: "How would you be interested in contributing?",
        helpText: "Select all that apply. (Shown when interested in contributing)",
        conditionalOn: "q19_interested",
        required: false,
        multiple: true,
        options: [
          "Workshop Faculty / Facilitator — facilitate MBBS Foundation sessions",
          "Content, Module or Scenario Contributor — contribute practical educational content, cases or scenarios",
          "Academic Reviewer — review educational material, modules or assessments",
          "CPR / First Aid Faculty — contribute to practical lifesaving-skills training",
          "Institutional Coordinator — help introduce or coordinate the MBBS Foundation initiative within my institution",
          "Student Mentor / Near-Peer Programme Contributor — support student transition and mentoring activities",
          "Research, Evaluation & Educational Innovation — contribute to programme evaluation, research or educational innovation",
          "Networking / Advocacy — help connect the initiative with other faculty or institutions",
          "Other",
        ],
      },
      {
        number: "Q12b",
        key: "q21PersonalTopicInterest",
        label: "Is there a particular topic or area in which you would like to contribute? (Optional)",
        helpText: "Optional: Suggest any topic, clinical scenario or domain of interest.",
        conditionalOn: "q19_interested",
        required: false,
        type: "textarea",
        placeholder: "e.g., communication skills, stress management, CPR, ethics, study methods...",
      },
    ],
  },
  {
    sectionNumber: 7,
    key: "stay_connected",
    title: "SECTION 7 — STAY CONNECTED",
    subtitle: "Contact details and communication preferences",
    description: "Your professional and contact details will help us understand the diversity of contributors and communicate with you regarding this consultation and the MBBS Foundation initiative.",
    questions: [
      {
        number: "Name & Title",
        key: "respondentName",
        label: "Name & Academic Title",
        helpText: "Required — e.g., Dr. Rajesh Sharma, Professor",
        required: true,
        type: "text",
        placeholder: "e.g., Dr. Rajesh Sharma",
      },
      {
        number: "Email",
        key: "email",
        label: "Email Address",
        helpText: "Provide at least Email OR Mobile / WhatsApp.",
        required: false,
        type: "email",
        placeholder: "e.g., rajesh.sharma@institution.edu.in",
      },
      {
        number: "Mobile / WhatsApp",
        key: "mobileWhatsapp",
        label: "Mobile / WhatsApp Number",
        helpText: "Provide at least Email OR Mobile / WhatsApp.",
        required: false,
        type: "tel",
        placeholder: "e.g., 9876543210",
      },
      {
        number: "Contact Consent",
        key: "q28ConsentForContact",
        label: "May we contact you regarding the MBBS Foundation consultation, Workshop or contribution opportunities?",
        helpText: "Your contact information will be used only for communication related to the MBBS Foundation initiative and will not be shared with third parties for marketing.",
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
// POST-SUBMISSION THANK YOU SCREEN CONFIGURATION (V2 LOCKED)
// -------------------------------------------------------------

export const SUCCESS_SCREEN_CONFIG = {
  badge: "Consultation Response Submitted",
  heading: "THANK YOU",
  leadMessage: "Thank you for contributing your experience to the MBBS Foundation initiative.",
  paragraphs: [
    "Your perspective will help us better understand the transition challenges faced by medical students and shape practical, relevant guidance for future batches.",
    "Responses from medical professionals will be considered alongside the experiences shared by current MBBS students and interns while developing the MBBS Foundation Workshop.",
    "If you expressed interest in contributing, we look forward to exploring how your experience can become part of this collaborative initiative.",
  ],
  studentVoiceBlock: {
    heading: "HELP US HEAR FROM MEDICAL STUDENTS",
    text: "The experiences of current MBBS students and interns are equally important.\n\nPlease share the brief Student Voice Survey with MBBS students and interns in your institution or professional network and help us understand what they wish they had known when they entered medical college.",
    ctaLabel: "SHARE STUDENT VOICE SURVEY",
    ctaHref: "/mbbs-foundation/consultation/student-voice",
  },
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
  lines.push(SURVEY_INTRODUCTIONS.faculty.note);
  lines.push("");

  lines.push("2. CPR NETWORK VERSION INTRODUCTION:");
  lines.push(`Heading: ${SURVEY_INTRODUCTIONS.cpr.heading}`);
  lines.push(SURVEY_INTRODUCTIONS.cpr.lead);
  SURVEY_INTRODUCTIONS.cpr.paragraphs.forEach((p) => lines.push(p));
  lines.push(SURVEY_INTRODUCTIONS.cpr.note);
  lines.push("");

  lines.push("3. DIRECT / GENERAL INTRODUCTION:");
  lines.push(`Heading: ${SURVEY_INTRODUCTIONS.direct.heading}`);
  lines.push(SURVEY_INTRODUCTIONS.direct.lead);
  SURVEY_INTRODUCTIONS.direct.paragraphs.forEach((p) => lines.push(p));
  lines.push(SURVEY_INTRODUCTIONS.direct.note);
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
        lines.push(`   Condition: Displayed only if respondent expresses interest in Q11.`);
      }

      if (q.type === "matrix") {
        lines.push("   Rating Scale: " + READINESS_RATING_SCALE.join(" | "));
        lines.push("   14 Evaluation Domains (Locked Display Order 1 to 14):");
        READINESS_DOMAINS_CONFIG.forEach((d) => {
          lines.push(`     [${d.code}] ${d.title} (Internal: ${d.id}) — ${d.description}`);
        });
      } else if (q.optionsFromDomains) {
        lines.push("   Options (14 Readiness Domains in exact display order):");
        READINESS_DOMAINS_CONFIG.forEach((d) => {
          lines.push(`     - [${d.code}] ${d.title} (Internal: ${d.id})`);
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
  SUCCESS_SCREEN_CONFIG.paragraphs.forEach((p) => lines.push(p));
  lines.push("");
  lines.push(`Action Block: ${SUCCESS_SCREEN_CONFIG.studentVoiceBlock.heading}`);
  lines.push(SUCCESS_SCREEN_CONFIG.studentVoiceBlock.text);
  lines.push(`CTA: ${SUCCESS_SCREEN_CONFIG.studentVoiceBlock.ctaLabel}`);
  lines.push("================================================================================");

  return lines.join("\n");
}
