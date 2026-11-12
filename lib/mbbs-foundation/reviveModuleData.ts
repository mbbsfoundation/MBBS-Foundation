/**
 * MBBS Foundation Online Learning Programme
 * Module 7: REVIVE (Resuscitation Principles & Emergency CPR)
 *
 * Curriculum Data & Structured Content Placeholders
 * Source: "MBBS Foundation: Your First Book of Medicine" by Dr. Lokesh Tiwari (Chapter 53)
 *
 * PHASE 4B: All unapproved clinical content, textbook text excerpts, sample assessment
 * questions, and invented video runtimes have been replaced with clearly labeled placeholders
 * awaiting authorized MBBS Foundation courseware.
 */

export interface SlideItem {
  id: number;
  title: string;
  subtitle: string;
  placeholderNotice: string;
  curriculumTopic: string;
  notes: string[];
}

export interface VideoItem {
  id: number;
  title: string;
  youtubeId: string;
  youtubeUrl: string;
  durationLabel?: string;
  description?: string;
  topicsCovered?: string[];
}

export interface ReadingSection {
  id: string;
  title: string;
  chapterReference: string;
  summary: string;
  paragraphs: string[];
  placeholderNotes: string[];
}

export const REVIVE_DISCLAIMER =
  "MANDATORY CLINICAL DISCLAIMER: This online educational module is designed for academic orientation and knowledge reinforcement. Completion of this online module does not constitute formal certification of hands-on CPR psychomotor competence, Basic Life Support (BLS) or Advanced Life Support (ALS) provider qualification, or clinical procedural proficiency.";

export const REVIVE_PROGRESS_DISCLAIMER =
  "NOTICE: Any section checkmarks or progress percentages shown in your browser reflect temporary local viewing progress for navigation convenience only. They do not constitute verified academic completion or certification eligibility. Verified learner progress and certificate issuance are recorded on the server only after completing the official assessment once active.";

export interface ModuleAccessConfig {
  moduleId: number;
  moduleCode: string;
  previewSlides: number;
  totalSlides: number;
  accessType: "FREE" | "PAID";
  registrationRequired: boolean;
  assessmentRequired: boolean;
  certificateEligible: boolean;
  passingThresholdPct: number;
  previewPdfUrl: string;
  authenticatedPdfUrl: string;
  features: {
    slides: {
      status: "AVAILABLE";
      previewSlideLimit: number;
      totalSlides: number;
      label: string;
    };
    videos: {
      status: "AVAILABLE";
      registrationRequired: boolean;
      label: string;
    };
    reading: {
      status: "AVAILABLE";
      registrationRequired: boolean;
      label: string;
    };
    assessment: {
      status: "AVAILABLE" | "IN_DEVELOPMENT";
      label: string;
      passingThresholdPct: number;
    };
    certificate: {
      status: "IN_DEVELOPMENT";
      label: string;
      isSampleOnly: boolean;
    };
  };
}

export const REVIVE_ACCESS_CONFIG: ModuleAccessConfig = {
  moduleId: 7,
  moduleCode: "REVIVE",
  previewSlides: 20,
  totalSlides: 53,
  accessType: "FREE",
  registrationRequired: true,
  assessmentRequired: true,
  certificateEligible: true,
  passingThresholdPct: 70,
  previewPdfUrl: "/api/mbbs-foundation/learn/courseware/revive/preview",
  authenticatedPdfUrl: "/api/mbbs-foundation/learn/courseware/revive",
  features: {
    slides: {
      status: "AVAILABLE",
      previewSlideLimit: 20,
      totalSlides: 53,
      label: "Masterclass Slides (1–20 Guest Preview, 1–53 Enrolled)",
    },
    videos: {
      status: "AVAILABLE",
      registrationRequired: true,
      label: "Clinical Resuscitation Instructional Videos",
    },
    reading: {
      status: "AVAILABLE",
      registrationRequired: false,
      label: "Chapter 53 Curriculum & Algorithms Text",
    },
    assessment: {
      status: "AVAILABLE",
      label: "Scenario-Based Assessment (20 MCQs • 70% Pass Mark)",
      passingThresholdPct: 70,
    },
    certificate: {
      status: "IN_DEVELOPMENT",
      label: "Verifiable Certificate of Academic Completion",
      isSampleOnly: true,
    },
  },
};


