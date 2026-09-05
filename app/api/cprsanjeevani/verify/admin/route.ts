import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/adminAuth";
import {
  loadAllVerificationsAsync,
  updateVerificationStatusAsync,
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
 * - Returns submission list with full details (mobile, email, side-by-side payload) and summary counts from PostgreSQL.
 *
 * POST /api/cprsanjeevani/verify/admin
 * - Body: { id: string, status: VerificationSubmissionStatus, adminNote?: string, adminReviewedBy?: string }
 * - Updates submission review status in PostgreSQL.
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

    let submissions = await loadAllVerificationsAsync({
      state: stateFilter,
      status: statusFilter,
      type: typeFilter,
      search: query,
    });

    const allSubmissions = await loadAllVerificationsAsync();
    const filteredForCounts = stateFilter && stateFilter !== "ALL" && stateFilter !== "ALL_INDIA"
      ? allSubmissions.filter((s) => s.state.toLowerCase() === stateFilter.toLowerCase())
      : allSubmissions;

    let pending = 0;
    let needsClarification = 0;
    let accepted = 0;
    let rejected = 0;
    let implemented = 0;

    for (const item of filteredForCounts) {
      switch (item.submissionStatus) {
        case "PENDING_ADMIN_REVIEW":
          pending++;
          break;
        case "NEEDS_CLARIFICATION":
          needsClarification++;
          break;
        case "ACCEPTED":
          accepted++;
          break;
        case "REJECTED":
          rejected++;
          break;
        case "IMPLEMENTED":
          implemented++;
          break;
      }
    }

    const counts = {
      total: filteredForCounts.length,
      pending,
      needsClarification,
      accepted,
      rejected,
      implemented,
    };

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

    if (status === "IMPLEMENTED" && (!adminNote || adminNote.trim().length === 0)) {
      return NextResponse.json(
        {
          success: false,
          error: "A mandatory implementation note is required when marking a submission as IMPLEMENTED to document what downstream action was completed.",
        },
        { status: 400 }
      );
    }

    const updated = await updateVerificationStatusAsync(id, {
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

