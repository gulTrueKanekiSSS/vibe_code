import { createHash } from "node:crypto";
import { constants } from "node:fs";
import {
  cp,
  lstat,
  mkdir,
  mkdtemp,
  open,
  readFile,
  readdir,
  rename,
  rm,
  rmdir,
  unlink,
  writeFile,
} from "node:fs/promises";
import {
  basename,
  dirname,
  isAbsolute,
  join,
  relative,
  resolve,
} from "node:path";
import { z } from "zod";
import {
  validateContentDirectory,
  validateLesson,
  validateQuestionBank,
} from "./content-validation";

const id = z.string().regex(/^[a-z0-9-]+$/);
const manifestSchema = z
  .object({
    packId: id,
    subjectId: id,
    sources: z.array(z.string().trim().min(1)).min(1),
    topicIds: z.array(id).min(1),
    lessonFiles: z.array(z.string().regex(/^lessons\/[a-z0-9-]+\.mdx$/)),
    questionFiles: z.array(z.string().regex(/^questions\/[a-z0-9-]+\.json$/)),
    notes: z.string().optional(),
  })
  .strict();
export type ContentPackManifest = z.infer<typeof manifestSchema>;
export type ImportReport = {
  packId: string;
  addedLessons: string[];
  addedQuestions: string[];
  unchangedLessons: string[];
  unchangedQuestions: string[];
  addedFiles: string[];
  changedFiles: string[];
  receipt: string;
  alreadyImported: boolean;
};

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object")
    return `{${Object.entries(value)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, entry]) => `${JSON.stringify(key)}:${canonical(entry)}`)
      .join(",")}}`;
  return JSON.stringify(value);
}
function unique(values: string[], label: string) {
  if (new Set(values).size !== values.length)
    throw new Error(`Duplicate ${label}`);
}
async function exists(path: string) {
  try {
    await lstat(path);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return false;
    throw error;
  }
}
async function regularTree(path: string): Promise<void> {
  const stat = await lstat(path);
  if (stat.isSymbolicLink())
    throw new Error(`Symlinks are not supported: ${path}`);
  if (stat.isDirectory()) {
    for (const entry of await readdir(path))
      await regularTree(join(path, entry));
  } else if (!stat.isFile()) throw new Error(`Expected regular file: ${path}`);
}
async function safeDirectory(path: string) {
  // Check each existing component before mkdir: a symlink must never redirect writes.
  let current = resolve(path);
  const missing: string[] = [];
  while (!(await exists(current))) {
    missing.push(current);
    current = dirname(current);
  }
  for (let parent = current; ; parent = dirname(parent)) {
    const stat = await lstat(parent);
    if (!stat.isDirectory() || stat.isSymbolicLink())
      throw new Error(`Unsafe directory: ${parent}`);
    if (dirname(parent) === parent) break;
  }
  for (const directory of missing.reverse()) {
    try {
      await mkdir(directory);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
      const stat = await lstat(directory);
      if (!stat.isDirectory() || stat.isSymbolicLink())
        throw new Error(`Unsafe directory: ${directory}`);
    }
  }
}
function overlaps(a: string, b: string) {
  const path = relative(a, b);
  return !path || (!path.startsWith("..") && !isAbsolute(path));
}
async function readOptional(path: string) {
  if (!(await exists(path))) return null;
  if ((await lstat(path)).isSymbolicLink())
    throw new Error(`Unsafe file: ${path}`);
  const handle = await open(path, constants.O_RDONLY | constants.O_NOFOLLOW);
  try {
    if (!(await handle.stat()).isFile())
      throw new Error(`Expected regular file: ${path}`);
    return await handle.readFile("utf8");
  } finally {
    await handle.close();
  }
}

