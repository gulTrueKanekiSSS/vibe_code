import assert from "node:assert/strict";
import { test } from "node:test";
import { loadContent } from "../src/lib/content-source";
import { checkAnswer } from "../src/lib/learning";

const completed = [
  "real-numbers",
  "real-axioms",
  "equality",
  "bounds",
  "epsilon",
  "supremum",
  "completeness",
  "infimum",
  "lower-bound",
  "upper-bound",
];

test("minimum analysis batches have ten varied, explained and gradable questions", async () => {
  const { questions } = await loadContent();
  for (const topic of completed) {
    const bank = questions.filter((q) => q.topicId === topic);
    assert.equal(bank.length, 10, topic);
    for (const q of bank.filter((q) => q.id.includes("-min10-"))) {
      assert.equal(new Set(q.hints).size, 3, q.id);
      assert.ok(q.solution.length >= 80, q.id);
      assert.ok(checkAnswer(q.type, q.answer, q.answer), q.id);
      assert.ok(
        q.tags.some((t) =>
          [
            "calculation",
            "proof",
            "counterexample",
            "error-analysis",
            "parameter",
          ].includes(t),
        ),
        q.id,
      );
    }
  }
});

test("lower and upper bound calculations, parameter intervals and counterexamples are valid", async () => {
  const { questions } = await loadContent();
  const answer = (id: string) => questions.find((q) => q.id === id)!.answer;
  assert.deepEqual(answer("lower-bound-min10-01"), ["−2", "−1"]);
  assert.deepEqual(answer("upper-bound-min10-01"), ["1", "2"]);
  const numeric: Record<string, number> = {
    "lower-bound-min10-03": 3 ** 2 - 6 * 3 + 5,
    "lower-bound-min10-04": Math.min(
      ...Array.from({ length: 100 }, (_, i) => (-1) ** (i + 1) / (i + 1)),
    ),
    "upper-bound-min10-03": 2 * 1 - 1 ** 2,
  };
  for (const [id, value] of Object.entries(numeric))
    assert.equal(Number(answer(id)), value, id);
  for (let x = -10; x <= 10; x += 0.25) {
    assert.ok(x ** 2 - 6 * x + 5 >= -4);
    assert.equal(x ** 2 - 6 * x + 5, (x - 3) ** 2 - 4);
    assert.ok(2 * x - x ** 2 <= 1);
    assert.equal(2 * x - x ** 2, 1 - (x - 1) ** 2);
  }
  assert.equal(answer("lower-bound-min10-05"), "t∈[0,4]");
  assert.equal(answer("upper-bound-min10-05"), "t∈(1,2]");
  for (const t of [
    -10, -0.01, 0, 0.5, 0.99, 1, 1.01, 1.5, 2, 2.01, 3, 4, 4.01, 10,
  ]) {
    assert.equal(t ** 2 - 4 * t <= 0, t >= 0 && t <= 4);
    if (t !== 1) assert.equal(t / (t - 1) >= 2, t > 1 && t <= 2);
  }
  assert.equal(answer("lower-bound-min10-02"), "∀x∈S: m≤x");
  assert.equal(answer("lower-bound-min10-06"), "6 — верхняя граница T");
  for (const a of [-2, -1, 0, 10]) assert.ok(-3 * a <= 6);
  assert.ok(-3 * 0 < 6); // 6 need not be a lower bound or a maximum.
  assert.equal(
    answer("lower-bound-min10-07"),
    "Любая нижняя граница A ограничивает B; обратное вообще неверно",
  );
  assert.ok([2].every((x) => 1 <= x) && ![0, 2].every((x) => 1 <= x));
  assert.equal(
    answer("lower-bound-min10-08"),
    "Любое действительное число — нижняя граница, но наибольшей нет",
  );
  const empty: number[] = [];
  for (const bound of [-100, 0, 100])
    assert.ok(empty.every((x) => bound <= x) && bound + 1 > bound);
  assert.equal(answer("lower-bound-min10-09"), "b≥0");
  for (const a of [-5, 0, 7])
    for (const b of [-3, -0.1, 0, 0.1, 4]) {
      if (b >= 0) {
        for (let n = 1; n <= 30; n++) assert.ok(a + b * n >= a + b);
      } else {
        for (const m of [-100, 0, 100]) {
          const n = Math.floor(Math.max(0, (a - m) / -b)) + 1;
          assert.ok(n >= 1 && a + b * n < m);
        }
      }
    }
  assert.equal(
    answer("upper-bound-min10-02"),
    "Для каждого M∈R число x=max(0,M)+1 лежит в интервале и больше M",
  );
  for (const m of [-100, 0, 100])
    assert.ok(Math.max(0, m) + 1 >= 0 && Math.max(0, m) + 1 > m);
  assert.equal(answer("upper-bound-min10-04"), "[3,∞)");
  for (const m of [-10, -3, -1, 0, 2.99]) {
    const x = m <= -3 ? 0 : (m + 3) / 2;
    assert.ok(x ** 2 < 9 && x > m);
  }
  assert.equal(answer("upper-bound-min10-06"), "U(A∪B)=U(A)∩U(B)");
  for (const m of [-1, 0, 1, 2, 3])
    assert.equal(
      [0, 2].every((x) => x <= m),
      [0].every((x) => x <= m) && [2].every((x) => x <= m),
    );
  assert.equal(
    answer("upper-bound-min10-07"),
    "Неотрицательность позволяет перемножить оценки; без неё a=b=−10 даёт ab=100",
  );
  for (const a of [0, 1, 2]) for (const b of [0, 1, 3]) assert.ok(a * b <= 6);
  assert.ok(-10 <= 2 && -10 <= 3 && -10 * -10 > 6);
  assert.equal(
    answer("upper-bound-min10-08"),
    "A∩B пусто; любая действительная граница подходит, но наименьшей нет",
  );
  for (const x of [-2, -1, 0, 1, 2])
    assert.ok(!(x >= -2 && x < 0 && x > 0 && x <= 2));
  assert.equal(
    answer("upper-bound-min10-09"),
    "Да: если x∈S и x>c, то M=(c+x)/2>c, но M<x, что противоречит условию",
  );
  for (const c of [-10, 0, 10])
    for (const gap of [0.01, 1, 5]) {
      const x = c + gap,
        m = (c + x) / 2;
      assert.ok(c < m && m < x);
    }
});

