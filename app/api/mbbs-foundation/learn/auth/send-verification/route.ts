import { NextRequest, NextResponse } from "next/server";
import {
  isLearnerAuthEnabled,
  getSecurityHeaders,
  featureDisabledResponse,
  getClientIp,
  getCanonicalAppBaseUrl,
} from "@/lib/mbbs-foundation/authConfig";
import {
  createLearnerVerificationRecord,
  normalizeEmail,
} from "@/lib/mbbs-foundation/learnerAuth";
import { sendLearnerVerificationEmail } from "@/lib/mbbs-foundation/emailService";

export const dynamic = "force-dynamic";

type SendVerificationBody = {
  email?: string;
};

export async function POST(request: NextRequest) {
  // 1. Feature flag guard
  if (!isLearnerAuthEnabled()) {
    return featureDisabledResponse();
  }

  try {
    const body = (await request.json().catch(() => ({}))) as SendVerificationBody;
    const rawEmail = typeof body.email === "string" ? body.email.trim() : "";

    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
    if (!rawEmail || !emailRegex.test(rawEmail) || rawEmail.length > 150) {
      return NextResponse.json(
        {
          success: false,
          error: "INVALID_EMAIL",
          message: "Please enter a valid email address.",
        },
        { status: 400, headers: getSecurityHeaders() }
      );
    }

    const clientIp = getClientIp(request);
    const normalizedEmail = normalizeEmail(rawEmail);

    // 2. Multi-instance persistent rate limiting & single-use token creation
    const recordResult = await createLearnerVerificationRecord({
      email: rawEmail,
      ipAddress: clientIp,
    });

    if (!recordResult.success) {
      if (recordResult.error === "RATE_LIMITED") {
        return NextResponse.json(
          {
            success: false,
            error: "RATE_LIMITED",
            message:
              "Too many verification requests. Please wait a few minutes before trying again.",
            retryAfterSeconds: recordResult.retryAfterSeconds,
          },
          {
            status: 429,
            headers: {
              ...getSecurityHeaders(),
              "Retry-After": String(recordResult.retryAfterSeconds || 60),
            },
          }
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: "VERIFICATION_INITIATION_FAILED",
          message: "Unable to initiate email verification. Please try again.",
        },
        { status: 500, headers: getSecurityHeaders() }
      );
    }

    // 3. Dispatch verification email via registered transactional provider (fixed canonical URL)
    const appBaseUrl = getCanonicalAppBaseUrl();

    const verificationUrl = `${appBaseUrl}/mbbs-foundation/learn/auth/verify?token=${encodeURIComponent(
      recordResult.rawToken!
    )}`;

    const emailResult = await sendLearnerVerificationEmail({
      toEmail: rawEmail,
      normalizedEmail,
      verificationUrl,
      expiresInMinutes: 15,
    });

    // 4. Strict requirement: Do not report success unless provider confirmed acceptance
    if (!emailResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "EMAIL_SERVICE_UNAVAILABLE",
          message:
            "Verification email service is currently unavailable. Please try again later or contact support.",
        },
        { status: 503, headers: getSecurityHeaders() }
      );
    }

    // Safe response without exposing account existence or tokens
    return NextResponse.json(
      {
        success: true,
        message:
          "If the email address is valid, a verification link has been sent. Please check your inbox.",
      },
      { status: 200, headers: getSecurityHeaders() }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "INTERNAL_ERROR",
        message: "An unexpected error occurred while processing your request.",
      },
      { status: 500, headers: getSecurityHeaders() }
    );
  }
}
