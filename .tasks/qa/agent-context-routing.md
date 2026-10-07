# Instruction routing — QA and independent review

Date: 2026-10-07. Branch: `dmitrij/chore/agent-context-routing`. Base: `353fa03`.
Scope: instruction/configuration/task documentation only; no application/content/schema changes.

## Metrics (routing QA snapshot, before publication-status updates)

| File | Before | After |
| --- | --- | --- |
| AGENTS.md | 486 lines / 12,699 bytes | 99 lines / 6,475 bytes |
| PROJECT_RECAP.md | 62 lines / 10,716 bytes | 50 lines / 6,591 bytes |

Root lines reduced by 79.6%, bytes by 49.0%. These are file metrics, not a token-consumption benchmark.
Initial inventory: 255 tracked files; generated worktree inventory was not scanned.

## Canonical instruction structure

```text
AGENTS.md                         always-on safety + routing
PROJECT_RECAP.md                  compact navigation cache
agents/
  PM.md, TECH_LEAD.md             complex planning only
  FRONTEND.md, BACKEND.md         corresponding implementation only
  DATABASE.md, CONTENT.md         corresponding implementation only
  QA.md                          acceptance checks / shared check matrix
  REVIEWER.md                    final independent review
.agents/skills/git-task-workflow/
  SKILL.md                       narrow lifecycle trigger / phase router
  references/start.md            state, task recording, branch setup
  references/finalize.md         QA/review, sync, commit, push, PR handoff
```

Role documents no longer repeat full command lists or task templates. Root keeps safety summaries,
while specialized roles/skill own operational details. Historical packs remain preserved,
explicitly reference-only; no active route forces reading them.

## Safety coverage

| Guarantee | Canonical owner / verification |
| --- | --- |
| Informal intake, scope and acceptance criteria | Root; PM for complexity; workflow start task record |
| Tracked-first targeted search; relevant untracked work retained | Root search rules; recap map; independent scenario QA |
| No working/commit/push on main; one task/branch | Root; workflow start |
| No auto-merge; human final merge | Root; workflow finalize |
| No destructive Git/discard/history rewrite without explicit approval | Root; workflow preservation/conflict handling |
| Preserve unrelated/user changes and sensitive file ownership | Root; workflow start/finalize; Tech Lead ownership |
| Exclusive Prisma ownership; immutable shared migrations; no automatic shared DB reset | Root summary; Database operational rules |
| QA and independent review for substantial changes | Root; QA/Reviewer; workflow finalize |
| Actual checks only; required failures cannot be called PASS | Root; QA |
| Status/diff/staged inspection before each commit | Root; workflow finalize explicitly checks staged diff after staging |
| Latest main integration and affected checks after sync | Root; workflow finalize |
| Stable content IDs, correct answers/hints/solutions | Content role |
| No real AI Tutor or secret exposure | Root; Backend data boundaries |
| Compact persistent recap, exact unfinished next step | Root; current recap and task |

## Verification actually performed

- Inline Node assertions: exact generated Next.js block compared to `git show 353fa03:AGENTS.md`, root 80–120 lines, non-main branch, all changed paths within docs allowlist, all local Markdown links/explicit source paths resolve, common typecheck command list owned only by QA. PASS: 13 instruction files, initially 8 local links / 9 after adding QA link, 58 entry-path references, zero application changes.
- `python3 /Users/dmitrijzaharov/.codex/skills/.system/skill-creator/scripts/quick_validate.py .agents/skills/git-task-workflow`: `Skill is valid!`.
- `git diff --check`: PASS.
- Final `git fetch origin` / `git merge origin/main`: Already up to date, base `353fa03`.
- Independent `instruction_qa`: PASS; byte-identical block, path/metric/scope checks and six routing/safety scenarios.
- Independent `instruction_review`: APPROVE; no BLOCKER/MAJOR. Fixed MINOR stale recap metric (97→99) and NOTE staged-check ordering. Final confirmation approved QA evidence; later recap byte metrics labeled as earlier snapshot, escaped ticks corrected.

## Independent routing scenarios

| Request | Minimal reading / verification plan confirmed by QA |
| --- | --- |
| Tiny profile UI label | Root/recap once, Frontend, matching component/tests and exact relevant Next.js guide; no PM/DB/Content/QA/Reviewer bundle |
| Read-only Telegram diagnosis | Backend + targeted auth/origin evidence; no implementation/publication or content master; dev-auth not proof of real login |
| Substantial practice API retry fix | Backend + workflow start + relevant master sections; targeted retry/integration checks, then relevant QA/review and workflow finalize |
| One-topic question expansion | Content + master sections + expansion progress + assigned questions/validators; validate answers/IDs, content tests; no whole-bank read or default app build |
| Migration while another task owns schema | Database detects conflicting ownership and stops before competing migration; no reset/rewrite |
| Finish with unrelated dirty and relevant untracked files | Inspect new relevant work; preserve unrelated files; stage explicit owned paths; safe sync, staged inspection and proportionate QA/review |

## Limitations / omitted checks

App unit/integration/E2E tests, lint, typecheck, production build and Prisma/seed commands were not run:
the final diff changes instructions/documentation only. No runtime behavior is claimed verified.
Skills location/progressive disclosure confirmed using official documentation and installed CLI 0.158.0:
https://learn.chatgpt.com/docs/build-skills. Automatic discovery in a fresh session was not benchmarked;
root includes a direct-path fallback. No measured token/latency benchmark, only file-size and routing evidence.
Unrelated `.idea/`, env, generated directories and application code remain untouched.

## Publication handoff

Implementation `abca807` committed/pushed; PR #6 open into main, merged=false (API confirmed).
Closure task/recap documentation is a separate logical batch; instruction checks repeated before its commit.
Local handoff `9bb889b` could not be pushed: three GitHub Internal Server Error responses;
remote-ref check still showed `abca807`. Task was kept active with publication blocker and exact retry step.
No force push, auth changes or application edits attempted. Core instruction implementation/QA is already in PR #6.

Publication recovery: ordinary push successfully sent `9bb889b` and `6b99568`; local/remote matched.
Only stale publication status/task location updated; root, roles and skill implementation unchanged.
