import * as crypto from "crypto";

/**
 * MBBS Foundation Online Learning Programme
 * Module 7: REVIVE — Consolidated Assessment Bank (2025 AHA Guidelines)
 *
 * PHASE 6B: Question Consolidation, 2025 Guideline Review & Balanced Randomization
 *
 * Standards:
 * - 20 MCQs per attempt selected from the approved 34-question pool
 * - Single-best-answer format (4 options: A, B, C, D)
 * - Passing threshold: 70% (14 / 20)
 * - Balanced correct-answer distribution: Exactly 5 A, 5 B, 5 C, and 5 D per attempt
 * - Server-side scoring with HMAC-signed attempt tokens (answers never exposed prior to submission)
 * - Review mode shows score, learner choice, correct answer, and detailed clinical rationale
 */

export interface MasterOption {
  text: string;
  isCorrect: boolean;
}

export interface MasterAssessmentQuestion {
  id: string; // Stable unique ID e.g. "REVIVE-CPR-01", "REVIVE-CHK-01"
  curriculumTopic: string;
  scenario?: string;
  questionStem: string;
  correctOption: string;
  distractors: [string, string, string];
  explanation: string;
  guidelineReference?: string;
}

export interface DisplayOption {
  id: "A" | "B" | "C" | "D";
  text: string;
}

export interface ClientAssessmentQuestion {
  id: string;
  questionNumber: number;
  curriculumTopic: string;
  scenario?: string;
  questionStem: string;
  options: DisplayOption[];
  // NOTE: correctOption and explanation are NEVER present in client questions before submission
}

export interface QuestionEvaluationResult {
  questionId: string;
  questionNumber: number;
  selectedOption: "A" | "B" | "C" | "D" | null;
  correctOption: "A" | "B" | "C" | "D";
  isCorrect: boolean;
  explanation: string;
}

export interface AssessmentEvaluationResult {
  score: number;
  totalQuestions: number;
  percentage: number;
  passed: boolean;
  passingThresholdScore: number;
  passingThresholdPct: number;
  unansweredCount: number;
  questionResults: QuestionEvaluationResult[];
}

export const REVIVE_ASSESSMENT_CONFIG = {
  moduleId: 7,
  moduleCode: "REVIVE",
  moduleTitle: "Resuscitation Principles & Emergency CPR",
  totalQuestionsPerAttempt: 20,
  passingThresholdScore: 14, // 14 / 20 = 70%
  passingThresholdPct: 70,
  optionsPerQuestion: 4,
  targetDistributionPerLetter: 5, // Exactly 5 A, 5 B, 5 C, 5 D
  attemptPolicy: "Unlimited Attempts (Pilot Phase)",
  disclaimer:
    "MANDATORY CLINICAL NOTICE: This online assessment evaluates conceptual understanding and clinical decision-making under current 2025 guidelines. Completion does not certify hands-on CPR psychomotor competence, Basic Life Support (BLS) or Advanced Life Support (ALS) provider qualification, or clinical procedural proficiency.",
};

// ============================================================================
// CONSOLIDATED MASTER QUESTION BANK (34 UNIQUE QUESTIONS)
// ============================================================================
// Derived from 19 retained existing questions (Q20 removed for formatting errors)
// and 20 supplementary questions, minus 5 exact/conceptual duplicates:
// 1. Ex-Q03 (Rate benchmark) removed -> Supp-Q02 kept (stronger rate & depth scenario)
// 2. Ex-Q06 & Ex-Q18 (Post-shock pause) removed -> Supp-Q05 kept
// 3. Ex-Q17 (Older abdominal-only choking) removed -> Supp-Q13 kept (2025 AHA 5 back blows + 5 abdominal thrusts)
// 4. Ex-Q19 (Metrics composite) removed -> decomposed into Supp-Q02, Supp-Q03, Supp-Q12
// Total = 39 - 5 = 34 unique questions.
// ============================================================================

