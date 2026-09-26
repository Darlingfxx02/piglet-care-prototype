import { useRef, useState } from "react";
import { orders, type Order } from "../domain/demo";
import { asset } from "../shared/assets";
import { Icon, Waves } from "../shared/UI";
import { OrderCard } from "./Orders";
export type Panel =
  | "notifications"
  | "profile"
  | "shop"
  | "vet"
  | "feed"
  | "orders"
  | "about"
  | null;
interface Props {
  onSupport: () => void;
  onPanel: (p: Panel) => void;
  onOrder: (o: Order) => void;
  query: string;
  setQuery: (s: string) => void;
  onSearch: () => void;
}
export function Search({
  query,
  setQuery,
  onSearch,
}: {
  query: string;
  setQuery: (s: string) => void;
  onSearch: () => void;
}) {
  return (
    <form
      className="search"
      onSubmit={(e) => {
        e.preventDefault();
        onSearch();
      }}
      role="search"
    >
      <Icon name="search" />
      <input
        aria-label="Найти заказ"
        placeholder="Найти заказ по номеру"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <button className="sr-only" type="submit">
        Найти
      </button>
    </form>
  );
}
export function SupportButton({ onClick }: { onClick: () => void }) {
  return (
    <button className="support-button" onClick={onClick}>
      <Icon name="support" />
      Поддержка
    </button>
  );
}
function Bell({ onClick }: { onClick: () => void }) {
  return (
    <button
      className="bell"
      onClick={onClick}
      aria-label="Уведомления, 2 новых"
    >
      <Icon name="bell" />
      <span className="badge">2</span>
    </button>
  );
}
export function DesktopNav(p: Props & { onHome: () => void }) {
  return (
    <header className="desktop-nav">
      <div className="desktop-links">
        <button className="nav-home" onClick={p.onHome} aria-label="Главная">
          <Icon name="desktopHome" />
        </button>
        <button className="nav-shop" onClick={() => p.onPanel("shop")}>
          <span className="snout">
            <img src={asset("snout")} alt="" />
          </span>
          Магазин
        </button>
      </div>
      <button className="tablet-menu" onClick={() => p.onPanel("profile")}>
        <span className="menu-lines" />
        Меню
      </button>
      <Search {...p} />
      <SupportButton onClick={p.onSupport} />
      <Bell onClick={() => p.onPanel("notifications")} />
      <button
        className="avatar-button"
        onClick={() => p.onPanel("profile")}
        aria-label="Профиль Марии"
      >
        <img src={asset("avatar")} alt="" />
      </button>
    </header>
  );
}
function Bars({ feed = false }: { feed?: boolean }) {
  const values = feed ? [62, 55, 49, 42, 36, 30, 24] : [37, 47, 55, 69, 81];
  return (
    <span
      className={`bars ${feed ? "feed-bars" : ""}`}
      role="img"
      aria-label={
        feed ? "Запас корма постепенно уменьшается" : "Средний вес растёт"
      }
    >
      {values.map((v, i) => (
        <i
          key={i}
          style={{
            height: v,
            opacity: i === values.length - 1 ? 1 : 0.35 + i * 0.09,
          }}
        />
      ))}
    </span>
  );
}
export function Statistics() {
  const [slide, setSlide] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  return (
    <section className="herd-section">
      <div className="section-heading">
        <h2>Мой скот</h2>
        <div className="carousel-dots" aria-label="Показатели скота">
          {["Поголовье", "Средний вес", "Запас корма"].map((s, i) => (
            <button
              key={s}
              aria-label={s}
              aria-current={slide === i}
              onClick={() =>
                ref.current?.children[i].scrollIntoView({
                  behavior: "smooth",
                  block: "nearest",
                  inline: "start",
                })
              }
            />
          ))}
        </div>
      </div>
      <div
        className="stat-carousel"
        ref={ref}
        onScroll={(e) => {
          const el = e.currentTarget;
          setSlide(Math.round(el.scrollLeft / (el.clientWidth + 12)));
        }}
      >
        <article className="stat-card head-count">
          <div className="stat-label">голов на учёте</div>
          <strong className="stat-value">15</strong>
          <div className="stat-growth">
            <b>+25%</b>
            <span>к прошлому году</span>
          </div>
          <div className="herd-pig">
            <img src={asset("herdBase")} alt="" />
            <img src={asset("herd")} alt="" />
          </div>
        </article>
        <article className="stat-card">
          <div className="stat-top">
            <span className="stat-label">Средний вес</span>
            <span className="stat-hint weight-hint">+3,2 кг за месяц</span>
          </div>
          <div className="stat-bottom">
            <strong>
              28,4 <small>кг</small>
            </strong>
            <Bars />
          </div>
        </article>
        <article className="stat-card">
          <div className="stat-top">
            <span className="stat-label">Запас корма</span>
            <span className="stat-hint">при текущем расходе</span>
          </div>
          <div className="stat-bottom">
            <strong>
              7 <small>дней</small>
            </strong>
            <Bars feed />
          </div>
        </article>
      </div>
    </section>
  );
}
export function Home(p: Props) {
  return (
    <>
      <header className="mobile-hero">
        <Waves />
        <div className="mobile-profile-row">
          <button className="user-name" onClick={() => p.onPanel("profile")}>
            <img src={asset("avatar")} alt="" />
            <span>Мария</span>
          </button>
          <SupportButton onClick={p.onSupport} />
          <Bell onClick={() => p.onPanel("notifications")} />
        </div>
        <Search {...p} />
        <section className="mobile-orders">
          <h2>Доставки</h2>
          <div className="order-carousel">
            {orders.map((o) => (
              <OrderCard key={o.id} order={o} onClick={() => p.onOrder(o)} />
            ))}
          </div>
        </section>
        <button className="view-all" onClick={() => p.onPanel("orders")}>
          Посмотреть все
          <Icon name="down" />
        </button>
      </header>
      <main className="home-content">
        <button
          className="delivery-summary"
          onClick={() => p.onPanel("orders")}
        >
          <img src={asset("landrace")} alt="" />
          <span>
            <b>Ожидается 4 доставки</b>
            <small>
              Ближайшая: <Icon name="truck" />
              28.09.2026
            </small>
          </span>
          <i>4</i>
          <Icon name="chevron" className="right" />
        </button>
        <Statistics />
        <button className="observation" onClick={() => p.onPanel("vet")}>
          <img src={asset("vet")} alt="" />
          <span>
            <b>Под наблюдением</b>
            <small>№018 · контроль веса&nbsp;&nbsp; №071 · осмотр</small>
          </span>
          <i>2</i>
          <Icon name="chevron" className="right" />
        </button>
        <section className="veterinary-section">
          <h2>Ветеринария</h2>
          <div className="animal-grid">
            {orders.map((o) => (
              <OrderCard
                key={o.id}
                order={o}
                mode="health"
                onClick={() => p.onOrder(o)}
              />
            ))}
          </div>
        </section>
        <section className="offers-section">
          <h2>Вам пригодится</h2>
          <div className="offers">
            <button className="offer" onClick={() => p.onPanel("feed")}>
              <b>Корм и уход</b>
              <span>
                Наборы
                <br />к приезду
              </span>
              <img src={asset("feed")} alt="" />
            </button>
            <button
              className="offer vet-offer"
              onClick={() => p.onPanel("vet")}
            >
              <b>Ветеринар рядом</b>
              <span>
                Помощь
                <br />в здоровье
              </span>
              <img src={asset("calendar")} alt="" />
            </button>
          </div>
        </section>
        <button className="demo-link" onClick={() => p.onPanel("about")}>
          О прототипе
        </button>
      </main>
      <nav className="bottom-nav" aria-label="Основная навигация">
        <button aria-current="page">
          <Icon name="home" />
          <span>Главная</span>
        </button>
        <button onClick={() => p.onPanel("shop")}>
          <span className="snout">
            <img src={asset("snout")} alt="" />
          </span>
          <span>Магазин</span>
        </button>
        <button onClick={() => p.onPanel("profile")}>
          <Icon name="profile" />
          <span>Профиль</span>
        </button>
      </nav>
    </>
  );
}