export const REVIVE_MODULE_META = {
  moduleId: 7,
  code: "REVIVE",
  title: "Resuscitation Principles & Emergency CPR",
  shortTitle: "REVIVE",
  bookReference: "Section 8 • Chapter 53",
  bookTitle: "MBBS Foundation: Your First Book of Medicine",
  author: "Dr. Lokesh Tiwari",
  status: "Official Presentation Slides Integrated",
  presentationPdfUrl: "/api/mbbs-foundation/learn/courseware/revive",
  previewPdfUrl: "/api/mbbs-foundation/learn/courseware/revive/preview",
  previewSlideCount: 20,
  presentationTitle: "MBBS Foundation Masterclass: Resuscitation Principles & Emergency CPR",
  totalSlides: 58,
  pdfPages: 53,
  passingThresholdPct: 70, // Agreed 70% passing threshold strictly preserved
  attemptPolicyNote: "Unlimited attempts (Pilot phase)",
  provisionalQuestionsCount: "20 scenario questions (Single-best-answer)",
  objectives: [
    "Review the core physiological principles of chest compressions and uninterrupted perfusion pressure.",
    "Understand the sequential links of the Chain of Survival for cardiac emergency response.",
    "Review operational safety and deployment workflow for Automated External Defibrillators (AEDs).",
    "Identify common reversible causes of cardiac arrest structured under the 4 Hs and 4 Ts framework.",
    "Recognize the importance of leadership, defined rescuer roles, closed-loop communication, and fatigue management during resuscitation.",
  ],
};

