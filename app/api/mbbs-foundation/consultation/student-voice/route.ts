import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateStudentVoiceSurvey } from "@/lib/mbbs-foundation/studentVoiceValidation";

/**
 * POST /api/mbbs-foundation/consultation/student-voice
 *
 * Public endpoint for persisting validated Student & Intern Voice Survey responses.
 * Strictly isolated from CPR and user authentication models.
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
        surveyVersion: "v1",
        source: d.source,
        trainingStage: d.trainingStage,
        collegeType: d.collegeType,
        state: d.state,
        stateCode: d.stateCode,
        surveyResponses: d.surveyResponses,
        interestedInContributing: d.interestedInContributing,
        contributionInterests: d.contributionInterests || undefined,
        consentForFollowup: d.consentForFollowup,
        respondentName: d.respondentName,
        email: d.email,
        mobileWhatsapp: d.mobileWhatsapp,
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
    console.error("Error saving MBBS Student Voice response:", error?.message || error);
    return NextResponse.json(
      {
        success: false,
        error: "Unable to save survey response.",
      },
      { status: 500 }
    );
  }
}
