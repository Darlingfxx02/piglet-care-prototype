import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type Dispatch,
  type FormEvent,
} from "react";
import {
  orders,
  supportOrders,
  vetAnimals,
  type SupportState,
  type SupportAction,
  type Message,
} from "../domain/demo";
import { scenarioReply, freeTextReply, generalTopics, orderTopics, isDeliveryTrackingQuestion } from "../domain/supportScenario";
import { currentSupportCopy } from "../domain/supportCopy";
import { asset } from "../shared/assets";
import { AnnaAvatar, Icon, Waves } from "../shared/UI";
import { AttachmentCard } from "./AttachmentCard";
import { TreatmentPlan } from "./TreatmentPlan";
import { isTreatmentPlanQuestion } from "../domain/treatmentPlans";
import { DeliveryMap } from "./DeliveryMap";
import { Documents } from "./Documents";
import { OrderCard } from "./Orders";
import { useFeedbackReturn } from "../shared/useFeedbackReturn";
import { ChatScrollbar } from "../shared/ChatScrollbar";
import { InlineComposer } from "../shared/InlineComposer";
export function Bubble({ message, onRate, reviewed }: { message: Message; onRate?: () => void; reviewed?: boolean }) {
  if (message.event === "feedback") return <div className="message operator feedback-message">
    <img className="feedback-avatar" src={asset("feedbackService")} alt="" />
    <div className="bubble"><span className="message-name">Служба обратной связи</span><p>{message.text}</p>
      {reviewed ? <span className="feedback-thanks">Спасибо за вашу оценку</span> : <button className="feedback-rate" onClick={onRate}>Оценить</button>}
      <img className="message-tail" src={asset("tail")} alt="" />
    </div>
  </div>;
  if (message.event === "connected") return <p className="operator-connected" role="status">{currentSupportCopy(message.text)}</p>;
  return (
    <div className={`message ${message.role}`}>
      {message.role === "operator" && <AnnaAvatar />}
      <div className="bubble">
        <span className="message-name">
          {message.role === "operator" ? (message.agent === "human" ? "Оператор Анна" : "Помощник") : "Вы"}
        </span>
        {message.text && !message.treatmentAnimalTag && <p>{currentSupportCopy(message.text)}</p>}
        {message.treatmentAnimalTag && <TreatmentPlan animalTag={message.treatmentAnimalTag} />}
        {message.trackingOrderId && <DeliveryMap orderId={message.trackingOrderId} />}
        {!!message.attachments?.length && <div className="message-documents">{message.attachments.map((name, index) => <AttachmentCard key={`${index}-${name}`} name={name} />)}</div>}
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
  isRating = false,
}: {
  state: SupportState;
  dispatch: Dispatch<SupportAction>;
  onBack: () => void;
  onRate: () => void;
  isRating?: boolean;
}) {
  useFeedbackReturn(state, dispatch);
  const [area, setArea] = useState<"delivery" | "vet" | "other" | null>(state.animalTag ? "vet" : state.orderId || state.messages.length ? "delivery" : null);
  const [selectedAnimal, setSelectedAnimal] = useState<string | null>(state.animalTag ?? null);
  const animal = vetAnimals.find(a => a.tag === state.animalTag);
  const [selected, setSelected] = useState(orders[0].id);
  const [initialTopic, setInitialTopic] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [documentsOpen, setDocumentsOpen] = useState(false);
  const [attachmentMenu, setAttachmentMenu] = useState(false);
  const [orderPicker, setOrderPicker] = useState(!state.orderId && state.messages.length === 0);
  const [pendingOrder, setPendingOrder] = useState(false);
  const [topicChosen, setTopicChosen] = useState(!!state.orderId || state.messages.length > 0);
  const [typing, setTyping] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const freeTextCount = useRef(0);
  const humanConnected = state.messages.some(m => m.event === "connected" || m.agent === "human");
  const [attachments, setAttachments] = useState<string[]>([]);
  const [error, setError] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const messages = useRef<HTMLDivElement>(null);
  const menuScroll = useRef<{ pinned: boolean; top: number } | null>(null);
  const pinnedToBottom = useRef(true);
  const headerRef = useRef<HTMLElement>(null);
  const file = useRef<HTMLInputElement>(null);
  const messageInput = useRef<HTMLDivElement>(null);
  const order = supportOrders.find((o) => o.id === state.orderId);
  const active = !!animal || !!order || state.messages.length > 0;
  const selectedOrder = supportOrders.find((o) => o.id === selected)!;
  useEffect(() => {
    if (state.closed) {
      if (timer.current) clearTimeout(timer.current);
      setConnecting(false);
      setTyping(false);
    }
  }, [state.closed]);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  useLayoutEffect(() => {
    const conversation = messages.current;
    if (conversation && state.messages.length > 0)
      conversation.scrollTop = conversation.scrollHeight;
  }, [state.messages.length, typing, connecting]);
  useLayoutEffect(() => {
    const conversation = messages.current;
    const saved = menuScroll.current;
    if (conversation && saved) {
      conversation.scrollTop = saved.pinned ? conversation.scrollHeight : saved.top;
      pinnedToBottom.current = saved.pinned;
      menuScroll.current = null;
    }
  }, [attachmentMenu]);
  useEffect(() => {
    const conversation = messages.current;
    if (!conversation) return;
    const observer = new ResizeObserver(() => {
      if (pinnedToBottom.current) conversation.scrollTop = conversation.scrollHeight;
    });
    observer.observe(conversation);
    return () => observer.disconnect();
  }, []);
  function finishAndRate() {
    if (timer.current) clearTimeout(timer.current);
    setTyping(false);
    setConnecting(false);
    dispatch({ type: "close" });
    onRate();
  }
  function chooseFile(documents: boolean) {
    if (!file.current) return;
    file.current.accept = documents ? ".pdf,.doc,.docx,.xls,.xlsx,.txt,.rtf,.odt,.csv" : "";
    file.current.click();
  }
  const latestReply = [...state.messages].reverse().find(m => m.role === "operator");
  const baseSuggestions = latestReply?.suggestions ?? (order || pendingOrder ? (state.messages.length === 1 ? ['Да, мне нужно встретить машину.', ...orderTopics] : orderTopics) : generalTopics);
  const escapeLabel = state.messages.length ? "Нет нужного варианта" : "Другое";
  const suggestions = humanConnected ? ['Добавлю подробности', ...(state.messages.some(m => m.event === 'feedback') ? [] : ['Вопрос решён'])] : [...baseSuggestions, ...(animal && !baseSuggestions.includes("Какой план лечения?") ? ["Какой план лечения?"] : []), escapeLabel];
  function connectOperator() {
    setConnecting(true);
    timer.current = setTimeout(() => {
      setConnecting(false);
      dispatch({ type: "reply", event: "connected", text: "Анна подключилась" });
      setTyping(true);
      timer.current = setTimeout(() => {
        dispatch({ type: "reply", agent: "human", text: "Здравствуйте! Я Анна. Вижу вашу переписку" + (animal ? ` по животному с биркой №${animal.tag}` : order ? ` по заказу №${order.id}` : "") + ". Повторять её не нужно. Расскажите, какой результат вы ожидаете, чтобы я могла разобраться в вопросе." });
        setTyping(false);
      }, 1900);
    }, 1200);
  }
  function send(text: string, scripted = false) {
    if (!topicChosen || typing || connecting || state.closed) return;
    if (!text.trim() && !attachments.length && !pendingOrder) return;
    const replyOrder = pendingOrder ? selectedOrder : order;
    setAttachmentMenu(false);
    setOrderPicker(false);
    if (!active && pendingOrder) dispatch({ type: "select", orderId: selected });
    const body = (active && pendingOrder ? `Заказ №${selectedOrder.id}\n` : "") + text.trim();
    setPendingOrder(false);
    if (!body.trim() && !attachments.length) return;
    if (!active && !replyOrder) dispatch({ type: "reply", text: "С чем нужна помощь? Выберите тему или напишите свой вопрос." });
    dispatch({ type: "send", text: body, attachments });
    setDraft("");
    setAttachments([]);
    const wantsTracking = !!replyOrder && isDeliveryTrackingQuestion(text);
    const wantsTreatmentPlan = !!animal && isTreatmentPlanQuestion(text);
    if (!wantsTreatmentPlan && !wantsTracking && !humanConnected && ((!scripted && ++freeTextCount.current >= 2) || ['Другое', 'Нет нужного варианта', 'Проблема осталась', 'Чек приложен', 'Хочу оформить возврат', 'Вопрос ветеринару'].includes(text) || /оператор|человек/i.test(text))) {
      connectOperator();
      return;
    }
    setTyping(true);
    timer.current = setTimeout(() => {
      if (wantsTreatmentPlan) {
        dispatch({ type: "reply", treatmentAnimalTag: animal.tag, text: "", suggestions: ['Документы по животному', 'Вопрос ветеринару', 'Спасибо, понятно'], ...(humanConnected ? { agent: "human" as const } : {}) });
      } else if (wantsTracking) {
        dispatch({ type: "reply", ...scenarioReply("Где заказ сейчас?", replyOrder), ...(humanConnected ? { agent: "human" as const } : {}) });
      } else if (humanConnected) {
        dispatch({ type: "reply", agent: "human", text: text === 'Добавлю подробности' ? 'Напишите подробности следующим сообщением. Если есть документ или скриншот, прикрепите его через скрепку.' : 'Спасибо, записала. Уточню данные по вашему обращению. Есть ли ещё детали, которые нужно учесть?' });
      } else dispatch({ type: "reply", ...((scripted) ? scenarioReply(text, replyOrder) : freeTextReply()) });
      setTyping(false);
    }, humanConnected ? 1900 : 750);
  }
  return (
    <main className={`chat-screen ${active ? "active" : "empty"}`}>
      <link rel="preload" as="image" href={asset("star")} />
      <header className="chat-header" ref={headerRef}>
        <div className="chat-header-art" aria-hidden="true">
          <img className="chat-wave" src={asset("chatWave")} alt="" />
        </div>
        <button
          className="back-button"
          onClick={() => { if (!topicChosen && area) { setArea(null); setInitialTopic(null); setSelectedAnimal(null); setPendingOrder(false); } else onBack(); }}
          aria-label={!topicChosen && area ? "К выбору темы" : "На главную"}
        >
          <Icon name="back" />
        </button>
        <div className="chat-heading">
          <h1>Чат поддержки</h1>
          <p>{connecting ? "Подключаем оператора" : humanConnected ? "Оператор Анна" : "Виртуальный помощник"}</p>
        </div>
        <button className="finish-button" disabled={state.closed} onClick={finishAndRate}>
          Завершить
        </button>
      </header>
      <div className="conversation-shell">
      <div id="support-conversation" className="conversation" ref={messages} onScroll={e => {
        const node = e.currentTarget;
        pinnedToBottom.current = node.scrollHeight - node.clientHeight - node.scrollTop < 2;
      }}>
        {animal && <div className="order-context animal-context"><div className="order-context-card"><div className="context-pig"><b>{animal.breed}</b><span>№{animal.tag}</span><img src={asset(animal.image)} alt="" /></div><div className="context-details"><p>{animal.health}</p><small>Ветеринария</small></div></div></div>}
        {order && (
          <div className="order-context">
            <div className="order-context-card">
              <div className="context-pig">
                <b>{order.breed}</b>
                <span>{order.kind === "feed" ? `${order.count} мешка` : `х${order.count}`}</span>
                <img src={asset(order.image)} alt="" />
              </div>
              <div className="context-details">
              <p>
                Уточнение срока доставки
              </p>
              <small>Заказ №{order.id}</small>
              </div>
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
          {!active ? (
            <Bubble
              message={{
                id: "welcome",
                role: "operator",
                text: topicChosen ? (area === "other" ? "С чем нужна помощь? Выберите тему или напишите свой вопрос." : "Напишите, с чем нужна помощь.") : !area ? "С чем нужна помощь: с доставкой или ветеринарией?" : area === "other" ? "Общий вопрос. Подтвердите выбор, чтобы перейти в чат." : area === "vet" ? "Выберите свинку, по которой хотите задать вопрос." : "Выберите заказ доставки поросят или корма.",
              }}
            />
          ) : (
            state.messages.map((m) => <Bubble key={m.id} message={m} onRate={onRate} reviewed={!!state.review} />)
          )}
          {connecting && <p className="operator-connected" role="status">Подключаем оператора. Переписка и вложения останутся в чате.</p>}
          {typing && (
            <div className="message operator typing" role="status" aria-label={humanConnected ? "Анна печатает" : "Помощник готовит ответ"}>
              <AnnaAvatar />
              <div className="bubble typing-bubble">
                <span className="typing-dots" aria-hidden="true"><i /><i /><i /></span>
                <img className="message-tail" src={asset("tail")} alt="" />
              </div>
            </div>
          )}
        </div>
      </div>
      <ChatScrollbar target={messages} />
      </div>
      <div className="chat-bottom">
        {attachmentMenu && !state.closed && (
          <div className="attachment-menu" id="attachment-menu" aria-label="Прикрепить к сообщению">
            <button type="button" onClick={() => { setAttachmentMenu(false); setOrderPicker(true); }}>
              <Icon name="attachmentOrder" className="attachment-order-icon" />{area === "vet" ? "Указать свинку" : "Указать заказ"}
            </button>
            <button type="button" onClick={() => setDocumentsOpen(true)}><Icon name="documents" />Ваши документы</button>
            <button type="button" onClick={() => chooseFile(false)}><Icon name="attach" />Приложить файл</button>
          </div>
        )}
        {!state.closed && !topicChosen && (!area || area === "other") && <div className="support-area-options">
          <button onClick={() => { setArea("delivery"); setInitialTopic(null); setOrderPicker(true); }}><img src={asset("landrace")} alt="" /><strong>Доставка</strong><span>Поросята и корм</span></button>
          <button className="support-area-vet" onClick={() => { setArea("vet"); setInitialTopic(null); setOrderPicker(true); }}><img src={asset("supportVet")} alt="" /><strong>Ветеринария</strong><span>Здоровье свинок</span></button>
          <button className="support-area-other" aria-label="Другое, общий вопрос" onClick={() => { setArea("other"); setInitialTopic("other"); setPendingOrder(false); setOrderPicker(false); setTopicChosen(true); }}><strong>Другое</strong></button>
        </div>}
        {!attachmentMenu && !state.closed && area && orderPicker && (
          <div
            className="order-carousel chat-orders"
            aria-label={area === "vet" ? "Выберите свинку" : "Выберите заказ"}
          >
            {(area === "vet" ? vetAnimals : supportOrders).map((o) => (
              <OrderCard
                key={o.id}
                order={o}
                mode="chat"
                animal={area === "vet"}
                selected={area === "vet" ? selectedAnimal === o.tag : topicChosen ? state.orderId === o.id : initialTopic === o.id}
                onClick={() => { if (area === "vet") { setSelectedAnimal(o.tag); if (topicChosen) { dispatch({ type: "selectAnimal", tag: o.tag }); setOrderPicker(false); } } else { setSelected(o.id); setPendingOrder(false); setInitialTopic(o.id); if (topicChosen) { dispatch({ type: "select", orderId: o.id }); setOrderPicker(false); } } }}
                
              />
            ))}
          </div>
        )}
        {state.closed ? (
          <div className="closed-chat">
            {!isRating && <p>
              Диалог завершён
              {state.review ? `. Ваша оценка: ${state.review.score} из 5` : ""}
            </p>}
            <button
              className={`primary ${isRating ? "closed-chat-rating" : ""}`}
              disabled={isRating}
              onClick={() => { dispatch({ type: "reset" }); setArea(null); setSelectedAnimal(null); freeTextCount.current = 0; setPendingOrder(false); setTopicChosen(false); setInitialTopic(null); setOrderPicker(true); setDraft(""); setAttachments([]); }}
            >
              {isRating ? "Диалог завершён" : "Начать новый диалог"}
            </button>
            {!isRating && <button
              className="secondary reopen-chat"
              onClick={() => {
                dispatch({ type: "reopen" });
                setTopicChosen(true);
                setOrderPicker(false);
                setAttachmentMenu(false);
                requestAnimationFrame(() => messageInput.current?.focus());
              }}
            >Вопрос не решён</button>}
          </div>
        ) : topicChosen ? (
          <>
            {!attachmentMenu && !!attachments.length && <div className="attachment-cards" aria-label="Прикреплённые документы">
              {attachments.map((name, index) => <AttachmentCard key={`${index}-${name}`} name={name} onRemove={() => setAttachments(names => names.filter((_, i) => i !== index))} />)}
            </div>}
            {!attachmentMenu && !orderPicker && (
              <div className="support-topics quick-replies" aria-label="Быстрые ответы">
                <p>Быстрый ответ</p>
                <div>{suggestions.map(topic => <button key={topic} type="button" className={topic === escapeLabel ? "quick-reply-secondary" : undefined} disabled={typing || connecting} onClick={() => topic === 'Вопрос решён' ? dispatch({ type: 'offerFeedback', requested: true }) : topic === 'Завершить диалог' ? finishAndRate() : send(topic, true)}>{topic}</button>)}</div>
              </div>
            )}
            {error && <p className="attachment-note" role="status">{error}</p>}
            <form
              className="composer"
              onSubmit={(e: FormEvent) => {
                e.preventDefault();
                send(draft);
              }}
            >
              <div
                className="composer-field"
                onClick={(event) => {
                  if (!(event.target as HTMLElement).closest("button")) {
                    messageInput.current?.focus();
                  }
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    const conversation = messages.current;
                    if (conversation) menuScroll.current = { pinned: conversation.scrollHeight - conversation.clientHeight - conversation.scrollTop < 2, top: conversation.scrollTop };
                    setAttachmentMenu((open) => !open);
                  }}
                  aria-label="Прикрепить файл"
                  aria-expanded={attachmentMenu}
                  aria-controls="attachment-menu"
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
                      e.target.value = "";
                      return;
                    }
                    setError("");
                    if (f) {
                      setAttachments(names => [...names, f.name]);
                      setAttachmentMenu(false);
                      setOrderPicker(false);
                    }
                    e.target.value = "";
                  }}
                />
                <InlineComposer editorRef={messageInput} value={draft} order={pendingOrder ? selectedOrder.id : undefined} files={attachments}
                  onChange={setDraft} onRemoveOrder={() => { setPendingOrder(false); setOrderPicker(false); }}
                  onRemoveFile={(index) => setAttachments(names => names.filter((_, i) => i !== index))} onSend={() => send(draft)} />
              </div>
              <button
                className="send-button"
                type="submit"
                disabled={typing || connecting || (!draft.trim() && !attachments.length && !pendingOrder)}
                aria-label={
                  active || !pendingOrder ? "Отправить сообщение" : "Обсудить выбранный заказ"
                }
              >
                <Icon name="send" />
              </button>
            </form>
          </>
        ) : area && area !== "other" ? <div className="topic-confirm">
          <button className="primary" aria-disabled={area === "vet" ? selectedAnimal === null : initialTopic === null} onClick={() => {
            if (area === "vet" ? selectedAnimal === null : initialTopic === null) return;
            setTopicChosen(true);
            setPendingOrder(false);
            if (area === "delivery") dispatch({ type: "select", orderId: selected });
            if (area === "vet" && selectedAnimal) dispatch({ type: "selectAnimal", tag: selectedAnimal });
            setOrderPicker(false);
          }}>{(area === "vet" ? selectedAnimal === null : initialTopic === null) ? (area === "vet" ? "Выберите свинку" : "Выберите заказ") : "Подтвердить"}</button>
          <button className="secondary" onClick={() => { setArea(null); setInitialTopic(null); setSelectedAnimal(null); setPendingOrder(false); setOrderPicker(false); }}>Назад</button>
        </div> : null}
      </div>
      {documentsOpen && <Documents headerRef={headerRef} onClose={() => setDocumentsOpen(false)} onSelect={(names) => {
        setAttachments(current => [...new Set([...current, ...names])]);
        setDocumentsOpen(false);
        setAttachmentMenu(false);
        setOrderPicker(false);
        setError("");
      }} />}

    </main>
  );
}
export function Rating({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (score: number, reason: string, comment: string) => void;
}) {
  const [desktop, setDesktop] = useState(() => window.matchMedia("(min-width: 700px)").matches);
  useEffect(() => {
    const media = window.matchMedia("(min-width: 700px)");
    const update = () => setDesktop(media.matches);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  const [score, setScore] = useState(0);
  const [step, setStep] = useState<"stars" | "comment">("stars");
  const [reason, setReason] = useState("");
  const [comment, setComment] = useState("");
  useEffect(() => {
    if (!new URLSearchParams(window.location.search).has("case")) return;
    const preview = (event: Event) => {
      const next = (event as CustomEvent<number>).detail;
      if (next !== 1 && next !== 2) return;
      if (next === 2) setScore(value => value || 5);
      setStep(next === 1 ? "stars" : "comment");
    };
    window.addEventListener("case:rating-step", preview);
    return () => window.removeEventListener("case:rating-step", preview);
  }, []);
  const low = score > 0 && score <= 3;
  return (
    <section
      className={`rating-card ${desktop ? "rating-unified" : step === "comment" ? "low-rating" : "rating-stars-step"}`}
      aria-label="Оценка оператора"
    >
      <Waves rating />
      <header className="rating-header">
        <button
          className="back-button"
          onClick={() => !desktop && step === "comment" ? setStep("stars") : onClose()}
          aria-label={!desktop && step === "comment" ? "Изменить оценку" : "Вернуться в чат"}
        >
          <Icon name="back" />
        </button>
        <div>
          <h1>Чат поддержки</h1>
          <p>Оператор Анна</p>
        </div>
      </header>
      {!desktop && <button
        className="rating-close"
        onClick={onClose}
        aria-label="Закрыть оценку"
      >
        <Icon name="close" />
      </button>}
      <div className="rating-body">
        <div className="rating-stars-content" aria-hidden={!desktop && step !== "stars"} inert={!desktop && step !== "stars"}>
        <div className="rating-art">
          <img src={asset("anna")} alt="Анна, оператор поддержки" />
        </div>
        <div className="rating-title">
          <div className="rating-title-row"><h2>Как прошёл диалог?</h2>{desktop && <button className="rating-close" onClick={onClose} aria-label="Закрыть оценку"><Icon name="close" /></button>}</div>
        </div>
        <div className="stars" role="group" aria-label="Оценка от 1 до 5">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              className={n <= score ? "filled" : ""}
              aria-label={`Оценка ${n} из 5`}
              aria-pressed={n === score}
              onClick={() => { setScore(n); setReason(""); }}
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
        </div>
        {(desktop || step === "comment") && (
          <div className="feedback-details">
            {!desktop && <div className="rating-title"><h2>Поделитесь впечатлениями</h2></div>}
            <div className="reason-options">
              {(low ? ["Долго ждал ответа", "Вопрос не решён", "Ответ непонятен"] : ["Быстро помогли", "Всё понятно", "Внимательный оператор"]).map(
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
              placeholder="Добавьте пару слов, если хотите"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={500}
            />
          </div>
        )}
      </div>
      <footer className="rating-footer">
        <button
          className="rating-submit"
          disabled={!score}
          onClick={() => !desktop && step === "stars" ? setStep("comment") : onSubmit(score, reason, comment)}
        >
          {!desktop && step === "stars" ? (score ? "Подтвердить" : "Выберите количество звёзд") : "Отправить оценку"}
        </button>
        <button style={{ visibility: desktop || step === "comment" ? "visible" : "hidden" }} disabled={!desktop && step !== "comment"} className="rating-skip" onClick={() => score ? onSubmit(score, "", "") : onClose()}>
          Пропустить
        </button>
      </footer>
    </section>
  );
}
