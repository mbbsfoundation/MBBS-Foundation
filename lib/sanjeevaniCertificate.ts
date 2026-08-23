import fs from "fs";
import path from "path";

export type CertificateCategory = "CPR_DAY" | "SANJEEVANI" | "CPR_CHAMPION" | "CPR_FACILITY" | "COURSE_COORDINATOR";

export interface UnifiedCertData {
  category?: CertificateCategory;
  participantName: string;
  date: string;
  venue: string;
  city: string;
  state: string;
  stateCode: string;
  certificateId: string;
  courseCoordinator?: string;
}

export type SanjeevaniCertData = UnifiedCertData;

let cachedSanjeevaniSvg: string | null = null;
let cachedCprDaySvg: string | null = null;
let cachedChampionSvg: string | null = null;
let cachedFacilitySvg: string | null = null;
let cachedCoordinatorSvg: string | null = null;

export function invalidateSvgCache() {
  cachedSanjeevaniSvg = null;
  cachedCprDaySvg = null;
  cachedChampionSvg = null;
  cachedFacilitySvg = null;
  cachedCoordinatorSvg = null;
}

/**
 * Loads the master SVG certificate template from disk for the specified category.
 */
export function getMasterSvgTemplate(category: CertificateCategory = "SANJEEVANI"): string {
  if (category === "CPR_DAY") {
    if (cachedCprDaySvg) return cachedCprDaySvg;

    const primaryPath = path.join(process.cwd(), "cprsanjeevani", "Lay Rescuer CPR Day.svg");
    if (fs.existsSync(primaryPath)) {
      cachedCprDaySvg = fs.readFileSync(primaryPath, "utf-8");
      return cachedCprDaySvg;
    }

    const fallbackPath = path.join(process.cwd(), "public", "cprsanjeevani", "Lay Rescuer CPR Day.svg");
    if (fs.existsSync(fallbackPath)) {
      cachedCprDaySvg = fs.readFileSync(fallbackPath, "utf-8");
      return cachedCprDaySvg;
    }

    throw new Error("Master SVG template 'Lay Rescuer CPR Day.svg' not found in cprsanjeevani directory.");
  }

  if (category === "CPR_CHAMPION") {
    if (cachedChampionSvg) return cachedChampionSvg;

    const possiblePaths = [
      path.join(process.cwd(), "cprsanjeevani", "CPR Champions.svg"),
      path.join(process.cwd(), "cprsanjeevani", "cprchampions.svg"),
      path.join(process.cwd(), "public", "cprsanjeevani", "CPR Champions.svg"),
      path.join(process.cwd(), "public", "cprsanjeevani", "cprchampions.svg"),
    ];

    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        cachedChampionSvg = fs.readFileSync(p, "utf-8");
        return cachedChampionSvg;
      }
    }

    throw new Error("Master SVG template 'CPR Champions.svg' / 'cprchampions.svg' not found in cprsanjeevani directory.");
  }

  if (category === "COURSE_COORDINATOR") {
    if (cachedCoordinatorSvg) return cachedCoordinatorSvg;

    const possiblePaths = [
      path.join(process.cwd(), "cprsanjeevani", "Course Coordinator.svg"),
      path.join(process.cwd(), "cprsanjeevani", "CourseCoordinator.svg"),
      path.join(process.cwd(), "cprsanjeevani", "course_coordinator.svg"),
      path.join(process.cwd(), "public", "cprsanjeevani", "Course Coordinator.svg"),
    ];

    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        cachedCoordinatorSvg = fs.readFileSync(p, "utf-8");
        return cachedCoordinatorSvg;
      }
    }

    throw new Error("Master SVG template 'Course Coordinator.svg' not found in cprsanjeevani directory.");
  }

  if (category === "CPR_FACILITY") {
    if (cachedFacilitySvg) return cachedFacilitySvg;

    const primaryPath = path.join(process.cwd(), "cprsanjeevani", "CPR Facility Certificate.svg");
    if (fs.existsSync(primaryPath)) {
      cachedFacilitySvg = fs.readFileSync(primaryPath, "utf-8");
      return cachedFacilitySvg;
    }

    const fallbackPath = path.join(process.cwd(), "public", "cprsanjeevani", "CPR Facility Certificate.svg");
    if (fs.existsSync(fallbackPath)) {
      cachedFacilitySvg = fs.readFileSync(fallbackPath, "utf-8");
      return cachedFacilitySvg;
    }

    throw new Error("Master SVG template 'CPR Facility Certificate.svg' not found in cprsanjeevani directory.");
  }

  // Default: SANJEEVANI
  if (cachedSanjeevaniSvg) {
    return cachedSanjeevaniSvg;
  }

  const primaryPath = path.join(process.cwd(), "cprsanjeevani", "cpr sanjeevani certificate 2.svg");
  if (fs.existsSync(primaryPath)) {
    cachedSanjeevaniSvg = fs.readFileSync(primaryPath, "utf-8");
    return cachedSanjeevaniSvg;
  }

  const fallbackPath = path.join(process.cwd(), "public", "cprsanjeevani", "cpr sanjeevani certificate 2.svg");
  if (fs.existsSync(fallbackPath)) {
    cachedSanjeevaniSvg = fs.readFileSync(fallbackPath, "utf-8");
    return cachedSanjeevaniSvg;
  }

  throw new Error("Master SVG template 'cpr sanjeevani certificate 2.svg' not found in cprsanjeevani directory.");
}

