import { NextResponse } from "next/server";

import {
  COORDINATOR_SESSION_COOKIE,
  createCoordinatorSessionToken,
  getCoordinatorSessionCookieOptions,
  verifyPassword,
} from "@/lib/cprday/auth";
import { prisma } from "@/lib/prisma";

type LoginRequestBody = {
  email?: string;
  password?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as LoginRequestBody;

    const email = body.email?.trim().toLowerCase();
    const password = body.password ?? "";

    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          message: "Please enter both email address and password.",
        },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        email,
      },
      include: {
        roleAssignments: {
          where: {
            role: "COURSE_COORDINATOR",
            status: "ACTIVE",
          },
        },
      },
    });

    if (
      !user ||
      !user.isActive ||
      !user.passwordHash ||
      user.roleAssignments.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid email address or password.",
        },
        { status: 401 },
      );
    }

    const passwordIsValid = await verifyPassword(
      password,
      user.passwordHash,
    );

    if (!passwordIsValid) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid email address or password.",
        },
        { status: 401 },
      );
    }

    const sessionToken = await createCoordinatorSessionToken({
      userId: user.id,
      email,
      role: "COURSE_COORDINATOR",
    });

    const response = NextResponse.json({
      success: true,
      message: "Login successful.",
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
      },
    });

    response.cookies.set(
      COORDINATOR_SESSION_COOKIE,
      sessionToken,
      getCoordinatorSessionCookieOptions(),
    );

    return response;
  } catch (error) {
    console.error("Coordinator login error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to log in. Please try again.",
      },
      { status: 500 },
    );
  }
}