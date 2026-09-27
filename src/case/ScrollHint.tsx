import { useEffect, useRef, useState, type RefObject } from "react";

export function ScrollHint({ target, revision }: { target: RefObject<HTMLElement | null>; revision: string }) {
  const [thumb, setThumb] = useState({ x: 0, y: 0, height: 0, visible: false });
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => {
    const node = target.current;
    if (!node) return;
    const measure = (scrolling = false) => {
      const rect = node.getBoundingClientRect();
      const overflow = node.scrollHeight - node.clientHeight;
      const track = Math.max(0, rect.height - 16);
      const height = Math.min(track, Math.max(28, track * node.clientHeight / node.scrollHeight));
      setThumb({ x: rect.right - 5, y: rect.top + 8 + (overflow > 0 ? node.scrollTop / overflow * (track - height) : 0), height, visible: scrolling && overflow > 1 });
    };
    const onScroll = () => {
      measure(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setThumb(value => ({ ...value, visible: false })), 650);
    };
    const resize = new ResizeObserver(() => measure());
    resize.observe(node);
    measure();
    node.addEventListener("scroll", onScroll, { passive: true });
    return () => { resize.disconnect(); node.removeEventListener("scroll", onScroll); clearTimeout(timer.current); };
  }, [target, revision]);
  return <span aria-hidden="true" className="scroll-hint" style={{ left: thumb.x, top: thumb.y, height: thumb.height, opacity: thumb.visible ? 1 : 0 }} />;
}
