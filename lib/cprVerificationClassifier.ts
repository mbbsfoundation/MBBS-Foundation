import {
  CoordinatorVerificationSubmission,
} from "./cprVerificationStore";

export type VerificationRiskLevel = "LOW_RISK" | "MEDIUM_RISK" | "HIGH_RISK";

export type VerificationAffectedDomain =
  | "REPORT METADATA"
  | "FACULTY ATTRIBUTION"
  | "RECONCILIATION"
  | "CERTIFICATE DATA"
  | "CENSUS / COUNTS"
  | "MULTIPLE SOURCES";

export type CensusImpactType = "YES" | "NO" | "POSSIBLE";

export interface VerificationClassification {
  riskLevel: VerificationRiskLevel;
  riskBadgeLabel: string;
  riskReasons: string[];
  affectedDomain: VerificationAffectedDomain;
  censusImpact: CensusImpactType;
  recommendedAction: string;
}

/**
 * Deterministically classifies a verification submission for risk, affected domain,
 * census impact, and recommended downstream operational path.
 */
export function classifyVerificationSubmission(
  sub: CoordinatorVerificationSubmission
): VerificationClassification {
  const isMissingCourse = sub.submissionType === "MISSING_COURSE";
  const proposed = sub.proposedChangesJson || {};
  const current = sub.currentDataJson || {};

  const hasTrainedCountChange =
    proposed.participantsTrained !== undefined &&
    proposed.participantsTrained !== null &&
    (current.participantsTrained === undefined ||
      Number(proposed.participantsTrained) !== Number(current.participantsTrained));

  const hasCoursesCountChange =
    proposed.coursesCount !== undefined &&
    proposed.coursesCount !== null &&
    (current.coursesCount === undefined ||
      Number(proposed.coursesCount) !== Number(current.coursesCount));

  const hasCoordinatorsChange =
    Array.isArray(proposed.coordinators) && proposed.coordinators.length > 0;

  const hasChampionsChange =
    Array.isArray(proposed.champions) && proposed.champions.length > 0;

  const hasVenueSpellingChange =
    proposed.venue !== undefined &&
    proposed.venue.trim().length > 0 &&
    proposed.venue.trim() !== (current.venue || "").trim();

  const hasCitySpellingChange =
    proposed.city !== undefined &&
    proposed.city.trim().length > 0 &&
    proposed.city.trim() !== (current.city || "").trim();

  const reasons: string[] = [];

  // =========================================================================
  // 1. HIGH RISK EVALUATION
  // =========================================================================
  if (isMissingCourse) {
    reasons.push("Missing Course claim introduces unlisted venue/session altering national/state totals");
  }
  if (hasTrainedCountChange) {
    reasons.push(`Trained participant count modification (${current.participantsTrained ?? "—"} → ${proposed.participantsTrained}) affects census baseline`);
  }
  if (hasCoursesCountChange) {
    reasons.push(`Course / session count modification (${current.coursesCount ?? 1} → ${proposed.coursesCount}) affects 395 national course invariant`);
  }

  if (reasons.length > 0) {
    const isMultiple = reasons.length > 1 || (hasCoordinatorsChange || hasChampionsChange || hasVenueSpellingChange);
    return {
      riskLevel: "HIGH_RISK",
      riskBadgeLabel: "HIGH RISK",
      riskReasons: reasons,
      affectedDomain: isMultiple ? "MULTIPLE SOURCES" : "CENSUS / COUNTS",
      censusImpact: "YES",
      recommendedAction: isMissingCourse
        ? "Requires attendance/course evidence verification before creation of a supplementary reconciliation entry."
        : "Requires evidence verification and formal reconciliation review before census revision.",
    };
  }

  // =========================================================================
  // 2. MEDIUM RISK EVALUATION
  // =========================================================================
  if (hasCoordinatorsChange || hasChampionsChange) {
    if (hasCoordinatorsChange) {
      reasons.push("Course Coordinator attribution modification");
    }
    if (hasChampionsChange) {
      reasons.push("CPR Champion faculty attribution modification");
    }

    const isMultiple = (hasCoordinatorsChange && hasChampionsChange) || hasVenueSpellingChange || hasCitySpellingChange;

    return {
      riskLevel: "MEDIUM_RISK",
      riskBadgeLabel: "MEDIUM RISK",
      riskReasons: reasons,
      affectedDomain: isMultiple ? "MULTIPLE SOURCES" : "FACULTY ATTRIBUTION",
      censusImpact: "NO",
      recommendedAction:
        "Verify faculty attribution and reconcile report/certificate sources as applicable.",
    };
  }

  // Check for venue alias / mapping re-assignment (if canonical ID changed or explicit note)
  if (sub.canonicalVenueId && sub.reportRowId && sub.canonicalVenueId !== sub.reportRowId) {
    reasons.push("Venue alias / mapping re-assignment");
    return {
      riskLevel: "MEDIUM_RISK",
      riskBadgeLabel: "MEDIUM RISK",
      riskReasons: reasons,
      affectedDomain: "RECONCILIATION",
      censusImpact: "POSSIBLE",
      recommendedAction:
        "Review and apply through reconciliation/report metadata layer.",
    };
  }

  // =========================================================================
  // 3. LOW RISK EVALUATION
  // =========================================================================
  if (hasVenueSpellingChange || hasCitySpellingChange) {
    if (hasVenueSpellingChange) reasons.push("Venue name spelling / formatting correction");
    if (hasCitySpellingChange) reasons.push("City name spelling / formatting correction");

    return {
      riskLevel: "LOW_RISK",
      riskBadgeLabel: "LOW RISK",
      riskReasons: reasons,
      affectedDomain: "REPORT METADATA",
      censusImpact: "NO",
      recommendedAction:
        "Review and apply through reconciliation/report metadata layer.",
    };
  }

  if (sub.submissionType === "VERIFY_CORRECT") {
    return {
      riskLevel: "LOW_RISK",
      riskBadgeLabel: "LOW RISK",
      riskReasons: ["Coordinator confirmed baseline report figures match actual records"],
      affectedDomain: "REPORT METADATA",
      censusImpact: "NO",
      recommendedAction:
        "No downstream change required. Baseline data confirmed accurate.",
    };
  }

  // Default fallback for general text notes
  return {
    riskLevel: "LOW_RISK",
    riskBadgeLabel: "LOW RISK",
    riskReasons: [sub.correctionNote ? `General inquiry/correction note: ${sub.correctionNote}` : "Non-structural metadata review"],
    affectedDomain: "REPORT METADATA",
    censusImpact: "NO",
    recommendedAction:
      "Review submission note and apply through reconciliation/report metadata layer if applicable.",
  };
}