test("bounds, epsilon and supremum batches use sharp estimates and valid counterexamples", async () => {
  const { questions } = await loadContent();
  const answer = (id: string) => questions.find((q) => q.id === id)!.answer;
  assert.equal(Number(answer("bounds-min10-04")), 8 - -4);
  assert.equal(Number(answer("bounds-min10-08")), 1 - -1);
  assert.ok(Math.abs(Number(answer("epsilon-min10-03")) - 0.6 / 3) < 1e-12);
  const n0 = Array.from({ length: 100 }, (_, i) => i + 1).find(
    (n) => 1 / n < 0.05,
  )!;
  assert.equal(Number(answer("epsilon-min10-05")), n0);
  assert.equal(Number(answer("supremum-min10-01")), Math.max(3, 8));
  assert.equal(
    Number(answer("supremum-min10-02")),
    Math.max(
      ...Array.from({ length: 100 }, (_, i) => (-1) ** (i + 1) + 1 / (i + 1)),
    ),
  );
  assert.equal(answer("bounds-min10-01"), "{sin x: x∈R}");
  for (let x = -10; x <= 10; x += 0.25)
    assert.ok(-1 <= Math.sin(x) && Math.sin(x) <= 1);
  assert.deepEqual(answer("bounds-min10-02"), [
    "{1/n: n натуральное, n≥1}",
    "[−2,3)",
    "{0}",
  ]);
  assert.equal(answer("bounds-min10-03"), "B ограничено, даже если оно пустое");
  assert.equal(answer("bounds-min10-05"), "Существует M≥0: |x|≤M для всех x∈S");
  for (const x of [-4, -1, 0, 1])
    assert.ok(Math.abs(x) <= Math.max(Math.abs(-4), Math.abs(1)));
  assert.equal(
    answer("bounds-min10-06"),
    "Пересечение ограничено, объединение не ограничено",
  );
  for (const x of [-100, -1, 0, 2, 100]) {
    assert.equal(x <= 2 && x >= -1, x >= -1 && x <= 2);
    assert.ok(x <= 2 || x >= -1);
  }
  assert.equal(answer("bounds-min10-07"), "Нет: объединение равно R");
  for (const x of [-100.5, -1, 0, 1, 100.5]) {
    const n = Math.max(1, Math.ceil(Math.abs(x)));
    assert.ok(-n <= x && x <= n);
  }
  for (const y of [-0.99, -0.4, 0, 0.7, 0.99]) {
    const x = y / (1 - Math.abs(y));
    assert.ok(Math.abs(x / (1 + Math.abs(x)) - y) < 1e-12);
  }
  assert.equal(answer("bounds-min10-09"), "A=R, B=∅");
  assert.equal(
    [0, 1, 2].flatMap((a) => ([] as number[]).map((b) => a + b)).length,
    0,
  );
  assert.equal(answer("epsilon-min10-01"), "(−2.5,−1.5)");
  for (const x of [-3, -2.5, -2.2, -2, -1.5, -1])
    assert.equal(Math.abs(x + 2) < 0.5, x > -2.5 && x < -1.5);
  assert.equal(
    answer("epsilon-min10-02"),
    "Для любого ε>0 число ε/2 положительно и меньше ε",
  );
  assert.equal(
    answer("epsilon-min10-04"),
    "Существует ε>0: для всех x∈S выполнено x≤s−ε",
  );
  assert.equal(answer("epsilon-min10-06"), "I верно, II неверно");
  assert.equal(
    answer("epsilon-min10-07"),
    "Неравенство треугольника: |u+v|≤|u|+|v|<ε",
  );
  assert.equal(answer("epsilon-min10-08"), "x=1−min(ε/2,1/2)");
  for (const epsilon of [0.001, 0.1, 1, 4]) {
    const x = 1 - Math.min(epsilon / 2, 0.5);
    assert.ok(0 < x && x < 1 && x > 1 - epsilon);
    assert.ok(0 < epsilon / 2 && epsilon / 2 < epsilon);
    for (const u of [-epsilon / 3, 0, epsilon / 3])
      for (const v of [-epsilon / 3, 0, epsilon / 3])
        assert.ok(Math.abs(u + v) < epsilon);
  }
  for (const x of [0.1, 0.5, 0.99]) assert.ok(!(x > 1 - (1 - x) / 2));
  assert.equal(answer("epsilon-min10-09"), "a=0, b=1/2000");
  for (let n = 1; n <= 1000; n++) assert.ok(1 / 2000 < 1 / n);
  const a = [0, 2],
    b = [0, 3];
  assert.ok(
    Math.max(...a.filter((x) => b.includes(x))) <
      Math.min(Math.max(...a), Math.max(...b)),
  );
  assert.equal(answer("supremum-min10-04"), "Нет: A={0,2}, B={0,3} даёт 0<2");
  assert.equal(
    answer("supremum-min10-03"),
    "s+t — верхняя граница; a>s−ε/2 и b>t−ε/2 дают сумму >s+t−ε",
  );
  for (const epsilon of [0.01, 0.5, 1]) {
    const nearA = 3 - epsilon / 4,
      nearB = 8 - epsilon / 4;
    assert.ok(nearA + nearB <= 11 && nearA + nearB > 11 - epsilon);
    assert.ok(10 > -epsilon && !(10 <= 0));
  }
  assert.equal(answer("supremum-min10-05"), "x≤s для каждого x∈S");
});

