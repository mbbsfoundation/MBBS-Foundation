-- CreateEnum
CREATE TYPE "CertificateCategoryType" AS ENUM ('PARTICIPANT', 'CPR_CHAMPION', 'COURSE_COORDINATOR', 'CPR_FACILITY');

-- CreateTable
CREATE TABLE "SanjeevaniCertificate" (
    "id" TEXT NOT NULL,
    "certificateId" TEXT NOT NULL,
    "sequenceNumber" INTEGER NOT NULL,
    "stateCode" TEXT NOT NULL,
    "participantName" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "venue" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "mobileNumber" TEXT,
    "email" TEXT,
    "uploadBatchId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'GENERATED',
    "certificateFileUrl" TEXT,
    "metadata" JSONB,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SanjeevaniCertificate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SanjeevaniUploadBatch" (
    "id" TEXT NOT NULL,
    "originalFileName" TEXT NOT NULL,
    "totalRows" INTEGER NOT NULL DEFAULT 0,
    "validRows" INTEGER NOT NULL DEFAULT 0,
    "importedRows" INTEGER NOT NULL DEFAULT 0,
    "duplicateRows" INTEGER NOT NULL DEFAULT 0,
    "errorRows" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "processingNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SanjeevaniUploadBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminCertificateRecord" (
    "id" TEXT NOT NULL,
    "certificateId" TEXT NOT NULL,
    "category" "CertificateCategoryType" NOT NULL,
    "name" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "certificateDate" TEXT NOT NULL,
    "venueName" TEXT,
    "venueCode" TEXT,
    "city" TEXT,
    "state" TEXT NOT NULL,
    "stateCode" TEXT NOT NULL,
    "mobileNumber" TEXT,
    "email" TEXT,
    "courseCoordinator" TEXT,
    "status" TEXT NOT NULL DEFAULT 'VALID',
    "source" TEXT NOT NULL DEFAULT 'MANUAL_ADMIN',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminCertificateRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SanjeevaniCertificate_certificateId_key" ON "SanjeevaniCertificate"("certificateId");

-- CreateIndex
CREATE INDEX "SanjeevaniCertificate_stateCode_sequenceNumber_idx" ON "SanjeevaniCertificate"("stateCode", "sequenceNumber");

-- CreateIndex
CREATE INDEX "SanjeevaniCertificate_certificateId_idx" ON "SanjeevaniCertificate"("certificateId");

-- CreateIndex
CREATE INDEX "SanjeevaniCertificate_stateCode_idx" ON "SanjeevaniCertificate"("stateCode");

-- CreateIndex
CREATE INDEX "SanjeevaniCertificate_normalizedName_stateCode_idx" ON "SanjeevaniCertificate"("normalizedName", "stateCode");

-- CreateIndex
CREATE INDEX "SanjeevaniCertificate_mobileNumber_idx" ON "SanjeevaniCertificate"("mobileNumber");

-- CreateIndex
CREATE INDEX "SanjeevaniCertificate_email_idx" ON "SanjeevaniCertificate"("email");

-- CreateIndex
CREATE UNIQUE INDEX "AdminCertificateRecord_certificateId_key" ON "AdminCertificateRecord"("certificateId");

-- CreateIndex
CREATE INDEX "AdminCertificateRecord_category_stateCode_idx" ON "AdminCertificateRecord"("category", "stateCode");

-- CreateIndex
CREATE INDEX "AdminCertificateRecord_normalizedName_stateCode_idx" ON "AdminCertificateRecord"("normalizedName", "stateCode");

-- CreateIndex
CREATE INDEX "AdminCertificateRecord_mobileNumber_idx" ON "AdminCertificateRecord"("mobileNumber");

-- CreateIndex
CREATE INDEX "AdminCertificateRecord_email_idx" ON "AdminCertificateRecord"("email");

-- AddForeignKey
ALTER TABLE "SanjeevaniCertificate" ADD CONSTRAINT "SanjeevaniCertificate_uploadBatchId_fkey" FOREIGN KEY ("uploadBatchId") REFERENCES "SanjeevaniUploadBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
