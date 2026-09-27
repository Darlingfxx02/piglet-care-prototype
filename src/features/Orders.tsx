import { asset } from "../shared/assets";
import { Icon } from "../shared/UI";
import type { Order } from "../domain/demo";
import { useLayoutEffect, useRef, useState, type CSSProperties } from "react";

function AnimalStatus({ text, selected }: { text: string; selected: boolean }) {
  const viewport = useRef<HTMLSpanElement>(null);
  const content = useRef<HTMLSpanElement>(null);
  const [overflow, setOverflow] = useState(0);
  useLayoutEffect(() => {
    const measure = () => {
      if (viewport.current && content.current)
        setOverflow(Math.max(0, content.current.scrollWidth - viewport.current.clientWidth));
    };
    const observer = new ResizeObserver(measure);
    observer.observe(viewport.current!);
    observer.observe(content.current!);
    measure();
    return () => observer.disconnect();
  }, [text]);
  return <span ref={viewport} title={text} className={`animal-status ${overflow > 0 ? 'is-overflowing' : ''} ${overflow > 0 && selected ? 'is-scrolling' : ''}`}
    style={{ '--status-distance': `${-overflow}px`, '--status-duration': `${Math.max(3, overflow / 18 + 2)}s` } as CSSProperties}>
    <span ref={content}>{text}</span>
  </span>;
}
export function OrderCard({
  disabled = false,
  order,
  onClick,
  selected = false,
  mode = "delivery",
  other = false,
  animal = false,
}: {
  disabled?: boolean;
  other?: boolean;
  animal?: boolean;
  order: Order;
  onClick: () => void;
  selected?: boolean;
  mode?: "delivery" | "chat" | "health";
}) {
  return (
    <button
      disabled={disabled}
      className={`order-card ${selected ? "selected" : ""} ${mode} ${other ? "other-topic" : ""}`}
      onClick={onClick}
      aria-pressed={mode === "chat" ? selected : undefined}
      aria-label={other ? "Другое, вопрос без заказа" : `${order.breed}, ${(mode === "health" || animal) ? "бирка №" + order.tag : "заказ №" + order.id}`}
    >
      {mode === "chat" && (
        <svg className="selection-ring" viewBox="0 0 110 126" aria-hidden="true">
          <path d="M55 1 H18 A17 17 0 0 0 1 18 V108 A17 17 0 0 0 18 125 H55" pathLength="1" />
          <path d="M55 1 H92 A17 17 0 0 1 109 18 V108 A17 17 0 0 1 92 125 H55" pathLength="1" />
        </svg>
      )}
      <span className="order-surface">
        <span className="order-breed">{other ? "Другое" : order.breed}</span>
        {mode === "health" ? (
          <span className="ear-tag">№{order.tag}</span>
        ) : (
          <span className="order-count">{other ? "\u00a0" : animal ? `№${order.tag}` : order.kind === "feed" ? `${order.count} мешка` : `х${order.count}`}</span>
        )}
        <img className="order-pig" src={asset(other ? "otherQuestion" : order.image)} alt="" />
      </span>
      <span className="order-status">
        {!other && !animal && mode !== "health" && <Icon name="truck" />}
        {other ? "Общий вопрос" : (mode === "health" || animal)
          ? <AnimalStatus text={order.health} selected={selected} />
          : mode === "chat"
            ? "№" + order.id
            : order.date}
      </span>
    </button>
  );
}
