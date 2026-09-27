import { syncFocusScroll } from "./focus";
export async function swipeTo(
  carousel: HTMLElement,
  item: HTMLElement,
  signal: AbortSignal,
  timelineNow: () => number = () => performance.now(),
) {
  const doc = carousel.ownerDocument;
  const win = doc.defaultView!;
  const r = carousel.getBoundingClientRect();
  const target = item.getBoundingClientRect();
  const from = carousel.scrollLeft;
  const desired = Math.max(
    0,
    Math.min(
      carousel.scrollWidth - carousel.clientWidth,
      from + target.left - r.left - (r.width - target.width) / 2,
    ),
  );
  const computed = win.getComputedStyle(carousel);
  const inset = parseFloat(computed.scrollPaddingLeft) || 0;
  const maxScroll = carousel.scrollWidth - carousel.clientWidth;
  const stops = Array.from(carousel.children, (child) =>
    Math.max(
      0,
      Math.min(
        maxScroll,
        from + child.getBoundingClientRect().left - r.left - inset,
      ),
    ),
  );
  const to = stops.reduce(
    (best, stop) =>
      Math.abs(stop - desired) < Math.abs(best - desired) ? stop : best,
    stops[0] ?? desired,
  );
  const oldSnap = carousel.style.scrollSnapType;
  const oldBehavior = carousel.style.scrollBehavior;
  carousel.style.scrollSnapType = "none";
  carousel.style.scrollBehavior = "auto";
  const restore = () => {
    carousel.style.scrollSnapType = oldSnap;
    carousel.style.scrollBehavior = oldBehavior;
  };
  const reduced = win.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced) {
    carousel.scrollLeft = to;
    restore();
    return;
  }
  const ns = "http://www.w3.org/2000/svg";
  const svg = doc.createElementNS(ns, "svg");
  svg.setAttribute("viewBox", `0 0 ${win.innerWidth} ${win.innerHeight}`);
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("data-tour-swipe", "");
  svg.style.cssText =
    "position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:2147483647;overflow:hidden";
  const startX = r.left + r.width * 0.74;
  const y = r.top + r.height * 0.56;
  svg.innerHTML = `<g data-trail>${Array.from({length: 14}, (_, i) => `<circle r="${5 - i / 14 * 3}" fill="#7b91ff" opacity="${.75 * (1 - i / 14) ** 2}"/>`).join("")}</g><circle data-finger r="10" fill="white" stroke="#7b91ff" stroke-width="3"/>`;
  const trail = Array.from(svg.querySelectorAll('[data-trail] circle'));
  const dot = svg.querySelector("[data-finger]")!;
  (doc.querySelector("[data-tour-focus]") ?? doc.body).append(svg);
  const duration = 800;
  const started = timelineNow();
  const ease = (t: number) => t * t * (3 - 2 * t);
  const distance = to - from;
  try {
    await new Promise<void>((resolve) => {
      const draw = () => {
        if (signal.aborted) {
          resolve();
          return;
        }
        const elapsed = timelineNow() - started;
        const t = Math.max(0, Math.min(1, (elapsed - 160) / duration));
        const progress = ease(t);
        carousel.scrollLeft = from + distance * progress;
        const x = startX - (carousel.scrollLeft - from);
        const tail = startX - distance * ease(Math.max(0, t - 0.3));
        syncFocusScroll(carousel);
        trail.forEach((part, i) => {
          part.setAttribute("cx", String(x + (tail - x) * i / trail.length));
          part.setAttribute("cy", String(y));
        });
        dot.setAttribute("cx", String(x));
        dot.setAttribute("cy", String(y));
        dot.setAttribute("r", String(10 - 2 * Math.min(1, elapsed / 160)));
        svg.style.opacity = String(Math.min(1, elapsed / 80, (1 - t) / 0.12));
        if (t < 1) win.requestAnimationFrame(draw);
        else resolve();
      };
      win.requestAnimationFrame(draw);
    });
    if (!signal.aborted)
      await new Promise((resolve) => setTimeout(resolve, 100));
  } finally {
    restore();
    svg.remove();
  }
}
