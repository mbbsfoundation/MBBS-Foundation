import { CounsellingSeatCategory, CounsellingManagementType } from "../generated/prisma/client";
import { StudentCounsellingProfile, SpecialPathwayEligibility, StudentGoal } from "./counsellingService";
import { OpportunityBand, EvidenceConfidenceLevel } from "./recommendationEngine";

export interface ValidationErrorDetail {
  field: string;
  message: string;
}

export interface ValidatedRecommendationRequest {
  profile: StudentCounsellingProfile;
  limitPerBand: number;
  opportunityBands?: OpportunityBand[];
  confidenceLevels?: EvidenceConfidenceLevel[];
  route?: "MCC" | "STATE_ESTIMATE";
  state?: string;
  managementType?: CounsellingManagementType;
  quota?: string;
  hasSeatIncrease2026?: boolean;
  isNewEstablishment2026?: boolean;
}

const VALID_CATEGORIES = new Set(["OPEN", "OBC", "EWS", "SC", "ST"]);
const VALID_GOALS = new Set(["GET_SEAT", "UPGRADE", "COMPARE", "RETAIN"]);
const VALID_MINORITY_TYPES = new Set(["MUSLIM", "JAIN", "OTHER"]);
const VALID_OPPORTUNITY_BANDS = new Set(["STRONG", "REALISTIC", "STRETCH", "LOW_EVIDENCE"]);
const VALID_CONFIDENCE_LEVELS = new Set(["HIGH", "MODERATE", "LOW"]);
const VALID_MANAGEMENT_TYPES = new Set(["GOVERNMENT", "PRIVATE", "DEEMED", "TRUST", "SOCIETY", "OTHER"]);

/**
 * Validates the POST /api/counselling/recommendations request body.
 */
