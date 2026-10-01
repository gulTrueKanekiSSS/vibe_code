# University Learning Platform — Full Product & Development Specification

## 1. Your role

You are a senior full-stack engineer, product engineer, UI/UX designer, and software architect.

Your task is to design and implement a production-quality web application for a university student who has difficulty processing technical university material in English.

Do not build this as a simple notes website.

The application must function as a personal learning system that connects:

**Learn → Practice → Progress → Compete**

The system should help the student:

1. understand university topics in simple Russian;
2. learn the corresponding English academic terminology;
3. practice topics with structured exercises;
4. identify weak topics;
5. track mastery and learning progress;
6. optionally compete with other users through a leaderboard.

The UI should feel like a modern educational/developer product, not like Moodle or an old LMS.

An AI tutor may be added in the future, but it must NOT be implemented in the first version.

---

# 2. Core Product Concept

The application should answer four questions for the student:

- What have I already studied?
- What do I actually understand?
- What am I weak at?
- What should I study or practice next?

The platform must therefore track progress at the **topic level**, not only at the subject level.

---

# 3. Initial Subjects

Create the following university subjects:

1. Computer Architecture
2. Analytical Geometry and Linear Algebra
3. Mathematical Analysis
4. Introduction to Programming
5. Logic and Discrete Mathematics

The architecture must make adding more subjects later easy.

Do not hardcode application logic specifically around these five subjects.

---

# 4. Recommended Tech Stack

Unless the existing repository already uses another suitable stack, use:

## Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS
- shadcn/ui or another clean component system
- KaTeX or MathJax for mathematical formulas
- Markdown/MDX for educational content

## Backend

Use Next.js server functionality where appropriate.

For persistent application data use:

- PostgreSQL
- Prisma ORM

## Authentication

Use Telegram authentication.

Prefer the current Telegram-supported login mechanism suitable for web applications.

Telegram authentication must be validated server-side.

Never trust Telegram identity data received only from the client.

## General requirements

- responsive design;
- desktop-first but fully usable on mobile;
- dark mode;
- light mode;
- good accessibility;
- strong TypeScript typing;
- clear separation between UI, business logic, database, and content.

If there is already an existing codebase, inspect it first and adapt these recommendations rather than unnecessarily rewriting working architecture.

---

# 5. Application Structure

The main navigation should contain approximately:

```text
Dashboard
Subjects
Practice
Formula Book
Progress
Leaderboard
Profile
```

Settings can be accessible through Profile.

---

# 6. Dashboard

The Dashboard should immediately answer:

> What should I do next?

Recommended layout:

```text
Good morning, Dmitry 👋

Current semester progress
██████████████░░░░ 72%

Continue Learning
Analytical Geometry
Vector Projection

Weak Topics
• Supremum / Infimum
• Pointer Arithmetic
• Proof by Contradiction

Today's Practice
5 questions
~10 minutes

Stats
🔥 4 day streak
✓ 128 problems solved
⭐ 3,420 XP
Practice GPA: 3.72
```

Dashboard sections:

- Continue Learning
- Daily Practice
- Weak Topics
- Current learning streak
- Recent progress
- XP
- Practice GPA
- Topics recently studied

Do not make the Dashboard visually overloaded.

Primary action should be obvious.

---

# 7. Subjects Page

Display the five subjects as clean cards.

Each card should include:

- subject name;
- number of completed topics;
- total topics;
- progress bar;
- current mastery;
- button to continue learning.

Example:

```text
Analytical Geometry and Linear Algebra

12 / 20 topics
68% progress

[ Continue ]
```

---

# 8. Subject Structure

Each subject contains modules and topics.

Example:

```text
Analytical Geometry and Linear Algebra

1. Vectors
   ✓ Vector Length
   ✓ Dot Product
   → Vector Projection
   ○ Cross Product

2. Matrices
   ✓ Matrix Operations
   → Determinants
   ○ Matrix Rank
   ○ Linear Independence

3. Lines and Planes
   ○ Equation of a Line
   ○ Equation of a Plane
```

Each topic has a learning state.

Suggested states:

```text
NOT_STARTED
LEARNING
PRACTICED
MASTERED
```

Represent them visually without relying only on color.

---

# 9. Educational Content Philosophy

This requirement is extremely important.

Educational content should NOT look like copied academic textbooks.

