# StudySpace — Master Upgrade Prompt for Codex

## 0. Context

You are continuing development of an existing university learning platform called **StudySpace**.

The current application already contains, to varying degrees:

- Dashboard
- Subjects
- Topics / theory pages
- Practice
- Formula Book
- Progress
- Leaderboard
- Profile
- Telegram authentication
- privacy settings
- XP
- Mastery
- Practice GPA
- Daily Practice
- Weak Topics
- MDX-based educational content
- an AI Tutor placeholder

This is **not** a request to rebuild the application from scratch.

Your task is to improve the current product while preserving valid existing functionality and user progress.

The most important goals are:

1. fix the broken **Start Practice / Начать практику** flow;
2. significantly expand and deepen the theoretical content;
3. significantly expand the question bank;
4. add genuinely stronger university-level tasks;
5. organize practice by meaningful difficulty levels;
6. let the user build their own practice sessions;
7. show useful explanations after answers;
8. keep content easy to extend from future university PDF lectures.

The central learning loop is:

**Learn → Understand → Practice → Make mistakes → Review → Improve → Master**

---

# 1. Product Principle

StudySpace must NOT become a simple website with lecture notes.

The system should help the student answer:

- What have I studied?
- What do I understand?
- What am I weak at?
- What should I practice next?
- How well can I solve easy vs difficult problems?
- Why was my answer correct or incorrect?

The student studies university subjects in English but understands difficult material more easily in Russian.

Therefore the platform should use:

**clear Russian explanation + important English academic terminology**

The goal is not to make theory longer.

The goal is to make theory understandable at several levels of depth.

The goal is not to make hard questions by making arithmetic uglier.

The goal is to require deeper reasoning.

---

# 2. Current Subjects

The initial subjects are:

1. Computer Architecture
2. Analytical Geometry and Linear Algebra
3. Mathematical Analysis
4. Introduction to Programming
5. Logic and Discrete Mathematics

Do not hardcode application logic around only these five subjects.

The content architecture must allow more subjects later.

---

# 3. Important Constraints

Do NOT:

- rewrite the project from scratch;
- redesign unrelated pages;
- change the stack without a strong reason;
- replace working authentication;
- add a real AI Tutor;
- add OpenAI/LLM SDKs;
- add AI chat storage;
- add AI-generated questions;
- add AI grading;
- add unsafe arbitrary C execution;
- delete valid user progress;
- unnecessarily rename existing topic IDs/slugs;
- unnecessarily delete question IDs already referenced by attempts/history;
- hardcode educational content into React components.

The AI Tutor must remain only a disabled **Coming soon** placeholder.

Preserve existing valid functionality.

---

# 4. Recovery and Inspection First

Before changing code:

1. inspect the repository;
2. inspect `git status`;
3. inspect the current stack and dependencies;
4. inspect routes/pages/components;
5. inspect the database schema and migrations;
6. inspect MDX/content architecture;
7. inspect current topic content;
8. inspect the current question bank;
9. inspect PracticeSession creation;
10. inspect answer submission;
11. inspect scoring/mastery/GPA logic;
12. inspect the current Start Practice buttons;
13. inspect existing tests;
14. identify partial/broken/duplicated work;
15. preserve all good existing code.

Do not blindly regenerate the repository.

Do not recreate files that already work.

---

# 5. Priority Order

Work in this order.

## Priority 1 — Fix Practice Start Flow

The **Начать практику / Start Practice** button currently does not reliably start a session.

Fix this first.

## Priority 2 — Practice Builder

Create/improve reliable custom practice configuration.

## Priority 3 — Question Bank Expansion

Add many more high-quality questions with explanations.

## Priority 4 — Theory Expansion

Deepen important topic pages.

## Priority 5 — Validation and Testing

Run automated and manual checks.

Do not spend time on unrelated features until these are complete.

---

# 6. Critical Bug — Start Practice Does Not Work

Reproduce the problem locally.

Test at least:

- Dashboard → Start Practice
- Practice page → Quick Practice
- Topic page → Practice this topic
- Daily Practice → Start
- Weak Topics → Practice
- Custom Practice → Start

Inspect:

- browser console;
- server logs;
- network requests;
- route transitions;
- button state;
- PracticeSession creation;
- question selection;
- DB writes;
- redirects.

Find the actual root cause.

Do not patch around the problem.

---

# 7. Expected Practice Start Flow

The intended flow must be:

```text
User clicks Start Practice
        ↓
configuration is resolved
        ↓
configuration is validated
        ↓
matching questions are selected
        ↓
PracticeSession is created
        ↓
selected question IDs/order are persisted
        ↓
user is redirected to the session
        ↓
Question 1 is rendered
```

Every step must work.

---

# 8. Check Common Failure Points

Inspect:

- button `onClick`;
- `<Link>` href;
- router usage;
- disabled state;
- loading state;
- client/server component boundaries;
- Server Actions;
- API routes;
- dynamic route params;
- authentication guards;
- PracticeSession creation;
- Prisma/database errors;
- empty question lists;
- invalid filters;
- redirects;
- serialization problems;
- stale session state.

Do not leave a clickable-looking button that silently does nothing.

---

# 9. Practice Session Reliability

Once a session is created, persist:

- session mode;
- selected subject;
- selected topics;
- selected difficulties;
- selected question types;
- requested question count;
- selected question IDs;
- question order;
- submitted answers;
- attempts;
- hints used;
- current progress;
- createdAt;
- completedAt.

Refreshing the page must not create a new question set.

A session should survive refresh and allow the user to continue.

---

# 10. Duplicate Session Protection

Repeated clicks on **Start Practice** must not:

- create several identical sessions;
- award duplicate rewards;
- create inconsistent progress.

While creating a session:

- disable the button;
- show loading state;
- protect server-side where appropriate.

---

# 11. Empty Question Handling

If no questions match the configuration, do not fail silently.

Show a clear empty state, for example:

```text
Для выбранной конфигурации пока недостаточно заданий.

Можно:
• уменьшить количество вопросов;
• добавить другой уровень сложности;
• выбрать больше тем.
```

Actions:

```text
[ Change Settings ]
[ Use Available Questions ]
```

Never create an empty PracticeSession.

---

# 12. Practice Modes

Use a common practice engine where practical.

Suggested modes:

```text
QUICK
DAILY
TOPIC
SUBJECT
WEAK_TOPICS
CUSTOM
EXAM
```

