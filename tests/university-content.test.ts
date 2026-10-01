import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import katex from "katex";
import {
  loadContent,
  questionSchema,
  section,
} from "../src/lib/content-source";
import { checkAnswer } from "../src/lib/learning";
import curriculum from "../content/curriculum.json";

test("university batch has valid curriculum references, varied levels, complete theory and renderable math", async () => {
  const { lessons, questions } = await loadContent();
  for (const id of [
    ...curriculum.confirmed,
    ...curriculum.existingCompatible,
    ...curriculum.future,
  ])
    assert.ok(
      lessons.some((lesson) => lesson.metadata.id === id),
      id,
    );
  const topics = [
    "complex-numbers",
    "function-domains",
    "induction",
    "matrix-operations",
    "normal-forms",
    "fpga-workflow",
    "recursion",
    "aggregate-types",
  ];
  for (const id of topics) {
    const lesson = lessons.find((l) => l.metadata.id === id)!;
    const bank = questions.filter((q) => q.topicId === id);
    assert.ok(bank.length >= 16, id);
    assert.equal(new Set(bank.map((q) => q.difficulty)).size, 4, id);
    assert.ok(new Set(bank.flatMap((q) => q.tags)).size >= 2, id);
    for (const title of [
      "Formal Definition",
      "Пример уровня университета",
      "Пример-ловушка",
      "Частая ошибка",
      "Связи с другими темами",
    ])
      assert.ok(section(lesson, title), `${id}: ${title}`);
  }
  for (const text of [
    ...lessons.flatMap((l) => l.sections.map((s) => s.text)),
    ...questions.flatMap((q) => [q.prompt, q.solution, ...q.hints]),
  ]) {
    const withoutCode = text.replace(
      /```[\s\S]*?```|~~~[\s\S]*?~~~|`[^`]*`/g,
      "",
    );
    for (const match of withoutCode.matchAll(
      /\$\$([\s\S]*?)\$\$|(?<!\$)\$([^$\n]+)\$(?!\$)/g,
    ))
      assert.doesNotThrow(() =>
        katex.renderToString(match[1] ?? match[2], { throwOnError: true }),
      );
  }
  const sample = questions.find((q) => q.type === "MULTIPLE_CHOICE")!;
  assert.equal(
    questionSchema.safeParse({ ...sample, answer: "not an option" }).success,
    false,
  );
  assert.equal(
    questionSchema.safeParse({ ...sample, hints: ["same", "same", "same"] })
      .success,
    false,
  );
});

test("new numerical mathematics answers are independently recomputed", async () => {
  const { questions } = await loadContent();
  const answer = (id: string, result: number | string[]) => {
    const q = questions.find((question) => question.id === id)!;
    assert.ok(q, id);
    assert.ok(
      checkAnswer(
        q.type,
        q.answer,
        typeof result === "number" ? String(result) : result,
      ),
      id,
    );
  };
  type Complex = [number, number];
  const mul = ([a, b]: Complex, [c, d]: Complex): Complex => [
    a * c - b * d,
    a * d + b * c,
  ];
  const pow = (z: Complex, n: number) =>
    Array.from({ length: n }).reduce<Complex>((acc) => mul(acc, z), [1, 0]);
  answer("complex-numbers-u01", Math.hypot(-5, 12));
  answer("complex-numbers-u02", [String(2 + 4), String(3 - 1)]);
  answer("complex-numbers-u05", mul([1, 2], [3, -1]).map(String));
  answer(
    "complex-numbers-u06",
    mul([3, 1], [1, 1]).map((v) => String(v / 2)),
  );
  answer("complex-numbers-u07", pow([0, 1], 2026)[0]);
  answer("complex-numbers-u08", pow([1, Math.sqrt(3)], 3)[0]);
  answer(
    "complex-numbers-u11",
    Array.from({ length: 5 }, (_, k) => Math.cos((2 * Math.PI * k) / 5)).reduce(
      (a, b) => a + b,
      0,
    ),
  );
  answer("complex-numbers-u12", 1);
  const sixthRoots = Array.from({ length: 6 }, (_, k): Complex => [
    Math.cos((2 * Math.PI * k) / 6),
    Math.sin((2 * Math.PI * k) / 6),
  ]);
  answer(
    "complex-numbers-u15",
    sixthRoots.filter((z) => {
      const r = pow(z, 4);
      return Math.hypot(r[0] - 1, r[1]) < 1e-9;
    }).length,
  );
  answer("function-domains-u07", (10 + 2) / 3);
  answer("induction-u01", 2 * 1 - 1);
  answer("induction-u03", 2 * 8 - 1);
  answer("induction-u06", 3 ** 5 - 1 - 3 * (3 ** 4 - 1));
  answer("induction-u08", (5 * 4) / 2);
  let fact = 1,
    first = 0;
  for (let n = 1; n < 10; n++) {
    fact *= n;
    if (fact > 2 ** n) {
      first = n;
      break;
    }
  }
  answer("induction-u09", first);
  const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);
  answer(
    "induction-u11",
    Array.from({ length: 20 }, (_, k) => 3 * (k + 1) * (k + 2)).reduce(gcd),
  );
  const prime = (n: number) =>
    n > 1 &&
    !Array.from(
      { length: Math.max(0, Math.floor(Math.sqrt(n)) - 1) },
      (_, i) => i + 2,
    ).some((d) => n % d === 0);
  answer(
    "induction-u15",
    Array.from({ length: 50 }, (_, i) => i + 1).find(
      (n) => !prime(n * n + n + 41),
    )!,
  );
  answer("matrix-operations-u02", 2 + 5);
  answer("matrix-operations-u03", 1 * 3 + 2 * 4);
  answer("matrix-operations-u06", (2 * 3) / 6);
  answer("matrix-operations-u07", 2 ** 3 * 5);
  answer("matrix-operations-u09", ["0.5", "-1", "0", "0.5"]);
  answer("matrix-operations-u11", -1 * 2 * 3);
  answer("matrix-operations-u13", 8 / 4);
  const m = [
    [0, 1, 1],
    [1, 0, 1],
    [1, 1, 0],
  ];
  answer(
    "matrix-operations-u16",
    m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) -
      m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) +
      m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]),
  );
});

test("normal forms and gate designs agree with exhaustive truth tables", async () => {
  const { questions } = await loadContent();
  const verify = (
    id: string,
    target: (a: number, b: number, c: number) => number,
    options: Record<string, (a: number, b: number, c: number) => number>,
  ) => {
    const q = questions.find((q) => q.id === id)!;
    assert.equal(typeof q.answer, "string");
    const candidate = options[q.answer as string];
    assert.ok(candidate, `Unknown checked expression: ${id}`);
    for (let a = 0; a < 2; a++)
      for (let b = 0; b < 2; b++)
        for (let c = 0; c < 2; c++)
          assert.equal(
            candidate(a, b, c),
            target(a, b, c),
            `${id}: ${a}${b}${c}`,
          );
  };
  verify("normal-forms-u09", (a, b) => a | b, {
    "a⊕b": (a, b) => a ^ b,
    "a⊕b⊕ab": (a, b) => a ^ b ^ (a & b),
    ab: (a, b) => a & b,
  });
  verify("normal-forms-u10", (a, b, c) => (a & b) | c, {
    "ab⊕c": (a, b, c) => (a & b) ^ c,
    "ab⊕c⊕abc": (a, b, c) => (a & b) ^ c ^ (a & b & c),
    "a⊕b⊕c": (a, b, c) => a ^ b ^ c,
  });
  verify("normal-forms-u14", (a, b, c) => Number(a + b + c >= 2), {
    "a⊕b⊕c": (a, b, c) => a ^ b ^ c,
    "ab⊕ac⊕bc": (a, b, c) => (a & b) ^ (a & c) ^ (b & c),
    "ab⊕ac⊕bc⊕abc": (a, b, c) => (a & b) ^ (a & c) ^ (b & c) ^ (a & b & c),
  });
  verify("fpga-workflow-u11", (a, b, c) => Number(a + b + c === 2), {
    "AB ∨ AC ∨ BC": (a, b, c) => (a & b) | (a & c) | (b & c),
    "AB¬C ∨ A¬BC ∨ ¬ABC": (a, b, c) =>
      (a & b & (1 - c)) | (a & (1 - b) & c) | ((1 - a) & b & c),
    "A XOR B XOR C": (a, b, c) => a ^ b ^ c,
  });
  verify("fpga-workflow-u09", (en, key) => Number(en === 1 && key === 0), {
    "EN AND KEY": (a, b) => a & b,
    "EN OR KEY": (a, b) => a | b,
    "EN AND NOT KEY": (a, b) => a & (1 - b),
  });
  verify("fpga-workflow-u14", (a2, a1) => Number(!a2 && !!a1), {
    A1: (_, b) => b,
    "¬A2 AND A1": (a, b) => (1 - a) & b,
    "A0 AND A1": (_, b, c) => b & c,
  });
});

test("reviewed C11 traces compile with warnings as errors and match stored answers", async () => {
  const directory = mkdtempSync(join(tmpdir(), "studyspace-c-check-"));
  try {
    const executable = join(directory, "university");
    const compiled = spawnSync(
      "cc",
      [
        "-std=c11",
        "-Wall",
        "-Wextra",
        "-Werror",
        "tests/fixtures/university.c",
        "-o",
        executable,
      ],
      { encoding: "utf8", timeout: 30000 },
    );
    assert.equal(
      compiled.status,
      0,
      compiled.stderr || compiled.error?.message,
    );
    const result = spawnSync(executable, [], {
      encoding: "utf8",
      timeout: 5000,
    });
    assert.equal(result.status, 0, result.stderr);
    const { questions } = await loadContent();
    for (const line of result.stdout.trim().split("\n")) {
      const [id, value] = line.split("|");
      const question = questions.find((q) => q.id === id)!;
      assert.ok(question, id);
      assert.ok(
        checkAnswer(
          question.type,
          question.answer,
          question.type === "STEPS" ? value.split(",") : value,
        ),
        id,
      );
    }
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
