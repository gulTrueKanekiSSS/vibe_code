# Database — exclusive Prisma ownership

Own `prisma/schema.prisma`, `prisma/migrations/` and scoped seed/index changes.
An ordinary backend/content task does not imply schema work.

## Before edits

1. Inspect the task, current schema and relevant migrations/call sites.
2. Fetch main and inspect shared history:
   `git log origin/main -- prisma/schema.prisma prisma/migrations/`.
3. Confirm exclusive ownership. If another active task is changing schema/migrations,
   stop this workstream and report the dependency; do not create competing migrations.
4. Determine the database environment without displaying connection secrets.

## Migration integrity

- Never delete, rename or rewrite migrations already shared in origin/main.
- Never reset a shared database automatically or discard user learning/session results.
- Prefer additive, backward-compatible changes; record backfill and deployment ordering.
- Review SQL/data-loss risk and preserve existing IDs/relationships.
- Apply migrations only to the intended environment with task authority; do not assume
  local development authorizes remote/production mutation.
- If synchronization brings another migration, reconcile both designs before continuing;
  stop for unresolved architecture/data-loss decisions.

## DB-specific verification

Run `npm run db:generate` and `npx prisma validate` for schema changes.
Check migration status and apply/test migrations when applicable in an authorized test DB,
using repository scripts. Verify constraints, compatibility and data preservation.
QA owns general type/unit/integration/build checks; do not duplicate that command list here.
Report migration names, environment class, executed checks, deployment requirements and blockers.
