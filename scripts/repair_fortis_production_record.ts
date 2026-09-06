import { prisma } from "../lib/prisma";
import { getCPRDayReconciliationReportAsync, getCPRDayNationalConsolidatedReportAsync } from "../lib/cprReporting";
import { invalidateVenueMetadataOverridesCache } from "../lib/cprReconciliationStore";

async function repairFortis() {
  console.log("==================================================");
  console.log("REPAIRING GENUINE PRODUCTION RECORD: FORTIS MULUND");
  console.log("==================================================\n");

  const subId = "VERIF-1788595925118-4WKZ";
  const existing = await prisma.cPRVerificationSubmission.findUnique({
    where: { id: subId },
  });

  if (!existing) {
    console.error(`ERROR: Submission ${subId} not found in PostgreSQL!`);
    process.exit(1);
  }

  console.log("Found existing submission:", {
    id: existing.id,
    venue: existing.venue,
    submissionStatus: existing.submissionStatus,
    adminNote: existing.adminNote,
  });

  // Authoritative Repair:
  // Canonical Venue: CANON-MH-023 (Fortis Hospital, Mulund)
  // Baseline reported trained: 328
  // Verified final trained: 600
  // Verified adjustment: +272
  const updated = await prisma.cPRVerificationSubmission.update({
    where: { id: subId },
    data: {
      canonicalVenueId: "CANON-MH-023",
      reportRowId: "CANON-MH-023",
      state: "Maharashtra",
      stateCode: "MH",
      submissionStatus: "IMPLEMENTED",
      adminDecision: "IMPLEMENTED",
      adminReviewedBy: existing.adminReviewedBy || "Administrator",
      adminReviewedAt: existing.adminReviewedAt || new Date("2026-09-06T04:00:37.279Z"),
      adminNote: "Added 272 to existing number 328 of fortis mulund",
      currentDataJson: {
        venue: "Fortis Hospital, Mulund",
        city: "Mumbai",
        state: "Maharashtra",
        participantsTrained: 328,
        baselineReportedTrained: 328,
        coursesCount: 5,
        serialNumber: "337, 338, 339, 340, 341",
      },
      proposedChangesJson: {
        venue: "Fortis Hospital, Mulund",
        city: "Mumbai",
        state: "Maharashtra",
        participantsTrained: 600,
        verifiedFinalTrained: 600,
        verifiedTrainedAdjustment: 272,
        baselineReportedTrained: 328,
        coursesCount: 5,
        coordinators: ["Sameer Sadawarte"],
        courseDate: "2026-07-21",
      },
    },
  });

  console.log("\nSuccessfully updated PostgreSQL record:", {
    id: updated.id,
    canonicalVenueId: updated.canonicalVenueId,
    submissionStatus: updated.submissionStatus,
    adminDecision: updated.adminDecision,
    proposedChangesJson: updated.proposedChangesJson,
  });

  // Invalidate cache and test reports
  invalidateVenueMetadataOverridesCache();

  const mhReport = await getCPRDayReconciliationReportAsync("Maharashtra", true);
  const fortisVenue = mhReport?.venues.find((v) => v.venueId === "CANON-MH-023");

  console.log("\n--- Post-Repair Maharashtra Verification ---");
  console.log("Fortis Venue:", {
    venueId: fortisVenue?.venueId,
    venue: fortisVenue?.venue,
    baselineCourseCount: fortisVenue?.baselineCourseCount,
    baselineReportedTrained: fortisVenue?.baselineReportedTrained,
    participantsCertified: fortisVenue?.participantsCertified,
    participantsTrained: fortisVenue?.participantsTrained,
  });
  console.log("Maharashtra Totals:", {
    physicalVenues: mhReport?.summary.reconciledReport.uniqueVenues,
    courses: mhReport?.summary.reconciledReport.coursesConducted,
    participantsTrained: mhReport?.summary.reconciledReport.participantsTrained,
    participantsCertified: mhReport?.summary.reconciledReport.participantsCertified,
  });

  const natReport = await getCPRDayNationalConsolidatedReportAsync(true);
  console.log("\n--- Post-Repair National Verification ---");
  console.log("National Totals:", {
    physicalVenues: natReport.summary.reconciledReport.uniqueVenues,
    courses: natReport.summary.reconciledReport.coursesConducted,
    participantsTrained: natReport.summary.reconciledReport.participantsTrained,
    participantsCertified: natReport.summary.reconciledReport.participantsCertified,
  });

  console.log("\n==================================================");
  console.log("FORTIS PRODUCTION REPAIR COMPLETE");
  console.log("==================================================");
}

repairFortis()
  .catch((err) => {
    console.error("Repair failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
