import { findTarget, waitTarget, type Shot, type Target } from "./tour";

export type AnchorBox = { phase: string; x: number; y: number; w: number; h: number };
export function sceneAnchor(shot: Shot, acted: boolean): Target {
  return acted ? shot.after ?? shot.before : shot.scrollBeforeAction || shot.before.selector === ".support-area-options" ? shot.before : shot.action ?? shot.before;
}

// Text, spotlight and camera commit only after the same visible UI anchor settles.
export async function measureAnchor(doc: Document, shot: Shot, acted: boolean, index: number, signal: AbortSignal): Promise<AnchorBox | null> {
  const target = sceneAnchor(shot, acted);
  await waitTarget(doc, target, signal);
  let previous = "", stable = 0;
  const deadline = performance.now() + 5000;
  while (performance.now() < deadline) {
    signal.throwIfAborted();
    const el = findTarget(doc, target);
    const object = el?.closest<HTMLElement>(".message") ?? el;
    if (object) {
      const rect = object.getBoundingClientRect();
      const signature = [rect.x, rect.y, rect.width, rect.height, object.textContent].join(":");
      const typing = object.matches(".message") && !!doc.querySelector(".message.typing");
      stable = signature === previous && !typing ? stable + 1 : 0;
      previous = signature;
      if (stable >= 2) {
        const x = Math.max(0, rect.left), y = Math.max(0, rect.top);
        const right = Math.min(430, rect.right), bottom = Math.min(932, rect.bottom);
        return right > x && bottom > y ? { phase: `${index}:${acted}`, x: x / 430 * 100, y: y / 932 * 100, w: (right - x) / 430 * 100, h: (bottom - y) / 932 * 100 } : null;
      }
    }
    await new Promise(resolve => setTimeout(resolve, 60));
  }
  signal.throwIfAborted();
  throw new Error("Не удалось дождаться состояния экрана");
}
