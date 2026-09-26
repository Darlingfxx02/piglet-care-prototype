import {
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type FormEvent,
} from "react";
import {
  orders,
  demoReply,
  type SupportState,
  type SupportAction,
  type Message,
} from "../domain/demo";
import { asset } from "../shared/assets";
import { AnnaAvatar, Icon, Modal, Waves } from "../shared/UI";
import { OrderCard } from "./Orders";
export function Bubble({ message }: { message: Message }) {
  return (
    <div className={`message ${message.role}`}>
      {message.role === "operator" && <AnnaAvatar />}
      <div className="bubble">
        <span className="message-name">
          {message.role === "operator" ? "Анна" : "Вы"}
        </span>
        <p>{message.text}</p>
        {message.role === "operator" && (
          <img className="message-tail" src={asset("tail")} alt="" />
        )}
      </div>
    </div>
  );
}
export function Support({
  state,
  dispatch,
  onBack,
  onRate,
}: {
  state: SupportState;
  dispatch: Dispatch<SupportAction>;
  onBack: () => void;
  onRate: () => void;
}) {
  const [selected, setSelected] = useState(orders[0].id);
  const [draft, setDraft] = useState("");
  const [ending, setEnding] = useState(false);
  const [typing, setTyping] = useState(false);
  const [attachment, setAttachment] = useState("");
  const [error, setError] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const messages = useRef<HTMLDivElement>(null);
  const file = useRef<HTMLInputElement>(null);
  const order = orders.find((o) => o.id === state.orderId);
  const selectedOrder = orders.find((o) => o.id === selected)!;
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  useEffect(() => {
    if (state.messages.length > 1)
      messages.current?.scrollTo({
        top: messages.current.scrollHeight,
        behavior: "smooth",
      });
  }, [state.messages.length, typing]);
  function send(text: string) {
    if (!order) {
      dispatch({ type: "select", orderId: selected });
      setDraft("");
      return;
    }
    if (typing || state.closed || (!text.trim() && !attachment)) return;
    const body = text.trim() + (attachment ? `\nВложение: ${attachment}` : "");
    dispatch({ type: "send", text: body });
    setDraft("");
    setAttachment("");
    setTyping(true);
    timer.current = setTimeout(() => {
      dispatch({ type: "reply", text: demoReply(body, order) });
      setTyping(false);
    }, 750);
  }
  return (
    <main className={`chat-screen ${order ? "active" : "empty"}`}>
      <link rel="preload" as="image" href={asset("star")} />
      <header className="chat-header">
        <div className="chat-header-art" aria-hidden="true">
          <img className="chat-wave" src={asset("chatWave")} alt="" />
        </div>
        <button
          className="back-button"
          onClick={onBack}
          aria-label="На главную"
        >
          <Icon name="back" />
        </button>
        <div className="chat-heading">
          <h1>Чат поддержки</h1>
          <p>{order ? "Анна · оператор на связи" : "Поможем с доставкой"}</p>
        </div>
        <button className="finish-button" onClick={() => setEnding(true)}>
          Завершить
        </button>
      </header>
      <div className="conversation" ref={messages}>
        {order && (
          <div className="order-context">
            <small>Заказ №{order.id}</small>
            <div className="order-context-card">
              <div className="context-pig">
                <b>{order.breed}</b>
                <span>х{order.count}</span>
                <img src={asset(order.image)} alt="" />
              </div>
              <p>
                Уточнение срока
                <br />
                доставки
              </p>
            </div>
          </div>
        )}
        <p className="chat-date">Сегодня</p>
        <div
          className="messages"
          role="log"
          aria-label="Переписка с поддержкой"
          aria-live="polite"
        >
          {!order ? (
            <Bubble
              message={{
                id: "welcome",
                role: "operator",
                text: "По какому заказу у вас вопрос?",
              }}
            />
          ) : (
            state.messages.map((m) => <Bubble key={m.id} message={m} />)
          )}
          {typing && (
            <div className="typing" role="status">
              Анна печатает<span>...</span>
            </div>
          )}
        </div>
      </div>
      <div className="chat-bottom">
        {!order && (
          <div
            className="order-carousel chat-orders"
            aria-label="Выберите заказ"
          >
            {orders.map((o) => (
              <OrderCard
                key={o.id}
                order={o}
                mode="chat"
                selected={o.id === selected}
                onClick={() => setSelected(o.id)}
              />
            ))}
          </div>
        )}
        {order && !state.closed && (
          <div className="quick-replies">
            <p>Быстрый ответ</p>
            <div>
              {(state.messages.length === 1
                ? ["Да, мне нужно встретить машину.", "Где заказ сейчас?"]
                : ["Где заказ сейчас?", "Уточнить время", "Спасибо, понятно"]
              ).map((s) => (
                <button key={s} disabled={typing} onClick={() => send(s)}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {state.closed ? (
          <div className="closed-chat">
            <p>
              Диалог завершён
              {state.review ? ` · ваша оценка ${state.review.score} из 5` : ""}
            </p>
            <button
              className="primary"
              onClick={() => dispatch({ type: "reset" })}
            >
              Начать новый диалог
            </button>
          </div>
        ) : (
          <>
            <p className="attachment-note" role="status">
              {attachment && (
                <>
                  <span>{attachment}</span>
                  <button
                    onClick={() => setAttachment("")}
                    aria-label="Удалить вложение"
                  >
                    Удалить
                  </button>
                </>
              )}
              {error}
            </p>
            <form
              className="composer"
              onSubmit={(e: FormEvent) => {
                e.preventDefault();
                send(draft);
              }}
            >
              <div className="composer-field">
                <button
                  type="button"
                  onClick={() => file.current?.click()}
                  aria-label="Прикрепить файл"
                  disabled={!order}
                >
                  <Icon name="attach" />
                </button>
                <input
                  ref={file}
                  type="file"
                  className="sr-only"
                  tabIndex={-1}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f && f.size > 5 * 1024 * 1024) {
                      setError("Выберите файл до 5 МБ");
                      return;
                    }
                    setError("");
                    setAttachment(f?.name || "");
                    e.target.value = "";
                  }}
                />
                <input
                  aria-label="Сообщение"
                  placeholder={
                    order ? "Сообщение..." : `заказ №${selectedOrder.id}`
                  }
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  maxLength={1000}
                  readOnly={!order}
                />
              </div>
              <button
                className="send-button"
                type="submit"
                disabled={typing || (!!order && !draft.trim() && !attachment)}
                aria-label={
                  order ? "Отправить сообщение" : "Обсудить выбранный заказ"
                }
              >
                <Icon name="send" />
              </button>
            </form>
          </>
        )}
      </div>
      {ending && (
        <Modal title="Завершить диалог?" onClose={() => setEnding(false)}>
          <p>
            Если вопрос решён, оцените работу Анны. Переписка останется в
            истории.
          </p>
          <button
            className="primary"
            onClick={() => {
              if (timer.current) clearTimeout(timer.current);
              setTyping(false);
              setEnding(false);
              onRate();
            }}
          >
            Завершить и оценить
          </button>
          <button className="secondary" onClick={() => setEnding(false)}>
            Продолжить диалог
          </button>
        </Modal>
      )}
    </main>
  );
}
export function Rating({
  onClose,
  onSubmit,
  onSkip,
}: {
  onClose: () => void;
  onSubmit: (score: number, reason: string, comment: string) => void;
  onSkip: () => void;
}) {
  const [score, setScore] = useState(0);
  const [reason, setReason] = useState("");
  const [comment, setComment] = useState("");
  const low = score > 0 && score <= 3;
  return (
    <section
      className={`rating-card ${low ? "low-rating" : ""}`}
      aria-label="Оценка оператора"
    >
      <Waves rating />
      <header className="rating-header">
        <button
          className="back-button"
          onClick={onClose}
          aria-label="Вернуться в чат"
        >
          <Icon name="back" />
        </button>
        <div>
          <h1>Чат поддержки</h1>
          <p>Анна · оператор на связи</p>
        </div>
      </header>
      <button
        className="rating-close"
        onClick={onClose}
        aria-label="Закрыть оценку"
      >
        <Icon name="close" />
      </button>
      <div className="rating-body">
        <div className="rating-art">
          <img src={asset("anna")} alt="Анна, оператор поддержки" />
        </div>
        <div className="rating-title">
          <h2>Как прошёл диалог?</h2>
          <p>Оцените работу Анны</p>
        </div>
        <div className="stars" role="group" aria-label="Оценка от 1 до 5">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              className={n <= score ? "filled" : ""}
              aria-label={`Оценка ${n} из 5`}
              aria-pressed={n === score}
              onClick={() => setScore(n)}
            >
              {n <= score ? (
                <img src={asset("star")} alt="" />
              ) : (
                <span
                  className="empty-star"
                  style={{ maskImage: `url(${asset("starMask")})` }}
                />
              )}
            </button>
          ))}
        </div>
        {low && (
          <div className="feedback-details">
            <p>Что можно улучшить?</p>
            <div className="reason-options">
              {["Долго ждал ответа", "Вопрос не решён", "Ответ непонятен"].map(
                (r) => (
                  <button
                    className={r === reason ? "chosen" : ""}
                    aria-pressed={r === reason}
                    key={r}
                    onClick={() => setReason(r === reason ? "" : r)}
                  >
                    {r}
                  </button>
                ),
              )}
            </div>
            <textarea
              aria-label="Комментарий к оценке"
              placeholder="Комментарий, если хотите"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={500}
            />
          </div>
        )}
      </div>
      <footer className="rating-footer">
        <p>
          {score
            ? "Спасибо, что поделились впечатлением"
            : "Выберите оценку от 1 до 5"}
        </p>
        <button
          className="rating-submit"
          disabled={!score}
          onClick={() => onSubmit(score, reason, comment)}
        >
          Отправить оценку
        </button>
        <button className="rating-skip" onClick={onSkip}>
          Пропустить
        </button>
      </footer>
    </section>
  );
}
