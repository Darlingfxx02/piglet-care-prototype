const focusCopies = new WeakMap<HTMLElement, HTMLElement>();
export function syncFocusScroll(target: HTMLElement) {
  const copy = focusCopies.get(target);
  if (copy) {
    copy.style.scrollSnapType = "none";
    copy.style.scrollBehavior = "auto";
    copy.scrollLeft = target.scrollLeft;
    copy.scrollTop = target.scrollTop;
  }
}
// Render the selected UI above a uniform scrim, preserving its computed shapes.
// This visual-only copy is inert; all tour actions still use the real app DOM.
export function focusComponent(doc: Document, target: HTMLElement) {
  const rect = target.getBoundingClientRect();
  const overlay = doc.createElement("div");
  overlay.setAttribute("popover", "manual");
  overlay.setAttribute("data-tour-focus", "");
  overlay.setAttribute("aria-hidden", "true");
  overlay.inert = true;
  overlay.style.cssText =
    "position:fixed;inset:0;margin:0;padding:0;width:100%;height:100%;max-width:none;max-height:none;border:0;overflow:hidden;pointer-events:none;background:rgba(13,16,37,.22);opacity:0;transition:opacity 350ms ease;";
  const clone = target.cloneNode(true) as HTMLElement;
  const originals = [target, ...target.querySelectorAll("*")];
  const copies = [clone, ...clone.querySelectorAll("*")];
  originals.forEach((node, i) => {
    const copy = copies[i] as HTMLElement;
    const computed = doc.defaultView!.getComputedStyle(node);
    for (const property of computed)
      copy.style.setProperty(property, computed.getPropertyValue(property));
    copy.removeAttribute("id");
    copy.removeAttribute("class");
    copy.style.transition = "none";
    copy.style.animation = "none";
    if (node.tagName === "TEXTAREA" || node.tagName === "INPUT") {
      (copy as HTMLInputElement).value = (node as HTMLInputElement).value;
    }
  });
  Object.assign(clone.style, {
    position: "absolute",
    left: `${rect.left}px`,
    top: `${rect.top}px`,
    right: "auto",
    bottom: "auto",
    margin: "0",
    width: `${rect.width}px`,
    height: `${rect.height}px`,
    transform: "none",
    pointerEvents: "none",
  });
  const bounds = {
    left: 0,
    top: 0,
    right: doc.documentElement.clientWidth,
    bottom: doc.documentElement.clientHeight,
  };
  for (
    let parent = target.parentElement;
    parent && parent !== doc.body;
    parent = parent.parentElement
  ) {
    const style = doc.defaultView!.getComputedStyle(parent);
    const r = parent.getBoundingClientRect();
    if (style.overflowX !== "visible") {
      bounds.left = Math.max(bounds.left, r.left + parent.clientLeft);
      bounds.right = Math.min(
        bounds.right,
        r.left + parent.clientLeft + parent.clientWidth,
      );
    }
    if (style.overflowY !== "visible") {
      bounds.top = Math.max(bounds.top, r.top + parent.clientTop);
      bounds.bottom = Math.min(
        bounds.bottom,
        r.top + parent.clientTop + parent.clientHeight,
      );
    }
  }
  const clipped = doc.createElement("div");
  clipped.style.cssText = `position:absolute;inset:0;pointer-events:none;clip-path:inset(${bounds.top}px ${doc.documentElement.clientWidth - bounds.right}px ${doc.documentElement.clientHeight - bounds.bottom}px ${bounds.left}px)`;
  clipped.append(clone);
  overlay.append(clipped);
  doc.body.append(overlay);
  overlay.showPopover();
  focusCopies.set(target, clone);
  syncFocusScroll(target);
  const raf = doc.defaultView!.requestAnimationFrame(() => {
    overlay.style.opacity = "1";
  });
  const observer = new MutationObserver(() => {
    if (!target.isConnected) {
      overlay.remove();
      observer.disconnect();
    }
  });
  observer.observe(doc.body, { childList: true, subtree: true });
  return () => {
    if (focusCopies.get(target) === clone) focusCopies.delete(target);
    observer.disconnect();
    doc.defaultView!.cancelAnimationFrame(raf);
    overlay.style.opacity = "0";
    setTimeout(() => overlay.remove(), 350);
  };
}
