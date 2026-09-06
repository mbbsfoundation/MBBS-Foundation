import { prisma } from "./prisma";
import {
  loadCPRCensusData,
  normalizeDisplayState,
  normalizeDisplayName,
  deduplicatePersonNames,
  CPRCensusRecord,
} from "./cprCensus";
import { getAllCPRCertificates, CPRCertificateRecord } from "./cprCertificates";
import {
  getAllSanjeevaniFromStorage,
  parseAndNormalizeCourseDate,
  normalizeStateCode,
  SanjeevaniCertificateRecord,
} from "./sanjeevaniStorage";
import {
  getLockedOfficialStateCensus,
  getLockedCensusStateList,
  LockedStateCensusEntry,
} from "./cprStateCensus";
import {
  getFrozenBaselineVenueRegistry,
  getCanonicalVenuesByState,
  getCanonicalVenueById,
  CanonicalPhysicalVenue,
  normalizeCityName,
  normalizeVenueKey,
  extractDistinctiveTokens,
} from "./cprVenueRegistry";
import {
  getFrozenVenueReviewSnapshot,
  getVenueMetadataOverridesMap,
  ReconciliationDecisionType,
  CPRDAY_CENSUS_DRAFT_VERSION,
  StateVerificationStatus,
  StateVerificationRecord,
} from "./cprReconciliationStore";

export {
  normalizeCityName,
  normalizeVenueKey,
  extractDistinctiveTokens,
  getFrozenBaselineVenueRegistry,
  getCanonicalVenuesByState,
  getCanonicalVenueById,
  type CanonicalPhysicalVenue,
  CPRDAY_CENSUS_DRAFT_VERSION,
  type StateVerificationStatus,
  type StateVerificationRecord,
};

export type VenueClassification =
  | "BASELINE_MATCH"
  | "SUPPLEMENTARY_NEW_COURSE"
  | "REVIEW_REQUIRED";

export type ReportingClassification =
  | "BASELINE"
  | "SUPPLEMENTARY_SAME_COURSE"
  | "SUPPLEMENTARY_NEW_COURSE"
  | "REVIEW_REQUIRED";

/**
 * Atomic Course / Session Record representation
 */
export interface CPRDaySessionRecord {
  sessionId: string;
  serialNumber: string;
  state: string;
  canonicalState: string;
  stateCode: string;
  city: string;
  venue: string;
  normalizedVenue: string;
  courseDate: string; // ISO canonical "2026-07-21"
  coordinator: string;
  champions: string[];

  // Evidence counts
  reportedCount: number;
  verifiedAttendanceCount?: number;
  certifiedCount: number;

  // Derived metrics
  participantsTrained: number; // MAX(reportedCount, verifiedAttendanceCount, certifiedCount)
  participantsCertified: number; // certifiedCount

  classification: ReportingClassification;
  sourceType: "BASELINE_CENSUS" | "SUPPLEMENTARY_UPLOAD" | "ADMIN_MANUAL";
  batchId?: string;
  sourceDocument?: string;
}

/**
 * Candidate match detail for review queue
 */
export interface VenueCandidateMatch {
  baselineVenue: string;
  city: string;
  score: number;
  level: string;
  reason: string;
}

/**
 * Live venue review item for admin visibility
 */
export interface VenueMatchingReviewItem {
  state: string;
  liveVenue: string;
  city: string;
  certifiedCount: number;
  sampleCertIds: string[];
  candidates: VenueCandidateMatch[];
  classificationReason: string;
}

/**
 * Consolidated Venue-Level Summary Model
 */
export interface CPRDayVenueSummary {
  venueId: string;
  serialNumber: string;
  state: string;
  canonicalState: string;
  stateCode: string;
  city: string;
  venue: string;
  normalizedVenue: string;
  venueCode?: string;

  // Course / session counts
  baselineCourseCount: number;
  supplementaryCourseCount: number;
  totalCourseCount: number;

  // Evidence metrics
  baselineReportedTrained: number;
  verifiedAttendanceCount?: number;
  participantsCertified: number; // Unique valid certificate IDs linked to venue
  supplementaryTrained: number; // Trained participants from genuinely new approved supplementary courses

  // Dual Headline Metrics
  participantsTrained: number; // MAX(baselineReportedTrained, verifiedAttendanceCount, participantsCertified) + supplementaryTrained
  isApprovedSupplementaryNewCourse?: boolean;

  // Reconciliation classification
  classification: VenueClassification;
  classificationReason: string;

  // Faculty details
  baselineCoordinators: string[];
  additionalLiveCoordinators: string[];
  allCoordinators: string[];
  baselineChampions: string[];
  additionalLiveChampions: string[];
  allChampions: string[];

  // Underlying data
  baselineRows: CPRCensusRecord[];
  sampleCertificateIds: string[];
}

/**
 * Backward-compatible CentreReconciliationItem for UI consumers
 */
export interface CentreReconciliationItem {
  canonicalVenueId?: string;
  serialNumber: string;
  venue: string;
  normalizedVenue: string;
  city: string;
  state: string;
  stateCode: string;
  venueCode?: string;
  coursesCount: number;
  baselineParticipants: number;
  verifiedAttendanceCount?: number;
  liveRecords: number; // participantsCertified
  classification: VenueClassification;
  classificationReason: string;
  confirmedIncrement: number;
  projectedTotal: number; // participantsTrained
  baselineCoordinators: string[];
  additionalLiveCoordinators: string[];
  allCoordinators: string[];
  baselineChampions: string[];
  additionalLiveChampions: string[];
  allChampions: string[];
  sampleCertificateIds: string[];
}

export interface StateReconciliationSummary {
  baseline: {
    uniqueVenues: number;
    courses: number; // 391 courses nationwide
    reportedTrained: number; // 43,636 trained nationwide
    isLocked: boolean;
  };
  liveData: {
    participantCertificatesFound: number;
    uniqueVenuesRepresented: number;
    coordinatorsFound: number;
    championsFound: number;
  };
  reconciliation: {
    baselineMatchedVenues: number;
    supplementaryNewCourses: number;
    reviewVenues: number;
    matchedCertified: number;
    reviewCertified: number;
    confirmedNewIncrementalParticipants: number;
    participantsAlreadyRepresentedBaseline: number;
  };
  reconciledReport: {
    uniqueVenues: number;
    coursesConducted: number;
    participantsTrained: number; // Dual Metric 1: Reach
    participantsCertified: number; // Dual Metric 2: Digital IDs
    coordinatorsCount: number;
    championsCount: number;
    disclaimer: "DUAL-METRIC RECONCILIATION: PARTICIPANTS TRAINED VS CERTIFIED";
  };
}

