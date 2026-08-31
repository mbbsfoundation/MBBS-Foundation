import type { CollegeRound1CategoryProfile } from "./evidenceTypes";

export type PathwayGroupType = "ORDINARY" | "SPECIAL";

/**
 * Returns the numerical priority tier for a given quota name.
 * Lower number = higher priority in Standard View.
 *
 * Priority Tiers:
 * 1: Open Seat Quota / All India / Self-Financed Merit (Primary Ordinary)
 * 2: Central / University Quotas (Delhi University, AMU, BHU, JMI)
 * 3: Institutional / Internal Quotas (IP University, Internal Puducherry)
 * 4: ESI / CW Special Quotas
 * 5: Minority Quotas (Muslim, Jain)
 * 6: NRI Quotas (NRI, NRI-AMU)
 * 7: Foreign Country Quotas
 * 8: Other / Unclassified Quotas
 */
export function getPathwayPriorityTier(quota: string): number {
  const q = quota.toLowerCase().trim();

  // Tier 1: Primary Open / All India / Merit
  if (q.includes("open seat") || q.includes("open quota")) return 1;
  if (q === "all india" || q.includes("all india quota")) return 1;
  if (q.includes("self-financed") || q.includes("management") || q.includes("paid seats")) return 1;

  // Tier 2: Central / University Quotas
  if (
    q.includes("delhi university") ||
    q.includes("aligarh muslim") ||
    q.includes("amu quota") ||
    q.includes("banaras") ||
    q.includes("bhu") ||
    q.includes("jamia") ||
    q.includes("jmi")
  ) {
    // Exclude NRI variants from Tier 2
    if (q.includes("nri")) return 6;
    return 2;
  }

  // Tier 3: Institutional / Internal Quotas
  if (
    q.includes("ip university") ||
    q.includes("ipu") ||
    q.includes("internal") ||
    q.includes("institutional") ||
    q.includes("puducherry")
  ) {
    return 3;
  }

  // Tier 4: ESI / CW Quotas
  if (q.includes("esi") || q.includes("insured person") || q.includes("cw") || q.includes("armed forces")) {
    return 4;
  }

  // Tier 5: Minority Quotas
  if (q.includes("minority") || q.includes("muslim") || q.includes("jain") || q.includes("christian")) {
    return 5;
  }

  // Tier 6: NRI Quotas
  if (q.includes("nri") || q.includes("non-resident")) {
    return 6;
  }

  // Tier 7: Foreign Quotas
  if (q.includes("foreign") || q.includes("overseas") || q.includes("international")) {
    return 7;
  }

  // Tier 8: Other
  return 8;
}

/**
 * Classifies a quota into ORDINARY vs SPECIAL/INSTITUTIONAL pathway grouping.
 */
export function getPathwayGroup(quota: string): PathwayGroupType {
  const tier = getPathwayPriorityTier(quota);
  // Tiers 1 and 2 are ordinary pathways (Open, AIQ, Central University, Self-Financed Merit)
  if (tier <= 2) return "ORDINARY";
  return "SPECIAL";
}

/**
 * Returns numerical weight for category ordering:
 * 1: OPEN
 * 2: EWS
 * 3: OBC
 * 4: SC
 * 5: ST
 * 6: OTHER
 */
export function getCategoryOrderWeight(category: string): number {
  const cat = category.toUpperCase().trim();
  switch (cat) {
    case "OPEN":
    case "UR":
    case "GEN":
    case "GENERAL":
      return 1;
    case "EWS":
      return 2;
    case "OBC":
    case "OBC-NCL":
      return 3;
    case "SC":
      return 4;
    case "ST":
      return 5;
    default:
      return 6;
  }
}

/**
 * Maps raw quota strings to student-friendly display labels while preserving source semantics.
 */
export function getStudentFriendlyQuotaLabel(quota: string): string {
  const q = quota.trim();
  const lower = q.toLowerCase();

  if (lower === "open seat quota") return "Open Seat Quota";
  if (lower === "all india") return "All India Quota (AIQ)";
  if (lower === "self-financed merit") return "Self-Financed Merit";
  if (lower === "delhi university quota") return "Delhi University (DU) Quota";
  if (lower === "amu quota") return "AMU Open / Internal Quota";
  if (lower === "ip university quota") return "IP University (IPU) Quota";
  if (lower === "internal -puducherry" || lower.includes("internal -puducherry")) return "Internal Puducherry UT Quota";
  if (lower === "esi") return "ESIC Insured Persons (IP) Quota";
  if (lower === "delhi ncr cw") return "Children/Widows of Armed Forces (CW)";
  if (lower === "muslim minority") return "Muslim Minority Quota";
  if (lower === "jain minority quota") return "Jain Minority Quota";
  if (lower === "nri") return "Non-Resident Indian (NRI)";
  if (lower === "nri-amu") return "AMU NRI Quota";
  if (lower === "foreign country quota") return "Foreign Nationals Quota";

  // Return source if unmapped
  return q;
}

