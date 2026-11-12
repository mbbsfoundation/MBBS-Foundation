-- CreateEnum
CREATE TYPE "MBBSLearnerCategory" AS ENUM ('MBBS_STUDENT', 'INTERN', 'POSTGRADUATE_RESIDENT', 'DOCTOR', 'MEDICAL_FACULTY', 'RESOURCE_PERSON', 'OTHER_HEALTHCARE_PROFESSIONAL');

-- CreateTable
CREATE TABLE "MBBSLearningProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "normalizedEmail" TEXT NOT NULL,
    "mobileNumber" TEXT NOT NULL,
    "learnerCategory" "MBBSLearnerCategory" NOT NULL,
    "collegeId" TEXT,
    "institutionName" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "pinCode" TEXT NOT NULL,
    "mbbsYear" TEXT,
    "departmentDesignation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MBBSLearningProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MBBSLearningProfile_userId_key" ON "MBBSLearningProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "MBBSLearningProfile_normalizedEmail_key" ON "MBBSLearningProfile"("normalizedEmail");

-- CreateIndex
CREATE INDEX "MBBSLearningProfile_collegeId_idx" ON "MBBSLearningProfile"("collegeId");

-- CreateIndex
CREATE INDEX "MBBSLearningProfile_state_district_idx" ON "MBBSLearningProfile"("state", "district");

-- CreateIndex
CREATE INDEX "MBBSLearningProfile_learnerCategory_idx" ON "MBBSLearningProfile"("learnerCategory");

-- AddForeignKey
ALTER TABLE "MBBSLearningProfile" ADD CONSTRAINT "MBBSLearningProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MBBSLearningProfile" ADD CONSTRAINT "MBBSLearningProfile_collegeId_fkey" FOREIGN KEY ("collegeId") REFERENCES "College"("id") ON DELETE SET NULL ON UPDATE CASCADE;