test("infimum calculations, selected minima and intersection counterexamples agree with independent sets", async () => {
  const { questions } = await loadContent();
  const answer = (id: string) => questions.find((q) => q.id === id)!.answer;
  const fractionSequence = Array.from(
    { length: 100 },
    (_, i) => (i + 1) / (i + 2),
  );
  const numeric: Record<string, number> = {
    "infimum-min10-02": Math.min(...fractionSequence),
    "infimum-min10-03": 2 - 3 * 5,
    "infimum-min10-04": Math.min(...[3, 4, 8].map((x) => 1 / x)),
  };
  for (const [id, value] of Object.entries(numeric))
    assert.equal(Number(answer(id)), value, id);
  assert.deepEqual(answer("infimum-min10-01"), ["[−2,3]", "{−4,1,7}"]);
  const a = [0, 4],
    b = [2, 4];
  assert.ok(
    Math.min(...a.filter((x) => b.includes(x))) >
      Math.max(Math.min(...a), Math.min(...b)),
  );
  assert.equal(answer("infimum-min10-07"), "A={0,4}, B={2,4}");
  assert.equal(Math.min(...[-2, 3].map((x) => x ** 2)), 4);
  assert.equal(Math.min(...[-2, 0, 3].map((x) => x ** 2)), 0);
  assert.equal(
    answer("infimum-min10-08"),
    "Нет: A={−2,3} даёт 4, а A=[−2,3] даёт 0",
  );
  for (const epsilon of [1e-6, 0.1, 1, 100]) {
    const n = Math.floor(1 / epsilon) + 1;
    assert.ok(0 < 1 / n && 1 / n < epsilon); // inf{1/n}=0, not attained.
    assert.ok(-10 < epsilon && !(0 <= -10)); // Proximity alone is insufficient.
    const nearSup = 5 - epsilon / 6;
    assert.ok(2 - 3 * nearSup >= -13 && 2 - 3 * nearSup < -13 + epsilon);
    const lowA = -2,
      lowB = 3;
    const nearA = lowA + epsilon / 4,
      nearB = lowB + epsilon / 4;
    assert.ok(
      nearA + nearB >= lowA + lowB && nearA + nearB < lowA + lowB + epsilon,
    );
  }
  assert.equal(
    answer("infimum-min10-05"),
    "Для каждого ε>0 существует x∈S с x<m+ε",
  );
  assert.equal(
    answer("infimum-min10-06"),
    "α+β — нижняя граница; выбор a<α+ε/2 и b<β+ε/2 даёт сумму <α+β+ε",
  );
  assert.equal(answer("infimum-min10-09"), "m≤x для каждого x∈S");
});

