import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource-variable/onest";
import "./style.css";
import { ScrollHint } from "./ScrollHint";
import { AdaptiveSummary } from "./AdaptiveSummary";
import { AuthorLinks } from "./AuthorLinks";
import arrowRightIcon from "./assets/iconsax-arrow-right.svg";
import { focusComponent } from "./focus";
import { measureAnchor, sceneAnchor } from "./anchors";
import { swipeTo } from "./swipe";
import { chapters } from "./content";
import {
  continuations,
  detectSection,
  findTarget,
  shots,
  waitTarget,
} from "./tour";

import type { CSSProperties } from "react";

type Mode = "choose" | "tour" | "free";
const extraNotes: Record<string, { title: string; copy: string }> = {
  comment: {
    title: "Необязательные подробности",
    copy: "Готовые причины зависят от оценки. Они помогают сформулировать отзыв, а комментарий остаётся необязательным. Можно отправить оценку без текста.",
  },
  thanks: {
    title: "Спасибо без лишнего экрана",
    copy: "Отзыв отправлен. Короткое уведомление появляется над завершённым чатом и закрывается автоматически или по крестику.",
  },
  closed: {
    title: "Разговор завершён",
    copy: "История остаётся доступной. Можно начать новый диалог или нажать «Вопрос не решён» и продолжить текущий.",
  },
  documents: {
    title: "Документы внутри разговора",
    copy: "Документы из приложения можно выбрать и прикрепить к сообщению. Не нужно скачивать файл, искать его на устройстве и загружать обратно.",
  },
};
function CasePage() {
  const [mode, setMode] = useState<Mode>("choose");
  const [source, setSource] = useState({
    seed: "home",
    route: "home",
    key: 0,
    continuity: false,
    seek: 0,
  });
  const [loaded, setLoaded] = useState(-1),
    [scale, setScale] = useState(1),
    [section, setSection] = useState("home");
  const [index, setIndex] = useState(0),
    [playing, setPlaying] = useState(true),
    [elapsed, setElapsed] = useState(0),
    [ready, setReady] = useState(false),
    [acted, setActed] = useState(false),
    [complete, setComplete] = useState(false),
    [error, setError] = useState("");
  const [arrival, setArrival] = useState<{ x: number; y: number; width: number; scale: number } | null>(null);
  function finishTour() {
    const node = phone.current;
    if (node && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const rect = node.getBoundingClientRect();
      setArrival({ x: rect.x, y: rect.y, width: node.offsetWidth, scale: rect.width / node.offsetWidth });
    }
    setComplete(true);
    setPlaying(false);
  }
  const [presentedIndex, setPresentedIndex] = useState(0);
  const [manualEntry, setManualEntry] = useState(false);
  const [swipeActive, setSwipeActive] = useState(false);
  const pendingScene = useRef<number | null>(null);
  const navigationTarget = useRef(0);
  const preparingScene = useRef(false);
  const [ratingPreview, setRatingPreview] = useState(1);
  const [spotlight, setSpotlight] = useState(false);
  const [changing, setChanging] = useState(false);
  const [box, setBox] = useState<{
    phase: string;
    x: number;
    y: number;
    w: number;
    h: number;
  } | null>(null);
  const documentation = useRef<HTMLElement>(null);
  const assignment = useRef<HTMLDialogElement>(null);
  const phone = useRef<HTMLDivElement>(null);
  const viewport = useRef<HTMLDivElement>(null),
    frame = useRef<HTMLIFrameElement>(null),
    operation = useRef<AbortController | null>(null),
    actionStarted = useRef(false);
  const wheelGesture = useRef({ last: 0, total: 0, advancedAt: -Infinity, direction: 0 });
  const retainedFocus = useRef<{ target: HTMLElement; dispose: () => void } | null>(null);
  const carryFocus = useRef(false);
  const shot = shots[index];
  const chapter = chapters.find((c) => c.id === section) ?? chapters[1];
  function requestScene(next: number) {
    navigationTarget.current = next;
    if (preparingScene.current) { pendingScene.current = next; return; }
    jump(next, 0, true);
  }
  function jump(next: number, at = 0, manual = false) {
    preparingScene.current = true;
    navigationTarget.current = next;
    pendingScene.current = null;
    setManualEntry(manual);
    setSwipeActive(false);
    setRatingPreview(1);
    setArrival(null);
    operation.current?.abort();
    carryFocus.current = next === index + 1 && acted && Boolean(retainedFocus.current?.target.matches(shots[next].before.selector));
    setIndex(next);
    setElapsed(at);
    setReady(false);
    setActed(false);
    setComplete(false);
    setError("");
    if (!carryFocus.current) setSpotlight(false);
    setChanging(false);
    actionStarted.current = false;
    const s = shots[next];
    setSource((old) => ({
      seed: s.seed,
      route: s.route,
      key: old.key + 1,
      continuity: at < 2200 && next === index + 1 && acted && next in continuations,
      seek: at,
    }));
  }
  function returnFromAdaptives() {
    setPlaying(false);
    window.scrollTo({ top: 0, behavior: "instant" });
    wheelGesture.current = { last: 0, total: 0, advancedAt: performance.now(), direction: 0 };
    jump(shots.length - 1, 0, true);
  }
  function returnToStart() {
    operation.current?.abort();
    pendingScene.current = null;
    preparingScene.current = false;
    setPlaying(false);
    setComplete(false);
    setArrival(null);
    setSpotlight(false);
    setBox(null);
    setError("");
    setMode("choose");
    setSource(old => ({ seed: "home", route: "home", key: old.key + 1, continuity: false, seek: 0 }));
    window.scrollTo({ top: 0, behavior: "instant" });
    documentation.current?.scrollTo({ top: 0, behavior: "instant" });
  }
  function startTour() {
    setMode("tour");
    setPlaying(true);
    jump(0);
  }
  function explore() {
    operation.current?.abort();
    pendingScene.current = null;
    preparingScene.current = false;
    setMode("free");
    setBox(null);
    setError("");
  }
  useEffect(() => {
    const el = viewport.current!;
    const observer = new ResizeObserver(() => setScale(el.clientWidth / 430));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (loaded < 0 || source.key === 0) return;
    const controller = new AbortController();
    operation.current = controller;
    const doc = frame.current?.contentDocument;
    const win = frame.current?.contentWindow;
    if (!doc || !win) return;
    const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
    const prepare = async () => {
      controller.signal.throwIfAborted();
      if (!source.continuity || mode !== "tour") {
        win.dispatchEvent(new CustomEvent("case:reset", { detail: source }));
        await delay(100);
        controller.signal.throwIfAborted();
      }
      if (mode !== "tour") return;
      for (const action of (source.continuity
        ? continuations[index]
        : shot.prepare) ?? []) {
        const el = await waitTarget(doc, action, controller.signal);
        controller.signal.throwIfAborted();
        el.click();
        await delay(150);
        controller.signal.throwIfAborted();
      }
      if (source.seek >= 2200 && shot.action) {
        const action = await waitTarget(doc, shot.action, controller.signal);
        action.click();
        await delay(150);
      }
      const focus = await waitTarget(doc, source.seek >= 2200 ? (shot.after ?? shot.before) : shot.before, controller.signal);
      focus.scrollIntoView({ block: "nearest", behavior: "instant" });
    };
    (async () => {
      // The browser keeps the previous app pixels until the new state is ready.
      if (mode === "tour" && !source.continuity && doc.startViewTransition) {
        const transition = doc.startViewTransition(prepare);
        const cancelTransition = () => transition.skipTransition();
        controller.signal.addEventListener("abort", cancelTransition, { once: true });
        try { await transition.finished; } finally { controller.signal.removeEventListener("abort", cancelTransition); }
      } else await prepare();
      if (!controller.signal.aborted && mode === "tour") {
        const done = !shot.action || source.seek >= 2200;
        const anchor = await measureAnchor(doc, shot, done, index, controller.signal);
        controller.signal.throwIfAborted();
        setBox(anchor);
        setPresentedIndex(index);
        setReady(true);
        setActed(done);
        actionStarted.current = source.seek >= 2200;
      }
    })().catch((e) => {
      if (!controller.signal.aborted) setError(e.message);
    });
    return () => controller.abort();
  }, [loaded, source.key]);
  useEffect(() => {
    if (carryFocus.current && !acted) return;
    setSpotlight(false);
    if (mode !== "tour" || !ready || changing || complete || index === 0)
      return;
    const timer = setTimeout(() => setSpotlight(true), 1600);
    return () => clearTimeout(timer);
  }, [mode, ready, changing, complete, index, acted]);
  useEffect(() => {
    if (!ready || mode !== "tour") return;
    preparingScene.current = false;
    const timer = setTimeout(() => {
      const next = pendingScene.current;
      pendingScene.current = null;
      if (next !== null && next !== index) jump(next, 0, true);
    }, 180);
    return () => clearTimeout(timer);
  }, [ready, index, mode]);
  useEffect(() => {
    if (mode !== "free") return;
    const timer = setInterval(() => {
      const doc = frame.current?.contentDocument;
      if (doc) setSection(detectSection(doc));
    }, 100);
    return () => clearInterval(timer);
  }, [mode]);
  useEffect(() => {
    if (mode !== "tour") return;
    const onWheel = (event: WheelEvent) => {
      if (event.ctrlKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
      if (complete) {
        // Let the overview scroll normally; its top edge reconnects to the tour.
        if (event.deltaY < 0 && window.scrollY <= 1 && !arrival) {
          event.preventDefault();
          returnFromAdaptives();
        }
        return;
      }
      const notes = documentation.current;
      if (notes && event.target instanceof Node && notes.contains(event.target) &&
          ((event.deltaY > 0 && notes.scrollTop + notes.clientHeight < notes.scrollHeight - 1) ||
           (event.deltaY < 0 && notes.scrollTop > 0))) return;
      event.preventDefault();
      const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? window.innerHeight : 1);
      const now = performance.now();
      const gesture = wheelGesture.current;
      if (!delta) return;
      const direction = Math.sign(delta);
      if (now - gesture.last > 200 || direction !== gesture.direction) gesture.total = 0;
      gesture.last = now;
      gesture.direction = direction;
      gesture.total += delta;
      // Throttle from the last navigation, never from the end of a wheel gesture.
      if (now - gesture.advancedAt < 350 || Math.abs(gesture.total) < 45) return;
      gesture.advancedAt = now;
      gesture.total = 0;
      const next = Math.max(0, Math.min(shots.length - 1, navigationTarget.current + direction));
      if (next !== index || preparingScene.current) requestScene(next);
      else if (direction > 0 && index === shots.length - 1 && acted) { finishTour(); }
    };
    const onKey = (event: KeyboardEvent) => {
      const target = event.target;
      if (event.ctrlKey || event.metaKey || event.altKey ||
          (target instanceof HTMLElement && target.closest('input, textarea, select, [contenteditable="true"]'))) return;
      if (complete) {
        if (!event.repeat && event.key === "ArrowLeft") {
          event.preventDefault();
          returnFromAdaptives();
        }
        return;
      }
      if (event.code === "Space") {
        event.preventDefault();
        if (document.activeElement instanceof HTMLButtonElement) document.activeElement.blur();
        if (!event.repeat && !complete) setPlaying(value => !value);
        return;
      }
      if (!ready || event.repeat || !["ArrowLeft", "ArrowRight"].includes(event.key)) return;
      event.preventDefault();
      const next = Math.max(0, Math.min(shots.length - 1, index + (event.key === "ArrowRight" ? 1 : -1)));
      if (next !== index) requestScene(next);
    };
    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("wheel", onWheel); window.removeEventListener("keydown", onKey); };
  }, [mode, playing, ready, complete, index, acted, arrival]);
  useEffect(() => {
    if (mode !== "tour" || !playing || !ready || complete || error) return;
    let last = performance.now();
    const timer = setInterval(() => {
      const now = performance.now();
      const delta = Math.min(now - last, 80);
      last = now;
      if (!document.hidden) {
        setElapsed(t => Math.min(shot.duration, t + delta));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [mode, playing, ready, complete, error, index, acted]);
  useEffect(() => {
    if (
      mode !== "tour" ||
      !ready ||
      (!playing && !manualEntry) ||
      !shot.action ||
      (!manualEntry && elapsed < 2200) ||
      actionStarted.current
    )
      return;
    actionStarted.current = true;
    const controller = operation.current;
    const doc = frame.current?.contentDocument;
    if (!controller || !doc) return;
    (async () => {
      if (manualEntry) {
        await new Promise(resolve => setTimeout(resolve, 1600));
        if (controller.signal.aborted) return;
      }
      if (!shot.scrollBeforeAction && index !== 2) {
        setChanging(true);
        setSpotlight(false);
        await new Promise((r) => setTimeout(r, 380));
      }
      const el = await waitTarget(doc, shot.action!, controller.signal);
      if (shot.scrollBeforeAction) {
        const carousel = el.closest<HTMLElement>(".chat-orders");
        if (carousel) {
          setSwipeActive(true);
          await swipeTo(carousel, el, controller.signal);
          if (controller.signal.aborted) return;
        }
      }
      if (shot.scrollBeforeAction) {
        setChanging(true);
        setSpotlight(false);
        await new Promise((r) => setTimeout(r, 380));
        if (controller.signal.aborted) return;
      }
      if (controller.signal.aborted) return;
      el.click();
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      );
      const target = await waitTarget(
        doc,
        shot.after ?? shot.before,
        controller.signal,
      );
      target.scrollIntoView({ block: "nearest", behavior: "instant" });
      const anchor = await measureAnchor(doc, shot, true, index, controller.signal);
      if (!controller.signal.aborted) {
        setBox(anchor);
        setActed(true);
        setChanging(false);
      }
    })().catch((e) => {
      if (!controller.signal.aborted) setError(e.message);
    });
  }, [elapsed, mode, ready, playing, index, manualEntry]);
  useEffect(() => {
    if (
      mode === "tour" &&
      playing &&
      acted &&
      elapsed >= shot.duration &&
      !complete
    ) {
      if (index === shots.length - 1) {
        finishTour();
      } else jump(index + 1);
    }
  }, [elapsed, mode, playing, acted, complete]);
  useLayoutEffect(() => {
    if (!arrival || !complete || mode !== "tour") return;
    const node = phone.current;
    const destination = document.querySelector(".adaptive-phone .adaptive-device");
    if (!node || !destination) { setArrival(null); return; }
    const target = destination.getBoundingClientRect();
    const animation = node.animate([
      { transform: `translate(0px, 0px) scale(${arrival.scale})` },
      { transform: `translate(${target.x - arrival.x}px, ${target.y - arrival.y}px) scale(${target.width / arrival.width})` },
    ], { duration: 1000, easing: "cubic-bezier(.22,1,.36,1)", fill: "forwards" });
    const tablet = document.querySelector(".adaptive-tablet");
    const tabletAnimation = tablet?.animate([
      { transform: "translate(120px, 160px)", opacity: 0 },
      { transform: "translate(0px, 0px)", opacity: 1 },
    ], { duration: 1000, easing: "cubic-bezier(.22,1,.36,1)", fill: "both" });
    animation.onfinish = () => setArrival(null);
    return () => { animation.cancel(); tabletAnimation?.cancel(); };
  }, [arrival, complete, mode]);
  const busy = mode === "tour" && !ready;
  const overview = Boolean(shot.overviewAfter && acted);
  const zoom = box ? Math.min(1.65, Math.max(1.12, 65 / box.h)) : 1;
  // Keep the current camera while the next UI state is being prepared.
  // Native transitions finish even while automatic tour playback is paused.
  const lastCamera = useRef<CSSProperties>({ transform: "translateY(0px) scale(1)" });
  if (mode !== "tour" || index === 0) {
    lastCamera.current = { transform: "translateY(0px) scale(1)" };
  } else if (ready && box?.phase === `${index}:${acted}`) {
    lastCamera.current = overview ? { transform: "translateY(0px) scale(1)" } : {
      transform: `translateY(${(0.5 - (box.y + box.h / 2) / 100) * (phone.current?.offsetHeight ?? 0) * zoom}px) scale(${zoom})`,
    };
  }
  const cameraStyle = lastCamera.current;


  useEffect(() => {
    const doc = frame.current?.contentDocument;
    if (!doc) return;
    if (mode === "tour" && carryFocus.current && !ready) return;
    const target = mode === "tour" && spotlight && !overview && ready && !changing && index !== 0 && !complete
      ? findTarget(doc, sceneAnchor(shot, acted))
      : null;
    const object = target?.closest<HTMLElement>(".message") ?? target;
    if (retainedFocus.current?.target === object) return;
    retainedFocus.current?.dispose();
    retainedFocus.current = object ? { target: object, dispose: focusComponent(doc, object) } : null;
    if (acted) carryFocus.current = false;
  }, [mode, spotlight, overview, ready, changing, index, acted, complete]);
  useEffect(() => () => retainedFocus.current?.dispose(), []);

  useEffect(() => {
    frame.current?.contentDocument?.documentElement?.toggleAttribute(
      "data-guided-tour",
      mode === "tour",
    );
  }, [mode, loaded]);

  function onFrameLoad() {
    const doc = frame.current?.contentDocument;
    if (doc) {
      const style = doc.createElement("style");
      style.textContent =
        "html{--device-safe-bottom:34px}html[data-guided-tour] :focus-visible{outline:none!important}*{scrollbar-width:none!important}*::-webkit-scrollbar{display:none!important}::view-transition-old(root){display:none}::view-transition-new(root){animation:none;mix-blend-mode:normal}@media(prefers-reduced-motion:reduce){::view-transition-old(root),::view-transition-new(root){animation-duration:0.01ms}}";
      doc.head.appendChild(style);
    }
    setLoaded(0);
  }

  return (
    <main
      className={`case-layout mode-${mode} ${mode === "tour" && complete ? `show-summary ${arrival ? "summary-arriving" : ""}` : ""}`}
      data-scene={index}
      data-time={Math.round(elapsed)}
      data-action={String(actionStarted.current)}
      data-aborted={String(operation.current?.signal.aborted)}
      data-ready={String(ready)}
    >
      {mode === "tour" && (
                    <div
                      className="tour-progress"
                      role="progressbar"
                      aria-label="Ход тура"
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={Math.round(
                        ((index + Math.min(elapsed / shot.duration, 1)) /
                          shots.length) *
                          100,
                      )}
                    >
                      <span
                        style={{
                          width: `${((index + Math.min(elapsed / shot.duration, 1)) / shots.length) * 100}%`,
                        }}
                      />
                    </div>
      )}
      {mode === "tour" && complete && <AdaptiveSummary onAssignment={() => assignment.current?.showModal()} onBack={returnFromAdaptives} onStart={returnToStart} />}
      <dialog className="assignment-dialog" ref={assignment} aria-labelledby="assignment-title"
        onClick={event => { if (event.target === event.currentTarget) assignment.current?.close(); }}>
        <div className="assignment-content">
          <header><h1 id="assignment-title">Тестовое задание<br />UI/UX дизайнер</h1>
            <button className="assignment-close" aria-label="Закрыть задание" onClick={() => assignment.current?.close()}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
            </button>
          </header>
          <h2>Исходные данные</h2>
          <ol>
            <li>Личный кабинет пользователя в мобильном приложении доставки поросят.</li>
            <li>Экран «Чат поддержки» пользователя с оператором.</li>
            <li>Flow — оценка оператора после завершения диалога с пользователем.</li>
          </ol>
          <h2>Задача</h2>
          <ol>
            <li>Спроектируйте интерфейс экрана оценки с положительной и отрицательной оценкой.</li>
            <li>Распишите логику решения данной задачи поэтапно.</li>
          </ol>
          <p>Сделайте адаптивные версии дизайна.</p>
          <p>Бонусом будет выполнение задачи по разработке дополнительного функционала в приложении. Добавьте фичи на ваше усмотрение.</p>
          <h2>Требования</h2>
          <p>Проект отправить ссылкой на Figma.<br />Срок выполнения — 3 дня.</p>
        </div>
        <ScrollHint target={assignment} revision="assignment" />
      </dialog>
      <ScrollHint target={documentation} revision={`${mode}:${index}:${section}:${complete}`} />
      <section ref={documentation} className="documentation" aria-label="Описание экрана">
        {mode === "choose" ? (
          <div className="mode-choice">
            <AuthorLinks onAssignment={() => assignment.current?.showModal()} />
            <h1>
              Поддержка в сервисе
              <br />доставки поросят
            </h1>
            <p>
              Чат с контекстом заказа и оценкой диалога.
              От первого вопроса до обратной связи.
            </p>
            <button className="choice" onClick={startTour}>
              <strong>
                Смотреть тур <img className="choice-arrow" src={arrowRightIcon} alt="" />
              </strong>
              <span>
                Покажем сценарии и объясним решения. Можно поставить на паузу.
              </span>
            </button>
            <button className="choice" onClick={explore}>
              <strong>
                Попробовать самому <img className="choice-arrow" src={arrowRightIcon} alt="" />
              </strong>
              <span>
                Живое приложение. Пояснения меняются вместе с экраном.
              </span>
            </button>
          </div>
        ) : (
          <>
            <div className="mode-switch">
              <button
                className="back-control"
                onClick={() => {
                  operation.current?.abort();
                  setMode("choose");
                }}
              >
                <img className="back-icon" src={arrowRightIcon} alt="" /> Назад
              </button>
              {mode === "free" && (
                <div className="chapter-segments">
                <nav className="chapters" aria-label="Разделы кейса"
                  onWheel={event => { if (Math.abs(event.deltaY) > Math.abs(event.deltaX)) event.currentTarget.scrollLeft += event.deltaY; }}
                >
                  {chapters.map((c) => (
                    <button
                      key={c.id}
                      aria-pressed={c.id === section}
                      onClick={(event) => {
                        event.currentTarget.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
                        setSection(c.id);
                        setSource((old) => ({
                          seed: c.id,
                          continuity: false,
                          seek: 0,
                          route: c.route,
                          key: old.key + 1,
                        }));
                      }}
                    >
                      {c.name}
                    </button>
                  ))}
                </nav>
                </div>

              )}
            </div>
            {mode === "free" ? (
              <>
                <div className="notes" key={section} aria-live="polite">
                  {extraNotes[section] ? (
                    <>
                      <h1>{extraNotes[section].title}</h1>
                      <p>{extraNotes[section].copy}</p>
                    </>
                  ) : (
                    <>
                      <h1>{chapter.title}</h1>
                      <p>{chapter.left}</p>
                      <p>{chapter.detail}</p>
                      <h2>{chapter.right}</h2>
                      <p>{chapter.extra}</p>
                    </>
                  )}
                </div>
              </>
            ) : (
              <>
                <div
                  className="notes tour-notes"
                  key={complete ? "end" : presentedIndex}
                  aria-live="polite"
                >
                  <div className="tour-heading">
                    <button
                      className="control main-control"
                      aria-label={complete ? "Посмотреть ещё раз" : playing ? "Пауза" : "Продолжить"}
                      onClick={() => complete ? startTour() : setPlaying(p => !p)}
                    >
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        {playing && !complete
                          ? <path d="M8 5v14M16 5v14" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                          : <path d="M8 4.5 20 12 8 19.5Z" fill="currentColor" />}
                      </svg>
                    </button>
                    <h1>{complete ? "Теперь можно попробовать самому" : shots[presentedIndex].title}</h1>
                  </div>
                  <p>
                    {complete
                      ? "Главная, доставка, ветеринария и обратная связь доступны в прототипе. Продолжите с текущего экрана или выберите любой раздел."
                      : shots[presentedIndex].copy}
                  </p>
                  {!complete && shots[presentedIndex].details?.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
                </div>
                {error ? (
                  <div role="alert">
                    <p>{error}</p>
                    <button className="control" onClick={() => jump(index)}>
                      Повторить шаг
                    </button>
                  </div>
                ) : (
                  <>
                    {complete && (
                      <button className="take-over" onClick={explore}>
                        Попробовать самому
                      </button>
                    )}
                  </>
                )}
              </>
            )}
          </>
        )}
      </section>
      <section
        className={`device-column ${mode === "tour" && index === 0 ? "opening-shot" : ""} camera-${mode === "tour" ? shot.camera : "center"}`}
        aria-label="Интерактивное приложение"
      >
        <div
          ref={phone}
          style={arrival && complete ? { position: "fixed", left: arrival.x, top: arrival.y, width: arrival.width, transformOrigin: "top left", transform: `scale(${arrival.scale})`, transition: "none" } : cameraStyle}
          className={`phone ${busy ? "preparing" : ""}`}
        >
          <div className="phone-screen" ref={viewport}>
            <iframe
              ref={frame}
              onLoad={onFrameLoad}
              title="Интерактивный прототип"
              src="./?case=home#/home"
              tabIndex={mode === "free" ? 0 : -1}
              inert={mode !== "free"}
              style={{ width: 430, height: 932, transform: `scale(${scale})` }}
            />
            {mode !== "free" && <div className="interaction-shield" />}
            {box && mode === "tour" && index !== 0 && (
              <div
                className={`focus-ring ${spotlight && !overview ? "is-visible" : ""} ${!acted && elapsed > 1300 ? "pressing" : ""}`}
                style={{
                  left: `${box.x}%`,
                  top: `${box.y}%`,
                  width: `${box.w}%`,
                  height: `${box.h}%`,
                }}
              >
                {!acted && shot.action && !swipeActive && <span className="tour-pointer" />}
              </div>
            )}
            <div className="island" aria-hidden="true" />
            <div className="home-indicator" aria-hidden="true" />
          </div>
          {mode === "tour" && shot.details && !complete && (
            <div className="rating-preview-switch" role="group" aria-label="Экраны оценки">
              {[1, 2].map(step => <button key={step} aria-label={`Экран ${step}`} aria-pressed={ratingPreview === step} disabled={!ready}
                onClick={() => {
                  setRatingPreview(step);
                  setElapsed(0);
                  frame.current?.contentWindow?.dispatchEvent(new CustomEvent("case:rating-step", { detail: step }));
                }}>{step}</button>)}
            </div>
          )}
          <img
            className="phone-frame"
            src="./case/iphone-15-pro-max-natural-titanium.png"
            alt="Рамка iPhone 15 Pro Max, Natural Titanium"
          />
        </div>
        {busy && (
          <span className="preparing-label" role="status">
            Открываем сценарий…
          </span>
        )}
      </section>
    </main>
  );
}
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <CasePage />
  </React.StrictMode>,
);
