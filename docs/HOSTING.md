# StudySpace: Vercel Hobby + Neon Free

Deployment target: personal, non-commercial pilot. Tutor is deferred, not removed.
This runbook prepares infrastructure; it does not claim an existing live deployment.
No paid upgrade, external AI request or automatic database reset is required.

## 1. Accounts and project

Connect Vercel and Neon using their account authorization screens, never paste keys
into chat. Choose the **Free** Neon plan and **Hobby** Vercel plan, not a paid trial.
Review current quotas and regional availability in the account before creation.
Vercel Hobby allows personal non-commercial use only. Test access from intended
Russian home/mobile networks before inviting students; availability is not guaranteed.

Create a dedicated Neon project/database for StudySpace, in a region near the Vercel
function region. Do not reuse a database with unrelated applications or user data.
In Vercel import this GitHub repository, root directory `.`, framework Next.js,
Node.js **22.x**, production branch `main`. Repository `vercel.json` sets `npm ci`
and `npm run build:hosting`; leave output directory/framework defaults unchanged.
Do not override the build command with a command that bypasses the preflight.
Select a stable project hostname (e.g. `studyspace-<unique>.vercel.app`).
First deploy only after preparing the database and environment below.

## 2. Production environment (Vercel project settings)

Set these variables for **Production only**, not all environments:

| Variable | Value/source |
| --- | --- |
| `DATABASE_URL` | Neon Connect dialog, **connection pooling enabled**, PostgreSQL URL, TLS `sslmode=require` |
| `NEXT_PUBLIC_APP_URL` | Exact stable HTTPS origin, no trailing slash/path |
| `TELEGRAM_CLIENT_ID` | BotFather Web Login client ID |
| `TELEGRAM_CLIENT_SECRET` | BotFather Web Login client secret; sensitive/server-only |
| `DEV_AUTH` | `false` |
| `TUTOR_PROVIDER` | `disabled` |

Keep the entire database URL private. Do not add AI keys, bot tokens or any
`NEXT_PUBLIC_*` credentials. Do not copy the local `.env` wholesale. Leave NODE_ENV
managed by Next/Vercel. The existing provider factory returns no provider for
`disabled`, even if a key is accidentally present; the UI uses its unavailable state.
No Tutor indexing is needed for this pilot. Deferred is not a new Tutor UI redesign.

Neon's pooled URL works with our existing Prisma 6 PostgreSQL client; no adapter,
schema rewrite, separate vector database or migration is needed for hosting itself.
Preserve Neon connection parameters. Tune connection limits only after measuring;
practice uses interactive transactions, so do not substitute an HTTP-only DB client.

### Preview isolation

Never give Preview/Development deployments the production DB URL or Telegram secret.
Without separate configuration their hosting build intentionally fails closed.
If previews are needed later, provision an isolated Neon branch/database with no real
personal data, a separate Telegram bot/client, and a stable preview origin/callback.
Do not point preview NEXT_PUBLIC_APP_URL to production to bypass origin protection.
Disable unnecessary automatic preview deployments in project settings if available.
No migrations or seed run as part of any Vercel build.

## 3. Prepare database once, outside the hosting build

Run from the reviewed deployment commit with Node 22.13+, after `npm ci` and
`npm run db:generate`. Use a private, ignored `.env.hosting.local` file containing
only `DATABASE_URL` copied from Neon with **connection pooling disabled** (direct
connection, TLS required). This process-local override avoids schema/directUrl changes.
Keep your local `.env` unchanged. Ensure the shell has no exported DATABASE_URL:
Node's env-file does not override an already exported variable. Do not echo either.

Verify the target project/branch in the Neon console first. On an existing deployment,
take a backup/restore point before migrations/content updates. Only one operator/job
may perform migration deployment at a time; never use migrate dev/reset/db push here.

```sh
node --env-file=.env.hosting.local node_modules/prisma/build/index.js migrate status
node --env-file=.env.hosting.local node_modules/prisma/build/index.js migrate deploy
node --env-file=.env.hosting.local --import tsx prisma/seed.ts
node --env-file=.env.hosting.local node_modules/prisma/build/index.js migrate status
```

An initial status command can report pending migrations; inspect them before deploy.
Apply all committed migrations, including `20261008120000_contextual_ai_tutor`, even
with Tutor disabled: the deployed Prisma client still describes those tables.
Seed loads course subjects/topics/questions, not a copy of local users/progress.
The seed upserts existing IDs; it is a deliberate content publication step, not a
startup hook. Never run integration/E2E tests against production: they create data.
CLI output can contain database host/name or errors: keep it private and do not
paste raw logs. The separate hosting preflight prints no configuration values.

## 4. Telegram and first deployment

In the BotFather mini app, select the bot → Login Widget, configure the OIDC client:

- Allowed origin: `https://<your-stable-hostname>`
- Redirect/callback URL: `https://<your-stable-hostname>/api/auth/telegram/callback`

Use the exact same origin for NEXT_PUBLIC_APP_URL. This is Authorization Code + PKCE,
not the legacy widget signature flow; `/setdomain` alone is not sufficient.
Use a dedicated deployment bot if changing an existing bot would disrupt local users.
Configure Vercel deployment protection deliberately: students must be able to reach
the public pilot and Telegram callback; do not expose preview/internal deployments.
Deploy the reviewed/merged main commit. Environment changes require a redeploy;
NEXT_PUBLIC_APP_URL is also used by the client/build and must not be stale.

## 5. Acceptance smoke (on the real URL)

- HTTPS `/login` loads on desktop/mobile and Russian home/mobile connections.
- Real Telegram login succeeds, returns to the stable hostname, and survives refresh.
- Local demo login is unavailable; an invalid callback does not create a session.
- Subjects/topics/lessons/questions are populated, math and assets render.
- Practice: start → first question → answer → refresh/resume → finish early/complete.
- XP/mastery update deterministically; second user cannot access first user's session.
- Username/photo privacy and leaderboard visibility remain respected.
- Tutor shows unavailable, no external AI traffic or credentials are configured.
- Logout works; inspect server errors without sharing codes/cookies/secrets.

Do not treat a successful build as proof of these checks. Record results and deployment
URL in the task only after actual verification. Monitor free quotas, errors and DB
growth; keep independent backups (Neon Free's restore window is limited).

## Rollback / future updates

Roll back application code to a compatible deployment, not by resetting the database.
Back up before data changes; do not roll back committed migrations automatically.
Keep migrations explicit and serialized. Re-run seed only for reviewed content updates.
Tutor activation is a separate future task with consent to API costs and live QA.

## References

- [Vercel Next.js](https://vercel.com/docs/frameworks/full-stack/nextjs)
- [Vercel Hobby](https://vercel.com/docs/plans/hobby)
- [Neon Free limits](https://neon.com/blog/neon-free-plan-1-gb-per-project)
- [Neon + Prisma](https://neon.com/docs/guides/prisma)
- [Telegram Web Login](https://core.telegram.org/bots/telegram-login)
