-- Historical reconciliation migration for tables previously deployed without migration files
-- 1. MBBSStudentVoiceSurveyResponse (added in commit f4896b8)
-- 2. CPRVerificationSubmission (added in commit 0f46f6b)

-- CreateTable
CREATE TABLE "MBBSStudentVoiceSurveyResponse" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "surveyVersion" TEXT NOT NULL DEFAULT 'v1',
    "source" TEXT,
    "trainingStage" TEXT NOT NULL,
    "collegeType" TEXT,
    "state" TEXT,
    "stateCode" TEXT,
    "surveyResponses" JSONB NOT NULL,
    "interestedInContributing" BOOLEAN NOT NULL DEFAULT false,
    "contributionInterests" JSONB,
    "consentForFollowup" BOOLEAN NOT NULL DEFAULT false,
    "respondentName" TEXT,
    "email" TEXT,
    "mobileWhatsapp" TEXT,
    "referralCode" TEXT,
    "submissionFingerprint" TEXT,

    CONSTRAINT "MBBSStudentVoiceSurveyResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CPRVerificationSubmission" (
    "id" TEXT NOT NULL,
    "submissionType" TEXT NOT NULL,
    "submissionStatus" TEXT NOT NULL DEFAULT 'PENDING_ADMIN_REVIEW',
    "state" TEXT NOT NULL,
    "stateCode" TEXT,
    "reportRowId" TEXT,
    "canonicalVenueId" TEXT,
    "courseOrSessionId" TEXT,
    "venue" TEXT,
    "city" TEXT,
    "mappedCoordinatorName" TEXT,
    "submittedByName" TEXT NOT NULL,
    "submittedByMobile" TEXT NOT NULL,
    "submittedByEmail" TEXT,
    "identityStatus" TEXT NOT NULL,
    "currentDataJson" JSONB,
    "proposedChangesJson" JSONB,
    "correctionNote" TEXT,
    "evidenceNote" TEXT,
    "adminReviewedBy" TEXT,
    "adminReviewedAt" TIMESTAMP(3),
    "adminNote" TEXT,
    "adminDecision" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CPRVerificationSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MBBSStudentVoiceSurveyResponse_createdAt_idx" ON "MBBSStudentVoiceSurveyResponse"("createdAt");
CREATE INDEX "MBBSStudentVoiceSurveyResponse_source_idx" ON "MBBSStudentVoiceSurveyResponse"("source");
CREATE INDEX "MBBSStudentVoiceSurveyResponse_trainingStage_idx" ON "MBBSStudentVoiceSurveyResponse"("trainingStage");
CREATE INDEX "MBBSStudentVoiceSurveyResponse_state_idx" ON "MBBSStudentVoiceSurveyResponse"("state");
CREATE INDEX "MBBSStudentVoiceSurveyResponse_interestedInContributing_idx" ON "MBBSStudentVoiceSurveyResponse"("interestedInContributing");

-- CreateIndex
CREATE INDEX "CPRVerificationSubmission_state_submissionStatus_idx" ON "CPRVerificationSubmission"("state", "submissionStatus");
CREATE INDEX "CPRVerificationSubmission_canonicalVenueId_idx" ON "CPRVerificationSubmission"("canonicalVenueId");
CREATE INDEX "CPRVerificationSubmission_submittedByMobile_idx" ON "CPRVerificationSubmission"("submittedByMobile");
CREATE INDEX "CPRVerificationSubmission_submissionStatus_idx" ON "CPRVerificationSubmission"("submissionStatus");
CREATE INDEX "CPRVerificationSubmission_createdAt_idx" ON "CPRVerificationSubmission"("createdAt");
