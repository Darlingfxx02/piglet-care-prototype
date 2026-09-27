import { test, expect } from "@playwright/test";
test("order selection, real messages, rating and persistence", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator(".support-button:visible").click();
  await page.getByRole("button", {name: "Доставка Поросята и корм"}).click();
  await page.getByRole("button", { name: "Дюрок, заказ №748" }).click();
  if (await page.getByRole("button", { name: "Подтвердить", exact: true }).isVisible()) {
    await expect(page.getByRole("textbox", { name: "Сообщение", exact: true })).toHaveCount(0);
    await page.getByRole("button", { name: "Подтвердить", exact: true }).click();
  }
  await expect(page.locator(".order-context")).toContainText("№748");
  await page
    .getByRole("button", {
      name: "Да, мне нужно встретить машину.",
      exact: true,
    })
    .click();
  await expect(page.locator(".messages")).toContainText(
    "Доставка №748: 2 октября",
  );
  await page
    .getByRole("textbox", { name: "Сообщение", exact: true })
    .fill("Спасибо");
  await page
    .getByRole("button", { name: "Отправить сообщение", exact: true })
    .click();
  await expect(page.locator(".messages")).toContainText("Спасибо за подробности");
  await page.reload();
  await expect(page.locator(".messages")).toContainText("Доставка №748");
  await page.getByRole("button", { name: "Завершить", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Выберите количество звёзд" }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Оценка 2 из 5" }).click();
  await page.getByRole("button", { name: "Подтвердить", exact: true }).click();
  await page
    .getByRole("button", { name: "Вопрос не решён", exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "Комментарий к оценке" })
    .fill("Хочу точный час");
  await page.getByRole("button", { name: "Отправить оценку" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator(".closed-chat")).toBeVisible();
  await page.reload();
  await expect(page.locator(".closed-chat")).toContainText("2 из 5");
  await page.getByRole("button", { name: "Начать новый диалог" }).click();
  await expect(page.locator(".support-area-options")).toBeVisible();
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
  await page.getByRole("button", {name: "Доставка Поросята и корм"}).click();
    await page.getByRole("button", { name: "Ландрас, заказ №3205", exact: true }).click();
  if (await page.getByRole("button", { name: "Подтвердить", exact: true }).isVisible()) {
    await expect(page.getByRole("textbox", { name: "Сообщение", exact: true })).toHaveCount(0);
    await page.getByRole("button", { name: "Подтвердить", exact: true }).click();
  }
    const input = await page.locator(".composer").boundingBox();
    expect(input!.y + input!.height).toBeLessThanOrEqual(height);
    await page.getByRole("button", { name: "Завершить", exact: true }).click();
    await page.getByRole("button", { name: "Оценка 5 из 5" }).click();
    await page.getByRole("button", { name: "Подтвердить", exact: true }).click();
    await page.getByRole("button", { name: "Пропустить", exact: true }).click();
    await expect(page.locator(".closed-chat")).toBeVisible();
    expect(errors).toEqual([]);
  });

 test("first message accompanies the selected order and survives order changes", async ({ page }) => {
  await page.goto("/#/support");
  await page.getByRole("button", {name: "Доставка Поросята и корм"}).click();
  await page.getByRole("button", { name: "Ландрас, заказ №3205", exact: true }).click();
  if (await page.getByRole("button", { name: "Подтвердить", exact: true }).isVisible()) {
    await expect(page.getByRole("textbox", { name: "Сообщение", exact: true })).toHaveCount(0);
    await page.getByRole("button", { name: "Подтвердить", exact: true }).click();
  }
  const input = page.getByRole("textbox", { name: "Сообщение", exact: true });
  await input.click(); await input.press("End"); await input.pressSequentially("Где мой заказ?");
  await page.getByRole('button', { name: 'Прикрепить файл', exact: true }).click();
  await page.getByRole('button', { name: 'Указать заказ', exact: true }).click();
  await page.getByRole("button", { name: "Беркшир, заказ №19642" }).click();
  if (await page.getByRole("button", { name: "Подтвердить", exact: true }).isVisible()) {
    await expect(page.getByRole("textbox", { name: "Сообщение", exact: true })).toHaveCount(0);
    await page.getByRole("button", { name: "Подтвердить", exact: true }).click();
  }
  await expect(input).toContainText("Где мой заказ?");
  await input.press("Enter");
  await expect(page.locator(".order-context")).toContainText("№19642");
  await expect(page.locator(".message.user")).toHaveText(/Где мой заказ/);
  await expect(page.locator(".delivery-map-card")).toContainText("19642");
  await expect(input).toContainText("");
});

