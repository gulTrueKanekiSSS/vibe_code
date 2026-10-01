# University content expansion

Updated: 2026-09-30. Scope: content-only batches toward 500+ verified questions. Curriculum source: `STUDYSPACE_UNIVERSITY_CONTENT_MASTER.md`; no direct review of original university PDFs is claimed.

## Recovery checkpoint

- Original baseline: 56 topics / 92 questions.
- This content session resumed at **64 topics / 232 questions**; database was seeded to 232 in the previous work. Final source and seed now contain **352 questions** (+120), with all original IDs preserved.
- Existing content, question IDs, attempts and practice code preserved. No Git metadata exists in this directory, so git status/diff are unavailable.
- Prior completed additions: complex-numbers, function-domains, induction, matrix-operations, normal-forms, fpga-workflow, recursion, aggregate-types (16 each); pointer-arithmetic expanded to 16.
- Prior verification: 20 unit/content tests and 21 integration tests passed; Prisma schema valid, 5 migrations applied. Earlier browser run encountered a navigation timeout with an EPIPE in the long-running dev process. Do not claim browser verification complete or rewrite practice logic as part of this content batch.

## Current counts

Total: **352**. Explanations/full solutions: 352; three hints: 352. Exact prompt duplicates rejected by loader; numeric-template duplicate candidates: 0.

| Subject | Total | Easy | Medium | Hard | Challenge |
| --- | ---: | ---: | ---: | ---: | ---: |
| architecture | 78 | 23 | 22 | 19 | 14 |
| geometry | 97 | 26 | 29 | 24 | 18 |
| analysis | 65 | 19 | 19 | 16 | 11 |
| programming | 63 | 18 | 14 | 18 | 13 |
| discrete | 49 | 18 | 12 | 11 | 8 |
| **All** | **352** | 104 | 96 | 88 | 64 |

## Topic coverage

