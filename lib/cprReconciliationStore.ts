import fs from "fs";
import path from "path";
import { getFrozenBaselineVenueRegistry, getCanonicalVenuesByState, CanonicalPhysicalVenue } from "./cprVenueRegistry";
import { loadUnifiedLiveCPRDayData, normalizeCityName, scoreVenueMatch } from "./cprReporting";
import { getLockedCensusStateList, getLockedOfficialStateCensus } from "./cprStateCensus";
import { normalizeDisplayState } from "./cprCensus";
import { normalizeStateCode } from "./sanjeevaniStorage";

export const CPRDAY_CENSUS_DRAFT_VERSION = "CPRDAY_CENSUS_DRAFT_V1";

export type StateVerificationStatus =
  | "PENDING"
  | "VERIFIED"
  | "CORRECTION_RECEIVED"
  | "REVISED"
  | "FINALIZED";

export interface StateVerificationRecord {
  state: string;
  canonicalState: string;
  status: StateVerificationStatus;
  verifiedBy?: string;
  verificationDate?: string;
  verificationNote?: string;
  correctionReference?: string;
}

export type ReconciliationDecisionType =
  | "PENDING"
  | "SAME_BASELINE_VENUE"
  | "SUPPLEMENTARY_NEW_COURSE_EXISTING_VENUE"
  | "SUPPLEMENTARY_NEW_VENUE"
  | "KEEP_REVIEW_REQUIRED"
  | "DATA_CORRECTION_REQUIRED";

export type SuggestedCategory =
  | "STRONG_SAME_BASELINE_CANDIDATE"
  | "POSSIBLE_SAME_BASELINE_CANDIDATE"
  | "NO_RELIABLE_BASELINE_MATCH"
  | "AMBIGUOUS_MULTIPLE_CANDIDATES"
  | "DATA_QUALITY_ISSUE";

export interface VenueReviewCandidateMatch {
  canonicalVenueId: string;
  canonicalVenueName: string;
  city: string;
  baselineCourseCount: number;
  baselineReportedTrained: number;
  matchScore: number;
  matchReason: string;
  cityMatch: boolean;
  cityMismatch: boolean;
}

/**
 * Review Group Item representing one live certificate venue group requiring administrative review.
 */
export interface VenueReviewSnapshotItem {
  reviewId: string;              // e.g. "REV-001"
  state: string;                 // Canonical state (e.g. "Maharashtra")
  city: string;                  // Live city
  liveVenue: string;             // Live venue name
  certifiedCount: number;        // Unique named participant certificate count
  sampleCertificateIds: string[];// Sample Certificate IDs (up to 10)
  allCertificateIds: string[];   // All Certificate IDs in this group

  // Evidence-Based Candidate Metadata
  candidateMatches: VenueReviewCandidateMatch[]; // Top candidate baseline matches
  bestCandidateVenueId?: string;
  bestCandidateVenueName?: string;
  bestCandidateCity?: string;
  bestCandidateSessions?: number;
  bestCandidateReportedTrained?: number;
  matchConfidence: number;       // 0.0 to 1.0
  matchReason: string;
  suggestedClassification: SuggestedCategory;
  suggestedDecision: ReconciliationDecisionType;

  // Final Administrative Decision (Reversible)
  status: "PENDING" | "APPROVED" | "REJECTED";
  finalDecision: ReconciliationDecisionType;
  finalCanonicalVenueId?: string;
  finalVenueName?: string;
  finalCity?: string;
  finalState?: string;
  supplementaryTrainedCount?: number;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNote?: string;
}

const DECISIONS_FILE_PATH = path.join(process.cwd(), "data", "cpr_venue_reconciliation_decisions.json");

let memoryDecisionsCache: Map<string, Partial<VenueReviewSnapshotItem>> | null = null;

function loadPersistedDecisions(): Map<string, Partial<VenueReviewSnapshotItem>> {
  if (memoryDecisionsCache) return memoryDecisionsCache;

  const map = new Map<string, Partial<VenueReviewSnapshotItem>>();
  try {
    if (fs.existsSync(DECISIONS_FILE_PATH)) {
      const raw = fs.readFileSync(DECISIONS_FILE_PATH, "utf-8");
      const list = JSON.parse(raw);
      if (Array.isArray(list)) {
        list.forEach((item: Partial<VenueReviewSnapshotItem>) => {
          if (item.reviewId) map.set(item.reviewId, item);
        });
      }
    }
  } catch (err) {
    console.warn("Could not read venue reconciliation decisions file, using in-memory store:", err);
  }

  memoryDecisionsCache = map;
  return map;
}

