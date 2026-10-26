# StudySpace Computer Architecture — Week 3 theory and exam pack

Pack: `ca-week3-theory-exam`. **11 new lesson topics and 425 exam/review questions**, sourced from the four Week 3 PDFs.

## Import
Copy folder to `content-packs/inbox/ca-week3-theory-exam` in the repo. Verify module labels in `content/subjects.json` and check topic/question IDs against current `main`. Run:

```sh
npm run content:import -- content-packs/inbox/ca-week3-theory-exam
npm run content:validate
npm run content:report
npm test
```

Use the normal reviewed branch/PR workflow. The pack only affects content files, never DB. Deploying a branch/merging a PR also **does not seed PostgreSQL**. Explicitly verify database, backup policy, and existing seed safety before a separately authorized production publication; don't mix with AGLA troubleshooting.

## Coverage

- `ca-w3-architectures` — Архитектуры фон Неймана и Гарварда: **28** questions.
- `ca-w3-program-performance` — Метрики программ и бенчмарки: **31** questions.
- `ca-w3-cpu-clock` — Тактовая частота, цикл CPU и MIPS: **38** questions.
- `ca-w3-memory-io` — Иерархия памяти, шины и накопители: **22** questions.
- `ca-w3-gpu-amdahl` — GPU, параллелизм и закон Амдала: **42** questions.
- `ca-w3-boolean-gates` — Булевы функции и базовые логические элементы: **45** questions.
- `ca-w3-transistors-ic` — Транзисторы и интегральные схемы: **15** questions.
- `ca-w3-nand` — Универсальный базис NAND: **32** questions.
- `ca-w3-nor` — Универсальный базис NOR: **31** questions.
- `ca-w3-logic-proof-timing` — Эквивалентность схем, задержка и критический путь: **63** questions.
- `ca-w3-fpga-universal-lab` — Лабораторная: NAND2/NOR2, Quartus и FPGA: **78** questions.

## Important source-specific nuances

- Lecture Part II calls latency/delay/response time the interval invocation-to-start, and execution time invocation-to-completion. Other CS texts may define response time differently.
- Performance slides use bandwidth/throughput for concurrent jobs, whereas standard hardware bandwidth/throughput can denote transfer rate/completions per time unit. Both interpretations are explained.
- Lab Week 3 Time Slot 1 (page 8) has overlapping LED requirements for 111. Exercises only evaluate it **under an explicitly stated priority assumption**; do not pretend the assignment gave that priority. Time Slot 2 (page 9) has distinct non-overlapping conditions.
- CPU/GPU/cache/hardware values shown in the slides are illustrative, not guarantees for modern hardware.
- New topic IDs use a Week 3 prefix to avoid collisions, but the importer must still check the live repo.