test("pinned order stays outside the composer and can be changed", async ({ page }) => {
  await page.goto('/#/support');
  await page.getByRole("button", {name: "Доставка Поросята и корм"}).click();
  await page.getByRole('button', { name: 'Ландрас, заказ №3205', exact: true }).click();
  if (await page.getByRole("button", { name: "Подтвердить", exact: true }).isVisible()) {
    await expect(page.getByRole("textbox", { name: "Сообщение", exact: true })).toHaveCount(0);
    await page.getByRole("button", { name: "Подтвердить", exact: true }).click();
  }
  const input = page.getByRole('textbox', { name: 'Сообщение', exact: true });
  await input.click(); await input.press("End"); await input.pressSequentially('А');
  await input.press('Backspace');
  await expect(page.locator('.order-context')).toContainText('3205');
  await expect(page.locator('.rolling-order')).toHaveCount(0);
  await input.press('Backspace');
  await expect(page.locator('.rolling-order')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Отправить сообщение', exact: true })).toBeDisabled();
  await input.click(); await input.press("End"); await input.pressSequentially('Вопрос');
  await page.getByRole('button', { name: 'Прикрепить файл', exact: true }).click();
  await page.getByRole('button', { name: 'Указать заказ', exact: true }).click();
  await page.getByRole('button', { name: 'Дюрок, заказ №748' }).click();
  if (await page.getByRole("button", { name: "Подтвердить", exact: true }).isVisible()) {
    await expect(page.getByRole("textbox", { name: "Сообщение", exact: true })).toHaveCount(0);
    await page.getByRole("button", { name: "Подтвердить", exact: true }).click();
  }
  await expect(page.locator('.order-context')).toContainText('748');
  await expect(page.locator('.rolling-order')).toHaveCount(0);
  await expect(input).toContainText('Вопрос');
});

test('internal documents gallery searches and attaches selected documents', async ({ page }) => {
  await page.goto('/#/support');
  await page.getByRole("button", {name: "Доставка Поросята и корм"}).click();
  await page.getByRole('button', { name: 'Ландрас, заказ №3205', exact: true }).click();
  if (await page.getByRole("button", { name: "Подтвердить", exact: true }).isVisible()) {
    await expect(page.getByRole("textbox", { name: "Сообщение", exact: true })).toHaveCount(0);
    await page.getByRole("button", { name: "Подтвердить", exact: true }).click();
  }
  await page.getByRole('textbox', {name:'Сообщение', exact:true}).fill('Посмотрите документ');
  await page.getByRole('button', {name:'Прикрепить файл', exact:true}).click();
  await page.getByRole('button', {name:'Ваши документы', exact:true}).click();
  const gallery = page.getByRole('dialog', {name:'Ваши документы'});
  await expect(gallery).toBeVisible();
  await expect(gallery.getByRole('button', {name:'Выбрать', exact:true})).toBeDisabled();
  await gallery.getByRole('textbox', {name:'Поиск документов'}).fill('19642');
  await expect(gallery.locator('.document-card')).toHaveCount(1);
  await gallery.locator('.document-card').click();
  await gallery.getByRole('textbox', {name:'Поиск документов'}).fill('нет такого');
  await expect(gallery.getByText('Ничего не найдено')).toBeVisible();
  await gallery.getByRole('button', {name:'Выбрать (1)', exact:true}).click();
  await expect(gallery).toHaveCount(0);
  await expect(page.locator('.inline-file-token')).toHaveAttribute('aria-label', /Сведения о вакцинации/);
  await expect(page.getByRole('textbox', {name:'Сообщение', exact:true})).toContainText('Посмотрите документ');
  await expect(page.locator('.attachment-cards')).toBeVisible();
  await expect(page.locator('.chat-orders')).toHaveCount(0);
  await page.getByRole('button', {name:'Прикрепить файл', exact:true}).click();
  await page.getByRole('button', {name:'Указать заказ', exact:true}).click();
  await expect(page.locator('.chat-orders')).toBeVisible();
  await page.getByRole('button', {name:'Прикрепить файл', exact:true}).click();
  const chooser = page.waitForEvent('filechooser');
  await page.getByRole('button', {name:'Приложить файл', exact:true}).click();
  await (await chooser).setFiles({ name: 'document.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4') });
  await expect(page.locator('.inline-file-token')).toHaveCount(2);
  await expect(page.locator('.chat-orders')).toHaveCount(0);
  await expect(page.locator('.attachment-cards .chat-document-card')).toHaveCount(2);
});

