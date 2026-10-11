# Independent review — Tutor Yandex adapter

Date: 2026-10-11
Branch: `dmitrij/feature/tutor-yandex`
Base: `origin/main c538d03`
Decision: **APPROVE** for PR publication / human review, not live-service certification.

## Scope and evidence

Independently inspected the task acceptance criteria, staged implementation and
new provider/common/test files, the existing Tutor policy/context/service call
sites, README/environment examples, and [QA evidence](tutor-yandex.md).
No application changes were made by this reviewer.

- Native Yandex completion and embedding endpoints, model URI defaults, schema
  request, final-response status and logging headers match official contracts.
  The API reference omits the completion envelope in its generated schema;
  the official [structured-output example](https://aistudio.yandex.ru/ru/docs/ai-studio/concepts/generation/structured-output)
  confirms the implemented `result.alternatives` envelope.
- Strict local output validation rejects free teaching output in restricted
  practice, extra properties, refusals, truncation and malformed responses.
  Existing deterministic coaching/citation/Exam guards remain unchanged.
- Fixed HTTPS URLs and redirect rejection prevent configuration-based endpoint
  substitution; credentials stay in server headers. Provider response bodies and
  exception details do not escape through errors. No secret files were staged.
- Explicit provider choice has no cross-provider fallback. Legacy OpenAI
  configuration and cache identity are preserved by shared-helper extraction.
- Embedding document/query purpose is routed at both production call sites.
  Provider/folder/model-pair/pooling-version identity avoids incompatible reuse.
  Native decimal-string doubles are strictly decoded and all vectors checked for
  finite values, dimension consistency and bounds.
- UTF-8 splitting preserves full text and code points; byte-weighted pooling and
  query-wide deadlines are deterministic and tested. Content IDs and schema are
  unchanged; paid network calls remain outside database transactions.
- No UI, auth, practice scoring, migration or question-bank changes. Unrelated
  `.idea/` preserved. Current branch includes the human-merged PR #8 base.

## Findings and limitations

No unresolved BLOCKER or MAJOR findings.

- MINOR, resolved: recap formerly said PR #8 was open while its header identified
  the merged base. The final staged recap now consistently records the merge.
- NOTE: long-text vector averaging is an approximation, not an evaluated search
  quality guarantee. README explicitly documents it and the need for live checks.
- NOTE: pacing applies to sequential use of an adapter/indexer, not distributed
  account-wide quotas. README correctly does not claim a global limiter.
- NOTE: live Yandex credentials, regional network reachability, billing/model
  permissions and tutoring quality were not tested. Mock success is not proof of
  a working real account. No paid requests or secret inspection were performed.

## Verification disposition

Read the separate QA report: independent QA executed all 14 new adapter tests;
root supplied successful unit 76/76, integration 48/48, typecheck, lint and build,
plus post-sync typecheck/provider 23/23. Reviewer independently ran
`git diff --check` successfully. A reviewer test rerun was blocked by sandbox IPC;
the escalation was interrupted, so it is **not** counted as an executed pass.
Browser E2E and Prisma validation were reasonably omitted for this adapter-only
change with no UI/schema changes. The report distinguishes supplied test evidence
from reviewer-executed checks.

Publication may proceed after the owner's final staged-diff check. No automatic
merge is authorized. Next external verification: privately configure Yandex
key/folder/billing, explicitly authorize a small paid index, then smoke-test lesson
conversation, sources, history and protected practice.
