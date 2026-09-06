import { loadCPRCensusData, CPRCensusRecord, normalizeDisplayState } from "./cprCensus";
import { getLockedCensusStateList, getLockedOfficialStateCensus } from "./cprStateCensus";
import { normalizeStateCode } from "./sanjeevaniStorage";

/**
 * Normalizes common city aliases for uniform cross-referencing.
 */
export function normalizeCityName(rawCity: string): string {
  if (!rawCity || typeof rawCity !== "string") return "";
  let c = rawCity.toLowerCase().trim().replace(/[^a-z0-9]/g, "");

  if (c === "bardhaman" || c === "burdwan") return "burdwan";
  if (c === "calcutta" || c === "kolkata") return "kolkata";
  if (c === "bombay" || c === "mumbai") return "mumbai";
  if (c === "madras" || c === "chennai") return "chennai";
  if (c === "bangalore" || c === "bengaluru") return "bengaluru";
  if (c === "poona" || c === "pune") return "pune";
  if (c === "gurgaon" || c === "gurugram") return "gurugram";
  if (c === "orissa" || c === "odisha") return "odisha";
  if (c === "pondicherry" || c === "puducherry") return "puducherry";
  if (c.includes("island") || c.includes("andaman") || c.includes("nicobar") || c.includes("portblair")) {
    return "portblair";
  }

  return c;
}

/**
 * Normalizes a venue string conservatively for matching:
 * - Lowercases and trims.
 * - Collapses repeated whitespace.
 * - Strips common punctuation, symbols (&, commas, hyphens, quotes).
 * - Standardizes common educational, governmental, medical, and regional abbreviations.
 */