test('support requires a topic and offers Other first', async ({ page }) => {
  await page.goto('/#/support');
  await expect(page.getByRole('textbox', {name:'Сообщение', exact:true})).toHaveCount(0);
  await expect(page.getByRole('button', {name:'Прикрепить файл', exact:true})).toHaveCount(0);
  await expect(page.locator('.chat-orders')).toHaveCount(0);
  await page.getByRole('button', {name:'Другое, общий вопрос', exact:true}).click();
  if (await page.getByRole("button", { name: "Подтвердить", exact: true }).isVisible()) {
    await expect(page.getByRole("textbox", { name: "Сообщение", exact: true })).toHaveCount(0);
    await page.getByRole("button", { name: "Подтвердить", exact: true }).click();
  }
  const input = page.getByRole('textbox', {name:'Сообщение', exact:true});
  await expect(input).toBeVisible();
  await expect(page.locator('.rolling-order')).toHaveCount(0);
  await input.fill('Как пользоваться приложением?');
  await input.press('Enter');
  await expect(page.locator('.message.user')).toContainText('Как пользоваться приложением?');
  await expect(page.locator('.order-context')).toHaveCount(0);
});

test('quick replies continue across branches and after free text', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 700 });
  await page.goto('/#/support');
  await page.getByRole('button', { name: 'Другое, общий вопрос' }).click();
  await expect(page.getByRole('button', { name: 'Подтвердить', exact: true })).toHaveCount(0);
  for (const label of ['Оплата и возврат', 'Оплата не прошла', 'Деньги списались', 'Не могу найти чек', 'Выбрать другую тему', 'Документы', 'Для перевозки']) {
    await page.getByRole('button', {name: label, exact: true}).click();
    await expect(page.locator('.typing')).toHaveCount(0);
    await expect(page.locator('.support-topics button').first()).toBeEnabled();
    await expect.poll(async () => {
      const last = await page.locator('.message').last().boundingBox();
      const footer = await page.locator('.chat-bottom').boundingBox();
      return last!.y + last!.height <= footer!.y - 18;
    }).toBe(true);
  }
  await expect(page.locator('.support-topics > div')).toHaveCSS('flex-direction', 'row-reverse');
  await expect(page.locator('.support-topics > p')).toHaveCSS('text-align', 'right');
  const fallback = await page.locator('.quick-reply-secondary').boundingBox();
  const options = await page.locator('.support-topics > div').boundingBox();
  expect(Math.abs(fallback!.x + fallback!.width - options!.x - options!.width)).toBeLessThan(1);
  expect(Math.abs(fallback!.y + fallback!.height - options!.y - options!.height)).toBeLessThan(1);
  await page.getByRole('textbox', {name:'Сообщение', exact:true}).fill('Произвольный вопрос');
  await page.getByRole('textbox', {name:'Сообщение', exact:true}).press('Enter');
  await expect(page.locator('.messages')).toContainText('Спасибо за подробности');
  await page.reload();
  await expect(page.getByRole('button', {name:'Работа приложения', exact:true})).toBeVisible();
  await page.getByRole('button', {name:'Завершить диалог', exact:true}).click();
  await expect(page.getByRole('dialog')).toBeVisible();
});

