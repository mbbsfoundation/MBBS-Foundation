import { NextRequest, NextResponse } from "next/server";
import {
  isLearnerAuthEnabled,
  getSecurityHeaders,
  featureDisabledResponse,
  verifyCsrf,
  setLearnerSessionCookie,
  clearVerifiedTicketCookie,
} from "@/lib/mbbs-foundation/authConfig";
import {
  LEARNER_VERIFIED_TICKET_COOKIE,
  createLearnerSessionToken,
} from "@/lib/mbbs-foundation/learnerAuth";
import {
  validateRegistrationInput,
  executeLearnerRegistration,
  RegistrationError,
} from "@/lib/mbbs-foundation/learnerRegistration";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  // 1. Feature flag guard
  if (!isLearnerAuthEnabled()) {
    return featureDisabledResponse();
  }

  // 2. CSRF protection for cookie-authenticated / state-changing requests
  if (!verifyCsrf(request)) {
    return NextResponse.json(
      {
        success: false,
        error: "CSRF_FORBIDDEN",
        message: "Invalid request origin or cross-site request blocked.",
      },
      { status: 403, headers: getSecurityHeaders() }
    );
  }

  try {
    const body = await request.json().catch(() => ({}));

    // 3. Extract ticket from request body or HttpOnly cookie
    const ticketFromCookie = request.cookies.get(
      LEARNER_VERIFIED_TICKET_COOKIE
    )?.value;
    const ticket =
      typeof body.ticket === "string" && body.ticket.trim().length > 0
        ? body.ticket.trim()
        : ticketFromCookie;

    if (!ticket) {
      return NextResponse.json(
        {
          success: false,
          error: "MISSING_TICKET",
          message:
            "A valid verification ticket is required to register. Please verify your email first.",
        },
        { status: 401, headers: getSecurityHeaders() }
      );
    }

    // 4. Validate registration fields
    const validation = validateRegistrationInput(body);
    if (!validation.isValid || !validation.data) {
      return NextResponse.json(
        {
          success: false,
          error: "VALIDATION_FAILED",
          message: validation.message || "Invalid registration data.",
          errors: validation.errors,
        },
        { status: 400, headers: getSecurityHeaders() }
      );
    }

    // 5. Atomic transaction: ticket redemption + User validation/protection + profile persistence
    const { user, profile } = await executeLearnerRegistration({
      input: validation.data,
      ticketJwt: ticket,
    });

    // 6. Issue persistent 30-day learner session
    const sessionToken = await createLearnerSessionToken({
      userId: user.id,
      email: profile.email || user.email || validation.data.normalizedEmail,
      normalizedEmail: validation.data.normalizedEmail,
      profileId: profile.id,
    });

    const response = NextResponse.json(
      {
        success: true,
        message:
          "Registration successful! Welcome to the MBBS Foundation Online Learning Programme.",
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
        },
        profile: {
          id: profile.id,
          fullName: profile.fullName,
          learnerCategory: profile.learnerCategory,
          institutionName: profile.institutionName,
          city: profile.city,
          state: profile.state,
          district: profile.district,
          pinCode: profile.pinCode,
          mbbsYear: profile.mbbsYear,
          departmentDesignation: profile.departmentDesignation,
          college: profile.college,
        },
      },
      { status: 201, headers: getSecurityHeaders() }
    );

    // Set learner session cookie and consume/clear temporary ticket cookie
    setLearnerSessionCookie(response, sessionToken);
    clearVerifiedTicketCookie(response);
    return response;
  } catch (error: any) {
    if (error instanceof RegistrationError) {
      return NextResponse.json(
        {
          success: false,
          error: error.code,
          message: error.message,
        },
        { status: error.statusCode, headers: getSecurityHeaders() }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "INTERNAL_ERROR",
        message: "An unexpected error occurred during registration. Please try again.",
      },
      { status: 500, headers: getSecurityHeaders() }
    );
  }
}
