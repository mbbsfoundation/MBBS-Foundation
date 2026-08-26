import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminRequest } from "@/lib/adminAuth";
import {
  getNextProposedCertificateId,
  normalizeParticipantName,
  normalizeStateCode,
  saveSingleIndividualCertificate,
} from "@/lib/sanjeevaniStorage";
import {
  generateUnifiedCertificateSvg,
  formatCertificateFilename,
} from "@/lib/sanjeevaniCertificate";
import { searchCertificateById } from "@/lib/cprCertificates";

/**
 * GET handler:
 * - Proposes next certificate ID for category & state
 * - Lists recent admin-added certificate records
 */
export async function GET(request: NextRequest) {
  try {
    if (!verifyAdminRequest(request)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Admin authentication required." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const category = (searchParams.get("category") || "").toUpperCase() as
      | "PARTICIPANT"
      | "CPR_CHAMPION"
      | "COURSE_COORDINATOR"
      | "CPR_FACILITY";
    const stateCode = (searchParams.get("stateCode") || "").toUpperCase();
    const date = searchParams.get("date") || undefined;

    if (category && stateCode) {
      const proposed = await getNextProposedCertificateId(category, stateCode, date);
      return NextResponse.json({
        success: true,
        proposed,
      });
    }

    // Default: list recent admin additions
    if (prisma && (prisma as any).adminCertificateRecord) {
      try {
        const records = await (prisma as any).adminCertificateRecord.findMany({
          orderBy: { createdAt: "desc" },
          take: 25,
        });
        return NextResponse.json({
          success: true,
          records,
        });
      } catch (e) {
        // safe fallback
      }
    }

    return NextResponse.json({ success: true, records: [] });
  } catch (error: any) {
    console.error("Admin certificate GET error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to retrieve proposed sequence." },
      { status: 500 }
    );
  }
}

/**
 * POST handler:
 * - Creates a single AdminCertificateRecord in PostgreSQL & JSON storage
 * - Issues strictly unique, non-colliding certificate ID
 * - Renders dynamic SVG on demand
 */
export async function POST(request: NextRequest) {
  try {
    if (!verifyAdminRequest(request)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Admin authentication required." },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const rawCategory = (body.category || "PARTICIPANT").toUpperCase();
    let category: "PARTICIPANT" | "CPR_CHAMPION" | "COURSE_COORDINATOR" | "CPR_FACILITY" =
      "PARTICIPANT";

    if (rawCategory.includes("CHAMPION")) category = "CPR_CHAMPION";
    else if (rawCategory.includes("COORDINATOR")) category = "COURSE_COORDINATOR";
    else if (rawCategory.includes("FACILITY") || rawCategory.includes("VENUE"))
      category = "CPR_FACILITY";

    const name = (body.name || body.participantName || body.venueName || "").trim();
    const state = (body.state || "").trim();
    const stateCode = normalizeStateCode(body.stateCode || "");
    const city = (body.city || "").trim();
    const venueName = (body.venueName || body.venue || name).trim();
    const certificateDate = (body.certificateDate || body.date || "21 July 2026").trim();
    const mobileNumber = (body.mobileNumber || body.mobile || "").trim() || undefined;
    const email = (body.email || "").trim() || undefined;
    const courseCoordinator = (body.courseCoordinator || "").trim() || undefined;
    const notes = (body.notes || "").trim() || undefined;
    const customCertificateId = (body.customCertificateId || body.certificateId || "").trim();

    if (!name) {
      return NextResponse.json(
        { success: false, error: "Name / Venue Title is required." },
        { status: 400 }
      );
    }
    if (!state) {
      return NextResponse.json(
        { success: false, error: "State is required." },
        { status: 400 }
      );
    }
    if (!stateCode || stateCode === "XX") {
      return NextResponse.json(
        { success: false, error: "Valid 2-letter State Code is required." },
        { status: 400 }
      );
    }

    // Determine Certificate ID
    let finalCertificateId = customCertificateId;
    if (!finalCertificateId) {
      const proposed = await getNextProposedCertificateId(category, stateCode, certificateDate);
      finalCertificateId = proposed.certificateId;
    }

    // Strict Uniqueness Collision Check
    // 1. Check CSV master datasets
    const csvMatch = searchCertificateById(finalCertificateId);
    if (csvMatch) {
      return NextResponse.json(
        {
          success: false,
          error: `Certificate ID "${finalCertificateId}" already exists in master dataset (${csvMatch.participantName}, ${csvMatch.state}). Please choose or generate another ID.`,
        },
        { status: 409 }
      );
    }

    // 2. Check Database safely
    if (prisma && (prisma as any).adminCertificateRecord?.findUnique) {
      try {
        const existingDb = await (prisma as any).adminCertificateRecord.findUnique({
          where: { certificateId: finalCertificateId },
        });
        if (existingDb) {
          return NextResponse.json(
            {
              success: false,
              error: `Certificate ID "${finalCertificateId}" is already issued to ${existingDb.name}.`,
            },
            { status: 409 }
          );
        }
      } catch (e) {
        // safe database fallback
      }
    }

    // Save record via centralized dual-persistence engine (JSON cache + PostgreSQL AdminCertificateRecord)
    const storedRecord = await saveSingleIndividualCertificate({
      certificateId: finalCertificateId,
      category,
      name,
      state,
      stateCode,
      city,
      venueName,
      certificateDate,
      mobileNumber,
      email,
      courseCoordinator,
      notes,
    });

    // Generate dynamic SVG & filenames
    let certCat: "CPR_DAY" | "SANJEEVANI" | "CPR_CHAMPION" | "CPR_FACILITY" | "COURSE_COORDINATOR" =
      "CPR_DAY";
    if (category === "CPR_CHAMPION") certCat = "CPR_CHAMPION";
    else if (category === "COURSE_COORDINATOR") certCat = "COURSE_COORDINATOR";
    else if (category === "CPR_FACILITY") certCat = "CPR_FACILITY";

    const svg = generateUnifiedCertificateSvg({
      category: certCat,
      participantName: name,
      date: certificateDate,
      venue: venueName,
      city: city || "",
      state: state,
      stateCode: stateCode,
      certificateId: finalCertificateId,
      courseCoordinator: courseCoordinator || undefined,
    });

    const pdfFilename = formatCertificateFilename(finalCertificateId, name, "pdf");
    const pngFilename = formatCertificateFilename(finalCertificateId, name, "png");
    const svgFilename = formatCertificateFilename(finalCertificateId, name, "svg");

    return NextResponse.json({
      success: true,
      message: "Certificate created successfully.",
      certificate: {
        ...storedRecord,
        certificateNumber: finalCertificateId,
        participantName: name,
        issueDate: certificateDate,
        venueName,
        svg,
        pdfFilename,
        pngFilename,
        svgFilename,
      },
    });
  } catch (error: any) {
    console.error("Admin certificate POST error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create certificate record." },
      { status: 500 }
    );
  }
}
