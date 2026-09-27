import { test, expect, type Page, type Locator } from "@playwright/test";
import { shots } from "../src/case/tour";
test.use({ viewport: { width: 1440, height: 900 } });
async function phoneClick(page: Page, locator: Locator) {
  const rect = await locator.evaluate((el) =>
    el.getBoundingClientRect().toJSON(),
  );
  const frame = await page.locator("iframe").boundingBox();
  const scale = frame!.width / 430;
  await page.mouse.click(
    frame!.x + (rect.x + rect.width / 2) * scale,
    frame!.y + (rect.y + rect.height / 2) * scale,
  );
}
test("tour runs real actions through every scene and preserves state on takeover", async ({
  page,
}) => {
  test.setTimeout(180000);
  await page.goto("/case.html");
  await page.getByRole("button", { name: /Смотреть тур/ }).click();
  const documentIdentity = await page
    .frameLocator("iframe")
    .locator("body")
    .evaluate(() => performance.timeOrigin);
  for (let i = 0; i < shots.length; i++) {
    const shot = shots[i];
    await expect(page.locator(".tour-notes h1")).toHaveText(shot.title);
    await expect(page.locator(".phone")).not.toHaveClass(/preparing/, {
      timeout: 15000,
    });
    if (i === 0) {
      await expect(page.locator(".focus-ring")).toHaveCount(0);
      expect(
        await page
          .locator(".phone")
          .evaluate((el) => getComputedStyle(el).transform),
      ).toBe("matrix(1, 0, 0, 1, 0, 0)");
      await page.getByRole("button", { name: "Пауза", exact: true }).click();
      const progress = await page
        .locator(".tour-progress span")
        .getAttribute("style");
      await page.waitForTimeout(400);
      expect(
        await page.locator(".tour-progress span").getAttribute("style"),
      ).toBe(progress);
      await page
        .getByRole("button", { name: "Продолжить", exact: true })
        .click();
    } else if (shot.action) {
      await expect(page.locator(".tour-pointer")).toHaveCount(1);
      await expect(page.locator(".tour-pointer")).toHaveCount(0, {
        timeout: 12000,
      });
    }
    await expect(page.locator('[role="alert"]')).toHaveCount(0);
    const target = shot.after ?? shot.before;
    let result = page.frameLocator("iframe").locator(target.selector);
    if (target.text) result = result.filter({ hasText: target.text });
    await expect(result.first()).toBeVisible();
    if (i === 4)
      await expect(
        page.frameLocator("iframe").locator(".messages .message:last-child"),
      ).toContainText("12:00–16:00");
    if (i === 7)
      await expect(
        page.frameLocator("iframe").locator(".treatment-plan"),
      ).toContainText("План лечения");
    if (i < shots.length - 1) {
      await page.getByRole("button", { name: "Пауза", exact: true }).click();
      await page.mouse.wheel(0, 100);
      await expect(page.locator(".tour-notes h1")).toHaveText(shots[i + 1].title);
      await expect(page.locator(".phone")).not.toHaveClass(/preparing/);
      await page.getByRole("button", { name: "Продолжить", exact: true }).click();
    }
  }
  await expect(page.locator(".adaptive-summary")).toBeVisible({ timeout: 40000 });
  await expect(page.locator(".adaptive-summary iframe")).toHaveCount(3);
  await page.waitForTimeout(1000);
  await page.screenshot({ path: "/tmp/adaptive-summary.png", fullPage: true });
  await page.mouse.move(100, 400);
  await page.mouse.wheel(0, 600);
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(0);
  await page
    .getByRole("button", { name: "К началу", exact: true })
    .click({ timeout: 20000 });
  await expect(page.locator(".mode-choice")).toBeVisible();
  await page.getByRole("button", { name: /Попробовать самому/ }).click();
  await expect(page.frameLocator("iframe").locator(".mobile-hero")).toBeVisible();
  await expect(page.locator("iframe")).not.toHaveAttribute("inert");
  expect(
    await page
      .frameLocator("iframe")
      .locator("body")
      .evaluate(() => performance.timeOrigin),
  ).toBe(documentIdentity);
});
test("exploration follows phone navigation, feedback steps, and hides embedded system scrollbar", async ({
  page,
}) => {
  await page.goto("/case.html");
  await page.getByRole("button", { name: /Попробовать самому/ }).click();
  const f = page.frameLocator("iframe");
  await phoneClick(page, f.locator(".mobile-profile-row .support-button"));
  await expect(page.locator(".notes h1")).toContainText("Выбор темы обращения");
  await page
    .locator(".chapters button")
    .filter({ hasText: "Обратная связь" })
    .click();
  await phoneClick(page, f.locator(".stars button").nth(4));
  await phoneClick(page, f.locator(".rating-submit"));
  await expect(page.locator(".notes h1")).toHaveText("Необязательные подробности");
  await phoneClick(page, f.locator(".rating-submit"));
  await expect(page.locator(".notes h1")).toHaveText(
    "Спасибо без лишнего экрана",
  );
  expect(
    await f
      .locator("html")
      .evaluate((el) => getComputedStyle(el).scrollbarWidth),
  ).toBe("none");
});

test("wheel changes scenes in play and pause with animated camera transitions", async ({ page }) => {
  await page.goto("/case.html");
  await page.getByRole("button", { name: /Смотреть тур/ }).click();
  await expect(page.locator("main")).toHaveAttribute("data-ready", "true");
  await page.mouse.wheel(0, 100);
  await expect(page.locator("main")).toHaveAttribute("data-scene", "1");
  await expect(page.locator("main")).toHaveAttribute("data-ready", "true");
  await expect(page.getByRole("button", { name: "Пауза", exact: true })).toBeVisible();
  await expect.poll(async () => Number(await page.locator("main").getAttribute("data-time"))).toBeGreaterThan(200);
  await page.getByRole("button", { name: "Пауза", exact: true }).click();
  await page.waitForTimeout(1500);
  const transform = () => page.locator(".phone").evaluate(el => getComputedStyle(el).transform);
  const initial = await transform();
  await page.mouse.wheel(0, -100);
  await expect(page.locator("main")).toHaveAttribute("data-scene", "0");
  await page.waitForTimeout(150);
  const intermediate = await transform();
  expect(intermediate).not.toBe(initial);
  expect(intermediate).not.toBe("matrix(1, 0, 0, 1, 0, 0)");
  await page.waitForTimeout(1300);
  expect(await transform()).toBe("matrix(1, 0, 0, 1, 0, 0)");
  await expect(page.getByRole("button", { name: "Продолжить", exact: true })).toBeVisible();
  await expect(page.locator("main")).toHaveAttribute("data-time", "0");
  await page.mouse.wheel(0, 100);
  await page.mouse.wheel(0, 100);
  await expect(page.locator("main")).toHaveAttribute("data-scene", "1");
  await expect(page.locator("main")).toHaveAttribute("data-ready", "true");
  await page.waitForTimeout(1500);
  await expect(page.locator("main")).toHaveAttribute("data-time", "0");
  expect(await transform()).not.toBe("matrix(1, 0, 0, 1, 0, 0)");
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
  await expect(page.locator('[role="alert"]')).toHaveCount(0);
});
