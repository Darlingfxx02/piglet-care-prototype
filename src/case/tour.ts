export type Target = { selector: string; text?: string };
export type Action = Target & { value?: string };
export type Shot = {
  title: string;
  copy: string;
  details?: string[];
  seed: string;
  route: string;
  prepare?: Action[];
  action?: Action;
  before: Target;
  after?: Target;
  camera: "top" | "center" | "bottom";
  overviewAfter?: boolean;
  scrollBeforeAction?: boolean;
  duration: number;
};
const t = (selector: string, text?: string): Target => ({ selector, text });
const delivery = [
  t(".support-area-options button:first-child"),
  t('.chat-orders button[aria-label*="19642"]'),
  t(".topic-confirm .primary"),
];
const vet = [
  t(".support-area-vet"),
  t('.chat-orders button[aria-label*="018"]'),
  t(".topic-confirm .primary"),
];
const treatment = [...vet, t(".quick-replies button", "Какой план лечения?")];
const star = t('.stars button[aria-label="Оценка 5 из 5"]');
export const shots: Shot[] = [
  {
    title: "Визуальный стиль",
    copy: "Сине-лавандовый цвет сочетается с розовыми маскотами. Они задают дружелюбный тон. Кнопки и навигация сохраняют привычные обозначения.",
    seed: "home",
    route: "home",
    before: t(".mobile-hero"),
    camera: "top",
    duration: 13000,
  },
  {
    title: "Вход в поддержку",
    copy: "Вход в поддержку находится в шапке. Покажем, как из личного кабинета попасть к нужному вопросу.",
    seed: "home",
    route: "home",
    before: t(".mobile-profile-row .support-button"),
    action: t(".mobile-profile-row .support-button"),
    after: t(".support-area-options"),
    camera: "top",
    duration: 11000,
  },
  {
    title: "Выбор темы обращения",
    copy: "Пользователь выбирает доставку, ветеринарию или общий вопрос. Тема помогает направить обращение подходящему специалисту.",
    seed: "support",
    route: "support",
    before: t(".support-area-options"),
    action: delivery[0],
    after: t(".chat-orders"),
    camera: "bottom",
    duration: 11000,
  },
  {
    title: "Выбор заказа",
    copy: "Выбираем третий заказ в карусели, с породой Беркшир. Карточка с породой, количеством и номером закрепляется в чате. Переписывать эти данные вручную не нужно.",
    seed: "support",
    route: "support",
    prepare: delivery.slice(0, 1),
    before: t(".chat-orders"),
    action: delivery[1],
    scrollBeforeAction: true,
    after: t(".topic-confirm"),
    camera: "center",
    duration: 12000,
  },
  {
    title: "Уточнение времени доставки",
    copy: "Быстрый ответ помогает сразу перейти к конкретному вопросу. Помощник показывает интервал доставки по выбранному заказу и сообщает, что точный час ещё уточняется.",
    seed: "support",
    route: "support",
    prepare: delivery,
    before: t(".quick-replies"),
    action: t(".quick-replies button", "Уточнить время"),
    after: t(".messages .message.operator:not(.typing):last-child"),
    camera: "center",
    duration: 14000,
  },
  {
    title: "Когда нужен человек",
    copy: "Если подходящего ответа нет, подключается оператор. История диалога уже перед ним. Гипотеза: это сокращает повторные вопросы и экономит время обеих сторон.",
    seed: "support",
    route: "support",
    prepare: delivery,
    before: t(".quick-replies"),
    action: t(".quick-replies button", "Нет нужного варианта"),
    after: t(".messages .message.operator:not(.typing):last-child"),
    camera: "center",
    duration: 14000,
  },
  {
    title: "Ветеринарная поддержка",
    copy: "В ветеринарном разделе выбирают животное по номеру бирки. В дальнейшем такую помощь могли бы оказывать партнёры сервиса или собственное подразделение.",
    seed: "support",
    route: "support",
    prepare: vet.slice(0, 2),
    before: t(".chat-orders"),
    action: vet[2],
    after: t(".animal-context"),
    camera: "center",
    duration: 13000,
  },
  {
    title: "План лечения прямо в чате",
    copy: "Завершённые процедуры отмечены, предстоящие видны рядом. Пользователь понимает, на каком этапе помощь, не разбирая длинное сообщение.",
    seed: "support",
    route: "support",
    prepare: vet,
    before: t(".quick-replies"),
    action: t(".quick-replies button", "Какой план лечения?"),
    after: t(".treatment-plan"),
    camera: "center",
    duration: 12000,
  },
  {
    title: "Документы не нужно искать заново",
    copy: "Через скрепку доступны документы из приложения. Можно выбрать нужный и передать его специалисту в том же диалоге.",
    seed: "support",
    route: "support",
    prepare: [...treatment, t('[aria-label="Прикрепить файл"]')],
    before: t(".attachment-menu"),
    action: t(".attachment-menu button", "Ваши документы"),
    after: t(".documents-grid"),
    camera: "center",
    duration: 12000,
  },
  {
    title: "Завершаем разговор",
    copy: "Кнопка «Завершить» закрывает диалог и открывает оценку. В поддержке остаётся человек: образ свинки здесь мог бы создавать неуместную ассоциацию.",
    seed: "support",
    route: "support",
    prepare: delivery,
    before: t(".finish-button"),
    action: t(".finish-button"),
    after: t(".rating-card"),
    overviewAfter: true,
    camera: "top",
    duration: 12000,
  },
  {
    title: "Оценка без визуального давления",
    copy: "Знакомые звёзды и один спокойный фон для любой оценки. Гипотеза: красный экран при низкой оценке отвлекал бы от работы оператора и усиливал негатив.",
    seed: "rating",
    route: "rating",
    before: t(".stars"),
    action: star,
    after: t(".stars"),
    camera: "bottom",
    duration: 12000,
  },
  {
    title: "Необязательный комментарий",
    copy: "После выбора оценки можно отметить причины и добавить комментарий. Эти подробности необязательны.",
    seed: "rating",
    route: "rating",
    prepare: [star],
    before: t(".rating-submit"),
    action: t(".rating-submit"),
    after: t(".feedback-details"),
    camera: "center",
    duration: 12000,
  },
  {
    title: "Причины низкой оценки",
    copy: "При низкой оценке появляются причины недовольства. Пользователь может отметить проблему и добавить подробности. Цвет экрана остаётся прежним.",
    seed: "rating",
    route: "rating",
    prepare: [
      t('.stars button[aria-label="Оценка 2 из 5"]'),
      t(".rating-submit"),
    ],
    before: t(".reason-options"),
    action: t(".reason-options button", "Вопрос не решён"),
    after: t(".reason-options"),
    camera: "center",
    duration: 12000,
  },
  {
    title: "Спасибо без дополнительного шага",
    copy: "Отправляем отзыв и возвращаемся в завершённый чат. Короткое уведомление благодарит пользователя; отдельного обязательного экрана нет. У уведомления есть крестик.",
    seed: "rating",
    route: "rating",
    prepare: [
      star,
      t(".rating-submit"),
      t(".reason-options button", "Быстро помогли"),
    ],
    before: t(".rating-submit"),
    action: t(".rating-submit"),
    after: t(".feedback-toast"),
    camera: "top",
    duration: 10000,
  },
  {
    title: "Оценка работы поддержки",
    copy: "После диалога пользователь оценивает работу оператора. Здесь оставлен человеческий персонаж: образ свинки мог бы вызвать неуместную ассоциацию. Для оценки используются привычные звёзды.",
    details: [
      "Сине-лавандовый фон одинаков при любой оценке. Я предполагаю, что красный фон при низкой оценке мог бы усиливать негатив и отвлекать от оценки работы оператора. Эту гипотезу нужно проверить на пользователях.",
      "От оценки зависят предложенные причины отзыва. Они помогают указать, что понравилось или что пошло не так. Пользователь сам решает, отмечать ли причины и писать ли комментарий.",
      "На телефоне и планшете оценка и подробности разделены на два шага; на широком десктопе помещаются вместе. После отправки возвращаемся в чат и показываем короткое «Спасибо» вместо отдельного экрана, который пришлось бы закрывать.",
    ],
    seed: "rating",
    route: "rating",
    prepare: [t('.stars button[aria-label="Оценка 4 из 5"]')],
    before: t(".rating-card"),
    camera: "center",
    overviewAfter: true,
    duration: 32000,
  },
];
export function findTarget(
  doc: Document,
  target: Target,
): HTMLElement | undefined {
  return Array.from(doc.querySelectorAll<HTMLElement>(target.selector)).find(
    (el) =>
      !el.closest(".typing") &&
      el.getClientRects().length > 0 &&
      getComputedStyle(el).visibility !== "hidden" &&
      (!target.text || el.textContent?.trim() === target.text),
  );
}
export async function waitTarget(
  doc: Document,
  target: Target,
  signal: AbortSignal,
): Promise<HTMLElement> {
  const start = Date.now();
  while (!signal.aborted && Date.now() - start < 10000) {
    const el = findTarget(doc, target);
    if (el && !el.matches(':disabled,[aria-disabled="true"]')) return el;
    await new Promise((r) => setTimeout(r, 80));
  }
  throw new Error(
    signal.aborted
      ? "cancelled"
      : `Не удалось открыть шаг: ${target.text || target.selector}`,
  );
}
export function detectSection(doc: Document): string {
  if (doc.querySelector(".feedback-toast")) return "thanks";
  if (doc.querySelector(".documents-screen[open]")) return "documents";
  if (doc.querySelector(".rating-layer[open]"))
    return doc.querySelector(".feedback-details") ? "comment" : "rating";
  if (doc.querySelector(".route-home")) return "home";
  if (doc.querySelector(".closed-chat")) return "closed";
  if (doc.querySelector(".animal-context")) return "vet";
  if (doc.querySelector(".order-context")) return "delivery";
  return "support";
}

// Actions required only when continuing from the completed previous scene.
export const continuations: Record<number, Action[]> = {
  1: [],
  2: [],
  3: [],
  4: [delivery[2]],
  5: [],
  7: [],
  8: [t('[aria-label="Прикрепить файл"]')],
  9: [t(".documents-screen .modal-close")],
  10: [],
  11: [],
  12: [
    t('[aria-label="Изменить оценку"]'),
    t('.stars button[aria-label="Оценка 2 из 5"]'),
    t(".rating-submit"),
  ],
  13: [
    t('[aria-label="Изменить оценку"]'),
    star,
    t(".rating-submit"),
    t(".reason-options button", "Быстро помогли"),
  ],
};