Do not duplicate the whole selection/session implementation for every mode.

Each mode should provide configuration to one common engine.

---

# 13. Custom Practice Builder

Create or improve a dedicated custom practice builder.

Suggested route:

```text
/practice/custom
```

The student should be able to choose:

- subject;
- one topic;
- several topics;
- entire subject;
- difficulty;
- number of questions;
- question types;
- hints allowed/disabled;
- feedback after each question / at the end.

Suggested UI:

```text
Create Practice

Subject
[ Analytical Geometry ▼ ]

Topics
☑ Dot Product
☑ Angle Between Vectors
☑ Vector Projection
☑ Orthogonal Component

Difficulty
☐ Easy
☑ Medium
☑ Hard
☐ Challenge

Question Count
[ 5 ] [ 10 ] [ 15 ] [ 20 ] [ Custom ]

Question Types
☑ Calculation
☑ Conceptual
☑ Parameter Problems
☑ Multi-step
☑ Error Analysis
☐ Proof / Reasoning

Hints
◉ Allowed
○ Disabled

Feedback
◉ After every question
○ At the end

[ Start Practice ]
```

A normal session should be configurable in about 3–5 interactions.

Avoid a complicated wizard.

---

# 14. Difficulty Levels

Use four difficulty levels:

```text
EASY
MEDIUM
HARD
CHALLENGE
```

Difficulty represents **reasoning complexity**, not just bigger numbers.

---

# 15. EASY

Purpose:

- direct formula use;
- basic definition recall;
- simple one-step reasoning;
- simple code output;
- basic Boolean operations.

Examples:

```text
Find the dot product of:
a = (1,2)
b = (3,4)
```

```text
What does *p mean in C?
```

```text
Evaluate NAND(1,1).
```

The student should already know which method is required.

---

# 16. MEDIUM

Purpose:

The student must choose the method.

Characteristics:

- method is not explicitly stated;
- two basic steps;
- unknown parameter;
- less obvious interpretation;
- code tracing.

Example:

```text
Find x such that:
a = (x,2)
b = (4,-2)

are perpendicular.
```

Do NOT say:

```text
Use the dot product.
```

The student should identify that.

---

# 17. HARD

Purpose:

Require multi-step reasoning or several related concepts.

Examples:

```text
Given vectors a and b:

1. Find the projection of a onto b.
2. Find the orthogonal component.
3. Verify that both components sum to a.
4. Verify perpendicularity.
```

Other characteristics:

- reverse problems;
- several concepts;
- structured proofs;
- memory tracing;
- circuit design;
- multi-stage calculations.

---

# 18. CHALLENGE

Purpose:

Require deeper or non-routine reasoning.

Use:

- proofs;
- counterexamples;
- error analysis;
- inverse problems;
- derive a condition;
- explain why a method fails;
- combine several topics;
- reason from definitions.

Example:

```text
A student claims:

proj_b(a) = ((a · b) / ||b||)b

Explain the error and construct an example where this produces the wrong result.
```

---

# 19. Difficulty Distribution

For important/core topics aim approximately for:

```text
20% EASY
35% MEDIUM
30% HARD
15% CHALLENGE
```

This is guidance, not a quota.

Do not add weak questions only to hit percentages.

---

# 20. Target Question Quantity

For important topics, aim eventually for approximately:

```text
Easy:       8–15
Medium:    10–20
Hard:       8–15
Challenge:  4–10
```

Quality > quantity.

Prefer:

```text
15 genuinely strong questions
```

over:

```text
50 almost identical questions with different numbers
```

---

# 21. Difficulty Mixing

Allow one or several difficulty levels.

Examples:

```text
Easy
Easy + Medium
Medium + Hard
Hard + Challenge
```

If the user selects:

```text
MEDIUM + HARD
10 questions
```

target approximately:

```text
5 Medium
5 Hard
```

where available.

If one level has insufficient questions, gracefully offer alternatives.

Do not silently include unselected difficulties without informing the user.

---

# 22. Practice Presets

Add useful presets.

## Warm-up

```text
Easy
5 questions
Hints allowed
```

## Standard Practice

```text
Easy + Medium
10 questions
Hints allowed
```

## Tutorial Prep

```text
Medium + Hard
10 questions
Hints allowed
```

## Exam Prep

```text
Hard + Challenge
15 questions
Hints disabled by default
Feedback at end
```

Presets must remain editable.

---

# 23. Topic Page Practice Actions

Each topic should provide clear practice actions:

```text
Practice

[ Quick Practice ]

Difficulty:
[ Easy ] [ Medium ] [ Hard ] [ Challenge ]

[ Build Custom Practice ]
```

Quick Practice may choose around 5 questions based on mastery.

Custom Practice should open with the current topic preselected.

---

# 24. Subject-Specific Question Type Filters

Question type filters should depend on subject.

## Analytical Geometry and Linear Algebra

```text
Calculation
Conceptual
Parameter Problem
Multi-step
Proof / Reasoning
Error Analysis
```

## Mathematical Analysis

```text
Definition
Calculation
Proof
Counterexample
Reasoning
True / False with explanation
```

## Introduction to Programming

```text
Predict Output
Find Bug
Fix Code
Memory Tracing
Conceptual
Undefined Behavior
```

## Computer Architecture

```text
Boolean Expression
Truth Table
Circuit Design
NAND Conversion
Calculation
Error Analysis
```

## Logic and Discrete Mathematics

```text
Symbolic Translation
Quantifiers
Proof
Counterexample
Logic Analysis
Sets / Functions
```

Do not show irrelevant filters.

---

# 25. Question Availability

Where practical, show available counts:

```text
Easy        12
Medium      18
Hard        10
Challenge    5
```

If the user requests:

```text
20 HARD questions
```

but only 8 exist:

```text
Only 8 Hard questions are available.

[ Use all 8 ]
[ Include Medium ]
[ Change Settings ]
```

---

# 26. Question Selection Priority

When building a session, prefer:

1. unseen matching questions;
2. matching questions previously answered incorrectly;
3. matching questions not seen recently;
4. previously solved matching questions.

Do not repeat the exact same question within one session.

When repeating a configuration, prefer different questions where possible.

---

# 27. Theory Expansion Philosophy

Do not simply add more text.

Expand **levels of understanding**.

For major topics, support this progression:

