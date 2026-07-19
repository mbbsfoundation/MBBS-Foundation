import { google } from "googleapis";
import { Readable } from "stream";
import { createAuthorizedGoogleOAuthClient } from "./googleOAuth";

export async function uploadFileToDrive(
  buffer: Buffer,
  filename: string,
  mimeType: string,
) {
  const auth = createAuthorizedGoogleOAuthClient();

  const drive = google.drive({
    version: "v3",
    auth,
  });

  const stream = Readable.from(buffer);

  const response = await drive.files.create({
    requestBody: {
      name: filename,
      parents: [process.env.GOOGLE_DRIVE_FOLDER_ID!],
    },
    media: {
      mimeType,
      body: stream,
    },
    fields: "id,name,webViewLink",
  });

  return response.data;
}