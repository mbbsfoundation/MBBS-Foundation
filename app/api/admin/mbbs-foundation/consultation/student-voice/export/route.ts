import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminRequest } from "@/lib/adminAuth";
import { Q8_STATEMENTS } from "@/lib/mbbs-foundation/studentVoiceSurveyConfig";

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
 * Secure CSV export endpoint for Survey 2 — Student & Intern Voice responses.
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
      "Source",
      "Source Label",
      "Training Stage (Q1)",
      "College Type (Q2)",
      "State (Q3)",
      "Rewarding Experiences (Q4)",
      "First Months Feeling (Q5)",
      "Harder Than Expected Aspects (Q6)",
      "Unexpected Aspects (Q7)",
      // Q8 10 Statements
      ...Q8_STATEMENTS.map((s) => `Q8 [${s.code}] ${s.label}`),
      "Should Understand Before Starting (Q9)",
      "Helpful Guidance Formats (Q10)",
      "Best Timing for Guidance (Q11)",
      "Structured Guide Usefulness Rating (Q12)",
      "Essential Guide Components (Q13)",
      "Overall Transition Fit Statement (Q14)",
      "Prior Knowledge Would Have Helped (Q15)",
      "Interested in Helping Next Batch (Q16)",
      "Help Methods (Q17)",
      "One Thing Wish Told (Q18)",
      "Consent for Follow-up",
      "Respondent Name",
      "Email",
      "Mobile / WhatsApp",
    ];

    const rows: string[] = [headers.map(escapeCsvField).join(",")];

    for (const r of responses) {
      const resp = (r.surveyResponses as any) || {};

      const q4Str = Array.isArray(resp.q4RewardingExperiences)
        ? resp.q4RewardingExperiences.join("; ")
        : "";
      const q6Str = Array.isArray(resp.q6HarderAspects)
        ? resp.q6HarderAspects.join("; ")
        : "";
      const q7Str = Array.isArray(resp.q7UnexpectedAspects)
        ? resp.q7UnexpectedAspects.join("; ")
        : "";
      const q9Str = Array.isArray(resp.q9ShouldUnderstandBefore)
        ? resp.q9ShouldUnderstandBefore.join("; ")
        : "";
      const q10Str = Array.isArray(resp.q10HelpfulGuidanceTypes)
        ? resp.q10HelpfulGuidanceTypes.join("; ")
        : "";
      const q13Str = Array.isArray(resp.q13GuideEssentialComponents)
        ? resp.q13GuideEssentialComponents.join("; ")
        : "";
      const q17Str = Array.isArray(resp.q17HelpMethods)
        ? resp.q17HelpMethods.join("; ")
        : "";

      const q8Ratings = resp.q8FirstYearFeelings || {};

      const rowValues = [
        r.id,
        r.createdAt.toISOString(),
        r.source || "direct",
        getSourceLabel(r.source),
        r.trainingStage || "",
        r.collegeType || "",
        r.state || "",
        q4Str,
        resp.q5FirstMonthsFeeling || "",
        q6Str,
        q7Str,
        // Q8 10 statements
        ...Q8_STATEMENTS.map((s) => q8Ratings[s.id] || ""),
        q9Str,
        q10Str,
        resp.q11BestTimingForGuidance || "",
        resp.q12GuideUsefulnessRating || "",
        q13Str,
        resp.q14TransitionFitStatement || "",
        resp.q15PriorKnowledgeWouldHaveHelped || "",
        resp.q16InterestedInHelping || "",
        q17Str,
        resp.q18OneThingWishTold || "",
        r.consentForFollowup ? "Yes" : "No",
        r.respondentName || "",
        r.email || "",
        r.mobileWhatsapp || "",
      ];

      rows.push(rowValues.map(escapeCsvField).join(","));
    }

    const csvContent = "\uFEFF" + rows.join("\r\n");
    const filename = `mbbs-student-voice-survey-export-${new Date().toISOString().split("T")[0]}.csv`;

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
