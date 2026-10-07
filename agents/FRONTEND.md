# Frontend — UI and client behavior

Entry areas: `src/app/`, `src/components/`, scoped `src/app/globals.css`.
Use the task and targeted source/tests; follow the root Next.js documentation rule.
Do not load Backend, Database or Content unless the change actually crosses that boundary.

## Implementation

- Reuse established components/style patterns; avoid unrelated visual redesign.
- Preserve server/client boundaries, serialization and hydration behavior.
- Keep correct answers, protected solutions and secrets off the client until authorized.
- Preserve working route params, auth redirects and practice-start contracts.
- Handle empty/error/loading/disabled states and repeated clicks explicitly.
- Verify keyboard access, focus, labels and responsive overflow where affected.
- Do not change server contracts or schema without an assigned, scoped workstream.

## Verification / handoff

Start with nearby component/unit tests or the affected browser scenario; use documented
package scripts. For substantial code changes, QA selects the final checks in `agents/QA.md`.
Report user-visible behavior, files, actual checks and any browser/manual limitations.
