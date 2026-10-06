import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { loadContent } from "../src/lib/content-source";
import baseline from "./fixtures/minimum-baseline.json";

function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, item]) => [key, canonical(item)]),
    );
  return value;
}

test("every existing topic supplies at least ten distinct practice questions", async () => {
  const { lessons, questions } = await loadContent();
  assert.equal(lessons.length, 64);
  for (const { metadata } of lessons) {
    const bank = questions.filter((q) => q.topicId === metadata.id);
    assert.ok(
      bank.length >= 10,
      `${metadata.id}: only ${bank.length} questions`,
    );
    assert.equal(new Set(bank.map((q) => q.id)).size, bank.length);
    assert.equal(new Set(bank.map((q) => q.prompt.trim())).size, bank.length);
  }
});

test("the original 352 question objects remain unchanged after coverage expansion", async () => {
  const { questions } = await loadContent();
  const ids = new Set(baseline.ids);
  const preserved = questions
    .filter((q) => ids.has(q.id))
    .sort((a, b) => a.id.localeCompare(b.id));
  assert.equal(preserved.length, baseline.questionCount);
  const digest = createHash("sha256")
    .update(JSON.stringify(canonical(preserved)))
    .digest("hex");
  assert.equal(
    digest,
    baseline.sha256,
    `Content from ${baseline.baseCommit} must retain its meaning and metadata`,
  );
});