The purpose of the platform is to transform difficult university material into clear explanations.

The tone should feel like a personal tutor explaining the subject.

The student speaks Russian but studies university subjects in English.

Therefore explanations should primarily be in **clear Russian**, while important academic terminology should also be shown in **English**.

Example:

```text
Скалярное произведение (dot product) — это операция,
которая позволяет понять, насколько два вектора направлены
в одну сторону.
```

Avoid unnecessarily formal mathematical language when a simpler explanation is possible.

However, do not sacrifice correctness.

---

# 10. Topic Page

Every topic page should support the following structure:

```text
Topic title

1. What is it?
2. Intuition
3. Why do we need it?
4. Important English terminology
5. Formula / definition
6. Understanding the formula
7. Worked example
8. Common mistakes
9. University lecture wording
10. Mini quiz
11. Practice this topic
12. AI Tutor placeholder
```

Not every topic must use every section, but the content system must support them.

---

# 11. Example Topic Style

Example for Vector Projection:

```text
Vector Projection

Что это?

Представь два вектора.

Вектор b задаёт направление.

Мы хотим понять, какая часть вектора a направлена вдоль b.

Эта часть и называется projection of a onto b.

---

English terminology

projection — проекция
vector — вектор
dot product — скалярное произведение
magnitude — длина / модуль вектора

---

Formula

proj_b(a) = ...

---

Почему формула работает?

Explain step by step.

---

Example

a = (...)
b = (...)

Step 1
...

Step 2
...

Answer
...

---

Common mistake

Do not confuse scalar projection with vector projection.
```

The design must render mathematical expressions properly.

---

# 12. Lecture Translator / University Terminology

Create a feature inside topics that helps bridge Russian understanding with English lectures.

Example:

```text
University terminology

Upper bound
→ Верхняя граница

Least upper bound
→ Точная верхняя граница / supremum

Bounded above
→ Ограничено сверху
```

Also support a section like:

```text
How your professor may say it:

"For every epsilon greater than zero..."

Что это значит:

"Для любого ε > 0 ..."
```

This should help the user gradually become comfortable with English terminology.

---

# 13. Content Architecture

Do NOT hardcode educational content directly into React components.

Content must be separated from rendering logic.

Use MDX, Markdown with structured frontmatter, JSON-based content metadata, or another maintainable content system.

Example structure:

```text
/content
  /computer-architecture
    boolean-algebra.mdx
    logic-gates.mdx
    nand.mdx
    half-adder.mdx

  /analytical-geometry
    vectors.mdx
    vector-length.mdx
    dot-product.mdx
    vector-projection.mdx
    determinants.mdx

  /mathematical-analysis
    real-numbers.mdx
    axioms.mdx
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

Topics should have metadata such as:

```yaml
subject:
module:
title:
slug:
order:
difficulty:
estimatedMinutes:
prerequisites:
keywords:
```

Adding a new topic should usually require creating content and metadata, not editing application code.

---

# 14. Future AI Tutor Placeholder

Do NOT implement real AI functionality in the first version.

Do NOT:

- connect to an LLM API;
- require an AI API key;
- store AI chats;
- create AI backend endpoints;
- generate practice tasks using AI.

However, reserve a clean place for a future AI Tutor.

On topic pages, include a disabled or placeholder card such as:

```text
AI Tutor

Ask questions about this topic and get guided explanations.

Coming soon

[ Ask AI ] — disabled
```

The placeholder should fit naturally into the page design and should not look broken.

Optionally include quick-action previews such as:

```text
Explain simpler
Give another example
Quiz me
Check my solution
```

These must be visually disabled or marked as unavailable.

Structure the frontend cleanly so a future AI chat component can replace the placeholder without requiring a major redesign of the topic page.

Do not over-engineer an AI abstraction layer that is not currently used.

---

# 15. Practice System

Practice is one of the most important parts of the product.

Users should be able to practice:

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

Support multiple question types.

At minimum:

### Numeric answer

```text
Find det(A).

Answer: ______
```

### Short text answer

### Multiple choice

### Multiple select

### True / False

### Step-based mathematical problem

### Programming output prediction

Example:

```c
int x = 10;
int *p = &x;

