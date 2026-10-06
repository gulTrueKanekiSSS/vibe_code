import { test } from "node:test";
import assert from "node:assert/strict";
import { loadContent } from "../src/lib/content-source";
import { checkAnswer } from "../src/lib/learning";

const pairs = [0, 1].flatMap((a) => [0, 1].map((b) => [a, b]));
const triples = pairs.flatMap(([a, b]) => [0, 1].map((c) => [a, b, c]));
const nand = (a: number, b: number) => 1 - (a & b);
const dot = (a: number[], b: number[]) =>
  a.reduce((s, x, i) => s + x * b[i], 0);
const scale = (k: number, a: number[]) => a.map((x) => k * x);
const add = (a: number[], b: number[]) => a.map((x, i) => x + b[i]);
const sub = (a: number[], b: number[]) => add(a, scale(-1, b));
const norm2 = (a: number[]) => dot(a, a);
const project = (a: number[], b: number[]) => scale(dot(a, b) / norm2(b), b);
const deg = (a: number[], b: number[]) =>
  (Math.acos(dot(a, b) / Math.sqrt(norm2(a) * norm2(b))) * 180) / Math.PI;
const key = (topic: string, index: number) =>
  `${topic}-min10-${String(index).padStart(2, "0")}`;

const expected: Record<string, number | string | string[]> = {
  [key("and-or-not", 3)]: pairs.map(([a, b]) => String(a & (1 - b))),
  [key("and-or-not", 7)]: pairs
    .filter(([a, b]) => (a & b) !== (a | b))
    .map((p) => p.join("")),
  [key("binary", 1)]: (10).toString(2).padStart(4, "0"),
  [key("binary", 2)]: 2 ** 5,
  [key("binary", 3)]: 2 ** 6,
  [key("binary", 4)]: Array.from({ length: 10 }, (_, n) => n).find(
    (n) => 2 ** n >= 101,
  )!,
  [key("binary", 5)]: [
    String((0b1011 + 0b0110) % 16),
    String(Math.floor((0b1011 + 0b0110) / 16)),
  ],
  [key("binary", 6)]: (0b1000 - 1).toString(2).padStart(4, "0"),
  [key("bitwise", 1)]: Math.log2(0b00001000),
  [key("bitwise", 3)]: 0b10110110 & 0b11110000,
  [key("bitwise", 4)]: (0b11010110 >> 2) & 7,
  [key("bitwise", 5)]: 0b00101000 ^ 0b00011000,
  [key("bitwise", 9)]: (0b10110100).toString(2).replaceAll("0", "").length,
  [key("boolean", 2)]: triples.filter(([a, b, c]) => a || (b && c)).length,
  [key("dnf-cnf", 2)]: 2,
  [key("dnf-cnf", 5)]: pairs.map(([a, b]) => String((a | b) & ((1 - a) | b))),
  [key("gates", 6)]: 2 ** pairs.length,
  [key("nand", 2)]: pairs.map(([a, b]) => {
    const t = nand(a, b);
    return String(nand(nand(a, t), nand(b, t)));
  }),
  [key("nand", 4)]: pairs
    .filter(([a, b]) => ((1 - a) & (1 - b)) !== nand(a, b))
    .map((p) => p.join("")),
  [key("nand", 6)]: [String(nand(nand(0, 1), 1)), String(nand(0, nand(1, 1)))],
  [key("xor", 3)]: 1 ^ 1 ^ 1,
  [key("xor", 4)]: 1 ^ 0 ^ 1 ^ 1,
  [key("angle", 2)]: deg([1, 2], [3, 6]),
  [key("angle", 3)]: (Math.acos(5 / (2 * 5)) * 180) / Math.PI,
  [key("angle", 6)]: 180 - 40,
  [key("angle", 7)]: (Math.acos((2 - 1) / 2) * 180) / Math.PI,
  [key("determinants", 1)]: -7,
  [key("determinants", 2)]: -3,
  [key("determinants", 3)]: (-2) ** 3 * 2,
  [key("determinants", 4)]: 2 * -3 * 4,
  [key("determinants", 6)]: 1 / 4,
  [key("dot-product", 1)]: 2 * 3 - 3 * -2,
  [key("dot-product", 2)]: Math.sqrt(49),
  [key("dot-product", 4)]: [String((5 + 1) / 2), String((5 - 1) / 2)],
  [key("projection", 1)]: dot([-3, 4], [1, 0]),
  [key("projection", 3)]: [String(2 * norm2([1, 1]) - 3), "2"],
  [key("lines", 3)]: sub([1, 1], [-1, 4]).map(String),
  [key("lines", 5)]: [String(3 / (2 + 1)), String((2 * 3) / (2 + 1))],
  [key("lines", 7)]: norm2(sub([1, 3], project([1, 3], [1, 1]))),
  [key("parallel", 1)]: -2 / 1,
  [key("parallel", 4)]: (2 * 6) / 3,
  [key("parallel", 6)]: 2,
  [key("parallel", 7)]: ["(0,1,0)", "(0,0,1)", "(0,1,1)"],
  [key("planes", 2)]: dot([2, -1, 3], [1, 2, 3]),
  [key("planes", 3)]: ["(2,1,0)", "(0,1,2)", "(1,1,1)"],
  [key("planes", 5)]: ["2", "-1", "4"],
  [key("planes", 9)]: 1,
};

