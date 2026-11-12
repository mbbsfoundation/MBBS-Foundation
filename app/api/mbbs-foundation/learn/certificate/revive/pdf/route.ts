import { NextRequest, NextResponse } from "next/server";
import {
  isLearnerAuthEnabled,
  getSecurityHeaders,
  featureDisabledResponse,
} from "@/lib/mbbs-foundation/authConfig";
import {
  LEARNER_SESSION_COOKIE,
  verifyLearnerSessionToken,
} from "@/lib/mbbs-foundation/learnerAuth";
import { getReviveCertificateForUser } from "@/lib/mbbs-foundation/reviveCertificateService";
import { generateReviveCertificatePdf } from "@/lib/mbbs-foundation/reviveCertificatePdf";

export const dynamic = "force-dynamic";

/**
 * GET /api/mbbs-foundation/learn/certificate/revive/pdf
 * Authenticated endpoint: Generates and streams the official A4 Landscape PDF for Module 7: REVIVE.
 */
export async function GET(request: NextRequest) {
  if (!isLearnerAuthEnabled()) {
    return featureDisabledResponse();
  }

  const cookieToken = request.cookies.get(LEARNER_SESSION_COOKIE)?.value;
  const authHeader = request.headers.get("authorization");
  const bearerToken =
    authHeader && authHeader.startsWith("Bearer ")
      ? authHeader.substring(7).trim()
      : null;
  const sessionToken = cookieToken || bearerToken;

  if (!sessionToken) {
    return NextResponse.json(
      {
        success: false,
        error: "AUTHENTICATION_REQUIRED",
        message: "Enrolled learner sign-in required to download certificate.",
      },
      { status: 401, headers: getSecurityHeaders() }
    );
  }

  const sessionPayload = await verifyLearnerSessionToken(sessionToken);
  if (!sessionPayload || !sessionPayload.userId) {
    return NextResponse.json(
      {
        success: false,
        error: "SESSION_EXPIRED",
        message: "Session expired. Please sign in again.",
      },
      { status: 401, headers: getSecurityHeaders() }
    );
  }

  try {
    const certificate = await getReviveCertificateForUser(sessionPayload.userId);

    if (!certificate) {
      return NextResponse.json(
        {
          success: false,
          error: "CERTIFICATE_NOT_FOUND",
          message: "You have not yet completed the assessment requirements for this module.",
        },
        { status: 404, headers: getSecurityHeaders() }
      );
    }

    const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || "mbbsfoundation.com";
    const protocol = request.headers.get("x-forwarded-proto") || "https";
    const verificationBaseUrl = `${protocol}://${host}`;

    // Generate authentic A4 Landscape PDF with vector QR code
    const pdfBytes = await generateReviveCertificatePdf({
      certificateId: certificate.certificateId,
      learnerName: certificate.learnerName,
      medicalCollege: certificate.medicalCollege,
      moduleTitle: certificate.moduleTitle,
      issuedAt: certificate.issuedAt,
      verificationBaseUrl,
    });

    const isDownload = request.nextUrl.searchParams.get("download") === "1";
    const dispositionType = isDownload ? "attachment" : "inline";

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `${dispositionType}; filename="REVIVE-Certificate-${certificate.certificateId}.pdf"`,
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Error generating REVIVE certificate PDF:", error);
    return NextResponse.json(
      {
        success: false,
        error: "PDF_GENERATION_FAILED",
        message: "Failed to generate certificate PDF document.",
      },
      { status: 500, headers: getSecurityHeaders() }
    );
  }
}

