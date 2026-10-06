import { test } from "node:test";
import assert from "node:assert/strict";
import { loadContent } from "../src/lib/content-source";
import { checkAnswer } from "../src/lib/learning";

const bits = [false, true];
const pairs = bits.flatMap((p) => bits.map((q) => [p, q]));
const triples = pairs.flatMap(([p, q]) => bits.map((r) => [p, q, r]));
const imp = (p: boolean, q: boolean) => !p || q;
const reviewed: Record<string, (string | string[])[]> = {
  propositions: [
    "Число 9 простое",
    "Предикатом со свободной переменной",
    ["∀n∈Z: n²≥0", "∃x∈R: x²=2"],
    "Хотя бы один студент не сдал зачёт",
    String(pairs.filter(([p, q]) => p !== q).length),
    "Ложное замкнутое высказывание",
    "Это высказывание; неизвестность читателю не отменяет значения истины",
    "В P(x) переменная свободна, а в ∀x∈R P(x) связана",
    "Все четыре пары",
  ],
  "logical-operators": [
    "Да: достаточно хотя бы одного истинного входа",
    String(Number((false || true) && !false)),
    pairs.map(([p, q]) => String(Number(!(p && q)))),
    "¬P∨¬Q",
    String(triples.filter(([p, q, r]) => p && (q || r)).length),
    "P",
    "(P∧Q∧¬R)∨(P∧¬Q∧R)∨(¬P∧Q∧R)",
    "100",
    ["P, ¬P", "P∨Q, ¬P, ¬Q"],
  ],
  implication: [
    String(pairs.filter(([p, q]) => imp(p, q)).length),
    "¬P",
    "P∧¬Q",
    "P⇒R",
    "(P∧Q)⇒R",
    "P ложно; Q и R не определены однозначно",
  ],
  conditions: [
    "Достаточное условие",
    "Q⇒P",
    "Достаточным, но не необходимым",
    "n делится на 2 и на 3",
    "Достаточным, но не необходимым",
    "Ни необходимым, ни достаточным",
    "A и C каждое влекут B; A⇒C не гарантировано",
    "[0,+∞)",
    "Объединение условий устраняет контрпримеры n=2 и n=3 благодаря взаимной простоте 2 и 3",
  ],
  quantifiers: [
    "-1 и 1",
    "Истина; ложь",
    "A истинно, B ложно",
    "∀x∈D ∃y∈D: ¬R(x,y)",
    "D=Z",
    "Нет: на D={0,1} можно взять P(x): x=0, Q(x): x=1",
  ],
  "math-language": [
    "Пусть n — целое число",
    "Существует хотя бы один x",
    "P⇒Q",
    "∀n∈Z ∃m∈Z: m>n",
    "Предъявить положительное целое, которое не является простым",
    "∀x из рассматриваемой области: x не обладает требуемым свойством",
    "∃x∈D: P(x) ∧ ∀y∈D(P(y)⇒y=x)",
    "∀x∈D ∃y∈D",
    "Отдельно обосновать Q⇒P",
  ],
  contradiction: [
    "Есть положительное x, для которого нет меньшего положительного",
    "N+1",
    "2(a−b)=1",
    "∃n∈Z: n²<0",
    "P истинно",
    "У a и b общий делитель 2, хотя дробь несократима",
    "У N есть простой делитель, не входящий в список",
    "В каждом ящике ≤3, тогда всего ≤12",
    "(a+b)/2",
  ],
  contrapositive: [
    "¬Q⇒¬P",
    "Если n нечётно, то n не делится на 4",
    "n=2k+1 ⇒ n²=2(2k²+2k)+1",
    "|x|<3 ⇒ x²<9",
    "Если x∉B, то x∉A",
    "Если хотя бы один множитель чётен, произведение чётно",
    String(1 ** 2 % 3),
    "Если для всех y∈R верно y²≠x, то x≤0",
    "Доказано обратное; нужно n нечётно ⇒ n² не делится на 4",
  ],
  "direct-proof": [
    "Записать n=5k с целым k",
    "a−b=3(u−v), где u−v целое",
    "c=a(km), где km целое",
    "r+s=(ad+bc)/(bd), числитель целый и знаменатель ненулевой",
    "Взять произвольный x∈A∩B; по определению x∈A и x∈B, значит x∈A",
    "Если n чётно, чётен первый множитель; если n нечётно, чётен n+1",
    "x²+y²−2xy=(x−y)²≥0",
    "x>0 сохраняет знак; x²+1−2x=(x−1)²≥0",
    "x∈A ⇒ x∈B ⇒ x∈C",
  ],
  "even-odd": [
    "2k+1, где k∈Z",
    "Нечётно",
    "ab=2(2km+k+m)+1 при a=2k+1,b=2m+1",
    "Ровно одно из a,b нечётно",
    String(5 % 2),
    "1",
    "Нет: нечётное произведение требует двух нечётных, а их сумма чётна",
    "Квадраты дают 0 или 1 по модулю 4; сумма 2 требует двух нечётных, но тогда сумма равна 2 по модулю 8, а 6≡6",
    "Чётность определяется для целых x, и множитель x/2 должен быть целым",
  ],
  functions: [
    "a↦0, b↦0, c↦1",
    "{0,1,4}",
    "f не инъективна",
    "g сюръективна, f не сюръективна; обе не инъективны",
    String((2 * -3 + 1) ** 2),
    "Инъективна, образ — нечётные целые, не сюръективна на Z",
    "f⁻¹(y)=√y",
    "0",
    String(2 ** 3 - 2),
  ],
};

