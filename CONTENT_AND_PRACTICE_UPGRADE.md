# University Learning Platform — Theory & Practice Upgrade

## 1. Role and Task

You are continuing development of an existing University Learning Platform.

The existing application already contains subjects, topics, theory pages, practice, progress tracking, XP, mastery, Practice GPA, leaderboard, Telegram authentication and other functionality.

This task is NOT a redesign of the entire application.

The goal of this task is to significantly improve two areas:

1. educational theory/content;
2. the practice system.

The updated platform should provide deeper explanations, stronger university-level problems, meaningful difficulty levels and a flexible system allowing the student to build their own practice session.

The core learning flow remains:

**Learn → Understand → Practice → Make mistakes → Review → Improve → Master**

---

# 2. Important Constraints

Do NOT:

- rewrite the application from scratch;
- redesign unrelated pages;
- replace the current stack without a strong reason;
- change authentication unless required to fix an actual bug;
- add a real AI Tutor;
- add LLM APIs;
- add AI-generated practice;
- add AI solution checking;
- remove existing good educational content;
- unnecessarily rename existing topic IDs/slugs;
- unnecessarily delete existing questions that may already be referenced by user progress.

The AI Tutor must remain only a disabled `Coming soon` placeholder.

Preserve existing user progress and database compatibility where practical.

---

# 3. Recovery / Inspection First

Before implementing changes:

1. Inspect the current repository.
2. Inspect existing subject/module/topic structure.
3. Inspect existing MDX educational content.
4. Inspect the current question bank.
5. Inspect the PracticeSession implementation.
6. Inspect the current start-practice flow.
7. Inspect scoring, mastery and Practice GPA logic.
8. Inspect practice history.
9. Identify content that is currently too shallow.
10. Identify topics with too few questions.
11. Identify topics where most questions are only EASY.
12. Identify duplicate questions that differ only by numbers.
13. Identify practice buttons or flows that are incomplete or unreliable.
14. Preserve valid existing functionality.

Do not blindly regenerate the entire content library.

---

# 4. Educational Goal

The website must not behave like a collection of lecture notes.

Each topic should help the student move through multiple levels of understanding:

**Intuition → Definition → Why it works → Example → Application → Mistakes → Connections → Practice → Advanced reasoning**

The student studies university subjects in English but understands difficult concepts more easily in Russian.

Therefore:

- explanations should primarily be written in clear Russian;
- important academic terminology must be shown in English;
- formulas must use standard mathematical notation;
- C programming code remains in English;
- formal definitions should still be present;
- university terminology must not be removed in favor of oversimplification.

Correctness is more important than simplicity.

---

# 5. Theory Expansion

Existing major topics should be significantly improved.

Do not simply add more paragraphs.

The goal is not "more text".

The goal is **more levels of understanding**.

For important topics, support the following structure where relevant:

## Что это?

Give an intuitive introduction.

Explain what the idea means before introducing formal notation.

---

## Интуиция

Use a mental model or simple interpretation.

Example:

For vector projection:

> Представь, что вектор `b` задаёт направление.  
> Мы хотим узнать, какая часть вектора `a` направлена вдоль `b`.

---

## Formal Definition

Provide the correct university-level definition.

Clearly distinguish intuitive explanation from formal definition.

---

## Why do we need it?

Explain:

- what problem the concept solves;
- where it is used;
- why it appears in the course;
- which later topics depend on it.

---

## English Terminology

Important terms should appear in both languages.

Example:

| English | Russian |
|---|---|
| dot product | скалярное произведение |
| magnitude | длина / модуль |
| projection | проекция |
| orthogonal | ортогональный / перпендикулярный |

---

## Formula / Rule

Render mathematics properly using the existing math system.

Do not only display a formula.

Explain:

- each variable;
- each symbol;
- what the formula returns;
- when it can be used;
- when it cannot be used.

---

## Why does it work?

For important formulas, explain the reasoning or derivation when it adds educational value.

Examples:

- vector projection from dot product;
- determinant and geometric meaning;
- pointer arithmetic and `sizeof(element)`;
- supremum from upper-bound definitions;
- NAND implementations from Boolean identities.

Do not force formal derivations where they would add unnecessary complexity.

---

## Worked Example 1 — Basic

Show a straightforward application.

Show intermediate steps.

---

## Worked Example 2 — University / Tutorial Level

Use a less obvious example that requires choosing the method.

---

## Worked Example 3 — Common Trap

Show a situation where students often make mistakes.

Explain why the wrong approach fails.

---

## Common Mistakes

Provide concrete mistakes.

Bad:

> Be careful with the formula.

Better:

> В знаменателе используется `||b||²`, а не `||b||`.

---

## Connections to Other Topics

Show useful conceptual relationships.

Example:

```text
Dot Product
    ↓
Angle Between Vectors
    ↓
Orthogonality
    ↓
Projection
    ↓
Orthogonal Component