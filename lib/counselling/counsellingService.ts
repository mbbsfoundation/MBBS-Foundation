import { prisma } from "../prisma";
import {
  CounsellingSeatCategory,
  CounsellingManagementType,
  CounsellingRoundType,
  CounsellingAuthorityType,
} from "../generated/prisma/client";
import {
  CALCULATION_VERSION,
  RankPositionClassification,
  StatePoolConfidence,
  getRankPositionClassification,
  computeStateCapacityPool,
  computeCapacityExpansionSignals,
} from "./analyticsEngine";

// ==========================================
// 1. Types & Interfaces
// ==========================================

export type StudentGoal = "GET_SEAT" | "UPGRADE" | "COMPARE" | "RETAIN";

export interface SpecialPathwayEligibility {
  isNRI?: boolean;
  isMinority?: boolean;
  minorityType?: "MUSLIM" | "JAIN" | "OTHER";
  isESI?: boolean;
  isCW?: boolean; // Children/Widows of Armed Forces Personnel
  isInternalDU?: boolean;
  isInternalIPU?: boolean;
  isInternalPuducherry?: boolean;
  isAMUInternal?: boolean;
}

/**
 * Transient student input profile.
 * NEVER persisted to the database.
 */
export interface StudentCounsellingProfile {
  air: number;
  category: CounsellingSeatCategory; // OPEN, OBC, EWS, SC, ST
  isPwD: boolean;
  domicileState: string;
  gender?: string;
  currentCollegeId?: string;
  currentQuota?: string;
  currentSeatCategory?: string;
  goal: StudentGoal;
  specialPathwayEligibility?: SpecialPathwayEligibility;
}

export type CounsellingRoute = "MCC" | "STATE_ESTIMATE";
export type CounsellingDataStatus = "R1_INFORMED" | "CAPACITY_ESTIMATE" | "OFFICIAL_R2";

/**
 * Structured evidence result representing factual observations for one college/pathway.
 * NOTE: Does NOT assign final opportunity bands (STRONG/REALISTIC/STRETCH/LOW_EVIDENCE) in Sequence 5A.
 */
export interface CollegeCounsellingEvidence {
  collegeId: string;
  collegeName: string;
  shortName: string | null;
  state: string;
  managementType: CounsellingManagementType;
  instituteType: string | null;
  isINI: boolean;
  isDeemed: boolean;
  isCentralUniversity: boolean;
  isESIC: boolean;

  route: CounsellingRoute;
  quota: string;
  seatCategory: CounsellingSeatCategory;
  isPwD: boolean;
  specialPathway: string | null;

  // Round-1 Matrix & Allotment Factuals
  seatsOfferedR1: number;
  seatsAllottedR1: number;
  observedR1Gap: number; // Factual difference: seatsOffered - seatsAllotted (NEVER called R2 vacancy)
  fillRate: number;

  // Historical Distribution Statistics
  sampleSize: number;
  bestAIR: number | null;
  q1AIR: number | null;
  medianAIR: number | null;
  q3AIR: number | null;
  highestAIR: number | null;

  // Descriptive Rank Position
  rankPositionClassification: RankPositionClassification;

  // 2026 Capacity Expansion Signals
  approvedSeats2026: number;
  seatIncrease2026: number;
  isNewEstablishment2026: boolean;

  // Approximate State / Non-MCC Pool Estimates
  estimatedPool: number | null;
  estimatedPoolLabel: string;
  dataConfidence: StatePoolConfidence;

  // Data Lineage & Reason Flags
  dataStatus: CounsellingDataStatus;
  reasonFlags: string[];
}

export interface EvidenceFilterParams {
  state?: string;
  managementType?: CounsellingManagementType;
  route?: CounsellingRoute;
  quota?: string;
  category?: CounsellingSeatCategory;
  isPwD?: boolean;
  hasSeatIncrease2026?: boolean;
  isNewEstablishment2026?: boolean;
  rankPositions?: RankPositionClassification[];
  includeSpecialPathways?: boolean;
}

export interface CollegeSearchParams {
  query?: string;
  state?: string;
  managementType?: CounsellingManagementType;
  isINI?: boolean;
  isDeemed?: boolean;
  isCentralUniversity?: boolean;
  isESIC?: boolean;
  isNewEstablishment?: boolean;
  limit?: number;
  offset?: number;
}

// Special Quota Names that require explicit student eligibility verification
const SPECIAL_QUOTA_NAMES = new Set([
  "NRI",
  "NRI-AMU",
  "Muslim Minority",
  "Jain Minority Quota",
  "ESI",
  "Delhi NCR CW",
  "Foreign Country Quota",
  "Internal -Puducherry",
  "Delhi University Quota",
  "IP University Quota",
  "AMU Quota",
]);

