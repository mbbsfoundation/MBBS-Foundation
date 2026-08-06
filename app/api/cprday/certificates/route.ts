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
} from "@/lib/cprCertificates";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action")?.trim();
    const certId = searchParams.get("id")?.trim() || searchParams.get("certificateId")?.trim();
    const query = searchParams.get("query")?.trim() || searchParams.get("mobile")?.trim() || searchParams.get("email")?.trim();

    const portalParam = (searchParams.get("portal") || searchParams.get("type") || "participant").trim();
    const portal: CPRCertificatePortal =
      portalParam === "champion" ? "champion" : portalParam === "coordinator" ? "coordinator" : "participant";

    // Cascading Hierarchy API Actions
    if (action === "states") {
      return NextResponse.json({ success: true, states: getCertificateStates(portal) });
    }

    if (action === "cities") {
      const state = searchParams.get("state") || "";
      return NextResponse.json({ success: true, cities: getCertificateCities(state, portal) });
    }

    if (action === "venues") {
      const state = searchParams.get("state") || "";
      const city = searchParams.get("city") || "";
      return NextResponse.json({ success: true, venues: getCertificateVenues(state, city, portal) });
    }

    if (action === "participants") {
      const state = searchParams.get("state") || "";
      const city = searchParams.get("city") || "";
      const venue = searchParams.get("venue") || "";
      return NextResponse.json({ success: true, participants: getCertificateParticipants(state, city, venue, portal) });
    }

    if (action === "search-hierarchy") {
      const state = searchParams.get("state") || "";
      const city = searchParams.get("city") || "";
      const venue = searchParams.get("venue") || "";
      const participant = searchParams.get("participant") || searchParams.get("name") || "";

      const results = searchCertificateByHierarchy(state, city, venue, participant, portal);
      if (results.length > 0) {
        return NextResponse.json({ success: true, certificates: results });
      }
      return NextResponse.json(
        { success: false, error: "No certificate found matching the provided State, City, Venue, and Name combination." },
        { status: 404 }
      );
    }

    // 1. Search by Certificate ID
    if (certId) {
      const normalizedCertId = certId.toUpperCase();

      // Check CSV files first
      const csvMatch = searchCertificateById(certId, portal);
      if (csvMatch) {
        return NextResponse.json({
          success: true,
          certificate: csvMatch,
        });
      }

      // Check database
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
            return NextResponse.json({
              success: true,
              certificate: {
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
              },
            });
          }
        } catch (dbError) {
          console.error("Database query failed:", dbError);
        }
      }

      // If not found anywhere
      return NextResponse.json(
        {
          success: false,
          error: "This Certificate ID is not valid. Please enter a valid Certificate ID.",
        },
        { status: 404 }
      );
    }

    // 2. Search by Mobile Number or Email
    if (query) {
      const csvResults = searchCertificatesByQuery(query);
      if (csvResults.length > 0) {
        return NextResponse.json({
          success: true,
          certificates: csvResults,
        });
      }

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
                ],
              },
            },
            include: {
              participant: true,
              course: true,
            },
            take: 10,
          });

          if (results.length > 0) {
            const certificates = results.map((record) => ({
              certificateNumber: record.certificateNumber || `CPR-2026-${record.id.slice(-6).toUpperCase()}`,
              participantName: record.participant.fullName,
              courseTitle: record.course.title,
              venueName: record.course.venueName,
              city: record.course.city,
              state: record.course.state,
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

            return NextResponse.json({
              success: true,
              certificates,
            });
          }
        } catch (dbError) {
          console.error("Database mobile/email query failed:", dbError);
        }
      }

      // If not found anywhere
      return NextResponse.json(
        {
          success: false,
          error: "This Certificate ID, Mobile Number, or Email ID is not valid. Please enter a valid ID.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Please enter a valid Certificate ID, Mobile Number, or Email ID.",
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