| Topic ID | Total | Easy | Medium | Hard | Challenge |
| --- | ---: | ---: | ---: | ---: | ---: |
| and-or-not | 1 | 1 | 0 | 0 | 0 |
| binary | 1 | 1 | 0 | 0 | 0 |
| bitwise | 1 | 1 | 0 | 0 | 0 |
| boolean | 4 | 1 | 1 | 1 | 1 |
| dnf-cnf | 1 | 1 | 0 | 0 | 0 |
| fpga-workflow | 16 | 3 | 5 | 5 | 3 |
| full-adder | 16 | 4 | 5 | 4 | 3 |
| gates | 1 | 1 | 0 | 0 | 0 |
| half-adder | 16 | 4 | 5 | 4 | 3 |
| nand | 4 | 1 | 1 | 1 | 1 |
| nor | 16 | 4 | 5 | 4 | 3 |
| xor | 1 | 1 | 0 | 0 | 0 |
| angle | 1 | 1 | 0 | 0 | 0 |
| determinants | 4 | 1 | 1 | 1 | 1 |
| dot-product | 5 | 1 | 2 | 1 | 1 |
| independence | 16 | 4 | 5 | 4 | 3 |
| lines | 1 | 1 | 0 | 0 | 0 |
| matrix-operations | 16 | 3 | 5 | 5 | 3 |
| orthogonal | 16 | 4 | 5 | 4 | 3 |
| parallel | 1 | 1 | 0 | 0 | 0 |
| planes | 1 | 1 | 0 | 0 | 0 |
| projection | 4 | 1 | 1 | 1 | 1 |
| vector-length | 16 | 4 | 5 | 4 | 3 |
| vectors | 16 | 4 | 5 | 4 | 3 |
| bounds | 1 | 1 | 0 | 0 | 0 |
| completeness | 4 | 1 | 1 | 1 | 1 |
| complex-numbers | 16 | 3 | 5 | 5 | 3 |
| epsilon | 1 | 1 | 0 | 0 | 0 |
| equality | 1 | 1 | 0 | 0 | 0 |
| function-domains | 16 | 3 | 5 | 5 | 3 |
| induction | 16 | 3 | 6 | 4 | 3 |
| infimum | 1 | 1 | 0 | 0 | 0 |
| lower-bound | 1 | 1 | 0 | 0 | 0 |
| real-axioms | 1 | 1 | 0 | 0 | 0 |
| real-numbers | 1 | 1 | 0 | 0 | 0 |
| supremum | 5 | 1 | 2 | 1 | 1 |
| upper-bound | 1 | 1 | 0 | 0 | 0 |
| aggregate-types | 16 | 3 | 5 | 5 | 3 |
| arrays | 1 | 1 | 0 | 0 | 0 |
| c-bitwise | 1 | 1 | 0 | 0 | 0 |
| files | 1 | 1 | 0 | 0 | 0 |
| function-pointers | 1 | 1 | 0 | 0 | 0 |
| malloc | 1 | 1 | 0 | 0 | 0 |
| operators | 1 | 1 | 0 | 0 | 0 |
| pointer-arithmetic | 16 | 1 | 3 | 6 | 6 |
| pointers-arrays | 1 | 1 | 0 | 0 | 0 |
| pointers | 5 | 1 | 1 | 2 | 1 |
| recursion | 16 | 3 | 5 | 5 | 3 |
| strings | 1 | 1 | 0 | 0 | 0 |
| structs | 1 | 1 | 0 | 0 | 0 |
| variables | 1 | 1 | 0 | 0 | 0 |
| conditions | 1 | 1 | 0 | 0 | 0 |
| contradiction | 1 | 1 | 0 | 0 | 0 |
| contrapositive | 1 | 1 | 0 | 0 | 0 |
| direct-proof | 1 | 1 | 0 | 0 | 0 |
| even-odd | 1 | 1 | 0 | 0 | 0 |
| functions | 1 | 1 | 0 | 0 | 0 |
| implication | 4 | 1 | 1 | 1 | 1 |
| logical-operators | 1 | 1 | 0 | 0 | 0 |
| math-language | 1 | 1 | 0 | 0 | 0 |
| normal-forms | 16 | 3 | 5 | 5 | 3 |
| propositions | 1 | 1 | 0 | 0 | 0 |
| quantifiers | 4 | 1 | 1 | 1 | 1 |
| sets | 16 | 4 | 5 | 4 | 3 |

## Completed batches

| Checkpoint | Topics expanded (each 1 → 16) | Added | Unit/content tests |
| --- | --- | ---: | ---: |
| 262 | vectors, vector-length | 30 | 22/22 |
| 292 | orthogonal, independence | 30 | 23/23 |
| 307 | sets | 15 | 24/24 |
| 337 | half-adder, full-adder | 30 | 25/25 |
| 352 | nor | 15 | 27/27 |

All 120 additions have worked solutions and three distinct progressive hints. Original `<topic>-1` questions are preserved. Each expanded topic now has Easy 4 / Medium 5 / Hard 4 / Challenge 3. Existing authentication, session selection/grading, Prisma schema and migrations were not changed in this content-only work. No AI functionality was added.

## Answer validation and corrections

- Independently recomputed all new numeric and multi-step answers in `tests/coverage-batches.test.ts`: vector coordinates/norms/projections, parameter determinants, finite-set counts, carry traces and NOR circuits.
- Reviewed the reasoning for every new choice/proof/counterexample question. Automated witnesses check projection identities, idempotence, best approximation, dependence/rank, affine invariance, finite-set membership and sharp counting bounds. These tests supplement mathematical review; they are not a general formal proof checker.
- Exhaustively checked every input of the authored small Boolean circuits and all 4-bit sums with both incoming carries.
- Replaced an overlapping basis-coordinate calculation with a non-unique-representation question; replaced an artificial numeric encoding of a conceptual answer with multiple choice.
- Corrected floating-point representation noise in the test oracle only; production answer scoring was preserved.
- Aligned new set/circuit tags with existing `set-problem`, `circuit-design`, `universal-gates` filters. Integration tests verify all 15 new questions per corresponding topic are selectable.
- Used Unicode ∖ for plain-text set difference so Markdown does not consume a backslash before parentheses; rendering regression check passes.
- Exact prompt/ID uniqueness and numeric-template screening pass. Candidate numeric-only reskins: 0. This heuristic does not replace semantic review.