// ==========================================
// 2. Core Service Implementation
// ==========================================

/**
 * Retrieves a canonical College by ID with its aliases, capacities, and active snapshots.
 */
export async function getCollegeById(collegeId: string) {
  return prisma.college.findUnique({
    where: { id: collegeId },
    include: {
      aliases: true,
      capacities: {
        where: { academicYear: 2026 },
      },
      analyticsSnapshots: {
        where: { calculationVersion: CALCULATION_VERSION },
      },
    },
  });
}

/**
 * Searches and lists colleges based on institutional attributes.
 */
export async function searchColleges(params: CollegeSearchParams = {}) {
  const {
    query,
    state,
    managementType,
    isINI,
    isDeemed,
    isCentralUniversity,
    isESIC,
    isNewEstablishment,
    limit = 50,
    offset = 0,
  } = params;

  const where: any = { isActive: true };

  if (query && query.trim().length > 0) {
    const q = query.trim();
    where.OR = [
      { collegeName: { contains: q, mode: "insensitive" } },
      { shortName: { contains: q, mode: "insensitive" } },
      { state: { contains: q, mode: "insensitive" } },
      { nmcCollegeCode: { contains: q, mode: "insensitive" } },
      { mccInstituteCode: { contains: q, mode: "insensitive" } },
    ];
  }

  if (state) where.state = { equals: state, mode: "insensitive" };
  if (managementType) where.managementType = managementType;
  if (isINI !== undefined) where.isINI = isINI;
  if (isDeemed !== undefined) where.isDeemed = isDeemed;
  if (isCentralUniversity !== undefined) where.isCentralUniversity = isCentralUniversity;
  if (isESIC !== undefined) where.isESIC = isESIC;

  if (isNewEstablishment !== undefined) {
    where.capacities = {
      some: {
        academicYear: 2026,
        isNewEstablishment,
      },
    };
  }

  const [total, colleges] = await Promise.all([
    prisma.college.count({ where }),
    prisma.college.findMany({
      where,
      include: {
        capacities: { where: { academicYear: 2026 } },
      },
      orderBy: [{ state: "asc" }, { collegeName: "asc" }],
      take: limit,
      skip: offset,
    }),
  ]);

  return { total, colleges, limit, offset };
}

/**
 * Evaluates whether a student is eligible for a specific quota pathway.
 */
function evaluateQuotaEligibility(
  quota: string,
  profile: StudentCounsellingProfile,
  collegeState: string
): { isEligible: boolean; reason: string } {
  // Ordinary Quotas accessible to all candidates nationwide
  if (quota === "All India" || quota === "Open Seat Quota" || quota === "Self-Financed Merit") {
    return { isEligible: true, reason: "ORDINARY_MERIT_POOL" };
  }

  const sp = profile.specialPathwayEligibility || {};

  switch (quota) {
    case "NRI":
      return sp.isNRI
        ? { isEligible: true, reason: "NRI_DOCUMENTED" }
        : { isEligible: false, reason: "ELIGIBILITY_UNKNOWN" };

    case "Muslim Minority":
      return sp.isMinority && sp.minorityType === "MUSLIM"
        ? { isEligible: true, reason: "MUSLIM_MINORITY_DOCUMENTED" }
        : { isEligible: false, reason: "ELIGIBILITY_UNKNOWN" };

    case "Jain Minority Quota":
      return sp.isMinority && sp.minorityType === "JAIN"
        ? { isEligible: true, reason: "JAIN_MINORITY_DOCUMENTED" }
        : { isEligible: false, reason: "ELIGIBILITY_UNKNOWN" };

    case "ESI":
      return sp.isESI
        ? { isEligible: true, reason: "ESI_IP_WARD_DOCUMENTED" }
        : { isEligible: false, reason: "ELIGIBILITY_UNKNOWN" };

    case "Delhi NCR CW":
      return sp.isCW
        ? { isEligible: true, reason: "DEFENCE_CW_DOCUMENTED" }
        : { isEligible: false, reason: "ELIGIBILITY_UNKNOWN" };

    case "Delhi University Quota":
      return sp.isInternalDU === true
        ? { isEligible: true, reason: "DU_INTERNAL_ELIGIBLE" }
        : { isEligible: false, reason: "ELIGIBILITY_UNKNOWN" };

    case "IP University Quota":
      return sp.isInternalIPU === true
        ? { isEligible: true, reason: "IPU_INTERNAL_ELIGIBLE" }
        : { isEligible: false, reason: "ELIGIBILITY_UNKNOWN" };

    case "Internal -Puducherry":
      return sp.isInternalPuducherry === true
        ? { isEligible: true, reason: "PUDUCHERRY_DOMICILE_ELIGIBLE" }
        : { isEligible: false, reason: "ELIGIBILITY_UNKNOWN" };

    case "AMU Quota":
      return sp.isAMUInternal === true
        ? { isEligible: true, reason: "AMU_INTERNAL_DOCUMENTED" }
        : { isEligible: false, reason: "ELIGIBILITY_UNKNOWN" };

    case "NRI-AMU":
      return sp.isNRI === true && sp.isAMUInternal === true
        ? { isEligible: true, reason: "NRI_AMU_DOCUMENTED" }
        : { isEligible: false, reason: "ELIGIBILITY_UNKNOWN" };

    case "Foreign Country Quota":
      return { isEligible: false, reason: "FOREIGN_NATIONALS_ONLY" };

    default:
      return { isEligible: false, reason: "SPECIAL_INSTITUTIONAL_PATHWAY" };
  }
}