export function normalizeVenueKey(rawVenue: string, city?: string): string {
  if (!rawVenue || typeof rawVenue !== "string") return "";

  let v = rawVenue.toLowerCase().trim();

  // Strip punctuation and special chars (including &, commas, quotes, hyphens)
  v = v.replace(/['"`.,/\\()\-–—_[\]{}&]/g, " ");

  // Normalize common honorifics & prefixes
  v = v.replace(/\b(dr|prof|col|lt|capt|shri|sri|smt)\b/g, " ");
  v = v.replace(/\b(no|number|num)\b/g, " ");
  v = v.replace(/\b(govt|government)\b/g, "govt");
  v = v.replace(/\b(esih|esi hospital|esi hospitals|esic|esi)\b/g, "esi hospital");
  v = v.replace(/\b(hosp|hospital|hospitals)\b/g, "hospital");
  v = v.replace(/\b(med|medical)\b/g, "medical");
  v = v.replace(/\b(coll|college)\b/g, "college");
  v = v.replace(/\b(inst|institute|institution)\b/g, "institute");
  v = v.replace(/\b(kv|kendriya vidyalaya|kendriya vidyalayas)\b/g, "kendriya vidyalaya");
  v = v.replace(/\b(dumdum)\b/g, "dum dum");
  v = v.replace(/\b(pmshri|pm-shri)\b/g, "pm shri");
  v = v.replace(/\b(pgs|pargana|parganas)\b/g, "parganas");
  v = v.replace(/\b(saltlake)\b/g, "salt lake");
  v = v.replace(/\b(centre|center)\b/g, "centre");
  v = v.replace(/\b(univ|university)\b/g, "university");
  v = v.replace(/\b(dept|department)\b/g, "dept");
  v = v.replace(/\b(cloudenine)\b/g, "cloudnine");

  if (city && typeof city === "string" && city.trim().length > 2) {
    const cNorm = city.toLowerCase().trim().replace(/[^a-z0-9]/g, " ").trim();
    if (cNorm.length > 2) {
      v = v.replace(new RegExp(`\\b${cNorm}\\b`, "g"), " ");
    }
  }

  return v.replace(/\s+/g, " ").trim();
}

/**
 * Generic institutional and structural stop words that should NOT by themselves establish venue identity.
 */
const INSTITUTIONAL_STOP_WORDS = new Set([
  "hospital",
  "hospitals",
  "medical",
  "college",
  "colleges",
  "institute",
  "institutes",
  "institution",
  "govt",
  "government",
  "centre",
  "center",
  "school",
  "schools",
  "public",
  "national",
  "memorial",
  "trust",
  "health",
  "sciences",
  "research",
  "hall",
  "room",
  "auditorium",
  "campus",
  "and",
  "the",
  "of",
  "in",
  "at",
  "for",
  "west",
  "bengal",
  "maharashtra",
  "delhi",
  "island",
  "islands",
  "branch",
  "lane",
  "road",
  "street",
  "building",
  "esi",
  "esih",
  "esic",
  "clinic",
  "nursing",
  "university",
  "department",
  "dept",
  "foundation",
  "society",
  "academy",
  "shri",
  "sri",
  "dr",
  "prof",
  "scheme",
  "super",
  "speciality",
  "specialty",
  "block",
  "secondary",
  "higher",
]);

/**
 * Extracts distinctive core tokens from a normalized venue string.
 */
export function extractDistinctiveTokens(normVenue: string): string[] {
  return normVenue
    .split(" ")
    .map((w) => w.trim())
    .filter((w) => w.length > 1 && !INSTITUTIONAL_STOP_WORDS.has(w));
}

/**
 * Stable Canonical Physical Venue Registry Entry.
 * Derived from the 391 authoritative baseline course/session rows.
 */
export interface CanonicalPhysicalVenue {
  canonicalVenueId: string; // e.g. "CANON-AP-001"
  state: string;            // Canonical State Name (e.g. "Andhra Pradesh")
  stateCode: string;        // e.g. "AP"
  city: string;             // Primary city (e.g. "Tirupati")
  canonicalVenueName: string; // Clean display name
  normalizedVenue: string;  // Normalized key
  zone: string;
  aliases: string[];        // All variant names found in baseline sessions
  baselineSessionIds: string[]; // Serial numbers of all underlying baseline courses (from 391 rows)
  baselineCourseCount: number; // Number of baseline course sessions conducted at this physical venue
  baselineReportedTrained: number; // Sum of participantsTrained across all underlying sessions
  coordinators: string[];   // Distinct coordinators across sessions
  champions: string[];      // Distinct champions across sessions
  distinctiveTokens: string[]; // For matching incoming data
}

let cachedFrozenRegistry: CanonicalPhysicalVenue[] | null = null;
let cachedVenueMap: Map<string, CanonicalPhysicalVenue> | null = null;

/**
 * Builds and freezes the definitive 288 Canonical Physical Venue Registry.
 * References all 391 underlying course sessions totaling 43,636 baseline reported trained.
 */
export function getFrozenBaselineVenueRegistry(): CanonicalPhysicalVenue[] {
  if (cachedFrozenRegistry) {
    return cachedFrozenRegistry;
  }

  const allCensusData = loadCPRCensusData();
  const states = getLockedCensusStateList();
  const registry: CanonicalPhysicalVenue[] = [];
  const venueMap = new Map<string, CanonicalPhysicalVenue>();

  for (const s of states) {
    const stateCensus = allCensusData.filter(
      (c) => normalizeDisplayState(c.state).toLowerCase() === s.canonicalState.toLowerCase()
    );

    const stateVenues = new Map<string, CanonicalPhysicalVenue>();
    let stateVenueIndex = 1;

    for (const row of stateCensus) {
      const normV = normalizeVenueKey(row.venue, row.city);
      const normC = normalizeCityName(row.city);
      const key = `${normV}|${normC}`;

      let venue = stateVenues.get(key);
      if (!venue) {
        const stateCode = normalizeStateCode(s.canonicalState);
        const venueId = `CANON-${stateCode}-${String(stateVenueIndex++).padStart(3, "0")}`;
        venue = {
          canonicalVenueId: venueId,
          state: s.canonicalState,
          stateCode,
          city: row.city,
          canonicalVenueName: row.venue,
          normalizedVenue: normV,
          zone: row.zone || s.zone,
          aliases: [],
          baselineSessionIds: [],
          baselineCourseCount: 0,
          baselineReportedTrained: 0,
          coordinators: [],
          champions: [],
          distinctiveTokens: extractDistinctiveTokens(normV),
        };
        stateVenues.set(key, venue);
        registry.push(venue);
        venueMap.set(venueId, venue);
      }

      // Append session details
      venue.baselineSessionIds.push(row.serialNumber);
      venue.baselineCourseCount += 1;
      venue.baselineReportedTrained += row.participantsTrained;
      if (!venue.aliases.includes(row.venue)) {
        venue.aliases.push(row.venue);
      }
      if (row.coordinator && !venue.coordinators.includes(row.coordinator)) {
        venue.coordinators.push(row.coordinator);
      }
      (row.champions || []).forEach((ch) => {
        if (ch && !venue.champions.includes(ch)) {
          venue.champions.push(ch);
        }
      });
    }
  }

  cachedFrozenRegistry = registry;
  cachedVenueMap = venueMap;
  return registry;
}

/**
 * Returns a canonical venue by ID.
 */
export function getCanonicalVenueById(venueId: string): CanonicalPhysicalVenue | undefined {
  if (!cachedVenueMap) {
    getFrozenBaselineVenueRegistry();
  }
  return cachedVenueMap?.get(venueId);
}

/**
 * Returns all canonical physical venues belonging to a specific state.
 */
export function getCanonicalVenuesByState(stateQuery: string): CanonicalPhysicalVenue[] {
  const normState = normalizeDisplayState(stateQuery).toLowerCase();
  const registry = getFrozenBaselineVenueRegistry();
  return registry.filter((v) => normalizeDisplayState(v.state).toLowerCase() === normState);
}
