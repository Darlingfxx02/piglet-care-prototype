import { describe, it, expect } from "vitest";
import {
  initialSupport,
  supportReducer,
  readSupport,
  findOrders,
  demoReply,
  orders,
} from "./demo";
describe("local support flow", () => {
  it("starts with the actual selected order and resets a previous review", () => {
    const s = supportReducer(
      {
        ...initialSupport,
        review: { score: 5, reason: "", comment: "" },
        closed: true,
      },
      { type: "select", orderId: "19642" },
    );
    expect(s.orderId).toBe("19642");
    expect(s.messages).toHaveLength(1);
    expect(s.review).toBeNull();
    expect(s.closed).toBe(false);
  });
  it("does not accept blank messages, invalid orders or invalid scores", () => {
    expect(
      supportReducer(initialSupport, { type: "select", orderId: "bad" }),
    ).toEqual(initialSupport);
    const s = supportReducer(initialSupport, {
      type: "select",
      orderId: "3205",
    });
    expect(supportReducer(s, { type: "send", text: "  " })).toEqual(s);
    expect(
      supportReducer(s, {
        type: "review",
        review: { score: 0, reason: "", comment: "" },
      }),
    ).toEqual(s);
  });
  it("keeps the selected order in the reply", () => {
    expect(demoReply("Когда?", orders[2])).toContain("№19642");
    expect(demoReply("Когда?", orders[2])).toContain("6 октября");
  });
  it("saves negative feedback and prevents messages after closing", () => {
    let s = supportReducer(initialSupport, { type: "select", orderId: "3205" });
    s = supportReducer(s, {
      type: "review",
      review: { score: 2, reason: "Вопрос не решён", comment: "Нужно время" },
    });
    expect(s.closed).toBe(true);
    expect(s.review?.reason).toBe("Вопрос не решён");
    expect(supportReducer(s, { type: "send", text: "test" })).toEqual(s);
  });
  it("reopens the same conversation and keeps its context, history and review", () => {
    let state = supportReducer(initialSupport, { type: "selectAnimal", tag: "018" });
    state = supportReducer(state, { type: "send", text: "Нужна помощь" });
    state = supportReducer(state, { type: "review", review: { score: 2, reason: "", comment: "" } });
    const reopened = supportReducer(state, { type: "reopen" });
    expect(reopened).toEqual({ ...state, closed: false });
    const continued = supportReducer(reopened, { type: "send", text: "Вопрос остался" });
    expect(continued.messages).toHaveLength(state.messages.length + 1);
    expect(continued.messages.at(-1)?.text).toBe("Вопрос остался");
  });
  it("recovers safely from corrupt storage", () => {
    for (const value of [
      "{",
      JSON.stringify({ orderId: "3205", messages: [{}] }),
      JSON.stringify({ orderId: "unknown", messages: [] }),
    ])
      expect(readSupport({ getItem: () => value })).toEqual(initialSupport);
  });
  it("restores valid history", () => {
    const s = supportReducer(initialSupport, {
      type: "select",
      orderId: "748",
    });
    expect(readSupport({ getItem: () => JSON.stringify(s) })).toEqual(s);
  });
  it("searches by number and breed with whitespace", () => {
    expect(findOrders(" №748 ")[0].breed).toBe("Дюрок");
    expect(findOrders("бЕРК")[0].id).toBe("19642");
    expect(findOrders("404")).toHaveLength(0);
  });
});