```text
Intuition
↓
Simple explanation
↓
Formal definition
↓
Why it matters
↓
Formula / rule
↓
Why it works
↓
Basic example
↓
University-level example
↓
Common trap
↓
Connections
↓
Summary
↓
Practice
```

---

# 28. Topic Structure

Important topics should support sections such as:

## Что это?

Simple intuitive explanation.

## Интуиция

Mental model.

## Formal Definition

Correct university-level definition.

## Зачем это нужно?

Explain where and why the concept is used.

## English Terminology

Show important English terms with Russian meaning.

## Formula / Rule

Explain every symbol and variable.

## Почему это работает?

Provide derivation/reasoning where useful.

## Worked Example 1 — Basic

Direct example.

## Worked Example 2 — Tutorial Level

Less obvious university-style example.

## Worked Example 3 — Common Trap

Show a typical mistake.

## Common Mistakes

Concrete mistakes.

## Connections

Show meaningful relationships with other topics.

## How Your Professor May Say It

Show common English lecture phrasing.

## Summary

Short useful recap.

---

# 29. Language Strategy

Main explanations:

**Russian**

Important terminology:

**Russian + English**

Example:

```text
Скалярное произведение (dot product) — ...
```

Keep:

- formulas in standard notation;
- code in English;
- academic terms visible.

Do not turn the content into a pure translation.

---

# 30. Theory Quality

Avoid filler.

Bad:

```text
Vectors are very important in mathematics and physics.
```

Better:

Explain exactly what the concept allows the student to calculate or understand.

Every section should contribute to learning.

Do not produce textbook-like walls of text.

---

# 31. Topic Size

Prefer focused topics.

Instead of one enormous:

```text
Pointers
```

prefer:

```text
Pointer Basics
Dereferencing
Pointers and Arrays
Pointer Arithmetic
Pointers to Structs
Dynamic Memory
Function Pointers
```

Only split existing content when it improves navigation and learning.

Preserve existing slugs/IDs where possible.

---

# 32. English Terminology

Important topics should explicitly include English terminology.

Example:

| English | Russian |
|---|---|
| dot product | скалярное произведение |
| magnitude | длина / модуль |
| projection | проекция |
| orthogonal | ортогональный / перпендикулярный |

Also include common professor wording.

Example:

```text
"Let A be bounded above."

→ Пусть множество A ограничено сверху.
```

---

# 33. Worked Examples

Important topics should usually contain at least:

- one basic example;
- one standard tutorial/university example;
- one common-trap example.

Show intermediate reasoning.

Do not jump directly to the answer.

---

# 34. Formula Explanations

For important formulas explain:

- what each symbol means;
- what result is produced;
- why the denominator/numerator/etc. exists;
- when to use the formula;
- when not to use it;
- common mistakes.

Example:

For vector projection explain why the denominator is `||b||²`.

---

# 35. Connections Between Topics

Where useful, show learning maps.

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
```

Programming:

```text
Arrays
    ↓
Addresses
    ↓
Pointers
    ↓
Pointer Arithmetic
    ↓
Dynamic Memory
```

Only include useful connections.

---

# 36. Advanced Question Design

Higher difficulty must come from deeper reasoning.

Bad:

```text
Find det([[1,2],[3,4]])
Find det([[173,241],[389,912]])
```

Good progression:

```text
EASY:
Calculate determinant.

MEDIUM:
Find x such that det(A)=0.

HARD:
Find x so the rows become linearly dependent.

CHALLENGE:
Without fully calculating determinant, explain why det(A)=0.
```

---

# 37. Tutorial / Exam Style Problems

Add tasks similar to university tutorials/exams.

The student should often need to decide:

```text
What method should I use?
```

Do not give away the method.

Bad:

```text
Use the projection formula to...
```

Better:

```text
Decompose vector a into components parallel and perpendicular to b.
```

---

# 38. Reverse Problems

Add reverse-direction problems frequently.

Examples:

```text
Find x so two vectors are perpendicular.
```

```text
Find x so det(A)=0.
```

```text
Find x so vectors become linearly dependent.
```

```text
Given a condition/result, determine the missing parameter.
```

Use these especially in MEDIUM/HARD.

---

# 39. Error Analysis Problems

Major topics should include problems like:

```text
A student solved the problem as follows:

...

Find the mistake.
```

These are especially valuable for HARD/CHALLENGE.

---

# 40. Proof / Reasoning Problems

For Mathematical Analysis, Logic/Discrete Mathematics and relevant Linear Algebra topics, include:

- direct proof;
- contradiction;
- contrapositive;
- counterexample;
- complete missing proof steps;
- identify invalid proof;
- true/false with explanation.

For deterministic grading, use structured proof steps when practical.

Example:

```text
If n is odd, prove n² is odd.

Step 1:
n = ______
```

Free-form AI grading is NOT required.

---

# 41. Question Types

Support/extensibly model question types such as:

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
PARAMETER_PROBLEM
ERROR_ANALYSIS
PROOF_STEP
COUNTEREXAMPLE
MULTI_STEP
```

Do not overcomplicate the DB schema if tags/categories solve the same need cleanly.

---

# 42. Every Question Must Have an Explanation

Hard requirement:

Every scored question should include:

- correct answer;
- short feedback;
- detailed explanation;
- reasoning;
- relevant formula/rule where useful;
- progressive hints;
- full solution for multi-step tasks.

Do not store only `correctAnswer`.

---

# 43. Correct Answer Feedback

After a correct answer do not only show:

```text
✓ Правильно
```

Show:

```text
✓ Правильно

Почему:

a · b = 2·3 + 4·1
      = 6 + 4
      = 10

Скалярное произведение равно 10.
```

Correct answers should still teach.

---

# 44. Incorrect Answer Feedback

Bad:

```text
Incorrect.
```

Good:

```text
Не совсем.

Ты использовал ||b|| вместо ||b||².

В формуле векторной проекции используется квадрат длины b.

Попробуй ещё раз.
```

Where manually authored data allows, include mistake-specific feedback.

---

# 45. Progressive Hints

Use:

```text
Hint 1 — conceptual direction
Hint 2 — formula / relevant rule
Hint 3 — solution strategy
Full Solution — complete reasoning
```

Do not reveal the whole answer in Hint 1.

---

# 46. Full Solution

For math:

```text
Step 1 — identify the relevant concept
Step 2 — choose formula/method
Step 3 — substitute values
Step 4 — calculate
Step 5 — interpret result
```

