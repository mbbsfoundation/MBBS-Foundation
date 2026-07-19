import { NextRequest, NextResponse } from "next/server";

import { createGoogleOAuthClient } from "@/lib/google/googleOAuth";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const error = request.nextUrl.searchParams.get("error");

  if (error) {
    return NextResponse.json(
      {
        success: false,
        message: `Google authorization was not completed: ${error}`,
      },
      { status: 400 },
    );
  }

  const code = request.nextUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.json(
      {
        success: false,
        message: "Google did not return an authorization code.",
      },
      { status: 400 },
    );
  }

  try {
    const oauthClient = createGoogleOAuthClient();

    const { tokens } = await oauthClient.getToken(code);

    if (!tokens.refresh_token) {
      return NextResponse.json(
        {
          success: false,
          message:
            "No refresh token was returned. Revoke the app permission in your Google account and authorize again.",
        },
        { status: 400 },
      );
    }

    console.log("\n========================================");
    console.log("GOOGLE REFRESH TOKEN");
    console.log(tokens.refresh_token);
    console.log("========================================\n");

    return new NextResponse(
      `
        <!doctype html>
        <html lang="en">
          <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <title>Google Drive Connected</title>
          </head>

          <body style="
            margin:0;
            min-height:100vh;
            display:flex;
            align-items:center;
            justify-content:center;
            background:#f8fafc;
            color:#0f172a;
            font-family:Arial,sans-serif;
          ">
            <main style="
              width:min(560px,90%);
              padding:32px;
              background:white;
              border:1px solid #e2e8f0;
              border-radius:18px;
              box-shadow:0 12px 35px rgba(15,23,42,0.08);
            ">
              <h1 style="margin-top:0;">Google Drive connected</h1>

              <p>
                Authorization was successful.
              </p>

              <p>
                Return to the terminal and copy the refresh token printed there
                into <strong>.env.local</strong>.
              </p>

              <p style="margin-bottom:0;">
                You may now close this page.
              </p>
            </main>
          </body>
        </html>
      `,
      {
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
        },
      },
    );
  } catch (error) {
    console.error("Google OAuth callback error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Google authorization failed.",
      },
      { status: 500 },
    );
  }
}