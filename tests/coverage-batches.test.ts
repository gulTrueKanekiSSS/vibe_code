import { test } from "node:test";
import assert from "node:assert/strict";
import { loadContent } from "../src/lib/content-source";
import { checkAnswer } from "../src/lib/learning";
import patterns from "../content/practice-patterns.json";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import Markdown from "react-markdown";

const add = (a: number[], b: number[]) => a.map((x, i) => x + b[i]);
const scale = (k: number, a: number[]) => a.map((x) => k * x);
const sub = (a: number[], b: number[]) => add(a, scale(-1, b));
const dot = (a: number[], b: number[]) =>
  a.reduce((sum, x, i) => sum + x * b[i], 0);
const norm2 = (a: number[]) => dot(a, a);
const bitPairs = [0, 1].flatMap((a) => [0, 1].map((b) => [a, b]));
const bitTriples = bitPairs.flatMap(([a, b]) => [0, 1].map((c) => [a, b, c]));
const fullAdder = (a: number, b: number, c: number) => [
  a ^ b ^ c,
  (a & b) | ((a ^ b) & c),
];
const nor = (a: number, b: number) => 1 - (a | b);
const xnorCircuit = (a: number, b: number) => {
  const t = nor(a, b);
  return nor(nor(a, t), nor(b, t));
};
const ripple = (a: number, b: number, width: number, carry = 0) => {
  const trace: number[] = [];
  for (let i = 0; i < width; i++) {
    const [sum, next] = fullAdder((a >> i) & 1, (b >> i) & 1, carry);
    trace.push(sum, next);
    carry = next;
  }
  return trace;
};
const residual = (a: number[], b: number[]) =>
  sub(a, scale(dot(a, b) / norm2(b), b));
const det3 = (a: number[], b: number[], c: number[]) =>
  a[0] * (b[1] * c[2] - b[2] * c[1]) -
  b[0] * (a[1] * c[2] - a[2] * c[1]) +
  c[0] * (a[1] * b[2] - a[2] * b[1]);
const expected: Record<string, number | number[]> = {
  "vectors-b01": sub([3, -4], [-2, 1]),
  "vectors-b02": scale(-2, [1, -3]),
  "vectors-b04": add([1, -2], [3, 4]),
  "vectors-b05": add([2, -1], [-3, 5]),
  "vectors-b06": scale(0.5, add([-1, 4], [5, -2])),
  "vectors-b07": scale(0.5, sub([7, 5], [1, -3])),
  "vectors-b08": [0, 1, 2, 3, 4].find((t) => t + 1 === 4 && 2 * t === 6)!,
  "vectors-b09": sub(add([1, 1], [2, 6]), [4, 2]),
  "vectors-b10": add([0, 3], scale(2 / 3, sub([6, 0], [0, 3]))),
  "vectors-b11": [(6 + 2) / 2, (6 - 2) / 2],
  "vectors-b12": scale(1 / 3, add(add([0, 0], [6, 0]), [0, 3])),
  "vector-length-b01": Math.abs(-4) * 3,
  "vector-length-b02": norm2([2, -1, 2]),
  "vector-length-b04": scale(1 / Math.sqrt(norm2([0, -3, 4])), [0, -3, 4]),
  "vector-length-b05": Math.sqrt(norm2(sub([3, -1, 5], [1, 2, -1]))),
  "vector-length-b09": 3 ** 2 + 4 ** 2 - 2 * 2,
  "vector-length-b10": (20 - 8) / 4,
  "vector-length-b11": 2 * (5 + 7),
  "vector-length-b12": Math.min(
    ...Array.from({ length: 21 }, (_, i) => norm2(sub([i - 10, 2], [3, -1]))),
  ),
  "orthogonal-b02": residual([2, 5], [0, 1]),
  "orthogonal-b04": [
    ...scale(dot([4, 2], [1, 1]) / norm2([1, 1]), [1, 1]),
    ...residual([4, 2], [1, 1]),
  ],
  "orthogonal-b05": 2 * norm2([1, 2]) - 4 * 2,
  "orthogonal-b07": Math.sqrt(13 ** 2 - 5 ** 2),
  "orthogonal-b09": residual([1, 2, 3], [1, 0, 1]),
  "orthogonal-b10": [
    dot([3, 1], [1, 1]) / norm2([1, 1]),
    norm2(residual([3, 1], [1, 1])),
  ],
  "orthogonal-b11": -(7 - 1) / 2 + 2,
  "independence-b04": [0, 1, 2, 3, 4].find((t) => 1 * 6 - t * 2 === 0)!,
  "independence-b06": 2 - 2 * 3,
  "independence-b08": 2,
  "independence-b09": [-2, -1, 0, 1, 2, 3].find(
    (t) => det3([1, 0, 1], [0, 1, 1], [1, 1, t]) === 0,
  )!,
  "independence-b12": [-1, -1],
  "sets-b03": ["a", "b"].flatMap((a) => [0, 1, 2].map((b) => [a, b])).length,
  "sets-b04": Array.from({ length: 1 << 3 }, (_, mask) => mask).length,
  "sets-b05": 30 - (18 + 16 - 7),
  "sets-b09": 20 + 18 + 15 - 8 - 7 - 6 + 3,
  "sets-b10": 24 - 6,
  "sets-b11": Math.max(0, 8 + 7 - 12),
  "sets-b13": 12 * (4 - 1) + 1,
  "half-adder-b01": [1 ^ 1, 1 & 1],
  "half-adder-b04": bitPairs.filter(([a, b]) => (a ^ b) === 1 && (a & b) === 0)
    .length,
  "half-adder-b10": [1 ^ 0, 1 & 0, 1 ^ 0 ^ 1, (1 ^ 0) & 1],
  "full-adder-b02": fullAdder(0, 0, 1),
  "full-adder-b04": bitTriples.filter(([a, b, c]) => a + b + c >= 2).length,
  "full-adder-b08": bitPairs.filter(([b, c]) => 1 + b + c === 2).length,
  "full-adder-b09": ripple(3, 1, 2),
  "full-adder-b11": [
    (5 + (3 ^ 15) + 1) % 16,
    Math.floor((5 + (3 ^ 15) + 1) / 16),
  ],
  "nor-b07": bitTriples.filter(([a, b, c]) => (a | b | c) !== 0).length,
  "nor-b10": bitPairs.map(([a, b]) =>
    nor(xnorCircuit(a, b), xnorCircuit(a, b)),
  ),
  "nor-b11": [nor(nor(1, 0), 0), nor(1, nor(0, 0))],
};

