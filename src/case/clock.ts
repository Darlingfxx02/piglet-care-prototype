// A signed clock shared by the tour and its visual animations.
export const tourDuration = (durations: number[]) => durations.reduce((a, b) => a + b, 0);
export function locateTime(time: number, durations: number[]) {
  let rest = Math.max(0, Math.min(time, tourDuration(durations) - 1));
  for (let index = 0; index < durations.length; index++) {
    if (rest < durations[index]) return { index, elapsed: rest };
    rest -= durations[index];
  }
  return { index: durations.length - 1, elapsed: durations.at(-1)! - 1 };
}
export function bindAnimations(doc: Document, now: () => number, playing: () => boolean, phoneOnly = false) {
  const tracked = new Map<Animation, { start: number; duration: number }>();
  let raf = 0;
  const tick = () => {
    const time = now();
    for (const animation of doc.getAnimations()) {
      if (tracked.has(animation) || animation.playState === "idle") continue;
      const effect = animation.effect as KeyframeEffect | null;
      if (effect?.pseudoElement?.includes("view-transition")) continue;
      if (phoneOnly && !(effect?.target as Element | null)?.matches(".tour-pointer")) continue;
      const duration = Number(animation.effect?.getComputedTiming().endTime);
      if (!Number.isFinite(duration)) continue;
      tracked.set(animation, { start: time - (playing() ? Number(animation.currentTime ?? 0) : duration), duration });
      animation.pause();
    }
    for (const [animation, record] of tracked) {
      const target = (animation.effect as KeyframeEffect | null)?.target;
      if (animation.playState === "idle" || (target && !target.isConnected)) { tracked.delete(animation); continue; }
      animation.currentTime = Math.max(0, Math.min(record.duration, time - record.start));
    }
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
  return () => { cancelAnimationFrame(raf); for (const animation of tracked.keys()) animation.play(); };
}

export type CameraPose = { y: number; zoom: number };
export type CameraCue = { key: string; at: number; from: CameraPose; to: CameraPose };
export function cameraAt(cues: CameraCue[], time: number): CameraPose {
  const cue = [...cues].reverse().find(cue => cue.at <= time);
  if (!cue) return { y: 0, zoom: 1 };
  const t = Math.max(0, Math.min(1, (time - cue.at) / 1200));
  const eased = 1 - (1 - t) ** 3;
  return { y: cue.from.y + (cue.to.y - cue.from.y) * eased, zoom: cue.from.zoom + (cue.to.zoom - cue.from.zoom) * eased };
}
