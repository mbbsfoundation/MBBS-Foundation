export type CategoryMode = "ALL" | "ELIGIBLE" | "CATEGORY_ONLY" | "MERIT_OPEN" | "PWD";
export type SupportedWindow = 250 | 500 | 1000 | 2500;

export const SUPPORTED_WINDOWS: readonly SupportedWindow[] = [250, 500, 1000, 2500] as const;

export interface ExactAllotmentRecord {
  candidateRank: number;
  collegeId: string;
  collegeName: string;
  state: string;
  managementType: string;
  isINI: boolean;
  isDeemed: boolean;
  isCentralUniversity: boolean;
  isESIC: boolean;
  quota: string;
  allottedCategory: string;
  candidateCategory: string;
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
  managementType: string;
  isINI: boolean;
  isDeemed: boolean;
  quota: string;
  allottedCategory: string;
  candidateCategory: string;
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
  managementType: string;
  isINI: boolean;
  isDeemed: boolean;
  quota: string;
  allottedCategory: string;
  candidateCategory: string;
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

export interface CollegeRound1CategoryProfile {
  quota: string;
  seatCategory: string;
  isPwD: boolean;
  specialPathway: string | null;
  seatsOffered: number;
  seatsAllotted: number;
  matrixGap: number;
  bestAIR: number | null;
  medianAIR: number | null;
  highestAIR: number | null;
  sampleSize: number;
}

export interface DomicileCollegeSummary {
  collegeId: string;
  collegeName: string;
  state: string;
  managementType: string;
  isINI: boolean;
  isDeemed: boolean;
  isCentralUniversity: boolean;
  isESIC: boolean;
  totalMBBSSeats2026: number;
  mccRound1SeatsOffered: number;
  mccRound1SeatsAllotted: number;
  approxOutsideMccRound1Pool: number;
  openRound1Profiles: CollegeRound1CategoryProfile[];
  studentCategoryRound1Profiles: CollegeRound1CategoryProfile[];
  allCategoryProfiles: CollegeRound1CategoryProfile[];
}

export interface DomicileStateSummaryResult {
  state: string;
  totalColleges: number;
  colleges: DomicileCollegeSummary[];
}

export interface WindowQueryParams {
  air: number;
  window: SupportedWindow;
  category?: string;
  categoryMode?: CategoryMode;
  isPwD?: boolean;
  quota?: string;
  managementType?: string;
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
    category: string;
    domicileState: string;
    isPwD: boolean;
  };
  exactMatch: ExactAllotmentRecord | null;
  nearbyAllotments: {
    better: NearbyAllotmentRecord[];
    lower: NearbyAllotmentRecord[];
  };
  windowAllotments: WindowAllotmentResult;
  domicileSummary: DomicileStateSummaryResult | null;
  dataContext: {
    authority: string;
    academicYear: number;
    round: string;
    course: string;
    isProvisional: boolean;
  };
}

export type CollegeTypeFilter = "ALL" | "GOVERNMENT" | "PRIVATE" | "DEEMED" | "CENTRAL" | "INI" | "ESIC";
export type CollegeSortOption = "NAME" | "STATE" | "TOTAL_SEATS" | "TYPICAL_AIR" | "BEST_AIR" | "LAST_AIR";

export interface CollegeSearchQueryParams {
  query?: string;
  state?: string;
  collegeType?: CollegeTypeFilter;
  managementType?: string;
  isINI?: boolean;
  isDeemed?: boolean;
  isCentralUniversity?: boolean;
  isESIC?: boolean;
  page?: number;
  pageSize?: number;
  sortBy?: CollegeSortOption;
  sortOrder?: "asc" | "desc";
  includeEvidence?: boolean;
}

export interface CollegeSearchResult {
  items: DomicileCollegeSummary[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
