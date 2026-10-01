# Resume Development — University Learning Platform

The previous Codex session was interrupted because the usage limit was reached.

You are continuing an existing implementation.

Do **not** assume the previous task failed completely.

Your first responsibility is to inspect the repository and determine exactly what has already been implemented before making additional changes.

---

# 1. Recovery First

Before writing code:

1. Inspect the repository structure.
2. Inspect `git status` / current worktree state.
3. Inspect package configuration and installed dependencies.
4. Inspect existing database/schema files.
5. Inspect existing routes/pages/components.
6. Inspect content files.
7. Inspect tests.
8. Identify unfinished, duplicated, partially written, or broken files that may have resulted from the interrupted session.
9. Determine which requirements from this document are already implemented.
10. Preserve valid existing work.

Do NOT:

- reset the repository;
- revert all changes;
- recreate files that already work;
- duplicate components;
- duplicate migrations;
- reinstall/change the stack without a reason;
- blindly restart the project from scratch.

Fix incomplete work where necessary and then continue from the actual current state.

---

# 2. Product Goal

Build a university learning platform for a student who studies technical subjects in English but understands difficult concepts more easily when they are explained in Russian.

This must NOT be merely a website containing lecture notes.

The core learning flow is:

**Learn → Practice → Progress → Review → Compete**

The application should help the user understand:

- what they have studied;
- what they understand;
- what they struggle with;
- what they should practice next.

---

# 3. Subjects

The initial subjects are:

1. Computer Architecture
2. Analytical Geometry and Linear Algebra
3. Mathematical Analysis
4. Introduction to Programming
5. Logic and Discrete Mathematics

The architecture must allow additional subjects later without rewriting application logic.

---

# 4. Main Navigation

The main application should contain:

```text
Dashboard
Subjects
Practice
Formula Book
Progress
Leaderboard
Profile
```

Settings may live inside Profile.

---

# 5. Important Change: No AI Tutor in V1

A real AI Tutor must **NOT** be implemented in this version.

Do NOT add:

- OpenAI or another LLM SDK;
- AI API keys;
- LLM backend endpoints;
- AI conversations;
- chat database tables;
- AI-generated questions;
- solution checking using AI;
- prompt infrastructure.

Topic pages may contain only a visual placeholder:

```text
AI Tutor

Ask questions about this topic and get guided explanations.

Coming soon

[ Ask AI ] disabled
```

It may optionally show disabled example actions:

```text
Explain simpler
Give another example
Quiz me
Check my solution
```

Do not spend significant engineering effort on future AI functionality.

Leave only enough UI space so a real tutor can replace the placeholder later.

---

# 6. Educational Content Source

The original university material exists primarily as PDF lecture files.

The PDFs will NOT be parsed by the application in V1.

Instead, PDF lectures will be manually transformed externally into structured website content.

The website must therefore make it extremely easy to add prepared educational content.

For V1, use Markdown/MDX files.

Recommended structure:

```text
/content

  /computer-architecture
    /number-systems
    binary-basics.mdx
    bitwise-operations.mdx

  /analytical-geometry
    vectors.mdx
    dot-product.mdx
    vector-projection.mdx
    determinants.mdx

  /mathematical-analysis
    real-numbers.mdx
    upper-lower-bounds.mdx
    supremum-infimum.mdx
    completeness.mdx

  /programming
    arrays.mdx
    pointers.mdx
    pointer-arithmetic.mdx
    structs.mdx
    malloc.mdx
    function-pointers.mdx

  /discrete-math
    propositions.mdx
    quantifiers.mdx
    direct-proof.mdx
    contradiction.mdx
```

Exact folder structure may be improved if necessary.

The important requirement is:

> Adding a new lecture/topic should normally require adding a content file and associated question/formula data, not modifying React application logic.

---

# 7. Content Service

Do not make pages directly depend on arbitrary filesystem logic scattered across the application.

Create a clean content layer/service.

Conceptually it should provide operations similar to:

```ts
getSubjects()
getSubject(slug)
getModules(subjectSlug)
getTopics(subjectSlug)
getTopic(subjectSlug, topicSlug)

getTopicFormulas(topicId)
getTopicQuestions(topicId)

searchContent(query)
```

Names and implementation may differ.

The purpose is to isolate content storage from presentation.

Today the implementation may load MDX/files.

A future implementation may load content from PostgreSQL or an admin CMS.

Do NOT over-engineer this abstraction.

---

# 8. Topic Metadata

Each topic should contain structured metadata.

Suggested MDX frontmatter:

