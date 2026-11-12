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
  verifyAttemptPayload,
  evaluateAttemptAnswers,
  ClientAssessmentQuestion,
} from "@/lib/mbbs-foundation/reviveAssessmentData";
import { issueReviveCertificate } from "@/lib/mbbs-foundation/reviveCertificateService";

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
        message: "Enrolled learner sign-in required to submit the assessment.",
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
        message: "Your learner session has expired. Please sign in again.",
      },
      { status: 401, headers: getSecurityHeaders() }
    );
  }

  try {
    const body = await request.json();
    const { attemptId, attemptToken, answers, clientQuestions } = body as {
      attemptId?: string;
      attemptToken?: string;
      answers?: Record<string, "A" | "B" | "C" | "D">;
      clientQuestions?: ClientAssessmentQuestion[];
    };

    if (!attemptId || !attemptToken || !answers || !Array.isArray(clientQuestions)) {
      return NextResponse.json(
        {
          success: false,
          error: "INVALID_REQUEST",
          message: "Assessment submission payload is incomplete.",
        },
        { status: 400, headers: getSecurityHeaders() }
      );
    }

    // Cryptographically verify attemptToken (HMAC-SHA256)
    const tokenResult = verifyAttemptPayload(attemptToken);
    if (!tokenResult.valid || !tokenResult.payload) {
      return NextResponse.json(
        {
          success: false,
          error: tokenResult.error || "INVALID_ATTEMPT_TOKEN",
          message: "This assessment attempt is invalid or has expired. Please start a new attempt.",
        },
        { status: 400, headers: getSecurityHeaders() }
      );
    }

    if (tokenResult.payload.attemptId !== attemptId) {
      return NextResponse.json(
        {
          success: false,
          error: "ATTEMPT_MISMATCH",
          message: "Assessment attempt ID does not match token payload.",
        },
        { status: 400, headers: getSecurityHeaders() }
      );
    }

    // Evaluate answers server-side against the verified answer key
    const evaluation = evaluateAttemptAnswers(
      answers,
      tokenResult.payload.key,
      tokenResult.payload.explanations,
      clientQuestions
    );

    // If passing (>= 14/20 or >= 70%), persist/retrieve certificate idempotently
    let certificate = null;
    if (evaluation.passed && sessionPayload.userId) {
      try {
        const certResult = await issueReviveCertificate({
          userId: sessionPayload.userId,
          score: evaluation.score,
          percentage: evaluation.percentage,
        });
        certificate = {
          certificateId: certResult.certificate.certificateId,
          learnerName: certResult.certificate.learnerName,
          medicalCollege: certResult.certificate.medicalCollege,
          moduleTitle: certResult.certificate.moduleTitle,
          issuedAt: certResult.certificate.issuedAt,
          isNew: certResult.isNew,
        };
      } catch (certError) {
        console.error("Certificate generation error:", certError);
      }
    }

    return NextResponse.json(
      {
        success: true,
        result: evaluation,
        certificate,
      },
      { status: 200, headers: getSecurityHeaders() }
    );
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: "INTERNAL_ERROR",
        message: "Failed to evaluate assessment submission.",
      },
      { status: 500, headers: getSecurityHeaders() }
    );
  }
}

