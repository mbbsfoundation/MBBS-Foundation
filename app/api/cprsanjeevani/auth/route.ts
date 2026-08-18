import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_PASSWORD,
  createAdminToken,
  verifyAdminRequest,
  setAdminCookie,
  clearAdminCookie,
} from "@/lib/adminAuth";

/**
 * Check authentication status
 */
export async function GET(request: NextRequest) {
  const isAuthenticated = verifyAdminRequest(request);
  return NextResponse.json({
    success: true,
    authenticated: isAuthenticated,
  });
}

/**
 * Login with Master Password
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { password } = body;

    if (!password || typeof password !== "string") {
      return NextResponse.json(
        { success: false, error: "Password is required to access Admin Portal." },
        { status: 400 }
      );
    }

    if (password.trim() !== ADMIN_PASSWORD) {
      return NextResponse.json(
        {
          success: false,
          error: "Incorrect admin password. Access denied.",
        },
        { status: 401 }
      );
    }

    // Password valid -> Generate token and set HTTP-only cookie
    const token = createAdminToken();
    const response = NextResponse.json({
      success: true,
      message: "Admin authentication successful.",
      token,
    });

    setAdminCookie(response, token);
    return response;
  } catch (error: any) {
    console.error("Admin auth error:", error);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred during authentication." },
      { status: 500 }
    );
  }
}

/**
 * Logout / Lock Admin Portal
 */
export async function DELETE(request: NextRequest) {
  const response = NextResponse.json({
    success: true,
    message: "Logged out successfully. Admin Portal locked.",
  });
  clearAdminCookie(response);
  return response;
}
