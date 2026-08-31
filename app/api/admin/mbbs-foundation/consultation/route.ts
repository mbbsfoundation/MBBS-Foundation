import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/adminAuth";
import {
  getConsultationDashboardSummary,
  getConsultationResponses,
} from "@/lib/mbbs-foundation/consultationAdmin";

/**
 * GET /api/admin/mbbs-foundation/consultation
 *
 * Authenticated API endpoint delivering dashboard statistics and filtered response records.
 */
export async function GET(request: NextRequest) {
  if (!verifyAdminRequest(request)) {
    return NextResponse.json(
      { success: false, error: "Unauthorized access. Admin authentication required." },
      { status: 401 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const source = searchParams.get("source") || undefined;
    const state = searchParams.get("state") || undefined;
    const search = searchParams.get("search") || undefined;

    const rawContributing = searchParams.get("contributing");
    const rawSharing = searchParams.get("sharing");

    const interestedInContributing =
      rawContributing === "true"
        ? true
        : rawContributing === "false"
        ? false
        : undefined;

    const willingToShareReadinessSurvey =
      rawSharing === "true"
        ? true
        : rawSharing === "false"
        ? false
        : undefined;

    const [summary, responses] = await Promise.all([
      getConsultationDashboardSummary(),
      getConsultationResponses({
        source,
        state,
        interestedInContributing,
        willingToShareReadinessSurvey,
        search,
      }),
    ]);

    return NextResponse.json({
      success: true,
      summary,
      responses,
    });
  } catch (error: any) {
    console.error("Error loading consultation admin data:", error?.message || error);
    return NextResponse.json(
      { success: false, error: "Unable to load dashboard data." },
      { status: 500 }
    );
  }
}
