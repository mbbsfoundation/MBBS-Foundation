/*
  Warnings:

  - A unique constraint covering the columns `[courseId,uploadSequence]` on the table `ParticipantUploadBatch` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `observerAffiliation` to the `ParticipantUploadBatch` table without a default value. This is not possible if the table is not empty.
  - Added the required column `observerDesignation` to the `ParticipantUploadBatch` table without a default value. This is not possible if the table is not empty.
  - Added the required column `observerEmail` to the `ParticipantUploadBatch` table without a default value. This is not possible if the table is not empty.
  - Added the required column `observerMobile` to the `ParticipantUploadBatch` table without a default value. This is not possible if the table is not empty.
  - Added the required column `observerName` to the `ParticipantUploadBatch` table without a default value. This is not possible if the table is not empty.
  - Added the required column `uploadSequence` to the `ParticipantUploadBatch` table without a default value. This is not possible if the table is not empty.
  - Added the required column `uploadedByCoordinatorId` to the `ParticipantUploadBatch` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ParticipantUploadBatch" ADD COLUMN     "googleDriveFileId" TEXT,
ADD COLUMN     "observerAffiliation" TEXT NOT NULL,
ADD COLUMN     "observerDesignation" TEXT NOT NULL,
ADD COLUMN     "observerEmail" TEXT NOT NULL,
ADD COLUMN     "observerMobile" TEXT NOT NULL,
ADD COLUMN     "observerName" TEXT NOT NULL,
ADD COLUMN     "uploadSequence" INTEGER NOT NULL,
ADD COLUMN     "uploadedByCoordinatorId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "ParticipantUploadBatch_uploadedByCoordinatorId_idx" ON "ParticipantUploadBatch"("uploadedByCoordinatorId");

-- CreateIndex
CREATE UNIQUE INDEX "ParticipantUploadBatch_courseId_uploadSequence_key" ON "ParticipantUploadBatch"("courseId", "uploadSequence");