test("low-coverage batch numerical and multi-step answers match independent calculations", async () => {
  const { questions } = await loadContent();
  const batch = questions.filter((q) => /-b\d+$/.test(q.id));
  assert.equal(batch.length, 120);
  for (const question of batch.filter((q) =>
    ["NUMERIC", "STEPS"].includes(q.type),
  )) {
    assert.ok(
      question.id in expected,
      `Missing independent calculation: ${question.id}`,
    );
    const value = expected[question.id];
    // STEPS uses textual answers; remove floating-point representation noise.
    const actual = Array.isArray(value)
      ? value.map((n) => String(Number(n.toPrecision(12))))
      : String(value);
    assert.ok(checkAnswer(question.type, question.answer, actual), question.id);
  }
});

test("NOR constructions agree with independent Boolean operators exhaustively", async () => {
  const { questions } = await loadContent();
  for (const [a, b] of bitPairs) {
    assert.equal(nor(a, a), 1 - a);
    assert.equal(nor(a, 1), 0);
    assert.equal(nor(a, b) === 1, a === 0 && b === 0);
    const t = nor(a, b);
    assert.equal(nor(t, t), a | b);
    const conjunction = nor(nor(a, a), nor(b, b));
    assert.equal(conjunction, a & b);
    assert.equal(nor(nor(a, a), b), a & (1 - b));
    assert.equal(xnorCircuit(a, b), Number(a === b));
    assert.equal(nor(conjunction, conjunction), 1 - (a & b));
    for (const c of [0, 1]) assert.equal(nor(nor(t, t), c), 1 - (a | b | c));
  }
  assert.deepEqual(
    questions.find((q) => q.id === "nor-b08")!.answer,
    bitPairs.filter(([a, b]) => nor(a, b) !== 1).map((pair) => pair.join("")),
  );
  assert.deepEqual(
    [0, 1].filter((q) => q === nor(q, 0)),
    [],
  );
});

