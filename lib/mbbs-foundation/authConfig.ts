import { NextResponse } from "next/server";
import {
  LEARNER_SESSION_COOKIE,
  LEARNER_VERIFIED_TICKET_COOKIE,
  getLearnerSessionCookieOptions,
  getVerifiedTicketCookieOptions,
} from "./learnerAuth";

/**
 * Checks whether learner authentication is explicitly enabled via feature flag.
 * STRICT SECURITY REQUIREMENT:
 * All learner authentication and registration endpoints are disabled by default
 * until MBBS_LEARNER_AUTH_ENABLED is explicitly set to "true".
 */
export function isLearnerAuthEnabled(): boolean {
  return process.env.MBBS_LEARNER_AUTH_ENABLED === "true";
}

/**
 * Standard HTTP security headers preventing caching of authentication/session responses.
 */
export function getSecurityHeaders(): Record<string, string> {
  return {
    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
    Pragma: "no-cache",
    Expires: "0",
  };
}

/**
 * Standard 403 Forbidden response when the feature flag is disabled.
 */
export function featureDisabledResponse(): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: "FEATURE_DISABLED",
      message: "MBBS Foundation learner authentication is currently disabled.",
    },
    {
      status: 403,
      headers: getSecurityHeaders(),
    }
  );
}

/**
 * Resolves the fixed, canonical website base URL for verification links.
 * SECURITY REQUIREMENT:
 * Never derives links from untrusted request headers (Host, X-Forwarded-Host, etc.)
 * to prevent Host header poisoning and magic link hijacking.
 */
export function getCanonicalAppBaseUrl(): string {
  const configuredUrl =
    process.env.APP_BASE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL;

  if (configuredUrl && configuredUrl.trim()) {
    return configuredUrl.trim().replace(/\/+$/, "");
  }

  // Production canonical fallback
  if (process.env.NODE_ENV === "production") {
    return "https://mbbsfoundation.com";
  }

  // Local development fallback
  return "http://localhost:3000";
}

/**
 * Extracts client IP address from standard reverse-proxy headers with fallback.
 */
export function getClientIp(request: Request): string | null {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const firstIp = forwardedFor.split(",")[0].trim();
    if (firstIp) return firstIp;
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp && realIp.trim()) return realIp.trim();

  const cfIp = request.headers.get("cf-connecting-ip");
  if (cfIp && cfIp.trim()) return cfIp.trim();

  return null;
}

/**
 * Validates request origin against the host header for state-changing requests (CSRF protection).
 */
export function verifyCsrf(request: Request): boolean {
  const method = request.method.toUpperCase();
  if (["GET", "HEAD", "OPTIONS"].includes(method)) {
    return true;
  }

  // Cross-site fetch check (browser Sec-Fetch-Site header)
  const secFetchSite = request.headers.get("sec-fetch-site");
  if (secFetchSite === "cross-site") {
    return false;
  }

  const host = request.headers.get("host");
  const origin = request.headers.get("origin");

  if (origin && host) {
    try {
      const originUrl = new URL(origin);
      if (originUrl.host !== host) {
        return false;
      }
    } catch {
      return false;
    }
    return true;
  }

  const referer = request.headers.get("referer");
  if (referer && host) {
    try {
      const refererUrl = new URL(referer);
      if (refererUrl.host !== host) {
        return false;
      }
    } catch {
      return false;
    }
    return true;
  }

  // If neither origin nor referer is provided (e.g. programmatic / non-browser client or local testing),
  // allow request if no cross-site signal was detected.
  return true;
}

/**
 * Sets persistent HttpOnly learner session cookie on a NextResponse.
 */
export function setLearnerSessionCookie(response: NextResponse, token: string): void {
  response.cookies.set(
    LEARNER_SESSION_COOKIE,
    token,
    getLearnerSessionCookieOptions()
  );
}

/**
 * Explicitly clears the learner session cookie.
 */
export function clearLearnerSessionCookie(response: NextResponse): void {
  response.cookies.set(LEARNER_SESSION_COOKIE, "", {
    ...getLearnerSessionCookieOptions(),
    maxAge: 0,
  });
}

/**
 * Sets short-lived HttpOnly verified registration ticket cookie on a NextResponse.
 */
export function setVerifiedTicketCookie(response: NextResponse, ticketJwt: string): void {
  response.cookies.set(
    LEARNER_VERIFIED_TICKET_COOKIE,
    ticketJwt,
    getVerifiedTicketCookieOptions()
  );
}

/**
 * Explicitly clears the verified registration ticket cookie.
 */
export function clearVerifiedTicketCookie(response: NextResponse): void {
  response.cookies.set(LEARNER_VERIFIED_TICKET_COOKIE, "", {
    ...getVerifiedTicketCookieOptions(),
    maxAge: 0,
  });
}