test("new numerical, steps and multi-select architecture/geometry answers match calculations", async () => {
  const { questions, lessons } = await loadContent();
  const topics = new Set(
    lessons
      .filter((l) => ["architecture", "geometry"].includes(l.metadata.subject))
      .map((l) => l.metadata.id),
  );
  const batch = questions.filter(
    (q) => topics.has(q.topicId) && q.id.includes("-min10-"),
  );
  assert.equal(batch.length, 119);
  for (const q of batch.filter((q) =>
    ["NUMERIC", "STEPS", "MULTI_SELECT", "SHORT_TEXT"].includes(q.type),
  )) {
    assert.ok(q.id in expected, `Independent oracle missing: ${q.id}`);
    const value = expected[q.id];
    const answer =
      typeof value === "number"
        ? String(Math.abs(value) < 1e-10 ? 0 : Number(value.toPrecision(12)))
        : value;
    assert.ok(checkAnswer(q.type, q.answer, answer), q.id);
  }
});

test("Boolean design choices are checked exhaustively, including affine XOR limits", () => {
  for (const [a, b, c] of triples) {
    assert.equal(a | (a & b), a);
    assert.equal((a | b) & (a | (1 - b)), a);
    assert.equal((a & b) | ((1 - a) & c) | (b & c), (a & b) | ((1 - a) & c));
    assert.equal(1 - ((a & b) | c), ((1 - a) | (1 - b)) & (1 - c));
    assert.equal(a & (b | c), (a & b) | (a & c));
    assert.equal(a | ((1 - a) & b), a | b);
    assert.equal(a ^ b ^ (1 - b), a ^ 1);
  }
  for (const [a, b] of pairs) {
    assert.equal((a | b) & ((1 - a) | (1 - b)), a ^ b);
    assert.equal((a | b) & ((1 - a) | b), b);
    assert.equal(a ^ b ^ b, a);
    assert.equal((1 - a) | (1 - b), nand(a, b));
    for (const [c, d] of pairs)
      assert.equal(nand(nand(a, b), nand(c, d)), (a & b) | (c & d));
  }
  const andTable = pairs.map(([a, b]) => a & b);
  const affineTables = triples.map(([x, y, z]) =>
    pairs.map(([a, b]) => (x & a) ^ (y & b) ^ z),
  );
  assert.ok(
    affineTables.every(
      (table) => JSON.stringify(table) !== JSON.stringify(andTable),
    ),
  );
  assert.equal(triples.filter(([a, b, c]) => (a ^ b ^ c) === 0).length, 4);
  assert.equal(triples.filter(([a, b]) => a && b).length, 2);
  assert.notEqual(1 | (0 & 0), (1 | 0) & 0);
  assert.equal(nand(0, nand(1, 1)), 1);
  assert.equal(nand(nand(0, 1), 1), 0);
  for (let x = 1; x < 256; x++) {
    const pop = (n: number) => n.toString(2).replaceAll("0", "").length;
    assert.equal(pop(x & (x - 1)), pop(x) - 1);
    for (let m = 0; m < 256; m++) assert.equal(x ^ m ^ m, x);
  }
});

test("geometry parameter, counterexample and incidence witnesses validate explanations", () => {
  assert.equal(dot([1, 0], [0, 1]), dot([1, 0], [0, 2]));
  assert.notDeepEqual([0, 1], [0, 2]);
  assert.equal(norm2([1, 0]), norm2([0, 1]));
  assert.notEqual(1 * 1 - 0 * 0, 0);
  assert.deepEqual(project([1, 3], [1, 1]), [2, 2]);
  assert.deepEqual(project(project([0, 2], [1, 1]), [1, 0]), [1, 0]);
  assert.deepEqual(project(project([0, 2], [1, 0]), [1, 1]), [0, 0]);
  assert.deepEqual(project([1, 3], [1, 1]), [2, 2]);
  assert.deepEqual(project([2, 0], [2, 0]), [2, 0]);
  assert.deepEqual(scale(dot([2, 0], [2, 0]), [2, 0]), [8, 0]);
  assert.equal(dot([1, 2, -1], [2, -1, 0]), 0);
  assert.equal(dot([2, -1, 3], [1, 2, 3]), 9);
  const candidates = [
    [2, 1, 0],
    [0, 1, 2],
    [1, 0, 0],
    [1, 1, 1],
  ];
  assert.deepEqual(
    candidates.filter((v) => dot([1, -2, 1], v) === 0),
    [
      [2, 1, 0],
      [0, 1, 2],
      [1, 1, 1],
    ],
  );
  assert.equal(dot([1, 1, 1], [2, -1, 4]), 5);
  for (const t of [-3, 0, 1, 8]) {
    assert.equal(t + (1 - t), 1);
    assert.equal(dot([1, 1, 1], [t, t, -2 * t]), 0);
    assert.equal(dot([1, -1, 0], [t, t, -2 * t]), 0);
  }
  assert.equal(norm2([3, 4]) - norm2([4, -3]), 0);
});
