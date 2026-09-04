import fs from "fs";
import path from "path";
import {
  getCPRDayReconciliationReport,
  loadUnifiedLiveCPRDayData,
  CPRDayStateReconciliationReport,
  CentreReconciliationItem,
} from "./cprReporting";
import { normalizeDisplayState } from "./cprCensus";
import { getLockedCensusStateList } from "./cprStateCensus";
import { normalizeStateCode } from "./sanjeevaniStorage";

export type VerificationSubmissionType =
  | "VERIFY_CORRECT"
  | "SUBMIT_CORRECTION"
  | "MISSING_COURSE";

export type VerificationSubmissionStatus =
  | "PENDING_ADMIN_REVIEW"
  | "NEEDS_CLARIFICATION"
  | "ACCEPTED"
  | "REJECTED"
  | "IMPLEMENTED";

export type SubmitterIdentityStatus =
  | "MAPPED_COORDINATOR_MATCHED"
  | "MAPPED_COORDINATOR_MOBILE_NOT_MATCHED"
  | "MAPPED_COORDINATOR_MOBILE_NOT_AVAILABLE"
  | "OTHER_MANUAL_REVIEW";

export interface CoordinatorVerificationSubmission {
  id: string; // e.g. "VERIF-1725448800000-A1B2"
  submissionType: VerificationSubmissionType;
  state: string; // Canonical state name
  stateCode: string;

  // Course / Venue mapping references
  courseOrSessionId?: string;
  canonicalVenueId?: string;
  venue?: string;
  city?: string;

  // Submitter details
  mappedCoordinatorName: string;
  submittedByName: string;
  submittedByMobile: string;
  submittedByEmail?: string;
  identityStatus: SubmitterIdentityStatus;

  // Current data snapshot (for VERIFY_CORRECT and SUBMIT_CORRECTION)
  currentDataJson?: {
    venue?: string;
    city?: string;
    state?: string;
    participantsTrained?: number;
    coordinators?: string[];
    champions?: string[];
    coursesCount?: number;
    rawCentreReference?: string;
  };

  // Proposed changes (for SUBMIT_CORRECTION and MISSING_COURSE)
  proposedChangesJson?: {
    venue?: string;
    city?: string;
    participantsTrained?: number;
    coordinators?: string[];
    champions?: string[];
    coursesCount?: number;
    courseDate?: string;
    other?: string;
    fieldsModified?: string[];
  };

  correctionNote?: string;
  evidenceNote?: string;
  evidenceFileReference?: string;

  // Review Workflow
  submissionStatus: VerificationSubmissionStatus;
  createdAt: string;
  updatedAt: string;
  adminReviewedBy?: string;
  adminReviewedAt?: string;
  adminNote?: string;
  adminDecision?: "ACCEPTED" | "REJECTED" | "NEEDS_CLARIFICATION" | "IMPLEMENTED";
}

const VERIFICATIONS_FILE_PATH = path.join(
  process.cwd(),
  "data",
  "cpr_coordinator_verifications.json"
);
const TMP_VERIFICATIONS_FILE_PATH = path.join(
  "/tmp",
  "cpr_coordinator_verifications.json"
);

// In-Memory Storage Cache for ultra-fast serverless operations
let cachedVerifications: CoordinatorVerificationSubmission[] | null = null;

/**
 * Loads all coordinator verification submissions from the persistent store or memory.
 */
export function loadAllVerifications(): CoordinatorVerificationSubmission[] {
  if (cachedVerifications && Array.isArray(cachedVerifications)) {
    return cachedVerifications;
  }

  try {
    let items: CoordinatorVerificationSubmission[] = [];

    // 1. Try reading from project data file
    if (fs.existsSync(VERIFICATIONS_FILE_PATH)) {
      const raw = fs.readFileSync(VERIFICATIONS_FILE_PATH, "utf-8");
      if (raw.trim()) {
        items = JSON.parse(raw);
      }
    }

    // 2. Try reading from /tmp fallback if available in serverless
    if (fs.existsSync(TMP_VERIFICATIONS_FILE_PATH)) {
      try {
        const tmpRaw = fs.readFileSync(TMP_VERIFICATIONS_FILE_PATH, "utf-8");
        if (tmpRaw.trim()) {
          const tmpItems: CoordinatorVerificationSubmission[] = JSON.parse(tmpRaw);
          const seen = new Set(items.map((i) => i.id));
          for (const ti of tmpItems) {
            if (!seen.has(ti.id)) {
              items.push(ti);
              seen.add(ti.id);
            }
          }
        }
      } catch (e) {
        // ignore
      }
    }

    cachedVerifications = items;
    return items;
  } catch (error) {
    console.error("Error loading coordinator verifications store:", error);
    return cachedVerifications || [];
  }
}