function persistDecisionsToFile(map: Map<string, Partial<VenueReviewSnapshotItem>>): void {
  try {
    const list = Array.from(map.values());
    const dir = path.dirname(DECISIONS_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DECISIONS_FILE_PATH, JSON.stringify(list, null, 2), "utf-8");
  } catch (err) {
    console.warn("Could not write venue reconciliation decisions file:", err);
  }
}

// Known institutional acronyms / expansions
const ACRONYM_MAP = new Map([
  ["svmc", "sri venkateswara"],
  ["svims", "sri venkateswara"],
  ["spmcw", "sri padmavathi"],
  ["gmh", "maternity"],
  ["acsrgmc", "acsr"],
  ["acsr", "acsr"],
  ["igmc", "indira gandhi"],
  ["cims", "chhattisgarh"],
  ["gmc", "government medical"],
  ["mpgimer", "maharashtra postgraduate institute of medical education & research"],
  ["mgm mc", "mgm"],
  ["mgm", "mgm"],
  ["pgimer", "postgraduate institute"],
  ["sgrd", "sri guru ram das"],
  ["pcms", "people"],
  ["rkdf", "rkdf"],
  ["smbt", "smbt"],
  ["nmch", "nalanda"],
  ["igims", "indira gandhi"],
  ["aiims", "all india institute"],
  ["mch", "maternal and child"],
  ["mchs", "municipal corporation high school"],
  ["dav", "dav"],
  ["dps", "delhi public"],
]);

const GENERIC_STOPWORDS = new Set([
  "hospital", "hospitals", "medical", "college", "colleges", "school", "schools",
  "institute", "institution", "institutes", "centre", "center", "auditorium",
  "hall", "building", "campus", "department", "dept", "nursing", "health", "sciences",
  "government", "govt", "private", "memorial", "public", "international", "trust",
  "society", "vidyalay", "vidyalaya", "shikshan", "sanstha", "state", "district",
  "city", "floor", "block", "room", "dr", "prof", "shri", "smt", "and", "the", "of", "in", "at",
  "primary", "secondary", "higher", "english", "medium", "academic"
]);

function extractSignificantTokens(name: string, city?: string): string[] {
  if (!name) return [];
  const normCity = (city || "").toLowerCase().trim();
  let cleaned = name.toLowerCase().replace(/[^a-z0-9\s]/g, " ");
  if (normCity) {
    cleaned = cleaned.replace(new RegExp(`\\b${normCity}\\b`, "g"), " ");
  }
  return cleaned.split(/\s+/).filter((t) => t.length > 1 && !GENERIC_STOPWORDS.has(t));
}

function evaluateEvidence(
  liveVenue: string,
  liveCity: string,
  canonVenue: string,
  canonCity: string,
  aliases: string[] = []
): { score: number; reason: string; cityMatch: boolean; cityMismatch: boolean; matchingTokens: string[] } {
  const normLCity = normalizeCityName(liveCity);
  const normCCity = normalizeCityName(canonCity);
  const cityMatch = !!(normLCity && normCCity && (normLCity === normCCity || normLCity.includes(normCCity) || normCCity.includes(normLCity)));
  const cityMismatch = !!(normLCity && normCCity && !cityMatch);

  const lTokens = extractSignificantTokens(liveVenue, liveCity);
  const cTokens = extractSignificantTokens(canonVenue, canonCity);

  const matchingTokens = lTokens.filter((t) => cTokens.includes(t));

  const lClean = liveVenue.toLowerCase();
  const cClean = canonVenue.toLowerCase();

  let acronymMatch = false;
  let matchedAcr = "";
  for (const [acr, exp] of ACRONYM_MAP.entries()) {
    if (
      (lClean.includes(acr) && cClean.includes(exp)) ||
      (cClean.includes(acr) && lClean.includes(exp)) ||
      (lClean.includes(acr) && cClean.includes(acr))
    ) {
      acronymMatch = true;
      matchedAcr = acr;
      break;
    }
  }

  if (lTokens.length === 0 && !acronymMatch) {
    return {
      score: 0,
      reason: "Generic institutional terms only — no distinctive name tokens",
      cityMatch,
      cityMismatch,
      matchingTokens: [],
    };
  }

  const overlapRatio = lTokens.length > 0 ? matchingTokens.length / lTokens.length : 0;

  let score = 0;
  let reason = "";

  if (acronymMatch && cityMatch) {
    score = 0.95;
    reason = `Acronym equivalence (${matchedAcr.toUpperCase()}) with confirmed city agreement`;
  } else if (overlapRatio >= 0.8 && cityMatch && lTokens.length >= 1) {
    score = 0.90;
    reason = `High distinctive token overlap (${matchingTokens.join(", ")}) with confirmed city agreement`;
  } else if (overlapRatio >= 0.5 && cityMatch && lTokens.length >= 2) {
    score = 0.75;
    reason = `Partial distinctive token match (${matchingTokens.join(", ")}) with city agreement`;
  } else if (matchingTokens.length >= 2 && cityMismatch) {
    score = 0.35;
    reason = `Token overlap (${matchingTokens.join(", ")}), but CITY MISMATCH (${liveCity} vs ${canonCity})`;
  } else if (matchingTokens.length === 1 && cityMatch && lTokens.length === 1) {
    score = 0.70;
    reason = `Single distinctive token match (${matchingTokens[0]}) in same city`;
  } else {
    score = 0.10;
    reason = "Insufficient distinctive token overlap";
  }

  return { score, reason, cityMatch, cityMismatch, matchingTokens };
}

