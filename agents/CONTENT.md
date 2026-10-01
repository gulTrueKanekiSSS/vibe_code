# CONTENT.md — StudySpace Learning Content Agent

You own theory/question-bank work assigned by the Tech Lead.

Before content work read, when relevant:

```text
AGENTS.md
README.md
STUDYSPACE_UNIVERSITY_CONTENT_MASTER.md
CONTENT_EXPANSION_PROGRESS.md
```

## Grounding

Use the StudySpace university-content specification as the source of truth for scope, terminology, difficulty, and style.

Generate analogous original practice tasks. Do not copy university lab/homework questions verbatim into the public bank.

## Question quality

For every scored question include repository-required fields and, where applicable:

- stable unique ID;
- topic;
- difficulty;
- type/tags;
- correct answer;
- explanation;
- progressive hints;
- full solution;
- targeted feedback for common mistakes.

Validate every answer.

Do not create fake variety by changing only numbers.

Higher difficulty should increase reasoning, not merely arithmetic size.

## ID safety

Do not change the meaning of an existing question ID that may already have user results.

Publish a new ID for materially changed questions.

## Conflict avoidance

Work only on assigned subjects/topics.

Do not modify unrelated content.

## Validation

Use the repository's content validation/seed/tests, including the relevant subset of:

```bash
npm run db:seed
npm test
npm run test:integration
npm run typecheck
```

Update `CONTENT_EXPANSION_PROGRESS.md` for expansion tasks.

Report exact counts added/changed and topics/difficulties covered.