export const REVIVE_MASTER_QUESTIONS: MasterAssessmentQuestion[] = [
  // --------------------------------------------------------------------------
  // CARDIOPULMONARY RESUSCITATION (CPR)
  // --------------------------------------------------------------------------
  {
    id: "REVIVE-CPR-01",
    curriculumTopic: "Initial Assessment & Recognition",
    scenario: "You enter a hospital corridor and witness an adult visitor suddenly collapse to the floor without warning.",
    questionStem: "After ensuring the scene is safe, what is your immediate priority action?",
    correctOption: "Tap the shoulders, shout to check responsiveness, and simultaneously scan for normal breathing and a carotid pulse for no more than 10 seconds.",
    distractors: [
      "Immediately administer two rescue breaths before checking for a pulse.",
      "Elevate the victim's legs to 45 degrees and monitor for spontaneous recovery.",
      "Place the victim into the recovery position and search for bystander witnesses.",
    ],
    explanation:
      "In an adult witnessed collapse, after ensuring scene safety, assess responsiveness and simultaneously check for normal breathing and a carotid pulse for at least 5 but no more than 10 seconds.",
    guidelineReference: "2025 AHA Guidelines for CPR and ECC — Adult Basic Life Support",
  },
  {
    id: "REVIVE-CPR-02",
    curriculumTopic: "Coronary Perfusion Pressure Dynamics",
    scenario: "During a resuscitation seminar, the clinical tutor emphasizes uninterrupted chest compressions.",
    questionStem: "What is the primary physiological rationale for minimizing interruptions during external chest compressions?",
    correctOption: "To build and sustain coronary and cerebral perfusion pressure, which drops precipitously with every pause.",
    distractors: [
      "To prevent chest wall stiffness and muscle fatigue in the rescuer.",
      "To reduce pulmonary airway resistance and accelerate alveolar recruitment.",
      "To ensure equal distribution of blood volume to peripheral extremities.",
    ],
    explanation:
      "External chest compressions generate coronary perfusion pressure (CPP). Pauses cause CPP to plummet immediately, and multiple compressions are required to restore adequate perfusion.",
    guidelineReference: "2025 AHA Guidelines for CPR and ECC — Resuscitation Physiology",
  },
  {
    id: "REVIVE-CPR-03",
    curriculumTopic: "Compression Rate & Depth Benchmarks",
    scenario: "During adult CPR, a rescuer achieves a compression rate of 125/min, depth of 6.5 cm and allows full chest recoil.",
    questionStem: "Which modification would most improve compression quality?",
    correctOption: "Reduce depth and rate to recommended ranges.",
    distractors: [
      "Increase the rate to 140/min.",
      "Maintain the technique because recoil is complete.",
      "Reduce compression depth to 3 cm.",
    ],
    explanation:
      "Recommended adult compression rate is 100–120/min and depth is approximately 5–6 cm (2 to 2.4 inches). Excessive rate or depth may compromise cardiac filling and increase injury risk.",
    guidelineReference: "2025 AHA Guidelines for CPR and ECC — High-Quality CPR Benchmarks",
  },
  {
    id: "REVIVE-CPR-04",
    curriculumTopic: "Compression Recoil Physiology",
    scenario: "An observer notes that a rescuer is leaning forward on the victim's sternum between compressions.",
    questionStem: "Why is complete chest wall recoil between compressions mandatory in high-quality CPR?",
    correctOption: "It allows full negative intrathoracic pressure development, promoting venous return and cardiac chamber refill.",
    distractors: [
      "It prevents rib fractures and costochondral separation.",
      "It reduces the frequency of spontaneous premature ventricular beats.",
      "It ensures exhaled carbon dioxide escapes passively from the lungs.",
    ],
    explanation:
      "Leaning on the chest between compressions prevents full chest recoil, increasing intrathoracic pressure and impeding venous return, which drastically decreases stroke volume and cardiac output.",
    guidelineReference: "2025 AHA Guidelines for CPR and ECC — Adult BLS",
  },
  {
    id: "REVIVE-CPR-05",
    curriculumTopic: "Adult CPR Ratio without Advanced Airway",
    scenario: "Two trained rescuers are managing an unresponsive adult victim prior to the placement of an advanced airway.",
    questionStem: "What is the standard compression-to-ventilation ratio for adult resuscitation?",
    correctOption: "30 compressions to 2 ventilations.",
    distractors: [
      "15 compressions to 2 ventilations.",
      "50 compressions to 5 ventilations.",
      "Continuous compressions with 1 ventilation every 3 seconds.",
    ],
    explanation:
      "For adult cardiac arrest without an advanced airway, the universal compression-to-ventilation ratio is 30:2 for both single rescuers and two rescuers.",
    guidelineReference: "2025 AHA Guidelines for CPR and ECC — Adult Basic Life Support",
  },
  {
    id: "REVIVE-CPR-06",
    curriculumTopic: "Ventilation with Advanced Airway",
    scenario: "An intubated adult patient remains in cardiac arrest. The team continues chest compressions.",
    questionStem: "Which ventilation strategy is most appropriate?",
    correctOption: "Give one breath approximately every 6 seconds without pausing compressions.",
    distractors: [
      "Pause compressions after every 30 compressions.",
      "Give one breath every 2–3 seconds.",
      "Deliver 20–25 breaths/min.",
    ],
    explanation:
      "With an advanced airway during adult CPR, deliver continuous chest compressions (100–120/min) and approximately 10 breaths/min (one breath every 6 seconds), avoiding hyperventilation.",
    guidelineReference: "2025 AHA Guidelines for CPR and ECC — Advanced Cardiovascular Life Support",
  },
  {
    id: "REVIVE-CPR-07",
    curriculumTopic: "AED Initial Deployment",
    scenario: "A second rescuer arrives at the scene of cardiac arrest carrying a portable AED.",
    questionStem: "What is the very first step in operating any Automated External Defibrillator?",
    correctOption: "Power on the AED unit to initiate voice and visual prompt guidance.",
    distractors: [
      "Apply the adhesive pads directly onto the victim's clothing.",
      "Press the shock button to test device battery level.",
      "Connect an external ECG grounding wire to the bed frame.",
    ],
    explanation:
      "The first step in operating an AED is always to power it on. This immediately activates verbal and visual instructional prompts that guide pad attachment, rhythm analysis, and shock delivery.",
    guidelineReference: "2025 AHA Guidelines for CPR and ECC — Automated External Defibrillation",
  },
  {
    id: "REVIVE-CPR-08",
    curriculumTopic: "AED Electrode Pad Placement",
    scenario: "You are preparing to place adult AED pads on a bare adult chest.",
    questionStem: "What is the standard anterior-lateral placement for adult defibrillation pads?",
    correctOption: "Upper right sternal border (infraclavicular) and lower left lateral chest wall (axillary line).",
    distractors: [
      "Directly over the center of the sternum and over the epigastrium.",
      "Upper left anterior chest and lower right lumbar quadrant.",
      "Bilaterally over the mid-axillary lines below the costal margins.",
    ],
    explanation:
      "Standard anterior-lateral pad placement positions one pad on the victim's bare upper right chest below the clavicle and the other pad lateral to the left nipple in the mid-axillary line.",
    guidelineReference: "2025 AHA Guidelines for CPR and ECC — Defibrillation Principles",
  },
  {
    id: "REVIVE-CPR-09",
    curriculumTopic: "Shockable Arrhythmias Recognition",
    scenario: "The cardiac monitor displays a chaotic, irregular waveform with no identifiable P waves, QRS complexes, or T waves in a pulseless patient.",
    questionStem: "Which category does this rhythm belong to, and what is the primary electrical management?",
    correctOption: "Ventricular Fibrillation (VF) — a shockable rhythm requiring immediate defibrillation.",
    distractors: [
      "Asystole — a non-shockable rhythm requiring continued CPR and high-dose calcium.",
      "Pulseless Electrical Activity — a non-shockable rhythm requiring pacing.",
      "Sinus Tachycardia with artifact — requiring synchronized cardioversion.",
    ],
    explanation:
      "Ventricular Fibrillation (VF) and pulseless Ventricular Tachycardia (pVT) are shockable rhythms. Early electrical defibrillation is the single most critical determinant of survival in VF arrest.",
    guidelineReference: "2025 AHA Guidelines for CPR and ECC — ACLS Arrhythmia Management",
  },
  {
    id: "REVIVE-CPR-10",
    curriculumTopic: "Non-Shockable Rhythms Management",
    scenario: "An AED indicates 'No Shock Advised' in a patient confirmed to be unresponsive, apnoeic, and pulseless.",
    questionStem: "What is the immediate next step in patient management?",
    correctOption: "Immediately resume high-quality chest compressions and search for reversible causes.",
    distractors: [
      "Turn off the AED and assume the patient has achieved ROSC.",
      "Deliver a manual unsynchronized shock to override the AED recommendation.",
      "Discontinue resuscitation efforts immediately.",
    ],
    explanation:
      "'No Shock Advised' indicates a non-shockable rhythm (Asystole or PEA). The rescuer must immediately resume CPR starting with chest compressions and investigate reversible causes (4 Hs & 4 Ts).",
    guidelineReference: "2025 AHA Guidelines for CPR and ECC — Cardiac Arrest Algorithm",
  },
  {
    id: "REVIVE-CPR-11",
    curriculumTopic: "Reversible Causes: The 4 Hs",
    scenario: "A post-operative patient experiences pulseless cardiac arrest. The clinical team systematically reviews potentially reversible causes under the 4 Hs framework.",
    questionStem: "Which of the following sets correctly reflects the 4 Hs of reversible cardiac arrest causes?",
    correctOption: "Hypovolemia, Hypoxia, Hydrogen ion (Acidosis), Hypo/Hyperkalemia (and Hypothermia).",
    distractors: [
      "Hypertension, Hyperglycemia, Hypercalcemia, Hypervolemia.",
      "Head trauma, Hemorrhage, Hepatic failure, Hyperlipidemia.",
      "Hypotension, Hydrocephalus, Hypoplasia, Hyperthyroidism.",
    ],
    explanation:
      "The 4 Hs represent reversible physiological causes of arrest: Hypovolemia, Hypoxia, Hydrogen ion (Acidosis), Hypo/Hyperkalemia, and Hypothermia.",
    guidelineReference: "2025 AHA Guidelines for CPR and ECC — Reversible Causes",
  },
  {
    id: "REVIVE-CPR-12",
    curriculumTopic: "Reversible Causes: The 4 Ts",
    scenario: "During arrest resuscitation of a trauma patient, unilateral absent breath sounds, tracheal deviation, and jugular venous distension are observed.",
    questionStem: "Under the 4 Ts framework of reversible causes, which pathology is strongly suggested?",
    correctOption: "Tension Pneumothorax.",
    distractors: [
      "Toxic Ingestion.",
      "Coronary Thrombosis.",
      "Cardiac Tamponade without pulmonary involvement.",
    ],
    explanation:
      "Unilateral absent breath sounds, hypotension, tracheal deviation, and JVD are classic signs of Tension Pneumothorax, requiring immediate needle decompression / thoracostomy.",
    guidelineReference: "2025 AHA Guidelines for CPR and ECC — Trauma Arrest Considerations",
  },
  {
    id: "REVIVE-CPR-13",
    curriculumTopic: "Resuscitation Team Leadership",
    scenario: "Multiple healthcare providers are responding to a code call in the emergency department.",
    questionStem: "What is the primary role of the designated Resuscitation Team Leader?",
    correctOption: "To oversee the entire resuscitation, assign clear roles, monitor CPR quality metrics, and maintain global situational awareness.",
    distractors: [
      "To perform continuous manual chest compressions while giving orders.",
      "To manage only the recording sheet and avoid clinical intervention.",
      "To establish intravenous access exclusively before directing team actions.",
    ],
    explanation:
      "The team leader coordinates the resuscitation, maintains global situational awareness, ensures high-quality CPR metrics, directs medication delivery, and avoids procedural fixation.",
    guidelineReference: "2025 AHA Guidelines for CPR and ECC — High-Performance Teams",
  },
  {
    id: "REVIVE-CPR-14",
    curriculumTopic: "Closed-Loop Communication",
    scenario: "The team leader instructs the medication nurse: 'Administer Epinephrine 1 milligram intravenous push now.'",
    questionStem: "Which response by the medication nurse demonstrates effective closed-loop communication?",
    correctOption: "'Understood, preparing 1 milligram of Epinephrine IV push now.' followed by verbal confirmation once delivered.",
    distractors: [
      "A silent head nod without verbal verification.",
      "'I will give some cardiac medications shortly.'",
      "'Are you sure that medication is indicated for this patient?'",
    ],
    explanation:
      "Closed-loop communication requires the recipient to verbally repeat the specific medication and dose ordered, verify when it is administered, and confirm task completion to prevent medical errors.",
    guidelineReference: "2025 AHA Guidelines for CPR and ECC — Team Communication",
  },
  {
    id: "REVIVE-CPR-15",
    curriculumTopic: "Compressor Fatigue & Scheduled Rotation",
    scenario: "Chest compression quality typically deteriorates unnoticed due to rescuer fatigue after only a few minutes.",
    questionStem: "How frequently should chest compressors rotate roles during adult cardiac resuscitation?",
    correctOption: "Every 2 minutes (or after 5 cycles of 30:2 compressions), or sooner if the compressor reports fatigue.",
    distractors: [
      "Every 10 minutes to allow adequate rest intervals.",
      "Only after spontaneous circulation is confirmed by ECG.",
      "Only when the compressor explicitly asks to be relieved.",
    ],
    explanation:
      "Rescuer fatigue significantly impairs compression depth after 1–2 minutes, even if the rescuer does not perceive fatigue. Rotating compressors every 2 minutes maintains optimal compression quality.",
    guidelineReference: "2025 AHA Guidelines for CPR and ECC — Adult BLS",
  },
  {
    id: "REVIVE-CPR-16",
    curriculumTopic: "Pediatric Chest Compression Depth",
    scenario: "A 5-year-old child collapses and is found pulseless and not breathing normally.",
    questionStem: "What is the recommended chest compression depth for a child (age 1 year to puberty)?",
    correctOption: "At least one third the anterior-posterior diameter of the chest, approximately 2 inches (5 cm).",
    distractors: [
      "Approximately 1 inch (2.5 cm).",
      "At least 3 inches (7.5 cm) to compensate for pediatric rib elasticity.",
      "Compression depth equal to that of an adult (at least 2.4 inches / 6 cm).",
    ],
    explanation:
      "In children (age 1 year to puberty), compress at least one third the anterior-posterior diameter of the chest, which corresponds to approximately 2 inches (5 cm).",
    guidelineReference: "2025 AHA Guidelines for CPR and ECC — Pediatric Basic Life Support",
  },
  {
    id: "REVIVE-CPR-17",
    curriculumTopic: "Agonal Gasps & Decision to Initiate CPR",
    scenario: "A 54-year-old man collapses in a hospital corridor. He is unresponsive and has occasional gasping breaths. A healthcare professional cannot confidently identify a carotid pulse within 10 seconds.",
    questionStem: "What is the most appropriate next action?",
    correctOption: "Begin chest compressions immediately.",
    distractors: [
      "Continue pulse assessment for another 20 seconds.",
      "Provide rescue breaths without compressions.",
      "Place him in the recovery position.",
    ],
    explanation:
      "Agonal gasps are not normal breathing and frequently accompany cardiac arrest. If a definite pulse cannot be identified within 10 seconds, do not delay—assume cardiac arrest and start chest compressions immediately.",
    guidelineReference: "2025 AHA Guidelines for CPR and ECC — Adult BLS",
  },
  {
    id: "REVIVE-CPR-18",
    curriculumTopic: "Chest Compression Fraction (CCF)",
    scenario: "During two-rescuer CPR, the chest compression fraction is calculated as 0.58.",
    questionStem: "Which intervention would most directly improve this parameter?",
    correctOption: "Minimize pauses during ventilation, rhythm checks and rescuer changes.",
    distractors: [
      "Increase compression depth to 7 cm.",
      "Increase the ventilation rate.",
      "Perform pulse checks after every compression cycle.",
    ],
    explanation:
      "Chest compression fraction (CCF) is the proportion of total resuscitation time spent delivering compressions (target >= 80%). The most direct method to increase CCF is minimizing interruptions during pauses for ventilation, pad application, and compressor switches.",
    guidelineReference: "2025 AHA Guidelines for CPR and ECC — High-Quality CPR",
  },
  {
    id: "REVIVE-CPR-19",
    curriculumTopic: "Post-Shock Immediate Action",
    scenario: "A patient in ventricular fibrillation receives a shock from a biphasic defibrillator.",
    questionStem: "What should the team do immediately afterward?",
    correctOption: "Resume chest compressions immediately.",
    distractors: [
      "Check the carotid pulse.",
      "Reassess the rhythm for 20 seconds.",
      "Administer epinephrine before resuming compressions.",
    ],
    explanation:
      "Immediately resume CPR after a shock, generally for 2 minutes before the next scheduled rhythm assessment. Do not delay compressions for a routine pulse check.",
    guidelineReference: "2025 AHA Guidelines for CPR and ECC — Adult ACLS",
  },
  {
    id: "REVIVE-CPR-20",
    curriculumTopic: "Pediatric Two-Rescuer CPR Ratio",
    scenario: "A 6-year-old child develops cardiac arrest from severe respiratory failure. Two trained healthcare rescuers are present, and no advanced airway is in place.",
    questionStem: "What compression-to-ventilation ratio is appropriate?",
    correctOption: "15 compressions to 2 ventilations.",
    distractors: [
      "30 compressions to 2 ventilations.",
      "10 compressions to 1 ventilation.",
      "Continuous compressions with one breath every 6 seconds.",
    ],
    explanation:
      "For two healthcare rescuers performing pediatric CPR without an advanced airway, the compression-to-ventilation ratio is 15:2 (and 30:2 for a single rescuer).",
    guidelineReference: "2025 AHA Guidelines for CPR and ECC — Pediatric Basic Life Support",
  },
  {
    id: "REVIVE-CPR-21",
    curriculumTopic: "Pediatric Bradycardia with Poor Perfusion",
    scenario: "A 4-year-old child is unresponsive, has a pulse of 50/min and has signs of poor perfusion despite effective oxygenation and ventilation.",
    questionStem: "What is the next step?",
    correctOption: "Begin chest compressions.",
    distractors: [
      "Observe for another 2 minutes.",
      "Give atropine routinely before compressions.",
      "Deliver an unsynchronized shock.",
    ],
    explanation:
      "In infants and children, start chest compressions for a heart rate below 60/min with poor perfusion despite effective oxygenation and ventilation.",
    guidelineReference: "2025 AHA Guidelines for CPR and ECC — Pediatric Advanced Life Support",
  },
  {
    id: "REVIVE-CPR-22",
    curriculumTopic: "Infant Two-Rescuer Compression Technique",
    scenario: "During infant CPR, two trained healthcare rescuers are available.",
    questionStem: "Which compression technique is preferred?",
    correctOption: "Two-thumb encircling-hands technique.",
    distractors: [
      "Two fingertips over the lower sternum.",
      "One palm over the xiphoid process.",
      "Alternating palm compressions over the abdomen.",
    ],
    explanation:
      "The two-thumb encircling-hands technique is preferred for two-rescuer infant CPR. Current guidance emphasizes effective compression and discourages ineffective two-finger techniques.",
    guidelineReference: "2025 AHA Guidelines for CPR and ECC — Pediatric Basic Life Support",
  },
  {
    id: "REVIVE-CPR-23",
    curriculumTopic: "AED Arrival Coordination",
    scenario: "An adult patient has a witnessed collapse, and an AED is brought to the scene while CPR is in progress.",
    questionStem: "What is the best approach?",
    correctOption: "Continue compressions while pads are attached, pausing only when required for analysis and shock.",
    distractors: [
      "Stop CPR while the AED is unpacked.",
      "Complete five CPR cycles before attaching the AED.",
      "Check the pulse again before applying AED pads.",
    ],
    explanation:
      "Early defibrillation is critical. Continue compressions during AED preparation and pad placement when feasible, minimizing interruptions.",
    guidelineReference: "2025 AHA Guidelines for CPR and ECC — Adult BLS",
  },
  {
    id: "REVIVE-CPR-24",
    curriculumTopic: "End-Tidal CO2 & Possible ROSC",
    scenario: "During adult CPR, the patient has an advanced airway and an abrupt sustained increase in end-tidal CO2 from 12 to 38 mmHg.",
    questionStem: "What should the team suspect?",
    correctOption: "Possible return of spontaneous circulation.",
    distractors: [
      "Definite endotracheal tube displacement.",
      "Sudden deterioration in perfusion.",
      "Immediate need for increased compression rate.",
    ],
    explanation:
      "An abrupt sustained rise in ETCO2 (typically >= 35–40 mmHg) may indicate return of spontaneous circulation (ROSC). Confirm with clinical assessment at an appropriate pause; ETCO2 alone does not establish ROSC.",
    guidelineReference: "2025 AHA Guidelines for CPR and ECC — ACLS Monitoring",
  },
  {
    id: "REVIVE-CPR-25",
    curriculumTopic: "Pediatric Epinephrine Dosing",
    scenario: "During CPR for a 9-year-old child weighing 25 kg, which initial IV/IO epinephrine dose is appropriate?",
    questionStem: "What is the correct initial epinephrine dose?",
    correctOption: "0.25 mg.",
    distractors: [
      "0.025 mg.",
      "1 mg.",
      "2.5 mg.",
    ],
    explanation:
      "The standard pediatric IV/IO cardiac-arrest epinephrine dose is 0.01 mg/kg (0.1 mL/kg of 1:10,000), which equals 0.25 mg for a 25 kg child, repeated every 3–5 minutes.",
    guidelineReference: "2025 AHA Guidelines for CPR and ECC — PALS Pharmacology",
  },
  {
    id: "REVIVE-CPR-26",
    curriculumTopic: "Hyperventilation Hemodynamic Consequences",
    scenario: "During adult CPR, the rescuer providing bag-mask ventilation delivers large, rapid breaths, causing obvious chest overexpansion.",
    questionStem: "What is the most important physiological concern?",
    correctOption: "Increased intrathoracic pressure reducing venous return and cardiac output.",
    distractors: [
      "Increased coronary venous return.",
      "Reduced intrathoracic pressure.",
      "Improved cerebral perfusion.",
    ],
    explanation:
      "Excessive ventilation increases intrathoracic pressure, impairs venous return to the heart, and reduces coronary and cerebral perfusion during CPR.",
    guidelineReference: "2025 AHA Guidelines for CPR and ECC — Adult ACLS",
  },

  // --------------------------------------------------------------------------
  // FOREIGN-BODY AIRWAY OBSTRUCTION (CHOKING) — 2025 AHA GUIDELINES
  // --------------------------------------------------------------------------
  {
    id: "REVIVE-CHK-01",
    curriculumTopic: "Responsive Adult Severe Choking (2025 Guidelines)",
    scenario: "A conscious 45-year-old suddenly chokes on food. He cannot speak, cough effectively or breathe.",
    questionStem: "What is the recommended response?",
    correctOption: "Alternate five back blows with five abdominal thrusts.",
    distractors: [
      "Encourage him to drink water.",
      "Give repeated blind finger sweeps.",
      "Immediately begin chest compressions while he is standing.",
    ],
    explanation:
      "For severe foreign-body airway obstruction in a conscious adult, current 2025 AHA guidance recommends cycles of five back blows and five abdominal thrusts until relief or unresponsiveness.",
    guidelineReference: "2025 AHA Guidelines for CPR and ECC — Foreign-Body Airway Obstruction",
  },
  {
    id: "REVIVE-CHK-02",
    curriculumTopic: "Responsive Infant Severe Choking",
    scenario: "A 10-month-old infant develops severe choking while eating. He is conscious but unable to cry or cough effectively.",
    questionStem: "What is the best intervention?",
    correctOption: "Alternate five back blows and five chest thrusts.",
    distractors: [
      "Five abdominal thrusts followed by five back blows.",
      "Perform blind finger sweeps.",
      "Start chest compressions immediately despite consciousness.",
    ],
    explanation:
      "In a conscious infant with severe obstruction, alternate five back blows and five chest thrusts. Abdominal thrusts are contraindicated in infants due to organ laceration risk.",
    guidelineReference: "2025 AHA Guidelines for CPR and ECC — Pediatric Airway Emergencies",
  },
  {
    id: "REVIVE-CHK-03",
    curriculumTopic: "Mild Airway Obstruction & Effective Coughing",
    scenario: "A 3-year-old child is coughing forcefully after swallowing a piece of fruit. He remains alert, with effective air movement.",
    questionStem: "What should be done?",
    correctOption: "Encourage coughing and monitor closely.",
    distractors: [
      "Immediately deliver abdominal thrusts.",
      "Perform five back blows regardless of cough effectiveness.",
      "Sweep the mouth with a finger.",
    ],
    explanation:
      "Effective coughing indicates that air movement is present. Encourage spontaneous coughing and monitor closely for progression to severe obstruction without interfering.",
    guidelineReference: "2025 AHA Guidelines for CPR and ECC — Foreign-Body Airway Obstruction",
  },
  {
    id: "REVIVE-CHK-04",
    curriculumTopic: "Unresponsive Choking Patient Protocol",
    scenario: "A conscious adult with severe choking becomes unresponsive despite attempted obstruction-relief maneuvers.",
    questionStem: "What should the rescuer do next?",
    correctOption: "Begin CPR starting with chest compressions.",
    distractors: [
      "Continue abdominal thrusts in the standing position.",
      "Perform repeated blind finger sweeps.",
      "Provide only rescue breaths until the object moves.",
    ],
    explanation:
      "Once a choking victim becomes unresponsive, lower them to a firm surface and begin CPR starting with chest compressions. Look for a visible object when opening the airway for breaths and remove it only if seen.",
    guidelineReference: "2025 AHA Guidelines for CPR and ECC — Adult BLS",
  },
  {
    id: "REVIVE-CHK-05",
    curriculumTopic: "Airway Inspection & Avoiding Blind Sweeps",
    scenario: "During CPR for an unresponsive choking child, the rescuer sees a piece of food clearly visible in the mouth when opening the airway.",
    questionStem: "What is the correct action?",
    correctOption: "Remove the visible object carefully.",
    distractors: [
      "Push the object deeper to permit ventilation.",
      "Ignore the object and continue breaths.",
      "Perform repeated blind finger sweeps.",
    ],
    explanation:
      "A clearly visible foreign body may be removed carefully. Blind finger sweeps should always be avoided because they can push the object deeper and cause pharyngeal trauma.",
    guidelineReference: "2025 AHA Guidelines for CPR and ECC — Pediatric Basic Life Support",
  },
  {
    id: "REVIVE-CHK-06",
    curriculumTopic: "Choking in Late Pregnancy or Inability for Abdominal Thrusts",
    scenario: "A woman in late pregnancy develops severe choking and cannot speak or breathe.",
    questionStem: "Which technique is preferred?",
    correctOption: "Chest thrusts, with back blows as recommended in the obstruction-relief sequence.",
    distractors: [
      "Abdominal thrusts over the uterine fundus.",
      "Head-down positioning with abdominal pressure.",
      "Rescue breaths without attempting obstruction relief.",
    ],
    explanation:
      "When abdominal thrusts are unsuitable, as in advanced pregnancy or marked obesity, use chest thrusts. Current adult guidance includes back blows in the severe-obstruction sequence.",
    guidelineReference: "2025 AHA Guidelines for CPR and ECC — Foreign-Body Airway Obstruction",
  },
  {
    id: "REVIVE-CHK-07",
    curriculumTopic: "Post-Obstruction Relief Assessment",
    scenario: "A 7-year-old develops severe choking. After obstruction-relief maneuvers, he begins breathing and speaking normally.",
    questionStem: "What is the most appropriate next step?",
    correctOption: "Assess for persistent symptoms or injury and arrange appropriate medical evaluation.",
    distractors: [
      "Automatically start CPR.",
      "Give water immediately to test swallowing.",
      "Perform a blind finger sweep to ensure the airway is clear.",
    ],
    explanation:
      "After successful obstruction relief, reassess breathing and clinical symptoms. Persistent cough, wheeze, stridor, swallowing difficulty or concerns regarding internal thrust injury warrant formal medical evaluation.",
    guidelineReference: "2025 AHA Guidelines for CPR and ECC — Post-Event Evaluation",
  },
  {
    id: "REVIVE-CHK-08",
    curriculumTopic: "Ventilation Failure in Unresponsive Choking",
    scenario: "During attempted ventilation of an unresponsive choking victim, the first breath does not produce visible chest rise.",
    questionStem: "What should the rescuer do?",
    correctOption: "Reposition the airway and attempt a second breath, then resume compressions.",
    distractors: [
      "Give increasingly forceful breaths.",
      "Stop CPR permanently.",
      "Perform an immediate blind finger sweep.",
    ],
    explanation:
      "Reposition the airway (head-tilt chin-lift) and attempt a second breath. Avoid prolonged interruptions; resume chest compressions immediately and inspect for a visible object when opening the airway.",
    guidelineReference: "2025 AHA Guidelines for CPR and ECC — Adult BLS",
  },
];

