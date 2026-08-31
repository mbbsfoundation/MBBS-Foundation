import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateProfessionalSurveyPayload } from "@/lib/mbbs-foundation/professionalSurveyValidation";

/**
 * POST /api/mbbs-foundation/consultation/professional
 *
 * Public endpoint for persisting validated Professional Consultation Survey responses.
 * Strictly decoupled from all CPR and user authentication models.
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

    // 1. Server-side validation & sanitization
    const validation = validateProfessionalSurveyPayload(body);
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
    const record = await prisma.mBBSProfessionalSurveyResponse.create({
      data: {
        surveyVersion: "v1",
        source: d.source,
        roles: d.roles,
        specialty: d.specialty,
        teachingExperience: d.teachingExperience,
        institutionName: d.institutionName,
        city: d.city,
        state: d.state,
        stateCode: d.stateCode,
        surveyResponses: d.surveyResponses,
        interestedInContributing: d.interestedInContributing,
        contributionInterests:
          d.q20ContributionTypes.length > 0
            ? d.q20ContributionTypes
            : undefined,
        willingToShareReadinessSurvey: d.willingToShareReadinessSurvey,
        respondentName: d.respondentName,
        email: d.email,
        mobileWhatsapp: d.mobileWhatsapp,
        consentForFollowup: d.consentForFollowup,
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
    // Log error message without sensitive personal info
    console.error("Error saving MBBS Professional Survey response:", error?.message || error);
    return NextResponse.json(
      {
        success: false,
        error: "Unable to save survey response.",
      },
      { status: 500 }
    );
  }
}
