# Hosting readiness — Vercel + Neon, Tutor deferred

Status: BLOCKED (repository ready for PR; cloud provisioning pending account connection)
Branch: dmitrij/chore/hosting-readiness
Owner: root (implementation/database deployment instructions); separate QA/review agents
Base: origin/main c51e58b (PR #9 merged by human)

## Original request / PM
Prepare hosting and the site for hosting; defer AI Tutor. Target a personal,
non-commercial free pilot using Vercel Hobby and Neon Free.

## Acceptance criteria
- [x] Reproducible Vercel build generates Prisma client, without DB mutations.
- [x] Production configuration preflight rejects unsafe/missing settings without printing values.
- [x] Tutor disabled for hosting, including when credentials accidentally exist.
- [x] Runbook covers pooled runtime/direct migration connections, isolated previews,
  Telegram OIDC callback, secrets, initial content load, backups and smoke checks.
- [x] Relevant tests/typecheck/lint/build and independent review complete.
- [ ] Cloud deployment performed only with confirmed access; blockers explicit.

## Findings / Tech Lead plan
Next 16.2 / Node >=22.13 / Prisma 6.19 with PostgreSQL. Auth already uses production
Secure cookies, strict configured origin and denies dev login. DB-backed practice
has transactions and row locks: retain existing Prisma PostgreSQL transport.
Existing provider factory returns null for `TUTOR_PROVIDER=disabled`.

1. Add checked hosting build command + Vercel config, safe environment validator/tests.
2. Document Neon pooled runtime URL and direct URL supplied as DATABASE_URL only in
   a separate one-off admin process. No schema/directUrl migration required.
3. No seed/migrate in concurrent Vercel builds. No production DB in previews.
4. Keep AI code/history intact; explicitly disable provider on hosting.
5. QA, independent review, sync, commit/push and PR (human merge).

## Non-goals / risks
No UI/auth/practice redesign, migrations, content edits, paid resources or AI calls.
No copying real local users to cloud; initial deployment loads curriculum only.
Free quota/region availability and Russia connectivity require real deployment checks.
Plugins discovered but not connected; remote creation/deployment is currently blocked.

## Test plan
Unit preflight/config/disabled-provider tests; all unit tests, typecheck, lint,
production build. No integration DB mutation needed unless service code changes.
Remote manual smoke: real Telegram, practice start/answer/refresh/finish, privacy,
blocked dev auth/Tutor; never use demo auth as proof of Telegram success.

## Results
- Full unit tests: 79/79 PASS; hosting targeted tests: 3/3 PASS.
- Typecheck and lint PASS after correction of overly narrow ProcessEnv parameter type.
- `npm run build:hosting` PASS with synthetic hosting env; includes Prisma generate
  and `npm run build`, no reachable DB required. Sandbox IPC initially blocked tsx;
  rerun with approval succeeded. No provider requests or remote DB writes.
- Build-only next-env.d.ts path rewrite restored surgically; typecheck/lint rerun PASS.
- Integration/E2E omitted: application/service/schema behavior unchanged. Remote smoke
  is still mandatory after actual deployment, not substituted by these unit/build checks.
- Independent [QA](../qa/hosting-readiness.md) PASS for repository scope.
- Independent [review](../qa/hosting-readiness-review.md) APPROVE, no blocking findings.
- `git fetch origin` + `git merge origin/main`: c51e58b, already up to date, no conflicts.
- Cloud access: Vercel/Neon plugins found but not connected. Exact next step: user
  connects accounts, then create Free/Hobby resources and follow docs/HOSTING.md.
- Real local `.env` and unrelated `.idea/` preserved. Local Tutor env not edited;
  disabled setting is enforced for the new hosting build, not retroactively on dev.
