# Groq Tutor V1 — independent final review

Decision: APPROVE
Date: 2026-11-03
Reviewer: `groq_review`
Branch/base: `dmitrij/feature/tutor-groq` / latest `origin/main ebfddac`.

## Reviewed scope

Inspected actual adapter, atomic budget query, provider factory/common helpers,
retrieval and service diff, additive Prisma model/migration, mocked unit and local
integration tests, environment example, README and task acceptance criteria.
No application/schema changes or database calls made by reviewer.

The integration retains the established Tutor architecture. Groq requests use a
fixed server endpoint and private headers, bounded context/history and response
reading, strict existing JSON Schema followed by Zod. Restricted exercises never
expose model-authored text; existing server coaching and source-ID verification
remain authoritative. Exam/history suppression, user ownership, per-user
admission, idempotency and deterministic practice/scoring logic are preserved.

The provider-wide quota uses one atomic PostgreSQL upsert before HTTP, not a
process-local counter. All users/models/instances sharing the DB reserve the
same row; minute/day exhaustion and DB failure prevent network calls. Failed
calls are not refunded. GREATEST timestamps and conservative comparisons prevent
stale transactions or a backward clock from resetting a newer window. The
migration only creates the new quota table and nonnegative-count constraint;
no existing migrations, relations or user rows are changed.

Groq retrieval explicitly stays lexical, including in the presence of cached
vectors. No embedding dependency, SDK, vector database, retries or automatic
provider fallback were added. Defaults/configuration, Free Plan limitations,
local setup and unapplied production migration are documented accurately.

## Findings

- **MAJOR — RESOLVED:** initial top-level dedicated-DB assertion made the existing
  default `npm run test:integration` fail on an ordinary local database. Revised
  skipped describe suite contains its DB hooks and safely skips other targets.
  Reviewer independently confirmed SKIP/exit0 with an unreachable ordinary local
  target; root reran the full isolated integration suite successfully.
- No remaining BLOCKER/MAJOR findings. No unrelated cleanup or expanded
  architecture changes found.

## Validation reviewed

[QA matrix](tutor-groq.md) records the executor and evidence for each check.
Reviewer independently ran mocked provider regressions (33/33), the ordinary-DB
skip regression and diff whitespace/scope/base checks. Reviewer inspected final
root-run logs confirming unit101/101, full integration56/56, Tutor E2E9/9 and
production build success. Final typecheck/lint, Prisma generate/validate and local
migration status/schema parity were root-run checks; they are not claimed as
reviewer reruns.

All test data and migrations were confined to the disposable local test DB.
Initial dependency/native-asset browser failures were repaired within the
isolated environment and the final build/browser tests passed. No live provider
or production operations were performed.

Approval supports a reviewable PR only. Live provider/pedagogical quality,
real Telegram login and production deployment/migration remain unverified and
outside this task's authorization. Human merge is required.
