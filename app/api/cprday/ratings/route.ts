import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

type RatingEntry = {
  id: string;
  certificateNumber: string;
  participantName: string;
  venueName: string;
  state: string;
  rating: number;
  feedback: string;
  portalType: string;
  timestamp: string;
};

// Simple file-based fallback store for ratings in project directory
const ratingsFilePath = path.join(process.cwd(), "cprcertificates", "cpr_ratings_store.json");

function getRatings(): RatingEntry[] {
  try {
    if (fs.existsSync(ratingsFilePath)) {
      const data = fs.readFileSync(ratingsFilePath, "utf8");
      return JSON.parse(data);
    }
  } catch (e) {
    console.error("Error reading ratings file:", e);
  }
  return [];
}

function saveRatings(ratings: RatingEntry[]) {
  try {
    const dir = path.dirname(ratingsFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(ratingsFilePath, JSON.stringify(ratings, null, 2), "utf8");
  } catch (e) {
    console.error("Error saving ratings file:", e);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      certificateNumber = "",
      participantName = "",
      venueName = "",
      state = "",
      rating = 5,
      feedback = "",
      portalType = "participant",
    } = body;

    const numericRating = Math.min(5, Math.max(1, Number(rating) || 5));

    const newRating: RatingEntry = {
      id: `rat_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      certificateNumber: String(certificateNumber).trim(),
      participantName: String(participantName).trim(),
      venueName: String(venueName).trim(),
      state: String(state).trim(),
      rating: numericRating,
      feedback: String(feedback).trim(),
      portalType: String(portalType).trim(),
      timestamp: new Date().toISOString(),
    };

    const currentRatings = getRatings();
    currentRatings.push(newRating);
    saveRatings(currentRatings);

    return NextResponse.json({
      success: true,
      message: "Thank you! Your rating has been recorded successfully.",
      rating: newRating,
    });
  } catch (error) {
    console.error("Error submitting CPR rating:", error);
    return NextResponse.json(
      { success: false, error: "Failed to submit rating." },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const ratings = getRatings();
    const totalCount = ratings.length;
    const avgRating =
      totalCount > 0
        ? Number((ratings.reduce((acc, r) => acc + r.rating, 0) / totalCount).toFixed(1))
        : 4.9;

    return NextResponse.json({
      success: true,
      totalRatings: totalCount,
      averageRating: avgRating,
      sampleRatings: ratings.slice(-10).reverse(),
    });
  } catch (error) {
    console.error("Error fetching CPR ratings:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch ratings." },
      { status: 500 }
    );
  }
}
