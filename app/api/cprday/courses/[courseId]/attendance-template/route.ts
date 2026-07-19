import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

import {
  COORDINATOR_SESSION_COOKIE,
  verifyCoordinatorSessionToken,
} from "@/lib/cprday/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: {
    params: Promise<{
      courseId: string;
    }>;
  },
) {
  try {
    const { courseId } = await context.params;

    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(
      COORDINATOR_SESSION_COOKIE,
    )?.value;

    if (!sessionToken) {
      return NextResponse.json(
        {
          success: false,
          message: "Please log in before downloading the attendance sheet.",
        },
        { status: 401 },
      );
    }

    const session = await verifyCoordinatorSessionToken(sessionToken);

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          message: "Your session has expired. Please log in again.",
        },
        { status: 401 },
      );
    }

    const course = await prisma.course.findFirst({
      where: {
        id: courseId,
        teamMembers: {
          some: {
            userId: session.userId,
            teamRole: "COURSE_COORDINATOR",
            status: "ACCEPTED",
          },
        },
      },
      select: {
        id: true,
        courseCode: true,
        title: true,
        venueName: true,
        city: true,
        district: true,
        state: true,
        courseDate: true,
        expectedParticipants: true,
      },
    });

    if (!course) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Course not found or you are not authorised to download this attendance sheet.",
        },
        { status: 403 },
      );
    }

    const rows = [
      ["NATIONAL IAP CPR DAY 2026"],
      ["Official Registration and Attendance Sheet"],
      [],
      ["Course ID", course.courseCode],
      ["Host Institution", course.title],
      ["Venue", course.venueName],
      ["City", course.city],
      ["District", course.district ?? ""],
      ["State", course.state],
      [
        "Course Date",
        course.courseDate.toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }),
      ],
      ["Expected Participants", course.expectedParticipants ?? ""],
      [],
      [
        "S. No.",
        "Participant Name",
        "Age",
        "Gender",
        "Mobile Number",
        "Email",
        "Participant Category",
        "Organisation / Institution",
        "City",
        "State",
        "Attendance",
        "Participant Signature",
        "Remarks",
      ],
    ];

    const blankRowCount = Math.max(
      course.expectedParticipants ?? 100,
      100,
    );

    for (let index = 1; index <= blankRowCount; index += 1) {
      rows.push([
        index,
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
      ]);
    }

    const worksheet = XLSX.utils.aoa_to_sheet(rows);

    worksheet["!cols"] = [
      { wch: 8 },
      { wch: 28 },
      { wch: 8 },
      { wch: 12 },
      { wch: 16 },
      { wch: 28 },
      { wch: 24 },
      { wch: 30 },
      { wch: 18 },
      { wch: 18 },
      { wch: 14 },
      { wch: 22 },
      { wch: 24 },
    ];

    worksheet["!freeze"] = {
      xSplit: 0,
      ySplit: 13,
    };

    worksheet["!autofilter"] = {
      ref: `A13:M${13 + blankRowCount}`,
    };

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Attendance",
    );

    const workbookBuffer = XLSX.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
      compression: true,
    });

    const safeCourseCode = course.courseCode.replace(
      /[^a-zA-Z0-9_-]/g,
      "_",
    );

    const fileName = `${safeCourseCode}_Attendance_Sheet.xlsx`;

    return new NextResponse(workbookBuffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Attendance template download error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Unable to generate the attendance sheet.",
      },
      { status: 500 },
    );
  }
}