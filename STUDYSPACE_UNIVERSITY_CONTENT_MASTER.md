# StudySpace — University-Grounded Content & Practice Master Prompt

## 0. Mission

You are continuing development of the existing **StudySpace** university learning platform.

The application already exists. It contains subjects, theory/topic pages, practice, progress, XP, mastery, Practice GPA, leaderboard, profile, Telegram authentication, privacy settings, Formula Book, Daily Practice, Weak Topics and an AI Tutor placeholder.

This task is **not** a redesign and **not** a rewrite from scratch.

The goal is to turn StudySpace into a learning system grounded in the student's **actual university labs and homework style**, with:

1. deeper theory;
2. a much larger verified question bank;
3. meaningful `EASY / MEDIUM / HARD / CHALLENGE` levels;
4. university-style tasks similar in structure and reasoning level to the supplied course materials;
5. detailed explanations after answers;
6. hints and full solutions;
7. a reliable Custom Practice Builder;
8. stable practice sessions;
9. enough question variety for repeated practice;
10. an architecture that can later absorb additional lecture PDFs.

The five current subjects are:

- Computer Architecture
- Analytical Geometry and Linear Algebra
- Mathematical Analysis
- Introduction to Programming
- Logic and Discrete Mathematics

The central learning loop is:

**Learn → Understand → Practice → Make mistakes → Review → Improve → Master**

---

# 1. Source-of-Truth Principle

The supplied university labs, homework sheets and solution files define the **current curriculum scope and expected difficulty**.

Use the curriculum map in this prompt as the source of truth.

Do **not** silently treat standard textbook topics as already covered by the university if they are not present in the supplied materials.

Examples:

- `malloc`, advanced dynamic memory and function pointers are standard C topics, but they are not yet central in the supplied Lab 1–5 materials. Keep them out of the main "already studied" progression unless later source material confirms them.
- later Computer Architecture topics such as CPU internals or assembly may be mentioned as future direction, but should not be presented as already completed unless the repository already contains verified course content for them.

When adding content:

- preserve the terminology and level of the university material;
- explain it more clearly in Russian;
- keep important English academic terms;
- generate **new analogous tasks**, not mechanical copies of lab questions;
- use lab problems as difficulty/style calibration.

Do not copy university solution text verbatim.

---

# 2. Product Constraints

Do NOT:

- rewrite the app from scratch;
- replace the current stack without a concrete reason;
- redesign unrelated pages;
- break Telegram authentication;
- remove valid progress;
- rename topic/question IDs unnecessarily;
- delete valid existing attempts/history;
- add a real AI Tutor;
- add LLM APIs;
- add AI grading;
- execute arbitrary C code from users;
- hardcode theory or explanations directly in React components.

The AI Tutor remains a disabled **Coming soon** placeholder.

