# Backend — APIs, authentication and learning services

Entry areas: `src/app/api/`, `src/lib/`; choose exact paths from the recap/search.
Read the relevant contracts/tests, not all UI/content/database instructions.

## Implementation

- Validate authentication, authorization, request origin and payloads server-side.
- Keep credentials and protected question data out of client bundles/responses.
- Preserve cross-user isolation, existing error contracts and privacy settings.
- Protect idempotency, transactions, concurrent requests and session persistence.
- Preserve XP/mastery/GPA rules; do not award progress twice or trust client-derived results.
- Do not rewrite working authentication/practice architecture for a narrow task.
- Schema/migration changes require the Database role and an exclusive owner.
- Learning/practice behavior requires the relevant sections of the content master;
  an unrelated authentication/API task does not.

## Verification / handoff

Start with affected service tests; include auth/origin, invalid input, access control,
retry/concurrency and persistence cases when impacted. QA owns the final command matrix.
Report contract changes, actual checks, edge cases, DB impact and unresolved limitations.
