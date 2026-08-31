import { prisma } from "../prisma";
import {
  CounsellingSeatCategory,
  CounsellingManagementType,
  CounsellingAuthorityType,
  CounsellingRoundType,
  Prisma,
} from "../generated/prisma/client";

export const CALCULATION_VERSION = "mcc-r1-2026-v1";

export type RankPositionClassification =
  | "STRONG_HISTORICAL_POSITION"
  | "WITHIN_TYPICAL_R1_RANGE"
  | "STRETCH_WITHIN_OBSERVED_R1"
  | "BEYOND_OBSERVED_R1_RANGE"
  | "INSUFFICIENT_DATA";

export type StatePoolConfidence = "HIGH" | "MODERATE" | "LOW";

export interface DistributionStatistics {
  sampleSize: number;
  bestAIR: number | null;
  q1AIR: number | null;
  medianAIR: number | null;
  q3AIR: number | null;
  highestAIR: number | null;
}

export interface SeatMatrixAllotmentAnalytics {
  seatsOffered: number;
  seatsAllotted: number;
  matrixGap: number; // Derived observation: seatsOffered - seatsAllotted (NEVER called R2 vacancy)
  fillRate: number;
}

export interface StatePoolCalculation {
  collegeId: string;
  collegeName: string;
  state: string;
  managementType: CounsellingManagementType;
  isINI: boolean;
  totalApprovedSeats: number;
  mccSeatsOffered: number;
  approxPoolSeats: number | null;
  poolLabel: string;
  dataConfidence: StatePoolConfidence;
}

export interface CapacityExpansionSignal {
  approvedSeats: number;
  renewedSeats: number | null;
  increasedSeats: number | null;
  isNewEstablishment: boolean;
  hasSeatIncrease2026: boolean;
  seatIncrease2026: number;
  isNewEstablishment2026: boolean;
}

export interface GeneralStudentOpenProfile {
  collegeId: string;
  collegeName: string;
  quota: string;
  allottedCategory: CounsellingSeatCategory;
  candidateCategory: CounsellingSeatCategory;
  isPwD: boolean;
  sampleSize: number;
  bestAIR: number | null;
  q1AIR: number | null;
  medianAIR: number | null;
  q3AIR: number | null;
  highestAIR: number | null;
  reservedCandidatesAllottedUnderOpenCount: number;
}

/**
 * Deterministic Linear Interpolation Percentile: index = p * (N - 1)
 * Exactly reproduces established reference calculations (NumPy/Pandas linear method).
 */