export const REVIVE_SLIDES: SlideItem[] = [
  {
    id: 1,
    title: "Slide 1: [Placeholder — Introduction to Resuscitation Science]",
    subtitle: "Reserved for official MBBS Foundation slide deck",
    placeholderNotice: "Official slide content pending upload",
    curriculumTopic: "Resuscitation science, emergency window, and Chain of Survival overview",
    notes: [
      "[Placeholder] Content slot reserved for official MBBS Foundation slide 1.",
      "Topic area: Introduction to resuscitation science and emergency timeline.",
      "Approved visual slide assets will be integrated upon curriculum authorization.",
    ],
  },
  {
    id: 2,
    title: "Slide 2: [Placeholder — Physiology of Chest Compressions]",
    subtitle: "Reserved for official MBBS Foundation slide deck",
    placeholderNotice: "Official slide content pending upload",
    curriculumTopic: "Compression mechanics, perfusion pressure dynamics, and chest recoil",
    notes: [
      "[Placeholder] Content slot reserved for official MBBS Foundation slide 2.",
      "Topic area: Coronary perfusion pressure, compression dynamics, and full recoil.",
      "Approved visual slide assets will be integrated upon curriculum authorization.",
    ],
  },
  {
    id: 3,
    title: "Slide 3: [Placeholder — Recognition & Immediate Response]",
    subtitle: "Reserved for official MBBS Foundation slide deck",
    placeholderNotice: "Official slide content pending upload",
    curriculumTopic: "Systematic recognition of collapse, responsiveness check, and emergency activation",
    notes: [
      "[Placeholder] Content slot reserved for official MBBS Foundation slide 3.",
      "Topic area: Rapid assessment of the collapsed individual and emergency activation.",
      "Approved visual slide assets will be integrated upon curriculum authorization.",
    ],
  },
  {
    id: 4,
    title: "Slide 4: [Placeholder — CPR Quality Metrics]",
    subtitle: "Reserved for official MBBS Foundation slide deck",
    placeholderNotice: "Official slide content pending upload",
    curriculumTopic: "Standard compression rates, depth guidelines, and pause minimization",
    notes: [
      "[Placeholder] Content slot reserved for official MBBS Foundation slide 4.",
      "Topic area: High-quality CPR performance benchmarks and hand positioning.",
      "Approved visual slide assets will be integrated upon curriculum authorization.",
    ],
  },
  {
    id: 5,
    title: "Slide 5: [Placeholder — Automated External Defibrillator (AED)]",
    subtitle: "Reserved for official MBBS Foundation slide deck",
    placeholderNotice: "Official slide content pending upload",
    curriculumTopic: "AED operation, pad placement workflow, rhythm categories, and rescuer safety",
    notes: [
      "[Placeholder] Content slot reserved for official MBBS Foundation slide 5.",
      "Topic area: Automated External Defibrillator deployment and safety precautions.",
      "Approved visual slide assets will be integrated upon curriculum authorization.",
    ],
  },
  {
    id: 6,
    title: "Slide 6: [Placeholder — Pediatric vs. Adult Considerations]",
    subtitle: "Reserved for official MBBS Foundation slide deck",
    placeholderNotice: "Official slide content pending upload",
    curriculumTopic: "Etiological differences, compression ratios, and pediatric adaptations",
    notes: [
      "[Placeholder] Content slot reserved for official MBBS Foundation slide 6.",
      "Topic area: Pediatric resuscitation distinctions and age-appropriate adjustments.",
      "Approved visual slide assets will be integrated upon curriculum authorization.",
    ],
  },
  {
    id: 7,
    title: "Slide 7: [Placeholder — Reversible Causes: 4 Hs & 4 Ts]",
    subtitle: "Reserved for official MBBS Foundation slide deck",
    placeholderNotice: "Official slide content pending upload",
    curriculumTopic: "Algorithmic review of potentially reversible underlying causes of arrest",
    notes: [
      "[Placeholder] Content slot reserved for official MBBS Foundation slide 7.",
      "Topic area: Diagnostic considerations during non-shockable cardiac arrest (4 Hs & 4 Ts).",
      "Approved visual slide assets will be integrated upon curriculum authorization.",
    ],
  },
  {
    id: 8,
    title: "Slide 8: [Placeholder — Team Dynamics & Leadership]",
    subtitle: "Reserved for official MBBS Foundation slide deck",
    placeholderNotice: "Official slide content pending upload",
    curriculumTopic: "Role allocation, compressor rotation to prevent fatigue, and communication",
    notes: [
      "[Placeholder] Content slot reserved for official MBBS Foundation slide 8.",
      "Topic area: High-performance code team dynamics and structured debriefing.",
      "Approved visual slide assets will be integrated upon curriculum authorization.",
    ],
  },
];

export const REVIVE_VIDEOS: VideoItem[] = [
  {
    id: 1,
    title: "Steps of Cardiopulmonary Resuscitation and Relief of Severe Choking: Adult, Children and Infants",
    youtubeId: "NyB_M8ndZho",
    youtubeUrl: "https://youtu.be/NyB_M8ndZho",
  },
  {
    id: 2,
    title: "Use of Automated External Defibrillator (AED)",
    youtubeId: "xyAkNOVXLBM",
    youtubeUrl: "https://youtu.be/xyAkNOVXLBM",
  },
  {
    id: 3,
    title: "Practice CPR While Watching Video (PWW)",
    youtubeId: "1uhyyVBaBe8",
    youtubeUrl: "https://youtu.be/1uhyyVBaBe8",
  },
];

