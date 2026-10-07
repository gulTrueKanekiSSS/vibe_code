<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# StudySpace — routing and always-on rules

Accept informal Russian/English. Normalize the goal, scope and acceptance criteria internally.
Inspect evidence before asking; ask only about a genuinely unresolved product decision.
Follow task authority: diagnosis/review does not authorize implementation or external writes.

## Search first, read second

1. Read `PROJECT_RECAP.md` once before project discovery; verify status, branch and recent changes.
2. Treat git-tracked files as the primary project scope: use `git ls-files` or pathspecs.
3. Locate symbols/paths before opening files, e.g.:

   - `git ls-files 'src/components/*practice*' 'tests/*practice*'`
   - `git grep -n -e 'startPractice' -- src tests integration e2e`
   - `rg -n 'symbol' src/lib tests` (explicit relevant directories only).

4. Read matched sections, call sites and nearby tests; expand scope gradually if nothing matches.
5. Inspect relevant untracked/modified paths reported by Git; tracked-first does not mean ignoring new work.
6. Never default to `find .`, root recursive listings, root `rg --files`, or reading many files for orientation.
7. Do not broadly scan `node_modules`, `.next`, build/dist/coverage/cache directories.
   The exact Next.js guide needed by the generated block above is an exception, not a directory scan.
8. Reuse already-read, unchanged instructions in this session; refresh them when their diff changes.
   The recap is a navigation cache, not proof that current code or checks are correct.

## Load only the relevant route

Read the selected role completely, not all roles. Cross-boundary tasks add only affected roles.
A clear single-subsystem task needs neither PM nor Tech Lead by default.

| Task / stage | Instruction | Primary area |
| --- | --- | --- |
| Frontend/UI | `agents/FRONTEND.md` | `src/app/`, `src/components/` |
| Backend/API/auth/services | `agents/BACKEND.md` | `src/app/api/`, `src/lib/` |
| Prisma/schema/migrations/seed changes | `agents/DATABASE.md` | `prisma/` |
| Lessons/questions/curriculum | `agents/CONTENT.md` | `content/`, content loaders |
| Complex/ambiguous intake | `agents/PM.md` | task acceptance/scope |
| Complex cross-workstream planning | `agents/TECH_LEAD.md` | ownership/dependencies |
| QA stage of substantial work | `agents/QA.md` | relevant tests/acceptance evidence |
| Final independent review | `agents/REVIEWER.md` | final diff and QA evidence |

Detailed entry points are in the recap; search `package.json`/README sections for commands/setup.
Do not reread the whole README for a small task.

### Large documents are conditional

- Learning/content/practice/curriculum/mastery/XP/GPA/question-generation impact:
  search headings and read relevant sections of `STUDYSPACE_UNIVERSITY_CONTENT_MASTER.md`.
- Question-bank expansion: additionally read `CONTENT_EXPANSION_PROGRESS.md`.
- Other large prompts/reports: only when explicitly requested or needed for the current task.
- `AGENTS_STUDYSPACE_MERGED.md`, `CODEX_WORKFLOW.md`, `AI_COMPANY_WORKFLOW.md` and
  pack/example documents are historical/reference material, not an extra always-loaded policy.

## Task lifecycle

For substantial implementation or explicit branch/PR work, use the `git-task-workflow` skill:
`.agents/skills/git-task-workflow/SKILL.md`. Load only its current-stage reference.
If discovery has not refreshed in this session, read that path directly; do not scan other skills.
It owns task files, branch setup, sync, commits and PR details.
For tiny fixes, abbreviate planning; the safety rules below still apply.
QA and independent review remain mandatory for substantial changes, at those stages only.
Use separate agents when available; otherwise explicitly switch roles for independent passes.
A task is complete only after required verification/review and authorized commit/push/PR handoff,
or report the blocker and exact next step without claiming completion.

## Always-on safety

- One task = one dedicated branch/worktree; never implement, commit or push directly on `main`.
- Never auto-merge a PR. The human performs the final merge.
- Preserve others' local changes and unrelated code; do not reset/revert unfamiliar work.
- No destructive Git operations without explicit human approval:
  `git reset --hard`, `git clean -fd`, force pushes (including with-lease),
  `git checkout -- .`, `git restore .`, or equivalent discarding/history rewrites.
- Inspect `git status`, `git diff` and `git diff --staged` before every commit.
- Never expose or commit env files, credentials, private keys/user data, local DBs, logs or build output.
- Integrate latest `origin/main` before completing substantial work; rerun affected checks after sync.
- Do not redesign stable architecture or alter auth/deployment/secrets strategy outside task scope.
- Shared sensitive files have one owner; parallelize only independent workstreams.
- Prisma schema/migrations require exclusive ownership. Stop that workstream if another task owns it.
  Shared migrations are immutable; never reset a shared DB automatically. Details: Database role.
- AI Tutor remains `Coming soon`: no LLM SDK/API/keys/endpoints/chat storage/runtime AI practice.

## Verification and persistent recap

Start with relevant checks, not every suite. The QA role owns the final impact-based check matrix.
Never claim checks passed unless actually run successfully on this tree; report skipped checks/blockers.
After each completed logical batch, update `PROJECT_RECAP.md` before handing work back:
date/task/branch/base, changed paths, decisions, actual checks, limitations and exact next step.
Keep it compact; preserve others' valid entries; link detailed task/content reports instead of logs.
Do not turn the recap into a history dump, shared task counter or queue; never include secrets.
