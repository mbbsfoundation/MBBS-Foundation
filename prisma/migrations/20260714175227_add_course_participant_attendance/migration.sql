-- CreateEnum
CREATE TYPE "RegistrationSource" AS ENUM ('PUBLIC_FORM', 'COORDINATOR_ENTRY', 'BULK_UPLOAD', 'ADMIN_ENTRY');

-- CreateEnum
CREATE TYPE "RegistrationStatus" AS ENUM ('REGISTERED', 'CANCELLED', 'DUPLICATE', 'REJECTED');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('NOT_MARKED', 'PRESENT', 'ABSENT');

-- CreateEnum
CREATE TYPE "CompletionStatus" AS ENUM ('NOT_ASSESSED', 'COMPLETED', 'NOT_COMPLETED');

-- CreateEnum
CREATE TYPE "CertificateStatus" AS ENUM ('NOT_ELIGIBLE', 'ELIGIBLE', 'GENERATED', 'DOWNLOADED', 'REVOKED');

-- CreateTable
CREATE TABLE "CourseParticipant" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "registrationSource" "RegistrationSource" NOT NULL,
    "registrationStatus" "RegistrationStatus" NOT NULL DEFAULT 'REGISTERED',
    "registeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "attendanceStatus" "AttendanceStatus" NOT NULL DEFAULT 'NOT_MARKED',
    "attendedAt" TIMESTAMP(3),
    "attendanceMarkedAt" TIMESTAMP(3),
    "completionStatus" "CompletionStatus" NOT NULL DEFAULT 'NOT_ASSESSED',
    "completionMarkedAt" TIMESTAMP(3),
    "certificateStatus" "CertificateStatus" NOT NULL DEFAULT 'NOT_ELIGIBLE',
    "certificateNumber" TEXT,
    "certificateGeneratedAt" TIMESTAMP(3),
    "certificateUrl" TEXT,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourseParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CourseParticipant_certificateNumber_key" ON "CourseParticipant"("certificateNumber");

-- CreateIndex
CREATE INDEX "CourseParticipant_courseId_attendanceStatus_idx" ON "CourseParticipant"("courseId", "attendanceStatus");

-- CreateIndex
CREATE INDEX "CourseParticipant_courseId_completionStatus_idx" ON "CourseParticipant"("courseId", "completionStatus");

-- CreateIndex
CREATE INDEX "CourseParticipant_courseId_certificateStatus_idx" ON "CourseParticipant"("courseId", "certificateStatus");

-- CreateIndex
CREATE INDEX "CourseParticipant_participantId_idx" ON "CourseParticipant"("participantId");

-- CreateIndex
CREATE UNIQUE INDEX "CourseParticipant_courseId_participantId_key" ON "CourseParticipant"("courseId", "participantId");

-- AddForeignKey
ALTER TABLE "CourseParticipant" ADD CONSTRAINT "CourseParticipant_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseParticipant" ADD CONSTRAINT "CourseParticipant_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
