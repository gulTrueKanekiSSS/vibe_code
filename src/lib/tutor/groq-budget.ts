import { db } from "../db";
import { TutorProviderError } from "./provider-common";

export type GroqBudget = { perMinute: number; perDay: number };

// One row for the entire provider, independent of user, model and server instance.
// Reserve before HTTP, including failed calls. Never refund or retry automatically.
export async function reserveGroqRequest(limits: GroqBudget): Promise<void> {
  try {
    const rows = await db.$queryRaw<{ provider: string }[]>`
      INSERT INTO "TutorProviderUsage"
        ("provider", "minuteStart", "minuteCount", "dayStart", "dayCount")
      SELECT 'groq', date_trunc('minute', CURRENT_TIMESTAMP AT TIME ZONE 'UTC'), 1,
        date_trunc('day', CURRENT_TIMESTAMP AT TIME ZONE 'UTC'), 1
      WHERE ${limits.perMinute} > 0 AND ${limits.perDay} > 0
      ON CONFLICT ("provider") DO UPDATE SET
        "minuteStart" = GREATEST("TutorProviderUsage"."minuteStart", EXCLUDED."minuteStart"),
        "minuteCount" = CASE
          WHEN "TutorProviderUsage"."minuteStart" >= EXCLUDED."minuteStart"
          THEN "TutorProviderUsage"."minuteCount" + 1 ELSE 1 END,
        "dayStart" = GREATEST("TutorProviderUsage"."dayStart", EXCLUDED."dayStart"),
        "dayCount" = CASE
          WHEN "TutorProviderUsage"."dayStart" >= EXCLUDED."dayStart"
          THEN "TutorProviderUsage"."dayCount" + 1 ELSE 1 END
      WHERE ("TutorProviderUsage"."minuteStart" < EXCLUDED."minuteStart"
          OR "TutorProviderUsage"."minuteCount" < ${limits.perMinute})
        AND ("TutorProviderUsage"."dayStart" < EXCLUDED."dayStart"
          OR "TutorProviderUsage"."dayCount" < ${limits.perDay})
      RETURNING "provider"
    `;
    if (!rows.length) throw new TutorProviderError("rate_limited");
  } catch (error) {
    if (error instanceof TutorProviderError) throw error;
    // Missing migration/outage fails closed: never send an unbudgeted request.
    throw new TutorProviderError("unavailable");
  }
}
