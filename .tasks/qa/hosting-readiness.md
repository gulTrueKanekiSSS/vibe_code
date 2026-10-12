# Hosting readiness — independent QA

Date: 2026-10-12
Branch: `dmitrij/chore/hosting-readiness`
Verdict: targeted repository checks PASS; live deployment acceptance BLOCKED until
Vercel/Neon access and configuration exist. Full repository checks are root-owned.

## Scope and acceptance evidence

- Reviewed task acceptance, current diff, `scripts/hosting-config.ts`,
  `scripts/check-hosting.ts`, `tests/hosting.test.ts`, `vercel.json`, and
  `docs/HOSTING.md`. No application, database or secret modifications by QA.
- Build configuration: deterministic `npm ci`; hosting build checks settings,
  generates Prisma Client, then invokes existing webpack production build.
  No seed/migrate/reset step in that build chain.
- Configuration validation: synthetic good HTTPS/pooled-Neon settings accepted;
  missing values, insecure/local/pathful origins, direct/non-TLS DB connections,
  enabled dev auth/Tutor, and public credential-like variables rejected.
- Disabled provider returns null even with both providers' credential fields set.
- Runbook covers production-only environment, isolated previews, direct one-off
  migration target, serialized migration ownership, deliberate seed publication,
  backup/rollback limitations, exact Telegram OIDC callback, and remote smoke checks.
- Verified referenced seed/migration paths exist. Seed upserts curriculum only;
  it does not export/copy local users. Database CLI output is explicitly private.
- `.env.hosting.local`, `.env.production`, and `.vercel/project.json` match ignore
  rules. `.env.example` remains explicitly exempted for tracked documentation.

## Commands actually run

1. `node_modules/.bin/tsx --test tests/hosting.test.ts`: initially BLOCKED by
   sandbox `EPERM` for the tsx IPC socket; default shell also selected Node 18.
2. Re-run with approved escalation and project Node selected:
   `PATH="$PWD/node_modules/.bin:$PATH" node_modules/.bin/tsx --test tests/hosting.test.ts`
   — PASS, 3 tests / 3 passed / 0 failed.
3. Independent CLI smoke using `node_modules/.bin/node`, `spawnSync`, and
   `--import tsx scripts/check-hosting.ts`, each child with a fresh synthetic env:
   valid configuration exited 0; missing configuration exited 1; enabled Tutor
   plus public API key exited 1. All stdout/stderr checked for synthetic secret
   leakage; none found. No `.env` loaded and no external network calls.
4. `git diff --check` — PASS.
5. `git check-ignore .env.hosting.local .env.production .vercel/project.json` —
   all three ignored; referenced seed and Tutor migration tracked paths exist.

## Missing evidence / limitations

- Root will record full unit/typecheck/lint/build outcomes; this report does not
  claim those checks passed merely because targeted tests passed.
- Integration DB and browser suites not run by QA: no application/service/schema
  logic changed and these would not prove a cloud deployment works.
- Build preflight validates configuration shape, not credential correctness,
  database ownership/reachability, billing/quotas, or Telegram permissions.
- Actual Vercel/Neon provisioning, migration/seed, real Telegram login, practice
  persistence, privacy, and Russia-network checks remain pending; no deployment
  URL or production readiness claim can be issued yet.
- No blocking implementation issue found in reviewed scope. No fixes required
  by this targeted QA pass.
