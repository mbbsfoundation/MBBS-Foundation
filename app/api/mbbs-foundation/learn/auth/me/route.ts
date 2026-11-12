import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  isLearnerAuthEnabled,
  getSecurityHeaders,
  featureDisabledResponse,
  clearLearnerSessionCookie,
} from "@/lib/mbbs-foundation/authConfig";
import {
  LEARNER_SESSION_COOKIE,
  verifyLearnerSessionToken,
} from "@/lib/mbbs-foundation/learnerAuth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  // 1. Feature flag guard
  if (!isLearnerAuthEnabled()) {
    return featureDisabledResponse();
  }

  try {
    // 2. Extract session token from cookie or Authorization header
    const cookieToken = request.cookies.get(LEARNER_SESSION_COOKIE)?.value;
    const authHeader = request.headers.get("authorization");
    const bearerToken =
      authHeader && authHeader.startsWith("Bearer ")
        ? authHeader.substring(7).trim()
        : null;

    const sessionToken = cookieToken || bearerToken;

    if (!sessionToken) {
      return NextResponse.json(
        {
          success: false,
          authenticated: false,
          message: "No active learner session.",
        },
        { status: 401, headers: getSecurityHeaders() }
      );
    }

    // 3. Cryptographically verify learner session token
    const payload = await verifyLearnerSessionToken(sessionToken);
    if (!payload) {
      const response = NextResponse.json(
        {
          success: false,
          authenticated: false,
          message: "Session expired or invalid.",
        },
        { status: 401, headers: getSecurityHeaders() }
      );
      clearLearnerSessionCookie(response);
      return response;
    }

    // 4. Retrieve active user and profile from database
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        fullName: true,
        email: true,
        mobileNumber: true,
        isActive: true,
        learningProfile: {
          select: {
            id: true,
            fullName: true,
            email: true,
            normalizedEmail: true,
            mobileNumber: true,
            learnerCategory: true,
            collegeId: true,
            institutionName: true,
            city: true,
            state: true,
            district: true,
            pinCode: true,
            mbbsYear: true,
            departmentDesignation: true,
            createdAt: true,
            updatedAt: true,
            college: {
              select: { id: true, collegeName: true, state: true, city: true },
            },
          },
        },
      },
    });

    if (!user || !user.isActive) {
      const response = NextResponse.json(
        {
          success: false,
          authenticated: false,
          message: "Account is inactive or not found.",
        },
        { status: 401, headers: getSecurityHeaders() }
      );
      clearLearnerSessionCookie(response);
      return response;
    }

    return NextResponse.json(
      {
        success: true,
        authenticated: true,
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          mobileNumber: user.mobileNumber,
        },
        profile: user.learningProfile,
      },
      { status: 200, headers: getSecurityHeaders() }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        authenticated: false,
        error: "INTERNAL_ERROR",
        message: "An unexpected error occurred verifying session.",
      },
      { status: 500, headers: getSecurityHeaders() }
    );
  }
}
