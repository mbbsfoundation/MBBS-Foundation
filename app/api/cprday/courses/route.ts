import { NextRequest, NextResponse } from "next/server";
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

function createCourseCode() {
  const datePart = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  const randomPart = Math.random()
    .toString(36)
    .slice(2, 7)
    .toUpperCase();

  return `CPR-${datePart}-${randomPart}`;
}

function verifyManagementKey(request: NextRequest) {
  const expectedKey = process.env.CPRDAY_MANAGEMENT_KEY;

  if (!expectedKey) {
    console.error("CPRDAY_MANAGEMENT_KEY is not configured.");
    return false;
  }

  const suppliedKey = request.headers.get("x-cprday-management-key");

  return suppliedKey === expectedKey;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const courseCode = normaliseText(searchParams.get("courseCode"));
    const includeAll = searchParams.get("all") === "true";

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
            message: "Course not found.",
          },
          {
            status: 404,
          },
        );
      }

      if (!includeAll && !course.isPublicRegistrationOpen) {
        return NextResponse.json(
          {
            success: false,
            message: "Public registration is not open for this course.",
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

    if (includeAll && !verifyManagementKey(request)) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorised access.",
        },
        {
          status: 401,
        },
      );
    }

    const courses = await prisma.course.findMany({
      where: includeAll
        ? undefined
        : {
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
    console.error("Unable to load CPR Day courses:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to load courses.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!verifyManagementKey(request)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid management key.",
        },
        {
          status: 401,
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
      ["courseDate", courseDateText],
      ["startTime", startTime],
      ["venueName", venueName],
      ["city", city],
      ["district", district],
      ["state", state],
      ["stateCode", stateCode],
    ] as const;

    const missingFields = requiredFields
      .filter(([, value]) => !value)
      .map(([field]) => field);

    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Required course details are missing.",
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
          message: "Invalid course date.",
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

    let courseCode = createCourseCode();

    while (
      await prisma.course.findUnique({
        where: {
          courseCode,
        },
        select: {
          id: true,
        },
      })
    ) {
      courseCode = createCourseCode();
    }

    const course = await prisma.course.create({
      data: {
        courseCode,
        venueId: courseCode,
        title,
        description: normaliseText(body.description) || null,

        status: "DRAFT",

        courseDate,
        startTime,
        endTime: endTime || null,

        venueName,
        addressLine1: addressLine1 || null,
        addressLine2: addressLine2 || null,
        city,
        district,
        state,
        stateCode,
        postalCode: postalCode || null,

        expectedParticipants,
        maximumParticipants,

        isPublicRegistrationOpen:
          body.isPublicRegistrationOpen === true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Course created successfully.",
        course,
        links: {
          banner: `/cprday/dashboard/banner?courseCode=${encodeURIComponent(
            course.courseCode,
          )}`,
          registration: `/cprday/participant/register/${encodeURIComponent(
            course.stateCode,
          )}/${encodeURIComponent(course.courseCode)}`,
          attendance: `/cprday/dashboard/participants?courseCode=${encodeURIComponent(
            course.courseCode,
          )}`,
        },
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error("Unable to create CPR Day course:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to create the course.",
      },
      {
        status: 500,
      },
    );
  }
}