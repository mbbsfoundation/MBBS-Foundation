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
  const isFacility = Boolean(r.category === "CPR_FACILITY" || (r.certificateId && r.certificateId.toUpperCase().includes("VENUE")));
  const isChampion = Boolean(r.category === "CPR_CHAMPION" || (r.certificateId && r.certificateId.toUpperCase().includes("/CH/")));
  const isCoordinator = Boolean((r as any).category === "COORDINATOR" || (r.certificateId && r.certificateId.toUpperCase().includes("/CC/")));

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
  const isFacility = rec.category === "CPR_FACILITY" || (rec.certificateId && rec.certificateId.toUpperCase().includes("VENUE"));
  const isChampion = !isFacility && (rec.category === "CPR_CHAMPION" || (rec.certificateId && rec.certificateId.toUpperCase().includes("/CH/")));
  const isCprDay = !isFacility && (rec.category === "CPR_DAY" || (rec.certificateId && rec.certificateId.toUpperCase().includes("/PA/")));

  let categoryLabel = "CPR Sanjeevani Lay Rescuer";
  let courseTitle = "IAP CPR Sanjeevani Training Program";
  let certCat: "CPR_DAY" | "SANJEEVANI" | "CPR_CHAMPION" | "CPR_FACILITY" = "SANJEEVANI";

  if (isFacility) {
    categoryLabel = "CPR Facility / Venue";
    courseTitle = "National IAP CPR Sanjeevani Training Facility";
    certCat = "CPR_FACILITY";
  } else if (isChampion) {
    categoryLabel = "CPR Champion";
    courseTitle = "National IAP CPR Sanjeevani Training Program";
    certCat = "CPR_CHAMPION";
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
  if (!cert.driveLink && !cert.svg) {
    const certNum = cert.certificateNumber || cert.certificateId || "";
    const isFacility = cert.category === "CPR Facility / Venue" || certNum.toUpperCase().includes("VENUE");
    const isChampion = !isFacility && (cert.category === "CPR Champion" || certNum.toUpperCase().includes("/CH/"));
    const isCoordinator = !isFacility && !isChampion && (cert.category === "Course Coordinator" || certNum.toUpperCase().includes("/CC/"));
    const isCprDay = !isFacility && !isChampion && !isCoordinator;

    let certCat: "CPR_DAY" | "SANJEEVANI" | "CPR_CHAMPION" | "CPR_FACILITY" = "SANJEEVANI";
    if (isFacility) certCat = "CPR_FACILITY";
    else if (isChampion) certCat = "CPR_CHAMPION";
    else if (isCprDay) certCat = "CPR_DAY";

    try {
      cert.svg = generateUnifiedCertificateSvg({
        category: certCat,
        participantName: cert.participantName || "",
        date: cert.issueDate || cert.date || "21-07-2026",
        venue: cert.venueName || cert.venue || "",
        city: cert.city || "",
        state: cert.state || "",
        stateCode: cert.state || "",
        certificateId: certNum,
        courseCoordinator: cert.courseCoordinator,
      });
      cert.pdfFilename = formatCertificateFilename(certNum, cert.participantName, "pdf");
      cert.pngFilename = formatCertificateFilename(certNum, cert.participantName, "png");
      cert.svgFilename = formatCertificateFilename(certNum, cert.participantName, "svg");
    } catch (err) {
      console.error(`Failed to generate SVG for ${certNum}:`, err);
    }
  }
  return cert;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action")?.trim();
    const certId = searchParams.get("id")?.trim() || searchParams.get("certificateId")?.trim();
    const query = searchParams.get("query")?.trim() || searchParams.get("mobile")?.trim() || searchParams.get("email")?.trim();

    const portalParam = (searchParams.get("portal") || searchParams.get("type") || "participant").trim().toLowerCase();
    const isAllPortals = portalParam === "all";
    const portal: CPRCertificatePortal | "facility" =
      portalParam === "facility" || portalParam === "venue"
        ? "facility"
        : portalParam === "champion"
        ? "champion"
        : portalParam === "coordinator"
        ? "coordinator"
        : "participant";

    // Cascading Hierarchy API Actions
    if (action === "states") {
      const cprDayStates = isAllPortals
        ? [
            ...getCertificateStates("participant"),
            ...getCertificateStates("coordinator"),
            ...getCertificateStates("champion"),
          ]
        : portal === "facility"
        ? []
        : getCertificateStates(portal);

      const sanjRecords = getAllSanjeevaniFromStorage();
      const combinedStates = new Set<string>(cprDayStates);

      for (const r of sanjRecords) {
        if (matchesPortal(r, portal, isAllPortals)) {
          if (r.state && r.state.trim().length > 0) {
            combinedStates.add(r.state.trim());
          }
        }
      }

      return NextResponse.json({
        success: true,
        states: Array.from(combinedStates).sort((a, b) => a.localeCompare(b)),
      });
    }

    if (action === "cities") {
      const state = (searchParams.get("state") || "").trim().toLowerCase();
      const cprDayCities = isAllPortals
        ? [
            ...getCertificateCities(state, "participant"),
            ...getCertificateCities(state, "coordinator"),
            ...getCertificateCities(state, "champion"),
          ]
        : portal === "facility"
        ? []
        : getCertificateCities(state, portal);

      const sanjRecords = getAllSanjeevaniFromStorage();
      const combinedCities = new Set<string>(cprDayCities);

      for (const r of sanjRecords) {
        if (matchesPortal(r, portal, isAllPortals)) {
          if (r.state.toLowerCase().trim() === state && r.city && r.city.trim().length > 0) {
            combinedCities.add(r.city.trim());
          }
        }
      }

      return NextResponse.json({
        success: true,
        cities: Array.from(combinedCities).sort((a, b) => a.localeCompare(b)),
      });
    }

    if (action === "venues") {
      const state = (searchParams.get("state") || "").trim().toLowerCase();
      const city = (searchParams.get("city") || "").trim().toLowerCase();
      const cprDayVenues = isAllPortals
        ? [
            ...getCertificateVenues(state, city, "participant"),
            ...getCertificateVenues(state, city, "coordinator"),
            ...getCertificateVenues(state, city, "champion"),
          ]
        : portal === "facility"
        ? []
        : getCertificateVenues(state, city, portal);

      const sanjRecords = getAllSanjeevaniFromStorage();
      const combinedVenues = new Set<string>(cprDayVenues);

      for (const r of sanjRecords) {
        if (matchesPortal(r, portal, isAllPortals)) {
          if (
            r.state.toLowerCase().trim() === state &&
            r.city.toLowerCase().trim() === city &&
            r.venue &&
            r.venue.trim().length > 0
          ) {
            combinedVenues.add(r.venue.trim());
          }
        }
      }

      return NextResponse.json({
        success: true,
        venues: Array.from(combinedVenues).sort((a, b) => a.localeCompare(b)),
      });
    }

    if (action === "participants") {
      const state = (searchParams.get("state") || "").trim().toLowerCase();
      const city = (searchParams.get("city") || "").trim().toLowerCase();
      const venue = (searchParams.get("venue") || "").trim().toLowerCase();
      const cprDayParticipants = isAllPortals
        ? [
            ...getCertificateParticipants(state, city, venue, "participant"),
            ...getCertificateParticipants(state, city, venue, "coordinator"),
            ...getCertificateParticipants(state, city, venue, "champion"),
          ]
        : portal === "facility"
        ? []
        : getCertificateParticipants(state, city, venue, portal);

      const sanjRecords = getAllSanjeevaniFromStorage();
      const combinedParticipants = new Set<string>(cprDayParticipants);

      for (const r of sanjRecords) {
        if (matchesPortal(r, portal, isAllPortals)) {
          if (
            r.state.toLowerCase().trim() === state &&
            r.city.toLowerCase().trim() === city &&
            r.venue.toLowerCase().trim() === venue &&
            r.participantName &&
            r.participantName.trim().length > 0
          ) {
            combinedParticipants.add(r.participantName.trim());
          }
        }
      }

      return NextResponse.json({
        success: true,
        participants: Array.from(combinedParticipants).sort((a, b) => a.localeCompare(b)),
      });
    }

    if (action === "search-hierarchy") {
      const state = (searchParams.get("state") || "").trim().toLowerCase();
      const city = (searchParams.get("city") || "").trim().toLowerCase();
      const venue = (searchParams.get("venue") || "").trim().toLowerCase();
      const participant = (searchParams.get("participant") || searchParams.get("name") || "").trim().toLowerCase();

      const combinedResults: any[] = [];

      // Step 1: Search CPR Day CSV records
      if (portal !== "facility") {
        if (isAllPortals) {
          const pResults = searchCertificateByHierarchy(state, city, venue, participant, "participant");
          const cResults = searchCertificateByHierarchy(state, city, venue, participant, "coordinator");
          const chResults = searchCertificateByHierarchy(state, city, venue, participant, "champion");
          combinedResults.push(...pResults, ...cResults, ...chResults);
        } else {
          const cprDayResults = searchCertificateByHierarchy(state, city, venue, participant, portal);
          combinedResults.push(...cprDayResults);
        }
      }

      // Step 2: Search Sanjeevani / Stored Records
      const sanjRecords = getAllSanjeevaniFromStorage();
      const matchingSanj = sanjRecords.filter((r) => {
        if (!matchesPortal(r, portal, isAllPortals)) return false;
        const matchState = r.state.toLowerCase().trim() === state;
        const matchCity = r.city.toLowerCase().trim() === city;
        const matchVenue = r.venue.toLowerCase().trim() === venue;
        const rName = r.participantName.toLowerCase().trim();
        const matchName = !participant || rName === participant || (participant.length >= 3 && rName.includes(participant));
        return matchState && matchCity && matchVenue && matchName;
      });

      if (matchingSanj.length > 0) {
        const formattedSanj = matchingSanj.map(formatSanjeevaniRecord);
        combinedResults.push(...formattedSanj);
      }

      if (combinedResults.length > 0) {
        const deduplicated = deduplicatePersonRecords(combinedResults).map(ensureCertificateRenderFields);
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

      // Step 1: Check CPR Day CSV records
      let csvMatch: CPRCertificateRecord | null = null;
      if (portal !== "facility") {
        csvMatch = searchCertificateById(certId, portal);
        if (!csvMatch) {
          csvMatch =
            searchCertificateById(certId, "participant") ||
            searchCertificateById(certId, "champion") ||
            searchCertificateById(certId, "coordinator");
        }
      }

      if (csvMatch) {
        return NextResponse.json({
          success: true,
          certificate: ensureCertificateRenderFields(csvMatch),
        });
      }

      // Step 2: Check Database CourseParticipant
      if (prisma) {
        try {
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

      // Step 2: Check Database
      const normalizedQuery = query.toLowerCase();
      if (prisma) {
        try {
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

      if (allFoundCerts.length > 0) {
        const deduplicated = deduplicatePersonRecords(allFoundCerts).map(ensureCertificateRenderFields);
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
