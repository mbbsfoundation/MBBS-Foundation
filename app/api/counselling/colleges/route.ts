import { NextRequest, NextResponse } from "next/server";
import { validateCollegeQueryParams } from "@/lib/counselling/validation";
import { searchColleges } from "@/lib/counselling/counsellingService";
import { searchMedicalCollegesEvidence } from "@/lib/counselling/evidenceService";
import type { DomicileCollegeSummary } from "@/lib/counselling/evidenceTypes";
import { computeCapacityExpansionSignals } from "@/lib/counselling/analyticsEngine";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // 1. Validate Query Parameters
    const validation = validateCollegeQueryParams(searchParams);
    if (!validation.isValid || !validation.params) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid query parameters",
            details: validation.errors,
          },
        },
        { status: 400 }
      );
    }

    const {
      query,
      state,
      managementType,
      collegeType,
      isINI,
      isDeemed,
      isCentralUniversity,
      isESIC,
      isNewEstablishment,
      page,
      pageSize,
      sortBy,
      sortOrder,
      includeEvidence,
    } = validation.params;

    // 2. Rich Evidence Search
    if (includeEvidence) {
      const result = await searchMedicalCollegesEvidence({
        query,
        state,
        collegeType,
        managementType,
        isINI,
        isDeemed,
        isCentralUniversity,
        isESIC,
        page,
        pageSize,
        sortBy,
        sortOrder,
      });

      const items = result.items.map((col) => ({
        id: col.collegeId,
        collegeId: col.collegeId,
        slug: col.slug,
        collegeName: col.collegeName,
        state: col.state,
        managementType: col.managementType,
        isINI: col.isINI,
        isDeemed: col.isDeemed,
        isCentralUniversity: col.isCentralUniversity,
        isESIC: col.isESIC,
        totalMBBSSeats2026: col.totalMBBSSeats2026,
        approvedSeats2026: col.totalMBBSSeats2026,
        mccRound1SeatsOffered: col.mccRound1SeatsOffered,
        mccRound1SeatsAllotted: col.mccRound1SeatsAllotted,
        approxOutsideMccRound1Pool: col.approxOutsideMccRound1Pool,
        openRound1Profiles: col.openRound1Profiles,
        allCategoryProfiles: col.allCategoryProfiles,
      }));

      return NextResponse.json(
        {
          items,
          page: result.page,
          pageSize: result.pageSize,
          total: result.total,
          totalPages: result.totalPages,
        },
        {
          status: 200,
          headers: {
            "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
          },
        }
      );
    }

    // 3. Fallback Basic Search via Counselling Service
    const offset = (page - 1) * pageSize;
    const result = await searchColleges({
      query,
      state,
      managementType,
      isINI,
      isDeemed,
      isCentralUniversity,
      isESIC,
      isNewEstablishment,
      limit: pageSize,
      offset,
    });

    const items = result.colleges.map((col) => {
      const cap = col.capacities[0] || null;
      const expansion = computeCapacityExpansionSignals(cap);

      return {
        id: col.id,
        collegeId: col.id,
        slug: col.slug,
        collegeName: col.collegeName,
        shortName: col.shortName,
        state: col.state,
        managementType: col.managementType,
        instituteType: col.instituteType,
        isINI: col.isINI,
        isDeemed: col.isDeemed,
        isCentralUniversity: col.isCentralUniversity,
        isESIC: col.isESIC,
        nmcCollegeCode: col.nmcCollegeCode,
        mccInstituteCode: col.mccInstituteCode,
        approvedSeats2026: expansion.approvedSeats,
        seatIncrease2026: expansion.seatIncrease2026,
        hasSeatIncrease2026: expansion.hasSeatIncrease2026,
        isNewEstablishment2026: expansion.isNewEstablishment2026,
      };
    });

    const totalPages = Math.ceil(result.total / pageSize);

    return NextResponse.json(
      {
        items,
        page,
        pageSize,
        total: result.total,
        totalPages,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "An internal server error occurred while retrieving colleges.",
          details: [],
        },
      },
      { status: 500 }
    );
  }
}
