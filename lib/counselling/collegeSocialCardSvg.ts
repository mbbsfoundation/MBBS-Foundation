import type { DomicileCollegeSummary, CollegeRound1CategoryProfile } from "./evidenceTypes";
import { getStudentFriendlyQuotaLabel } from "./pathwayOrdering";
import { EMBEDDED_FONT_STYLE } from "./fonts/embeddedFonts";

export type CollegeEvidenceForCard = DomicileCollegeSummary & { city?: string | null; address?: string | null };

function escapeXml(str: string | number | null | undefined): string {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

interface FormatNameResult {
  lines: { text: string; fontSize: number; fontWeight: number; fill: string; yOffset: number }[];
}

function cleanStateName(state: string): { display: string; shortUpper: string } {
  const trimmed = state.trim();
  const lower = trimmed.toLowerCase();

  if (lower.includes("dadra") || lower.includes("daman")) {
    return { display: "D&NH and D&D", shortUpper: "D&NH & DD" };
  }
  if (lower.includes("andaman") || lower.includes("nicobar")) {
    return { display: "A&N Islands", shortUpper: "A&N ISLANDS" };
  }
  if (lower.includes("jammu") && lower.includes("kashmir")) {
    return { display: "Jammu & Kashmir", shortUpper: "JAMMU & KASHMIR" };
  }

  return { display: trimmed, shortUpper: trimmed.toUpperCase() };
}

export function formatCollegeName(name: string): FormatNameResult {
  let cleanName = name.trim().replace(/\s+/g, " ");

  // Handle specific address suffix noise if in name
  cleanName = cleanName.replace(/,\s*U\.?T\.?/i, "").replace(/,\s*UT/i, "");

  const len = cleanName.length;

  // Case 1: Short name (<= 45 chars)
  if (len <= 45) {
    if (cleanName.includes(",")) {
      const parts = cleanName.split(",");
      const line1 = parts[0].trim() + ",";
      const line2 = parts.slice(1).join(",").trim();
      return {
        lines: [
          { text: line1, fontSize: 44, fontWeight: 900, fill: "#082046", yOffset: 40 },
          { text: line2, fontSize: 48, fontWeight: 900, fill: "#082046", yOffset: 90 },
        ],
      };
    }

    // Split at space nearest midpoint if length > 22
    if (len > 22 && cleanName.includes(" ")) {
      const words = cleanName.split(" ");
      let mid = Math.ceil(words.length / 2);
      const line1 = words.slice(0, mid).join(" ");
      const line2 = words.slice(mid).join(" ");
      return {
        lines: [
          { text: line1, fontSize: 42, fontWeight: 900, fill: "#082046", yOffset: 40 },
          { text: line2, fontSize: 46, fontWeight: 900, fill: "#082046", yOffset: 88 },
        ],
      };
    }

    return {
      lines: [{ text: cleanName, fontSize: 46, fontWeight: 900, fill: "#082046", yOffset: 65 }],
    };
  }

  // Case 2: Medium name (46 - 85 chars)
  if (len <= 85) {
    const words = cleanName.split(" ");
    const lines: string[] = [];
    let currentLine = "";

    for (const word of words) {
      if ((currentLine + " " + word).trim().length <= 30) {
        currentLine = (currentLine + " " + word).trim();
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine) lines.push(currentLine);

    if (lines.length === 2) {
      return {
        lines: [
          { text: lines[0], fontSize: 34, fontWeight: 900, fill: "#082046", yOffset: 38 },
          { text: lines[1], fontSize: 34, fontWeight: 900, fill: "#082046", yOffset: 80 },
        ],
      };
    }

    return {
      lines: [
        { text: lines[0] || "", fontSize: 28, fontWeight: 900, fill: "#082046", yOffset: 28 },
        { text: lines[1] || "", fontSize: 28, fontWeight: 900, fill: "#082046", yOffset: 60 },
        { text: lines.slice(2).join(" "), fontSize: 28, fontWeight: 900, fill: "#082046", yOffset: 92 },
      ],
    };
  }

  // Case 3: Long name (> 85 chars)
  // Check for (Formerly... ) sub-clause
  let mainPart = cleanName;
  let subPart = "";
  const match = cleanName.match(/(.*?)\s*(\((?:formerly|prev).*?\))\s*(.*)/i);
  if (match) {
    mainPart = (match[1] + " " + (match[3] || "")).trim();
    subPart = match[2].trim();
  }

  const words = mainPart.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    if ((currentLine + " " + word).trim().length <= 35) {
      currentLine = (currentLine + " " + word).trim();
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);

  if (subPart) {
    return {
      lines: [
        { text: lines[0] || "", fontSize: 25, fontWeight: 900, fill: "#082046", yOffset: 25 },
        { text: lines.slice(1).join(" ") || "", fontSize: 25, fontWeight: 900, fill: "#082046", yOffset: 54 },
        { text: subPart, fontSize: 17, fontWeight: 700, fill: "#64748b", yOffset: 84 },
      ],
    };
  }

  return {
    lines: [
      { text: lines[0] || "", fontSize: 25, fontWeight: 900, fill: "#082046", yOffset: 26 },
      { text: lines[1] || "", fontSize: 25, fontWeight: 900, fill: "#082046", yOffset: 56 },
      { text: lines.slice(2).join(" "), fontSize: 25, fontWeight: 900, fill: "#082046", yOffset: 86 },
    ],
  };
}

export function generateCollegeSocialCardSvg(
  college: CollegeEvidenceForCard | null,
  primaryBenchmark: CollegeRound1CategoryProfile | null
): string {
  if (!college) {
    return generateNotFoundSvg();
  }

  // 1. College Identity
  const nameFormatting = formatCollegeName(college.collegeName);
  const stateInfo = cleanStateName(college.state || "");
  const rawCity = college.city || (college.collegeName.includes(",") ? college.collegeName.split(",")[1].trim() : "");
  const cityMatch = rawCity && !rawCity.includes("(") && rawCity.length <= 25 ? rawCity : (college.city || "");
  const locationStr = cityMatch
    ? `${cityMatch}, ${stateInfo.display}`
    : stateInfo.display;

  // 2. Classification
  let classificationBadge = "Government Medical College";
  let managementDisplay = "GOVERNMENT";

  if (college.isINI || college.managementType === "INI") {
    classificationBadge = "Institute of National Importance (INI)";
    managementDisplay = "CENTRAL / INI";
  } else if (college.isDeemed) {
    classificationBadge = "Deemed University";
    managementDisplay = "DEEMED";
  } else if (college.isCentralUniversity) {
    classificationBadge = "Central University";
    managementDisplay = "CENTRAL";
  } else if (college.isESIC) {
    classificationBadge = "ESIC Medical College";
    managementDisplay = "GOVERNMENT";
  } else if (college.managementType === "GOVERNMENT") {
    classificationBadge = "Government Medical College";
    managementDisplay = "GOVERNMENT";
  } else {
    classificationBadge = "Private Medical College";
    managementDisplay = "PRIVATE";
  }

  const isGreenBadge =
    college.managementType === "GOVERNMENT" ||
    college.isINI ||
    college.managementType === "INI";

  const totalSeats = college.totalMBBSSeats2026 || 0;
  const stateUpper = stateInfo.shortUpper;

  // 3. AIR Evidence / Fallback Panel
  let evidencePanelSvg = "";

  if (primaryBenchmark && primaryBenchmark.medianAIR) {
    const medianStr = primaryBenchmark.medianAIR.toLocaleString("en-IN");
    const bestStr = primaryBenchmark.bestAIR
      ? primaryBenchmark.bestAIR.toLocaleString("en-IN")
      : "—";
    const lastStr = primaryBenchmark.highestAIR
      ? primaryBenchmark.highestAIR.toLocaleString("en-IN")
      : "—";
    const pathwayLabel = getStudentFriendlyQuotaLabel(primaryBenchmark.quota);
    const categoryLabel =
      primaryBenchmark.seatCategory === "OPEN"
        ? "Open Category"
        : `${primaryBenchmark.seatCategory} Category`;
    const count = primaryBenchmark.seatsAllotted || 0;
    const countStr = `${count} observed ${
      primaryBenchmark.seatCategory === "OPEN" ? "Open " : ""
    }allotment${count === 1 ? "" : "s"}`;

    evidencePanelSvg = `
      <!-- Deep Navy Rounded Container -->
      <rect x="0" y="0" width="636" height="192" rx="18" ry="18" fill="url(#navyPanelGrad)" stroke="#1e3a8a" stroke-width="1.5" />

      <!-- Left Column: BEST AIR -->
      <!-- DYNAMIC: BEST_AIR -->
      <g transform="translate(20, 18)">
        <!-- Green Trend Up Icon -->
        <g transform="translate(32, 0)">
          <circle cx="24" cy="24" r="24" fill="#06281e" stroke="#22c55e" stroke-width="2.5" />
          <path d="M 14 30 L 22 22 L 27 27 L 35 17" fill="none" stroke="#22c55e" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
          <path d="M 28 17 L 35 17 L 35 24" fill="none" stroke="#22c55e" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
        </g>
        <text x="56" y="68" text-anchor="middle" class="font-sans" font-size="13.5" font-weight="800" fill="#ffffff" letter-spacing="0.5">BEST AIR</text>
        <text x="56" y="112" text-anchor="middle" class="font-sans" font-size="42" font-weight="900" fill="#22c55e">${escapeXml(
          bestStr
        )}</text>
      </g>

      <!-- Vertical Divider 1 -->
      <line x1="148" y1="24" x2="148" y2="136" stroke="#1e3a8a" stroke-width="1.5" />

      <!-- Center Column: TYPICAL (MEDIAN) AIR (DOMINANT NUMERIC) -->
      <!-- DYNAMIC: TYPICAL_MEDIAN_AIR -->
      <g transform="translate(160, 16)">
        <!-- Decorative Gold Rules Flanking Header -->
        <line x1="12" y1="16" x2="58" y2="16" stroke="#ca8a04" stroke-width="1.5" />
        <line x1="262" y1="16" x2="308" y2="16" stroke="#ca8a04" stroke-width="1.5" />
        
        <text x="160" y="21" text-anchor="middle" class="font-sans" font-size="16" font-weight="900" fill="#ffffff" letter-spacing="1.5">
          TYPICAL (MEDIAN) AIR
        </text>

        <text x="160" y="110" text-anchor="middle" class="font-sans" font-size="${
          medianStr.length > 5 ? 74 : 84
        }" font-weight="900" fill="url(#goldGrad)" letter-spacing="-2">
          ${escapeXml(medianStr)}
        </text>
      </g>

      <!-- Vertical Divider 2 -->
      <line x1="492" y1="24" x2="492" y2="136" stroke="#1e3a8a" stroke-width="1.5" />

      <!-- Right Column: LAST OBSERVED AIR -->
      <!-- DYNAMIC: LAST_OBSERVED_AIR -->
      <g transform="translate(504, 18)">
        <!-- Blue Trend Down Icon -->
        <g transform="translate(24, 0)">
          <circle cx="24" cy="24" r="24" fill="#082548" stroke="#38bdf8" stroke-width="2.5" />
          <path d="M 14 18 L 22 26 L 27 21 L 35 31" fill="none" stroke="#38bdf8" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
          <path d="M 28 31 L 35 31 L 35 24" fill="none" stroke="#38bdf8" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
        </g>
        <text x="48" y="68" text-anchor="middle" class="font-sans" font-size="12.5" font-weight="800" fill="#ffffff" letter-spacing="0.5">LAST OBSERVED AIR</text>
        <text x="48" y="112" text-anchor="middle" class="font-sans" font-size="38" font-weight="900" fill="#38bdf8">${escapeXml(
          lastStr
        )}</text>
      </g>

      <!-- Horizontal Separator Line -->
      <line x1="20" y1="146" x2="616" y2="146" stroke="#1e3a8a" stroke-width="1" stroke-dasharray="4 4" />

      <!-- Bottom Evidence Context Line -->
      <!-- DYNAMIC: EVIDENCE_LINE -->
      <g transform="translate(24, 158)">
        <!-- Users Icon -->
        <g transform="translate(0, 4)" fill="#93c5fd">
          <path d="M 6 7 C 7.6 7 9 5.6 9 4 C 9 2.4 7.6 1 6 1 C 4.4 1 3 2.4 3 4 C 3 5.6 4.4 7 6 7 Z" />
          <path d="M 13 6 C 14.1 6 15 5.1 15 4 C 15 2.9 14.1 2 13 2 C 11.9 2 11 2.9 11 4 C 11 5.1 11.9 6 13 6 Z" />
          <path d="M 6 9 C 3.3 9 0 10.7 0 13 L 0 15 L 12 15 L 12 13 C 12 10.7 8.7 9 6 9 Z" />
          <path d="M 13 8 C 12.3 8 11.5 8.2 10.8 8.5 C 11.6 9.4 12 10.6 12 12 L 12 15 L 18 15 L 18 13 C 18 10.7 15.3 8 13 8 Z" />
        </g>

        <text x="26" y="16" class="font-sans" font-size="13" font-weight="600" fill="#ffffff">
          MCC Round-1   <tspan fill="#fbbf24">•</tspan>   ${escapeXml(
            pathwayLabel
          )}   <tspan fill="#fbbf24">•</tspan>   ${escapeXml(
      categoryLabel
    )}   <tspan fill="#fbbf24">•</tspan>   ${escapeXml(countStr)}
        </text>
      </g>
    `;
  } else {
    // Approved Non-MCC Missing-AIR Fallback State
    evidencePanelSvg = `
      <!-- Deep Navy Rounded Container -->
      <rect x="0" y="0" width="636" height="192" rx="18" ry="18" fill="url(#navyPanelGrad)" stroke="#1e3a8a" stroke-width="1.5" />

      <!-- Center Informational Fallback Block -->
      <g transform="translate(32, 28)">
        <text x="0" y="24" class="font-sans" font-size="15" font-weight="800" fill="#93c5fd" letter-spacing="1.5">
          MCC ROUND-1 AIR EVIDENCE
        </text>
        <text x="0" y="68" class="font-sans" font-size="36" font-weight="900" fill="#ffffff">
          Not Available
        </text>
        <text x="0" y="104" class="font-sans" font-size="15" font-weight="500" fill="#cbd5e1">
          Allotments for this institution are conducted by State Counselling Authorities.
        </text>
        <text x="0" y="132" class="font-sans" font-size="14" font-weight="600" fill="#38bdf8">
          Explore college profile on MBBS Foundation™ for approved seat information.
        </text>
      </g>
    `;
  }

  // Render Name Lines XML
  const nameLinesSvg = nameFormatting.lines
    .map(
      (l) =>
        `<text x="0" y="${l.yOffset}" class="font-sans" font-size="${l.fontSize}" font-weight="${l.fontWeight}" fill="${l.fill}" letter-spacing="-0.8">${escapeXml(l.text)}</text>`
    )
    .join("\n      ");

  const badgeXOffset = Math.max(185, Math.min(310, locationStr.length * 8.5 + 35));

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
  <defs>
    <!-- Embedded Self-Contained Fonts / Styles -->
    <style>
${EMBEDDED_FONT_STYLE}
    </style>

    <!-- Gradients -->
    <linearGradient id="bgCanvasGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="100%" stop-color="#f8fafc" />
    </linearGradient>

    <linearGradient id="navyPanelGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#061836" />
      <stop offset="50%" stop-color="#082046" />
      <stop offset="100%" stop-color="#0b2854" />
    </linearGradient>

    <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#93c5fd" />
      <stop offset="30%" stop-color="#bfdbfe" />
      <stop offset="70%" stop-color="#e0f2fe" />
      <stop offset="100%" stop-color="#f8fafc" />
    </linearGradient>

    <linearGradient id="facadeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="50%" stop-color="#fdfaf3" />
      <stop offset="100%" stop-color="#f5ede0" />
    </linearGradient>

    <linearGradient id="domeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="40%" stop-color="#f8fafc" />
      <stop offset="100%" stop-color="#cbd5e1" />
    </linearGradient>

    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fde047" />
      <stop offset="50%" stop-color="#fbbf24" />
      <stop offset="100%" stop-color="#f59e0b" />
    </linearGradient>

    <linearGradient id="greenBadgeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#15803d" />
      <stop offset="100%" stop-color="#166534" />
    </linearGradient>

    <linearGradient id="lawnGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#16a34a" />
      <stop offset="50%" stop-color="#15803d" />
      <stop offset="100%" stop-color="#14532d" />
    </linearGradient>

    <!-- Clip Paths -->
    <clipPath id="canvasClip">
      <rect x="0" y="0" width="1200" height="630" rx="24" ry="24" />
    </clipPath>

    <clipPath id="academicViewClip">
      <path d="M 680 0 L 1200 0 L 1200 305 L 664 305 C 664 305 672 230 698 150 C 722 80 696 0 680 0 Z" />
    </clipPath>

    <!-- Drop Shadows -->
    <filter id="cardShadow" x="-10%" y="-10%" width="120%" height="130%">
      <feDropShadow dx="0" dy="6" stdDeviation="10" flood-color="#082046" flood-opacity="0.08" />
    </filter>

    <filter id="panelShadow" x="-5%" y="-5%" width="110%" height="120%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000000" flood-opacity="0.22" />
    </filter>
  </defs>

  <!-- 1. BASE CANVAS CONTAINER WITH ROUNDED BORDER -->
  <g clip-path="url(#canvasClip)">
    <rect x="0" y="0" width="1200" height="630" fill="url(#bgCanvasGrad)" />
    <rect x="2" y="2" width="1196" height="626" rx="22" ry="22" fill="none" stroke="#082046" stroke-width="4" />

    <!-- 2. TOP RIGHT SOPHISTICATED ACADEMIC ARCHITECTURE ILLUSTRATION -->
    <g clip-path="url(#academicViewClip)">
      <rect x="660" y="0" width="540" height="310" fill="url(#skyGrad)" />

      <!-- Clouds -->
      <g fill="#ffffff" opacity="0.6">
        <ellipse cx="750" cy="35" rx="60" ry="16" />
        <ellipse cx="790" cy="30" rx="45" ry="14" />
        <ellipse cx="1030" cy="55" rx="80" ry="20" />
        <ellipse cx="1080" cy="48" rx="55" ry="16" />
      </g>

      <circle cx="1140" cy="40" r="40" fill="#fef9c3" opacity="0.4" />

      <!-- Neoclassical Academic Building -->
      <rect x="690" y="125" width="520" height="125" fill="url(#facadeGrad)" stroke="#e2d9c8" stroke-width="1" />
      
      <!-- Cornice -->
      <rect x="680" y="118" width="530" height="8" fill="#f5ede0" stroke="#cbd5e1" stroke-width="1" />
      <g fill="#94a3b8" opacity="0.5">
        <rect x="710" y="112" width="3" height="6" />
        <rect x="728" y="112" width="3" height="6" />
        <rect x="746" y="112" width="3" height="6" />
        <rect x="764" y="112" width="3" height="6" />
        <rect x="782" y="112" width="3" height="6" />
        <rect x="800" y="112" width="3" height="6" />
        <rect x="1050" y="112" width="3" height="6" />
        <rect x="1068" y="112" width="3" height="6" />
        <rect x="1086" y="112" width="3" height="6" />
        <rect x="1104" y="112" width="3" height="6" />
        <rect x="1122" y="112" width="3" height="6" />
        <rect x="1140" y="112" width="3" height="6" />
        <rect x="1158" y="112" width="3" height="6" />
      </g>

      <!-- Wing Windows -->
      <g fill="#1e293b" opacity="0.7">
        <rect x="715" y="138" width="14" height="26" rx="2" />
        <rect x="742" y="138" width="14" height="26" rx="2" />
        <rect x="769" y="138" width="14" height="26" rx="2" />
        <rect x="796" y="138" width="14" height="26" rx="2" />
        <rect x="1045" y="138" width="14" height="26" rx="2" />
        <rect x="1072" y="138" width="14" height="26" rx="2" />
        <rect x="1099" y="138" width="14" height="26" rx="2" />
        <rect x="1126" y="138" width="14" height="26" rx="2" />
        <rect x="1153" y="138" width="14" height="26" rx="2" />
      </g>
      <g fill="#1e293b" opacity="0.65">
        <rect x="715" y="180" width="14" height="24" rx="2" />
        <rect x="742" y="180" width="14" height="24" rx="2" />
        <rect x="769" y="180" width="14" height="24" rx="2" />
        <rect x="796" y="180" width="14" height="24" rx="2" />
        <rect x="1045" y="180" width="14" height="24" rx="2" />
        <rect x="1072" y="180" width="14" height="24" rx="2" />
        <rect x="1099" y="180" width="14" height="24" rx="2" />
        <rect x="1126" y="180" width="14" height="24" rx="2" />
        <rect x="1153" y="180" width="14" height="24" rx="2" />
      </g>

      <!-- Portico -->
      <rect x="830" y="88" width="190" height="162" fill="#ffffff" stroke="#e2d9c8" stroke-width="1.5" />
      <polygon points="818,88 925,40 1032,88" fill="#fdfaf3" stroke="#d5c8b2" stroke-width="2" />
      <circle cx="925" cy="68" r="12" fill="#f5ede0" stroke="#c4b59d" stroke-width="1.5" />
      <circle cx="925" cy="68" r="6" fill="#ffffff" />

      <!-- Dome -->
      <rect x="872" y="36" width="106" height="12" fill="#f5ede0" stroke="#cbd5e1" stroke-width="1" />
      <path d="M 874 36 C 874 -10 976 -10 976 36 Z" fill="url(#domeGrad)" stroke="#94a3b8" stroke-width="1.5" />
      <path d="M 925 -8 L 925 36" stroke="#94a3b8" stroke-width="1.5" />
      <path d="M 925 -8 Q 900 12 892 36" stroke="#cbd5e1" stroke-width="1.2" fill="none" />
      <path d="M 925 -8 Q 950 12 958 36" stroke="#cbd5e1" stroke-width="1.2" fill="none" />
      <rect x="922" y="-16" width="6" height="8" fill="#ffffff" stroke="#94a3b8" stroke-width="1" />
      <circle cx="925" cy="-18" r="3.5" fill="#f59e0b" />

      <!-- Columns -->
      <g fill="#fdfaf3" stroke="#d5c8b2" stroke-width="1">
        <rect x="844" y="88" width="10" height="162" />
        <rect x="866" y="88" width="10" height="162" />
        <rect x="888" y="88" width="10" height="162" />
        <rect x="952" y="88" width="10" height="162" />
        <rect x="974" y="88" width="10" height="162" />
        <rect x="996" y="88" width="10" height="162" />
      </g>
      <rect x="912" y="108" width="26" height="75" rx="13" fill="#0f172a" opacity="0.9" />

      <!-- Terrace, Lawns & Path -->
      <rect x="820" y="240" width="210" height="10" fill="#e2e8f0" stroke="#cbd5e1" stroke-width="1" />
      <polygon points="660,244 1200,244 1200,310 660,310" fill="url(#lawnGrad)" />
      <polygon points="898,244 952,244 1005,310 845,310" fill="#f1f5f9" stroke="#cbd5e1" stroke-width="1" />

      <!-- Greenery -->
      <g fill="#14532d">
        <circle cx="725" cy="248" r="11" />
        <circle cx="750" cy="248" r="13" fill="#15803d" />
        <circle cx="775" cy="248" r="10" />
        <circle cx="800" cy="248" r="12" fill="#15803d" />
        <circle cx="1050" cy="248" r="12" fill="#15803d" />
        <circle cx="1075" cy="248" r="14" />
        <circle cx="1100" cy="248" r="11" fill="#15803d" />
        <circle cx="1125" cy="248" r="13" />
      </g>

      <!-- Palms -->
      <path d="M 698 248 Q 694 195 690 150" stroke="#78350f" stroke-width="4.5" fill="none" stroke-linecap="round" />
      <g fill="#15803d">
        <path d="M 690 150 Q 662 135 648 152 Q 672 148 690 150 Z" />
        <path d="M 690 150 Q 672 122 660 112 Q 682 125 690 150 Z" />
        <path d="M 690 150 Q 704 112 718 116 Q 704 130 690 150 Z" />
        <path d="M 690 150 Q 728 135 738 152 Q 714 148 690 150 Z" />
      </g>
      <path d="M 1175 248 Q 1171 190 1166 145" stroke="#78350f" stroke-width="4.5" fill="none" stroke-linecap="round" />
      <g fill="#15803d">
        <path d="M 1166 145 Q 1138 132 1124 150 Q 1148 145 1166 145 Z" />
        <path d="M 1166 145 Q 1152 118 1142 108 Q 1162 122 1166 145 Z" />
        <path d="M 1166 145 Q 1184 108 1198 112 Q 1184 128 1166 145 Z" />
        <path d="M 1166 145 Q 1204 132 1218 150 Q 1194 145 1166 145 Z" />
      </g>
    </g>

    <!-- Curved Division Boundary -->
    <path d="M 680 0 C 696 0 722 80 698 150 C 672 230 664 305 664 305" fill="none" stroke="#082046" stroke-width="4" />

    <!-- 3. TOP LEFT HEADER RIBBON & PROVENANCE -->
    <g transform="translate(32, 22)">
      <path d="M 8 0 L 515 0 C 530 0 545 10 550 25 L 555 46 L 0 46 L 0 8 C 0 3.5 3.5 0 8 0 Z" fill="#082046" />
      <path d="M 515 0 C 530 0 545 10 550 25 L 555 46 L 542 46 L 538 25 C 534 14 524 4 512 4 Z" fill="#fbbf24" />

      <!-- Calendar Icon -->
      <g transform="translate(18, 11)" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="0" y="2" width="22" height="20" rx="3" />
        <line x1="16" y1="0" x2="16" y2="4" />
        <line x1="6" y1="0" x2="6" y2="4" />
        <line x1="0" y1="8" x2="22" y2="8" />
        <circle cx="6" cy="13" r="1" fill="#ffffff" />
        <circle cx="11" cy="13" r="1" fill="#ffffff" />
        <circle cx="16" cy="13" r="1" fill="#ffffff" />
        <circle cx="6" cy="17" r="1" fill="#ffffff" />
        <circle cx="11" cy="17" r="1" fill="#ffffff" />
        <circle cx="16" cy="17" r="1" fill="#ffffff" />
      </g>

      <text x="52" y="30" class="font-sans" font-size="20" font-weight="900" fill="#ffffff" letter-spacing="0.5">NEET-UG 2026</text>
      <line x1="205" y1="12" x2="205" y2="34" stroke="#475569" stroke-width="2" />
      <text x="220" y="30" class="font-sans" font-size="18.5" font-weight="700" fill="#ffffff" letter-spacing="1">MCC ROUND-1 DATA</text>
    </g>

    <!-- Subtitle / Provenance -->
    <g transform="translate(34, 84)">
      <g transform="translate(0, 0)">
        <path d="M 10 0 L 19 5 L 19 14 C 19 20 15 24 10 26 C 5 24 1 20 1 14 L 1 5 Z" fill="#082046" stroke="#082046" stroke-width="1" />
        <path d="M 6 13 L 9 16 L 14 10" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
      </g>
      <text x="28" y="18" class="font-sans" font-size="15" font-weight="700" fill="#082046">Based on MCC NEET-UG 2026 Round-1 Allotment Data</text>
    </g>

    <!-- 4. COLLEGE IDENTITY SECTION -->
    <g transform="translate(32, 130)">
      ${nameLinesSvg}

      <!-- Sub-row: Location Pin & Classification Pill -->
      <g transform="translate(0, 126)">
        <g transform="translate(0, 0)">
          <path d="M 8 0 C 3.6 0 0 3.6 0 8 C 0 14 8 22 8 22 C 8 22 16 14 16 8 C 16 3.6 12.4 0 8 0 Z" fill="#ef4444" />
          <circle cx="8" cy="8" r="3.5" fill="#ffffff" />
          <text x="24" y="16" class="font-sans" font-size="19" font-weight="800" fill="#082046">${escapeXml(
            locationStr
          )}</text>
        </g>

        <!-- Classification Badge -->
        <g transform="translate(${badgeXOffset}, -5)">
          <rect x="0" y="0" width="${
            classificationBadge.length * 9.2 + 44
          }" height="32" rx="16" ry="16" fill="${
    isGreenBadge ? "url(#greenBadgeGrad)" : "#1e293b"
  }" />
          <g transform="translate(12, 6)" fill="#ffffff">
            <path d="M 9 1 L 0 6 L 18 6 Z" />
            <rect x="2" y="7" width="2.5" height="8" />
            <rect x="6" y="7" width="2.5" height="8" />
            <rect x="10" y="7" width="2.5" height="8" />
            <rect x="14" y="7" width="2.5" height="8" />
            <rect x="0" y="16" width="18" height="2" />
          </g>
          <text x="36" y="21" class="font-sans" font-size="14.5" font-weight="700" fill="#ffffff">${escapeXml(
            classificationBadge
          )}</text>
        </g>
      </g>
    </g>

    <!-- 5. PRIMARY EVIDENCE PANEL -->
    <g transform="translate(24, 298)" filter="url(#panelShadow)">
      ${evidencePanelSvg}
    </g>

    <!-- 6. THREE-COLUMN SEAT / CLASSIFICATION PANEL -->
    <g transform="translate(674, 298)" filter="url(#cardShadow)">
      <rect x="0" y="0" width="502" height="192" rx="18" ry="18" fill="#ffffff" stroke="#e2e8f0" stroke-width="1.5" />

      <!-- Column 1: MBBS SEATS -->
      <g transform="translate(0, 16)">
        <g transform="translate(68, 0)" fill="#082046">
          <path d="M 15 14 C 18.3 14 21 11.3 21 8 C 21 4.7 18.3 2 15 2 C 11.7 2 9 4.7 9 8 C 9 11.3 11.7 14 15 14 Z" />
          <path d="M 27 12 C 29.2 12 31 10.2 31 8 C 31 5.8 29.2 4 27 4 C 24.8 4 23 5.8 23 8 C 23 10.2 24.8 12 27 12 Z" />
          <path d="M 3 12 C 5.2 12 7 10.2 7 8 C 7 5.8 5.2 4 3 4 C 0.8 4 -1 5.8 -1 8 C -1 10.2 0.8 12 3 12 Z" />
          <path d="M 15 17 C 10 17 0 19.5 0 24.5 L 0 28 L 30 28 L 30 24.5 C 30 19.5 20 17 15 17 Z" />
          <path d="M 27 15 C 26 15 24.8 15.2 23.8 15.7 C 25.7 17.1 27 19.3 27 22 L 27 28 L 36 28 L 36 24.5 C 36 20.5 31.5 15 27 15 Z" />
        </g>
        <text x="84" y="68" text-anchor="middle" class="font-sans" font-size="46" font-weight="900" fill="#082046">${escapeXml(
          totalSeats
        )}</text>
        <text x="84" y="94" text-anchor="middle" class="font-sans" font-size="15" font-weight="800" fill="#082046">MBBS Seats</text>
        <line x1="24" y1="112" x2="144" y2="112" stroke="#e2e8f0" stroke-width="1.5" />
        <text x="84" y="132" text-anchor="middle" class="font-sans" font-size="13" font-weight="600" fill="#64748b">Annual Intake</text>
        <text x="84" y="150" text-anchor="middle" class="font-sans" font-size="13" font-weight="600" fill="#64748b">(Approved)</text>
      </g>

      <line x1="168" y1="18" x2="168" y2="174" stroke="#e2e8f0" stroke-width="1.5" stroke-dasharray="4 4" />

      <!-- Column 2: CLASSIFICATION -->
      <g transform="translate(168, 16)">
        <g transform="translate(68, 0)" fill="${
          isGreenBadge ? "#15803d" : "#475569"
        }">
          <path d="M 15 2 L 0 10 L 30 10 Z" />
          <rect x="3" y="12" width="4" height="14" />
          <rect x="10" y="12" width="4" height="14" />
          <rect x="17" y="12" width="4" height="14" />
          <rect x="24" y="12" width="4" height="14" />
          <rect x="0" y="27" width="30" height="3" />
        </g>
        <text x="84" y="68" text-anchor="middle" class="font-sans" font-size="${
          managementDisplay.length > 10 ? 15 : 18
        }" font-weight="900" fill="${
    isGreenBadge ? "#15803d" : "#475569"
  }" letter-spacing="0.5">${escapeXml(managementDisplay)}</text>
        <text x="84" y="94" text-anchor="middle" class="font-sans" font-size="16" font-weight="800" fill="#082046">Medical College</text>
        <line x1="24" y1="112" x2="144" y2="112" stroke="#e2e8f0" stroke-width="1.5" />
        <text x="84" y="142" text-anchor="middle" class="font-sans" font-size="13.5" font-weight="600" fill="#64748b">Management Type</text>
      </g>

      <line x1="336" y1="18" x2="336" y2="174" stroke="#e2e8f0" stroke-width="1.5" stroke-dasharray="4 4" />

      <!-- Column 3: STATE -->
      <g transform="translate(336, 16)">
        <!-- Clean Red Location Pin (matching Jaipur, Rajasthan concept) -->
        <g transform="translate(72, 0)">
          <path d="M 12 0 C 5.4 0 0 5.4 0 12 C 0 21 12 30 12 30 C 12 30 24 21 24 12 C 24 5.4 18.6 0 12 0 Z" fill="#ef4444" />
          <circle cx="12" cy="11" r="5" fill="#ffffff" />
        </g>
        <text x="84" y="80" text-anchor="middle" class="font-sans" font-size="${
          stateUpper.length > 14 ? 13 : 18
        }" font-weight="900" fill="#082046" letter-spacing="0.5">${escapeXml(
    stateUpper
  )}</text>
        <line x1="24" y1="112" x2="144" y2="112" stroke="#e2e8f0" stroke-width="1.5" />
        <text x="84" y="142" text-anchor="middle" class="font-sans" font-size="13.5" font-weight="600" fill="#64748b">State</text>
      </g>
    </g>

    <!-- 7. BOTTOM LEFT BRANDING AREA -->
    <g transform="translate(32, 514)">
      <text x="0" y="38" class="font-serif" font-size="40" font-weight="900" fill="#082046" letter-spacing="1">MBBS</text>
      <text x="0" y="66" class="font-sans" font-size="16.5" font-weight="900" fill="#1d4ed8" letter-spacing="2.5">FOUNDATION™</text>
      <line x1="200" y1="4" x2="200" y2="76" stroke="#cbd5e1" stroke-width="1.5" />
      <text x="218" y="24" class="font-sans" font-size="15" font-weight="800" fill="#082046">NEET-UG Counselling &amp;</text>
      <text x="218" y="45" class="font-sans" font-size="15" font-weight="800" fill="#082046">Medical College Explorer</text>
      <text x="218" y="68" class="font-sans" font-size="12" font-weight="600" fill="#64748b">Evidence <tspan fill="#fbbf24">•</tspan> Insights <tspan fill="#fbbf24">•</tspan> Informed Decisions</text>
    </g>

    <!-- 8. BOTTOM RIGHT CTA PANEL -->
    <g transform="translate(650, 502)" filter="url(#panelShadow)">
      <rect x="0" y="0" width="526" height="102" rx="16" ry="16" fill="url(#navyPanelGrad)" stroke="#1e3a8a" stroke-width="1.5" />
      <g transform="translate(18, 16)">
        <rect x="0" y="0" width="48" height="48" rx="10" ry="10" fill="none" stroke="#fbbf24" stroke-width="2.5" />
        <path d="M 15 33 L 33 15" fill="none" stroke="#fbbf24" stroke-width="3" stroke-linecap="round" />
        <path d="M 21 15 L 33 15 L 33 27" fill="none" stroke="#fbbf24" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
      </g>
      <text x="80" y="34" class="font-sans" font-size="15.5" font-weight="600" fill="#cbd5e1">See where you stand in</text>
      <text x="80" y="62" class="font-sans" font-size="30" font-weight="900" fill="url(#goldGrad)" letter-spacing="1">NEET-UG 2026</text>
      <text x="18" y="88" class="font-sans" font-size="13.5" font-weight="700" fill="#ffffff">Explore this college on MBBS Foundation™</text>
      <path d="M 485 84 L 498 84 M 493 79 L 498 84 L 493 89" fill="none" stroke="#fbbf24" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
    </g>
  </g>
