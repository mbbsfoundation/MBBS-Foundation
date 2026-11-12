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
import { generateRandomizedAssessmentAttempt } from "@/lib/mbbs-foundation/reviveAssessmentData";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!isLearnerAuthEnabled()) {
    return featureDisabledResponse();
  }

  // Verify learner session (Registered learners only)
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
        message: "Enrolled learner sign-in required to take the assessment.",
      },
      { status: 401, headers: getSecurityHeaders() }
    );
  }

  const payload = await verifyLearnerSessionToken(sessionToken);
  if (!payload || !payload.userId) {
    return NextResponse.json(
      {
        success: false,
        error: "SESSION_EXPIRED",
        message: "Your learner session has expired. Please sign in again.",
      },
      { status: 401, headers: getSecurityHeaders() }
    );
  }

  // Generate randomized attempt with guaranteed 5-5-5-5 option balancing
  const attempt = generateRandomizedAssessmentAttempt();

  return NextResponse.json(
    {
      success: true,
      attemptId: attempt.attemptId,
      attemptToken: attempt.attemptToken,
      totalQuestions: attempt.clientQuestions.length,
      questions: attempt.clientQuestions,
    },
    { status: 200, headers: getSecurityHeaders() }
  );
}

