# University content expansion

Updated: 2026-10-06. Task: minimum ten questions in every existing practice topic.
Branch: `dmitrij/content/ten-questions-per-topic`; base `origin/main` `6a92406`.
Source: `STUDYSPACE_UNIVERSITY_CONTENT_MASTER.md`; original university PDFs were not directly reviewed or copied.

## Current result

- **5 subjects / 64 topics / 742 questions**, up from 352 (+390).
- **64/64 topics have at least ten questions**: 47 expanded to ten, 17 existing topics at sixteen preserved.
- Original 352 question objects, answers, hints and IDs unchanged; canonical SHA256 regression checks their complete metadata against base `6a92406`.
- Every added question has an answer, full solution and three distinct progressive hints. All 742 have explanations and three hints; exact ID/prompt duplicates rejected, numeric-template candidates **0**.
- Existing curriculum categories are unchanged: supplementary analysis stays supplementary; malloc/function-pointers stay future and excluded from automatic practice, but explicitly selectable.
- No app/auth/session/scoring changes, new AI, topics, schema or migrations. The existing upsert seed loaded **742** into the local configured DB without resetting user data.

## Counts by subject and difficulty

| Subject | Total | Easy | Medium | Hard | Challenge |
| --- | ---: | ---: | ---: | ---: | ---: |
| architecture | 144 | 38 | 45 | 33 | 28 |
| geometry | 150 | 36 | 48 | 37 | 29 |
| analysis | 148 | 37 | 52 | 32 | 27 |
| programming | 158 | 32 | 45 | 48 | 33 |
| discrete | 142 | 45 | 59 | 21 | 17 |
| **All** | **742** | **188** | **249** | **171** | **134** |

## Topic coverage

| Topic ID | Total | Easy | Medium | Hard | Challenge |
| --- | ---: | ---: | ---: | ---: | ---: |
| and-or-not | 10 | 4 | 4 | 1 | 1 |
| binary | 10 | 4 | 3 | 2 | 1 |
| bitwise | 10 | 3 | 3 | 2 | 2 |
| boolean | 10 | 2 | 3 | 2 | 3 |
| dnf-cnf | 10 | 3 | 3 | 2 | 2 |
| fpga-workflow | 16 | 3 | 5 | 5 | 3 |
| full-adder | 16 | 4 | 5 | 4 | 3 |
| gates | 10 | 3 | 3 | 2 | 2 |
| half-adder | 16 | 4 | 5 | 4 | 3 |
| nand | 10 | 1 | 3 | 3 | 3 |
| nor | 16 | 4 | 5 | 4 | 3 |
| xor | 10 | 3 | 3 | 2 | 2 |
| angle | 10 | 3 | 3 | 2 | 2 |
| determinants | 10 | 2 | 4 | 2 | 2 |
| dot-product | 10 | 1 | 4 | 3 | 2 |
| independence | 16 | 4 | 5 | 4 | 3 |
| lines | 10 | 3 | 3 | 2 | 2 |
| matrix-operations | 16 | 3 | 5 | 5 | 3 |
| orthogonal | 16 | 4 | 5 | 4 | 3 |
| parallel | 10 | 3 | 3 | 2 | 2 |
| planes | 10 | 4 | 3 | 2 | 1 |
| projection | 10 | 1 | 3 | 3 | 3 |
| vector-length | 16 | 4 | 5 | 4 | 3 |
| vectors | 16 | 4 | 5 | 4 | 3 |
| bounds | 10 | 3 | 4 | 1 | 2 |
| completeness | 10 | 2 | 2 | 3 | 3 |
| complex-numbers | 16 | 3 | 5 | 5 | 3 |
| epsilon | 10 | 4 | 3 | 1 | 2 |
| equality | 10 | 4 | 4 | 1 | 1 |
| function-domains | 16 | 3 | 5 | 5 | 3 |
| induction | 16 | 3 | 6 | 4 | 3 |
| infimum | 10 | 2 | 4 | 3 | 1 |
| lower-bound | 10 | 3 | 4 | 1 | 2 |
| real-axioms | 10 | 3 | 6 | 0 | 1 |
| real-numbers | 10 | 3 | 3 | 2 | 2 |
| supremum | 10 | 1 | 4 | 3 | 2 |
| upper-bound | 10 | 3 | 2 | 3 | 2 |
| aggregate-types | 16 | 3 | 5 | 5 | 3 |
| arrays | 10 | 2 | 3 | 3 | 2 |
| c-bitwise | 10 | 2 | 3 | 3 | 2 |
| files | 10 | 3 | 3 | 2 | 2 |
| function-pointers | 10 | 3 | 3 | 2 | 2 |
| malloc | 10 | 3 | 2 | 3 | 2 |
| operators | 10 | 2 | 3 | 3 | 2 |
| pointer-arithmetic | 16 | 1 | 3 | 6 | 6 |
| pointers-arrays | 10 | 2 | 3 | 4 | 1 |
| pointers | 10 | 1 | 3 | 4 | 2 |
| recursion | 16 | 3 | 5 | 5 | 3 |
| strings | 10 | 2 | 3 | 3 | 2 |
| structs | 10 | 2 | 3 | 3 | 2 |
| variables | 10 | 3 | 3 | 2 | 2 |
| conditions | 10 | 3 | 6 | 1 | 0 |
| contradiction | 10 | 4 | 4 | 1 | 1 |
| contrapositive | 10 | 4 | 3 | 1 | 2 |
| direct-proof | 10 | 5 | 3 | 1 | 1 |
| even-odd | 10 | 3 | 3 | 2 | 2 |
| functions | 10 | 3 | 6 | 1 | 0 |
| implication | 10 | 2 | 4 | 2 | 2 |
| logical-operators | 10 | 3 | 6 | 0 | 1 |
| math-language | 10 | 5 | 4 | 1 | 0 |
| normal-forms | 16 | 3 | 5 | 5 | 3 |
| propositions | 10 | 4 | 6 | 0 | 0 |
| quantifiers | 10 | 2 | 4 | 2 | 2 |
| sets | 16 | 4 | 5 | 4 | 3 |

