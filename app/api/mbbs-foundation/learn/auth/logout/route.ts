import { NextRequest, NextResponse } from "next/server";
import {
  isLearnerAuthEnabled,
  getSecurityHeaders,
  featureDisabledResponse,
  verifyCsrf,
  clearLearnerSessionCookie,
  clearVerifiedTicketCookie,
} from "@/lib/mbbs-foundation/authConfig";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  // 1. Feature flag guard
  if (!isLearnerAuthEnabled()) {
    return featureDisabledResponse();
  }

  // 2. CSRF protection for state-changing logout requests
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

  // 3. Clear session and ticket cookies
  const response = NextResponse.json(
    {
      success: true,
      message: "Logged out successfully.",
    },
    { status: 200, headers: getSecurityHeaders() }
  );

  clearLearnerSessionCookie(response);
  clearVerifiedTicketCookie(response);

  return response;
}
