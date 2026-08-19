export type QuizDomain = "A" | "B" | "C" | "D";

export interface QuestionOption {
  id: string; // e.g. "A", "B", "C", "D"
  text: string;
}

export interface QuizQuestion {
  id: number;
  domain: QuizDomain;
  domainName: string;
  domainBadge: string;
  question: string;
  options: QuestionOption[];
  correctId: string;
  explanation: string;
}

export const QUESTION_BANK: QuizQuestion[] = [
  // =========================================================================
  // DOMAIN A — ENTERING MBBS & MEDICAL EDUCATION (Q1 - Q5)
  // =========================================================================
  {
    id: 1,
    domain: "A",
    domainName: "Medical Education",
    domainBadge: "Entering MBBS",
    question:
      "A student is beginning first-year MBBS. Which combination represents the three principal subjects traditionally forming the first-year basic-science foundation?",
    options: [
      { id: "A", text: "Anatomy, Physiology, Biochemistry" },
      { id: "B", text: "Anatomy, Pathology, Pharmacology" },
      { id: "C", text: "Physiology, Microbiology, Pathology" },
      { id: "D", text: "Biochemistry, Pharmacology, Community Medicine" },
    ],
    correctId: "A",
    explanation:
      "Anatomy, Physiology and Biochemistry constitute the principal basic-science subjects encountered at the beginning of MBBS.",
  },
  {
    id: 2,
    domain: "A",
    domainName: "Medical Education",
    domainBadge: "Curriculum & Competencies",
    question:
      "AETCOM in Indian undergraduate medical education primarily integrates which areas?",
    options: [
      { id: "A", text: "Anatomy, Emergency medicine, Teaching and Community medicine" },
      { id: "B", text: "Attitude, Ethics and Communication" },
      { id: "C", text: "Assessment, Ethics, Clinical Observation and Medicine" },
      { id: "D", text: "Applied Education, Teamwork, Communication and Management" },
    ],
    correctId: "B",
    explanation:
      "AETCOM refers to Attitude, Ethics and Communication competencies integrated into undergraduate medical education.",
  },
  {
    id: 3,
    domain: "A",
    domainName: "Medical Education",
    domainBadge: "Clinical Learning",
    question:
      "Which statement best describes Early Clinical Exposure (ECE) in medical education?",
    options: [
      { id: "A", text: "Students begin independent treatment of patients in first year" },
      { id: "B", text: "Basic-science learning is connected with clinical context and patient care early in training" },
      { id: "C", text: "First-year basic sciences are replaced by clinical subjects" },
      { id: "D", text: "Students undertake internship duties before completing preclinical training" },
    ],
    correctId: "B",
    explanation:
      "Early Clinical Exposure helps students connect foundational sciences with clinical context without making beginning students independent clinicians.",
  },
  {
    id: 4,
    domain: "A",
    domainName: "Medical Education",
    domainBadge: "Foundational Sciences",
    question:
      "Which of the following best distinguishes Anatomy from Physiology?",
    options: [
      { id: "A", text: "Anatomy studies normal structure; Physiology studies normal function" },
      { id: "B", text: "Anatomy studies disease; Physiology studies treatment" },
      { id: "C", text: "Anatomy studies cells only; Physiology studies organs only" },
      { id: "D", text: "Anatomy studies gross structures; Physiology studies biochemical reactions only" },
    ],
    correctId: "A",
    explanation:
      "Anatomy principally examines structure, while Physiology examines how normal biological systems function.",
  },
  {
    id: 5,
    domain: "A",
    domainName: "Medical Education",
    domainBadge: "Foundational Sciences",
    question:
      "A medical student encounters a patient with a disease while learning the normal functioning of the cardiovascular system. Which first-year discipline most directly provides the foundation for understanding normal cardiac function?",
    options: [
      { id: "A", text: "Anatomy" },
      { id: "B", text: "Physiology" },
      { id: "C", text: "Biochemistry" },
      { id: "D", text: "Histology" },
    ],
    correctId: "B",
    explanation:
      "Physiology provides the principal framework for understanding normal cardiovascular function, which later helps students recognize abnormal function in disease.",
  },

  // =========================================================================
  // DOMAIN B — PROFESSIONALISM, ETHICS & COMMUNICATION (Q6 - Q10)
  // =========================================================================
  {
    id: 6,
    domain: "B",
    domainName: "Ethics & Professionalism",
    domainBadge: "Confidentiality",
    question:
      "A medical student discusses an interesting patient case with classmates for legitimate learning. Which principle remains essential?",
    options: [
      { id: "A", text: "The diagnosis may be discussed, so confidentiality no longer applies" },
      { id: "B", text: "Identifiable patient information should be protected" },
      { id: "C", text: "Confidentiality applies only after graduation" },
      { id: "D", text: "Removing the patient's name always makes every other detail safe to share publicly" },
    ],
    correctId: "B",
    explanation:
      "Confidentiality applies to medical students as well as doctors, and identifying information extends beyond a patient's name alone.",
  },
  {
    id: 7,
    domain: "B",
    domainName: "Ethics & Professionalism",
    domainBadge: "Informed Consent",
    question:
      "Which statement best describes informed consent?",
    options: [
      { id: "A", text: "A signature on a form is sufficient regardless of understanding" },
      { id: "B", text: "Consent is valid whenever a relative agrees" },
      { id: "C", text: "A capable person receives relevant information and voluntarily agrees to the proposed intervention" },
      { id: "D", text: "Consent is required only for surgical procedures" },
    ],
    correctId: "C",
    explanation:
      "Valid informed consent involves appropriate information, decision-making capacity and voluntary agreement; it is more than obtaining a signature.",
  },
  {
    id: 8,
    domain: "B",
    domainName: "Ethics & Professionalism",
    domainBadge: "Communication",
    question:
      "A patient uses a term you do not understand while describing a symptom. What is the most appropriate communication approach?",
    options: [
      { id: "A", text: "Interpret it according to what you think the patient means" },
      { id: "B", text: "Ask the patient to clarify what they mean" },
      { id: "C", text: "Replace the patient's description with medical terminology" },
      { id: "D", text: "Ignore the term if the rest of the history seems clear" },
    ],
    correctId: "B",
    explanation:
      "Clarification reduces assumptions and helps ensure that the clinician understands the patient's intended meaning.",
  },
  {
    id: 9,
    domain: "B",
    domainName: "Ethics & Professionalism",
    domainBadge: "Medical Ethics",
    question:
      "Which statement most accurately reflects patient confidentiality?",
    options: [
      { id: "A", text: "It is absolute under every conceivable circumstance" },
      { id: "B", text: "It applies only to written medical records" },
      { id: "C", text: "Patient information should generally remain confidential, with limited exceptions governed by ethical and legal obligations" },
      { id: "D", text: "It applies to doctors but not medical students" },
    ],
    correctId: "C",
    explanation:
      "Confidentiality is a core obligation, although specific ethical and legal circumstances can justify or require disclosure.",
  },
  {
    id: 10,
    domain: "B",
    domainName: "Ethics & Professionalism",
    domainBadge: "Clinical Communication",
    question:
      "During a clinical interaction, which technique most directly checks whether your explanation has actually been understood?",
    options: [
      { id: "A", text: "Repeating the same explanation more loudly" },
      { id: "B", text: "Asking 'Do you understand?'" },
      { id: "C", text: "Asking the person to explain the key information back in their own words" },
      { id: "D", text: "Providing additional medical terminology" },
    ],
    correctId: "C",
    explanation:
      "Asking someone to explain information back in their own words—the teach-back approach—provides a better check of understanding than a simple yes/no question.",
  },

  // =========================================================================
  // DOMAIN C — APPLIED HUMAN BIOLOGY & CLINICAL THINKING (Q11 - Q15)
  // =========================================================================
  {
    id: 11,
    domain: "C",
    domainName: "Applied Biology",
    domainBadge: "Physiology & Transport",
    question:
      "A patient's arterial haemoglobin concentration falls substantially while ventilation remains normal. Which blood function is most directly reduced?",
    options: [
      { id: "A", text: "Transport of oxygen" },
      { id: "B", text: "Production of carbon dioxide" },
      { id: "C", text: "Filtration of plasma" },
      { id: "D", text: "Generation of nerve impulses" },
    ],
    correctId: "A",
    explanation:
      "Haemoglobin is the major carrier of oxygen in blood, so reduced haemoglobin primarily reduces oxygen-carrying capacity.",
  },
  {
    id: 12,
    domain: "C",
    domainName: "Applied Biology",
    domainBadge: "Respiratory System",
    question:
      "Damage to the alveoli would most directly interfere with which process?",
    options: [
      { id: "A", text: "Filtration of blood" },
      { id: "B", text: "Exchange of oxygen and carbon dioxide between air and blood" },
      { id: "C", text: "Generation of red blood cells" },
      { id: "D", text: "Initiation of skeletal-muscle contraction" },
    ],
    correctId: "B",
    explanation:
      "Alveoli provide the principal surface across which respiratory gases diffuse between inspired air and pulmonary capillary blood.",
  },
  {
    id: 13,
    domain: "C",
    domainName: "Applied Biology",
    domainBadge: "Circulation & Perfusion",
    question:
      "A person loses a substantial volume of blood rapidly. Which variable is most immediately threatened as a result of the reduced circulating volume?",
    options: [
      { id: "A", text: "Tissue perfusion" },
      { id: "B", text: "DNA replication" },
      { id: "C", text: "Bone mineralization" },
      { id: "D", text: "Bile production" },
    ],
    correctId: "A",
    explanation:
      "Acute major blood loss reduces circulating volume and can compromise perfusion of vital tissues.",
  },
  {
    id: 14,
    domain: "C",
    domainName: "Applied Biology",
    domainBadge: "Cardiovascular System",
    question:
      "Which chamber of the normal heart pumps blood directly into the systemic circulation?",
    options: [
      { id: "A", text: "Right atrium" },
      { id: "B", text: "Right ventricle" },
      { id: "C", text: "Left atrium" },
      { id: "D", text: "Left ventricle" },
    ],
    correctId: "D",
    explanation:
      "The left ventricle ejects oxygenated blood into the aorta and systemic circulation.",
  },
  {
    id: 15,
    domain: "C",
    domainName: "Applied Biology",
    domainBadge: "Neurophysiology",
    question:
      "Why can interruption of cerebral blood flow rapidly become dangerous?",
    options: [
      { id: "A", text: "Brain tissue has high metabolic requirements and limited tolerance of prolonged interruption of oxygen delivery" },
      { id: "B", text: "Brain cells store very large reserves of oxygen" },
      { id: "C", text: "The brain can switch completely to anaerobic metabolism indefinitely" },
      { id: "D", text: "Cerebral circulation is unrelated to oxygen delivery" },
    ],
    correctId: "A",
    explanation:
      "The brain has high metabolic demands and depends on continuous blood flow for oxygen and substrates, making prolonged interruption dangerous.",
  },

  // =========================================================================
  // DOMAIN D — LIFESAVING & CPR AWARENESS (Q16 - Q20)
  // =========================================================================
  {
    id: 16,
    domain: "D",
    domainName: "Lifesaving & CPR",
    domainBadge: "Emergency Response",
    question:
      "An adult suddenly collapses, is unresponsive and is not breathing normally. Which sequence best reflects the immediate priorities for a lay responder?",
    options: [
      { id: "A", text: "Give water → check temperature → wait for recovery" },
      { id: "B", text: "Recognize cardiac arrest → activate emergency response/get help → begin CPR" },
      { id: "C", text: "Check blood pressure → obtain medical history → begin CPR" },
      { id: "D", text: "Transport the person first → assess breathing later" },
    ],
    correctId: "B",
    explanation:
      "Rapid recognition, activation of emergency response and early CPR are central links in the response to suspected cardiac arrest.",
  },
  {
    id: 17,
    domain: "D",
    domainName: "Lifesaving & CPR",
    domainBadge: "CPR Mechanics",
    question:
      "Why are chest compressions important during cardiac arrest?",
    options: [
      { id: "A", text: "They directly restart normal electrical activity with every compression" },
      { id: "B", text: "They help maintain some blood flow to vital organs until effective circulation can be restored" },
      { id: "C", text: "They increase the oxygen concentration of room air" },
      { id: "D", text: "They remove an obstruction from the airway" },
    ],
    correctId: "B",
    explanation:
      "Chest compressions generate limited but important blood flow to the brain, heart and other vital organs during cardiac arrest.",
  },
  {
    id: 18,
    domain: "D",
    domainName: "Lifesaving & CPR",
    domainBadge: "Defibrillation",
    question:
      "What is the primary purpose of an Automated External Defibrillator (AED)?",
    options: [
      { id: "A", text: "Measure blood glucose" },
      { id: "B", text: "Deliver oxygen automatically" },
      { id: "C", text: "Analyze the heart rhythm and, when indicated, deliver a shock" },
      { id: "D", text: "Replace chest compressions completely" },
    ],
    correctId: "C",
    explanation:
      "An AED analyzes cardiac rhythm and can advise/deliver defibrillation when a shockable rhythm is detected. CPR remains important.",
  },
  {
    id: 19,
    domain: "D",
    domainName: "Lifesaving & CPR",
    domainBadge: "Defibrillation",
    question:
      "Why does early defibrillation matter in a shockable cardiac-arrest rhythm?",
    options: [
      { id: "A", text: "The likelihood of successful defibrillation generally decreases as time passes without effective treatment" },
      { id: "B", text: "Defibrillation is useful only after spontaneous breathing returns" },
      { id: "C", text: "AEDs work by mechanically circulating blood" },
      { id: "D", text: "Defibrillation eliminates the need to activate emergency services" },
    ],
    correctId: "A",
    explanation:
      "For shockable cardiac-arrest rhythms, delays reduce the opportunity for successful defibrillation, which is why early AED access is important.",
  },
  {
    id: 20,
    domain: "D",
    domainName: "Lifesaving & CPR",
    domainBadge: "Recognition",
    question:
      "A person is unresponsive and making occasional abnormal gasping breaths. Which interpretation is safest in the context of suspected cardiac arrest?",
    options: [
      { id: "A", text: "Gasping always confirms normal breathing" },
      { id: "B", text: "Abnormal gasping should not be assumed to represent normal breathing" },
      { id: "C", text: "CPR must never be considered while any respiratory movement is visible" },
      { id: "D", text: "Gasping proves that circulation is normal" },
    ],
    correctId: "B",
    explanation:
      "Agonal or abnormal gasping can occur during cardiac arrest and should not be mistaken for normal breathing.",
  },
];