test('operator handoff shows connection, live typing and retains the human after reload', async ({ page }) => {
  await page.goto('/#/support');
  await page.getByRole('button', { name: 'Другое, общий вопрос' }).click();
  await expect(page.getByRole('button', { name: 'Подтвердить', exact: true })).toHaveCount(0);
  const escape = page.getByRole('button', { name: 'Другое', exact: true });
  await expect(escape).toHaveClass(/quick-reply-secondary/);
  await escape.click();
  await expect(page.locator('.operator-connected')).toContainText('Подключаем оператора');
  await expect(page.locator('.message-name').filter({ hasText: 'Анна' })).toHaveCount(0);
  await expect(page.locator('.typing')).toHaveAccessibleName('Анна печатает');
  await expect(page.locator('.typing-dots i')).toHaveCount(3);
  await expect(page.locator('.message-name').filter({ hasText: 'Анна' })).toHaveCount(0);
  await expect(page.locator('.messages')).toContainText('Здравствуйте! Я Анна.', { timeout: 6000 });
  await page.reload();
  await expect(page.locator('.chat-heading')).toContainText('Анна · оператор');
  await page.getByRole('button', { name: 'Добавлю подробности', exact: true }).click();
  await expect(page.locator('.typing')).toHaveAccessibleName('Анна печатает');
  await expect(page.locator('.messages')).toContainText('Напишите подробности следующим сообщением.');
});

test('second free-form question leaves the bot instead of looping through topics', async ({ page }) => {
  await page.goto('/#/support');
  await page.getByRole('button', { name: 'Другое, общий вопрос' }).click();
  await expect(page.getByRole('button', { name: 'Подтвердить', exact: true })).toHaveCount(0);
  const input = page.getByRole('textbox', { name: 'Сообщение', exact: true });
  await input.fill('У меня особый вопрос');
  await input.press('Enter');
  await expect(page.locator('.messages')).toContainText('Спасибо за подробности');
  await expect(page.getByRole('button', {name: 'Нет нужного варианта'})).toBeVisible();
  await input.fill('Подсказки мне не подходят');
  await input.press('Enter');
  await expect(page.locator('.operator-connected')).toContainText('Подключаем оператора');
  await expect(page.locator('.messages')).toContainText('Здравствуйте! Я Анна.', {timeout: 6000});
});

test('delivery starts with a question category and supports feed orders', async ({ page }) => {
  await page.goto('/#/support');
  await expect(page.locator('.chat-orders')).toHaveCount(0);
  await expect(page.getByRole('button', {name:'Подтвердить',exact:true})).toHaveCount(0);
  await page.getByRole('button', {name:'Доставка Поросята и корм'}).click();
  await page.getByRole('button', {name:'Назад',exact:true}).click();
  await expect(page.locator('.support-area-options')).toBeVisible();
  await page.getByRole('button', {name:'Доставка Поросята и корм'}).click();
  await expect(page.getByRole('button', {name:'Другое, вопрос без заказа'})).toHaveCount(0);
  await expect(page.getByRole('button', {name:'Выберите заказ',exact:true})).toHaveAttribute('aria-disabled', 'true');
  await page.getByRole('button', {name:'Комбикорм, заказ №90512'}).click();
  await page.getByRole('button', {name:'Подтвердить',exact:true}).click();
  await expect(page.locator('.order-context')).toContainText('Комбикорм');
  await page.reload();
  await expect(page.locator('.order-context')).toContainText('90512');
});

test('veterinary support selects an identified animal and preserves its context', async ({ page }) => {
  await page.goto('/#/support');
  await page.getByRole('button', {name:'Ветеринария Здоровье свинок'}).click();
  await expect(page.getByRole('button', {name:'Комбикорм, заказ №90512'})).toHaveCount(0);
  await expect(page.getByRole('button', {name:'Выберите свинку',exact:true})).toHaveAttribute('aria-disabled', 'true');
  await page.getByRole('button', {name:'Мангалица, бирка №071'}).click();
  await expect(page.getByRole('textbox', {name:'Сообщение',exact:true})).toHaveCount(0);
  await page.getByRole('button', {name:'Подтвердить',exact:true}).click();
  await expect(page.locator('.animal-context')).toContainText('071');
  await expect(page.locator('.messages')).toContainText('Под наблюдением');
  await expect(page.locator('.inline-order-token')).toHaveCount(0);
  await page.reload();
  await expect(page.locator('.animal-context')).toContainText('Мангалица');
  await page.getByRole('button', {name:'Прикрепить файл',exact:true}).click();
  await page.getByRole('button', {name:'Указать свинку',exact:true}).click();
  await page.getByRole('button', {name:'Ландрас, бирка №018'}).click();
  await expect(page.locator('.animal-context')).toContainText('018');
});