test("discrete minimum-topic batches preserve coverage and reviewed answer keys", async () => {
  const { questions } = await loadContent();
  for (const [topic, answers] of Object.entries(reviewed)) {
    assert.equal(
      questions.filter((q) => q.topicId === topic).length,
      10,
      topic,
    );
    for (const [i, answer] of answers.entries()) {
      const id = `${topic}-min10-${String(i + 1).padStart(2, "0")}`;
      const question = questions.find((q) => q.id === id);
      assert.ok(question, id);
      assert.deepEqual(question.answer, answer, id);
      assert.equal(
        checkAnswer(question.type, answer, question.answer),
        true,
        id,
      );
      assert.equal(new Set(question.hints).size, 3, id);
      assert.ok(question.solution.length >= 100, id);
    }
  }
  const expectedNew = Object.values(reviewed).reduce(
    (sum, a) => sum + a.length,
    0,
  );
  const actualNew = questions.filter(
    (q) => q.id.includes("-min10-") && q.topicId in reviewed,
  );
  assert.equal(actualNew.length, expectedNew);
});

const mod = (n: number, d: number) => ((n % d) + d) % d;

test("discrete proof and parity batches have independent identities and obstruction witnesses", () => {
  for (const [p, q] of pairs) {
    assert.equal(imp(p, q), imp(!q, !p));
    assert.equal(q && !q, false);
  }
  for (let n = -50; n <= 50; n++) {
    assert.ok(n + 1 > n);
    assert.equal(mod(n * (n + 1), 2), 0);
    assert.equal((n * n) % 2 === 0, n % 2 === 0);
    assert.equal((n * n) % 3 === 0, n % 3 === 0);
    assert.equal((n * n) % 4 === 0, n % 2 === 0);
    assert.equal(n % 6 === 0, n % 2 === 0 && n % 3 === 0);
    if (n % 2 !== 0) assert.equal(mod(n * n, 8), 1);
    if (n % 3 !== 0) assert.equal(mod(n * n, 3), 1);
    assert.equal((5 * n) ** 2 % 5, 0);
    assert.equal((2 * n + 1) ** 2, 2 * (2 * n * n + 2 * n) + 1);
    assert.equal((2 * n + 1) ** 2, 4 * n * (n + 1) + 1);
    for (let m = -20; m <= 20; m++) {
      assert.equal((2 * n + 1) * (2 * m + 1), 2 * (2 * n * m + n + m) + 1);
      assert.equal(2 * n + (2 * m + 1), 2 * (n + m) + 1);
      assert.equal(mod(n + m, 2) === 1, (n % 2 !== 0) !== (m % 2 !== 0));
      if ((n * m) % 2 !== 0) {
        assert.notEqual(n % 2, 0);
        assert.notEqual(m % 2, 0);
        assert.equal(mod(n + m, 2), 0);
      }
      assert.equal(n * n + m * m - 2 * n * m, (n - m) ** 2);
    }
  }
  // Exhaustive residues prove the obstruction, rather than only searching small solutions.
  for (let x = 0; x < 8; x++)
    for (let y = 0; y < 8; y++) assert.notEqual((x * x + y * y) % 8, 6);

  for (const x of [0.001, 0.5, 1, 3, 100]) {
    assert.ok(0 < x / 2 && x / 2 < x);
    assert.ok(x + 1 / x >= 2);
  }
  assert.ok(-1 + 1 / -1 < 2);
  for (const [a, b] of [
    [-9, -7],
    [-4, 2],
    [0, 1],
    [2, 3],
  ]) {
    const midpoint = (a + b) / 2;
    assert.ok(a < midpoint && midpoint < b);
  }
  const primes = [2, 3, 5, 7, 11, 13];
  const euclid = primes.reduce((a, p) => a * p, 1) + 1;
  assert.equal(euclid, 59 * 509);
  for (const p of primes) assert.equal(euclid % p, 1);
  assert.equal(4 * 3, 12);
  assert.ok(13 > 4 * 3);
  assert.equal(2 * 1.5, 3); // Omitting integral multiplier does not establish evenness.
});

