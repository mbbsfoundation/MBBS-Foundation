import { NextRequest, NextResponse } from "next/server";
import { saveSubmission } from "@/lib/esanjeevaniStorage";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      fullName,
      email,
      mobile,
      pinCode,
      zone,
      state,
      district,
      city,
      category,
      videoLanguage,
      quizScore,
      totalQuestions = 5,
      attemptsCount = 1,
      rating = 5,
      feedback = "",
      suggestions = "",
    } = body;

    if (!fullName || !email || !mobile) {
      return NextResponse.json(
        { success: false, error: "Full Name, Email, and Mobile Number are required." },
        { status: 400 }
      );
    }

    const passed = (quizScore || 0) >= 3;

    if (!passed) {
      return NextResponse.json(
        {
          success: false,
          error: "You must score at least 3 out of 5 to earn the certificate. Please retry the quiz.",
          passed: false,
        },
        { status: 400 }
      );
    }

    // Generate Unique Certificate ID
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    const certificateId = `CPR-AWARE-2026-${randomNum}`;

    const record = saveSubmission({
      certificateId,
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      mobile: mobile.trim(),
      pinCode: (pinCode || "").trim(),
      zone: (zone || "").trim(),
      state: (state || "").trim(),
      district: (district || "").trim(),
      city: (city || "").trim(),
      category: (category || "Community Member").trim(),
      videoLanguage: (videoLanguage || "hindi").trim(),
      quizScore: Number(quizScore),
      totalQuestions: Number(totalQuestions),
      attemptsCount: Number(attemptsCount),
      passed: true,
      rating: Number(rating),
      feedback: (feedback || "").trim(),
      suggestions: (suggestions || "").trim(),
    });

    return NextResponse.json({
      success: true,
      message: "Congratulations! CPR eSANJEEVANI Module completed successfully.",
      certificateId: record.certificateId,
      record,
    });
  } catch (error) {
    console.error("Error submitting eSanjeevani module:", error);
    return NextResponse.json(
      { success: false, error: "An error occurred while saving your submission." },
      { status: 500 }
    );
  }
}
