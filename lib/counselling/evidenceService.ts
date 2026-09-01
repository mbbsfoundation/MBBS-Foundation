import { cache } from "react";
import { prisma } from "../prisma";
import {
  CounsellingSeatCategory,
  CounsellingManagementType,
  CounsellingRoundType,
  CounsellingAuthorityType,
} from "../generated/prisma/client";
import type {
  CollegeSearchQueryParams,
  CollegeSearchResult,
  CollegeRound1CategoryProfile,
  DomicileCollegeSummary,
  DomicileStateSummaryResult,
} from "./evidenceTypes";
import { sortCategoryProfiles, getPrimaryOpenBenchmark } from "./pathwayOrdering";

export * from "./evidenceTypes";

// ==========================================
// 1. Types & Interfaces
// ==========================================

export type CategoryMode = "ALL" | "ELIGIBLE" | "CATEGORY_ONLY" | "MERIT_OPEN" | "PWD";
export type SupportedWindow = 250 | 500 | 1000 | 2500;

export const SUPPORTED_WINDOWS: readonly SupportedWindow[] = [250, 500, 1000, 2500] as const;

export interface ExactAllotmentRecord {
  candidateRank: number;
  collegeId: string;
  collegeName: string;
  state: string;
  managementType: CounsellingManagementType;
  isINI: boolean;
  isDeemed: boolean;
  isCentralUniversity: boolean;
  isESIC: boolean;
  quota: string;
  allottedCategory: CounsellingSeatCategory;
  candidateCategory: CounsellingSeatCategory;
  candidatePwD: boolean;
  allottedPwD: boolean;
  specialPathway: string | null;
  round: string;
  course: string;
}

export interface NearbyAllotmentRecord {
  candidateRank: number;
  collegeId: string;
  collegeName: string;
  state: string;
  managementType: CounsellingManagementType;
  isINI: boolean;
  isDeemed: boolean;
  quota: string;
  allottedCategory: CounsellingSeatCategory;
  candidateCategory: CounsellingSeatCategory;
  candidatePwD: boolean;
  allottedPwD: boolean;
  specialPathway: string | null;
}

export interface WindowAllotmentItem {
  id: string;
  candidateRank: number;
  collegeId: string;
  collegeName: string;
  state: string;
  managementType: CounsellingManagementType;
  isINI: boolean;
  isDeemed: boolean;
  quota: string;
  allottedCategory: CounsellingSeatCategory;
  candidateCategory: CounsellingSeatCategory;
  candidatePwD: boolean;
  allottedPwD: boolean;
  specialPathway: string | null;
}

