import {
  test as base,
  expect,
  type Locator,
  type Page,
} from "@playwright/test";
import { loadEnvConfig } from "@next/env";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { db } from "../src/lib/db";
import type { StoredPracticeConfig } from "../src/lib/practice-service";

loadEnvConfig(process.cwd(), true, { info() {}, error() {} });

// Each browser check owns a synthetic learner and removes only that learner.
// Traces are disabled so the authenticated cookie is never captured in artifacts.
const test = base.extend<{ learnerId: string; browserErrors: string[] }>({
  learnerId: async ({ context, baseURL }, runFixture) => {
    const learner = await db.user.create({
      data: {
        telegramId: `test-builder-${randomUUID()}`,
        firstName: "Builder QA",
        settings: { create: {} },
      },
    });
    try {
      const token = randomBytes(32).toString("hex");
      await db.authSession.create({
        data: {
          userId: learner.id,
          tokenHash: createHash("sha256").update(token).digest("hex"),
          expiresAt: new Date(Date.now() + 600000),
        },
      });
      await context.addCookies([
        {
          name: "study_session",
          value: token,
          url: baseURL!,
          httpOnly: true,
          sameSite: "Lax",
        },
      ]);
      await runFixture(learner.id);
    } finally {
      await db.user.delete({ where: { id: learner.id } });
    }
  },
  browserErrors: async ({ page }, runFixture) => {
    const errors: string[] = [];
    const failedResources: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("response", (response) => {
      if (response.status() >= 400)
        failedResources.push(
          `${response.status()} ${new URL(response.url()).pathname}`,
        );
    });
    page.on("console", (message) => {
      if (message.type() === "error") {
        const location = message.location().url;
        // Chrome requests this absent pre-existing asset outside Playwright's page requests.
        // Keep this one known resource warning separate from application/React errors.
        if (
          location &&
          new URL(location).pathname === "/favicon.ico" &&
          message.text() ===
            "Failed to load resource: the server responded with a status of 404 (Not Found)"
        )
          return;
        errors.push(
          `${message.text().split("\n")[0]}${location ? ` (${new URL(location).pathname})` : ""}`,
        );
      }
    });
    await runFixture(errors);
    expect(errors, failedResources.join("\n")).toEqual([]);
  },
});

test.use({ trace: "off" });
test.afterAll(async () => db.$disconnect());

test("builder visual audit desktop and mobile", async ({
  page,
  learnerId,
  browserErrors,
}, testInfo) => {
  expect(learnerId).toBeTruthy();
  expect(browserErrors).toEqual([]);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/practice/custom");
  const builder = page.locator(".practice-builder");
  await expect(builder).toBeVisible();
  await expect(builder.getByRole("status")).toContainText("в сессию войдёт 5");
  // Verify client interactivity before screenshots temporarily touch input caret styles.
  await builder
    .getByRole("searchbox", { name: "Найти тему", exact: true })
    .fill("projection");
  await builder
    .getByRole("button", { name: "Очистить поиск", exact: true })
    .click();
  const stage = process.env.PRACTICE_BUILDER_AUDIT_STAGE ?? "final";
  await page.screenshot({
    path: testInfo.outputPath(`${stage}-desktop.png`),
    fullPage: true,
    animations: "disabled",
  });
  await expect(builder.locator(".practice-builder-summary")).toBeInViewport();
  await page
    .getByRole("button", { name: "Переключить тему", exact: true })
    .click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  const darkSurface = await page
    .locator("html")
    .evaluate((element) =>
      getComputedStyle(element).getPropertyValue("--surface").trim(),
    );
  const darkSurfaceRgb = `rgb(${[1, 3, 5].map((position) => parseInt(darkSurface.slice(position, position + 2), 16)).join(", ")})`;
  await expect
    .poll(() =>
      builder
        .getByRole("button", { name: "10 заданий", exact: true })
        .evaluate((element) => getComputedStyle(element).backgroundColor),
    )
    .toBe(darkSurfaceRgb);
  await page.screenshot({
    path: testInfo.outputPath(`${stage}-desktop-dark.png`),
    fullPage: true,
    animations: "disabled",
  });
  await page
    .getByRole("button", { name: "Переключить тему", exact: true })
    .click();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await expect(builder).toBeVisible();
  await builder
    .getByRole("searchbox", { name: "Найти тему", exact: true })
    .fill("projection");
  await builder
    .getByRole("button", { name: "Очистить поиск", exact: true })
    .click();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(
    await builder
      .locator(".practice-builder-summary")
      .evaluate((element) => getComputedStyle(element).position),
  ).toMatch(/^(static|relative)$/);
  await page.screenshot({
    path: testInfo.outputPath(`${stage}-mobile.png`),
    fullPage: true,
    animations: "disabled",
  });
});

