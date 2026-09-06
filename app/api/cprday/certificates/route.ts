import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  searchCertificateById,
  searchCertificatesByQuery,
  getCertificateStates,
  getCertificateCities,
  getCertificateVenues,
  getCertificateParticipants,
  searchCertificateByHierarchy,
  getRetiredChampionIdsAsync,
  CPRCertificatePortal,
  CPRCertificateRecord,
} from "@/lib/cprCertificates";
import {
  searchSanjeevaniById,
  searchSanjeevaniByQuery,
  getAllSanjeevaniFromStorage,
  SanjeevaniCertificateRecord,
} from "@/lib/sanjeevaniStorage";
import {
  generateUnifiedCertificateSvg,
  formatCertificateFilename,
  isCprDayDate,
} from "@/lib/sanjeevaniCertificate";

/**
 * Deduplicates certificates for the same person/venue (same name, mobile number, venue, city, and state).
 */
function deduplicatePersonRecords<T extends {
  participantName: string;
  venueName?: string;
  venue?: string;
  city?: string;
  state?: string;
  mobileNumber?: string;
}>(records: T[]): T[] {
  const seen = new Set<string>();
  const result: T[] = [];

  for (const r of records) {
    const name = (r.participantName || "").trim().toLowerCase().replace(/\s+/g, " ").replace(/[^\w\s]/gi, "");
    const venue = (r.venueName || (r as any).venue || "").trim().toLowerCase().replace(/\s+/g, " ").replace(/[^\w\s]/gi, "");
    const city = (r.city || "").trim().toLowerCase().replace(/\s+/g, " ");
    const state = (r.state || "").trim().toLowerCase().replace(/\s+/g, " ");
    const mobile = (r.mobileNumber || "").replace(/\D/g, "");

    const key = `${name}|${mobile}|${venue}|${city}|${state}`;
    const baseKey = `${name}|${venue}|${city}|${state}`;

    if (!seen.has(key) && !seen.has(baseKey)) {
      seen.add(key);
      if (mobile) {
        seen.add(baseKey);
      }
      result.push(r);
    }
  }

  return result;
}

/**
 * Helper to check if a Sanjeevani record matches a specific portal type.
 */
function matchesPortal(r: SanjeevaniCertificateRecord, portal: CPRCertificatePortal | "facility", isAllPortals: boolean): boolean {
  if (isAllPortals) return true;
  const cId = (r.certificateId || "").toUpperCase();
  const isFacility = Boolean(r.category === "CPR_FACILITY" || cId.includes("VENUE") || cId.startsWith("IAP-CPR-DAY/VENUE/"));
  const isChampion = Boolean(!isFacility && (r.category === "CPR_CHAMPION" || cId.startsWith("IAPCPR/CH/")));
  const isCoordinator = Boolean(!isFacility && !isChampion && ((r as any).category === "COORDINATOR" || (r as any).category === "COURSE_COORDINATOR" || cId.startsWith("IAPCPR/CC/")));

  if (portal === "facility") {
    return isFacility;
  }
  if (portal === "champion") {
    return isChampion;
  }
  if (portal === "coordinator") {
    return isCoordinator;
  }
  // participant portal
  return !isChampion && !isCoordinator && !isFacility;
}

/**
 * Maps a Sanjeevani record into the standard API certificate object.
 */
