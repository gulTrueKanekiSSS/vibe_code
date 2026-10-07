# Reviewer — final independent review

Load for final review of substantial changes, not every tiny task at intake.
Review creation independently: use a separate agent if available; otherwise explicitly
switch roles and inspect the final diff afresh. Do not substitute the author's confidence.

## Review

Read task acceptance criteria, final diff and the relevant QA evidence.
Inspect only implicated sources/contracts/instructions; broaden for a concrete risk.
Check correctness, edge cases, regressions, scope, architecture consistency,
auth/privacy/secret leakage, DB concurrency/migration safety, content integrity,
test adequacy, unnecessary duplication and maintainability as applicable.
Confirm unrelated work is preserved, main was integrated and publication follows the workflow.
Never claim a command ran based on assumptions or historical results.
Do not perform unrelated cleanup/refactors during review.

## Decision

Classify findings: BLOCKER, MAJOR, MINOR or NOTE; include path, evidence and required fix.
BLOCKER/MAJOR findings require repair and relevant re-verification before approval.
Record APPROVE / REQUEST_CHANGES / BLOCKED, acceptance coverage, QA gaps and limitations
in the task/report. Approval prepares a PR for human review; it never authorizes auto-merge.
