-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY');

-- CreateEnum
CREATE TYPE "ParticipantCategory" AS ENUM ('SCHOOL_STUDENT', 'COLLEGE_STUDENT', 'TEACHER', 'HEALTHCARE_WORKER', 'POLICE_PERSONNEL', 'ARMED_FORCES', 'RWA_MEMBER', 'NGO_VOLUNTEER', 'CORPORATE_EMPLOYEE', 'COMMUNITY_MEMBER', 'IAP_MEMBER', 'OTHER');

-- CreateTable
CREATE TABLE "Participant" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "mobileNumber" TEXT,
    "normalizedMobile" TEXT,
    "email" TEXT,
    "normalizedEmail" TEXT,
    "age" INTEGER,
    "gender" "Gender",
    "participantCategory" "ParticipantCategory" NOT NULL DEFAULT 'COMMUNITY_MEMBER',
    "organisationName" TEXT,
    "designation" TEXT,
    "city" TEXT,
    "district" TEXT,
    "state" TEXT,
    "postalCode" TEXT,
    "emergencyContactName" TEXT,
    "emergencyContactMobile" TEXT,
    "consentToParticipate" BOOLEAN NOT NULL DEFAULT false,
    "consentForPhoto" BOOLEAN NOT NULL DEFAULT false,
    "consentForCommunication" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Participant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Participant_normalizedName_normalizedMobile_idx" ON "Participant"("normalizedName", "normalizedMobile");

-- CreateIndex
CREATE INDEX "Participant_normalizedName_normalizedEmail_idx" ON "Participant"("normalizedName", "normalizedEmail");

-- CreateIndex
CREATE INDEX "Participant_state_district_idx" ON "Participant"("state", "district");

-- CreateIndex
CREATE INDEX "Participant_participantCategory_idx" ON "Participant"("participantCategory");