// ============================================================================
// RANDOMIZATION ENGINE WITH BALANCED 5-5-5-5 OPTION DISTRIBUTION
// ============================================================================

/**
 * Modern Fisher-Yates array shuffle.
 */
function fisherYatesShuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export interface GeneratedAssessmentAttempt {
  attemptId: string;
  attemptToken: string; // HMAC-signed payload encapsulating the answer key & explanations
  clientQuestions: ClientAssessmentQuestion[];
  // Internal mapping for server evaluation (never sent bare to client)
  answerKey: Record<string, "A" | "B" | "C" | "D">;
  explanations: Record<string, string>;
}

const ASSESSMENT_SECRET =
  process.env.SESSION_SECRET ||
  process.env.LEARNER_JWT_SECRET ||
  "mbbs-foundation-revive-assessment-signing-secret-v1";

/**
 * Creates an HMAC-SHA256 signature for the attempt payload.
 */
export function signAttemptPayload(payload: {
  attemptId: string;
  key: Record<string, "A" | "B" | "C" | "D">;
  explanations: Record<string, string>;
  expiresAt: number;
}): string {
  const serialized = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", ASSESSMENT_SECRET)
    .update(serialized)
    .digest("base64url");
  return `${serialized}.${signature}`;
}

/**
 * Verifies and decodes an HMAC-SHA256 attempt payload.
 */