/**
 * Builds the frozen 63 review snapshot items with evidence-based candidate evaluations.
 */
export function getFrozenVenueReviewSnapshot(): VenueReviewSnapshotItem[] {
  const registry = getFrozenBaselineVenueRegistry();
  const liveData = loadUnifiedLiveCPRDayData();
  const states = getLockedCensusStateList();
  const decisionsMap = loadPersistedDecisions();

  const snapshot: VenueReviewSnapshotItem[] = [];
  let reviewIdCounter = 1;

  for (const s of states) {
    const stateVenues = registry.filter(
      (v) => normalizeDisplayState(v.state).toLowerCase() === s.canonicalState.toLowerCase()
    );
    const stateParts = liveData.participantsByState.get(s.canonicalState) || [];

    // Group live certificates by normalized venue + city
    const liveGroups = new Map<
      string,
      { rawVenue: string; rawCity: string; records: typeof stateParts }
    >();

    for (const p of stateParts) {
      const key = `${p.normalizedVenue}|${normalizeCityName(p.city)}`;
      const existing = liveGroups.get(key) || {
        rawVenue: p.venue,
        rawCity: p.city,
        records: [],
      };
      existing.records.push(p);
      liveGroups.set(key, existing);
    }

    for (const [, group] of liveGroups.entries()) {
      // 1. Check auto-match against baseline canonical venues using standard scoreVenueMatch
      const autoCandidates: { canon: CanonicalPhysicalVenue; score: ReturnType<typeof scoreVenueMatch> }[] = [];
      for (const b of stateVenues) {
        const matchScore = scoreVenueMatch(group.rawVenue, group.rawCity, b.canonicalVenueName, b.city);
        if (matchScore.score >= 0.70) {
          autoCandidates.push({ canon: b, score: matchScore });
        }
      }
      autoCandidates.sort((a, b) => b.score.score - a.score.score);
      const aTop = autoCandidates[0];
      const aRunnerUp = autoCandidates[1];
      const aDominant = !aRunnerUp || aTop.score.score - aRunnerUp.score.score >= 0.15;

      if (aTop && aDominant && aTop.score.score >= 0.75) {
        continue; // Auto-matched baseline venue
      }

      // 2. Multi-Candidate Evidence Evaluation for Review Queue
      const candidates: {
        canon: CanonicalPhysicalVenue;
        score: number;
        reason: string;
        cityMatch: boolean;
        cityMismatch: boolean;
      }[] = [];

      for (const b of stateVenues) {
        const res = evaluateEvidence(group.rawVenue, group.rawCity, b.canonicalVenueName, b.city, b.aliases);
        if (res.score >= 0.50) {
          candidates.push({ canon: b, ...res });
        }
      }

      candidates.sort((a, b) => b.score - a.score);

      const top = candidates[0];
      const runnerUp = candidates[1];

      const reviewId = `REV-${String(reviewIdCounter++).padStart(3, "0")}`;

      let suggestedClassification: SuggestedCategory = "NO_RELIABLE_BASELINE_MATCH";
      let suggestedDecision: ReconciliationDecisionType = "KEEP_REVIEW_REQUIRED";
      let matchReason = "No reliable baseline counterpart identified";

      if (top && top.cityMismatch) {
        suggestedClassification = "AMBIGUOUS_MULTIPLE_CANDIDATES";
        suggestedDecision = "KEEP_REVIEW_REQUIRED";
        matchReason = top.reason;
      } else if (top && top.score >= 0.85 && (!runnerUp || top.score - runnerUp.score >= 0.15)) {
        suggestedClassification = "STRONG_SAME_BASELINE_CANDIDATE";
        suggestedDecision = "SAME_BASELINE_VENUE";
        matchReason = top.reason;
      } else if (top && top.score >= 0.60 && (!runnerUp || top.score - runnerUp.score >= 0.10)) {
        suggestedClassification = "POSSIBLE_SAME_BASELINE_CANDIDATE";
        suggestedDecision = "SAME_BASELINE_VENUE";
        matchReason = top.reason;
      } else if (top && runnerUp && top.score - runnerUp.score < 0.10 && top.score >= 0.60) {
        suggestedClassification = "AMBIGUOUS_MULTIPLE_CANDIDATES";
        suggestedDecision = "KEEP_REVIEW_REQUIRED";
        matchReason = `Ambiguous similarity between "${top.canon.canonicalVenueName}" and "${runnerUp.canon.canonicalVenueName}"`;
      }

      const candidateMatches: VenueReviewCandidateMatch[] = candidates.slice(0, 3).map((c) => ({
        canonicalVenueId: c.canon.canonicalVenueId,
        canonicalVenueName: c.canon.canonicalVenueName,
        city: c.canon.city,
        baselineCourseCount: c.canon.baselineCourseCount,
        baselineReportedTrained: c.canon.baselineReportedTrained,
        matchScore: c.score,
        matchReason: c.reason,
        cityMatch: c.cityMatch,
        cityMismatch: c.cityMismatch,
      }));

      const item: VenueReviewSnapshotItem = {
        reviewId,
        state: s.canonicalState,
        city: group.rawCity,
        liveVenue: group.rawVenue,
        certifiedCount: group.records.length,
        sampleCertificateIds: group.records.slice(0, 10).map((r) => r.certificateId),
        allCertificateIds: group.records.map((r) => r.certificateId),

        candidateMatches,
        bestCandidateVenueId: top && suggestedClassification !== "NO_RELIABLE_BASELINE_MATCH" ? top.canon.canonicalVenueId : undefined,
        bestCandidateVenueName: top && suggestedClassification !== "NO_RELIABLE_BASELINE_MATCH" ? top.canon.canonicalVenueName : undefined,
        bestCandidateCity: top && suggestedClassification !== "NO_RELIABLE_BASELINE_MATCH" ? top.canon.city : undefined,
        bestCandidateSessions: top && suggestedClassification !== "NO_RELIABLE_BASELINE_MATCH" ? top.canon.baselineCourseCount : undefined,
        bestCandidateReportedTrained: top && suggestedClassification !== "NO_RELIABLE_BASELINE_MATCH" ? top.canon.baselineReportedTrained : undefined,
        matchConfidence: top && suggestedClassification !== "NO_RELIABLE_BASELINE_MATCH" ? top.score : 0,
        matchReason,
        suggestedClassification,
        suggestedDecision,

        status: "PENDING",
        finalDecision: "PENDING",
      };

      // Overlay any saved administrative decision
      const saved = decisionsMap.get(reviewId);
      if (saved && saved.status && saved.status !== "PENDING") {
        item.status = saved.status;
        item.finalDecision = saved.finalDecision || item.finalDecision;
        item.finalCanonicalVenueId = saved.finalCanonicalVenueId || item.finalCanonicalVenueId;
        item.finalVenueName = saved.finalVenueName || item.finalVenueName;
        item.finalCity = saved.finalCity || item.finalCity;
        item.finalState = saved.finalState || item.finalState;
        item.supplementaryTrainedCount = saved.supplementaryTrainedCount;
        item.reviewedBy = saved.reviewedBy;
        item.reviewedAt = saved.reviewedAt;
        item.reviewNote = saved.reviewNote;
      }

      snapshot.push(item);
    }
  }

  return snapshot;
}

