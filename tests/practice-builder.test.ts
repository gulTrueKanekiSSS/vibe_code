import { test } from "node:test";
import assert from "node:assert/strict";
import {
  matchingQuestionCount,
  selectionForSubject,
  suggestBuilderTopics,
  practicePresets,
  practiceGoals,
  type BuilderTopic,
} from "../src/lib/practice-builder";
import {
  customSelection,
  readPracticeConfig,
} from "../src/lib/practice-service";
import { automaticTopicIds } from "../src/lib/curriculum";

const topic = (
  id: string,
  questions: BuilderTopic["questions"],
): BuilderTopic => ({
  id,
  title: id,
  subjectId: "geometry",
  moduleId: "vectors",
  moduleTitle: "Vectors",
  questions,
});
const numeric = { difficulty: "EASY", type: "NUMERIC", tags: ["calculation"] };
const hard = {
  difficulty: "HARD",
  type: "MULTIPLE_CHOICE",
  tags: ["reasoning"],
};

test("legacy saved settings without categories retain their filters and feedback behavior", () => {
  const saved = readPracticeConfig({
    subjectId: "geometry",
    topicIds: ["projection"],
    difficulties: ["HARD"],
    questionTypes: ["MULTIPLE_CHOICE"],
    count: 1,
    hintsAllowed: false,
    feedbackMode: "end",
  });
  assert.ok(saved);
  assert.deepEqual(saved.patternIds, []);
  assert.equal(saved.hintsAllowed, false);
  assert.equal(saved.feedbackMode, "end");
  assert.equal(
    matchingQuestionCount(topic("projection", [numeric, hard]), {
      ...saved,
      patternIds: saved.patternIds ?? [],
    }),
    1,
  );
});

test("subject changes remove categories absent from retained topics, even if other subject topics have them", () => {
  const topics = [
    topic("projection", [{ ...numeric, tags: ["projection"] }]),
    topic("vectors", [numeric]),
    { ...topic("complex-numbers", [numeric]), subjectId: "analysis" },
  ];
  const selected = {
    topicIds: ["projection", "complex-numbers"],
    patternIds: ["calculation"],
    questionTypes: ["NUMERIC", "OUTPUT"],
  };
  assert.deepEqual(selectionForSubject(topics, "geometry", selected), {
    topicIds: ["projection"],
    patternIds: [],
    questionTypes: ["NUMERIC"],
  });
  assert.deepEqual(selectionForSubject(topics, "analysis", selected), {
    topicIds: ["complex-numbers"],
    patternIds: ["calculation"],
    questionTypes: ["NUMERIC"],
  });
  assert.deepEqual(
    selectionForSubject(topics, "geometry", { ...selected, topicIds: [] })
      .patternIds,
    ["calculation"],
  );
});

test("builder availability matches server selection across level/type/category combinations", () => {
  const topics = [
    topic("a", [numeric, hard]),
    topic("b", [numeric, { ...hard, tags: [] }]),
  ];
  for (const difficulties of [["EASY"], ["HARD"], ["EASY", "HARD"]] as const)
    for (const questionTypes of [
      ["NUMERIC"],
      ["MULTIPLE_CHOICE"],
      ["NUMERIC", "MULTIPLE_CHOICE"],
    ])
      for (const patternIds of [
        [],
        ["reasoning"],
        ["calculation"],
        ["missing"],
      ]) {
        const filters = { difficulties, questionTypes, patternIds };
        const available = topics.reduce(
          (n, t) => n + matchingQuestionCount(t, filters),
          0,
        );
        const questions = topics.flatMap((t) =>
          t.questions.map((q, i) => ({ ...q, id: t.id + i, topicId: t.id })),
        );
        const selected = customSelection(questions, {
          ...filters,
          difficulties: [...difficulties],
          topicIds: [],
          count: 20,
        });
        assert.equal(available, selected.length);
      }
});

test("empty difficulty/type filters yield zero availability, and empty topics carry no questions", () => {
  const t = topic("a", [numeric]);
  assert.equal(
    matchingQuestionCount(t, {
      difficulties: [],
      questionTypes: ["NUMERIC"],
      patternIds: [],
    }),
    0,
  );
  assert.equal(
    matchingQuestionCount(t, {
      difficulties: ["EASY"],
      questionTypes: [],
      patternIds: [],
    }),
    0,
  );
  assert.equal(
    matchingQuestionCount(topic("empty", []), {
      difficulties: ["EASY"],
      questionTypes: ["NUMERIC"],
      patternIds: [],
    }),
    0,
  );
});

test("automatic topics respect curriculum and all filters, stop at requested coverage, and are repeatable", () => {
  const topics = [
    topic("future-or-unknown", Array(20).fill(numeric)),
    topic(automaticTopicIds[0], [hard]),
    topic(automaticTopicIds[1], [numeric, numeric]),
    topic(automaticTopicIds[2], [numeric]),
    topic(automaticTopicIds[3], [numeric]),
  ];
  const filters = {
    difficulties: ["EASY"] as const,
    questionTypes: ["NUMERIC"],
    patternIds: ["calculation"],
  };
  const expected = [automaticTopicIds[1], automaticTopicIds[2]];
  assert.deepEqual(suggestBuilderTopics(topics, filters, 3), expected);
  assert.deepEqual(suggestBuilderTopics(topics, filters, 3), expected);
  assert.equal(suggestBuilderTopics(topics, filters, 20).length, 3);
  assert.deepEqual(
    suggestBuilderTopics(topics, { ...filters, questionTypes: [] }, 3),
    [],
  );
  assert.deepEqual(suggestBuilderTopics([], filters, 3), []);
});

test("presets retain established settings and every goal controls real feedback/hints fields", () => {
  assert.deepEqual(
    practicePresets.map((p) => [
      p.difficulties,
      p.count,
      p.hintsAllowed,
      p.feedbackMode,
    ]),
    [
      [["EASY"], 5, true, "immediate"],
      [["EASY", "MEDIUM"], 10, true, "immediate"],
      [["MEDIUM", "HARD"], 10, true, "immediate"],
      [["HARD", "CHALLENGE"], 15, false, "end"],
    ],
  );
  assert.equal(
    practiceGoals.find((g) => g.id === "check")?.feedbackMode,
    "end",
  );
  assert.equal(
    practiceGoals.find((g) => g.id === "reinforce")?.hintsAllowed,
    true,
  );
});
