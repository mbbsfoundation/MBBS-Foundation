-- CreateEnum
CREATE TYPE "CounsellingManagementType" AS ENUM ('GOVERNMENT', 'PRIVATE', 'DEEMED', 'CENTRAL', 'INI', 'OTHER');

-- CreateEnum
CREATE TYPE "CounsellingAuthorityType" AS ENUM ('MCC', 'STATE', 'UNIVERSITY', 'OTHER');

-- CreateEnum
CREATE TYPE "CounsellingRoundType" AS ENUM ('ROUND_1', 'ROUND_2', 'ROUND_3', 'STRAY', 'OTHER');

-- CreateEnum
CREATE TYPE "CounsellingRoundStatus" AS ENUM ('UPCOMING', 'ACTIVE', 'COMPLETED');

-- CreateEnum
CREATE TYPE "CounsellingDataType" AS ENUM ('CAPACITY', 'SEAT_MATRIX', 'ALLOTMENT', 'VACANCY', 'CUTOFF', 'NEW_SEATS', 'OTHER');

-- CreateEnum
CREATE TYPE "CounsellingImportStatus" AS ENUM ('IMPORTED', 'VALIDATED', 'ACTIVE', 'SUPERSEDED', 'FAILED');

-- CreateEnum
CREATE TYPE "CounsellingSourceStatus" AS ENUM ('OFFICIAL', 'REVISED', 'SUPERSEDED');

-- CreateEnum
CREATE TYPE "CounsellingMatchConfidence" AS ENUM ('EXACT', 'VERIFIED', 'PROBABLE', 'UNRESOLVED');

-- CreateEnum
CREATE TYPE "CounsellingSeatCategory" AS ENUM ('OPEN', 'OBC', 'EWS', 'SC', 'ST', 'OTHER');

-- CreateEnum
CREATE TYPE "CounsellingVacancyType" AS ENUM ('CLEAR', 'VIRTUAL', 'NEWLY_ADDED', 'CONVERTED', 'REVERTED', 'OTHER');

-- CreateEnum
CREATE TYPE "CounsellingOpportunityBand" AS ENUM ('STRONG', 'REALISTIC', 'STRETCH', 'LOW_EVIDENCE');