/**
 * Saves or updates an administrative venue reconciliation decision (Reversible).
 */
export function saveVenueReconciliationDecision(decision: {
  reviewId: string;
  finalDecision: ReconciliationDecisionType;
  finalCanonicalVenueId?: string;
  finalVenueName?: string;
  finalCity?: string;
  finalState?: string;
  supplementaryTrainedCount?: number;
  reviewedBy?: string;
  reviewNote?: string;
}): VenueReviewSnapshotItem | null {
  const map = loadPersistedDecisions();
  const existing = map.get(decision.reviewId) || {};

  const updated: Partial<VenueReviewSnapshotItem> = {
    ...existing,
    reviewId: decision.reviewId,
    status: decision.finalDecision === "PENDING" ? "PENDING" : "APPROVED",
    finalDecision: decision.finalDecision,
    finalCanonicalVenueId: decision.finalCanonicalVenueId,
    finalVenueName: decision.finalVenueName,
    finalCity: decision.finalCity,
    finalState: decision.finalState,
    supplementaryTrainedCount: decision.supplementaryTrainedCount,
    reviewedBy: decision.reviewedBy || "Admin",
    reviewedAt: new Date().toISOString(),
    reviewNote: decision.reviewNote,
  };

  map.set(decision.reviewId, updated);
  persistDecisionsToFile(map);

  const all = getFrozenVenueReviewSnapshot();
  return all.find((i) => i.reviewId === decision.reviewId) || null;
}

