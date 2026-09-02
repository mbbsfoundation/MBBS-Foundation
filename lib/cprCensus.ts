import fs from "fs";
import path from "path";
import { getAllCPRCertificates, CPRCertificateRecord } from "./cprCertificates";
import { getAllSanjeevaniFromStorage } from "./sanjeevaniStorage";
import {
  getLockedOfficialStateCensus,
  getLockedCensusStateList,
  LOCKED_OFFICIAL_INDIA_TOTAL,
  LockedStateCensusEntry,
} from "./cprStateCensus";

/**
 * Raw data row structure as parsed from `CPR day census data.csv`.
 */
export interface CPRCensusRawRow {
  srNo: string;
  venueName: string;
  city: string;
  state: string;
  zone: string;
  coordinator: string;
  champions: string[];
  derivedCensusNumber: number;
  raw: {
    srNo: string;
    venueName: string;
    city: string;
    state: string;
    zone: string;
    coordinator: string;
    champions: string[];
    derivedCensusNumber: string;
  };
}

/**
 * Normalized Census Record for a training session / centre.
 */
export interface CPRCensusRecord {
  serialNumber: string;
  venue: string;
  city: string;
  state: string;
  zone: string;
  coordinator: string;
  champions: string[];
  participantsTrained: number;
  raw: CPRCensusRawRow["raw"];
}

/**
 * Centre-level reporting object with merged live coordinator/champion data.
 */
export interface CPRDayCentreReport {
  serialNumber: string;
  venue: string;
  city: string;
  state: string;
  zone: string;
  coordinators: string[];
  champions: string[];
  participantsTrained: number;
  isHistoricalCentre: boolean;
  supplementalFromLive: boolean;
}

/**
 * State-level Report Object.
 */
export interface CPRDayStateReport {
  state: string;
  canonicalState: string;
  zone: string;
  censusCentres: number;
  censusParticipants: number;
  totalUniqueCoordinators: number;
  totalUniqueChampions: number;
  centres: CPRDayCentreReport[];
  lockedCensusTotals?: {
    officialCentres?: number;
    officialParticipants?: number;
    isLocked: boolean;
  };
}

/**
 * National Census Summary Overview.
 */
export interface CPRDayNationalReportSummary {
  totalCentres: number;
  totalParticipants: number;
  totalStates: number;
  stateSummaries: Array<{
    state: string;
    canonicalState: string;
    zone: string;
    centres: number;
    participants: number;
  }>;
}

// In-Memory Fast Cache for Census Data
let censusCache: CPRCensusRecord[] | null = null;
let lastCensusMtime = 0;

const CENSUS_FILE_PATH = path.join(process.cwd(), "cprsanjeevani", "CPR day census data.csv");

/**
 * Lightweight RFC 4180 compliant CSV parser.
 */
function parseCensusCSV(text: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        currentCell += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        currentCell += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        currentRow.push(currentCell.trim());
        currentCell = "";
      } else if (char === "\r") {
        if (nextChar === "\n") i++;
        currentRow.push(currentCell.trim());
        if (currentRow.some((c) => c.length > 0)) rows.push(currentRow);
        currentRow = [];
        currentCell = "";
      } else if (char === "\n") {
        currentRow.push(currentCell.trim());
        if (currentRow.some((c) => c.length > 0)) rows.push(currentRow);
        currentRow = [];
        currentCell = "";
      } else {
        currentCell += char;
      }
    }
  }

  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    if (currentRow.some((c) => c.length > 0)) rows.push(currentRow);
  }

  return rows;
}

/**
 * Display-only Name Normalization:
 * - Formats titles cleanly: "DR. NAME" / "Dr.NAME" / "Dr. Name" / "dr name" -> "Dr Name"
 * - Removes unnecessary periods after honorifics (Dr, Prof, Lt, Capt, Col, Mr, Mrs, Ms)
 * - Collapses excessive whitespaces
 * - Converts ALL-CAPS names to proper Title Case while respecting single-letter initials
 * - Preserves underlying raw string in `.raw`
 */