```yaml
title: "Vector Projection"
slug: "vector-projection"

subject: "analytical-geometry"
module: "vectors"

order: 4

difficulty: "STANDARD"
estimatedMinutes: 15

prerequisites:
  - dot-product
  - vector-length

tags:
  - vectors
  - projection
```

Additional useful metadata may be added.

---

# 9. Lecture Content Style

This is extremely important.

Do not write content like a copied academic textbook.

The student learns at university in English but needs concepts explained clearly in Russian.

Use:

**Russian explanation + English terminology**

Example:

```text
Скалярное произведение (dot product) — это операция,
которая помогает понять, насколько два вектора направлены
в одну сторону.
```

Technical English vocabulary must remain visible.

---

# 10. Recommended Topic Structure

Topics should support sections like:

```text
Название темы

Что это?
Интуиция
Зачем это нужно?
Formal definition
English terminology
Formula
Почему формула работает?
Worked example
Common mistakes
How your professor may say it
Summary
Mini quiz
Practice this topic
AI Tutor — Coming soon
```

Not every topic requires every section.

---

# 11. English Terminology

Topics should help bridge Russian understanding and English university lectures.

Example:

```text
English terminology

dot product
→ скалярное произведение

magnitude
→ длина / модуль вектора

projection
→ проекция

orthogonal
→ ортогональный / перпендикулярный
```

Also support:

```text
How your professor may say it

"For every epsilon greater than zero..."

Что это значит:

"Для любого ε > 0 ..."
```

---

# 12. Mathematical Rendering

Use proper mathematical rendering with KaTeX, MathJax, or another suitable solution.

Example content:

```md
$$
\operatorname{proj}_{b}(a)
=
\frac{a \cdot b}{\|b\|^2} b
$$
```

Long formulas must behave correctly on mobile.

---

# 13. Programming Content

Introduction to Programming primarily uses **C**.

Code blocks must have syntax highlighting.

Educational material should cover topics such as:

```text
Variables
Operators
Bitwise operators
Arrays
Strings
Pointers
Pointer arithmetic
Pointers and arrays
Structs
malloc / dynamic memory
Function pointers
```

Pointer explanations may use simple memory diagrams.

Example:

```text
p ─────────► x
             10
```

Do not implement arbitrary server-side C execution in V1.

---

# 14. Topic Status

Opening a topic must not mean that the topic is mastered.

Use states equivalent to:

```text
NOT_STARTED
LEARNING
PRACTICED
MASTERED
```

Suggested meaning:

### NOT_STARTED

No meaningful interaction.

### LEARNING

User began studying the topic.

### PRACTICED

User completed enough scored practice.

Suggested default:

```text
at least 3 scored questions
```

### MASTERED

Topic reaches the configured mastery threshold.

Suggested:

```text
95 / 100
```

---

# 15. Practice System

Practice is a primary product feature.

Support:

```text
Quick Practice
Daily Practice
By Subject
By Topic
Weak Topics
Exam Mode
```

---

# 16. Question Types

The question model must be extensible.

Support at least:

```text
NUMERIC
SHORT_TEXT
MULTIPLE_CHOICE
MULTIPLE_SELECT
TRUE_FALSE
STEP_BASED
PROGRAM_OUTPUT
FIX_CODE
CONCEPTUAL
```

Exact enum names may differ.

Programming questions must support code blocks.

Mathematical questions must support formulas.

---

# 17. Difficulty

Practice questions use approximately:

```text
EASY
MEDIUM
HARD
CHALLENGE
```

Meaning:

### EASY

Direct formula/definition application.

### MEDIUM

Student must choose the correct method.

### HARD

Multi-step reasoning.

### CHALLENGE

Several concepts must be combined.

---

# 18. Progressive Hints

Normal practice should not immediately show the full solution.

Use progressive help:

```text
Small Hint
Formula Hint
Explain Approach
Full Solution
```

Example:

Question:

```text
Find proj_b(a)
```

Small hint:

```text
Сначала найди a · b.
```

Formula hint:

```text
proj_b(a) = ((a · b) / ||b||²)b
```

Approach:

Explain the steps without directly calculating everything.

Full solution:

Show complete solution.

---

# 19. Practice Feedback

Every incorrect answer should teach something.

Bad:

```text
Incorrect.
```

Better:

```text
Не совсем.

Ты использовал ||b|| вместо ||b||².

В формуле проекции используется квадрат длины вектора b.

[ Try again ]
```

Where possible, question data should support mistake-specific explanations.

---

# 20. XP

