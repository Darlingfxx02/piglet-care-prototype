import { useEffect, useRef, type ReactNode, type CSSProperties } from "react";
import { asset, type AssetName } from "./assets";
export function Icon({
  name,
  className = "",
}: {
  name: AssetName;
  className?: string;
}) {
  return (
    <span className={`icon ${className}`} aria-hidden="true">
      <img src={asset(name)} alt="" />
    </span>
  );
}
export function Waves({ rating = false }: { rating?: boolean }) {
  return (
    <div className="waves" aria-hidden="true">
      <img
        className="wave wave-one"
        src={asset(rating ? "ratingWave1" : "wave1")}
        alt=""
      />
      <img
        className="wave wave-two"
        src={asset(rating ? "ratingWave2" : "wave2")}
        alt=""
      />
      <img
        className="wave wave-three"
        src={asset(rating ? "ratingWave2" : "wave2")}
        alt=""
      />
    </div>
  );
}
export function Modal({
  title,
  children,
  onClose,
  className = "",
  style,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  className?: string;
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    const previous = document.activeElement as HTMLElement;
    dialog?.showModal();
    return () => {
      dialog?.close();
      previous?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={`modal ${className}`}
      style={style}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          const r = e.currentTarget.getBoundingClientRect();
          if (
            e.clientX < r.left ||
            e.clientX > r.right ||
            e.clientY < r.top ||
            e.clientY > r.bottom
          )
            onClose();
        }
      }}
      aria-label={title}
    >
      <button className="modal-close" onClick={onClose} aria-label="Закрыть">
        <Icon name="close" />
      </button>
      <h2>{title}</h2>
      {children}
    </dialog>
  );
}
export function AnnaAvatar() {
  return (
    <span className="anna-avatar">
      <img src={asset("annaAvatar")} alt="Анна, оператор поддержки" />
    </span>
  );
}