export function normalizeDisplayName(rawName: string): string {
  if (!rawName || typeof rawName !== "string") return "";

  let name = rawName.trim().replace(/\s+/g, " ");

  // Normalize common honorific prefixes:
  // e.g. "Dr.", "DR.", "dr.", "Dr " -> "Dr "
  name = name.replace(/^(dr|prof|lt|capt|col|mr|mrs|ms)\.?\s+/i, (match, title) => {
    const cleanTitle = title.charAt(0).toUpperCase() + title.slice(1).toLowerCase();
    return `${cleanTitle} `;
  });

  // Handle embedded "Dr." with no space, e.g. "Dr.A.S.Kireeti" -> "Dr A.S.Kireeti"
  name = name.replace(/^Dr\.([A-Za-z])/i, "Dr $1");
  name = name.replace(/^Prof\.([A-Za-z])/i, "Prof $1");

  // If the rest of the name is all uppercase, convert to Title Case while keeping initials
  const parts = name.split(" ");
  const titleCased = parts
    .map((p, idx) => {
      if (!p) return "";
      // If it's an initial like "A.", "K.", "S.", keep uppercase with dot
      if (/^[A-Z]\.?$/i.test(p)) {
        return p.toUpperCase();
      }
      // If entire part is uppercase e.g. "SARDAR", "SULTHANA"
      if (p === p.toUpperCase() && p.length > 1) {
        return p.charAt(0).toUpperCase() + p.slice(1).toLowerCase();
      }
      return p.charAt(0).toUpperCase() + p.slice(1);
    })
    .join(" ");

  return titleCased.replace(/\s+/g, " ").trim();
}

/**
 * Display-only Venue Normalization:
 * - Trims whitespace
 * - Collapses extra spaces
 * - Standardizes known spelling variants
 */
export function normalizeDisplayVenue(rawVenue: string): string {
  if (!rawVenue || typeof rawVenue !== "string") return "";
  let v = rawVenue.trim().replace(/\s+/g, " ");
  if (
    v.toLowerCase().includes("jindal super special") ||
    v.toLowerCase().includes("jindal super specialty") ||
    v.toLowerCase().includes("jindal super speciality")
  ) {
    return "Jindal Super Speciality Hospital";
  }
  return v;
}

/**
 * Display-only State Normalization:
 * - Standardizes state names for grouping (e.g. "Andaman & Nikobar Island" -> "Andaman & Nicobar Islands")
 */
export function normalizeDisplayState(rawState: string): string {
  if (!rawState || typeof rawState !== "string") return "";
  const s = rawState.trim().toLowerCase();
  if (
    s === "andaman & nikobar island" ||
    s === "andaman & nicobar islands" ||
    s === "andaman and nicobar islands" ||
    s === "andaman & nicobar" ||
    s === "andaman and nicobar"
  ) {
    return "Andaman & Nicobar Islands";
  }
  if (s === "jammu and kashmir" || s === "jammu & kashmir") {
    return "Jammu & Kashmir";
  }
  // Title Case
  return rawState
    .trim()
    .split(" ")
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : ""))
    .join(" ");
}

/**
 * Removes duplicate person names based on case-insensitive and title-insensitive match.
 */
export function deduplicatePersonNames(names: string[]): string[] {
  const seen = new Map<string, string>();

  for (const n of names) {
    if (!n || !n.trim()) continue;
    const cleanDisplay = normalizeDisplayName(n);
    const key = cleanDisplay
      .toLowerCase()
      .replace(/^(dr|prof|lt|capt|col|mr|mrs|ms)\s+/i, "")
      .replace(/[^a-z0-9]/g, "");

    if (!seen.has(key)) {
      seen.set(key, cleanDisplay);
    }
  }

  return Array.from(seen.values());
}

/**
 * Loads and parses `CPR day census data.csv` into normalized `CPRCensusRecord` records.
 * Uses mtime-based in-memory caching.
 */