test('delivery tracking message opens fullscreen and survives reload', async ({ page }) => {
  await page.route('https://yandex.ru/map-widget/**', route => route.fulfill({contentType:'text/html', body:'<html><body>Карта</body></html>'}));
  await page.goto('/#/support');
  await page.getByRole('button', {name:'Доставка Поросята и корм'}).click();
  await page.getByRole('button', {name:'Дюрок, заказ №748'}).click();
  await page.getByRole('button', {name:'Подтвердить',exact:true}).click();
  await page.getByRole('button', {name:'Где заказ сейчас?',exact:true}).click();
  await expect(page.locator('.delivery-map-card')).toContainText('748');
  await page.getByRole('button', {name:'Открыть карту',exact:true}).click();
  const modal = page.getByRole('dialog', {name:'Доставка №748',exact:true});
  await expect(modal).toBeVisible();
  const bounds = await modal.boundingBox();
  expect(bounds!.width).toBe(390);
  expect(bounds!.height).toBe(844);
  await page.keyboard.press('Escape');
  await expect(modal).toHaveCount(0);
  await expect(page.locator('.delivery-map-card')).toBeVisible();
  await page.reload();
  await expect(page.locator('.delivery-map-card')).toContainText('748');
  const input = page.getByRole('textbox', {name:'Сообщение',exact:true});
  await input.fill('Где моя доставка?');
  await input.press('Enter');
  await expect(page.locator('.delivery-map-card')).toHaveCount(2);
});

test('veterinary treatment plan shows completed and upcoming procedures for the selected animal', async ({ page }) => {
  await page.goto('/#/support');
  await page.getByRole('button', {name:'Ветеринария Здоровье свинок'}).click();
  await page.getByRole('button', {name:'Мангалица, бирка №071'}).click();
  await page.getByRole('button', {name:'Подтвердить',exact:true}).click();
  await page.getByRole('button', {name:'Какой план лечения?',exact:true}).click();
  const plan = page.getByRole('region', {name:'План лечения, бирка №071'});
  await expect(plan).toContainText('Мангалица');
  await expect(plan.getByRole('img', {name:'Выполнено',exact:true})).toHaveCount(2);
  await expect(plan.getByRole('img', {name:'Предстоит',exact:true})).toHaveCount(4);
  await expect(plan.getByRole('checkbox')).toHaveCount(0);
  await page.reload();
  await expect(plan).toBeVisible();
  const input = page.getByRole('textbox', {name:'Сообщение',exact:true});
  await input.fill('Какие процедуры предстоят?');
  await input.press('Enter');
  await expect(page.locator('.treatment-plan')).toHaveCount(2);
});

test('composer uses a custom scrollbar only for long text', async ({ page }) => {
  await page.goto('/#/support');
  await page.getByRole('button', {name:'Другое, общий вопрос'}).click();
  const input = page.getByRole('textbox', {name:'Сообщение',exact:true});
  await input.fill('Короткий вопрос');
  await expect(page.getByRole('scrollbar')).toHaveCount(0);
  await input.fill('Подробности обращения по заказу. '.repeat(45));
  const scrollbar = page.getByRole('scrollbar', {name:'Прокрутка сообщения'});
  await expect(scrollbar).toBeVisible();
  await expect(input).toHaveCSS('scrollbar-width', 'none');
  await scrollbar.focus();
  await scrollbar.press('Home');
  await expect.poll(() => input.evaluate(e => e.scrollTop)).toBe(0);
  await scrollbar.press('End');
  await expect.poll(() => input.evaluate(e => e.scrollTop)).toBeGreaterThan(0);
  await input.fill('Снова короткий');
  await expect(scrollbar).toHaveCount(0);
});