test("discrete quantifier and function answers have finite models and domain witnesses", () => {
  const empty: number[] = [];
  assert.equal(
    empty.every((x) => x > 0),
    true,
  );
  assert.equal(
    empty.some((x) => x > 0),
    false,
  );
  const d = [0, 1];
  assert.equal(
    d.every((x) => d.some((y) => x !== y)),
    true,
  );
  assert.equal(
    d.some((y) => d.every((x) => x !== y)),
    false,
  );
  assert.equal(
    d.every((x) => x === 0 || x === 1),
    true,
  );
  assert.equal(d.every((x) => x === 0) || d.every((x) => x === 1), false);
  // All binary relations on the two-element domain validate quantifier negation.
  for (let mask = 0; mask < 16; mask++) {
    const r = (x: number, y: number) => Boolean(mask & (1 << (2 * x + y)));
    assert.equal(
      !d.some((x) => d.every((y) => r(x, y))),
      d.every((x) => d.some((y) => !r(x, y))),
    );
  }
  assert.deepEqual(
    [-2, -1, 0, 1, 2].filter((x) => x * x === 1),
    [-1, 1],
  );
  assert.deepEqual(
    [...new Set([-2, -1, 0, 1, 2].map((x) => x * x))].sort(),
    [0, 1, 4],
  );
  assert.equal((-3) ** 2, 3 ** 2);
  assert.equal((2 * -3 + 1) ** 2, 25);
  assert.equal(2 * (-3) ** 2 + 1, 19);
  const f = [1, 2, 0],
    g = [0, 2, 1];
  const a = [0, 1, 2];
  assert.equal(a.filter((x) => f[g[x]] === g[f[x]]).length, 0);
  const maps = triples.map((row) => row.map(Number));
  assert.equal(maps.filter((row) => new Set(row).size === 2).length, 6);
  for (const y of [0, 0.25, 1, 4, 9]) {
    assert.equal(Math.sqrt(y) ** 2, y);
  }
  for (let n = -20; n <= 20; n++) {
    assert.ok(n - 1 < n); // Z has no minimum.
    assert.equal((2 * n + 1 - 1) / 2, n);
    assert.equal((2 * n + 1) % 2 === 0, false);
  }
  for (const x of [-3, -1, 0, 1, 3]) {
    if (x >= 0) assert.equal(x > 0, x * x > 0);
  }
  assert.equal(-1 > 0, false);
  assert.equal((-1) ** 2 > 0, true);
  assert.equal(4 % 6 === 0, false);
  assert.equal(6 % 4 === 0, false);
  assert.equal(2 % 6 === 0, false);
  assert.equal(3 % 6 === 0, false);
});

test("discrete logic answers have exhaustive Boolean and arithmetic witnesses", () => {
  for (const [p, q] of pairs) {
    assert.equal(!(p && q), !p || !q);
    assert.equal((p && q) || (p && !q), p);
    assert.equal(!imp(p, q), p && !q);
    if (imp(p, q) && !q) assert.equal(p, false);
  }
  for (const [p, q, r] of triples) {
    const exactlyTwo = (p && q && !r) || (p && !q && r) || (!p && q && r);
    assert.equal(exactlyTwo, [p, q, r].filter(Boolean).length === 2);
    if (imp(p, q) && imp(q, r)) assert.equal(imp(p, r), true);
    assert.equal(imp(p, imp(q, r)), imp(p && q, r));
    if (imp(p, q) && imp(q, r) && imp(p, !r)) assert.equal(p, false);
  }
  assert.notEqual((true || false) && false, true || (false && false));
  assert.equal(
    pairs.some(([p, q]) => (p || q) && !p && !q),
    false,
  );
  assert.equal(
    pairs.some(([p, q]) => (p || q) && !p),
    true,
  );
  assert.equal(
    pairs.some(([p, q]) => p && q && q),
    true,
  );
  const truthPairs = new Set(
    [1, 2, 3, 6].map((n) => `${Number(n % 2 === 0)}${Number(n % 3 === 0)}`),
  );
  assert.equal(truthPairs.size, 4);
  for (let n = -20; n <= 20; n++) {
    assert.ok(n * n >= 0);
    assert.notEqual(n * n, 2);
  }
});
