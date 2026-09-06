import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminRequest } from "@/lib/adminAuth";
import {
  getNextProposedCertificateId,
  normalizeParticipantName,
  normalizeStateCode,
  saveSingleIndividualCertificate,
  retireChampionCertificateAsync,
  restoreChampionCertificateAsync,
} from "@/lib/sanjeevaniStorage";
import {
  generateUnifiedCertificateSvg,
  formatCertificateFilename,
} from "@/lib/sanjeevaniCertificate";
import { searchCertificateById, getAllCPRCertificates } from "@/lib/cprCertificates";

/**
 * GET handler:
 * - action=search_champion: searches across CSV and DB champion records with status overlay
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
    const action = searchParams.get("action")?.trim();

    // 1. Search Champion records (Active & Retired) for Admin Management
    if (action === "search_champion") {
      const q = (searchParams.get("q") || searchParams.get("query") || "").trim().toLowerCase();
      if (!q) {
        return NextResponse.json({ success: true, champions: [] });
      }

      // Load all CSV champion records
      const rawCsvChampions = getAllCPRCertificates("champion");

      // Load DB records for champions
      let dbRecords: any[] = [];
      if (prisma && (prisma as any).adminCertificateRecord) {
        try {
          dbRecords = await (prisma as any).adminCertificateRecord.findMany({
            where: {
              OR: [
                { category: "CPR_CHAMPION" },
                { certificateId: { startsWith: "IAPCPR/CH/" } },
              ],
            },
          });
        } catch (e) {
          // safe fallback
        }
      }

      const dbMap = new Map<string, any>();
      for (const d of dbRecords) {
        if (d.certificateId) {
          dbMap.set(d.certificateId.trim().toUpperCase(), d);
        }
      }

      const championList: any[] = [];
      const seenIds = new Set<string>();

      // Process CSV champions with DB status overlay
      for (const c of rawCsvChampions) {
        const certId = (c.certificateNumber || "").trim();
        if (!certId) continue;
        const certKey = certId.toUpperCase();
        if (seenIds.has(certKey)) continue;
        seenIds.add(certKey);

        const dbOverlay = dbMap.get(certKey);
        const status = dbOverlay ? dbOverlay.status : (c.status || "VALID");
        const notes = dbOverlay ? dbOverlay.notes : undefined;
        const source = dbOverlay ? dbOverlay.source : "CSV_MASTER";

        championList.push({
          certificateId: certId,
          participantName: c.participantName,
          venueName: c.venueName,
          city: c.city,
          state: c.state,
          stateCode: c.zone || "",
          issueDate: c.issueDate,
          courseCoordinator: c.courseCoordinator,
          status: status || "VALID",
          isRetired: (status || "").toUpperCase() === "RETIRED",
          source,
          notes,
        });
      }

      // Process pure DB champions not present in CSV
      for (const d of dbRecords) {
        const certId = (d.certificateId || "").trim();
        if (!certId) continue;
        const certKey = certId.toUpperCase();
        if (seenIds.has(certKey)) continue;
        seenIds.add(certKey);

        championList.push({
          certificateId: certId,
          participantName: d.name,
          venueName: d.venueName,
          city: d.city,
          state: d.state,
          stateCode: d.stateCode,
          issueDate: d.certificateDate,
          courseCoordinator: d.courseCoordinator,
          status: d.status || "VALID",
          isRetired: (d.status || "").toUpperCase() === "RETIRED",
          source: d.source || "MANUAL_ADMIN",
          notes: d.notes,
        });
      }

      // Filter by query q
      const results = championList
        .filter((ch) => {
          const matchId = ch.certificateId.toLowerCase().includes(q);
          const matchName = (ch.participantName || "").toLowerCase().includes(q);
          const matchCity = (ch.city || "").toLowerCase().includes(q);
          const matchState = (ch.state || "").toLowerCase().includes(q);
          const matchVenue = (ch.venueName || "").toLowerCase().includes(q);
          return matchId || matchName || matchCity || matchState || matchVenue;
        })
        .slice(0, 25);

      return NextResponse.json({ success: true, champions: results });
    }

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
 * - action=RETIRE: administratively retires a CPR Champion certificate
 * - action=RESTORE: restores a retired CPR Champion certificate
 * - Default: creates a single AdminCertificateRecord in PostgreSQL & JSON storage
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
    const action = (body.action || "").toUpperCase().trim();

    // Handle Certificate Retirement
    if (action === "RETIRE") {
      const certId = (body.certificateId || "").trim();
      const reason = (body.reason || "").trim();
      const coordinatorReference = (body.coordinatorReference || "").trim();
      const retiredBy = (body.retiredBy || "ADMIN").trim();

      if (!certId) {
        return NextResponse.json(
          { success: false, error: "Certificate ID is required for retirement." },
          { status: 400 }
        );
      }
      if (!reason) {
        return NextResponse.json(
          { success: false, error: "Mandatory reason is required to retire a certificate." },
          { status: 400 }
        );
      }

      const result = await retireChampionCertificateAsync({
        certificateId: certId,
        reason,
        coordinatorReference: coordinatorReference || undefined,
        retiredBy,
      });

      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error || "Failed to retire certificate." },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        message: result.message,
        alreadyRetired: result.alreadyRetired,
        record: result.record,
      });
    }

    // Handle Certificate Restoration
    if (action === "RESTORE") {
      const certId = (body.certificateId || "").trim();
      const reason = (body.reason || "").trim();
      const restoredBy = (body.restoredBy || "ADMIN").trim();

      if (!certId) {
        return NextResponse.json(
          { success: false, error: "Certificate ID is required for restoration." },
          { status: 400 }
        );
      }

      const result = await restoreChampionCertificateAsync({
        certificateId: certId,
        reason: reason || undefined,
        restoredBy,
      });

      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error || "Failed to restore certificate." },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        message: result.message,
        alreadyValid: result.alreadyValid,
        record: result.record,
      });
    }

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
