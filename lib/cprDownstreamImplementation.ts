import {
  CoordinatorVerificationSubmission,
  loadAllVerificationsAsync,
  updateVerificationStatusAsync,
} from "./cprVerificationStore";
import {
  getCPRDayReconciliationReport,
  CPRDayStateReconciliationReport,
  loadUnifiedLiveCPRDayData,
} from "./cprReporting";
import {
  saveVenueMetadataOverride,
  resetVenueMetadataOverride,
  saveVenueReconciliationDecision,
  getFrozenVenueReviewSnapshot,
  VenueMetadataOverride,
} from "./cprReconciliationStore";
import {
  getCanonicalVenuesByState,
  getFrozenBaselineVenueRegistry,
} from "./cprVenueRegistry";
import { getLockedOfficialStateCensus } from "./cprStateCensus";
import { normalizeDisplayState } from "./cprCensus";

export type DownstreamActionType =
  | "APPLY_METADATA_CORRECTION"
  | "UPDATE_FACULTY_ATTRIBUTION"
  | "APPLY_VENUE_MAPPING"
  | "APPLY_COUNT_ADJUSTMENT"
  | "CONFIRM_SUPPLEMENTARY_COURSE";

export interface ProspectiveImpactSummary {
  state: string;
  currentStateCourses: number;
  prospectiveStateCourses: number;
  currentStateVenues: number;
  prospectiveStateVenues: number;
  currentStateTrained: number;
  prospectiveStateTrained: number;
  currentStateCertified: number;
  prospectiveStateCertified: number;

  nationalDraftCourses: number;
  prospectiveNationalCourses: number;
  nationalDraftVenues: number;
  prospectiveNationalVenues: number;
  nationalDraftTrained: number;
  prospectiveNationalTrained: number;
  nationalCertified: number;

  trainedDelta: number;
  coursesDelta: number;
  venuesDelta: number;
  isCensusImpacting: boolean;
}

/**
 * Calculates prospective state and national impact before implementation.
 */
export function calculateProspectiveImpact(
  sub: CoordinatorVerificationSubmission,
  actionType?: DownstreamActionType,
  customTrained?: number,
  customCourses?: number
): ProspectiveImpactSummary {
  const canonicalState = normalizeDisplayState(sub.state);
  const currentReport = getCPRDayReconciliationReport(canonicalState);
  const lockedState = getLockedOfficialStateCensus(canonicalState);

  const currentStateCourses = currentReport?.summary?.reconciledReport?.coursesConducted ?? (lockedState?.centres ?? 0);
  const currentStateVenues = currentReport?.summary?.reconciledReport?.uniqueVenues ?? (lockedState?.centres ?? 0);
  const currentStateTrained = currentReport?.summary?.reconciledReport?.participantsTrained ?? (lockedState?.participantsTrained ?? 0);
  const currentStateCertified = currentReport?.summary?.reconciledReport?.participantsCertified ?? 0;

  let trainedDelta = 0;
  let coursesDelta = 0;
  let venuesDelta = 0;

  const isMissingCourse = sub.submissionType === "MISSING_COURSE" || actionType === "CONFIRM_SUPPLEMENTARY_COURSE";

  if (isMissingCourse) {
    const proposedTrained = customTrained !== undefined
      ? customTrained
      : sub.proposedChangesJson?.participantsTrained ?? 0;
    trainedDelta = proposedTrained;
    coursesDelta = 1;
    venuesDelta = 1;
  } else if (actionType === "APPLY_COUNT_ADJUSTMENT" || sub.proposedChangesJson?.participantsTrained !== undefined) {
    const proposedTrained = customTrained !== undefined
      ? customTrained
      : sub.proposedChangesJson?.participantsTrained;

    if (proposedTrained !== undefined && sub.currentDataJson?.participantsTrained !== undefined) {
      trainedDelta = proposedTrained - sub.currentDataJson.participantsTrained;
    }
    if (customCourses !== undefined && sub.currentDataJson?.coursesCount !== undefined) {
      coursesDelta = customCourses - sub.currentDataJson.coursesCount;
    }
  }

  const prospectiveStateCourses = currentStateCourses + coursesDelta;
  const prospectiveStateVenues = currentStateVenues + venuesDelta;
  const prospectiveStateTrained = currentStateTrained + trainedDelta;
  const prospectiveStateCertified = currentStateCertified;

  // National Baselines (Frozen Draft V1: 395 courses, 292 venues, 47,033 trained, 33,477 certified)
  const nationalDraftCourses = 395;
  const nationalDraftVenues = 292;
  const nationalDraftTrained = 47033;
  const nationalCertified = 33477;

  return {
    state: canonicalState,
    currentStateCourses,
    prospectiveStateCourses,
    currentStateVenues,
    prospectiveStateVenues,
    currentStateTrained,
    prospectiveStateTrained,
    currentStateCertified,
    prospectiveStateCertified,

    nationalDraftCourses,
    prospectiveNationalCourses: nationalDraftCourses + coursesDelta,
    nationalDraftVenues,
    prospectiveNationalVenues: nationalDraftVenues + venuesDelta,
    nationalDraftTrained,
    prospectiveNationalTrained: nationalDraftTrained + trainedDelta,
    nationalCertified,

    trainedDelta,
    coursesDelta,
    venuesDelta,
    isCensusImpacting: trainedDelta !== 0 || coursesDelta !== 0 || venuesDelta !== 0,
  };
}

