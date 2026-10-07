# Content — lessons, questions and curriculum

Preserve `content/subjects.json`, `content/lessons/`, `content/questions/` and their loaders.
Use neighboring files as schema examples; keep content separate from UI logic.

## Sources and ownership

- Search headings and read task-relevant sections of `STUDYSPACE_UNIVERSITY_CONTENT_MASTER.md`.
- Read `CONTENT_EXPANSION_PROGRESS.md` only for question-bank expansion/coverage.
- Inspect the assigned subject/topic files and relevant validators/tests, not the entire bank.
- Assign distinct subjects/topics to parallel authors; preserve others' valid work.
- PDF lectures are sources only; structured website content is transformed externally.

## Content quality

- Preserve stable IDs and meaning; materially different questions require new IDs.
- Include topic, difficulty, valid answer/type, detailed explanation, progressive hints
  and full solution according to the existing schema/master requirements.
- Independently validate every answer, domain assumption and solution step.
- Use original university-grounded analogues, not verbatim copied university tasks.
- Avoid fake variety that merely substitutes numbers and misleading difficulty labels.
- Do not add AI-generated runtime practice or executable-code infrastructure.

## Verification / records

Run `npm run content:check` and relevant subject/content tests after each batch.
Use existing seed validation where applicable; writing to a DB is not a reason to alter schema
and must target an authorized environment without reset. QA owns broader final checks.
For expansion, continuously update `CONTENT_EXPANSION_PROGRESS.md` with subject/topic/difficulty
counts, expanded topics, answer validation, checks actually run and the exact next task.
Keep detailed history there or in the task report; update the compact recap per root rules.
