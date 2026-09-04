import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/adminAuth";
import {
  getCPRDayCensusSummary,
  getCPRDayStateList,
  getCPRDayStateReport,
  getAllCPRDayStateReports,
} from "@/lib/cprCensus";
import {
  getCPRDayReconciliationReport,
  getAllCPRDayReconciliationReports,
} from "@/lib/cprReporting";

/**
 * GET /api/cprsanjeevani/census
 *
 * Query params:
 * - (none): Returns National Census Summary & State list
 * - `?state=<StateName>`: Returns State Report and Reconciliation Report for a specific state
 * - `?all=true`: Returns All State Reports
 * - `?mode=reconciliation` or `?reconciliation=true`: Returns Reconciliation Reports
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
    const reconciliationQuery =
      searchParams.get("reconciliation") === "true" || searchParams.get("mode") === "reconciliation";

    if (stateQuery) {
      if (
        stateQuery.toUpperCase() === "ALL_INDIA" ||
        stateQuery.toLowerCase() === "all india" ||
        stateQuery.toLowerCase() === "india"
      ) {
        const { getCPRDayNationalConsolidatedStateReport } = await import("@/lib/cprCensus");
        const { getCPRDayNationalConsolidatedReport } = await import("@/lib/cprReporting");

        const nationalStateReport = getCPRDayNationalConsolidatedStateReport();
        const nationalReconciliationReport = getCPRDayNationalConsolidatedReport();

        return NextResponse.json({
          success: true,
          report: nationalStateReport,
          reconciliation: nationalReconciliationReport,
          isNational: true,
        });
      }

      const stateReport = getCPRDayStateReport(stateQuery);
      const reconciliationReport = getCPRDayReconciliationReport(stateQuery);

      if (!stateReport && !reconciliationReport) {
        return NextResponse.json(
          { success: false, error: `No census data found for state: "${stateQuery}"` },
          { status: 404 }
        );
      }
      return NextResponse.json({
        success: true,
        report: stateReport,
        reconciliation: reconciliationReport,
      });
    }

    if (allQuery) {
      if (reconciliationQuery) {
        const allReconciliations = getAllCPRDayReconciliationReports();
        return NextResponse.json({
          success: true,
          reconciliations: allReconciliations,
        });
      }

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