test('attachment menu does not shift the composer or jump between rendered frames', async ({ page }) => {
  await page.goto('/#/support');
  await page.getByRole('button', {name:'Другое, общий вопрос'}).click();
  for (const label of ['Оплата и возврат', 'Оплата не прошла', 'Деньги списались', 'Не могу найти чек']) {
    await page.getByRole('button', {name:label,exact:true}).click();
    await expect(page.locator('.typing')).toHaveCount(0);
  }
  const chatScroll = page.getByRole('scrollbar', {name:'Прокрутка переписки'});
  await expect(chatScroll).toBeVisible();
  await expect(page.locator('.conversation')).toHaveCSS('scrollbar-width', 'none');
  await chatScroll.focus();
  await chatScroll.press('Home');
  await expect.poll(() => page.locator('.conversation').evaluate(e => e.scrollTop)).toBe(0);
  const thumb = await chatScroll.locator('span').boundingBox();
  await page.mouse.move(thumb!.x + 1, thumb!.y + 4);
  await page.mouse.down();
  await page.mouse.move(thumb!.x + 1, thumb!.y + 64);
  await page.mouse.up();
  await expect.poll(() => page.locator('.conversation').evaluate(e => e.scrollTop)).toBeGreaterThan(0);
  await chatScroll.press('End');
  const initial = await page.locator('.composer').boundingBox();
  for (let i = 0; i < 4; i++) {
    const samples = await page.evaluate(async () => {
      (document.querySelector('button[aria-label="Прикрепить файл"]') as HTMLButtonElement).click();
      const values = [];
      for(let n = 0; n < 8; n++) {
        await new Promise(requestAnimationFrame);
        const c = document.querySelector('.composer')!.getBoundingClientRect();
        const last = document.querySelector('.message:last-child')!.getBoundingClientRect();
        values.push({composer:c.y, bottom:last.bottom});
      }
      return values;
    });
    for (const sample of samples.slice(1)) {
      expect(Math.abs(sample.composer - initial!.y)).toBeLessThan(1);
      expect(Math.abs(sample.bottom - samples[1].bottom)).toBeLessThan(1);
    }
  }
});

test('returning after a long absence offers feedback once and opens rating directly', async ({ page }) => {
  await page.addInitScript(() => {
    if (localStorage.getItem('feedback-test-seeded')) return;
    localStorage.setItem('feedback-test-seeded', 'yes');
    localStorage.setItem('piglet-support-v1', JSON.stringify({orderId:null, closed:false, review:null, messages:[
      {id:'user-0',role:'user',text:'Спасибо за помощь'},
      {id:'operator-1',role:'operator',agent:'human',text:'Рада помочь!'}
    ]}));
    localStorage.setItem('piglet-chat-last-visit', JSON.stringify({at:Date.now()-31*60*1000,lastMessage:'operator-1'}));
  });
  await page.goto('/#/support');
  await expect(page.locator('.feedback-message')).toHaveCount(1);
  await expect(page.locator('.feedback-message')).toContainText('Предлагаю оценить работу оператора');
  await page.getByRole('button', {name:'Оценить',exact:true}).click();
  await expect(page.getByRole('dialog', {name:'Оценка оператора'})).toBeVisible();
  await page.getByRole('button', {name:'Закрыть оценку',exact:true}).click();
  await page.reload();
  await expect(page.locator('.feedback-message')).toHaveCount(1);
});

test('feedback is not offered for a bot-only chat or an unanswered user message', async ({ page }) => {
  await page.goto('/#/support');
  for (const agent of ['bot', 'waiting', 'recent', 'reviewed']) {
    await page.evaluate(kind => {
      const messages: object[] = [{id:'operator-0',role:'operator',text:'Здравствуйте', ...(kind === 'bot' ? {} : {agent:'human'})}];
      if(kind === 'waiting') messages.push({id:'user-1',role:'user',text:'Ещё вопрос'});
      localStorage.setItem('piglet-support-v1', JSON.stringify({orderId:null,closed:kind==='reviewed',review:kind==='reviewed'?{score:5,reason:'',comment:''}:null,messages}));
      localStorage.setItem('piglet-chat-last-visit', JSON.stringify({at:Date.now()-(kind==='recent'?5:31)*60*1000,lastMessage:kind==='waiting'?'user-1':'operator-0'}));
    }, agent);
    // A new page reads the saved return timestamp without the previous page's pagehide handler.
    const returned = await page.context().newPage();
    await returned.goto('/#/support');
    await expect(returned.locator('.feedback-message')).toHaveCount(0);
    await returned.close();
  }
});

