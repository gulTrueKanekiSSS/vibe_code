import { test } from "node:test";
import assert from "node:assert/strict";
import {
  filterSelectionState,
  setFilterSelection,
} from "../src/lib/filter-selection";

test("bulk selection covers the entire scope and clears only that scope", () => {
  const scope = Array.from({ length: 64 }, (_, i) => `topic-${i}`);
  const selected = setFilterSelection(["other", "topic-0"], scope, true);
  assert.equal(selected.length, 65);
  assert.ok(scope.every((id) => selected.includes(id)));
  assert.deepEqual(setFilterSelection(selected, scope, false), ["other"]);
  assert.deepEqual(setFilterSelection(selected, scope, true), selected);
});

test("manual selection moves between none, partial and all", () => {
  const scope = ["a", "b"];
  assert.deepEqual(filterSelectionState([], scope), {
    all: false,
    partial: false,
    disabled: false,
  });
  let selected: string[] = setFilterSelection([], ["a"], true);
  assert.equal(filterSelectionState(selected, scope).partial, true);
  selected = setFilterSelection(selected, ["b"], true);
  assert.equal(filterSelectionState(selected, scope).all, true);
  selected = setFilterSelection(selected, ["a"], false);
  assert.equal(filterSelectionState(selected, scope).partial, true);
});

test("empty scopes and unavailable items never report a false complete selection", () => {
  assert.deepEqual(filterSelectionState(["disabled"], []), {
    all: false,
    partial: false,
    disabled: true,
  });
  assert.deepEqual(setFilterSelection(["disabled"], ["available"], true), [
    "disabled",
    "available",
  ]);
  assert.deepEqual(setFilterSelection([], [], true), []);
});

test("changing the filtered list recomputes state without selecting new items", () => {
  const selected = ["a", "b"];
  assert.equal(filterSelectionState(selected, ["a", "b"]).all, true);
  assert.equal(filterSelectionState(selected, ["b", "c"]).partial, true);
  assert.equal(filterSelectionState(selected, ["c"]).all, false);
  assert.deepEqual(setFilterSelection(selected, ["b", "c"], false), ["a"]);
  assert.deepEqual(selected, ["a", "b"]);
});

test("selection limits include choices outside the scope and allow bulk clearing", () => {
  assert.equal(filterSelectionState(["other"], ["a", "b"], 2).disabled, true);
  assert.deepEqual(setFilterSelection(["other"], ["a", "b"], true, 2), [
    "other",
  ]);
  assert.deepEqual(setFilterSelection(["other", "a"], ["a", "b"], false, 2), [
    "other",
  ]);
  assert.equal(filterSelectionState(["a", "b"], ["a", "b"], 2).disabled, false);
  assert.deepEqual(setFilterSelection(["a", "a"], ["a", "b", "b"], true, 2), [
    "a",
    "b",
  ]);
});