export interface CPRDayStateReconciliationReport {
  state: string;
  canonicalState: string;
  stateCode: string;
  zone: string;
  summary: StateReconciliationSummary;
  venues: CPRDayVenueSummary[];
  centres: CentreReconciliationItem[]; // Backwards-compatible alias for existing components
  reviewQueue: VenueMatchingReviewItem[];
  reconciliationDate: string;
}

// (normalizeCityName, normalizeVenueKey, and extractDistinctiveTokens are imported and re-exported from ./cprVenueRegistry)

/**
 * 4-Level Match Scoring between a live venue group and a baseline candidate.
 */
export interface VenueMatchScore {
  score: number;
  level: "LEVEL_1_EXACT" | "LEVEL_2_ACRONYM_VARIANT" | "LEVEL_3_DISTINCTIVE_TOKEN" | "NONE";
  reason: string;
}

export function scoreVenueMatch(
  liveVenueRaw: string,
  liveCityRaw: string,
  baselineVenueRaw: string,
  baselineCityRaw: string
): VenueMatchScore {
  let lNorm = normalizeVenueKey(liveVenueRaw)
    .replace(/makhalabad/g, "makhmalabad")
    .replace(/caterpiller/g, "caterpillar")
    .replace(/cloudenine/g, "cloudnine");
  let bNorm = normalizeVenueKey(baselineVenueRaw)
    .replace(/makhalabad/g, "makhmalabad")
    .replace(/caterpiller/g, "caterpillar")
    .replace(/cloudenine/g, "cloudnine");

  const lCity = normalizeCityName(liveCityRaw);
  const bCity = normalizeCityName(baselineCityRaw);
  const cityMatches =
    !lCity ||
    !bCity ||
    lCity === bCity ||
    lCity.includes(bCity) ||
    bCity.includes(lCity);

  // Level 1: Exact normalized venue and city match
  if (lNorm === bNorm && cityMatches) {
    return { score: 1.0, level: "LEVEL_1_EXACT", reason: "Exact normalized venue and city match" };
  }

  // Level 2: Known acronym / distinctive identifier variations
  const knownIdentifiers = [
    "mimsr",
    "makhmalabad",
    "rkmveri",
    "jimsh",
    "eyora",
    "ofdc",
    "caterpillar",
    "alphonsa",
    "belur",
    "maniktala",
    "kamarhati",
    "bandel",
    "asansol",
    "liluah",
    "dumdum",
    "burdwan",
  ];

  for (const id of knownIdentifiers) {
    if (lNorm.includes(id) && bNorm.includes(id)) {
      return {
        score: 0.95,
        level: "LEVEL_2_ACRONYM_VARIANT",
        reason: `Known distinctive identifier match (${id})`,
      };
    }
  }

  // Level 3: Distinctive token overlap
  const lTokens = extractDistinctiveTokens(lNorm);
  const bTokens = extractDistinctiveTokens(bNorm);

  if (lTokens.length > 0 && bTokens.length > 0) {
    const inter = lTokens.filter((t) => bTokens.includes(t));
    if (inter.length > 0) {
      const ratio = inter.length / Math.min(lTokens.length, bTokens.length);
      if (ratio >= 0.6 && (cityMatches || inter.length >= 2)) {
        return {
          score: Math.min(1.0, 0.75 + 0.15 * ratio),
          level: "LEVEL_3_DISTINCTIVE_TOKEN",
          reason: `Strong distinctive token overlap (${inter.join(", ")})`,
        };
      }
    }
  }

  // Substring match with at least one distinctive token
  if (lNorm.length > 6 && bNorm.length > 6 && cityMatches) {
    if (lNorm.includes(bNorm) || bNorm.includes(lNorm)) {
      const inter = lTokens.filter((t) => bTokens.includes(t));
      if (inter.length >= 1) {
        return {
          score: 0.80,
          level: "LEVEL_3_DISTINCTIVE_TOKEN",
          reason: `Direct substring match with distinctive token (${inter.join(", ")})`,
        };
      }
    }
  }

  return { score: 0.0, level: "NONE", reason: "No confident baseline match" };
}

/**
 * Unified interface for live CPR Day records (Certificates + Dynamic Storage)
 */
export interface UnifiedLiveCPRDayRecord {
  sourceType: "CSV_MASTER" | "STORAGE_JSON" | "PRISMA_DB";
  category: "participant" | "coordinator" | "champion";
  certificateId: string;
  name: string;
  mobile?: string;
  email?: string;
  state: string;
  canonicalState: string;
  stateCode: string;
  city: string;
  venue: string;
  normalizedVenue: string;
  courseDate: string; // ISO canonical "2026-07-21"
}

/**
 * In-memory index of live verified CPR Day 2026 records.
 */
export interface LiveCPRDayStateIndex {
  participantsByState: Map<string, UnifiedLiveCPRDayRecord[]>;
  coordinatorsByState: Map<string, UnifiedLiveCPRDayRecord[]>;
  championsByState: Map<string, UnifiedLiveCPRDayRecord[]>;
}

let cachedLiveIndex: LiveCPRDayStateIndex | null = null;
let lastLiveIndexTimestamp = 0;
const CACHE_TTL_MS = 15000;

let cachedDbCertificateRecords: any[] | null = null;
let lastDbFetchTimestamp = 0;
const DB_CACHE_TTL_MS = 15000;

export function invalidateLiveCPRIndexCache(): void {
  cachedLiveIndex = null;
  lastLiveIndexTimestamp = 0;
  cachedDbCertificateRecords = null;
  lastDbFetchTimestamp = 0;
}

export function primeCPRReportingDbCache(records: any[]): void {
  cachedDbCertificateRecords = records;
  lastDbFetchTimestamp = Date.now();
  cachedLiveIndex = null;
  lastLiveIndexTimestamp = 0;
}

export async function fetchAdminCertificateRecordsAsync(forceRefresh = false): Promise<any[]> {
  const now = Date.now();
  if (!forceRefresh && cachedDbCertificateRecords !== null && now - lastDbFetchTimestamp < DB_CACHE_TTL_MS) {
    return cachedDbCertificateRecords;
  }

  if (prisma && (prisma as any).adminCertificateRecord) {
    try {
      const dbRecords = await (prisma as any).adminCertificateRecord.findMany({
        where: {
          status: "VALID",
        },
      });
      cachedDbCertificateRecords = dbRecords;
      lastDbFetchTimestamp = now;
      return dbRecords;
    } catch (e) {
      console.warn("Could not query AdminCertificateRecord from PostgreSQL:", e);
      return cachedDbCertificateRecords || [];
    }
  }
  return cachedDbCertificateRecords || [];
}