export function loadCPRCensusData(): CPRCensusRecord[] {
  if (!fs.existsSync(CENSUS_FILE_PATH)) {
    console.warn("Census CSV not found at:", CENSUS_FILE_PATH);
    return [];
  }

  try {
    const stats = fs.statSync(CENSUS_FILE_PATH);
    if (censusCache && stats.mtimeMs <= lastCensusMtime) {
      return censusCache;
    }

    const content = fs.readFileSync(CENSUS_FILE_PATH, "utf8").replace(/^\uFEFF/, "");
    const rows = parseCensusCSV(content);

    if (rows.length <= 1) {
      censusCache = [];
      lastCensusMtime = stats.mtimeMs;
      return [];
    }

    const dataRows = rows.slice(1);
    const records: CPRCensusRecord[] = [];

    for (let i = 0; i < dataRows.length; i++) {
      const cols = dataRows[i];
      const rawSrNo = (cols[0] || "").trim();
      const rawVenue = (cols[1] || "").trim();
      const rawCity = (cols[2] || "").trim();
      const rawState = (cols[3] || "").trim();
      const rawZone = (cols[4] || "").trim();
      const rawCoordinator = (cols[5] || "").trim();

      // Collect non-empty champions from columns 6 through 12 (Champion 1 to Champion 7)
      const rawChampions: string[] = [];
      for (let c = 6; c <= 12; c++) {
        const champ = (cols[c] || "").trim();
        if (champ && champ.length > 0) {
          rawChampions.push(champ);
        }
      }

      const rawDerivedNumber = (cols[13] || "").trim();
      const parsedNumber = parseInt(rawDerivedNumber || "0", 10);
      const participantsTrained = isNaN(parsedNumber) ? 0 : parsedNumber;

      const serialNumber = rawSrNo || String(i + 1);
      const displayVenue = normalizeDisplayVenue(rawVenue);
      const displayCoordinator = normalizeDisplayName(rawCoordinator);
      const displayChampions = rawChampions.map(normalizeDisplayName);

      records.push({
        serialNumber,
        venue: displayVenue,
        city: rawCity,
        state: rawState,
        zone: rawZone,
        coordinator: displayCoordinator,
        champions: displayChampions,
        participantsTrained,
        raw: {
          srNo: rawSrNo,
          venueName: rawVenue,
          city: rawCity,
          state: rawState,
          zone: rawZone,
          coordinator: rawCoordinator,
          champions: rawChampions,
          derivedCensusNumber: rawDerivedNumber,
        },
      });
    }

    censusCache = records;
    lastCensusMtime = stats.mtimeMs;
    return records;
  } catch (err) {
    console.error("Error reading CPR day census CSV:", err);
    return [];
  }
}

/**
 * Returns National CPR Day Census Summary Overview.
 */
export function getCPRDayCensusSummary(): CPRDayNationalReportSummary {
  const records = loadCPRCensusData();
  const stateMap = new Map<string, { state: string; canonicalState: string; zone: string; centres: number; participants: number }>();

  let totalCentres = 0;
  let totalParticipants = 0;

  for (const r of records) {
    totalCentres++;
    totalParticipants += r.participantsTrained;

    const canonicalState = normalizeDisplayState(r.state);
    const existing = stateMap.get(canonicalState) || {
      state: r.state,
      canonicalState,
      zone: r.zone,
      centres: 0,
      participants: 0,
    };

    existing.centres++;
    existing.participants += r.participantsTrained;
    stateMap.set(canonicalState, existing);
  }

  const stateSummaries = Array.from(stateMap.values()).sort((a, b) =>
    a.canonicalState.localeCompare(b.canonicalState)
  );

  return {
    totalCentres,
    totalParticipants,
    totalStates: stateSummaries.length,
    stateSummaries,
  };
}

/**
 * Returns list of unique canonical state names present in the census (sorted).
 */
export function getCPRDayStateList(): string[] {
  const lockedList = getLockedCensusStateList();
  if (lockedList && lockedList.length > 0) {
    return lockedList.map((s) => s.canonicalState);
  }
  const summary = getCPRDayCensusSummary();
  return summary.stateSummaries.map((s) => s.canonicalState);
}

/**
 * Returns a State Report for a given state name:
 * - Computes `censusCentres` (historical centre count) and `censusParticipants` (historical participants sum).
 * - Maps all centre records for that state.
 * - Safely integrates live data from coordinators, champions, and database/storage additions without overwriting baseline data.
 * - Attaches locked official state census totals.
 */
