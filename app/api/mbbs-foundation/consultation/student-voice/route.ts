import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  validateStudentVoiceSurvey,
  validateStudentContributorPayload,
} from "@/lib/mbbs-foundation/studentVoiceValidation";

/**
 * POST /api/mbbs-foundation/consultation/student-voice
 *
 * Public endpoint for persisting locked Student Voice V2 survey responses (Stage 1).
 * Saves survey responses FIRST and guarantees persistence.
 */
export async function POST(request: NextRequest) {
  try {
    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON body." },
        { status: 400 }
      );
    }

    // Extract query parameter source if provided
    const sourceParam = request.nextUrl.searchParams.get("source") || body?.source || "direct";

    // 1. Server-side validation & sanitization
    const validation = validateStudentVoiceSurvey(body, sourceParam);
    if (!validation.isValid || !validation.sanitizedData) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed.",
          errors: validation.errors,
        },
        { status: 400 }
      );
    }

    const d = validation.sanitizedData;

    // 2. Persist to PostgreSQL database via Prisma
    const record = await prisma.mBBSStudentVoiceSurveyResponse.create({
      data: {
        surveyVersion: "v2",
        source: d.source,
        trainingStage: d.trainingStage,
        collegeType: d.collegeType,
        state: d.state,
        stateCode: d.stateCode,
        surveyResponses: d.surveyResponses,
        interestedInContributing: false,
        contributionInterests: undefined,
        consentForFollowup: false,
        respondentName: null,
        email: null,
        mobileWhatsapp: null,
        referralCode: null,
        submissionFingerprint: null,
      },
    });

    return NextResponse.json(
      {
        success: true,
        responseId: record.id,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error saving MBBS Student Voice V2 response:", error?.message || error);
    return NextResponse.json(
      {
        success: false,
        error: "Unable to save survey response. Please try again.",
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/mbbs-foundation/consultation/student-voice
 *
 * Optional endpoint for capturing post-submission contributor details (Stage 2: Pass It Forward).
 * Updates an already-saved survey record without altering any survey answers.
 */
export async function PATCH(request: NextRequest) {
  try {
    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON body." },
        { status: 400 }
      );
    }

    // 1. Validate contributor payload
    const validation = validateStudentContributorPayload(body);
    if (!validation.isValid || !validation.sanitizedContributorData) {
      return NextResponse.json(
        {
          success: false,
          error: "Contributor validation failed.",
          errors: validation.errors,
        },
        { status: 400 }
      );
    }

    const c = validation.sanitizedContributorData;

    // 2. Check existing record
    const existing = await prisma.mBBSStudentVoiceSurveyResponse.findUnique({
      where: { id: c.responseId },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Survey response record not found." },
        { status: 404 }
      );
    }

    // 3. Update contributor details additively
    const updated = await prisma.mBBSStudentVoiceSurveyResponse.update({
      where: { id: c.responseId },
      data: {
        interestedInContributing: true,
        contributionInterests: c.contributionInterests,
        respondentName: c.respondentName,
        email: c.email,
        mobileWhatsapp: c.mobileWhatsapp,
        consentForFollowup: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        responseId: updated.id,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error updating Student Voice contributor details:", error?.message || error);
    return NextResponse.json(
      {
        success: false,
        error: "Unable to update contributor details.",
      },
      { status: 500 }
    );
  }
}