-- CreateTable
CREATE TABLE "College" (
    "id" TEXT NOT NULL,
    "nmcCollegeCode" TEXT,
    "mccInstituteCode" TEXT,
    "slug" TEXT NOT NULL,
    "collegeName" TEXT NOT NULL,
    "shortName" TEXT,
    "state" TEXT NOT NULL,
    "city" TEXT,
    "managementType" "CounsellingManagementType" NOT NULL,
    "instituteType" TEXT,
    "isINI" BOOLEAN NOT NULL DEFAULT false,
    "isDeemed" BOOLEAN NOT NULL DEFAULT false,
    "isCentralUniversity" BOOLEAN NOT NULL DEFAULT false,
    "isESIC" BOOLEAN NOT NULL DEFAULT false,
    "genderRestriction" TEXT,
    "establishmentYear" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "College_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CollegeAlias" (
    "id" TEXT NOT NULL,
    "collegeId" TEXT NOT NULL,
    "sourceAuthority" "CounsellingAuthorityType" NOT NULL,
    "sourceName" TEXT NOT NULL,
    "sourceInstituteCode" TEXT,
    "normalizedName" TEXT NOT NULL,
    "matchConfidence" "CounsellingMatchConfidence" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CollegeAlias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CollegeAnnualCapacity" (
    "id" TEXT NOT NULL,
    "collegeId" TEXT NOT NULL,
    "academicYear" INTEGER NOT NULL,
    "approvedSeats" INTEGER NOT NULL,
    "renewedSeats" INTEGER,
    "increasedSeats" INTEGER,
    "isNewEstablishment" BOOLEAN NOT NULL DEFAULT false,
    "sourceImportId" TEXT,
    "sourceDate" TIMESTAMP(3),
    "status" "CounsellingSourceStatus" NOT NULL DEFAULT 'OFFICIAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CollegeAnnualCapacity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CounsellingAuthority" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortName" TEXT,
    "authorityType" "CounsellingAuthorityType" NOT NULL,
    "state" TEXT,
    "website" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CounsellingAuthority_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CounsellingRound" (
    "id" TEXT NOT NULL,
    "academicYear" INTEGER NOT NULL,
    "authorityId" TEXT NOT NULL,
    "roundType" "CounsellingRoundType" NOT NULL,
    "status" "CounsellingRoundStatus" NOT NULL DEFAULT 'UPCOMING',
    "seatMatrixPublished" BOOLEAN NOT NULL DEFAULT false,
    "allotmentPublished" BOOLEAN NOT NULL DEFAULT false,
    "vacancyPublished" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CounsellingRound_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CounsellingDataImport" (
    "id" TEXT NOT NULL,
    "academicYear" INTEGER NOT NULL,
    "authorityId" TEXT NOT NULL,
    "roundId" TEXT,
    "dataType" "CounsellingDataType" NOT NULL,
    "sourceFileName" TEXT NOT NULL,
    "sourceDate" TIMESTAMP(3),
    "isOfficial" BOOLEAN NOT NULL DEFAULT true,
    "revisionNumber" INTEGER NOT NULL DEFAULT 1,
    "status" "CounsellingImportStatus" NOT NULL DEFAULT 'IMPORTED',
    "rowCount" INTEGER,
    "errorCount" INTEGER,
    "notes" TEXT,
    "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activatedAt" TIMESTAMP(3),
    "supersededAt" TIMESTAMP(3),

    CONSTRAINT "CounsellingDataImport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeatMatrixRecord" (
    "id" TEXT NOT NULL,
    "roundId" TEXT NOT NULL,
    "collegeId" TEXT NOT NULL,
    "sourceImportId" TEXT NOT NULL,
    "course" TEXT NOT NULL DEFAULT 'MBBS',
    "quota" TEXT NOT NULL,
    "seatCategory" "CounsellingSeatCategory" NOT NULL,
    "isPwD" BOOLEAN NOT NULL DEFAULT false,
    "gender" TEXT,
    "specialPathway" TEXT,
    "seatCount" INTEGER NOT NULL,
    "sourceInstituteName" TEXT,
    "sourceInstituteCode" TEXT,
    "sourceCategoryLabel" TEXT,
    "isOfficial" BOOLEAN NOT NULL DEFAULT true,
    "revisionNumber" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SeatMatrixRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AllotmentRecord" (
    "id" TEXT NOT NULL,
    "roundId" TEXT NOT NULL,
    "collegeId" TEXT NOT NULL,
    "sourceImportId" TEXT NOT NULL,
    "candidateRank" INTEGER NOT NULL,
    "course" TEXT NOT NULL DEFAULT 'MBBS',
    "quota" TEXT NOT NULL,
    "allottedCategory" "CounsellingSeatCategory" NOT NULL,
    "allottedPwD" BOOLEAN NOT NULL DEFAULT false,
    "candidateCategory" "CounsellingSeatCategory" NOT NULL,
    "candidatePwD" BOOLEAN NOT NULL DEFAULT false,
    "specialPathway" TEXT,
    "allotmentStatus" TEXT,
    "sourceSerialNumber" INTEGER,
    "sourceInstituteName" TEXT,
    "sourceQuotaLabel" TEXT,
    "sourceAllottedCategoryLabel" TEXT,
    "sourceCandidateCategoryLabel" TEXT,
    "rawSourceText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AllotmentRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VacancyRecord" (
    "id" TEXT NOT NULL,
    "roundId" TEXT NOT NULL,
    "collegeId" TEXT NOT NULL,
    "sourceImportId" TEXT NOT NULL,
    "quota" TEXT NOT NULL,
    "seatCategory" "CounsellingSeatCategory" NOT NULL,
    "isPwD" BOOLEAN NOT NULL DEFAULT false,
    "specialPathway" TEXT,
    "gender" TEXT,
    "vacancyType" "CounsellingVacancyType" NOT NULL,
    "seatCount" INTEGER NOT NULL,
    "sourceCategoryLabel" TEXT,
    "isOfficial" BOOLEAN NOT NULL DEFAULT true,
    "revisionNumber" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VacancyRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalyticsSnapshot" (
    "id" TEXT NOT NULL,
    "collegeId" TEXT NOT NULL,
    "authorityId" TEXT NOT NULL,
    "roundId" TEXT NOT NULL,
    "quota" TEXT NOT NULL,
    "seatCategory" "CounsellingSeatCategory" NOT NULL,
    "isPwD" BOOLEAN NOT NULL DEFAULT false,
    "specialPathway" TEXT,
    "seatsOffered" INTEGER NOT NULL,
    "seatsAllotted" INTEGER NOT NULL,
    "matrixGap" INTEGER NOT NULL,
    "fillRate" DOUBLE PRECISION NOT NULL,
    "sampleSize" INTEGER NOT NULL,
    "bestAIR" INTEGER,
    "q1AIR" DOUBLE PRECISION,
    "medianAIR" DOUBLE PRECISION,
    "q3AIR" DOUBLE PRECISION,
    "highestAIR" INTEGER,
    "calculationVersion" TEXT NOT NULL DEFAULT 'v1',
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalyticsSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "College_nmcCollegeCode_key" ON "College"("nmcCollegeCode");

-- CreateIndex
CREATE UNIQUE INDEX "College_slug_key" ON "College"("slug");

-- CreateIndex
CREATE INDEX "College_state_idx" ON "College"("state");

-- CreateIndex
CREATE INDEX "College_managementType_idx" ON "College"("managementType");

-- CreateIndex
CREATE INDEX "College_isActive_idx" ON "College"("isActive");

-- CreateIndex
CREATE INDEX "College_mccInstituteCode_idx" ON "College"("mccInstituteCode");

-- CreateIndex
CREATE INDEX "CollegeAlias_collegeId_idx" ON "CollegeAlias"("collegeId");

-- CreateIndex
CREATE INDEX "CollegeAlias_sourceAuthority_sourceInstituteCode_idx" ON "CollegeAlias"("sourceAuthority", "sourceInstituteCode");

-- CreateIndex
CREATE INDEX "CollegeAlias_sourceAuthority_normalizedName_idx" ON "CollegeAlias"("sourceAuthority", "normalizedName");

-- CreateIndex
CREATE INDEX "CollegeAnnualCapacity_collegeId_academicYear_idx" ON "CollegeAnnualCapacity"("collegeId", "academicYear");

-- CreateIndex
CREATE INDEX "CollegeAnnualCapacity_sourceImportId_idx" ON "CollegeAnnualCapacity"("sourceImportId");

-- CreateIndex
CREATE INDEX "CollegeAnnualCapacity_status_idx" ON "CollegeAnnualCapacity"("status");

-- CreateIndex
CREATE UNIQUE INDEX "CounsellingAuthority_name_key" ON "CounsellingAuthority"("name");

-- CreateIndex
CREATE INDEX "CounsellingAuthority_authorityType_idx" ON "CounsellingAuthority"("authorityType");

-- CreateIndex
CREATE INDEX "CounsellingAuthority_state_idx" ON "CounsellingAuthority"("state");

-- CreateIndex
CREATE INDEX "CounsellingAuthority_isActive_idx" ON "CounsellingAuthority"("isActive");

-- CreateIndex
CREATE INDEX "CounsellingRound_academicYear_status_idx" ON "CounsellingRound"("academicYear", "status");

-- CreateIndex
CREATE INDEX "CounsellingRound_authorityId_idx" ON "CounsellingRound"("authorityId");

-- CreateIndex
CREATE UNIQUE INDEX "CounsellingRound_authorityId_academicYear_roundType_key" ON "CounsellingRound"("authorityId", "academicYear", "roundType");

-- CreateIndex
CREATE INDEX "CounsellingDataImport_authorityId_academicYear_dataType_idx" ON "CounsellingDataImport"("authorityId", "academicYear", "dataType");

-- CreateIndex
CREATE INDEX "CounsellingDataImport_roundId_idx" ON "CounsellingDataImport"("roundId");

-- CreateIndex
CREATE INDEX "CounsellingDataImport_status_idx" ON "CounsellingDataImport"("status");

-- CreateIndex
CREATE INDEX "SeatMatrixRecord_collegeId_roundId_idx" ON "SeatMatrixRecord"("collegeId", "roundId");

-- CreateIndex
CREATE INDEX "SeatMatrixRecord_roundId_quota_seatCategory_isPwD_idx" ON "SeatMatrixRecord"("roundId", "quota", "seatCategory", "isPwD");

-- CreateIndex
CREATE INDEX "SeatMatrixRecord_sourceImportId_idx" ON "SeatMatrixRecord"("sourceImportId");

-- CreateIndex
CREATE INDEX "AllotmentRecord_roundId_collegeId_idx" ON "AllotmentRecord"("roundId", "collegeId");

-- CreateIndex
CREATE INDEX "AllotmentRecord_roundId_quota_allottedCategory_allottedPwD_idx" ON "AllotmentRecord"("roundId", "quota", "allottedCategory", "allottedPwD");

-- CreateIndex
CREATE INDEX "AllotmentRecord_candidateRank_idx" ON "AllotmentRecord"("candidateRank");

-- CreateIndex
CREATE INDEX "AllotmentRecord_sourceImportId_idx" ON "AllotmentRecord"("sourceImportId");

-- CreateIndex
CREATE INDEX "VacancyRecord_collegeId_roundId_idx" ON "VacancyRecord"("collegeId", "roundId");

-- CreateIndex
CREATE INDEX "VacancyRecord_roundId_quota_seatCategory_isPwD_vacancyType_idx" ON "VacancyRecord"("roundId", "quota", "seatCategory", "isPwD", "vacancyType");

-- CreateIndex
CREATE INDEX "VacancyRecord_sourceImportId_idx" ON "VacancyRecord"("sourceImportId");

-- CreateIndex
CREATE INDEX "AnalyticsSnapshot_collegeId_authorityId_roundId_idx" ON "AnalyticsSnapshot"("collegeId", "authorityId", "roundId");

-- CreateIndex
CREATE INDEX "AnalyticsSnapshot_roundId_quota_seatCategory_isPwD_idx" ON "AnalyticsSnapshot"("roundId", "quota", "seatCategory", "isPwD");

-- CreateIndex
CREATE INDEX "AnalyticsSnapshot_highestAIR_idx" ON "AnalyticsSnapshot"("highestAIR");

-- CreateIndex
CREATE INDEX "AnalyticsSnapshot_authorityId_idx" ON "AnalyticsSnapshot"("authorityId");

-- AddForeignKey
ALTER TABLE "CollegeAlias" ADD CONSTRAINT "CollegeAlias_collegeId_fkey" FOREIGN KEY ("collegeId") REFERENCES "College"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollegeAnnualCapacity" ADD CONSTRAINT "CollegeAnnualCapacity_collegeId_fkey" FOREIGN KEY ("collegeId") REFERENCES "College"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollegeAnnualCapacity" ADD CONSTRAINT "CollegeAnnualCapacity_sourceImportId_fkey" FOREIGN KEY ("sourceImportId") REFERENCES "CounsellingDataImport"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CounsellingRound" ADD CONSTRAINT "CounsellingRound_authorityId_fkey" FOREIGN KEY ("authorityId") REFERENCES "CounsellingAuthority"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CounsellingDataImport" ADD CONSTRAINT "CounsellingDataImport_authorityId_fkey" FOREIGN KEY ("authorityId") REFERENCES "CounsellingAuthority"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CounsellingDataImport" ADD CONSTRAINT "CounsellingDataImport_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "CounsellingRound"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeatMatrixRecord" ADD CONSTRAINT "SeatMatrixRecord_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "CounsellingRound"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeatMatrixRecord" ADD CONSTRAINT "SeatMatrixRecord_collegeId_fkey" FOREIGN KEY ("collegeId") REFERENCES "College"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeatMatrixRecord" ADD CONSTRAINT "SeatMatrixRecord_sourceImportId_fkey" FOREIGN KEY ("sourceImportId") REFERENCES "CounsellingDataImport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AllotmentRecord" ADD CONSTRAINT "AllotmentRecord_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "CounsellingRound"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AllotmentRecord" ADD CONSTRAINT "AllotmentRecord_collegeId_fkey" FOREIGN KEY ("collegeId") REFERENCES "College"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AllotmentRecord" ADD CONSTRAINT "AllotmentRecord_sourceImportId_fkey" FOREIGN KEY ("sourceImportId") REFERENCES "CounsellingDataImport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VacancyRecord" ADD CONSTRAINT "VacancyRecord_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "CounsellingRound"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VacancyRecord" ADD CONSTRAINT "VacancyRecord_collegeId_fkey" FOREIGN KEY ("collegeId") REFERENCES "College"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VacancyRecord" ADD CONSTRAINT "VacancyRecord_sourceImportId_fkey" FOREIGN KEY ("sourceImportId") REFERENCES "CounsellingDataImport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalyticsSnapshot" ADD CONSTRAINT "AnalyticsSnapshot_collegeId_fkey" FOREIGN KEY ("collegeId") REFERENCES "College"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalyticsSnapshot" ADD CONSTRAINT "AnalyticsSnapshot_authorityId_fkey" FOREIGN KEY ("authorityId") REFERENCES "CounsellingAuthority"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalyticsSnapshot" ADD CONSTRAINT "AnalyticsSnapshot_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "CounsellingRound"("id") ON DELETE CASCADE ON UPDATE CASCADE;

