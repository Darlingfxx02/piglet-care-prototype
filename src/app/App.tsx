import { useEffect, useReducer, useRef, useState } from "react";
import { DesktopNav, Home, type Panel } from "../features/Home";
import { Support, Rating } from "../features/Support";
import { OrderCard } from "../features/Orders";
import {
  findOrders,
  orders,
  readSupport,
  supportReducer,
  STORAGE_KEY,
  type Order,
} from "../domain/demo";
import { Modal } from "../shared/UI";
import { asset } from "../shared/assets";
const currentRoute = () =>
  location.hash.startsWith("#/support")
    ? "support"
    : location.hash.startsWith("#/rating")
      ? "rating"
      : "home";
export default function App() {
  const [route, setRoute] = useState(currentRoute);
  const [state, dispatch] = useReducer(supportReducer, undefined, () =>
    readSupport(localStorage),
  );
  const [panel, setPanel] = useState<Panel>(null);
  const [detail, setDetail] = useState<Order | null>(null);
  const [query, setQuery] = useState("");
  const [success, setSuccess] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const ratingDialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (route === "rating") ratingDialog.current?.showModal();
  }, [route]);
  useEffect(() => {
    const fn = () => {
      setRoute(currentRoute());
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", fn);
    return () => window.removeEventListener("hashchange", fn);
  }, []);
  useEffect(() => {
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
      <DesktopNav {...props} onHome={() => navigate("home")} />
      {route === "home" ? (
        <Home {...props} />
      ) : (
        <Support
          state={state}
          dispatch={dispatch}
          onBack={() => navigate("home")}
          onRate={() => navigate("rating")}
        />
      )}
      {route === "rating" && (
        <dialog
          ref={ratingDialog}
          className="rating-layer"
          aria-label="Оценка оператора"
          onCancel={(e) => {
            e.preventDefault();
            navigate("support");
          }}
        >
          <Rating
            onClose={() => navigate("support")}
            onSkip={() => {
              dispatch({ type: "close" });
              navigate("home");
            }}
            onSubmit={(score, reason, comment) => {
              dispatch({ type: "review", review: { score, reason, comment } });
              navigate("support");
              setSuccess(true);
            }}
          />
        </dialog>
      )}
      {success && (
        <Modal title="Спасибо за оценку!" onClose={() => setSuccess(false)}>
          <img className="success-star" src={asset("star")} alt="" />
          <p>
            Вы оценили работу Анны на {state.review?.score} из 5. В этом
            прототипе отзыв сохранён только на вашем устройстве.
          </p>
          <button
            className="primary"
            onClick={() => {
              setSuccess(false);
              navigate("home");
            }}
          >
            На главную
          </button>
        </Modal>
      )}
      {detail && (
        <Modal
          title={`${detail.breed} · №${detail.id}`}
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
              about: "О прототипе",
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
                О прототипе
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
                В тестовом прототипе можно изучить доставку и обратиться в
                поддержку. Покупка товаров пока недоступна.
              </p>
              <button className="primary" onClick={() => navigate("support")}>
                Спросить о корме
              </button>
            </>
          )}
          {panel === "vet" && (
            <>
              <p>
                Текущие задачи в демонстрационном хозяйстве. Животных можно
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
                        {o.breed} · №{o.tag}
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
              <p>
                Интерактивный прототип тестового задания. Данные о животных,
                заказах и доставке демонстрационные.
              </p>
              <p>
                Чат отвечает по локальному сценарию. Сообщения, вложения и
                оценки не отправляются оператору или на сервер.
              </p>
              <p>
                Переписка и оценка сохраняются в браузере. Покупка и запись к
                ветеринару не подключены.
              </p>
              <button
                className="secondary"
                onClick={() => {
                  dispatch({ type: "reset" });
                  setPanel(null);
                  navigate("home");
                }}
              >
                Сбросить демонстрацию
              </button>
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
