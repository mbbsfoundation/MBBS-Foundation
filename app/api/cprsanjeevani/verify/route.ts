import { NextRequest, NextResponse } from "next/server";
import {
  getDistinctCoordinatorsForState,
  getCoordinatorCoursesForState,
  evaluateCoordinatorIdentity,
  saveVerificationSubmissionAsync,
  loadAllVerificationsAsync,
  VerificationSubmissionType,
  normalizeMobileNumber,
  slugToCanonicalState,
  getNormalizedCoordinatorsForDisplay,
} from "@/lib/cprVerificationStore";
import { getLockedCensusStateList } from "@/lib/cprStateCensus";
import { normalizeStateCode } from "@/lib/sanjeevaniStorage";
import { getCPRDayReconciliationReportAsync } from "@/lib/cprReporting";

/**
 * Public Coordinator Verification API
 *
 * GET /api/cprsanjeevani/verify?state=<stateName>&coordinator=<coordinatorName>
 * - Returns full State Draft Report with centre-wise table, metrics, and row verification status.
 * - Privacy-protected: Never returns coordinator mobile numbers or emails.
 *
 * POST /api/cprsanjeevani/verify
 * - Receives coordinator verification, correction, or missing course submission.
 * - Validates input, evaluates identity match against known records, and persists to PostgreSQL.
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawState = (searchParams.get("state") || "").trim();
    const rawCoordinator = (searchParams.get("coordinator") || "").trim();

    if (!rawState) {
      return NextResponse.json(
        { success: false, error: "Query parameter 'state' is required." },
        { status: 400 }
      );
    }

    const canonicalState = slugToCanonicalState(rawState);
    if (!canonicalState) {
      return NextResponse.json(
        { success: false, error: `Invalid or unrecognized state: "${rawState}"` },
        { status: 404 }
      );
    }

    const lockedStates = getLockedCensusStateList();
    const matchedState = lockedStates.find(
      (s) => s.canonicalState.toLowerCase() === canonicalState.toLowerCase()
    );

    const stateCode = normalizeStateCode(canonicalState);

    // Load full official State Draft Report with PostgreSQL live database integration
    const report = await getCPRDayReconciliationReportAsync(canonicalState);
    const rawCoordinators = getDistinctCoordinatorsForState(canonicalState, report);
    const coordinators = getNormalizedCoordinatorsForDisplay(rawCoordinators);

    // Load existing verification submissions for this state
    const stateSubmissions = await loadAllVerificationsAsync({ state: canonicalState });

    // Build row-level verification status mapping
    const rowStatusMap: Record<string, { status: "AWAITING_VERIFICATION" | "VERIFICATION_SUBMITTED" | "CORRECTION_SUBMITTED"; count: number }> = {};

    for (const sub of stateSubmissions) {
      const key = sub.canonicalVenueId || sub.reportRowId || sub.venue?.toLowerCase().trim() || "";
      if (key) {
        const current = rowStatusMap[key] || { status: "AWAITING_VERIFICATION", count: 0 };
        current.count++;
        if (sub.submissionType === "SUBMIT_CORRECTION") {
          current.status = "CORRECTION_SUBMITTED";
        } else if (sub.submissionType === "VERIFY_CORRECT" && current.status !== "CORRECTION_SUBMITTED") {
          current.status = "VERIFICATION_SUBMITTED";
        }
        rowStatusMap[key] = current;
      }
    }

    let courses: any[] = [];
    if (rawCoordinator) {
      courses = getCoordinatorCoursesForState(canonicalState, rawCoordinator);
    }

    return NextResponse.json({
      success: true,
      state: canonicalState,
      stateCode,
      zone: matchedState?.zone || "",
      report,
      rowStatusMap,
      coordinators,
      selectedCoordinator: rawCoordinator || null,
      courses,
    });
  } catch (error: any) {
    console.error("Error in GET /api/cprsanjeevani/verify:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const rawState = (body.state || "").trim();
    const submissionType: VerificationSubmissionType = body.submissionType;
    const submittedByName = (body.submittedByName || body.mappedCoordinatorName || "").trim();
    const mappedCoordinatorName = (body.mappedCoordinatorName || submittedByName || "").trim();
    const submittedByMobile = (body.submittedByMobile || "").trim();
    const submittedByEmail = (body.submittedByEmail || "").trim();

    // 1. Basic Validations
    if (!rawState) {
      return NextResponse.json(
        { success: false, error: "State is required." },
        { status: 400 }
      );
    }

    const validTypes: VerificationSubmissionType[] = [
      "VERIFY_CORRECT",
      "SUBMIT_CORRECTION",
      "MISSING_COURSE",
    ];
    if (!validTypes.includes(submissionType)) {
      return NextResponse.json(
        { success: false, error: `Invalid submissionType: ${submissionType}` },
        { status: 400 }
      );
    }

    if (!submittedByName) {
      return NextResponse.json(
        { success: false, error: "Coordinator name is required." },
        { status: 400 }
      );
    }

    const cleanMobile = normalizeMobileNumber(submittedByMobile);
    if (!cleanMobile || cleanMobile.length < 10) {
      return NextResponse.json(
        {
          success: false,
          error: "A valid 10-digit mobile number is required for verification.",
        },
        { status: 400 }
      );
    }

    // Validate State
    const canonicalState = slugToCanonicalState(rawState);
    if (!canonicalState) {
      return NextResponse.json(
        { success: false, error: `Unrecognized state: ${rawState}` },
        { status: 400 }
      );
    }

    const stateCode = normalizeStateCode(canonicalState);

    // 2. Identity Evaluation
    const identityEval = evaluateCoordinatorIdentity(
      canonicalState,
      mappedCoordinatorName,
      cleanMobile
    );

    // 3. Save Submission Record into PostgreSQL
    const record = await saveVerificationSubmissionAsync({
      submissionType,
      state: canonicalState,
      stateCode,
      reportRowId: body.reportRowId || body.canonicalVenueId || undefined,
      canonicalVenueId: body.canonicalVenueId || body.reportRowId || undefined,
      courseOrSessionId: body.courseOrSessionId,
      venue: body.venue,
      city: body.city,
      mappedCoordinatorName,
      submittedByName,
      submittedByMobile: cleanMobile,
      submittedByEmail: submittedByEmail || undefined,
      identityStatus: identityEval.status,
      currentDataJson: body.currentDataJson,
      proposedChangesJson: body.proposedChangesJson,
      correctionNote: (body.correctionNote || "").trim() || undefined,
      evidenceNote: (body.evidenceNote || "").trim() || undefined,
      evidenceFileReference: body.evidenceFileReference,
      submissionStatus: "PENDING_ADMIN_REVIEW",
    });

    return NextResponse.json({
      success: true,
      message:
        submissionType === "VERIFY_CORRECT"
          ? "Thank you! Your course verification has been submitted for Admin Review."
          : submissionType === "SUBMIT_CORRECTION"
          ? "Thank you! Your proposed corrections have been submitted for Admin Review."
          : "Thank you! The missing course details have been submitted for Admin Review.",
      submissionId: record.id,
      identityStatus: record.identityStatus,
      status: record.submissionStatus,
    });
  } catch (error: any) {
    console.error("Error in POST /api/cprsanjeevani/verify:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to process verification submission." },
      { status: 500 }
    );
  }
}

