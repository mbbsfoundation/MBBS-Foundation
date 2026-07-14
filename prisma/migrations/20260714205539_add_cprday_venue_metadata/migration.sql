/*
  Warnings:

  - Added the required column `venueId` to the `Course` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "venueId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "Course_venueId_idx" ON "Course"("venueId");