export function validateRecommendationRequest(body: any): {
  isValid: boolean;
  data?: ValidatedRecommendationRequest;
  errors: ValidationErrorDetail[];
} {
  const errors: ValidationErrorDetail[] = [];

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return {
      isValid: false,
      errors: [{ field: "body", message: "Request body must be a valid JSON object" }],
    };
  }

  // 1. AIR Validation
  if (body.air === undefined || body.air === null) {
    errors.push({ field: "air", message: "Student AIR (air) is required" });
  } else if (typeof body.air !== "number" || !Number.isInteger(body.air) || body.air <= 0 || body.air > 2500000) {
    errors.push({ field: "air", message: "Student AIR must be a positive integer between 1 and 2,500,000" });
  }

  // 2. Category Validation
  if (!body.category) {
    errors.push({ field: "category", message: "Seat category (category) is required (OPEN, OBC, EWS, SC, ST)" });
  } else if (typeof body.category !== "string" || !VALID_CATEGORIES.has(body.category.toUpperCase())) {
    errors.push({ field: "category", message: `Invalid category '${body.category}'. Allowed: OPEN, OBC, EWS, SC, ST` });
  }

  // 3. isPwD Validation
  if (body.isPwD === undefined || body.isPwD === null) {
    errors.push({ field: "isPwD", message: "isPwD boolean flag is required" });
  } else if (typeof body.isPwD !== "boolean") {
    errors.push({ field: "isPwD", message: "isPwD must be a boolean (true or false)" });
  }

  // 4. domicileState Validation
  if (!body.domicileState) {
    errors.push({ field: "domicileState", message: "Domicile state (domicileState) is required" });
  } else if (typeof body.domicileState !== "string" || body.domicileState.trim().length < 2 || body.domicileState.trim().length > 60) {
    errors.push({ field: "domicileState", message: "domicileState must be a non-empty string between 2 and 60 characters" });
  }

  // 5. goal Validation
  let goal: StudentGoal = "GET_SEAT";
  if (body.goal !== undefined && body.goal !== null) {
    if (typeof body.goal !== "string" || !VALID_GOALS.has(body.goal.toUpperCase())) {
      errors.push({ field: "goal", message: `Invalid goal '${body.goal}'. Allowed: GET_SEAT, UPGRADE, COMPARE, RETAIN` });
    } else {
      goal = body.goal.toUpperCase() as StudentGoal;
    }
  }

  // 6. Optional string fields
  const gender = typeof body.gender === "string" ? body.gender.trim() : undefined;
  const currentCollegeId = typeof body.currentCollegeId === "string" ? body.currentCollegeId.trim() : undefined;
  const currentQuota = typeof body.currentQuota === "string" ? body.currentQuota.trim() : undefined;
  const currentSeatCategory = typeof body.currentSeatCategory === "string" ? body.currentSeatCategory.trim() : undefined;

  // 7. specialPathwayEligibility Validation
  let specialPathwayEligibility: SpecialPathwayEligibility | undefined;
  if (body.specialPathwayEligibility !== undefined && body.specialPathwayEligibility !== null) {
    if (typeof body.specialPathwayEligibility !== "object" || Array.isArray(body.specialPathwayEligibility)) {
      errors.push({ field: "specialPathwayEligibility", message: "specialPathwayEligibility must be an object" });
    } else {
      const sp = body.specialPathwayEligibility;
      const booleanFields = [
        "isNRI",
        "isMinority",
        "isESI",
        "isCW",
        "isInternalDU",
        "isInternalIPU",
        "isInternalPuducherry",
        "isAMUInternal",
      ];

      for (const bf of booleanFields) {
        if (sp[bf] !== undefined && typeof sp[bf] !== "boolean") {
          errors.push({ field: `specialPathwayEligibility.${bf}`, message: `${bf} must be a boolean` });
        }
      }

      if (sp.minorityType !== undefined && sp.minorityType !== null) {
        if (typeof sp.minorityType !== "string" || !VALID_MINORITY_TYPES.has(sp.minorityType.toUpperCase())) {
          errors.push({
            field: "specialPathwayEligibility.minorityType",
            message: `Invalid minorityType '${sp.minorityType}'. Allowed: MUSLIM, JAIN, OTHER`,
          });
        }
      }

      specialPathwayEligibility = {
        isNRI: sp.isNRI === true,
        isMinority: sp.isMinority === true,
        minorityType: typeof sp.minorityType === "string" ? (sp.minorityType.toUpperCase() as any) : undefined,
        isESI: sp.isESI === true,
        isCW: sp.isCW === true,
        isInternalDU: sp.isInternalDU === true,
        isInternalIPU: sp.isInternalIPU === true,
        isInternalPuducherry: sp.isInternalPuducherry === true,
        isAMUInternal: sp.isAMUInternal === true,
      };
    }
  }

  // 8. limitPerBand Validation
  let limitPerBand = 25; // default 25
  if (body.limitPerBand !== undefined && body.limitPerBand !== null) {
    if (typeof body.limitPerBand !== "number" || !Number.isInteger(body.limitPerBand) || body.limitPerBand < 1 || body.limitPerBand > 100) {
      errors.push({ field: "limitPerBand", message: "limitPerBand must be an integer between 1 and 100 (default: 25)" });
    } else {
      limitPerBand = body.limitPerBand;
    }
  }

  // 9. Opportunity Bands Filter Validation
  let opportunityBands: OpportunityBand[] | undefined;
  if (body.opportunityBands !== undefined && body.opportunityBands !== null) {
    if (!Array.isArray(body.opportunityBands)) {
      errors.push({ field: "opportunityBands", message: "opportunityBands must be an array of strings" });
    } else {
      const invalidBands = body.opportunityBands.filter((b: any) => typeof b !== "string" || !VALID_OPPORTUNITY_BANDS.has(b.toUpperCase()));
      if (invalidBands.length > 0) {
        errors.push({ field: "opportunityBands", message: `Invalid opportunity band(s): ${invalidBands.join(", ")}` });
      } else {
        opportunityBands = body.opportunityBands.map((b: string) => b.toUpperCase() as OpportunityBand);
      }
    }
  }

  // 10. Route Filter Validation
  let route: "MCC" | "STATE_ESTIMATE" | undefined;
  if (body.route !== undefined && body.route !== null) {
    if (body.route !== "MCC" && body.route !== "STATE_ESTIMATE") {
      errors.push({ field: "route", message: "route must be either 'MCC' or 'STATE_ESTIMATE'" });
    } else {
      route = body.route;
    }
  }

  // 11. State & Management Type filters
  const state = typeof body.state === "string" && body.state.trim().length > 0 ? body.state.trim() : undefined;
  let managementType: CounsellingManagementType | undefined;
  if (body.managementType !== undefined && body.managementType !== null) {
    if (typeof body.managementType !== "string" || !VALID_MANAGEMENT_TYPES.has(body.managementType.toUpperCase())) {
      errors.push({ field: "managementType", message: `Invalid managementType '${body.managementType}'` });
    } else {
      managementType = body.managementType.toUpperCase() as CounsellingManagementType;
    }
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  const profile: StudentCounsellingProfile = {
    air: body.air,
    category: body.category.toUpperCase() as CounsellingSeatCategory,
    isPwD: body.isPwD,
    domicileState: body.domicileState.trim(),
    gender,
    currentCollegeId,
    currentQuota,
    currentSeatCategory,
    goal,
    specialPathwayEligibility,
  };

  return {
    isValid: true,
    data: {
      profile,
      limitPerBand,
      opportunityBands,
      route,
      state,
      managementType,
      quota: typeof body.quota === "string" ? body.quota.trim() : undefined,
      hasSeatIncrease2026: typeof body.hasSeatIncrease2026 === "boolean" ? body.hasSeatIncrease2026 : undefined,
      isNewEstablishment2026: typeof body.isNewEstablishment2026 === "boolean" ? body.isNewEstablishment2026 : undefined,
    },
    errors: [],
  };
}