/**
 * Builds unified Live CPR Day 2026 index across CSVs, Storage JSON, and PostgreSQL AdminCertificateRecord.
 */
export function buildUnifiedLiveCPRDayIndex(dbRecords: any[] = []): LiveCPRDayStateIndex {
  const participantsByState = new Map<string, UnifiedLiveCPRDayRecord[]>();
  const coordinatorsByState = new Map<string, UnifiedLiveCPRDayRecord[]>();
  const championsByState = new Map<string, UnifiedLiveCPRDayRecord[]>();

  const pushRecord = (
    map: Map<string, UnifiedLiveCPRDayRecord[]>,
    stateKey: string,
    rec: UnifiedLiveCPRDayRecord
  ) => {
    const list = map.get(stateKey) || [];
    list.push(rec);
    map.set(stateKey, list);
  };

  const isStrictCPRDay = (rawDate: string | undefined): boolean => {
    if (!rawDate) return false;
    const parsed = parseAndNormalizeCourseDate(rawDate);
    return parsed.isValid && parsed.isCprDay && parsed.isoDate === "2026-07-21";
  };

  // 1. Participant Master CSVs
  const csvParticipants = getAllCPRCertificates("participant");
  const seenParticipantIds = new Set<string>();

  for (const p of csvParticipants) {
    if (!p.certificateNumber) continue;
    if (seenParticipantIds.has(p.certificateNumber)) continue;

    const dateValid = isStrictCPRDay(p.issueDate);
    const idIsCPRDay = p.certificateNumber.startsWith("IAPCPR/PA/");
    if (!dateValid && !idIsCPRDay) continue;

    seenParticipantIds.add(p.certificateNumber);
    const canonicalState = normalizeDisplayState(p.state || p.zone || "");
    const stateCode = normalizeStateCode((p as any).stateCode || canonicalState);

    const rec: UnifiedLiveCPRDayRecord = {
      sourceType: "CSV_MASTER",
      category: "participant",
      certificateId: p.certificateNumber,
      name: p.participantName || "",
      mobile: p.mobileNumber || "",
      email: p.email || "",
      state: p.state || canonicalState,
      canonicalState,
      stateCode,
      city: p.city || "",
      venue: p.venueName || "",
      normalizedVenue: normalizeVenueKey(p.venueName || "", p.city || ""),
      courseDate: "2026-07-21",
    };

    pushRecord(participantsByState, canonicalState, rec);
  }

  // 2. Coordinator Master CSVs
  const csvCoordinators = getAllCPRCertificates("coordinator");
  const seenCoordinatorIds = new Set<string>();

  for (const c of csvCoordinators) {
    if (!c.certificateNumber) continue;
    if (seenCoordinatorIds.has(c.certificateNumber)) continue;

    const dateValid = isStrictCPRDay(c.issueDate);
    const idIsCPRDay = c.certificateNumber.startsWith("IAPCPR/CC/");
    if (!dateValid && !idIsCPRDay) continue;

    seenCoordinatorIds.add(c.certificateNumber);
    const canonicalState = normalizeDisplayState(c.state || c.zone || "");
    const stateCode = normalizeStateCode((c as any).stateCode || canonicalState);

    const rec: UnifiedLiveCPRDayRecord = {
      sourceType: "CSV_MASTER",
      category: "coordinator",
      certificateId: c.certificateNumber,
      name: c.participantName || "",
      mobile: c.mobileNumber || "",
      email: c.email || "",
      state: c.state || canonicalState,
      canonicalState,
      stateCode,
      city: c.city || "",
      venue: c.venueName || "",
      normalizedVenue: normalizeVenueKey(c.venueName || "", c.city || ""),
      courseDate: "2026-07-21",
    };

    pushRecord(coordinatorsByState, canonicalState, rec);
  }

  // 3. Champion Master CSVs
  const csvChampions = getAllCPRCertificates("champion");
  const seenChampionIds = new Set<string>();

  for (const ch of csvChampions) {
    if (!ch.certificateNumber) continue;
    if (seenChampionIds.has(ch.certificateNumber)) continue;

    const dateValid = isStrictCPRDay(ch.issueDate);
    const idIsCPRDay = ch.certificateNumber.startsWith("IAPCPR/CH/");
    if (!dateValid && !idIsCPRDay) continue;

    seenChampionIds.add(ch.certificateNumber);
    const canonicalState = normalizeDisplayState(ch.state || ch.zone || "");
    const stateCode = normalizeStateCode((ch as any).stateCode || canonicalState);

    const rec: UnifiedLiveCPRDayRecord = {
      sourceType: "CSV_MASTER",
      category: "champion",
      certificateId: ch.certificateNumber,
      name: ch.participantName || "",
      mobile: ch.mobileNumber || "",
      email: ch.email || "",
      state: ch.state || canonicalState,
      canonicalState,
      stateCode,
      city: ch.city || "",
      venue: ch.venueName || "",
      normalizedVenue: normalizeVenueKey(ch.venueName || "", ch.city || ""),
      courseDate: "2026-07-21",
    };

    pushRecord(championsByState, canonicalState, rec);
  }

  // 4. Dynamic Persistent JSON Storage
  const storageRecords = getAllSanjeevaniFromStorage();
  for (const s of storageRecords) {
    if (!s.certificateId) continue;
    if (seenParticipantIds.has(s.certificateId) || seenCoordinatorIds.has(s.certificateId) || seenChampionIds.has(s.certificateId)) {
      continue;
    }

    if (s.category === "CPR_FACILITY" || (s.certificateId && s.certificateId.includes("/Venue/"))) {
      continue;
    }

    const dateValid = isStrictCPRDay(s.date);
    const catIsCPRDay = s.category === "CPR_DAY";
    if (!dateValid && !catIsCPRDay) continue;

    const canonicalState = normalizeDisplayState(s.state || "");
    const stateCode = normalizeStateCode(s.stateCode || canonicalState);

    const isCoord = (s.category as string) === "COORDINATOR" || (s.category as string) === "COURSE_COORDINATOR" || (s.certificateId && s.certificateId.startsWith("IAPCPR/CC/"));
    const isChamp = s.category === "CPR_CHAMPION" || (s.certificateId && s.certificateId.startsWith("IAPCPR/CH/"));

    const rec: UnifiedLiveCPRDayRecord = {
      sourceType: "STORAGE_JSON",
      category: isCoord ? "coordinator" : isChamp ? "champion" : "participant",
      certificateId: s.certificateId,
      name: s.participantName || "",
      mobile: s.mobileNumber || "",
      email: s.email || "",
      state: s.state || canonicalState,
      canonicalState,
      stateCode,
      city: s.city || "",
      venue: s.venue || "",
      normalizedVenue: normalizeVenueKey(s.venue || "", s.city || ""),
      courseDate: "2026-07-21",
    };

    if (rec.category === "coordinator") {
      seenCoordinatorIds.add(s.certificateId);
      pushRecord(coordinatorsByState, canonicalState, rec);
    } else if (rec.category === "champion") {
      seenChampionIds.add(s.certificateId);
      pushRecord(championsByState, canonicalState, rec);
    } else {
      seenParticipantIds.add(s.certificateId);
      pushRecord(participantsByState, canonicalState, rec);
    }
  }

  // 5. Database-Generated Certificates (PostgreSQL AdminCertificateRecord)
  if (Array.isArray(dbRecords)) {
    for (const d of dbRecords) {
      if (!d.certificateId) continue;
      if (d.status && d.status !== "VALID") continue;

      // Duplicate suppression: preserve historical source precedence
      if (seenParticipantIds.has(d.certificateId) || seenCoordinatorIds.has(d.certificateId) || seenChampionIds.has(d.certificateId)) {
        continue;
      }

      // Exclude Facilities from Participant/Faculty counts
      if (
        d.category === "CPR_FACILITY" ||
        (d.certificateId && (d.certificateId.includes("/Venue/") || d.certificateId.startsWith("IAP-CPR-DAY/VENUE/")))
      ) {
        continue;
      }

      const dateValid = isStrictCPRDay(d.certificateDate);
      const isPaId = d.certificateId.startsWith("IAPCPR/PA/");
      const isCcId = d.certificateId.startsWith("IAPCPR/CC/");
      const isChId = d.certificateId.startsWith("IAPCPR/CH/");

      // Strictly CPR Day 2026 scope
      const isCprDayScope = dateValid || isPaId || isCcId || isChId;
      if (!isCprDayScope) continue;

      const canonicalState = normalizeDisplayState(d.state || "");
      const stateCode = normalizeStateCode(d.stateCode || canonicalState);

      const isCoord = (d.category as string) === "COURSE_COORDINATOR" || (d.category as string) === "COORDINATOR" || isCcId;
      const isChamp = d.category === "CPR_CHAMPION" || isChId;
      const isParticipant = d.category === "PARTICIPANT" || (!isCoord && !isChamp);

      // Verify category matches ID type if specified
      if (isCoord && !isCcId && !dateValid) continue;
      if (isChamp && !isChId && !dateValid) continue;
      if (isParticipant && !isPaId && !dateValid) continue;

      const rec: UnifiedLiveCPRDayRecord = {
        sourceType: "PRISMA_DB",
        category: isCoord ? "coordinator" : isChamp ? "champion" : "participant",
        certificateId: d.certificateId,
        name: d.name || "",
        mobile: d.mobileNumber || "",
        email: d.email || "",
        state: d.state || canonicalState,
        canonicalState,
        stateCode,
        city: d.city || "",
        venue: d.venueName || "",
        normalizedVenue: normalizeVenueKey(d.venueName || "", d.city || ""),
        courseDate: "2026-07-21",
      };

      if (rec.category === "coordinator") {
        seenCoordinatorIds.add(d.certificateId);
        pushRecord(coordinatorsByState, canonicalState, rec);
      } else if (rec.category === "champion") {
        seenChampionIds.add(d.certificateId);
        pushRecord(championsByState, canonicalState, rec);
      } else {
        seenParticipantIds.add(d.certificateId);
        pushRecord(participantsByState, canonicalState, rec);
      }
    }
  }

  return {
    participantsByState,
    coordinatorsByState,
    championsByState,
  };
}

