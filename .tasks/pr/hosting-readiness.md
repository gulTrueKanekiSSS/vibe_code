## Goal
Prepare StudySpace for a free personal Vercel + Neon pilot, with AI Tutor deferred.

## Changes
- Vercel build configuration: preflight → Prisma generate → existing Next production build.
- Secret-safe configuration validation and tests; Node 22.x supported range.
- Explicit disabled Tutor in example/hosting settings; existing provider code unchanged.
- Ignore private environment variants and local Vercel configuration.
- Hosting runbook: production-only secrets, preview isolation, pooled runtime and direct
  admin DB connections, serialized migrations, deliberate seed, Telegram OIDC, smoke/rollback.
- No auth/UI/practice/schema/migration/content changes; no automatic DB writes in builds.

## Verification
- Unit: 79/79 PASS (3 hosting tests).
- Independent QA: targeted3/3 + synthetic CLI success/failure/no-secret checks PASS.
- Typecheck/lint PASS; `npm run build:hosting` incl Prisma generate + build PASS.
- Latest origin/main c51e58b integrated without changes/conflicts.
- Independent review APPROVE; no blocker/major findings.
- Integration/browser suites not rerun: runtime implementation unchanged.

## Rollout blockers
Vercel/Neon account connections pending. No cloud resources, migrations, production
seed or deployment performed. Real Telegram, Russia-network access and remote
practice persistence smoke remain NOT RUN. Free-tier quotas must be monitored.
AI keys must not be uploaded; TUTOR_PROVIDER=disabled is required for this pilot.

Human review/merge only. Repository readiness is not a claim of a live site.
