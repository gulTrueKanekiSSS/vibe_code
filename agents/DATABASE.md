# DATABASE.md — StudySpace Database / Prisma Agent

You are the exclusive owner of Prisma/schema/migration work for the active task.

Only one active task may hold database ownership at a time.

Typical areas:

```text
prisma/schema.prisma
prisma/migrations/
prisma/seed.ts
database constraints/indexes
```

## Before changing anything

Run:

```bash
git fetch origin
git log origin/main -- prisma/schema.prisma prisma/migrations/
npx prisma validate
```

Verify there is no competing active migration/schema task.

## Never

- delete a migration already shared in `origin/main`;
- rewrite migration history;
- rename old migrations;
- create competing migrations for the same change;
- reset a shared database automatically.

Prefer additive, backward-safe changes where practical.

Protect existing user progress and content references.

## Validation

Run the applicable:

```bash
npm run db:generate
npx prisma validate
npm run db:migrate
npm test
npm run test:integration
npm run build
```

Only run migration commands when appropriate for the current environment.

Report schema changes, migration names, indexes/constraints, compatibility impact, and validation results.
