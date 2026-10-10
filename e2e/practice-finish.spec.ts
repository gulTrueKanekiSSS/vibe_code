import { test as base, expect } from "@playwright/test";
import { loadEnvConfig } from "@next/env";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { db } from "../src/lib/db";

loadEnvConfig(process.cwd(), true, { info() {}, error() {} });

// Isolated accounts and actual local routes; no dev-login or live AI calls.
const test = base.extend<{ learnerId: string }>({
  learnerId: async ({ context, baseURL }, runFixture) => {
    const user = await db.user.create({
      data: {
        telegramId: `test-finish-e2e-${randomUUID()}`,
        firstName: "Finish E2E",
        settings: { create: {} },
      },
    });
    try {
      const token = randomBytes(32).toString("hex");
      await db.authSession.create({
        data: {
          userId: user.id,
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
      await runFixture(user.id);
    } finally {
      await db.user.delete({ where: { id: user.id } });
    }
  },
});
test.use({ trace: "off" });
test.afterAll(async () => db.$disconnect());

async function fixtureSession(
  userId: string,
  mode = "topic",
  createdAt = new Date(),
) {
  const questions = await db.question.findMany({
    where: { topicId: "binary" },
    take: 2,
    orderBy: { id: "asc" },
  });
  expect(questions).toHaveLength(2);
  return db.practiceSession.create({
    data: {
      userId,
      mode,
      createdAt,
      items: {
        create: questions.map((question, position) => ({
          questionId: question.id,
          position,
        })),
      },
    },
    include: { items: { orderBy: { position: "asc" } } },
  });
}

test("old protected session is discoverable and Tutor links to the same resumable session", async ({
  page,
  learnerId,
}) => {
  const old = await fixtureSession(
    learnerId,
    "exam",
    new Date("2026-01-01T12:00:00Z"),
  );
  for (let i = 0; i < 11; i++) await fixtureSession(learnerId);
  await page.goto("/practice");
  const list = page.locator("#unfinished-sessions");
  await expect(
    list.getByRole("heading", { name: "Незавершённые сессии (12)" }),
  ).toBeVisible();
  await expect(list.locator("article")).toHaveCount(10);
  await expect(list.locator(`a[href="/practice/${old.id}"]`)).toHaveCount(0);
  await list.getByRole("button", { name: "Показать ещё (2)" }).click();
  await expect(list.locator("article")).toHaveCount(12);
  const card = list
    .locator("article")
    .filter({ has: page.locator(`a[href="/practice/${old.id}"]`) });
  await expect(card).toContainText("Блокирует AI Tutor");
  await expect(card).toContainText("Выполнено 0 из 2");
  await card.getByRole("link", { name: "Продолжить", exact: true }).click();
  await expect(page).toHaveURL(`/practice/${old.id}`);
  const prompt = await page.locator(".question-card > .prose").innerText();
  await page.reload();
  await expect(page.locator(".question-card > .prose")).toHaveText(prompt);
  expect(await db.practiceSession.count({ where: { userId: learnerId } })).toBe(
    12,
  );
  await page.goto("/topics/binary");
  await page
    .getByRole("button", { name: "Спросить AI Tutor", exact: true })
    .click();
  const tutor = page.getByRole("dialog", { name: "AI Tutor" });
  await expect(
    tutor.getByRole("link", { name: "Продолжить сессию" }),
  ).toHaveAttribute("href", `/practice/${old.id}`);
  await expect(
    tutor.getByRole("link", { name: "Управлять незавершёнными сессиями" }),
  ).toHaveAttribute("href", "/practice#unfinished-sessions");
  await tutor
    .getByRole("link", { name: "Управлять незавершёнными сессиями" })
    .click();
  await expect(page).toHaveURL("/practice#unfinished-sessions");
  await expect(page.locator("#unfinished-sessions")).toBeVisible();
});

test("finish cancellation, duplicate clicks and durable close preserve skipped items and unblock Tutor", async ({
  page,
  learnerId,
  baseURL,
}) => {
  const session = await fixtureSession(learnerId, "exam");
  await page.goto(`/practice/${session.id}`);
  await page.getByRole("button", { name: "Завершить досрочно" }).click();
  const confirmation = page.getByRole("group", {
    name: "Подтверждение завершения",
  });
  await expect(confirmation).toContainText("Продолжить её уже не получится");
  await confirmation.getByRole("button", { name: "Отмена" }).click();
  expect(
    (await db.practiceSession.findUniqueOrThrow({ where: { id: session.id } }))
      .finishedAt,
  ).toBeNull();
  await expect(page.locator(".question-card > .prose")).toBeVisible();
  let finishCalls = 0;
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/api/practice", async (route) => {
    if (route.request().postDataJSON().action !== "finish")
      return route.continue();
    finishCalls++;
    const response = await route.fetch();
    await gate;
    await route.fulfill({ response });
  });
  await page.getByRole("button", { name: "Завершить досрочно" }).click();
  await confirmation
    .getByRole("button", { name: "Да, завершить" })
    .evaluate((button) => {
      (button as HTMLButtonElement).click();
      (button as HTMLButtonElement).click();
    });
  await expect(
    confirmation.getByRole("button", { name: "Завершаем…" }),
  ).toBeDisabled();
  await expect.poll(() => finishCalls).toBe(1);
  release();
  await expect(
    page.getByRole("heading", { name: "Сессия завершена досрочно" }),
  ).toBeVisible();
  expect(finishCalls).toBe(1);
  await page.reload();
  await expect(
    page.getByText("Не завершено: 2.", { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByText("Нет ответов для разбора.", { exact: true }),
  ).toBeVisible();
  await expect(page.locator(".mistake-item")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Проверить ответ", exact: true }),
  ).toHaveCount(0);
  const saved = await db.practiceSession.findUniqueOrThrow({
    where: { id: session.id },
    include: { items: true },
  });
  expect(saved.finishedAt).not.toBeNull();
  expect(
    saved.items.every(
      (item) =>
        item.completedAt === null && item.attempts === 0 && item.xp === 0,
    ),
  ).toBe(true);
  await page.unroute("**/api/practice");
  const answer = await page.request.post("/api/practice", {
    headers: { Origin: baseURL! },
    data: {
      action: "answer",
      itemId: session.items[0].id,
      submissionKey: randomUUID(),
      answer: "1",
    },
  });
  expect(answer.status()).toBe(400);
  expect((await answer.json()).error).toContain("Сессия уже завершена");
  const snapshot = await (
    await page.request.get("/api/tutor?topicId=binary")
  ).json();
  expect(snapshot.blockingSession).toBeUndefined();
  expect(snapshot.unavailableReason ?? "").not.toContain("пока не завершена");
  if (!(
    process.env.OPENAI_API_KEY &&
    process.env.TUTOR_MODEL &&
    process.env.TUTOR_EMBEDDING_MODEL
  )) {
    expect(snapshot.available).toBe(false);
    expect(snapshot.unavailableReason).toMatch(/настро|подключ/i);
  }
});

test("finish controls fit mobile and work with keyboard from the session list", async ({
  page,
  learnerId,
}) => {
  const session = await fixtureSession(learnerId);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/practice");
  const list = page.locator("#unfinished-sessions");
  const finish = list.getByRole("button", { name: "Завершить досрочно" });
  await finish.focus();
  await page.keyboard.press("Enter");
  const confirmation = list.getByRole("group", {
    name: "Подтверждение завершения",
  });
  await expect(confirmation).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  const cancel = confirmation.getByRole("button", { name: "Отмена" });
  await expect(cancel).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(finish).toBeVisible();
  await expect(finish).toBeFocused();
  await page.keyboard.press("Enter");
  await confirmation.getByRole("button", { name: "Да, завершить" }).focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(`/practice/${session.id}`);
  await expect(
    page.getByRole("heading", { name: "Сессия завершена досрочно" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});

test("lost finish response offers retry without changing the persisted close", async ({
  page,
  learnerId,
}) => {
  const session = await fixtureSession(learnerId);
  let deliveries = 0;
  await page.route("**/api/practice", async (route) => {
    if (route.request().postDataJSON().action !== "finish")
      return route.continue();
    deliveries++;
    const response = await route.fetch();
    if (deliveries === 1) return route.abort("failed");
    await route.fulfill({ response });
  });
  await page.goto(`/practice/${session.id}`);
  await page.getByRole("button", { name: "Завершить досрочно" }).click();
  const confirm = page.getByRole("button", { name: "Да, завершить" });
  await confirm.click();
  await expect(page.getByRole("alert")).toBeVisible();
  await expect(confirm).toBeEnabled();
  const closed = await db.practiceSession.findUniqueOrThrow({
    where: { id: session.id },
  });
  expect(closed.finishedAt).not.toBeNull();
  await confirm.click();
  await expect(
    page.getByRole("heading", { name: "Сессия завершена досрочно" }),
  ).toBeVisible();
  expect(deliveries).toBe(2);
  expect(
    (await db.practiceSession.findUniqueOrThrow({ where: { id: session.id } }))
      .finishedAt,
  ).toEqual(closed.finishedAt);
});

test("real finish endpoint rejects anonymous, cross-origin, foreign ownership and malformed bodies", async ({
  page,
  request,
  learnerId,
  baseURL,
}) => {
  const session = await fixtureSession(learnerId);
  const data = { action: "finish", sessionId: session.id };
  expect(
    (
      await request.post("/api/practice", {
        headers: { Origin: baseURL! },
        data,
      })
    ).status(),
  ).toBe(401);
  expect(
    (
      await page.request.post("/api/practice", {
        headers: { Origin: "https://foreign.example" },
        data,
      })
    ).status(),
  ).toBe(403);
  const other = await db.user.create({
    data: {
      telegramId: `test-foreign-finish-${randomUUID()}`,
      firstName: "Other finish",
    },
  });
  try {
    const foreign = await fixtureSession(other.id);
    expect(
      (
        await page.request.post("/api/practice", {
          headers: { Origin: baseURL! },
          data: { ...data, sessionId: foreign.id },
        })
      ).status(),
    ).toBe(400);
    expect(
      (
        await db.practiceSession.findUniqueOrThrow({
          where: { id: foreign.id },
        })
      ).finishedAt,
    ).toBeNull();
  } finally {
    await db.user.delete({ where: { id: other.id } });
  }
  for (const invalid of [
    { ...data, extra: true },
    { ...data, sessionId: "" },
    { ...data, sessionId: "../invalid" },
  ]) {
    expect(
      (
        await page.request.post("/api/practice", {
          headers: { Origin: baseURL! },
          data: invalid,
        })
      ).status(),
    ).toBe(400);
  }
  expect(
    (await db.practiceSession.findUniqueOrThrow({ where: { id: session.id } }))
      .finishedAt,
  ).toBeNull();
});

test("partial early-finish summary assesses completed questions only", async ({
  page,
  learnerId,
  baseURL,
}) => {
  const session = await fixtureSession(learnerId);
  const first = session.items[0];
  const question = await db.question.findUniqueOrThrow({
    where: { id: first.questionId },
    select: { answer: true },
  });
  const response = await page.request.post("/api/practice", {
    headers: { Origin: baseURL! },
    data: {
      action: "answer",
      itemId: first.id,
      submissionKey: randomUUID(),
      answer: question.answer,
    },
  });
  expect(response.status()).toBe(200);
  await page.goto(`/practice/${session.id}`);
  await page.getByRole("button", { name: "Завершить досрочно" }).click();
  await page.getByRole("button", { name: "Да, завершить" }).click();
  await expect(
    page.getByRole("heading", { name: "Сессия завершена досрочно" }),
  ).toBeVisible();
  await expect(
    page.getByText("Решено верно 1 из 1 завершённых заданий."),
  ).toBeVisible();
  await expect(
    page.getByText("Не завершено: 1.", { exact: false }),
  ).toBeVisible();
  await expect(page.locator(".mistake-item")).toHaveCount(0);
  const skipped = await db.practiceItem.findUniqueOrThrow({
    where: { id: session.items[1].id },
  });
  expect(skipped.completedAt).toBeNull();
  expect(skipped.attempts).toBe(0);
});