## Completed content batches

| Subject | Added | Expanded topics |
| --- | ---: | --- |
| architecture | 66 | and-or-not, binary, bitwise, boolean, dnf-cnf, gates, nand, xor |
| geometry | 53 | angle, determinants, dot-product, lines, parallel, planes, projection |
| analysis | 83 | bounds, completeness, epsilon, equality, infimum, lower-bound, real-axioms, real-numbers, supremum, upper-bound |
| programming | 95 | arrays, c-bitwise, files, function-pointers, malloc, operators, pointers-arrays, pointers, strings, structs, variables |
| discrete | 93 | conditions, contradiction, contrapositive, direct-proof, even-odd, functions, implication, logical-operators, math-language, propositions, quantifiers |

Work interrupted during agent turns; saved files inspected before continuation. No completed file was recreated or old question object changed. Partially finished subject validation suites were completed, then all content independently reviewed.

## Validation and fixes

- All **390 additions** manually reviewed by independent subject reviewers: 119 architecture/geometry, 176 analysis/discrete, 95 programming. Final reviews **APPROVE**.
- Numeric/steps/multi-select answers independently calculated; Boolean circuits exhaustively enumerated; vector/incidence and real-analysis proofs checked with identities and counterexample witnesses.
- Programming: **51 defined C11 traces** compiled with `-Wall -Wextra -Werror`, plus **44 conceptual answer oracles**. UB examples are classified, never executed as oracles. All 95 covered.
- Fixed XOR parity wording (four data bits plus parity = five), explicit integer hypotheses for a divisibility proof, set-domain naming and real-supremum hypotheses.
- Calibrated **42 new questions** downward where reviewers identified routine reasoning instead of HARD/CHALLENGE work. Old IDs/difficulties untouched.
- Updated stale test assumptions: malloc now ten; repeated practice prefers unseen questions; difficulty-empty behavior uses an isolated EASY-only fixture; browser counts come from DB rather than an old one-question bank.
- Independent QA caught nullable Prisma JSON types in the synthetic fixture; switched to schema-validated source content without casts, then reran typecheck/lint/build and all integration tests successfully.
- Test fixtures clean up only their created users/topics/questions. No secrets/private user data or generated build artifacts staged.

## Verification — current tree