/**
 * Validates GET /api/counselling/colleges query parameters.
 */
export function validateCollegeQueryParams(searchParams: URLSearchParams): {
  isValid: boolean;
  params?: {
    query?: string;
    state?: string;
    managementType?: CounsellingManagementType;
    collegeType?: "ALL" | "GOVERNMENT" | "PRIVATE" | "DEEMED" | "CENTRAL" | "INI" | "ESIC";
    isINI?: boolean;
    isDeemed?: boolean;
    isCentralUniversity?: boolean;
    isESIC?: boolean;
    isNewEstablishment?: boolean;
    page: number;
    pageSize: number;
    sortBy: "NAME" | "STATE" | "TOTAL_SEATS" | "TYPICAL_AIR" | "BEST_AIR" | "LAST_AIR";
    sortOrder: "asc" | "desc";
    includeEvidence: boolean;
  };
  errors: ValidationErrorDetail[];
} {
  const errors: ValidationErrorDetail[] = [];

  const query = searchParams.get("search")?.trim() || searchParams.get("query")?.trim() || undefined;
  const state = searchParams.get("state")?.trim() || undefined;

  let managementType: CounsellingManagementType | undefined;
  const mt = searchParams.get("managementType")?.trim();
  if (mt) {
    if (!VALID_MANAGEMENT_TYPES.has(mt.toUpperCase())) {
      errors.push({ field: "managementType", message: `Invalid managementType '${mt}'` });
    } else {
      managementType = mt.toUpperCase() as CounsellingManagementType;
    }
  }

  const parseBool = (key: string): boolean | undefined => {
    const val = searchParams.get(key)?.trim()?.toLowerCase();
    if (!val) return undefined;
    if (val === "true" || val === "1") return true;
    if (val === "false" || val === "0") return false;
    errors.push({ field: key, message: `${key} must be a boolean ('true' or 'false')` });
    return undefined;
  };

  const isINI = parseBool("isINI");
  const isDeemed = parseBool("isDeemed");
  const isCentralUniversity = parseBool("isCentralUniversity");
  const isESIC = parseBool("isESIC");
  const isNewEstablishment = parseBool("isNewEstablishment2026") ?? parseBool("isNewEstablishment");

  let page = 1;
  const p = searchParams.get("page")?.trim();
  if (p) {
    const parsedP = parseInt(p, 10);
    if (isNaN(parsedP) || parsedP < 1) {
      errors.push({ field: "page", message: "page must be a positive integer >= 1" });
    } else {
      page = parsedP;
    }
  }

  let pageSize = 25;
  const ps = searchParams.get("pageSize")?.trim() || searchParams.get("limit")?.trim();
  if (ps) {
    const parsedPS = parseInt(ps, 10);
    if (isNaN(parsedPS) || parsedPS < 1 || parsedPS > 100) {
      errors.push({ field: "pageSize", message: "pageSize must be an integer between 1 and 100 (default: 25)" });
    } else {
      pageSize = parsedPS;
    }
  }

  const VALID_COLLEGE_TYPES = new Set(["ALL", "GOVERNMENT", "PRIVATE", "DEEMED", "CENTRAL", "INI", "ESIC"]);
  let collegeType: "ALL" | "GOVERNMENT" | "PRIVATE" | "DEEMED" | "CENTRAL" | "INI" | "ESIC" | undefined;
  const rawType = searchParams.get("collegeType")?.trim();
  if (rawType) {
    if (!VALID_COLLEGE_TYPES.has(rawType.toUpperCase())) {
      errors.push({ field: "collegeType", message: `Invalid collegeType '${rawType}'. Allowed: ALL, GOVERNMENT, PRIVATE, DEEMED, CENTRAL, INI, ESIC` });
    } else {
      collegeType = rawType.toUpperCase() as any;
    }
  }

  const VALID_SORT_OPTIONS = new Set(["NAME", "STATE", "TOTAL_SEATS", "TYPICAL_AIR", "BEST_AIR", "LAST_AIR"]);
  let sortBy: "NAME" | "STATE" | "TOTAL_SEATS" | "TYPICAL_AIR" | "BEST_AIR" | "LAST_AIR" = "TYPICAL_AIR";
  const rawSort = searchParams.get("sortBy")?.trim();
  if (rawSort) {
    if (!VALID_SORT_OPTIONS.has(rawSort.toUpperCase())) {
      errors.push({ field: "sortBy", message: `Invalid sortBy '${rawSort}'. Allowed: NAME, STATE, TOTAL_SEATS, TYPICAL_AIR, BEST_AIR, LAST_AIR` });
    } else {
      sortBy = rawSort.toUpperCase() as any;
    }
  }

  let sortOrder: "asc" | "desc" = "asc";
  const rawOrder = searchParams.get("sortOrder")?.trim()?.toLowerCase();
  if (rawOrder) {
    if (rawOrder === "asc" || rawOrder === "desc") {
      sortOrder = rawOrder;
    } else {
      errors.push({ field: "sortOrder", message: "sortOrder must be 'asc' or 'desc'" });
    }
  }

  const includeEvidence = parseBool("includeEvidence") ?? true;

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  return {
    isValid: true,
    params: {
      query,
      state,
      managementType,
      collegeType,
      isINI,
      isDeemed,
      isCentralUniversity,
      isESIC,
      isNewEstablishment,
      page,
      pageSize,
      sortBy,
      sortOrder,
      includeEvidence,
    },
    errors: [],
  };
}

