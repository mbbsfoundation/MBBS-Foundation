import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

type PersonDetails = {
  name: string;
  mobile: string;
  email: string;
};

type CourseDetails = {
  id: number;
  registeredOnIapWebsite: string;
  courseCode: string;
  startTime: string;
  endTime: string;
  participantCategories: string[];
  otherParticipantCategory: string;
  expectedParticipants: number;
  adultManikins: number;
  infantManikins: number;
  coordinator: PersonDetails;
  leadInstructor: PersonDetails;
  otherInstructors: PersonDetails[];
  cprChampions: PersonDetails[];
};

type CPRDayEventPayload = {
  venueId: string;
  createdAt: string;
  status: "Draft" | "Confirmed" | "Completed";

  zone: string;
  state: string;
  city: string;
  hostInstitution: string;
  venueName: string;
  venuePinCode: string;
  iapBranchName: string;

  availableAdultManikins: number;
  availableInfantManikins: number;
  availableInstructors: number;
  availableChampions: number;

  courses: CourseDetails[];
};

const CPR_DAY_DATE = new Date("2026-07-21T00:00:00.000Z");

function cleanText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function cleanOptionalText(value: unknown): string | null {
  const cleanedValue = cleanText(value);
  return cleanedValue || null;
}

function cleanNumber(value: unknown, fallback = 0): number {
  const parsedValue = Number(value);

  if (!Number.isFinite(parsedValue) || parsedValue < 0) {
    return fallback;
  }

  return Math.floor(parsedValue);
}

function getStateCode(state: string): string {
  const stateCodes: Record<string, string> = {
    "Andaman and Nicobar Islands": "AN",
    "Andhra Pradesh": "AP",
    "Arunachal Pradesh": "AR",
    Assam: "AS",
    Bihar: "BR",
    Chandigarh: "CH",
    Chhattisgarh: "CG",
    "Dadra and Nagar Haveli and Daman and Diu": "DN",
    Delhi: "DL",
    Goa: "GA",
    Gujarat: "GJ",
    Haryana: "HR",
    "Himachal Pradesh": "HP",
    "Jammu and Kashmir": "JK",
    Jharkhand: "JH",
    Karnataka: "KA",
    Kerala: "KL",
    Ladakh: "LA",
    Lakshadweep: "LD",
    "Madhya Pradesh": "MP",
    Maharashtra: "MH",
    Manipur: "MN",
    Meghalaya: "ML",
    Mizoram: "MZ",
    Nagaland: "NL",
    Odisha: "OD",
    Puducherry: "PY",
    Punjab: "PB",
    Rajasthan: "RJ",
    Sikkim: "SK",
    "Tamil Nadu": "TN",
    Telangana: "TS",
    Tripura: "TR",
    "Uttar Pradesh": "UP",
    Uttarakhand: "UK",
    "West Bengal": "WB",
  };

  return stateCodes[state] || "IN";
}

function createInternalCourseCode(
  venueId: string,
  courseNumber: number,
): string {
  const safeVenueId = venueId
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(-12)
    .toUpperCase();

  return `CPR26-${safeVenueId}-${String(courseNumber).padStart(
    2,
    "0",
  )}`;
}

function eventStatusToCourseStatus(
  status: CPRDayEventPayload["status"],
) {
  if (status === "Completed") {
    return "COMPLETED" as const;
  }

  if (status === "Confirmed") {
    return "APPROVED" as const;
  }

  return "DRAFT" as const;
}

/**
 * A simple temporary protection mechanism.
 *
 * If CPRDAY_MANAGEMENT_KEY is configured, the request must provide:
 *
 * x-cprday-management-key: your-secret-key
 *
 * If the environment variable is not configured, the API remains open
 * during local development.
 */
function hasManagementAccess(request: NextRequest): boolean {
  const expectedKey = process.env.CPRDAY_MANAGEMENT_KEY;

  if (!expectedKey) {
    return process.env.NODE_ENV !== "production";
  }

  const suppliedKey = request.headers.get(
    "x-cprday-management-key",
  );

  return suppliedKey === expectedKey;
}