For programming:

```text
Step 1 — initial memory state
Step 2 — execute statement
Step 3 — update pointer/value
Step 4 — show final state/output
```

---

# 47. Practice Summary

At session completion show useful information:

```text
Practice Complete

Topic:
Vector Projection

Difficulty:
Medium + Hard

Score:
8 / 10

XP:
+174

Mastery:
68 → 74

Performance:

Medium
5 / 5

Hard
3 / 5

Needs Review:

• Orthogonal decomposition
• Projection denominator
```

Actions:

```text
[ Review Mistakes ]
[ Practice Again ]
[ Edit Settings ]
[ Increase Difficulty ]
```

---

# 48. Mistake Review

The student should be able to review every mistake.

Example:

```text
Question 4

Your answer:
...

Correct answer:
...

Explanation:
...

Why your answer was incorrect:
...

Relevant topic:
Vector Projection
```

Provide:

```text
[ Practice Similar ]
```

where appropriate.

---

# 49. Practice Again

`Practice Again` should reuse the same configuration.

Prefer new questions where possible.

`Edit Settings` should reopen the builder with previous values pre-filled.

---

# 50. Difficulty-Specific Performance

Store enough data to calculate:

```text
Vector Projection

Easy       92%
Medium     81%
Hard       58%
Challenge  40%
```

This helps distinguish:

```text
I know the formula.
```

from:

```text
I can solve difficult problems independently.
```

It does not have to directly affect Practice GPA in V1.

---

# 51. Difficulty and Mastery

Harder questions may influence mastery slightly more.

Conceptual weights may be similar to:

```text
Easy       0.90
Medium     1.00
Hard       1.08
Challenge  1.15
```

Keep weights configurable.

However:

- one Challenge answer must not massively increase mastery;
- one failed Challenge must not destroy mastery;
- use smoothing;
- basic competence still matters.

Do not place mastery logic inside UI components.

---

# 52. Recommended Difficulty

The app may recommend difficulty based on mastery.

Example:

```text
Not assessed
Recommended: Easy + Medium
```

```text
Mastery 55
Recommended: Medium
```

```text
Mastery 78
Recommended: Medium + Hard
```

```text
Mastery 91
Recommended: Hard + Challenge
```

Recommendations are optional.

Never lock levels.

---

# 53. XP Philosophy

Keep:

**XP = activity**

**Mastery = understanding**

Suggested base XP:

```text
Easy       10
Medium     20
Hard       30
Challenge  50
```

Attempt multipliers:

```text
First attempt       ×1.00
Second attempt      ×0.80
Third+ attempt      ×0.60
```

Hint multipliers:

```text
No hint                 ×1.00
Small hint              ×0.90
Formula hint            ×0.80
Approach explanation    ×0.65
Full solution           ×0.40
```

Keep constants centralized.

Do not penalize solving time.

---

# 54. XP Farming Prevention

Repeatedly solving the same question must not create unlimited XP.

Suggested behavior:

```text
First successful completion:
100% XP

Second successful completion:
25% XP

Further repetitions:
0 XP
```

Keep configurable.

Repeated practice may still affect mastery slightly if appropriate.

---

# 55. Practice GPA

Keep the label:

```text
Practice GPA
```

Never imply it is official university GPA.

Unassessed topics must not count as zero.

Practice GPA should be based on sufficiently assessed topic mastery.

Keep the current valid implementation unless there is a real bug.

---

# 56. Weak Topics

Do not classify unstudied topics as weak.

Weak topics require real practice data.

Dashboard should show only useful weak-topic recommendations.

Weak Topics mode should continue to exist alongside Custom Practice.

---

# 57. Daily Practice

Do not remove Daily Practice.

Possible composition:

```text
2 weak-topic questions
1 recently studied topic
1 spaced-review topic
1 mixed question
```

Custom Practice does not replace automatic Daily Practice.

---

# 58. Exam Mode

Do not remove Exam Mode.

Exam Mode should generally use:

- no hints;
- no immediate correctness feedback;
- mixed questions;
- final score;
- topic breakdown.

Custom Practice is still configurable learning practice.

---

# 59. Subject-Specific Content Expansion

## Computer Architecture

Expand theory and practice for:

- number systems;
- binary;
- bitwise operations;
- Boolean algebra;
- truth tables;
- DNF;
- CNF;
- AND;
- OR;
- NOT;
- NAND;
- NOR;
- XOR;
- NAND-only design;
- half-adder;
- full-adder;
- circuit debugging;
- expression simplification.

Example progression:

```text
EASY:
Evaluate NAND(A,B).

MEDIUM:
Build AND using NAND only.

HARD:
Implement XOR using NAND only.

CHALLENGE:
Design a half-adder using NAND only and explain the construction.
```

---

# 60. Analytical Geometry and Linear Algebra

Expand theory and practice for:

- vectors;
- vector magnitude;
- dot product;
- angle;
- orthogonality;
- parallel vectors;
- vector projection;
- orthogonal component;
- vector decomposition;
- determinants;
- determinant properties;
- geometric meaning;
- linear independence;
- lines;
- planes;
- distances;
- intersections;
- parameter problems.

Use many tutorial-style problems.

---

# 61. Mathematical Analysis

Expand:

- real numbers;
- axioms;
- bounds;
- upper/lower bounds;
- supremum;
- infimum;
- maximum/minimum;
- completeness;
- epsilon terminology;
- examples/counterexamples;
- reasoning from definitions.

Include tasks like:

```text
Construct a bounded set with a supremum but no maximum.

Explain why.
```

---

# 62. Introduction to Programming — C

Expand:

- variables;
- operators;
- bitwise operators;
- arrays;
- strings;
- pointers;
- dereferencing;
- pointer arithmetic;
- pointers and arrays;
- structs;
- struct layout concepts;
- malloc/free;
- dynamic memory;
- lifetimes;
- dangling pointers;
- function pointers.

Question types:

```text
Predict Output
Find Bug
Fix Code
Trace Memory
What does p point to?
What value is stored?
Conceptual
Undefined Behavior
Compare Implementations
```

Do not present undefined behavior as deterministic output.

---

# 63. Pointer Explanations

Where useful, use visual memory explanations.

Example:

```text
Before:

p ─────► a[0]
         10

After p++:

p ─────► a[1]
         20
```

