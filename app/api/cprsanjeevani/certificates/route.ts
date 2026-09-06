import { NextRequest, NextResponse } from "next/server";
import { searchSanjeevaniById, searchSanjeevaniByQuery } from "@/lib/sanjeevaniStorage";
import { generateUnifiedCertificateSvg, formatCertificateFilename } from "@/lib/sanjeevaniCertificate";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const certId = searchParams.get("id")?.trim() || searchParams.get("certificateId")?.trim();
    const query = searchParams.get("query")?.trim() || searchParams.get("mobile")?.trim() || searchParams.get("email")?.trim();
    const action = searchParams.get("action")?.trim();

    // 1. Search by Certificate ID
    if (certId) {
      const record = await searchSanjeevaniById(certId);
      if (!record) {
        return NextResponse.json(
          {
            success: false,
            error: "This Certificate ID is not valid. Please enter a valid Certificate ID (e.g. IAPCPR/PA/HP/0101 or IAPCPR/Sanjeevani/ML/0101).",
          },
          { status: 404 }
        );
      }

      if (record.status === "RETIRED") {
        if (action === "svg") {
          return NextResponse.json(
            { success: false, error: "This certificate has been administratively withdrawn/retired." },
            { status: 410 }
          );
        }
        return NextResponse.json({
          success: true,
          isRetired: true,
          status: "RETIRED",
          message: "This certificate has been administratively withdrawn/retired by the course coordinator.",
          certificate: {
            ...record,
            status: "RETIRED",
            isRetired: true,
          },
        });
      }

      const svg = generateUnifiedCertificateSvg({
        category: record.category,
        participantName: record.participantName,
        date: record.date,
        venue: record.venue,
        city: record.city,
        state: record.state,
        stateCode: record.stateCode,
        certificateId: record.certificateId,
      });

      const pdfFilename = formatCertificateFilename(record.certificateId, record.participantName, "pdf");
      const pngFilename = formatCertificateFilename(record.certificateId, record.participantName, "png");

      if (action === "svg") {
        return new NextResponse(svg, {
          headers: {
            "Content-Type": "image/svg+xml",
            "Content-Disposition": `inline; filename="${formatCertificateFilename(record.certificateId, record.participantName, "svg")}"`,
          },
        });
      }

      return NextResponse.json({
        success: true,
        certificate: {
          ...record,
          svg,
          pdfFilename,
          pngFilename,
        },
      });
    }

    // 2. Search by Query (Name / Mobile / Email)
    if (query) {
      const records = await searchSanjeevaniByQuery(query);
      if (records.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: "No certificate found matching your search. Please check the spelling or enter your Certificate ID.",
          },
          { status: 404 }
        );
      }

      const certificatesWithAssets = records.map((record) => {
        const svg = generateUnifiedCertificateSvg({
          category: record.category,
          participantName: record.participantName,
          date: record.date,
          venue: record.venue,
          city: record.city,
          state: record.state,
          stateCode: record.stateCode,
          certificateId: record.certificateId,
        });

        return {
          ...record,
          svg,
          pdfFilename: formatCertificateFilename(record.certificateId, record.participantName, "pdf"),
          pngFilename: formatCertificateFilename(record.certificateId, record.participantName, "png"),
        };
      });

      return NextResponse.json({
        success: true,
        certificates: certificatesWithAssets,
      });
    }

    return NextResponse.json(
      { success: false, error: "Please provide a Certificate ID, Participant Name, Mobile Number, or Email to search." },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("Error in Sanjeevani certificates search API:", error);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred while searching for certificate." },
      { status: 500 }
    );
  }
}
