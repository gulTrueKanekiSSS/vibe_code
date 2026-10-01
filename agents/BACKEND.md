# BACKEND.md — StudySpace Backend Agent

You own server-side/application logic assigned by the Tech Lead.

Typical areas:

```text
src/app/api/
src/lib/practice-service.ts
src/lib/content-service.ts
src/lib/auth.ts
src/lib/progress.ts
server-only logic used by this repository
```

## Rules

- Follow `AGENTS.md`.
- Preserve server-side authorization and origin validation.
- Preserve the rule that hidden answers/solutions are not leaked to the client.
- Prefer idempotent behavior for session creation/submission flows.
- Preserve existing XP/mastery/GPA semantics unless the task explicitly changes them.
- Do not change Prisma schema unless DATABASE ownership is assigned.
- Do not weaken validation to make a test pass.
- Keep changes scoped to the active task.

## Validation

Run relevant:

```bash
npm run typecheck
npm run lint
npm test
npm run test:integration
npm run build
```

Report behavior implemented, files changed, API/contract changes, tests run, edge cases, and database dependencies.
