import { NextRequest, NextResponse } from "next/server";
import { saveGeneratedBatch, SanjeevaniInputRow, CertificateCategory } from "@/lib/sanjeevaniStorage";
import { generateUnifiedCertificateSvg, formatCertificateFilename } from "@/lib/sanjeevaniCertificate";
import { verifyAdminRequest } from "@/lib/adminAuth";

export async function POST(request: NextRequest) {
  try {
    // Enforce Admin Authentication
    if (!verifyAdminRequest(request)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Admin authentication required." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const rows: SanjeevaniInputRow[] = body.rows || [];
    const fileName: string = body.fileName || "CPR_Batch";
    const allowDuplicates: boolean = Boolean(body.allowDuplicates);

    let forcedCategory: CertificateCategory | undefined = undefined;
    const catParam = (body.category || body.moduleType || "").toUpperCase();
    if (catParam.includes("FACILITY") || catParam.includes("VENUE")) {
      forcedCategory = "CPR_FACILITY";
    } else if (catParam.includes("CHAMPION") || catParam === "CPR_CHAMPION") {
      forcedCategory = "CPR_CHAMPION";
    }

    if (!rows || rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "No rows provided for certificate generation." },
        { status: 400 }
      );
    }

    const validRows = rows.filter((r) => r.isValid);
    if (validRows.length === 0) {
      return NextResponse.json(
        { success: false, error: "No valid rows available to generate certificates." },
        { status: 400 }
      );
    }

    // Atomically allocate sequences, save batch & records
    const result = await saveGeneratedBatch(fileName, validRows, allowDuplicates, forcedCategory);

    // Build downloadable items with filenames and conditional SVGs
    const shouldIncludeSvg = result.certificates.length <= 250;
    const generatedCertificatesWithAssets = result.certificates.map((cert) => {
      let svg = "";
      if (shouldIncludeSvg) {
        svg = generateUnifiedCertificateSvg({
          category: cert.category,
          participantName: cert.participantName,
          date: cert.date,
          venue: cert.venue,
          city: cert.city,
          state: cert.state,
          stateCode: cert.stateCode,
          certificateId: cert.certificateId,
          courseCoordinator: cert.courseCoordinator,
        });
      }

      const pdfFilename = formatCertificateFilename(cert.certificateId, cert.participantName, "pdf");
      const pngFilename = formatCertificateFilename(cert.certificateId, cert.participantName, "png");
      const svgFilename = formatCertificateFilename(cert.certificateId, cert.participantName, "svg");

      return {
        ...cert,
        svg,
        pdfFilename,
        pngFilename,
        svgFilename,
      };
    });

    return NextResponse.json({
      success: true,
      batch: result.batch,
      summary: {
        totalRequested: rows.length,
        successfullyGenerated: result.certificates.length,
        skippedCount: result.skippedCount,
        duplicateCount: result.duplicateCount,
        failedCount: rows.length - validRows.length,
      },
      certificates: generatedCertificatesWithAssets,
    });
  } catch (error: any) {
    console.error("Error in Sanjeevani generation API:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to generate certificates." },
      { status: 500 }
    );
  }
}