function formatSanjeevaniRecord(rec: SanjeevaniCertificateRecord) {
  const cId = (rec.certificateId || "").toUpperCase();
  const isFacility = rec.category === "CPR_FACILITY" || cId.includes("VENUE") || cId.startsWith("IAP-CPR-DAY/VENUE/");
  const isChampion = !isFacility && (rec.category === "CPR_CHAMPION" || cId.startsWith("IAPCPR/CH/"));
  const isCoordinator = !isFacility && !isChampion && ((rec.category as any) === "COURSE_COORDINATOR" || (rec.category as any) === "COORDINATOR" || cId.startsWith("IAPCPR/CC/"));
  const isCprDay = !isFacility && !isChampion && !isCoordinator && (rec.category === "CPR_DAY" || cId.startsWith("IAPCPR/PA/") || isCprDayDate(rec.date));

  let categoryLabel = "CPR Sanjeevani Lay Rescuer";
  let courseTitle = "IAP CPR Sanjeevani Training Program";
  let certCat: "CPR_DAY" | "SANJEEVANI" | "CPR_CHAMPION" | "CPR_FACILITY" | "COURSE_COORDINATOR" = "SANJEEVANI";

  if (isFacility) {
    categoryLabel = "CPR Facility / Venue";
    courseTitle = "National IAP CPR Sanjeevani Training Facility";
    certCat = "CPR_FACILITY";
  } else if (isChampion) {
    categoryLabel = "CPR Champion";
    courseTitle = "National IAP CPR Sanjeevani Champion Certificate";
    certCat = "CPR_CHAMPION";
  } else if (isCoordinator) {
    categoryLabel = "Course Coordinator";
    courseTitle = "National IAP CPR Sanjeevani Course Coordinator Certificate";
    certCat = "COURSE_COORDINATOR";
  } else if (isCprDay) {
    categoryLabel = "CPR Lay Rescuer";
    courseTitle = "National IAP CPR Sanjeevani Training Program";
    certCat = "CPR_DAY";
  }

  const svg = generateUnifiedCertificateSvg({
    category: certCat,
    participantName: rec.participantName,
    date: rec.date,
    venue: rec.venue,
    city: rec.city,
    state: rec.state,
    stateCode: rec.stateCode,
    certificateId: rec.certificateId,
    courseCoordinator: rec.courseCoordinator,
  });

  return {
    certificateNumber: rec.certificateId,
    participantName: rec.participantName,
    courseTitle,
    venueName: rec.venue,
    city: rec.city,
    state: rec.state,
    mobileNumber: rec.mobileNumber,
    email: rec.email,
    courseCoordinator: rec.courseCoordinator,
    issueDate: rec.date,
    status: rec.status,
    category: categoryLabel,
    svg,
    svgFilename: formatCertificateFilename(rec.certificateId, rec.participantName, "svg"),
    pdfFilename: formatCertificateFilename(rec.certificateId, rec.participantName, "pdf"),
    pngFilename: formatCertificateFilename(rec.certificateId, rec.participantName, "png"),
  };
}

/**
 * Ensures any certificate lacking a Drive link has its dynamic SVG and export filenames attached.
 */
function ensureCertificateRenderFields(cert: any) {
  if (!cert) return cert;
  if (
    cert.status === "WITHDRAWN" ||
    cert.status === "RETIRED" ||
    cert.status === "REVOKED" ||
    cert.isWithdrawn ||
    cert.isRetired
  ) {
    return cert;
  }
  if (!cert.driveLink && !cert.svg) {
    const certNum = cert.certificateNumber || cert.certificateId || "";
    const pName = cert.participantName || cert.venueName || "";
    const vName = cert.venueName || cert.venue || (cert.category === "CPR Facility / Venue" ? pName : "");
    const dateVal = cert.issueDate || cert.date || "21 July 2026";

    try {
      const svg = generateUnifiedCertificateSvg({
        category: cert.category,
        participantName: pName,
        date: dateVal,
        venue: vName,
        city: cert.city || "",
        state: cert.state || "",
        stateCode: cert.state || cert.zone || "",
        certificateId: certNum,
        courseCoordinator: cert.courseCoordinator,
      });
      cert.svg = svg;
      cert.pdfFilename = formatCertificateFilename(certNum, pName, "pdf");
      cert.pngFilename = formatCertificateFilename(certNum, pName, "png");
      cert.svgFilename = formatCertificateFilename(certNum, pName, "svg");
    } catch (err) {
      console.error(`Failed to generate SVG for ${certNum}:`, err);
    }
  }
  return cert;
}

