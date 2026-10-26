# Publish AGLA Lecture 5 / Lab 5 content

Status: READY_FOR_PR
Date: 2026-10-26
Branch: dmitrij/content/agla-lecture-5-lab-5
Base: origin/main c7a2f2a
Owner: root (content publication)

## Goal and scope

Publish the already imported AGLA Lecture 5 / Lab 5 content under geometry, module
`Матрицы и пространство`. Preserve the authored pack, stable IDs, existing data,
and all unrelated work. No PDF reading, content generation, answer edits, schema,
auth, or practice logic changes.

## Acceptance

- [x] Preserve five lessons, 69 questions, source inbox pack, and import receipt.
- [x] `npm run content:validate` PASS: 5 subjects / 73 lessons / 851 questions.
- [x] `npm run content:report` PASS; no topics below the minimum coverage threshold.
- [x] `npm test` PASS: 91/91.
- [x] Inspect seed behavior: subjects, modules, topics, formulas, and questions upsert;
  no delete/reset paths.
- [ ] Commit and push a dedicated feature branch; prepare PR to documented production
  branch `main`, without merging.
- [ ] Wait for Ready production deployment before any Neon production writes.
- [ ] Verify Neon backup/identity, seed safely, verify rows read-only, and confirm live
  lesson/practice availability and Tutor text index.

## Findings and limitations

- `docs/HOSTING.md` documents Vercel Production branch `main` and a Ready deployment
  before production DB writes.
- Local `.vercel` project link and Vercel CLI auth are absent; the live Vercel project,
  deployment status, production DB link, and Neon backup cannot yet be verified here.
- `gh` CLI is absent; PR creation may require the GitHub web UI after push.
- Local `.env` and `.env.hosting.local` exist. Their values were not displayed or used.
- No database, migration, integration, embedding, or production website checks run.

## QA and review

QA: PASS — isolated fresh-main worktree; validator/report/unit checks above; source pack
and generated lesson/question files are staged without edits; all five lesson metadata
records point to `geometry` / `Матрицы и пространство`; `git diff --cached --check` PASS.
The requested educational text review was intentionally omitted.

Review: APPROVE for PR handoff — staged paths are limited to this pack, its receipt,
published files, task log, and recap; no schema/auth/scoring/user-data changes. Live
deployment and production DB acceptance remain BLOCKED pending Vercel access and Ready
deployment evidence.

## Result

Commit: pending
PR: pending
Manual action: create/review/merge PR only after CI; then provide/confirm Ready Production
deployment and Neon production identity/backup before production seed can proceed.
