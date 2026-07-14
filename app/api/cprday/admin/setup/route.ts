import { NextResponse } from "next/server";

import {
  ADMIN_SESSION_COOKIE,
  createAdminSessionToken,
  getAdminSessionCookieOptions,
  hashPassword,
} from "@/lib/cprday/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SetupRequestBody = {
  fullName?: unknown;
  email?: unknown;
  mobileNumber?: unknown;
  password?: unknown;
  setupKey?: unknown;
};

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function normalizeMobileNumber(value: string): string {
  return value.replace(/\D/g, "");
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function GET() {
  try {
    const administratorExists = await prisma.userRole.findFirst({
      where: {
        role: "ADMINISTRATOR",
        status: "ACTIVE",
      },
      select: {
        id: true,
      },
    });

    return NextResponse.json({
      success: true,
      setupAvailable: !administratorExists,
    });
  } catch (error) {
    console.error("Administrator setup status check failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to check administrator setup status.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function POST(request: Request) {
  try {
    const expectedSetupKey = process.env.ADMIN_SETUP_KEY;

    if (!expectedSetupKey) {
      return NextResponse.json(
        {
          success: false,
          message: "ADMIN_SETUP_KEY is not configured.",
        },
        {
          status: 500,
        },
      );
    }

    const body = (await request.json()) as SetupRequestBody;

    const fullName =
      typeof body.fullName === "string" ? body.fullName.trim() : "";

    const email =
      typeof body.email === "string" ? normalizeEmail(body.email) : "";

    const mobileNumber =
      typeof body.mobileNumber === "string"
        ? normalizeMobileNumber(body.mobileNumber)
        : "";

    const password =
      typeof body.password === "string" ? body.password : "";

    const setupKey =
      typeof body.setupKey === "string" ? body.setupKey : "";

    if (setupKey !== expectedSetupKey) {
      return NextResponse.json(
        {
          success: false,
          message: "The administrator setup key is incorrect.",
        },
        {
          status: 401,
        },
      );
    }

    if (fullName.length < 3) {
      return NextResponse.json(
        {
          success: false,
          message: "Please enter the administrator’s full name.",
        },
        {
          status: 400,
        },
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        {
          success: false,
          message: "Please enter a valid email address.",
        },
        {
          status: 400,
        },
      );
    }

    if (mobileNumber.length < 10 || mobileNumber.length > 15) {
      return NextResponse.json(
        {
          success: false,
          message: "Please enter a valid mobile number.",
        },
        {
          status: 400,
        },
      );
    }

    if (password.length < 10) {
      return NextResponse.json(
        {
          success: false,
          message: "Password must contain at least 10 characters.",
        },
        {
          status: 400,
        },
      );
    }

    const administratorExists = await prisma.userRole.findFirst({
      where: {
        role: "ADMINISTRATOR",
        status: "ACTIVE",
      },
      select: {
        id: true,
      },
    });

    if (administratorExists) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Administrator setup has already been completed. Please sign in.",
        },
        {
          status: 409,
        },
      );
    }

    const passwordHash = await hashPassword(password);

    const administrator = await prisma.$transaction(async (transaction) => {
      const existingUser = await transaction.user.findUnique({
        where: {
          email,
        },
      });

      const user = existingUser
        ? await transaction.user.update({
            where: {
              id: existingUser.id,
            },
            data: {
              fullName,
              mobileNumber,
              passwordHash,
              isActive: true,
            },
          })
        : await transaction.user.create({
            data: {
              fullName,
              email,
              mobileNumber,
              passwordHash,
              isActive: true,
              emailVerifiedAt: new Date(),
            },
          });

      await transaction.userRole.create({
        data: {
          userId: user.id,
          role: "ADMINISTRATOR",
          scopeType: "GLOBAL",
          status: "ACTIVE",
          approvedAt: new Date(),
          validFrom: new Date(),
          notes: "Initial CPR Day Version 1 administrator.",
        },
      });

      return user;
    });

    const sessionToken = await createAdminSessionToken({
      userId: administrator.id,
      email: administrator.email!,
      role: "ADMINISTRATOR",
    });

    const response = NextResponse.json(
      {
        success: true,
        message: "Administrator account created successfully.",
        administrator: {
          id: administrator.id,
          fullName: administrator.fullName,
          email: administrator.email,
        },
      },
      {
        status: 201,
      },
    );

    response.cookies.set(
      ADMIN_SESSION_COOKIE,
      sessionToken,
      getAdminSessionCookieOptions(),
    );

    return response;
  } catch (error) {
    console.error("Administrator setup failed:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          "Administrator setup could not be completed. Please try again.",
      },
      {
        status: 500,
      },
    );
  }
}