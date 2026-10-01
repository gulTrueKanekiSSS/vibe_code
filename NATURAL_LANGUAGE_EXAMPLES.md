# NATURAL_LANGUAGE_EXAMPLES.md

After installing this pack, you can talk to Codex normally.

## Bug

```text
когда обновляю страницу во время практики она начинается заново, почини
```

Expected internal behavior: normalize bug → inspect PracticeSession → define resume/idempotency acceptance criteria → implement → integration/E2E regression → QA → review → PR.

## Feature

```text
хочу после практики видеть где я чаще всего ошибался
```

Expected internal behavior: inspect existing practice summary/progress → define visible metrics without inventing unrelated analytics → plan frontend/backend work → QA → review → PR.

## Content

```text
добавь реально сложных задач по матрицам, а то текущие слишком одинаковые
```

Expected internal behavior: inspect current AGLA matrix bank → inspect master university specification → measure current coverage/templates → add varied Hard/Challenge questions → validate every answer/solution → update progress → QA → PR.

## Vague UX request

```text
страница профиля выглядит пустовато, сделай лучше
```

Codex should inspect the existing profile and visual language first. If there are materially different product directions, ask one concise product question before a large redesign.

## Failure report

```text
телеграм логин не работает через ngrok
```

Codex should reproduce/inspect logs/config first and distinguish environment/configuration problems from application bugs. It must not rewrite auth without evidence.
