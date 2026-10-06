## Goal / user-visible result

Every existing practice topic offers at least ten distinct questions. Expand 47 sparse topics without rewriting the established practice architecture.

- **5 subjects, 64 topics, 742 questions** (352 →742, +390).
- All64 topics meet the floor; 17 already-full topics preserved.
- Totals: architecture144, geometry150, analysis148, programming158, discrete142.
- Difficulties: EASY188 / MEDIUM249 / HARD171 / CHALLENGE134.
- Original352 objects/IDs preserved and checked by canonical SHA256 regression.
- All additions have correct answers, explanations/full solutions and three progressive hints; independent reviewers approved all390.

## Changes

- Append content/questions files only for below-ten topics; no numeric-only filler.
- Subject answer validation and C11 fixtures; global coverage/immutable-baseline tests.
- Integration coverage for all390 seeded records and ten-question topic/custom sessions for every64 topics: unique questions, first answer, retry and persistence.
- Five representative ten-question browser/refresh scenarios; replace obsolete sparse-bank assumptions in existing tests.
- Reports, task file and compact project recap updated.
- No app, authentication, session/scoring, lesson, curriculum or Prisma schema/migration changes. AI Tutor remains placeholder only.

## QA / independent review

- npm test: **48/48**.
- npm run test:integration: **26/26**.
- npm run test:e2e -- e2e/practice-start.spec.ts: **19/19**.
- typecheck, lint (zero warnings), production build: passed.
- content:check:742,64/64 topics >=10, no numeric-template candidates.
- Existing upsert db:seed loaded742 locally. Prisma validate/status passed; five existing migrations, **no new migrations**.
- Independent content reviewers: APPROVE (119 architecture/geometry,176 analysis/discrete,95 programming); separate QA PASS.
- Latest origin/main **6a92406** fetched and integrated; no conflicts.

## Manual verification / rollout / limitations

Dev server available at http://localhost:3000. Browser automation verified dashboard, topic, quick, by-topic, weak, custom, refresh/retry and empty-filter flows with isolated authenticated users; this is **not proof of real Telegram login**.

Only the local configured DB was seeded. After human review/merge, use the deployment's existing content/seed workflow for its DB; no deployment or remote DB update is included.

The ten-question floor is total per topic, not per difficulty/type/category filter. Supplementary/future topic classifications remain unchanged; future topics remain excluded from automatic practice. Some topics remain below the master roadmap's15–25+ target, which is outside this request.

**Do not auto-merge.**