export async function GET(request: NextRequest) {
  try {
    // Prime the latest retired champion overlay from PostgreSQL for 100% cross-instance safety
    const retiredChampionIds = await getRetiredChampionIdsAsync(true);

    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action")?.trim();
    const certId = searchParams.get("id")?.trim() || searchParams.get("certificateId")?.trim();
    const query = searchParams.get("query")?.trim() || searchParams.get("mobile")?.trim() || searchParams.get("email")?.trim();

    const portalParam = (searchParams.get("portal") || searchParams.get("type") || "participant").trim().toLowerCase();
    const isAllPortals = portalParam === "all";
    const portal: CPRCertificatePortal =
      portalParam === "facility" || portalParam === "venue"
        ? "facility"
        : portalParam === "champion"
        ? "champion"
        : portalParam === "coordinator"
        ? "coordinator"
        : "participant";

    // Cascading Hierarchy API Actions
    if (action === "states") {
      const states = isAllPortals
        ? [
            ...getCertificateStates("participant"),
            ...getCertificateStates("coordinator"),
            ...getCertificateStates("champion"),
            ...getCertificateStates("facility"),
          ]
        : getCertificateStates(portal);

      if (prisma && (prisma as any).adminCertificateRecord) {
        try {
          const dbStates = await (prisma as any).adminCertificateRecord.findMany({
            where: {
              status: { not: "RETIRED" },
            },
            select: { state: true },
            distinct: ["state"],
          });
          for (const s of dbStates) {
            if (s.state && s.state.trim()) states.push(s.state.trim());
          }
        } catch (e) {
          // safe db fallback
        }
      }

      const uniqueStates = Array.from(new Set(states.map((s) => s.trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b));
      return NextResponse.json({
        success: true,
        states: uniqueStates,
      });
    }

    if (action === "cities") {
      const state = (searchParams.get("state") || "").trim().toLowerCase();
      const cities = isAllPortals
        ? [
            ...getCertificateCities(state, "participant"),
            ...getCertificateCities(state, "coordinator"),
            ...getCertificateCities(state, "champion"),
            ...getCertificateCities(state, "facility"),
          ]
        : getCertificateCities(state, portal);

      if (prisma && (prisma as any).adminCertificateRecord && state) {
        try {
          const dbCities = await (prisma as any).adminCertificateRecord.findMany({
            where: {
              state: { equals: state, mode: "insensitive" },
              status: { not: "RETIRED" },
            },
            select: { city: true },
            distinct: ["city"],
          });
          for (const c of dbCities) {
            if (c.city && c.city.trim()) cities.push(c.city.trim());
          }
        } catch (e) {
          // safe db fallback
        }
      }

      const uniqueCities = Array.from(new Set(cities.map((c) => c.trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b));
      return NextResponse.json({
        success: true,
        cities: uniqueCities,
      });
    }

    if (action === "venues") {
      const state = (searchParams.get("state") || "").trim().toLowerCase();
      const city = (searchParams.get("city") || "").trim().toLowerCase();
      const venues = isAllPortals
        ? [
            ...getCertificateVenues(state, city, "participant"),
            ...getCertificateVenues(state, city, "coordinator"),
            ...getCertificateVenues(state, city, "champion"),
            ...getCertificateVenues(state, city, "facility"),
          ]
        : getCertificateVenues(state, city, portal);

      if (prisma && (prisma as any).adminCertificateRecord && state && city) {
        try {
          const dbVenues = await (prisma as any).adminCertificateRecord.findMany({
            where: {
              state: { equals: state, mode: "insensitive" },
              city: { equals: city, mode: "insensitive" },
              status: { not: "RETIRED" },
            },
            select: { venueName: true },
            distinct: ["venueName"],
          });
          for (const v of dbVenues) {
            if (v.venueName && v.venueName.trim()) venues.push(v.venueName.trim());
          }
        } catch (e) {
          // safe db fallback
        }
      }

      const uniqueVenues = Array.from(new Set(venues.map((v) => v.trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b));
      return NextResponse.json({
        success: true,
        venues: uniqueVenues,
      });
    }

    if (action === "participants") {
      const state = (searchParams.get("state") || "").trim().toLowerCase();
      const city = (searchParams.get("city") || "").trim().toLowerCase();
      const venue = (searchParams.get("venue") || "").trim().toLowerCase();
      const participants = isAllPortals
        ? [
            ...getCertificateParticipants(state, city, venue, "participant"),
            ...getCertificateParticipants(state, city, venue, "coordinator"),
            ...getCertificateParticipants(state, city, venue, "champion"),
          ]
        : portal === "facility"
        ? []
        : getCertificateParticipants(state, city, venue, portal);

      if (prisma && (prisma as any).adminCertificateRecord && state && city && venue) {
        try {
          const dbParticipants = await (prisma as any).adminCertificateRecord.findMany({
            where: {
              state: { equals: state, mode: "insensitive" },
              city: { equals: city, mode: "insensitive" },
              venueName: { equals: venue, mode: "insensitive" },
              status: { not: "RETIRED" },
            },
            select: { name: true, certificateId: true },
          });
          for (const p of dbParticipants) {
            if (p.name && p.name.trim()) {
              const pCertId = (p.certificateId || "").trim().toUpperCase();
              if (!pCertId || !retiredChampionIds.has(pCertId)) {
                participants.push(p.name.trim());
              }
            }
          }
        } catch (e) {
          // safe db fallback
        }
      }

      const uniqueParticipants = Array.from(new Set(participants.map((p) => p.trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b));
      return NextResponse.json({
        success: true,
        participants: uniqueParticipants,
      });
    }

    if (action === "search-hierarchy") {
      const state = (searchParams.get("state") || "").trim().toLowerCase();
      const city = (searchParams.get("city") || "").trim().toLowerCase();
      const venue = (searchParams.get("venue") || "").trim().toLowerCase();
      const participant = (searchParams.get("participant") || searchParams.get("name") || "").trim().toLowerCase();

      const results: CPRCertificateRecord[] = [];

      if (isAllPortals) {
        const pResults = searchCertificateByHierarchy(state, city, venue, participant, "participant");
        const cResults = searchCertificateByHierarchy(state, city, venue, participant, "coordinator");
        const chResults = searchCertificateByHierarchy(state, city, venue, participant, "champion");
        const fResults = searchCertificateByHierarchy(state, city, venue, participant, "facility");
        results.push(...pResults, ...cResults, ...chResults, ...fResults);
      } else {
        const portalResults = searchCertificateByHierarchy(state, city, venue, participant, portal);
        results.push(...portalResults);
      }

      if (prisma && (prisma as any).adminCertificateRecord && state && participant) {
        try {
          const whereClause: any = {
            state: { equals: state, mode: "insensitive" },
            name: { equals: participant, mode: "insensitive" },
            status: { not: "RETIRED" },
          };
          if (city) {
            whereClause.city = { equals: city, mode: "insensitive" };
          }
          if (venue) {
            whereClause.venueName = { equals: venue, mode: "insensitive" };
          }

          const dbMatches = await (prisma as any).adminCertificateRecord.findMany({
            where: whereClause,
          });

          for (const dbRec of dbMatches) {
            let catTitle = "CPR Aware Citizen";
            let courseTitle = "National IAP CPR Sanjeevani Training Program";
            let portalType: CPRCertificatePortal = "participant";

            if (dbRec.category === "CPR_CHAMPION") {
              catTitle = "CPR Champion";
              courseTitle = "National IAP CPR Sanjeevani Champion Certificate";
              portalType = "champion";
            } else if (dbRec.category === "COURSE_COORDINATOR") {
              catTitle = "Course Coordinator";
              courseTitle = "National IAP CPR Sanjeevani Course Coordinator Certificate";
              portalType = "coordinator";
            } else if (dbRec.category === "CPR_FACILITY") {
              catTitle = "CPR Facility / Venue";
              courseTitle = "National IAP CPR Sanjeevani Training Facility";
              portalType = "facility";
            }

            results.push({
              srNo: "",
              certificateNumber: dbRec.certificateId,
              participantName: dbRec.name,
              mobileNumber: dbRec.mobileNumber || "",
              email: dbRec.email || "",
              zone: "",
              state: dbRec.state,
              city: dbRec.city || "",
              courseCoordinator: dbRec.courseCoordinator || "",
              courseCoordinatorEmail: "",
              venueName: dbRec.venueName || dbRec.name,
              driveLink: "",
              driveFileId: "",
              downloadUrl: "",
              previewUrl: "",
              issueDate: dbRec.certificateDate || "21 July 2026",
              status: dbRec.status || "VALID",
              category: catTitle,
              courseTitle,
              portalType,
            });
          }
        } catch (e) {
          // safe db fallback
        }
      }

      // Filter out any retired / withdrawn certificates from hierarchy results
      const activeResults = results.filter(
        (r) =>
          !retiredChampionIds.has((r.certificateNumber || "").trim().toUpperCase()) &&
          r.status !== "RETIRED" &&
          r.status !== "WITHDRAWN"
      );

      if (activeResults.length > 0) {
        const deduplicated = deduplicatePersonRecords(activeResults).map(ensureCertificateRenderFields);
        return NextResponse.json({ success: true, certificates: deduplicated });
      }

      return NextResponse.json(
        { success: false, error: "No certificate found matching the provided State, City, Venue, and Name combination." },
        { status: 404 }
      );
    }

    // 1. Search by Certificate ID / Venue Code
    if (certId) {
      const normalizedCertId = certId.toUpperCase();

      // Step 0: Check if Certificate is Administratively Retired in PostgreSQL or active retired set
      let retiredRec: any = null;
      if (prisma) {
        try {
          retiredRec = await prisma.adminCertificateRecord.findFirst({
            where: {
              OR: [
                { certificateId: { equals: normalizedCertId, mode: "insensitive" } },
                { id: { equals: certId } },
              ],
              status: "RETIRED",
            },
          });
        } catch (e) {
          // safe db fallback
        }
      }

      if (retiredRec || retiredChampionIds.has(normalizedCertId)) {
        return NextResponse.json({
          success: true,
          isWithdrawn: true,
          isRetired: true,
          status: "WITHDRAWN",
          title: "Certificate Withdrawn",
          message: "This CPR Champion certificate has been withdrawn by the national administration and is no longer valid.",
          error: "This CPR Champion certificate has been withdrawn by the national administration and is no longer valid.",
          certificate: {
            certificateNumber: retiredRec?.certificateId || normalizedCertId,
            participantName: retiredRec?.name || "",
            category: "CPR Champion",
            courseTitle: "National IAP CPR Sanjeevani Champion Certificate",
            venueName: retiredRec?.venueName || "",
            city: retiredRec?.city || "",
            state: retiredRec?.state || "",
            issueDate: retiredRec?.certificateDate || "21 July 2026",
            status: "WITHDRAWN",
            isWithdrawn: true,
            isRetired: true,
            portalType: "champion",
          },
        });
      }

      // Step 1: Check CPR Day CSV records
      let csvMatch: CPRCertificateRecord | null = null;
      csvMatch = searchCertificateById(certId, portal);
      if (!csvMatch) {
        csvMatch =
          searchCertificateById(certId, "facility") ||
          searchCertificateById(certId, "participant") ||
          searchCertificateById(certId, "champion") ||
          searchCertificateById(certId, "coordinator");
      }

      if (csvMatch) {
        return NextResponse.json({
          success: true,
          certificate: ensureCertificateRenderFields(csvMatch),
        });
      }

      // Step 2: Check Database (AdminCertificateRecord & CourseParticipant)
      if (prisma) {
        try {
          // Check AdminCertificateRecord
          const adminRec = await prisma.adminCertificateRecord.findFirst({
            where: {
              OR: [
                { certificateId: { equals: normalizedCertId, mode: "insensitive" } },
                { id: { equals: certId } },
              ],
            },
          });

          if (adminRec) {
            const cId = (adminRec.certificateId || "").toUpperCase();
            let catTitle = "CPR Lay Rescuer";
            let courseTitle = "National IAP CPR Sanjeevani Training Program";
            let portalType: CPRCertificatePortal = "participant";

            if (adminRec.category === "CPR_CHAMPION" || cId.startsWith("IAPCPR/CH/")) {
              catTitle = "CPR Champion";
              courseTitle = "National IAP CPR Sanjeevani Champion Certificate";
              portalType = "champion";
            } else if (adminRec.category === "COURSE_COORDINATOR" || cId.startsWith("IAPCPR/CC/")) {
              catTitle = "Course Coordinator";
              courseTitle = "National IAP CPR Sanjeevani Course Coordinator Certificate";
              portalType = "coordinator";
            } else if (adminRec.category === "CPR_FACILITY" || cId.includes("VENUE")) {
              catTitle = "CPR Facility / Venue";
              courseTitle = "National IAP CPR Sanjeevani Training Facility";
              portalType = "facility";
            } else if (!isCprDayDate(adminRec.certificateDate) && !cId.startsWith("IAPCPR/PA/")) {
              catTitle = "CPR Sanjeevani Lay Rescuer";
              courseTitle = "IAP CPR Sanjeevani Training Program";
              portalType = "participant";
            }

            const rawCert = {
              certificateNumber: adminRec.certificateId,
              participantName: adminRec.name,
              courseTitle,
              venueName: adminRec.venueName || adminRec.name,
              city: adminRec.city || "",
              state: adminRec.state,
              issueDate: adminRec.certificateDate || "21 July 2026",
              status: adminRec.status || "VALID",
              category: catTitle,
              mobileNumber: adminRec.mobileNumber || "",
              email: adminRec.email || "",
              courseCoordinator: adminRec.courseCoordinator || "",
              portalType,
            };

            return NextResponse.json({
              success: true,
              certificate: ensureCertificateRenderFields(rawCert),
            });
          }

          // Check CourseParticipant
          const participantRecord = await prisma.courseParticipant.findFirst({
            where: {
              OR: [
                { certificateNumber: { equals: normalizedCertId, mode: "insensitive" } },
                { id: { equals: certId } },
              ],
            },
            include: {
              participant: true,
              course: true,
            },
          });

          if (participantRecord) {
            const rawCert = {
              certificateNumber: participantRecord.certificateNumber || normalizedCertId,
              participantName: participantRecord.participant.fullName,
              courseTitle: participantRecord.course.title,
              venueName: participantRecord.course.venueName,
              city: participantRecord.course.city,
              state: participantRecord.course.state,
              issueDate: participantRecord.certificateGeneratedAt
                ? new Date(participantRecord.certificateGeneratedAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })
                : "21 July 2026",
              status: participantRecord.certificateStatus,
              category: participantRecord.participant.participantCategory.replace(/_/g, " "),
            };

            return NextResponse.json({
              success: true,
              certificate: ensureCertificateRenderFields(rawCert),
            });
          }
        } catch (dbError) {
          console.error("Database query failed:", dbError);
        }
      }

      // Step 3: Check Sanjeevani / Stored Records (includes CPR Facility certificates)
      const sanjMatch = await searchSanjeevaniById(certId);
      if (sanjMatch) {
        return NextResponse.json({
          success: true,
          certificate: formatSanjeevaniRecord(sanjMatch),
        });
      }

      // If not found anywhere
      return NextResponse.json(
        {
          success: false,
          error: "This Certificate ID / Venue Code is not valid. Please enter a valid Certificate ID (e.g. IAP-CPR-Day/Venue/AN-101, IAPCPR/PA/HP/0101, IAPCPR/CH/MP/0231).",
        },
        { status: 404 }
      );
    }

    // 2. Search by Mobile Number, Email, Venue Name, or Query
    if (query) {
      const allFoundCerts: any[] = [];
      const cleanQ = query.toLowerCase();

      // Step 1: Check CPR Day CSV records
      if (portal !== "facility") {
        if (isAllPortals) {
          const pResults = searchCertificatesByQuery(query, "participant");
          const cResults = searchCertificatesByQuery(query, "coordinator");
          const chResults = searchCertificatesByQuery(query, "champion");
          allFoundCerts.push(...pResults, ...cResults, ...chResults);
        } else {
          const csvResults = searchCertificatesByQuery(query, portal);
          allFoundCerts.push(...csvResults);
        }
      }

      // Step 2: Check Database (AdminCertificateRecord & CourseParticipant)
      const normalizedQuery = query.toLowerCase();
      if (prisma) {
        try {
          const adminMatches = await prisma.adminCertificateRecord.findMany({
            where: {
              status: "VALID",
              OR: [
                { name: { contains: query, mode: "insensitive" } },
                { normalizedName: { contains: cleanQ } },
                { mobileNumber: { contains: query } },
                { email: { equals: normalizedQuery, mode: "insensitive" } },
                { venueName: { contains: query, mode: "insensitive" } },
                { city: { contains: query, mode: "insensitive" } },
                { state: { contains: query, mode: "insensitive" } },
                { certificateId: { contains: query, mode: "insensitive" } },
              ],
            },
            take: 15,
          });

          if (adminMatches.length > 0) {
            for (const adminRec of adminMatches) {
              const cId = (adminRec.certificateId || "").toUpperCase();
              let catTitle = "CPR Lay Rescuer";
              let courseTitle = "National IAP CPR Sanjeevani Training Program";
              let portalType: CPRCertificatePortal = "participant";

              if (adminRec.category === "CPR_CHAMPION" || cId.startsWith("IAPCPR/CH/")) {
                catTitle = "CPR Champion";
                courseTitle = "National IAP CPR Sanjeevani Champion Certificate";
                portalType = "champion";
              } else if (adminRec.category === "COURSE_COORDINATOR" || cId.startsWith("IAPCPR/CC/")) {
                catTitle = "Course Coordinator";
                courseTitle = "National IAP CPR Sanjeevani Course Coordinator Certificate";
                portalType = "coordinator";
              } else if (adminRec.category === "CPR_FACILITY" || cId.includes("VENUE")) {
                catTitle = "CPR Facility / Venue";
                courseTitle = "National IAP CPR Sanjeevani Training Facility";
                portalType = "facility";
              } else if (!isCprDayDate(adminRec.certificateDate) && !cId.startsWith("IAPCPR/PA/")) {
                catTitle = "CPR Sanjeevani Lay Rescuer";
                courseTitle = "IAP CPR Sanjeevani Training Program";
                portalType = "participant";
              }

              allFoundCerts.push({
                certificateNumber: adminRec.certificateId,
                participantName: adminRec.name,
                courseTitle,
                venueName: adminRec.venueName || adminRec.name,
                city: adminRec.city || "",
                state: adminRec.state,
                issueDate: adminRec.certificateDate || "21 July 2026",
                status: adminRec.status || "VALID",
                category: catTitle,
                mobileNumber: adminRec.mobileNumber || "",
                email: adminRec.email || "",
                courseCoordinator: adminRec.courseCoordinator || "",
                portalType,
              });
            }
          }

          const results = await prisma.courseParticipant.findMany({
            where: {
              participant: {
                OR: [
                  { mobileNumber: { contains: query } },
                  { normalizedMobile: { contains: query } },
                  { email: { equals: normalizedQuery, mode: "insensitive" } },
                  { normalizedEmail: { contains: normalizedQuery } },
                  { fullName: { contains: query, mode: "insensitive" } },
                ],
              },
            },
            include: {
              participant: true,
              course: true,
            },
            take: 15,
          });

          if (results.length > 0) {
            const dbCerts = results.map((record) => ({
              certificateNumber: record.certificateNumber || `CPR-2026-${record.id.slice(-6).toUpperCase()}`,
              participantName: record.participant.fullName,
              courseTitle: record.course.title,
              venueName: record.course.venueName,
              city: record.course.city,
              state: record.course.state,
              mobileNumber: record.participant.mobileNumber,
              email: record.participant.email,
              issueDate: record.certificateGeneratedAt
                ? new Date(record.certificateGeneratedAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })
                : "21 July 2026",
              status: record.certificateStatus,
              category: record.participant.participantCategory.replace(/_/g, " "),
            }));
            allFoundCerts.push(...dbCerts);
          }
        } catch (dbError) {
          console.error("Database mobile/email query failed:", dbError);
        }
      }

      // Step 3: Check Sanjeevani / Stored Records (includes CPR Facility certificates)
      const sanjResults = await searchSanjeevaniByQuery(query);
      if (sanjResults.length > 0) {
        const filteredSanj = isAllPortals
          ? sanjResults
          : sanjResults.filter((r) => matchesPortal(r, portal, false));
        const sanjFormatted = filteredSanj.map(formatSanjeevaniRecord);
        allFoundCerts.push(...sanjFormatted);
      }

      const activeFoundCerts = allFoundCerts.filter((c) => {
        const cNum = (c.certificateNumber || c.certificateId || "").trim().toUpperCase();
        return (
          !retiredChampionIds.has(cNum) &&
          c.status !== "RETIRED" &&
          c.status !== "WITHDRAWN" &&
          c.status !== "REVOKED"
        );
      });

      if (activeFoundCerts.length > 0) {
        const deduplicated = deduplicatePersonRecords(activeFoundCerts).map(ensureCertificateRenderFields);
        return NextResponse.json({
          success: true,
          certificates: deduplicated,
        });
      }

      // If not found anywhere
      return NextResponse.json(
        {
          success: false,
          error: "No certificate found matching your search. Please check the spelling or enter your Certificate ID / Venue Code.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Please enter a valid Certificate ID, Venue Code, Mobile Number, or Email ID.",
      },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error fetching certificate:", error);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred while searching for certificate." },
      { status: 500 }
    );
  }
}
