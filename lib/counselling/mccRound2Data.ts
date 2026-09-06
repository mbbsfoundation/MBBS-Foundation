export type Round2DataStatus = "UPDATING" | "VERIFIED" | "ARCHIVED";

export type OfficialUpdateType = "NOTICE" | "SCHEDULE" | "SEAT_MATRIX" | "ADVISORY";

export interface Round2Metadata {
  counsellingYear: number;
  round: string;
  roundTitle: string;
  lastUpdated: string;
  dataAsOf: string;
  sourceName: string;
  sourceUrl: string;
  dataStatus: Round2DataStatus;
  statusMessage: string;
}

export interface OfficialNoticeItem {
  id: string;
  title: string;
  date: string;
  type: OfficialUpdateType;
  officialUrl?: string;
  shortDescription: string;
}

export interface ScheduleItem {
  id: string;
  label: string;
  dateDisplay: string;
  status: "UPCOMING" | "ACTIVE" | "CONCLUDED" | "UPDATING";
  note?: string;
}

export interface NewlyAddedCollegeItem {
  code: string;
  name: string;
  state: string;
  instituteType: string;
  quota: string;
  mbbsSeats: number;
}

export interface VacancyDatasetSummary {
  status: "AVAILABLE" | "UPDATING";
  sourceDocument: string;
  sourceTitle: string;
  totalDocumentSeats: number; // Across MBBS + BDS + B.Sc Nursing
  mbbsSeats: number; // MBBS only
  mbbsInstitutionsCount: number;
  mbbsStatesCount: number;
  bdsSeats: number;
  bscNursingSeats: number;
  aiqGovtMbbsSeats?: number;
  deemedMbbsSeats?: number;
  aiimsMbbsSeats?: number;
  centralIniMbbsSeats?: number;
  keyInstitutions?: NewlyAddedCollegeItem[];
  officialDefinition: string;
  practicalMeaning: string;
  cautionaryAdvisory: string;
}

export interface DecisionPathway {
  id: "no-r1-seat" | "upgrade-r1-seat" | "revise-choice-list";
  tag: string;
  heading: string;
  summary: string;
  guidancePoints: string[];
  primaryCta: {
    label: string;
    href: string;
    analyticsEvent: string;
  };
  secondaryCta?: {
    label: string;
    href: string;
    analyticsEvent: string;
  };
}

export interface MccRound2Dataset {
  metadata: Round2Metadata;
  notices: OfficialNoticeItem[];
  schedule: ScheduleItem[];
  newlyAddedSeats: VacancyDatasetSummary;
  clearVacancies: VacancyDatasetSummary;
  virtualVacancies: VacancyDatasetSummary;
  decisionPathways: DecisionPathway[];
}

/**
 * Authoritative, verified MCC Round 2 Dataset for NEET UG 2026.
 *
 * Source Documents Parsed and Normalized:
 * - mcc_round2_newly_added_seats_2026.pdf (6 pages -> 61 rows, 659 total seats, 395 MBBS seats across 8 colleges)
 * - mcc_round2_clear_vacancy_2026.pdf (190 pages -> 2,476 rows, 11,302 total seats, 9,870 MBBS seats across 518 colleges)
 * - mcc_round2_virtual_vacancy_2026.pdf (261 pages -> 2,349 rows, 12,283 total seats, 10,900 MBBS seats across 513 colleges)
 *
 * NOTE: MBBS totals are strictly segregated from BDS and B.Sc Nursing.
 * Newly Added, Clear Vacancies, and Virtual Vacancies remain strictly distinct.
 */
