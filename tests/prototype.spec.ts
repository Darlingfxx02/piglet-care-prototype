import { test, expect } from "@playwright/test";
test("order selection, real messages, rating and persistence", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator(".support-button:visible").click();
  await page.getByRole("button", { name: "Дюрок, заказ №3206" }).click();
  await page.getByRole("button", { name: "Обсудить выбранный заказ" }).click();
  await expect(page.locator(".order-context")).toContainText("№3206");
  await page
    .getByRole("button", {
      name: "Да, мне нужно встретить машину.",
      exact: true,
    })
    .click();
  await expect(page.locator(".messages")).toContainText(
    "Доставка №3206: 2 октября",
  );
  await page
    .getByRole("textbox", { name: "Сообщение", exact: true })
    .fill("Спасибо");
  await page
    .getByRole("button", { name: "Отправить сообщение", exact: true })
    .click();
  await expect(page.locator(".messages")).toContainText("Рада помочь");
  await page.reload();
  await expect(page.locator(".messages")).toContainText("Доставка №3206");
  await page.getByRole("button", { name: "Завершить", exact: true }).click();
  await page.getByRole("button", { name: "Продолжить диалог" }).click();
  await page.getByRole("button", { name: "Завершить", exact: true }).click();
  await page.getByRole("button", { name: "Завершить и оценить" }).click();
  await expect(
    page.getByRole("button", { name: "Отправить оценку" }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Оценка 2 из 5" }).click();
  await page
    .getByRole("button", { name: "Вопрос не решён", exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "Комментарий к оценке" })
    .fill("Хочу точный час");
  await page.getByRole("button", { name: "Отправить оценку" }).click();
  await expect(
    page.getByRole("heading", { name: "Спасибо за оценку!" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Закрыть", exact: true }).click();
  await page.reload();
  await expect(page.locator(".closed-chat")).toContainText("2 из 5");
  await page.getByRole("button", { name: "Начать новый диалог" }).click();
  await expect(page.locator(".chat-orders")).toBeVisible();
});
test("search, no results and keyboard dialog dismissal", async ({ page }) => {
  await page.goto("/");
  await page
    .getByRole("textbox", { name: "Найти заказ", exact: true })
    .filter({ visible: true })
    .fill("404");
  await page
    .getByRole("textbox", { name: "Найти заказ", exact: true })
    .filter({ visible: true })
    .press("Enter");
  await expect(
    page.getByRole("heading", { name: "Заказ не найден" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Показать все заказы" }).click();
  await expect(page.locator(".panel-orders .order-card")).toHaveCount(4);
  await page.keyboard.press("Escape");
  await expect(page.locator("dialog")).toHaveCount(0);
});
for (const [width, height] of [
  [320, 740],
  [390, 844],
  [768, 1024],
  [1440, 900],
])
  test(`responsive assets and no horizontal overflow ${width}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height });
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);
    await expect(
      page.locator("h2").filter({ hasText: "Мой скот" }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    expect(
      await page
        .locator("img:visible")
        .evaluateAll((images) =>
          images.every(
            (i) =>
              (i as HTMLImageElement).complete &&
              (i as HTMLImageElement).naturalWidth > 0,
          ),
        ),
    ).toBe(true);
    await page.locator(".support-button:visible").click();
    await page
      .getByRole("button", { name: "Обсудить выбранный заказ" })
      .click();
    const input = await page.locator(".composer").boundingBox();
    expect(input!.y + input!.height).toBeLessThanOrEqual(height);
    await page.getByRole("button", { name: "Завершить", exact: true }).click();
    await page.getByRole("button", { name: "Завершить и оценить" }).click();
    await page.getByRole("button", { name: "Оценка 5 из 5" }).click();
    await page.getByRole("button", { name: "Пропустить", exact: true }).click();
    await expect(page.locator(".home-content")).toBeVisible();
    expect(errors).toEqual([]);
  });
