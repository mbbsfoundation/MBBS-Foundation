import {
  CounsellingSeatCategory,
  CounsellingManagementType,
} from "../generated/prisma/client";
import {
  RankPositionClassification,
  StatePoolConfidence,
} from "./analyticsEngine";
import {
  StudentCounsellingProfile,
  CollegeCounsellingEvidence,
  CounsellingRoute,
  CounsellingDataStatus,
  getCounsellingEvidenceForStudent,
  EvidenceFilterParams,
} from "./counsellingService";

// ==========================================
// 1. Types & Enums
// ==========================================

export type OpportunityBand =
  | "STRONG"
  | "REALISTIC"
  | "STRETCH"
  | "LOW_EVIDENCE";

export type EvidenceConfidenceLevel = "HIGH" | "MODERATE" | "LOW";

export interface CounsellingRecommendation {
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

  opportunityBand: OpportunityBand;
  evidenceConfidence: EvidenceConfidenceLevel;
  rankPositionClassification: RankPositionClassification;

  studentAIR: number;
  sampleSize: number;
  bestAIR: number | null;
  q1AIR: number | null;
  medianAIR: number | null;
  q3AIR: number | null;
  highestAIR: number | null;

  seatsOfferedR1: number;
  seatsAllottedR1: number;
  observedR1Gap: number;
  fillRate: number;

  approvedSeats2026: number;
  seatIncrease2026: number;
  isNewEstablishment2026: boolean;

  estimatedPool: number | null;
  estimatedPoolLabel: string;

  dataStatus: CounsellingDataStatus;
  reasonCodes: string[];
  reasonSummary: string;
}

export interface RecommendationFilterParams extends EvidenceFilterParams {
  opportunityBands?: OpportunityBand[];
  confidenceLevels?: EvidenceConfidenceLevel[];
}

// ==========================================
// 2. Pure Helper Functions
// ==========================================

/**
 * Derives the Evidence Confidence Level based on sample size and data route.
 */
export function deriveEvidenceConfidence(evidence: CollegeCounsellingEvidence): EvidenceConfidenceLevel {
  if (evidence.route === "STATE_ESTIMATE") {
    return evidence.dataConfidence;
  }

  // MCC R1-Informed Evidence
  if (evidence.sampleSize >= 20) return "HIGH";
  if (evidence.sampleSize >= 5) return "MODERATE";
  return "LOW";
}

/**
 * Generates a concise, deterministic, human-readable explanation for the recommendation.
 * Complies with strict safety rules: zero forbidden probability/guarantee terms.
 */
function generateReasonSummary(
  band: OpportunityBand,
  evidence: CollegeCounsellingEvidence,
  confidence: EvidenceConfidenceLevel,
  reasonCodes: string[]
): string {
  if (evidence.route === "STATE_ESTIMATE" || evidence.dataStatus === "CAPACITY_ESTIMATE") {
    if (evidence.managementType === CounsellingManagementType.GOVERNMENT) {
      const poolCount = evidence.estimatedPool !== null ? evidence.estimatedPool : "a pool of";
      return `Approximately ${poolCount} seats appear to be outside the MCC Round-1 pool for this college. State-specific Round-1 rank/category data has not yet been incorporated, so your competitiveness for this college cannot currently be estimated.`;
    }
    return `This college has an approximate non-MCC seat pool, but state/institution-specific Round-1 rank data has not yet been incorporated. Student-specific competitiveness cannot currently be estimated.`;
  }

  // MCC R1-Informed Explanations
  switch (band) {
    case "STRONG":
      if (confidence === "HIGH") {
        return "Your AIR is within the stronger quartile (<= Q1) of the observed Round-1 allotment distribution for this pathway with robust sample size.";
      }
      return "Your AIR is within the stronger part (<= Q1) of the observed Round-1 allotment distribution for this pathway.";

    case "REALISTIC":
      if (reasonCodes.includes("DOWNGRADED_DUE_TO_SAMPLE_SIZE")) {
        return "Your AIR is within the stronger historical range, but limited sample size warrants a realistic rather than strong classification.";
      }
      if (reasonCodes.includes("SUPPORTED_BY_EXPANSION_SIGNAL")) {
        return "Your AIR is in the upper observed range, supported by positive 2026 capacity or Round-1 movement signals.";
      }
      return "Your AIR falls within the typical middle range (Q1 to Q3) of observed Round-1 allotments for this pathway.";

    case "STRETCH":
      if (reasonCodes.includes("AIR_BEYOND_OBSERVED_R1")) {
        return "Your AIR is slightly beyond the observed Round-1 highest rank, but 2026 capacity increase or seat movement makes this a viable stretch option.";
      }
      return "Your AIR is in the outer tail (Q3 to Highest AIR) of the observed Round-1 allotment range for this pathway.";

    case "LOW_EVIDENCE":
      if (reasonCodes.includes("ZERO_ALLOTMENT_CELL")) {
        return "Seats were offered under this category in Round-1, but zero allotments were recorded; limited historical evidence is available.";
      }
      if (reasonCodes.includes("AIR_BEYOND_OBSERVED_R1")) {
        return "Your AIR is beyond the observed Round-1 range for this pathway without sufficient seat expansion signals to classify as a stretch.";
      }
      return "Current historical data provides limited analytical evidence for this pathway.";
  }
}

