# Finalize content ingestion with first real Lab 6 pack

Status: QA_PASSED_PENDING_SYNC
Date: 2026-10-14
Branch: dmitrij/feature/content-ingestion
Base: 9359df3; fetched origin/main 81aacc0 (PR #12 human-merged).

## Goal and scope
Preserve staged ma-lab-6 import and future-proof coverage fixes; verify 5 subjects,
68 lessons, 782 questions; synchronize local DB without reset; rebuild local text-only
Tutor index; run full requested matrix; independent review; commit/push/PR, never merge.
No auth/practice/scoring/schema changes, no paid embeddings or remote DB writes.

## Existing state
Feature and temporary fix branches share HEAD. Resumed on the feature branch without
discarding index or working changes. Staged: .idea ignore and Lab 6 pack/receipt/content.
Unstaged: coverage tests and recap. Existing pipeline implementation already committed.

## Ownership / plan
Root exclusively owns local seed/index, shared task/recap and publication.
Independent reviewer checks complete diff, stable content/IDs, boundaries and tests.
QA independently checks pack/receipt/source integrity; root runs required full suites.

## Acceptance / verification
- Existing 742 questions unchanged; four new analysis lessons, ten unique questions each.
- content:validate / content:report; typecheck / lint / npm test / test:integration.
- db:seed (verified local target), db:generate, prisma validate, build.
- tutor:index without --embeddings; counts/learning data preservation checked.
- No .idea, secrets, generated artifacts; main sync and rerun before publication.

## Results / next step
Initial file counts PASS 5/68/782; independent pack fingerprint/source checks PASS.
Review found two teaching defects: signed triangle side for arccos, missing arcosh
principal range in root selection. Applied separate reviewed corrections only to
published inverse-trigonometric/inverse-hyperbolic lessons and two solution strings
in inverse-hyperbolic question bank. IDs/prompts/options/answers unchanged.
Original source pack and receipt remain immutable evidence of initial import.
These three published files deliberately differ after review; replay of original pack
must reject, not overwrite the corrected explanations. Do not change receipt hashes
to pretend corrections were part of the original import. No existing 742 content edits.
Seed: `npm run db:seed` PASS on explicitly verified loopback PostgreSQL. Complete
user/settings/auth/practice/attempt/progress/Tutor-history/usage snapshots compared
in memory before/after and unchanged. Counts 5/68/782; all DB question fields and
lesson sections exactly match reviewed source. No reset, migration or remote writes.

Checks PASS: content:validate/report, typecheck, lint, unit91/91, integration48/48,
db:generate, prisma validate, build. `tutor:index`: 68 topics /525 chunks /0 new embeddings;
no provider passed and no --embeddings flag. `.idea` ignored, no tracked editor files.
QA/review: [QA](../qa/content-ingestion-lab6.md), [independent review](../qa/content-ingestion-lab6-review.md).
Both mathematical review findings repaired; previous IDs and answer keys unchanged.
Next: inspect/stage/commit, fetch+merge origin/main, rerun, push and new PR (prior #12 merged).
