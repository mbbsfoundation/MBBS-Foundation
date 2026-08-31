import { NextRequest, NextResponse } from "next/server";
import { getCollegeById } from "@/lib/counselling/counsellingService";
import { computeCapacityExpansionSignals } from "@/lib/counselling/analyticsEngine";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    const { id } = await context.params;

    if (!id || typeof id !== "string" || id.trim().length === 0) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "College ID parameter is required",
            details: [{ field: "id", message: "Invalid ID parameter" }],
          },
        },
        { status: 400 }
      );
    }

    const college = await getCollegeById(id.trim());

    if (!college) {
      return NextResponse.json(
        {
          error: {
            code: "NOT_FOUND",
            message: `College with ID '${id}' not found`,
            details: [],
          },
        },
        { status: 404 }
      );
    }

    const cap = college.capacities[0] || null;
    const expansion = computeCapacityExpansionSignals(cap);

    const formattedAliases = college.aliases.map((a) => ({
      id: a.id,
      sourceAuthority: a.sourceAuthority,
      sourceName: a.sourceName,
      sourceInstituteCode: a.sourceInstituteCode,
      matchConfidence: a.matchConfidence,
    }));

    const formattedSnapshots = college.analyticsSnapshots.map((s) => ({
      id: s.id,
      quota: s.quota,
      seatCategory: s.seatCategory,
      isPwD: s.isPwD,
      seatsOffered: s.seatsOffered,
      seatsAllotted: s.seatsAllotted,
      matrixGap: s.matrixGap,
      fillRate: s.fillRate,
      sampleSize: s.sampleSize,
      bestAIR: s.bestAIR,
      q1AIR: s.q1AIR,
      medianAIR: s.medianAIR,
      q3AIR: s.q3AIR,
      highestAIR: s.highestAIR,
      calculationVersion: s.calculationVersion,
    }));

    return NextResponse.json(
      {
        college: {
          id: college.id,
          collegeName: college.collegeName,
          shortName: college.shortName,
          state: college.state,
          city: college.city,
          managementType: college.managementType,
          instituteType: college.instituteType,
          isINI: college.isINI,
          isDeemed: college.isDeemed,
          isCentralUniversity: college.isCentralUniversity,
          isESIC: college.isESIC,
          genderRestriction: college.genderRestriction,
          establishmentYear: college.establishmentYear,
          nmcCollegeCode: college.nmcCollegeCode,
          mccInstituteCode: college.mccInstituteCode,

          // 2026 Capacity & Expansion Signals
          approvedSeats2026: expansion.approvedSeats,
          seatIncrease2026: expansion.seatIncrease2026,
          hasSeatIncrease2026: expansion.hasSeatIncrease2026,
          isNewEstablishment2026: expansion.isNewEstablishment2026,

          aliases: formattedAliases,
          analyticsSnapshots: formattedSnapshots,
          analyticsSnapshotsCount: formattedSnapshots.length,
        },
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
          message: "An internal server error occurred while retrieving college details.",
          details: [],
        },
      },
      { status: 500 }
    );
  }
}
