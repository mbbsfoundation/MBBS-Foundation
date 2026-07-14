import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [
      userCount,
      roleCount,
      courseCount,
      participantCount,
      registrationCount,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.userRole.count(),
      prisma.course.count(),
      prisma.participant.count(),
      prisma.courseParticipant.count(),
    ]);

    return NextResponse.json({
      success: true,
      message: "CPR Day database connection is working.",
      database: "connected",
      counts: {
        users: userCount,
        roles: roleCount,
        courses: courseCount,
        participants: participantCount,
        registrations: registrationCount,
      },
      checkedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("CPR Day database health check failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "The CPR Day database connection failed.",
      },
      {
        status: 500,
      },
    );
  }
}