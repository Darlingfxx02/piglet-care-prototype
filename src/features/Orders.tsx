import { asset } from "../shared/assets";
import { Icon } from "../shared/UI";
import type { Order } from "../domain/demo";
export function OrderCard({
  order,
  onClick,
  selected = false,
  mode = "delivery",
}: {
  order: Order;
  onClick: () => void;
  selected?: boolean;
  mode?: "delivery" | "chat" | "health";
}) {
  return (
    <button
      className={`order-card ${selected ? "selected" : ""} ${mode}`}
      onClick={onClick}
      aria-pressed={mode === "chat" ? selected : undefined}
      aria-label={`${order.breed}, ${mode === "health" ? "бирка №" + order.tag : "заказ №" + order.id}`}
    >
      <span className="order-surface">
        <span className="order-breed">{order.breed}</span>
        {mode === "health" ? (
          <span className="ear-tag">№{order.tag}</span>
        ) : (
          <span className="order-count">х{order.count}</span>
        )}
        <img className="order-pig" src={asset(order.image)} alt="" />
      </span>
      <span className="order-status">
        {mode !== "health" && <Icon name="truck" />}
        {mode === "health"
          ? order.health
          : mode === "chat"
            ? "№" + order.id
            : order.date}
      </span>
    </button>
  );
}
