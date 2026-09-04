import { NextRequest, NextResponse } from "next/server";
import {
  getFrozenVenueReviewSnapshot,
  saveVenueReconciliationDecision,
  resetVenueReconciliationDecision,
  ReconciliationDecisionType,
} from "@/lib/cprReconciliationStore";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const state = searchParams.get("state");

    let snapshot = getFrozenVenueReviewSnapshot();
    if (state && state.trim()) {
      snapshot = snapshot.filter(
        (s) => s.state.toLowerCase() === state.toLowerCase().trim()
      );
    }

    return NextResponse.json({
      success: true,
      totalGroups: snapshot.length,
      totalCertified: snapshot.reduce((a, b) => a + b.certifiedCount, 0),
      items: snapshot,
    });
  } catch (err: any) {
    console.error("Error fetching reconciliation decisions:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch snapshot" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      reviewId,
      finalDecision,
      finalCanonicalVenueId,
      finalVenueName,
      finalCity,
      finalState,
      supplementaryTrainedCount,
      reviewedBy,
      reviewNote,
    } = body;

    if (!reviewId || !finalDecision) {
      return NextResponse.json(
        { success: false, error: "reviewId and finalDecision are required" },
        { status: 400 }
      );
    }

    const updated = saveVenueReconciliationDecision({
      reviewId,
      finalDecision: finalDecision as ReconciliationDecisionType,
      finalCanonicalVenueId,
      finalVenueName,
      finalCity,
      finalState,
      supplementaryTrainedCount: supplementaryTrainedCount !== undefined ? Number(supplementaryTrainedCount) : undefined,
      reviewedBy: reviewedBy || "Admin",
      reviewNote,
    });

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Review ID not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Decision saved successfully",
      item: updated,
    });
  } catch (err: any) {
    console.error("Error saving reconciliation decision:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to save decision" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const reviewId = searchParams.get("reviewId");

    if (!reviewId) {
      return NextResponse.json(
        { success: false, error: "reviewId parameter is required" },
        { status: 400 }
      );
    }

    const reset = resetVenueReconciliationDecision(reviewId);
    return NextResponse.json({
      success: true,
      message: "Decision reverted to PENDING",
      item: reset,
    });
  } catch (err: any) {
    console.error("Error resetting reconciliation decision:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to reset decision" },
      { status: 500 }
    );
  }
}
