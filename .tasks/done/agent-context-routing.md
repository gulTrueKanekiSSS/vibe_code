# Token-efficient agent instruction routing

Status: DONE
Branch: dmitrij/chore/agent-context-routing
Owner: dmitrij / Codex

## Original Request

Optimize agent instructions for targeted discovery and conditional reading; retain safety guarantees and do not change the application.

## Goal / User Story

Codex finds the relevant subsystem quickly without scanning generated dependencies or loading every role and historical prompt.

## Current Problem / Expected Behavior

The root instructions contain 486 lines / 12,699 bytes; the recap has 62 dense lines / 10,716 bytes. Only 255 files are tracked. Replace repeated policy with short routing and stage-specific instructions.

## Scope / Out of Scope

Agent instructions, focused repo-local workflow skill, compact recap and task/QA/PR documentation only.
No application/UI/auth/API, schema/migrations/seed, content bank, deployment or dependencies.
Preserve unrelated untracked .idea/.

## Acceptance Criteria

- [x] Root AGENTS.md is 80–120 lines and its generated Next.js block is byte-identical.
- [x] Tracked-first, search-before-read discovery avoids broad generated-directory scans.
- [x] Conditional role/large-document routing avoids loading all roles for small tasks.
- [x] Git, DB concurrency, QA/review and human-merge safeguards are preserved.
- [x] Compact recap retains useful paths, decisions, report links and exact next step.
- [x] Repo-local workflow skill is supported, narrowly scoped and validated.
- [x] Documentation QA and independent review pass; no application paths changed.
- [x] Latest main integrated, all previously blocked commits pushed, PR prepared without merging. Publication recovered; final status recorded in a documentation-only handoff commit.

## Repository Findings

Base origin/main 353fa03; previous PR #5 merged by human. Initially on its former task branch.
255 tracked files inspected; no .agents/skills existed. Current Codex CLI 0.158.0 and official docs support that location and progressive disclosure.
README, recap, root and all eight roles inspected without recursive worktree scanning.

## Technical Plan / Ownership

Codex owns docs: root safety/navigation; domain roles; one stage-routed Git skill; compact recap.
Separate QA and Reviewer agents verify scope, routing and safety.
No Database/Frontend/Backend/Content implementation workstreams.

## Risks

Lost safety rules, stale recap, overbroad skill triggers, unconditional legacy routing, accidental application changes.

## Test Plan

Exact Next.js-block comparison, line/size/path/scope checks, skill validator, representative routing/safety scenarios and independent review.
Application tests/build/migrations are inapplicable to documentation-only changes.

## Implementation Log

- 2026-10-07: fetched main, created dedicated branch from 353fa03; reorganized domain roles and root routing.
- Resumed safely after interruptions: inspected Git/diff and process state; no pending writer found. Preserved ready changes and unrelated .idea/.
- Completed skill and compact recap; fixed QA/review findings and validated instructions. Root now 99 lines / 6,475 bytes.

## QA Result

PASS — independent instruction_qa, six routing/safety scenarios; structural/path/scope assertions and canonical skill validator PASS. Details: `.tasks/qa/agent-context-routing.md`. App checks inapplicable, not run.

## Review Result

APPROVE — independent instruction_review; no BLOCKER/MAJOR. MINOR stale recap metric and NOTE staged-check ordering fixed.

## Sync With Main

Initial/final base 353fa03. Final fetch/merge on 2026-10-07: Already up to date; no conflicts. Documentation checks repeated after fixes/sync.

## Result

Implementation commit `abca807` pushed to origin/dmitrij/chore/agent-context-routing.
PR: https://github.com/gulTrueKanekiSSS/vibe_code/pull/6 — open, merged=false, confirmed via API.
Publication recovered: ordinary push sent `9bb889b` and `6b99568`; local/remote branch matched at `6b995681c15def37ce0d14420ba7bf0ccfa1c6c8`. No force/auth/history changes or repeated optimization.
Exact next step: human review and optional human merge of PR #6; no unfinished implementation. Final publication-status documentation is committed on the same branch.
Known limitations: no measured token benchmark or fresh-session skill-discovery benchmark; direct-path fallback provided. No application/runtime behavior changed or claimed tested.