test("completeness proof steps retain their hypotheses and explicit witnesses", async () => {
  const { questions } = await loadContent();
  const answer = (id: string) => questions.find((q) => q.id === id)!.answer;
  assert.equal(
    answer("completeness-min10-01"),
    "В R нет наименьшего числа среди всех его верхних границ",
  );
  for (const bound of [-100, 0, 100]) assert.ok(bound - 1 < bound);
  const finite = [-3, 2, 8];
  assert.equal(Math.min(...finite), -Math.max(...finite.map((x) => -x)));
  assert.equal(
    answer("completeness-min10-02"),
    "Применить аксиому к −S и взять inf S=−sup(−S)",
  );
  assert.equal(
    answer("completeness-min10-03"),
    "Для любого ε>0 есть N с a_N>s−ε, и при n≥N имеем s−ε<aₙ≤s",
  );
  for (const epsilon of [0.01, 0.2, 2]) {
    const n0 = Math.floor(1 / epsilon) + 1;
    for (let n = n0; n < n0 + 10; n++)
      assert.ok(1 - epsilon < 1 - 1 / n && 1 - 1 / n <= 1);
  }
  assert.equal(
    answer("completeness-min10-04"),
    "Каждое bₙ ограничивает все левые концы сверху, а aₙ≤s, поэтому aₙ≤s≤bₙ",
  );
  for (let n = 1; n <= 20; n++) {
    const left = -1 / n,
      right = 1 / n;
    assert.ok(left <= 0 && 0 <= right);
    for (let k = 1; k <= 20; k++) assert.ok(-1 / k <= right);
  }
  // Constant nested intervals refute the unsupported uniqueness claim.
  assert.ok(0 >= -1 && 0 <= 1 && 0.5 >= -1 && 0.5 <= 1);
  assert.equal(
    answer("completeness-min10-05"),
    "Найти n∈N с n>s−1; тогда n+1∈N и n+1>s",
  );
  for (const s of [-2, 0, 0.3, 4, 4.8]) {
    const n = Math.max(1, Math.floor(s));
    assert.ok(n > s - 1 && n + 1 > s);
  }
  assert.equal(
    answer("completeness-min10-06"),
    "Взять c=sup A: любой b∈B — верхняя граница A, поэтому sup A≤b",
  );
  for (const a of [-1, -0.1, 0])
    for (const b of [0, 0.1, 1]) assert.ok(a <= 0 && 0 <= b);
});

test("real arithmetic and equality answers agree with independent calculations and witnesses", async () => {
  const { questions } = await loadContent();
  const answer = (id: string) => questions.find((q) => q.id === id)!.answer;
  const numeric: Record<string, number> = {
    "real-numbers-min10-02": 3 / (27 / 99),
    "real-axioms-min10-02": 1 / (-2 / 3),
    "real-axioms-min10-07": [0, 1, -1].find((e) =>
      [-4, 0, 3].every((a) => a + e + a * e === a),
    )!,
    "equality-min10-02": (10 + 5) / 3,
    "equality-min10-06": [-1, 2].find((x) => Math.sqrt(x + 2) === x)!,
  };
  for (const [id, value] of Object.entries(numeric))
    assert.ok(Math.abs(Number(answer(id)) - value) < 1e-10, id);
  assert.deepEqual(
    answer("equality-min10-04"),
    [-3, 0, 3, 9]
      .filter((x) => x ** 2 === 9)
      .map((x) => String(x).replace("-", "−")),
  );
  assert.deepEqual(answer("real-numbers-min10-04"), [
    "√2·√8",
    "(√5)²",
    "√5−√5",
  ]);
  assert.ok(Math.abs(Math.sqrt(2) * Math.sqrt(8) - 4) < 1e-10);
  assert.equal(Math.sqrt(2) + -Math.sqrt(2), 0);
  for (const [a, b] of [
    [-5, -4],
    [0, 0.25],
    [3, 9],
  ]) {
    assert.ok(a < (a + b) / 2 && (a + b) / 2 < b);
    const x = a + (b - a) / Math.sqrt(2);
    assert.ok(a < x && x < b);
    assert.ok(Math.abs((b - a) / (x - a) - Math.sqrt(2)) < 1e-10);
    assert.ok(a * -3 > b * -3);
    assert.ok(Math.abs(a - b) / 2 < Math.abs(a - b));
  }
  assert.ok(0 * (0 - 2) === 0); // Lost root; signed zero is mathematically zero.
  assert.equal(1 ** 2, (-1) ** 2); // Squaring is not injective.
  assert.notEqual(1 / (1 + 1), 1 / 1 + 1 / 1);
  for (let n = 1; n <= 6; n++)
    assert.ok(Math.abs(1 - (10 ** n - 1) / 10 ** n - 10 ** -n) < 1e-15);
});