/**
 * Reverts an administrative decision back to PENDING.
 */
export function resetVenueReconciliationDecision(reviewId: string): VenueReviewSnapshotItem | null {
  const map = loadPersistedDecisions();
  map.delete(reviewId);
  persistDecisionsToFile(map);

  const all = getFrozenVenueReviewSnapshot();
  return all.find((i) => i.reviewId === reviewId) || null;
}

export interface VenueMetadataOverride {
  canonicalVenueId: string;
  state: string;
  venueName?: string;
  city?: string;
  additionalCoordinators?: string[];
  additionalChampions?: string[];
  verifiedTrainedAdjustment?: number;
  verifiedCourseCountAdjustment?: number;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNote?: string;
  evidenceReference?: string;
  originatingSubmissionId?: string;
}

export interface ImplementedSupplementaryCourse {
  id: string;
  submissionId: string;
  reviewId: string;
  state: string;
  canonicalState: string;
  stateCode: string;
  venue: string;
  city: string;
  courseDate?: string;
  coursesCount: number;
  participantsTrained: number;
  coordinators: string[];
  champions: string[];
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNote?: string;
  evidenceReference?: string;
  isExistingCanonicalVenue: boolean;
  targetCanonicalVenueId?: string;
}

const METADATA_OVERRIDES_FILE_PATH = path.join(process.cwd(), "data", "cpr_venue_metadata_overrides.json");

let memoryOverridesCache: Map<string, VenueMetadataOverride> | null = null;
let memorySupplementaryCoursesCache: ImplementedSupplementaryCourse[] | null = null;
let lastOverridesFetchTimestamp = 0;
let lastSupplementaryFetchTimestamp = 0;
const OVERRIDES_CACHE_TTL_MS = 15000;

export function invalidateVenueMetadataOverridesCache(): void {
  memoryOverridesCache = null;
  memorySupplementaryCoursesCache = null;
  lastOverridesFetchTimestamp = 0;
  lastSupplementaryFetchTimestamp = 0;
}

export function primeVenueMetadataOverridesCache(map: Map<string, VenueMetadataOverride>): void {
  memoryOverridesCache = new Map(map);
  lastOverridesFetchTimestamp = Date.now();
}

/**
 * Loads frozen historical metadata overrides from disk (Read-Only).
 */
export function loadFrozenHistoricalMetadataOverrides(): Map<string, VenueMetadataOverride> {
  const map = new Map<string, VenueMetadataOverride>();
  try {
    if (fs.existsSync(METADATA_OVERRIDES_FILE_PATH)) {
      const raw = fs.readFileSync(METADATA_OVERRIDES_FILE_PATH, "utf-8");
      if (raw.trim()) {
        const list = JSON.parse(raw);
        if (Array.isArray(list)) {
          list.forEach((item: VenueMetadataOverride) => {
            if (item.canonicalVenueId) map.set(item.canonicalVenueId, item);
          });
        }
      }
    }
  } catch (err) {
    console.warn("Could not read venue metadata overrides historical file:", err);
  }
  return map;
}

/**
 * Synchronous loader for metadata overrides (reads memory cache or frozen historical JSON).
 */
export function loadPersistedMetadataOverrides(): Map<string, VenueMetadataOverride> {
  if (memoryOverridesCache) return memoryOverridesCache;
  const map = loadFrozenHistoricalMetadataOverrides();
  memoryOverridesCache = map;
  return map;
}

/**
 * Synchronous loader for implemented supplementary courses.
 */
