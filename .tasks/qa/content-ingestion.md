# QA — content ingestion

Date: 2026-10-13. Status: PASS.
Root performed the final QA role pass. The separate QA agent stopped at its service
usage limit before producing a report; no results are attributed to that agent.
Independent code review and targeted verification were completed by `content_review`
before its usage limit; see `content-ingestion-review.md` and root's gate addendum.

## Acceptance evidence

- CONTENT_SCHEMA.md documents current hierarchy, stable IDs, JSON frontmatter,
  required sections, all nine question types/four difficulties, answer shapes,
  three hints and combined `solution` explanation/full solution. Its two minimal
  examples are parsed by the actual validators in an executable test.
- Manifest, inbox/imported/failed paths and commands documented; sources are names,
  PDFs not required. Strict manifest catches unknown fields, unlisted files,
  duplicates, path traversal and unknown references.
- Importer fixture tests: new topic, question-only append, unchanged fields/IDs,
  byte-preserved unrelated files, identical retry, changed replay refusal,
  conflicting questions/lessons, incomplete pack, concurrent lock, symlinks,
  injected write failure rollback/retry and destination replacement during commit.
- Full-bank validation checks registry, lesson/bank pairs, subject/module/topic and
  prerequisite references, globally duplicate IDs/prompts, empty answers, missing
  solutions, invalid hints, unsupported types/difficulties and orphan banks.
- File commands do not import Prisma/DB or invoke seed/network/AI. Existing bank
  remains unchanged: 5 subjects / 64 lessons / 742 questions; no topics below 10.

## Checks actually run

Using project Node 22.23.3 (PATH prefixed with node_modules/.bin):

| Command/check | Result |
| --- | --- |
| `node --import tsx --test tests/content-import.test.ts tests/content-validation.test.ts` | 12/12, independently repeated by reviewer |
| `npm run content:validate` | PASS, 5/64/742, no DB |
| `npm run content:report` | PASS, all requested groups and low coverage |
| Programmatic report assertions (sum subjects/topics/difficulties/types and low-coverage filter) | PASS |
| `npm run typecheck` | PASS after fixing AssertPredicate typing in new test |
| `npm run lint` | PASS |
| `npm test` | 91/91 PASS; sandbox tsx IPC denied first attempt, approved rerun succeeded |
| `npm run test:integration` | 48/48 PASS on verified loopback DB; not Neon |
| `npm run build` | PASS |
| `git diff --check` | PASS |

Final `git fetch origin` + `git merge origin/main`: already up to date at
`a73033a714b674059d3ab2f4161e4f525b5a1cbb`; no conflicts. Typecheck/lint,
validate/report and all unit/integration/build checks repeated after synchronization.
Generated next-env route-import drift from build was restored surgically; not task code.

Counts: architecture 12/144, geometry 12/150, analysis 13/148, programming 14/158,
discrete 13/142 (lessons/questions). Difficulty EASY188/MEDIUM249/HARD171/CHALLENGE134.
Types NUMERIC190/SHORT_TEXT4/MULTIPLE_CHOICE427/MULTI_SELECT23/TRUE_FALSE2/STEPS44/
OUTPUT50/FIX_CODE1/CONCEPTUAL1. Existing content, Prisma and app behavior have no diff.

## Limits / omitted checks

No browser/E2E or real Telegram/provider calls: no UI/auth/AI changes. No migrations,
Prisma schema edits or seed: not needed. Only temporary test users/data in local DB
were created by existing integration tests and cleaned by those tests.
Structural checks are not proof of mathematical correctness or teaching quality.
Hard process termination can leave a recovery lock/staging journal; explicit manual
recovery is required, not an automatic reset. Do not edit content during an import.
