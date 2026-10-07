# Practice selection — QA and independent review

Date: 2026-10-07. Branch: `dmitrij/feature/practice-builder-selection`.
Base: `origin/main` `7f2ce7e`, freshly fetched/merged (Already up to date).

## Independent browser QA

Owner: `builder_qa`, separate from root frontend implementation. Status: PASS for new UI.

- `npm run test:e2e -- e2e/practice-builder-selection.spec.ts`: **5/5 PASS**,18.9s; after switching the320px capture to actual viewport shots, mobile case repeated **1/1 PASS**,3.2s.
- Search is view-only, includes Russian/English ID/subject matching; hidden selected chips remain removable. Found-only bulk preserves outside selections; global bulk still covers whole subject; subject change resets its own scope.
- All four presets set exact levels/count/hints/feedback; manual edits remove active highlight. Advanced empty filters disable start, closed summary shows restrictions, saved session edit roundtrip matches DB config/items.
- Selected category absent from new topics remains visible, explains zero availability, can be explicitly removed; recovered session contains the intended topic and no category restriction.
- Native keyboard controls,390/320px no overflow, no fixed mobile overlay, triple click gives one request/session, refresh keeps question and persisted item IDs.
- Desktop1440/light/dark and mobile screenshots independently inspected by QA, reviewer and root. Search padding was corrected. Transient dark-button colors and full-page320 stitching were capture artifacts: stabilized finite transitions and used viewport screenshots; no unnecessary production CSS patch.
- Synthetic learner/session fixture only; cleanup in finally, no real Telegram claims, no cookie/environment values printed, traces off.
- No React/runtime errors. Exactly the pre-existing missing `/favicon.ico`404 is separately excluded by its precise path/message; no other console errors suppressed.

Snapshots are local generated artifacts in `/tmp/studyspace-builder-before-{desktop,mobile}.png` and `/tmp/studyspace-builder-after-{desktop,desktop-dark,mobile,mobile-expanded-320,mobile-summary-320}.png`; not committed and not permanent assets.

## Root verification

- `npm test`: **51/51 PASS** after fresh main sync, including3 new search/scoped-selection tests and existing content/auth/learning checks.
- `npm run test:integration`: **26/26 PASS**, including persisted starts, retries, access/privacy, grading/XP and ten-question coverage for all64 topics.
- `npm run typecheck`, `npm run lint`: PASS, including final rerun after the last test-selector adjustment.
- `npm run build`: PASS, webpack production compile, TypeScript, prerender and traces completed. Local Next documentation explicitly permits concurrent dev/build using separate `.next/dev` and`.next` outputs. Existing server stayed available.
- Local `prisma validate`: PASS; schema/migrations unchanged, no migration/seed/reset needed.
- Existing start handler compared to main ignoring whitespace: identical, including request-key retry and in-flight guard. `git diff --check`: PASS.
- Existing19 practice-start E2E: first18/19 PASS; one ambiguous `getByLabel` also matched the new remove-topic button. Assertion changed to explicit checkbox role without weakening behavior; specific delayed-feedback/review/repeat case **1/1 PASS**, final full rerun **19/19 PASS**,39.8s. All24 relevant browser cases pass across both suites.

## Independent review

Owner: `builder_review`. Status: **APPROVE**, no unresolved blocker/major/minor findings.

Reviewed production diff, new files and tests against main; privacy/client boundary, no DB/content/auth/session changes, query-independent availability/payload, global/found scope, preset derivation, summary truthfulness, saved edit, keyboard/mobile/layout. Search padding and accessible preset descriptions were corrected and independently rechecked. Unavailable-category recovery test added following review.

The last existing-test selector correction only narrows the locator to its intended checkbox; final checks passed. Generated `next-env.d.ts` build-only imports were returned to original verified dev paths; `.idea/` remains untouched/untracked.

## Limitations / human check

No competitor paid-account flow or human usability study; this is an evidence-backed expert recommendation, not a globally-best or measured-speed claim. No deployment or real Telegram authentication test, no unrelated full learning E2E run. Existing missing favicon remains unrelated.

After login, open `http://localhost:3000/practice/custom`: select subject→preset→start, then try searching/selecting/removing topics, advanced controls and mobile. Confirm it feels easier; the human owns review/merge and any deployment.