export function verifyAttemptPayload(token: string): {
  valid: boolean;
  payload?: {
    attemptId: string;
    key: Record<string, "A" | "B" | "C" | "D">;
    explanations: Record<string, string>;
    expiresAt: number;
  };
  error?: string;
} {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) {
      return { valid: false, error: "MALFORMED_TOKEN" };
    }
    const [serialized, signature] = parts;
    const expectedSig = crypto
      .createHmac("sha256", ASSESSMENT_SECRET)
      .update(serialized)
      .digest("base64url");

    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
      return { valid: false, error: "INVALID_SIGNATURE" };
    }

    const payload = JSON.parse(Buffer.from(serialized, "base64url").toString("utf-8"));
    if (Date.now() > payload.expiresAt) {
      return { valid: false, error: "TOKEN_EXPIRED" };
    }

    return { valid: true, payload };
  } catch (err) {
    return { valid: false, error: "DECODE_ERROR" };
  }
}

/**
 * Generates a randomized assessment attempt satisfying all Phase 6B requirements:
 * 1. Exactly 20 distinct questions selected from the 34-question pool.
 * 2. Randomized question order (1..20).
 * 3. Randomized options for each question.
 * 4. Exactly 5 correct answers assigned to letter 'A', 5 to 'B', 5 to 'C', and 5 to 'D'.
 * 5. Correct answer mapping securely preserved and signed via HMAC.
 */
