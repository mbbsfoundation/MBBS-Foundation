import fs from "fs";
import path from "path";
import { prisma } from "./prisma";
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
  id: string; // e.g. "VERIF-1725448800000-A1B2" or cuid
  submissionType: VerificationSubmissionType;
  state: string; // Canonical state name
  stateCode: string;

  // Course / Venue mapping references
  reportRowId?: string;
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

// In-Memory Storage Cache for fast fallbacks
let cachedVerifications: CoordinatorVerificationSubmission[] | null = null;

function prismaToSubmission(row: any): CoordinatorVerificationSubmission {
  return {
    id: row.id,
    submissionType: row.submissionType as VerificationSubmissionType,
    submissionStatus: (row.submissionStatus || "PENDING_ADMIN_REVIEW") as VerificationSubmissionStatus,
    state: row.state,
    stateCode: row.stateCode || normalizeStateCode(row.state),
    reportRowId: row.reportRowId || undefined,
    canonicalVenueId: row.canonicalVenueId || undefined,
    courseOrSessionId: row.courseOrSessionId || undefined,
    venue: row.venue || undefined,
    city: row.city || undefined,
    mappedCoordinatorName: row.mappedCoordinatorName || "",
    submittedByName: row.submittedByName,
    submittedByMobile: row.submittedByMobile,
    submittedByEmail: row.submittedByEmail || undefined,
    identityStatus: (row.identityStatus || "OTHER_MANUAL_REVIEW") as SubmitterIdentityStatus,
    currentDataJson: (row.currentDataJson as any) || undefined,
    proposedChangesJson: (row.proposedChangesJson as any) || undefined,
    correctionNote: row.correctionNote || undefined,
    evidenceNote: row.evidenceNote || undefined,
    adminReviewedBy: row.adminReviewedBy || undefined,
    adminReviewedAt: row.adminReviewedAt ? new Date(row.adminReviewedAt).toISOString() : undefined,
    adminNote: row.adminNote || undefined,
    adminDecision: row.adminDecision as any,
    createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : new Date().toISOString(),
    updatedAt: row.updatedAt ? new Date(row.updatedAt).toISOString() : new Date().toISOString(),
  };
}

/**
 * Loads all coordinator verification submissions from PostgreSQL via Prisma.
 */
export async function loadAllVerificationsAsync(options?: {
  state?: string;
  status?: string;
  type?: string;
  search?: string;
}): Promise<CoordinatorVerificationSubmission[]> {
  try {
    const where: any = {};
    if (options?.state && options.state !== "ALL" && options.state !== "ALL_INDIA") {
      where.state = {
        equals: options.state,
        mode: "insensitive",
      };
    }
    if (options?.status && options.status !== "ALL") {
      where.submissionStatus = options.status;
    }
    if (options?.type && options.type !== "ALL") {
      where.submissionType = options.type;
    }
    if (options?.search && options.search.trim()) {
      const q = options.search.trim();
      where.OR = [
        { submittedByName: { contains: q, mode: "insensitive" } },
        { mappedCoordinatorName: { contains: q, mode: "insensitive" } },
        { venue: { contains: q, mode: "insensitive" } },
        { city: { contains: q, mode: "insensitive" } },
        { submittedByMobile: { contains: q } },
        { canonicalVenueId: { contains: q, mode: "insensitive" } },
      ];
    }

    const rows = await prisma.cPRVerificationSubmission.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    const items = rows.map(prismaToSubmission);
    cachedVerifications = items;
    return items;
  } catch (error) {
    console.error("Error loading submissions from PostgreSQL (falling back to cache):", error);
    return loadAllVerifications();
  }
}

/**
 * Synchronous loader for fallback / scripts.
 */
