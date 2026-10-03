import { test as base, expect } from "@playwright/test";
import { loadEnvConfig } from "@next/env";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { db } from "../src/lib/db";
import { automaticTopicIds } from "../src/lib/curriculum";

loadEnvConfig(process.cwd(), true, { info() {}, error() {} });
const test = base.extend<{ learnerId: string }>({
  learnerId: async ({ context, baseURL }, runFixture) => {
    const user = await db.user.create({
      data: {
        telegramId: `test-builder-${randomUUID()}`,
        firstName: "Builder test",
        settings: { create: {} },
      },
    });
    try {
      const token = randomBytes(32).toString("hex");
      await db.authSession.create({
        data: {
          tokenHash: createHash("sha256").update(token).digest("hex"),
          userId: user.id,
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
      await runFixture(user.id);
    } finally {
      await db.user.delete({ where: { id: user.id } });
    }
  },
});
test.use({ trace: "off" });
test.afterAll(async () => db.$disconnect());

test("search and select-all stay inside the active module; tags and clear stay consistent", async ({
  page,
  learnerId,
}) => {
  expect(learnerId).toBeTruthy();
  await page.goto("/practice/custom?subject=geometry");
  await expect(
    page.getByRole("heading", { name: "Собрать практику", level: 1 }),
  ).toBeVisible();
  const builder = page.locator(".practice-builder");
  const all = builder.getByRole("checkbox", {
    name: "Выбрать все темы",
    exact: true,
  });
  const list = builder.locator(".practice-builder-topics");
  const tags = builder.locator(".builder-tags button");
  await expect(
    builder.getByRole("group", { name: "Сложность", exact: true }),
  ).not.toBeVisible();
  await builder.getByRole("searchbox").fill("Проекция вектора");
  await expect(list.getByRole("checkbox")).toHaveCount(1);
  await all.check();
  await expect(tags).toHaveCount(1);
  await builder.getByRole("searchbox").fill("");
  await expect(all).toBeChecked({ indeterminate: true });
  await all.focus();
  await page.keyboard.press("Space");
  const firstModuleCount = await list.locator("input:checked").count();
  expect(firstModuleCount).toBeGreaterThan(1);
  await expect(tags).toHaveCount(firstModuleCount);
  await builder
    .getByRole("navigation", { name: "Разделы тем" })
    .getByRole("button", { name: /Матрицы и пространство/ })
    .click();
  await expect(all).not.toBeChecked();
  await builder.getByRole("searchbox").fill("нет такой темы 987654");
  await expect(all).toBeDisabled();
  await expect(
    builder.getByText("Темы не найдены.", { exact: false }),
  ).toBeVisible();
  await expect(tags).toHaveCount(firstModuleCount);
  await builder.getByRole("searchbox").fill("");
  await list.locator("input:enabled").first().check();
  await expect(tags).toHaveCount(firstModuleCount + 1);
  await builder
    .getByRole("button", { name: "Убрать тему: Проекция вектора", exact: true })
    .click();
  await expect(tags).toHaveCount(firstModuleCount);
  await builder
    .getByRole("button", { name: "Очистить все", exact: true })
    .click();
  await expect(tags).toHaveCount(0);
  await expect(builder.locator(".builder-summary")).toContainText(
    "Все темы предмета:",
  );
});

test("presets, goals and keyboard count update actual settings without overwriting later edits", async ({
  page,
  learnerId,
}) => {
  expect(learnerId).toBeTruthy();
  await page.goto("/practice/custom?subject=geometry");
  const builder = page.locator(".practice-builder");
  const slider = builder.getByRole("slider", { name: "Количество заданий" });
  await builder
    .getByRole("button", { name: "К экзамену", exact: true })
    .click();
  await expect(slider).toHaveValue("15");
  await builder.locator("summary").click();
  await expect(
    builder.getByLabel("Базовый", { exact: true }),
  ).not.toBeChecked();
  await expect(builder.getByLabel("Сложный", { exact: true })).toBeChecked();
  await expect(builder.getByLabel("Вызов", { exact: true })).toBeChecked();
  await expect(
    builder.getByRole("radio", { name: "Отключены", exact: true }),
  ).toBeChecked();
  await expect(
    builder.getByRole("radio", { name: "В конце сессии", exact: true }),
  ).toBeChecked();
  await slider.focus();
  await page.keyboard.press("Home");
  await page.keyboard.press("ArrowRight");
  await expect(slider).toHaveValue("2");
  await builder.getByLabel("Средний", { exact: true }).check();
  await builder.getByRole("searchbox").fill("вектор");
  await expect(slider).toHaveValue("2");
  await expect(builder.locator(".builder-summary")).toContainText(
    "Свои настройки",
  );
  await builder
    .getByRole("combobox", { name: /^Цель практики/ })
    .selectOption("reinforce");
  await expect(slider).toHaveValue("2");
  await expect(
    builder.getByRole("radio", { name: "Разрешены", exact: true }),
  ).toBeChecked();
  await expect(
    builder.getByRole("radio", { name: "После каждого ответа", exact: true }),
  ).toBeChecked();
  await builder
    .getByRole("combobox", { name: /^Цель практики/ })
    .selectOption("seminar");
  await expect(slider).toHaveValue("10");
  await expect(builder.getByLabel("Вызов", { exact: true })).not.toBeChecked();
  await expect(builder.getByLabel("Средний", { exact: true })).toBeChecked();
});

test("subject changes remove incompatible topics and categories and retain compatible settings", async ({
  page,
  learnerId,
}) => {
  expect(learnerId).toBeTruthy();
  await page.goto(
    "/practice/custom?subject=programming&topic=pointer-arithmetic",
  );
  const builder = page.locator(".practice-builder");
  await builder.locator("summary").click();
  await builder.getByLabel("Трассировка памяти", { exact: true }).check();
  await builder.getByLabel("Базовый", { exact: true }).uncheck();
  await builder.getByRole("radio", { name: "Отключены", exact: true }).check();
  await builder
    .getByRole("combobox", { name: /^Предмет/ })
    .selectOption("geometry");
  await expect(builder.locator(".builder-tags button")).toHaveCount(0);
  await expect(
    builder.getByLabel("Трассировка памяти", { exact: true }),
  ).toHaveCount(0);
  await expect(
    builder.getByLabel("Базовый", { exact: true }),
  ).not.toBeChecked();
  await expect(
    builder.getByRole("radio", { name: "Отключены", exact: true }),
  ).toBeChecked();
  await expect(builder.getByLabel("Вычисления", { exact: true })).toBeChecked();
  await expect(
    builder.getByLabel("Вывод программы", { exact: false }),
  ).toBeDisabled();
  await expect(
    builder.getByLabel("Вывод программы", { exact: false }),
  ).not.toBeChecked();
});

test("automatic topics replace manual selection, honor filters and persist through saved-config reload", async ({
  page,
  learnerId,
}) => {
  await page.goto("/practice/custom?subject=geometry&topic=projection");
  const builder = page.locator(".practice-builder");
  await builder.getByRole("button", { name: "Разминка", exact: true }).click();
  await builder
    .getByRole("button", { name: "Автоподбор тем", exact: true })
    .click();
  const tags = builder.locator(".builder-tags button");
  const originalTags = await tags.allTextContents();
  expect(originalTags.length).toBeGreaterThan(0);
  await builder
    .getByRole("button", { name: "Автоподбор тем", exact: true })
    .click();
  expect(await tags.allTextContents()).toEqual(originalTags);
  const responsePromise = page.waitForResponse(
    (r) =>
      new URL(r.url()).pathname === "/api/practice" &&
      r.request().method() === "POST",
  );
  await builder
    .getByRole("button", { name: "Начать практику", exact: true })
    .click();
  const response = await responsePromise;
  expect(response.status()).toBe(200);
  const { sessionId } = await response.json();
  await expect(page).toHaveURL(new RegExp(`/practice/${sessionId}$`));
  const session = await db.practiceSession.findUniqueOrThrow({
    where: { id: sessionId },
    include: { items: { include: { question: true } } },
  });
  expect(session.userId).toBe(learnerId);
  const config = session.config as {
    topicIds: string[];
    difficulties: string[];
    count: number;
  };
  expect(config.difficulties).toEqual(["EASY"]);
  expect(config.count).toBe(5);
  expect(config.topicIds.length).toBe(originalTags.length);
  expect(config.topicIds.every((id) => automaticTopicIds.includes(id))).toBe(
    true,
  );
  expect(session.items).toHaveLength(5);
  expect(
    session.items.every(
      (item) =>
        item.question.difficulty === "EASY" &&
        config.topicIds.includes(item.question.topicId),
    ),
  ).toBe(true);
  const question = await page.locator(".question-card > .prose").innerText();
  await page.reload();
  await expect(page.locator(".question-card > .prose")).toHaveText(question);
  await page.goto(`/practice/custom?edit=${sessionId}`);
  expect(await tags.allTextContents()).toEqual(originalTags);
  await expect(builder.getByRole("slider")).toHaveValue("5");
  await page.reload();
  expect(await tags.allTextContents()).toEqual(originalTags);
  await builder.locator("summary").click();
  await expect(builder.getByLabel("Базовый", { exact: true })).toBeChecked();
  await expect(
    builder.getByLabel("Средний", { exact: true }),
  ).not.toBeChecked();
});

test("busy builder rejects duplicate starts and retries a lost response with the same session", async ({
  page,
  learnerId,
}) => {
  let attempts = 0;
  let release!: () => void;
  const hold = new Promise<void>((resolve) => {
    release = resolve;
  });
  let createdSessionId: string | undefined;
  await page.route("**/api/practice", async (route) => {
    if (route.request().postDataJSON()?.action !== "start")
      return route.continue();
    attempts++;
    if (attempts === 1) {
      const response = await route.fetch();
      expect(response.status()).toBe(200);
      createdSessionId = (await response.json()).sessionId;
      await hold;
      await route.abort("failed");
    } else await route.continue();
  });
  await page.goto("/practice/custom?subject=geometry");
  const builder = page.locator(".practice-builder");
  await builder
    .getByRole("button", { name: "Начать практику", exact: true })
    .evaluate((button) => {
      (button as HTMLButtonElement).click();
      (button as HTMLButtonElement).click();
      (button as HTMLButtonElement).click();
    });
  await expect(
    builder.getByRole("button", { name: "Создаём сессию…", exact: true }),
  ).toBeDisabled();
  await expect(builder.getByRole("slider")).toBeDisabled();
  await expect(
    builder.getByRole("combobox", { name: /^Предмет/ }),
  ).toBeDisabled();
  await expect.poll(() => createdSessionId).toBeTruthy();
  expect(attempts).toBe(1);
  release();
  await expect(builder.getByRole("alert")).toBeVisible();
  await builder
    .getByRole("button", { name: "Начать практику", exact: true })
    .click();
  await expect(page).toHaveURL(new RegExp(`/practice/${createdSessionId}$`));
  expect(attempts).toBe(2);
  expect(await db.practiceSession.count({ where: { userId: learnerId } })).toBe(
    1,
  );
});