export function generateRandomizedAssessmentAttempt(
  masterQuestions: MasterAssessmentQuestion[] = REVIVE_MASTER_QUESTIONS
): GeneratedAssessmentAttempt {
  if (masterQuestions.length < 20) {
    throw new Error("Master question bank must contain at least 20 questions");
  }

  // 1. Randomly sample 20 distinct questions without replacement
  const shuffledPool = fisherYatesShuffle(masterQuestions);
  const selectedQuestions = shuffledPool.slice(0, 20);

  // 2. Prepare target balanced correct letter distribution: Exactly 5 A, 5 B, 5 C, 5 D
  const targetLetters: Array<"A" | "B" | "C" | "D"> = [
    "A", "A", "A", "A", "A",
    "B", "B", "B", "B", "B",
    "C", "C", "C", "C", "C",
    "D", "D", "D", "D", "D",
  ];
  // Shuffle the target letters so their distribution across positions 1..20 is random
  const randomizedTargetLetters = fisherYatesShuffle(targetLetters);

  const attemptId = `att_${Date.now()}_${crypto.randomBytes(6).toString("hex")}`;
  const answerKey: Record<string, "A" | "B" | "C" | "D"> = {};
  const explanations: Record<string, string> = {};
  const clientQuestions: ClientAssessmentQuestion[] = [];

  const ALL_LETTERS: Array<"A" | "B" | "C" | "D"> = ["A", "B", "C", "D"];

  for (let i = 0; i < selectedQuestions.length; i++) {
    const q = selectedQuestions[i];
    const assignedCorrectLetter = randomizedTargetLetters[i];

    // Distractors (3 strings)
    const shuffledDistractors = fisherYatesShuffle(q.distractors);

    // Remaining letters for distractors
    const remainingLetters = ALL_LETTERS.filter((l) => l !== assignedCorrectLetter);

    // Build the 4 display options
    const optionsMap: Record<"A" | "B" | "C" | "D", string> = {
      [assignedCorrectLetter]: q.correctOption,
      [remainingLetters[0]]: shuffledDistractors[0],
      [remainingLetters[1]]: shuffledDistractors[1],
      [remainingLetters[2]]: shuffledDistractors[2],
    } as Record<"A" | "B" | "C" | "D", string>;

    const options: DisplayOption[] = ALL_LETTERS.map((letter) => ({
      id: letter,
      text: optionsMap[letter],
    }));

    answerKey[q.id] = assignedCorrectLetter;
    explanations[q.id] = q.explanation;

    clientQuestions.push({
      id: q.id,
      questionNumber: i + 1,
      curriculumTopic: q.curriculumTopic,
      scenario: q.scenario,
      questionStem: q.questionStem,
      options,
    });
  }

  // Generate HMAC attempt token (valid for 3 hours)
  const attemptToken = signAttemptPayload({
    attemptId,
    key: answerKey,
    explanations,
    expiresAt: Date.now() + 3 * 60 * 60 * 1000,
  });

  return {
    attemptId,
    attemptToken,
    clientQuestions,
    answerKey,
    explanations,
  };
}