export function loadAllVerifications(): CoordinatorVerificationSubmission[] {
  if (cachedVerifications && Array.isArray(cachedVerifications)) {
    return cachedVerifications;
  }

  try {
    let items: CoordinatorVerificationSubmission[] = [];

    if (fs.existsSync(VERIFICATIONS_FILE_PATH)) {
      const raw = fs.readFileSync(VERIFICATIONS_FILE_PATH, "utf-8");
      if (raw.trim()) {
        items = JSON.parse(raw);
      }
    }

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
 * Persists all coordinator verification submissions to memory/tmp cache.
 */
export function persistAllVerifications(
  items: CoordinatorVerificationSubmission[]
): void {
  cachedVerifications = items;
  try {
    fs.writeFileSync(TMP_VERIFICATIONS_FILE_PATH, JSON.stringify(items, null, 2), "utf-8");
  } catch (e) {}
}

/**
 * Persists all coordinator verification submissions to PostgreSQL.
 */
export async function saveVerificationSubmissionAsync(
  sub: Omit<CoordinatorVerificationSubmission, "id" | "createdAt" | "updatedAt" | "submissionStatus"> & {
    submissionStatus?: VerificationSubmissionStatus;
  }
): Promise<CoordinatorVerificationSubmission> {
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  const id = `VERIF-${timestamp}-${randomSuffix}`;

  try {
    const row = await prisma.cPRVerificationSubmission.create({
      data: {
        id,
        submissionType: sub.submissionType,
        submissionStatus: sub.submissionStatus || "PENDING_ADMIN_REVIEW",
        state: sub.state,
        stateCode: sub.stateCode || normalizeStateCode(sub.state),
        reportRowId: sub.reportRowId || undefined,
        canonicalVenueId: sub.canonicalVenueId || undefined,
        courseOrSessionId: sub.courseOrSessionId || undefined,
        venue: sub.venue || undefined,
        city: sub.city || undefined,
        mappedCoordinatorName: sub.mappedCoordinatorName || sub.submittedByName,
        submittedByName: sub.submittedByName,
        submittedByMobile: sub.submittedByMobile,
        submittedByEmail: sub.submittedByEmail || undefined,
        identityStatus: sub.identityStatus,
        currentDataJson: sub.currentDataJson || undefined,
        proposedChangesJson: sub.proposedChangesJson || undefined,
        correctionNote: sub.correctionNote || undefined,
        evidenceNote: sub.evidenceNote || undefined,
      },
    });

    const item = prismaToSubmission(row);
    if (!cachedVerifications) cachedVerifications = [];
    cachedVerifications.unshift(item);
    return item;
  } catch (dbError) {
    console.error("PostgreSQL write failed, falling back to file/memory:", dbError);
    return saveVerificationSubmission(sub);
  }
}

/**
 * Synchronous save for backwards compatibility and offline tests.
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
  cachedVerifications = all;
  try {
    fs.writeFileSync(TMP_VERIFICATIONS_FILE_PATH, JSON.stringify(all, null, 2), "utf-8");
  } catch (e) {}
  return fullRecord;
}

/**
 * Updates the admin decision / status of an existing submission in PostgreSQL.
 */
export async function updateVerificationStatusAsync(
  id: string,
  update: {
    status: VerificationSubmissionStatus;
    adminReviewedBy?: string;
    adminNote?: string;
  }
): Promise<CoordinatorVerificationSubmission | null> {
  const nowIso = new Date().toISOString();
  const decision =
    update.status === "ACCEPTED"
      ? "ACCEPTED"
      : update.status === "REJECTED"
      ? "REJECTED"
      : update.status === "NEEDS_CLARIFICATION"
      ? "NEEDS_CLARIFICATION"
      : update.status === "IMPLEMENTED"
      ? "IMPLEMENTED"
      : undefined;

  try {
    const row = await prisma.cPRVerificationSubmission.update({
      where: { id },
      data: {
        submissionStatus: update.status,
        adminReviewedBy: update.adminReviewedBy || "Administrator",
        adminReviewedAt: new Date(nowIso),
        adminNote: update.adminNote,
        adminDecision: decision,
      },
    });

    const item = prismaToSubmission(row);
    if (cachedVerifications) {
      const idx = cachedVerifications.findIndex((i) => i.id === id);
      if (idx !== -1) cachedVerifications[idx] = item;
    }
    return item;
  } catch (dbError) {
    console.error("PostgreSQL update failed, using fallback:", dbError);
    return updateVerificationStatus(id, update);
  }
}

/**
 * Synchronous status updater for fallback.
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
    adminReviewedBy: update.adminReviewedBy || current.adminReviewedBy || "Administrator",
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
  cachedVerifications = all;
  return updated;
}

import {
  stateNameToSlug,
  slugToCanonicalState,
  normalizePersonName,
  normalizeMobileNumber,
  formatCoordinatorDisplayName,
  getNormalizedCoordinatorsForDisplay,
} from "./cprSlug";

export {
  stateNameToSlug,
  slugToCanonicalState,
  normalizePersonName,
  normalizeMobileNumber,
  formatCoordinatorDisplayName,
  getNormalizedCoordinatorsForDisplay,
};


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
