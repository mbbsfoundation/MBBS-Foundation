import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/adminAuth";
import {
  getLearnersAdminList,
  generateLearnersCsv,
} from "@/lib/mbbs-foundation/learnerAdmin";

export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = {
  "Cache-Control": "private, no-cache, no-store, max-age=0, must-revalidate",
  Pragma: "no-cache",
  Expires: "0",
};

/**
 * GET /api/admin/mbbs-foundation/learn/export
 *
 * Secure CSV export endpoint for MBBS Foundation Online Learning Programme
 * registered learners and REVIVE certification status.
 * Protected by verifyAdminRequest (HMAC session cookie / admin auth).
 */
export async function GET(request: NextRequest) {
  // 1. Verify Admin Session
  if (!verifyAdminRequest(request)) {
    return NextResponse.json(
      { success: false, error: "Unauthorized access. Admin authentication required." },
      { status: 401, headers: NO_STORE_HEADERS }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const college = searchParams.get("college") || undefined;
    const state = searchParams.get("state") || undefined;
    const category = searchParams.get("category") || undefined;
    const rawCertified = searchParams.get("certified");
    const certified =
      rawCertified === "YES" ? "YES" : rawCertified === "NO" ? "NO" : "ALL";

    // Fetch learner list
    const { learners } = await getLearnersAdminList({
      college,
      state,
      category,
      certified,
    });

    const csvContent = generateLearnersCsv(learners);

    const nowStr = new Date().toISOString().split("T")[0];
    const filename = `mbbs-foundation-learners-${nowStr}.csv`;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        ...NO_STORE_HEADERS,
      },
    });
  } catch (error: any) {
    console.error("Learner CSV export error:", error?.message || error);
    return NextResponse.json(
      { success: false, error: "Failed to generate learner CSV export." },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}