function validateEventPayload(
  payload: CPRDayEventPayload,
): string[] {
  const errors: string[] = [];

  if (!cleanText(payload.venueId)) {
    errors.push("Venue ID is required.");
  }

  if (!cleanText(payload.zone)) {
    errors.push("IAP Zone is required.");
  }

  if (!cleanText(payload.state)) {
    errors.push("State is required.");
  }

  if (!cleanText(payload.city)) {
    errors.push("City is required.");
  }

  if (!cleanText(payload.hostInstitution)) {
    errors.push("Host institution is required.");
  }

  if (!cleanText(payload.venueName)) {
    errors.push("Venue name is required.");
  }

  if (!/^[0-9]{6}$/.test(cleanText(payload.venuePinCode))) {
    errors.push("A valid six-digit venue PIN code is required.");
  }

  if (!Array.isArray(payload.courses) || payload.courses.length === 0) {
    errors.push("At least one CPR course is required.");
    return errors;
  }

  payload.courses.forEach((course, index) => {
    const courseNumber = index + 1;

    if (!cleanText(course.startTime)) {
      errors.push(
        `Start time is required for Course ${courseNumber}.`,
      );
    }

    if (!cleanText(course.endTime)) {
      errors.push(
        `End time is required for Course ${courseNumber}.`,
      );
    }

    if (
      !Array.isArray(course.participantCategories) ||
      course.participantCategories.length === 0
    ) {
      errors.push(
        `At least one participant category is required for Course ${courseNumber}.`,
      );
    }

    if (
      course.participantCategories?.includes("Other") &&
      !cleanText(course.otherParticipantCategory)
    ) {
      errors.push(
        `The other participant category must be specified for Course ${courseNumber}.`,
      );
    }

    if (cleanNumber(course.expectedParticipants) < 1) {
      errors.push(
        `Expected participants must be at least 1 for Course ${courseNumber}.`,
      );
    }
  });

  return errors;
}

