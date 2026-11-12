import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";
import {
  LEARNER_SESSION_COOKIE,
  verifyLearnerSessionToken,
} from "@/lib/mbbs-foundation/learnerAuth";

export const dynamic = "force-dynamic";

// Strict server-side courseware path (never client-supplied)
const COURSEWARE_PDF_PATH = path.join(
  process.cwd(),
  "content",
  "lms",
  "revive",
  "MBBS_Foundation_Revive.pdf"
);

/**
 * Validates HttpOnly learner session cookie strictly.
 * Requirement 6: Do not accept bearer tokens or client-supplied file paths.
 */
async function authenticateLearner(request: NextRequest): Promise<{
  authenticated: boolean;
  errorStatus?: number;
  errorMessage?: string;
}> {
  // 1. Strictly extract from HttpOnly session cookie (no Bearer token accepted)
  const sessionCookie = request.cookies.get(LEARNER_SESSION_COOKIE)?.value;

  if (!sessionCookie) {
    return {
      authenticated: false,
      errorStatus: 401,
      errorMessage: "Authentication required. Please sign in to access courseware.",
    };
  }

  // 2. Cryptographically verify JWT session token
  const payload = await verifyLearnerSessionToken(sessionCookie);
  if (!payload || !payload.userId) {
    return {
      authenticated: false,
      errorStatus: 401,
      errorMessage: "Session expired or invalid. Please sign in again.",
    };
  }

  // 3. Verify active user account status in PostgreSQL
  try {
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, isActive: true },
    });

    if (!user || !user.isActive) {
      return {
        authenticated: false,
        errorStatus: 403,
        errorMessage: "Active learner account required.",
      };
    }

    return { authenticated: true };
  } catch (dbErr) {
    console.error("Courseware auth database error:", dbErr);
    return {
      authenticated: false,
      errorStatus: 500,
      errorMessage: "Authentication verification service temporarily unavailable.",
    };
  }
}

/**
 * Common security and cache-control headers for protected courseware delivery.
 */
function getCoursewareHeaders(extraHeaders: Record<string, string> = {}): Headers {
  const headers = new Headers();
  headers.set("Content-Type", "application/pdf");
  headers.set("Accept-Ranges", "bytes");
  headers.set("Cache-Control", "private, no-store, no-cache, must-revalidate");
  headers.set("Pragma", "no-cache");
  headers.set("Expires", "0");
  headers.set("Content-Disposition", 'inline; filename="revive-courseware.pdf"');
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");

  for (const [key, value] of Object.entries(extraHeaders)) {
    headers.set(key, value);
  }
  return headers;
}

/**
 * HEAD /api/mbbs-foundation/learn/courseware/revive
 * Allows PDF.js and browsers to discover Accept-Ranges and Content-Length.
 */
export async function HEAD(request: NextRequest) {
  const auth = await authenticateLearner(request);
  if (!auth.authenticated) {
    return new Response(null, {
      status: auth.errorStatus || 401,
      headers: { "Cache-Control": "private, no-store" },
    });
  }

  if (!fs.existsSync(COURSEWARE_PDF_PATH)) {
    return new Response(null, { status: 404 });
  }

  const stat = fs.statSync(COURSEWARE_PDF_PATH);
  return new Response(null, {
    status: 200,
    headers: getCoursewareHeaders({
      "Content-Length": String(stat.size),
    }),
  });
}

/**
 * GET /api/mbbs-foundation/learn/courseware/revive
 * Authenticated streaming with RFC 7233 byte-range support.
 */
export async function GET(request: NextRequest) {
  // 1. Authenticate request
  const auth = await authenticateLearner(request);
  if (!auth.authenticated) {
    return NextResponse.json(
      {
        success: false,
        error: "UNAUTHORIZED",
        message: auth.errorMessage || "Authentication required.",
      },
      {
        status: auth.errorStatus || 401,
        headers: { "Cache-Control": "private, no-store" },
      }
    );
  }

  // 2. Ensure courseware file exists on disk
  if (!fs.existsSync(COURSEWARE_PDF_PATH)) {
    return NextResponse.json(
      { success: false, error: "NOT_FOUND", message: "Courseware file not found." },
      { status: 404, headers: { "Cache-Control": "private, no-store" } }
    );
  }

  const stat = fs.statSync(COURSEWARE_PDF_PATH);
  const fileSize = stat.size;

  // 3. Handle RFC 7233 Byte-Range requests
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
          "Cache-Control": "private, no-store",
        },
      });
    }

    const chunkSize = end - start + 1;
    const nodeStream = fs.createReadStream(COURSEWARE_PDF_PATH, { start, end });
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
      headers: getCoursewareHeaders({
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Content-Length": String(chunkSize),
      }),
    });
  }

  // 4. Full document stream when Range header is not present
  const nodeStream = fs.createReadStream(COURSEWARE_PDF_PATH);
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
    headers: getCoursewareHeaders({
      "Content-Length": String(fileSize),
    }),
  });
}
