import fs from "fs";
import path from "path";
import { generateUnifiedCertificateSvg, formatCertificateFilename } from "./sanjeevaniCertificate";

export type CPRCertificatePortal = "participant" | "champion" | "coordinator";

export type CPRCertificateRecord = {
  srNo: string;
  certificateNumber: string;
  participantName: string;
  mobileNumber: string;
  email: string;
  zone: string;
  state: string;
  city: string;
  courseCoordinator: string;
  courseCoordinatorEmail: string;
  venueName: string;
  driveLink: string;
  driveFileId: string;
  downloadUrl: string;
  previewUrl: string;
  issueDate: string;
  status: string;
  category: string;
  courseTitle: string;
  portalType: CPRCertificatePortal;
  svg?: string;
  pdfFilename?: string;
  pngFilename?: string;
  svgFilename?: string;
};

/**
 * Extracts Google Drive File ID from standard view/share links
 */
export function extractGoogleDriveFileId(url: string): string {
  if (!url || url.includes("#N/A")) return "";
  const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (match && match[1]) return match[1];
  const idMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idMatch && idMatch[1]) return idMatch[1];
  return "";
}

/**
 * Robust CSV parser that handles multiline quoted values correctly.
 */
function parseFullCSV(content: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = "";
  let inQuotes = false;

  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    const nextChar = content[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentCell += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      currentRow.push(currentCell.trim());
      currentCell = "";
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      currentRow.push(currentCell.trim());
      if (currentRow.some((cell) => cell.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentCell = "";
    } else {
      currentCell += char;
    }
  }

  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    if (currentRow.some((cell) => cell.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

// In-Memory Fast Cache for Parsed CSV Records & State Max Sequences
const certificateCache: Partial<Record<CPRCertificatePortal, CPRCertificateRecord[]>> = {};
const cprDayMaxSeqCache = new Map<string, number>();
const championMaxSeqCache = new Map<string, number>();
let cprDayMaxSeqIndexed = false;
let championMaxSeqIndexed = false;
let lastCsvMtime = 0;

const CERTS_DIRS = [
  path.join(process.cwd(), "cprcertificates"),
  path.join(process.cwd(), "cprsanjeevani"),
];

function getLatestCsvMtimes(): number {
  let maxMtime = 0;
  for (const dir of CERTS_DIRS) {
    if (!fs.existsSync(dir)) continue;
    try {
      const files = fs.readdirSync(dir);
      for (const f of files) {
        if (f.endsWith(".csv") || f.endsWith(".CSV")) {
          const stats = fs.statSync(path.join(dir, f));
          if (stats.mtimeMs > maxMtime) maxMtime = stats.mtimeMs;
        }
      }
    } catch {}
  }
  return maxMtime;
}

function indexCprDayParticipantSequences(records: CPRCertificateRecord[]) {
  cprDayMaxSeqCache.clear();
  for (const r of records) {
    const certNum = (r.certificateNumber || "").trim().toUpperCase();
    const match = certNum.match(/^IAPCPR[/-]PA[/-]([A-Z]+)[/-](\d+)$/i);
    if (match && match[1] && match[2]) {
      const state = match[1].toUpperCase();
      const num = parseInt(match[2], 10);
      if (!isNaN(num)) {
        const current = cprDayMaxSeqCache.get(state) || 0;
        if (num > current) {
          cprDayMaxSeqCache.set(state, num);
        }
      }
    }
  }
  cprDayMaxSeqIndexed = true;
}

function indexChampionSequences(records: CPRCertificateRecord[]) {
  championMaxSeqCache.clear();
  for (const r of records) {
    const certNum = (r.certificateNumber || "").trim().toUpperCase();
    const match = certNum.match(/^IAPCPR[/-]CH[/-]([A-Z]+)[/-](\d+)$/i);
    if (match && match[1] && match[2]) {
      const state = match[1].toUpperCase();
      const num = parseInt(match[2], 10);
      if (!isNaN(num)) {
        const current = championMaxSeqCache.get(state) || 0;
        if (num > current) {
          championMaxSeqCache.set(state, num);
        }
      }
    }
  }
  championMaxSeqIndexed = true;
}

/**
 * Dynamically loads and parses CSV files for participants, CPR champions, or course coordinators
 * across both `cprcertificates` and `cprsanjeevani` folders
 * (Auto-invalidates and refreshes cache if CSV files are modified).
 */
export function getAllCPRCertificates(portal: CPRCertificatePortal = "participant"): CPRCertificateRecord[] {
  const currentMtime = getLatestCsvMtimes();
  if (currentMtime > lastCsvMtime) {
    // Clear cache if any CSV file was updated on disk
    lastCsvMtime = currentMtime;
    certificateCache.participant = undefined;
    certificateCache.champion = undefined;
    certificateCache.coordinator = undefined;
    cprDayMaxSeqIndexed = false;
  }

  if (certificateCache[portal]) {
    return certificateCache[portal]!;
  }

  const allCsvFiles: { dir: string; file: string }[] = [];
  for (const dir of CERTS_DIRS) {
    if (!fs.existsSync(dir)) continue;
    const files = fs.readdirSync(dir);
    for (const file of files) {
      if (file.endsWith(".csv") || file.endsWith(".CSV")) {
        allCsvFiles.push({ dir, file });
      }
    }
  }

  const records: CPRCertificateRecord[] = [];
  const seenCertIds = new Set<string>();
  const seenPersonVenueKeys = new Set<string>();

  for (const { dir, file } of allCsvFiles) {
    try {
      const lowerFile = file.toLowerCase();
      const isCoordinatorFile = lowerFile.includes("coordinator");
      const isChampionFile = lowerFile.includes("champion");
      const isVenueFile = lowerFile.includes("venue") || lowerFile.includes("facility");

      if (isVenueFile) continue; // Venues are handled by facility portal registry
      if (portal === "coordinator" && !isCoordinatorFile) continue;
      if (portal === "champion" && !isChampionFile) continue;
      if (portal === "participant" && (isCoordinatorFile || isChampionFile)) continue;

      const filePath = path.join(dir, file);
      const content = fs.readFileSync(filePath, "utf8");
      const cleanContent = content.replace(/^\uFEFF/, "");
      const rows = parseFullCSV(cleanContent);

      if (rows.length <= 1) continue;

      // Find header indices dynamically
      const headers = rows[0].map((h) => h.toLowerCase().trim());

      const certIdIdx = headers.findIndex(
        (h) =>
          h.includes("certificate id") ||
          h.includes("cert id") ||
          h.includes("cert no") ||
          h.includes("certificate no") ||
          h.includes("cert_id") ||
          h.includes("certificate_id")
      );

      const nameIdx = headers.findIndex((h) => {
        if (isCoordinatorFile) {
          return h.includes("coordinator name") || h.includes("participant") || h.includes("name");
        }
        if (isChampionFile) {
          return h.includes("champion") || h.includes("chapion") || h.includes("participant") || h.includes("name");
        }
        return (
          h.includes("name of participant") ||
          h.includes("participant name") ||
          h.includes("full name") ||
          h.includes("participant") ||
          h.includes("name")
        );
      });

      const mobileIdx = headers.findIndex(
        (h) => h.includes("mobile") || h.includes("phone") || h.includes("contact")
      );

      const emailIdx = headers.findIndex(
        (h) => (h.includes("email") || h.includes("mail")) && !h.includes("course coordinator")
      );

      const zoneIdx = headers.findIndex((h) => h.includes("zone"));
      const stateIdx = headers.findIndex((h) => h.includes("state"));
      const cityIdx = headers.findIndex((h) => h.includes("city") || h.includes("district"));

      const coordinatorIdx = headers.findIndex(
        (h) => (h.includes("course coordinator") || h.includes("instructor")) && !h.includes("email")
      );

      const coordinatorEmailIdx = headers.findIndex(
        (h) => h.includes("coordinator email") || h.includes("coordinator_email")
      );

      const venueIdx = headers.findIndex(
        (h) => h.includes("venue") || h.includes("center") || h.includes("hospital") || h.includes("institution")
      );

      const driveLinkIdx = headers.findIndex(
        (h) => h.includes("drive") || h.includes("link") || h.includes("url") || h.includes("google")
      );

      for (let i = 1; i < rows.length; i++) {
        const cols = rows[i];
        if (cols.length < 3) continue;

        const certId = cols[certIdIdx >= 0 ? certIdIdx : 1] || "";
        const name = cols[nameIdx >= 0 ? nameIdx : 2] || "";
        const mobile = isChampionFile ? "" : cols[mobileIdx >= 0 ? mobileIdx : 3] || "";
        const email = isChampionFile ? "" : cols[emailIdx >= 0 ? emailIdx : 4] || "";
        const zone = cols[zoneIdx >= 0 ? zoneIdx : 5] || "";
        const state = cols[stateIdx >= 0 ? stateIdx : (isChampionFile ? 3 : 6)] || "";
        const city = cols[cityIdx >= 0 ? cityIdx : (isChampionFile ? 4 : 7)] || "";
        const coordinator = coordinatorIdx >= 0 ? cols[coordinatorIdx] || "" : "";
        const coordinatorEmail = coordinatorEmailIdx >= 0 ? cols[coordinatorEmailIdx] || "" : "";
        const venue = venueIdx >= 0 ? cols[venueIdx] || "" : cols[isChampionFile ? 5 : 10] || "";
        const driveLink = driveLinkIdx >= 0 ? cols[driveLinkIdx] || "" : cols[isChampionFile ? 6 : 11] || "";

        const cleanCertId = certId.trim();
        const cleanName = name.trim();
        const cleanMobile = mobile.trim();
        const cleanState = state.trim();
        const cleanVenue = venue.trim();
        let cleanCity = city.trim();

        if (!cleanCity || cleanCity.toLowerCase().includes("panuganti") || cleanCity.toLowerCase().includes("suresh")) {
          if (cleanVenue.toLowerCase().includes("kiddy's corner") || cleanVenue.toLowerCase().includes("gwalior")) {
            cleanCity = "Gwalior";
          } else if (cleanVenue.toLowerCase().includes("assam medical college")) {
            cleanCity = "Dibrugarh";
          } else if (cleanVenue.toLowerCase().includes("guwahati")) {
            cleanCity = "Guwahati";
          } else if (cleanVenue.toLowerCase().includes("rohini")) {
            cleanCity = "Delhi";
          } else if (cleanVenue.toLowerCase().includes("thirthahalli")) {
            cleanCity = "Thirthahalli";
          } else if (cleanState) {
            cleanCity = cleanState;
          }
        }

        if (!cleanCertId && !cleanName) continue;

        // Deduplication 1: Certificate ID check
        if (cleanCertId) {
          const certKey = cleanCertId.toUpperCase();
          if (seenCertIds.has(certKey)) continue;
          seenCertIds.add(certKey);
        }

        // Deduplication 2: Champion Name + State + Venue check (for Champions) or Name + Mobile + Venue check
        if (cleanName && cleanVenue) {
          const personVenueKey = isChampionFile
            ? `${cleanName.toUpperCase()}|${cleanState.toUpperCase()}|${cleanVenue.toUpperCase()}`
            : `${cleanName.toUpperCase()}|${cleanMobile.replace(/\D/g, "")}|${cleanVenue.toUpperCase()}`;

          if (seenPersonVenueKeys.has(personVenueKey)) continue;
          seenPersonVenueKeys.add(personVenueKey);
        }

        const driveFileId = extractGoogleDriveFileId(driveLink);
        const downloadUrl = driveFileId
          ? `https://drive.google.com/uc?export=download&id=${driveFileId}`
          : driveLink;
        const previewUrl = driveFileId
          ? `https://drive.google.com/file/d/${driveFileId}/preview`
          : driveLink;

        records.push({
          srNo: cols[0] || "",
          certificateNumber: cleanCertId,
          participantName: cleanName,
          mobileNumber: cleanMobile,
          email: email.trim(),
          zone: zone.trim(),
          state: state.trim(),
          city: cleanCity,
          courseCoordinator: coordinator.trim(),
          courseCoordinatorEmail: coordinatorEmail.trim(),
          venueName: cleanVenue,
          driveLink: driveLink.trim(),
          driveFileId,
          downloadUrl,
          previewUrl,
          issueDate: "21 July 2026",
          status: "GENERATED",
          category: isCoordinatorFile
            ? "Course Coordinator"
            : isChampionFile
            ? "CPR Champion"
            : "CPR Aware Citizen",
          courseTitle: isCoordinatorFile
            ? "National IAP CPR Sanjeevani Course Coordinator Certificate"
            : isChampionFile
            ? "National IAP CPR Sanjeevani Champion Certificate"
            : "National IAP CPR Sanjeevani Training Program",
          portalType: portal,
        });
      }
    } catch (err) {
      console.error(`Error reading CSV file ${file}:`, err);
    }
  }

  certificateCache[portal] = records;
  if (portal === "participant") {
    indexCprDayParticipantSequences(records);
  } else if (portal === "champion") {
    indexChampionSequences(records);
  }

  return records;
}

export function searchCertificateById(id: string, portal: CPRCertificatePortal = "participant"): CPRCertificateRecord | null {
  const cleanInput = id.trim().toUpperCase();
  if (!cleanInput) return null;
  const all = getAllCPRCertificates(portal);
  return (
    all.find((c) => c.certificateNumber.trim().toUpperCase() === cleanInput) || null
  );
}

export function searchCertificatesByQuery(query: string, portal: CPRCertificatePortal = "participant"): CPRCertificateRecord[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const qDigits = q.replace(/\D/g, "");

  const all = getAllCPRCertificates(portal);
  return all.filter((c) => {
    const mobileDigits = c.mobileNumber.replace(/\D/g, "");
    const qDigits10 = qDigits.length === 12 && qDigits.startsWith("91") ? qDigits.slice(2) : qDigits;

    const matchMobile =
      (c.mobileNumber && c.mobileNumber.toLowerCase().includes(q)) ||
      (qDigits.length >= 7 && mobileDigits.length >= 7 && (mobileDigits.includes(qDigits) || mobileDigits.includes(qDigits10)));

    const matchEmail = c.email && c.email.toLowerCase().includes(q);
    const matchName = c.participantName.toLowerCase().includes(q);

    return matchMobile || matchEmail || matchName;
  });
}

export function getCertificateStates(portal: CPRCertificatePortal = "participant"): string[] {
  const all = getAllCPRCertificates(portal);
  const map = new Map<string, string>();
  for (const r of all) {
    if (r.state && r.state.trim().length > 0) {
      const key = r.state.trim().toLowerCase();
      if (!map.has(key)) {
        const formatted = r.state
          .trim()
          .toLowerCase()
          .split(" ")
          .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : ""))
          .join(" ");
        map.set(key, formatted);
      }
    }
  }
  return Array.from(map.values()).sort((a, b) => a.localeCompare(b));
}

export function getCertificateCities(state: string, portal: CPRCertificatePortal = "participant"): string[] {
  const cleanState = state.trim().toLowerCase();
  const all = getAllCPRCertificates(portal);
  const map = new Map<string, string>();
  for (const r of all) {
    if (r.state.trim().toLowerCase() === cleanState && r.city && r.city.trim().length > 0) {
      const cleanCity = r.city.trim();
      const key = cleanCity.toLowerCase();
      if (!cleanCity.toLowerCase().startsWith("dr.") && !cleanCity.toLowerCase().startsWith("dr ")) {
        if (!map.has(key)) {
          const formatted = cleanCity
            .split(" ")
            .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : ""))
            .join(" ");
          map.set(key, formatted);
        }
      }
    }
  }
  return Array.from(map.values()).sort((a, b) => a.localeCompare(b));
}