export function calculatePercentile(sortedValues: number[], p: number): number {
  if (sortedValues.length === 0) return 0;
  if (sortedValues.length === 1) return sortedValues[0];

  const index = p * (sortedValues.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;

  if (lower === upper) return sortedValues[lower];
  return sortedValues[lower] * (1 - weight) + sortedValues[upper] * weight;
}

/**
 * Computes descriptive distribution statistics for an array of AIR ranks.
 */
export function computeDistributionStatistics(ranks: number[]): DistributionStatistics {
  if (ranks.length === 0) {
    return {
      sampleSize: 0,
      bestAIR: null,
      q1AIR: null,
      medianAIR: null,
      q3AIR: null,
      highestAIR: null,
    };
  }

  const sorted = [...ranks].sort((a, b) => a - b);
  return {
    sampleSize: sorted.length,
    bestAIR: sorted[0],
    q1AIR: calculatePercentile(sorted, 0.25),
    medianAIR: calculatePercentile(sorted, 0.5),
    q3AIR: calculatePercentile(sorted, 0.75),
    highestAIR: sorted[sorted.length - 1],
  };
}

/**
 * Pure reusable rank position classification function.
 * Evaluates a candidate's AIR against historical Round-1 quartile boundaries.
 * (Historical position indicator only — NOT an admission probability).
 */
export function getRankPositionClassification(
  studentAIR: number,
  q1AIR: number | null,
  q3AIR: number | null,
  highestAIR: number | null
): RankPositionClassification {
  if (
    q1AIR === null ||
    q3AIR === null ||
    highestAIR === null ||
    isNaN(studentAIR) ||
    studentAIR <= 0
  ) {
    return "INSUFFICIENT_DATA";
  }

  if (studentAIR <= q1AIR) {
    return "STRONG_HISTORICAL_POSITION";
  }
  if (studentAIR <= q3AIR) {
    return "WITHIN_TYPICAL_R1_RANGE";
  }
  if (studentAIR <= highestAIR) {
    return "STRETCH_WITHIN_OBSERVED_R1";
  }
  return "BEYOND_OBSERVED_R1_RANGE";
}

/**
 * Derives 2026 Capacity Expansion Signals from annual capacity data.
 */
export function computeCapacityExpansionSignals(
  capacity: {
    approvedSeats: number;
    renewedSeats: number | null;
    increasedSeats: number | null;
    isNewEstablishment: boolean;
  } | null
): CapacityExpansionSignal {
  if (!capacity) {
    return {
      approvedSeats: 0,
      renewedSeats: null,
      increasedSeats: null,
      isNewEstablishment: false,
      hasSeatIncrease2026: false,
      seatIncrease2026: 0,
      isNewEstablishment2026: false,
    };
  }

  const seatIncrease = (capacity.increasedSeats && capacity.increasedSeats > 0)
    ? capacity.increasedSeats
    : (capacity.isNewEstablishment ? capacity.approvedSeats : 0);

  return {
    approvedSeats: capacity.approvedSeats,
    renewedSeats: capacity.renewedSeats,
    increasedSeats: capacity.increasedSeats,
    isNewEstablishment: capacity.isNewEstablishment,
    hasSeatIncrease2026: seatIncrease > 0 || capacity.isNewEstablishment,
    seatIncrease2026: seatIncrease,
    isNewEstablishment2026: capacity.isNewEstablishment,
  };
}

/**
 * Calculates Approximate State / Non-MCC Capacity Pool.
 * Adheres strictly to domain classification rules:
 * - INIs: No artificial state pool.
 * - Government Colleges: "Approx. state-counselling pool" = ApprovedSeats - Actual MCC Seats Offered.
 * - Private Colleges: "Approx. Non-MCC Pool" = Total Capacity - MCC Seats Offered.
 */
export function computeStateCapacityPool(
  college: {
    id: string;
    collegeName: string;
    state: string;
    managementType: CounsellingManagementType;
    isINI: boolean;
    isCentralUniversity?: boolean;
    isESIC?: boolean;
    isDeemed?: boolean;
  },
  totalApprovedSeats: number,
  mccSeatsOffered: number
): StatePoolCalculation {
  if (college.isINI) {
    return {
      collegeId: college.id,
      collegeName: college.collegeName,
      state: college.state,
      managementType: college.managementType,
      isINI: true,
      totalApprovedSeats,
      mccSeatsOffered,
      approxPoolSeats: null,
      poolLabel: "N/A (Institutes of National Importance have 100% MCC/National Allotment)",
      dataConfidence: "HIGH",
    };
  }

  if (college.managementType === CounsellingManagementType.GOVERNMENT) {
    const approxPool = Math.max(0, totalApprovedSeats - mccSeatsOffered);
    let dataConfidence: StatePoolConfidence = "HIGH";

    if (college.isCentralUniversity || college.isESIC) {
      dataConfidence = "MODERATE";
    }

    return {
      collegeId: college.id,
      collegeName: college.collegeName,
      state: college.state,
      managementType: college.managementType,
      isINI: false,
      totalApprovedSeats,
      mccSeatsOffered,
      approxPoolSeats: approxPool,
      poolLabel: "Approx. state-counselling pool",
      dataConfidence,
    };
  }

  // Private / Deemed / Trust Institutions
  const approxPool = Math.max(0, totalApprovedSeats - mccSeatsOffered);
  return {
    collegeId: college.id,
    collegeName: college.collegeName,
    state: college.state,
    managementType: college.managementType,
    isINI: false,
    totalApprovedSeats,
    mccSeatsOffered,
    approxPoolSeats: approxPool,
    poolLabel: "Approx. Non-MCC Pool",
    dataConfidence: "LOW",
  };
}

/**
 * Service to compute "General Student Open Profile" (unreserved candidates allotted open seats)
 * as well as tracking reserved category candidates obtaining Open Merit seats.
 */
export async function getGeneralStudentOpenProfile(
  collegeId: string,
  quota: string,
  roundId: string
): Promise<GeneralStudentOpenProfile | null> {
  const allotments = await prisma.allotmentRecord.findMany({
    where: {
      collegeId,
      quota,
      roundId,
      allottedCategory: CounsellingSeatCategory.OPEN,
      allottedPwD: false,
    },
    select: {
      candidateRank: true,
      candidateCategory: true,
      candidatePwD: true,
    },
  });

  if (allotments.length === 0) return null;

  const college = await prisma.college.findUnique({
    where: { id: collegeId },
    select: { collegeName: true },
  });

  const generalOnlyRanks: number[] = [];
  let reservedInOpenCount = 0;

  allotments.forEach((a) => {
    if (a.candidateCategory === CounsellingSeatCategory.OPEN && !a.candidatePwD) {
      generalOnlyRanks.push(a.candidateRank);
    } else {
      reservedInOpenCount++;
    }
  });

  const stats = computeDistributionStatistics(generalOnlyRanks);

  return {
    collegeId,
    collegeName: college?.collegeName || "",
    quota,
    allottedCategory: CounsellingSeatCategory.OPEN,
    candidateCategory: CounsellingSeatCategory.OPEN,
    isPwD: false,
    sampleSize: stats.sampleSize,
    bestAIR: stats.bestAIR,
    q1AIR: stats.q1AIR,
    medianAIR: stats.medianAIR,
    q3AIR: stats.q3AIR,
    highestAIR: stats.highestAIR,
    reservedCandidatesAllottedUnderOpenCount: reservedInOpenCount,
  };
}

/**
 * Computes all AnalyticsSnapshot entries from ACTIVE database records.
 */
export async function generateAnalyticsSnapshotRecords(
  academicYear: number = 2026,
  roundType: CounsellingRoundType = CounsellingRoundType.ROUND_1,
  authorityType: CounsellingAuthorityType = CounsellingAuthorityType.MCC,
  calculationVersion: string = CALCULATION_VERSION
) {
  // 1. Fetch active Round
  const round = await prisma.counsellingRound.findFirst({
    where: {
      academicYear,
      roundType,
      authority: { authorityType },
    },
  });

  if (!round) {
    throw new Error(`Active round not found for ${academicYear} ${roundType} ${authorityType}`);
  }

  // 2. Fetch all SeatMatrixRecords for this round
  const seatMatrices = await prisma.seatMatrixRecord.findMany({
    where: { roundId: round.id },
    include: { college: true },
  });

  // 3. Fetch all AllotmentRecords for this round
  const allotments = await prisma.allotmentRecord.findMany({
    where: { roundId: round.id },
  });

  // Index allotments by `collegeId||quota||allottedCategory||allottedPwD`
  const allotGroup = new Map<string, number[]>();
  allotments.forEach((a) => {
    const key = `${a.collegeId}||${a.quota}||${a.allottedCategory}||${a.allottedPwD}`;
    if (!allotGroup.has(key)) allotGroup.set(key, []);
    allotGroup.get(key)!.push(a.candidateRank);
  });

  // 4. Build snapshot data objects for every seat matrix cell
  const snapshotDataList: Prisma.AnalyticsSnapshotCreateManyInput[] = [];

  for (const sm of seatMatrices) {
    const key = `${sm.collegeId}||${sm.quota}||${sm.seatCategory}||${sm.isPwD}`;
    const ranks = allotGroup.get(key) || [];
    ranks.sort((a, b) => a - b);

    const stats = computeDistributionStatistics(ranks);
    const seatsOffered = sm.seatCount;
    const seatsAllotted = ranks.length;
    const matrixGap = seatsOffered - seatsAllotted;
    const fillRate = seatsOffered > 0 ? seatsAllotted / seatsOffered : 0;

    snapshotDataList.push({
      roundId: round.id,
      authorityId: round.authorityId,
      collegeId: sm.collegeId,
      quota: sm.quota,
      seatCategory: sm.seatCategory,
      isPwD: sm.isPwD,
      specialPathway: null,
      seatsOffered,
      seatsAllotted,
      matrixGap,
      fillRate,
      sampleSize: stats.sampleSize,
      bestAIR: stats.bestAIR,
      q1AIR: stats.q1AIR,
      medianAIR: stats.medianAIR,
      q3AIR: stats.q3AIR,
      highestAIR: stats.highestAIR,
      calculationVersion,
    });
  }

  return {
    round,
    snapshotDataList,
    totalOffered: snapshotDataList.reduce((acc, s) => acc + (s.seatsOffered || 0), 0),
    totalAllotted: snapshotDataList.reduce((acc, s) => acc + (s.seatsAllotted || 0), 0),
    totalGap: snapshotDataList.reduce((acc, s) => acc + (s.matrixGap || 0), 0),
  };
}
