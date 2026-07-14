-- CreateEnum
CREATE TYPE "UploadBatchStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'COMPLETED_WITH_ERRORS', 'FAILED');

-- AlterTable
ALTER TABLE "CourseParticipant" ADD COLUMN     "bulkUploadBatchId" TEXT,
ADD COLUMN     "sourceRowNumber" INTEGER;

-- CreateTable
CREATE TABLE "ParticipantUploadBatch" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "originalFileName" TEXT NOT NULL,
    "storedFileUrl" TEXT,
    "totalRows" INTEGER NOT NULL DEFAULT 0,
    "validRows" INTEGER NOT NULL DEFAULT 0,
    "importedRows" INTEGER NOT NULL DEFAULT 0,
    "duplicateRows" INTEGER NOT NULL DEFAULT 0,
    "errorRows" INTEGER NOT NULL DEFAULT 0,
    "status" "UploadBatchStatus" NOT NULL DEFAULT 'PENDING',
    "errorReportUrl" TEXT,
    "processingNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ParticipantUploadBatch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ParticipantUploadBatch_courseId_idx" ON "ParticipantUploadBatch"("courseId");

-- CreateIndex
CREATE INDEX "ParticipantUploadBatch_status_idx" ON "ParticipantUploadBatch"("status");

-- AddForeignKey
ALTER TABLE "CourseParticipant" ADD CONSTRAINT "CourseParticipant_bulkUploadBatchId_fkey" FOREIGN KEY ("bulkUploadBatchId") REFERENCES "ParticipantUploadBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParticipantUploadBatch" ADD CONSTRAINT "ParticipantUploadBatch_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
