ALTER TABLE "PracticeItem" ADD CONSTRAINT "PracticeItem_xp_nonnegative" CHECK ("xp" >= 0);
ALTER TABLE "PracticeItem" ADD CONSTRAINT "PracticeItem_hint_range" CHECK ("hintLevel" BETWEEN 0 AND 4);
ALTER TABLE "PracticeItem" ADD CONSTRAINT "PracticeItem_attempt_range" CHECK ("attempts" BETWEEN 0 AND 3);
ALTER TABLE "PracticeItem" ADD CONSTRAINT "PracticeItem_reward_requires_success" CHECK ("xp" = 0 OR ("correct" = true AND "completedAt" IS NOT NULL));
ALTER TABLE "Question" ADD CONSTRAINT "Question_difficulty_valid" CHECK ("difficulty" IN ('EASY', 'MEDIUM', 'HARD', 'CHALLENGE'));
CREATE INDEX "PracticeItem_questionId_completedAt_idx" ON "PracticeItem" ("questionId", "completedAt");