/** Additive, file-only import. One lock serializes all writers using this importer. */
export async function importContentPack(
  packDirectory: string,
  options: { contentRoot?: string; packsRoot?: string } = {},
): Promise<ImportReport> {
  const contentRoot = resolve(options.contentRoot ?? "content");
  const packsRoot = resolve(options.packsRoot ?? "content-packs");
  const packRoot = resolve(packDirectory);
  if (
    overlaps(contentRoot, packsRoot) ||
    overlaps(packsRoot, contentRoot) ||
    overlaps(contentRoot, packRoot) ||
    overlaps(packRoot, contentRoot)
  )
    throw new Error("Pack and content directories must not overlap");
  // Existing roots must remain existing; do not create a typoed content root.
  if (
    !(await lstat(contentRoot)).isDirectory() ||
    !(await lstat(packRoot)).isDirectory()
  )
    throw new Error("Expected content and pack directories");
  await safeDirectory(contentRoot);
  await safeDirectory(packRoot);
  await regularTree(packRoot);
  await safeDirectory(packsRoot);
  await safeDirectory(join(packsRoot, "imported"));
  const lockPath = join(contentRoot, ".content-import.lock");
  let lock;
  try {
    lock = await open(lockPath, "wx");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "EEXIST")
      throw new Error(
        "Another import is active or left a recovery lock; inspect it before retrying",
      );
    throw error;
  }
  let stage: string | undefined;
  let releaseLock = true;
  const committed: { path: string; before: string | null; after: string }[] =
    [];
  const createdDirectories: string[] = [];
  try {
    await lock.writeFile(
      JSON.stringify({ pid: process.pid, startedAt: new Date().toISOString() }),
    );
    await regularTree(contentRoot);
    const manifest = manifestSchema.parse(
      JSON.parse(await readFile(join(packRoot, "manifest.json"), "utf8")),
    );
    unique(manifest.topicIds, "manifest topic ID");
    unique(manifest.lessonFiles, "lesson filename");
    unique(manifest.questionFiles, "question filename");
    if (!manifest.lessonFiles.length && !manifest.questionFiles.length)
      throw new Error("Pack contains no content");
    const expectedFiles = new Set([
      "manifest.json",
      ...manifest.lessonFiles,
      ...manifest.questionFiles,
    ]);
    for (const entry of await readdir(packRoot)) {
      if (entry === "lessons" || entry === "questions") {
        for (const file of await readdir(join(packRoot, entry)))
          if (!expectedFiles.has(`${entry}/${file}`))
            throw new Error(`Unlisted pack file: ${entry}/${file}`);
      } else if (entry !== "manifest.json")
        throw new Error(`Unexpected pack entry: ${entry}`);
    }
    const files = new Map<string, string>();
    for (const file of [...manifest.lessonFiles, ...manifest.questionFiles])
      files.set(file, await readFile(join(packRoot, file), "utf8"));
    const fingerprint = createHash("sha256")
      .update(
        canonical({
          manifest,
          files: Object.fromEntries([...files.entries()].sort()),
        }),
      )
      .digest("hex");
    const receiptPath = join(packsRoot, "imported", `${manifest.packId}.json`);
    if (await exists(receiptPath)) {
      if ((await lstat(receiptPath)).isSymbolicLink())
        throw new Error("Unsafe receipt path");
      const receipt = JSON.parse(await readFile(receiptPath, "utf8"));
      if (receipt.fingerprint !== fingerprint)
        throw new Error(
          `Pack ID ${manifest.packId} was already imported with different content`,
        );
      // Do not trust an old receipt as evidence that current published files are intact.
    }
    const existing = await validateContentDirectory(contentRoot);
    const subject = existing.subjects.find(
      (entry) => entry.id === manifest.subjectId,
    );
    if (!subject) throw new Error(`Unknown subject: ${manifest.subjectId}`);
    const report: ImportReport = {
      packId: manifest.packId,
      addedLessons: [],
      addedQuestions: [],
      unchangedLessons: [],
      unchangedQuestions: [],
      addedFiles: [],
      changedFiles: [],
      receipt: relative(process.cwd(), receiptPath),
      alreadyImported: await exists(receiptPath),
    };
    const writes = new Map<string, { before: string | null; after: string }>();
    const seenTopics = new Set<string>();
    const seenQuestionIds = new Set<string>();
    for (const file of manifest.lessonFiles) {
      const raw = files.get(file)!;
      const lesson = validateLesson(raw);
      const topic = lesson.metadata.id;
      if (
        basename(file, ".mdx") !== topic ||
        !manifest.topicIds.includes(topic) ||
        lesson.metadata.subject !== subject.id ||
        !subject.modules.includes(lesson.metadata.module)
      )
        throw new Error(`Lesson metadata does not match manifest: ${file}`);
      seenTopics.add(topic);
      const collision = existing.lessons.find(
        (entry) => entry.metadata.id === topic,
      );
      if (collision && collision.metadata.subject !== subject.id)
        throw new Error(
          `Lesson ID already belongs to another subject: ${topic}`,
        );
      const destination = join("lessons", subject.id, `${topic}.mdx`);
      const before = await readOptional(join(contentRoot, destination));
      // Compare the full text (except newline style), retaining all metadata and prose.
      if (
        before !== null &&
        before.replace(/\r\n/g, "\n") !== raw.replace(/\r\n/g, "\n")
      )
        throw new Error(
          `Published lesson differs: ${topic}; use a reviewed content edit instead`,
        );
      if (before === null) {
        writes.set(destination, { before, after: raw });
        report.addedLessons.push(topic);
      } else report.unchangedLessons.push(topic);
    }
    for (const file of manifest.questionFiles) {
      const raw: unknown = JSON.parse(files.get(file)!);
      const questions = validateQuestionBank(raw);
      const topic = basename(file, ".json");
      if (
        !manifest.topicIds.includes(topic) ||
        questions.some((question) => question.topicId !== topic)
      )
        throw new Error(`Question topic does not match manifest: ${file}`);
      seenTopics.add(topic);
      const lesson = existing.lessons.find(
        (entry) => entry.metadata.id === topic,
      );
      if (lesson && lesson.metadata.subject !== subject.id)
        throw new Error(`Topic belongs to another subject: ${topic}`);
      if (!lesson && !writes.has(join("lessons", subject.id, `${topic}.mdx`)))
        throw new Error(`Missing lesson for topic: ${topic}`);
      const destination = join("questions", subject.id, `${topic}.json`);
      const before = await readOptional(join(contentRoot, destination));
      const merged: Record<string, unknown>[] =
        before === null ? [] : JSON.parse(before);
      const additions: Record<string, unknown>[] = [];
      for (let index = 0; index < questions.length; index++) {
        const question = questions[index];
        if (seenQuestionIds.has(question.id))
          throw new Error(`Duplicate pack question ID: ${question.id}`);
        seenQuestionIds.add(question.id);
        const supplied = (raw as Record<string, unknown>[])[index];
        const previous = merged.find((entry) => entry.id === question.id);
        if (previous) {
          if (canonical(previous) !== canonical(supplied))
            throw new Error(`Published question differs: ${question.id}`);
          report.unchangedQuestions.push(question.id);
        } else {
          if (existing.questions.some((entry) => entry.id === question.id))
            throw new Error(
              `Question ID already belongs to another topic: ${question.id}`,
            );
          additions.push(supplied);
          report.addedQuestions.push(question.id);
        }
      }
      if (additions.length)
        writes.set(destination, {
          before,
          after: `${JSON.stringify([...merged, ...additions], null, 2)}\n`,
        });
    }
    if (manifest.topicIds.some((topic) => !seenTopics.has(topic)))
      throw new Error("Manifest lists a topic with no supplied files");
    stage = await mkdtemp(join(dirname(contentRoot), ".content-import-"));
    const candidate = join(stage, "candidate");
    await mkdir(candidate);
    for (const entry of ["subjects.json", "lessons", "questions"])
      await cp(join(contentRoot, entry), join(candidate, entry), {
        recursive: true,
      });
    for (const [destination, { before, after }] of writes) {
      await mkdir(dirname(join(candidate, destination)), { recursive: true });
      await writeFile(join(candidate, destination), after);
      (before === null ? report.addedFiles : report.changedFiles).push(
        destination,
      );
    }
    await validateContentDirectory(candidate);
    // Retain recovery evidence if the process is killed or rollback itself fails.
    // There is no filesystem-wide atomic transaction: recovery is explicit, never automatic.
    await writeFile(
      join(stage, "recovery.json"),
      JSON.stringify(
        { contentRoot, receiptPath, writes: [...writes.entries()] },
        null,
        2,
      ),
    );
    const recoveryLock = Buffer.from(
      JSON.stringify({
        pid: process.pid,
        stage,
        startedAt: new Date().toISOString(),
      }),
    );
    await lock.truncate(0);
    await lock.write(recoveryLock, 0, recoveryLock.length, 0);
    // Detect edits made outside the import lock before touching any destination.
    for (const [destination, { before }] of writes)
      if ((await readOptional(join(contentRoot, destination))) !== before)
        throw new Error(`Content changed during import: ${destination}`);
    for (const [destination, change] of writes) {
      const target = join(contentRoot, destination);
      if (!(await exists(dirname(target)))) {
        await mkdir(dirname(target));
        createdDirectories.push(dirname(target));
      }
      await safeDirectory(dirname(target));
      if ((await readOptional(target)) !== change.before)
        throw new Error(`Content changed during import: ${destination}`);
      await rename(join(candidate, destination), target);
      committed.push({
        path: target,
        before: change.before,
        after: change.after,
      });
    }
    if (!report.alreadyImported) {
      const receipt = {
        packId: manifest.packId,
        fingerprint,
        importedAt: new Date().toISOString(),
        sources: manifest.sources,
        report,
      };
      const temporaryReceipt = join(stage, "receipt.json");
      await writeFile(
        temporaryReceipt,
        `${JSON.stringify(receipt, null, 2)}\n`,
      );
      await safeDirectory(dirname(receiptPath));
      if (await exists(receiptPath))
        throw new Error("Receipt changed during import");
      await rename(temporaryReceipt, receiptPath);
    }
    return report;
  } catch (error) {
    try {
      for (const entry of committed.reverse()) {
        await safeDirectory(dirname(entry.path));
        if ((await readOptional(entry.path)) !== entry.after)
          throw new Error("Published file changed during rollback");
        if (entry.before === null) await unlink(entry.path);
        else await writeFile(entry.path, entry.before);
      }
      for (const directory of createdDirectories.reverse())
        await rmdir(directory);
    } catch {
      releaseLock = false;
      throw new Error(
        "Import rollback failed; recovery lock retained. Inspect content and staging before retrying",
        { cause: error },
      );
    }
    throw error;
  } finally {
    await lock.close();
    if (releaseLock) {
      if (stage) await rm(stage, { recursive: true, force: true });
      await unlink(lockPath);
    }
  }
}