export interface WindowAllotmentResult {
  items: WindowAllotmentItem[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
  window: number;
  range: {
    min: number;
    max: number;
  };
}



export interface WindowQueryParams {
  air: number;
  window: SupportedWindow;
  category?: CounsellingSeatCategory;
  categoryMode?: CategoryMode;
  isPwD?: boolean;
  quota?: string;
  managementType?: CounsellingManagementType;
  state?: string;
  page?: number;
  pageSize?: number;
}

export interface EvidenceQueryParams extends WindowQueryParams {
  domicileState?: string;
}

export interface Round1EvidenceResponse {
  profile: {
    air: number;
    category: CounsellingSeatCategory;
    isPwD: boolean;
    domicileState?: string;
  };
  exactMatch: ExactAllotmentRecord | null;
  nearbyAllotments: {
    better: NearbyAllotmentRecord[];
    lower: NearbyAllotmentRecord[];
  };
  windowAllotments: WindowAllotmentResult;
  domicileSummary: DomicileStateSummaryResult | null;
  dataContext: {
    academicYear: number;
    authority: string;
    round: string;
    course: string;
    evidenceType: string;
  };
}

// ==========================================
// 2. Deterministic Round Resolver
// ==========================================

/**
 * Resolves the official MCC Round-1 CounsellingRound record for Academic Year 2026.
 */
export const getMccRound1Context = cache(async () => {
  return prisma.counsellingRound.findFirst({
    where: {
      academicYear: 2026,
      roundType: CounsellingRoundType.ROUND_1,
      authority: {
        authorityType: CounsellingAuthorityType.MCC,
      },
    },
    include: {
      authority: true,
    },
  });
});

// ==========================================
// 3. Exact AIR Lookup
// ==========================================

/**
 * Retrieves the exact MCC Round-1 MBBS allotment record for a candidate's AIR.
 * Returns null if no allotment exists at that exact rank.
 */
export async function getExactAllotment(air: number, roundId?: string): Promise<ExactAllotmentRecord | null> {
  const targetRoundId = roundId ?? (await getMccRound1Context())?.id;
  if (!targetRoundId) return null;

  const record = await prisma.allotmentRecord.findFirst({
    where: {
      roundId: targetRoundId,
      course: "MBBS",
      candidateRank: air,
    },
    include: {
      college: {
        select: {
          id: true,
          collegeName: true,
          state: true,
          managementType: true,
          isINI: true,
          isDeemed: true,
          isCentralUniversity: true,
          isESIC: true,
        },
      },
    },
    orderBy: [
      { sourceSerialNumber: "asc" },
      { id: "asc" },
    ],
  });

  if (!record) return null;

  return {
    candidateRank: record.candidateRank,
    collegeId: record.collegeId,
    collegeName: record.college.collegeName,
    state: record.college.state,
    managementType: record.college.managementType,
    isINI: record.college.isINI,
    isDeemed: record.college.isDeemed,
    isCentralUniversity: record.college.isCentralUniversity,
    isESIC: record.college.isESIC,
    quota: record.quota,
    allottedCategory: record.allottedCategory,
    candidateCategory: record.candidateCategory,
    candidatePwD: record.candidatePwD,
    allottedPwD: record.allottedPwD,
    specialPathway: record.specialPathway,
    round: "ROUND_1",
    course: record.course,
  };
}

// ==========================================
// 4. Nearest AIR Lookup
// ==========================================

/**
 * Retrieves the N nearest numerically better and N nearest numerically lower allotments around an AIR.
 */
export async function getNearbyAllotments(
  air: number,
  count = 5,
  roundId?: string
): Promise<{ better: NearbyAllotmentRecord[]; lower: NearbyAllotmentRecord[] }> {
  const targetRoundId = roundId ?? (await getMccRound1Context())?.id;
  if (!targetRoundId) {
    return { better: [], lower: [] };
  }

  const [betterRaw, lowerRaw] = await Promise.all([
    // Nearest numerically lower ranks (< air)
    prisma.allotmentRecord.findMany({
      where: {
        roundId: targetRoundId,
        course: "MBBS",
        candidateRank: { lt: air },
      },
      include: {
        college: {
          select: {
            collegeName: true,
            state: true,
            managementType: true,
            isINI: true,
            isDeemed: true,
          },
        },
      },
      orderBy: { candidateRank: "desc" },
      take: count,
    }),
    // Nearest numerically higher ranks (> air)
    prisma.allotmentRecord.findMany({
      where: {
        roundId: targetRoundId,
        course: "MBBS",
        candidateRank: { gt: air },
      },
      include: {
        college: {
          select: {
            collegeName: true,
            state: true,
            managementType: true,
            isINI: true,
            isDeemed: true,
          },
        },
      },
      orderBy: { candidateRank: "asc" },
      take: count,
    }),
  ]);

  // Order 'better' ranks in ascending display order (e.g. 10095, 10108, 10115)
  const betterFormatted = betterRaw.reverse().map((r) => ({
    candidateRank: r.candidateRank,
    collegeId: r.collegeId,
    collegeName: r.college.collegeName,
    state: r.college.state,
    managementType: r.college.managementType,
    isINI: r.college.isINI,
    isDeemed: r.college.isDeemed,
    quota: r.quota,
    allottedCategory: r.allottedCategory,
    candidateCategory: r.candidateCategory,
    candidatePwD: r.candidatePwD,
    allottedPwD: r.allottedPwD,
    specialPathway: r.specialPathway,
  }));

  const lowerFormatted = lowerRaw.map((r) => ({
    candidateRank: r.candidateRank,
    collegeId: r.collegeId,
    collegeName: r.college.collegeName,
    state: r.college.state,
    managementType: r.college.managementType,
    isINI: r.college.isINI,
    isDeemed: r.college.isDeemed,
    quota: r.quota,
    allottedCategory: r.allottedCategory,
    candidateCategory: r.candidateCategory,
    candidatePwD: r.candidatePwD,
    allottedPwD: r.allottedPwD,
    specialPathway: r.specialPathway,
  }));

  return {
    better: betterFormatted,
    lower: lowerFormatted,
  };
}

// ==========================================
// 5. Rank-Window Query
// ==========================================

/**
 * Retrieves paginated allotment records within a specified AIR window with category filtering.
 */
export async function getWindowedAllotments(
  params: WindowQueryParams,
  roundId?: string
): Promise<WindowAllotmentResult> {
  const {
    air,
    window,
    category = CounsellingSeatCategory.OPEN,
    categoryMode = "ELIGIBLE",
    isPwD = false,
    quota,
    managementType,
    state,
    page = 1,
    pageSize = 50,
  } = params;

  const targetRoundId = roundId ?? (await getMccRound1Context())?.id;
  if (!targetRoundId) {
    return {
      items: [],
      total: 0,
      page,
      pageSize,
      hasMore: false,
      window,
      range: { min: Math.max(1, air - window), max: air + window },
    };
  }

  const minAIR = Math.max(1, air - window);
  const maxAIR = air + window;

  const where: any = {
    roundId: targetRoundId,
    course: "MBBS",
    candidateRank: {
      gte: minAIR,
      lte: maxAIR,
    },
  };

  // Category Mode Filtering
  switch (categoryMode) {
    case "ALL":
      // No category filter applied
      break;

    case "CATEGORY_ONLY":
      where.allottedCategory = category;
      if (!isPwD) {
        where.allottedPwD = false;
      }
      break;

    case "MERIT_OPEN":
      where.allottedCategory = CounsellingSeatCategory.OPEN;
      where.allottedPwD = false;
      break;

    case "PWD":
      where.OR = [{ candidatePwD: true }, { allottedPwD: true }];
      break;

    case "ELIGIBLE":
    default:
      if (!isPwD) {
        where.allottedPwD = false;
        if (category === CounsellingSeatCategory.OPEN) {
          where.allottedCategory = CounsellingSeatCategory.OPEN;
        } else {
          where.allottedCategory = { in: [category, CounsellingSeatCategory.OPEN] };
        }
      } else {
        // PwD Candidate
        if (category === CounsellingSeatCategory.OPEN) {
          where.allottedCategory = CounsellingSeatCategory.OPEN;
        } else {
          where.allottedCategory = { in: [category, CounsellingSeatCategory.OPEN] };
        }
      }
      break;
  }

  // Institutional & Quota Filters
  if (quota && quota.trim().length > 0) {
    where.quota = { equals: quota.trim(), mode: "insensitive" };
  }

  if (state && state.trim().length > 0) {
    where.college = {
      ...(where.college || {}),
      state: { equals: state.trim(), mode: "insensitive" },
    };
  }

  if (managementType) {
    where.college = {
      ...(where.college || {}),
      managementType,
    };
  }

  const offset = (page - 1) * pageSize;

  const [total, records] = await Promise.all([
    prisma.allotmentRecord.count({ where }),
    prisma.allotmentRecord.findMany({
      where,
      include: {
        college: {
          select: {
            collegeName: true,
            state: true,
            managementType: true,
            isINI: true,
            isDeemed: true,
          },
        },
      },
      orderBy: { candidateRank: "asc" },
      skip: offset,
      take: pageSize,
    }),
  ]);

  const items: WindowAllotmentItem[] = records.map((r) => ({
    id: r.id,
    candidateRank: r.candidateRank,
    collegeId: r.collegeId,
    collegeName: r.college.collegeName,
    state: r.college.state,
    managementType: r.college.managementType,
    isINI: r.college.isINI,
    isDeemed: r.college.isDeemed,
    quota: r.quota,
    allottedCategory: r.allottedCategory,
    candidateCategory: r.candidateCategory,
    candidatePwD: r.candidatePwD,
    allottedPwD: r.allottedPwD,
    specialPathway: r.specialPathway,
  }));

  return {
    items,
    total,
    page,
    pageSize,
    hasMore: offset + items.length < total,
    window,
    range: { min: minAIR, max: maxAIR },
  };
}

// ==========================================
// 6. Domicile State College Explorer
// ==========================================

/**
 * Formats an AnalyticsSnapshot record into a clean category profile.
 */
function formatCategoryProfile(s: any): CollegeRound1CategoryProfile {
  return {
    quota: s.quota,
    seatCategory: s.seatCategory,
    isPwD: s.isPwD,
    specialPathway: s.specialPathway,
    seatsOffered: s.seatsOffered,
    seatsAllotted: s.seatsAllotted,
    matrixGap: s.matrixGap,
    bestAIR: s.bestAIR,
    medianAIR: s.medianAIR,
    highestAIR: s.highestAIR,
    sampleSize: s.sampleSize,
  };
}

/**
 * Returns complete factual Round-1 evidence for all medical colleges in a domicile state.
 */
export async function getDomicileStateSummary(
  state: string,
  studentCategory: CounsellingSeatCategory = CounsellingSeatCategory.OPEN,
  isPwD = false,
  roundId?: string
): Promise<DomicileStateSummaryResult> {
  const targetRoundId = roundId ?? (await getMccRound1Context())?.id;
  if (!targetRoundId) {
    return { state, totalColleges: 0, colleges: [] };
  }

  const colleges = await prisma.college.findMany({
    where: {
      state: { equals: state.trim(), mode: "insensitive" },
      isActive: true,
    },
    include: {
      capacities: {
        where: { academicYear: 2026 },
      },
      seatMatrixRecords: {
        where: { roundId: targetRoundId },
      },
      allotmentRecords: {
        where: { roundId: targetRoundId, course: "MBBS" },
        select: { id: true },
      },
      analyticsSnapshots: {
        where: { roundId: targetRoundId },
      },
    },
    orderBy: [
      { managementType: "asc" },
      { collegeName: "asc" },
    ],
  });

  const formattedColleges: DomicileCollegeSummary[] = colleges.map((col) => {
    const nmcCap = col.capacities[0]?.approvedSeats ?? 0;
    const mccOffered = col.seatMatrixRecords.reduce((acc, m) => acc + m.seatCount, 0);
    const mccAllotted = col.allotmentRecords.length;

    // For INI institutions (which do not have NMC records), total seats equals verified MCC central matrix
    const totalMBBSSeats2026 = col.isINI && nmcCap === 0 ? mccOffered : nmcCap;
    const approxOutsideMccRound1Pool = Math.max(0, totalMBBSSeats2026 - mccOffered);

    // Open Round-1 Profiles (non-PwD OPEN snapshots, standardized priority order)
    const openSnapshots = col.analyticsSnapshots.filter(
      (s) => s.seatCategory === CounsellingSeatCategory.OPEN && !s.isPwD
    );
    const openRound1Profiles = sortCategoryProfiles(openSnapshots.map(formatCategoryProfile), "STANDARD");

    // Student Category Profiles (if student is not OPEN or is PwD)
    let studentCategoryRound1Profiles: CollegeRound1CategoryProfile[] = [];
    if (studentCategory !== CounsellingSeatCategory.OPEN || isPwD) {
      const studentCategorySnapshots = col.analyticsSnapshots.filter(
        (s) => s.seatCategory === studentCategory && s.isPwD === isPwD
      );
      studentCategoryRound1Profiles = studentCategorySnapshots.map(formatCategoryProfile);
    }

    // All Category Profiles for expanding in UI
    const allCategoryProfiles = col.analyticsSnapshots.map(formatCategoryProfile);

    return {
      collegeId: col.id,
      collegeName: col.collegeName,
      state: col.state,
      managementType: col.managementType,
      isINI: col.isINI,
      isDeemed: col.isDeemed,
      isCentralUniversity: col.isCentralUniversity,
      isESIC: col.isESIC,
      totalMBBSSeats2026,
      mccRound1SeatsOffered: mccOffered,
      mccRound1SeatsAllotted: mccAllotted,
      approxOutsideMccRound1Pool,
      openRound1Profiles,
      studentCategoryRound1Profiles,
      allCategoryProfiles,
    };
  });

  return {
    state,
    totalColleges: formattedColleges.length,
    colleges: formattedColleges,
  };
}

// ==========================================
// 7. Master Evidence Aggregate Function
// ==========================================

/**
 * Unified entry point providing complete Round-1 evidence for an AIR query.
 */
export async function getRound1Evidence(params: EvidenceQueryParams): Promise<Round1EvidenceResponse> {
  const roundContext = await getMccRound1Context();
  if (!roundContext) {
    throw new Error("MCC Round-1 dataset for Academic Year 2026 could not be resolved.");
  }

  const { air, domicileState, category = CounsellingSeatCategory.OPEN, isPwD = false } = params;

  const [exactMatch, nearbyAllotments, windowAllotments, domicileSummary] = await Promise.all([
    getExactAllotment(air, roundContext.id),
    getNearbyAllotments(air, 5, roundContext.id),
    getWindowedAllotments(params, roundContext.id),
    domicileState && domicileState.trim().length > 0
      ? getDomicileStateSummary(domicileState.trim(), category, isPwD, roundContext.id)
      : Promise.resolve(null),
  ]);

  return {
    profile: {
      air,
      category,
      isPwD,
      domicileState,
    },
    exactMatch,
    nearbyAllotments,
    windowAllotments,
    domicileSummary,
    dataContext: {
      academicYear: 2026,
      authority: "MCC",
      round: "ROUND_1",
      course: "MBBS",
      evidenceType: "OFFICIAL_ROUND1",
    },
  };
}

// ==========================================
// 8. Standalone Medical College Explorer Query
// ==========================================

/**
 * Standalone Medical College Explorer Search Service.
 * Allows institutional search by name, state, management type, INI, Deemed, Central with full Round-1 evidence.
 * Does NOT require student AIR.
 */
export async function searchMedicalCollegesEvidence(
  params: CollegeSearchQueryParams = {}
): Promise<CollegeSearchResult> {
  const roundContext = await getMccRound1Context();
  const targetRoundId = roundContext?.id;

  const {
    query,
    state,
    collegeType = "ALL",
    managementType,
    isINI,
    isDeemed,
    isCentralUniversity,
    isESIC,
    page = 1,
    pageSize = 25,
    sortBy = "TYPICAL_AIR",
    sortOrder = "asc",
  } = params;

  const where: any = { isActive: true };

  // 1. Text Search across name, shortName, state, codes and aliases
  if (query && query.trim().length > 0) {
    const q = query.trim();
    where.OR = [
      { collegeName: { contains: q, mode: "insensitive" } },
      { shortName: { contains: q, mode: "insensitive" } },
      { state: { contains: q, mode: "insensitive" } },
      { nmcCollegeCode: { contains: q, mode: "insensitive" } },
      { mccInstituteCode: { contains: q, mode: "insensitive" } },
      { aliases: { some: { sourceName: { contains: q, mode: "insensitive" } } } },
    ];
  }

  // 2. State Filter
  if (
    state &&
    state.trim().length > 0 &&
    state.trim().toLowerCase() !== "all" &&
    state.trim().toLowerCase() !== "all states"
  ) {
    where.state = { equals: state.trim(), mode: "insensitive" };
  }

  // 3. College Type Filter
  if (collegeType === "GOVERNMENT") {
    where.managementType = CounsellingManagementType.GOVERNMENT;
  } else if (collegeType === "PRIVATE") {
    where.managementType = CounsellingManagementType.PRIVATE;
    where.isDeemed = false;
  } else if (collegeType === "DEEMED") {
    where.isDeemed = true;
  } else if (collegeType === "CENTRAL") {
    where.isCentralUniversity = true;
  } else if (collegeType === "INI") {
    where.isINI = true;
  } else if (collegeType === "ESIC") {
    where.isESIC = true;
  }

  // Direct boolean overrides if passed
  if (isINI !== undefined) where.isINI = isINI;
  if (isDeemed !== undefined) where.isDeemed = isDeemed;
  if (isCentralUniversity !== undefined) where.isCentralUniversity = isCentralUniversity;
  if (isESIC !== undefined) where.isESIC = isESIC;
  if (managementType && managementType !== "ALL") {
    where.managementType = managementType as CounsellingManagementType;
  }

  // 4. Fetch all matching colleges for the current filters
  const colleges = await prisma.college.findMany({
    where,
    include: {
      capacities: {
        where: { academicYear: 2026 },
      },
      seatMatrixRecords: targetRoundId ? { where: { roundId: targetRoundId } } : true,
      allotmentRecords: targetRoundId
        ? { where: { roundId: targetRoundId, course: "MBBS" }, select: { id: true } }
        : true,
      analyticsSnapshots: targetRoundId ? { where: { roundId: targetRoundId } } : true,
    },
  });

  // 5. Format each college and derive Primary Open Benchmark
  const formattedColleges: DomicileCollegeSummary[] = colleges.map((col) => {
    const nmcCap = col.capacities[0]?.approvedSeats ?? 0;
    const mccOffered = col.seatMatrixRecords.reduce((acc, m) => acc + m.seatCount, 0);
    const mccAllotted = col.allotmentRecords.length;

    const totalMBBSSeats2026 = col.isINI && nmcCap === 0 ? mccOffered : nmcCap;
    const approxOutsideMccRound1Pool = Math.max(0, totalMBBSSeats2026 - mccOffered);

    const allCategoryProfiles = col.analyticsSnapshots.map(formatCategoryProfile);
    const openRound1Profiles = sortCategoryProfiles(
      col.analyticsSnapshots
        .filter((s) => s.seatCategory === CounsellingSeatCategory.OPEN && !s.isPwD)
        .map(formatCategoryProfile),
      "STANDARD"
    );

    return {
      collegeId: col.id,
      slug: col.slug,
      collegeName: col.collegeName,
      state: col.state,
      managementType: col.managementType,
      isINI: col.isINI,
      isDeemed: col.isDeemed,
      isCentralUniversity: col.isCentralUniversity,
      isESIC: col.isESIC,
      totalMBBSSeats2026,
      mccRound1SeatsOffered: mccOffered,
      mccRound1SeatsAllotted: mccAllotted,
      approxOutsideMccRound1Pool,
      openRound1Profiles,
      studentCategoryRound1Profiles: [],
      allCategoryProfiles,
    };
  });

  // 6. Global Deterministic Sorting Across the Full Eligible Set
  formattedColleges.sort((a, b) => {
    if (sortBy === "NAME") {
      const nameCmp = a.collegeName.localeCompare(b.collegeName, undefined, { sensitivity: "base" });
      if (nameCmp !== 0) return sortOrder === "desc" ? -nameCmp : nameCmp;
      return a.collegeId.localeCompare(b.collegeId);
    }

    if (sortBy === "STATE") {
      const stateCmp = a.state.localeCompare(b.state, undefined, { sensitivity: "base" });
      if (stateCmp !== 0) return sortOrder === "desc" ? -stateCmp : stateCmp;
      const nameCmp = a.collegeName.localeCompare(b.collegeName, undefined, { sensitivity: "base" });
      if (nameCmp !== 0) return nameCmp;
      return a.collegeId.localeCompare(b.collegeId);
    }

    if (sortBy === "TOTAL_SEATS") {
      if (a.totalMBBSSeats2026 !== b.totalMBBSSeats2026) {
        return sortOrder === "asc"
          ? a.totalMBBSSeats2026 - b.totalMBBSSeats2026
          : b.totalMBBSSeats2026 - a.totalMBBSSeats2026;
      }
      const nameCmp = a.collegeName.localeCompare(b.collegeName, undefined, { sensitivity: "base" });
      if (nameCmp !== 0) return nameCmp;
      return a.collegeId.localeCompare(b.collegeId);
    }

    // AIR-based sorting: Resolve Primary Open Benchmark using the frozen Sequence 9E resolver
    const openA = getPrimaryOpenBenchmark(a.allCategoryProfiles);
    const openB = getPrimaryOpenBenchmark(b.allCategoryProfiles);

    let valA: number | null = null;
    let valB: number | null = null;

    if (sortBy === "TYPICAL_AIR") {
      valA = openA?.medianAIR ?? null;
      valB = openB?.medianAIR ?? null;
    } else if (sortBy === "BEST_AIR") {
      valA = openA?.bestAIR ?? null;
      valB = openB?.bestAIR ?? null;
    } else if (sortBy === "LAST_AIR") {
      valA = openA?.highestAIR ?? null;
      valB = openB?.highestAIR ?? null;
    }

    if (valA !== null && valB !== null) {
      if (valA !== valB) {
        return sortOrder === "desc" ? valB - valA : valA - valB;
      }
      const nameCmp = a.collegeName.localeCompare(b.collegeName, undefined, { sensitivity: "base" });
      if (nameCmp !== 0) return nameCmp;
      return a.collegeId.localeCompare(b.collegeId);
    }

    // Non-null values strictly come before null values
    if (valA !== null && valB === null) return -1;
    if (valA === null && valB !== null) return 1;

    // Both null: deterministic tie-breaker
    const nameCmp = a.collegeName.localeCompare(b.collegeName, undefined, { sensitivity: "base" });
    if (nameCmp !== 0) return nameCmp;
    return a.collegeId.localeCompare(b.collegeId);
  });

  // 7. Paginate the globally sorted set
  const total = formattedColleges.length;
  const offset = (page - 1) * pageSize;
  const items = formattedColleges.slice(offset, offset + pageSize);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return {
    items,
    total,
    page,
    pageSize,
    totalPages,
  };
}

/**
 * Retrieves complete factual Round-1 evidence and capacity metrics for an individual medical college by slug.
 */
export const getCollegeEvidenceBySlug = cache(async (slug: string): Promise<(DomicileCollegeSummary & {
  slug: string;
  shortName: string | null;
  city: string | null;
  establishmentYear: number | null;
  nmcCollegeCode: string | null;
  mccInstituteCode: string | null;
}) | null> => {
  const roundContext = await getMccRound1Context();
  const targetRoundId = roundContext?.id;

  const col = await prisma.college.findUnique({
    where: {
      slug: slug.trim().toLowerCase(),
      isActive: true,
    },
    include: {
      capacities: {
        where: { academicYear: 2026 },
      },
      seatMatrixRecords: targetRoundId
        ? {
            where: { roundId: targetRoundId },
          }
        : undefined,
      allotmentRecords: targetRoundId
        ? {
            where: { roundId: targetRoundId, course: "MBBS" },
            select: { id: true },
          }
        : undefined,
      analyticsSnapshots: targetRoundId
        ? {
            where: { roundId: targetRoundId },
          }
        : undefined,
    },
  });

  if (!col) return null;

  const nmcCap = col.capacities[0]?.approvedSeats ?? 0;
  const mccOffered = col.seatMatrixRecords ? col.seatMatrixRecords.reduce((acc, m) => acc + m.seatCount, 0) : 0;
  const mccAllotted = col.allotmentRecords ? col.allotmentRecords.length : 0;
  const totalMBBSSeats2026 = col.isINI && nmcCap === 0 ? mccOffered : nmcCap;
  const approxOutsideMccRound1Pool = Math.max(0, totalMBBSSeats2026 - mccOffered);

  const openSnapshots = col.analyticsSnapshots
    ? col.analyticsSnapshots.filter(
        (s) => s.seatCategory === CounsellingSeatCategory.OPEN && !s.isPwD
      )
    : [];
  const openRound1Profiles = sortCategoryProfiles(openSnapshots.map(formatCategoryProfile), "STANDARD");
  const allCategoryProfiles = col.analyticsSnapshots ? col.analyticsSnapshots.map(formatCategoryProfile) : [];

  return {
    collegeId: col.id,
    slug: col.slug,
    collegeName: col.collegeName,
    shortName: col.shortName,
    state: col.state,
    city: col.city,
    managementType: col.managementType,
    isINI: col.isINI,
    isDeemed: col.isDeemed,
    isCentralUniversity: col.isCentralUniversity,
    isESIC: col.isESIC,
    establishmentYear: col.establishmentYear,
    nmcCollegeCode: col.nmcCollegeCode,
    mccInstituteCode: col.mccInstituteCode,
    totalMBBSSeats2026,
    mccRound1SeatsOffered: mccOffered,
    mccRound1SeatsAllotted: mccAllotted,
    approxOutsideMccRound1Pool,
    openRound1Profiles,
    studentCategoryRound1Profiles: [],
    allCategoryProfiles,
  };
});