- `npm test`: **48/48 passed**; includes all subject answer suites, complete old-object immutability and all-topic floor.
- `npm run test:integration`: **26/26 passed**; verifies every new seeded field and ten-question topic/custom sessions for **all 64 topics**, distinct IDs, first-answer grading, retry idempotency and persisted order/state. Existing XP, hints, privacy and automatic curriculum filtering regressions pass.
- `npm run test:e2e -- e2e/practice-start.spec.ts`: **19/19 passed** after content review fixes. Five representative subjects each open ten questions and survive refresh; dashboard/topic/quick/by-topic/weak starts, empty states, repeat, delayed feedback and auth/origin regressions pass.
- `npm run typecheck`: passed.
- `npm run lint`: passed, no warnings.
- `npm run build`: production build passed.
- `npm run content:check`: **742**, all 64 topics >=10; no numeric-template candidates.
- `prisma validate`: valid; `prisma migrate status`: up to date, five existing migrations. No migration added/applied.
- `npm run db:seed`: **5 subjects / 64 topics / 742 questions**, repeated after final wording/difficulty corrections.
- `git diff --check`: passed. Latest `origin/main` integrated (Already up to date, `6a92406`).
- First integration attempts exposed test expectation/seed staleness and a restricted-process connection-pool timeout. Corrected expectations, reseeded final content and reran with local DB access; the successful final suite supersedes those attempts.
- Browser tests use isolated authenticated learners, not development login or proof of real Telegram authentication. Full unrelated browser suite was not required/rerun.
- Dev server for inspection: `http://localhost:3000`. No deployment or remote DB update claimed.

## Exact next task / limitations

