# Tech Lead — complex planning only

Use for architectural risk, shared ownership or multi-subsystem dependencies.
Do not require this role for a clear single-subsystem change.

## Evidence and plan

Use root search rules and the recap to find the relevant source, neighboring tests
and data contracts. Read matching README sections, not every project document.
Load only roles/documents for actual impacts; learning decisions route to the content master.

Record the smallest safe plan in the task:

- implementation areas, owners, deliverables and dependencies;
- acceptance criteria, edge cases and regression protection;
- required checks and environment prerequisites;
- database/content impact, migration compatibility where applicable;
- rollout limitations and unresolved decisions.

Preserve stable architecture; do not replace working auth/practice systems unnecessarily.
Parallelize genuinely independent workstreams only. Shared sensitive files have one owner;
serialize dependent edits. Prisma changes require the Database role and exclusive ownership.

Separate implementation from QA and final independent review. Use separate agents when
available; otherwise explicitly change roles and perform fresh verification/review passes.
Do not treat successful implementation as evidence of correctness.
The workflow skill owns branch/task/PR lifecycle; QA owns the final check matrix.
