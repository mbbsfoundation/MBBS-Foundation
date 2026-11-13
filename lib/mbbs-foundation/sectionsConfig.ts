/**
 * MBBS Foundation Online Learning Programme
 * Centralized Section & Module Configuration
 *
 * Source: "MBBS Foundation: Your First Book of Medicine" by Dr. Lokesh Tiwari
 * Structure: 1 Introductory Orientation (Threshold) + 14 Independently Assessed Modules
 */

export type ModuleStatus = "orientation" | "pilot" | "coming_soon";

export interface SectionConfig {
  id: number; // 0 for Threshold, 1-14 for assessed modules
  bookSectionNumber: number; // 1-15 matching book table of contents
  title: string;
  slug: string;
  subtitle: string;
  image: string;
  isOrientation: boolean;
  isAssessed: boolean;
  status: ModuleStatus;
  badgeLabel: string;
  description: string;
  learningHighlights: string[];
  theme: {
    bg: string;
    border: string;
    badgeBg: string;
    badgeText: string;
    accent: string;
    text: string;
  };
}

export const PROGRAMME_METADATA = {
  title: "MBBS Foundation Online Learning Programme",
  bookTitle: "MBBS Foundation: Your First Book of Medicine",
  author: "Dr. Lokesh Tiwari",
  organization: "Ayurvigyan Health Academy India Foundation",
  passingThresholdPct: 70,
  totalAssessedModules: 14,
  questionsPerAttempt: 20,
  permittedAttempts: "Unlimited",
  pilotModuleSlug: "revive",
  learningPathway: [
    {
      step: 1,
      title: "Presentation Slides",
      shortTitle: "Slides",
      description: "Interactive browser-compatible presentation viewer with slide navigation.",
      icon: "🖥️",
    },
    {
      step: 2,
      title: "Educational Videos",
      shortTitle: "Videos",
      description: "Focused clinical and concept videos with playback tracking.",
      icon: "🎥",
    },
    {
      step: 3,
      title: "Structured Reading",
      shortTitle: "Reading",
      description: "Core text excerpts, algorithms, book chapter references, and key points.",
      icon: "📖",
    },
    {
      step: 4,
      title: "MCQ Assessment",
      shortTitle: "Assessment",
      description: "Scenario-based multiple-choice evaluation with 70% passing threshold.",
      icon: "✍️",
    },
    {
      step: 5,
      title: "Verifiable Certificate",
      shortTitle: "Certificate",
      description: "Individual module certificate with unique identifier and public verification.",
      icon: "🎓",
    },
  ],
};

