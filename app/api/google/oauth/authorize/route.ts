import { NextResponse } from "next/server";

import { createGoogleOAuthClient } from "@/lib/google/googleOAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const oauthClient = createGoogleOAuthClient();

    const authorizationUrl = oauthClient.generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      scope: ["https://www.googleapis.com/auth/drive"],
    });

    return NextResponse.redirect(authorizationUrl);
  } catch (error) {
    console.error("Google OAuth authorization error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Unable to begin Google authorization.",
      },
      { status: 500 },
    );
  }
}