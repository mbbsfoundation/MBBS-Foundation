import { NextRequest, NextResponse } from "next/server";
import { validateRecommendationRequest } from "@/lib/counselling/validation";
import { generateRecommendations, OpportunityBand, CounsellingRecommendation } from "@/lib/counselling/recommendationEngine";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(request: NextRequest) {
  try {
    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Malformed JSON payload in request body",
            details: [{ field: "body", message: "Invalid JSON format" }],
          },
        },
        { status: 400 }
      );
    }

    // 1. Validate Input Payload
    const validation = validateRecommendationRequest(body);
    if (!validation.isValid || !validation.data) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Request validation failed",
            details: validation.errors,
          },
        },
        { status: 400 }
      );
    }

    const { profile, limitPerBand, opportunityBands, confidenceLevels, route, state, managementType, quota, hasSeatIncrease2026, isNewEstablishment2026 } = validation.data;

    // 2. Generate Deterministic Recommendations via Recommendation Engine
    const result = await generateRecommendations(profile, {
      opportunityBands,
      confidenceLevels,
      route,
      state,
      managementType,
      quota,
      hasSeatIncrease2026,
      isNewEstablishment2026,
    });

    // 3. Response Limiting (Bounded rows per Opportunity Band)
    const bandBuckets: Record<OpportunityBand, CounsellingRecommendation[]> = {
      STRONG: [],
      REALISTIC: [],
      STRETCH: [],
      LOW_EVIDENCE: [],
    };

    result.recommendations.forEach((r) => {
      if (bandBuckets[r.opportunityBand].length < limitPerBand) {
        bandBuckets[r.opportunityBand].push(r);
      }
    });

    const limitedRecommendations = [
      ...bandBuckets.STRONG,
      ...bandBuckets.REALISTIC,
      ...bandBuckets.STRETCH,
      ...bandBuckets.LOW_EVIDENCE,
    ];

    // 4. Return Structured Response
    return NextResponse.json(
      {
        profile: {
          air: profile.air,
          category: profile.category,
          isPwD: profile.isPwD,
          domicileState: profile.domicileState,
          gender: profile.gender,
          goal: profile.goal,
          currentCollegeId: profile.currentCollegeId,
          currentQuota: profile.currentQuota,
          currentSeatCategory: profile.currentSeatCategory,
        },
        summary: {
          totalEvaluated: result.totalEvaluated,
          totalReturned: limitedRecommendations.length,
          strong: result.bandCounts.STRONG,
          realistic: result.bandCounts.REALISTIC,
          stretch: result.bandCounts.STRETCH,
          lowEvidence: result.bandCounts.LOW_EVIDENCE,
        },
        limits: {
          limitPerBand,
          maxLimit: 100,
        },
        recommendations: limitedRecommendations,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          "Pragma": "no-cache",
          "Expires": "0",
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "An internal server error occurred while processing recommendations.",
          details: [],
        },
      },
      { status: 500 }
    );
  }
}