/**
 * Evaluates learner answers against an attempt's verified answer key.
 */
export function evaluateAttemptAnswers(
  submittedAnswers: Record<string, "A" | "B" | "C" | "D">,
  answerKey: Record<string, "A" | "B" | "C" | "D">,
  explanations: Record<string, string>,
  clientQuestions: ClientAssessmentQuestion[]
): AssessmentEvaluationResult {
  let score = 0;
  let unanswered = 0;

  const questionResults: QuestionEvaluationResult[] = clientQuestions.map((q) => {
    const selected = submittedAnswers[q.id] || null;
    const correct = answerKey[q.id];
    const isCorrect = selected !== null && selected === correct;

    if (!selected) {
      unanswered++;
    } else if (isCorrect) {
      score++;
    }

    return {
      questionId: q.id,
      questionNumber: q.questionNumber,
      selectedOption: selected,
      correctOption: correct,
      isCorrect,
      explanation: explanations[q.id] || "",
    };
  });

  const total = clientQuestions.length;
  const percentage = Math.round((score / total) * 100);
  const passed = score >= REVIVE_ASSESSMENT_CONFIG.passingThresholdScore; // >= 14 (70%)

  return {
    score,
    totalQuestions: total,
    percentage,
    passed,
    passingThresholdScore: REVIVE_ASSESSMENT_CONFIG.passingThresholdScore,
    passingThresholdPct: REVIVE_ASSESSMENT_CONFIG.passingThresholdPct,
    unansweredCount: unanswered,
    questionResults,
  };
}
