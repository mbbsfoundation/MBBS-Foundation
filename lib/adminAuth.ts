import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";

export const ADMIN_PASSWORD = process.env.SANJEEVANI_ADMIN_PASSWORD || "Lokesh@2026";
const AUTH_SECRET = process.env.SANJEEVANI_AUTH_SECRET || "cpr-sanjeevani-admin-secret-lokesh-2026-auth-key";
export const COOKIE_NAME = "sanjeevani_admin_token";

/**
 * Generates a signed token with timestamp and HMAC signature.
 */
export function createAdminToken(): string {
  const timestamp = Date.now();
  const payload = `${timestamp}:admin_authenticated`;
  const hmac = crypto.createHmac("sha256", AUTH_SECRET);
  hmac.update(payload);
  const signature = hmac.digest("hex");
  return Buffer.from(`${payload}:${signature}`).toString("base64url");
}

/**
 * Validates a signed admin token and ensures it hasn't expired.
 */
export function verifyAdminToken(token: string | null | undefined): boolean {
  if (!token) return false;
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf-8");
    const parts = decoded.split(":");
    if (parts.length !== 3) return false;

    const [timestampStr, action, signature] = parts;
    if (action !== "admin_authenticated") return false;

    const timestamp = parseInt(timestampStr, 10);
    if (isNaN(timestamp)) return false;

    // Token valid for 7 days (7 * 24 * 60 * 60 * 1000 ms)
    const maxAge = 7 * 24 * 60 * 60 * 1000;
    if (Date.now() - timestamp > maxAge) return false;

    // Verify HMAC signature
    const payload = `${timestampStr}:${action}`;
    const hmac = crypto.createHmac("sha256", AUTH_SECRET);
    hmac.update(payload);
    const expectedSignature = hmac.digest("hex");

    return crypto.timingSafeEqual(
      Buffer.from(signature, "hex"),
      Buffer.from(expectedSignature, "hex")
    );
  } catch (err) {
    return false;
  }
}

/**
 * Verifies if an incoming Next.js HTTP Request is authorized as Admin.
 * Checks Cookies, Authorization Bearer Header, and X-Admin-Password Header.
 */
export function verifyAdminRequest(request: NextRequest): boolean {
  // 1. Check direct password header
  const directPassword = request.headers.get("x-admin-password");
  if (directPassword && directPassword === ADMIN_PASSWORD) {
    return true;
  }

  // 2. Check Authorization Header Bearer token
  const authHeader = request.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7).trim();
    if (verifyAdminToken(token)) return true;
  }

  // 3. Check Cookie
  const cookie = request.cookies.get(COOKIE_NAME);
  if (cookie?.value && verifyAdminToken(cookie.value)) {
    return true;
  }

  return false;
}

/**
 * Sets secure HTTP-Only admin session cookie on a NextResponse.
 */
export function setAdminCookie(response: NextResponse, token: string): void {
  response.cookies.set({
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });
}

/**
 * Clears the admin session cookie on a NextResponse.
 */
export function clearAdminCookie(response: NextResponse): void {
  response.cookies.set({
    name: COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
