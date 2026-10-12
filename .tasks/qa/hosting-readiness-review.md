# Hosting readiness — independent review

Date: 2026-10-12
Branch: `dmitrij/chore/hosting-readiness`
Decision: **APPROVE** for repository hosting preparation; not a live-deployment approval.

## Scope and evidence

Read task acceptance criteria, independent QA report, full tracked diff and new
hosting scripts, tests, Vercel configuration and runbook. Checked the existing
Prisma client/schema, seed, authentication origin/callback and disabled Tutor
factory contracts against the proposed configuration. No implementation edits.

- No BLOCKER or MAJOR findings.
- Preflight emits fixed messages only, never supplied configuration values. It
  requires HTTPS origin, TLS pooled Neon URL, server-side Telegram credentials,
  disabled development authentication and explicitly disabled Tutor.
- `build:hosting` validates configuration and generates Prisma Client before the
  existing production build. It contains no migration, seed or reset automation.
- Existing native Prisma PostgreSQL transport and transactions remain unchanged.
  The runbook supplies direct connection credentials only to a separate admin
  process; it documents exported-environment precedence and serialized ownership.
- Initial seed imports curriculum, not local users. Existing data is not reset.
- Telegram callback instructions match the existing Authorization Code/PKCE route.
  Preview credentials/database are isolated; missing preview configuration fails
  closed. No AI credentials are required or transferred for the hosting pilot.
- Secret environment variants and Vercel local state are ignored; `.env.example`
  remains tracked. No real credential values appear in reviewed changes.
- Application/auth/practice/schema/content source files are unchanged. Unrelated
  `.idea/` remains untracked and outside this task.

## Verification assessed

Independent QA records hosting tests 3/3, synthetic CLI acceptance/rejection and
secret-output checks, ignore checks and diff whitespace check. Root reports unit
tests 79/79 and production `build:hosting` PASS with synthetic credentials; root
also confirmed the final typecheck/lint recheck PASS after the validator argument
was widened to `Record<string, string | undefined>` for synthetic test input.
This reviewer ran `git diff --check` successfully and confirmed `origin/main` is
an ancestor of the current branch (`c51e58b` at review time). This review does not
claim independently rerunning the test/build suites or refreshing the remote.

## Notes and remaining acceptance

- NOTE — `docs/HOSTING.md`: real provisioning, migration/seed and deployed smoke
  checks are intentionally pending account access. A build cannot prove Telegram
  permissions, database connectivity, free quotas or access from Russian networks.
- NOTE — `scripts/hosting-config.ts`: validation checks configuration shape, not
  credential correctness or DNS reachability. This limitation is documented and
  is not a deployment security boundary against hostile project administrators.
- Finalize task checkboxes/results, final QA evidence and publication links before
  handoff. Push/PR remain root-owned; merge must remain a human action.

No changes requested. No live credentials read, external AI calls, remote database
operations or cloud resources created during this review.
