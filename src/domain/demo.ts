import type { AssetName } from "../shared/assets";
export interface Order {
  kind?: "feed";
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
    id: "748",
    breed: "Дюрок",
    count: 2,
    date: "02.10.2026",
    dateText: "2 октября",
    image: "duroc",
    tag: "042",
    health: "Вес проверен",
  },
  {
    id: "19642",
    breed: "Беркшир",
    count: 4,
    date: "06.10.2026",
    dateText: "6 октября",
    image: "berkshire",
    tag: "057",
    health: "Прививка 02.10",
  },
  {
    id: "5819",
    breed: "Мангалица",
    count: 6,
    date: "12.10.2026",
    dateText: "12 октября",
    image: "mangalitsa",
    tag: "071",
    health: "Под наблюдением",
  },
];
export const supportOrders: Order[] = [...orders, {
  id: "90512", kind: "feed", breed: "Комбикорм", count: 2,
  date: "30.09.2026", dateText: "30 сентября", image: "feed", tag: "", health: "",
}];
export const vetAnimals = orders.filter(o => ['018', '057', '071'].includes(o.tag));
export const findOrders = (query: string) =>
  orders.filter((o) =>
    `${o.id} ${o.breed}`
      .toLocaleLowerCase("ru")
      .includes(query.trim().replace("№", "").toLocaleLowerCase("ru")),
  );
export interface Message {
  trackingOrderId?: string;
  treatmentAnimalTag?: string;
  agent?: "human";
  event?: "connected" | "feedback";
  suggestions?: string[];
  attachments?: string[];
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
  animalTag?: string | null;
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
  | { type: "selectAnimal"; tag: string }
  | { type: "send"; text: string; attachments?: string[] }
  | { type: "reply"; text: string; suggestions?: string[]; agent?: "human"; event?: "connected" | "feedback"; trackingOrderId?: string; treatmentAnimalTag?: string }
  | { type: "offerFeedback"; requested?: boolean }
  | { type: "review"; review: Review }
  | { type: "close" }
  | { type: "reopen" }
  | { type: "reset" };
export function supportReducer(
  state: SupportState,
  action: SupportAction,
): SupportState {
  switch (action.type) {
    case "select":
      if (!supportOrders.some((o) => o.id === action.orderId)) return state;
      return {
        orderId: action.orderId,
        messages: state.messages.length && !state.closed ? state.messages : [
          {
            id: "intro",
            role: "operator",
            text: "Мария, уже занимаемся вашим вопросом. Нужен точный час?",
          },
        ],
        review: null,
        closed: false,
      };
    case "selectAnimal": {
      const animal = vetAnimals.find(a => a.tag === action.tag);
      if (!animal || state.closed) return state;
      return { ...state, orderId: null, animalTag: animal.tag, messages: [...state.messages, {
        id: `animal-${state.messages.length}`, role: "operator",
        text: `${animal.breed}, бирка №${animal.tag}. ${animal.health}. Что хотите уточнить?`,
        suggestions: ['Какой план лечения?', 'Статус осмотра', 'Документы по животному', 'Вопрос ветеринару'],
      }] };
    }
    case "send":
      if ((!action.text.trim() && !action.attachments?.length) || state.closed) return state;
      return {
        ...state,
        messages: [
          ...state.messages,
          {
            id: `user-${state.messages.length}`,
            role: "user",
            text: action.text.trim().slice(0, 1000),
            attachments: action.attachments,
          },
        ],
      };
    case "reply":
      if (state.closed) return state;
      return {
        ...state,
        messages: [
          ...state.messages,
          {
            id: `operator-${state.messages.length}`,
            role: "operator",
            text: action.text,
            suggestions: action.suggestions,
            trackingOrderId: action.trackingOrderId,
            treatmentAnimalTag: action.treatmentAnimalTag,
            agent: action.agent,
            event: action.event,
          },
        ],
      };
    case "offerFeedback": {
      const last = state.messages.at(-1);
      if (state.review || state.closed || (action.requested ? !state.messages.some(m => m.agent === "human") : last?.agent !== "human") || state.messages.some(m => m.event === "feedback")) return state;
      return { ...state, messages: [...state.messages, { id: `feedback-${state.messages.length}`, role: "operator", event: "feedback", text: "Предлагаю оценить работу оператора" }] };
    }
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
    case "reopen":
      return { ...state, closed: false };
    case "reset":
      return { ...initialSupport };
  }
}
export function demoReply(text: string, order?: Order) {
  if (!order && /оплата|возврат/i.test(text)) return "Уточните, пожалуйста: вопрос об оплате или о возврате? Если он касается покупки, прикрепите заказ через скрепку.";
  if (!order && /документ/i.test(text)) return "Какой документ вас интересует? Можете прикрепить его через скрепку, в разделе «Ваши документы».";
  if (!order && /здоровье|уход/i.test(text)) return "Опишите, что вас беспокоит, и укажите свинку или группу, о которой идёт речь.";
  if (!order && /работа приложения/i.test(text)) return "Расскажите, что не получается и на каком экране. Через скрепку можно приложить скриншот.";
  if (!order) return "Расскажите, с чем нужна помощь. Если вопрос о доставке, прикрепите заказ через скрепку.";
  if (/спасибо|понятно/i.test(text))
    return "Рада помочь! Если вопросов больше нет, можно завершить диалог и оценить мою работу.";
  if (/где|статус/i.test(text))
    return `Заказ №${order.id} готовится к доставке. Ожидаем ${order.dateText}, с 12:00 до 16:00.`;
  if (/да|час|время|встрет|когда|срок/i.test(text))
    return `Доставка №${order.id}: ${order.dateText}, 12:00–16:00. Точный час пока уточняем; напишу здесь.`;
  return "Здесь можно проверить срок доставки, посмотреть статус заказа или завершить диалог.";
}
export const STORAGE_KEY = "piglet-support-v1";
export function readSupport(storage: Pick<Storage, "getItem">): SupportState {
  try {
    const v = JSON.parse(storage.getItem(STORAGE_KEY) || "null");
    if (
      !v ||
      (v.orderId !== null && !supportOrders.some((o) => o.id === v.orderId)) ||
      !Array.isArray(v.messages) ||
      v.messages.length > 100
    )
      return { ...initialSupport };
    if (
      !v.messages.every(
        (m: Message) =>
          (m.treatmentAnimalTag === undefined || vetAnimals.some(a => a.tag === m.treatmentAnimalTag)) &&
          (m.trackingOrderId === undefined || supportOrders.some(o => o.id === m.trackingOrderId)) &&
          (m.agent === undefined || m.agent === "human") &&
          (m.event === undefined || m.event === "connected" || m.event === "feedback") &&
          typeof m.id === "string" &&
          ["operator", "user"].includes(m.role) &&
          typeof m.text === "string" &&
          m.text.length <= 2000 &&
          (m.suggestions === undefined || (Array.isArray(m.suggestions) && m.suggestions.length <= 10 && m.suggestions.every(s => typeof s === "string"))) &&
          (m.attachments === undefined || (Array.isArray(m.attachments) && m.attachments.length <= 20 && m.attachments.every(a => typeof a === "string" && a.length <= 1000))),
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
      ...(vetAnimals.some(a => a.tag === v.animalTag) ? { animalTag: v.animalTag } : {}),
      messages: v.messages,
      closed: v.closed === true,
      review,
    };
  } catch {
    return { ...initialSupport };
  }
}
