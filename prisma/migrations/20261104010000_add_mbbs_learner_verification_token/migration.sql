-- CreateTable
CREATE TABLE "MBBSLearnerVerificationToken" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "normalizedEmail" TEXT NOT NULL,
    "displayEmail" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "ticketHash" TEXT,
    "ticketExpiresAt" TIMESTAMP(3),
    "ticketConsumedAt" TIMESTAMP(3),
    "ipHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MBBSLearnerVerificationToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MBBSLearnerVerificationToken_tokenHash_key" ON "MBBSLearnerVerificationToken"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "MBBSLearnerVerificationToken_ticketHash_key" ON "MBBSLearnerVerificationToken"("ticketHash");

-- CreateIndex
CREATE INDEX "MBBSLearnerVerificationToken_normalizedEmail_expiresAt_idx" ON "MBBSLearnerVerificationToken"("normalizedEmail", "expiresAt");

-- CreateIndex
CREATE INDEX "MBBSLearnerVerificationToken_normalizedEmail_consumedAt_idx" ON "MBBSLearnerVerificationToken"("normalizedEmail", "consumedAt");

-- CreateIndex
CREATE INDEX "MBBSLearnerVerificationToken_email_ticketExpiresAt_idx" ON "MBBSLearnerVerificationToken"("normalizedEmail", "ticketExpiresAt");

-- CreateIndex
CREATE INDEX "MBBSLearnerVerificationToken_createdAt_idx" ON "MBBSLearnerVerificationToken"("createdAt");
