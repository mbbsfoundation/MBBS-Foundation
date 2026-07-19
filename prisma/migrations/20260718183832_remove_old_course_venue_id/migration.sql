/*
  Warnings:

  - You are about to drop the column `venueId` on the `Course` table. All the data in the column will be lost.
  - You are about to drop the column `venueId` on the `Participant` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Course_venueId_idx";

-- DropIndex
DROP INDEX "Participant_venueId_idx";

-- AlterTable
ALTER TABLE "Course" DROP COLUMN "venueId";

-- AlterTable
ALTER TABLE "Participant" DROP COLUMN "venueId";
