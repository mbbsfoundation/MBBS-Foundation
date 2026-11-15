import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/adminAuth";
import {
  getLearnerAdminSummary,
  getLearnersAdminList,
  LearnerAdminFilterParams,
} from "@/lib/mbbs-foundation/learnerAdmin";

export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = {
  "Cache-Control": "private, no-cache, no-store, max-age=0, must-revalidate",
  Pragma: "no-cache",
  Expires: "0",
};

/**
 * GET /api/admin/mbbs-foundation/learn
 *
 * Authenticated API endpoint delivering Online Learning Programme
 * summary metrics and filtered learner records.
 * Protected by verifyAdminRequest (HMAC session cookie / admin auth).
 */
export async function GET(request: NextRequest) {
  if (!verifyAdminRequest(request)) {
    return NextResponse.json(
      { success: false, error: "Unauthorized access. Admin authentication required." },
      { status: 401, headers: NO_STORE_HEADERS }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const summaryOnly = searchParams.get("summaryOnly") === "true";

    // 1. Fetch live summary counts
    const summary = await getLearnerAdminSummary();

    if (summaryOnly) {
      return NextResponse.json(
        {
          success: true,
          summary,
        },
        { headers: NO_STORE_HEADERS }
      );
    }

    // 2. Parse query filters
    const search = searchParams.get("search") || undefined;
    const college = searchParams.get("college") || undefined;
    const state = searchParams.get("state") || undefined;
    const category = searchParams.get("category") || undefined;

    const rawCertified = searchParams.get("certified");
    const certified =
      rawCertified === "YES" ? "YES" : rawCertified === "NO" ? "NO" : "ALL";

    const rawVerified = searchParams.get("verified");
    const verified =
      rawVerified === "YES" ? "YES" : rawVerified === "NO" ? "NO" : "ALL";

    const filters: LearnerAdminFilterParams = {
      search,
      college,
      state,
      category,
      certified,
      verified,
    };

    const { learners, availableColleges, availableStates, availableCategories } =
      await getLearnersAdminList(filters);

    return NextResponse.json(
      {
        success: true,
        summary,
        learners,
        availableColleges,
        availableStates,
        availableCategories,
        totalCount: learners.length,
      },
      { headers: NO_STORE_HEADERS }
    );
  } catch (error: any) {
    console.error("Admin learners API error:", error?.message || error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch learner administration data." },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}

