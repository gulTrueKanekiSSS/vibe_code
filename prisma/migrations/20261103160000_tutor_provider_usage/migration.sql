CREATE TABLE "TutorProviderUsage" (
    "provider" TEXT NOT NULL,
    "minuteStart" TIMESTAMP(3) NOT NULL,
    "minuteCount" INTEGER NOT NULL,
    "dayStart" TIMESTAMP(3) NOT NULL,
    "dayCount" INTEGER NOT NULL,
    CONSTRAINT "TutorProviderUsage_pkey" PRIMARY KEY ("provider"),
    CONSTRAINT "TutorProviderUsage_counts_check" CHECK ("minuteCount" >= 0 AND "dayCount" >= 0)
);
