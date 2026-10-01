ALTER TABLE "PracticeSession" ADD COLUMN "startKey" TEXT;
CREATE UNIQUE INDEX "PracticeSession_startKey_key" ON "PracticeSession"("startKey");
