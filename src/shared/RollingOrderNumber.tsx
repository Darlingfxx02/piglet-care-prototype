import { useLayoutEffect, useRef } from 'react';

function RollingDigit({ value }: { value: string }) {
  const current = useRef<HTMLSpanElement>(null);
  const outgoing = useRef<HTMLSpanElement>(null);
  const previous = useRef(value);

  useLayoutEffect(() => {
    const old = previous.current;
    previous.current = value;
    if (old === value || !current.current || !outgoing.current) return;
    outgoing.current.textContent = old;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const direction = Math.random() < 0.5 ? -1 : 1;
    const options = { duration: 460, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' };
    const animations = [
      outgoing.current.animate([
        { transform: 'translateY(0)', opacity: 1 },
        { transform: `translateY(${direction * 100}%)`, opacity: 0 },
      ], options),
      current.current.animate([
        { transform: `translateY(${-direction * 100}%)`, opacity: 0 },
        { transform: 'translateY(0)', opacity: 1 },
      ], options),
    ];
    return () => animations.forEach(animation => animation.cancel());
  }, [value]);

  return (
    <span className="rolling-digit" data-empty={!value}>
      <span ref={outgoing} className="rolling-digit-outgoing" />
      <span ref={current}>{value}</span>
    </span>
  );
}

export function RollingOrderNumber({ value }: { value: string }) {
  return (
    <div className="rolling-order" role="status" aria-live="polite" aria-atomic="true">
      <span className="sr-only">Выбран заказ №{value}</span>
      <span className="rolling-order-visual" aria-hidden="true">
        <span>заказ №</span>
        <span className="rolling-digits">
          {Array.from(value.padEnd(5, ' ')).map((digit, index) => (
            <RollingDigit key={index} value={digit.trim()} />
          ))}
        </span>
      </span>
    </div>
  );
}
