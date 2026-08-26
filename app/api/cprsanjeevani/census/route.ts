import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/adminAuth";
import {
  getCPRDayCensusSummary,
  getCPRDayStateList,
  getCPRDayStateReport,
  getAllCPRDayStateReports,
} from "@/lib/cprCensus";

/**
 * GET /api/cprsanjeevani/census
 *
 * Query params:
 * - (none): Returns National Census Summary & State list
 * - `?state=<StateName>`: Returns State Report for a specific state
 * - `?all=true`: Returns All State Reports
 */
export async function GET(request: NextRequest) {
  try {
    if (!verifyAdminRequest(request)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Administrator access required." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const stateQuery = (searchParams.get("state") || "").trim();
    const allQuery = searchParams.get("all") === "true";

    if (stateQuery) {
      const stateReport = getCPRDayStateReport(stateQuery);
      if (!stateReport) {
        return NextResponse.json(
          { success: false, error: `No census data found for state: "${stateQuery}"` },
          { status: 404 }
        );
      }
      return NextResponse.json({
        success: true,
        report: stateReport,
      });
    }

    if (allQuery) {
      const allReports = getAllCPRDayStateReports();
      return NextResponse.json({
        success: true,
        reports: allReports,
      });
    }

    // Default: Return National Summary & State List
    const summary = getCPRDayCensusSummary();
    const stateList = getCPRDayStateList();

    return NextResponse.json({
      success: true,
      summary,
      states: stateList,
    });
  } catch (error: any) {
    console.error("Census API error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to retrieve census data." },
      { status: 500 }
    );
  }
}
