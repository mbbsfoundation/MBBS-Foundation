-- CreateEnum
CREATE TYPE "CourseTeamRole" AS ENUM ('COURSE_COORDINATOR', 'CPR_INSTRUCTOR', 'CPR_CHAMPION');

-- CreateEnum
CREATE TYPE "CourseTeamStatus" AS ENUM ('INVITED', 'ACCEPTED', 'DECLINED', 'REMOVED');

-- CreateTable
CREATE TABLE "CourseTeamMember" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "teamRole" "CourseTeamRole" NOT NULL,
    "status" "CourseTeamStatus" NOT NULL DEFAULT 'INVITED',
    "invitedById" TEXT,
    "invitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourseTeamMember_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CourseTeamMember_courseId_teamRole_status_idx" ON "CourseTeamMember"("courseId", "teamRole", "status");

-- CreateIndex
CREATE INDEX "CourseTeamMember_userId_status_idx" ON "CourseTeamMember"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "CourseTeamMember_courseId_userId_teamRole_key" ON "CourseTeamMember"("courseId", "userId", "teamRole");

-- AddForeignKey
ALTER TABLE "CourseTeamMember" ADD CONSTRAINT "CourseTeamMember_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseTeamMember" ADD CONSTRAINT "CourseTeamMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseTeamMember" ADD CONSTRAINT "CourseTeamMember_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
