import { NextRequest, NextResponse } from "next/server";
import { getPublicReviveCertificate } from "@/lib/mbbs-foundation/reviveCertificateService";
import { getSecurityHeaders } from "@/lib/mbbs-foundation/authConfig";

export const dynamic = "force-dynamic";

/**
 * GET /api/mbbs-foundation/learn/verify/[certificateId]
 * Public Verification Endpoint: Checks the authenticity of an issued MBBS Foundation certificate.
 * Strictly preserves privacy: Does not expose email, mobile number, or assessment question logs.
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ certificateId: string }> }
) {
  try {
    const { certificateId } = await context.params;

    if (!certificateId) {
      return NextResponse.json(
        {
          success: false,
          error: "MISSING_CERTIFICATE_ID",
          message: "Certificate identifier is required.",
        },
        { status: 400, headers: getSecurityHeaders() }
      );
    }

    const certRecord = await getPublicReviveCertificate(certificateId);

    if (!certRecord) {
      return NextResponse.json(
        {
          success: false,
          isValid: false,
          error: "CERTIFICATE_NOT_FOUND",
          message: "No authentic credential found with the specified Certificate ID.",
        },
        { status: 404, headers: getSecurityHeaders() }
      );
    }

    return NextResponse.json(
      {
        success: true,
        ...certRecord,
      },
      {
        status: 200,
        headers: {
          ...getSecurityHeaders(),
          "Cache-Control": "public, max-age=60, s-maxage=300",
        },
      }
    );
  } catch (error) {
    console.error("Public verification error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "INTERNAL_ERROR",
        message: "An error occurred while verifying the credential.",
      },
      { status: 500, headers: getSecurityHeaders() }
    );
  }
}

