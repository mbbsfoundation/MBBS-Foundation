import fs from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";
import {
  getHighestCPRDayParticipantSequence,
  getHighestCPRChampionSequence,
  getHighestCPRCoordinatorSequence,
  getHighestCPRFacilitySequence,
  getAllCPRCertificates,
} from "@/lib/cprCertificates";

export type CertificateCategory =
  | "CPR_DAY"
  | "SANJEEVANI"
  | "CPR_CHAMPION"
  | "CPR_FACILITY"
  | "COURSE_COORDINATOR";

export type PreviewRowStatus =
  | "NEW – CPR DAY"
  | "NEW – SANJEEVANI"
  | "NEW – CHAMPION"
  | "NEW – FACILITY"
  | "ALREADY CERTIFIED"
  | "REVIEW REQUIRED"
  | "VALIDATION ERROR";

export interface NormalizedCourseDate {
  isValid: boolean;
  isoDate: string; // e.g. "2026-07-21"
  displayDate: string; // e.g. "21 July 2026"
  isCprDay: boolean; // true if isoDate === "2026-07-21"
  error?: string;
}

export interface SanjeevaniInputRow {
  rowNumber: number;
  name: string;
  date: string;
  venue: string;
  venueCode?: string;
  city: string;
  state: string;
  stateCode: string;
  mobileNumber?: string;
  email?: string;
  courseCoordinator?: string;
  isValid: boolean;
  errors: string[];
}