## Final verification (2026-09-30)

- `npm test`: **27/27 passed**, including content schemas, answer calculations, hint completeness, Markdown/KaTeX, existing C11 fixture compilation and learning/auth unit regressions.
- `npm run test:integration`: **24/24 passed**. Three new tests compare all 120 seeded records to source, open/reload/idempotently retry sessions for all eight topics, and exercise semantic filters. Existing XP/mastery/privacy/session tests also pass.
- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `npm run build`: production build passed after final content/test edits.
- `npm run content:check`: 5 subjects / 64 topics / **352 questions**; all 352 have solutions and three hints; no numeric-template duplicate candidates.
- Prettier check on the eight question files and two new test files: passed.
- `prisma validate`: valid; `prisma migrate status`: database up to date, five existing migrations. No new migration required or applied.
- `npm run db:seed`: **5 subjects / 64 topics / 352 questions**. Existing seed uses upserts, not a reset; final seeded records match content files. Synthetic integration users/sessions are cleaned up by the tests.
- Browser E2E was **not rerun** in this content-only batch. The earlier navigation timeout/EPIPE is not claimed resolved; database/service tests are not browser verification.
- `git status`/`git diff` unavailable: this directory has no Git metadata. No repository reset/revert was attempted.

## Exact next task

Milestone 350+ is complete; **500+ is not yet complete**. At least 148 additional verified questions are needed. There are still 47 topics with fewer than 15 questions, including preserved supplementary/future material.

1. Read `content/questions/programming/arrays.json` and its lesson. Preserve the existing question. Add 15 varied questions (target 16): indexing, bounds, initialization, traversal, array size in the correct scope, and reasoning/counterexamples rather than numeric reskins.
2. Validate defined C traces in a reviewed C11 fixture compiled with warnings as errors. For undefined/out-of-bounds behavior, test the classification; do not execute undefined behavior as an answer oracle. Extend batch tests without deleting existing coverage.
3. Run unit/content tests, recount and update this file immediately (expected **367**).
4. Repeat for `programming/strings.json` and `programming/files.json`, 15 each, checking terminators/length and file return values/EOF/resource handling; use isolated temporary fixtures. Expected next combined checkpoint **397**.
5. Then prioritize confirmed one-question topics `variables`, `operators`, `pointers-arrays`, `propositions`, `logical-operators`, `gates`, `binary`. Fifteen diverse additions each would reach **502**; this is a roadmap, not completed content.
6. After each safe batch: validate answers, run relevant tests, update counts. At the next release checkpoint, upsert seed, integration tests, typecheck, lint and production build. Do not change auth, architecture or working practice-session logic.

## Remaining curriculum gaps

Topics with fewer than 15 questions: and-or-not, binary, bitwise, boolean, dnf-cnf, gates, nand, xor, angle, determinants, dot-product, lines, parallel, planes, projection, bounds, completeness, epsilon, equality, infimum, lower-bound, real-axioms, real-numbers, supremum, upper-bound, arrays, c-bitwise, files, function-pointers, malloc, operators, pointers-arrays, pointers, strings, structs, variables, conditions, contradiction, contrapositive, direct-proof, even-odd, functions, implication, logical-operators, math-language, propositions, quantifiers.

Core topics with 16 questions still need deeper coverage before 500+. Future confirmed batches: C arrays/strings/files/toolchain; nested quantifiers and inclusion-exclusion; richer functions and complex geometry. Existing real-analysis notes remain supplementary; malloc/function-pointers remain future material. They are preserved and are not treated as confirmed current labs.