/**
 * Deterministically evaluates an individual evidence record to assign an OpportunityBand and reason codes.
 */
export function evaluateEvidenceRecommendation(
  studentAIR: number,
  evidence: CollegeCounsellingEvidence,
  goal: string = "GET_SEAT"
): {
  opportunityBand: OpportunityBand;
  evidenceConfidence: EvidenceConfidenceLevel;
  reasonCodes: string[];
  reasonSummary: string;
} {
  const reasonCodes: string[] = [];
  const confidence = deriveEvidenceConfidence(evidence);

  // 1. Add confidence reason codes
  if (confidence === "HIGH") reasonCodes.push("LARGE_SAMPLE_CONFIDENCE");
  else if (confidence === "MODERATE") reasonCodes.push("MODERATE_SAMPLE_CONFIDENCE");
  else reasonCodes.push("SMALL_SAMPLE_CAUTION");

  // 2. Add pathway reason codes from evidence
  evidence.reasonFlags.forEach((f) => {
    if (!reasonCodes.includes(f)) reasonCodes.push(f);
  });

  // 3. Add 2026 expansion & movement reason codes
  if (evidence.seatIncrease2026 > 0) reasonCodes.push("SEAT_INCREASE_2026");
  if (evidence.isNewEstablishment2026) reasonCodes.push("NEW_COLLEGE_2026");
  if (evidence.observedR1Gap > 0) reasonCodes.push("POSITIVE_R1_GAP");
  if (evidence.fillRate === 1.0) reasonCodes.push("FULLY_FILLED_R1");

  // -------------------------------------------------------------
  // BRANCH A: STATE ESTIMATE ROUTE (Capacity-only)
  // -------------------------------------------------------------
  if (evidence.route === "STATE_ESTIMATE" && evidence.dataStatus === "CAPACITY_ESTIMATE") {
    reasonCodes.push("CAPACITY_ONLY_STATE_ESTIMATE");
    reasonCodes.push("STATE_RANK_DATA_AWAITED");

    if (evidence.managementType === CounsellingManagementType.GOVERNMENT) {
      reasonCodes.push("APPROX_GOVT_STATE_POOL");
    } else {
      reasonCodes.push("APPROX_NON_MCC_PRIVATE_POOL");
    }

    const band: OpportunityBand = "LOW_EVIDENCE";
    return {
      opportunityBand: band,
      evidenceConfidence: confidence,
      reasonCodes,
      reasonSummary: generateReasonSummary(band, evidence, confidence, reasonCodes),
    };
  }

  // -------------------------------------------------------------
  // BRANCH B: MCC ROUND-1 INFORMED ROUTE
  // -------------------------------------------------------------
  const pos = evidence.rankPositionClassification;

  // Add historical position reason code
  if (pos === "STRONG_HISTORICAL_POSITION") reasonCodes.push("AIR_WITHIN_STRONG_R1_RANGE");
  else if (pos === "WITHIN_TYPICAL_R1_RANGE") reasonCodes.push("AIR_WITHIN_TYPICAL_R1_RANGE");
  else if (pos === "STRETCH_WITHIN_OBSERVED_R1") reasonCodes.push("AIR_WITHIN_OBSERVED_R1_TAIL");
  else if (pos === "BEYOND_OBSERVED_R1_RANGE") reasonCodes.push("AIR_BEYOND_OBSERVED_R1");
  else reasonCodes.push("INSUFFICIENT_HISTORICAL_DATA");

  // Zero-allotment cell check
  if (evidence.seatsOfferedR1 > 0 && evidence.seatsAllottedR1 === 0) {
    reasonCodes.push("ZERO_ALLOTMENT_CELL");
    const band: OpportunityBand = "LOW_EVIDENCE";
    return {
      opportunityBand: band,
      evidenceConfidence: confidence,
      reasonCodes,
      reasonSummary: generateReasonSummary(band, evidence, confidence, reasonCodes),
    };
  }

  // Evaluate structural movement signals (seat increase, new college, positive gap)
  const hasStructuralSignal =
    evidence.seatIncrease2026 > 0 ||
    evidence.isNewEstablishment2026 ||
    evidence.observedR1Gap > 0;

  let opportunityBand: OpportunityBand;

  if (pos === "STRONG_HISTORICAL_POSITION") {
    // Requires adequate sample size (confidence HIGH or MODERATE)
    if (confidence !== "LOW") {
      opportunityBand = "STRONG";
    } else {
      // Small sample size prevents automatic STRONG
      opportunityBand = "REALISTIC";
      reasonCodes.push("DOWNGRADED_DUE_TO_SAMPLE_SIZE");
    }
  } else if (pos === "WITHIN_TYPICAL_R1_RANGE") {
    if (confidence !== "LOW") {
      opportunityBand = "REALISTIC";
    } else {
      opportunityBand = "STRETCH";
      reasonCodes.push("DOWNGRADED_DUE_TO_SAMPLE_SIZE");
    }
  } else if (pos === "STRETCH_WITHIN_OBSERVED_R1") {
    // In the outer tail (Q3 to Highest AIR)
    if (hasStructuralSignal && confidence !== "LOW") {
      // Supported by 2026 capacity increase or positive gap -> elevated to REALISTIC
      opportunityBand = "REALISTIC";
      reasonCodes.push("SUPPORTED_BY_EXPANSION_SIGNAL");
    } else {
      opportunityBand = "STRETCH";
    }
  } else if (pos === "BEYOND_OBSERVED_R1_RANGE") {
    // Check if candidate is close to Highest AIR and supported by structural signals
    const highest = evidence.highestAIR || 0;
    const isCloseToTail = highest > 0 && (studentAIR <= highest * 1.05 || studentAIR - highest <= 500);

    if (isCloseToTail && hasStructuralSignal) {
      opportunityBand = "STRETCH";
      reasonCodes.push("SUPPORTED_BY_EXPANSION_SIGNAL");
    } else {
      opportunityBand = "LOW_EVIDENCE";
    }
  } else {
    // INSUFFICIENT_DATA
    opportunityBand = "LOW_EVIDENCE";
  }

  return {
    opportunityBand,
    evidenceConfidence: confidence,
    reasonCodes,
    reasonSummary: generateReasonSummary(opportunityBand, evidence, confidence, reasonCodes),
  };
}