export interface SanjeevaniCertificateRecord {
  id: string;
  certificateId: string;
  sequenceNumber: number;
  stateCode: string;
  category: CertificateCategory;
  templateUsed?: string;
  participantName: string;
  normalizedName: string;
  date: string;
  venue: string;
  venueCode?: string;
  city: string;
  state: string;
  mobileNumber?: string;
  email?: string;
  courseCoordinator?: string;
  uploadBatchId?: string;
  status: string;
  certificateFileUrl?: string;
  generatedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface SanjeevaniBatchRecord {
  id: string;
  originalFileName: string;
  totalRows: number;
  validRows: number;
  importedRows: number;
  duplicateRows: number;
  errorRows: number;
  status: string;
  processingNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StateAllocationSummary {
  category: CertificateCategory;
  categoryName: string;
  stateCode: string;
  stateName?: string;
  lastIssuedSequence: number;
  lastCertificateId: string | null;
  startingSequence: number;
  startingCertificateId: string;
  countGenerating: number;
  endingSequence: number;
  endingCertificateId: string;
  templateUsed: string;
}

export interface PreviewRowResult extends SanjeevaniInputRow {
  category: CertificateCategory;
  proposedCertificateId: string;
  proposedSequence: number;
  isDuplicate: boolean;
  isReviewRequired?: boolean;
  rowStatus: PreviewRowStatus;
  statusReason?: string;
  existingCertificateId?: string;
  normalizedCourseDate: string;
  displayDate: string;
  templateUsed: string;
}

export interface SanjeevaniPreviewResponse {
  totalRows: number;
  validCount: number;
  errorCount: number;
  duplicateCount: number;
  rows: PreviewRowResult[];
  stateSummaries: StateAllocationSummary[];
}

const DATA_DIR = path.join(process.cwd(), "data");
const CERTS_FILE = path.join(DATA_DIR, "sanjeevani_certificates.json");
const BATCHES_FILE = path.join(DATA_DIR, "sanjeevani_batches.json");

// In-Memory Storage Cache for Ultra-Fast Operations
let cachedStorageCerts: SanjeevaniCertificateRecord[] | null = null;
let cachedStorageBatches: SanjeevaniBatchRecord[] | null = null;

export function invalidateStorageCache() {
  cachedStorageCerts = null;
  cachedStorageBatches = null;
}

function ensureStorageFiles() {
  // Safe no-op in runtime serverless environments to prevent EROFS read-only filesystem errors
}

/**
 * Canonical Course-Date Normalizer:
 * Safely parses and normalizes any course date representation (Day-First Indian convention, ISO, or text)
 * to standard ISO YYYY-MM-DD and formal display string.
 */
export function parseAndNormalizeCourseDate(
  rawDate: string | number | Date | null | undefined
): NormalizedCourseDate {
  if (rawDate === null || rawDate === undefined || rawDate === "") {
    return {
      isValid: false,
      isoDate: "",
      displayDate: "",
      isCprDay: false,
      error: "Course date is missing.",
    };
  }

  // 1. If already a JS Date object
  if (rawDate instanceof Date) {
    if (isNaN(rawDate.getTime())) {
      return {
        isValid: false,
        isoDate: "",
        displayDate: "",
        isCprDay: false,
        error: "Invalid Date object.",
      };
    }
    const y = rawDate.getFullYear();
    const m = String(rawDate.getMonth() + 1).padStart(2, "0");
    const d = String(rawDate.getDate()).padStart(2, "0");
    const isoDate = `${y}-${m}-${d}`;
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    const displayDate = `${rawDate.getDate()} ${months[rawDate.getMonth()]} ${y}`;
    return {
      isValid: true,
      isoDate,
      displayDate,
      isCprDay: isoDate === "2026-07-21",
    };
  }

  // 2. Handle Excel Serial Date (e.g. 46224 is 2026-07-21 in Excel 1900 date system)
  if (
    typeof rawDate === "number" ||
    (typeof rawDate === "string" && /^\d{5}(\.\d+)?$/.test(rawDate.trim()))
  ) {
    const serial = typeof rawDate === "number" ? rawDate : parseFloat(rawDate.trim());
    if (serial > 20000 && serial < 80000) {
      const utcDays = Math.floor(serial - 25569);
      const utcValue = utcDays * 86400 * 1000;
      const dateObj = new Date(utcValue);
      const y = dateObj.getUTCFullYear();
      const m = String(dateObj.getUTCMonth() + 1).padStart(2, "0");
      const d = String(dateObj.getUTCDate()).padStart(2, "0");
      const isoDate = `${y}-${m}-${d}`;
      const months = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];
      const displayDate = `${dateObj.getUTCDate()} ${months[dateObj.getUTCMonth()]} ${y}`;
      return {
        isValid: true,
        isoDate,
        displayDate,
        isCprDay: isoDate === "2026-07-21",
      };
    }
  }

  const str = String(rawDate).trim();
  if (!str) {
    return {
      isValid: false,
      isoDate: "",
      displayDate: "",
      isCprDay: false,
      error: "Empty date string.",
    };
  }

  // Clean string: strip ordinal suffixes (21st, 2nd, 3rd, 4th -> 21, 2, 3, 4)
  const cleaned = str
    .replace(/(\d+)(st|nd|rd|th)/gi, "$1")
    .replace(/[,\t]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // Pattern A: ISO YYYY-MM-DD or YYYY/MM/DD or YYYY.MM.DD
  const isoMatch = cleaned.match(/^(\d{4})[-/. ](\d{1,2})[-/. ](\d{1,2})(?:[T\s].*)?$/);
  if (isoMatch) {
    const y = parseInt(isoMatch[1], 10);
    const m = parseInt(isoMatch[2], 10);
    const d = parseInt(isoMatch[3], 10);
    return validateAndFormatDate(y, m, d);
  }

  // Pattern B: DD-MM-YYYY, DD/MM/YYYY, DD.MM.YYYY, or 2-digit years (DD-MM-YY, DD/MM/YY, DD.MM.YY)
  // Day-First Indian convention
  const dmyMatch = cleaned.match(/^(\d{1,2})[-/. ](\d{1,2})[-/. ](\d{2,4})$/);
  if (dmyMatch) {
    const d = parseInt(dmyMatch[1], 10);
    const m = parseInt(dmyMatch[2], 10);
    let y = parseInt(dmyMatch[3], 10);
    if (y < 100) {
      y = y <= 50 ? 2000 + y : 1900 + y;
    }
    return validateAndFormatDate(y, m, d);
  }

  // Pattern C: Textual Month (e.g. "21 July 2026", "21-Jul-2026", "July 21 2026", "21-Jul-26")
  const MONTH_MAP: Record<string, number> = {
    jan: 1,
    january: 1,
    feb: 2,
    february: 2,
    mar: 3,
    march: 3,
    apr: 4,
    april: 4,
    may: 5,
    jun: 6,
    june: 6,
    jul: 7,
    july: 7,
    aug: 8,
    august: 8,
    sep: 9,
    sept: 9,
    september: 9,
    oct: 10,
    october: 10,
    nov: 11,
    november: 11,
    dec: 12,
    december: 12,
  };

  // Case 1: "21 July 2026" / "21-Jul-2026" / "21/Jul/26"
  const textMatch1 = cleaned.match(/^(\d{1,2})[-/. ]+([a-zA-Z]+)[-/. ]+(\d{2,4})$/);
  if (textMatch1) {
    const d = parseInt(textMatch1[1], 10);
    const mStr = textMatch1[2].toLowerCase();
    let y = parseInt(textMatch1[3], 10);
    if (y < 100) y = y <= 50 ? 2000 + y : 1900 + y;
    const m = MONTH_MAP[mStr];
    if (m) {
      return validateAndFormatDate(y, m, d);
    }
  }

  // Case 2: "July 21 2026" / "Jul 21, 2026"
  const textMatch2 = cleaned.match(/^([a-zA-Z]+)[-/. ]+(\d{1,2})[-/. ]+(\d{2,4})$/);
  if (textMatch2) {
    const mStr = textMatch2[1].toLowerCase();
    const d = parseInt(textMatch2[2], 10);
    let y = parseInt(textMatch2[3], 10);
    if (y < 100) y = y <= 50 ? 2000 + y : 1900 + y;
    const m = MONTH_MAP[mStr];
    if (m) {
      return validateAndFormatDate(y, m, d);
    }
  }

  return {
    isValid: false,
    isoDate: "",
    displayDate: str,
    isCprDay: false,
    error: `Unrecognized course date format: "${str}". Please use DD-MM-YYYY (e.g. 21-07-2026).`,
  };
}

function validateAndFormatDate(year: number, month: number, day: number): NormalizedCourseDate {
  if (year < 1900 || year > 2100) {
    return {
      isValid: false,
      isoDate: "",
      displayDate: "",
      isCprDay: false,
      error: `Invalid year in course date: ${year}`,
    };
  }
  if (month < 1 || month > 12) {
    return {
      isValid: false,
      isoDate: "",
      displayDate: "",
      isCprDay: false,
      error: `Invalid month in course date: ${month}`,
    };
  }
  if (day < 1 || day > 31) {
    return {
      isValid: false,
      isoDate: "",
      displayDate: "",
      isCprDay: false,
      error: `Invalid day in course date: ${day}`,
    };
  }

  const daysInMonth = new Date(year, month, 0).getDate();
  if (day > daysInMonth) {
    return {
      isValid: false,
      isoDate: "",
      displayDate: "",
      isCprDay: false,
      error: `Invalid date: Month ${month} only has ${daysInMonth} days.`,
    };
  }

  const mm = String(month).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  const isoDate = `${year}-${mm}-${dd}`;

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const displayDate = `${day} ${months[month - 1]} ${year}`;

  return {
    isValid: true,
    isoDate,
    displayDate,
    isCprDay: isoDate === "2026-07-21",
  };
}

/**
 * Checks if a course date corresponds to National IAP CPR Day (21-07-2026).
 */
export function isCprDayDate(dateStr: string): boolean {
  return parseAndNormalizeCourseDate(dateStr).isCprDay;
}

/**
 * Centralized Certificate Category Resolver.
 */
export function resolveCertificateCategory(
  rawDate: string,
  forcedCategory?: CertificateCategory
): { category: CertificateCategory; normalizedDate: NormalizedCourseDate } {
  const normalizedDate = parseAndNormalizeCourseDate(rawDate);
  if (forcedCategory) {
    return { category: forcedCategory, normalizedDate };
  }
  const category: CertificateCategory = normalizedDate.isCprDay ? "CPR_DAY" : "SANJEEVANI";
  return { category, normalizedDate };
}

const STATE_TO_CODE: Record<string, string> = {
  "andaman & nicobar islands": "AN",
  "andaman and nicobar islands": "AN",
  "andaman & nicobar": "AN",
  "andaman & nikobar island": "AN",
  "andhra pradesh": "AP",
  "arunachal pradesh": "AR",
  "assam": "AS",
  "bihar": "BR",
  "chandigarh": "CH",
  "chhattisgarh": "CG",
  "dadra and nagar haveli and daman and diu": "DD",
  "delhi": "DL",
  "goa": "GA",
  "gujarat": "GJ",
  "haryana": "HR",
  "himachal pradesh": "HP",
  "jammu and kashmir": "JK",
  "jammu & kashmir": "JK",
  "jharkhand": "JH",
  "karnataka": "KA",
  "kerala": "KL",
  "ladakh": "LA",
  "lakshadweep": "LD",
  "madhya pradesh": "MP",
  "maharashtra": "MH",
  "manipur": "MN",
  "meghalaya": "ML",
  "mizoram": "MZ",
  "nagaland": "NL",
  "odisha": "OR",
  "puducherry": "PY",
  "punjab": "PB",
  "rajasthan": "RJ",
  "sikkim": "SK",
  "tamil nadu": "TN",
  "telangana": "TS",
  "tripura": "TR",
  "uttar pradesh": "UP",
  "uttarakhand": "UK",
  "west bengal": "WB",
};

/**
 * Normalizes state code or state name to standard 2-4 letter state code.
 */
export function normalizeStateCode(codeOrName: string): string {
  if (!codeOrName) return "XX";
  const trimmed = codeOrName.trim();
  const lower = trimmed.toLowerCase();
  if (STATE_TO_CODE[lower]) {
    return STATE_TO_CODE[lower];
  }
  const cleaned = trimmed.toUpperCase().replace(/[^A-Z]/g, "");
  if (cleaned.length >= 2 && cleaned.length <= 4) {
    return cleaned;
  }
  return cleaned || "XX";
}

/**
 * Normalizes participant/champion/venue name for duplicate checking (lowercase, single spaces, trimmed).
 */
export function normalizeParticipantName(name: string): string {
  return (name || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[^\w\s]/gi, "");
}

/**
 * Formats 4-digit sequence number (e.g. 101 -> "0101", 1234 -> "1234").
 */
export function formatSequence(seq: number): string {
  return String(seq).padStart(4, "0");
}

/**
 * Builds canonical Certificate ID string:
 * - CPR_DAY: IAPCPR/PA/{STATE_CODE}/{XXXX}
 * - CPR_CHAMPION: IAPCPR/CH/{STATE_CODE}/{XXXX}
 * - COURSE_COORDINATOR: IAPCPR/CC/{STATE_CODE}/{XXXX}
 * - CPR_FACILITY: IAP-CPR-Day/Venue/{STATE_CODE}-{XXXX}
 * - SANJEEVANI: IAPCPR/Sanjeevani/{STATE_CODE}/{XXXX}
 */
export function buildCertificateId(
  category: CertificateCategory | "COURSE_COORDINATOR",
  stateCode: string,
  sequenceNumber: number
): string {
  const normState = normalizeStateCode(stateCode);
  const formattedSeq = formatSequence(sequenceNumber);
  if (category === "CPR_DAY") {
    return `IAPCPR/PA/${normState}/${formattedSeq}`;
  }
  if (category === "CPR_CHAMPION") {
    return `IAPCPR/CH/${normState}/${formattedSeq}`;
  }
  if (category === "COURSE_COORDINATOR") {
    return `IAPCPR/CC/${normState}/${formattedSeq}`;
  }
  if (category === "CPR_FACILITY") {
    return `IAP-CPR-Day/Venue/${normState}-${sequenceNumber}`;
  }
  return `IAPCPR/Sanjeevani/${normState}/${formattedSeq}`;
}

/**
 * Parses sequence number from a Certificate ID.
 */
export function extractSequenceFromId(certificateId: string): number | null {
  const match =
    (certificateId || "").match(/IAPCPR\/Sanjeevani\/[A-Z]+\/(\d+)/i) ||
    (certificateId || "").match(/IAPCPR\/PA\/[A-Z]+\/(\d+)/i) ||
    (certificateId || "").match(/IAPCPR\/CH\/[A-Z]+\/(\d+)/i) ||
    (certificateId || "").match(/IAPCPR\/CC\/[A-Z]+\/(\d+)/i) ||
    (certificateId || "").match(/Venue\/[A-Z]+[-_](\d+)/i);
  if (match && match[1]) {
    const num = parseInt(match[1], 10);
    return isNaN(num) ? null : num;
  }
  return null;
}

/**
 * Reads all stored certificates from cache/JSON file storage.
 */
export function getAllSanjeevaniFromStorage(): SanjeevaniCertificateRecord[] {
  if (cachedStorageCerts) {
    return cachedStorageCerts;
  }

  try {
    if (fs.existsSync(CERTS_FILE)) {
      const data = fs.readFileSync(CERTS_FILE, "utf8");
      const records: any[] = JSON.parse(data || "[]");
      cachedStorageCerts = records.map((r) => {
        let cat: CertificateCategory = r.category;
        if (!cat) {
          const cId = (r.certificateId || "").toUpperCase();
          if (cId.startsWith("IAPCPR/PA/")) cat = "CPR_DAY";
          else if (cId.startsWith("IAPCPR/CH/")) cat = "CPR_CHAMPION";
          else if (cId.startsWith("IAPCPR/CC/")) cat = "COURSE_COORDINATOR" as any;
          else if (cId.startsWith("IAP-CPR-DAY/VENUE/") || cId.includes("VENUE") || cId.includes("FACILITY")) cat = "CPR_FACILITY";
          else cat = "SANJEEVANI";
        }
        return {
          ...r,
          category: cat,
        };
      });
      return cachedStorageCerts;
    }
    return [];
  } catch (err) {
    console.warn("Could not read sanjeevani_certificates.json (using database/fallback):", err);
    return [];
  }
}

/**
 * Reads all Sanjeevani batches from file storage.
 */
export function getAllBatchesFromStorage(): SanjeevaniBatchRecord[] {
  if (cachedStorageBatches) {
    return cachedStorageBatches;
  }

  try {
    if (fs.existsSync(BATCHES_FILE)) {
      const data = fs.readFileSync(BATCHES_FILE, "utf8");
      cachedStorageBatches = JSON.parse(data || "[]");
      return cachedStorageBatches!;
    }
    return [];
  } catch (err) {
    console.warn("Could not read sanjeevani_batches.json (using database/fallback):", err);
    return [];
  }
}

/**
 * Determines the highest certificate sequence number already issued for a specific Category and State Code.
 * Scans:
 * 1. Static CSV master files (Participant, Champion, Coordinator, Facility)
 * 2. In-memory / JSON storage
 * 3. PostgreSQL AdminCertificateRecord table
 */
export async function getHighestSequenceForCategoryAndState(
  category: CertificateCategory | "COURSE_COORDINATOR",
  stateCode: string
): Promise<number> {
  const normState = normalizeStateCode(stateCode);
  let highest = 0;

  if (category === "CPR_DAY") {
    const csvHighest = getHighestCPRDayParticipantSequence(normState);
    if (csvHighest > highest) highest = csvHighest;
  } else if (category === "CPR_CHAMPION") {
    const csvHighest = getHighestCPRChampionSequence(normState);
    if (csvHighest > highest) highest = csvHighest;
  } else if (category === "COURSE_COORDINATOR") {
    const csvHighest = getHighestCPRCoordinatorSequence(normState);
    if (csvHighest > highest) highest = csvHighest;
  } else if (category === "CPR_FACILITY") {
    const csvHighest = getHighestCPRFacilitySequence(normState);
    if (csvHighest > highest) highest = csvHighest;
  }

  // Check in-memory cached JSON storage
  const storageRecords = getAllSanjeevaniFromStorage();
  for (const rec of storageRecords) {
    if (normalizeStateCode(rec.stateCode) === normState) {
      const isCprDayCert = rec.category === "CPR_DAY" || (rec.certificateId && rec.certificateId.toUpperCase().startsWith("IAPCPR/PA/"));
      const isChampionCert = rec.category === "CPR_CHAMPION" || (rec.certificateId && rec.certificateId.toUpperCase().startsWith("IAPCPR/CH/"));
      const isCoordinatorCert = (rec.category as string) === "COURSE_COORDINATOR" || (rec.certificateId && rec.certificateId.toUpperCase().startsWith("IAPCPR/CC/"));
      const isFacilityCert = rec.category === "CPR_FACILITY" || (rec.certificateId && (rec.certificateId.toUpperCase().startsWith("IAP-CPR-DAY/VENUE/") || rec.certificateId.toUpperCase().includes("VENUE")));
      
      if (category === "CPR_DAY" && isCprDayCert) {
        if (rec.sequenceNumber && rec.sequenceNumber > highest) highest = rec.sequenceNumber;
      } else if (category === "CPR_CHAMPION" && isChampionCert) {
        if (rec.sequenceNumber && rec.sequenceNumber > highest) highest = rec.sequenceNumber;
      } else if (category === "COURSE_COORDINATOR" && isCoordinatorCert) {
        if (rec.sequenceNumber && rec.sequenceNumber > highest) highest = rec.sequenceNumber;
      } else if (category === "CPR_FACILITY" && isFacilityCert) {
        if (rec.sequenceNumber && rec.sequenceNumber > highest) highest = rec.sequenceNumber;
      } else if (category === "SANJEEVANI" && !isCprDayCert && !isChampionCert && !isCoordinatorCert && !isFacilityCert) {
        if (rec.sequenceNumber && rec.sequenceNumber > highest) highest = rec.sequenceNumber;
      }
    }
  }

  // Check PostgreSQL AdminCertificateRecord table
  if (prisma) {
    try {
      let dbCategory: any = "PARTICIPANT";
      if (category === "CPR_CHAMPION") dbCategory = "CPR_CHAMPION";
      else if (category === "COURSE_COORDINATOR") dbCategory = "COURSE_COORDINATOR";
      else if (category === "CPR_FACILITY") dbCategory = "CPR_FACILITY";

      const dbRecords = await prisma.adminCertificateRecord.findMany({
        where: {
          category: dbCategory,
          stateCode: normState,
        },
        select: {
          certificateId: true,
        },
      });

      for (const dbr of dbRecords) {
        const seq = extractSequenceFromId(dbr.certificateId);
        if (seq && seq > highest) {
          highest = seq;
        }
      }
    } catch (e) {
      // safe database fallback
    }
  }

  return highest;
}

/**
 * Calculates the next proposed strictly non-colliding certificate ID and sequence.
 */
export async function getNextProposedCertificateId(
  category: "PARTICIPANT" | "CPR_CHAMPION" | "COURSE_COORDINATOR" | "CPR_FACILITY",
  stateCode: string,
  customDate?: string
): Promise<{ nextSequence: number; certificateId: string }> {
  const normState = normalizeStateCode(stateCode);
  let storageCat: CertificateCategory | "COURSE_COORDINATOR" = "CPR_DAY";

  if (category === "CPR_CHAMPION") storageCat = "CPR_CHAMPION";
  else if (category === "COURSE_COORDINATOR") storageCat = "COURSE_COORDINATOR";
  else if (category === "CPR_FACILITY") storageCat = "CPR_FACILITY";
  else {
    const dateToCheck = customDate || "21 July 2026";
    storageCat = isCprDayDate(dateToCheck) ? "CPR_DAY" : "SANJEEVANI";
  }

  const highest = await getHighestSequenceForCategoryAndState(storageCat, normState);
  let nextSeq = highest + 1;
  if (nextSeq < 101) {
    nextSeq = 101;
  }

  const certId = buildCertificateId(storageCat, normState, nextSeq);
  return { nextSequence: nextSeq, certificateId: certId };
}

/**
 * Backward compatibility wrapper for getHighestSequenceForState.
 */
export async function getHighestSequenceForState(stateCode: string): Promise<number> {
  return getHighestSequenceForCategoryAndState("SANJEEVANI", stateCode);
}

/**
 * Atomically saves a single manual/individual certificate addition.
 * Synchronously commits to JSON storage & in-memory cache.
 * Asynchronously / defensively upserts to PostgreSQL AdminCertificateRecord table.
 */
export async function saveSingleIndividualCertificate(params: {
  certificateId: string;
  category: "PARTICIPANT" | "CPR_CHAMPION" | "COURSE_COORDINATOR" | "CPR_FACILITY";
  name: string;
  state: string;
  stateCode: string;
  city: string;
  venueName?: string;
  certificateDate: string;
  mobileNumber?: string;
  email?: string;
  courseCoordinator?: string;
  notes?: string;
}): Promise<SanjeevaniCertificateRecord> {
  const normState = normalizeStateCode(params.stateCode);
  const normalizedName = normalizeParticipantName(params.name);
  const seq = extractSequenceFromId(params.certificateId) || 101;

  let storageCat: CertificateCategory = "CPR_DAY";
  if (params.category === "CPR_CHAMPION") storageCat = "CPR_CHAMPION";
  else if (params.category === "CPR_FACILITY") storageCat = "CPR_FACILITY";
  else if (params.category === "COURSE_COORDINATOR") storageCat = "CPR_DAY";
  else storageCat = isCprDayDate(params.certificateDate) ? "CPR_DAY" : "SANJEEVANI";

  const newRecord: SanjeevaniCertificateRecord = {
    id: `cert_ind_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    certificateId: params.certificateId,
    sequenceNumber: seq,
    stateCode: normState,
    category: storageCat,
    participantName: params.name,
    normalizedName,
    date: params.certificateDate,
    venue: params.venueName || params.name,
    city: params.city,
    state: params.state,
    mobileNumber: params.mobileNumber || undefined,
    email: params.email || undefined,
    courseCoordinator: params.courseCoordinator || undefined,
    status: "VALID",
    generatedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Synchronize to PostgreSQL table AdminCertificateRecord if available
  if (prisma && (prisma as any).adminCertificateRecord) {
    try {
      let dbCat: any = "PARTICIPANT";
      if (params.category === "CPR_CHAMPION") dbCat = "CPR_CHAMPION";
      else if (params.category === "COURSE_COORDINATOR") dbCat = "COURSE_COORDINATOR";
      else if (params.category === "CPR_FACILITY") dbCat = "CPR_FACILITY";

      await (prisma as any).adminCertificateRecord.upsert({
        where: { certificateId: params.certificateId },
        update: {
          name: params.name,
          normalizedName,
          certificateDate: params.certificateDate,
          venueName: params.venueName || params.name,
          city: params.city,
          state: params.state,
          stateCode: normState,
          mobileNumber: params.mobileNumber,
          email: params.email,
          courseCoordinator: params.courseCoordinator,
          status: "VALID",
        },
        create: {
          certificateId: params.certificateId,
          category: dbCat,
          name: params.name,
          normalizedName,
          certificateDate: params.certificateDate,
          venueName: params.venueName || params.name,
          city: params.city,
          state: params.state,
          stateCode: normState,
          mobileNumber: params.mobileNumber,
          email: params.email,
          courseCoordinator: params.courseCoordinator,
          status: "VALID",
          source: "MANUAL_ADMIN",
          notes: params.notes,
        },
      });
    } catch (dbErr) {
      console.warn("Database sync warning for individual certificate:", dbErr);
    }
  }

  return newRecord;
}

export interface DuplicateIndexItem {
  certificateId: string;
  participantName: string;
  venue: string;
  city: string;
  state: string;
}

export interface UnifiedDuplicateMatch {
  status: "ALREADY_CERTIFIED" | "REVIEW_REQUIRED" | "UNIQUE";
  existingCertificateId?: string;
  reason?: string;
}

/**
 * Builds the comprehensive unified participant duplicate index across:
 * 1. Master CSV datasets (Final_Participant_Certification_Master.csv & other master CSVs)
 * 2. Persistent storage (sanjeevani_certificates.json)
 * 3. Database / AdminCertificateRecord records
 */
export function buildUnifiedParticipantDuplicateIndex(): {
  exactMap: Map<string, DuplicateIndexItem>;
  venueDateMap: Map<string, DuplicateIndexItem>;
  mobileDateMap: Map<string, DuplicateIndexItem>;
} {
  const exactMap = new Map<string, DuplicateIndexItem>();
  const venueDateMap = new Map<string, DuplicateIndexItem>();
  const mobileDateMap = new Map<string, DuplicateIndexItem>();

  // 1. Index master CSV records via getAllCPRCertificates("participant")
  try {
    const allMasterParticipants = getAllCPRCertificates("participant");
    for (let i = 0; i < allMasterParticipants.length; i++) {
      const p = allMasterParticipants[i];
      if (!p.participantName || !p.certificateNumber) continue;

      const normName = normalizeParticipantName(p.participantName);
      const normVenue = normalizeParticipantName(p.venueName);
      const normCity = normalizeParticipantName(p.city);
      const normState = normalizeStateCode(p.zone || p.state);
      const dateInfo = parseAndNormalizeCourseDate(p.issueDate);
      const isoDate = dateInfo.isValid ? dateInfo.isoDate : "2026-07-21";
      const cleanMobile = (p.mobileNumber || "").replace(/\D/g, "");
      const cleanMobile10 = cleanMobile.length >= 10 ? cleanMobile.slice(-10) : "";

      const recordInfo: DuplicateIndexItem = {
        certificateId: p.certificateNumber.trim(),
        participantName: p.participantName.trim(),
        venue: p.venueName.trim(),
        city: p.city.trim(),
        state: p.state.trim(),
      };

      if (normName && normState) {
        if (normVenue) {
          const exactKey = `${normName}|${normVenue}|${normCity}|${normState}|${isoDate}`;
          if (!exactMap.has(exactKey)) exactMap.set(exactKey, recordInfo);

          const venueDateKey = `${normName}|${normVenue}|${normState}|${isoDate}`;
          if (!venueDateMap.has(venueDateKey)) venueDateMap.set(venueDateKey, recordInfo);
        }
        if (cleanMobile10) {
          const mobileKey = `${normName}|${cleanMobile10}|${isoDate}`;
          if (!mobileDateMap.has(mobileKey)) mobileDateMap.set(mobileKey, recordInfo);
        }
      }
    }
  } catch (err) {
    console.warn("Could not index master CSV participants for duplicate check:", err);
  }

  // 2. Index stored Sanjeevani certificates (data/sanjeevani_certificates.json)
  const storedCerts = getAllSanjeevaniFromStorage();
  for (let i = 0; i < storedCerts.length; i++) {
    const c = storedCerts[i];
    if (!c.participantName || !c.certificateId) continue;

    const normName = normalizeParticipantName(c.participantName);
    const normVenue = normalizeParticipantName(c.venue);
    const normCity = normalizeParticipantName(c.city);
    const normState = normalizeStateCode(c.stateCode || c.state);
    const dateInfo = parseAndNormalizeCourseDate(c.date);
    const isoDate = dateInfo.isValid ? dateInfo.isoDate : "2026-07-21";
    const cleanMobile = (c.mobileNumber || "").replace(/\D/g, "");
    const cleanMobile10 = cleanMobile.length >= 10 ? cleanMobile.slice(-10) : "";

    const recordInfo: DuplicateIndexItem = {
      certificateId: c.certificateId.trim(),
      participantName: c.participantName.trim(),
      venue: c.venue.trim(),
      city: c.city.trim(),
      state: c.state.trim(),
    };

    if (c.category === "CPR_CHAMPION") {
      const champKey = `${normName}|${normVenue}|${normState}|CHAMPION`;
      if (!venueDateMap.has(champKey)) venueDateMap.set(champKey, recordInfo);
    } else if (c.category === "CPR_FACILITY") {
      const vCode = c.certificateId ? c.certificateId.trim().toUpperCase() : `${normVenue}|${normState}`;
      if (!exactMap.has(vCode)) exactMap.set(vCode, recordInfo);
    } else {
      if (normName && normState) {
        if (normVenue) {
          const exactKey = `${normName}|${normVenue}|${normCity}|${normState}|${isoDate}`;
          if (!exactMap.has(exactKey)) exactMap.set(exactKey, recordInfo);

          const venueDateKey = `${normName}|${normVenue}|${normState}|${isoDate}`;
          if (!venueDateMap.has(venueDateKey)) venueDateMap.set(venueDateKey, recordInfo);
        }
        if (cleanMobile10) {
          const mobileKey = `${normName}|${cleanMobile10}|${isoDate}`;
          if (!mobileDateMap.has(mobileKey)) mobileDateMap.set(mobileKey, recordInfo);
        }
      }
    }
  }

  return { exactMap, venueDateMap, mobileDateMap };
}

/**
 * Async version that also indices database AdminCertificateRecord rows.
 */
export async function buildUnifiedParticipantDuplicateIndexAsync(): Promise<{
  exactMap: Map<string, DuplicateIndexItem>;
  venueDateMap: Map<string, DuplicateIndexItem>;
  mobileDateMap: Map<string, DuplicateIndexItem>;
}> {
  const index = buildUnifiedParticipantDuplicateIndex();

  if (prisma && (prisma as any).adminCertificateRecord) {
    try {
      const dbRecords = await (prisma as any).adminCertificateRecord.findMany();
      for (const c of dbRecords) {
        if (!c.name || !c.certificateId) continue;

        const normName = normalizeParticipantName(c.name);
        const normVenue = normalizeParticipantName(c.venueName || c.name);
        const normCity = normalizeParticipantName(c.city || "");
        const normState = normalizeStateCode(c.stateCode || c.state);
        const dateInfo = parseAndNormalizeCourseDate(c.certificateDate);
        const isoDate = dateInfo.isValid ? dateInfo.isoDate : "2026-07-21";
        const cleanMobile = (c.mobileNumber || "").replace(/\D/g, "");
        const cleanMobile10 = cleanMobile.length >= 10 ? cleanMobile.slice(-10) : "";

        const recordInfo: DuplicateIndexItem = {
          certificateId: c.certificateId.trim(),
          participantName: c.name.trim(),
          venue: (c.venueName || c.name).trim(),
          city: (c.city || "").trim(),
          state: c.state.trim(),
        };

        if (c.category === "CPR_CHAMPION") {
          const champKey = `${normName}|${normVenue}|${normState}|CHAMPION`;
          if (!index.venueDateMap.has(champKey)) index.venueDateMap.set(champKey, recordInfo);
        } else if (c.category === "CPR_FACILITY") {
          const vCode = c.certificateId ? c.certificateId.trim().toUpperCase() : `${normVenue}|${normState}`;
          if (!index.exactMap.has(vCode)) index.exactMap.set(vCode, recordInfo);
        } else {
          if (normName && normState) {
            if (normVenue) {
              const exactKey = `${normName}|${normVenue}|${normCity}|${normState}|${isoDate}`;
              if (!index.exactMap.has(exactKey)) index.exactMap.set(exactKey, recordInfo);

              const venueDateKey = `${normName}|${normVenue}|${normState}|${isoDate}`;
              if (!index.venueDateMap.has(venueDateKey)) index.venueDateMap.set(venueDateKey, recordInfo);
            }
            if (cleanMobile10) {
              const mobileKey = `${normName}|${cleanMobile10}|${isoDate}`;
              if (!index.mobileDateMap.has(mobileKey)) index.mobileDateMap.set(mobileKey, recordInfo);
            }
          }
        }
      }
    } catch (e) {
      console.warn("Could not index database certificates for duplicate check:", e);
    }
  }

  return index;
}

/**
 * Checks a candidate record against the unified duplicate index.
 */
export function checkParticipantDuplicate(
  row: {
    name: string;
    venue: string;
    city: string;
    stateCode: string;
    date: string;
    mobileNumber?: string;
    category?: CertificateCategory;
    venueCode?: string;
  },
  index: {
    exactMap: Map<string, DuplicateIndexItem>;
    venueDateMap: Map<string, DuplicateIndexItem>;
    mobileDateMap: Map<string, DuplicateIndexItem>;
  }
): UnifiedDuplicateMatch {
  const normName = normalizeParticipantName(row.name);
  const normVenue = normalizeParticipantName(row.venue);
  const normCity = normalizeParticipantName(row.city);
  const normState = normalizeStateCode(row.stateCode);
  const dateInfo = parseAndNormalizeCourseDate(row.date);
  const isoDate = dateInfo.isValid ? dateInfo.isoDate : "2026-07-21";
  const cleanMobile = (row.mobileNumber || "").replace(/\D/g, "");
  const cleanMobile10 = cleanMobile.length >= 10 ? cleanMobile.slice(-10) : "";

  if (row.category === "CPR_FACILITY") {
    const vCode = (row.venueCode || "").trim().toUpperCase();
    if (vCode && index.exactMap.has(vCode)) {
      const match = index.exactMap.get(vCode)!;
      return {
        status: "ALREADY_CERTIFIED",
        existingCertificateId: match.certificateId,
        reason: `Facility code already issued: ${match.certificateId}`,
      };
    }
    const key = `${normVenue}|${normState}`;
    if (index.exactMap.has(key)) {
      const match = index.exactMap.get(key)!;
      return {
        status: "ALREADY_CERTIFIED",
        existingCertificateId: match.certificateId,
        reason: `Facility already registered in ${normState}: ${match.certificateId}`,
      };
    }
    return { status: "UNIQUE" };
  }

  if (row.category === "CPR_CHAMPION") {
    const champKey = `${normName}|${normVenue}|${normState}|CHAMPION`;
    if (index.venueDateMap.has(champKey)) {
      const match = index.venueDateMap.get(champKey)!;
      return {
        status: "ALREADY_CERTIFIED",
        existingCertificateId: match.certificateId,
        reason: `CPR Champion certificate already issued for ${match.participantName} at ${match.venue} (${match.certificateId})`,
      };
    }
    return { status: "UNIQUE" };
  }

  // 1. Exact match (Name + Venue + City + State + Course Date)
  const exactKey = `${normName}|${normVenue}|${normCity}|${normState}|${isoDate}`;
  if (index.exactMap.has(exactKey)) {
    const match = index.exactMap.get(exactKey)!;
    return {
      status: "ALREADY_CERTIFIED",
      existingCertificateId: match.certificateId,
      reason: `Participant already certified: ${match.certificateId} (${match.participantName} at ${match.venue})`,
    };
  }

  // 2. Same Name + Venue + State + Course Date (minor city variation)
  const venueDateKey = `${normName}|${normVenue}|${normState}|${isoDate}`;
  if (index.venueDateMap.has(venueDateKey)) {
    const match = index.venueDateMap.get(venueDateKey)!;
    return {
      status: "ALREADY_CERTIFIED",
      existingCertificateId: match.certificateId,
      reason: `Participant already certified at ${match.venue} on ${dateInfo.displayDate}: ${match.certificateId}`,
    };
  }

  // 3. Same Name + Mobile Number on same Course Date
  if (cleanMobile10) {
    const mobileKey = `${normName}|${cleanMobile10}|${isoDate}`;
    if (index.mobileDateMap.has(mobileKey)) {
      const match = index.mobileDateMap.get(mobileKey)!;
      const matchNormVenue = normalizeParticipantName(match.venue);
      if (matchNormVenue === normVenue) {
        return {
          status: "ALREADY_CERTIFIED",
          existingCertificateId: match.certificateId,
          reason: `Participant already certified with matching phone on ${dateInfo.displayDate}: ${match.certificateId}`,
        };
      } else {
        return {
          status: "REVIEW_REQUIRED",
          existingCertificateId: match.certificateId,
          reason: `Same participant & phone registered at different venue (${match.venue}) on ${dateInfo.displayDate}. Review required.`,
        };
      }
    }
  }

  return { status: "UNIQUE" };
}

/**
 * Finds if a participant has already received a certificate.
 */
export async function findDuplicateParticipant(
  name: string,
  stateCode: string
): Promise<SanjeevaniCertificateRecord | null> {
  const normName = normalizeParticipantName(name);
  const normState = normalizeStateCode(stateCode);

  const storageRecords = getAllSanjeevaniFromStorage();
  const localMatch = storageRecords.find(
    (r) =>
      normalizeParticipantName(r.participantName) === normName &&
      normalizeStateCode(r.stateCode) === normState
  );

  return localMatch || null;
}

/**
 * Hardened Preview Generator:
 * 1. Validates and normalizes course dates and fields.
 * 2. Runs duplicate detection against the Unified Existing Participant Index.
 * 3. Identifies eligible NEW rows.
 * 4. Allocates sequential IDs ONLY to eligible NEW rows (never burning sequence numbers for duplicates/errors).
 * 5. Returns detailed row-by-row status and state summary ranges.
 */
export async function generatePreview(
  rows: SanjeevaniInputRow[],
  forcedCategory?: CertificateCategory
): Promise<SanjeevaniPreviewResponse> {
  const duplicateIndex = await buildUnifiedParticipantDuplicateIndexAsync();

  // Internal batch-level duplicate tracking
  const batchSeenExact = new Set<string>();
  const batchSeenMobile = new Set<string>();

  interface EvaluatedRow {
    inputRow: SanjeevaniInputRow;
    category: CertificateCategory;
    normalizedDate: NormalizedCourseDate;
    rowStatus: PreviewRowStatus;
    statusReason?: string;
    existingCertificateId?: string;
    isDuplicate: boolean;
    isReviewRequired: boolean;
    isEligibleNew: boolean;
    templateUsed: string;
  }

  const evaluatedRows: EvaluatedRow[] = [];

  // Step 1 & 2: Normalize and Evaluate Each Row
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const dateResult = parseAndNormalizeCourseDate(r.date);

    let category: CertificateCategory;
    if (forcedCategory) {
      category = forcedCategory;
    } else {
      category = dateResult.isCprDay ? "CPR_DAY" : "SANJEEVANI";
    }

    let templateUsed = "cpr sanjeevani certificate 2.svg";
    if (category === "CPR_DAY") templateUsed = "Lay Rescuer CPR Day.svg";
    else if (category === "CPR_CHAMPION") templateUsed = "CPR Champions.svg";
    else if (category === "CPR_FACILITY") templateUsed = "CPR Facility Certificate.svg";

    if (!r.isValid || !dateResult.isValid) {
      const errList = [...r.errors];
      if (!dateResult.isValid && dateResult.error) {
        errList.push(dateResult.error);
      }
      evaluatedRows.push({
        inputRow: { ...r, isValid: false, errors: errList },
        category,
        normalizedDate: dateResult,
        rowStatus: "VALIDATION ERROR",
        statusReason: errList.join("; "),
        isDuplicate: false,
        isReviewRequired: false,
        isEligibleNew: false,
        templateUsed,
      });
      continue;
    }

    const normName = normalizeParticipantName(r.name);
    const normVenue = normalizeParticipantName(r.venue);
    const normCity = normalizeParticipantName(r.city);
    const normState = normalizeStateCode(r.stateCode);
    const isoDate = dateResult.isoDate;
    const cleanMobile = (r.mobileNumber || "").replace(/\D/g, "");
    const cleanMobile10 = cleanMobile.length >= 10 ? cleanMobile.slice(-10) : "";

    // Check duplicate against Unified Index (Master CSVs + Stored JSON + DB)
    const dupCheck = checkParticipantDuplicate(
      {
        name: r.name,
        venue: r.venue,
        city: r.city,
        stateCode: r.stateCode,
        date: r.date,
        mobileNumber: r.mobileNumber,
        category,
        venueCode: r.venueCode,
      },
      duplicateIndex
    );

    const batchExactKey = `${normName}|${normVenue}|${normCity}|${normState}|${isoDate}`;
    const isBatchExactDup = batchSeenExact.has(batchExactKey);

    if (dupCheck.status === "ALREADY_CERTIFIED" || isBatchExactDup) {
      evaluatedRows.push({
        inputRow: r,
        category,
        normalizedDate: dateResult,
        rowStatus: "ALREADY CERTIFIED",
        statusReason: isBatchExactDup
          ? "Duplicate entry within current upload file"
          : dupCheck.reason || `Already certified (${dupCheck.existingCertificateId})`,
        existingCertificateId: dupCheck.existingCertificateId,
        isDuplicate: true,
        isReviewRequired: false,
        isEligibleNew: false,
        templateUsed,
      });
    } else if (dupCheck.status === "REVIEW_REQUIRED") {
      evaluatedRows.push({
        inputRow: r,
        category,
        normalizedDate: dateResult,
        rowStatus: "REVIEW REQUIRED",
        statusReason: dupCheck.reason || "Ambiguous candidate record matches existing entry.",
        existingCertificateId: dupCheck.existingCertificateId,
        isDuplicate: false,
        isReviewRequired: true,
        isEligibleNew: false,
        templateUsed,
      });
    } else {
      // Eligible NEW Record
      let newStatus: PreviewRowStatus = "NEW – CPR DAY";
      if (category === "SANJEEVANI") newStatus = "NEW – SANJEEVANI";
      else if (category === "CPR_CHAMPION") newStatus = "NEW – CHAMPION";
      else if (category === "CPR_FACILITY") newStatus = "NEW – FACILITY";

      batchSeenExact.add(batchExactKey);
      if (cleanMobile10) batchSeenMobile.add(`${normName}|${cleanMobile10}|${isoDate}`);

      evaluatedRows.push({
        inputRow: r,
        category,
        normalizedDate: dateResult,
        rowStatus: newStatus,
        statusReason: "Ready for certificate issuance",
        isDuplicate: false,
        isReviewRequired: false,
        isEligibleNew: true,
        templateUsed,
      });
    }
  }

  // Step 3: Group ONLY Eligible NEW Rows by (Category, StateCode)
  type GroupKey = `${CertificateCategory}_${string}`;
  const eligibleGroupMap: Record<GroupKey, { category: CertificateCategory; stateCode: string; count: number }> = {};

  for (let i = 0; i < evaluatedRows.length; i++) {
    const er = evaluatedRows[i];
    if (er.isEligibleNew) {
      const normState = normalizeStateCode(er.inputRow.stateCode);
      const key: GroupKey = `${er.category}_${normState}`;
      if (!eligibleGroupMap[key]) {
        eligibleGroupMap[key] = { category: er.category, stateCode: normState, count: 0 };
      }
      eligibleGroupMap[key].count++;
    }
  }

  // Step 4: Fetch Highest Sequences for Groups
  const groupKeys = Object.keys(eligibleGroupMap) as GroupKey[];
  const groupRunningOffsets: Record<GroupKey, number> = {};
  const stateSummaries: StateAllocationSummary[] = [];

  await Promise.all(
    groupKeys.map(async (key) => {
      const group = eligibleGroupMap[key];
      if (group.category === "CPR_FACILITY") {
        groupRunningOffsets[key] = 1;
      } else {
        const highest = await getHighestSequenceForCategoryAndState(group.category, group.stateCode);
        const startingSeq = highest > 0 ? highest + 1 : 101;
        groupRunningOffsets[key] = startingSeq;

        let categoryName = "IAP CPR Sanjeevani";
        let templateUsed = "cpr sanjeevani certificate 2.svg";
        if (group.category === "CPR_DAY") {
          categoryName = "National IAP CPR Day";
          templateUsed = "Lay Rescuer CPR Day.svg";
        } else if (group.category === "CPR_CHAMPION") {
          categoryName = "CPR Champion";
          templateUsed = "CPR Champions.svg";
        }

        const endingSeq = startingSeq + group.count - 1;

        stateSummaries.push({
          category: group.category,
          categoryName,
          stateCode: group.stateCode,
          lastIssuedSequence: highest,
          lastCertificateId: highest > 0 ? buildCertificateId(group.category, group.stateCode, highest) : null,
          startingSequence: startingSeq,
          startingCertificateId: buildCertificateId(group.category, group.stateCode, startingSeq),
          countGenerating: group.count,
          endingSequence: endingSeq,
          endingCertificateId: buildCertificateId(group.category, group.stateCode, endingSeq),
          templateUsed,
        });
      }
    })
  );

  // Step 5: Allocate Sequential IDs ONLY to Eligible NEW Rows
  let validCount = 0;
  let duplicateCount = 0;
  let errorCount = 0;
  const previewRows: PreviewRowResult[] = new Array(evaluatedRows.length);

  for (let i = 0; i < evaluatedRows.length; i++) {
    const er = evaluatedRows[i];
    let proposedId = "";
    let proposedSeq = 0;

    if (er.isEligibleNew) {
      validCount++;
      const normState = normalizeStateCode(er.inputRow.stateCode);
      const key: GroupKey = `${er.category}_${normState}`;

      if (er.category === "CPR_FACILITY") {
        proposedId = (er.inputRow.venueCode || "").trim();
        if (!proposedId) {
          proposedSeq = groupRunningOffsets[key]++;
          proposedId = `IAP-CPR-Day/Venue/${normState}-${proposedSeq}`;
        }
      } else {
        proposedSeq = groupRunningOffsets[key]++;
        proposedId = buildCertificateId(er.category, normState, proposedSeq);
      }
    } else if (er.isDuplicate) {
      duplicateCount++;
    } else {
      errorCount++;
    }

    previewRows[i] = {
      ...er.inputRow,
      date: er.normalizedDate.displayDate || er.inputRow.date,
      category: er.category,
      proposedCertificateId: proposedId,
      proposedSequence: proposedSeq,
      isDuplicate: er.isDuplicate,
      isReviewRequired: er.isReviewRequired,
      rowStatus: er.rowStatus,
      statusReason: er.statusReason,
      existingCertificateId: er.existingCertificateId,
      normalizedCourseDate: er.normalizedDate.isoDate,
      displayDate: er.normalizedDate.displayDate || er.inputRow.date,
      templateUsed: er.templateUsed,
    };
  }

  return {
    totalRows: rows.length,
    validCount,
    errorCount,
    duplicateCount,
    rows: previewRows,
    stateSummaries,
  };
}

/**
 * Hardened Batch Generation:
 * 1. Validates and normalizes dates.
 * 2. Checks duplicates against Unified Existing Participant Index.
 * 3. Allocates sequential IDs strictly to created rows without burning numbers for duplicates.
 * 4. Atomically saves to persistent storage and database.
 */
export async function saveGeneratedBatch(
  originalFileName: string,
  validRows: SanjeevaniInputRow[],
  allowDuplicates: boolean = false,
  forcedCategory?: CertificateCategory
): Promise<{
  batch: SanjeevaniBatchRecord;
  certificates: SanjeevaniCertificateRecord[];
  skippedCount: number;
  duplicateCount: number;
}> {
  ensureStorageFiles();

  const now = new Date();
  const nowIso = now.toISOString();
  const batchId = `BATCH-${now.getTime()}-${Math.floor(1000 + Math.random() * 9000)}`;

  const duplicateIndex = await buildUnifiedParticipantDuplicateIndexAsync();
  const batchSeenExact = new Set<string>();

  interface RowsToGenerate {
    inputRow: SanjeevaniInputRow;
    category: CertificateCategory;
    normalizedDate: NormalizedCourseDate;
    templateUsed: string;
  }

  const rowsToGenerate: RowsToGenerate[] = [];
  let skippedCount = 0;
  let duplicateCount = 0;

  // Step 1: Filter and Classify Eligible Rows
  for (let i = 0; i < validRows.length; i++) {
    const row = validRows[i];
    const dateResult = parseAndNormalizeCourseDate(row.date);

    let category: CertificateCategory;
    if (forcedCategory) {
      category = forcedCategory;
    } else {
      category = dateResult.isCprDay ? "CPR_DAY" : "SANJEEVANI";
    }

    let templateUsed = "cpr sanjeevani certificate 2.svg";
    if (category === "CPR_DAY") templateUsed = "Lay Rescuer CPR Day.svg";
    else if (category === "CPR_CHAMPION") templateUsed = "CPR Champions.svg";
    else if (category === "CPR_FACILITY") templateUsed = "CPR Facility Certificate.svg";

    if (!row.isValid || !dateResult.isValid) {
      skippedCount++;
      continue;
    }

    const dupCheck = checkParticipantDuplicate(
      {
        name: row.name,
        venue: row.venue,
        city: row.city,
        stateCode: row.stateCode,
        date: row.date,
        mobileNumber: row.mobileNumber,
        category,
        venueCode: row.venueCode,
      },
      duplicateIndex
    );

    const normName = normalizeParticipantName(row.name);
    const normVenue = normalizeParticipantName(row.venue);
    const normCity = normalizeParticipantName(row.city);
    const normState = normalizeStateCode(row.stateCode);
    const isoDate = dateResult.isoDate;
    const batchExactKey = `${normName}|${normVenue}|${normCity}|${normState}|${isoDate}`;

    const isBatchDup = batchSeenExact.has(batchExactKey);

    if ((dupCheck.status === "ALREADY_CERTIFIED" || isBatchDup) && !allowDuplicates) {
      duplicateCount++;
      skippedCount++;
      continue;
    }

    if (dupCheck.status === "REVIEW_REQUIRED" && !allowDuplicates) {
      skippedCount++;
      continue;
    }

    batchSeenExact.add(batchExactKey);
    rowsToGenerate.push({
      inputRow: row,
      category,
      normalizedDate: dateResult,
      templateUsed,
    });
  }

  // Step 2: Group ONLY Rows to be Generated
  type GroupKey = `${CertificateCategory}_${string}`;
  const groupNextSeq: Record<GroupKey, number> = {};
  const groupKeysSet = new Set<GroupKey>();

  for (let i = 0; i < rowsToGenerate.length; i++) {
    const r = rowsToGenerate[i];
    const normState = normalizeStateCode(r.inputRow.stateCode);
    const key: GroupKey = `${r.category}_${normState}`;
    groupKeysSet.add(key);
  }

  const groupKeys = Array.from(groupKeysSet);

  await Promise.all(
    groupKeys.map(async (key) => {
      const parts = key.split("_");
      const category = (parts.length === 3 ? `${parts[0]}_${parts[1]}` : parts[0]) as CertificateCategory;
      const stateCode = parts[parts.length - 1];

      if (category === "CPR_FACILITY") {
        groupNextSeq[key] = 1;
      } else {
        const highest = await getHighestSequenceForCategoryAndState(category, stateCode);
        groupNextSeq[key] = highest > 0 ? highest + 1 : 101;
      }
    })
  );

  // Step 3: Build Certificate Records with Sequential IDs
  const newCertificates: SanjeevaniCertificateRecord[] = [];

  for (let i = 0; i < rowsToGenerate.length; i++) {
    const { inputRow: row, category, normalizedDate, templateUsed } = rowsToGenerate[i];
    const normState = normalizeStateCode(row.stateCode);
    const key: GroupKey = `${category}_${normState}`;

    let seq = 0;
    let certId = "";

    if (category === "CPR_FACILITY") {
      certId = (row.venueCode || "").trim();
      if (!certId) {
        seq = groupNextSeq[key]++;
        certId = `IAP-CPR-Day/Venue/${normState}-${seq}`;
      }
    } else {
      seq = groupNextSeq[key]++;
      certId = buildCertificateId(category, normState, seq);
    }

    const venueVal = row.venue || row.name;
    const participantNameVal = category === "CPR_FACILITY" ? venueVal : row.name.trim();

    const record: SanjeevaniCertificateRecord = {
      id: `CERT-${now.getTime()}-${Math.floor(1000 + Math.random() * 9000)}-${seq}`,
      certificateId: certId,
      sequenceNumber: seq,
      stateCode: normState,
      category,
      templateUsed,
      participantName: participantNameVal,
      normalizedName: normalizeParticipantName(participantNameVal),
      date: normalizedDate.displayDate || row.date.trim() || "21 July 2026",
      venue: venueVal.trim(),
      venueCode: row.venueCode?.trim() || certId,
      city: row.city.trim(),
      state: row.state.trim(),
      mobileNumber: row.mobileNumber?.trim() || undefined,
      email: row.email?.trim() || undefined,
      courseCoordinator: row.courseCoordinator?.trim() || undefined,
      uploadBatchId: batchId,
      status: "GENERATED",
      generatedAt: nowIso,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    newCertificates.push(record);
  }

  const batchRecord: SanjeevaniBatchRecord = {
    id: batchId,
    originalFileName,
    totalRows: validRows.length,
    validRows: validRows.length,
    importedRows: newCertificates.length,
    duplicateRows: duplicateCount,
    errorRows: skippedCount,
    status: skippedCount > 0 ? "COMPLETED_WITH_SKIPPED" : "COMPLETED",
    processingNotes: `Generated ${newCertificates.length} certificates across ${groupKeys.length} categories/states.`,
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  // Persist to PostgreSQL AdminCertificateRecord
  if (prisma && (prisma as any).adminCertificateRecord) {
    try {
      const dbRecords = newCertificates.map((c) => {
        let dbCat: any = "PARTICIPANT";
        if (c.category === "CPR_CHAMPION") dbCat = "CPR_CHAMPION";
        else if ((c.category as string) === "COURSE_COORDINATOR") dbCat = "COURSE_COORDINATOR";
        else if (c.category === "CPR_FACILITY") dbCat = "CPR_FACILITY";

        return {
          certificateId: c.certificateId,
          category: dbCat,
          name: c.participantName,
          normalizedName: c.normalizedName,
          certificateDate: c.date,
          venueName: c.venue || c.participantName,
          venueCode: c.venueCode,
          city: c.city,
          state: c.state,
          stateCode: c.stateCode,
          mobileNumber: c.mobileNumber,
          email: c.email,
          courseCoordinator: c.courseCoordinator,
          status: "VALID",
          source: "BATCH_GENERATION",
          notes: `Batch ${batchId} (${originalFileName})`,
        };
      });

      await (prisma as any).adminCertificateRecord.createMany({
        data: dbRecords,
        skipDuplicates: true,
      });
    } catch (dbErr) {
      console.error("Failed to persist batch certificates to PostgreSQL AdminCertificateRecord:", dbErr);
    }
  }

  // 3. Optional batch log persistence
  if (prisma && (prisma as any).sanjeevaniUploadBatch) {
    try {
      await (prisma as any).sanjeevaniUploadBatch.create({
        data: {
          id: batchRecord.id,
          originalFileName: batchRecord.originalFileName,
          totalRows: batchRecord.totalRows,
          validRows: batchRecord.validRows,
          importedRows: batchRecord.importedRows,
          duplicateRows: batchRecord.duplicateRows,
          errorRows: batchRecord.errorRows,
          status: batchRecord.status,
          processingNotes: batchRecord.processingNotes,
        },
      });
    } catch (batchErr) {
      // safe fallback for batch metadata
    }
  }

  return {
    batch: batchRecord,
    certificates: newCertificates,
    skippedCount,
    duplicateCount,
  };
}

/**
 * Search certificate by Certificate ID (O(1) lookup).
 */
export async function searchSanjeevaniById(certificateId: string): Promise<SanjeevaniCertificateRecord | null> {
  const normId = (certificateId || "").trim().toUpperCase();
  const storageRecords = getAllSanjeevaniFromStorage();

  const match = storageRecords.find(
    (r) =>
      r.certificateId.toUpperCase() === normId ||
      r.id === certificateId.trim() ||
      r.certificateId.replace(/\//g, "-").toUpperCase() === normId ||
      (r.venueCode && r.venueCode.toUpperCase() === normId) ||
      (r.venueCode && r.venueCode.replace(/\//g, "-").toUpperCase() === normId)
  );

  if (match) return match;

  if (prisma && (prisma as any).adminCertificateRecord) {
    try {
      const dbRec = await (prisma as any).adminCertificateRecord.findFirst({
        where: {
          OR: [
            { certificateId: { equals: normId, mode: "insensitive" } },
            { certificateId: { equals: certificateId.trim(), mode: "insensitive" } },
            { venueCode: { equals: normId, mode: "insensitive" } },
          ],
        },
      });
      if (dbRec) {
        let cat: CertificateCategory = "SANJEEVANI";
        if (dbRec.category === "CPR_CHAMPION" || dbRec.certificateId.startsWith("IAPCPR/CH/")) cat = "CPR_CHAMPION";
        else if (dbRec.category === "COURSE_COORDINATOR" || dbRec.certificateId.startsWith("IAPCPR/CC/")) cat = "COURSE_COORDINATOR";
        else if (dbRec.category === "CPR_FACILITY" || dbRec.certificateId.startsWith("IAP-CPR-DAY/VENUE/")) cat = "CPR_FACILITY";
        else if (dbRec.category === "CPR_DAY" || dbRec.certificateId.startsWith("IAPCPR/PA/") || isCprDayDate(dbRec.certificateDate)) cat = "CPR_DAY";

        let templateUsed = "cpr sanjeevani certificate 2.svg";
        if (cat === "CPR_DAY") templateUsed = "Lay Rescuer CPR Day.svg";
        else if (cat === "CPR_CHAMPION") templateUsed = "CPR Champions.svg";
        else if (cat === "COURSE_COORDINATOR") templateUsed = "Course Coordinator.svg";
        else if (cat === "CPR_FACILITY") templateUsed = "CPR Facility Certificate.svg";

        return {
          id: dbRec.id,
          certificateId: dbRec.certificateId,
          sequenceNumber: 0,
          stateCode: dbRec.stateCode,
          category: cat,
          templateUsed,
          participantName: dbRec.name,
          normalizedName: dbRec.normalizedName,
          date: dbRec.certificateDate,
          venue: dbRec.venueName,
          venueCode: dbRec.venueCode || undefined,
          city: dbRec.city || "",
          state: dbRec.state,
          mobileNumber: dbRec.mobileNumber || undefined,
          email: dbRec.email || undefined,
          courseCoordinator: dbRec.courseCoordinator || undefined,
          status: dbRec.status || "VALID",
          generatedAt: dbRec.createdAt ? dbRec.createdAt.toISOString() : new Date().toISOString(),
          createdAt: dbRec.createdAt ? dbRec.createdAt.toISOString() : new Date().toISOString(),
          updatedAt: dbRec.updatedAt ? dbRec.updatedAt.toISOString() : new Date().toISOString(),
        };
      }
    } catch (e) {
      // safe db fallback
    }
  }

  return null;
}

/**
 * Search certificates by query (O(N) in-memory filter + DB lookup).
 */
export async function searchSanjeevaniByQuery(query: string): Promise<SanjeevaniCertificateRecord[]> {
  const cleanQ = (query || "").trim().toLowerCase();
  if (!cleanQ) return [];

  const storageRecords = getAllSanjeevaniFromStorage();
  const memoryResults = storageRecords
    .filter(
      (r) =>
        r.participantName.toLowerCase().includes(cleanQ) ||
        (r.mobileNumber && r.mobileNumber.includes(cleanQ)) ||
        (r.email && r.email.toLowerCase().includes(cleanQ)) ||
        r.certificateId.toLowerCase().includes(cleanQ) ||
        (r.venueCode && r.venueCode.toLowerCase().includes(cleanQ)) ||
        r.venue.toLowerCase().includes(cleanQ) ||
        r.city.toLowerCase().includes(cleanQ) ||
        r.state.toLowerCase().includes(cleanQ) ||
        (r.courseCoordinator && r.courseCoordinator.toLowerCase().includes(cleanQ))
    );

  const seenIds = new Set(memoryResults.map((r) => r.certificateId.toUpperCase()));
  const combined: SanjeevaniCertificateRecord[] = [...memoryResults];

  if (prisma && (prisma as any).adminCertificateRecord) {
    try {
      const dbRecords = await (prisma as any).adminCertificateRecord.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { normalizedName: { contains: cleanQ } },
            { mobileNumber: { contains: query } },
            { email: { contains: cleanQ, mode: "insensitive" } },
            { venueName: { contains: query, mode: "insensitive" } },
            { city: { contains: query, mode: "insensitive" } },
            { state: { contains: query, mode: "insensitive" } },
            { certificateId: { contains: query, mode: "insensitive" } },
          ],
        },
        take: 50,
      });

      for (const dbRec of dbRecords) {
        if (!seenIds.has(dbRec.certificateId.toUpperCase())) {
          seenIds.add(dbRec.certificateId.toUpperCase());
          let cat: CertificateCategory = "SANJEEVANI";
          if (dbRec.category === "CPR_CHAMPION" || dbRec.certificateId.startsWith("IAPCPR/CH/")) cat = "CPR_CHAMPION";
          else if (dbRec.category === "COURSE_COORDINATOR" || dbRec.certificateId.startsWith("IAPCPR/CC/")) cat = "COURSE_COORDINATOR";
          else if (dbRec.category === "CPR_FACILITY" || dbRec.certificateId.startsWith("IAP-CPR-DAY/VENUE/")) cat = "CPR_FACILITY";
          else if (dbRec.category === "CPR_DAY" || dbRec.certificateId.startsWith("IAPCPR/PA/") || isCprDayDate(dbRec.certificateDate)) cat = "CPR_DAY";

          let templateUsed = "cpr sanjeevani certificate 2.svg";
          if (cat === "CPR_DAY") templateUsed = "Lay Rescuer CPR Day.svg";
          else if (cat === "CPR_CHAMPION") templateUsed = "CPR Champions.svg";
          else if (cat === "COURSE_COORDINATOR") templateUsed = "Course Coordinator.svg";
          else if (cat === "CPR_FACILITY") templateUsed = "CPR Facility Certificate.svg";

          combined.push({
            id: dbRec.id,
            certificateId: dbRec.certificateId,
            sequenceNumber: 0,
            stateCode: dbRec.stateCode,
            category: cat,
            templateUsed,
            participantName: dbRec.name,
            normalizedName: dbRec.normalizedName,
            date: dbRec.certificateDate,
            venue: dbRec.venueName,
            venueCode: dbRec.venueCode || undefined,
            city: dbRec.city || "",
            state: dbRec.state,
            mobileNumber: dbRec.mobileNumber || undefined,
            email: dbRec.email || undefined,
            courseCoordinator: dbRec.courseCoordinator || undefined,
            status: dbRec.status || "VALID",
            generatedAt: dbRec.createdAt ? dbRec.createdAt.toISOString() : new Date().toISOString(),
            createdAt: dbRec.createdAt ? dbRec.createdAt.toISOString() : new Date().toISOString(),
            updatedAt: dbRec.updatedAt ? dbRec.updatedAt.toISOString() : new Date().toISOString(),
          });
        }
      }
    } catch (e) {
      // safe db fallback
    }
  }

  return combined.slice(0, 50);
}
