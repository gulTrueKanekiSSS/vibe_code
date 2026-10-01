# StudySpace AI Company Pack

Copy these files into the StudySpace repository:

```text
AGENTS.md
AI_COMPANY_WORKFLOW.md
NATURAL_LANGUAGE_EXAMPLES.md
TASK_TEMPLATE.md
agents/
  PM.md
  TECH_LEAD.md
  FRONTEND.md
  BACKEND.md
  DATABASE.md
  CONTENT.md
  QA.md
  REVIEWER.md
.github/
  pull_request_template.md
.tasks/
  active/
  done/
```

Keep the existing project `README.md`.

The generated `AGENTS.md` preserves the current Next.js agent block and adds company-style orchestration/collaboration rules.

After copying, commit the pack through a branch/PR so both developers pull the same rules.

Then you can give Codex ordinary-language requests, for example:

```text
сделай чтобы практика не сбрасывалась после обновления
```

Codex should normalize, plan, implement, QA, review, push, and prepare a PR.

Final merge remains human-controlled.
