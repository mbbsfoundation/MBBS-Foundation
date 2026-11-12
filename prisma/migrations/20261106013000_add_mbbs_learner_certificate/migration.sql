-- CreateTable
CREATE TABLE "MBBSLearnerCertificate" (
    "id" TEXT NOT NULL,
    "certificateId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "moduleCode" TEXT NOT NULL DEFAULT 'REVIVE',
    "moduleTitle" TEXT NOT NULL DEFAULT 'REVIVE — Cardiopulmonary Resuscitation (CPR) and Relief of Choking',
    "learnerName" TEXT NOT NULL,
    "medicalCollege" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "percentage" INTEGER NOT NULL,
    "passingThreshold" INTEGER NOT NULL DEFAULT 70,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "MBBSLearnerCertificate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MBBSLearnerCertificate_certificateId_key" ON "MBBSLearnerCertificate"("certificateId");

-- CreateIndex
CREATE UNIQUE INDEX "MBBSLearnerCertificate_userId_moduleCode_key" ON "MBBSLearnerCertificate"("userId", "moduleCode");

-- CreateIndex
CREATE INDEX "MBBSLearnerCertificate_certificateId_idx" ON "MBBSLearnerCertificate"("certificateId");

-- CreateIndex
CREATE INDEX "MBBSLearnerCertificate_userId_idx" ON "MBBSLearnerCertificate"("userId");

-- CreateIndex
CREATE INDEX "MBBSLearnerCertificate_moduleCode_idx" ON "MBBSLearnerCertificate"("moduleCode");

-- CreateIndex
CREATE INDEX "MBBSLearnerCertificate_issuedAt_idx" ON "MBBSLearnerCertificate"("issuedAt");

-- AddForeignKey
ALTER TABLE "MBBSLearnerCertificate" ADD CONSTRAINT "MBBSLearnerCertificate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