test('resolved question offers feedback in chat without opening a modal', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('piglet-support-v1', JSON.stringify({orderId:null, closed:false, review:null, messages:[
      {id:'operator-0',role:'operator',agent:'human',text:'Рада помочь!'}
    ]}));
  });
  await page.goto('/#/support');
  await page.getByRole('button', {name:'Вопрос решён',exact:true}).click();
  await expect(page.locator('.feedback-message')).toHaveCount(1);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('button', {name:'Вопрос решён',exact:true})).toHaveCount(0);
  await page.getByRole('button', {name:'Оценить',exact:true}).click();
  await expect(page.getByRole('dialog', {name:'Оценка оператора'})).toBeVisible();
});

test('finish closes chat immediately and rating collects stars before optional comment', async ({ page }) => {
  await page.goto('/#/support');
  await page.getByRole('button', {name:'Другое, общий вопрос'}).click();
  await page.getByRole('button', {name:'Завершить',exact:true}).click();
  await expect(page.getByRole('dialog', {name:'Оценка оператора'})).toBeVisible();
  await expect(page.getByRole('textbox', {name:'Комментарий к оценке'})).toHaveCount(0);
  await expect(page.getByRole('button', {name:'Пропустить',exact:true})).toHaveCount(0);
  await expect(page.getByRole('button', {name:'Выберите количество звёзд',exact:true})).toBeDisabled();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('piglet-support-v1')!).closed)).toBe(true);
  await page.getByRole('button', {name:'Оценка 5 из 5'}).click();
  await expect(page.getByRole('textbox', {name:'Комментарий к оценке'})).toHaveCount(0);
  await page.getByRole('button', {name:'Подтвердить',exact:true}).click();
  await expect(page.getByRole('group', {name:'Оценка от 1 до 5'})).toHaveCount(0);
  await expect(page.getByRole('button', {name:'Быстро помогли',exact:true})).toBeVisible();
  await expect(page.getByRole('textbox', {name:'Комментарий к оценке'})).toBeVisible();
  await page.getByRole('button', {name:'Пропустить',exact:true}).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('.closed-chat')).toBeVisible();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('piglet-support-v1')!).review)).toEqual({score:5,reason:'',comment:''});
});

test('rating controls and back navigation match on mobile and desktop', async ({ page }) => {
  const controls: string[][] = [];
  for (const width of [390, 1440]) {
    await page.setViewportSize({width, height:900});
    await page.goto('/#/rating');
    await page.reload();
    const rating = page.getByRole('region', {name:'Оценка оператора',exact:true});
    const names = () => rating.locator('button:visible').evaluateAll(nodes => nodes.map(n => n.getAttribute('aria-label') || n.textContent?.trim() || ''));
    controls.push(await names());
    await rating.getByRole('button', {name:'Оценка 4 из 5'}).click();
    await rating.getByRole('button', {name:'Подтвердить',exact:true}).click();
    controls.push(await names());
    await rating.getByRole('textbox', {name:'Комментарий к оценке'}).fill('Спасибо за помощь');
    await rating.getByRole('button', {name:'Изменить оценку'}).click();
    await expect(rating.getByRole('button', {name:'Оценка 4 из 5'})).toHaveAttribute('aria-pressed','true');
    await rating.getByRole('button', {name:'Подтвердить',exact:true}).click();
    await expect(rating.getByRole('textbox', {name:'Комментарий к оценке'})).toHaveValue('Спасибо за помощь');
    await rating.getByRole('button', {name:'Закрыть оценку'}).click();
    await expect(page.getByRole('dialog', {name:'Оценка оператора'})).toHaveCount(0);
  }
  expect(controls[0]).toEqual(controls[2]);
  expect(controls[1]).toEqual(controls[3]);
});
