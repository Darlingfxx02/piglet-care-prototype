import { useLayoutEffect, useRef, useState, type RefObject } from 'react';

export function ChatScrollbar({ target }: { target: RefObject<HTMLDivElement | null> }) {
  const [metrics, setMetrics] = useState({ max: 0, height: 0, thumb: 0, top: 0, value: 0 });
  const drag = useRef<{ y: number; top: number } | null>(null);
  useLayoutEffect(() => {
    const node = target.current;
    if (!node) return;
    const measure = () => {
      const height = Math.max(0, node.clientHeight - 16);
      const max = Math.max(0, node.scrollHeight - node.clientHeight);
      const thumb = Math.min(height, Math.max(32, height * node.clientHeight / node.scrollHeight));
      setMetrics({ max, height, thumb, top: max ? node.scrollTop / max * (height - thumb) : 0, value: node.scrollTop });
    };
    const resize = new ResizeObserver(measure);
    resize.observe(node);
    Array.from(node.children).forEach(child => resize.observe(child));
    const mutations = new MutationObserver(() => {
      Array.from(node.children).forEach(child => resize.observe(child));
      measure();
    });
    mutations.observe(node, { childList: true, subtree: true, characterData: true });
    node.addEventListener('scroll', measure);
    measure();
    return () => { resize.disconnect(); mutations.disconnect(); node.removeEventListener('scroll', measure); };
  }, [target]);
  if (metrics.max <= 1) return null;
  return <div className="chat-scrollbar" role="scrollbar" tabIndex={0} aria-label="Прокрутка переписки" aria-controls="support-conversation" aria-orientation="vertical" aria-valuemin={0} aria-valuemax={metrics.max} aria-valuenow={Math.round(metrics.value)}
    onPointerDown={e => {
      e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId);
      const y = e.clientY - e.currentTarget.getBoundingClientRect().top;
      if (y < metrics.top || y > metrics.top + metrics.thumb) target.current!.scrollTop = (y - metrics.thumb / 2) / (metrics.height - metrics.thumb) * metrics.max;
      drag.current = { y: e.clientY, top: target.current!.scrollTop };
    }}
    onPointerMove={e => { if (drag.current && metrics.height > metrics.thumb) target.current!.scrollTop = drag.current.top + (e.clientY - drag.current.y) / (metrics.height - metrics.thumb) * metrics.max; }}
    onPointerUp={() => { drag.current = null; }} onLostPointerCapture={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }}
    onKeyDown={e => {
      const offsets: Record<string, number> = { ArrowDown: 40, ArrowUp: -40, PageDown: target.current!.clientHeight, PageUp: -target.current!.clientHeight, Home: -metrics.max, End: metrics.max };
      if (e.key in offsets) { e.preventDefault(); target.current!.scrollTop += offsets[e.key]; }
    }}><span style={{ height: metrics.thumb, transform: `translateY(${metrics.top}px)` }} /></div>;
}