export function getCertificateVenues(state: string, city: string, portal: CPRCertificatePortal = "participant"): string[] {
  const cleanState = state.trim().toLowerCase();
  const cleanCity = city.trim().toLowerCase();
  const all = getAllCPRCertificates(portal);
  const venuesSet = new Set<string>();
  for (const r of all) {
    if (
      r.state.trim().toLowerCase() === cleanState &&
      r.city.trim().toLowerCase() === cleanCity &&
      r.venueName &&
      r.venueName.trim().length > 0
    ) {
      venuesSet.add(r.venueName.trim());
    }
  }
  return Array.from(venuesSet).sort((a, b) => a.localeCompare(b));
}

export function getCertificateParticipants(
  state: string,
  city: string,
  venue: string,
  portal: CPRCertificatePortal = "participant"
): string[] {
  const cleanState = state.trim().toLowerCase();
  const cleanCity = city.trim().toLowerCase();
  const cleanVenue = venue.trim().toLowerCase();
  const all = getAllCPRCertificates(portal);
  const nameSet = new Set<string>();
  for (const r of all) {
    if (
      r.state.trim().toLowerCase() === cleanState &&
      r.city.trim().toLowerCase() === cleanCity &&
      r.venueName.trim().toLowerCase() === cleanVenue &&
      r.participantName &&
      r.participantName.trim().length > 0
    ) {
      nameSet.add(r.participantName.trim());
    }
  }
  return Array.from(nameSet).sort((a, b) => a.localeCompare(b));
}