export const REVIVE_READING_SECTIONS: ReadingSection[] = [
  {
    id: "science",
    title: "Part 1: [Placeholder — Fundamentals of Resuscitation Science]",
    chapterReference: "Chapter 53 • Section 8 Excerpt Slot",
    summary:
      "[Placeholder] Content slot reserved for official text excerpt on resuscitation physiology from 'MBBS Foundation: Your First Book of Medicine'.",
    paragraphs: [
      "[Placeholder: Official Textbook Content Pending] The approved reading text for this section will be integrated directly from Chapter 53 of 'MBBS Foundation: Your First Book of Medicine' by Dr. Lokesh Tiwari.",
      "[Placeholder] Detailed clinical discussion, physiology explanations, and reference materials are currently undergoing curriculum preparation and will appear here upon authorization.",
    ],
    placeholderNotes: [
      "[Placeholder] Reading material slot for Resuscitation Science fundamentals.",
      "Awaiting authorized textbook excerpt integration.",
    ],
  },
  {
    id: "quality",
    title: "Part 2: [Placeholder — CPR Quality Standards & Metrics]",
    chapterReference: "Chapter 53 • Section 8 Excerpt Slot",
    summary:
      "[Placeholder] Content slot reserved for official text excerpt on CPR quality parameters and metrics.",
    paragraphs: [
      "[Placeholder: Official Textbook Content Pending] The approved reading text for this section will be integrated directly from Chapter 53 of 'MBBS Foundation: Your First Book of Medicine' by Dr. Lokesh Tiwari.",
      "[Placeholder] Standard metrics for rates, depths, and pause minimization will be integrated here from the approved curriculum.",
    ],
    placeholderNotes: [
      "[Placeholder] Reading material slot for CPR Quality Standards.",
      "Awaiting authorized textbook excerpt integration.",
    ],
  },
  {
    id: "aed",
    title: "Part 3: [Placeholder — Defibrillation Principles & AED Use]",
    chapterReference: "Chapter 53 • Section 8 Excerpt Slot",
    summary:
      "[Placeholder] Content slot reserved for official text excerpt on defibrillation principles and AED operation.",
    paragraphs: [
      "[Placeholder: Official Textbook Content Pending] The approved reading text for this section will be integrated directly from Chapter 53 of 'MBBS Foundation: Your First Book of Medicine' by Dr. Lokesh Tiwari.",
      "[Placeholder] Rhythm classification and defibrillator operation text will appear here following official review.",
    ],
    placeholderNotes: [
      "[Placeholder] Reading material slot for Defibrillation principles.",
      "Awaiting authorized textbook excerpt integration.",
    ],
  },
  {
    id: "reversible",
    title: "Part 4: [Placeholder — Reversible Causes of Arrest (4 Hs & 4 Ts)]",
    chapterReference: "Chapter 53 • Section 8 Excerpt Slot",
    summary:
      "[Placeholder] Content slot reserved for official text excerpt on reversible causes of cardiac arrest.",
    paragraphs: [
      "[Placeholder: Official Textbook Content Pending] The approved reading text for this section will be integrated directly from Chapter 53 of 'MBBS Foundation: Your First Book of Medicine' by Dr. Lokesh Tiwari.",
      "[Placeholder] Diagnostic problem-solving frameworks will appear here upon authorization.",
    ],
    placeholderNotes: [
      "[Placeholder] Reading material slot for 4 Hs & 4 Ts framework.",
      "Awaiting authorized textbook excerpt integration.",
    ],
  },
  {
    id: "teams",
    title: "Part 5: [Placeholder — Human Factors, Leadership & Debriefing]",
    chapterReference: "Chapter 53 • Section 8 Excerpt Slot",
    summary:
      "[Placeholder] Content slot reserved for official text excerpt on team leadership, closed-loop communication, and post-resuscitation debriefing.",
    paragraphs: [
      "[Placeholder: Official Textbook Content Pending] The approved reading text for this section will be integrated directly from Chapter 53 of 'MBBS Foundation: Your First Book of Medicine' by Dr. Lokesh Tiwari.",
      "[Placeholder] Team dynamics and debriefing guidelines will appear here upon authorization.",
    ],
    placeholderNotes: [
      "[Placeholder] Reading material slot for Team Leadership and Communication.",
      "Awaiting authorized textbook excerpt integration.",
    ],
  },
];
