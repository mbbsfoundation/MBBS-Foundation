import { NextResponse } from "next/server";

import {
  COORDINATOR_SESSION_COOKIE,
  createCoordinatorSessionToken,
  getCoordinatorSessionCookieOptions,
  hashPassword,
} from "@/lib/cprday/auth";
import { prisma } from "@/lib/prisma";

type SignupRequestBody = {
  fullName?: string;
  email?: string;
  mobileNumber?: string;
  password?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SignupRequestBody;

    const fullName = body.fullName?.trim();
    const email = body.email?.trim().toLowerCase();
    const mobileNumber = body.mobileNumber?.trim() || null;
    const password = body.password ?? "";

    if (!fullName || !email || !password) {
      return NextResponse.json(
        {
          success: false,
          message: "Name, email address and password are required.",
        },
        { status: 400 },
      );
    }

    if (password.length < 10) {
      return NextResponse.json(
        {
          success: false,
          message: "Password must contain at least 10 characters.",
        },
        { status: 400 },
      );
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          {
            email,
          },
          ...(mobileNumber
            ? [
                {
                  mobileNumber,
                },
              ]
            : []),
        ],
      },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          message:
            "An account already exists with this email address or mobile number.",
        },
        { status: 409 },
      );
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        fullName,
        email,
        mobileNumber,
        passwordHash,
        isActive: true,
        emailVerifiedAt: new Date(),

        roleAssignments: {
          create: {
            role: "COURSE_COORDINATOR",
            scopeType: "SELF",
            status: "ACTIVE",
            approvedAt: new Date(),
          },
        },
      },
    });

    const sessionToken = await createCoordinatorSessionToken({
      userId: user.id,
      email,
      role: "COURSE_COORDINATOR",
    });

    const response = NextResponse.json(
      {
        success: true,
        message: "Coordinator account created successfully.",
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
        },
      },
      { status: 201 },
    );

    response.cookies.set(
      COORDINATOR_SESSION_COOKIE,
      sessionToken,
      getCoordinatorSessionCookieOptions(),
    );

    return response;
  } catch (error) {
  console.error("Coordinator signup failed:", error);

  return NextResponse.json(
    {
      success: false,
      message: "Unable to create the account. Please try again.",
      error: error instanceof Error ? error.message : String(error),
    },
    { status: 500 },
  );
}
}