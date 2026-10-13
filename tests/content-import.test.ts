import assert from "node:assert/strict";
import {
  mkdtemp,
  mkdir,
  readFile,
  realpath,
  readdir,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import fs from "node:fs/promises";
import { syncBuiltinESMExports } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { mock, test } from "node:test";
import { importContentPack } from "../scripts/content-pack";

function lesson(id: string) {
  return `---\n${JSON.stringify({ id, title: id, english: id, subject: "analysis", module: "Basics", order: 1, difficulty: "EASY", estimatedMinutes: 5, prerequisites: [], keywords: ["example"], quizAnswer: "2" })}\n---\n## Что это?\nЭто учебный пример с подробным объяснением определения и его применения в конкретной математической ситуации.\n## Разберём на примере\nПри сложении единицы и единицы получаем два.\n## Частая ошибка\nНе следует путать сложение с умножением.\n`;
}
function question(id: string, topicId: string) {
  return {
    id,
    topicId,
    type: "NUMERIC",
    difficulty: "EASY",
    prompt: `Find the value for exercise ${id}`,
    options: [],
    answer: "2",
    solution:
      "Start with one and add one more. The resulting sum is exactly two.",
    hints: [
      "Identify the operation.",
      "The operation is addition.",
      "Count one more after one.",
    ],
    tags: [],
  };
}
async function fixture() {
  const root = await realpath(
    await mkdtemp(join(tmpdir(), "studyspace-content-pack-")),
  );
  const contentRoot = join(root, "content");
  const packsRoot = join(root, "packs");
  const pack = join(packsRoot, "inbox", "example");
  await mkdir(join(contentRoot, "lessons", "analysis"), { recursive: true });
  await mkdir(join(contentRoot, "questions", "analysis"), { recursive: true });
  await mkdir(join(contentRoot, "lessons", "geometry"), { recursive: true });
  await mkdir(join(contentRoot, "questions", "geometry"), { recursive: true });
  await writeFile(
    join(contentRoot, "subjects.json"),
    JSON.stringify(
      ["analysis", "geometry"].map((id) => ({
        id,
        title: id,
        english: id,
        description: "",
        icon: "",
        color: "",
        modules: ["Basics"],
      })),
    ),
  );
  await writeFile(
    join(contentRoot, "lessons", "analysis", "existing.mdx"),
    lesson("existing"),
  );
  await writeFile(
    join(contentRoot, "questions", "analysis", "existing.json"),
    JSON.stringify([question("original", "existing")]),
  );
  await mkdir(join(pack, "lessons"), { recursive: true });
  await mkdir(join(pack, "questions"), { recursive: true });
  const manifest = {
    packId: "example",
    subjectId: "analysis",
    sources: ["Lab notes"],
    topicIds: ["new-topic"],
    lessonFiles: ["lessons/new-topic.mdx"],
    questionFiles: ["questions/new-topic.json"],
  };
  await writeFile(join(pack, "manifest.json"), JSON.stringify(manifest));
  await writeFile(join(pack, "lessons", "new-topic.mdx"), lesson("new-topic"));
  await writeFile(
    join(pack, "questions", "new-topic.json"),
    JSON.stringify([question("new-question", "new-topic")]),
  );
  return {
    root,
    contentRoot,
    packsRoot,
    pack,
    manifest,
    cleanup: () => rm(root, { recursive: true, force: true }),
  };
}
async function snapshot(root: string): Promise<Record<string, string>> {
  const files: Record<string, string> = {};
  for (const entry of await readdir(root, { withFileTypes: true })) {
    if (entry.isDirectory())
      for (const [path, text] of Object.entries(
        await snapshot(join(root, entry.name)),
      ))
        files[`${entry.name}/${path}`] = text;
    else files[entry.name] = await readFile(join(root, entry.name), "utf8");
  }
  return files;
}

test("pack imports a new topic without changing unrelated files and retries idempotently", async () => {
  const f = await fixture();
  try {
    const before = await snapshot(f.contentRoot);
    const result = await importContentPack(f.pack, f);
    assert.deepEqual(result.addedLessons, ["new-topic"]);
    assert.deepEqual(result.addedQuestions, ["new-question"]);
    assert.equal(result.addedFiles.length, 2);
    assert.deepEqual(result.changedFiles, []);
    const after = await snapshot(f.contentRoot);
    for (const [path, text] of Object.entries(before))
      assert.equal(after[path], text);
    assert.ok(
      await readFile(join(f.packsRoot, "imported", "example.json"), "utf8"),
    );
    assert.ok(await readFile(join(f.pack, "manifest.json"), "utf8"));
    const retry = await importContentPack(f.pack, f);
    assert.equal(retry.alreadyImported, true);
    assert.deepEqual(retry.addedFiles, []);
    assert.deepEqual(retry.unchangedQuestions, ["new-question"]);
    assert.deepEqual(await snapshot(f.contentRoot), after);
    await writeFile(
      join(f.pack, "questions", "new-topic.json"),
      JSON.stringify([
        { ...question("new-question", "new-topic"), answer: "3" },
      ]),
    );
    await assert.rejects(
      importContentPack(f.pack, f),
      /already imported with different content/,
    );
    assert.deepEqual(await snapshot(f.contentRoot), after);
  } finally {
    await f.cleanup();
  }
});

test("pack appends questions with preserved fields while identical IDs are no-ops", async () => {
  const f = await fixture();
  try {
    await rm(join(f.pack, "lessons", "new-topic.mdx"));
    await rm(join(f.pack, "questions", "new-topic.json"));
    await writeFile(
      join(f.pack, "manifest.json"),
      JSON.stringify({
        ...f.manifest,
        topicIds: ["existing"],
        lessonFiles: [],
        questionFiles: ["questions/existing.json"],
      }),
    );
    const extra = {
      ...question("extra", "existing"),
      feedback: { "3": "Count once more carefully." },
    };
    await writeFile(
      join(f.pack, "questions", "existing.json"),
      JSON.stringify([question("original", "existing"), extra]),
    );
    const result = await importContentPack(f.pack, f);
    assert.deepEqual(result.addedQuestions, ["extra"]);
    assert.deepEqual(result.unchangedQuestions, ["original"]);
    assert.deepEqual(result.changedFiles, ["questions/analysis/existing.json"]);
    const bank = JSON.parse(
      await readFile(
        join(f.contentRoot, "questions", "analysis", "existing.json"),
        "utf8",
      ),
    );
    assert.deepEqual(bank, [question("original", "existing"), extra]);
  } finally {
    await f.cleanup();
  }
});

test("pack validation failures do not change published files or create receipts", async () => {
  for (const failure of [
    "unknown-subject",
    "wrong-topic",
    "missing-bank",
    "bad-hints",
    "duplicate-id",
    "unlisted",
    "traversal",
  ] as const) {
    const f = await fixture();
    try {
      if (failure === "unknown-subject")
        await writeFile(
          join(f.pack, "manifest.json"),
          JSON.stringify({ ...f.manifest, subjectId: "unknown" }),
        );
      if (failure === "wrong-topic")
        await writeFile(
          join(f.pack, "questions", "new-topic.json"),
          JSON.stringify([question("new-question", "existing")]),
        );
      if (failure === "missing-bank") {
        await rm(join(f.pack, "questions", "new-topic.json"));
        await writeFile(
          join(f.pack, "manifest.json"),
          JSON.stringify({ ...f.manifest, questionFiles: [] }),
        );
      }
      if (failure === "bad-hints")
        await writeFile(
          join(f.pack, "questions", "new-topic.json"),
          JSON.stringify([
            { ...question("new-question", "new-topic"), hints: ["one"] },
          ]),
        );
      if (failure === "duplicate-id")
        await writeFile(
          join(f.pack, "questions", "new-topic.json"),
          JSON.stringify([question("original", "new-topic")]),
        );
      if (failure === "unlisted")
        await writeFile(join(f.pack, "questions", "extra.json"), "[]");
      if (failure === "traversal")
        await writeFile(
          join(f.pack, "manifest.json"),
          JSON.stringify({ ...f.manifest, lessonFiles: ["../outside.mdx"] }),
        );
      const before = await snapshot(f.contentRoot);
      await assert.rejects(importContentPack(f.pack, f), failure);
      assert.deepEqual(await snapshot(f.contentRoot), before, failure);
      assert.deepEqual(await readdir(join(f.packsRoot, "imported")), []);
    } finally {
      await f.cleanup();
    }
  }
});

test("different published question or lesson with the same ID is refused", async () => {
  for (const target of ["question", "lesson"]) {
    const f = await fixture();
    try {
      await rm(join(f.pack, "lessons", "new-topic.mdx"));
      await rm(join(f.pack, "questions", "new-topic.json"));
      const manifest = {
        ...f.manifest,
        topicIds: ["existing"],
        lessonFiles: target === "lesson" ? ["lessons/existing.mdx"] : [],
        questionFiles: ["questions/existing.json"],
      };
      await writeFile(join(f.pack, "manifest.json"), JSON.stringify(manifest));
      if (target === "lesson")
        await writeFile(
          join(f.pack, "lessons", "existing.mdx"),
          `${lesson("existing")}\nChanged prose.`,
        );
      await writeFile(
        join(f.pack, "questions", "existing.json"),
        JSON.stringify([
          {
            ...question("original", "existing"),
            ...(target === "question" ? { answer: "3" } : {}),
          },
        ]),
      );
      const before = await snapshot(f.contentRoot);
      await assert.rejects(
        importContentPack(f.pack, f),
        /Published .* differs/,
      );
      assert.deepEqual(await snapshot(f.contentRoot), before);
    } finally {
      await f.cleanup();
    }
  }
});

test("symlinked pack files and destination directories are refused", async () => {
  for (const destination of [false, true]) {
    const f = await fixture();
    try {
      const original = destination
        ? join(f.contentRoot, "questions", "analysis")
        : join(f.pack, "lessons", "new-topic.mdx");
      const outside = join(f.root, "outside");
      if (destination) {
        await fs.rename(original, outside);
        await symlink(outside, original, "dir");
      } else {
        await writeFile(outside, lesson("new-topic"));
        await rm(original);
        await symlink(outside, original);
      }
      await assert.rejects(importContentPack(f.pack, f), /Symlink|Unsafe/);
    } finally {
      await f.cleanup();
    }
  }
});

test("exclusive import lock prevents concurrent writers and preserves recovery locks", async () => {
  const f = await fixture();
  try {
    const results = await Promise.allSettled([
      importContentPack(f.pack, f),
      importContentPack(f.pack, f),
    ]);
    assert.equal(
      results.filter((result) => result.status === "fulfilled").length,
      1,
    );
    const rejected = results.find(
      (result) => result.status === "rejected",
    ) as PromiseRejectedResult;
    assert.match(String(rejected.reason), /import is active/);
    await writeFile(
      join(f.contentRoot, ".content-import.lock"),
      "recovery evidence",
    );
    await assert.rejects(importContentPack(f.pack, f), /recovery lock/);
    assert.equal(
      await readFile(join(f.contentRoot, ".content-import.lock"), "utf8"),
      "recovery evidence",
    );
  } finally {
    await f.cleanup();
  }
});

test("a mid-commit filesystem error rolls back already imported files and allows retry", async () => {
  const f = await fixture();
  const originalRename = fs.rename;
  let calls = 0;
  try {
    const before = await snapshot(f.contentRoot);
    mock.method(fs, "rename", async (...args: Parameters<typeof fs.rename>) => {
      if (++calls === 2) throw new Error("Injected disk failure");
      return originalRename(...args);
    });
    syncBuiltinESMExports();
    await assert.rejects(importContentPack(f.pack, f), /Injected disk failure/);
    assert.deepEqual(await snapshot(f.contentRoot), before);
    assert.deepEqual(await readdir(join(f.packsRoot, "imported")), []);
    mock.restoreAll();
    syncBuiltinESMExports();
    const retry = await importContentPack(f.pack, f);
    assert.deepEqual(retry.addedQuestions, ["new-question"]);
  } finally {
    mock.restoreAll();
    syncBuiltinESMExports();
    await f.cleanup();
  }
});

test("a destination replaced with a symlink during commit is not overwritten", async () => {
  const f = await fixture();
  const originalRename = fs.rename;
  const outside = join(f.root, "outside.json");
  const target = join(f.contentRoot, "questions", "analysis", "new-topic.json");
  let calls = 0;
  try {
    await writeFile(outside, "Keep this external file");
    mock.method(fs, "rename", async (...args: Parameters<typeof fs.rename>) => {
      await originalRename(...args);
      if (++calls === 1) await symlink(outside, target);
    });
    syncBuiltinESMExports();
    await assert.rejects(importContentPack(f.pack, f), /Unsafe file/);
    assert.equal(await readFile(outside, "utf8"), "Keep this external file");
    assert.equal((await fs.lstat(target)).isSymbolicLink(), true);
    await assert.rejects(
      readFile(join(f.contentRoot, "lessons", "analysis", "new-topic.mdx")),
      { code: "ENOENT" },
    );
    assert.deepEqual(await readdir(join(f.packsRoot, "imported")), []);
  } finally {
    mock.restoreAll();
    syncBuiltinESMExports();
    await f.cleanup();
  }
});
