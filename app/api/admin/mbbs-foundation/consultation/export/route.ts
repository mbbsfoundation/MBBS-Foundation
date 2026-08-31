import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminRequest } from "@/lib/adminAuth";
import { READINESS_DOMAINS } from "@/lib/mbbs-foundation/consultationTypes";
import { getSourceLabel } from "@/lib/mbbs-foundation/consultationAdmin";

function escapeCsvField(field: any): string {
  if (field === null || field === undefined) {
    return '""';
  }
  const str = String(field);
  // If field contains quotes, commas, or newlines, wrap in quotes and escape internal quotes
  if (str.includes('"') || str.includes(",") || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

/**
 * GET /api/admin/mbbs-foundation/consultation/export
 *
 * Secure CSV export endpoint for MBBS Professional Consultation Survey responses.
 * Protected by verifyAdminRequest.
 */
export async function GET(request: NextRequest) {
  // 1. Verify Admin Session
  if (!verifyAdminRequest(request)) {
    return NextResponse.json(
      { success: false, error: "Unauthorized access. Admin authentication required." },
      { status: 401 }
    );
  }

  try {
    const responses = await prisma.mBBSProfessionalSurveyResponse.findMany({
      orderBy: { createdAt: "desc" },
    });

    const headers = [
      "Response ID",
      "Created At",
      "Source",
      "Source Label",
      "Professional Roles",
      "Specialty",
      "Teaching Experience",
      "Institution",
      "City",
      "State",
      "State Code",
      "Respondent Name",
      "Email",
      "Mobile / WhatsApp",
      "Consent for Follow-up",
      "Interested in Contributing",
      "Contribution Types",
      "Preferred Contribution Topic",
      "Time Commitment",
      "Willing to Share Readiness Survey",
      "Readiness Sharing Response",
      "Connection with New Students",
      "Foundation Course Effectiveness (Q8)",
      "Current Foundation Course Description (Q15)",
      "Foundation Course Limitations (Q16)",
      "Greater Emphasis Areas (Q9)",
      "One Change Suggestion (Q10)",
      "Need for Longitudinal Resource (Q11)",
      "Useful Resource Suggestion (Q12)",
      "Wish Taught at Entry (Q13)",
      "Later Emerging Challenge (Q14)",
      "Preferred Workshop Formats (Q17)",
      "Workshop Definitely Include (Q18)",
      // 14 Readiness Domain Ratings
      ...READINESS_DOMAINS.map((d) => `Rating [${d.code}] ${d.label}`),
    ];

    const rows: string[] = [headers.map(escapeCsvField).join(",")];

    for (const r of responses) {
      const resp = (r.surveyResponses as any) || {};
      const rolesStr = Array.isArray(r.roles) ? (r.roles as string[]).join("; ") : "";
      const contTypes = (r.contributionInterests as string[]) || resp.contributionTypes || [];
      const contTypesStr = Array.isArray(contTypes) ? contTypes.join("; ") : "";
      const q9Areas = Array.isArray(resp.greaterEmphasisAreas) ? resp.greaterEmphasisAreas.join("; ") : "";
      const q16Limits = Array.isArray(resp.foundationCourseLimitations) ? resp.foundationCourseLimitations.join("; ") : "";
      const q17Formats = Array.isArray(resp.preferredWorkshopFormats) ? resp.preferredWorkshopFormats.join("; ") : "";

      const rowValues = [
        r.id,
        r.createdAt.toISOString(),
        r.source || "direct",
        getSourceLabel(r.source),
        rolesStr,
        r.specialty || "",
        r.teachingExperience || "",
        r.institutionName || "",
        r.city || "",
        r.state || "",
        r.stateCode || "",
        r.respondentName || "",
        r.email || "",
        r.mobileWhatsapp || "",
        r.consentForFollowup ? "Yes" : "No",
        r.interestedInContributing ? "Yes" : "No",
        contTypesStr,
        resp.preferredContributionTopic || "",
        resp.contributionTimeCommitment || "",
        r.willingToShareReadinessSurvey ? "Yes" : "No",
        resp.readinessSurveySharingResponse || "",
        resp.connectionWithNewStudents || "",
        resp.foundationCourseEffectiveness || "",
        resp.currentFoundationCourseDescription || "",
        q16Limits,
        q9Areas,
        resp.improvementSuggestion || "",
        resp.needForLongitudinalResource || "",
        resp.usefulResourceSuggestion || "",
        resp.wishTaughtAtEntry || "",
        resp.laterEmergingChallenge || "",
        q17Formats,
        resp.workshopMustInclude || "",
        // 14 Readiness Domain Ratings
        ...READINESS_DOMAINS.map((d) => resp.readinessRatings?.[d.id] || ""),
      ];

      rows.push(rowValues.map(escapeCsvField).join(","));
    }

    const csvContent = "\uFEFF" + rows.join("\r\n");
    const dateStr = new Date().toISOString().split("T")[0];
    const filename = `mbbs_professional_consultation_export_${dateStr}.csv`;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error: any) {
    console.error("Error exporting consultation responses:", error?.message || error);
    return NextResponse.json(
      { success: false, error: "Failed to generate CSV export." },
      { status: 500 }
    );
  }
}
