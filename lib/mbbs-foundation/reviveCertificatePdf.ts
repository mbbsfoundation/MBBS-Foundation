import * as fs from "fs";
import * as path from "path";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { QrCode } from "./qr";
import {
  formatConciseMedicalCollegeName,
  REVIVE_CERTIFICATE_CONFIG,
  getModuleLogoConfig,
} from "./reviveCertificateService";

export interface GeneratePdfOptions {
  certificateId: string;
  learnerName: string;
  medicalCollege: string;
  moduleCode?: string;
  moduleTitle?: string;
  completionDate?: string;
  issuedAt?: Date;
  verificationBaseUrl?: string;
  includeEndorsement?: boolean;
}

/**
 * Generates an authentic single-page A4 Landscape PDF for the REVIVE Certificate of Module Completion.
 * Features:
 * - Strictly ONE A4 Landscape page (841.89 x 595.28 points) with zero second-page overflow
 * - Upper ~80%: Main MBBS Foundation digital module completion certificate
 * - Dual Logos: MBBS Foundation complete logo (top-left) & Collaborating organization logo (top-right, configurable)
 * - Subtle central watermark (~5% opacity, aspect ratio strictly preserved) behind main certificate
 * - 14-module pastel progress strip (Module 7 REVIVE highlighted with checkmark)
 * - Working vector QR code & full institutional attribution positioned ABOVE the endorsement box
 * - Lower ~20%: Reserved Optional Institutional Practical Competency Endorsement box (REVIVE)
 * - When endorsement is disabled, lower 20% remains completely blank with identical upper geometry
 */
