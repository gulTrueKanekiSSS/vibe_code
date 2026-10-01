import { test as base, expect } from "@playwright/test";
import { loadEnvConfig } from "@next/env";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { db } from "../src/lib/db";

loadEnvConfig(process.cwd(), true, { info() {}, error() {} });
const test = base.extend<{ learnerId: string }>({
  learnerId: async ({ context, baseURL }, runFixture) => {
    const user = await db.user.create({
      data: {
        telegramId: `test-learning-${randomUUID()}`,
        firstName: "Learner",
        username: "local_student",
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
test.afterAll(async () => db.$disconnect());

test("learner flow, server feedback, privacy, dark mode and responsive layouts", async ({
  page,
  learnerId,
}) => {
  expect(learnerId).toBeTruthy();
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Привет/ })).toBeVisible();
  await page.screenshot({
    path: "test-results/dashboard-desktop.png",
    fullPage: true,
    caret: "initial",
  });
  await page.goto("/subjects");
  await expect(
    page.getByRole("heading", { name: "Мои предметы" }),
  ).toBeVisible();
  await page.goto("/subjects/geometry");
  await expect(
    page.getByRole("heading", { name: "Векторы", exact: true }),
  ).toBeVisible();
  await page.goto("/topics/projection");
  await expect(page.locator(".katex").first()).toBeVisible();
  await page.goto("/topics/pointers");
  await expect(
    page.locator(".prose pre code.language-c span[class^='hljs-']").first(),
  ).toBeVisible();
  await page.goto("/topics/projection");
  await expect(
    page.getByRole("button", { name: "Спросить AI" }),
  ).toBeDisabled();
  const read = page.getByRole("button", { name: "Отметить как прочитанное" });
  if (await read.count()) await read.click();
  await page
    .getByRole("button", { name: "Начать практику", exact: true })
    .click();
  await expect(page).toHaveURL(/practice\//);
  const id = page.url().split("/").pop()!;
  await page.getByRole("button", { name: /Маленькая подсказка/ }).click();
  await expect(
    page.getByRole("button", { name: /Показать формулу/ }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("button", { name: /Показать формулу/ }),
  ).toBeVisible();
  await page.getByLabel("Твой ответ", { exact: true }).fill("6");
  await page.getByRole("button", { name: "Проверить ответ" }).click();
  await expect(page.getByRole("status")).toContainText("Верно!");
  await page.getByRole("button", { name: "Следующее задание" }).click();
  await page
    .getByRole("radio", { name: /Вектор, параллельный направлению проекции/ })
    .check();
  await page.getByRole("button", { name: "Проверить ответ" }).click();
  await expect(page.getByRole("status")).toContainText("Верно!");
  await page.getByRole("button", { name: "Следующее задание" }).click();
  await page.getByLabel("a·b", { exact: true }).fill("6");
  await page.getByLabel("b·b", { exact: true }).fill("2");
  await page.getByLabel("(a·b)/(b·b)", { exact: true }).fill("3");
  await page.getByRole("button", { name: "Проверить ответ" }).click();
  await page.getByRole("button", { name: "Следующее задание" }).click();
  await page.getByLabel("Твой ответ", { exact: true }).fill("2");
  await page.getByRole("button", { name: "Проверить ответ" }).click();
  await page.getByRole("button", { name: "Завершить практику" }).click();
  await expect(
    page.getByRole("heading", { name: "Практика завершена" }),
  ).toBeVisible();
  await page.goto(`/practice/${id}`);
  await expect(
    page.getByRole("heading", { name: "Практика завершена" }),
  ).toBeVisible();
  await page.goto("/progress");
  await expect(
    page.getByRole("heading", { name: "Мой прогресс", exact: true }),
  ).toBeVisible();
  await page.goto("/profile");
  await page
    .getByRole("switch", { name: /Показывать Telegram username/ })
    .uncheck();
  await page.getByRole("button", { name: "Сохранить настройки" }).click();
  await expect(page.getByRole("status")).toHaveText("Настройки сохранены.");
  await page.reload();
  await expect(
    page.getByRole("switch", { name: /Показывать Telegram username/ }),
  ).not.toBeChecked();
  await page.goto("/leaderboard");
  await expect(page.getByText("@local_student")).toHaveCount(0);
  await page.goto("/formulas?q=projection");
  await expect(
    page.getByRole("heading", { name: "Проекция вектора", exact: true }),
  ).toBeVisible();
  await page.goto("/search?q=указатель");
  await expect(page.getByText("Указатели", { exact: true })).toBeVisible();
  await page.goto("/");
  await page.getByRole("button", { name: "Переключить тему" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.getByRole("heading", { name: /Привет/ })).toBeVisible();
  await page.screenshot({
    path: "test-results/dashboard-dark.png",
    fullPage: true,
    caret: "initial",
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: "test-results/dashboard-mobile.png",
    fullPage: true,
    caret: "initial",
  });
  for (const url of [
    "/topics/supremum",
    "/topics/pointers",
    "/formulas",
    "/practice",
    "/leaderboard",
    "/profile",
  ]) {
    await page.goto(url);
    await expect(page.locator("main h1").first()).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `test-results/mobile-${url.split("/").pop()}.png`,
      fullPage: true,
      caret: "initial",
    });
  }
  await page.goto("/topics/projection");
  await expect(
    page.getByRole("heading", { name: "Проекция вектора", exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: "test-results/topic-mobile.png",
    fullPage: true,
    caret: "initial",
  });
  await page.getByRole("button", { name: "Открыть меню" }).click();
  await expect(
    page.getByRole("navigation", { name: "Главная навигация" }),
  ).toBeVisible();
});
test("unauthenticated writes and cross-origin writes are rejected", async ({
  request,
}) => {
  const unauthorized = await request.post("/api/practice", {
    headers: { origin: "http://localhost:3000" },
    data: { action: "start", mode: "quick" },
  });
  expect(unauthorized.status()).toBe(401);
  const csrf = await request.post("/api/profile", {
    headers: { origin: "https://evil.example" },
    data: { showUsername: true, showPhoto: true, leaderboard: true },
  });
  expect(csrf.status()).toBe(403);
});
