import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminRequest } from "@/lib/adminAuth";
import { Q6_STATEMENTS } from "@/lib/mbbs-foundation/studentVoiceSurveyConfig";

function escapeCsvField(field: any): string {
  if (field === null || field === undefined) {
    return '""';
  }
  const str = String(field);
  if (str.includes('"') || str.includes(",") || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

function getSourceLabel(source?: string | null): string {
  const s = (source || "direct").toLowerCase().trim();
  if (s === "student") return "Direct Student / Peer Network";
  if (s === "faculty") return "Faculty / Educator Referred";
  if (s === "cpr") return "CPR / Medical Network";
  return "Direct / Unattributed";
}

/**
 * GET /api/admin/mbbs-foundation/consultation/student-voice/export
 *
 * Secure CSV export endpoint for Student & Intern Voice responses.
 * Protected by verifyAdminRequest.
 */
export async function GET(request: NextRequest) {
  if (!verifyAdminRequest(request)) {
    return NextResponse.json(
      { success: false, error: "Unauthorized access. Admin authentication required." },
      { status: 401 }
    );
  }

  try {
    const responses = await prisma.mBBSStudentVoiceSurveyResponse.findMany({
      orderBy: { createdAt: "desc" },
    });

    const headers = [
      "Response ID",
      "Created At",
      "Survey Version",
      "Source",
      "Source Label",
      "Training Stage (Q1)",
      "College Type (Q2)",
      "State (Q2)",
      "Medical College / Institution (Q2)",
      "Rewarding Experiences (Q3)",
      "Harder Than Expected Aspects (Q4)",
      "Surprises After Entering (Q5)",
      // Q6 8 Statements
      ...Q6_STATEMENTS.map((s) => `Q6 [${s.code}] ${s.label}`),
      "Priorities to Prepare Next Batch (Q7)",
      "Useful Preparation Formats (Q8)",
      "Optimal Guidance Timing (Q9)",
      "One Thing Wish Told (Q10)",
      "Anonymous Quote Permission Granted",
      "Interested in Contributing",
      "Contribution Pathways",
      "Contributor Name",
      "Contributor Email",
      "Contributor Mobile / WhatsApp",
      "Consent for Contact",
    ];

    const rows: string[] = [headers.map(escapeCsvField).join(",")];

    for (const r of responses) {
      const resp = (r.surveyResponses as any) || {};

      const isV2 = r.surveyVersion === "v2";

      const q3Str = Array.isArray(resp.q3RewardingExperiences)
        ? resp.q3RewardingExperiences.join("; ")
        : Array.isArray(resp.q4RewardingExperiences)
        ? resp.q4RewardingExperiences.join("; ")
        : "";

      const q4Str = Array.isArray(resp.q4HarderAspects)
        ? resp.q4HarderAspects.join("; ")
        : Array.isArray(resp.q6HarderAspects)
        ? resp.q6HarderAspects.join("; ")
        : "";

      const q5Str = Array.isArray(resp.q5Surprises)
        ? resp.q5Surprises.join("; ")
        : Array.isArray(resp.q7UnexpectedAspects)
        ? resp.q7UnexpectedAspects.join("; ")
        : "";

      const q7Str = Array.isArray(resp.q7NextBatchPriorities)
        ? resp.q7NextBatchPriorities.join("; ")
        : Array.isArray(resp.q9ShouldUnderstandBefore)
        ? resp.q9ShouldUnderstandBefore.join("; ")
        : "";

      const q8Str = Array.isArray(resp.q8UsefulPreparationTypes)
        ? resp.q8UsefulPreparationTypes.join("; ")
        : Array.isArray(resp.q10HelpfulGuidanceTypes)
        ? resp.q10HelpfulGuidanceTypes.join("; ")
        : "";

      const q9Timing = resp.q9BestTiming || resp.q11BestTimingForGuidance || "";

      const q10Text = resp.q10WishSomeoneTold || resp.q18OneThingWishTold || "";

      const quotePerm = resp.quotePermission ? "Yes (Anonymous)" : "No";

      const contInterestsStr = Array.isArray(r.contributionInterests)
        ? (r.contributionInterests as string[]).join("; ")
        : Array.isArray(resp.q17HelpMethods)
        ? resp.q17HelpMethods.join("; ")
        : "";

      const q6Ratings = resp.q6TransitionMatrix || resp.q8FirstYearFeelings || {};

      const rowValues = [
        r.id,
        r.createdAt.toISOString(),
        r.surveyVersion || "v2",
        r.source || "direct",
        getSourceLabel(r.source),
        r.trainingStage || "",
        r.collegeType || "",
        r.state || "",
        resp.q2InstitutionName || "",
        q3Str,
        q4Str,
        q5Str,
        // Q6 8 statements
        ...Q6_STATEMENTS.map((s) => q6Ratings[s.id] || ""),
        q7Str,
        q8Str,
        q9Timing,
        q10Text,
        quotePerm,
        r.interestedInContributing ? "Yes" : "No",
        contInterestsStr,
        r.respondentName || "",
        r.email || "",
        r.mobileWhatsapp || "",
        r.consentForFollowup ? "Yes" : "No",
      ];

      rows.push(rowValues.map(escapeCsvField).join(","));
    }

    const csvContent = "\uFEFF" + rows.join("\r\n");
    const filename = `mbbs-student-voice-v2-export-${new Date().toISOString().split("T")[0]}.csv`;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error: any) {
    console.error("Error exporting student voice responses to CSV:", error?.message || error);
    return NextResponse.json(
      { success: false, error: "Unable to export CSV data." },
      { status: 500 }
    );
  }
}
