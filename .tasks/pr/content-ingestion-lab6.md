## Summary
- Finalize first real `ma-lab-6` import: four analysis topics /40 questions.
- Content totals: 5 subjects /68 lessons /782 questions, every topic >=10 distinct questions.
- Preserve original pack/receipt; separately reviewed post-import corrections fix
  a signed-triangle derivation and principal arcosh root selection in published explanations.
  No question IDs, prompts, options or answers changed; previous742 questions unchanged.
- Make coverage tests grow with the bank, including per-topic integration users
  so adding topics cannot exhaust one user's start quota. Ignore .idea.

## Verification
All requested commands passed: content:validate, content:report, typecheck, lint,
npm test (91/91), test:integration (48/48), db:generate, prisma validate, build.
Local-only db:seed completed without reset; user/learning/auth/history snapshots
unchanged. DB full-source parity passed (68 lessons and782questions).
Local tutor:index:68topics/525chunks/0embeddingsCreated; no paid/externalAI calls.
Independent QA and review completed;14/14 targetedtests after corrected explanations.
Detailed evidence: `.tasks/qa/content-ingestion-lab6.md` and `content-ingestion-lab6-review.md`.

## Boundaries / deployment
No auth/practice/mastery/XP/GPA application logic or Prisma/schema/migration changes.
No unrelated subjects or pre-existing questions edited, no .idea/env/secrets/output committed.
Originalpack replay intentionally refuses to overwrite reviewed corrections. Production
DB was not seeded/indexed; deployment requires an explicitly authorized production seed
and text index update after merge. PDF fidelity not independently checked against originals.
Human review/merge only; no automatic merge.
