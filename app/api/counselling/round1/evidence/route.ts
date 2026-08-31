import { NextRequest, NextResponse } from "next/server";
import { validateEvidenceQueryParams } from "@/lib/counselling/validation";
import { getRound1Evidence } from "@/lib/counselling/evidenceService";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // 1. Validate Query Parameters
    const validation = validateEvidenceQueryParams(searchParams);
    if (!validation.isValid || !validation.params) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid query parameters for Round-1 evidence request",
            details: validation.errors,
          },
        },
        { status: 400 }
      );
    }

    const {
      air,
      window,
      category,
      categoryMode,
      isPwD,
      domicileState,
      quota,
      managementType,
      state,
      page,
      pageSize,
    } = validation.params;

    // 2. Fetch Scoped Round-1 Evidence
    const evidence = await getRound1Evidence({
      air,
      window,
      category,
      categoryMode,
      isPwD,
      domicileState,
      quota,
      managementType,
      state,
      page,
      pageSize,
    });

    return NextResponse.json(evidence, {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch (error: any) {
    if (error.message && error.message.includes("MCC Round-1 dataset")) {
      return NextResponse.json(
        {
          error: {
            code: "NOT_FOUND",
            message: error.message,
            details: [],
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred while retrieving Round-1 evidence.",
          details: [],
        },
      },
      { status: 500 }
    );
  }
}
