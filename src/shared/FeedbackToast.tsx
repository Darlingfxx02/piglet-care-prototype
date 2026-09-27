import { useLayoutEffect, useState } from 'react';
import { asset } from './assets';

export function FeedbackToast({ onDismiss, score }: { onDismiss: () => void; score: number }) {
  const [top, setTop] = useState(0);
  useLayoutEffect(() => {
    const header = document.querySelector<HTMLElement>(window.innerWidth >= 700 ? '.desktop-nav' : '.chat-header');
    const measure = () => setTop(header?.getBoundingClientRect().bottom ?? 0);
    const observer = new ResizeObserver(measure);
    if (header) observer.observe(header);
    window.addEventListener('resize', measure);
    measure();
    return () => { observer.disconnect(); window.removeEventListener('resize', measure); };
  }, []);
  return <div className="feedback-toast-slot" style={{ top }}><div className="feedback-toast" role="status"><img className="feedback-toast-heart" src={score <= 3 ? asset("feedbackBrokenHeart") : asset("feedbackHeart")} alt="" /><span>{score <= 3 ? "Жаль, что качество поддержки вас не устроило. Спасибо за обратную связь" : "Спасибо! Ваш отзыв помогает нам стать лучше"}</span><button type="button" className="feedback-toast-close" aria-label="Закрыть уведомление" onClick={onDismiss}><svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="m1.5 1.5 9 9m0-9-9 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg></button></div></div>;
}
