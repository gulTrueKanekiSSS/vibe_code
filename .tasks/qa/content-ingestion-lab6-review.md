# Independent review — Lab 6 ingestion finalization

Date: 2026-10-14; final gate checked 2026-10-15.
Reviewer: `lab6_review` (independent of implementation/QA).
Decision: **APPROVE for publication and human PR review**.
The two teaching-correctness findings below were repaired and independently re-read.
No database commands were run by reviewer.

## Scope and preserved boundaries

Read the task, content contract, pack manifest/receipt, all four new lessons and all
40 new question objects. Reviewed the full changed-file list against `origin/main`,
staged/unstaged coverage-test changes and `.gitignore`. The prior ingestion pipeline
is already present in current `origin/main`; its earlier independent report remains
`.tasks/qa/content-ingestion-review.md`, not a new verification claim.

- Independently compared every previously tracked lesson/question/subject file to
  `origin/main`: **129 files byte-identical; all 742 prior questions unchanged**.
- New published files are only the four expected analysis lesson/question pairs.
  Pack copies and receipt are intended provenance, not duplicate runtime banks.
- No auth, application practice, mastery, XP, GPA, Prisma or migration edits.
- `.idea/` is ignored; `git ls-files .idea` is empty. Reviewed additions contain no
  credentials, local DBs, generated output or private student data.
- Coverage tests now enumerate actual lessons, preserve ten distinct questions per
  topic, and isolate integration users per topic to avoid the existing start quota.
  Retry/session-count assertions and existing snapshot-integrity assertions remain.

## Findings

1. **MAJOR, RESOLVED — invalid geometric derivation for the stated domain.**
   `content/lessons/analysis/inverse-trigonometric-functions.mdx:39` constructs a
   right triangle with adjacent side `x` while the formula is stated for `[-1,1]`.
   A negative side is impossible; endpoints also make the triangle degenerate.
   Replace the general-domain argument with the unit-circle/Pythagorean identity
   and the sign of sine on `[0, pi]`, or explicitly limit the triangle illustration
   and then prove the full domain separately. Keep pack/source provenance consistent.

2. **MAJOR, RESOLVED — principal arcosh branch is not selected by positivity alone.**
   `content/lessons/analysis/inverse-hyperbolic-functions.mdx:64–70` omits the
   principal range `y >= 0` and suggests that positivity excludes the other
   quadratic root. For `x=2`, both `2+sqrt(3)` and `2-sqrt(3)` are positive;
   their logarithms have opposite signs. The arcosh proof needs `z=e^y >= 1`,
   selecting the plus root (coincident roots at `x=1`). Positivity alone suffices
   for arsinh, not arcosh. Clarify the general template/common-error text and the
   new `inverse-hyperbolic-functions-positive-exp` solution (line 39) and
   `inverse-hyperbolic-functions-arcosh-domain` solution (line 63), whose current
   phrasing incorrectly treats `cosh y >= 1` as selecting a branch.

All 40 selected answers were inspected algebraically; no incorrect answer key was
identified. These findings concern explanations/domains, not changing the tested
meaning of the existing 742 questions. PDF originals were not supplied to this
review; fidelity to the three named sources is not independently certified.

Resolution re-read: the published inverse-trigonometric lesson now uses the unit
circle on the complete closed interval. The inverse-hyperbolic lesson explicitly
distinguishes arsinh positivity from the arcosh principal range and addresses the
coincident root at `x=1`. The two question solutions are corrected without changing
IDs, prompts, answers, options or the tested concept. These are separately reviewed
post-import edits to three published files, not alterations of the original pack
or receipt. Keeping that original fingerprint preserves honest import provenance;
re-importing the old pack must not overwrite the corrected published content.

## Reviewer-run verification

- `node --import tsx --test tests/content-import.test.ts tests/content-validation.test.ts tests/minimum-topic-coverage.test.ts`
  with project Node: **14/14 PASS**, rerun successfully after the corrections.
- Existing-content byte comparison against `origin/main`: **PASS (129 files / 742 questions)**.
- `git diff --check` and `git diff --cached --check`: **PASS**.
- Numeric arcosh counterexample evaluated locally: roots approximately `3.732` and
  `0.268`, both positive; logarithms approximately `+1.317` and `-1.317`.

## Final gate

No unresolved BLOCKER or MAJOR findings remain. Independently checked the final
changed-path scope and Git integration: content commit `0127b20`, merge `d9601f1`,
`origin/main 81aacc0` is an ancestor of HEAD. The merge introduces no tree changes
compared with `0127b20`; no conflicts or discarded content are present.

Read independent QA's pack/fingerprint/preservation evidence. Root reports the
complete requested matrix rerun **after integration**: content validation/report
PASS (5 subjects / 68 lessons / 782 questions, zero low-coverage topics), typecheck
PASS, lint PASS, unit **91/91**, integration **48/48**, Prisma generate/validate
PASS and production build PASS. These are root-run checks, not reviewer-run checks.
Local-only seed/source parity and preservation snapshots passed; local text-only
Tutor indexing produced **68 topics / 525 chunks / 0 embeddings created**.

The only generated working-tree change at final inspection was `next-env.d.ts`
switching dev route declaration paths to build paths. Root is excluding that known
generated drift before the documentation/publication commit. No source-code or
content changes are required by this review. PR publication itself remains root's
next action; this approval does not claim a push or PR already happened.
No automatic merge; only human review may approve merging the resulting PR.
