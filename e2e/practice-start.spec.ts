import { test as base, expect, type Page } from "@playwright/test";
import { loadEnvConfig } from "@next/env";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { db } from "../src/lib/db";

loadEnvConfig(process.cwd(), true, { info() {}, error() {} });

// Exercise practice with an isolated authenticated learner; no Telegram credentials
// or development-login endpoint are used by this suite.
const test = base.extend<{ learnerId: string }>({
  learnerId: async ({ context, baseURL }, runFixture) => {
    const user = await db.user.create({
      data: {
        telegramId: `test-practice-${randomUUID()}`,
        firstName: "Practice test",
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

for (const topic of ["binary","lines","lower-bound","malloc","functions"]) {
  test(`expanded topic ${topic} opens ten questions and survives refresh`,async ({page,learnerId})=>{
    await page.goto(`/practice?topic=${topic}#custom-practice`);
    const builder=page.locator(".practice-builder");
    await builder.getByLabel("Количество заданий",{exact:true}).fill("10");
    await expect(builder.getByRole("status")).toContainText("в сессию войдёт 10");
    const id=await expectSession(page,()=>builder.getByRole("button",{name:"Начать выбранную практику"}).click(),learnerId,"custom",topic);
    const saved=await db.practiceItem.findMany({where:{sessionId:id},orderBy:{position:"asc"}});
    expect(saved).toHaveLength(10);
    expect(new Set(saved.map(item=>item.questionId)).size).toBe(10);
    await page.reload({waitUntil:"domcontentloaded"});
    await expect(page.locator(".question-card > .prose")).toBeVisible();
    expect(await db.practiceSession.count({where:{userId:learnerId}})).toBe(1);
    expect((await db.practiceItem.findMany({where:{sessionId:id},orderBy:{position:"asc"}})).map(item=>item.id)).toEqual(saved.map(item=>item.id));
  });
}

test("select all filters support partial selection, keyboard clearing and saved configuration", async ({
  page,
  learnerId,
}) => {
  await page.goto("/practice/custom?subject=geometry");
  const builder = page.locator(".practice-builder");
  const topics = builder.locator(".practice-builder-topics input:enabled");
  const allTopics = builder.getByRole("checkbox", {
    name: "Выбрать все темы",
    exact: true,
  });
  await expect(allTopics).not.toBeChecked();
  await topics.first().check();
  await expect(allTopics).toBeChecked({ indeterminate: true });
  await allTopics.check();
  expect(await topics.count()).toBeGreaterThan(1);
  for (const topic of await topics.all()) await expect(topic).toBeChecked();
  await topics.last().uncheck();
  await expect(allTopics).toBeChecked({ indeterminate: true });
  await allTopics.focus();
  await page.keyboard.press("Space");
  await expect(allTopics).toBeChecked();
  await page.keyboard.press("Space");
  for (const topic of await topics.all()) await expect(topic).not.toBeChecked();
  await allTopics.check();

  const allLevels = builder.getByRole("checkbox", {
    name: "Выбрать все сложности",
    exact: true,
  });
  await allLevels.uncheck();
  await expect(
    builder.getByRole("button", { name: "Начать выбранную практику" }),
  ).toBeDisabled();
  await builder.getByLabel("Средний", { exact: true }).check();
  await expect(allLevels).toBeChecked({ indeterminate: true });
  await allLevels.check();

  await builder.getByRole("button", { name: "Дополнительные настройки", exact: true }).click();
  const allTypes = builder.getByRole("checkbox", {
    name: "Выбрать все типы заданий",
    exact: true,
  });
  await allTypes.uncheck();
  await expect(
    builder.getByRole("button", { name: "Начать выбранную практику" }),
  ).toBeDisabled();
  await allTypes.check();
  const allPatterns = builder.getByRole("checkbox", {
    name: "Выбрать все категории",
    exact: true,
  });
  await allPatterns.check();
  await allPatterns.uncheck();
  await allPatterns.check();

  const expectedTopics = await db.topic.findMany({
    where: { module: { subjectId: "geometry" }, questions: { some: {} } },
    select: { id: true },
  });
  const sessionId = await expectSession(
    page,
    () =>
      builder
        .getByRole("button", {
          name: "Начать выбранную практику",
        })
        .click(),
    learnerId,
    "custom",
  );
  const saved = await db.practiceSession.findUniqueOrThrow({
    where: { id: sessionId },
    include: {
      items: {
        include: {
          question: { include: { topic: { include: { module: true } } } },
        },
      },
    },
  });
  const config = saved.config as {
    topicIds: string[];
    difficulties: string[];
    questionTypes: string[];
    patternIds: string[];
  };
  expect(new Set(config.topicIds)).toEqual(
    new Set(expectedTopics.map((t) => t.id)),
  );
  expect(config.difficulties).toHaveLength(4);
  expect(config.patternIds.length).toBeGreaterThan(0);
  expect(saved.items).toHaveLength(5);
  for (const item of saved.items) {
    expect(config.topicIds).toContain(item.question.topicId);
    expect(config.questionTypes).toContain(item.question.type);
    expect(
      item.question.tags.some((tag) => config.patternIds.includes(tag)),
    ).toBe(true);
    expect(item.question.topic.module.subjectId).toBe("geometry");
  }
  await page.goto(`/practice/custom?edit=${sessionId}`);
  await expect(
    page.getByRole("checkbox", { name: "Выбрать все темы", exact: true }),
  ).toBeChecked();
  await builder.getByRole("combobox").selectOption("programming");
  await expect(allTopics).not.toBeChecked();
  await expect(allPatterns).not.toBeChecked();
});

async function expectSession(
  page: Page,
  click: () => Promise<unknown>,
  userId: string,
  mode: string,
  topicId?: string,
) {
  const responsePromise = page.waitForResponse(
    (r) =>
      new URL(r.url()).pathname === "/api/practice" &&
      r.request().method() === "POST",
  );
  await click();
  const response = await responsePromise;
  expect(response.status()).toBe(200);
  const { sessionId } = await response.json();
  await expect(page).toHaveURL(new RegExp(`/practice/${sessionId}$`));
  await expect(page.locator(".question-card > .prose")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Проверить ответ", exact: true }),
  ).toBeVisible();
  const saved = await db.practiceSession.findUniqueOrThrow({
    where: { id: sessionId },
    include: { items: { include: { question: true } } },
  });
  expect(saved.userId).toBe(userId);
  expect(saved.mode).toBe(mode);
  expect(saved.items.length).toBeGreaterThan(0);
  if (topicId)
    expect(saved.items.every((i) => i.question.topicId === topicId)).toBe(true);
  const question = await page.locator(".question-card > .prose").innerText();
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page).toHaveURL(new RegExp(`/practice/${sessionId}$`));
  await expect(page.locator(".question-card > .prose")).toHaveText(question);
  return sessionId as string;
}

test("Dashboard daily starts a usable session and resumes the same daily on another click", async ({
  page,
  learnerId,
}) => {
  await page.goto("/");
  const click = () =>
    page
      .locator(".daily-card")
      .getByRole("button", { name: "Начать практику" })
      .click();
  const first = await expectSession(page, click, learnerId, "daily");
  await page.goto("/");
  expect(await expectSession(page, click, learnerId, "daily")).toBe(first);
  expect(await db.practiceSession.count({ where: { userId: learnerId } })).toBe(
    1,
  );
});

test("topic practice rejects rapid duplicate clicks and the first question can be answered", async ({
  page,
  learnerId,
}) => {
  await page.goto("/topics/projection");
  let starts = 0;
  page.on("request", (request) => {
    if (
      new URL(request.url()).pathname === "/api/practice" &&
      request.postDataJSON()?.action === "start"
    )
      starts++;
  });
  await expectSession(
    page,
    () =>
      page
        .getByRole("button", { name: "Начать практику", exact: true })
        .evaluate((button) => {
          (button as HTMLButtonElement).click();
          (button as HTMLButtonElement).click();
          (button as HTMLButtonElement).click();
        }),
    learnerId,
    "topic",
    "projection",
  );
  expect(starts).toBe(1);
  expect(await db.practiceSession.count({ where: { userId: learnerId } })).toBe(
    1,
  );
  await page.getByLabel("Твой ответ", { exact: true }).fill("6");
  await page
    .getByRole("button", { name: "Проверить ответ", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Верно!");
  await expect(page.locator(".feedback .prose")).toBeVisible();
});

test("Practice quick start opens questions", async ({ page, learnerId }) => {
  await page.goto("/practice");
  await expectSession(
    page,
    () =>
      page
        .locator(".practice-mode")
        .filter({
          has: page.getByRole("heading", { name: "Быстрый старт" }),
        })
        .getByRole("button", { name: "Начать практику" })
        .click(),
    learnerId,
    "quick",
  );
});

test("university custom route filters task patterns, persists questions, and renders on mobile", async ({ page, learnerId }) => {
  await page.goto("/practice/custom?subject=programming");
  const builder = page.locator(".practice-builder");
  await builder.getByLabel("Арифметика указателей", {exact:false}).check();
  await builder.getByLabel("Рекурсия: база, возврат и статическое состояние", {exact:false}).check();
  await builder.getByLabel("Базовый",{exact:true}).uncheck();
  await builder.getByLabel("Средний",{exact:true}).uncheck();
  await builder.getByRole("button", { name: "Дополнительные настройки", exact: true }).click();
  const types=builder.getByRole("group",{name:"Типы заданий",exact:true});
  const checked=types.locator('input:not([aria-label])');
  for(const checkbox of await checked.all()) await checkbox.uncheck();
  await types.getByLabel("Вывод программы",{exact:true}).check();
  await builder.getByLabel("Трассировка памяти",{exact:true}).check();
  await builder.getByLabel("Количество заданий",{exact:true}).fill("2");
  await expect(builder.getByRole("status")).toContainText("в сессию войдёт 2");
  await page.screenshot({path:"test-results/university-builder.png",fullPage:true});
  await page.setViewportSize({width:390,height:844});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
  await page.screenshot({path:"test-results/university-builder-mobile.png",fullPage:true});
  const id=await expectSession(page,()=>builder.getByRole("button",{name:"Начать выбранную практику"}).click(),learnerId,"custom");
  const session=await db.practiceSession.findUniqueOrThrow({where:{id},include:{items:{include:{question:true}}}});
  expect(session.items).toHaveLength(2);
  expect(new Set(session.items.map((item)=>item.question.topicId)).size).toBe(2);
  expect(session.items.every((item)=>item.question.tags.includes("memory-tracing")&&item.question.type==="OUTPUT")).toBe(true);
  await page.getByLabel("Твой ответ",{exact:true}).fill("-999");
  await page.getByRole("button",{name:"Проверить ответ",exact:true}).click();
  await expect(page.locator(".feedback .prose")).toBeVisible();
  await page.screenshot({path:"test-results/university-question-mobile.png",fullPage:true});
});

test("university theory, formulas and code blocks render without math errors", async ({ page, learnerId }) => {
  expect(learnerId).toBeTruthy();
  for(const topic of ["complex-numbers","matrix-operations","normal-forms","aggregate-types","pointer-arithmetic"]){
    await page.goto(`/topics/${topic}`);
    await expect(page.locator(".lesson-content")).toBeVisible();
    await expect(page.locator(".katex-error")).toHaveCount(0);
    if(topic==="aggregate-types") await expect(page.locator("pre code").first()).toBeVisible();
    if(topic==="matrix-operations") await page.screenshot({path:"test-results/university-theory.png",fullPage:true});
  }
  await page.setViewportSize({width:390,height:844});
  await page.goto("/topics/pointer-arithmetic");
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
  await page.screenshot({path:"test-results/university-theory-mobile.png",fullPage:true});
});

test("custom builder filters difficulty and topics, starts a resumable session, and explains empty filters", async ({
  page,
  learnerId,
}) => {
  await page.goto("/practice");
  const builder = page.locator(".practice-builder");
  await builder.getByLabel("Предмет").selectOption("geometry");
  await builder.getByLabel("Проекция вектора").check();
  await builder.getByLabel("Базовый").uncheck();
  await builder.getByLabel("Средний").uncheck();
  await builder.getByLabel("Сложный").uncheck();
  const challengeCount = await db.question.count({where:{topicId:"projection",difficulty:"CHALLENGE"}});
  await expect(builder.getByRole("status")).toContainText(
    `Доступно только ${challengeCount} заданий`,
  );
  await builder.getByLabel("Вызов").uncheck();
  await expect(builder.getByRole("status")).toContainText("заданий пока нет");
  await expect(
    builder.getByRole("button", { name: "Начать выбранную практику" }),
  ).toBeDisabled();
  await builder.getByLabel("Сложный").check();
  const hardCount = await db.question.count({where:{topicId:"projection",difficulty:"HARD"}});
  await builder
    .getByRole("button", { name: `Использовать доступные (${hardCount})` })
    .click();
  const sessionId = await expectSession(
    page,
    () =>
      builder
        .getByRole("button", { name: "Начать выбранную практику" })
        .click(),
    learnerId,
    "custom",
    "projection",
  );
  const saved = await db.practiceSession.findUniqueOrThrow({
    where: { id: sessionId },
    include: { items: { include: { question: true } } },
  });
  expect(saved.items).toHaveLength(hardCount);
  expect(saved.items.every(item=>item.question.difficulty==="HARD")).toBe(true);
});

test("custom delayed feedback, mistake review and practice again preserve settings", async ({
  page,
  learnerId,
}) => {
  await page.goto("/practice?topic=projection#custom-practice");
  const builder = page.locator(".practice-builder");
  await expect(builder.getByRole("checkbox", { name: /^Проекция вектора/ })).toBeChecked();
  await builder.getByLabel("Базовый").uncheck();
  await builder.getByLabel("Средний").uncheck();
  await builder.getByLabel("Вызов").uncheck();
  await builder.getByLabel("Количество заданий", {exact:true}).fill("1");
  await builder.getByRole("button", { name: "Дополнительные настройки", exact: true }).click();
  await builder.getByRole("radio", { name: "Отключены" }).check();
  await builder.getByRole("radio", { name: "В конце сессии" }).check();
  const first = await expectSession(
    page,
    () =>
      builder
        .getByRole("button", { name: "Начать выбранную практику" })
        .click(),
    learnerId,
    "custom",
    "projection",
  );
  await expect(page.locator(".hint-card")).toHaveCount(0);
  await page.getByLabel("a·b", { exact: true }).fill("0");
  await page.getByLabel("b·b", { exact: true }).fill("0");
  await page.getByLabel("(a·b)/(b·b)", { exact: true }).fill("0");
  await page.getByRole("button", { name: "Проверить ответ" }).click();
  await expect(page.getByRole("status")).toContainText("Ответ принят");
  await expect(page.locator(".feedback.success")).toHaveCount(0);
  await page.getByRole("button", { name: "Завершить практику" }).click();
  await expect(
    page.getByRole("heading", { name: "Практика завершена" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Разбор ошибок" }),
  ).toBeVisible();
  await expect(page.getByText("Твой ответ:")).toBeVisible();
  await expect(page.getByText("Верный ответ:")).toBeVisible();
  await page.screenshot({
    path: "test-results/practice-summary.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: "test-results/practice-summary-mobile.png",
    fullPage: true,
  });
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(
    page.getByRole("heading", { name: "Практика завершена" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Практиковаться снова" }).click();
  await expect(page).not.toHaveURL(new RegExp(`/practice/${first}$`));
  await expect(page).toHaveURL(/\/practice\/[^/]+$/);
  await expect(page.locator(".question-card > .prose")).toBeVisible();
  await expect(page.locator(".hint-card")).toHaveCount(0);
});

test("Practice by topic navigates through the subject and starts only that topic", async ({
  page,
  learnerId,
}) => {
  await page.goto("/practice");
  await page
    .locator('a[href="/subjects/geometry"]')
    .filter({ hasText: "Выбрать отдельную тему" })
    .click();
  await page.locator('a[href="/topics/projection"]').click();
  await expect(page).toHaveURL(/\/topics\/projection$/);
  await expect(
    page.getByRole("heading", { name: "Проекция вектора", exact: true }),
  ).toBeVisible();
  await expectSession(
    page,
    () =>
      page
        .getByRole("button", { name: "Начать практику", exact: true })
        .click(),
    learnerId,
    "topic",
    "projection",
  );
});

test("weak-topic practice starts on the Practice page and Dashboard", async ({
  page,
  learnerId,
}) => {
  const question = await db.question.findFirstOrThrow({
    where: { topicId: "projection" },
  });
  await db.practiceSession.create({
    data: {
      userId: learnerId,
      mode: "topic",
      finishedAt: new Date(),
      items: {
        create: {
          questionId: question.id,
          position: 0,
          completedAt: new Date(),
          attempts: 3,
          correct: false,
        },
      },
    },
  });
  await page.goto("/practice");
  await expectSession(
    page,
    () =>
      page
        .locator(".practice-mode")
        .filter({
          has: page.getByRole("heading", { name: "Слабые темы" }),
        })
        .getByRole("button", { name: "Начать практику" })
        .click(),
    learnerId,
    "weak",
    "projection",
  );
  await page.goto("/");
  await expectSession(
    page,
    () => page.getByRole("button", { name: "Повторить темы" }).click(),
    learnerId,
    "weak",
    "projection",
  );
});

test("empty topics and empty weak recommendations explain why practice cannot start", async ({
  page,
  learnerId,
}) => {
  const template = await db.topic.findUniqueOrThrow({
    where: { id: "projection" },
  });
  const topic = await db.topic.create({
    data: {
      id: `test-empty-${randomUUID()}`,
      title: "Empty practice test",
      english: "Empty topic",
      moduleId: template.moduleId,
      order: 999,
      difficulty: "EASY",
      estimatedMinutes: 1,
      prerequisites: [],
      keywords: [],
      content: { sections: [], quizAnswer: "" },
    },
  });
  try {
    await page.goto(`/topics/${topic.id}`);
    await expect(page.getByRole("status")).toHaveText(
      "Для этой темы пока нет заданий для практики.",
    );
    await expect(
      page.getByRole("button", { name: "Начать практику", exact: true }),
    ).toHaveCount(0);
    const response = await page.request.post("/api/practice", {
      headers: { origin: "http://localhost:3000" },
      data: {
        action: "start",
        mode: "topic",
        topicId: topic.id,
        requestKey: randomUUID(),
      },
    });
    expect(response.status()).toBe(400);
    expect((await response.json()).error).toContain("нет заданий");
    await page.goto("/practice");
    const builder = page.locator(".practice-builder");
    const emptyChoice = builder.getByLabel("Empty practice test", { exact: false });
    await expect(emptyChoice).toBeDisabled();
    await builder
      .getByRole("checkbox", { name: "Выбрать все темы", exact: true })
      .check();
    await expect(emptyChoice).not.toBeChecked();
    const weak = page
      .locator(".practice-mode")
      .filter({ has: page.getByRole("heading", { name: "Слабые темы" }) });
    await expect(weak.getByRole("status")).toContainText("Пока нет слабых тем");
    await expect(weak.getByRole("button")).toHaveCount(0);
    expect(
      await db.practiceSession.count({ where: { userId: learnerId } }),
    ).toBe(0);
  } finally {
    await db.topic.delete({ where: { id: topic.id } });
  }
});

test("concurrent API deliveries use one session and cross-site requests remain forbidden", async ({
  page,
  learnerId,
}) => {
  const data = { action: "start", mode: "quick", requestKey: randomUUID() };
  const responses = await Promise.all(
    Array.from({ length: 3 }, () =>
      page.request.post("/api/practice", {
        headers: { origin: "http://localhost:3000" },
        data,
      }),
    ),
  );
  for (const response of responses) expect(response.status()).toBe(200);
  const ids = await Promise.all(
    responses.map(async (r) => (await r.json()).sessionId),
  );
  expect(new Set(ids).size).toBe(1);
  expect(await db.practiceSession.count({ where: { userId: learnerId } })).toBe(
    1,
  );
  const blocked = await page.request.post("/api/practice", {
    headers: { origin: "https://evil.example" },
    data,
  });
  expect(blocked.status()).toBe(403);
});

test("retry after a lost start response resumes the already-created session", async ({
  page,
  learnerId,
}) => {
  let first = true;
  type StartResult = { status: number; sessionId?: string; error?: string };
  let releaseFirstRequest!: (result: StartResult) => void;
  const firstRequestFinished = new Promise<StartResult>((resolve) => {
    releaseFirstRequest = resolve;
  });
  await page.route("**/api/practice", async (route) => {
    if (first && route.request().postDataJSON()?.action === "start") {
      first = false;
      const response = await route.fetch();
      const firstResult = {
        status: response.status(),
        ...(await response.json()),
      };
      await route.abort("failed");
      releaseFirstRequest(firstResult);
    } else await route.continue();
  });
  await page.goto("/topics/projection");
  const click = () =>
    page.getByRole("button", { name: "Начать практику", exact: true }).click();
  await click();
  await expect(page.getByRole("alert")).toBeVisible();
  const firstResult = await firstRequestFinished;
  expect(firstResult.status, firstResult.error).toBe(200);
  expect(firstResult.sessionId).toBeTruthy();
  await expect
    .poll(() => db.practiceSession.count({ where: { userId: learnerId } }))
    .toBe(1);
  await expectSession(page, click, learnerId, "topic", "projection");
  expect(await db.practiceSession.count({ where: { userId: learnerId } })).toBe(
    1,
  );
});

test("expired authentication takes the learner to login instead of leaving a stuck button", async ({
  page,
  context,
  learnerId,
}) => {
  await page.goto("/topics/projection");
  await context.clearCookies();
  await page
    .getByRole("button", { name: "Начать практику", exact: true })
    .click();
  await expect(page).toHaveURL(/\/login$/);
  expect(await db.practiceSession.count({ where: { userId: learnerId } })).toBe(
    0,
  );
});