XP measures activity.

It does NOT measure knowledge.

Suggested base XP:

```text
Easy       10
Medium     20
Hard       30
Challenge  50
```

Attempt multipliers:

```text
First attempt        ×1.00
Second attempt       ×0.80
Third+ attempt       ×0.60
```

Hint multiplier:

```text
No hint                 ×1.00
Small hint              ×0.90
Formula hint            ×0.80
Approach explanation    ×0.65
Full solution           ×0.40
```

Keep constants configurable.

Do not penalize solving speed.

---

# 21. XP Farming Prevention

Repeatedly solving the same easy problem must not generate unlimited XP.

Suggested rule:

```text
First successful completion:
100% XP

Second completion:
25% XP

Further repetitions:
0 XP
```

Exact constants should be centralized/configurable.

---

# 22. Mastery

Mastery measures understanding.

It is separate from XP.

Range:

```text
0–100
```

Suggested labels:

```text
0–29    Beginner
30–59   Learning
60–79   Confident
80–94   Strong
95–100  Mastered
```

For topics the user has never meaningfully practiced, do NOT show:

```text
Mastery: 0
```

Use:

```text
Not assessed
```

Internally mastery may be nullable.

---

# 23. Mastery Calculation

Create a dedicated service/module for mastery.

Do not calculate mastery inside React components.

Consider:

- correctness;
- number of attempts;
- hints used;
- difficulty;
- recent performance;
- repeated success;
- performance consistency.

Recent attempts should generally matter more than old attempts.

Use deterministic, testable logic.

Do not use machine learning.

Do not let one answer change mastery from something like:

```text
20 → 95
```

Use reasonable smoothing.

All important coefficients should live in configuration/constants.

---

# 24. Practice GPA

The application must call this:

**Practice GPA**

Never present it as official university GPA.

Calculate it using assessed topic mastery.

Unpracticed topics must NOT count as zeros.

Example mapping:

```text
95–100 → 4.0
90–94  → 3.9
85–89  → 3.7
80–84  → 3.3
75–79  → 3.0
70–74  → 2.7
65–69  → 2.3
60–64  → 2.0
55–59  → 1.7
50–54  → 1.3
40–49  → 1.0
<40    → 0.0
```

Keep mapping configurable.

If insufficient data exists, display:

```text
Not enough data yet
```

or clearly state how many assessed topics the score is based on.

---

# 25. Weak Topics

Do not mark unstudied topics as weak.

Weak topics require meaningful practice data.

Suggested initial condition:

```text
mastery < 70
```

with enough attempts.

Dashboard should show approximately 3–5 useful weak-topic recommendations.

---

# 26. Daily Practice

Recommended daily session:

```text
5 questions
~10 minutes
```

Suggested composition:

```text
2 weak-topic questions
1 recently studied topic
1 spaced-review topic
1 mixed question
```

Gracefully adapt for new users without enough history.

Do not require AI.

---

# 27. Spaced Review

Track:

```text
lastPracticedAt
```

Topics not practiced recently should become more likely to appear in recommendations.

Do NOT reduce visible mastery solely because time passed in V1.

Instead show something such as:

```text
Recommended for review
```

---

# 28. Exam Mode

Exam Mode should behave differently from learning practice.

In Exam Mode:

- no hints;
- no immediate correctness feedback;
- mixed questions;
- final score at end;
- topic breakdown at end.

Example:

```text
16 / 20
80%

Vectors      100%
Matrices      60%
Lines         75%
```

---

# 29. Formula Book

Create a searchable Formula Book.

Formula entries should support:

```text
Title
Formula
Meaning
Variables
When to use
Common mistakes
Example
Practice this formula
```

Example structure:

```text
Vectors
  Dot Product
  Vector Length
  Projection
  Angle Between Vectors

Matrices
  Determinant
  Inverse Matrix
  Rank
```

Formulas should be reusable rather than duplicated everywhere.

---

# 30. Question Storage

Do not store questions inside UI components.

Use a reusable data model.

Conceptually:

```text
id
subjectId
topicId
type
difficulty
prompt
options
correctAnswer
solution
hints
formulaHint
explanation
tags
xpBase
```

Adapt schema to question type.

Questions must have verified answers.

---

# 31. PDF → Website Workflow

The intended content workflow is:

```text
University PDF
        ↓
Externally transformed into structured educational content
        ↓
topic.mdx
questions
formulas
terminology
        ↓
added to project content
        ↓
automatically appears in website
```

Therefore the application must not require editing frontend source code every time a new lecture is added.

