import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

// Strict server-side preview courseware path (never client-supplied)
const PREVIEW_PDF_PATH = path.join(
  process.cwd(),
  "content",
  "lms",
  "revive",
  "MBBS_Foundation_Revive_Preview20.pdf"
);

function getPreviewHeaders(extraHeaders: Record<string, string> = {}): Headers {
  const headers = new Headers();
  headers.set("Content-Type", "application/pdf");
  headers.set("Accept-Ranges", "bytes");
  headers.set("Cache-Control", "public, max-age=3600, stale-while-revalidate=86400");
  headers.set("Content-Disposition", 'inline; filename="revive-preview.pdf"');
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");

  for (const [key, value] of Object.entries(extraHeaders)) {
    headers.set(key, value);
  }
  return headers;
}

/**
 * HEAD /api/mbbs-foundation/learn/courseware/revive/preview
 * Allows PDF.js to discover Accept-Ranges and Content-Length.
 */
export async function HEAD() {
  if (!fs.existsSync(PREVIEW_PDF_PATH)) {
    return new Response(null, { status: 404 });
  }

  const stat = fs.statSync(PREVIEW_PDF_PATH);
  return new Response(null, {
    status: 200,
    headers: getPreviewHeaders({
      "Content-Length": String(stat.size),
    }),
  });
}

/**
 * GET /api/mbbs-foundation/learn/courseware/revive/preview
 * Streams the 20-slide preview PDF with RFC 7233 byte-range support.
 */
export async function GET(request: NextRequest) {
  if (!fs.existsSync(PREVIEW_PDF_PATH)) {
    return NextResponse.json(
      { success: false, error: "NOT_FOUND", message: "Preview courseware file not found." },
      { status: 404 }
    );
  }

  const stat = fs.statSync(PREVIEW_PDF_PATH);
  const fileSize = stat.size;

  // Handle RFC 7233 Byte-Range requests
  const rangeHeader = request.headers.get("range");

  if (rangeHeader && rangeHeader.startsWith("bytes=")) {
    const rangePart = rangeHeader.substring(6).trim();
    const [startStr, endStr] = rangePart.split("-");

    let start = parseInt(startStr, 10);
    let end = endStr ? parseInt(endStr, 10) : fileSize - 1;

    if (isNaN(start)) {
      start = fileSize - parseInt(endStr, 10);
      end = fileSize - 1;
    }

    if (start < 0 || start >= fileSize || end >= fileSize || start > end) {
      return new Response(null, {
        status: 416,
        headers: {
          "Content-Range": `bytes */${fileSize}`,
          "Cache-Control": "public, max-age=3600",
        },
      });
    }

    const chunkSize = end - start + 1;
    const nodeStream = fs.createReadStream(PREVIEW_PDF_PATH, { start, end });
    const webStream = new ReadableStream({
      start(controller) {
        nodeStream.on("data", (chunk) => controller.enqueue(chunk));
        nodeStream.on("end", () => controller.close());
        nodeStream.on("error", (err) => controller.error(err));
      },
      cancel() {
        nodeStream.destroy();
      },
    });

    return new Response(webStream, {
      status: 206,
      headers: getPreviewHeaders({
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Content-Length": String(chunkSize),
      }),
    });
  }

  // Full document stream when Range header is not present
  const nodeStream = fs.createReadStream(PREVIEW_PDF_PATH);
  const webStream = new ReadableStream({
    start(controller) {
      nodeStream.on("data", (chunk) => controller.enqueue(chunk));
      nodeStream.on("end", () => controller.close());
      nodeStream.on("error", (err) => controller.error(err));
    },
    cancel() {
      nodeStream.destroy();
    },
  });

  return new Response(webStream, {
    status: 200,
    headers: getPreviewHeaders({
      "Content-Length": String(fileSize),
    }),
  });
}