/**
 * Deterministic multi-tier sorting for recommendations.
 * 1. Opportunity Band: STRONG (1) -> REALISTIC (2) -> STRETCH (3) -> LOW_EVIDENCE (4)
 * 2. Confidence Level: HIGH (1) -> MODERATE (2) -> LOW (3)
 * 3. Proximity of median AIR (or highest AIR) to student AIR
 * 4. Sample size descending
 * 5. Deterministic tie-break by college name and quota
 */
export function sortRecommendations(
  recommendations: CounsellingRecommendation[],
  studentAIR: number
): CounsellingRecommendation[] {
  const bandOrder: Record<OpportunityBand, number> = {
    STRONG: 1,
    REALISTIC: 2,
    STRETCH: 3,
    LOW_EVIDENCE: 4,
  };

  const confOrder: Record<EvidenceConfidenceLevel, number> = {
    HIGH: 1,
    MODERATE: 2,
    LOW: 3,
  };

  return [...recommendations].sort((a, b) => {
    // 1. Opportunity Band
    const bA = bandOrder[a.opportunityBand];
    const bB = bandOrder[b.opportunityBand];
    if (bA !== bB) return bA - bB;

    // 2. Evidence Confidence
    const cA = confOrder[a.evidenceConfidence];
    const cB = confOrder[b.evidenceConfidence];
    if (cA !== cB) return cA - cB;

    // 3. Proximity to student AIR
    const refA = a.medianAIR || a.highestAIR || 0;
    const refB = b.medianAIR || b.highestAIR || 0;
    if (refA > 0 && refB > 0) {
      const diffA = Math.abs(refA - studentAIR);
      const diffB = Math.abs(refB - studentAIR);
      if (diffA !== diffB) return diffA - diffB;
    }

    // 4. Sample Size descending
    if (b.sampleSize !== a.sampleSize) {
      return b.sampleSize - a.sampleSize;
    }

    // 5. Tie-break: College name, then quota, then category
    const nameCmp = a.collegeName.localeCompare(b.collegeName);
    if (nameCmp !== 0) return nameCmp;

    const quotaCmp = a.quota.localeCompare(b.quota);
    if (quotaCmp !== 0) return quotaCmp;

    return a.seatCategory.localeCompare(b.seatCategory);
  });
}

