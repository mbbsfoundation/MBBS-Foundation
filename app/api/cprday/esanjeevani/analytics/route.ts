import { NextRequest, NextResponse } from "next/server";
import { getAnalyticsSummary, generateCSVReport } from "@/lib/esanjeevaniStorage";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format")?.toLowerCase();

    // Export CSV report
    if (format === "csv") {
      const csvContent = generateCSVReport();
      const headers = new Headers();
      headers.set("Content-Type", "text/csv; charset=utf-8");
      headers.set(
        "Content-Disposition",
        `attachment; filename="CPR_eSANJEEVANI_Analytics_Report_${new Date().toISOString().slice(0, 10)}.csv"`
      );
      return new NextResponse(csvContent, { headers });
    }

    // Return Analytics Summary JSON
    const summary = getAnalyticsSummary();
    return NextResponse.json({
      success: true,
      analytics: summary,
    });
  } catch (error) {
    console.error("Error fetching eSanjeevani analytics:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load analytics summary." },
      { status: 500 }
    );
  }
}
