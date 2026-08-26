import fs from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";
import {
  getHighestCPRDayParticipantSequence,
  getHighestCPRChampionSequence,
  getHighestCPRCoordinatorSequence,
  getHighestCPRFacilitySequence,
} from "@/lib/cprCertificates";

export type CertificateCategory = "CPR_DAY" | "SANJEEVANI" | "CPR_CHAMPION" | "CPR_FACILITY";

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
  existingCertificateId?: string;
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
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(CERTS_FILE)) {
    fs.writeFileSync(CERTS_FILE, JSON.stringify([]), "utf8");
  }
  if (!fs.existsSync(BATCHES_FILE)) {
    fs.writeFileSync(BATCHES_FILE, JSON.stringify([]), "utf8");
  }
}

/**
 * Automatically checks if a course date corresponds to National IAP CPR Day (21-07-2026).
 */
export function isCprDayDate(dateStr: string): boolean {
  if (!dateStr) return false;
  const cleaned = dateStr.trim().toLowerCase().replace(/(\d+)(st|nd|rd|th)/g, "$1");

  // Direct fast string checks
  if (
    cleaned.includes("21-07-2026") ||
    cleaned.includes("21/07/2026") ||
    cleaned.includes("21.07.2026") ||
    cleaned.includes("21-7-2026") ||
    cleaned.includes("21/7/2026") ||
    cleaned.includes("2026-07-21") ||
    cleaned.includes("2026/07/21") ||
    cleaned.includes("21-07-26") ||
    cleaned.includes("21/07/26")
  ) {
    return true;
  }

  // Textual dates (e.g. 21 July 2026)
  const hasDay21 = /\b21\b/.test(cleaned);
  const hasJuly = cleaned.includes("jul") || cleaned.includes("july");
  const hasYear2026 = cleaned.includes("2026") || /\b26\b/.test(cleaned);

  return hasDay21 && hasJuly && hasYear2026;
}

/**
 * Normalizes state code to uppercase trimmed 2-3 letter code.
 */
