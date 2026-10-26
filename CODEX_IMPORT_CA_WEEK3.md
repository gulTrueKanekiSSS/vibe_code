# Codex — StudySpace Week 3 Computer Architecture import

I prepared a finished external content pack:
`ca-week3-theory-exam-import-ready.zip`

**Purpose:** add all supplied Computer Architecture Week 3 lecture/lab material to StudySpace as 11 new lesson topics and 425 practice questions (210 MC, 178 numeric, 37 true/false). Questions cover definitions, theory for examinations, truth tables, Amdahl law, timing, NAND-only/NOR-only gate construction and FPGA lab exercises. All answers and worked explanations are already authored. **Do not regenerate questions from PDFs.**

## Instructions

1. Read the repository's `AGENTS.md`, `PROJECT_RECAP.md` (once), `CONTENT_SCHEMA.md`, `content-packs/README.md` and `content/subjects.json`. Inspect only the `architecture` subject and needed recent content IDs; avoid repository-wide scans.
2. Use a fresh branch from current remote `main`, or a dedicated clean worktree. **Preserve** unrelated existing changes and unpublished classroom-photo work.
3. Extract the supplied ZIP preserving its top-level folder to `content-packs/inbox/ca-week3-theory-exam/`; expected `manifest.json`, 11 lesson MDX files, 11 question JSON files, README, QA.
4. Verify the module names (`Представление данных`, `Логические схемы`, `FPGA и Quartus`) against the current `content/subjects.json`; ensure there are no collisions of topic IDs or question IDs and no duplicate prompts against current content. If collisions or validation issues exist, make the smallest content-only correction without altering educational meaning. Do not regenerate content.
5. Run:

   ```bash
   npm run content:import -- content-packs/inbox/ca-week3-theory-exam
   npm run content:validate
   npm run content:report
   npm test
   ```

6. Report exact added topic count, added question count and by-type breakdown, and verify imported content is under `architecture` in existing modules. Make only content/receipt changes and **do not change the schema, UI, authentication or application code**. If validation fails, diagnose and fix narrowly.
7. Create a reviewable commit and branch. Report branch and PR link if created. Do not merge or deploy without my separate approval. **Do not run migrations or `db:seed` against production.** Remember site content is read from PostgreSQL; merging/deployment alone will not publish the new content in DB.

## Source-specific caveats (do not silently change)

- Lecture Part II uses `response time`/`latency`/`delay` for invocation-to-start and `execution time` for invocation-to-completion. This is its own terminology; lesson contrasts broader usage.
- Its table describes platform bandwidth/throughput in terms of concurrent jobs. Other standard meanings are called out explicitly.
- Week 3 Lab Time Slot 1, page 8, has overlapping conditions at `111`. The questions using it explicitly say the chosen priority assumption; do not pretend this priority is in the source.
- Week 3 Lab's LED0 bullets can be read as conjunction versus alternatives. Questions explicitly state their assumed interpretation; do not treat that assumption as an unambiguous source requirement.
- Time Slot 2, page 9, has different LED1/LED2 rules; do not mix them.
- Numerical computer hardware characteristics on slides are illustrative, not universal fixed specifications.

## Completion output

A brief factual report: pack imported? how many new topics/questions? content validation and unit test pass/fail? git branch/PR? any blockers? Zero production DB writes.