export const SECTIONS_CONFIG: SectionConfig[] = [
  // --------------------------------------------------------------------------
  // INTRODUCTORY ORIENTATION (NOT ASSESSED)
  // --------------------------------------------------------------------------
  {
    id: 0,
    bookSectionNumber: 1,
    title: "Threshold",
    slug: "threshold",
    subtitle: "Introductory Orientation to Medical Education",
    image: "/sections/1_threshold.png",
    isOrientation: true,
    isAssessed: false,
    status: "orientation",
    badgeLabel: "Introductory Orientation",
    description:
      "A foundational orientation welcoming learners into the culture, identity, and responsibilities of medical education. Setting the stage for the 14 assessed learning modules.",
    learningHighlights: [
      "Transition from school/pre-med to the identity of a doctor",
      "Overview of the MBBS Foundation learning journey",
      "Orientation to academic, emotional, and clinical readiness",
      "Not an assessed module • Does not issue an individual certificate",
    ],
    theme: {
      bg: "bg-red-50/70",
      border: "border-red-200",
      badgeBg: "bg-red-100",
      badgeText: "text-red-900",
      accent: "text-red-700",
      text: "text-red-950",
    },
  },

  // --------------------------------------------------------------------------
  // 14 INDEPENDENTLY ASSESSED MODULES (LOCKED ORDER)
  // --------------------------------------------------------------------------
  {
    id: 1,
    bookSectionNumber: 2,
    title: "Inception",
    slug: "inception",
    subtitle: "Module 1 • First Steps & Academic Transition",
    image: "/sections/2_inception.png",
    isOrientation: false,
    isAssessed: true,
    status: "coming_soon",
    badgeLabel: "Coming Soon",
    description:
      "Understanding the foundational anatomy of medical college life, lecture dynamics, dissection hall readiness, and initial study strategies.",
    learningHighlights: [
      "Adapting to medical college environment",
      "Anatomy, Physiology & Biochemistry study approaches",
      "Managing academic pace and self-directed learning",
    ],
    theme: {
      bg: "bg-sky-50/70",
      border: "border-sky-200",
      badgeBg: "bg-sky-100",
      badgeText: "text-sky-900",
      accent: "text-sky-700",
      text: "text-sky-950",
    },
  },
  {
    id: 2,
    bookSectionNumber: 3,
    title: "Genesis",
    slug: "genesis",
    subtitle: "Module 2 • Medical History, Thinking & Habit Formation",
    image: "/sections/3_genesis.png",
    isOrientation: false,
    isAssessed: true,
    status: "coming_soon",
    badgeLabel: "Coming Soon",
    description:
      "The historical origins of scientific medicine, diagnostic reasoning, and building the lifelong cognitive habits of clinical thinkers.",
    learningHighlights: [
      "Evolution of modern clinical practice",
      "Developing systematic clinical reasoning",
      "Habits of observation and scientific curiosity",
    ],
    theme: {
      bg: "bg-amber-50/70",
      border: "border-amber-200",
      badgeBg: "bg-amber-100",
      badgeText: "text-amber-900",
      accent: "text-amber-700",
      text: "text-amber-950",
    },
  },
  {
    id: 3,
    bookSectionNumber: 4,
    title: "Synthesis",
    slug: "synthesis",
    subtitle: "Module 3 • Integrated Learning & Knowledge Architecture",
    image: "/sections/4_synthesis.png",
    isOrientation: false,
    isAssessed: true,
    status: "coming_soon",
    badgeLabel: "Coming Soon",
    description:
      "Connecting basic sciences with early clinical exposure. Synthesizing organ systems, pathology, and pharmacological foundations.",
    learningHighlights: [
      "Horizontal and vertical integration methods",
      "Connecting preclinical knowledge to clinical presentations",
      "Concept mapping and memory retention in high-volume subjects",
    ],
    theme: {
      bg: "bg-indigo-50/70",
      border: "border-indigo-200",
      badgeBg: "bg-indigo-100",
      badgeText: "text-indigo-900",
      accent: "text-indigo-700",
      text: "text-indigo-950",
    },
  },
  {
    id: 4,
    bookSectionNumber: 5,
    title: "Matrix",
    slug: "matrix",
    subtitle: "Module 4 • Systems, Governance & Healthcare Frameworks",
    image: "/sections/5_matrix.png",
    isOrientation: false,
    isAssessed: true,
    status: "coming_soon",
    badgeLabel: "Coming Soon",
    description:
      "Navigating hospital workflows, health systems, clinical governance, and the regulatory environment governing Indian healthcare.",
    learningHighlights: [
      "Structure of public and private healthcare systems",
      "Hospital organization and ward hierarchies",
      "Patient rights and medico-legal fundamentals",
    ],
    theme: {
      bg: "bg-purple-50/70",
      border: "border-purple-200",
      badgeBg: "bg-purple-100",
      badgeText: "text-purple-900",
      accent: "text-purple-700",
      text: "text-purple-950",
    },
  },
  {
    id: 5,
    bookSectionNumber: 6,
    title: "Covenant",
    slug: "covenant",
    subtitle: "Module 5 • Ethics, Professionalism & The Doctor-Patient Relationship",
    image: "/sections/6_covenant.png",
    isOrientation: false,
    isAssessed: true,
    status: "coming_soon",
    badgeLabel: "Coming Soon",
    description:
      "Medical ethics, informed consent, patient confidentiality, AETCOM principles, and the sacred trust between physician and patient.",
    learningHighlights: [
      "Core principles of bioethics: Autonomy, Beneficence, Non-maleficence, Justice",
      "Informed consent and surrogate decision-making",
      "Empathy, boundary preservation, and doctor-patient trust",
    ],
    theme: {
      bg: "bg-emerald-50/70",
      border: "border-emerald-200",
      badgeBg: "bg-emerald-100",
      badgeText: "text-emerald-900",
      accent: "text-emerald-700",
      text: "text-emerald-950",
    },
  },
  {
    id: 6,
    bookSectionNumber: 7,
    title: "Crossroads",
    slug: "crossroads",
    subtitle: "Module 6 • Clinical Decision Making & Diagnostic Dilemmas",
    image: "/sections/7_crossroads.png",
    isOrientation: false,
    isAssessed: true,
    status: "coming_soon",
    badgeLabel: "Coming Soon",
    description:
      "Approaching uncertainty in clinical practice, cognitive biases, diagnostic testing thresholds, and evidence-based decision-making.",
    learningHighlights: [
      "Deconstructing cognitive biases in medical decisions",
      "Sensitivity, specificity, and likelihood ratios in practice",
      "Balancing algorithmic guidelines with individual clinical context",
    ],
    theme: {
      bg: "bg-rose-50/70",
      border: "border-rose-200",
      badgeBg: "bg-rose-100",
      badgeText: "text-rose-900",
      accent: "text-rose-700",
      text: "text-rose-950",
    },
  },
  {
    id: 7,
    bookSectionNumber: 8,
    title: "Revive",
    slug: "revive",
    subtitle: "Module 7 • Resuscitation Principles & Emergency CPR (First Pilot)",
    image: "/sections/8_revive.png",
    isOrientation: false,
    isAssessed: true,
    status: "pilot",
    badgeLabel: "First Pilot",
    description:
      "Resuscitation science, cardiac arrest recognition, high-quality chest compressions, airway management, AED operation, and emergency algorithms.",
    learningHighlights: [
      "Cardiac arrest recognition and Chain of Survival",
      "High-quality adult and pediatric CPR metrics",
      "Automated External Defibrillator (AED) utilization",
      "Team dynamics and closed-loop communication during resuscitation",
    ],
    theme: {
      bg: "bg-teal-50/70",
      border: "border-teal-300",
      badgeBg: "bg-teal-100",
      badgeText: "text-teal-950",
      accent: "text-teal-700",
      text: "text-teal-950",
    },
  },
  {
    id: 8,
    bookSectionNumber: 9,
    title: "Rescue",
    slug: "rescue",
    subtitle: "Module 8 • First Aid, Acute Trauma & Emergency Care",
    image: "/sections/9_rescue.png",
    isOrientation: false,
    isAssessed: true,
    status: "coming_soon",
    badgeLabel: "Coming Soon",
    description:
      "Primary assessment in acute trauma, hemorrhage control, shock identification, burns, poisoning, and initial emergency stabilization.",
    learningHighlights: [
      "The ABCDE approach to the acutely deteriorating patient",
      "Active hemorrhage control and tourniquet application",
      "Management of choking, anaphylaxis, and acute poisonings",
    ],
    theme: {
      bg: "bg-orange-50/70",
      border: "border-orange-200",
      badgeBg: "bg-orange-100",
      badgeText: "text-orange-900",
      accent: "text-orange-700",
      text: "text-orange-950",
    },
  },
  {
    id: 9,
    bookSectionNumber: 10,
    title: "Impact",
    slug: "impact",
    subtitle: "Module 9 • Community Health, Prevention & Epidemiology",
    image: "/sections/10_impact.png",
    isOrientation: false,
    isAssessed: true,
    status: "coming_soon",
    badgeLabel: "Coming Soon",
    description:
      "Public health realities in India, disease surveillance, immunization schedules, preventive strategies, and social determinants of health.",
    learningHighlights: [
      "Understanding disease burden and national health programmes",
      "Vaccine preventable diseases and cold chain maintenance",
      "Social determinants of health and vulnerable populations",
    ],
    theme: {
      bg: "bg-blue-50/70",
      border: "border-blue-200",
      badgeBg: "bg-blue-100",
      badgeText: "text-blue-900",
      accent: "text-blue-700",
      text: "text-blue-950",
    },
  },
  {
    id: 10,
    bookSectionNumber: 11,
    title: "Tempest",
    slug: "tempest",
    subtitle: "Module 10 • Stress, Burnout & Physician Well-being",
    image: "/sections/11_tempest.png",
    isOrientation: false,
    isAssessed: true,
    status: "coming_soon",
    badgeLabel: "Coming Soon",
    description:
      "Addressing academic fatigue, toxic expectations, residency pressures, emotional resilience, sleep hygiene, and psychological safety in medicine.",
    learningHighlights: [
      "Recognizing early signs of clinical burnout and distress",
      "Constructive coping mechanisms for grueling shift schedules",
      "Destigmatizing mental health support among doctors",
    ],
    theme: {
      bg: "bg-violet-50/70",
      border: "border-violet-200",
      badgeBg: "bg-violet-100",
      badgeText: "text-violet-900",
      accent: "text-violet-700",
      text: "text-violet-950",
    },
  },
  {
    id: 11,
    bookSectionNumber: 12,
    title: "Illumination",
    slug: "illumination",
    subtitle: "Module 11 • Communication Skills & Breaking Bad News",
    image: "/sections/12_illumination.png",
    isOrientation: false,
    isAssessed: true,
    status: "coming_soon",
    badgeLabel: "Coming Soon",
    description:
      "The science of clinical communication, structured models (SPIKES), navigating conflict, addressing patient anxiety, and conveying prognosis.",
    learningHighlights: [
      "Structured communication models (SPIKES protocol)",
      "Addressing grief, anger, and distress in patient families",
      "Cross-cultural and linguistic communication nuances",
    ],
    theme: {
      bg: "bg-yellow-50/70",
      border: "border-yellow-200",
      badgeBg: "bg-yellow-100",
      badgeText: "text-yellow-900",
      accent: "text-yellow-800",
      text: "text-yellow-950",
    },
  },
  {
    id: 12,
    bookSectionNumber: 13,
    title: "Resonance",
    slug: "resonance",
    subtitle: "Module 12 • Interprofessional Dynamics & Leadership",
    image: "/sections/13_resonance.png",
    isOrientation: false,
    isAssessed: true,
    status: "coming_soon",
    badgeLabel: "Coming Soon",
    description:
      "Working seamlessly with nurses, paramedics, technicians, and administrative teams. Cultivating humble leadership and multidisciplinary respect.",
    learningHighlights: [
      "Hierarchies and team dynamics in the clinical ward",
      "Value of interprofessional respect and allied health roles",
      "Conflict de-escalation and leadership under pressure",
    ],
    theme: {
      bg: "bg-cyan-50/70",
      border: "border-cyan-200",
      badgeBg: "bg-cyan-100",
      badgeText: "text-cyan-900",
      accent: "text-cyan-700",
      text: "text-cyan-950",
    },
  },
  {
    id: 13,
    bookSectionNumber: 14,
    title: "Hidden Curriculum",
    slug: "hidden-curriculum",
    subtitle: "Module 13 • Implicit Lessons, Culture & Hospital Realities",
    image: "/sections/14_hidden.png",
    isOrientation: false,
    isAssessed: true,
    status: "coming_soon",
    badgeLabel: "Coming Soon",
    description:
      "Decoding the unwritten rules of clinical training: hierarchy, informal expectations, emotional desensitization, and preserving personal integrity.",
    learningHighlights: [
      "Identifying constructive vs destructive hidden curricula",
      "Preserving personal empathy amid institutional cynicism",
      "Finding mentors and navigating ward politics ethically",
    ],
    theme: {
      bg: "bg-fuchsia-50/70",
      border: "border-fuchsia-200",
      badgeBg: "bg-fuchsia-100",
      badgeText: "text-fuchsia-900",
      accent: "text-fuchsia-700",
      text: "text-fuchsia-950",
    },
  },
  {
    id: 14,
    bookSectionNumber: 15,
    title: "Continuum",
    slug: "continuum",
    subtitle: "Module 14 • Lifelong Learning & Career Trajectories",
    image: "/sections/15_continuum.png",
    isOrientation: false,
    isAssessed: true,
    status: "coming_soon",
    badgeLabel: "Coming Soon",
    description:
      "Post-MBBS pathways, competitive exams (NEET-PG/INICET/USMLE/PLAB), academic medicine, clinical fellowships, and becoming a lifelong scholar.",
    learningHighlights: [
      "Overview of clinical and non-clinical postgraduate specializations",
      "Developing lifelong evidence-based appraisal habits",
      "Completing the 14-module cycle to earn the Programme Certificate",
    ],
    theme: {
      bg: "bg-lime-50/70",
      border: "border-lime-200",
      badgeBg: "bg-lime-100",
      badgeText: "text-lime-900",
      accent: "text-lime-800",
      text: "text-lime-950",
    },
  },
];

/**
 * Helper to fetch a section by URL slug
 */
export function getSectionBySlug(slug: string): SectionConfig | undefined {
  return SECTIONS_CONFIG.find((s) => s.slug === slug.toLowerCase().trim());
}

/**
 * Returns the introductory orientation section (Threshold)
 */
export function getOrientationSection(): SectionConfig {
  return SECTIONS_CONFIG[0];
}

/**
 * Returns only the 14 assessed modules (Inception to Continuum)
 */
export function getAssessedModules(): SectionConfig[] {
  return SECTIONS_CONFIG.filter((s) => s.isAssessed);
}