/**
 * Loads and indexes all live verified CPR Day 2026 records strictly scoped to 2026-07-21 (Synchronous).
 * Uses in-memory cached DB records if available.
 */
export function loadUnifiedLiveCPRDayData(forceRefresh = false): LiveCPRDayStateIndex {
  const now = Date.now();
  if (!forceRefresh && cachedLiveIndex && now - lastLiveIndexTimestamp < CACHE_TTL_MS) {
    return cachedLiveIndex;
  }

  cachedLiveIndex = buildUnifiedLiveCPRDayIndex(cachedDbCertificateRecords || []);
  lastLiveIndexTimestamp = now;

  return cachedLiveIndex;
}

/**
 * Loads and indexes all live verified CPR Day 2026 records strictly scoped to 2026-07-21 (Async).
 * Queries PostgreSQL AdminCertificateRecord directly and refreshes the cache.
 */
export async function loadUnifiedLiveCPRDayDataAsync(forceRefresh = false): Promise<LiveCPRDayStateIndex> {
  const now = Date.now();
  if (!forceRefresh && cachedLiveIndex && cachedDbCertificateRecords !== null && now - lastLiveIndexTimestamp < CACHE_TTL_MS) {
    return cachedLiveIndex;
  }

  const dbRecords = await fetchAdminCertificateRecordsAsync(forceRefresh);
  cachedLiveIndex = buildUnifiedLiveCPRDayIndex(dbRecords);
  lastLiveIndexTimestamp = now;

  return cachedLiveIndex;
}

/**
 * Internal baseline venue grouping item
 */
interface BaselineVenueGroup {
  venueId: string;
  venueName: string;
  normalizedVenue: string;
  city: string;
  state: string;
  zone: string;
  rows: CPRCensusRecord[];
  baselineCourseCount: number;
  baselineReportedTrained: number;
  coordinators: Set<string>;
  champions: Set<string>;
  distinctiveTokens: string[];
}

/**
 * Generates the authoritative dual-metric CPR Day State Reconciliation Report.
 */