Explain that `p++` advances by one element, not one raw byte.

Any example addresses must be clearly illustrative unless taken from real output.

---

# 64. Logic and Discrete Mathematics

Expand:

- propositions;
- logical operators;
- implication;
- converse;
- inverse;
- contrapositive;
- necessary conditions;
- sufficient conditions;
- quantifiers;
- quantifier negation;
- sets;
- functions;
- direct proof;
- contradiction;
- contrapositive proof;
- counterexamples;
- invalid reasoning.

Add:

```text
English → symbols
symbols → English
```

practice.

---

# 65. Content Architecture

Educational content must stay independent from React UI.

Continue using the existing MDX/content architecture.

Do not hardcode theory in components.

Use a content layer/service.

Adding a new lecture/topic should normally require adding content/question/formula data, not editing page logic.

---

# 66. PDF Lecture Workflow

University lectures will be provided as PDFs later.

The application itself does NOT need to parse PDFs in V1.

Workflow:

```text
University PDF
        ↓
externally transformed into structured content
        ↓
topic.mdx
questions
formulas
terminology
        ↓
added to StudySpace
```

Therefore preserve a structure that makes future lecture replacement/expansion easy.

---

# 67. Topic Metadata

Keep/use structured topic metadata such as:

```yaml
title:
slug:
subject:
module:
order:
difficulty:
estimatedMinutes:
prerequisites:
tags:
```

Do not duplicate large content blocks in metadata.

---

# 68. Formula Book

Keep Formula Book connected to topics and practice.

A formula entry should support:

- title;
- formula;
- meaning;
- variables;
- when to use;
- common mistakes;
- example;
- Practice this formula.

Reuse formula data where practical instead of duplicating definitions.

---

# 69. Existing Progress Compatibility

Be careful with existing:

- topic IDs;
- slugs;
- question IDs;
- PracticeAttempts;
- TopicProgress;
- user stats;
- mastery history;
- leaderboard data.

Prefer adding strong new questions rather than deleting existing ones.

If an existing question is factually wrong, fix it carefully.

---

# 70. Question Storage

Questions and explanations must live in the question/content data layer.

Do not hardcode answer explanations into React.

A question should conceptually support:

```text
id
subjectId
topicId
type
difficulty
prompt
options
correctAnswer
shortFeedback
explanation
solution
hints
formulaHint
tags
xpBase
```

Adapt the schema to existing architecture.

---

# 71. Validation of New Questions

All new questions must be verified.

## Mathematics

- recompute answers independently;
- verify signs;
- verify formulas;
- verify parameter solutions;
- verify edge cases.

## C

- follow real C semantics;
- detect undefined behavior;
- do not invent deterministic output for undefined behavior;
- mark implementation-defined behavior where relevant.

## Logic

- verify truth values;
- verify proofs;
- verify quantifier negation.

## Computer Architecture

- verify truth tables;
- verify Boolean expressions;
- verify circuit transformations.

Do not seed questionable answers.

---

# 72. Development Strategy

Do not perform one uncontrolled rewrite.

Work module-by-module:

```text
inspect existing content
↓
expand theory
↓
add terminology
↓
add examples
↓
add common mistakes
↓
add connections
↓
inspect question bank
↓
add Medium/Hard/Challenge variety
↓
add explanations/hints/solutions
↓
verify answers
↓
test practice flow
↓
continue
```

---

# 73. Priority Topics for Content Upgrade

Prioritize:

## Computer Architecture

- Boolean Algebra
- DNF / CNF
- NAND
- logic circuits
- half-adder
- full-adder

## Analytical Geometry and Linear Algebra

- Dot Product
- Angle Between Vectors
- Vector Projection
- Orthogonal Component
- Determinants
- Linear Independence
- Lines
- Planes

## Mathematical Analysis

- Bounds
- Upper / Lower Bounds
- Supremum
- Infimum
- Completeness
- Epsilon terminology

## Introduction to Programming

- Arrays
- Pointers
- Dereferencing
- Pointer Arithmetic
- Pointers and Arrays
- Structs
- Memory Layout Concepts
- malloc
- Dynamic Memory
- Function Pointers

## Logic and Discrete Mathematics

- Implication
- Necessary / Sufficient Conditions
- Quantifiers
- Sets
- Functions
- Direct Proof
- Contradiction
- Contrapositive
- Counterexamples

---

# 74. Testing Requirements

Add/update tests for:

- Dashboard Start Practice;
- Quick Practice start;
- Topic Practice start;
- Custom Practice start;
- PracticeSession creation;
- navigation to Question 1;
- empty question handling;
- duplicate session protection;
- difficulty filtering;
- multi-difficulty selection;
- topic filtering;
- subject filtering;
- question type filtering;
- insufficient question availability;
- stable question order;
- refresh/resume;
- answer persistence;
- hint persistence;
- explanation availability;
- session completion;
- mistake review;
- XP calculation;
- attempt penalties;
- hint penalties;
- XP repetition protection;
- mastery difficulty weighting;
- existing scoring/business logic.

Keep existing tests green.

---

# 75. Manual Verification

Manually verify:

## Dashboard

```text
Dashboard
→ Start Practice
→ Question 1 appears
```

## Topic Practice

```text
Subject
→ Topic
→ Medium + Hard
→ 10 Questions
→ Start
→ Question 1 appears
```

## Custom Practice

```text
Practice
→ Custom Practice
→ Subject
→ Topics
→ Difficulties
→ Question Types
→ 10 Questions
→ Start
```

## Answer Feedback

```text
submit answer
→ correctness shown
→ explanation shown
→ hints/full solution work
```

## Refresh

Refresh during Question 3.

The same session and progress must remain.

## Completion

Finish session.

Summary must show:

- score;
- XP;
- mastery change;
- performance by difficulty;
- mistake review.

## Practice Again

Start another session with same settings.

Prefer different questions.

---

# 76. Production Verification

Before completion run:

```text
tests
lint
TypeScript/type check
Prisma/schema validation
database migrations check
production build
```

Fix errors instead of only documenting them.

Also visually inspect:

- theory pages;
- math formulas;
- code blocks;
- practice builder;
- mobile practice setup;
- question page;
- answer explanation;
- results page.

---

# 77. Final Report

At the end provide a concise engineering report.

## Start Practice Bug

- root cause;
- exact fix;
- files changed;
- flows verified.

## Theory Expanded