export function loadImplementedSupplementaryCourses(): ImplementedSupplementaryCourse[] {
  if (memorySupplementaryCoursesCache) return memorySupplementaryCoursesCache;

  const result: ImplementedSupplementaryCourse[] = [];
  const seenIds = new Set<string>();

  // 1. Check in-memory/disk coordinator verifications store
  try {
    const { loadAllVerifications } = require("./cprVerificationStore");
    const verifs = loadAllVerifications();
    const implementedSubs = verifs.filter(
      (v: any) => v.submissionStatus === "IMPLEMENTED" && v.submissionType === "MISSING_COURSE"
    );

    for (const sub of implementedSubs) {
      const canonicalState = normalizeDisplayState(sub.state);
      const stateVenues = getCanonicalVenuesByState(canonicalState);
      const targetCanonicalId = sub.canonicalVenueId || sub.reportRowId || "";
      const isExisting = targetCanonicalId ? stateVenues.some((v) => v.canonicalVenueId === targetCanonicalId) : false;

      if (!isExisting) {
        const proposed = sub.proposedChangesJson || {};
        const suppId = sub.canonicalVenueId || sub.reportRowId || `SUPP-${sub.id.replace(/[^A-Za-z0-9]/g, "").slice(-6).toUpperCase()}`;
        if (!seenIds.has(suppId) && !seenIds.has(sub.id)) {
          seenIds.add(suppId);
          seenIds.add(sub.id);
          result.push({
            id: sub.id,
            submissionId: sub.id,
            reviewId: suppId,
            state: sub.state,
            canonicalState,
            stateCode: sub.stateCode || normalizeStateCode(sub.state),
            venue: proposed.venue || sub.venue || "Supplementary Course",
            city: proposed.city || sub.city || "",
            courseDate: proposed.courseDate,
            coursesCount: proposed.coursesCount ? Number(proposed.coursesCount) : 1,
            participantsTrained: proposed.participantsTrained !== undefined ? Number(proposed.participantsTrained) : 0,
            coordinators: (proposed.coordinators && proposed.coordinators.length > 0)
              ? proposed.coordinators
              : (sub.mappedCoordinatorName ? [sub.mappedCoordinatorName] : (sub.submittedByName ? [sub.submittedByName] : [])),
            champions: proposed.champions || [],
            reviewedBy: sub.adminReviewedBy || "Administrator",
            reviewedAt: sub.adminReviewedAt,
            reviewNote: sub.adminNote || sub.correctionNote,
            evidenceReference: sub.evidenceNote,
            isExistingCanonicalVenue: false,
          });
        }
      }
    }
  } catch (err) {
    // ignore
  }

  // 2. Include decisions from decisions store that are SUPPLEMENTARY_NEW_VENUE
  const decisionsMap = loadPersistedDecisions();
  for (const [reviewId, dec] of decisionsMap.entries()) {
    if (dec.finalDecision === "SUPPLEMENTARY_NEW_VENUE" && dec.status !== "PENDING") {
      if (!seenIds.has(reviewId)) {
        seenIds.add(reviewId);
        result.push({
          id: reviewId,
          submissionId: reviewId,
          reviewId,
          state: dec.finalState || "",
          canonicalState: normalizeDisplayState(dec.finalState || ""),
          stateCode: normalizeStateCode(dec.finalState || ""),
          venue: dec.finalVenueName || "Supplementary Course",
          city: dec.finalCity || "",
          coursesCount: 1,
          participantsTrained: dec.supplementaryTrainedCount || 0,
          coordinators: [],
          champions: [],
          reviewedBy: dec.reviewedBy || "Admin",
          reviewedAt: dec.reviewedAt,
          reviewNote: dec.reviewNote,
          isExistingCanonicalVenue: false,
        });
      }
    }
  }

  memorySupplementaryCoursesCache = result;
  return result;
}

/**
 * Async loader for metadata overrides and supplementary courses from PostgreSQL.
 */