*p = 20;
```

Question:

```text
What is the value of x?
```

### Fix the code

### Conceptual question

Example:

```text
If a · b = 0, what can you say about the vectors?
```

The internal question model must be extensible.

---

# 17. Practice Difficulty

Use approximately:

```text
EASY
MEDIUM
HARD
CHALLENGE
```

### Easy

Direct application of a definition or formula.

### Medium

Requires understanding which formula or method to use.

### Hard

Multi-step problem.

### Challenge

Requires combining concepts or reasoning without obvious guidance.

---

# 18. Hint System

Do not immediately show solutions.

Use progressive help.

Example:

```text
Need help?

[ Small Hint ]
[ Show Relevant Formula ]
[ Explain Concept ]
[ Show Full Solution ]
```

Each help level may affect earned points.

Track hints used.

---

# 19. Practice Scoring

Use base points by difficulty.

Suggested defaults:

```text
Easy       10 XP
Medium     20 XP
Hard       30 XP
Challenge  50 XP
```

Modify the reward depending on attempts and hints.

Suggested model:

```text
Correct on first attempt        × 1.00
Correct on second attempt       × 0.80
Correct on third+ attempt       × 0.60

Small hint used                 × 0.90
Formula hint used               × 0.80
Concept explanation used        × 0.65
Full solution viewed            × 0.40
```

Do not reward negative XP.

Do NOT penalize users for solving slowly.

Learning quality is more important than speed.

Keep scoring constants configurable rather than scattering magic numbers throughout the codebase.

---

# 20. Separate XP and Mastery

Do not mix activity and knowledge into the same score.

## XP

XP represents activity and practice volume.

Example:

```text
12,480 XP
```

XP may increase from:

- completing practice;
- completing topics;
- daily practice;
- meaningful learning activity.

## Mastery

Mastery represents understanding of a topic.

Each topic has a score approximately:

```text
0–100
```

Suggested UI labels:

```text
0–29   Beginner
30–59  Learning
60–79  Confident
80–94  Strong
95–100 Mastered
```

Mastery should depend mostly on recent practice performance and should not increase indefinitely just because the same easy question is repeated.

Design the calculation in a service/module so the algorithm can easily be adjusted later.

---

# 21. Mastery Algorithm

Create an initial reasonable algorithm.

Consider:

- recent answers more strongly than very old answers;
- question difficulty;
- whether hints were used;
- number of attempts;
- repeated successful answers;
- performance consistency.

Prevent obvious farming.

For example, repeatedly answering the same easy question must not produce unlimited mastery.

Document the chosen algorithm clearly.

---

# 22. Practice GPA

Do not call the primary academic metric simply `GPA`, because it could be confused with official university GPA.

Use:

**Practice GPA**

or internally:

```text
practiceGpa
```

Convert overall mastery to a 0–4 scale.

Suggested initial mapping:

```text
90–100 → 4.0
85–89  → 3.7
80–84  → 3.3
75–79  → 3.0
70–74  → 2.7
65–69  → 2.3
60–64  → 2.0
55–59  → 1.7
50–54  → 1.3
< 50   → 1.0 or lower
```

Clearly label it:

```text
Practice GPA
```

Never imply it is the student's official university GPA.

---

# 23. Daily Practice

Generate a small recommended session every day.

Example:

```text
Today's Practice

5 questions
~10 minutes

Based on:
• weak topics
• recently learned topics
• topics not practiced recently

[ Start Practice ]
```

Daily Practice should prioritize:

1. weak topics;
2. topics recently studied;
3. topics that have not been reviewed for a while.

Use a deterministic/reasonable algorithm.

Do not use AI for daily practice generation.

---

# 24. Weak Topics

Create a Weak Topics feature.

Example:

```text
Your Weak Topics

1. Pointer Arithmetic       42%
2. Supremum / Infimum       55%
3. Vector Projection        68%
4. Proof by Contradiction   71%

[ Practice Weak Topics ]
```

Weakness should primarily use mastery data and recent mistakes.

---

# 25. Formula Book

Create a searchable Formula Book.

Example:

```text
Formula Book

Vectors
  Dot Product
  Projection
  Angle Between Vectors
  Cross Product

Matrices
  Determinant
  Inverse Matrix
  Rank
```

Each formula entry should support:

```text
Formula

Meaning

Variables

When to use it

Common mistakes

Example