function topicCheckbox(builder: Locator, title: string) {
  const escaped = title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return builder.getByRole("checkbox", {
    name: new RegExp(`^${escaped}(?:\\s|$)`),
  });
}

async function startAndRead(
  page: Page,
  learnerId: string,
  trigger: () => Promise<unknown>,
) {
  const responsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === "/api/practice" &&
      response.request().method() === "POST",
  );
  await trigger();
  const response = await responsePromise;
  expect(response.status()).toBe(200);
  const { sessionId } = await response.json();
  await expect(page).toHaveURL(new RegExp(`/practice/${sessionId}$`));
  await expect(page.locator(".question-card > .prose")).toBeVisible();
  const saved = await db.practiceSession.findUniqueOrThrow({
    where: { id: sessionId },
    include: {
      items: { orderBy: { position: "asc" }, include: { question: true } },
    },
  });
  expect(saved.userId).toBe(learnerId);
  expect(saved.mode).toBe("custom");
  return saved;
}

test("topic search preserves hidden choices, scopes found-only bulk actions and resets subject", async ({
  page,
  learnerId,
  browserErrors,
}) => {
  expect(browserErrors).toEqual([]);
  const projection = await db.topic.findUniqueOrThrow({
    where: { id: "projection" },
    select: { title: true },
  });
  const matrices = await db.topic.findUniqueOrThrow({
    where: { id: "matrix-operations" },
    select: { title: true },
  });
  await page.goto("/practice/custom?subject=geometry");
  const builder = page.locator(".practice-builder");
  const search = builder.getByRole("searchbox", {
    name: "Найти тему",
    exact: true,
  });
  const summary = builder.locator(".practice-builder-summary");
  const allStatus = await builder.getByRole("status").innerText();
  await search.fill("projection");
  await expect(builder.getByRole("status")).toHaveText(allStatus);
  await topicCheckbox(builder, projection.title).check();
  const selected = builder.getByRole("group", {
    name: "Выбранные темы",
    exact: true,
  });
  await expect(selected).toContainText(projection.title);
  const projectionStatus = await builder.getByRole("status").innerText();
  await search.fill("matrix operations");
  await expect(builder.getByRole("status")).toHaveText(projectionStatus);
  await expect(topicCheckbox(builder, projection.title)).toHaveCount(0);
  await expect(selected).toContainText(projection.title);
  const found = builder.getByRole("checkbox", {
    name: "Выбрать найденные темы",
    exact: true,
  });
  await found.check();
  await expect(selected).toContainText(matrices.title);
  await found.uncheck();
  await expect(
    selected.getByRole("button", {
      name: `Убрать тему: ${matrices.title}`,
      exact: true,
    }),
  ).toHaveCount(0);
  await expect(selected).toContainText(projection.title);
  await found.check();
  await selected
    .getByRole("button", {
      name: `Убрать тему: ${projection.title}`,
      exact: true,
    })
    .click();
  await expect(selected).not.toContainText(projection.title);
  await search.fill("no-such-studyspace-topic");
  await expect(builder.locator(".practice-builder-topics input")).toHaveCount(
    0,
  );
  await expect(selected).toContainText(matrices.title);
  await builder
    .getByRole("button", { name: "Очистить поиск", exact: true })
    .click();
  await expect(search).toHaveValue("");
  await expect(topicCheckbox(builder, matrices.title)).toBeChecked();
  await builder
    .getByRole("button", { name: "Все темы предмета", exact: true })
    .click();
  await expect(builder.getByRole("status")).toHaveText(allStatus);
  await expect(summary).toContainText(/Все темы/i);

  // Global select-all retains the subject scope even while search hides topics.
  await search.fill("projection");
  const all = builder.getByRole("checkbox", {
    name: "Выбрать все темы",
    exact: true,
  });
  await all.focus();
  await page.keyboard.press("Space");
  await expect(all).toBeChecked();
  await search.fill("matrix operations");
  await expect(topicCheckbox(builder, matrices.title)).toBeChecked();
  await builder
    .getByRole("button", { name: "Дополнительные настройки", exact: true })
    .click();
  await builder
    .getByRole("checkbox", { name: "Выбрать все категории", exact: true })
    .check();
  await builder.getByRole("combobox").selectOption("programming");
  await expect(search).toHaveValue("");
  await expect(all).not.toBeChecked();
  await expect(
    builder.getByRole("checkbox", {
      name: "Выбрать все категории",
      exact: true,
    }),
  ).not.toBeChecked();
  await expect(
    builder.getByRole("checkbox", {
      name: "Выбрать все типы заданий",
      exact: true,
    }),
  ).toBeChecked();
  await expect(selected.getByRole("button")).toHaveCount(0);
  const saved = await startAndRead(page, learnerId, () =>
    builder.getByRole("button", { name: "Начать выбранную практику" }).click(),
  );
  const config = saved.config as StoredPracticeConfig;
  expect(config.subjectId).toBe("programming");
  expect(config.topicIds).toEqual([]);
  expect(config.patternIds).toEqual([]);
  expect(saved.items).toHaveLength(5);
  for (const item of saved.items) {
    const topic = await db.topic.findUniqueOrThrow({
      where: { id: item.question.topicId },
      select: { module: { select: { subjectId: true } } },
    });
    expect(topic.module.subjectId).toBe("programming");
  }
});