</svg>`;
}

export function generateNotFoundSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
  <defs>
    <!-- Embedded Self-Contained Fonts / Styles -->
    <style>
${EMBEDDED_FONT_STYLE}
    </style>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#061836" />
      <stop offset="100%" stop-color="#082046" />
    </linearGradient>
  </defs>
  <rect width="1200" height="630" rx="24" fill="url(#bgGrad)" />
  <rect x="2" y="2" width="1196" height="626" rx="22" fill="none" stroke="#1e3a8a" stroke-width="3" />
  
  <g transform="translate(600, 220)" text-anchor="middle">
    <text y="0" class="font-sans" font-size="20" font-weight="800" fill="#38bdf8" letter-spacing="3">NEET-UG 2026 • COUNSELLING PLANNER</text>
    <text y="60" class="font-sans" font-size="44" font-weight="900" fill="#ffffff">College Profile Not Found</text>
    <text y="105" class="font-sans" font-size="18" font-weight="500" fill="#94a3b8">Explore 840+ Medical Colleges &amp; Verified Round-1 Evidence on MBBS Foundation™</text>
  </g>

  <g transform="translate(600, 480)" text-anchor="middle">
    <text y="0" class="font-serif" font-size="36" font-weight="900" fill="#ffffff" letter-spacing="1">MBBS FOUNDATION™</text>
    <text y="30" class="font-sans" font-size="14" font-weight="600" fill="#38bdf8">mbbsfoundation.com</text>
  </g>
</svg>`;
}
