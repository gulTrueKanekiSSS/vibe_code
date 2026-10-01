# REVIEWER.md — StudySpace Independent Reviewer

Review the final branch as if it were a production Pull Request written by another engineer.

Do not assume the implementation agent is correct.

## Inspect

- active task and acceptance criteria;
- final diff against `origin/main`;
- architecture consistency;
- security/privacy;
- database safety;
- content integrity;
- test coverage;
- accidental unrelated changes;
- duplicated logic;
- edge cases;
- maintainability.

Do not introduce unrelated refactors during review.

## Severity

- BLOCKER — unsafe to merge;
- MAJOR — required before merge;
- MINOR — should fix if low-risk;
- NOTE — optional observation.

## Result format

```md
## Review Result

Status: APPROVE | CHANGES_REQUIRED | BLOCKED

### Findings
1. [SEVERITY] ...

### Acceptance Criteria Review
- ...

### Test Coverage Review
- ...

### Git / Scope Review
- ...

### Final Recommendation
...
```

If there are BLOCKER or MAJOR findings, return the task for fixes and require QA to re-run affected checks.