/**
 * Randomizes an array in-place / copy using Fisher-Yates
 */
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export interface PreparedQuestion {
  questionIndex: number;
  originalId: number;
  domain: QuizDomain;
  domainName: string;
  domainBadge: string;
  question: string;
  options: { id: string; text: string; isCorrect: boolean }[];
  explanation: string;
}

/**
 * Generates a balanced, randomized set of 10 questions with shuffled options.
 * Strategy:
 * - 2 questions from Domain A
 * - 2 questions from Domain B
 * - 2 questions from Domain C
 * - 2 questions from Domain D
 * - 2 remaining questions chosen at random from the remaining 12 questions
 * -> Exactly 10 questions, sequence shuffled, options shuffled!
 */
export function generateRandomQuizAttempt(): PreparedQuestion[] {
  const domainA = shuffleArray(QUESTION_BANK.filter((q) => q.domain === "A"));
  const domainB = shuffleArray(QUESTION_BANK.filter((q) => q.domain === "B"));
  const domainC = shuffleArray(QUESTION_BANK.filter((q) => q.domain === "C"));
  const domainD = shuffleArray(QUESTION_BANK.filter((q) => q.domain === "D"));

  // Select 2 from each domain
  const selected: QuizQuestion[] = [
    domainA[0],
    domainA[1],
    domainB[0],
    domainB[1],
    domainC[0],
    domainC[1],
    domainD[0],
    domainD[1],
  ];

  // Pool remaining questions and pick 2 randomly
  const remaining = shuffleArray([
    domainA[2],
    domainA[3],
    domainA[4],
    domainB[2],
    domainB[3],
    domainB[4],
    domainC[2],
    domainC[3],
    domainC[4],
    domainD[2],
    domainD[3],
    domainD[4],
  ]);

  selected.push(remaining[0], remaining[1]);

  // Shuffle the 10 selected questions
  const finalQuestions = shuffleArray(selected);

  // Prepare each question with randomized options
  return finalQuestions.map((q, idx) => {
    // Shuffle the options while tagging whether each option is correct
    const shuffledOptions = shuffleArray(
      q.options.map((opt) => ({
        id: opt.id,
        text: opt.text,
        isCorrect: opt.id === q.correctId,
      }))
    );

    return {
      questionIndex: idx + 1,
      originalId: q.id,
      domain: q.domain,
      domainName: q.domainName,
      domainBadge: q.domainBadge,
      question: q.question,
      options: shuffledOptions,
      explanation: q.explanation,
    };
  });
}
