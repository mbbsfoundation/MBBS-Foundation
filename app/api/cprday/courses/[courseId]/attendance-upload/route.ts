import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import {
  COORDINATOR_SESSION_COOKIE,
  verifyCoordinatorSessionToken,
} from "@/lib/cprday/auth";
import { uploadFileToDrive } from "@/lib/google/googleDrive";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const allowedExtensions = [".xlsx", ".xls"];

function getFileExtension(fileName: string) {
  const lastDotIndex = fileName.lastIndexOf(".");

  if (lastDotIndex === -1) {
    return "";
  }

  return fileName.slice(lastDotIndex).toLowerCase();
}

export async function POST(
  request: NextRequest,
  context: {
    params: Promise<{
      courseId: string;
    }>;
  },
) {
  try {
    const { courseId } = await context.params;

    /*
     * 1. Verify coordinator session
     */
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(
      COORDINATOR_SESSION_COOKIE,
    )?.value;

    if (!sessionToken) {
      return NextResponse.json(
        {
          success: false,
          message: "Please log in before uploading attendance.",
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

    /*
     * 2. Confirm that this coordinator is assigned to the course
     */
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
      },
    });

    if (!course) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Course not found or you are not authorised to upload attendance for this course.",
        },
        { status: 403 },
      );
    }

    /*
     * 3. Read submitted form
     */
    const formData = await request.formData();

    const uploadedFile = formData.get("file");

    if (!(uploadedFile instanceof File)) {
      return NextResponse.json(
        {
          success: false,
          message: "Please select an attendance Excel file.",
        },
        { status: 400 },
      );
    }

    const observerName = String(
      formData.get("observerName") ?? "",
    ).trim();

    const observerMobile = String(
      formData.get("observerMobile") ?? "",
    ).trim();

    const observerEmail = String(
      formData.get("observerEmail") ?? "",
    ).trim();

    const observerDesignation = String(
      formData.get("observerDesignation") ?? "",
    ).trim();

    const observerAffiliation = String(
      formData.get("observerAffiliation") ?? "",
    ).trim();

    if (
      !observerName ||
      !observerMobile ||
      !observerEmail ||
      !observerDesignation ||
      !observerAffiliation
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "All observer details are mandatory.",
        },
        { status: 400 },
      );
    }

    /*
     * 4. Validate Excel file
     */
    const fileExtension = getFileExtension(uploadedFile.name);

    if (!allowedExtensions.includes(fileExtension)) {
      return NextResponse.json(
        {
          success: false,
          message: "Only .xlsx and .xls files are allowed.",
        },
        { status: 400 },
      );
    }

    const maximumFileSize = 10 * 1024 * 1024;

    if (uploadedFile.size > maximumFileSize) {
      return NextResponse.json(
        {
          success: false,
          message: "The Excel file must be smaller than 10 MB.",
        },
        { status: 400 },
      );
    }

    /*
     * 5. Calculate next upload sequence
     */
    const latestUpload = await prisma.participantUploadBatch.findFirst({
      where: {
        courseId,
      },
      orderBy: {
        uploadSequence: "desc",
      },
      select: {
        uploadSequence: true,
      },
    });

    const nextUploadSequence =
      (latestUpload?.uploadSequence ?? 0) + 1;

    /*
     * 6. Prepare unique Drive filename
     */
    const safeOriginalName = uploadedFile.name.replace(
      /[^a-zA-Z0-9._-]/g,
      "_",
    );

    const driveFileName = [
      course.courseCode,
      `Upload-${nextUploadSequence}`,
      safeOriginalName,
    ].join("_");

    const fileBuffer = Buffer.from(
      await uploadedFile.arrayBuffer(),
    );

    const driveFile = await uploadFileToDrive(
      fileBuffer,
      driveFileName,
      uploadedFile.type ||
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );

    if (!driveFile.id) {
      throw new Error(
        "Google Drive did not return a file ID after upload.",
      );
    }

    /*
     * 7. Save upload record
     */
    const uploadRecord =
      await prisma.participantUploadBatch.create({
        data: {
          courseId,
          originalFileName: uploadedFile.name,
          storedFileUrl: driveFile.webViewLink ?? null,
          googleDriveFileId: driveFile.id,

          uploadedByCoordinatorId: session.userId,
          uploadSequence: nextUploadSequence,

          observerName,
          observerMobile,
          observerDesignation,
          observerAffiliation,
          observerEmail,

          status: "PENDING",
          processingNotes:
            "Attendance Excel uploaded successfully. Participant-row processing is not included in Version 1.",
        },
        select: {
          id: true,
          originalFileName: true,
          storedFileUrl: true,
          uploadSequence: true,
          observerName: true,
          status: true,
          createdAt: true,
        },
      });

    return NextResponse.json({
      success: true,
      message: `Attendance sheet upload ${nextUploadSequence} submitted successfully.`,
      upload: uploadRecord,
    });
  } catch (error) {
    console.error("Attendance upload error:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Attendance upload failed.";

    return NextResponse.json(
      {
        success: false,
        message,
      },
      { status: 500 },
    );
  }
}