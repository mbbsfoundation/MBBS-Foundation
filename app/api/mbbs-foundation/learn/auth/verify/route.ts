import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  isLearnerAuthEnabled,
  getSecurityHeaders,
  featureDisabledResponse,
  setLearnerSessionCookie,
  clearLearnerSessionCookie,
  setVerifiedTicketCookie,
  clearVerifiedTicketCookie,
} from "@/lib/mbbs-foundation/authConfig";
import {
  consumeLearnerVerificationToken,
  redeemRegistrationTicket,
  createLearnerSessionToken,
} from "@/lib/mbbs-foundation/learnerAuth";

export const dynamic = "force-dynamic";

type VerifyBody = {
  token?: string;
};

export async function POST(request: NextRequest) {
  // 1. Feature flag guard
  if (!isLearnerAuthEnabled()) {
    return featureDisabledResponse();
  }

  try {
    const body = (await request.json().catch(() => ({}))) as VerifyBody;
    const rawToken = typeof body.token === "string" ? body.token.trim() : "";

    if (!rawToken) {
      return NextResponse.json(
        {
          success: false,
          error: "INVALID_TOKEN",
          message: "Verification token is required.",
        },
        { status: 400, headers: getSecurityHeaders() }
      );
    }

    // 2. Atomically consume verification token and mint short-lived registration ticket
    const consumeResult = await consumeLearnerVerificationToken(rawToken);

    if (!consumeResult.success) {
      if (consumeResult.error === "TOKEN_EXPIRED") {
        return NextResponse.json(
          {
            success: false,
            error: "TOKEN_EXPIRED",
            message:
              "This verification link has expired. Please request a new verification email.",
          },
          { status: 400, headers: getSecurityHeaders() }
        );
      }

      if (consumeResult.error === "TOKEN_ALREADY_CONSUMED") {
        return NextResponse.json(
          {
            success: false,
            error: "TOKEN_ALREADY_CONSUMED",
            message:
              "This verification link has already been used. Please request a new verification email.",
          },
          { status: 400, headers: getSecurityHeaders() }
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: "INVALID_TOKEN",
          message: "Invalid verification link. Please request a new verification email.",
        },
        { status: 400, headers: getSecurityHeaders() }
      );
    }

    const { ticketJwt, normalizedEmail, displayEmail } = consumeResult;

    // 3. Inspect existing user and learner profile
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        learningProfile: {
          include: {
            college: {
              select: { id: true, collegeName: true, state: true, city: true },
            },
          },
        },
      },
    });

    // 4. Returning Learner: already registered -> issue learner session directly
    if (existingUser?.learningProfile) {
      if (!existingUser.isActive) {
        return NextResponse.json(
          {
            success: false,
            error: "ACCOUNT_INACTIVE",
            message: "This account cannot be accessed. Please contact support.",
          },
          { status: 403, headers: getSecurityHeaders() }
        );
      }

      // Redeem ticket atomically for returning learner login
      const redeemResult = await redeemRegistrationTicket(ticketJwt!, normalizedEmail!);
      if (!redeemResult.success) {
        return NextResponse.json(
          {
            success: false,
            error: redeemResult.error || "TICKET_REDEMPTION_FAILED",
            message: "Unable to complete login verification. Please try again.",
          },
          { status: 400, headers: getSecurityHeaders() }
        );
      }

      // Issue dedicated learner session token (30-day HttpOnly cookie)
      const sessionToken = await createLearnerSessionToken({
        userId: existingUser.id,
        email: existingUser.learningProfile.email || existingUser.email || normalizedEmail!,
        normalizedEmail: normalizedEmail!,
        profileId: existingUser.learningProfile.id,
      });

      const response = NextResponse.json(
        {
          success: true,
          status: "AUTHENTICATED",
          isNewLearner: false,
          message: "Welcome back! Login successful.",
          user: {
            id: existingUser.id,
            fullName: existingUser.learningProfile.fullName || existingUser.fullName,
            email: existingUser.learningProfile.email || existingUser.email,
          },
          profile: {
            id: existingUser.learningProfile.id,
            fullName: existingUser.learningProfile.fullName,
            learnerCategory: existingUser.learningProfile.learnerCategory,
            institutionName: existingUser.learningProfile.institutionName,
            city: existingUser.learningProfile.city,
            state: existingUser.learningProfile.state,
            district: existingUser.learningProfile.district,
            pinCode: existingUser.learningProfile.pinCode,
            mbbsYear: existingUser.learningProfile.mbbsYear,
            departmentDesignation: existingUser.learningProfile.departmentDesignation,
            college: existingUser.learningProfile.college,
          },
        },
        { status: 200, headers: getSecurityHeaders() }
      );

      setLearnerSessionCookie(response, sessionToken);
      clearVerifiedTicketCookie(response);
      return response;
    }

    // 5. New Learner or Existing Coordinator without profile -> requires profile registration
    // SECURITY REQUIREMENT (Phase 3B.3B): Remove ticket from public JSON responses; retain in HttpOnly cookie
    const response = NextResponse.json(
      {
        success: true,
        status: "REGISTRATION_REQUIRED",
        isNewLearner: true,
        message:
          "Email verified successfully. Please complete your registration profile.",
        email: displayEmail || normalizedEmail,
        normalizedEmail: normalizedEmail,
        hasExistingAccount: !!existingUser,
      },
      { status: 200, headers: getSecurityHeaders() }
    );

    // Store verified ticket in HttpOnly cookie and clear any old session
    setVerifiedTicketCookie(response, ticketJwt!);
    clearLearnerSessionCookie(response);
    return response;
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "INTERNAL_ERROR",
        message: "An unexpected error occurred during verification.",
      },
      { status: 500, headers: getSecurityHeaders() }
    );
  }
}