[ Practice this formula ]
```

Formula content should reuse topic content where practical rather than duplicate information unnecessarily.

---

# 26. Programming Practice

Introduction to Programming requires special handling.

Support questions such as:

### Predict output

```c
int x = 10;
int *p = &x;
*p = 20;
printf("%d", x);
```

### Find the bug

### Fix the code

### Explain the behavior

### Pointer diagrams / conceptual questions

### Array indexing

### Structs

### malloc / memory

A future code execution sandbox may be added, but do not make arbitrary server-side C code execution a requirement for the first version.

Do NOT run untrusted C programs directly on the application server.

Design the architecture so safe code execution could be added later.

---

# 27. Telegram Authentication

Users authenticate through Telegram.

Store at least:

```text
telegramId
firstName
lastName
username
photoUrl
```

Username and photo may be nullable.

The server must validate authentication data according to Telegram's official authentication flow.

Do not trust client-provided Telegram data without validation.

Create/update the local user account after successful authentication.

---

# 28. Profile

Example:

```text
[ Telegram avatar ]

Dmitry
@username

Practice GPA
3.72

Global Rank
#18

XP
12,480

Problems Solved
348

🔥 14 day streak
```

Also show:

- subject progress;
- strongest topics;
- recent achievements;
- activity statistics.

---

# 29. Privacy Settings

Users must control public information.

Settings:

```text
Show Telegram username
[ ON / OFF ]

Show Telegram profile photo
[ ON / OFF ]

Appear in leaderboard
[ ON / OFF ]
```

If Telegram username visibility is disabled, never expose the alias publicly through the frontend or public API.

If profile photo visibility is disabled, show a generated/default avatar publicly.

If leaderboard participation is disabled, exclude the user from public leaderboard results.

Privacy checks must be enforced server-side, not only hidden in the frontend.

---

# 30. Leaderboard

Create leaderboards for:

```text
This Week
This Month
All Time
```

Example:

```text
#   Student       Practice GPA    XP
1   Alex              3.94      15,340
2   Maria             3.89      14,220
3   Dmitry            3.72      12,480
```

Do not allow leaderboard ranking to be trivially farmed.

Possible eligibility requirement:

```text
At least 30 solved problems
AND
at least 3 practiced topics
```

Make eligibility rules configurable.

The leaderboard should balance knowledge and activity.

Do not simply rank by raw XP.

A reasonable first ranking metric can use:

- Practice GPA / mastery;
- minimum activity threshold;
- XP as a secondary/tiebreaker factor.

Document the algorithm.

---

# 31. Streaks

Track learning streaks.

A day can count toward a streak if the user performs meaningful learning activity.

Suggested requirement:

```text
At least 3 completed practice questions

OR

