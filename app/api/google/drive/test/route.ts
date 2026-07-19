import { NextResponse } from "next/server";
import { google } from "googleapis";

import { createAuthorizedGoogleOAuthClient } from "@/lib/google/googleOAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const auth = createAuthorizedGoogleOAuthClient();

    const drive = google.drive({
      version: "v3",
      auth,
    });

    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

    if (!folderId) {
      throw new Error(
        "Missing required environment variable: GOOGLE_DRIVE_FOLDER_ID",
      );
    }

    const folder = await drive.files.get({
      fileId: folderId,
      fields: "id,name,mimeType",
      supportsAllDrives: true,
    });

    return NextResponse.json({
      success: true,
      message: "Google Drive connection is working.",
      folder: folder.data,
    });
  } catch (error) {
    console.error("Google Drive test error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Unable to connect to Google Drive.",
      },
      { status: 500 },
    );
  }
}