/**
 * Persists all coordinator verification submissions to the JSON file store or serverless fallback.
 */
export function persistAllVerifications(
  items: CoordinatorVerificationSubmission[]
): void {
  cachedVerifications = items;

  // 1. Try writing to primary data path
  try {
    const dir = path.dirname(VERIFICATIONS_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(
      VERIFICATIONS_FILE_PATH,
      JSON.stringify(items, null, 2),
      "utf-8"
    );
  } catch (err: any) {
    // Expected on read-only serverless lambdas (EROFS)
  }

  // 2. Fallback to /tmp if in serverless environment
  try {
    fs.writeFileSync(
      TMP_VERIFICATIONS_FILE_PATH,
      JSON.stringify(items, null, 2),
      "utf-8"
    );
  } catch (tmpErr) {
    // Memory cache remains active
  }
}

/**
 * Appends a new coordinator verification submission.
 */
export function saveVerificationSubmission(
  sub: Omit<CoordinatorVerificationSubmission, "id" | "createdAt" | "updatedAt" | "submissionStatus"> & {
    submissionStatus?: VerificationSubmissionStatus;
  }
): CoordinatorVerificationSubmission {
  const all = loadAllVerifications();
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  const id = `VERIF-${timestamp}-${randomSuffix}`;
  const nowIso = new Date(timestamp).toISOString();

  const fullRecord: CoordinatorVerificationSubmission = {
    ...sub,
    id,
    submissionStatus: sub.submissionStatus || "PENDING_ADMIN_REVIEW",
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  all.push(fullRecord);
  persistAllVerifications(all);
  return fullRecord;
}

/**
 * Updates the admin decision / status of an existing submission.
 */
export function updateVerificationStatus(
  id: string,
  update: {
    status: VerificationSubmissionStatus;
    adminReviewedBy?: string;
    adminNote?: string;
  }
): CoordinatorVerificationSubmission | null {
  const all = loadAllVerifications();
  const idx = all.findIndex((item) => item.id === id);
  if (idx === -1) return null;

  const current = all[idx];
  const nowIso = new Date().toISOString();

  const updated: CoordinatorVerificationSubmission = {
    ...current,
    submissionStatus: update.status,
    adminReviewedBy: update.adminReviewedBy || current.adminReviewedBy || "Admin",
    adminReviewedAt: nowIso,
    adminNote: update.adminNote !== undefined ? update.adminNote : current.adminNote,
    adminDecision:
      update.status === "ACCEPTED"
        ? "ACCEPTED"
        : update.status === "REJECTED"
        ? "REJECTED"
        : update.status === "NEEDS_CLARIFICATION"
        ? "NEEDS_CLARIFICATION"
        : update.status === "IMPLEMENTED"
        ? "IMPLEMENTED"
        : undefined,
    updatedAt: nowIso,
  };

  all[idx] = updated;
  persistAllVerifications(all);
  return updated;
}

/**
 * Normalizes an Indian phone / mobile number for uniform comparison.
 */
export function normalizeMobileNumber(raw: string): string {
  if (!raw || typeof raw !== "string") return "";
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) return digits;
  if (digits.length === 11 && digits.startsWith("0")) return digits.substring(1);
  if (digits.length === 12 && digits.startsWith("91")) return digits.substring(2);
  if (digits.length > 10) return digits.slice(-10);
  return digits;
}

/**
 * Normalizes a person name for comparison.
 */
export function normalizePersonName(name: string): string {
  if (!name || typeof name !== "string") return "";
  return name
    .toLowerCase()
    .replace(/\b(dr|prof|col|capt|brig|lt|col|maj|shri|sri|smt|mr|mrs|ms)\b\.?/g, "")
    .replace(/[^a-z\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

import { stateNameToSlug } from "./cprSlug";
export { stateNameToSlug };

/**
 * Resolves any state slug, code, or name variation to the authoritative canonical State name.
 */
export function slugToCanonicalState(rawQuery: string): string | null {
  if (!rawQuery || typeof rawQuery !== "string") return null;
  const q = rawQuery.trim().toLowerCase();

  const lockedStates = getLockedCensusStateList();
  // 1. Direct slug match
  for (const s of lockedStates) {
    if (stateNameToSlug(s.canonicalState) === q || stateNameToSlug(s.state) === q) {
      return s.canonicalState;
    }
  }

  // 2. Normalization match
  const norm = normalizeDisplayState(rawQuery);
  if (norm) {
    const found = lockedStates.find((s) => s.canonicalState.toLowerCase() === norm.toLowerCase());
    if (found) return found.canonicalState;
  }

  // 3. Fallback contains or matches
  const cleanQ = q.replace(/[^a-z0-9]/g, "");
  for (const s of lockedStates) {
    const cleanCanon = s.canonicalState.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (cleanCanon === cleanQ || normalizeStateCode(s.canonicalState).toLowerCase() === q) {
      return s.canonicalState;
    }
  }

  return null;
}

/**
 * Retrieves all distinct, sorted Coordinator names mapped to a specific State in Draft V1.
 */
export function getDistinctCoordinatorsForState(canonicalState: string): string[] {
  const normState = normalizeDisplayState(canonicalState).toLowerCase();
  const report = getCPRDayReconciliationReport(canonicalState);
  if (!report) return [];

  const coordinatorSet = new Set<string>();

  // Extract from venues in reconciliation report
  if (Array.isArray(report.venues)) {
    for (const v of report.venues) {
      if (Array.isArray(v.allCoordinators)) {
        for (const coord of v.allCoordinators) {
          const clean = coord.trim();
          if (clean && clean.toLowerCase() !== "tba" && clean.toLowerCase() !== "na") {
            coordinatorSet.add(clean);
          }
        }
      }
    }
  }

  // Extract from centres in reconciliation report
  if (Array.isArray(report.centres)) {
    for (const c of report.centres) {
      const coords = c.allCoordinators || c.baselineCoordinators || [];
      if (Array.isArray(coords)) {
        for (const coord of coords) {
          const clean = coord.trim();
          if (clean && clean.toLowerCase() !== "tba" && clean.toLowerCase() !== "na") {
            coordinatorSet.add(clean);
          }
        }
      }
    }
  }

  // Also check live data coordinators for this state
  const liveData = loadUnifiedLiveCPRDayData();
  const liveCoords = liveData.coordinatorsByState.get(report.canonicalState) || [];
  for (const lc of liveCoords) {
    if (lc.name && lc.name.trim()) {
      coordinatorSet.add(lc.name.trim());
    }
  }

  return Array.from(coordinatorSet).sort((a, b) => a.localeCompare(b, "en", { sensitivity: "base" }));
}

/**
 * Mapped Course / Venue item for a specific coordinator.
 */
export interface CoordinatorMappedCourseItem {
  canonicalVenueId: string;
  venueName: string;
  city: string;
  state: string;
  stateCode: string;
  reconciledTrained: number;
  baselineReportedTrained: number;
  participantsCertified: number;
  coursesCount: number;
  coordinators: string[];
  champions: string[];
  classification: string;
  statusBadge: "AWAITING_VERIFICATION" | "VERIFICATION_SUBMITTED" | "CORRECTION_SUBMITTED";
  recentSubmission?: CoordinatorVerificationSubmission;
}

/**
 * Retrieves all courses/venues mapped to a specific coordinator in a State.
 */
export function getCoordinatorCoursesForState(
  canonicalState: string,
  coordinatorName: string
): CoordinatorMappedCourseItem[] {
  const report = getCPRDayReconciliationReport(canonicalState);
  if (!report) return [];

  const normCoord = normalizePersonName(coordinatorName);
  if (!normCoord) return [];

  const allSubmissions = loadAllVerifications().filter(
    (s) => s.state.toLowerCase() === report.canonicalState.toLowerCase()
  );

  const matchedItems: CoordinatorMappedCourseItem[] = [];

  // Iterate over state venues
  const venueList = Array.isArray(report.venues) && report.venues.length > 0
    ? report.venues
    : [];

  for (const venue of venueList) {
    const coords = venue.allCoordinators || [];
    const matchesCoordinator = coords.some((c) => {
      const nc = normalizePersonName(c);
      return nc === normCoord || nc.includes(normCoord) || normCoord.includes(nc);
    });

    if (matchesCoordinator) {
      // Check existing submissions for this venue
      const venueSubs = allSubmissions.filter(
        (s) =>
          (s.canonicalVenueId && s.canonicalVenueId === venue.venueCode) ||
          (s.venue && s.venue.toLowerCase().trim() === venue.venue.toLowerCase().trim())
      );

      let statusBadge: CoordinatorMappedCourseItem["statusBadge"] = "AWAITING_VERIFICATION";
      let recentSubmission: CoordinatorVerificationSubmission | undefined;

      if (venueSubs.length > 0) {
        recentSubmission = venueSubs[venueSubs.length - 1];
        if (venueSubs.some((s) => s.submissionType === "SUBMIT_CORRECTION")) {
          statusBadge = "CORRECTION_SUBMITTED";
        } else if (venueSubs.some((s) => s.submissionType === "VERIFY_CORRECT")) {
          statusBadge = "VERIFICATION_SUBMITTED";
        }
      }

      matchedItems.push({
        canonicalVenueId: venue.venueCode || venue.serialNumber || "",
        venueName: venue.venue,
        city: venue.city,
        state: report.canonicalState,
        stateCode: report.stateCode,
        reconciledTrained: venue.participantsTrained,
        baselineReportedTrained: venue.baselineReportedTrained,
        participantsCertified: venue.participantsCertified,
        coursesCount: venue.totalCourseCount,
        coordinators: venue.allCoordinators || [],
        champions: venue.allChampions || [],
        classification: venue.classification,
        statusBadge,
        recentSubmission,
      });
    }
  }

  return matchedItems;
}

/**
 * Evaluates the identity status of a submitter against existing live records and coordinator lists.
 */
export function evaluateCoordinatorIdentity(
  canonicalState: string,
  coordinatorName: string,
  inputMobile: string
): {
  status: SubmitterIdentityStatus;
  availableMobiles: string[];
  matchedMobile?: string;
} {
  const normInputMobile = normalizeMobileNumber(inputMobile);
  const normName = normalizePersonName(coordinatorName);

  const stateCoordinators = getDistinctCoordinatorsForState(canonicalState);
  const isMappedCoordinator = stateCoordinators.some((c) => {
    const nc = normalizePersonName(c);
    return nc === normName || nc.includes(normName) || normName.includes(nc);
  });

  if (!isMappedCoordinator) {
    return {
      status: "OTHER_MANUAL_REVIEW",
      availableMobiles: [],
    };
  }

  // Look up known phone numbers for this coordinator in live records
  const liveData = loadUnifiedLiveCPRDayData();
  const stateCoords = liveData.coordinatorsByState.get(canonicalState) || [];
  const knownMobiles = new Set<string>();

  for (const c of stateCoords) {
    const nc = normalizePersonName(c.name);
    if (nc === normName || nc.includes(normName) || normName.includes(nc)) {
      if (c.mobile) {
        const clean = normalizeMobileNumber(c.mobile);
        if (clean.length === 10) {
          knownMobiles.add(clean);
        }
      }
    }
  }

  const availableMobiles = Array.from(knownMobiles);

  if (availableMobiles.length === 0) {
    return {
      status: "MAPPED_COORDINATOR_MOBILE_NOT_AVAILABLE",
      availableMobiles: [],
    };
  }

  if (normInputMobile && availableMobiles.includes(normInputMobile)) {
    return {
      status: "MAPPED_COORDINATOR_MATCHED",
      matchedMobile: normInputMobile,
      availableMobiles,
    };
  }

  return {
    status: "MAPPED_COORDINATOR_MOBILE_NOT_MATCHED",
    availableMobiles,
  };
}

/**
 * Counts submissions grouped by status for summary headers.
 */
export function getVerificationStatusCounts(stateFilter?: string): {
  total: number;
  pending: number;
  needsClarification: number;
  accepted: number;
  rejected: number;
  implemented: number;
} {
  let all = loadAllVerifications();
  if (stateFilter && stateFilter.trim() && stateFilter.toLowerCase() !== "all") {
    const sNorm = stateFilter.toLowerCase().trim();
    all = all.filter((s) => s.state.toLowerCase() === sNorm);
  }

  let pending = 0;
  let needsClarification = 0;
  let accepted = 0;
  let rejected = 0;
  let implemented = 0;

  for (const item of all) {
    switch (item.submissionStatus) {
      case "PENDING_ADMIN_REVIEW":
        pending++;
        break;
      case "NEEDS_CLARIFICATION":
        needsClarification++;
        break;
      case "ACCEPTED":
        accepted++;
        break;
      case "REJECTED":
        rejected++;
        break;
      case "IMPLEMENTED":
        implemented++;
        break;
    }
  }

  return {
    total: all.length,
    pending,
    needsClarification,
    accepted,
    rejected,
    implemented,
  };
}