export const MCC_ROUND_2_DATA: MccRound2Dataset = {
  metadata: {
    counsellingYear: 2026,
    round: "Round 2",
    roundTitle: "MCC Round 2 Decision Centre — NEET UG 2026",
    lastUpdated: "September 2026",
    dataAsOf: "Official MCC Round-2 Seat Matrix & Vacancy Releases",
    sourceName: "Medical Counselling Committee (MCC)",
    sourceUrl: "https://mcc.nic.in",
    dataStatus: "VERIFIED",
    statusMessage: "Official MCC Round 2 seat matrix & vacancy datasets verified.",
  },

  notices: [
    {
      id: "mcc-r2-seat-matrix-notice",
      title: "MCC Round 2 Seat Matrix & Vacancy Lists Published",
      date: "September 2026",
      type: "SEAT_MATRIX",
      officialUrl: "https://mcc.nic.in",
      shortDescription:
        "Official publication of Newly Added Seats (659 seats total / 395 MBBS), Clear Vacancies (11,302 seats / 9,870 MBBS), and Virtual Vacancies (12,283 seats / 10,900 MBBS) across AIQ, Deemed, Central, and AIIMS.",
    },
    {
      id: "mcc-r2-registration-choice-notice",
      title: "Round 2 Registration & Choice Filling Window Active",
      date: "September 2026",
      type: "NOTICE",
      officialUrl: "https://mcc.nic.in",
      shortDescription:
        "Fresh registration open for un-registered candidates; registered Round-1 candidates who did not get a seat or opted for upgradation can fill and re-order choices.",
    },
    {
      id: "mcc-r2-upgrade-advisory",
      title: "MCC Advisory on Round-2 Upgradation & Seat Surrender",
      date: "September 2026",
      type: "ADVISORY",
      officialUrl: "https://mcc.nic.in",
      shortDescription:
        "Candidates allotted a seat in Round 2 via upgradation will automatically forfeit their Round-1 seat with no claim to reverse. Only submit choices genuinely preferred over your current seat.",
    },
  ],

  schedule: [
    {
      id: "sch-r2-matrix",
      label: "Verification of Seat Matrix & Vacancies",
      dateDisplay: "Verified & Published",
      status: "CONCLUDED",
      note: "Official PDFs released on mcc.nic.in",
    },
    {
      id: "sch-r2-registration",
      label: "Round 2 Fresh Registration & Payment",
      dateDisplay: "Active Window",
      status: "ACTIVE",
      note: "Mandatory for new candidates; not required for already registered R1 candidates",
    },
    {
      id: "sch-r2-choice-filling",
      label: "Round 2 Choice Filling & Locking",
      dateDisplay: "Active Window",
      status: "ACTIVE",
      note: "Submit fresh choice list; choices not locked will auto-lock at deadline",
    },
    {
      id: "sch-r2-processing",
      label: "Processing of Seat Allotment",
      dateDisplay: "Post Choice Locking",
      status: "UPCOMING",
      note: "MCC centralized computerized merit algorithm",
    },
    {
      id: "sch-r2-result",
      label: "Round 2 Allotment Result Declaration",
      dateDisplay: "As per MCC Timeline",
      status: "UPCOMING",
      note: "Provisional followed by Final Allotment Letter",
    },
    {
      id: "sch-r2-reporting",
      label: "Physical Reporting & Document Verification",
      dateDisplay: "As per MCC Timeline",
      status: "UPCOMING",
      note: "Reporting at allotted medical college with original certificates",
    },
  ],

  newlyAddedSeats: {
    status: "AVAILABLE",
    sourceDocument: "mcc_round2_newly_added_seats_2026.pdf",
    sourceTitle:
      "NEWLY ADDED SEATS ROUND 2 (MBBS BDS B.SC NURSING) – UG COUNSELLING 2026",
    totalDocumentSeats: 659,
    mbbsSeats: 395,
    mbbsInstitutionsCount: 8,
    mbbsStatesCount: 6,
    bdsSeats: 125,
    bscNursingSeats: 139,
    officialDefinition:
      "Seats newly included by MCC/NMC in the counselling matrix for Round 2 that were not part of the Round 1 seat matrix.",
    practicalMeaning:
      "These seats create completely new admission possibilities. Government AIQ seats were added in Arunachal Pradesh, Assam, and Uttar Pradesh, along with Deemed university seats in Tamil Nadu, Puducherry, and Uttarakhand.",
    cautionaryAdvisory:
      "Thoroughly verify clinical bed occupancy, hospital patient load, recognition status, fee structures, and bond rules before placing newly added colleges high on your list.",
    keyInstitutions: [
      {
        code: "200439",
        name: "Tomo Riba Institute of Health & Medical Sciences, Naharlagun",
        state: "Arunachal Pradesh",
        instituteType: "All India except Central University",
        quota: "All India Quota (AIQ)",
        mbbsSeats: 15,
      },
      {
        code: "904769",
        name: "Bongaigaon Medical College, Bongaigaon",
        state: "Assam",
        instituteType: "All India except Central University",
        quota: "All India Quota (AIQ)",
        mbbsSeats: 15,
      },
      {
        code: "902862",
        name: "Autonomous State Medical College and Hospital, Lakhimpur Kheri",
        state: "Uttar Pradesh",
        instituteType: "All India except Central University",
        quota: "All India Quota (AIQ)",
        mbbsSeats: 15,
      },
      {
        code: "904766",
        name: "Karpaga Vinayaga Institute of Medical Sciences, Maduranthagam",
        state: "Tamil Nadu",
        instituteType: "Deemed University",
        quota: "Self-Financed Merit Seat",
        mbbsSeats: 150,
      },
      {
        code: "200377",
        name: "Aarupadai Veedu Medical College, Pondicherry",
        state: "Puducherry",
        instituteType: "Deemed University",
        quota: "Self-Financed Merit Seat",
        mbbsSeats: 50,
      },
      {
        code: "904745",
        name: "Dhanalakshmi Srinivasan Institute of Medical Sciences, Perambalur",
        state: "Tamil Nadu",
        instituteType: "Deemed University",
        quota: "Self-Financed Merit Seat",
        mbbsSeats: 50,
      },
      {
        code: "902804",
        name: "J R Medical College and Hospital, Villupuram",
        state: "Tamil Nadu",
        instituteType: "Deemed University",
        quota: "Self-Financed Merit Seat",
        mbbsSeats: 50,
      },
      {
        code: "902812",
        name: "Graphic Era Institute of Medical Sciences, Dehradun",
        state: "Uttarakhand",
        instituteType: "Deemed University",
        quota: "Self-Financed Merit (42) / NRI (8)",
        mbbsSeats: 50,
      },
    ],
  },

  clearVacancies: {
    status: "AVAILABLE",
    sourceDocument: "mcc_round2_clear_vacancy_2026.pdf",
    sourceTitle:
      "CLEAR VACANCY ROUND 2 (MBBS BDS B.SC NURSING) – UG COUNSELLING 2026",
    totalDocumentSeats: 11302,
    mbbsSeats: 9870,
    mbbsInstitutionsCount: 518,
    mbbsStatesCount: 34,
    bdsSeats: 1121,
    bscNursingSeats: 311,
    aiqGovtMbbsSeats: 4623,
    deemedMbbsSeats: 4908,
    aiimsMbbsSeats: 179,
    centralIniMbbsSeats: 160,
    officialDefinition:
      "Seats that remain completely vacant because they were unallotted in Round 1 or vacated by candidates who exercised Free Exit / non-joining.",
    practicalMeaning:
      "These 9,870 MBBS clear vacancies are guaranteed to be available for fresh allotment in Round 2 to any eligible candidate meeting the rank cutoff.",
    cautionaryAdvisory:
      "Clear vacancies at high-demand colleges will see intense competition from all rank bands. Do not assume a clear vacancy means lower cutoff.",
  },

  virtualVacancies: {
    status: "AVAILABLE",
    sourceDocument: "mcc_round2_virtual_vacancy_2026.pdf",
    sourceTitle:
      "VIRTUAL VACANCY ROUND 2 (MBBS BDS B.SC NURSING) – UG COUNSELLING 2026",
    totalDocumentSeats: 12283,
    mbbsSeats: 10900,
    mbbsInstitutionsCount: 513,
    mbbsStatesCount: 33,
    bdsSeats: 1246,
    bscNursingSeats: 137,
    aiqGovtMbbsSeats: 3927,
    deemedMbbsSeats: 4975,
    aiimsMbbsSeats: 1208,
    centralIniMbbsSeats: 790,
    officialDefinition:
      "Seats currently occupied by Round-1 admitted candidates who submitted willingness for 'Upgradation' during reporting.",
    practicalMeaning:
      "A virtual vacancy becomes available for allotment ONLY IF the candidate currently holding it receives an upgrade to a higher-preference seat in Round 2.",
    cautionaryAdvisory:
      "Never base your choice list entirely on virtual vacancies. If the holding candidates do not upgrade, their virtual seats will not open up.",
  },

  decisionPathways: [
    {
      id: "no-r1-seat",
      tag: "PATHWAY A",
      heading: "I did not get a seat in Round 1",
      summary:
        "Explore new opportunities, vacancies and colleges relevant to your rank and preferences.",
      guidancePoints: [
        "Include a broad, realistic range of medical colleges across All India Quota and State counselling.",
        "Use actual Round-1 allotment ranges around your AIR as a baseline reference.",
        "Do not restrict your choice list to only top-tier institutions if your rank falls in a competitive band.",
      ],
      primaryCta: {
        label: "Explore Options by AIR",
        href: "/neet-to-mbbs/counselling/round-2-planner",
        analyticsEvent: "r2_pathway_a_planner_click",
      },
      secondaryCta: {
        label: "How to Choose a Medical College",
        href: "/neet-to-mbbs/choosing-a-medical-college",
        analyticsEvent: "r2_pathway_a_college_choice_click",
      },
    },
    {
      id: "upgrade-r1-seat",
      tag: "PATHWAY B",
      heading: "I have a Round 1 seat and am considering an upgrade",
      summary:
        "A newly available college is not automatically a better choice. Compare your present seat against possible upgrade options before changing your preference.",
      guidancePoints: [
        "If upgraded in Round 2, your Round 1 seat is automatically cancelled and allotted to someone else—you cannot return to it.",
        "List ONLY colleges that are genuinely superior in clinical exposure, location, fees, or bond terms compared to your current seat.",
        "Compare patient bed occupancy, 5.5-year real cost, and service bonds side-by-side.",
      ],
      primaryCta: {
        label: "Compare Current Seat with Upgrade Options",
        href: "/neet-to-mbbs/toolkit#college-comparison",
        analyticsEvent: "r2_pathway_b_comparator_click",
      },
      secondaryCta: {
        label: "Explore Colleges by AIR",
        href: "/neet-to-mbbs/counselling/round-2-planner",
        analyticsEvent: "r2_pathway_b_planner_click",
      },
    },
    {
      id: "revise-choice-list",
      tag: "PATHWAY C",
      heading: "I am revising my choice list",
      summary:
        "Choice order should reflect where you genuinely prefer to study, not simply where you think you may get a seat.",
      guidancePoints: [
        "The allotment software evaluates choices sequentially from Choice #1 downwards.",
        "Putting a dream college at #1 does not harm your chances for safe choices placed lower down.",
        "Never invert choices based on speculative cutoffs—always prioritize genuine merit and personal preference.",
      ],
      primaryCta: {
        label: "How to Choose a Medical College",
        href: "/neet-to-mbbs/choosing-a-medical-college",
        analyticsEvent: "r2_pathway_c_college_choice_click",
      },
      secondaryCta: {
        label: "Open Counselling Planner",
        href: "/neet-to-mbbs/counselling/round-2-planner",
        analyticsEvent: "r2_pathway_c_planner_click",
      },
    },
  ],
};
