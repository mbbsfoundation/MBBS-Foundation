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

  // Allow ACCEPTED or already IMPLEMENTED (for idempotent retry)
  if (sub.submissionStatus !== "ACCEPTED" && sub.submissionStatus !== "IMPLEMENTED") {
    return {
      success: false,
      error: `Only ACCEPTED submissions can be implemented. Current status is ${sub.submissionStatus}.`,
    };
  }

  const canonicalState = normalizeDisplayState(sub.state);
  const targetCanonicalId = params.targetCanonicalVenueId || sub.canonicalVenueId || sub.reportRowId || "";
  const fullNote = `${implementationNote.trim()}${evidenceReference?.trim() ? ` [Evidence: ${evidenceReference.trim()}]` : ""}`;

  try {
    const { prisma } = await import("./prisma");

    // 3. Downstream Execution Branches
    switch (actionType) {
      case "APPLY_METADATA_CORRECTION": {
        if (!targetCanonicalId) {
          return { success: false, error: "A target Canonical Venue ID is required to apply metadata correction." };
        }

        const stateVenues = getCanonicalVenuesByState(canonicalState);
        const canonVenue = stateVenues.find((v) => v.canonicalVenueId === targetCanonicalId);
        if (!canonVenue) {
          return { success: false, error: `Canonical venue ${targetCanonicalId} not found in ${canonicalState}.` };
        }

        const proposedVenue = params.proposedVenueName?.trim() || sub.proposedChangesJson?.venue?.trim() || canonVenue.canonicalVenueName;
        const proposedCity = params.proposedCity?.trim() || sub.proposedChangesJson?.city?.trim() || canonVenue.city;

        // Save in-memory override
        saveVenueMetadataOverride({
          canonicalVenueId: targetCanonicalId,
          state: canonicalState,
          venueName: proposedVenue,
          city: proposedCity,
          reviewNote: implementationNote.trim(),
          reviewedBy: adminUser,
          evidenceReference: evidenceReference?.trim(),
          originatingSubmissionId: submissionId,
        });

        // Persist to PostgreSQL CPRVerificationSubmission
        if (prisma && (prisma as any).cPRVerificationSubmission) {
          await (prisma as any).cPRVerificationSubmission.update({
            where: { id: submissionId },
            data: {
              canonicalVenueId: targetCanonicalId,
              reportRowId: targetCanonicalId,
              submissionStatus: "IMPLEMENTED",
              adminDecision: "IMPLEMENTED",
              adminReviewedBy: adminUser,
              adminReviewedAt: new Date(),
              adminNote: fullNote,
              proposedChangesJson: {
                ...(sub.proposedChangesJson || {}),
                venue: proposedVenue,
                city: proposedCity,
              },
            },
          });
        }
        break;
      }

      case "UPDATE_FACULTY_ATTRIBUTION": {
        if (!targetCanonicalId) {
          return { success: false, error: "A target Canonical Venue ID is required to update faculty attribution." };
        }

        const proposedCoords = params.proposedCoordinators || sub.proposedChangesJson?.coordinators || [];
        const proposedChamps = params.proposedChampions || sub.proposedChangesJson?.champions || [];

        saveVenueMetadataOverride({
          canonicalVenueId: targetCanonicalId,
          state: canonicalState,
          additionalCoordinators: proposedCoords,
          additionalChampions: proposedChamps,
          reviewNote: implementationNote.trim(),
          reviewedBy: adminUser,
          evidenceReference: evidenceReference?.trim(),
          originatingSubmissionId: submissionId,
        });

        if (prisma && (prisma as any).cPRVerificationSubmission) {
          await (prisma as any).cPRVerificationSubmission.update({
            where: { id: submissionId },
            data: {
              canonicalVenueId: targetCanonicalId,
              reportRowId: targetCanonicalId,
              submissionStatus: "IMPLEMENTED",
              adminDecision: "IMPLEMENTED",
              adminReviewedBy: adminUser,
              adminReviewedAt: new Date(),
              adminNote: fullNote,
              proposedChangesJson: {
                ...(sub.proposedChangesJson || {}),
                coordinators: proposedCoords,
                champions: proposedChamps,
              },
            },
          });
        }
        break;
      }

      case "APPLY_VENUE_MAPPING": {
        if (!targetCanonicalId) {
          return { success: false, error: "A canonical target venue is required for venue mapping." };
        }

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

        if (prisma && (prisma as any).cPRVerificationSubmission) {
          await (prisma as any).cPRVerificationSubmission.update({
            where: { id: submissionId },
            data: {
              canonicalVenueId: targetCanonicalId,
              reportRowId: targetCanonicalId,
              submissionStatus: "IMPLEMENTED",
              adminDecision: "IMPLEMENTED",
              adminReviewedBy: adminUser,
              adminReviewedAt: new Date(),
              adminNote: fullNote,
            },
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

        if (prisma && (prisma as any).cPRVerificationSubmission) {
          await (prisma as any).cPRVerificationSubmission.update({
            where: { id: submissionId },
            data: {
              canonicalVenueId: targetCanonicalId,
              reportRowId: targetCanonicalId,
              submissionStatus: "IMPLEMENTED",
              adminDecision: "IMPLEMENTED",
              adminReviewedBy: adminUser,
              adminReviewedAt: new Date(),
              adminNote: fullNote,
              currentDataJson: {
                ...(sub.currentDataJson || {}),
                venue: canonVenue.canonicalVenueName,
                city: canonVenue.city,
                state: canonicalState,
                participantsTrained: canonVenue.baselineReportedTrained,
                baselineReportedTrained: canonVenue.baselineReportedTrained,
                coursesCount: canonVenue.baselineCourseCount,
              },
              proposedChangesJson: {
                ...(sub.proposedChangesJson || {}),
                venue: canonVenue.canonicalVenueName,
                city: canonVenue.city,
                participantsTrained: targetTrained,
                verifiedFinalTrained: targetTrained,
                verifiedTrainedAdjustment: trainedAdj,
                baselineReportedTrained: canonVenue.baselineReportedTrained,
              },
            },
          });
        }
        break;
      }

      case "CONFIRM_SUPPLEMENTARY_COURSE": {
        const venueName = params.proposedVenueName?.trim() || sub.venue?.trim() || "Supplementary Course";
        const cityName = params.proposedCity?.trim() || sub.city?.trim() || "";
        const trainedCount = params.proposedTrainedCount !== undefined
          ? params.proposedTrainedCount
          : sub.proposedChangesJson?.participantsTrained ?? 0;

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

        if (prisma && (prisma as any).cPRVerificationSubmission) {
          await (prisma as any).cPRVerificationSubmission.update({
            where: { id: submissionId },
            data: {
              canonicalVenueId: suppReviewId,
              reportRowId: suppReviewId,
              submissionStatus: "IMPLEMENTED",
              adminDecision: "IMPLEMENTED",
              adminReviewedBy: adminUser,
              adminReviewedAt: new Date(),
              adminNote: fullNote,
            },
          });
        }
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

    // Verify expected effect in report
    if (actionType === "APPLY_COUNT_ADJUSTMENT" && targetCanonicalId) {
      const vSummary = updatedReport.venues.find((v) => v.venueId === targetCanonicalId);
      const targetTrained = params.proposedTrainedCount !== undefined
        ? params.proposedTrainedCount
        : sub.proposedChangesJson?.participantsTrained;
      if (vSummary && targetTrained !== undefined && vSummary.participantsTrained < targetTrained) {
        return {
          success: false,
          error: `Closed-loop report verification failed: target venue trained count is ${vSummary.participantsTrained}, expected ${targetTrained}.`,
        };
      }
    }

    // 5. Update submission status in memory store
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