/**
 * Retrieves full MCC Counselling Evidence for a student profile across all participating colleges.
 */
export async function getMccEvidenceForStudent(
  profile: StudentCounsellingProfile,
  filters: EvidenceFilterParams = {}
): Promise<CollegeCounsellingEvidence[]> {
  // Determine snapshot query condition based on Category and PwD horizontal reservation:
  // 1. Non-PwD candidate:
  //    - OPEN: OPEN non-PwD
  //    - Reserved (OBC/EWS/SC/ST): Candidate Category non-PwD AND OPEN non-PwD (Open Merit)
  // 2. PwD candidate (Horizontal reservation):
  //    - OPEN PwD: OPEN non-PwD (Ordinary Merit) AND OPEN PwD (Reserved PwD)
  //    - Reserved PwD (OBC/EWS/SC/ST):
  //      * Candidate Category non-PwD (Category Merit)
  //      * OPEN non-PwD (Open Merit)
  //      * Candidate Category PwD (Category PwD Reserved)
  //      * OPEN PwD (Open PwD Reserved)
  const whereCondition: any = {
    calculationVersion: CALCULATION_VERSION,
  };

  if (!profile.isPwD) {
    whereCondition.isPwD = false;
    if (profile.category === CounsellingSeatCategory.OPEN) {
      whereCondition.seatCategory = CounsellingSeatCategory.OPEN;
    } else {
      whereCondition.seatCategory = { in: [profile.category, CounsellingSeatCategory.OPEN] };
    }
  } else {
    // PwD Student
    if (profile.category === CounsellingSeatCategory.OPEN) {
      whereCondition.seatCategory = CounsellingSeatCategory.OPEN;
      // Both isPwD: true and isPwD: false are fetched
    } else {
      whereCondition.seatCategory = { in: [profile.category, CounsellingSeatCategory.OPEN] };
      // Both isPwD: true and isPwD: false for both categories are fetched
    }
  }

  // Fetch all active snapshots matching target categories and PwD status
  const snapshots = await prisma.analyticsSnapshot.findMany({
    where: whereCondition,
    include: {
      college: {
        include: {
          capacities: { where: { academicYear: 2026 } },
        },
      },
    },
  });

  const evidenceList: CollegeCounsellingEvidence[] = [];

  for (const snap of snapshots) {
    const col = snap.college;
    const capacityRecord = col.capacities[0] || null;
    const expansion = computeCapacityExpansionSignals(capacityRecord);

    // Evaluate special quota eligibility
    const { isEligible, reason } = evaluateQuotaEligibility(snap.quota, profile, col.state);
    if (!isEligible && !filters.includeSpecialPathways) {
      continue;
    }

    const reasonFlags: string[] = [reason];

    // Add transparent pathway classification flags
    if (snap.isPwD) {
      reasonFlags.push("PWD_RESERVED_PATHWAY");
      if (profile.category !== CounsellingSeatCategory.OPEN && snap.seatCategory === CounsellingSeatCategory.OPEN) {
        reasonFlags.push("OPEN_PWD_MERIT_PATHWAY");
      }
    } else {
      // Non-PwD snapshot
      if (snap.seatCategory === CounsellingSeatCategory.OPEN) {
        if (profile.category === CounsellingSeatCategory.OPEN) {
          reasonFlags.push("ORDINARY_MERIT_PATHWAY");
        } else {
          reasonFlags.push("OPEN_MERIT_PATHWAY");
        }
      } else if (snap.seatCategory === profile.category) {
        reasonFlags.push("CATEGORY_PATHWAY");
      }
    }

    if (expansion.hasSeatIncrease2026) {
      reasonFlags.push("CAPACITY_INCREASE_2026");
    }
    if (expansion.isNewEstablishment2026) {
      reasonFlags.push("NEW_INSTITUTION_2026");
    }

    const rankClassification = getRankPositionClassification(
      profile.air,
      snap.q1AIR,
      snap.q3AIR,
      snap.highestAIR
    );

    // Compute approximate state pool
    const statePool = computeStateCapacityPool(
      col,
      expansion.approvedSeats,
      snap.seatsOffered
    );

    const evidence: CollegeCounsellingEvidence = {
      collegeId: col.id,
      collegeName: col.collegeName,
      shortName: col.shortName,
      state: col.state,
      managementType: col.managementType,
      instituteType: col.instituteType,
      isINI: col.isINI,
      isDeemed: col.isDeemed,
      isCentralUniversity: col.isCentralUniversity,
      isESIC: col.isESIC,

      route: "MCC",
      quota: snap.quota,
      seatCategory: snap.seatCategory,
      isPwD: snap.isPwD,
      specialPathway: snap.specialPathway,

      seatsOfferedR1: snap.seatsOffered,
      seatsAllottedR1: snap.seatsAllotted,
      observedR1Gap: snap.matrixGap,
      fillRate: snap.fillRate,

      sampleSize: snap.sampleSize,
      bestAIR: snap.bestAIR,
      q1AIR: snap.q1AIR,
      medianAIR: snap.medianAIR,
      q3AIR: snap.q3AIR,
      highestAIR: snap.highestAIR,

      rankPositionClassification: rankClassification,

      approvedSeats2026: expansion.approvedSeats,
      seatIncrease2026: expansion.seatIncrease2026,
      isNewEstablishment2026: expansion.isNewEstablishment2026,

      estimatedPool: statePool.approxPoolSeats,
      estimatedPoolLabel: statePool.poolLabel,
      dataConfidence: statePool.dataConfidence,

      dataStatus: "R1_INFORMED",
      reasonFlags,
    };

    // Apply filters if present
    if (filters.state && evidence.state.toLowerCase() !== filters.state.toLowerCase()) continue;
    if (filters.managementType && evidence.managementType !== filters.managementType) continue;
    if (filters.quota && evidence.quota !== filters.quota) continue;
    if (filters.category && evidence.seatCategory !== filters.category) continue;
    if (filters.hasSeatIncrease2026 && !expansion.hasSeatIncrease2026) continue;
    if (filters.isNewEstablishment2026 && !expansion.isNewEstablishment2026) continue;
    if (filters.rankPositions && !filters.rankPositions.includes(rankClassification)) continue;

    evidenceList.push(evidence);
  }

  // Sort evidence deterministically
  return sortEvidenceList(evidenceList, profile.air);
}