---

# 32. Future Content Admin

Do NOT make a full CMS/admin editor a required V1 feature unless it is already partly implemented and easy to finish.

However, avoid architecture that prevents adding one later.

Future desired functionality may include:

```text
/admin/content

Create topic
Edit Markdown
Preview
Draft
Publish
Archive
Import .md/.mdx
```

For now MDX/files are acceptable and preferred for simplicity.

---

# 33. Dashboard

Dashboard should answer:

> What should I do next?

Show useful sections such as:

```text
Continue Learning

Today's Practice

Weak Topics

Recent Progress

🔥 Streak
XP
Practice GPA
Problems solved
```

Do not overload the page.

---

# 34. Subject Page

A subject contains modules and topics.

Example:

```text
Analytical Geometry and Linear Algebra

Vectors
✓ Vector Length
✓ Dot Product
→ Vector Projection
○ Cross Product

Matrices
✓ Matrix Operations
→ Determinants
○ Rank
○ Linear Independence
```

Show progress meaningfully.

---

# 35. Progress Page

Include useful metrics:

```text
Practice GPA
overall mastery
XP
solved problems
streak

mastery by subject
topic mastery
weak topics
recent results
practice history
```

Do not create charts just for decoration.

---

# 36. Telegram Authentication

Authentication should use Telegram.

Persist fields approximately:

```text
telegramId
firstName
lastName
username
photoUrl
```

Fields such as username/photo may be nullable.

Validate Telegram authentication server-side.

Do not trust identity data supplied only by the client.

---

# 37. Development Authentication

Real Telegram authentication may be inconvenient in local development.

Provide a clearly isolated development-only login if useful.

It must NEVER be enabled accidentally in production.

---

# 38. Profile Privacy

Users should control:

```text
Show Telegram username
Show Telegram profile photo
Appear in leaderboard
```

Privacy must be enforced server-side.

Do not send hidden Telegram usernames or private image URLs through public endpoints and merely hide them using CSS.

---

# 39. Leaderboard

Provide:

```text
This Week
This Month
All Time
```

Eligibility should prevent meaningless rankings.

Suggested minimum:

```text
30 scored questions
3 assessed topics
leaderboard enabled
```

Do not rank solely by XP.

Suggested V1 order:

```text
1. Practice GPA descending
2. Overall mastery descending
3. XP descending
```

Keep logic deterministic and documented.

---

# 40. Streaks

Logging in does not count.

Suggested meaningful daily activity:

```text
3 scored practice questions
```

OR:

```text
study one topic
+
complete at least one related practice question
```

Keep rules configurable.

---

# 41. Initial Content Areas

Seed enough useful content that the application does not feel empty.

Quality is more important than quantity.

## Computer Architecture

Start with areas such as:

```text
Binary / number systems
Bitwise operations
Boolean logic
Logic gates
AND / OR / NOT
NAND
NOR
XOR
DNF / CNF
Half-adder
Full-adder basics
```

## Analytical Geometry and Linear Algebra

```text
Vectors
Vector length
Dot product
Angle between vectors
Parallel/perpendicular vectors
Vector projection
Orthogonal component
Determinants
Linear independence
Lines
Planes
```

## Mathematical Analysis

```text
Real numbers
Real number axioms
Equality axioms
Bounds
Upper/lower bounds
Supremum
Infimum
Completeness
Basic epsilon terminology
```

## Introduction to Programming

C language:

```text
Variables
Operators
Bitwise operators
Arrays
Strings
Pointers
Pointer arithmetic
Pointers and arrays
Structs
malloc
Function pointers
```

## Logic and Discrete Mathematics

```text
Propositions
Logical operators
Implication
Necessary/sufficient conditions
Quantifiers
Sets
Functions
Direct proof
Proof by contradiction
Contrapositive
Even/odd proofs
Mathematical language
```

Avoid generating dozens of shallow placeholder articles.

---

# 42. UI Direction

The design should feel like a modern developer/education product.

Prefer:

- clean typography;
- excellent spacing;
- subtle borders;
- restrained cards;
- strong hierarchy;
- beautiful mathematical rendering;
- excellent code blocks;
- light mode;
- intentional dark mode;
- responsive design.

Avoid:

- Moodle-like visual design;
- excessive gradients;
- neon gaming style;
- childish gamification;
- unnecessary animations;
- enormous rounded cards everywhere;
- visual clutter.

---

# 43. Tech Stack

If the existing repository already has an appropriate stack, continue using it.

Otherwise the preferred direction is approximately:

