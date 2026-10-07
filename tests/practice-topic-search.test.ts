import assert from "node:assert/strict";
import test from "node:test";
import { matchesTopicSearch } from "../src/lib/practice-topic-search";
import { setFilterSelection } from "../src/lib/filter-selection";

const topic = { id: "pointer-arithmetic", title: "Арифметика указателей" };

test("topic search supports case, whitespace, subject and stable English ID", () => {
  assert.equal(
    matchesTopicSearch(
      topic,
      "Программирование",
      "  УКАЗАТЕЛЕЙ   программирование ",
    ),
    true,
  );
  assert.equal(
    matchesTopicSearch(topic, "Программирование", "pointer arithmetic"),
    true,
  );
  assert.equal(matchesTopicSearch(topic, "Программирование", "матрицы"), false);
  assert.equal(
    matchesTopicSearch(topic, "Программирование", "указателей матрицы"),
    false,
  );
  assert.equal(matchesTopicSearch(topic, "Программирование", "  "), true);
});

test("topic search treats е/ё equally without mutating topic content", () => {
  const original = { id: "account", title: "Учёт погрешности" };
  assert.equal(matchesTopicSearch(original, "Анализ", "учет"), true);
  assert.equal(
    matchesTopicSearch({ id: "account", title: "Учет" }, "Анализ", "учёт"),
    true,
  );
  assert.deepEqual(original, { id: "account", title: "Учёт погрешности" });
});

test("found-results bulk selection keeps selected topics outside the search", () => {
  const selected = ["hidden-topic"];
  const found = [topic.id];
  assert.deepEqual(setFilterSelection(selected, found, true, 100), [
    "hidden-topic",
    topic.id,
  ]);
  assert.deepEqual(
    setFilterSelection(["hidden-topic", topic.id], found, false, 100),
    selected,
  );
  assert.deepEqual(selected, ["hidden-topic"]);
});