/**
 * Retrieves State/Non-MCC Capacity Evidence for a student (focusing on domicile state or all states).
 */
export async function getStateCapacityEvidenceForStudent(
  profile: StudentCounsellingProfile,
  filters: EvidenceFilterParams = {}
): Promise<CollegeCounsellingEvidence[]> {
  const where: any = {
    isActive: true,
    isINI: false, // INIs have no state pools
  };

  if (filters.state) {
    where.state = { equals: filters.state, mode: "insensitive" };
  } else if (profile.domicileState) {
    where.state = { equals: profile.domicileState, mode: "insensitive" };
  }

  if (filters.managementType) where.managementType = filters.managementType;

  const colleges = await prisma.college.findMany({
    where,
    include: {
      capacities: { where: { academicYear: 2026 } },
      seatMatrixRecords: {
        where: { isOfficial: true },
      },
    },
    orderBy: [{ state: "asc" }, { collegeName: "asc" }],
  });

  const evidenceList: CollegeCounsellingEvidence[] = [];

  for (const col of colleges) {
    const capacityRecord = col.capacities[0] || null;
    const expansion = computeCapacityExpansionSignals(capacityRecord);
    const mccSeatsOffered = col.seatMatrixRecords.reduce((acc, sm) => acc + sm.seatCount, 0);

    const statePool = computeStateCapacityPool(col, expansion.approvedSeats, mccSeatsOffered);
    if (statePool.approxPoolSeats === null || statePool.approxPoolSeats <= 0) continue;

    const reasonFlags = ["STATE_CAPACITY_ESTIMATE"];
    if (col.state.toLowerCase() === profile.domicileState.toLowerCase()) {
      reasonFlags.push("HOME_STATE_DOMICILE");
    }
    if (expansion.hasSeatIncrease2026) {
      reasonFlags.push("CAPACITY_INCREASE_2026");
    }

    const evidence: CollegeCounsellingEvidence = {
      collegeId: col.id,
      collegeName: col.collegeName,
      shortName: col.shortName,
      state: col.state,
      managementType: col.managementType,
      instituteType: col.instituteType,
      isINI: col.isINI,
      isDeemed: col.isDeemed,
      isCentralUniversity: col.isCentralUniversity,
      isESIC: col.isESIC,

      route: "STATE_ESTIMATE",
      quota: col.managementType === CounsellingManagementType.GOVERNMENT ? "State Quota (Est.)" : "Non-MCC Pool (Est.)",
      seatCategory: profile.category,
      isPwD: profile.isPwD,
      specialPathway: null,

      seatsOfferedR1: 0,
      seatsAllottedR1: 0,
      observedR1Gap: 0,
      fillRate: 0,

      // State AIR distributions are NOT available from MCC Round 1
      sampleSize: 0,
      bestAIR: null,
      q1AIR: null,
      medianAIR: null,
      q3AIR: null,
      highestAIR: null,

      rankPositionClassification: "INSUFFICIENT_DATA",

      approvedSeats2026: expansion.approvedSeats,
      seatIncrease2026: expansion.seatIncrease2026,
      isNewEstablishment2026: expansion.isNewEstablishment2026,

      estimatedPool: statePool.approxPoolSeats,
      estimatedPoolLabel: statePool.poolLabel,
      dataConfidence: statePool.dataConfidence,

      dataStatus: "CAPACITY_ESTIMATE",
      reasonFlags,
    };

    if (filters.hasSeatIncrease2026 && !expansion.hasSeatIncrease2026) continue;
    if (filters.isNewEstablishment2026 && !expansion.isNewEstablishment2026) continue;

    evidenceList.push(evidence);
  }

  return evidenceList;
}

