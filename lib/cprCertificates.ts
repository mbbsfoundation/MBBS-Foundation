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
  path.join(process.cwd(), "cprsanjeevani"),
  path.join(process.cwd(), "cprcertificates"),
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
      const isUpdatedChampionMaster = lowerFile.includes("champion_certification_master_updated_250826");
      const isFinalChampionMaster = isUpdatedChampionMaster || lowerFile.includes("final_champion_certification_master");
      const isFinalCoordinatorMaster = lowerFile.includes("final_course_coordinator_certification_master");
      const isFinalParticipantMaster = lowerFile.includes("final_participant_certification_master");
      const isCoordinatorFile = lowerFile.includes("coordinator");
      const isChampionFile = lowerFile.includes("champion");
      const isVenueFile = lowerFile.includes("venue") || lowerFile.includes("facility");

      if (isVenueFile) continue; // Venues are handled by facility portal registry
      if (portal === "coordinator" && !isCoordinatorFile) continue;
      if (portal === "champion" && !isChampionFile) continue;
      if (portal === "participant" && (isCoordinatorFile || isChampionFile)) continue;

      // If Champion_Certification_Master_UPDATED_250826 (or Final_Champion_Certification_Master) is present, use it as the definitive source for Champions
      const hasUpdatedChampionMaster = allCsvFiles.some((f) =>
        f.file.toLowerCase().includes("champion_certification_master_updated_250826")
      );
      const hasFinalChampionMaster =
        hasUpdatedChampionMaster ||
        allCsvFiles.some((f) => f.file.toLowerCase().includes("final_champion_certification_master"));

      if (portal === "champion") {
        if (hasUpdatedChampionMaster && !isUpdatedChampionMaster) {
          continue;
        } else if (!hasUpdatedChampionMaster && hasFinalChampionMaster && !isFinalChampionMaster) {
          continue;
        }
      }

      // If Final_Course_Coordinator_Certification_Master is present, use it as the definitive source for Course Coordinators
      const hasFinalCoordinatorMaster = allCsvFiles.some((f) =>
        f.file.toLowerCase().includes("final_course_coordinator_certification_master")
      );
      if (portal === "coordinator" && hasFinalCoordinatorMaster && !isFinalCoordinatorMaster) {
        continue;
      }

      // If Final_Participant_Certification_Master is present, use it as the single authoritative source for supplemental participants in cprsanjeevani
      const hasFinalParticipantMaster = allCsvFiles.some((f) =>
        f.file.toLowerCase().includes("final_participant_certification_master")
      );
      if (
        portal === "participant" &&
        dir.includes("cprsanjeevani") &&
        hasFinalParticipantMaster &&
        !isFinalParticipantMaster
      ) {
        continue;
      }

      const filePath = path.join(dir, file);
      const content = fs.readFileSync(filePath, "utf8");
      const cleanContent = content.replace(/^\uFEFF/, "");
      const rows = parseFullCSV(cleanContent);

      if (rows.length <= 1) continue;

      // Find header indices dynamically
      const headers = rows[0].map((h) => h.toLowerCase().trim());

      const srNoIdx = headers.findIndex(
        (h) =>
          h.includes("sr.no") ||
          h.includes("sr no") ||
          h.includes("s.no") ||
          h.includes("sl.no") ||
          h.includes("sl no") ||
          h === "sno" ||
          h === "sr. no."
      );

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
          return (
            h.includes("coordinator name") ||
            h.includes("name of coordinator") ||
            h.includes("coordinator") ||
            h.includes("participant") ||
            h.includes("name")
          );
        }
        if (isChampionFile) {
          return (
            h.includes("name of champion") ||
            h.includes("champion name") ||
            h.includes("champion") ||
            h.includes("chapion") ||
            h.includes("participant") ||
            h.includes("name")
          );
        }
        return (
          h.includes("name of participant") ||
          h.includes("participant name") ||
          h.includes("full name") ||
          h.includes("participant") ||
          h.includes("name")
        );
      });

      const dateIdx = headers.findIndex(
        (h) => h.includes("date") || h.includes("course date") || h.includes("issue date")
      );

      const mobileIdx = headers.findIndex(
        (h) => h.includes("mobile") || h.includes("phone") || h.includes("contact")
      );

      const emailIdx = headers.findIndex(
        (h) =>
          (h.includes("email") || h.includes("mail")) &&
          (!isCoordinatorFile || !h.includes("course coordinator"))
      );

      const zoneIdx = headers.findIndex((h) => h.includes("zone"));
      const stateIdx = headers.findIndex((h) => h.includes("state") && !h.includes("state code"));
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

      const statusIdx = headers.findIndex(
        (h) => h.includes("certificate status") || h.includes("status")
      );

      const actionIdx = headers.findIndex(
        (h) => h.includes("website action") || h.includes("action")
      );

      const uniqueKeyIdx = headers.findIndex(
        (h) =>
          h.includes("unique participant-venue key") ||
          h.includes("unique coordinator-venue key") ||
          h.includes("unique champion-venue key") ||
          h.includes("unique champion") ||
          h.includes("unique coordinator") ||
          h.includes("unique participant") ||
          h.includes("unique key") ||
          h.includes("champion-venue key") ||
          h.includes("coordinator-venue key") ||
          h.includes("participant-venue key")
      );

      for (let i = 1; i < rows.length; i++) {
        const cols = rows[i];
        if (cols.length < 2) continue;

        const rowStatus = (statusIdx >= 0 ? cols[statusIdx] || "" : "").trim().toUpperCase();
        const rowAction = (actionIdx >= 0 ? cols[actionIdx] || "" : "").trim().toUpperCase();

        // Skip any REVIEW records from public search
        if (rowStatus.startsWith("REVIEW_") || rowAction === "DO_NOT_GENERATE_YET") {
          continue;
        }

        const srNo = srNoIdx >= 0 ? cols[srNoIdx] || "" : "";
        const certId = cols[certIdIdx >= 0 ? certIdIdx : 1] || "";
        const name = cols[nameIdx >= 0 ? nameIdx : 2] || "";
        const mobile = isChampionFile || isCoordinatorFile ? "" : cols[mobileIdx >= 0 ? mobileIdx : 3] || "";
        const email = isChampionFile || isCoordinatorFile ? cols[emailIdx >= 0 ? emailIdx : 6] || "" : cols[emailIdx >= 0 ? emailIdx : 4] || "";
        const zone = zoneIdx >= 0 ? cols[zoneIdx] || "" : "";
        const state = cols[stateIdx >= 0 ? stateIdx : (isChampionFile || isCoordinatorFile ? 4 : 6)] || "";
        const city = cols[cityIdx >= 0 ? cityIdx : (isChampionFile || isCoordinatorFile ? 3 : 7)] || "";
        const coordinator = coordinatorIdx >= 0 ? cols[coordinatorIdx] || "" : (isCoordinatorFile ? name : "");
        const coordinatorEmail = coordinatorEmailIdx >= 0 ? cols[coordinatorEmailIdx] || "" : (isCoordinatorFile ? email : "");
        const venue = venueIdx >= 0 ? cols[venueIdx] || "" : cols[isChampionFile || isCoordinatorFile ? 2 : 10] || "";
        const dateVal = dateIdx >= 0 && cols[dateIdx] && cols[dateIdx].trim() ? cols[dateIdx].trim() : "21 July 2026";
        let driveLink = driveLinkIdx >= 0 ? cols[driveLinkIdx] || "" : cols[isChampionFile || isCoordinatorFile ? 10 : 11] || "";

        // If NEW_HTML, EXISTING_ID, or from Final Participant Master, clear driveLink so it triggers dynamic SVG generation
        if (
          rowStatus === "NEW_HTML" ||
          rowStatus === "EXISTING_ID" ||
          rowAction === "GENERATE_HTML_CERTIFICATE" ||
          rowAction === "USE_EXISTING_ID" ||
          isFinalParticipantMaster
        ) {
          driveLink = "";
        }

        const cleanCertId = certId.trim();
        const cleanName = name.trim();
        const cleanMobile = mobile.trim();
        let cleanState = state.trim();
        if (cleanState.toLowerCase() === "jammu and kashmir" || cleanState.toLowerCase() === "jammu & kashmir") {
          cleanState = "Jammu & Kashmir";
        }

        let cleanVenue = venue.trim();
        if (
          cleanVenue.toLowerCase().includes("jindal super special") ||
          cleanVenue.toLowerCase().includes("jindal super specialty") ||
          cleanVenue.toLowerCase().includes("jindal super speciality")
        ) {
          cleanVenue = "Jindal Super Speciality Hospital";
        }

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

        // Deduplication 2: Unique Champion/Coordinator/Participant-Venue Key check or Person-Venue check
        if (cleanName && cleanVenue) {
          let personVenueKey = "";
          if (uniqueKeyIdx >= 0 && cols[uniqueKeyIdx] && cols[uniqueKeyIdx].trim()) {
            personVenueKey = cols[uniqueKeyIdx].trim().toLowerCase();
          } else if (isChampionFile || isCoordinatorFile) {
            const normName = cleanName.toLowerCase().replace(/^(dr|dr\.|prof|prof\.|mr|mr\.|ms|ms\.|mrs|mrs\.|capt|capt\.|lt|lt\.)\s+/i, "").replace(/[^\w\s]/gi, " ").replace(/\s+/g, " ").trim();
            const normVenue = cleanVenue.toLowerCase().replace(/[^\w\s]/gi, " ").replace(/\s+/g, " ").trim();
            const normCity = cleanCity.toLowerCase().replace(/[^\w\s]/gi, " ").replace(/\s+/g, " ").trim();
            const normState = cleanState.toLowerCase().replace(/[^\w\s]/gi, " ").replace(/\s+/g, " ").trim();
            personVenueKey = `${normName}|${normVenue}|${normCity}|${normState}`;
          } else {
            personVenueKey = `${cleanName.toUpperCase()}|${cleanMobile.replace(/\D/g, "")}|${cleanVenue.toUpperCase()}`;
          }

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
          srNo,
          certificateNumber: cleanCertId,
          participantName: cleanName,
          mobileNumber: cleanMobile,
          email: email.trim(),
          zone: zone.trim(),
          state: cleanState,
          city: cleanCity,
          courseCoordinator: coordinator.trim(),
          courseCoordinatorEmail: coordinatorEmail.trim(),
          venueName: cleanVenue,
          driveLink: driveLink.trim(),
          driveFileId,
          downloadUrl,
          previewUrl,
          issueDate: dateVal,
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

function normalizeStateMatch(state: string): string {
  const s = (state || "").trim().toLowerCase();
  if (s === "jammu and kashmir" || s === "jammu & kashmir") return "jammu & kashmir";
  return s;
}

function normalizeVenueMatch(venue: string): string {
  const v = (venue || "").trim().toLowerCase();
  if (
    v.includes("jindal super special") ||
    v.includes("jindal super specialty") ||
    v.includes("jindal super speciality")
  ) {
    return "jindal super speciality hospital";
  }
  return v;
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
      let stateName = r.state.trim();
      if (stateName.toLowerCase() === "jammu and kashmir" || stateName.toLowerCase() === "jammu & kashmir") {
        stateName = "Jammu & Kashmir";
      }
      const key = stateName.toLowerCase();
      if (!map.has(key)) {
        const formatted = stateName === "Jammu & Kashmir"
          ? "Jammu & Kashmir"
          : stateName
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
  const cleanState = normalizeStateMatch(state);
  const all = getAllCPRCertificates(portal);
  const map = new Map<string, string>();
  for (const r of all) {
    if (normalizeStateMatch(r.state) === cleanState && r.city && r.city.trim().length > 0) {
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
  const cleanState = normalizeStateMatch(state);
  const cleanCity = city.trim().toLowerCase();
  const all = getAllCPRCertificates(portal);
  const venuesSet = new Set<string>();
  for (const r of all) {
    if (
      normalizeStateMatch(r.state) === cleanState &&
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
  const cleanState = normalizeStateMatch(state);
  const cleanCity = city.trim().toLowerCase();
  const cleanVenue = normalizeVenueMatch(venue);
  const all = getAllCPRCertificates(portal);
  const nameMap = new Map<string, string>();
  for (const r of all) {
    if (
      normalizeStateMatch(r.state) === cleanState &&
      r.city.trim().toLowerCase() === cleanCity &&
      normalizeVenueMatch(r.venueName) === cleanVenue &&
      r.participantName &&
      r.participantName.trim().length > 0
    ) {
      const rawName = r.participantName.trim();
      const normKey = rawName
        .toLowerCase()
        .replace(/^(mr\.|mr|mrs\.|mrs|ms\.|ms|dr\.|dr)\s+/i, "")
        .replace(/[^\w\s]/gi, "")
        .replace(/\s+/g, " ")
        .trim();

      if (!nameMap.has(normKey)) {
        nameMap.set(normKey, rawName);
      } else {
        // Prefer uppercase master string if available
        const existing = nameMap.get(normKey)!;
        if (rawName === rawName.toUpperCase() && existing !== existing.toUpperCase()) {
          nameMap.set(normKey, rawName);
        }
      }
    }
  }
  return Array.from(nameMap.values()).sort((a, b) => a.localeCompare(b));
}

export function searchCertificateByHierarchy(
  state: string,
  city: string,
  venue: string,
  participantName: string,
  portal: CPRCertificatePortal = "participant"
): CPRCertificateRecord[] {
  const cleanState = normalizeStateMatch(state);
  const cleanCity = city.trim().toLowerCase();
  const cleanVenue = normalizeVenueMatch(venue);
  const cleanName = participantName.trim().toLowerCase();

  const all = getAllCPRCertificates(portal);
  const matches = all.filter((r) => {
    const matchState = normalizeStateMatch(r.state) === cleanState;
    const matchCity = r.city.trim().toLowerCase() === cleanCity;
    const matchVenue = normalizeVenueMatch(r.venueName) === cleanVenue;
    const rName = r.participantName.trim().toLowerCase();
    const matchName = rName === cleanName || (cleanName.length >= 3 && rName.includes(cleanName));
    return matchState && matchCity && matchVenue && matchName;
  });

  // Deduplicate by person identity (same name, mobile number, venue, city, and state)
  const seen = new Set<string>();
  const deduplicated: CPRCertificateRecord[] = [];

  for (const r of matches) {
    const normName = (r.participantName || "").trim().toLowerCase().replace(/\s+/g, " ").replace(/[^\w\s]/gi, "");
    const normVenue = normalizeVenueMatch(r.venueName || "").replace(/\s+/g, " ").replace(/[^\w\s]/gi, "");
    const normCity = (r.city || "").trim().toLowerCase().replace(/\s+/g, " ");
    const normState = normalizeStateMatch(r.state || "").replace(/\s+/g, " ");
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