/**
 * Escape XML special characters.
 */
function escapeXml(unsafe: string): string {
  return (unsafe || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Formats the venue string as "Venue, City, State".
 * Cleans up extra commas or repeated parts if present.
 */
export function formatVenueString(venue: string, city: string, state: string): string {
  const parts: string[] = [];
  const v = (venue || "").trim();
  const c = (city || "").trim();
  const s = (state || "").trim();

  if (v) parts.push(v);
  if (c && !v.toLowerCase().endsWith(c.toLowerCase())) parts.push(c);
  if (s && !v.toLowerCase().endsWith(s.toLowerCase()) && !c.toLowerCase().endsWith(s.toLowerCase())) parts.push(s);

  return parts.join(", ");
}

/**
 * Calculates optimal font size for participant/champion name to prevent overflowing.
 * Base size is 850px.
 */
function calculateNameFontSize(name: string): number {
  const length = (name || "").trim().length;
  if (length <= 20) return 850;
  if (length <= 28) return Math.round(850 * (20 / length));
  if (length <= 40) return Math.round(700 * (25 / length));
  return Math.max(380, Math.round(600 * (30 / length)));
}

/**
 * Calculates optimal font size for venue string.
 * Base size is 480px.
 */
function calculateVenueFontSize(venueText: string): number {
  const length = (venueText || "").trim().length;
  if (length <= 45) return 480;
  if (length <= 65) return Math.round(480 * (45 / length));
  return Math.max(320, Math.round(420 * (55 / length)));
}

/**
 * Renders the Facility / Venue name with dynamic auto-scaling and 2-line wrapping for long names.
 */
function renderFacilityVenueText(venueStr: string): string {
  const clean = (venueStr || "").trim();
  const length = clean.length;

  if (length <= 45) {
    const fontSize = length <= 25 ? 850 : Math.round(850 * (25 / length));
    return `<text x="14878" y="9050" text-anchor="middle" style="font-size:${fontSize}px; font-weight:bold; fill:#001045; font-family:'Times New Roman', serif;">${escapeXml(clean)}</text>`;
  }

  // 2-line wrapped text
  let splitIdx = -1;
  const mid = Math.floor(length / 2);

  // Search for comma near midpoint
  for (let offset = 0; offset <= 20; offset++) {
    if (mid + offset < length && clean[mid + offset] === ",") {
      splitIdx = mid + offset + 1;
      break;
    }
    if (mid - offset >= 0 && clean[mid - offset] === ",") {
      splitIdx = mid - offset + 1;
      break;
    }
  }

  // Search for space near midpoint
  if (splitIdx === -1) {
    for (let offset = 0; offset <= 20; offset++) {
      if (mid + offset < length && clean[mid + offset] === " ") {
        splitIdx = mid + offset;
        break;
      }
      if (mid - offset >= 0 && clean[mid - offset] === " ") {
        splitIdx = mid - offset;
        break;
      }
    }
  }

  if (splitIdx === -1) {
    splitIdx = mid;
  }

  const line1 = clean.substring(0, splitIdx).trim();
  const line2 = clean.substring(splitIdx).trim();

  const maxLineLen = Math.max(line1.length, line2.length);
  const fontSize = maxLineLen <= 35 ? 650 : Math.max(400, Math.round(650 * (35 / maxLineLen)));

  return `
    <text x="14878" y="8650" text-anchor="middle" style="font-size:${fontSize}px; font-weight:bold; fill:#001045; font-family:'Times New Roman', serif;">${escapeXml(line1)}</text>
    <text x="14878" y="9450" text-anchor="middle" style="font-size:${fontSize}px; font-weight:bold; fill:#001045; font-family:'Times New Roman', serif;">${escapeXml(line2)}</text>
  `;
}

/**
 * Formats a clean, standard file name for downloading individual certificates:
 * Examples:
 * - IAPCPR-PA-ML-0206_Amit-Sharma.pdf
 * - IAPCPR-CH-ML-0206_Dr-Amit-Sharma.pdf
 * - IAP-CPR-Day-Venue-AN-101_Kendriya-Vidyalaya-No-2.pdf
 */
export function formatCertificateFilename(
  certificateId: string,
  participantOrVenueName: string,
  extension: "pdf" | "png" | "svg" = "pdf"
): string {
  const sanitizedCertId = (certificateId || "IAPCPR-Certificate")
    .replace(/\//g, "-")
    .replace(/[^a-zA-Z0-9_-]/g, "");

  const sanitizedName = (participantOrVenueName || "Certificate")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9_-]/g, "")
    .substring(0, 50);

  return `${sanitizedCertId}_${sanitizedName}.${extension}`;
}

/**
 * Generates the dynamic SVG string for CPR Day, Sanjeevani, CPR Champion, or CPR Facility certificates
 * by injecting dynamic placeholders into the appropriate master SVG template while preserving
 * all existing elements, fonts, logos, borders, and signatures.
 */
export function generateUnifiedCertificateSvg(data: UnifiedCertData): string {
  const category: CertificateCategory = data.category || "SANJEEVANI";
  const masterSvg = getMasterSvgTemplate(category);

  const name = data.participantName.trim();
  const date = data.date.trim();
  const venueFormatted = formatVenueString(data.venue, data.city, data.state);
  const certId = data.certificateId.trim();

  const nameFontSize = calculateNameFontSize(name);
  const venueFontSize = calculateVenueFontSize(venueFormatted);

  const escapedName = escapeXml(name);
  const escapedDate = escapeXml(date);
  const escapedVenue = escapeXml(venueFormatted);
  const escapedCertId = escapeXml(certId);

  // Dynamic text layer injected before </svg>
  let dynamicLayer = "";

  if (category === "CPR_FACILITY") {
    // Template: CPR Facility Certificate.svg (viewBox: 0 0 29757.18 20999.92)
    // Dynamic Fields: 1. Venue/Facility Name (with location), 2. Facility Code / Certificate ID
    const venueTextRender = renderFacilityVenueText(data.venue ? formatVenueString(data.venue, data.city, data.state) : name);

    dynamicLayer = `
  <!-- Dynamic CPR Facility Certificate Fields -->
  <g id="cprfacility-dynamic-fields" style="font-family:'Times New Roman', Times, serif; text-rendering:geometricPrecision; shape-rendering:geometricPrecision;">
    <!-- 1. Facility / Venue Name -->
    ${venueTextRender}
    
    <!-- 2. Facility Code / Certificate ID (Inside Right Badge) -->
    <text x="24912.24" y="12720" text-anchor="middle" style="font-size:460px; font-weight:bold; fill:#001045; font-family:Arial, Helvetica, sans-serif; letter-spacing:1px;">${escapedCertId}</text>
  </g>
</svg>`;
  } else if (category === "CPR_DAY") {
    // Template: Lay Rescuer CPR Day.svg (viewBox: 0 0 29756.48 21007.29)
    dynamicLayer = `
  <!-- Dynamic CPR Day Participant Certificate Fields -->
  <g id="cprday-dynamic-fields" style="font-family:'Times New Roman', Times, serif; text-rendering:geometricPrecision; shape-rendering:geometricPrecision;">
    <!-- 1. Participant Name -->
    <text x="14878" y="11200" text-anchor="middle" style="font-size:${nameFontSize}px; font-weight:bold; fill:#001045; font-family:'Times New Roman', serif;">${escapedName}</text>
    
    <!-- 2. Venue, City, State -->
    <text x="14878" y="16150" text-anchor="middle" style="font-size:${venueFontSize}px; font-weight:bold; fill:#001045; font-family:'Times New Roman', serif;">${escapedVenue}</text>
    
    <!-- 3. Certificate ID (Formatted in right Certificate ID badge) -->
    <text x="25219.8" y="14250" text-anchor="middle" style="font-size:460px; font-weight:bold; fill:#001045; font-family:Arial, Helvetica, sans-serif; letter-spacing:1px;">${escapedCertId}</text>
  </g>
</svg>`;
  } else if (category === "CPR_CHAMPION") {
    // Template: CPR Champions.svg (viewBox: 0 0 29753.72 20998.7)
    dynamicLayer = `
  <!-- Dynamic CPR Champion Certificate Fields -->
  <g id="cprchampion-dynamic-fields" style="font-family:'Times New Roman', Times, serif; text-rendering:geometricPrecision; shape-rendering:geometricPrecision;">
    <!-- 1. CPR Champion Name -->
    <text x="14878" y="8680" text-anchor="middle" style="font-size:${nameFontSize}px; font-weight:bold; fill:#001045; font-family:'Times New Roman', serif;">${escapedName}</text>
    
    <!-- 2. Course Date -->
    <text x="14878" y="14850" text-anchor="middle" style="font-size:500px; font-weight:bold; fill:#001045; font-family:'Times New Roman', serif;">${escapedDate}</text>
    
    <!-- 3. Venue, City, State -->
    <text x="14878" y="16300" text-anchor="middle" style="font-size:${venueFontSize}px; font-weight:bold; fill:#001045; font-family:'Times New Roman', serif;">${escapedVenue}</text>
    
    <!-- 4. Certificate ID -->
    <text x="24606.72" y="12080" text-anchor="middle" style="font-size:460px; font-weight:bold; fill:#001045; font-family:Arial, Helvetica, sans-serif; letter-spacing:1px;">${escapedCertId}</text>
  </g>
</svg>`;
  } else if (category === "COURSE_COORDINATOR") {
    // Template: Course Coordinator.svg (viewBox: 0 0 29753.3 21007.51)
    dynamicLayer = `
  <!-- Dynamic Course Coordinator Certificate Fields -->
  <g id="cprcoordinator-dynamic-fields" style="font-family:'Times New Roman', Times, serif; text-rendering:geometricPrecision; shape-rendering:geometricPrecision;">
    <!-- 1. Coordinator Name -->
    <text x="14878" y="8680" text-anchor="middle" style="font-size:${nameFontSize}px; font-weight:bold; fill:#001045; font-family:'Times New Roman', serif;">${escapedName}</text>
    
    <!-- 2. Course Date -->
    <text x="14878" y="14850" text-anchor="middle" style="font-size:500px; font-weight:bold; fill:#001045; font-family:'Times New Roman', serif;">${escapedDate}</text>
    
    <!-- 3. Venue, City, State -->
    <text x="14878" y="16300" text-anchor="middle" style="font-size:${venueFontSize}px; font-weight:bold; fill:#001045; font-family:'Times New Roman', serif;">${escapedVenue}</text>
    
    <!-- 4. Certificate ID -->
    <text x="24606.72" y="12080" text-anchor="middle" style="font-size:460px; font-weight:bold; fill:#001045; font-family:Arial, Helvetica, sans-serif; letter-spacing:1px;">${escapedCertId}</text>
  </g>
</svg>`;
  } else {
    // Template: cpr sanjeevani certificate 2.svg (viewBox: 0 0 29700 21000)
    dynamicLayer = `
  <!-- Dynamic CPR Sanjeevani Certificate Fields -->
  <g id="sanjeevani-dynamic-fields" style="font-family:'Times New Roman', Times, serif; text-rendering:geometricPrecision; shape-rendering:geometricPrecision;">
    <!-- 1. Participant Name -->
    <text x="14850" y="11220" text-anchor="middle" style="font-size:${nameFontSize}px; font-weight:bold; fill:#001045; font-family:'Times New Roman', serif;">${escapedName}</text>
    
    <!-- 2. Course Date -->
    <text x="14850" y="14850" text-anchor="middle" style="font-size:520px; font-weight:bold; fill:#001045; font-family:'Times New Roman', serif;">${escapedDate}</text>
    
    <!-- 3. Venue, City, State -->
    <text x="14850" y="16150" text-anchor="middle" style="font-size:${venueFontSize}px; font-weight:bold; fill:#001045; font-family:'Times New Roman', serif;">${escapedVenue}</text>
    
    <!-- 4. Certificate ID -->
    <text x="25191.48" y="14250" text-anchor="middle" style="font-size:460px; font-weight:bold; fill:#001045; font-family:Arial, Helvetica, sans-serif; letter-spacing:1px;">${escapedCertId}</text>
  </g>
</svg>`;
  }

  // Ensure preserveAspectRatio is present for responsive scaling
  let processedMasterSvg = masterSvg;
  if (!processedMasterSvg.includes("preserveAspectRatio")) {
    processedMasterSvg = processedMasterSvg.replace(
      "<svg ",
      '<svg preserveAspectRatio="xMidYMid meet" '
    );
  }

  // Replace closing </svg> with our dynamic text layer
  if (processedMasterSvg.includes("</svg>")) {
    return processedMasterSvg.replace("</svg>", dynamicLayer);
  }

  return processedMasterSvg + dynamicLayer;
}

/**
 * Backward-compatible wrapper for generating Sanjeevani SVGs.
 */
export function generateSanjeevaniSvg(data: SanjeevaniCertData): string {
  return generateUnifiedCertificateSvg({
    ...data,
    category: data.category || "SANJEEVANI",
  });
}
