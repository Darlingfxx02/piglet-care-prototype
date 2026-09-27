import { useEffect, useLayoutEffect, useReducer, useRef, useState } from "react";
import { DesktopNav, Home, type Panel } from "../features/Home";
import { Support, Rating } from "../features/Support";
import { OrderCard } from "../features/Orders";
import {
  findOrders,
  orders,
  readSupport,
  supportReducer,
  STORAGE_KEY,
  initialSupport,
  type Order,
} from "../domain/demo";
const caseScenario = new URLSearchParams(location.search).get("case");
function initialCaseState() {
  if (caseScenario === "delivery") {
    const selected = supportReducer(initialSupport, { type: "select", orderId: "748" });
    return selected;
  }
  if (caseScenario === "vet") {
    const selected = supportReducer(initialSupport, { type: "selectAnimal", tag: "018" });
    return supportReducer(selected, { type: "reply", text: "", treatmentAnimalTag: "018" });
  }
  if (caseScenario === "rating") return supportReducer(supportReducer(initialSupport, { type: "select", orderId: "748" }), { type: "close" });
  return { ...initialSupport };
}
import { Modal, Waves } from "../shared/UI";
import { FeedbackToast } from "../shared/FeedbackToast";
import { asset } from "../shared/assets";
const currentRoute = () =>
  location.hash.startsWith("#/support")
    ? "support"
    : location.hash.startsWith("#/rating")
      ? "rating"
      : "home";
