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
import {
  getReviveCertificateForUser,
  REVIVE_CERTIFICATE_CONFIG,
} from "@/lib/mbbs-foundation/reviveCertificateService";

export const dynamic = "force-dynamic";

/**
 * GET /api/mbbs-foundation/learn/certificate/revive
 * Authenticated endpoint: Retrieves the earned REVIVE certificate for the current learner.
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
        message: "Enrolled learner sign-in required to view certificate.",
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
          success: true,
          hasCertificate: false,
          certificate: null,
          message: "No certificate earned yet for Module 7: REVIVE.",
        },
        { status: 200, headers: getSecurityHeaders() }
      );
    }

    return NextResponse.json(
      {
        success: true,
        hasCertificate: true,
        certificate: {
          certificateId: certificate.certificateId,
          learnerName: certificate.learnerName,
          medicalCollege: certificate.medicalCollege,
          moduleCode: certificate.moduleCode,
          moduleTitle: certificate.moduleTitle,
          score: certificate.score,
          percentage: certificate.percentage,
          issuedAt: certificate.issuedAt,
          disclaimer: REVIVE_CERTIFICATE_CONFIG.disclaimer,
          organization: REVIVE_CERTIFICATE_CONFIG.issuingOrganization,
          initiative: REVIVE_CERTIFICATE_CONFIG.initiative,
          association: REVIVE_CERTIFICATE_CONFIG.association,
        },
      },
      { status: 200, headers: getSecurityHeaders() }
    );
  } catch (error) {
    console.error("Error retrieving REVIVE certificate:", error);
    return NextResponse.json(
      {
        success: false,
        error: "INTERNAL_ERROR",
        message: "Failed to retrieve certificate details.",
      },
      { status: 500, headers: getSecurityHeaders() }
    );
  }
}