```text
Next.js
React
TypeScript
Tailwind CSS
shadcn/ui
PostgreSQL
Prisma
MDX
KaTeX / MathJax
```

Do not rewrite working architecture just to match this list exactly.

---

# 44. Database

Expected application entities may include concepts such as:

```text
User
UserSettings

Subject
Module
Topic

Formula

Question
QuestionOption
Hint

PracticeSession
PracticeAttempt

TopicProgress
SubjectProgress

UserStats
Streak

Achievement
```

Do not blindly create all entities if some are unnecessary.

Normalize reasonably.

Do NOT create AI chat entities.

---

# 45. Business Rules

Ensure:

- XP cannot become negative;
- mastery stays within 0–100;
- Practice GPA stays within its range;
- Telegram ID is unique;
- duplicate submissions cannot award XP twice;
- page refreshes cannot farm rewards;
- repeated questions cannot farm unlimited XP;
- private profile fields stay private;
- users cannot modify another user's progress.

---

# 46. Tests

At minimum test important business logic:

```text
XP scoring
hint penalties
attempt penalties
XP repetition protection
mastery calculation
mastery bounds
Practice GPA
weak-topic selection
Daily Practice selection
streak rules
leaderboard eligibility
privacy filtering
duplicate submission protection
```

Where applicable also test content loading.

---

# 47. Verification Before Completion

Before claiming completion:

1. run the application;
2. validate database migrations;
3. run seed data;
4. run tests;
5. run lint;
6. run TypeScript checks;
7. run production build;
8. fix encountered errors.

Also inspect major UI flows on desktop and mobile.

Pay special attention to:

```text
math formulas
code blocks
topic pages
practice questions
navigation
progress
leaderboard
profile/privacy
AI placeholder
```

---

# 48. Implementation Priority After Recovery

After determining what already exists, prioritize unfinished work approximately in this order:

## Priority 1 — Core product

```text
Application shell
Database
Authentication
Subjects/modules/topics
MDX content system
Content service
Topic pages
```

## Priority 2 — Practice

```text
Question model
Practice sessions
Answer validation
Feedback
Hints
XP
Mastery
Practice GPA
```

## Priority 3 — Personalized learning

```text
Weak topics
Daily Practice
Spaced review recommendations
Formula Book
Progress page
Streaks
```

## Priority 4 — Social

```text
Profile privacy
Leaderboard
Achievements
```

## Not part of V1

```text
Real AI tutor
LLM integration
AI-generated practice
AI solution checking
unsafe code execution
full CMS unless already mostly implemented
```

Do not rebuild completed earlier priorities.

Continue from the actual repository state.

---

# 49. Definition of Done

The project should ultimately allow a user to:

1. open the application;
2. authenticate or use development login;
3. see the Dashboard;
4. browse subjects;
5. browse modules/topics;
6. open a topic;
7. read Russian explanations with English terminology;
8. view formulas;
9. view examples;
10. see the AI Tutor "Coming soon" placeholder;
11. start practice;
12. answer different question types;
13. receive feedback;
14. use progressive hints;
15. earn XP;
16. develop topic mastery;
17. see Practice GPA;
18. identify weak topics;
19. complete Daily Practice;
20. use the Formula Book;
21. view Progress;
22. view Profile;
23. configure Telegram privacy;
24. view the leaderboard;
25. add future lecture content through new MDX/content files without rewriting frontend pages.

---

# 50. Important Product Principle

Always preserve this principle:

> The website is not a storage place for lecture PDFs.
>
> PDFs are source material.
>
> The website contains transformed, structured explanations that help the student understand the material, practice it, discover weaknesses and decide what to study next.

And:

> Educational content should be easy to extend independently from application code.

---

# 51. What To Do Now

After reading this document:

1. inspect the current repository;
2. report internally what is already complete;
3. identify the next incomplete requirement;
4. repair any partial work caused by the interrupted session;
5. continue implementation;
6. do not stop merely because some earlier step is already complete;
7. perform verification after implementation.

Do not ask me to resend the previous prompt.

The requirements in this document represent the current desired product state.

If there is a conflict between partially implemented old AI functionality and this specification, remove/disable the unfinished AI integration and keep only the UI placeholder.

At completion, summarize:

```text
Recovered existing work
- ...

Implemented now
- ...

Fixed
- ...

Content architecture
- ...

Practice / scoring / mastery
- ...

Database
- ...

Verification
- ...

Remaining limitations
- ...
```

Do not claim functionality was completed unless it was actually implemented and verified.