const VALID_CATEGORY_MODES = new Set(["ALL", "ELIGIBLE", "CATEGORY_ONLY", "MERIT_OPEN", "PWD"]);
const VALID_WINDOWS = new Set([250, 500, 1000, 2500]);

export interface ValidatedEvidenceQueryParams {
  air: number;
  window: 250 | 500 | 1000 | 2500;
  category: CounsellingSeatCategory;
  categoryMode: "ALL" | "ELIGIBLE" | "CATEGORY_ONLY" | "MERIT_OPEN" | "PWD";
  isPwD: boolean;
  domicileState?: string;
  quota?: string;
  managementType?: CounsellingManagementType;
  state?: string;
  page: number;
  pageSize: number;
}

/**
 * Validates GET /api/counselling/round1/evidence query parameters.
 */
export function validateEvidenceQueryParams(searchParams: URLSearchParams): {
  isValid: boolean;
  params?: ValidatedEvidenceQueryParams;
  errors: ValidationErrorDetail[];
} {
  const errors: ValidationErrorDetail[] = [];

  // 1. AIR Validation (Required)
  const rawAir = searchParams.get("air")?.trim();
  let air = 0;
  if (!rawAir) {
    errors.push({ field: "air", message: "Student AIR (air) query parameter is required" });
  } else {
    const parsedAir = parseInt(rawAir, 10);
    if (isNaN(parsedAir) || parsedAir <= 0 || parsedAir > 2500000) {
      errors.push({ field: "air", message: "Student AIR must be a positive integer between 1 and 2,500,000" });
    } else {
      air = parsedAir;
    }
  }

  // 2. Window Validation (Optional, default 500)
  let window: 250 | 500 | 1000 | 2500 = 500;
  const rawWindow = searchParams.get("window")?.trim();
  if (rawWindow) {
    const parsedWin = parseInt(rawWindow, 10);
    if (isNaN(parsedWin) || !VALID_WINDOWS.has(parsedWin)) {
      errors.push({ field: "window", message: `Invalid window '${rawWindow}'. Supported windows: 250, 500, 1000, 2500` });
    } else {
      window = parsedWin as 250 | 500 | 1000 | 2500;
    }
  }

  // 3. Category Validation (Optional, default OPEN)
  let category: CounsellingSeatCategory = CounsellingSeatCategory.OPEN;
  const rawCategory = searchParams.get("category")?.trim();
  if (rawCategory) {
    if (!VALID_CATEGORIES.has(rawCategory.toUpperCase())) {
      errors.push({ field: "category", message: `Invalid category '${rawCategory}'. Allowed: OPEN, OBC, EWS, SC, ST` });
    } else {
      category = rawCategory.toUpperCase() as CounsellingSeatCategory;
    }
  }

  // 4. CategoryMode Validation (Optional, default ELIGIBLE)
  let categoryMode: "ALL" | "ELIGIBLE" | "CATEGORY_ONLY" | "MERIT_OPEN" | "PWD" = "ELIGIBLE";
  const rawMode = searchParams.get("categoryMode")?.trim();
  if (rawMode) {
    if (!VALID_CATEGORY_MODES.has(rawMode.toUpperCase())) {
      errors.push({ field: "categoryMode", message: `Invalid categoryMode '${rawMode}'. Allowed: ALL, ELIGIBLE, CATEGORY_ONLY, MERIT_OPEN, PWD` });
    } else {
      categoryMode = rawMode.toUpperCase() as "ALL" | "ELIGIBLE" | "CATEGORY_ONLY" | "MERIT_OPEN" | "PWD";
    }
  }

  // 5. isPwD Validation (Optional, default false)
  let isPwD = false;
  const rawPwD = searchParams.get("isPwD")?.trim()?.toLowerCase();
  if (rawPwD) {
    if (rawPwD === "true" || rawPwD === "1") {
      isPwD = true;
    } else if (rawPwD === "false" || rawPwD === "0") {
      isPwD = false;
    } else {
      errors.push({ field: "isPwD", message: "isPwD must be a boolean ('true' or 'false')" });
    }
  }

  // 6. Domicile State & State Filters
  const domicileState = searchParams.get("domicileState")?.trim() || undefined;
  const state = searchParams.get("state")?.trim() || undefined;

  // 7. Quota Filter
  const quota = searchParams.get("quota")?.trim() || undefined;

  // 8. Management Type Filter
  let managementType: CounsellingManagementType | undefined;
  const rawMgmt = searchParams.get("managementType")?.trim();
  if (rawMgmt) {
    if (!VALID_MANAGEMENT_TYPES.has(rawMgmt.toUpperCase())) {
      errors.push({ field: "managementType", message: `Invalid managementType '${rawMgmt}'. Allowed: GOVERNMENT, PRIVATE, DEEMED, CENTRAL, INI, OTHER` });
    } else {
      managementType = rawMgmt.toUpperCase() as CounsellingManagementType;
    }
  }

  // 9. Pagination
  let page = 1;
  const rawPage = searchParams.get("page")?.trim();
  if (rawPage) {
    const parsedPage = parseInt(rawPage, 10);
    if (isNaN(parsedPage) || parsedPage < 1) {
      errors.push({ field: "page", message: "page must be a positive integer >= 1" });
    } else {
      page = parsedPage;
    }
  }

  let pageSize = 50;
  const rawPageSize = searchParams.get("pageSize")?.trim() || searchParams.get("limit")?.trim();
  if (rawPageSize) {
    const parsedPageSize = parseInt(rawPageSize, 10);
    if (isNaN(parsedPageSize) || parsedPageSize < 1 || parsedPageSize > 100) {
      errors.push({ field: "pageSize", message: "pageSize must be an integer between 1 and 100 (default: 50)" });
    } else {
      pageSize = parsedPageSize;
    }
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  return {
    isValid: true,
    params: {
      air,
      window,
      category,
      categoryMode,
      isPwD,
      domicileState,
      quota,
      managementType,
      state,
      page,
      pageSize,
    },
    errors: [],
  };
}