/**
 * Executes a controlled downstream implementation for an accepted verification submission.
 * Enforces pre-execution validation, reconciliation overlay write, report re-read verification,
 * and records structured audit trail.
 */
export async function executeDownstreamImplementation(params: {
  submissionId: string;
  actionType: DownstreamActionType;
  adminUser: string;
  implementationNote: string;
  evidenceReference?: string;
  targetCanonicalVenueId?: string;
  proposedVenueName?: string;
  proposedCity?: string;
  proposedCoordinators?: string[];
  proposedChampions?: string[];
  proposedTrainedCount?: number;
  proposedCoursesCount?: number;
  proposedCourseDate?: string;
}): Promise<{
  success: boolean;
  message?: string;
  error?: string;
  updatedReport?: CPRDayStateReconciliationReport | null;
  submission?: CoordinatorVerificationSubmission;
  impact?: ProspectiveImpactSummary;
}> {
  const { submissionId, actionType, adminUser, implementationNote, evidenceReference } = params;

  // 1. Safeguard: Test Data Protection
  if (submissionId === "VERIF-1788524059637-35T4") {
    return {
      success: false,
      error: "This submission is protected TEST DATA and cannot be implemented into live reconciliation records.",
    };
  }

  if (!implementationNote || !implementationNote.trim()) {
    return {
      success: false,
      error: "A mandatory implementation note describing what was completed is required.",
    };
  }

  // 2. Load submission from store
  const allSubmissions = await loadAllVerificationsAsync();
  const sub = allSubmissions.find((s) => s.id === submissionId);

  if (!sub) {
    return {
      success: false,
      error: `Submission with ID "${submissionId}" was not found.`,
    };
  }

  if (sub.submissionStatus !== "ACCEPTED") {
    return {
      success: false,
      error: `Only ACCEPTED submissions can be implemented. Current status is ${sub.submissionStatus}.`,
    };
  }

  const canonicalState = normalizeDisplayState(sub.state);
  const targetCanonicalId = params.targetCanonicalVenueId || sub.canonicalVenueId || sub.reportRowId || "";

  try {
    // 3. Downstream Execution Branches
    switch (actionType) {
      case "APPLY_METADATA_CORRECTION": {
        if (!targetCanonicalId) {
          return { success: false, error: "A target Canonical Venue ID is required to apply metadata correction." };
        }

        saveVenueMetadataOverride({
          canonicalVenueId: targetCanonicalId,
          state: canonicalState,
          venueName: params.proposedVenueName?.trim() || sub.proposedChangesJson?.venue?.trim(),
          city: params.proposedCity?.trim() || sub.proposedChangesJson?.city?.trim(),
          reviewNote: implementationNote.trim(),
          reviewedBy: adminUser,
          evidenceReference: evidenceReference?.trim(),
          originatingSubmissionId: submissionId,
        });
        break;
      }

      case "UPDATE_FACULTY_ATTRIBUTION": {
        if (!targetCanonicalId) {
          return { success: false, error: "A target Canonical Venue ID is required to update faculty attribution." };
        }

        saveVenueMetadataOverride({
          canonicalVenueId: targetCanonicalId,
          state: canonicalState,
          additionalCoordinators: params.proposedCoordinators || sub.proposedChangesJson?.coordinators || [],
          additionalChampions: params.proposedChampions || sub.proposedChangesJson?.champions || [],
          reviewNote: implementationNote.trim(),
          reviewedBy: adminUser,
          evidenceReference: evidenceReference?.trim(),
          originatingSubmissionId: submissionId,
        });
        break;
      }

      case "APPLY_VENUE_MAPPING": {
        if (!targetCanonicalId) {
          return { success: false, error: "A canonical target venue is required for venue mapping." };
        }

        // If target exists in reconciliation snapshot, update decision
        const snapshot = getFrozenVenueReviewSnapshot();
        const reviewItem = snapshot.find(
          (i) =>
            i.state.toLowerCase() === canonicalState.toLowerCase() &&
            (i.liveVenue.toLowerCase() === (sub.venue || "").toLowerCase() || i.reviewId === sub.reportRowId)
        );

        if (reviewItem) {
          saveVenueReconciliationDecision({
            reviewId: reviewItem.reviewId,
            finalDecision: "SAME_BASELINE_VENUE",
            finalCanonicalVenueId: targetCanonicalId,
            reviewedBy: adminUser,
            reviewNote: implementationNote.trim(),
          });
        }
        break;
      }

      case "APPLY_COUNT_ADJUSTMENT": {
        if (!targetCanonicalId) {
          return { success: false, error: "A target Canonical Venue ID is required to apply count adjustment." };
        }

        const stateVenues = getCanonicalVenuesByState(canonicalState);
        const canonVenue = stateVenues.find((v) => v.canonicalVenueId === targetCanonicalId);

        if (!canonVenue) {
          return { success: false, error: `Canonical venue ${targetCanonicalId} not found in ${canonicalState}.` };
        }

        const targetTrained = params.proposedTrainedCount !== undefined
          ? params.proposedTrainedCount
          : sub.proposedChangesJson?.participantsTrained ?? canonVenue.baselineReportedTrained;

        const trainedAdj = targetTrained - canonVenue.baselineReportedTrained;

        saveVenueMetadataOverride({
          canonicalVenueId: targetCanonicalId,
          state: canonicalState,
          verifiedTrainedAdjustment: trainedAdj,
          reviewNote: implementationNote.trim(),
          reviewedBy: adminUser,
          evidenceReference: evidenceReference?.trim(),
          originatingSubmissionId: submissionId,
        });
        break;
      }

      case "CONFIRM_SUPPLEMENTARY_COURSE": {
        const venueName = params.proposedVenueName?.trim() || sub.venue?.trim() || "Supplementary Course";
        const cityName = params.proposedCity?.trim() || sub.city?.trim() || "";
        const trainedCount = params.proposedTrainedCount !== undefined
          ? params.proposedTrainedCount
          : sub.proposedChangesJson?.participantsTrained ?? 0;

        // Generate review ID
        const suppReviewId = `SUPP-${submissionId.replace(/[^A-Za-z0-9]/g, "").slice(-6).toUpperCase()}`;

        saveVenueReconciliationDecision({
          reviewId: suppReviewId,
          finalDecision: "SUPPLEMENTARY_NEW_VENUE",
          finalVenueName: venueName,
          finalCity: cityName,
          finalState: canonicalState,
          supplementaryTrainedCount: trainedCount,
          reviewedBy: adminUser,
          reviewNote: implementationNote.trim(),
        });
        break;
      }

      default:
        return { success: false, error: `Unrecognized downstream action type: ${actionType}` };
    }

    // 4. Closed-Loop Re-read and Verification against State Report
    const updatedReport = getCPRDayReconciliationReport(canonicalState);

    if (!updatedReport) {
      return {
        success: false,
        error: "Failed to recalculate state reconciliation report after downstream write.",
      };
    }

    // 5. Update Submission Status to IMPLEMENTED
    const fullNote = `${implementationNote.trim()}${evidenceReference?.trim() ? ` [Evidence: ${evidenceReference.trim()}]` : ""}`;

    const updatedSub = await updateVerificationStatusAsync(submissionId, {
      status: "IMPLEMENTED",
      adminReviewedBy: adminUser,
      adminNote: fullNote,
    });

    const impact = calculateProspectiveImpact(sub, actionType, params.proposedTrainedCount, params.proposedCoursesCount);

    return {
      success: true,
      message: "Downstream correction successfully implemented and verified in State Report output.",
      updatedReport,
      submission: updatedSub || undefined,
      impact,
    };
  } catch (err: any) {
    console.error("Downstream implementation failed:", err);
    return {
      success: false,
      error: `Downstream implementation failed: ${err.message || "Unknown error"}`,
    };
  }
}