// ==========================================
// 3. Engine Orchestrator
// ==========================================

/**
 * Generates structured, deterministic counselling recommendations for a student profile.
 * Pure service: does not write to the database.
 */
export async function generateRecommendations(
  profile: StudentCounsellingProfile,
  filters: RecommendationFilterParams = {}
): Promise<{
  profile: StudentCounsellingProfile;
  totalEvaluated: number;
  totalRecommendations: number;
  bandCounts: Record<OpportunityBand, number>;
  recommendations: CounsellingRecommendation[];
}> {
  // 1. Retrieve eligible evidence from counsellingService
  const { evidence } = await getCounsellingEvidenceForStudent(profile, filters);

  const bandCounts: Record<OpportunityBand, number> = {
    STRONG: 0,
    REALISTIC: 0,
    STRETCH: 0,
    LOW_EVIDENCE: 0,
  };

  const recommendations: CounsellingRecommendation[] = [];

  for (const item of evidence) {
    const evalResult = evaluateEvidenceRecommendation(profile.air, item, profile.goal);

    // Apply opportunityBand and confidence filters if specified
    if (filters.opportunityBands && !filters.opportunityBands.includes(evalResult.opportunityBand)) {
      continue;
    }
    if (filters.confidenceLevels && !filters.confidenceLevels.includes(evalResult.evidenceConfidence)) {
      continue;
    }

    bandCounts[evalResult.opportunityBand]++;

    recommendations.push({
      collegeId: item.collegeId,
      collegeName: item.collegeName,
      shortName: item.shortName,
      state: item.state,
      managementType: item.managementType,
      instituteType: item.instituteType,
      isINI: item.isINI,
      isDeemed: item.isDeemed,
      isCentralUniversity: item.isCentralUniversity,
      isESIC: item.isESIC,

      route: item.route,
      quota: item.quota,
      seatCategory: item.seatCategory,
      isPwD: item.isPwD,
      specialPathway: item.specialPathway,

      opportunityBand: evalResult.opportunityBand,
      evidenceConfidence: evalResult.evidenceConfidence,
      rankPositionClassification: item.rankPositionClassification,

      studentAIR: profile.air,
      sampleSize: item.sampleSize,
      bestAIR: item.bestAIR,
      q1AIR: item.q1AIR,
      medianAIR: item.medianAIR,
      q3AIR: item.q3AIR,
      highestAIR: item.highestAIR,

      seatsOfferedR1: item.seatsOfferedR1,
      seatsAllottedR1: item.seatsAllottedR1,
      observedR1Gap: item.observedR1Gap,
      fillRate: item.fillRate,

      approvedSeats2026: item.approvedSeats2026,
      seatIncrease2026: item.seatIncrease2026,
      isNewEstablishment2026: item.isNewEstablishment2026,

      estimatedPool: item.estimatedPool,
      estimatedPoolLabel: item.estimatedPoolLabel,

      dataStatus: item.dataStatus,
      reasonCodes: evalResult.reasonCodes,
      reasonSummary: evalResult.reasonSummary,
    });
  }

  // 2. Deterministic sorting
  const sorted = sortRecommendations(recommendations, profile.air);

  return {
    profile,
    totalEvaluated: evidence.length,
    totalRecommendations: sorted.length,
    bandCounts,
    recommendations: sorted,
  };
}