/**
 * Unified Counselling Evidence Retrieval for a student profile combining MCC R1 and State Estimates.
 */
export async function getCounsellingEvidenceForStudent(
  profile: StudentCounsellingProfile,
  filters: EvidenceFilterParams = {}
): Promise<{
  profile: StudentCounsellingProfile;
  totalMccRecords: number;
  totalStateEstimateRecords: number;
  evidence: CollegeCounsellingEvidence[];
}> {
  const [mccEvidence, stateEvidence] = await Promise.all([
    filters.route === "STATE_ESTIMATE" ? [] : getMccEvidenceForStudent(profile, filters),
    filters.route === "MCC" ? [] : getStateCapacityEvidenceForStudent(profile, filters),
  ]);

  const combined = [...mccEvidence, ...stateEvidence];

  return {
    profile,
    totalMccRecords: mccEvidence.length,
    totalStateEstimateRecords: stateEvidence.length,
    evidence: combined,
  };
}

/**
 * Transparent, deterministic evidence sorting.
 * Prioritizes:
 * 1. Historical Rank Relevance (Strong Position > Within Typical Range > Stretch > Beyond Range > Insufficient Data)
 * 2. Route (MCC R1 Informed > State Capacity Estimate)
 * 3. Distance from Student AIR (closest median/q3 AIR)
 * 4. Sample Size
 */
function sortEvidenceList(
  items: CollegeCounsellingEvidence[],
  studentAIR: number
): CollegeCounsellingEvidence[] {
  const rankWeight: Record<RankPositionClassification, number> = {
    STRONG_HISTORICAL_POSITION: 1,
    WITHIN_TYPICAL_R1_RANGE: 2,
    STRETCH_WITHIN_OBSERVED_R1: 3,
    BEYOND_OBSERVED_R1_RANGE: 4,
    INSUFFICIENT_DATA: 5,
  };

  return [...items].sort((a, b) => {
    // 1. Historical position band weight
    const wA = rankWeight[a.rankPositionClassification];
    const wB = rankWeight[b.rankPositionClassification];
    if (wA !== wB) return wA - wB;

    // 2. Median AIR proximity to student AIR
    if (a.medianAIR !== null && b.medianAIR !== null) {
      const diffA = Math.abs(a.medianAIR - studentAIR);
      const diffB = Math.abs(b.medianAIR - studentAIR);
      if (diffA !== diffB) return diffA - diffB;
    }

    // 3. Sample Size descending
    if (b.sampleSize !== a.sampleSize) {
      return b.sampleSize - a.sampleSize;
    }

    // 4. Alphabetical tie-break
    return a.collegeName.localeCompare(b.collegeName);
  });
}
