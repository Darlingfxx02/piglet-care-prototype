import type { AssetName } from "../shared/assets";
export interface Order {
  id: string;
  breed: string;
  count: number;
  date: string;
  dateText: string;
  image: AssetName;
  tag: string;
  health: string;
}
export const orders: Order[] = [
  {
    id: "3205",
    breed: "Ландрас",
    count: 3,
    date: "28.09.2026",
    dateText: "28 сентября",
    image: "landrace",
    tag: "018",
    health: "Осмотр сегодня",
  },
  {
    id: "3206",
    breed: "Дюрок",
    count: 2,
    date: "02.10.2026",
    dateText: "2 октября",
    image: "duroc",
    tag: "042",
    health: "Вес проверен",
  },
  {
    id: "3207",
    breed: "Беркшир",
    count: 4,
    date: "06.10.2026",
    dateText: "6 октября",
    image: "berkshire",
    tag: "057",
    health: "Прививка 02.10",
  },
  {
    id: "3208",
    breed: "Мангалица",
    count: 6,
    date: "12.10.2026",
    dateText: "12 октября",
    image: "mangalitsa",
    tag: "071",
    health: "Под наблюдением",
  },
];
export const findOrders = (query: string) =>
  orders.filter((o) =>
    `${o.id} ${o.breed}`
      .toLocaleLowerCase("ru")
      .includes(query.trim().replace("№", "").toLocaleLowerCase("ru")),
  );
export interface Message {
  id: string;
  role: "operator" | "user";
  text: string;
}
export interface Review {
  score: number;
  reason: string;
  comment: string;
}
export interface SupportState {
  orderId: string | null;
  messages: Message[];
  review: Review | null;
  closed: boolean;
}
export const initialSupport: SupportState = {
  orderId: null,
  messages: [],
  review: null,
  closed: false,
};
export type SupportAction =
  | { type: "select"; orderId: string }
  | { type: "send"; text: string }
  | { type: "reply"; text: string }
  | { type: "review"; review: Review }
  | { type: "close" }
  | { type: "reset" };
export function supportReducer(
  state: SupportState,
  action: SupportAction,
): SupportState {
  switch (action.type) {
    case "select":
      if (!orders.some((o) => o.id === action.orderId)) return state;
      return {
        orderId: action.orderId,
        messages: [
          {
            id: "intro",
            role: "operator",
            text: "Мария, уже занимаемся вашим вопросом. Нужен точный час?",
          },
        ],
        review: null,
        closed: false,
      };
    case "send":
      if (!action.text.trim() || state.closed || !state.orderId) return state;
      return {
        ...state,
        messages: [
          ...state.messages,
          {
            id: `user-${state.messages.length}`,
            role: "user",
            text: action.text.trim().slice(0, 1000),
          },
        ],
      };
    case "reply":
      if (state.closed || !state.orderId) return state;
      return {
        ...state,
        messages: [
          ...state.messages,
          {
            id: `operator-${state.messages.length}`,
            role: "operator",
            text: action.text,
          },
        ],
      };
    case "review":
      if (
        !Number.isInteger(action.review.score) ||
        action.review.score < 1 ||
        action.review.score > 5
      )
        return state;
      return { ...state, closed: true, review: action.review };
    case "close":
      return { ...state, closed: true };
    case "reset":
      return { ...initialSupport };
  }
}
export function demoReply(text: string, order: Order) {
  if (/спасибо|понятно/i.test(text))
    return "Рада помочь! Если вопросов больше нет, можно завершить диалог и оценить мою работу.";
  if (/где|статус/i.test(text))
    return `Заказ №${order.id} готовится к доставке. Ожидаем ${order.dateText}, с 12:00 до 16:00.`;
  if (/да|час|время|встрет|когда|срок/i.test(text))
    return `Доставка №${order.id}: ${order.dateText}, 12:00–16:00. Точный час пока уточняем; напишу здесь.`;
  return "Это демонстрационный чат. Здесь можно проверить срок доставки, посмотреть статус заказа или завершить диалог.";
}
export const STORAGE_KEY = "piglet-support-v1";
export function readSupport(storage: Pick<Storage, "getItem">): SupportState {
  try {
    const v = JSON.parse(storage.getItem(STORAGE_KEY) || "null");
    if (
      !v ||
      !orders.some((o) => o.id === v.orderId) ||
      !Array.isArray(v.messages) ||
      v.messages.length > 100
    )
      return { ...initialSupport };
    if (
      !v.messages.every(
        (m: Message) =>
          typeof m.id === "string" &&
          ["operator", "user"].includes(m.role) &&
          typeof m.text === "string" &&
          m.text.length <= 2000,
      )
    )
      return { ...initialSupport };
    const review =
      v.review &&
      Number.isInteger(v.review.score) &&
      v.review.score >= 1 &&
      v.review.score <= 5 &&
      typeof v.review.reason === "string" &&
      typeof v.review.comment === "string"
        ? v.review
        : null;
    return {
      orderId: v.orderId,
      messages: v.messages,
      closed: v.closed === true,
      review,
    };
  } catch {
    return { ...initialSupport };
  }
}
