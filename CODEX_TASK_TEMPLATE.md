# CODEX_TASK_TEMPLATE.md

Copy one of these blocks into a new Codex task/chat.

## General Feature Task

```text
You are working on StudySpace in parallel with another developer and another Codex agent.

First read:
- AGENTS.md
- STUDYSPACE_UNIVERSITY_CONTENT_MASTER.md if relevant to this task
- CONTENT_EXPANSION_PROGRESS.md if this is content/question-bank work

Follow AGENTS.md strictly.

Task:
<WRITE THE TASK HERE>

Before editing:
1. run git status;
2. identify the current branch;
3. git fetch origin;
4. confirm you are NOT working directly on main;
5. inspect the relevant implementation and tests.

Keep the change scoped to this task.
Do not modify unrelated files.
Do not revert work that you did not create.

When implementation is complete:
1. run relevant tests;
2. run lint/type checks/build where applicable;
3. git fetch origin;
4. merge origin/main into the task branch;
5. resolve any conflicts carefully while preserving valid changes from both sides;
6. rerun relevant checks;
7. inspect git diff;
8. commit with a descriptive message;
9. push the feature branch;
10. create a Pull Request into main.

Do NOT merge the Pull Request.

At the end report:
- branch name;
- files changed;
- commits created;
- tests/checks run;
- whether origin/main was integrated;
- conflicts resolved, if any;
- PR link/status;
- any risks or follow-up work.
```

## Content Expansion Task

```text
Continue StudySpace content expansion.

Read:
- AGENTS.md
- STUDYSPACE_UNIVERSITY_CONTENT_MASTER.md
- CONTENT_EXPANSION_PROGRESS.md

Follow AGENTS.md strictly.

Work only on:
<WRITE SUBJECT/TOPICS HERE>

Do not edit unrelated subjects.

Use the university-grounded curriculum in the master specification.
Generate new analogous tasks; do not copy university lab questions verbatim.

For every new scored question include:
- topic;
- difficulty;
- type/tags;
- correct answer;
- explanation;
- hints;
- full solution where relevant.

Avoid fake numeric variation.
Validate every answer.

Before finishing:
- update CONTENT_EXPANSION_PROGRESS.md;
- run content/schema validation;
- run relevant tests;
- fetch and merge origin/main;
- resolve conflicts carefully;
- rerun validation;
- commit;
- push;
- create a Pull Request.

Do NOT merge the Pull Request.
```

## Prisma / Database Task

```text
You are assigned ownership of the StudySpace database/schema change for this task.

Read AGENTS.md first.

Task:
<WRITE DATABASE TASK HERE>

Before changing Prisma:
1. git fetch origin;
2. inspect origin/main changes to prisma/schema.prisma and prisma/migrations/;
3. verify there is no known competing active migration;
4. inspect current migration status.

Do not delete or rewrite migrations already present in origin/main.

After implementation:
- run npx prisma validate;
- run relevant migration/status commands;
- run application tests;
- run production build if practical;
- merge latest origin/main into this branch;
- resolve conflicts carefully;
- rerun validation/tests;
- commit;
- push;
- create a PR.

Explicitly document every migration in the PR.

Do NOT merge automatically.
```