List subjects/modules/topics improved.

## Question Bank

Report counts:

```text
Before:
...

After:
...
```

By difficulty:

```text
Easy:
Medium:
Hard:
Challenge:
```

By subject:

```text
Computer Architecture:
Analytical Geometry and Linear Algebra:
Mathematical Analysis:
Introduction to Programming:
Logic and Discrete Mathematics:
```

## Advanced Question Types Added

Examples:

```text
Parameter Problems
Multi-step Problems
Reverse Problems
Error Analysis
Proofs
Counterexamples
Memory Tracing
Circuit Design
Undefined Behavior Analysis
```

## Explanations

Confirm counts/coverage for:

- questions with explanations;
- questions with hints;
- questions with full solutions.

## Practice Builder

Explain:

- selectable subject/topic scope;
- difficulty;
- question types;
- presets;
- hint options;
- feedback options;
- persistence.

## Validation

Describe how math/programming/logic/circuit answers were checked.

## Tests

List automated and manual verification performed.

## Remaining Gaps

Identify topics that need actual university PDFs or more curated questions.

Do not claim something is complete unless it was actually implemented and verified.

---

# 78. Definition of Done

Do not consider this task complete until:

1. Dashboard Start Practice works.
2. Topic Practice works.
3. Custom Practice works.
4. A session reliably creates and opens Question 1.
5. Sessions survive refresh.
6. Difficulty filtering works.
7. Multiple difficulties can be selected.
8. Topic/subject filtering works.
9. Question type filtering works.
10. Empty question configurations are handled clearly.
11. Repeated clicks do not create duplicate sessions.
12. Core theory is meaningfully deeper.
13. Important topics have more varied questions.
14. There are genuinely useful HARD and CHALLENGE problems.
15. Questions include answer explanations.
16. Progressive hints work.
17. Full solutions are available where relevant.
18. Mistake review works.
19. Session summaries are useful.
20. Existing XP/Mastery/Practice GPA behavior remains coherent.
21. Tests, lint, type check and production build pass.

---

# 79. Final Product Standard

Use these principles when making decisions:

> Do not make theory longer just to make it longer.
> Make it easier to understand at multiple depths.

> Do not make questions harder by using uglier numbers.
> Make them harder by requiring better reasoning.

> Every wrong answer should teach something.

> Every correct answer can still reinforce understanding.

> Automatic practice tells the student what they should train.

> Custom Practice lets the student decide exactly what they want to train.

> The student should be able to progress from understanding a formula to solving university-level problems independently.

> Quality is more important than raw content volume.

# LARGE-SCALE QUESTION BANK EXPANSION — HIGH PRIORITY

The current question bank is far too small.

This task requires a MAJOR expansion of the practice question bank.

Do not stop after adding a few questions per subject.

The goal is to make repeated practice possible without the student constantly seeing the same problems.

---

## 1. Minimum Scale

Target at least:

**500 high-quality verified questions across the whole platform.**

This is a minimum target for the current content set, not a maximum.

For CORE topics aim for:

- 30–45 questions per topic

For SECONDARY topics aim for:

- 15–25 questions per topic

For small introductory/reference topics aim for:

- 8–15 questions per topic

Do not reduce quality just to hit these numbers.

If completing the whole bank in one pass is unrealistic, work module-by-module and continue until all major topics have meaningful coverage.

Do NOT stop after expanding only one or two subjects.

---

## 2. Required Difficulty Coverage

Every important topic should contain all four levels:

EASY
MEDIUM
HARD
CHALLENGE

For a core topic with approximately 40 questions, a healthy distribution would be around:

Easy:       8–10
Medium:    12–15
Hard:      10–12
Challenge:  5–8

This is guidance, not an exact quota.

The important requirement is that HARD and CHALLENGE must contain genuinely difficult university-level reasoning.

---

## 3. Do Not Create Fake Variety

The following does NOT count as three meaningfully different questions:

Question 1:
Find det([[1,2],[3,4]])

Question 2:
Find det([[2,5],[7,8]])

Question 3:
Find det([[4,9],[2,6]])

These are effectively the same skill.

Questions should test different reasoning patterns.

For example, the determinant topic should contain:

- direct determinant calculation;
- determinant properties;
- unknown parameter;
- det(A)=0;
- linear dependence;
- row/column operations;
- geometric interpretation;
- error analysis;
- true/false reasoning;
- reverse problems;
- multi-step problems;
- challenge problems.

---

## 4. Required Variety Per Core Topic

For every core topic, attempt to cover several of these categories:

- direct calculation;
- conceptual understanding;
- method selection;
- unknown parameter;
- reverse problem;
- multi-step problem;
- error analysis;
- true/false with explanation;
- interpretation;
- connection to another topic;
- tutorial-style problem;
- exam-style problem;
- proof/reasoning;
- counterexample where relevant.

Not every category applies to every subject.

Use subject-appropriate categories.

---

## 5. Every Question Must Teach

Every scored question MUST have:

- correct answer;
- detailed explanation;
- step-by-step solution when appropriate;
- at least one useful hint;
- additional hints for HARD/CHALLENGE where appropriate;
- topic;
- difficulty;
- question type;
- tags.

Do not add large quantities of questions that contain only a prompt and answer.

---

## 6. Explanation Requirement

For calculation questions, explanations should show the steps.

Example:

Question:
Find a · b for

a = (2,4)
b = (3,1)

Explanation:

Step 1:
Use the dot product formula:

a · b = a₁b₁ + a₂b₂

Step 2:

a · b = 2·3 + 4·1

Step 3:

a · b = 6 + 4 = 10

Answer:

10

---

For conceptual questions explain WHY the answer is correct.

For programming questions trace execution/memory.

For proof questions explain the logical structure.

For Computer Architecture questions explain Boolean/circuit transformations.

---

## 7. HARD and CHALLENGE Quality

Do not make HARD questions simply use larger numbers.

HARD should require:

- several steps;
- choosing the method independently;
- combining concepts;
- working backwards;
- reasoning about conditions.

CHALLENGE should include tasks such as:

- proof;
- counterexample;
- error analysis;
- circuit design;
- inverse problem;
- several topics combined;
- deriving a condition;
- explaining why an apparently reasonable approach fails.

---

## 8. Analytical Geometry and Linear Algebra

Create a particularly large bank for:

- vectors;
- vector magnitude;
- dot product;
- angle between vectors;
- parallel/perpendicular vectors;
- vector projection;
- orthogonal component;
- vector decomposition;
- determinants;
- linear independence;
- lines;
- planes.

Use many parameter problems.

Examples:

Find x such that two vectors are perpendicular.

Find x such that vectors are parallel.

Find x such that det(A)=0.

Determine values of x for which vectors become linearly dependent.

Decompose a vector into parallel and perpendicular components.

Find an error in another student's solution.

---

## 9. Mathematical Analysis

Create substantial practice for:

- bounds;
- upper bounds;
- lower bounds;
- supremum;
- infimum;
- maximum/minimum;
- completeness;
- epsilon terminology.

Include:

- identify bounds;
- determine supremum/infimum;
- distinguish maximum from supremum;
- construct examples;
- construct counterexamples;
- true/false with justification;
- proof steps;
- identify incorrect reasoning.

Example:

Construct a bounded set with a supremum but without a maximum.

Explain why it satisfies both conditions.

---

## 10. Introduction to Programming

Create a particularly large question bank for C.

Especially:

- arrays;
- strings;
- pointers;
- dereferencing;
- pointer arithmetic;
- pointers and arrays;
- structs;
- struct layout;
- malloc;
- dynamic memory;
- function pointers.

Include many different formats:

- Predict Output
- Trace Memory
- What Does This Pointer Point To?
- Find the Bug
- Fix the Code
- Explain the Behavior
- Undefined Behavior
- Compare Implementations
- Conceptual Question

Do not treat undefined behavior as deterministic output.

---

## 11. Computer Architecture

Create many questions involving:

- Boolean expressions;
- truth tables;
- DNF;
- CNF;
- NAND;
- NOR;
- XOR;
- Boolean simplification;
- NAND-only implementation;
- half-adder;
- full-adder;
- circuit debugging;
- circuit design.

Progression should go from evaluating gates to designing circuits.

---

## 12. Logic and Discrete Mathematics

Create a large bank covering:

- propositions;
- logical operators;
- implication;
- converse;
- inverse;
- contrapositive;
- necessary/sufficient conditions;
- quantifiers;
- quantifier negation;
- sets;
- functions;
- direct proof;
- contradiction;
- contrapositive proof;
- counterexamples.

Include both:

English → formal notation

and:

formal notation → English.

---

## 13. Repeated Practice Must Remain Useful

The student should be able to complete several practice sessions for the same topic without seeing exactly the same small set of questions.

Question selection should prioritize:

1. unseen questions;
2. previously incorrect questions;
3. questions not seen recently;
4. previously solved questions.

Do not show the same exact question twice in one session.

---

## 14. Work in Batches

Do not attempt to generate hundreds of questions in one uncontrolled file write.

Work subject-by-subject and topic-by-topic.

For each topic:

1. inspect existing questions;
2. identify missing difficulty levels;
3. identify missing problem types;
4. add a batch of varied questions;
5. verify answers;
6. validate question schema;
7. continue until the target coverage is reached.

This reduces incorrect answers and duplicated questions.

---

## 15. Validation Is Mandatory

Before adding a question to the permanent bank:

Mathematics:
- independently recompute the result;
- verify formulas;
- verify parameter solutions.

Programming:
- verify C semantics;
- detect undefined behavior correctly.

Logic:
- verify truth values and proof reasoning.

Computer Architecture:
- verify truth tables and circuit transformations.

A smaller verified batch is better than a large incorrect batch.

---

## 16. Do Not Stop Too Early

Do NOT consider the question-bank expansion complete because:

- every topic has 3 questions;
- every topic has one question per difficulty;
- total count increased slightly.

The purpose is to create enough depth for repeated university practice.

Continue until the major topics have substantial banks.

---

## 17. Final Question Bank Report

At the end report:

Total questions BEFORE:
...

Total questions AFTER:
...

Target:
500+

By subject:

Computer Architecture:
...

Analytical Geometry and Linear Algebra:
...

Mathematical Analysis:
...

Introduction to Programming:
...

Logic and Discrete Mathematics:
...

By difficulty:

EASY:
...

MEDIUM:
...

HARD:
...

CHALLENGE:
...

Also list topics that still contain fewer than 15 questions.

Do not hide under-covered topics.

---

## 18. Final Quality Rule

The target is not simply:

"many questions."

The target is:

**many different, verified, educational questions that allow the student to practice the same concept repeatedly from different angles and gradually progress from basic understanding to university-level reasoning.**


# LARGE-SCALE QUESTION BANK EXPANSION — HIGH PRIORITY

The current question bank is far too small.

This task requires a MAJOR expansion of the practice question bank.

Do not stop after adding a few questions per subject.

The goal is to make repeated practice possible without the student constantly seeing the same problems.

---

## 1. Minimum Scale

Target at least:

**500 high-quality verified questions across the whole platform.**

This is a minimum target for the current content set, not a maximum.

For CORE topics aim for:

- 30–45 questions per topic

For SECONDARY topics aim for:

- 15–25 questions per topic

For small introductory/reference topics aim for:

- 8–15 questions per topic

Do not reduce quality just to hit these numbers.

If completing the whole bank in one pass is unrealistic, work module-by-module and continue until all major topics have meaningful coverage.

Do NOT stop after expanding only one or two subjects.

---

## 2. Required Difficulty Coverage

Every important topic should contain all four levels:

EASY
MEDIUM
HARD
CHALLENGE

For a core topic with approximately 40 questions, a healthy distribution would be around:

Easy:       8–10
Medium:    12–15
Hard:      10–12
Challenge:  5–8

This is guidance, not an exact quota.

The important requirement is that HARD and CHALLENGE must contain genuinely difficult university-level reasoning.

---

## 3. Do Not Create Fake Variety

The following does NOT count as three meaningfully different questions:

Question 1:
Find det([[1,2],[3,4]])

Question 2:
Find det([[2,5],[7,8]])

Question 3:
Find det([[4,9],[2,6]])

These are effectively the same skill.

Questions should test different reasoning patterns.

For example, the determinant topic should contain:

- direct determinant calculation;
- determinant properties;
- unknown parameter;
- det(A)=0;
- linear dependence;
- row/column operations;
- geometric interpretation;
- error analysis;
- true/false reasoning;
- reverse problems;
- multi-step problems;
- challenge problems.

---

## 4. Required Variety Per Core Topic