test("editable presets and collapsed advanced filters persist exact configuration and edit roundtrip", async ({
  page,
  learnerId,
  browserErrors,
}) => {
  expect(browserErrors).toEqual([]);
  await page.goto("/practice/custom?topic=projection");
  const builder = page.locator(".practice-builder");
  const advanced = builder.getByRole("button", {
    name: "Дополнительные настройки",
    exact: true,
  });
  await expect(advanced).toHaveAttribute("aria-expanded", "false");
  await expect(
    builder.getByRole("checkbox", {
      name: "Выбрать все типы заданий",
      exact: true,
    }),
  ).toHaveCount(0);
  const presets = [
    {
      name: "Разминка",
      count: "5",
      levels: ["Базовый"],
      hints: "Разрешены",
      feedback: "После каждого ответа",
    },
    {
      name: "Обычная",
      count: "10",
      levels: ["Базовый", "Средний"],
      hints: "Разрешены",
      feedback: "После каждого ответа",
    },
    {
      name: "К семинару",
      count: "10",
      levels: ["Средний", "Сложный"],
      hints: "Разрешены",
      feedback: "После каждого ответа",
    },
    {
      name: "К экзамену",
      count: "15",
      levels: ["Сложный", "Вызов"],
      hints: "Отключены",
      feedback: "В конце сессии",
    },
  ];
  for (const preset of presets) {
    const button = builder.getByRole("button", {
      name: preset.name,
      exact: true,
    });
    await button.click();
    await expect(button).toHaveAttribute("aria-pressed", "true");
    await expect(
      builder.getByLabel("Количество заданий", { exact: true }),
    ).toHaveValue(preset.count);
    for (const level of ["Базовый", "Средний", "Сложный", "Вызов"]) {
      if (preset.levels.includes(level))
        await expect(builder.getByLabel(level, { exact: true })).toBeChecked();
      else
        await expect(
          builder.getByLabel(level, { exact: true }),
        ).not.toBeChecked();
    }
    await advanced.click();
    await expect(
      builder.getByRole("radio", { name: preset.hints, exact: true }),
    ).toBeChecked();
    await expect(
      builder.getByRole("radio", { name: preset.feedback, exact: true }),
    ).toBeChecked();
    await advanced.click();
  }
  await expect(builder.getByRole("status")).toContainText("Доступно только");
  await expect(
    builder.getByRole("button", { name: "Начать выбранную практику" }),
  ).toBeDisabled();
  await expect(
    builder.getByLabel("Средний", { exact: true }),
  ).not.toBeChecked();
  await builder.getByRole("button", { name: "Обычная", exact: true }).click();
  await builder.getByLabel("Количество заданий", { exact: true }).fill("1");
  await expect(
    builder.getByRole("button", { name: "Обычная", exact: true }),
  ).toHaveAttribute("aria-pressed", "false");
  await advanced.click();
  await builder
    .getByRole("checkbox", { name: "Выбрать все сложности", exact: true })
    .check();
  await builder
    .getByRole("checkbox", { name: "Выбрать все сложности", exact: true })
    .uncheck();
  await expect(
    builder.getByRole("button", { name: "Начать выбранную практику" }),
  ).toBeDisabled();
  await builder.getByLabel("Средний", { exact: true }).check();
  const categories = builder
    .locator("fieldset")
    .filter({ has: page.locator("legend", { hasText: "Содержание заданий" }) });
  await categories
    .getByRole("checkbox", { name: "Вычисления", exact: true })
    .check();
  await builder
    .getByRole("checkbox", { name: "Выбрать все типы заданий", exact: true })
    .uncheck();
  await expect(
    builder.getByRole("button", { name: "Начать выбранную практику" }),
  ).toBeDisabled();
  const types = builder
    .locator("fieldset")
    .filter({ has: page.locator("legend", { hasText: "Типы заданий" }) });
  await types
    .getByRole("checkbox", { name: "Вычисления", exact: true })
    .check();
  await builder.getByRole("radio", { name: "Отключены", exact: true }).check();
  await builder
    .getByRole("radio", { name: "В конце сессии", exact: true })
    .check();
  await advanced.click();
  const summary = builder.locator(".practice-builder-summary");
  await expect(summary).toContainText(/подсказ.*отключ|без подсказ/i);
  await expect(summary).toContainText(/в конце/i);
  await expect(summary).toContainText(/категор|Вычисления/i);
  const saved = await startAndRead(page, learnerId, () =>
    builder.getByRole("button", { name: "Начать выбранную практику" }).click(),
  );
  const config = saved.config as StoredPracticeConfig;
  expect(config).toMatchObject({
    subjectId: "geometry",
    topicIds: ["projection"],
    difficulties: ["MEDIUM"],
    count: 1,
    patternIds: ["calculation"],
    questionTypes: ["NUMERIC"],
    hintsAllowed: false,
    feedbackMode: "end",
  });
  expect(saved.items).toHaveLength(1);
  expect(saved.items[0].question).toMatchObject({
    topicId: "projection",
    difficulty: "MEDIUM",
    type: "NUMERIC",
  });
  expect(saved.items[0].question.tags).toContain("calculation");
  await page.goto(`/practice/custom?edit=${saved.id}`);
  await expect(advanced).toHaveAttribute("aria-expanded", "true");
  await expect(
    builder.getByLabel("Количество заданий", { exact: true }),
  ).toHaveValue("1");
  await expect(builder.getByLabel("Средний", { exact: true })).toBeChecked();
  await expect(
    categories.getByRole("checkbox", { name: "Вычисления", exact: true }),
  ).toBeChecked();
  await expect(
    types.getByRole("checkbox", { name: "Вычисления", exact: true }),
  ).toBeChecked();
  await expect(
    builder.getByRole("radio", { name: "Отключены", exact: true }),
  ).toBeChecked();
  await expect(
    builder.getByRole("radio", { name: "В конце сессии", exact: true }),
  ).toBeChecked();
  const edited = await startAndRead(page, learnerId, () =>
    builder.getByRole("button", { name: "Начать выбранную практику" }).click(),
  );
  const editedConfig = edited.config as StoredPracticeConfig;
  for (const key of [
    "subjectId",
    "topicIds",
    "difficulties",
    "count",
    "patternIds",
    "questionTypes",
    "hintsAllowed",
    "feedbackMode",
  ] as const)
    expect(editedConfig[key]).toEqual(config[key]);
});

