import fs from "fs";
import path from "path";

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
};

/**
 * Extracts Google Drive File ID from standard view/share links
 */
export function extractGoogleDriveFileId(url: string): string {
  if (!url) return "";
  const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (match && match[1]) return match[1];
  const idMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idMatch && idMatch[1]) return idMatch[1];
  return "";
}

/**
 * CSV Line Parser handling quotes and commas within quotes
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current.trim().replace(/^"|"$/g, ""));
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim().replace(/^"|"$/g, ""));
  return result;
}

/**
 * Dynamically loads and parses all CSV files in cprcertificates directory
 */
export function getAllCPRCertificates(): CPRCertificateRecord[] {
  const certsDir = path.join(process.cwd(), "cprcertificates");
  if (!fs.existsSync(certsDir)) return [];

  const files = fs.readdirSync(certsDir);
  const csvFiles = files.filter((file) => file.endsWith(".csv") || file.endsWith(".CSV"));

  const records: CPRCertificateRecord[] = [];
  const seenIds = new Set<string>();

  for (const file of csvFiles) {
    try {
      const filePath = path.join(certsDir, file);
      const content = fs.readFileSync(filePath, "utf8");
      const cleanContent = content.replace(/^\uFEFF/, "");
      const lines = cleanContent.split(/\r?\n/).filter((l) => l.trim().length > 0);

      if (lines.length <= 1) continue;

      // Find header indices dynamically
      const headers = parseCSVLine(lines[0]).map((h) => h.toLowerCase().trim());

      const certIdIdx = headers.findIndex(
        (h) =>
          h.includes("certificate id") ||
          h.includes("cert id") ||
          h.includes("cert no") ||
          h.includes("certificate no") ||
          h.includes("cert_id") ||
          h.includes("certificate_id")
      );

      const nameIdx = headers.findIndex(
        (h) =>
          h.includes("name of participant") ||
          h.includes("participant name") ||
          h.includes("full name") ||
          h.includes("participant") ||
          h.includes("name")
      );

      const mobileIdx = headers.findIndex(
        (h) => h.includes("mobile") || h.includes("phone") || h.includes("contact")
      );

      const emailIdx = headers.findIndex(
        (h) => (h.includes("email") || h.includes("mail")) && !h.includes("coordinator")
      );

      const zoneIdx = headers.findIndex((h) => h.includes("zone"));
      const stateIdx = headers.findIndex((h) => h.includes("state"));
      const cityIdx = headers.findIndex((h) => h.includes("city") || h.includes("district"));

      const coordinatorIdx = headers.findIndex(
        (h) => (h.includes("coordinator") || h.includes("instructor")) && !h.includes("email")
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

      for (let i = 1; i < lines.length; i++) {
        const cols = parseCSVLine(lines[i]);
        if (cols.length < 3) continue;

        const certId = cols[certIdIdx >= 0 ? certIdIdx : 1] || "";
        const name = cols[nameIdx >= 0 ? nameIdx : 2] || "";
        const mobile = cols[mobileIdx >= 0 ? mobileIdx : 3] || "";
        const email = cols[emailIdx >= 0 ? emailIdx : 4] || "";
        const zone = cols[zoneIdx >= 0 ? zoneIdx : 5] || "";
        const state = cols[stateIdx >= 0 ? stateIdx : 6] || "";
        const city = cols[cityIdx >= 0 ? cityIdx : 7] || "";
        const coordinator = cols[coordinatorIdx >= 0 ? coordinatorIdx : 8] || "";
        const coordinatorEmail = cols[coordinatorEmailIdx >= 0 ? coordinatorEmailIdx : 9] || "";
        const venue = cols[venueIdx >= 0 ? venueIdx : 10] || "";
        const driveLink = cols[driveLinkIdx >= 0 ? driveLinkIdx : 11] || "";

        const cleanCertId = certId.trim();
        const cleanName = name.trim();

        if (!cleanCertId && !cleanName) continue;

        const driveFileId = extractGoogleDriveFileId(driveLink);
        const downloadUrl = driveFileId
          ? `https://drive.google.com/uc?export=download&id=${driveFileId}`
          : driveLink;
        const previewUrl = driveFileId
          ? `https://drive.google.com/file/d/${driveFileId}/preview`
          : driveLink;

        const recordKey = cleanCertId.toUpperCase() || `${cleanName.toUpperCase()}-${mobile.trim()}`;
        if (cleanCertId && seenIds.has(recordKey)) continue;
        if (cleanCertId) seenIds.add(recordKey);

        records.push({
          srNo: cols[0] || "",
          certificateNumber: cleanCertId,
          participantName: cleanName,
          mobileNumber: mobile.trim(),
          email: email.trim(),
          zone: zone.trim(),
          state: state.trim(),
          city: city.trim(),
          courseCoordinator: coordinator.trim(),
          courseCoordinatorEmail: coordinatorEmail.trim(),
          venueName: venue.trim(),
          driveLink: driveLink.trim(),
          driveFileId,
          downloadUrl,
          previewUrl,
          issueDate: "21 July 2026",
          status: "GENERATED",
          category: "CPR Aware Citizen",
          courseTitle: "National IAP CPR Sanjeevani Training Program",
        });
      }
    } catch (err) {
      console.error(`Error reading CSV file ${file}:`, err);
    }
  }

  return records;
}

export function searchCertificateById(id: string): CPRCertificateRecord | null {
  const cleanInput = id.trim().toUpperCase();
  if (!cleanInput) return null;
  const all = getAllCPRCertificates();
  return (
    all.find((c) => c.certificateNumber.trim().toUpperCase() === cleanInput) || null
  );
}

export function searchCertificatesByQuery(query: string): CPRCertificateRecord[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const qDigits = q.replace(/\D/g, "");

  const all = getAllCPRCertificates();
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

export function searchCertificatesByVenueOrCode(code: string): CPRCertificateRecord[] {
  const q = code.trim().toLowerCase();
  const all = getAllCPRCertificates();
  return all.filter((c) => {
    return (
      c.venueName.toLowerCase().includes(q) ||
      c.city.toLowerCase().includes(q) ||
      c.state.toLowerCase().includes(q) ||
      c.certificateNumber.toLowerCase().includes(q)
    );
  });
}

