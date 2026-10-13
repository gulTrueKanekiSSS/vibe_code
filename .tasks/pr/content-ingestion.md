## Goal
Make future university content ingestion cheap and reliable without reading or rewriting
the application or regenerating the existing bank.

## Changes
- Compact CONTENT_SCHEMA.md and conditional content-only agent routing.
- Documented manifest/lessons/questions packs with inbox/imported/failed directories.
- `content:validate`: strict DB-free structural checks reusing existing parser/Zod schemas.
- `content:import -- <pack-directory>`: additive, ID-preserving import; validates the
  full candidate first; rejects changed published records, unsafe paths and duplicate
  IDs; serializes writers, rolls back caught failures, records success receipts.
- `content:report`: subject lesson/question totals, topic/difficulty/type counts and
  low coverage (<10); existing content:check alias retained.
- 12 new tests including executable documentation examples, retry/conflict/concurrency,
  symlink replacement and rollback scenarios.

## Verification
After fetch/merge of origin/main a73033a (already up to date): typecheck, lint,
unit91/91, integration48/48 on verified local DB, build, validate/report and report
totals audit PASS. Independent reviewer ran targeted12/12 and found no remaining
blockers; root completed the final evidence gate after agents reached service limits.
Detailed reports: `.tasks/qa/content-ingestion.md`, `content-ingestion-review.md`.

## Scope / limitations
Existing bank unchanged: 5 subjects, 64 lessons, 742 questions, every topic >=10.
No UI/auth/practice/mastery/GPA/AI/schema/migration/seed changes. No cloud writes.
Only application-file diff exports two existing content schemas for reuse.
Importer changes files, not database publication. Hard process termination requires
explicit recovery from retained lock/journal. Mathematical/pedagogical correctness
still requires human verification. Browser E2E not applicable to this CLI-only change.

Human review and merge required; no automatic merge.