test("mobile keyboard selection, grouping, start duplicate protection and refresh remain usable", async ({
  page,
  learnerId,
  browserErrors,
}, testInfo) => {
  expect(browserErrors).toEqual([]);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/practice/custom");
  const builder = page.locator(".practice-builder");
  for (const subject of await db.subject.findMany({
    select: { title: true },
  })) {
    await expect(
      builder
        .locator(".practice-builder-topics")
        .getByRole("group", { name: subject.title, exact: true }),
    ).toBeVisible();
  }
  const subject = builder.getByRole("combobox");
  await subject.focus();
  await page.keyboard.press("g");
  await subject.selectOption("geometry");
  const search = builder.getByRole("searchbox", {
    name: "Найти тему",
    exact: true,
  });
  await search.focus();
  await page.keyboard.type("projection");
  await page.keyboard.press("Tab");
  const projection = await db.topic.findUniqueOrThrow({
    where: { id: "projection" },
    select: { title: true },
  });
  const topic = topicCheckbox(builder, projection.title);
  await topic.focus();
  await page.keyboard.press("Space");
  await expect(topic).toBeChecked();
  const advanced = builder.getByRole("button", {
    name: "Дополнительные настройки",
    exact: true,
  });
  await advanced.focus();
  await page.keyboard.press("Enter");
  await expect(advanced).toHaveAttribute("aria-expanded", "true");
  await page.setViewportSize({ width: 320, height: 740 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.evaluate(() => {
    if (document.activeElement instanceof HTMLElement)
      document.activeElement.blur();
    window.scrollTo({ top: 0, behavior: "instant" });
  });
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  // Chrome's full-page capture can repeat tiles at this narrow viewport;
  // capture actual visible controls and summary separately instead.
  await advanced.scrollIntoViewIfNeeded();
  await expect(advanced).toBeInViewport();
  await page.screenshot({
    path: testInfo.outputPath("final-mobile-expanded-320.png"),
    animations: "disabled",
  });
  const summary = builder.locator(".practice-builder-summary");
  await summary.scrollIntoViewIfNeeded();
  await expect(summary).toBeInViewport();
  await page.screenshot({
    path: testInfo.outputPath("final-mobile-summary-320.png"),
    animations: "disabled",
  });
  await advanced.focus();
  await page.keyboard.press("Enter");
  await expect(advanced).toHaveAttribute("aria-expanded", "false");
  let starts = 0;
  page.on("request", (request) => {
    if (
      new URL(request.url()).pathname === "/api/practice" &&
      request.method() === "POST" &&
      request.postDataJSON()?.action === "start"
    )
      starts++;
  });
  const start = builder.getByRole("button", {
    name: "Начать выбранную практику",
  });
  await start.focus();
  await expect(start).toBeFocused();
  const saved = await startAndRead(page, learnerId, () =>
    start.evaluate((button) => {
      (button as HTMLButtonElement).click();
      (button as HTMLButtonElement).click();
      (button as HTMLButtonElement).click();
    }),
  );
  expect(starts).toBe(1);
  expect((saved.config as StoredPracticeConfig).topicIds).toEqual([
    "projection",
  ]);
  expect(saved.items).toHaveLength(5);
  const question = await page.locator(".question-card > .prose").innerText();
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.locator(".question-card > .prose")).toHaveText(question);
  expect(await db.practiceSession.count({ where: { userId: learnerId } })).toBe(
    1,
  );
  const afterRefresh = await db.practiceItem.findMany({
    where: { sessionId: saved.id },
    orderBy: { position: "asc" },
    select: { id: true },
  });
  expect(afterRefresh.map((item) => item.id)).toEqual(
    saved.items.map((item) => item.id),
  );
});

test("unavailable selected category stays explicit and removable after changing topics", async ({
  page,
  learnerId,
  browserErrors,
}) => {
  expect(browserErrors).toEqual([]);
  const topics = await db.topic.findMany({
    where: { module: { subjectId: "programming" }, questions: { some: {} } },
    select: { id: true, title: true, questions: { select: { tags: true } } },
    orderBy: { id: "asc" },
  });
  const source = topics.find((topic) =>
    topic.questions.some((question) =>
      question.tags.includes("recursion-trace"),
    ),
  );
  const target = topics.find((topic) =>
    topic.questions.every(
      (question) => !question.tags.includes("recursion-trace"),
    ),
  );
  if (!source || !target)
    throw new Error(
      "Seed must contain programming topics with and without recursion tracing.",
    );
  await page.goto(`/practice/custom?topic=${source.id}`);
  const builder = page.locator(".practice-builder");
  await builder.getByLabel("Количество заданий", { exact: true }).fill("1");
  const advanced = builder.getByRole("button", {
    name: "Дополнительные настройки",
    exact: true,
  });
  await advanced.click();
  await builder
    .getByRole("checkbox", { name: "Трассировка рекурсии", exact: true })
    .check();
  await expect(
    builder.getByRole("button", { name: "Начать выбранную практику" }),
  ).toBeEnabled();
  await advanced.click();
  await builder
    .getByRole("searchbox", { name: "Найти тему", exact: true })
    .fill(target.title);
  await topicCheckbox(builder, target.title).check();
  await builder
    .getByRole("button", { name: `Убрать тему: ${source.title}`, exact: true })
    .click();
  const summary = builder.locator(".practice-builder-summary");
  await expect(summary).toContainText("Трассировка рекурсии");
  await expect(summary).toContainText(
    "Есть категории без заданий в выбранных темах",
  );
  await expect(builder.getByRole("status")).toContainText(
    "По выбранным условиям заданий пока нет",
  );
  await expect(
    builder.getByRole("button", { name: "Начать выбранную практику" }),
  ).toBeDisabled();
  await advanced.click();
  const remove = builder.getByRole("button", {
    name: "Убрать категорию: Трассировка рекурсии",
    exact: true,
  });
  await expect(remove).toBeVisible();
  await remove.click();
  await expect(summary).not.toContainText("Есть категории без заданий");
  await expect(summary).toContainText("Все категории");
  await expect(builder.getByRole("status")).toContainText("в сессию войдёт 1");
  const saved = await startAndRead(page, learnerId, () =>
    builder.getByRole("button", { name: "Начать выбранную практику" }).click(),
  );
  expect((saved.config as StoredPracticeConfig).topicIds).toEqual([target.id]);
  expect((saved.config as StoredPracticeConfig).patternIds).toEqual([]);
  expect(saved.items).toHaveLength(1);
  expect(saved.items[0].question.topicId).toBe(target.id);
});