test("coverage batch preserves original IDs and supplies fifteen varied additions per topic", async () => {
  const { questions } = await loadContent();
  const topics = [
    "vectors",
    "vector-length",
    "orthogonal",
    "independence",
    "sets",
    "half-adder",
    "full-adder",
    "nor",
  ];
  for (const topic of topics) {
    assert.ok(questions.some((q) => q.id === `${topic}-1`));
    const batch = questions.filter(
      (q) => q.topicId === topic && /-b\d+$/.test(q.id),
    );
    assert.equal(batch.length, 15, topic);
    assert.deepEqual(
      ["EASY", "MEDIUM", "HARD", "CHALLENGE"].map(
        (level) => batch.filter((q) => q.difficulty === level).length,
      ),
      [3, 5, 4, 3],
    );
    for (const q of batch) {
      const subject =
        topic === "sets"
          ? "discrete"
          : ["half-adder", "full-adder", "nor"].includes(topic)
            ? "architecture"
            : "geometry";
      assert.ok(
        patterns.some(
          (pattern) =>
            pattern.subjects.includes(subject) && q.tags.includes(pattern.id),
        ),
        `${q.id}: no discoverable practice pattern`,
      );
      assert.equal(new Set(q.hints).size, 3, q.id);
      assert.ok(q.solution.length >= 80, q.id);
      assert.ok(checkAnswer(q.type, q.answer, q.answer), q.id);
    }
  }
});

test("half/full-adder designs and carry invariants hold on every input", () => {
  for (const [a, b] of bitPairs) {
    const s = a ^ b,
      c = a & b;
    assert.equal(a + b, s + 2 * c);
    assert.equal(s & c, 0);
    assert.equal((a | b) & (1 - s), c);
    assert.equal((a | b) !== s, a === 1 && b === 1);
    assert.equal((a & b) !== 0, a === 1 && b === 1);
    for (const cin of [0, 1]) {
      const [sum, cout] = fullAdder(a, b, cin);
      const c2 = s & cin;
      assert.equal(c & c2, 0);
      assert.equal(c | c2, c ^ c2);
      assert.equal(sum, (a + b + cin) % 2);
      assert.equal(cout, Number(a + b + cin >= 2));
      if (a !== b) assert.equal(cout, cin);
      if (a === 1 && b === 1) assert.equal(cout, 1);
      assert.deepEqual(fullAdder(1 - a, 1 - b, 1 - cin), [1 - sum, 1 - cout]);
    }
  }
  assert.notEqual(fullAdder(1, 0, 1)[1], 1 & 0 & 1);
  for (let a = 0; a < 16; a++)
    for (let b = 0; b < 16; b++)
      for (const c0 of [0, 1]) {
        const t = ripple(a, b, 4, c0);
        const sum = [0, 1, 2, 3].reduce((v, i) => v + (t[i * 2] << i), 0);
        assert.equal(a + b + c0, sum + 16 * t[7]);
      }
  assert.deepEqual(ripple(15, 1, 4), [0, 1, 0, 1, 0, 1, 0, 1]);
  assert.equal(ripple(7, 1, 4)[7], 0); // Signed overflow without unsigned carry.
});

test("set answers match finite enumeration and sharp counting bounds", async () => {
  const { questions } = await loadContent();
  for (const question of questions.filter(
    (q) => q.topicId === "sets" && /-b\d+$/.test(q.id),
  )) {
    for (const text of [
      question.prompt,
      question.solution,
      ...question.options,
      ...question.hints,
    ]) {
      assert.ok(
        !text.includes("\\"),
        `${question.id}: use ∖ for set difference outside LaTeX`,
      );
      const rendered = renderToStaticMarkup(
        createElement(Markdown, null, text),
      );
      assert.equal(
        rendered.split("∖").length,
        text.split("∖").length,
        question.id,
      );
    }
  }
  const answer = (id: string) => questions.find((q) => q.id === id)!.answer;
  assert.deepEqual(
    answer("sets-b01"),
    [1, 2, 3, 5].filter((x) => ![2, 4, 5].includes(x)).map(String),
  );
  assert.deepEqual(
    answer("sets-b06"),
    [0, 1, 2, 3, 4].filter((x) => ![0, 2, 4, 1, 2].includes(x)).map(String),
  );
  assert.deepEqual(
    answer("sets-b07"),
    [1, 2, 3, 4]
      .filter((x) => [1, 2, 3].includes(x) !== [3, 4].includes(x))
      .map(String),
  );
  for (const a of [false, true])
    for (const b of [false, true])
      for (const c of [false, true]) {
        assert.equal(!(a && b), !a || !b);
        assert.equal(a && (b || c), (a && b) || (a && c));
        assert.equal(a && !(b && !c), (a && !b) || (a && c));
      }
  const bits = (mask: number) => mask.toString(2).replaceAll("0", "").length;
  const sevenElementSets = Array.from(
    { length: 1 << 12 },
    (_, mask) => mask,
  ).filter((mask) => bits(mask) === 7);
  assert.equal(
    Math.min(...sevenElementSets.map((mask) => bits(mask & 255))),
    Number(answer("sets-b11")),
  );
  // Construct disjoint Venn cells, including triple intersection in each pair.
  const cells = [
    { mask: 1, n: 8 },
    { mask: 2, n: 7 },
    { mask: 4, n: 5 },
    { mask: 3, n: 5 },
    { mask: 5, n: 4 },
    { mask: 6, n: 3 },
    { mask: 7, n: 3 },
  ];
  const count = (mask: number) =>
    cells.filter((c) => (c.mask & mask) === mask).reduce((n, c) => n + c.n, 0);
  assert.deepEqual([1, 2, 4, 3, 5, 6, 7].map(count), [20, 18, 15, 8, 7, 6, 3]);
  assert.equal(
    cells.reduce((n, c) => n + c.n, 0),
    Number(answer("sets-b09")),
  );
  const threshold = Number(answer("sets-b13"));
  assert.equal(Math.ceil(threshold / 12), 4);
  assert.equal(
    Array(12)
      .fill(3)
      .reduce((a, b) => a + b, 0),
    threshold - 1,
  );
});

