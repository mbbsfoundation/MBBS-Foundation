import { NextRequest, NextResponse } from "next/server";

import {
  COORDINATOR_SESSION_COOKIE,
  verifyCoordinatorSessionToken,
} from "@/lib/cprday/auth";
import { prisma } from "@/lib/prisma";

type CreateCourseRequest = {
  title?: string;
  description?: string;

  courseDate?: string;
  startTime?: string;
  endTime?: string;

  venueName?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  district?: string;
  state?: string;
  stateCode?: string;
  postalCode?: string;

  expectedParticipants?: number | string | null;
  maximumParticipants?: number | string | null;

  isPublicRegistrationOpen?: boolean;
};

function normaliseText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function parseOptionalNumber(value: unknown) {
  if (value === "" || value === null || value === undefined) {
    return null;
  }

  const parsedValue = Number(value);

  if (!Number.isFinite(parsedValue) || parsedValue < 0) {
    return null;
  }

  return Math.floor(parsedValue);
}

async function createNextCourseCode(
  stateCode: string,
  courseDateText: string,
) {
  const datePart = courseDateText.replaceAll("-", "");
  const prefix = `CPR-${stateCode}-${datePart}-`;

  const latestCourse = await prisma.course.findFirst({
    where: {
      courseCode: {
        startsWith: prefix,
      },
    },
    orderBy: {
      courseCode: "desc",
    },
    select: {
      courseCode: true,
    },
  });

  let nextSequence = 1;

  if (latestCourse) {
    const previousSequenceText =
      latestCourse.courseCode.split("-").at(-1);

    const previousSequence = Number(previousSequenceText);

    if (Number.isInteger(previousSequence)) {
      nextSequence = previousSequence + 1;
    }
  }

  const sequencePart = String(nextSequence).padStart(3, "0");

  return `${prefix}${sequencePart}`;
}