export async function POST(request: NextRequest) {
  try {
    if (!hasManagementAccess(request)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid CPR Day management key.",
        },
        {
          status: 401,
        },
      );
    }

    const payload =
      (await request.json()) as CPRDayEventPayload;

    const validationErrors = validateEventPayload(payload);

    if (validationErrors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Please correct the submitted event details.",
          errors: validationErrors,
        },
        {
          status: 400,
        },
      );
    }

    const venueId = cleanText(payload.venueId);
    const state = cleanText(payload.state);
    const stateCode = getStateCode(state);

    /*
     * Existing course records for this venue are checked before saving.
     * Updating is allowed only while no participant registrations exist.
     */
    const existingCourses = await prisma.course.findMany({
      where: {
        id: venueId,
      },
      select: {
        id: true,
        courseCode: true,
        participants: {
          select: {
            id: true,
          },
        },
      },
    });

    const courseWithParticipants = existingCourses.find(
      (course) => course.participants.length > 0,
    );

    if (courseWithParticipants) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This venue already has participant registrations. Its courses cannot be replaced from the confirmation form.",
        },
        {
          status: 409,
        },
      );
    }

    const savedCourses = await prisma.$transaction(
      async (transaction) => {
        if (existingCourses.length > 0) {
          await transaction.course.deleteMany({
            where: {
              id: venueId,
            },
          });
        }

        const createdCourses = [];

        for (
          let courseIndex = 0;
          courseIndex < payload.courses.length;
          courseIndex += 1
        ) {
          const course = payload.courses[courseIndex];
          const courseNumber = courseIndex + 1;

          /*
           * courseCode is the platform's unique internal code.
           * The official iapalsbls.com code, when provided, is retained
           * separately inside metadata.
           */
          const internalCourseCode = createInternalCourseCode(
            venueId,
            courseNumber,
          );

          const createdCourse =
            await transaction.course.create({
              data: {
                courseCode: internalCourseCode,
                title: `National IAP CPR Day 2026 – Course ${courseNumber}`,

                description:
                  `CPR training hosted by ${cleanText(
                    payload.hostInstitution,
                  )} at ${cleanText(payload.venueName)}.`,

                status: eventStatusToCourseStatus(payload.status),

                courseDate: CPR_DAY_DATE,
                startTime: cleanText(course.startTime),
                endTime: cleanOptionalText(course.endTime),

                venueName: cleanText(payload.venueName),
                addressLine1: cleanText(
                  payload.hostInstitution,
                ),
                addressLine2: null,

                city: cleanText(payload.city),
                district: cleanText(payload.city),
                state,
                stateCode,
                postalCode: cleanText(payload.venuePinCode),

                expectedParticipants: cleanNumber(
                  course.expectedParticipants,
                  1,
                ),

                maximumParticipants: cleanNumber(
                  course.expectedParticipants,
                  1,
                ),

                isPublicRegistrationOpen:
                  payload.status !== "Completed",

                metadata: {
                  eventVersion: "CPR_DAY_VERSION_1",

                  venue: {
                    venueId,
                    zone: cleanText(payload.zone),
                    state,
                    city: cleanText(payload.city),
                    hostInstitution: cleanText(
                      payload.hostInstitution,
                    ),
                    venueName: cleanText(payload.venueName),
                    venuePinCode: cleanText(
                      payload.venuePinCode,
                    ),
                    iapBranchName: cleanText(
                      payload.iapBranchName,
                    ),

                    availableAdultManikins: cleanNumber(
                      payload.availableAdultManikins,
                    ),

                    availableInfantManikins: cleanNumber(
                      payload.availableInfantManikins,
                    ),

                    availableInstructors: cleanNumber(
                      payload.availableInstructors,
                    ),

                    availableChampions: cleanNumber(
                      payload.availableChampions,
                    ),
                  },

                  course: {
                    localCourseId: course.id,
                    courseNumber,

                    registeredOnIapWebsite: cleanText(
                      course.registeredOnIapWebsite,
                    ),

                    officialIapCourseCode: cleanText(
                      course.courseCode,
                    ),

                    participantCategories:
                      course.participantCategories,

                    otherParticipantCategory: cleanText(
                      course.otherParticipantCategory,
                    ),

                    expectedParticipants: cleanNumber(
                      course.expectedParticipants,
                    ),

                    adultManikins: cleanNumber(
                      course.adultManikins,
                    ),

                    infantManikins: cleanNumber(
                      course.infantManikins,
                    ),
                  },

                  team: {
                    coordinator: {
                      name: cleanText(course.coordinator?.name),
                      mobile: cleanText(
                        course.coordinator?.mobile,
                      ),
                      email: cleanText(
                        course.coordinator?.email,
                      ),
                    },

                    leadInstructor: {
                      name: cleanText(
                        course.leadInstructor?.name,
                      ),
                      mobile: cleanText(
                        course.leadInstructor?.mobile,
                      ),
                      email: cleanText(
                        course.leadInstructor?.email,
                      ),
                    },

                    otherInstructors: (
                      course.otherInstructors || []
                    ).map((person) => ({
                      name: cleanText(person.name),
                      mobile: cleanText(person.mobile),
                      email: cleanText(person.email),
                    })),

                    cprChampions: (
                      course.cprChampions || []
                    ).map((person) => ({
                      name: cleanText(person.name),
                      mobile: cleanText(person.mobile),
                      email: cleanText(person.email),
                    })),
                  },
                },
              },
            });

          createdCourses.push(createdCourse);
        }

        return createdCourses;
      },
    );

    const courseLinks = savedCourses.map(
      (course, courseIndex) => ({
        courseNumber: courseIndex + 1,
        databaseId: course.id,
        courseCode: course.courseCode,

        bannerUrl:
          `/cprday/dashboard/banner?courseCode=${encodeURIComponent(
            course.courseCode,
          )}`,

        registrationUrl:
          `/cprday/participant/register/${encodeURIComponent(
            venueId,
          )}/${encodeURIComponent(course.courseCode)}`,

        attendanceUrl:
          `/cprday/dashboard/participants?courseCode=${encodeURIComponent(
            course.courseCode,
          )}`,
      }),
    );

    return NextResponse.json(
      {
        success: true,
        message:
          savedCourses.length === 1
            ? "Venue and course saved successfully."
            : `Venue and ${savedCourses.length} courses saved successfully.`,

        venueId,
        courses: savedCourses,
        links: courseLinks,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error(
      "Unable to save CPR Day venue and courses:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to save the venue and courses to the database.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const venueId = cleanText(
      request.nextUrl.searchParams.get("venueId"),
    );

    const courseCode = cleanText(
      request.nextUrl.searchParams.get("courseCode"),
    );

    if (!venueId && !courseCode) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Provide either venueId or courseCode.",
        },
        {
          status: 400,
        },
      );
    }

    if (courseCode) {
      const course = await prisma.course.findUnique({
        where: {
          courseCode,
        },

        include: {
          participants: {
            include: {
              participant: true,
            },

            orderBy: {
              registeredAt: "asc",
            },
          },

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

      return NextResponse.json({
        success: true,
        course,
      });
    }

    const courses = await prisma.course.findMany({
      where: {
        id: venueId,
      },

      orderBy: {
        startTime: "asc",
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

    if (courses.length === 0) {
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

    const firstMetadata = courses[0].metadata;

    return NextResponse.json({
      success: true,
      venueId,
      metadata: firstMetadata,
      courses,
    });
  } catch (error) {
    console.error(
      "Unable to load CPR Day event:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to load the CPR Day venue or course.",
      },
      {
        status: 500,
      },
    );
  }
}