# Content ingestion infrastructure

Status: DONE (PR ready; human merge pending)
Branch: `dmitrij/feature/content-ingestion`
Owner: root; importer delegated exclusively to content_importer.
Base: `origin/main a73033a` (2026-10-13).

## Goal / user story
Curators can add externally prepared university lectures/labs as validated file packs,
without reading the application or regenerating existing teaching material.

## Scope and acceptance
- Compact CONTENT_SCHEMA.md with valid examples and current answer semantics.
- Manifest + lessons/questions packs, inbox/imported/failed directories.
- DB-free validate/report commands reuse existing parser/Zod validation.
- Import validates complete candidate first, preserves IDs, rejects conflicting published
  records, supports additive question banks, reports exact writes and marks only success.
- Tests cover malformed references/answers/IDs, idempotency, conflicts, safe paths and failures.
- No application UI/auth/practice/scoring, content bank, Prisma or AI changes.

## Findings / decisions
- JSON frontmatter in MDX; lesson ID is topic ID; module is an exact subject module title.
- Existing seed maps modules to subject-index IDs. No new schema necessary.
- `solution` is the existing explanation/full solution field; exactly three hints.
- File import does not run seed or connect to any DB. Publishing is a separate authorized step.

## Plan / ownership
1. Root: schema documentation, supplemental file validation and report/CLI wiring.
2. content_importer: importer/CLI and isolated fixture tests; no shared-file edits.
3. QA and independent reviewer: acceptance/security diff review after implementation.
4. Root: sync, final checks, recap, commit/push/PR; human merges.

## Risks / test plan
Path traversal/symlinks, partial writes, simultaneous imports, ID conflicts and empty answers.
Run targeted temp-fixture tests first; then typecheck/lint/unit/integration/build.
Integration must use verified local PostgreSQL, never Neon production.
Structural validation cannot prove mathematical correctness or teaching quality.

## Results
Implemented schema documentation, strict file validation, additive pack importer,
receipts/recovery, coverage reporting, routing and 12 new tests. Existing bank unchanged.
Fixed a test typing error and tightened destination rechecks/rollback preservation.

QA: PASS, unit91/91, integration48/48 (local DB only), typecheck/lint/build,
content validate/report, totals audit. See [QA](../qa/content-ingestion.md).
Independent review: no unresolved blockers, targeted12/12; root completed final
verification gate after agents reached service usage limits. See [review](../qa/content-ingestion-review.md).
Sync: fetched/merged origin/main a73033a; already up to date; all requested checks rerun.
No schema/migrations/seed/cloud writes, no new educational content.
Limitations: structural validation is not mathematical verification; abrupt kill requires
manual lock/journal recovery; file import does not publish DB content.
Implementation commit: `6709ee34aabd4d94c47476199c68e66b96331124`, pushed.
PR: https://github.com/gulTrueKanekiSSS/vibe_code/pull/12 (open, base main).
Next: human review/merge; future curators read CONTENT_SCHEMA.md and the pack guide,
then import a reviewed pack. No automatic seed or PR merge.