async function getCoordinatorSession(request: NextRequest) {
  const sessionToken = request.cookies.get(
    COORDINATOR_SESSION_COOKIE,
  )?.value;

  if (!sessionToken) {
    return null;
  }

  return verifyCoordinatorSessionToken(sessionToken);
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const courseCode = normaliseText(searchParams.get("courseCode"));
    const latestMine = searchParams.get("latestMine") === "true";
    if (latestMine) {
  const session = await getCoordinatorSession(request);

  if (!session) {
    return NextResponse.json(
      {
        success: false,
        message: "Please sign in as a Course Coordinator.",
      },
      {
        status: 401,
      },
    );
  }

  const latestCourse = await prisma.course.findFirst({
    where: {
      teamMembers: {
        some: {
          userId: session.userId,
          teamRole: "COURSE_COORDINATOR",
          status: "ACCEPTED",
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      title: true,
      venueName: true,
      addressLine1: true,
      addressLine2: true,
      city: true,
      district: true,
      state: true,
      stateCode: true,
      postalCode: true,
    },
  });

  return NextResponse.json({
    success: true,
    course: latestCourse,
  });
}

    if (courseCode) {
      const course = await prisma.course.findUnique({
        where: {
          courseCode,
        },
        include: {
          _count: {
            select: {
              participants: true,
              teamMembers: true,
            },
          },
        },
      });

      if (!course) {
        return NextResponse.json(
          {
            success: false,
            message: "Venue not found.",
          },
          {
            status: 404,
          },
        );
      }

      if (!course.isPublicRegistrationOpen) {
        return NextResponse.json(
          {
            success: false,
            message: "Public registration is not open for this venue.",
          },
          {
            status: 403,
          },
        );
      }

      return NextResponse.json({
        success: true,
        course,
      });
    }

    const courses = await prisma.course.findMany({
      where: {
        isPublicRegistrationOpen: true,
        status: {
          in: ["APPROVED", "SUBMITTED", "DRAFT"],
        },
      },
      orderBy: [
        {
          courseDate: "asc",
        },
        {
          createdAt: "desc",
        },
      ],
      include: {
        _count: {
          select: {
            participants: true,
            teamMembers: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      courses,
    });
  } catch (error) {
    console.error("Unable to load CPR Day venues:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to load venues.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getCoordinatorSession(request);

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          message: "Please sign in as a Course Coordinator.",
        },
        {
          status: 401,
        },
      );
    }

    const coordinator = await prisma.user.findFirst({
      where: {
        id: session.userId,
        isActive: true,
        roleAssignments: {
          some: {
            role: "COURSE_COORDINATOR",
            status: "ACTIVE",
          },
        },
      },
      select: {
        id: true,
      },
    });

    if (!coordinator) {
      return NextResponse.json(
        {
          success: false,
          message: "Your coordinator account is not active.",
        },
        {
          status: 403,
        },
      );
    }

    const body = (await request.json()) as CreateCourseRequest;

    const title =
      normaliseText(body.title) || "National IAP CPR Day 2026 Training";

    const courseDateText = normaliseText(body.courseDate);
    const startTime = normaliseText(body.startTime);
    const endTime = normaliseText(body.endTime);

    const venueName = normaliseText(body.venueName);
    const addressLine1 = normaliseText(body.addressLine1);
    const addressLine2 = normaliseText(body.addressLine2);

    const city = normaliseText(body.city);
    const district = normaliseText(body.district);
    const state = normaliseText(body.state);
    const stateCode = normaliseText(body.stateCode).toUpperCase();
    const postalCode = normaliseText(body.postalCode);

    const requiredFields = [
      ["title", title],
      ["courseDate", courseDateText],
      ["venueName", venueName],
      ["city", city],
      ["district", district],
      ["state", state],
      ["stateCode", stateCode],
      ["postalCode", postalCode],
    ] as const;

    const missingFields = requiredFields
      .filter(([, value]) => !value)
      .map(([field]) => field);

    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Please complete all required venue details.",
          missingFields,
        },
        {
          status: 400,
        },
      );
    }

    const courseDate = new Date(`${courseDateText}T00:00:00`);

    if (Number.isNaN(courseDate.getTime())) {
      return NextResponse.json(
        {
          success: false,
          message: "Please enter a valid training date.",
        },
        {
          status: 400,
        },
      );
    }

    const expectedParticipants = parseOptionalNumber(
      body.expectedParticipants,
    );

    const maximumParticipants = parseOptionalNumber(
      body.maximumParticipants,
    );

    if (
      expectedParticipants !== null &&
      maximumParticipants !== null &&
      expectedParticipants > maximumParticipants
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Expected participants cannot exceed maximum participants.",
        },
        {
          status: 400,
        },
      );
    }


      let course = null;

for (let attempt = 0; attempt < 5; attempt += 1) {
  const courseCode = await createNextCourseCode(
    stateCode,
    courseDateText,
  );

  try {
    course = await prisma.course.create({
      data: {
        courseCode,
        title,
        description: normaliseText(body.description) || null,
        status: "DRAFT",

        courseDate,
        startTime: startTime || null,
        endTime: endTime || null,

        venueName,
        addressLine1: addressLine1 || null,
        addressLine2: addressLine2 || null,
        city,
        district,
        state,
        stateCode,
        postalCode,

        expectedParticipants,
        maximumParticipants,

        isPublicRegistrationOpen:
          body.isPublicRegistrationOpen === true,

        teamMembers: {
          create: {
            userId: session.userId,
            teamRole: "COURSE_COORDINATOR",
            status: "ACCEPTED",
            respondedAt: new Date(),
          },
        },
      },
    });

    break;
  } catch (error) {
    const isDuplicateCourseCode =
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002";

    if (!isDuplicateCourseCode || attempt === 4) {
      throw error;
    }
  }
}

if (!course) {
  throw new Error("Unable to generate a unique Course ID.");
}

    return NextResponse.json(
      {
        success: true,
        message: "Course created successfully.",
        course: {
          id: course.id,
          courseCode: course.courseCode,
          title: course.title,
          venueName: course.venueName,
        },
      },
      {
        status: 201,
      },
    );
   } catch (error) {
    console.error("Unable to create CPR Day Course:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown server error.";

    return NextResponse.json(
      {
        success: false,
        message:
          process.env.NODE_ENV === "development"
            ? errorMessage
            : "Unable to create the course. Please try again.",
      },
      {
        status: 500,
      },
    );
  }
}