/**
 * Standard View Multi-Level Comparator:
 * 1. Pathway Priority Tier (1 to 8)
 * 2. Specific Quota Name (Alphabetical within same tier for deterministic grouping)
 * 3. PwD Status (Non-PwD first, then PwD)
 * 4. Category Priority (OPEN -> EWS -> OBC -> SC -> ST)
 * 5. Best AIR (Ascending numerical rank; nulls placed last)
 */
export function compareProfilesStandard(
  a: CollegeRound1CategoryProfile,
  b: CollegeRound1CategoryProfile
): number {
  // 1. Pathway Tier
  const tierA = getPathwayPriorityTier(a.quota);
  const tierB = getPathwayPriorityTier(b.quota);
  if (tierA !== tierB) return tierA - tierB;

  // 2. Specific Quota name (group same quotas together)
  if (a.quota !== b.quota) {
    // Ensure "Open Seat Quota" precedes "All India" if both in Tier 1
    const aIsOpen = a.quota.toLowerCase().includes("open seat");
    const bIsOpen = b.quota.toLowerCase().includes("open seat");
    if (aIsOpen && !bIsOpen) return -1;
    if (!aIsOpen && bIsOpen) return 1;

    const aIsAIQ = a.quota.toLowerCase() === "all india";
    const bIsAIQ = b.quota.toLowerCase() === "all india";
    if (aIsAIQ && !bIsAIQ) return -1;
    if (!aIsAIQ && bIsAIQ) return 1;

    return a.quota.localeCompare(b.quota);
  }

  // 3. PwD Status (Non-PwD first)
  if (a.isPwD !== b.isPwD) {
    return a.isPwD ? 1 : -1;
  }

  // 4. Category Hierarchy (OPEN -> EWS -> OBC -> SC -> ST)
  const catA = getCategoryOrderWeight(a.seatCategory);
  const catB = getCategoryOrderWeight(b.seatCategory);
  if (catA !== catB) return catA - catB;

  // 5. Best AIR secondary sort (nulls last)
  if (a.bestAIR !== null && b.bestAIR !== null) {
    return a.bestAIR - b.bestAIR;
  }
  if (a.bestAIR !== null && b.bestAIR === null) return -1;
  if (a.bestAIR === null && b.bestAIR !== null) return 1;

  return 0;
}

/**
 * Pure Best AIR Comparator (Numerical order across all visible rows):
 * 1. Best AIR ascending
 * 2. Nulls last
 * 3. Fallback to standard comparison for ties
 */
export function compareProfilesByBestAIR(
  a: CollegeRound1CategoryProfile,
  b: CollegeRound1CategoryProfile
): number {
  if (a.bestAIR !== null && b.bestAIR !== null) {
    if (a.bestAIR !== b.bestAIR) return a.bestAIR - b.bestAIR;
  } else if (a.bestAIR !== null && b.bestAIR === null) {
    return -1;
  } else if (a.bestAIR === null && b.bestAIR !== null) {
    return 1;
  }
  return compareProfilesStandard(a, b);
}

/**
 * Sorts an array of category profiles according to the requested ordering mode.
 */
export function sortCategoryProfiles(
  profiles: CollegeRound1CategoryProfile[],
  mode: "STANDARD" | "BEST_AIR" = "STANDARD"
): CollegeRound1CategoryProfile[] {
  const copy = [...profiles];
  if (mode === "BEST_AIR") {
    return copy.sort(compareProfilesByBestAIR);
  }
  return copy.sort(compareProfilesStandard);
}

/**
 * Resolves the single Primary Open Benchmark profile for a college:
 * - Highest-priority ordinary non-PwD OPEN pathway according to Sequence 9E Standard View hierarchy
 * - Falls back to the first non-PwD OPEN pathway if no ordinary tier is present
 * - Returns null if no non-PwD OPEN profile exists
 */
export function getPrimaryOpenBenchmark(
  allProfiles: CollegeRound1CategoryProfile[]
): CollegeRound1CategoryProfile | null {
  if (!allProfiles || allProfiles.length === 0) return null;

  const sorted = sortCategoryProfiles(allProfiles, "STANDARD");
  // 1. Check for highest-priority ordinary non-PwD OPEN profile
  const firstOrdinaryOpen = sorted.find(
    (p) => p.seatCategory === "OPEN" && !p.isPwD && getPathwayGroup(p.quota) === "ORDINARY"
  );
  if (firstOrdinaryOpen) return firstOrdinaryOpen;

  // 2. Fallback to any non-PwD OPEN profile if no ordinary tier exists
  const anyFirstOpen = sorted.find((p) => p.seatCategory === "OPEN" && !p.isPwD);
  return anyFirstOpen ?? null;
}

/**
 * Identifies if a profile is the Primary Open Benchmark row:
 * - Highest-priority ordinary pathway present
 * - Category = OPEN
 * - isPwD = false
 */
export function isPrimaryOpenBenchmark(
  profile: CollegeRound1CategoryProfile,
  allProfiles: CollegeRound1CategoryProfile[]
): boolean {
  if (profile.seatCategory !== "OPEN" || profile.isPwD) {
    return false;
  }

  const primaryBenchmark = getPrimaryOpenBenchmark(allProfiles);
  return primaryBenchmark === profile;
}