For every core topic, attempt to cover several of these categories:

- direct calculation;
- conceptual understanding;
- method selection;
- unknown parameter;
- reverse problem;
- multi-step problem;
- error analysis;
- true/false with explanation;
- interpretation;
- connection to another topic;
- tutorial-style problem;
- exam-style problem;
- proof/reasoning;
- counterexample where relevant.

Not every category applies to every subject.

Use subject-appropriate categories.

---

## 5. Every Question Must Teach

Every scored question MUST have:

- correct answer;
- detailed explanation;
- step-by-step solution when appropriate;
- at least one useful hint;
- additional hints for HARD/CHALLENGE where appropriate;
- topic;
- difficulty;
- question type;
- tags.

Do not add large quantities of questions that contain only a prompt and answer.

---

## 6. Explanation Requirement

For calculation questions, explanations should show the steps.

Example:

Question:
Find a · b for

a = (2,4)
b = (3,1)

Explanation:

Step 1:
Use the dot product formula:

a · b = a₁b₁ + a₂b₂

Step 2:

a · b = 2·3 + 4·1

Step 3:

a · b = 6 + 4 = 10

Answer:

10

---

For conceptual questions explain WHY the answer is correct.

For programming questions trace execution/memory.

For proof questions explain the logical structure.

For Computer Architecture questions explain Boolean/circuit transformations.

---

## 7. HARD and CHALLENGE Quality

Do not make HARD questions simply use larger numbers.

HARD should require:

- several steps;
- choosing the method independently;
- combining concepts;
- working backwards;
- reasoning about conditions.

CHALLENGE should include tasks such as:

- proof;
- counterexample;
- error analysis;
- circuit design;
- inverse problem;
- several topics combined;
- deriving a condition;
- explaining why an apparently reasonable approach fails.

---

## 8. Analytical Geometry and Linear Algebra

Create a particularly large bank for:

- vectors;
- vector magnitude;
- dot product;
- angle between vectors;
- parallel/perpendicular vectors;
- vector projection;
- orthogonal component;
- vector decomposition;
- determinants;
- linear independence;
- lines;
- planes.

Use many parameter problems.

Examples:

Find x such that two vectors are perpendicular.

Find x such that vectors are parallel.

Find x such that det(A)=0.

Determine values of x for which vectors become linearly dependent.

Decompose a vector into parallel and perpendicular components.

Find an error in another student's solution.

---

## 9. Mathematical Analysis

Create substantial practice for:

- bounds;
- upper bounds;
- lower bounds;
- supremum;
- infimum;
- maximum/minimum;
- completeness;
- epsilon terminology.

Include:

- identify bounds;
- determine supremum/infimum;
- distinguish maximum from supremum;
- construct examples;
- construct counterexamples;
- true/false with justification;
- proof steps;
- identify incorrect reasoning.

Example:

Construct a bounded set with a supremum but without a maximum.

Explain why it satisfies both conditions.

---

## 10. Introduction to Programming

Create a particularly large question bank for C.

Especially:

- arrays;
- strings;
- pointers;
- dereferencing;
- pointer arithmetic;
- pointers and arrays;
- structs;
- struct layout;
- malloc;
- dynamic memory;
- function pointers.

Include many different formats:

- Predict Output
- Trace Memory
- What Does This Pointer Point To?
- Find the Bug
- Fix the Code
- Explain the Behavior
- Undefined Behavior
- Compare Implementations
- Conceptual Question

Do not treat undefined behavior as deterministic output.

---

## 11. Computer Architecture

Create many questions involving:

- Boolean expressions;
- truth tables;
- DNF;
- CNF;
- NAND;
- NOR;
- XOR;
- Boolean simplification;
- NAND-only implementation;
- half-adder;
- full-adder;
- circuit debugging;
- circuit design.

Progression should go from evaluating gates to designing circuits.

---

## 12. Logic and Discrete Mathematics

Create a large bank covering:

- propositions;
- logical operators;
- implication;
- converse;
- inverse;
- contrapositive;
- necessary/sufficient conditions;
- quantifiers;
- quantifier negation;
- sets;
- functions;
- direct proof;
- contradiction;
- contrapositive proof;
- counterexamples.

Include both:

English → formal notation

and:

formal notation → English.

---

## 13. Repeated Practice Must Remain Useful

The student should be able to complete several practice sessions for the same topic without seeing exactly the same small set of questions.

Question selection should prioritize:

1. unseen questions;
2. previously incorrect questions;
3. questions not seen recently;
4. previously solved questions.

Do not show the same exact question twice in one session.

---

## 14. Work in Batches

Do not attempt to generate hundreds of questions in one uncontrolled file write.

Work subject-by-subject and topic-by-topic.

For each topic:

1. inspect existing questions;
2. identify missing difficulty levels;
3. identify missing problem types;
4. add a batch of varied questions;
5. verify answers;
6. validate question schema;
7. continue until the target coverage is reached.

This reduces incorrect answers and duplicated questions.

---

## 15. Validation Is Mandatory

Before adding a question to the permanent bank:

Mathematics:
- independently recompute the result;
- verify formulas;
- verify parameter solutions.

Programming:
- verify C semantics;
- detect undefined behavior correctly.

Logic:
- verify truth values and proof reasoning.

Computer Architecture:
- verify truth tables and circuit transformations.

A smaller verified batch is better than a large incorrect batch.

---

## 16. Do Not Stop Too Early

Do NOT consider the question-bank expansion complete because:

- every topic has 3 questions;
- every topic has one question per difficulty;
- total count increased slightly.

The purpose is to create enough depth for repeated university practice.

Continue until the major topics have substantial banks.

---

## 17. Final Question Bank Report

At the end report:

Total questions BEFORE:
...

Total questions AFTER:
...

Target:
500+

By subject:

Computer Architecture:
...

Analytical Geometry and Linear Algebra:
...

Mathematical Analysis:
...

Introduction to Programming:
...

Logic and Discrete Mathematics:
...

By difficulty:

EASY:
...

MEDIUM:
...

HARD:
...

CHALLENGE:
...

Also list topics that still contain fewer than 15 questions.

Do not hide under-covered topics.

---

## 18. Final Quality Rule

The target is not simply:

"many questions."

The target is:

**many different, verified, educational questions that allow the student to practice the same concept repeatedly from different angles and gradually progress from basic understanding to university-level reasoning.**