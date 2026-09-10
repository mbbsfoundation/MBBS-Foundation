import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/adminAuth";
import {
  loadAllVerificationsAsync,
} from "@/lib/cprVerificationStore";
import {
  calculateProspectiveImpact,
  executeDownstreamImplementation,
  DownstreamActionType,
} from "@/lib/cprDownstreamImplementation";
import { classifyVerificationSubmission } from "@/lib/cprVerificationClassifier";
import { getCanonicalVenuesByState } from "@/lib/cprVenueRegistry";
import { normalizeDisplayState } from "@/lib/cprCensus";

/**
 * Admin Downstream Implementation API (Step 5C)
 *
 * GET /api/cprsanjeevani/verify/implement?submissionId=...
 * - Returns prospective impact calculation, target canonical candidates, and verification details.
 *
 * POST /api/cprsanjeevani/verify/implement
 * - Executes controlled downstream write into reconciliation overlay, re-reads state report,
 *   verifies closed-loop result, and transitions submission to IMPLEMENTED.
 */

export async function GET(req: NextRequest) {
  try {
    if (!verifyAdminRequest(req)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Administrator access required." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const submissionId = (searchParams.get("submissionId") || "").trim();

    if (!submissionId) {
      return NextResponse.json(
        { success: false, error: "submissionId parameter is required." },
        { status: 400 }
      );
    }

    const allSubmissions = await loadAllVerificationsAsync();
    const submission = allSubmissions.find((s) => s.id === submissionId);

    if (!submission) {
      return NextResponse.json(
        { success: false, error: `Submission ${submissionId} not found.` },
        { status: 404 }
      );
    }

    const classification = classifyVerificationSubmission(submission);
    const impact = calculateProspectiveImpact(submission);

    const canonicalState = normalizeDisplayState(submission.state);
    const canonicalVenues = getCanonicalVenuesByState(canonicalState).map((v) => ({
      canonicalVenueId: v.canonicalVenueId,
      canonicalVenueName: v.canonicalVenueName,
      city: v.city,
      baselineCourseCount: v.baselineCourseCount,
      baselineReportedTrained: v.baselineReportedTrained,
    }));

    return NextResponse.json({
      success: true,
      submission,
      classification,
      impact,
      canonicalVenues,
      isTestData: submission.id === "VERIF-1788524059637-35T4",
    });
  } catch (err: any) {
    console.error("Error in GET /api/cprsanjeevani/verify/implement:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to load implementation preview." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!verifyAdminRequest(req)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Administrator access required." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      submissionId,
      actionType,
      implementationNote,
      evidenceReference,
      targetCanonicalVenueId,
      proposedVenueName,
      proposedCity,
      proposedCoordinators,
      proposedChampions,
      proposedTrainedCount,
      proposedCoursesCount,
      proposedCourseDate,
      adminUser,
    } = body;

    if (!submissionId) {
      return NextResponse.json(
        { success: false, error: "submissionId is required." },
        { status: 400 }
      );
    }

    const allSubmissions = await loadAllVerificationsAsync();
    const targetSub = allSubmissions.find((s) => s.id === submissionId);

    if (!targetSub) {
      return NextResponse.json(
        { success: false, error: `Submission ${submissionId} not found.` },
        { status: 404 }
      );
    }

    let resolvedActionType = actionType;
    if (!resolvedActionType) {
      if (targetSub.submissionType === "MISSING_COURSE") {
        resolvedActionType = "CONFIRM_SUPPLEMENTARY_COURSE";
      } else if (
        targetSub.proposedChangesJson?.participantsTrained !== undefined &&
        targetSub.proposedChangesJson?.participantsTrained !== null
      ) {
        resolvedActionType = "APPLY_COUNT_ADJUSTMENT";
      } else if (
        (targetSub.proposedChangesJson?.coordinators && targetSub.proposedChangesJson.coordinators.length > 0) ||
        (targetSub.proposedChangesJson?.champions && targetSub.proposedChangesJson.champions.length > 0)
      ) {
        resolvedActionType = "UPDATE_FACULTY_ATTRIBUTION";
      } else if (targetSub.canonicalVenueId && targetSub.reportRowId && targetSub.canonicalVenueId !== targetSub.reportRowId) {
        resolvedActionType = "APPLY_VENUE_MAPPING";
      } else {
        resolvedActionType = "APPLY_METADATA_CORRECTION";
      }
    }

    const resolvedNote =
      (implementationNote && implementationNote.trim()) ||
      targetSub.adminNote?.trim() ||
      targetSub.correctionNote?.trim() ||
      "Downstream correction verified and marked implemented by Administrator.";

    const result = await executeDownstreamImplementation({
      submissionId,
      actionType: resolvedActionType as DownstreamActionType,
      adminUser: adminUser || "Administrator",
      implementationNote: resolvedNote,
      evidenceReference,
      targetCanonicalVenueId,
      proposedVenueName,
      proposedCity,
      proposedCoordinators,
      proposedChampions,
      proposedTrainedCount: proposedTrainedCount !== undefined ? Number(proposedTrainedCount) : undefined,
      proposedCoursesCount: proposedCoursesCount !== undefined ? Number(proposedCoursesCount) : undefined,
      proposedCourseDate,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      submission: result.submission,
      impact: result.impact,
    });
  } catch (err: any) {
    console.error("Error in POST /api/cprsanjeevani/verify/implement:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to execute implementation." },
      { status: 500 }
    );
  }
}
