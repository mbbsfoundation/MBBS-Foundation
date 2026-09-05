import fs from "fs";
import path from "path";
import { getFrozenBaselineVenueRegistry, getCanonicalVenuesByState, CanonicalPhysicalVenue } from "./cprVenueRegistry";
import { loadUnifiedLiveCPRDayData, normalizeCityName, scoreVenueMatch } from "./cprReporting";
import { getLockedCensusStateList, getLockedOfficialStateCensus } from "./cprStateCensus";
import { normalizeDisplayState } from "./cprCensus";

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

const METADATA_OVERRIDES_FILE_PATH = path.join(process.cwd(), "data", "cpr_venue_metadata_overrides.json");

let memoryOverridesCache: Map<string, VenueMetadataOverride> | null = null;

export function loadPersistedMetadataOverrides(): Map<string, VenueMetadataOverride> {
  if (memoryOverridesCache) return memoryOverridesCache;

  const map = new Map<string, VenueMetadataOverride>();
  try {
    if (fs.existsSync(METADATA_OVERRIDES_FILE_PATH)) {
      const raw = fs.readFileSync(METADATA_OVERRIDES_FILE_PATH, "utf-8");
      const list = JSON.parse(raw);
      if (Array.isArray(list)) {
        list.forEach((item: VenueMetadataOverride) => {
          if (item.canonicalVenueId) map.set(item.canonicalVenueId, item);
        });
      }
    }
  } catch (err) {
    console.warn("Could not read venue metadata overrides file, using in-memory store:", err);
  }

  memoryOverridesCache = map;
  return map;
}

export function persistMetadataOverridesToFile(map: Map<string, VenueMetadataOverride>): void {
  try {
    const list = Array.from(map.values());
    const dir = path.dirname(METADATA_OVERRIDES_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(METADATA_OVERRIDES_FILE_PATH, JSON.stringify(list, null, 2), "utf-8");
  } catch (err) {
    console.warn("Could not write venue metadata overrides file:", err);
  }
}

export function getVenueMetadataOverridesMap(): Map<string, VenueMetadataOverride> {
  return loadPersistedMetadataOverrides();
}

export function saveVenueMetadataOverride(override: VenueMetadataOverride): VenueMetadataOverride {
  const map = loadPersistedMetadataOverrides();
  const existing = map.get(override.canonicalVenueId) || { canonicalVenueId: override.canonicalVenueId, state: override.state };

  const updated: VenueMetadataOverride = {
    ...existing,
    ...override,
    reviewedAt: new Date().toISOString(),
  };

  map.set(override.canonicalVenueId, updated);
  persistMetadataOverridesToFile(map);
  return updated;
}

export function resetVenueMetadataOverride(canonicalVenueId: string): boolean {
  const map = loadPersistedMetadataOverrides();
  const deleted = map.delete(canonicalVenueId);
  persistMetadataOverridesToFile(map);
  return deleted;
}

