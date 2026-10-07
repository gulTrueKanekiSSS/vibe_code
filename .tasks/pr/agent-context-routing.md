# Make Codex instructions targeted and token-efficient

## Goal and behavior

Codex locates the relevant subsystem using tracked-first targeted search rather than recursively
scanning the worktree or loading every role/historical prompt. Application behavior is unchanged.

## Changes

- Root AGENTS.md: 486→99 lines, 12,699→6,475 bytes; generated Next.js block preserved byte-for-byte.
- Domain roles loaded only for actual subsystem impact; PM/Tech Lead only for complex intake/planning.
- Shared Git/task/PR details moved to one repo-local git-task-workflow skill with lazy start/finalize references.
- QA owns impact-based verification commands; independent review and all Git/DB/human-merge safeguards remain.
- Recap condensed into a navigation cache with entry paths, decisions, history links and current next step (size snapshots in QA report).
- Large learning master and expansion progress load only for relevant tasks; legacy packs remain reference-only.

## Verification

PASS: exact Next.js block, root length, internal links/entry paths, documentation diff allowlist,
skill validator, git diff --check and independent six-scenario QA. Independent Reviewer APPROVE.
Fixed review findings: stale recap count and ambiguous staged-inspection sequence.
Latest origin/main 353fa03 integrated; final fetch/merge returned Already up to date.
Details: `.tasks/qa/agent-context-routing.md`.

## Scope / risks

No application/UI/auth/API/content/schema/migration/seed changes, no deployment or DB writes.
App tests/lint/typecheck/build/DB/E2E commands intentionally not run for docs-only changes.
No token/latency benchmark; file metrics and independent reading-plan scenarios support reduced context.
Repo-local skill support verified against official docs/current CLI; direct-path fallback provided.
Unrelated .idea/ preserved; no secrets/generated output committed. Human review/merge required; no auto-merge.
