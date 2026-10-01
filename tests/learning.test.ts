import { test } from "node:test";
import assert from "node:assert/strict";
import {
  score,
  mastery,
  practiceGpa,
  topicState,
  streak,
  eligible,
  publicIdentity,
  checkAnswer,
  dailySelection,
  type Evidence,
} from "../src/lib/learning";
const evidence = (overrides: Partial<Evidence> = {}): Evidence => ({
  questionId: "q1",
  topicId: "t1",
  difficulty: "HARD",
  attempts: 1,
  hintLevel: 0,
  correct: true,
  completedAt: new Date("2026-09-29T12:00:00Z"),
  xp: 30,
  ...overrides,
});
test("XP uses difficulty, attempts and highest hint; never negative", () => {
  assert.equal(score("EASY", 1, 0), 10);
  assert.equal(score("MEDIUM", 2, 1), 14);
  assert.equal(score("HARD", 3, 4), 7);
  assert.equal(score("CHALLENGE", 1, 0), 50);
  for (const hint of [0, 1, 2, 3, 4]) assert.ok(score("EASY", 9, hint) >= 0);
});
test("mastery requires distinct questions; repeats cannot farm coverage", () => {
  const one = mastery([evidence({ difficulty: "EASY" })]);
  assert.equal(one, 39);
  assert.equal(
    mastery(
      Array.from({ length: 100 }, () => evidence({ difficulty: "EASY" })),
    ),
    one,
  );
  assert.equal(
    mastery([
      evidence(),
      evidence({ questionId: "q2" }),
      evidence({ questionId: "q3" }),
    ]),
    100,
  );
  assert.equal(mastery([]), 0);
});
test("latest failure replaces old success and hints reduce mastery", () => {
  assert.equal(
    mastery([
      evidence(),
      evidence({ correct: false, completedAt: new Date("2026-09-30") }),
    ]),
    0,
  );
  assert.ok(mastery([evidence({ hintLevel: 4 })]) < mastery([evidence()]));
  assert.ok(mastery([evidence({ attempts: 3 })]) < mastery([evidence()]));
});
test("Practice GPA boundaries and clamping", () => {
  assert.equal(practiceGpa(95), 4);
  assert.equal(practiceGpa(90), 3.9);
  assert.equal(practiceGpa(89), 3.7);
  assert.equal(practiceGpa(50), 1.3);
  assert.equal(practiceGpa(0), 0);
  assert.equal(practiceGpa(39), 0);
  assert.equal(practiceGpa(40), 1);
  assert.equal(practiceGpa(-1), 0);
  assert.equal(practiceGpa(1000), 4);
});
test('topic state needs three scored questions before PRACTICED',()=>{
 assert.equal(topicState(0,false,0),'NOT_STARTED');
 assert.equal(topicState(39,true,1),'LEARNING');
 assert.equal(topicState(70,true,3),'PRACTICED');
 assert.equal(topicState(95,true,3),'MASTERED');
});
test("streak needs distinct correct questions or read plus related correct answer", () => {
  const now = new Date("2026-09-29T20:00:00Z");
  assert.equal(streak([evidence(), evidence(), evidence()], [], now), 0);
  assert.equal(streak([evidence()], [{ topicId: "t1", readAt: now }], now), 1);
  assert.equal(
    streak([evidence()], [{ topicId: "other", readAt: now }], now),
    0,
  );
  const rows = [0, 1, 2].flatMap((d) =>
    [1, 2, 3].map((n) =>
      evidence({
        questionId: `q${n}`,
        completedAt: new Date(`2026-09-${29 - d}T12:00:00Z`),
      }),
    ),
  );
  assert.equal(streak(rows, [], now), 3);
  assert.equal(streak(rows, [], new Date("2026-09-30")), 3);
  assert.equal(streak(rows, [], new Date("2026-10-01")), 0);
});
test("leaderboard eligibility requires distinct solutions and multiple topics", () => {
  assert.equal(eligible(Array.from({ length: 50 }, () => evidence())), false);
  assert.equal(
    eligible(
      Array.from({ length: 30 }, (_, i) =>
        evidence({ questionId: `q${i}`, topicId: `t${i % 3}` }),
      ),
    ),
    true,
  );
  assert.equal(
    eligible(
      Array.from({ length: 30 }, (_, i) => evidence({ questionId: `q${i}` })),
    ),
    false,
  );
});
test("public projection strips hidden alias/photo and excludes private accounts", () => {
  const user = {
    id: "1",
    firstName: "Student",
    username: "secret",
    photoUrl: "https://photo",
    settings: { showUsername: false, showPhoto: false, leaderboard: true },
  };
  assert.deepEqual(publicIdentity(user), {
    id: "1",
    name: "Student",
    username: null,
    photoUrl: null,
  });
  assert.equal(
    publicIdentity({
      ...user,
      settings: { ...user.settings, leaderboard: false },
    }),
    null,
  );
  assert.equal(JSON.stringify(publicIdentity(user)).includes("secret"), false);
});
test("answer types reject invalid numeric input and compare sets/steps correctly", () => {
  assert.equal(checkAnswer("FIX_CODE", "&x", "&X"), false);
  assert.equal(checkAnswer("OUTPUT", "Hello", "hello"), false);
  assert.equal(checkAnswer("NUMERIC", "0", ""), false);
  assert.equal(checkAnswer("NUMERIC", "0", " "), false);
  assert.equal(checkAnswer("NUMERIC", "0", "junk"), false);
  assert.equal(checkAnswer("NUMERIC", "1.5", "1,5"), true);
  assert.equal(checkAnswer("MULTI_SELECT", ["A", "B"], ["B", "A"]), true);
  assert.equal(checkAnswer("MULTI_SELECT", ["A", "B"], ["A", "A"]), false);
  assert.equal(checkAnswer("STEPS", ["6", "2", "3"], ["6", "3", "2"]), false);
  assert.equal(checkAnswer("FIX_CODE", ["&x", "& x"], "&x"), true);
  assert.equal(
    checkAnswer(
      "CONCEPTUAL",
      ["orthogonal", "перпендикулярны"],
      " Перпендикулярны ",
    ),
    true,
  );
});
test("daily selection is stable and prioritizes weak studied topics", () => {
  const questions = Array.from({ length: 10 }, (_, i) => ({
    id: `q${i}`,
    topicId: `t${i}`,
  }));
  const topics = questions.map((q, i) => ({
    id: q.topicId,
    mastery: i === 9 ? 10 : 70,
    started: i === 9,
    lastPractice: null,
    readAt: null,
  }));
  const a = dailySelection(questions, topics, "2026-09-29");
  assert.equal(a.length, 5);
  assert.equal(a[0].topicId, "t9");
  assert.deepEqual(a, dailySelection(questions, topics, "2026-09-29"));
});