test("orthogonal and independence batches satisfy defining algebraic identities", async () => {
  const { questions } = await loadContent();
  const answer = (id: string) => questions.find((q) => q.id === id)!.answer;
  for (const a of [
    [3, 4],
    [0, 0],
    [-2, 5],
  ])
    for (const b of [
      [1, 0],
      [1, 1],
      [2, -1],
    ]) {
      const r = residual(a, b);
      assert.ok(Math.abs(dot(r, b)) < 1e-10);
      assert.ok(norm2(sub(residual(r, b), r)) < 1e-20);
      assert.ok(norm2(sub(residual(a, scale(-3, b)), r)) < 1e-20);
      const t = dot(a, b) / norm2(b);
      for (const s of [-2, 0, 3])
        assert.ok(
          Math.abs(
            norm2(sub(a, scale(s, b))) - norm2(r) - (t - s) ** 2 * norm2(b),
          ) < 1e-10,
        );
    }
  assert.equal(dot([0, 4], [3, 4]), 16);
  const coeff = (answer("independence-b12") as string[]).map(Number);
  assert.deepEqual(
    add(add(scale(coeff[0], [1, 2, 0]), scale(coeff[1], [0, 1, 1])), [1, 3, 1]),
    [0, 0, 0],
  );
  // A nonzero 2x2 minor proves rank >= 2; zero determinant bounds rank < 3.
  assert.equal(1 * 1 - 0 * 0, 1);
  assert.equal(det3([1, 0, 0], [0, 1, 0], [1, 1, 0]), 0);
  assert.notEqual(det3([1, 1, 0], [0, 1, 1], [1, 0, 1]), 0);
  assert.equal(answer("independence-b08"), "2");
  for (const k of [-3, -1, 0, 1, 4]) assert.equal(1 * k - 0 * 1 !== 0, k !== 0);
});

test("vector proof and parameter answers have independent witnesses", async () => {
  const { questions } = await loadContent();
  const q = (id: string) => questions.find((question) => question.id === id)!;
  assert.deepEqual(
    q("vector-length-b06").answer,
    [-3, 3].filter((t) => norm2([t, 4]) === 25).map(String),
  );
  // Change of origin preserves displacement and affine combinations.
  const a = [2, -3],
    b = [5, 7],
    c = [-9, 4];
  assert.deepEqual(sub(sub(b, c), sub(a, c)), sub(b, a));
  for (const alpha of [-2, 0, 0.5, 1, 3])
    assert.deepEqual(
      add(scale(alpha, sub(a, c)), scale(1 - alpha, sub(b, c))),
      sub(add(scale(alpha, a), scale(1 - alpha, b)), c),
    );
  assert.equal(Math.sqrt(norm2(add([1, 0], [-1, 0]))), 0);
  assert.equal(Math.abs(1 + -1), 0);
  const u = [1, 2],
    v = [-3, 4];
  assert.equal(norm2(add(u, v)) + norm2(sub(u, v)), 2 * (norm2(u) + norm2(v)));
});
