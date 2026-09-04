import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/adminAuth";
import {
  loadAllVerifications,
  updateVerificationStatus,
  getVerificationStatusCounts,
  VerificationSubmissionStatus,
  VerificationSubmissionType,
} from "@/lib/cprVerificationStore";

/**
 * Admin Coordinator Verification Inbox API
 *
 * GET /api/cprsanjeevani/verify/admin
 * - Query params:
 *   - ?state=<canonicalState>
 *   - ?status=<PENDING_ADMIN_REVIEW|ACCEPTED|REJECTED|NEEDS_CLARIFICATION|IMPLEMENTED|ALL>
 *   - ?type=<VERIFY_CORRECT|SUBMIT_CORRECTION|MISSING_COURSE|ALL>
 *   - ?q=<searchQuery>
 * - Returns submission list with full details (mobile, email, side-by-side payload) and summary counts.
 *
 * POST /api/cprsanjeevani/verify/admin
 * - Body: { id: string, status: VerificationSubmissionStatus, adminNote?: string, adminReviewedBy?: string }
 * - Updates submission review status.
 */

export async function GET(request: NextRequest) {
  try {
    if (!verifyAdminRequest(request)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Administrator access required." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const stateFilter = (searchParams.get("state") || "").trim();
    const statusFilter = (searchParams.get("status") || "ALL").trim().toUpperCase();
    const typeFilter = (searchParams.get("type") || "ALL").trim().toUpperCase();
    const query = (searchParams.get("q") || "").trim().toLowerCase();

    let submissions = loadAllVerifications();

    // Sort newest first
    submissions.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Apply State Filter
    if (stateFilter && stateFilter.toUpperCase() !== "ALL" && stateFilter.toUpperCase() !== "ALL_INDIA") {
      submissions = submissions.filter(
        (s) => s.state.toLowerCase() === stateFilter.toLowerCase()
      );
    }

    // Apply Status Filter
    if (statusFilter && statusFilter !== "ALL") {
      submissions = submissions.filter((s) => s.submissionStatus === statusFilter);
    }

    // Apply Type Filter
    if (typeFilter && typeFilter !== "ALL") {
      submissions = submissions.filter((s) => s.submissionType === typeFilter);
    }

    // Apply Search Query
    if (query) {
      submissions = submissions.filter((s) => {
        const matchName = (s.submittedByName || "").toLowerCase().includes(query);
        const matchCoord = (s.mappedCoordinatorName || "").toLowerCase().includes(query);
        const matchVenue = (s.venue || "").toLowerCase().includes(query);
        const matchCity = (s.city || "").toLowerCase().includes(query);
        const matchMobile = (s.submittedByMobile || "").includes(query);
        const matchNote = (s.correctionNote || "").toLowerCase().includes(query);
        return matchName || matchCoord || matchVenue || matchCity || matchMobile || matchNote;
      });
    }

    const counts = getVerificationStatusCounts(stateFilter !== "ALL" ? stateFilter : undefined);

    return NextResponse.json({
      success: true,
      counts,
      submissions,
    });
  } catch (error: any) {
    console.error("Error in GET /api/cprsanjeevani/verify/admin:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch verification submissions." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!verifyAdminRequest(request)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Administrator access required." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const id = (body.id || "").trim();
    const status: VerificationSubmissionStatus = body.status;
    const adminNote = body.adminNote !== undefined ? String(body.adminNote).trim() : undefined;
    const adminReviewedBy = (body.adminReviewedBy || "Administrator").trim();

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Submission id is required." },
        { status: 400 }
      );
    }

    const validStatuses: VerificationSubmissionStatus[] = [
      "PENDING_ADMIN_REVIEW",
      "NEEDS_CLARIFICATION",
      "ACCEPTED",
      "REJECTED",
      "IMPLEMENTED",
    ];

    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: `Invalid status: ${status}` },
        { status: 400 }
      );
    }

    const updated = updateVerificationStatus(id, {
      status,
      adminReviewedBy,
      adminNote,
    });

    if (!updated) {
      return NextResponse.json(
        { success: false, error: `Submission not found: ${id}` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      submission: updated,
      message: `Status updated to ${status}. Note: Acceptance records the admin decision without automatically altering census or Draft V1 figures.`,
    });
  } catch (error: any) {
    console.error("Error in POST /api/cprsanjeevani/verify/admin:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update verification status." },
      { status: 500 }
    );
  }
}