Keep educational content in the existing content/data layer (MDX or the repository's established equivalent).

---

# 3. Work Order

Work in this order.

## Phase A — Inspect and Recover

Inspect:

- repository structure;
- current routes;
- current MDX/content;
- question bank;
- PracticeSession model;
- current practice selection logic;
- scoring;
- mastery;
- Practice GPA;
- XP;
- existing tests;
- existing migrations;
- broken or partial flows.

Preserve what already works.

## Phase B — Fix Practice Start

The current **Start Practice / Начать практику** flow must work reliably.

## Phase C — Custom Practice Builder

Implement or finish topic/difficulty/type/count selection.

## Phase D — Expand Question Bank

This is a major priority.

## Phase E — Expand Theory

Deepen the core topics using the real university curriculum map below.

## Phase F — Validate

Run automated and manual verification.

---

# 4. Critical Bug: Start Practice

Reproduce and fix all Start Practice flows:

- Dashboard → Start Practice
- Practice → Quick Practice
- Topic → Practice
- Daily Practice → Start
- Weak Topics → Practice
- Custom Practice → Start

Expected flow:

```text
click Start Practice
        ↓
resolve configuration
        ↓
validate configuration
        ↓
select matching questions
        ↓
create PracticeSession
        ↓
persist selected question IDs and order
        ↓
redirect to session
        ↓
render Question 1
```

Inspect:

- `onClick`;
- links;
- router navigation;
- server actions;
- API routes;
- auth guards;
- empty question sets;
- database errors;
- invalid filters;
- client/server boundaries;
- stale state;
- redirects.

A button must never silently do nothing.

Add loading state and duplicate-click protection.

---

# 5. Stable Practice Sessions

A created session must persist:

- mode;
- subject;
- selected topic IDs;
- selected difficulties;
- selected question types;
- question count;
- hints setting;
- feedback mode;
- selected question IDs;
- question order;
- submitted answers;
- attempt counts;
- used hints;
- current position;
- created/completed timestamps.

Refreshing must not generate a new random session.

Allow resuming incomplete practice.

---

# 6. Custom Practice Builder

Provide a dedicated builder, preferably:

```text
/practice/custom
```

The student can choose:

- subject;
- one topic;
- multiple topics;
- full subject;
- one or several difficulty levels;
- number of questions;
- question types;
- hints enabled/disabled;
- feedback after each question / only at the end.

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

Questions
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

Normal setup should take about 3–5 interactions.

Do not create a long wizard.

---

# 7. Difficulty Model

Difficulty is based on **reasoning**, not ugly arithmetic.

## EASY

Direct application.

The student already knows the method.

Examples:

- calculate dot product;
- evaluate a truth-table row;
- dereference a simple pointer;
- evaluate a gate;
- identify file mode;
- basic domain restriction.

## MEDIUM

The student must identify the method.

Examples:

- find a parameter so vectors are perpendicular;
- decide whether a mapping is injective;
- construct DNF/CNF;
- determine what a pointer expression changes;
- design AND using NAND;
- determine a function domain without being told which condition to check.

## HARD

Several steps or concepts must be combined.

Examples:

- projection + orthogonal decomposition + verification;
- reconstruct a matrix from an inverse expression;
- nested quantifier negation;
- trace pointer/memory state across several expressions;
- derive a Full Adder;
- structure + enum + sorting;
- prove an induction statement.

## CHALLENGE

Non-routine reasoning.

Examples:

- proof/counterexample;
- detect invalid reasoning;
- construct a domain making a predicate true/false;
- derive all vectors satisfying several geometric constraints;
- priority-encoder-style logic design;
- union + packed bit representation;
- explain why an apparently plausible method fails.

---

# 8. Large-Scale Question Bank Expansion

The current bank is too small.

Target **500+ high-quality verified questions** across the currently covered curriculum.

This is a minimum direction, not a reason to create filler.

Use staged milestones:

```text
Milestone 1: 200+ verified questions
Milestone 2: 350+ verified questions
Milestone 3: 500+ verified questions
```

At every milestone:

- validate schemas;
- validate answers;
- detect duplicates;
- run tests;
- report coverage gaps.

For a CORE topic aim roughly for:

```text
Easy       8–12
Medium    12–18
Hard      10–15
Challenge  5–10
```

For secondary topics:

```text
15–25 total
```

For small introductory topics:

```text
8–15 total
```

Quality > quantity.

Do not generate 20 copies of the same calculation with different numbers.

---

# 9. Question Diversity

Each core topic should contain several applicable patterns:

- direct calculation;
- conceptual understanding;
- method selection;
- reverse problem;
- unknown parameter;
- multi-step problem;
- error analysis;
- true/false with explanation;
- interpretation;
- debugging;
- proof/reasoning;
- counterexample;
- "find the mistake";
- connect two related concepts;
- tutorial/exam style.

Not every type applies to every subject.

Use subject-specific types.

---

# 10. Every Question Must Teach

Every scored question must have:

- subject;
- topic;
- difficulty;
- question type/tags;
- prompt;
- correct answer;
- short feedback;
- detailed explanation;
- full solution where relevant;
- at least one hint;
- progressive hints for harder questions;
- common mistake where useful.

Do not store only:

```text
correctAnswer: ...
```

Wrong answers should teach.

Correct answers should reinforce understanding.

---

# 11. Progressive Hints

Use:

```text
Hint 1 — conceptual direction
Hint 2 — relevant formula/rule
Hint 3 — solution strategy
Full Solution — complete reasoning
```

Do not reveal the final answer in Hint 1.

---

# 12. Feedback Style

Main explanation language:

**Russian**

Important course terminology:

**English + Russian**

Examples:

```text
Скалярное произведение (dot product)
линейная независимость (linear independence)
инъекция (injection)
сюръекция (surjection)
битовое поле (bit field)
разыменование (dereferencing)
```

University-style task phrasing may remain in English or be shown bilingually.

The student should learn to understand phrases used by professors, e.g.:

```text
"Find all values of x such that..."
"Determine whether the following set is a basis."
"Let A be bounded above."
"Prove by induction."
"What will be the output?"
```

---

# 13. Theory Page Standard

Core topics should not be short placeholder notes.

Where relevant, use:

```text
1. Что это?
2. Интуиция
3. Formal definition
4. Зачем это нужно?
5. English terminology
6. Formula / rule
7. Почему это работает?
8. Basic worked example
9. Tutorial-level example
10. Common-trap example
11. Common mistakes
12. Connections to other topics
13. How your professor may say it
14. Summary
15. Practice entry points
```

Do not add filler.

The goal is deeper understanding, not word count.

---

# 14. Practice Presets

Keep manual control and add presets:

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
```

## Exam Prep

```text
Hard + Challenge
15 questions
Hints off by default
Feedback at end
```

Presets must remain editable.

---

# 15. Question Selection

Selection priority:

1. unseen matching questions;
2. previously incorrect matching questions;
3. matching questions not seen recently;
4. previously solved matching questions.

Never repeat the same question twice inside one session.

If the user requests 20 HARD questions but only 8 exist, show a choice:

```text
Only 8 Hard questions are available.

[ Use all 8 ]
[ Include Medium ]
[ Change settings ]
```

Do not silently change difficulty.

---

# 16. Subject 1 — Mathematical Analysis

## Confirmed Curriculum

The uploaded Mathematical Analysis materials currently support these areas:

### Complex Numbers

- algebraic form;
- operations with complex numbers;
- modulus and argument;
- trigonometric form;
- exponential form;
- choosing the correct argument/quadrant;
- De Moivre's theorem;
- powers;
- square roots;
- n-th roots;
- roots of unity;
- geometric interpretation on the complex plane.

### Mathematical Induction

- base case;
- inductive hypothesis;
- inductive step;
- Newton/binomial expansion;
- inequalities by induction;
- divisibility-style reasoning;
- identifying an invalid induction argument.

### Functions and Mappings

- domain;
- range;
- rational-function restrictions;
- radicals;
- logarithmic restrictions;
- piecewise functions;
- preimages;
- inverse functions;
- existence of inverse;
- graph transformations;
- injection;
- surjection;
- bijection;
- domain/range restrictions to make a function bijective.

## Recommended Topic Structure

```text
Complex Numbers
Complex Plane
Modulus and Argument
Trigonometric Form
Exponential Form
De Moivre's Theorem
Powers of Complex Numbers
Roots of Complex Numbers
Roots of Unity

Mathematical Induction
Base Case
Inductive Hypothesis
Inductive Step
Induction for Identities
Induction for Inequalities
Invalid Induction Proofs

Functions
Domain
Range
Preimage
Inverse Function
Graph Transformations
Injection
Surjection
Bijection
Domain/Range Restrictions
```

## Realistic Difficulty Calibration

### EASY

- convert simple complex numbers between forms;
- calculate modulus;
- identify a function domain restriction;
- perform base case;
- determine simple domain/range;
- identify injection/surjection on a simple restricted domain.

### MEDIUM

- correct quadrant for argument;
- powers via De Moivre;
- domain of radical/logarithmic/rational combinations;
- preimages;
- inverse of a one-to-one function;
- standard induction proof.

### HARD

- n-th roots;
- roots of unity;
- choose restrictions making a function bijective;
- inverse after restriction;
- graph transformations;
- nontrivial induction inequality.

### CHALLENGE

- find the error in an induction proof;
- construct counterexamples;
- compare multiple valid domain restrictions;
- reason geometrically about roots;
- determine all mappings/restrictions satisfying conditions.

## Important Practice Patterns

```text
"Find the domain."
"Determine the range."
"Find f^{-1}(A)."
"Find the inverse if it exists."
"Choose domain/range restrictions to make f bijective."
"Prove by induction."
"Find the error in the proof."
"Find all n-th roots."
```

---

# 17. Subject 2 — Analytical Geometry and Linear Algebra

## Confirmed Curriculum

### Vectors and Geometry

- vector operations;
- position vectors;
- points expressed through vectors;
- norm/magnitude;
- linear combinations;
- span;
- linear independence;
- basis;
- dimension reasoning.

### Dot Product and Geometry

- dot product;
- norm relationship;
- angle between vectors;
- perpendicularity;
- symbolic proofs of perpendicularity;
- parameter problems;
- vectors satisfying several geometric constraints.

### Matrices

- matrix dimensions;
- valid/invalid matrix expressions;
- addition;
- multiplication;
- transpose;
- trace;
- determinants;
- determinant properties;
- inverse matrix;
- cofactors/adjugate where used;
- matrix equations involving inverses;
- parameter problems;
- determinant and linear dependence.

## Recommended Topic Structure

```text
Vectors
Position Vectors
Vector Norm
Linear Combinations
Span
Linear Independence
Basis
Dimension

Dot Product
Angle Between Vectors
Orthogonality
Parallelism
Vector Projection
Orthogonal Component
Vector Decomposition

Matrices
Matrix Dimensions
Matrix Addition
Matrix Multiplication
Transpose
Trace
Determinant
Determinant Properties
Inverse Matrix
Matrix Equations
```

Keep Projection/Orthogonal Component only if already present in the repository/course content or provided lectures; it is compatible with the course direction but do not pretend a supplied lab explicitly covered more than it did.

## Realistic Difficulty Calibration

### EASY

- norm;
- dot product;
- direct matrix multiplication;
- trace;
- determinant;
- identify dimensions.

### MEDIUM

- angle between vectors;
- determine perpendicularity;
- parameter from norm/orthogonality condition;
- determine whether a set is a basis;
- use determinant properties.

### HARD

- parameter values for basis/linear independence;
- symbolic perpendicularity proofs;
- reconstruct `A` from expressions such as `(kA)^{-1}=B`;
- multiple vector constraints;
- determinant property reasoning without full recomputation.

### CHALLENGE

- determine all vectors satisfying several angle/norm/orthogonality conditions;
- count the number of possible solutions in `R^2` vs `R^3`;
- prove/explain determinant transformations;
- error analysis;
- reverse-engineer a matrix/vector condition.

## Important Practice Patterns

```text
"Is this set a basis? Explain."
"Find x such that..."
"Find all x for which..."
"Determine whether the vectors are linearly independent."
"Find the angle."
"Prove the expressions are perpendicular."
"Recover A from an inverse equation."
"Predict how det(A) changes without recomputing it."
```

---

# 18. Subject 3 — Logic and Discrete Mathematics

## Confirmed Curriculum

### Propositional Logic

- propositions;
- NOT;
- AND;
- OR;
- implication;
- biconditional;
- XOR;
- truth tables;
- multi-variable expressions.

### Normal Forms

- DNF;
- CNF;
- constructing DNF from truth rows;
- constructing CNF from false rows;
- simplification;
- logical equivalence;
- De Morgan's laws;
- Algebraic Normal Form (ANF);
- modulo-2 Boolean algebra.

### Predicate Logic

- predicates;
- `∀`;
- `∃`;
- translation symbols ↔ English;
- truth values on a given domain;
- nested quantifiers;
- negating quantified statements;
- constructing domains/counterexamples.

### Sets and Combinatorial Reasoning

- union;
- intersection;
- complement/difference;
- Venn diagrams;
- Cartesian product;
- cardinality;
- power sets;
- inclusion-exclusion;
- Pigeonhole Principle.

## Recommended Topic Structure

```text
Propositions
Logical Operators
Implication
Biconditional
XOR
Truth Tables
Logical Equivalence
De Morgan's Laws
DNF
CNF
ANF

Predicates
Universal Quantifier
Existential Quantifier
Nested Quantifiers
Negating Quantifiers
Domains and Counterexamples

Sets
Set Operations
Cartesian Product
Power Set
Cardinality
Inclusion-Exclusion
Pigeonhole Principle
```

## Realistic Difficulty Calibration

### EASY

- evaluate one truth-table row;
- translate simple symbols to English;
- simple set operation;
- identify power-set elements.

### MEDIUM

- build full truth table;
- construct DNF/CNF;
- determine truth over a fixed domain;
- Cartesian products/cardinality;
- use De Morgan.

### HARD

- simplify DNF/CNF;
- derive ANF;
- negate nested quantifiers;
- inclusion-exclusion contradiction;
- standard Pigeonhole proof.

### CHALLENGE

- construct a domain making a quantified statement true and another making it false;
- give counterexample;
- detect invalid logical reasoning;
- multi-step equivalence;
- geometric/combinatorial Pigeonhole arguments.

## Important Practice Patterns

```text
"Construct the truth table."
"Find DNF/CNF."
"Simplify the expression."
"Convert to ANF."
"Translate into English."
"Negate the statement."
"Choose a domain where this is true/false."
"Give a counterexample."
"Prove using the Pigeonhole Principle."
```

---

# 19. Subject 4 — Computer Architecture

## Confirmed Curriculum

### FPGA Foundations

- basic FPGA idea;
- FPGA vs fixed-purpose CPU concept;
- DE10-Lite MAX 10;
- board inputs/outputs;
- switches;
- push buttons;
- LEDs;
- basic project workflow.

### Quartus Prime Workflow

- New Project Wizard;
- project directory/name/top-level entity;
- FPGA family/model;
- block diagram/schematic;
- logic gates;
- wiring;
- compilation;
- Pin Planner;
- assigning physical pins;
- recompilation;
- Programmer;
- loading to FPGA;
- hardware testing.

### Boolean Logic in Hardware

- Boolean function;
- truth table;
- logic gate;
- AND;
- OR;
- NOT;
- XOR;
- NAND;
- NOR;
- XNOR;
- universal gates;
- NAND-only implementation;
- NOR-only implementation.

### Arithmetic Circuits

- binary addition;
- carry;
- LSB/MSB;
- Half Adder;
- Full Adder;
- cascading adders;
- 4-bit/ripple-style adder;
- binary subtraction;
- borrow;
- subtractor concepts where present.

## Recommended Topic Structure

```text
FPGA Basics
FPGA vs CPU
DE10-Lite
Inputs and Outputs
Quartus Workflow
Block Diagrams
Pin Assignment
Compilation and Programming

Boolean Functions
Truth Tables for Hardware
Logic Gates
NAND
NOR
Universal Gates
NAND-only Design
NOR-only Design

Binary Addition
Carry
Half Adder
Full Adder
Ripple-Carry / Multi-bit Adder
Binary Subtraction
Borrow
Subtractor Circuits
```

## Realistic Difficulty Calibration

### EASY

- identify board I/O;
- evaluate a gate;
- direct truth table;
- simple binary addition;
- Half Adder output.

### MEDIUM

- verbal requirement → Boolean expression;
- build AND/OR/NOT using universal gates;
- identify missing Quartus step;
- trace basic Full Adder.

### HARD

- NAND-only/NOR-only circuit;
- truth table → expression → circuit;
- derive Full Adder;
- carry/borrow tracing;
- debug an incorrect circuit or pin setup.

### CHALLENGE

- priority-encoder-style requirement;
- arbitrary behavior → truth table → simplify → gate design;
- optimize universal-gate implementation;
- multi-bit adder/subtractor reasoning;
- identify why a design works in simulation but not hardware.

## Important Practice Patterns

```text
"LED turns on iff..."
"Derive the truth table."
"Write the Boolean expression."
"Implement using NAND only."
"Implement using NOR only."
"Design a Half/Full Adder."
"Trace the carry."
"Find the wiring/design error."
"What Quartus step was missed?"
```

---

# 20. Subject 5 — Introduction to Programming (C)

## Confirmed Curriculum

### C Toolchain and Basics

- source files;
- GCC;
- warnings;
- compilation;
- object files;
- linking;
- multiple files;
- basic GDB commands;
- structure of a `.c` file;
- headers;
- `#include`;
- variables;
- initialization;
- arithmetic expressions.

### Arrays, Strings and Pointers

- addresses;
- `&`;
- pointers;
- `*`;
- arrays;
- strings;
- null terminator;
- passing arrays to functions;
- pointer/array relationship;
- pointer arithmetic;
- `sizeof`;
- string operations;
- pointer tracing.

### Loops and Problem Solving

- nested loops;
- shape/pattern printing;
- digit processing;
- Strong Numbers;
- frequency histograms;
- duplicate removal;
- ASCII;
- bounded brute-force search as a toy algorithmic exercise.

Do not generalize the toy password exercise into real credential attacks or security-abuse tooling.

### File I/O

- `FILE *`;
- `fopen`;
- modes `r`, `w`, `a`, `r+`, `w+`, `a+`;
- `fclose`;
- `fgets`;
- `fputs`;
- `fscanf`;
- `fprintf`;
- file error checking.

### Recursion

- recursive function;
- base case;
- recursive case;
- call tracing;
- local variables;
- static local variables.

### Structures / Unions / Enums / Bit Fields

- `struct`;
- `typedef struct`;
- nested structures;
- arrays of structures;
- structure memory;
- `union`;
- shared storage;
- enum;
- switch with enum;
- bit fields;
- packing fields;
- raw/parsed union patterns;
- structure/enum sorting problems.

## Recommended Topic Structure

```text
C Program Structure
GCC Basics
Compilation and Linking
Debugging with GDB
Header Files
Variables and Expressions

Arrays
Strings
Null Terminator
Pointers
Address vs Value
Dereferencing
Pointers and Arrays
Pointer Arithmetic
Pointers as Function Arguments
2D Arrays and Pointers
sizeof

Loops and Patterns
Digit Processing
Character Frequencies
ASCII

File I/O
File Modes
Reading Files
Writing Files
Error Handling

Recursion
Base Case
Call Stack
Static Variables in Recursion

Structures
Nested Structures
Arrays of Structures
Enums
Unions
Struct vs Union Memory
Bit Fields
Packed Data
```

## Realistic Difficulty Calibration

### EASY

- variables/operators;
- basic array indexing;
- basic string/null terminator;
- simple pointer dereference;
- simple struct/enum syntax;
- choose a file mode.

### MEDIUM

- loops + arrays;
- string manipulation;
- swap by pointer;
- basic pointer arithmetic;
- simple file I/O;
- recursion factorial trace;
- simple structures.

### HARD

- pointer expression tracing;
- arrays + pointers;
- string memory mutation;
- 2D arrays through pointers;
- recursive calls with state;
- arrays of structs;
- file-processing logic;
- bit fields.

### CHALLENGE

- subtle pointer expressions;
- distinguish pointer swap vs value swap;
- memory-state reconstruction;
- union byte manipulation;
- packed fields;
- raw integer ↔ parsed bit-field representation;
- recursion + static state;
- multiple enums + structs + sorting;
- diagnose undefined behavior.

## Required Pointer Practice Style

Do not teach pointers only through definitions.

Use memory diagrams:

```text
array

index        0      1      2
           ┌────┬────┬────┐
value      │ 10 │ 20 │ 30 │
           └────┴────┴────┘
             ▲
             p
```

Explain differences such as:

```c
++*p
```

vs

```c
*++p
```

step by step.

Do not present concrete memory addresses as universal values.

Use illustrative addresses only when clearly labeled as examples.

## Undefined Behavior

Never claim deterministic output for undefined behavior.

If code has undefined behavior, teach:

```text
The program has undefined behavior.
```

and explain why.

---

# 21. Cross-Subject Connections

Use meaningful cross-links without merging subjects.

Examples:

```text
Logic & Discrete Mathematics
DNF / CNF / Boolean functions
        ↓
Computer Architecture
logic gates
        ↓
NAND/NOR implementation
        ↓
FPGA circuit
```

```text
C
bit fields / binary representation
        ↔
Computer Architecture
bits / hardware logic
```

```text
Linear Algebra
linear independence / basis
        ↔
matrix determinant reasoning
```

These links should help the student build a mental model.

---

# 22. Subject-Specific Practice Filters

## Mathematical Analysis

```text
Calculation
Domain/Range
Inverse
Graph Transformation
Induction
Proof
Counterexample
Error Analysis
```

## AGLA

```text
Calculation
Vector Geometry
Parameter Problem
Matrix Problem
Multi-step
Proof / Reasoning
Error Analysis
```

## Logic & Discrete Math

```text
Truth Table
Normal Form
Symbolic Translation
Quantifiers
Set Problem
Proof
Counterexample
Pigeonhole
```

## Computer Architecture

```text
Truth Table
Boolean Expression
Circuit Design
NAND/NOR Conversion
Binary Arithmetic
Adder/Subtractor
Quartus Workflow
Error Analysis
```

## Introduction to Programming

```text
Predict Output
Trace Memory
Find Bug
Fix Code
Conceptual
Write Small Function
File I/O
Pointer Problem
Recursion Trace
Struct/Union/Enum
Undefined Behavior
```

---

# 23. Practice Summary and Review

At completion show:

```text
Practice Complete

Topic:
Pointers and Arrays

Difficulty:
Medium + Hard

Score:
8 / 10

XP:
+...

Mastery:
... → ...

Performance:
Medium 5/5
Hard   3/5

Needs Review:
• pointer increment precedence
• pointer vs pointee
```

Actions:

```text
[ Review Mistakes ]
[ Practice Again ]
[ Edit Settings ]
[ Increase Difficulty ]
```

Mistake review should show:

```text
Your answer
Correct answer
Explanation
Where the reasoning went wrong
Relevant concept
```

---

# 24. Difficulty-Specific Performance

Store enough data to report:

```text
Topic: Pointer Arithmetic

Easy       92%
Medium     81%
Hard       58%
Challenge  40%
```

This distinguishes:

```text
"I know the rule"
```

from:

```text
"I can solve university-level problems independently"
```

---

# 25. Mastery and XP

Preserve the principle:

**XP = activity**

**Mastery = understanding**

Difficulty may influence mastery slightly, but use smoothing.

Suggested conceptual weights:

```text
Easy       0.90
Medium     1.00
Hard       1.08
Challenge  1.15
```

Do not let one Challenge answer radically alter mastery.

Do not punish a failed Challenge excessively.

Do not place mastery formulas inside UI components.

---

# 26. Practice GPA

Keep the label:

```text
Practice GPA
```

It is an internal StudySpace metric, not official university GPA.

Unassessed topics must not count as zero.

Do not change working GPA logic unless a concrete bug exists.

---

# 27. Daily Practice and Weak Topics

Do not remove automatic practice.

Daily Practice can use a mix such as:

```text
2 weak-topic questions
1 recently studied question
1 spaced-review question
1 mixed question
```

Unstudied topics are not "weak".

Weak Topics require actual performance data.

Custom Practice complements Daily Practice; it does not replace it.

---

# 28. Exam Mode

Keep Exam Mode separate.

Typical behavior:

- no hints;
- no immediate correctness;
- mixed problems;
- result at end;
- topic/difficulty breakdown.

---

# 29. Content Storage and Future PDFs

The application itself does not need PDF parsing in this phase.

Use:

```text
University PDF
      ↓
externally transformed / curated
      ↓
MDX theory + questions + formulas + terminology
      ↓
StudySpace
```

Adding a future lecture should mostly require content/data changes, not page-logic changes.

---

# 30. Formula Book Integration

Formula entries should support:

- title;
- formula;
- explanation;
- variable definitions;
- when to use;
- common mistakes;
- worked example;
- linked topic;
- `Practice this formula`.

Reuse existing data instead of duplicating formulas across UI components.

---

# 31. Content Generation Rules

When generating new content:

1. inspect current topic first;
2. preserve correct existing material;
3. identify missing concepts;
4. add explanation only within confirmed curriculum;
5. add terminology;
6. add worked examples;
7. add common mistakes;
8. add university-style practice;
9. verify every answer;
10. run validation before continuing.

Do not create an uncontrolled single-pass rewrite of every file.

Work subject-by-subject and topic-by-topic.

---

# 32. Question Validation

## Mathematics

For every generated question:

- independently recompute;
- verify signs;
- verify domains;
- verify range/inverse restrictions;
- verify parameter solutions;
- verify proofs/counterexamples.

## Logic

- verify truth values;
- verify DNF/CNF/ANF;
- verify quantifier negation;
- verify domain/counterexample claims;
- verify set/cardinality calculations.

## Computer Architecture

- verify truth tables;
- verify Boolean equivalences;
- verify NAND/NOR implementation;
- verify carry/borrow logic;
- verify circuit behavior.

## C

- verify C semantics;
- verify operator precedence;
- distinguish pointer from pointee;
- identify undefined behavior;
- do not assume implementation-specific sizes/addresses unless explicitly constrained;
- compile small deterministic examples in a safe local test when useful.

---

# 33. Anti-Duplicate Rules

Before adding a question, check existing questions in the same topic.

These do NOT count as meaningful variety:

```text
Find det([[1,2],[3,4]])
Find det([[2,5],[4,8]])
Find det([[7,9],[1,3]])
```

Prefer:

```text
calculate determinant
parameter so determinant is zero
use row operation property
linear-dependence interpretation
find a reasoning error
predict change after row swap
reverse problem
```

Same principle for all subjects.

---

# 34. Question Bank Progress File

Because large content expansion may exceed one Codex session, maintain a repository progress file such as:

```text
CONTENT_EXPANSION_PROGRESS.md
```

Track:

- total questions;
- counts by subject;
- counts by topic;
- counts by difficulty;
- topics completed;
- topics still weak;
- validation status;
- last completed batch;
- next recommended batch.

If execution is interrupted, inspect this file before continuing.

Do not restart question generation from scratch.

---

# 35. Tests

Add or update tests for:

- Start Practice;
- PracticeSession creation;
- Question 1 navigation;
- duplicate session prevention;
- empty session prevention;
- subject filtering;
- topic filtering;
- multi-topic filtering;
- difficulty filtering;
- multiple selected difficulties;
- question type filtering;
- insufficient availability handling;
- stable question order;
- refresh/resume;
- answer persistence;
- hints;
- explanations;
- mistake review;
- session completion;
- XP;
- mastery;
- repetition prevention.

Keep existing tests green.

---

# 36. Manual Verification

Manually verify:

## Flow A

```text
Dashboard
→ Start Practice
→ Question 1
```

## Flow B

```text
Subject
→ Topic
→ Medium + Hard
→ 10 Questions
→ Start
```

## Flow C

```text
Practice
→ Custom
→ choose subject
→ choose multiple topics
→ choose difficulty
→ choose types
→ Start
```

## Flow D

```text
submit wrong answer
→ useful feedback
→ hint
→ retry/full solution
```

## Flow E

Refresh in the middle of a session.

The session must remain intact.

## Flow F

Complete a session.

Result page must include score, XP, mastery change, difficulty breakdown and mistake review.

---

# 37. Build Verification

Before claiming completion run:

```text
tests
lint
TypeScript/type check
Prisma/schema validation
migration status
production build
```

Also visually inspect:

- topic theory;
- formulas;
- code blocks;
- practice builder;
- mobile layout;
- question screen;
- explanations;
- result page.

---

# 38. Required Final Report

At the end report:

## Practice Bug

- root cause;
- exact fix;
- files changed;
- verified flows.

## Theory

List expanded subjects/topics.

## Question Bank

```text
Before total:
After total:
```

Then:

```text
EASY:
MEDIUM:
HARD:
CHALLENGE:
```

And per subject:

```text
Mathematical Analysis:
AGLA:
Logic & Discrete Mathematics:
Computer Architecture:
Introduction to Programming:
```

List topics with fewer than 15 questions.

## Explanation Coverage

Report:

- questions with explanations;
- questions with hints;
- questions with full solutions.

## Advanced Types Added

Examples:

```text
Parameter Problems
Reverse Problems
Error Analysis
Proofs
Counterexamples
Pointer Tracing
Memory Tracing
Circuit Design
NAND/NOR Conversion
Quantifier Domain Construction
Packed Data Problems
```

## Validation

Explain how answers were checked.

## Remaining Curriculum Gaps

Explicitly distinguish:

- topics confirmed by supplied labs;
- topics that need future lecture/lab PDFs.

Do not claim completion without verification.

---

# 39. Definition of Done

Do not consider this upgrade complete until:

1. Start Practice reliably opens Question 1.
2. Custom Practice works.
3. Sessions survive refresh.
4. Topic/subject/difficulty/type filtering works.
5. Multi-difficulty selection works.
6. Empty configurations are handled clearly.
7. Duplicate session creation is prevented.
8. Core theory is meaningfully deeper.
9. The bank has substantially increased toward the 500+ target.
10. Core topics have varied EASY/MEDIUM/HARD/CHALLENGE coverage.
11. New questions are not fake numeric variants.
12. Every scored question has a useful explanation.
13. Harder tasks have progressive hints/full solutions where appropriate.
14. Mistake review works.
15. Existing progress remains coherent.
16. Tests/lint/type checks/build pass.

---

# 40. Final Quality Standard

Always optimize for these principles:

> Do not make theory longer just to make it longer.
> Make it understandable at several levels.

> Do not make hard questions by using uglier numbers.
> Make them require deeper reasoning.

> Use the university labs as calibration for task style and difficulty.

> Generate new analogous practice instead of copying the same lab tasks.

> Every wrong answer should teach something.

> Every correct answer can reinforce understanding.

> Automatic practice tells the student what they should train.

> Custom Practice lets the student choose exactly what they want to train.

> The final goal is that the student can move from "I recognize the formula" to "I can solve university tutorial/lab problems independently."
