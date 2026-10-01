# AI_COMPANY_WORKFLOW.md

After installing this pack, you should be able to talk to Codex normally.

Example:

```text
после обновления страницы практика начинается заново, исправь
```

You should not need to specify files, endpoints, tests, or Git commands.

Internal workflow:

```text
You
↓
PM / Intake
↓
Task specification
↓
Tech Lead
↓
Workstreams
├─ Frontend
├─ Backend
├─ Database
└─ Content
↓
QA
↓
Reviewer
↓
Pull Request
↓
Human merge
```

Roles:

- `agents/PM.md` — converts informal requests into product tasks.
- `agents/TECH_LEAD.md` — inspects the repo and plans safe implementation.
- `agents/FRONTEND.md` — UI/client work.
- `agents/BACKEND.md` — server/API/business logic.
- `agents/DATABASE.md` — exclusive Prisma/migration owner.
- `agents/CONTENT.md` — lessons/questions/learning content.
- `agents/QA.md` — verifies acceptance criteria and regressions.
- `agents/REVIEWER.md` — independently reviews the final diff.

Both developers must use the same committed `AGENTS.md`, `agents/`, and `TASK_TEMPLATE.md`.

Each task uses a separate branch/worktree.

Only one active task may own Prisma/schema/migrations at a time.

Final PR merge remains human-controlled.

Recommended first message in a new Codex session:

```text
Read AGENTS.md and follow the StudySpace AI Company workflow.
I will describe tasks informally. Normalize them, plan them, implement them,
run QA/review, push the task branch, and prepare a PR. Do not merge into main.
```

After that, ordinary Russian/English is enough.
