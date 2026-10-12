# QA — Tutor for Russia / Yandex AI Studio

Date: 2026-10-11
Branch: `dmitrij/feature/tutor-yandex`
Base: `origin/main c538d03`
Scope: native Yandex provider, embedding-purpose routing, setup documentation;
no UI, authentication, schema, scoring or question-bank changes.

## Result

**PASS for automated adapter and existing-application regression checks.**
Live Yandex access and teaching quality remain **NOT VERIFIED**; this report does
not certify configured credentials, billing, account permissions or deployment.
Independent code review is a separate required gate, not replaced by this QA pass.

## Independent QA evidence

The QA agent authored only `tests/tutor-yandex.test.ts` during implementation and
executed the following against the implemented adapter, including its final
Unicode splitting/pooling changes:

- `node_modules/.bin/node --import tsx --test tests/tutor-yandex.test.ts`
  — **14 passed, 0 failed**.
- `node_modules/.bin/node node_modules/eslint/bin/eslint.js tests/tutor-yandex.test.ts`
  — **PASS**, no diagnostics.
- Test-file Prettier formatting completed successfully.

All provider calls in these tests use injected mock fetch functions. Configuration
tests restore environment variables after execution; no real keys are read or
printed, no live requests are made, and no paid indexing is performed.

| Acceptance criterion | Evidence |
| --- | --- |
| Yandex works without OpenAI configuration | Factory test requires Yandex key/folder only; defaults resolve; missing/invalid settings and unknown provider return unavailable without fallback |
| Fixed server-side integration | Endpoint, method, authorization header, folder header, disabled logging, redirect rejection and credential omission from JSON body assertions |
| Guided practice remains constrained | Restricted payload excludes source text/private IDs; only valid coaching action accepted; teaching/free-text/unknown-action output rejected |
| Responses are validated | Final assistant status required; partial/truncated/filtered, missing/multiple alternatives, wrong role, malformed JSON and unexpected fields rejected |
| History and payload limits | Recent-message count/UTF-8 budget assertions; oversized generation and embedding input rejected before request |
| Errors do not expose secrets | HTTP 301/401/403/429/500, invalid/absent/oversized body, network error and timeout return sanitized provider errors |
| Embedding purpose is explicit | Adapter uses document model for document/default calls and query model for query calls; ordered results retained |
| Vectors are safe | Finite numeric and strict decimal-string values accepted; empty/invalid/nonfinite/oversized/inconsistent vectors rejected |
| No incompatible cache reuse | Identity contains provider, folder, both embedding models and pooling algorithm version; model/folder changes alter identity |
| Long material is not truncated | Cyrillic/emoji text splits into <=1800-byte requests without replacement characters, concatenates exactly and returns stable finite vectors |
| Pooling is deterministic | Unequal 1800/200-byte parts verify byte-weighted mean `[0.9, 0.1]` |
| Query time budget is bounded | Overall query deadline includes request pacing and additional parts; generation/embedding requests abort with sanitized timeout |

## Root-supplied project check evidence

The implementation owner reported the following successful commands on the current
implementation. These results were supplied to QA rather than rerun by this agent:

- `npm test` — **76/76 PASS**, including 14 new Yandex tests and existing OpenAI,
  policy, chunking and rendering regressions.
- `npm run test:integration` — **48/48 PASS**, including document/query purpose
  assertions in `integration/tutor-retrieval.test.ts`, owned history, cross-user
  rejection, active exam protection, citations, rate limits and practice regressions.
- `npm run typecheck` — **PASS**.
- `npm run lint` — **PASS**.
- `npm run build` — **PASS**.
- `git fetch origin` / `git merge origin/main` — already up to date at `c538d03`.

The build-generated `next-env.d.ts` path-only change was restored to its tracked
value with a targeted patch. Owner subsequently reran typecheck and both provider
unit files (23/23 PASS) after sync and restoration; no merge conflict or application
change resulted from synchronization.

## Deliberately omitted / remaining limits

- Browser E2E: omitted because no browser UI, route, authentication or interaction
  behavior changed; provider/service behavior is covered by unit/integration tests.
- Prisma generation/validation/migrations: omitted because schema and migrations
  are unchanged. Existing database behavior is regression-tested by the owner.
- Real Telegram authentication: not exercised; unchanged and outside scope.
- Live Yandex completion/embeddings, Russian-network reachability, account/model
  permission, billing, pedagogical quality and production deployment: not tested.
- Weighted-mean long-text embeddings are a bounded approximation; semantic
  retrieval quality needs a real-material smoke check after explicit setup.
- No changes to local secret files, no database reset, no real-user state changes,
  no paid provider calls and no automatic PR merge were performed by QA.

Exact next verification: after configuring private Yandex credentials and billing,
perform an explicitly authorized small-topic embedding index and contextual Tutor
smoke test; check citations, Russian teaching style and protected practice behavior.
