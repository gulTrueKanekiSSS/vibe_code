# Neon initial deployment — connection check

Status: DATABASE_READY; Vercel setup pending (2026-10-12)
Branch: dmitrij/chore/neon-initialization
Base: origin/main 3a55ff6 (hosting PR #10 merged by human)
Database owner: root only; no parallel schema/migration work.

## Scope
User created Neon Free production project in Frankfurt, then supplied private
`.env.hosting.local` with the direct DATABASE_URL for initial migrations/seed.
Initialize only the new cloud DB, preserve local env/database, never call AI.

## Evidence / checks
- File exists, is Git-ignored, parsed without printing values. PostgreSQL URL,
  direct Neon endpoint in eu-central-1, credentials present, required TLS.
- No exported DATABASE_URL overrides the file; password is not an asterisk mask.
- Existing published migrations/seed match origin/main; no new schema changes.
- Prisma direct connection failed; sanitized error P1001 (connectivity).
- Retried with 30-second connect/pool timeout in memory only: same P1001.
- DNS resolves (IPv4 and IPv6), TCP port accepts a connection.
- Explicit PostgreSQL SSL negotiation did not reach a successful TLS handshake.
  This is not proof that credentials are wrong or that the provider is down.

## Safety / current state
The initial checks were blocked before any mutation. After the user disabled VPN,
connection succeeded and the public schema was verified empty (zero tables).
Client-to-Neon PostgreSQL TLS certificate validation passed. `pg_stat_ssl` returned
false on the backend connection, so it was not used as proof of client transport;
the independent TLS negotiation verified the external endpoint directly.

Executed against the explicitly provided direct Neon URL (local env preserved):
- Prisma validate PASS; initial migrate status showed pending committed migrations.
- migrate deploy PASS; subsequent migrate status PASS.
- All six applied migration names/checksums match committed SQL, all finished.
- Existing curriculum seed PASS: 5 subjects / 15 modules / 64 topics / 742 questions.
- Read-only count verification PASS; every topic has at least ten questions.
- Zero users, practice sessions, tutor conversations and lecture chunks.

No resets, data deletion, provider requests, new cloud resources or application
changes. Tutor/indexing remain deferred. Full app tests/build were not rerun for
this operations-only step; earlier hosting QA is recorded in its separate report.
No real URL, hostname, password, personal data or raw provider errors in report.
Do not run integration/E2E tests against this production database.

## Exact next step
Import the repository in Vercel (Hobby, main, Next.js, Node22). Set production-only
pooled DATABASE_URL from Neon, stable app origin, Telegram client ID/secret,
DEV_AUTH=false and TUTOR_PROVIDER=disabled. Do not migrate/seed again just to deploy.
Vercel account integration is not connected; continue via user's dashboard unless
connection becomes available. Then configure BotFather exact origin/callback, deploy
and verify real login/practice. No live site or Telegram smoke is claimed yet.
