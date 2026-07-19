-- AlterTable
ALTER TABLE "Participant" ADD COLUMN     "venueId" TEXT;

-- CreateIndex
CREATE INDEX "Participant_venueId_idx" ON "Participant"("venueId");