Complete/read a topic and solve at least 1 related question
```

The logic must be configurable.

Prevent simple page refreshes from counting as learning activity.

---

# 32. Progress Page

Create a dedicated Progress page.

Include:

- overall mastery;
- Practice GPA;
- XP;
- solved problems;
- streak;
- mastery by subject;
- topic mastery;
- weak topics;
- recent performance;
- practice history.

Use charts only where they genuinely improve comprehension.

Avoid creating a cluttered analytics dashboard.

---

# 33. Search

Add global search if practical.

It should allow searching:

- subjects;
- topics;
- formulas;
- English terminology.

Example searches:

```text
supremum
pointer
dot product
скалярное произведение
```

---

# 34. Content Seed Data

Provide useful initial content so the product does not look empty.

## Computer Architecture

Include at least:

- Number systems / binary basics
- Bitwise operations
- Boolean logic
- Logic gates
- AND / OR / NOT
- NAND
- NOR
- XOR
- Half-adder
- Full-adder basics
- DNF / CNF connection to circuits where appropriate

## Analytical Geometry and Linear Algebra

Include at least:

- Vectors
- Vector length
- Dot product
- Angle between vectors
- Parallel and perpendicular vectors
- Vector projection
- Orthogonal component
- Determinants
- Linear independence basics
- Lines in 2D / 3D basics
- Planes basics

## Mathematical Analysis

Include at least:

- Real numbers
- Real number axioms
- Equality axioms
- Bounds
- Upper bound
- Lower bound
- Supremum
- Infimum
- Completeness axiom
- Basic epsilon terminology

## Introduction to Programming

Use C as the primary language.

Include at least:

- Variables
- Operators
- Bitwise operators
- Arrays
- Strings
- Pointers
- Pointer arithmetic
- Pointers and arrays
- Structs
- malloc / dynamic memory
- Function pointers
- Basic file concepts if appropriate

## Logic and Discrete Mathematics

Include at least:

- Propositions
- Logical operators
- Implication
- Necessary and sufficient conditions
- Quantifiers
- Sets
- Functions
- Direct proof
- Proof by contradiction
- Proof by contrapositive
- Even / odd proof examples
- Basic mathematical language

The seed content does not need to be an entire textbook.

Quality matters more than quantity.

---

# 35. Content Quality Requirements

Educational explanations should:

- use simple Russian;
- include English terminology;
- contain clear examples;
- avoid unexplained jargon;
- explain why formulas work when possible;
- include common mistakes;
- gradually increase difficulty;
- use correct mathematics;
- use correct C programming semantics.

Do not generate filler paragraphs just to make pages longer.

---

# 36. Practice Question Storage

Questions should not be embedded directly inside UI components.

Create a reusable question data model.

Suggested properties:

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

Adapt the schema appropriately for different question types.

Questions should support versioning/editing later if practical.

---

# 37. No AI-Generated Practice in V1

Do NOT generate practice questions with AI.

The first version must use a curated deterministic question bank with known correct answers.

Design the question architecture so generated practice could be added later, but do not implement it now.

---

# 38. Database Design

Create a clean relational schema.

Expected entities will likely include:

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

Do not blindly use this exact list if a better normalized design exists.

Do not create AI conversation/message tables in the first version.

Explain important schema decisions.

Avoid storing easily derived values redundantly unless there is a good performance reason.

---

# 39. Important Business Rules

Ensure:

- user XP cannot become negative;
- Practice GPA stays within its defined range;
- mastery remains between 0 and 100;
- Telegram IDs are unique;
- duplicate answer submissions cannot award XP twice;
- practice sessions cannot be exploited by repeatedly refreshing;
- leaderboard privacy is respected;
- hidden aliases never appear publicly.

---

# 40. UI / UX Direction

The product should look modern and clean.

Design inspiration should be conceptual, not copied:

- modern developer tools;
- Linear-like cleanliness;
- Vercel-style spacing;
- modern education apps;
- polished SaaS dashboards.

Use:

- clean typography;
- generous spacing;
- subtle borders;
- cards where useful;
- excellent code blocks;
- beautiful math rendering;
- clear hierarchy;
- restrained visual effects.

Avoid:

- excessive gradients;
- childish gamification;
- huge rounded cards everywhere;
- neon gaming UI;
- unnecessary animations;
- clutter;
- overly corporate LMS appearance.

---

# 41. Dark Mode

Dark mode is required.

It must be designed intentionally rather than simply inverted.

Code and formulas must remain readable.

Remember selected appearance preference.

---

# 42. Responsive Design

Support:

- desktop;
- tablet;
- mobile.

On mobile:

- navigation should adapt cleanly;
- practice questions must remain easy to answer;
- formulas must not overflow the viewport;
- placeholder AI Tutor card must fit naturally;
- code blocks must remain readable.

---

# 43. Accessibility

At minimum:

- semantic HTML;
- keyboard-accessible controls;
- visible focus states;
- proper labels;
- sufficient contrast;
- do not communicate status only through color.

---

# 44. Error Handling

Provide good empty/error/loading states.

Examples:

```text
No practice available yet.
You have not studied this topic yet.
No weak topics detected.
```

Never expose raw stack traces to normal users.

---

# 45. Security

Follow standard application security practices.

At minimum:

- validate all user input;
- validate Telegram authentication server-side;
- keep secrets server-side;
- protect API routes;
- enforce authorization server-side;
- prevent users from editing another user's progress;
- use database constraints where appropriate;
- sanitize/render Markdown safely;
- do not allow arbitrary unsafe code execution.

---

# 46. Development Workflow

Before implementing:

1. inspect the current repository;
2. identify the existing stack;
3. inspect package configuration;
4. inspect current application architecture;
5. preserve good existing code where possible.

Then produce a concise implementation plan.

After that, implement the project.

Do not rewrite the entire project unless there is a strong reason.

---

# 47. Implementation Priority

## Phase 1 — Core

1. Application shell/navigation
2. Telegram authentication architecture
3. Database
4. Subjects
5. Topic content system
6. Topic pages
7. Practice engine
8. XP
9. Mastery
10. Practice GPA
11. Profile
12. Progress tracking

## Phase 2 — Learning Intelligence

13. Weak topics
14. Daily practice
15. Formula Book
16. Streaks

## Phase 3 — Social

17. Leaderboard
18. Privacy controls
19. Achievements

## Phase 4 — Future

Do not implement these now:

20. AI Tutor
21. Topic-aware chat
22. AI solution checking
23. AI-generated practice
24. Safe C execution sandbox

Only leave architectural room where reasonable.

Do not over-engineer for features that are not currently required.

---

# 48. Testing

Add meaningful tests.

At minimum test critical business logic:

- scoring;
- XP calculation;
- mastery calculation;
- Practice GPA calculation;
- streak rules;
- leaderboard eligibility;
- privacy rules;
- duplicate practice submission protection where applicable.

Also verify:

- production build succeeds;
- TypeScript has no relevant errors;
- linter passes;
- database migrations work.

Do not consider the work complete if the UI looks correct but business logic is untested.

---

# 49. Seed / Demo Mode

The application should be easy to run locally.

Provide seed data.

Create enough demo data to show:

- subjects;
- modules;
- topics;
- formulas;
- practice questions.

If real Telegram authentication cannot be used easily in local development, provide a clearly separated development-only authentication method.

Development authentication must never accidentally be enabled in production.

---

# 50. Environment Configuration

Provide an `.env.example`.

Expected values may include:

```text
DATABASE_URL=
TELEGRAM_...
NEXT_PUBLIC_APP_URL=
```

Use names appropriate to the final implementation.

Do not require an AI API key.

Never commit real secrets.

---

# 51. README

Write a strong README including:

- what the project is;
- feature summary;
- tech stack;
- prerequisites;
- installation;
- environment variables;
- database setup;
- migrations;
- seeding;
- Telegram setup;
- development mode;
- running tests;
- production build;
- architecture overview.

Mention that AI Tutor is currently a placeholder for a future version.

---

# 52. Code Quality

Requirements:

- TypeScript;
- reusable components;
- clear names;
- reasonable file structure;
- minimal duplication;
- no giant components;
- no unnecessary abstractions;
- no unused placeholder code except intentional UI placeholders;
- no fake production APIs;
- comments only where they add value.

Avoid creating complicated abstractions before they are needed.

---

# 53. Definition of Done

The implementation should not be considered complete until a user can:

1. open the application;
2. authenticate or use development authentication;
3. view all subjects;
4. enter a subject;
5. browse modules/topics;
6. open a topic;
7. read a clear Russian explanation with English terminology;
8. view formulas and examples;
9. see the AI Tutor placeholder;
10. start topic practice;
11. submit answers;
12. receive correctness feedback;
13. use hints;
14. earn XP;
15. change topic mastery;
16. see Practice GPA;
17. see weak topics;
18. view progress;
19. open their profile;
20. configure Telegram alias visibility;
21. view the leaderboard while respecting privacy settings.

Real AI chat must NOT be required.

---

# 54. Final Verification

Before finishing the task:

- run the app;
- run database migrations;
- seed the database;
- test the main flows;
- run automated tests;
- run lint;
- run TypeScript checks;
- run production build;
- fix errors instead of merely documenting them.

Inspect the application visually at desktop and mobile sizes.

Pay particular attention to:

- long mathematical formulas;
- code blocks;
- practice forms;
- sidebar/navigation;
- topic pages;
- leaderboard;
- profile privacy;
- AI Tutor placeholder.

---

# 55. Final Response Format

When finished, provide a concise engineering summary containing:

```text
Implemented
- ...

Architecture
- ...

Important decisions
- ...

Scoring / Mastery logic
- ...

Database
- ...

How to run
- ...

Required environment variables
- ...

Tests performed
- ...

Known limitations / future improvements
- ...
```

Do not claim something is complete unless it has actually been implemented and verified.

---

# 56. Product Principle

Always preserve this product principle:

> The goal is not to create a website that stores lecture notes.
>
> The goal is to create a learning system that understands what the student has studied, what they understand, where they struggle, and what they should practice next.

For the first version, this intelligence must come from deterministic progress, mastery, practice and scoring logic rather than an AI tutor.

When making implementation decisions, prefer the option that supports this principle.