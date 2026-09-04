import { NextRequest, NextResponse } from "next/server";
import {
  getDistinctCoordinatorsForState,
  getCoordinatorCoursesForState,
  evaluateCoordinatorIdentity,
  saveVerificationSubmission,
  VerificationSubmissionType,
  normalizeMobileNumber,
  slugToCanonicalState,
} from "@/lib/cprVerificationStore";
import { getLockedCensusStateList } from "@/lib/cprStateCensus";
import { normalizeStateCode } from "@/lib/sanjeevaniStorage";

/**
 * Public Coordinator Verification API
 *
 * GET /api/cprsanjeevani/verify?state=<stateName>&coordinator=<coordinatorName>
 * - Returns coordinator list and mapped courses for the selected coordinator.
 * - Privacy-protected: Never returns coordinator mobile numbers or emails.
 *
 * POST /api/cprsanjeevani/verify
 * - Receives coordinator verification, correction, or missing course submission.
 * - Validates input, evaluates identity match against known records, and queues for Admin Review.
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
    const coordinators = getDistinctCoordinatorsForState(canonicalState);

    let courses: any[] = [];
    if (rawCoordinator) {
      courses = getCoordinatorCoursesForState(canonicalState, rawCoordinator);
    }

    return NextResponse.json({
      success: true,
      state: canonicalState,
      stateCode,
      zone: matchedState?.zone || "",
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

    // 3. Save Submission Record
    const record = saveVerificationSubmission({
      submissionType,
      state: canonicalState,
      stateCode,
      courseOrSessionId: body.courseOrSessionId,
      canonicalVenueId: body.canonicalVenueId,
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