export function searchCertificateByHierarchy(
  state: string,
  city: string,
  venue: string,
  participantName: string,
  portal: CPRCertificatePortal = "participant"
): CPRCertificateRecord[] {
  const cleanState = state.trim().toLowerCase();
  const cleanCity = city.trim().toLowerCase();
  const cleanVenue = venue.trim().toLowerCase();
  const cleanName = participantName.trim().toLowerCase();

  const all = getAllCPRCertificates(portal);
  const matches = all.filter((r) => {
    const matchState = r.state.trim().toLowerCase() === cleanState;
    const matchCity = r.city.trim().toLowerCase() === cleanCity;
    const matchVenue = r.venueName.trim().toLowerCase() === cleanVenue;
    const rName = r.participantName.trim().toLowerCase();
    const matchName = rName === cleanName || (cleanName.length >= 3 && rName.includes(cleanName));
    return matchState && matchCity && matchVenue && matchName;
  });

  // Deduplicate by person identity (same name, mobile number, venue, city, and state)
  const seen = new Set<string>();
  const deduplicated: CPRCertificateRecord[] = [];

  for (const r of matches) {
    const normName = (r.participantName || "").trim().toLowerCase().replace(/\s+/g, " ").replace(/[^\w\s]/gi, "");
    const normVenue = (r.venueName || "").trim().toLowerCase().replace(/\s+/g, " ").replace(/[^\w\s]/gi, "");
    const normCity = (r.city || "").trim().toLowerCase().replace(/\s+/g, " ");
    const normState = (r.state || "").trim().toLowerCase().replace(/\s+/g, " ");
    const normMobile = (r.mobileNumber || "").replace(/\D/g, "");

    const key = `${normName}|${normMobile}|${normVenue}|${normCity}|${normState}`;
    const baseKey = `${normName}|${normVenue}|${normCity}|${normState}`;

    if (!seen.has(key) && !seen.has(baseKey)) {
      seen.add(key);
      if (normMobile) {
        seen.add(baseKey);
      }
      deduplicated.push(r);
    }
  }

  return deduplicated;
}

/**
 * Fast O(1) lookup of highest CPR Day participant sequence number for a given state code.
 * (e.g. from IAPCPR/PA/ML/0205, returns 205).
 */
export function getHighestCPRDayParticipantSequence(stateCode: string): number {
  const normState = (stateCode || "").trim().toUpperCase().replace(/[^A-Z]/g, "");
  if (!normState) return 0;

  if (!cprDayMaxSeqIndexed) {
    getAllCPRCertificates("participant");
  }

  return cprDayMaxSeqCache.get(normState) || 0;
}

/**
 * Fast O(1) lookup of highest CPR Champion sequence number for a given state code.
 * (e.g. from IAPCPR/CH/ML/0205, returns 205).
 */
export function getHighestCPRChampionSequence(stateCode: string): number {
  const normState = (stateCode || "").trim().toUpperCase().replace(/[^A-Z]/g, "");
  if (!normState) return 0;

  if (!championMaxSeqIndexed) {
    getAllCPRCertificates("champion");
  }

  return championMaxSeqCache.get(normState) || 0;
}

