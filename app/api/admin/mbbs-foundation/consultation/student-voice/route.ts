import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/adminAuth";
import { getStudentVoiceDashboardSummary } from "@/lib/mbbs-foundation/studentVoiceAdmin";

/**
 * GET /api/admin/mbbs-foundation/consultation/student-voice
 *
 * Authenticated API endpoint delivering Student & Intern Voice dashboard metrics.
 */
export async function GET(request: NextRequest) {
  if (!verifyAdminRequest(request)) {
    return NextResponse.json(
      { success: false, error: "Unauthorized access. Admin authentication required." },
      { status: 401 }
    );
  }

  try {
    const summary = await getStudentVoiceDashboardSummary();

    return NextResponse.json({
      success: true,
      summary,
    });
  } catch (error: any) {
    console.error("Error loading student voice admin data:", error?.message || error);
    return NextResponse.json(
      { success: false, error: "Unable to load student voice dashboard data." },
      { status: 500 }
    );
  }
}