export async function loadPersistedMetadataOverridesAsync(
  forceRefresh = false
): Promise<Map<string, VenueMetadataOverride>> {
  const now = Date.now();
  if (!forceRefresh && memoryOverridesCache && now - lastOverridesFetchTimestamp < OVERRIDES_CACHE_TTL_MS) {
    return memoryOverridesCache;
  }

  // 1. Start with frozen historical overrides
  const map = loadFrozenHistoricalMetadataOverrides();
  const suppList: ImplementedSupplementaryCourse[] = [];
  const seenSuppIds = new Set<string>();

  // 2. Query PostgreSQL for implemented verification submissions
  try {
    const { prisma } = await import("./prisma");
    if (prisma && (prisma as any).cPRVerificationSubmission) {
      const rows = await (prisma as any).cPRVerificationSubmission.findMany({
        where: {
          submissionStatus: "IMPLEMENTED",
        },
        orderBy: {
          updatedAt: "asc",
        },
      });

      for (const row of rows) {
        const canonicalState = normalizeDisplayState(row.state);
        const stateVenues = getCanonicalVenuesByState(canonicalState);
        let canonicalVenueId = row.canonicalVenueId || row.reportRowId || "";

        // Check if mapped to an existing canonical baseline venue
        let matchedCanonVenue = stateVenues.find((v) => v.canonicalVenueId === canonicalVenueId);

        // Fallback: match by venue name and state if canonicalVenueId not explicitly set or not matching
        if (!matchedCanonVenue && row.venue && row.state) {
          const vClean = row.venue.toLowerCase().trim();
          const found = stateVenues.find(
            (v) =>
              v.canonicalVenueName.toLowerCase().trim() === vClean ||
              v.aliases.some((a) => a.toLowerCase().trim() === vClean)
          );
          if (found) {
            matchedCanonVenue = found;
            canonicalVenueId = found.canonicalVenueId;
          }
        }

        const proposed = (row.proposedChangesJson as any) || {};
        const current = (row.currentDataJson as any) || {};

        if (row.submissionType === "MISSING_COURSE" && !matchedCanonVenue) {
          // Genuinely NEW supplementary venue / course
          const suppId = canonicalVenueId || `SUPP-${row.id.replace(/[^A-Za-z0-9]/g, "").slice(-6).toUpperCase()}`;
          if (!seenSuppIds.has(suppId) && !seenSuppIds.has(row.id)) {
            seenSuppIds.add(suppId);
            seenSuppIds.add(row.id);
            suppList.push({
              id: row.id,
              submissionId: row.id,
              reviewId: suppId,
              state: row.state,
              canonicalState,
              stateCode: row.stateCode || normalizeStateCode(row.state),
              venue: proposed.venue || row.venue || "Supplementary Course",
              city: proposed.city || row.city || "",
              courseDate: proposed.courseDate,
              coursesCount: proposed.coursesCount ? Number(proposed.coursesCount) : 1,
              participantsTrained: proposed.participantsTrained !== undefined ? Number(proposed.participantsTrained) : 0,
              coordinators: (proposed.coordinators && proposed.coordinators.length > 0)
                ? proposed.coordinators
                : (row.mappedCoordinatorName ? [row.mappedCoordinatorName] : (row.submittedByName ? [row.submittedByName] : [])),
              champions: proposed.champions || [],
              reviewedBy: row.adminReviewedBy || "Administrator",
              reviewedAt: row.adminReviewedAt ? new Date(row.adminReviewedAt).toISOString() : undefined,
              reviewNote: row.adminNote || row.correctionNote,
              evidenceReference: row.evidenceNote,
              isExistingCanonicalVenue: false,
            });
          }
          continue;
        }

        if (!canonicalVenueId) continue;

        let verifiedTrainedAdjustment: number | undefined;
        if (proposed.verifiedTrainedAdjustment !== undefined) {
          verifiedTrainedAdjustment = Number(proposed.verifiedTrainedAdjustment);
        } else if (proposed.participantsTrained !== undefined) {
          const cv = matchedCanonVenue || stateVenues.find((v) => v.canonicalVenueId === canonicalVenueId);
          const baseTrained =
            current.participantsTrained ??
            current.baselineReportedTrained ??
            cv?.baselineReportedTrained ??
            0;
          verifiedTrainedAdjustment = Number(proposed.participantsTrained) - baseTrained;
        } else if (row.submissionType === "VERIFY_CORRECT") {
          verifiedTrainedAdjustment = 0;
        }

        let verifiedCourseCountAdjustment: number | undefined;
        if (proposed.verifiedCourseCountAdjustment !== undefined) {
          verifiedCourseCountAdjustment = Number(proposed.verifiedCourseCountAdjustment);
        } else if (proposed.coursesCount !== undefined && current.coursesCount !== undefined) {
          verifiedCourseCountAdjustment = Number(proposed.coursesCount) - Number(current.coursesCount);
        } else if (row.submissionType === "MISSING_COURSE" && matchedCanonVenue) {
          // Additional course session at existing canonical venue
          verifiedCourseCountAdjustment = proposed.coursesCount !== undefined ? Number(proposed.coursesCount) : 1;
        }

        const existing = map.get(canonicalVenueId);

        const merged: VenueMetadataOverride = {
          canonicalVenueId,
          state: row.state,
          ...(existing || {}),
          ...(proposed.venue ? { venueName: proposed.venue } : {}),
          ...(proposed.city ? { city: proposed.city } : {}),
          ...(proposed.coordinators ? { additionalCoordinators: proposed.coordinators } : {}),
          ...(proposed.champions ? { additionalChampions: proposed.champions } : {}),
          ...(verifiedTrainedAdjustment !== undefined ? { verifiedTrainedAdjustment } : {}),
          ...(verifiedCourseCountAdjustment !== undefined ? { verifiedCourseCountAdjustment } : {}),
          reviewedBy: row.adminReviewedBy || existing?.reviewedBy || "Administrator",
          reviewedAt: row.adminReviewedAt ? new Date(row.adminReviewedAt).toISOString() : existing?.reviewedAt,
          reviewNote: row.adminNote || existing?.reviewNote,
          evidenceReference: row.evidenceNote || existing?.evidenceReference,
          originatingSubmissionId: row.id,
        };

        map.set(canonicalVenueId, merged);
      }
    }
  } catch (err) {
    console.warn("Could not query CPRVerificationSubmission from PostgreSQL for overrides:", err);
  }

  // 3. Include any decisions from decisions store that are SUPPLEMENTARY_NEW_VENUE and not in PostgreSQL
  const decisionsMap = loadPersistedDecisions();
  for (const [reviewId, dec] of decisionsMap.entries()) {
    if (dec.finalDecision === "SUPPLEMENTARY_NEW_VENUE" && dec.status !== "PENDING") {
      if (!seenSuppIds.has(reviewId)) {
        seenSuppIds.add(reviewId);
        suppList.push({
          id: reviewId,
          submissionId: reviewId,
          reviewId,
          state: dec.finalState || "",
          canonicalState: normalizeDisplayState(dec.finalState || ""),
          stateCode: normalizeStateCode(dec.finalState || ""),
          venue: dec.finalVenueName || "Supplementary Course",
          city: dec.finalCity || "",
          coursesCount: 1,
          participantsTrained: dec.supplementaryTrainedCount || 0,
          coordinators: [],
          champions: [],
          reviewedBy: dec.reviewedBy || "Admin",
          reviewedAt: dec.reviewedAt,
          reviewNote: dec.reviewNote,
          isExistingCanonicalVenue: false,
        });
      }
    }
  }

  memoryOverridesCache = map;
  memorySupplementaryCoursesCache = suppList;
  lastOverridesFetchTimestamp = now;
  lastSupplementaryFetchTimestamp = now;
  return map;
}

