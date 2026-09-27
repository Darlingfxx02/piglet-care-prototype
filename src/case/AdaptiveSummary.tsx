import arrowRightIcon from "./assets/iconsax-arrow-right.svg";
import { AuthorLinks } from "./AuthorLinks";
import { useEffect, useRef, useState } from "react";

function Screen({ width, height, title }: { width: number; height: number; title: string }) {
  const host = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => setScale(entry.contentRect.width / width));
    if (host.current) observer.observe(host.current);
    return () => observer.disconnect();
  }, [width]);
  return <div ref={host} className="adaptive-screen">
    <iframe title={title} src="./?case=rating#/rating" style={{ width, height, transform: `scale(${scale})` }}
      onLoad={event => {
        const doc = event.currentTarget.contentDocument;
        if (doc?.documentElement) {
          const style = doc.createElement("style");
          style.textContent = `*{scrollbar-width:none}*::-webkit-scrollbar{display:none}:focus-visible{outline:none!important}${width < 700 ? 'html{--device-safe-bottom:34px}' : ''}`;
          doc.head.append(style);
        }
      }} />
  </div>;
}

export function AdaptiveSummary({ onBack, onStart, onAssignment }: { onBack: () => void; onStart: () => void; onAssignment: () => void }) {
  return <section className="adaptive-summary" aria-labelledby="adaptive-title">
    <header><button className="summary-back" onClick={onBack}><img className="back-icon" src={arrowRightIcon} alt="" />Назад</button><h1 id="adaptive-title">Адаптивные версии</h1><p>Телефон, планшет и десктоп</p></header>
    <div className="adaptive-pair">
      <figure className="adaptive-phone"><div className="adaptive-device">
        <Screen width={430} height={932} title="Мобильная версия" />
        <img src="./case/iphone-15-pro-max-natural-titanium.png" alt="iPhone 15 Pro Max" />
        <span className="adaptive-island" />
      </div><figcaption>Телефон</figcaption></figure>
      <figure className="adaptive-tablet"><div className="adaptive-device">
        <Screen width={1024} height={762} title="Планшетная версия" />
        <img src="./case/ipad-pro.png" alt="iPad Pro" />
      </div><figcaption>Планшет</figcaption></figure>
    </div>
    <figure className="adaptive-desktop"><div className="adaptive-device">
      <img src="./case/dresser-browser.svg" alt="" />
      <Screen width={1440} height={900} title="Десктопная версия" />
    </div><figcaption>Десктоп</figcaption></figure>
    <footer className="summary-author"><AuthorLinks onAssignment={onAssignment} figma /></footer>
    <button className="summary-explore" onClick={onStart}>К началу</button>
  </section>;
}