export function getCPRDayReconciliationReport(
  stateQuery: string,
  preloadedLiveData?: LiveCPRDayStateIndex
): CPRDayStateReconciliationReport | null {
  const canonicalState = normalizeDisplayState(stateQuery);
  const lockedEntry = getLockedOfficialStateCensus(canonicalState);
  if (!lockedEntry) return null;

  const stateCode = normalizeStateCode(canonicalState);
  const zone = lockedEntry.zone;



  // 1. Load All Baseline Census Rows & Canonical Physical Venues for this State
  const allCensusData = loadCPRCensusData();
  const stateBaselineRows = allCensusData.filter(
    (c) => normalizeDisplayState(c.state).toLowerCase() === canonicalState.toLowerCase()
  );
  const stateVenues = getCanonicalVenuesByState(canonicalState);

  // 2. Load Unified Live CPR Day Data for this State
  const liveData = preloadedLiveData || loadUnifiedLiveCPRDayData();
  const liveParticipants = liveData.participantsByState.get(canonicalState) || [];
  const liveCoordinators = liveData.coordinatorsByState.get(canonicalState) || [];
  const liveChampions = liveData.championsByState.get(canonicalState) || [];

  // Group Live Records by Normalized Venue + City
  interface LiveVenueGroup {
    rawVenue: string;
    rawCity: string;
    normVenue: string;
    normCity: string;
    records: UnifiedLiveCPRDayRecord[];
    sampleCertIds: string[];
    coordinators: Set<string>;
    champions: Set<string>;
  }

  const liveVenueGroups = new Map<string, LiveVenueGroup>();

  for (const p of liveParticipants) {
    const key = `${p.normalizedVenue}|${normalizeCityName(p.city)}`;
    const existing = liveVenueGroups.get(key) || {
      rawVenue: p.venue,
      rawCity: p.city,
      normVenue: p.normalizedVenue,
      normCity: normalizeCityName(p.city),
      records: [],
      sampleCertIds: [],
      coordinators: new Set<string>(),
      champions: new Set<string>(),
    };

    existing.records.push(p);
    if (existing.sampleCertIds.length < 10) {
      existing.sampleCertIds.push(p.certificateId);
    }
    liveVenueGroups.set(key, existing);
  }

  for (const c of liveCoordinators) {
    const key = `${c.normalizedVenue}|${normalizeCityName(c.city)}`;
    const group = liveVenueGroups.get(key);
    if (group && c.name) group.coordinators.add(normalizeDisplayName(c.name));
  }
  for (const ch of liveChampions) {
    const key = `${ch.normalizedVenue}|${normalizeCityName(ch.city)}`;
    const group = liveVenueGroups.get(key);
    if (group && ch.name) group.champions.add(normalizeDisplayName(ch.name));
  }

  // 3. Candidate Mapping & Auto-Match against Canonical Baseline Venues
  const canonCerts = new Map<string, Set<string>>();
  const canonAdditionalCoords = new Map<string, Set<string>>();
  const canonAdditionalChamps = new Map<string, Set<string>>();
  const canonSampleCertIds = new Map<string, string[]>();

  stateVenues.forEach((v: any) => {
    canonCerts.set(v.canonicalVenueId, new Set<string>());
    canonAdditionalCoords.set(v.canonicalVenueId, new Set<string>());
    canonAdditionalChamps.set(v.canonicalVenueId, new Set<string>());
    canonSampleCertIds.set(v.canonicalVenueId, []);
  });

  for (const [, g] of liveVenueGroups.entries()) {
    const autoCandidates: { canon: any; score: any }[] = [];
    for (const b of stateVenues) {
      const matchScore = scoreVenueMatch(g.rawVenue, g.rawCity, b.canonicalVenueName, b.city);
      if (matchScore.score >= 0.70) {
        autoCandidates.push({ canon: b, score: matchScore });
      }
    }
    autoCandidates.sort((a, b) => b.score.score - a.score.score);
    const aTop = autoCandidates[0];
    const aRunnerUp = autoCandidates[1];
    const aDominant = !aRunnerUp || aTop.score.score - aRunnerUp.score.score >= 0.15;

    if (aTop && aDominant && aTop.score.score >= 0.75) {
      const set = canonCerts.get(aTop.canon.canonicalVenueId)!;
      g.records.forEach((r) => set.add(r.certificateId));
      const coords = canonAdditionalCoords.get(aTop.canon.canonicalVenueId)!;
      g.coordinators.forEach((name) => coords.add(name));
      const champs = canonAdditionalChamps.get(aTop.canon.canonicalVenueId)!;
      g.champions.forEach((name) => champs.add(name));
      const samples = canonSampleCertIds.get(aTop.canon.canonicalVenueId)!;
      g.sampleCertIds.forEach((id) => {
        if (samples.length < 10) samples.push(id);
      });
    }
  }

  // 4. Overlay Admin Reconciliation Decisions from Review Snapshot
  const snapshot = getFrozenVenueReviewSnapshot();
  const stateSnapshotItems = snapshot.filter(
    (i: any) => i.state.toLowerCase() === canonicalState.toLowerCase()
  );

  const supplementaryVenues: CPRDayVenueSummary[] = [];
  const reviewQueue: VenueMatchingReviewItem[] = [];
  const reviewVenueSummaries: CPRDayVenueSummary[] = [];

  let supplementaryTrainedSum = 0;
  let supplementaryCertifiedSum = 0;
  let reviewCertifiedSum = 0;

  for (const item of stateSnapshotItems) {
    if (item.finalDecision === "SAME_BASELINE_VENUE" && item.finalCanonicalVenueId) {
      let set = canonCerts.get(item.finalCanonicalVenueId);
      if (!set) {
        set = new Set<string>();
        canonCerts.set(item.finalCanonicalVenueId, set);
      }
      item.allCertificateIds.forEach((id: string) => set!.add(id));
      const samples = canonSampleCertIds.get(item.finalCanonicalVenueId);
      if (samples) {
        item.sampleCertificateIds.forEach((id: string) => {
          if (samples.length < 10 && !samples.includes(id)) samples.push(id);
        });
      }
    } else if (item.finalDecision === "SUPPLEMENTARY_NEW_VENUE") {
      const suppTrained = item.supplementaryTrainedCount !== undefined ? item.supplementaryTrainedCount : item.certifiedCount;
      supplementaryTrainedSum += suppTrained;
      supplementaryCertifiedSum += item.certifiedCount;

      const suppVenue: CPRDayVenueSummary = {
        venueId: item.reviewId,
        serialNumber: `SUPP-${item.reviewId}`,
        state: canonicalState,
        canonicalState,
        stateCode,
        city: item.city,
        venue: item.liveVenue,
        normalizedVenue: normalizeVenueKey(item.liveVenue, item.city),
        baselineCourseCount: 0,
        supplementaryCourseCount: 1,
        totalCourseCount: 1,
        baselineReportedTrained: 0,
        participantsCertified: item.certifiedCount,
        supplementaryTrained: suppTrained,
        participantsTrained: suppTrained,
        isApprovedSupplementaryNewCourse: true,
        classification: "APPROVED_SUPPLEMENTARY" as any,
        classificationReason: item.reviewNote || "Confirmed supplementary new course/venue",
        baselineCoordinators: [],
        additionalLiveCoordinators: [],
        allCoordinators: [],
        baselineChampions: [],
        additionalLiveChampions: [],
        allChampions: [],
        baselineRows: [],
        sampleCertificateIds: item.sampleCertificateIds,
      };
      supplementaryVenues.push(suppVenue);
    } else {
      // PENDING / KEEP_REVIEW_REQUIRED
      reviewCertifiedSum += item.certifiedCount;
      reviewQueue.push({
        state: canonicalState,
        liveVenue: item.liveVenue,
        city: item.city,
        certifiedCount: item.certifiedCount,
        sampleCertIds: item.sampleCertificateIds,
        candidates: item.candidateMatches.map((c: any) => ({
          baselineVenue: c.canonicalVenueName,
          city: c.city,
          score: c.matchScore,
          level: "LEVEL_3_DISTINCTIVE_TOKEN",
          reason: c.matchReason,
        })),
        classificationReason: item.matchReason || "Pending Administrative Verification",
      });

      const revVenue: CPRDayVenueSummary = {
        venueId: item.reviewId,
        serialNumber: `REV-${item.reviewId}`,
        state: canonicalState,
        canonicalState,
        stateCode,
        city: item.city,
        venue: item.liveVenue,
        normalizedVenue: normalizeVenueKey(item.liveVenue, item.city),
        baselineCourseCount: 0,
        supplementaryCourseCount: 0,
        totalCourseCount: 0,
        baselineReportedTrained: 0,
        participantsCertified: item.certifiedCount,
        supplementaryTrained: 0,
        participantsTrained: 0,
        isApprovedSupplementaryNewCourse: false,
        classification: "REVIEW_REQUIRED",
        classificationReason: item.matchReason || "Pending Administrative Verification",
        baselineCoordinators: [],
        additionalLiveCoordinators: [],
        allCoordinators: [],
        baselineChampions: [],
        additionalLiveChampions: [],
        allChampions: [],
        baselineRows: [],
        sampleCertificateIds: item.sampleCertificateIds,
      };
      reviewVenueSummaries.push(revVenue);
    }
  }

  // 5. Assemble Canonical Baseline Venue Summaries
  const venueSummaries: CPRDayVenueSummary[] = [];
  let totalReconciledParticipantsTrained = 0;
  let totalMatchedParticipantsCertified = 0;
  let baselineMatchedVenuesCount = 0;
  const metaOverrides = getVenueMetadataOverridesMap();

  for (const b of stateVenues) {
    const vOverride = metaOverrides.get(b.canonicalVenueId);
    const displayVenueName = vOverride?.venueName || b.canonicalVenueName;
    const displayCity = vOverride?.city || b.city;

    const baseCoords = b.coordinators || [];
    const overrideCoords = vOverride?.additionalCoordinators || [];
    const addCoords = Array.from(canonAdditionalCoords.get(b.canonicalVenueId) || []).filter(
      (c) =>
        !baseCoords.some((bc: string) => bc.toLowerCase() === c.toLowerCase()) &&
        !overrideCoords.some((oc: string) => oc.toLowerCase() === c.toLowerCase())
    );
    const allCoords = deduplicatePersonNames([...baseCoords, ...overrideCoords, ...addCoords]);

    const baseChamps = b.champions || [];
    const overrideChamps = vOverride?.additionalChampions || [];
    const addChamps = Array.from(canonAdditionalChamps.get(b.canonicalVenueId) || []).filter(
      (c) =>
        !baseChamps.some((bc: string) => bc.toLowerCase() === c.toLowerCase()) &&
        !overrideChamps.some((oc: string) => oc.toLowerCase() === c.toLowerCase())
    );
    const allChamps = deduplicatePersonNames([...baseChamps, ...overrideChamps, ...addChamps]);

    const trainedAdjustment = vOverride?.verifiedTrainedAdjustment || 0;
    const effectiveBaselineTrained = b.baselineReportedTrained + trainedAdjustment;
    const courseAdjustment = vOverride?.verifiedCourseCountAdjustment || 0;
    const effectiveCourseCount = Math.max(1, b.baselineCourseCount + courseAdjustment);

    const certs = canonCerts.get(b.canonicalVenueId) || new Set<string>();
    const participantsCertified = certs.size;
    const participantsTrained = Math.max(effectiveBaselineTrained, participantsCertified);

    totalReconciledParticipantsTrained += participantsTrained;
    totalMatchedParticipantsCertified += participantsCertified;
    if (participantsCertified > 0) baselineMatchedVenuesCount += 1;

    const matchingRows = stateBaselineRows.filter((r) =>
      b.baselineSessionIds.includes(r.serialNumber) || b.baselineSessionIds.includes((r as any).sessionId)
    );

    const venueSummary: CPRDayVenueSummary = {
      venueId: b.canonicalVenueId,
      serialNumber: matchingRows.map((r) => r.serialNumber).join(", ") || b.baselineSessionIds.join(", "),
      state: canonicalState,
      canonicalState,
      stateCode,
      city: displayCity,
      venue: displayVenueName,
      normalizedVenue: normalizeVenueKey(displayVenueName, displayCity),
      baselineCourseCount: effectiveCourseCount,
      supplementaryCourseCount: 0,
      totalCourseCount: effectiveCourseCount,
      baselineReportedTrained: effectiveBaselineTrained,
      participantsCertified,
      supplementaryTrained: 0,
      participantsTrained,
      isApprovedSupplementaryNewCourse: false,
      classification: "BASELINE_MATCH",
      classificationReason:
        participantsCertified > effectiveBaselineTrained
          ? `Baseline session(s) verified: Certified roster exceeds reported (+${participantsCertified - effectiveBaselineTrained})`
          : `Baseline session(s) verified (${effectiveCourseCount} course${effectiveCourseCount > 1 ? "s" : ""})`,
      baselineCoordinators: baseCoords,
      additionalLiveCoordinators: [...overrideCoords, ...addCoords],
      allCoordinators: allCoords,
      baselineChampions: baseChamps,
      additionalLiveChampions: [...overrideChamps, ...addChamps],
      allChampions: allChamps,
      baselineRows: matchingRows,
      sampleCertificateIds: canonSampleCertIds.get(b.canonicalVenueId) || [],
    };

    venueSummaries.push(venueSummary);
  }

  // Combine venue summaries: baseline + supplementary + review
  const allStateVenues = [...venueSummaries, ...supplementaryVenues, ...reviewVenueSummaries];

  const stateAllCoordinators = deduplicatePersonNames(
    allStateVenues.flatMap((v) => v.allCoordinators)
  );
  const stateAllChampions = deduplicatePersonNames(
    allStateVenues.flatMap((v) => v.allChampions)
  );

  const centres: CentreReconciliationItem[] = allStateVenues.map((v) => ({
    canonicalVenueId: v.venueId,
    serialNumber: v.serialNumber,
    venue: v.venue,
    normalizedVenue: v.normalizedVenue,
    city: v.city,
    state: v.state,
    stateCode: v.stateCode,
    venueCode: v.venueCode,
    coursesCount: v.totalCourseCount,
    baselineParticipants: v.baselineReportedTrained,
    verifiedAttendanceCount: v.verifiedAttendanceCount,
    liveRecords: v.participantsCertified,
    classification: v.classification,
    classificationReason: v.classificationReason,
    confirmedIncrement: Math.max(0, v.participantsTrained - v.baselineReportedTrained),
    projectedTotal: v.participantsTrained,
    baselineCoordinators: v.baselineCoordinators,
    additionalLiveCoordinators: v.additionalLiveCoordinators,
    allCoordinators: v.allCoordinators,
    baselineChampions: v.baselineChampions,
    additionalLiveChampions: v.additionalLiveChampions,
    allChampions: v.allChampions,
    sampleCertificateIds: v.sampleCertificateIds,
  }));

  const existingPositiveIncrement = Math.max(
    0,
    totalReconciledParticipantsTrained - lockedEntry.participantsTrained
  );
  const totalReconciledWithSupp = totalReconciledParticipantsTrained + supplementaryTrainedSum;
  const totalConfirmedIncrement = existingPositiveIncrement + supplementaryTrainedSum;

  const totalCoursesConducted = lockedEntry.centres + supplementaryVenues.length;
  const totalPhysicalVenues = stateVenues.length + supplementaryVenues.length;

  const summary: StateReconciliationSummary = {
    baseline: {
      uniqueVenues: stateVenues.length,
      courses: lockedEntry.centres,
      reportedTrained: lockedEntry.participantsTrained,
      isLocked: true,
    },
    liveData: {
      participantCertificatesFound: liveParticipants.length,
      uniqueVenuesRepresented: liveVenueGroups.size,
      coordinatorsFound: liveCoordinators.length,
      championsFound: liveChampions.length,
    },
    reconciliation: {
      baselineMatchedVenues: baselineMatchedVenuesCount,
      supplementaryNewCourses: supplementaryVenues.length,
      reviewVenues: reviewQueue.length,
      matchedCertified: totalMatchedParticipantsCertified + supplementaryCertifiedSum,
      reviewCertified: reviewCertifiedSum,
      confirmedNewIncrementalParticipants: totalConfirmedIncrement,
      participantsAlreadyRepresentedBaseline: Math.min(
        totalMatchedParticipantsCertified,
        lockedEntry.participantsTrained
      ),
    },
    reconciledReport: {
      uniqueVenues: totalPhysicalVenues,
      coursesConducted: totalCoursesConducted,
      participantsTrained: totalReconciledWithSupp,
      participantsCertified: liveParticipants.length,
      coordinatorsCount: stateAllCoordinators.length,
      championsCount: stateAllChampions.length,
      disclaimer: "DUAL-METRIC RECONCILIATION: PARTICIPANTS TRAINED VS CERTIFIED",
    },
  };

  return {
    state: canonicalState,
    canonicalState,
    stateCode,
    zone,
    summary,
    venues: allStateVenues,
    centres,
    reviewQueue,
    reconciliationDate: new Date().toISOString(),
  };
}