export function normalizeStateCode(code: string): string {
  const cleaned = (code || "").trim().toUpperCase().replace(/[^A-Z]/g, "");
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
    ensureStorageFiles();
    const data = fs.readFileSync(CERTS_FILE, "utf8");
    const records: any[] = JSON.parse(data || "[]");
    cachedStorageCerts = records.map((r) => {
      let cat: CertificateCategory = r.category;
      if (!cat) {
        const cId = (r.certificateId || "").toUpperCase();
        if (cId.includes("/PA/")) cat = "CPR_DAY";
        else if (cId.includes("/CH/")) cat = "CPR_CHAMPION";
        else if (cId.includes("VENUE") || cId.includes("FACILITY")) cat = "CPR_FACILITY";
        else cat = "SANJEEVANI";
      }
      return {
        ...r,
        category: cat,
      };
    });
    return cachedStorageCerts;
  } catch (err) {
    console.error("Error reading sanjeevani_certificates.json:", err);
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
    ensureStorageFiles();
    const data = fs.readFileSync(BATCHES_FILE, "utf8");
    cachedStorageBatches = JSON.parse(data || "[]");
    return cachedStorageBatches!;
  } catch (err) {
    console.error("Error reading sanjeevani_batches.json:", err);
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
      const isCprDayCert = rec.category === "CPR_DAY" || (rec.certificateId && rec.certificateId.toUpperCase().includes("/PA/"));
      const isChampionCert = rec.category === "CPR_CHAMPION" || (rec.certificateId && rec.certificateId.toUpperCase().includes("/CH/"));
      const isCoordinatorCert = (rec.category as string) === "COURSE_COORDINATOR" || (rec.certificateId && rec.certificateId.toUpperCase().includes("/CC/"));
      const isFacilityCert = rec.category === "CPR_FACILITY" || (rec.certificateId && rec.certificateId.toUpperCase().includes("VENUE"));
      
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

  // 1. Synchronously commit to JSON storage file & in-memory index
  ensureStorageFiles();
  const certs = getAllSanjeevaniFromStorage();
  certs.push(newRecord);
  cachedStorageCerts = certs;
  try {
    fs.writeFileSync(CERTS_FILE, JSON.stringify(certs, null, 2), "utf8");
  } catch (fsErr) {
    console.error("Error writing sanjeevani_certificates.json:", fsErr);
  }

  // 2. Synchronize to PostgreSQL table AdminCertificateRecord if available
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

/**
 * Finds if a participant has already received a certificate (O(1) in-memory lookup).
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
 * Ultra-Fast Preview Generator:
 * 1. Groups rows in O(N) single pass.
 * 2. Fetches starting sequences for distinct state codes in parallel.
 * 3. Uses an O(1) in-memory Hash Map index for duplicate participant detection.
 */
export async function generatePreview(
  rows: SanjeevaniInputRow[],
  forcedCategory?: CertificateCategory
): Promise<SanjeevaniPreviewResponse> {
  type GroupKey = `${CertificateCategory}_${string}`;
  const groupMap: Record<GroupKey, { category: CertificateCategory; stateCode: string; rows: SanjeevaniInputRow[] }> = {};

  // 1. Single O(N) grouping pass
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (row.isValid) {
      let category: CertificateCategory;
      if (forcedCategory) {
        category = forcedCategory;
      } else {
        category = isCprDayDate(row.date) ? "CPR_DAY" : "SANJEEVANI";
      }

      const normState = normalizeStateCode(row.stateCode);
      const key: GroupKey = `${category}_${normState}`;

      if (!groupMap[key]) {
        groupMap[key] = { category, stateCode: normState, rows: [] };
      }
      groupMap[key].rows.push(row);
    }
  }

  // 2. Fetch sequence offsets for unique (Category + State) groups
  const groupKeys = Object.keys(groupMap) as GroupKey[];
  const groupHighestMap: Record<GroupKey, number> = {};

  await Promise.all(
    groupKeys.map(async (key) => {
      const group = groupMap[key];
      if (group.category === "CPR_FACILITY") {
        groupHighestMap[key] = 0;
      } else {
        groupHighestMap[key] = await getHighestSequenceForCategoryAndState(group.category, group.stateCode);
      }
    })
  );

  // 3. Build state allocation summaries and running sequence counters
  const groupRunningOffset: Record<GroupKey, number> = {};
  const stateSummaries: StateAllocationSummary[] = [];

  for (let i = 0; i < groupKeys.length; i++) {
    const key = groupKeys[i];
    const group = groupMap[key];
    const count = group.rows.length;
    let startingSeq = 101;
    let endingSeq = 101 + count - 1;
    let startingCertificateId = "";
    let endingCertificateId = "";
    let lastCertificateId: string | null = null;
    let lastIssuedSequence = 0;

    let templateUsed = "cpr sanjeevani certificate 2.svg";
    let categoryName = "IAP CPR Sanjeevani";

    if (group.category === "CPR_DAY") {
      templateUsed = "Lay Rescuer CPR Day.svg";
      categoryName = "National IAP CPR Day";
      const highest = groupHighestMap[key] || 0;
      lastIssuedSequence = highest;
      startingSeq = highest > 0 ? highest + 1 : 101;
      endingSeq = startingSeq + count - 1;
      lastCertificateId = highest > 0 ? buildCertificateId(group.category, group.stateCode, highest) : null;
      startingCertificateId = buildCertificateId(group.category, group.stateCode, startingSeq);
      endingCertificateId = buildCertificateId(group.category, group.stateCode, endingSeq);
      groupRunningOffset[key] = startingSeq;
    } else if (group.category === "CPR_CHAMPION") {
      templateUsed = "CPR Champions.svg";
      categoryName = "CPR Champion";
      const highest = groupHighestMap[key] || 0;
      lastIssuedSequence = highest;
      startingSeq = highest > 0 ? highest + 1 : 101;
      endingSeq = startingSeq + count - 1;
      lastCertificateId = highest > 0 ? buildCertificateId(group.category, group.stateCode, highest) : null;
      startingCertificateId = buildCertificateId(group.category, group.stateCode, startingSeq);
      endingCertificateId = buildCertificateId(group.category, group.stateCode, endingSeq);
      groupRunningOffset[key] = startingSeq;
    } else if (group.category === "CPR_FACILITY") {
      templateUsed = "CPR Facility Certificate.svg";
      categoryName = "CPR Facility / Venue";
      startingCertificateId = group.rows[0]?.venueCode || `IAP-CPR-Day/Venue/${group.stateCode}-101`;
      endingCertificateId = group.rows[group.rows.length - 1]?.venueCode || startingCertificateId;
      startingSeq = 1;
      endingSeq = count;
      groupRunningOffset[key] = 1;
    } else {
      const highest = groupHighestMap[key] || 0;
      lastIssuedSequence = highest;
      startingSeq = highest > 0 ? highest + 1 : 101;
      endingSeq = startingSeq + count - 1;
      lastCertificateId = highest > 0 ? buildCertificateId(group.category, group.stateCode, highest) : null;
      startingCertificateId = buildCertificateId(group.category, group.stateCode, startingSeq);
      endingCertificateId = buildCertificateId(group.category, group.stateCode, endingSeq);
      groupRunningOffset[key] = startingSeq;
    }

    stateSummaries.push({
      category: group.category,
      categoryName,
      stateCode: group.stateCode,
      stateName: group.rows[0]?.state || group.stateCode,
      lastIssuedSequence,
      lastCertificateId,
      startingSequence: startingSeq,
      startingCertificateId,
      countGenerating: count,
      endingSequence: endingSeq,
      endingCertificateId,
      templateUsed,
    });
  }

  // 4. Build an O(1) in-memory duplicate lookup Map
  const allStoredCerts = getAllSanjeevaniFromStorage();
  const existingParticipantMap = new Map<string, SanjeevaniCertificateRecord>();

  for (let i = 0; i < allStoredCerts.length; i++) {
    const cert = allStoredCerts[i];
    let key = `${normalizeParticipantName(cert.participantName)}|${normalizeStateCode(cert.stateCode)}`;
    if (cert.category === "CPR_CHAMPION") {
      key = `${normalizeParticipantName(cert.participantName)}|${normalizeStateCode(cert.stateCode)}|${normalizeParticipantName(cert.venue)}`;
    } else if (cert.category === "CPR_FACILITY") {
      key = cert.certificateId ? cert.certificateId.trim().toUpperCase() : `${normalizeParticipantName(cert.venue)}|${normalizeStateCode(cert.stateCode)}`;
    }
    if (!existingParticipantMap.has(key)) {
      existingParticipantMap.set(key, cert);
    }
  }

  // 5. Single O(N) mapping pass for preview rows
  let duplicateCount = 0;
  const previewRows: PreviewRowResult[] = new Array(rows.length);

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row.isValid) {
      previewRows[i] = {
        ...row,
        category: forcedCategory || "SANJEEVANI",
        proposedCertificateId: "",
        proposedSequence: 0,
        isDuplicate: false,
        templateUsed: "",
      };
      continue;
    }

    let category: CertificateCategory;
    if (forcedCategory) {
      category = forcedCategory;
    } else {
      category = isCprDayDate(row.date) ? "CPR_DAY" : "SANJEEVANI";
    }

    const normState = normalizeStateCode(row.stateCode);
    const key: GroupKey = `${category}_${normState}`;

    let assignedSeq = groupRunningOffset[key]++;
    let proposedId = "";
    let templateUsed = "cpr sanjeevani certificate 2.svg";

    if (category === "CPR_FACILITY") {
      proposedId = (row.venueCode || "").trim();
      if (!proposedId) {
        proposedId = `IAP-CPR-Day/Venue/${normState}-${assignedSeq}`;
      }
      templateUsed = "CPR Facility Certificate.svg";
    } else if (category === "CPR_DAY") {
      proposedId = buildCertificateId(category, normState, assignedSeq);
      templateUsed = "Lay Rescuer CPR Day.svg";
    } else if (category === "CPR_CHAMPION") {
      proposedId = buildCertificateId(category, normState, assignedSeq);
      templateUsed = "CPR Champions.svg";
    } else {
      proposedId = buildCertificateId(category, normState, assignedSeq);
    }

    // O(1) Instant Map duplicate check
    let dupKey = `${normalizeParticipantName(row.name)}|${normState}`;
    if (category === "CPR_CHAMPION") {
      dupKey = `${normalizeParticipantName(row.name)}|${normState}|${normalizeParticipantName(row.venue)}`;
    } else if (category === "CPR_FACILITY") {
      dupKey = (row.venueCode || proposedId).trim().toUpperCase();
    }

    const dupRecord = existingParticipantMap.get(dupKey);
    const isDup = Boolean(dupRecord);
    if (isDup) duplicateCount++;

    previewRows[i] = {
      ...row,
      category,
      proposedCertificateId: proposedId,
      proposedSequence: assignedSeq,
      isDuplicate: isDup,
      existingCertificateId: dupRecord?.certificateId,
      templateUsed,
    };
  }

  const validCount = previewRows.filter((r) => r.isValid).length;
  const errorCount = previewRows.length - validCount;

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
 * Atomically allocates, saves, and creates certificates and batch record with automatic category selection.
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

  // Determine category & state-wise sequences atomically
  type GroupKey = `${CertificateCategory}_${string}`;
  const groupMap: Record<GroupKey, { category: CertificateCategory; stateCode: string; rows: SanjeevaniInputRow[] }> = {};

  for (let i = 0; i < validRows.length; i++) {
    const row = validRows[i];
    if (row.isValid) {
      let category: CertificateCategory;
      if (forcedCategory) {
        category = forcedCategory;
      } else {
        category = isCprDayDate(row.date) ? "CPR_DAY" : "SANJEEVANI";
      }

      const normState = normalizeStateCode(row.stateCode);
      const key: GroupKey = `${category}_${normState}`;

      if (!groupMap[key]) {
        groupMap[key] = { category, stateCode: normState, rows: [] };
      }
      groupMap[key].rows.push(row);
    }
  }

  const groupKeys = Object.keys(groupMap) as GroupKey[];
  const groupNextSeq: Record<GroupKey, number> = {};

  await Promise.all(
    groupKeys.map(async (key) => {
      const group = groupMap[key];
      if (group.category === "CPR_FACILITY") {
        groupNextSeq[key] = 1;
      } else {
        const highest = await getHighestSequenceForCategoryAndState(group.category, group.stateCode);
        groupNextSeq[key] = highest > 0 ? highest + 1 : 101;
      }
    })
  );

  // O(1) duplicate map
  const allStoredCerts = getAllSanjeevaniFromStorage();
  const existingParticipantMap = new Map<string, boolean>();
  for (let i = 0; i < allStoredCerts.length; i++) {
    const c = allStoredCerts[i];
    let key = `${normalizeParticipantName(c.participantName)}|${normalizeStateCode(c.stateCode)}`;
    if (c.category === "CPR_CHAMPION") {
      key = `${normalizeParticipantName(c.participantName)}|${normalizeStateCode(c.stateCode)}|${normalizeParticipantName(c.venue)}`;
    } else if (c.category === "CPR_FACILITY") {
      key = c.certificateId ? c.certificateId.trim().toUpperCase() : `${normalizeParticipantName(c.venue)}|${normalizeStateCode(c.stateCode)}`;
    }
    existingParticipantMap.set(key, true);
  }

  const newCertificates: SanjeevaniCertificateRecord[] = [];
  let skippedCount = 0;
  let duplicateCount = 0;

  for (let i = 0; i < validRows.length; i++) {
    const row = validRows[i];
    if (!row.isValid) {
      skippedCount++;
      continue;
    }

    let category: CertificateCategory;
    if (forcedCategory) {
      category = forcedCategory;
    } else {
      category = isCprDayDate(row.date) ? "CPR_DAY" : "SANJEEVANI";
    }

    const normState = normalizeStateCode(row.stateCode);
    const key: GroupKey = `${category}_${normState}`;

    const seq = groupNextSeq[key]++;
    let certId = "";
    let templateUsed = "cpr sanjeevani certificate 2.svg";

    if (category === "CPR_FACILITY") {
      certId = (row.venueCode || "").trim();
      if (!certId) certId = `IAP-CPR-Day/Venue/${normState}-${seq}`;
      templateUsed = "CPR Facility Certificate.svg";
    } else if (category === "CPR_DAY") {
      certId = buildCertificateId(category, normState, seq);
      templateUsed = "Lay Rescuer CPR Day.svg";
    } else if (category === "CPR_CHAMPION") {
      certId = buildCertificateId(category, normState, seq);
      templateUsed = "CPR Champions.svg";
    } else {
      certId = buildCertificateId(category, normState, seq);
    }

    let dupKey = `${normalizeParticipantName(row.name)}|${normState}`;
    if (category === "CPR_CHAMPION") {
      dupKey = `${normalizeParticipantName(row.name)}|${normState}|${normalizeParticipantName(row.venue)}`;
    } else if (category === "CPR_FACILITY") {
      dupKey = certId.trim().toUpperCase();
    }

    const isDup = existingParticipantMap.has(dupKey);

    if (isDup && !allowDuplicates) {
      duplicateCount++;
      skippedCount++;
      continue;
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
      date: row.date.trim() || "21-07-2026",
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
    existingParticipantMap.set(dupKey, true);
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

  // 1. Save to local JSON files and update cache
  const existingCerts = getAllSanjeevaniFromStorage();
  const updatedCerts = [...existingCerts, ...newCertificates];
  fs.writeFileSync(CERTS_FILE, JSON.stringify(updatedCerts, null, 2), "utf8");

  const existingBatches = getAllBatchesFromStorage();
  const updatedBatches = [batchRecord, ...existingBatches];
  fs.writeFileSync(BATCHES_FILE, JSON.stringify(updatedBatches, null, 2), "utf8");

  // Invalidate and reload cache
  cachedStorageCerts = updatedCerts;
  cachedStorageBatches = updatedBatches;

  // 2. Synchronize to Prisma DB asynchronously without blocking response
  if (prisma) {
    (async () => {
      try {
        await prisma.sanjeevaniUploadBatch.create({
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

        for (let i = 0; i < newCertificates.length; i++) {
          const c = newCertificates[i];
          await prisma.sanjeevaniCertificate.create({
            data: {
              id: c.id,
              certificateId: c.certificateId,
              sequenceNumber: c.sequenceNumber,
              stateCode: c.stateCode,
              participantName: c.participantName,
              normalizedName: c.normalizedName,
              date: c.date,
              venue: c.venue,
              city: c.city,
              state: c.state,
              mobileNumber: c.mobileNumber,
              email: c.email,
              uploadBatchId: batchId,
              status: c.status,
              generatedAt: new Date(c.generatedAt),
            },
          });
        }
      } catch (dbErr) {
        // Safe asynchronous background sync
      }
    })();
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

  return match || null;
}

/**
 * Search certificates by query (O(N) in-memory filter).
 */
export async function searchSanjeevaniByQuery(query: string): Promise<SanjeevaniCertificateRecord[]> {
  const cleanQ = (query || "").trim().toLowerCase();
  if (!cleanQ) return [];

  const storageRecords = getAllSanjeevaniFromStorage();
  return storageRecords
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
    )
    .slice(0, 50);
}