export async function generateReviveCertificatePdf(options: GeneratePdfOptions): Promise<Uint8Array> {
  const {
    certificateId,
    learnerName,
    medicalCollege,
    moduleCode = "REVIVE",
    completionDate = new Intl.DateTimeFormat("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(options.issuedAt || new Date()),
    verificationBaseUrl = "https://mbbsfoundation.com",
    includeEndorsement = true,
  } = options;

  const pdfDoc = await PDFDocument.create();

  // A4 Landscape: 841.89 points wide x 595.28 points high
  const pageWidth = 841.89;
  const pageHeight = 595.28;
  const page = pdfDoc.addPage([pageWidth, pageHeight]);

  // Standard Type 1 Fonts (universally supported by all PDF readers)
  const fontSerifBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  const fontSerifItalic = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);
  const fontSans = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontSansBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Background Canvas: BMJ Warm Off-White Tone (#FDFDFC)
  page.drawRectangle({
    x: 0,
    y: 0,
    width: pageWidth,
    height: pageHeight,
    color: rgb(0.992, 0.992, 0.988),
  });

  // Helper to load either PNG or JPEG into PDF document
  async function loadAnyImage(candidatePaths: string[]) {
    for (const p of candidatePaths) {
      if (fs.existsSync(p)) {
        try {
          const buf = fs.readFileSync(p);
          if (buf[0] === 0xff && buf[1] === 0xd8) {
            return await pdfDoc.embedJpg(buf);
          } else {
            return await pdfDoc.embedPng(buf);
          }
        } catch (err) {
          console.warn(`Could not embed image from ${p}:`, err);
        }
      }
    }
    return null;
  }

  // Load Logos via Modular Configuration
  const logoConfig = getModuleLogoConfig(moduleCode);

  // 1. Permanent Top-Left: MBBS Foundation Logo (Official Full Asset)
  const mbbsLogo = await loadAnyImage([
    path.join(process.cwd(), "public/MBBS Foundation Logo.png"),
    path.join(process.cwd(), "public/MBBS Foundation Logo 2.png"),
    path.join(process.cwd(), "public/images/mbbs-foundation-logo-2.png"),
    path.join(process.cwd(), "public/images/MBBS Foundation Logo.png"),
  ]);

  // 2. Configurable Top-Right: Collaborating Organization Logo (Combined IAP ALS-BLS logo for REVIVE)
  let collaboratorLogoImage: any = null;
  if (logoConfig.collaboratingOrgLogo) {
    collaboratorLogoImage = await loadAnyImage([
      path.join(process.cwd(), "public/IAP ALS BLS Logo.jpg"),
      path.join(process.cwd(), "public/images/IAP ALS BLS Logo.jpg"),
      path.join(process.cwd(), "public", logoConfig.collaboratingOrgLogo.webPath),
      path.join(process.cwd(), "public/images/iap-als-bls-logo.png"),
    ]);

    if (!collaboratorLogoImage) {
      console.warn(
        `Collaborating organization logo asset unavailable for module "${moduleCode}": ${logoConfig.collaboratingOrgLogo.name}. Top-right area will remain empty.`
      );
    }
  }

  // 3. Dedicated Central Watermark (MBBS Foundation Watermark ~5% opacity)
  const watermarkImage = await loadAnyImage([
    path.join(process.cwd(), "public/MBBS Foundation watermark.png"),
    path.join(process.cwd(), "public/images/MBBS Foundation watermark.png"),
  ]);

  if (watermarkImage) {
    const wmAspect = watermarkImage.width / watermarkImage.height; // ~1.4891
    const wmWidth = 340;
    const wmHeight = wmWidth / wmAspect; // ~228.3 pt
    const wmX = (pageWidth - wmWidth) / 2;
    const wmY = 220; // Sits centrally behind upper certificate body
    page.drawImage(watermarkImage, {
      x: wmX,
      y: wmY,
      width: wmWidth,
      height: wmHeight,
      opacity: 0.05,
    });
  }

  // Outer Hairline Border (1 pt, refined slate)
  const outerMargin = 20;
  page.drawRectangle({
    x: outerMargin,
    y: outerMargin,
    width: pageWidth - outerMargin * 2,
    height: pageHeight - outerMargin * 2,
    borderColor: rgb(0.80, 0.82, 0.85),
    borderWidth: 1,
  });

  // Inner Hairline Framing (0.5 pt, 4 pt inset)
  const innerMargin = 24;
  page.drawRectangle({
    x: innerMargin,
    y: innerMargin,
    width: pageWidth - innerMargin * 2,
    height: pageHeight - innerMargin * 2,
    borderColor: rgb(0.89, 0.91, 0.93),
    borderWidth: 0.5,
  });

  // Helper function to draw horizontally centered text
  function drawCenteredText(
    text: string,
    y: number,
    font: any,
    size: number,
    color: any = rgb(0.1, 0.12, 0.15)
  ) {
    const textWidth = font.widthOfTextAtSize(text, size);
    const x = (pageWidth - textWidth) / 2;
    page.drawText(text, { x, y, size, font, color });
    return { x, y, width: textWidth };
  }

  // ==========================================================================
  // UPPER ~80%: MAIN MBBS FOUNDATION DIGITAL MODULE COMPLETION CERTIFICATE
  // ==========================================================================

  // 1. Symmetrical Three-Column Header Row
  const headerRowY = 515;

  // LEFT: Official MBBS Foundation horizontal logo
  if (mbbsLogo) {
    const mbbsAspect = mbbsLogo.width / mbbsLogo.height; // ~3.536
    const mbbsHeight = 40;
    const mbbsWidth = mbbsHeight * mbbsAspect; // ~141.5 pt
    page.drawImage(mbbsLogo, {
      x: 36,
      y: headerRowY + 3,
      width: mbbsWidth,
      height: mbbsHeight,
      opacity: 1,
    });
  }

  // CENTRE: MBBS FOUNDATION / ONLINE LEARNING PROGRAMME (2 lines centered)
  drawCenteredText(
    "MBBS FOUNDATION",
    headerRowY + 26,
    fontSansBold,
    11,
    rgb(0.12, 0.18, 0.26)
  );
  drawCenteredText(
    "ONLINE LEARNING PROGRAMME",
    headerRowY + 13,
    fontSansBold,
    8,
    rgb(0.42, 0.46, 0.52)
  );

  // RIGHT: Combined IAP ALS–BLS logo (Preserving both emblems, configurable; empty if none)
  if (collaboratorLogoImage) {
    const collabAspect = collaboratorLogoImage.width / collaboratorLogoImage.height; // ~1.4615
    const collabHeight = 46;
    const collabWidth = collabHeight * collabAspect; // ~67.2 pt
    page.drawImage(collaboratorLogoImage, {
      x: pageWidth - 36 - collabWidth,
      y: headerRowY,
      width: collabWidth,
      height: collabHeight,
      opacity: 1,
    });
  }

  // 2. Full-Width Centered Title (Below Header Row)
  drawCenteredText(
    REVIVE_CERTIFICATE_CONFIG.title,
    482,
    fontSerifBold,
    22,
    rgb(0.08, 0.12, 0.18)
  );

  // Lead Clause
  drawCenteredText(
    "This is to certify that",
    460,
    fontSerifItalic,
    10.5,
    rgb(0.42, 0.46, 0.50)
  );

  // Learner's Registered Full Name
  const cleanName = learnerName.trim() || "Verified Learner";
  const nameY = 434;
  drawCenteredText(cleanName, nameY, fontSerifBold, 19, rgb(0.05, 0.08, 0.12));

  // Subtle separator line below name
  const nameW = Math.min(fontSerifBold.widthOfTextAtSize(cleanName, 19) + 50, 380);
  page.drawLine({
    start: { x: (pageWidth - nameW) / 2, y: nameY - 5 },
    end: { x: (pageWidth + nameW) / 2, y: nameY - 5 },
    color: rgb(0.82, 0.84, 0.88),
    thickness: 0.6,
  });

  // Medical College Attribution: "from [NAME OF MEDICAL COLLEGE]"
  const conciseCollege = formatConciseMedicalCollegeName(medicalCollege);
  const collegeText = `from ${conciseCollege}`;
  drawCenteredText(collegeText, 411, fontSansBold, 10.5, rgb(0.20, 0.25, 0.32));

  // Completion Clause
  drawCenteredText(
    "has successfully completed Module 7 — REVIVE",
    390,
    fontSansBold,
    11,
    rgb(0.12, 0.16, 0.22)
  );

  // Module Subtitle
  drawCenteredText(
    "Cardiopulmonary Resuscitation (CPR) and Relief of Choking",
    373,
    fontSansBold,
    12.5,
    rgb(0.07, 0.38, 0.41)
  );

  // Educational Pathway Body Description
  drawCenteredText(
    "through online educational presentations from the MBBS Foundation Series, instructional videos by the IAP ALS–BLS Group,",
    355,
    fontSerifItalic,
    9,
    rgb(0.35, 0.39, 0.44)
  );
  drawCenteredText(
    "and successful completion of the module's online knowledge assessment.",
    343,
    fontSerifItalic,
    9,
    rgb(0.35, 0.39, 0.44)
  );

  // 14-Module Single-Row Progress Strip
  const numModules = 14;
  const boxW = 23;
  const boxH = 17;
  const boxGap = 4.5;
  const totalStripW = numModules * boxW + (numModules - 1) * boxGap;
  const stripStartX = (pageWidth - totalStripW) / 2;
  const stripY = 310;

  const neutralPastels = [
    { bg: rgb(0.94, 0.965, 0.985), border: rgb(0.84, 0.87, 0.91) }, // Pale blue
    { bg: rgb(0.94, 0.98, 0.96), border: rgb(0.83, 0.88, 0.85) },   // Pale mint
    { bg: rgb(0.96, 0.95, 0.98), border: rgb(0.86, 0.84, 0.89) },   // Pale lavender
    { bg: rgb(0.98, 0.975, 0.94), border: rgb(0.88, 0.87, 0.83) },  // Pale cream
  ];

  for (let m = 1; m <= numModules; m++) {
    const bx = stripStartX + (m - 1) * (boxW + boxGap);
    const isCompletedRevive = m === 7;

    if (isCompletedRevive) {
      page.drawRectangle({
        x: bx,
        y: stripY,
        width: boxW,
        height: boxH,
        color: rgb(0.84, 0.98, 0.90),
        borderColor: rgb(0.06, 0.60, 0.35),
        borderWidth: 1.1,
      });

      // Clear checkmark vector lines
      page.drawLine({
        start: { x: bx + 4.5, y: stripY + 8.5 },
        end: { x: bx + 7.5, y: stripY + 5.5 },
        color: rgb(0.04, 0.46, 0.25),
        thickness: 1.3,
      });
      page.drawLine({
        start: { x: bx + 7.5, y: stripY + 5.5 },
        end: { x: bx + 11.5, y: stripY + 11.5 },
        color: rgb(0.04, 0.46, 0.25),
        thickness: 1.3,
      });

      page.drawText("7", {
        x: bx + 13,
        y: stripY + 5,
        size: 8,
        font: fontSansBold,
        color: rgb(0.04, 0.46, 0.25),
      });
    } else {
      const palette = neutralPastels[(m - 1) % neutralPastels.length];
      page.drawRectangle({
        x: bx,
        y: stripY,
        width: boxW,
        height: boxH,
        color: palette.bg,
        borderColor: palette.border,
        borderWidth: 0.5,
      });

      const numStr = m.toString();
      const numW = fontSans.widthOfTextAtSize(numStr, 7.5);
      page.drawText(numStr, {
        x: bx + (boxW - numW) / 2,
        y: stripY + 5,
        size: 7.5,
        font: fontSans,
        color: rgb(0.44, 0.48, 0.54),
      });
    }
  }

  // Progress caption
  drawCenteredText(
    "Module 7 of 14 — REVIVE completed",
    295,
    fontSansBold,
    8,
    rgb(0.18, 0.45, 0.38)
  );

  // Online Learning Disclaimer
  drawCenteredText(
    `“${REVIVE_CERTIFICATE_CONFIG.disclaimer}”`,
    281,
    fontSerifItalic,
    8.5,
    rgb(0.42, 0.46, 0.50)
  );

  // Divider above Bottom Attribution & QR Row
  page.drawLine({
    start: { x: 36, y: 268 },
    end: { x: pageWidth - 36, y: 268 },
    color: rgb(0.88, 0.90, 0.92),
    thickness: 0.5,
  });

  // Working Vector QR Code & Metadata on Left
  const verificationUrl = `${verificationBaseUrl.replace(/\/$/, "")}/mbbs-foundation/learn/verify/${certificateId}`;
  const qr = QrCode.encodeText(verificationUrl, "M");

  const qrBoxSize = 58;
  const qrX = 38;
  const qrY = 196;

  page.drawRectangle({
    x: qrX - 3,
    y: qrY - 3,
    width: qrBoxSize + 6,
    height: qrBoxSize + 6,
    color: rgb(1, 1, 1),
    borderColor: rgb(0.88, 0.90, 0.92),
    borderWidth: 0.5,
  });

  const modulePixelSize = qrBoxSize / qr.size;
  for (let r = 0; r < qr.size; r++) {
    for (let c = 0; c < qr.size; c++) {
      if (qr.getModule(c, r)) {
        page.drawRectangle({
          x: qrX + c * modulePixelSize,
          y: qrY + (qr.size - 1 - r) * modulePixelSize,
          width: modulePixelSize + 0.05,
          height: modulePixelSize + 0.05,
          color: rgb(0.06, 0.09, 0.14),
        });
      }
    }
  }

  const textLeftX = qrX + qrBoxSize + 14;
  page.drawText("CERTIFICATE ID", {
    x: textLeftX,
    y: 242,
    size: 7,
    font: fontSansBold,
    color: rgb(0.45, 0.48, 0.52),
  });

  page.drawText(certificateId, {
    x: textLeftX,
    y: 230,
    size: 10,
    font: fontSansBold,
    color: rgb(0.08, 0.12, 0.18),
  });

  page.drawText(`Date of Issuance: ${completionDate}`, {
    x: textLeftX,
    y: 216,
    size: 8,
    font: fontSans,
    color: rgb(0.35, 0.38, 0.42),
  });

  page.drawText("Scan QR code or visit:", {
    x: textLeftX,
    y: 204,
    size: 7.5,
    font: fontSans,
    color: rgb(0.45, 0.48, 0.52),
  });

  page.drawText(`${verificationBaseUrl.replace(/^https?:\/\//, "")}/mbbs-foundation/learn/verify`, {
    x: textLeftX,
    y: 194,
    size: 7.5,
    font: fontSansBold,
    color: rgb(0.07, 0.38, 0.41),
  });

  // Right: Institutional Attribution Block (ABOVE Endorsement Area)
  const rightAlignX = pageWidth - 38;

  const titleText = REVIVE_CERTIFICATE_CONFIG.issuingOrganization;
  const titleW = fontSansBold.widthOfTextAtSize(titleText, 11);
  page.drawText(titleText, {
    x: rightAlignX - titleW,
    y: 240,
    size: 11,
    font: fontSansBold,
    color: rgb(0.08, 0.12, 0.18),
  });

  const initiativeText = REVIVE_CERTIFICATE_CONFIG.initiative;
  const initW = fontSans.widthOfTextAtSize(initiativeText, 8.5);
  page.drawText(initiativeText, {
    x: rightAlignX - initW,
    y: 226,
    size: 8.5,
    font: fontSans,
    color: rgb(0.35, 0.38, 0.42),
  });

  const assocText = REVIVE_CERTIFICATE_CONFIG.association;
  const assocW = fontSansBold.widthOfTextAtSize(assocText, 8.5);
  page.drawText(assocText, {
    x: rightAlignX - assocW,
    y: 212,
    size: 8.5,
    font: fontSansBold,
    color: rgb(0.18, 0.22, 0.28),
  });

  const sealNotice = "Official Electronic Credential • Cryptographically Verifiable";
  const sealW = fontSans.widthOfTextAtSize(sealNotice, 7);
  page.drawText(sealNotice, {
    x: rightAlignX - sealW,
    y: 198,
    size: 7,
    font: fontSans,
    color: rgb(0.50, 0.54, 0.58),
  });

  // ==========================================================================
  // LOWER ~20%: INSTITUTIONAL CPR AWARENESS PRACTICE SESSION
  // ==========================================================================
  if (includeEndorsement) {
    const endBoxX = 36;
    const endBoxY = 32;
    const endBoxW = pageWidth - endBoxX * 2; // 769.89
    const endBoxH = 138;

    // Endorsement Box Frame
    page.drawRectangle({
      x: endBoxX,
      y: endBoxY,
      width: endBoxW,
      height: endBoxH,
      color: rgb(0.978, 0.984, 0.992),
      borderColor: rgb(0.78, 0.82, 0.86),
      borderWidth: 0.75,
    });

    // Header Bar inside the box
    page.drawRectangle({
      x: endBoxX,
      y: endBoxY + endBoxH - 19,
      width: endBoxW,
      height: 19,
      color: rgb(0.93, 0.95, 0.97),
      borderColor: rgb(0.78, 0.82, 0.86),
      borderWidth: 0.5,
    });

    // Box Title: Exactly "INSTITUTIONAL CPR AWARENESS PRACTICE SESSION"
    const endorseTitle = "INSTITUTIONAL CPR AWARENESS PRACTICE SESSION";
    const endTitleW = fontSansBold.widthOfTextAtSize(endorseTitle, 8.5);
    page.drawText(endorseTitle, {
      x: endBoxX + (endBoxW - endTitleW) / 2,
      y: endBoxY + endBoxH - 13.5,
      size: 8.5,
      font: fontSansBold,
      color: rgb(0.12, 0.18, 0.26),
    });

    // Explanatory Statement: Exactly "This section may be completed by trained and authorized medical college faculty following a supervised hands-on CPR Awareness Session."
    const confirmStatement =
      "This section may be completed by trained and authorized medical college faculty following a supervised hands-on CPR Awareness Session.";
    const stmtW = fontSerifItalic.widthOfTextAtSize(confirmStatement, 8);
    page.drawText(confirmStatement, {
      x: endBoxX + (endBoxW - stmtW) / 2,
      y: endBoxY + endBoxH - 31,
      size: 8,
      font: fontSerifItalic,
      color: rgb(0.32, 0.36, 0.42),
    });

    // ========================================================================
    // ROW 1 — TWO FIELDS: Student Enrollment No. & Supervising Faculty Name & Designation
    // ========================================================================
    const row1MarginX = 24;
    const row1Gap = 36;
    const row1ColW = (endBoxW - row1MarginX * 2 - row1Gap) / 2; // ~342 pt each
    const row1Col1X = endBoxX + row1MarginX;
    const row1Col2X = row1Col1X + row1ColW + row1Gap;

    const row1LabelY = endBoxY + 80;
    const row1LineY = endBoxY + 66;

    // Field 1: Student Enrollment No.:
    page.drawText("Student Enrollment No.:", {
      x: row1Col1X,
      y: row1LabelY,
      size: 7.5,
      font: fontSansBold,
      color: rgb(0.15, 0.20, 0.28),
    });
    page.drawLine({
      start: { x: row1Col1X, y: row1LineY },
      end: { x: row1Col1X + row1ColW, y: row1LineY },
      color: rgb(0.70, 0.74, 0.80),
      thickness: 0.75,
    });

    // Field 2: Supervising Faculty Name & Designation:
    page.drawText("Supervising Faculty Name & Designation:", {
      x: row1Col2X,
      y: row1LabelY,
      size: 7.5,
      font: fontSansBold,
      color: rgb(0.15, 0.20, 0.28),
    });
    page.drawLine({
      start: { x: row1Col2X, y: row1LineY },
      end: { x: row1Col2X + row1ColW, y: row1LineY },
      color: rgb(0.70, 0.74, 0.80),
      thickness: 0.75,
    });

    // ========================================================================
    // ROW 2 — THREE FIELDS: Hands-on Session Date, Faculty Signature, INSTITUTIONAL STAMP
    // ========================================================================
    const row2Col1X = row1Col1X;
    const row2Col1W = 180;

    const row2Col2X = row2Col1X + row2Col1W + 36;
    const row2Col2W = 280;

    const row2Col3X = row2Col2X + row2Col2W + 36;
    const row2Col3W = endBoxX + endBoxW - row1MarginX - row2Col3X; // ~190 pt

    const row2LabelY = endBoxY + 44;
    const row2LineY = endBoxY + 22;

    // Field 1: Hands-on Session Date:
    page.drawText("Hands-on Session Date:", {
      x: row2Col1X,
      y: row2LabelY,
      size: 7.5,
      font: fontSansBold,
      color: rgb(0.15, 0.20, 0.28),
    });
    page.drawText("DD  /  MM  /  202___", {
      x: row2Col1X + 4,
      y: row2LineY + 4,
      size: 8,
      font: fontSans,
      color: rgb(0.45, 0.50, 0.58),
    });
    page.drawLine({
      start: { x: row2Col1X, y: row2LineY },
      end: { x: row2Col1X + row2Col1W, y: row2LineY },
      color: rgb(0.70, 0.74, 0.80),
      thickness: 0.75,
    });

    // Field 2: Faculty Signature:
    page.drawText("Faculty Signature:", {
      x: row2Col2X,
      y: row2LabelY,
      size: 7.5,
      font: fontSansBold,
      color: rgb(0.15, 0.20, 0.28),
    });
    page.drawLine({
      start: { x: row2Col2X, y: row2LineY },
      end: { x: row2Col2X + row2Col2W, y: row2LineY },
      color: rgb(0.70, 0.74, 0.80),
      thickness: 0.75,
    });

    // Field 3: INSTITUTIONAL STAMP [Blank bordered stamp box]
    page.drawText("INSTITUTIONAL STAMP", {
      x: row2Col3X,
      y: row2LabelY,
      size: 7.5,
      font: fontSansBold,
      color: rgb(0.15, 0.20, 0.28),
    });

    // Blank bordered stamp box
    const stampBoxY = endBoxY + 8;
    const stampBoxH = 32;
    page.drawRectangle({
      x: row2Col3X,
      y: stampBoxY,
      width: row2Col3W,
      height: stampBoxH,
      color: rgb(1, 1, 1),
      borderColor: rgb(0.75, 0.79, 0.85),
      borderWidth: 0.75,
    });
  }

  return pdfDoc.save();
}