/**
 * Async version of getCPRDayReconciliationReport that queries PostgreSQL AdminCertificateRecord.
 */
export async function getCPRDayReconciliationReportAsync(
  stateQuery: string,
  forceRefresh = false
): Promise<CPRDayStateReconciliationReport | null> {
  const liveData = await loadUnifiedLiveCPRDayDataAsync(forceRefresh);
  return getCPRDayReconciliationReport(stateQuery, liveData);
}

export function getAllCPRDayReconciliationReports(
  preloadedLiveData?: LiveCPRDayStateIndex
): CPRDayStateReconciliationReport[] {
  const liveData = preloadedLiveData || loadUnifiedLiveCPRDayData();
  const states = getLockedCensusStateList();
  const reports: CPRDayStateReconciliationReport[] = [];

  for (const s of states) {
    const rep = getCPRDayReconciliationReport(s.canonicalState, liveData);
    if (rep) reports.push(rep);
  }

  return reports;
}

export async function getAllCPRDayReconciliationReportsAsync(
  forceRefresh = false
): Promise<CPRDayStateReconciliationReport[]> {
  const liveData = await loadUnifiedLiveCPRDayDataAsync(forceRefresh);
  return getAllCPRDayReconciliationReports(liveData);
}

export interface StateNationalReconciliationRow {
  sNo: number;
  state: string;
  canonicalState: string;
  stateCode: string;
  zone: string;
  baselineCourses: number;
  baselineVenues: number;
  baselineTrained: number;
  certified: number;
  reconciledIncrement: number;
  reconciledTrained: number;
  draftCourses: number;
  draftVenues: number;
  coordinatorsCount: number;
  championsCount: number;
  pendingReviewGroups: number;
  approvedDecisionsCount: number;
  verificationStatus: string;
  status: "Reconciled" | "Partially Reconciled" | "Pending Review" | "No Reconciliation Required";
}

