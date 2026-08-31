-- CreateTable
CREATE TABLE "MBBSProfessionalSurveyResponse" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "surveyVersion" TEXT NOT NULL DEFAULT 'v1',
    "source" TEXT,
    "roles" JSONB NOT NULL,
    "specialty" TEXT,
    "teachingExperience" TEXT,
    "institutionName" TEXT,
    "city" TEXT,
    "state" TEXT,
    "stateCode" TEXT,
    "surveyResponses" JSONB NOT NULL,
    "interestedInContributing" BOOLEAN NOT NULL DEFAULT false,
    "contributionInterests" JSONB,
    "willingToShareReadinessSurvey" BOOLEAN NOT NULL DEFAULT false,
    "respondentName" TEXT,
    "email" TEXT,
    "mobileWhatsapp" TEXT,
    "consentForFollowup" BOOLEAN NOT NULL DEFAULT false,
    "referralCode" TEXT,
    "submissionFingerprint" TEXT,

    CONSTRAINT "MBBSProfessionalSurveyResponse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MBBSProfessionalSurveyResponse_createdAt_idx" ON "MBBSProfessionalSurveyResponse"("createdAt");

-- CreateIndex
CREATE INDEX "MBBSProfessionalSurveyResponse_source_idx" ON "MBBSProfessionalSurveyResponse"("source");

-- CreateIndex
CREATE INDEX "MBBSProfessionalSurveyResponse_state_idx" ON "MBBSProfessionalSurveyResponse"("state");

-- CreateIndex
CREATE INDEX "MBBSProfessionalSurveyResponse_interestedInContributing_idx" ON "MBBSProfessionalSurveyResponse"("interestedInContributing");

-- CreateIndex
CREATE INDEX "MBBSProfessionalSurveyResponse_willingToShareReadinessSurve_idx" ON "MBBSProfessionalSurveyResponse"("willingToShareReadinessSurvey");