export default function App() {
  const [route, setRoute] = useState(currentRoute);
  const [mobileNotice, setMobileNotice] = useState(() => window.top === window.self &&
    (matchMedia('(max-width: 699px)').matches || matchMedia('(pointer: coarse) and (max-height: 500px)').matches));
  useEffect(() => {
    if (!mobileNotice) return;
    const timer = window.setTimeout(() => setMobileNotice(false), 8000);
    return () => window.clearTimeout(timer);
  }, [mobileNotice]);
  const [state, dispatch] = useReducer(supportReducer, undefined, () =>
    caseScenario ? initialCaseState() : readSupport(localStorage),
  );
  const [caseRevision, setCaseRevision] = useState(0);
  const [panel, setPanel] = useState<Panel>(null);
  const [detail, setDetail] = useState<Order | null>(null);
  const [query, setQuery] = useState("");
  const [feedbackToast, setFeedbackToast] = useState(false);
  useEffect(() => {
    if (!feedbackToast) return;
    const timer = window.setTimeout(() => setFeedbackToast(false), 4000);
    return () => clearTimeout(timer);
  }, [feedbackToast]);
  const [storageError, setStorageError] = useState(false);
  const ratingDialog = useRef<HTMLDialogElement>(null);
  useLayoutEffect(() => {
    if (route !== "rating") return;
    const viewport = window.matchMedia("(min-width: 700px)");
    const showRating = () => {
      const dialog = ratingDialog.current;
      if (!dialog) return;
      if (dialog.open) dialog.close();
      if (viewport.matches) dialog.show();
      else dialog.showModal();
      dialog.focus({ preventScroll: true });
    };
    showRating();
    viewport.addEventListener("change", showRating);
    return () => viewport.removeEventListener("change", showRating);
  }, [route, caseRevision]);
  useEffect(() => {
    const fn = () => {
      setRoute(currentRoute());
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", fn);
    return () => window.removeEventListener("hashchange", fn);
  }, []);
  useEffect(() => {
    if (caseScenario) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      setStorageError(true);
    }
  }, [state]);
  useEffect(() => {
    document.title = `${route === "home" ? "Личный кабинет" : route === "rating" ? "Оценка оператора" : "Чат поддержки"} | Поросята`;
  }, [route]);
  function navigate(to: "home" | "support" | "rating") {
    location.hash = "/" + to;
    setRoute(to);
    setPanel(null);
    setDetail(null);
  }
  useEffect(() => {
    if (!caseScenario || window.parent === window) return;
    const resetCase = (event: Event) => {
      const { seed, route: nextRoute } = (event as CustomEvent).detail ?? {};
      if (!["home", "support", "delivery", "vet", "rating"].includes(seed) || !["home", "support", "rating"].includes(nextRoute)) return;
      dispatch({ type: "reset" });
      if (seed === "delivery" || seed === "rating") dispatch({ type: "select", orderId: "748" });
      if (seed === "vet") {
        dispatch({ type: "selectAnimal", tag: "018" });
        dispatch({ type: "reply", text: "", treatmentAnimalTag: "018" });
      }
      if (seed === "rating") dispatch({ type: "close" });
      setCaseRevision(n => n + 1);
      setFeedbackToast(false);
      navigate(nextRoute);
    };
    window.addEventListener("case:reset", resetCase);
    return () => window.removeEventListener("case:reset", resetCase);
  }, []);
  const props = {
    onSupport: () => navigate("support"),
    onPanel: setPanel,
    onOrder: setDetail,
    query,
    setQuery,
    onSearch: () => setPanel("orders"),
  };
  return (
    <div className={`app route-${route}`}>
      {mobileNotice && <div className="mobile-case-notice" role="status">
        <span>Для полного просмотра кейса откройте его на компьютере</span>
        <button aria-label="Закрыть уведомление" onClick={() => setMobileNotice(false)}>
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="m4 4 8 8M12 4l-8 8" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
        </button>
      </div>}
      {route === "rating" && <div className="rating-shared-background" aria-hidden="true"><Waves rating /></div>}
      <DesktopNav {...props} onHome={() => navigate("home")} />
      {route === "home" ? (
        <Home {...props} />
      ) : (
        <Support
          key={caseRevision}
          isRating={route === "rating"}
          state={state}
          dispatch={dispatch}
          onBack={() => navigate("home")}
          onRate={() => navigate("rating")}
        />
      )}
      {route === "rating" && (
        <dialog
          ref={ratingDialog}
          tabIndex={-1}
          autoFocus
          className="rating-layer"
          aria-label="Оценка оператора"
          onCancel={(e) => {
            e.preventDefault();
            navigate("support");
          }}
        >
          <Rating
            key={caseRevision}
            onClose={() => navigate("support")}
            onSubmit={(score, reason, comment) => {
              dispatch({ type: "review", review: { score, reason, comment } });
              setFeedbackToast(true);
              navigate("support");
            }}
          />
        </dialog>
      )}
      {feedbackToast && route === "support" && <FeedbackToast score={state.review?.score ?? 5} onDismiss={() => setFeedbackToast(false)} />}
      {detail && (
        <Modal
          title={`${detail.breed}, заказ №${detail.id}`}
          onClose={() => setDetail(null)}
        >
          <div className="detail-top">
            <img src={asset(detail.image)} alt={detail.breed} />
            <div>
              <b>{detail.count} головы</b>
              <p>
                Ожидаем {detail.dateText}
                <br />с 12:00 до 16:00
              </p>
              <span className="pill">Готовится к доставке</span>
            </div>
          </div>
          <dl>
            <div>
              <dt>Идентификатор животного</dt>
              <dd>Бирка №{detail.tag}</dd>
            </div>
            <div>
              <dt>Ветеринария</dt>
              <dd>{detail.health}</dd>
            </div>
          </dl>
          <button
            className="primary"
            onClick={() => {
              dispatch({ type: "select", orderId: detail.id });
              navigate("support");
            }}
          >
            Задать вопрос об этом заказе
          </button>
        </Modal>
      )}
      {panel && (
        <Modal
          title={
            {
              notifications: "Уведомления",
              profile: "Мария",
              shop: "Магазин",
              vet: "Забота о животных",
              feed: "Корм и уход",
              orders: "Мои доставки",
              about: "О приложении",
            }[panel]
          }
          onClose={() => setPanel(null)}
        >
          {panel === "orders" && (
            <>
              <form
                className="panel-search"
                onSubmit={(e) => e.preventDefault()}
              >
                <input
                  aria-label="Поиск в доставках"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Номер заказа или порода"
                />
              </form>
              <div className="panel-orders">
                {findOrders(query).map((o) => (
                  <OrderCard
                    key={o.id}
                    order={o}
                    onClick={() => {
                      setPanel(null);
                      setDetail(o);
                    }}
                  />
                ))}
              </div>
              {!findOrders(query).length && (
                <div className="empty-results">
                  <h3>Заказ не найден</h3>
                  <p>Проверьте номер или попробуйте название породы.</p>
                  <button className="secondary" onClick={() => setQuery("")}>
                    Показать все заказы
                  </button>
                </div>
              )}
            </>
          )}
          {panel === "notifications" && (
            <div className="notification-list">
              <button
                onClick={() => {
                  setPanel(null);
                  setDetail(orders[0]);
                }}
              >
                <b>Заказ №3205 готовится к доставке</b>
                <span>Ландрас, 3 головы. Ожидаем 28 сентября.</span>
              </button>
              <button onClick={() => setPanel("vet")}>
                <b>Напоминание об осмотре</b>
                <span>Животное с биркой №018 ждёт осмотра.</span>
              </button>
            </div>
          )}
          {panel === "profile" && (
            <>
              <div className="profile-info">
                <img src={asset("avatar")} alt="" />
                <div>
                  <h3>Мария</h3>
                  <p>15 животных на учёте</p>
                </div>
              </div>
              <button className="menu-row" onClick={() => setPanel("orders")}>
                Мои доставки
              </button>
              <button className="menu-row" onClick={() => navigate("support")}>
                История поддержки
              </button>
              <button className="menu-row" onClick={() => setPanel("about")}>
                О приложении
              </button>
            </>
          )}
          {(panel === "shop" || panel === "feed") && (
            <>
              <div className="detail-top">
                <img src={asset("feed")} alt="Корм" />
                <div>
                  <h3>Корм и уход</h3>
                  <p>Наборы к приезду поросят</p>
                  <span className="pill">В разработке</span>
                </div>
              </div>
              <p>
                Покупка товаров пока недоступна. По вопросам корма и ухода
                напишите в поддержку.
              </p>
              <button className="primary" onClick={() => navigate("support")}>
                Спросить о корме
              </button>
            </>
          )}
          {panel === "vet" && (
            <>
              <p>
                Текущие задачи вашего хозяйства. Животных можно
                отличить по номеру ушной бирки.
              </p>
              <div className="health-list">
                {orders.map((o) => (
                  <button
                    key={o.id}
                    onClick={() => {
                      setPanel(null);
                      setDetail(o);
                    }}
                  >
                    <img src={asset(o.image)} alt="" />
                    <span>
                      <b>
                        {o.breed}<span className="metadata-secondary">Бирка №{o.tag}</span>
                      </b>
                      <small>{o.health}</small>
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}
          {panel === "about" && (
            <>
              <p>Доставки, документы и забота о ваших животных в одном приложении.</p>
              <p>Отслеживайте заказы и обращайтесь в поддержку по любому вопросу.</p>
            </>
          )}
        </Modal>
      )}
      {storageError && (
        <p role="status" className="storage-warning">
          Браузер не позволяет сохранить историю. Она доступна до перезагрузки.
        </p>
      )}
    </div>
  );
}