export interface CPRDayNationalReconciliationReport {
  state: string;
  canonicalState: string;
  stateCode: string;
  zone: string;
  isNational?: boolean;
  isNationalConsolidated: boolean;
  summary: StateReconciliationSummary;
  stateSummaries: StateNationalReconciliationRow[];
  venues: CPRDayVenueSummary[];
  centres: CentreReconciliationItem[];
  reviewQueue: VenueMatchingReviewItem[];
  reconciliationDate: string;
}

/**
 * Returns the National Consolidated Reconciliation Report spanning all 28 States/UTs.
 */
export function getCPRDayNationalConsolidatedReport(
  preloadedLiveData?: LiveCPRDayStateIndex,
  preloadedStateReports?: CPRDayStateReconciliationReport[]
): CPRDayNationalReconciliationReport {
  const registry = getFrozenBaselineVenueRegistry();
  const snapshot = getFrozenVenueReviewSnapshot();
  const liveData = preloadedLiveData || loadUnifiedLiveCPRDayData();
  const stateReports = preloadedStateReports || getAllCPRDayReconciliationReports(liveData);

  const stateSummaries: StateNationalReconciliationRow[] = stateReports.map((r, idx) => {
    const reviewCount = r.summary.reconciliation.reviewVenues;

    let status: StateNationalReconciliationRow["status"] = "Reconciled";
    if (reviewCount === 0) {
      status = "No Reconciliation Required";
    } else if (r.canonicalState === "Maharashtra") {
      status = "Partially Reconciled";
    } else {
      status = "Pending Review";
    }

    const bCourses = r.summary.baseline.courses;
    const bVenues = r.summary.baseline.uniqueVenues;
    const bTrained = r.summary.baseline.reportedTrained;
    const cert = r.summary.liveData.participantCertificatesFound;
    const inc = r.summary.reconciliation.confirmedNewIncrementalParticipants;
    const recTrained = r.summary.reconciledReport.participantsTrained;
    const draftCourses = r.summary.reconciledReport.coursesConducted;
    const draftVenues = r.summary.reconciledReport.uniqueVenues;
    const coordinatorsCount = r.summary.reconciledReport.coordinatorsCount;
    const championsCount = r.summary.reconciledReport.championsCount;

    return {
      sNo: idx + 1,
      state: r.canonicalState,
      canonicalState: r.canonicalState,
      stateCode: r.stateCode,
      zone: r.zone,
      baselineCourses: bCourses,
      baselineVenues: bVenues,
      baselineTrained: bTrained,
      certified: cert,
      reconciledIncrement: inc,
      reconciledTrained: recTrained,
      draftCourses,
      draftVenues,
      coordinatorsCount,
      championsCount,
      pendingReviewGroups: reviewCount,
      approvedDecisionsCount: r.canonicalState === "Maharashtra" ? 2 : 0,
      verificationStatus: "Pending State Verification",
      status,
    };
  });

  const totalBaselineCourses = stateSummaries.reduce((a, b) => a + b.baselineCourses, 0);
  const totalBaselineTrained = stateSummaries.reduce((a, b) => a + b.baselineTrained, 0);
  const totalCertified = stateSummaries.reduce((a, b) => a + b.certified, 0);
  const totalReconciledIncrement = stateSummaries.reduce((a, b) => a + b.reconciledIncrement, 0);
  const totalReconciledTrained = stateSummaries.reduce((a, b) => a + b.reconciledTrained, 0);
  const totalPendingReviewGroups = stateSummaries.reduce((a, b) => a + b.pendingReviewGroups, 0);

  const allLiveCoords = deduplicatePersonNames(
    Array.from(liveData.coordinatorsByState.values()).flatMap((list: any[]) => list.map((c) => c.name))
  );
  const allLiveChamps = deduplicatePersonNames(
    Array.from(liveData.championsByState.values()).flatMap((list: any[]) => list.map((c) => c.name))
  );
  const allBaselineCoords = deduplicatePersonNames(registry.flatMap((v: any) => v.coordinators));
  const allBaselineChamps = deduplicatePersonNames(registry.flatMap((v: any) => v.champions));

  const nationalAllCoords = deduplicatePersonNames([...allBaselineCoords, ...allLiveCoords]);
  const nationalAllChamps = deduplicatePersonNames([...allBaselineChamps, ...allLiveChamps]);

  const allLiveParticipants = Array.from(liveData.participantsByState.values()).flat();
  const uniqueVenuesRepresented = new Set(
    allLiveParticipants.map((p) => `${p.normalizedVenue}|${p.city.toLowerCase().trim()}`)
  ).size;

  const baselineMatchedVenues = stateReports.reduce(
    (a, b) => a + b.summary.reconciliation.baselineMatchedVenues,
    0
  );
  const supplementaryNewCourses = stateReports.reduce(
    (a, b) => a + b.summary.reconciliation.supplementaryNewCourses,
    0
  );
  const matchedCertified = stateReports.reduce(
    (a, b) => a + b.summary.reconciliation.matchedCertified,
    0
  );
  const reviewCertified = stateReports.reduce(
    (a, b) => a + b.summary.reconciliation.reviewCertified,
    0
  );
  const participantsAlreadyRepresented = stateReports.reduce(
    (a, b) => a + b.summary.reconciliation.participantsAlreadyRepresentedBaseline,
    0
  );

  const summary: StateReconciliationSummary = {
    baseline: {
      uniqueVenues: registry.length, // 288
      courses: totalBaselineCourses, // 391
      reportedTrained: totalBaselineTrained, // 43,636
      isLocked: true,
    },
    liveData: {
      participantCertificatesFound: totalCertified, // 33,477
      uniqueVenuesRepresented,
      coordinatorsFound: nationalAllCoords.length,
      championsFound: nationalAllChamps.length,
    },
    reconciliation: {
      baselineMatchedVenues,
      supplementaryNewCourses,
      reviewVenues: totalPendingReviewGroups,
      matchedCertified,
      reviewCertified,
      confirmedNewIncrementalParticipants: totalReconciledIncrement,
      participantsAlreadyRepresentedBaseline: participantsAlreadyRepresented,
    },
    reconciledReport: {
      uniqueVenues: registry.length + supplementaryNewCourses,
      coursesConducted: totalBaselineCourses + supplementaryNewCourses,
      participantsTrained: totalReconciledTrained,
      participantsCertified: totalCertified,
      coordinatorsCount: nationalAllCoords.length,
      championsCount: nationalAllChamps.length,
      disclaimer: "DUAL-METRIC RECONCILIATION: PARTICIPANTS TRAINED VS CERTIFIED",
    },
  };

  return {
    state: "All India",
    canonicalState: "All India",
    stateCode: "IN",
    zone: "National Consolidation",
    isNational: true,
    isNationalConsolidated: true,
    summary,
    stateSummaries,
    venues: stateReports.flatMap((r) => r.venues),
    centres: stateReports.flatMap((r) => r.centres),
    reviewQueue: stateReports.flatMap((r) => r.reviewQueue),
    reconciliationDate: new Date().toISOString(),
  };
}

/**
 * Async version of getCPRDayNationalConsolidatedReport that queries PostgreSQL AdminCertificateRecord.
 */
export async function getCPRDayNationalConsolidatedReportAsync(
  forceRefresh = false
): Promise<CPRDayNationalReconciliationReport> {
  const liveData = await loadUnifiedLiveCPRDayDataAsync(forceRefresh);
  const stateReports = await getAllCPRDayReconciliationReportsAsync(forceRefresh);
  return getCPRDayNationalConsolidatedReport(liveData, stateReports);
}