Content implementation, independent QA/review and publication complete. Commits `2e21172` (content), `4189218` (tests), `8c2e49f` (reports) published in the task branch; [PR #4](https://github.com/gulTrueKanekiSSS/vibe_code/pull/4) is open into main, **not merged**. Exact next task: human reviews/merges; on any separately deployed environment, use its existing content-release/seed workflow after merge. Local seed does not publish code or update remote databases. No more autonomous implementation is pending.

The minimum applies to total questions per topic, not ten per difficulty/type/category combination; narrow filters can legitimately offer fewer. No new expansion should begin without a user task. The master roadmap's 15–25+ depth per topic remains future work (47 topics are at ten).

Detailed engineering task: `.tasks/done/ten-questions-per-topic.md`; PR body: `.tasks/pr/ten-questions-per-topic.md`.

## Historical expansion — 2026-09-30

Updated: 2026-09-30. Scope: content-only batches toward 500+ verified questions. Curriculum source: `STUDYSPACE_UNIVERSITY_CONTENT_MASTER.md`; no direct review of original university PDFs is claimed.

### Recovery checkpoint

- Original baseline: 56 topics / 92 questions.
- This content session resumed at **64 topics / 232 questions**; database was seeded to 232 in the previous work. Final source and seed now contain **352 questions** (+120), with all original IDs preserved.
- Existing content, question IDs, attempts and practice code preserved. No Git metadata exists in this directory, so git status/diff are unavailable.
- Prior completed additions: complex-numbers, function-domains, induction, matrix-operations, normal-forms, fpga-workflow, recursion, aggregate-types (16 each); pointer-arithmetic expanded to 16.
- Prior verification: 20 unit/content tests and 21 integration tests passed; Prisma schema valid, 5 migrations applied. Earlier browser run encountered a navigation timeout with an EPIPE in the long-running dev process. Do not claim browser verification complete or rewrite practice logic as part of this content batch.

### Current counts

Total: **352**. Explanations/full solutions: 352; three hints: 352. Exact prompt duplicates rejected by loader; numeric-template duplicate candidates: 0.

| Subject | Total | Easy | Medium | Hard | Challenge |
| --- | ---: | ---: | ---: | ---: | ---: |
| architecture | 78 | 23 | 22 | 19 | 14 |
| geometry | 97 | 26 | 29 | 24 | 18 |
| analysis | 65 | 19 | 19 | 16 | 11 |
| programming | 63 | 18 | 14 | 18 | 13 |
| discrete | 49 | 18 | 12 | 11 | 8 |
| **All** | **352** | 104 | 96 | 88 | 64 |

### Topic coverage

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

### Completed batches

| Checkpoint | Topics expanded (each 1 → 16) | Added | Unit/content tests |
| --- | --- | ---: | ---: |
| 262 | vectors, vector-length | 30 | 22/22 |
| 292 | orthogonal, independence | 30 | 23/23 |
| 307 | sets | 15 | 24/24 |
| 337 | half-adder, full-adder | 30 | 25/25 |
| 352 | nor | 15 | 27/27 |

All 120 additions have worked solutions and three distinct progressive hints. Original `<topic>-1` questions are preserved. Each expanded topic now has Easy 4 / Medium 5 / Hard 4 / Challenge 3. Existing authentication, session selection/grading, Prisma schema and migrations were not changed in this content-only work. No AI functionality was added.

### Answer validation and corrections

- Independently recomputed all new numeric and multi-step answers in `tests/coverage-batches.test.ts`: vector coordinates/norms/projections, parameter determinants, finite-set counts, carry traces and NOR circuits.
- Reviewed the reasoning for every new choice/proof/counterexample question. Automated witnesses check projection identities, idempotence, best approximation, dependence/rank, affine invariance, finite-set membership and sharp counting bounds. These tests supplement mathematical review; they are not a general formal proof checker.
- Exhaustively checked every input of the authored small Boolean circuits and all 4-bit sums with both incoming carries.
- Replaced an overlapping basis-coordinate calculation with a non-unique-representation question; replaced an artificial numeric encoding of a conceptual answer with multiple choice.
- Corrected floating-point representation noise in the test oracle only; production answer scoring was preserved.
- Aligned new set/circuit tags with existing `set-problem`, `circuit-design`, `universal-gates` filters. Integration tests verify all 15 new questions per corresponding topic are selectable.
- Used Unicode ∖ for plain-text set difference so Markdown does not consume a backslash before parentheses; rendering regression check passes.
- Exact prompt/ID uniqueness and numeric-template screening pass. Candidate numeric-only reskins: 0. This heuristic does not replace semantic review.

### Final verification (2026-09-30)

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

### Exact next task

Milestone 350+ is complete; **500+ is not yet complete**. At least 148 additional verified questions are needed. There are still 47 topics with fewer than 15 questions, including preserved supplementary/future material.

1. Read `content/questions/programming/arrays.json` and its lesson. Preserve the existing question. Add 15 varied questions (target 16): indexing, bounds, initialization, traversal, array size in the correct scope, and reasoning/counterexamples rather than numeric reskins.
2. Validate defined C traces in a reviewed C11 fixture compiled with warnings as errors. For undefined/out-of-bounds behavior, test the classification; do not execute undefined behavior as an answer oracle. Extend batch tests without deleting existing coverage.
3. Run unit/content tests, recount and update this file immediately (expected **367**).
4. Repeat for `programming/strings.json` and `programming/files.json`, 15 each, checking terminators/length and file return values/EOF/resource handling; use isolated temporary fixtures. Expected next combined checkpoint **397**.
5. Then prioritize confirmed one-question topics `variables`, `operators`, `pointers-arrays`, `propositions`, `logical-operators`, `gates`, `binary`. Fifteen diverse additions each would reach **502**; this is a roadmap, not completed content.
6. After each safe batch: validate answers, run relevant tests, update counts. At the next release checkpoint, upsert seed, integration tests, typecheck, lint and production build. Do not change auth, architecture or working practice-session logic.

### Remaining curriculum gaps

Topics with fewer than 15 questions: and-or-not, binary, bitwise, boolean, dnf-cnf, gates, nand, xor, angle, determinants, dot-product, lines, parallel, planes, projection, bounds, completeness, epsilon, equality, infimum, lower-bound, real-axioms, real-numbers, supremum, upper-bound, arrays, c-bitwise, files, function-pointers, malloc, operators, pointers-arrays, pointers, strings, structs, variables, conditions, contradiction, contrapositive, direct-proof, even-odd, functions, implication, logical-operators, math-language, propositions, quantifiers.

Core topics with 16 questions still need deeper coverage before 500+. Future confirmed batches: C arrays/strings/files/toolchain; nested quantifiers and inclusion-exclusion; richer functions and complex geometry. Existing real-analysis notes remain supplementary; malloc/function-pointers remain future material. They are preserved and are not treated as confirmed current labs.
