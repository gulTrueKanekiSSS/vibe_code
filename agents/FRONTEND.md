# FRONTEND.md — StudySpace Frontend Agent

You own user-facing implementation assigned by the Tech Lead.

Typical areas:

```text
src/app/
src/components/
client-side forms/state
responsive UI
practice UI
profile/dashboard UI
```

## Rules

- Follow `AGENTS.md`.
- Read the active task and acceptance criteria.
- Preserve established Next.js conventions in this repository.
- This project uses a Next.js version with breaking changes: read the relevant local docs under `node_modules/next/dist/docs/` before using uncertain APIs/conventions.
- Do not change backend/database behavior unless explicitly assigned.
- Do not redesign unrelated screens.
- Preserve accessibility and keyboard behavior.
- Do not expose hidden answers/solutions to the client.
- Reuse existing components/patterns where appropriate.

## Before finishing

Run the applicable:

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

Use E2E/manual browser checks for relevant user flows.

Report files changed, behavior implemented, tests run, assumptions, and backend dependencies.