/**
 * Async loader for implemented supplementary courses.
 */
export async function loadImplementedSupplementaryCoursesAsync(
  forceRefresh = false
): Promise<ImplementedSupplementaryCourse[]> {
  const now = Date.now();
  if (!forceRefresh && memorySupplementaryCoursesCache && now - lastSupplementaryFetchTimestamp < OVERRIDES_CACHE_TTL_MS) {
    return memorySupplementaryCoursesCache;
  }
  await loadPersistedMetadataOverridesAsync(forceRefresh);
  return memorySupplementaryCoursesCache || [];
}

/**
 * Returns current metadata overrides map (sync).
 */
export function getVenueMetadataOverridesMap(): Map<string, VenueMetadataOverride> {
  return loadPersistedMetadataOverrides();
}

/**
 * Returns current metadata overrides map with PostgreSQL refresh (async).
 */
export async function getVenueMetadataOverridesMapAsync(
  forceRefresh = false
): Promise<Map<string, VenueMetadataOverride>> {
  return loadPersistedMetadataOverridesAsync(forceRefresh);
}

/**
 * Saves/updates in-memory metadata override (Zero Filesystem Write).
 */
export function saveVenueMetadataOverride(override: VenueMetadataOverride): VenueMetadataOverride {
  const map = loadPersistedMetadataOverrides();
  const existing = map.get(override.canonicalVenueId) || { canonicalVenueId: override.canonicalVenueId, state: override.state };

  const updated: VenueMetadataOverride = {
    ...existing,
    ...override,
    reviewedAt: new Date().toISOString(),
  };

  map.set(override.canonicalVenueId, updated);
  memoryOverridesCache = map;
  return updated;
}

/**
 * Resets/deletes in-memory metadata override (Zero Filesystem Write).
 */
export function resetVenueMetadataOverride(canonicalVenueId: string): boolean {
  const map = loadPersistedMetadataOverrides();
  const deleted = map.delete(canonicalVenueId);
  memoryOverridesCache = map;
  return deleted;
}