export function getCPRDayStateReport(stateQuery: string): CPRDayStateReport | null {
  if (!stateQuery || !stateQuery.trim()) return null;

  const targetStateNorm = normalizeDisplayState(stateQuery).toLowerCase();
  const allCensus = loadCPRCensusData();

  const stateCensusRecords = allCensus.filter(
    (r) => normalizeDisplayState(r.state).toLowerCase() === targetStateNorm
  );

  if (stateCensusRecords.length === 0) {
    return null;
  }

  const primaryStateName = stateCensusRecords[0].state;
  const canonicalStateName = normalizeDisplayState(primaryStateName);
  const primaryZone = stateCensusRecords[0].zone || "";

  let censusCentres = 0;
  let censusParticipants = 0;

  // Load live coordinators & champions for this state to merge supplemental names
  let liveCoordinators: CPRCertificateRecord[] = [];
  let liveChampions: CPRCertificateRecord[] = [];
  try {
    liveCoordinators = getAllCPRCertificates("coordinator").filter(
      (c) => normalizeDisplayState(c.state).toLowerCase() === targetStateNorm
    );
    liveChampions = getAllCPRCertificates("champion").filter(
      (c) => normalizeDisplayState(c.state).toLowerCase() === targetStateNorm
    );
  } catch (err) {
    console.warn("Could not load live certificates for report enrichment:", err);
  }

  const centreReports: CPRDayCentreReport[] = [];
  const stateAllCoordinators: string[] = [];
  const stateAllChampions: string[] = [];

  for (const cr of stateCensusRecords) {
    censusCentres++;
    censusParticipants += cr.participantsTrained;

    const normVenueKey = cr.venue.toLowerCase().replace(/[^a-z0-9]/g, "");

    // Find live coordinators for this venue/city
    const matchedLiveCoords = liveCoordinators
      .filter((lc) => {
        const vKey = (lc.venueName || "").toLowerCase().replace(/[^a-z0-9]/g, "");
        return vKey.length > 0 && (vKey.includes(normVenueKey) || normVenueKey.includes(vKey));
      })
      .map((lc) => lc.participantName);

    // Find live champions for this venue/city
    const matchedLiveChamps = liveChampions
      .filter((lc) => {
        const vKey = (lc.venueName || "").toLowerCase().replace(/[^a-z0-9]/g, "");
        return vKey.length > 0 && (vKey.includes(normVenueKey) || normVenueKey.includes(vKey));
      })
      .map((lc) => lc.participantName);

    // Merge baseline coordinators + live coordinators
    const combinedCoordinators = deduplicatePersonNames([
      ...(cr.coordinator ? [cr.coordinator] : []),
      ...matchedLiveCoords,
    ]);

    // Merge baseline champions + live champions
    const combinedChampions = deduplicatePersonNames([
      ...cr.champions,
      ...matchedLiveChamps,
    ]);

    stateAllCoordinators.push(...combinedCoordinators);
    stateAllChampions.push(...combinedChampions);

    centreReports.push({
      serialNumber: cr.serialNumber,
      venue: cr.venue,
      city: cr.city,
      state: cr.state,
      zone: cr.zone,
      coordinators: combinedCoordinators,
      champions: combinedChampions,
      participantsTrained: cr.participantsTrained,
      isHistoricalCentre: true,
      supplementalFromLive: matchedLiveCoords.length > 0 || matchedLiveChamps.length > 0,
    });
  }

  const totalUniqueCoordinators = deduplicatePersonNames(stateAllCoordinators).length;
  const totalUniqueChampions = deduplicatePersonNames(stateAllChampions).length;

  // Retrieve locked authoritative official figures
  const lockedEntry = getLockedOfficialStateCensus(canonicalStateName);
  const lockedCensusTotals = lockedEntry
    ? {
        officialCentres: lockedEntry.centres,
        officialParticipants: lockedEntry.participantsTrained,
        isLocked: true,
      }
    : undefined;

  return {
    state: primaryStateName,
    canonicalState: canonicalStateName,
    zone: primaryZone,
    censusCentres,
    censusParticipants,
    totalUniqueCoordinators,
    totalUniqueChampions,
    centres: centreReports,
    lockedCensusTotals,
  };
}

/**
 * Returns State Reports for all states present in the census.
 */
export function getAllCPRDayStateReports(): CPRDayStateReport[] {
  const states = getCPRDayStateList();
  const reports: CPRDayStateReport[] = [];

  for (const s of states) {
    const report = getCPRDayStateReport(s);
    if (report) reports.push(report);
  }

  return reports;
}
