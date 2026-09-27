import { useId, useLayoutEffect, useRef, useState, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { RollingOrderNumber } from './RollingOrderNumber';

export function InlineComposer({ editorRef, value, order, files, onChange, onRemoveOrder, onRemoveFile, onSend }: {
  editorRef: RefObject<HTMLDivElement | null>; value: string; order?: string; files: string[];
  onChange: (text: string) => void; onRemoveOrder: () => void; onRemoveFile: (index: number) => void; onSend: () => void;
}) {
  const [orderTarget, setOrderTarget] = useState<HTMLElement | null>(null);
  const editorId = useId();
  const [scroll, setScroll] = useState({ height: 0, thumb: 0, top: 0, max: 0, value: 0 });
  const drag = useRef<{ y: number; top: number } | null>(null);
  const savedRange = useRef<Range | null>(null);
  const saveCursor = () => {
    const selection = window.getSelection();
    if (selection?.rangeCount && editorRef.current?.contains(selection.anchorNode)) savedRange.current = selection.getRangeAt(0).cloneRange();
  };
  useLayoutEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    if (!value) {
      // Clear only text on send/reset; token lifetimes are controlled separately.
      const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT);
      const nodes: Text[] = [];
      while (walker.nextNode()) if (!(walker.currentNode.parentElement?.closest('[data-token]'))) nodes.push(walker.currentNode as Text);
      nodes.forEach(n => { n.textContent = ''; });
      editor.querySelectorAll('br').forEach(n => n.remove());
    }
    let token = editor.querySelector<HTMLElement>('[data-token="order"]');
    if (order && !token) {
      token = document.createElement('span'); token.dataset.token = 'order'; token.contentEditable = 'false'; token.className = 'inline-order-token';
      editor.prepend(token);
      token.after(document.createTextNode('\u00a0'));
    }
    if (!order && token) { token.remove(); token = null; }
    setOrderTarget(token);
    editor.querySelectorAll<HTMLElement>('[data-token="file"]').forEach(n => { if (!files.includes(n.dataset.name || '')) n.remove(); });
    files.forEach((name) => {
      const existing = [...editor.querySelectorAll<HTMLElement>('[data-token="file"]')].find(n => n.dataset.name === name);
      if (existing) { existing.textContent = name.split(' · ')[0]; existing.setAttribute('aria-label', name.replaceAll(' · ', ', ')); existing.removeAttribute('role'); return; }
      const chip = document.createElement('span'); chip.contentEditable = 'false'; chip.dataset.token = 'file'; chip.dataset.name = name; chip.className = 'inline-file-token'; chip.textContent = name.split(' · ')[0]; chip.setAttribute('aria-label', name.replaceAll(' · ', ', ')); chip.title = name.replaceAll(" · ", ", ");
      const range = savedRange.current;
      if (range && editor.contains(range.startContainer)) { range.collapse(false); range.insertNode(chip); range.setStartAfter(chip); range.collapse(true); }
      else editor.append(chip);
      chip.after(document.createTextNode('\u00a0'));
    });
  }, [order, files, value, editorRef]);
  useLayoutEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    const normalizeFiles = () => {
      editor.querySelectorAll<HTMLElement>('[data-token="file"]').forEach(token => {
        const name = token.dataset.name || '';
        const title = name.split(' · ')[0];
        if (token.textContent !== title) token.textContent = title;
        token.setAttribute('aria-label', name.replaceAll(' · ', ', '));
        token.removeAttribute('role');
      });
    };
    normalizeFiles();
    const measure = () => {
      normalizeFiles();
      editor.dataset.scrollable = String(editor.clientHeight >= 164 && editor.scrollHeight > 164);
      const height = editor.clientHeight - 8;
      const max = Math.max(0, editor.scrollHeight - editor.clientHeight);
      const thumb = Math.min(height, Math.max(24, height * editor.clientHeight / editor.scrollHeight));
      const top = max ? editor.scrollTop / max * (height - thumb) : 0;
      setScroll({ height, thumb, top, max: editor.dataset.scrollable === 'true' ? max : 0, value: editor.scrollTop });
    };
    measure();
    const resize = new ResizeObserver(measure);
    const mutations = new MutationObserver(measure);
    resize.observe(editor);
    mutations.observe(editor, { childList: true, subtree: true, characterData: true });
    editor.addEventListener('scroll', measure);
    return () => { resize.disconnect(); mutations.disconnect(); editor.removeEventListener('scroll', measure); };
  }, [editorRef]);
  function update() {
    const editor = editorRef.current!;
    const clone = editor.cloneNode(true) as HTMLElement;
    clone.querySelectorAll('[data-token]').forEach(n => n.remove());
    onChange((clone.textContent || '').replace(/\u00a0/g, ' '));
    if (order && !editor.querySelector('[data-token="order"]')) onRemoveOrder();
    files.forEach((name, index) => {
      if (![...editor.querySelectorAll<HTMLElement>('[data-token="file"]')].some(n => n.dataset.name === name)) onRemoveFile(index);
    });
    saveCursor();
  }
  return <div className="inline-composer-shell">
    <div id={editorId} ref={editorRef} className="inline-composer" contentEditable suppressContentEditableWarning role="textbox" aria-label="Сообщение" aria-multiline="true" onInput={update} onKeyUp={saveCursor} onMouseUp={saveCursor} onBlur={saveCursor}
      onPaste={e => { e.preventDefault(); document.execCommand('insertText', false, e.clipboardData.getData('text/plain')); }}
      onKeyDown={e => {
        if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); onSend(); }
        if (e.key === 'Backspace' && !value.trim() && order && !files.length) { e.preventDefault(); onRemoveOrder(); }
      }} />
    {scroll.max > 0 && <div className="composer-scrollbar" role="scrollbar" tabIndex={0} aria-label="Прокрутка сообщения" aria-controls={editorId} aria-orientation="vertical" aria-valuemin={0} aria-valuemax={scroll.max} aria-valuenow={Math.round(scroll.value)}
      onClick={e => e.stopPropagation()}
      onPointerDown={e => {
        e.preventDefault(); e.stopPropagation(); e.currentTarget.setPointerCapture(e.pointerId);
        const y = e.clientY - e.currentTarget.getBoundingClientRect().top;
        if (y < scroll.top || y > scroll.top + scroll.thumb) editorRef.current!.scrollTop = (y - scroll.thumb / 2) / (scroll.height - scroll.thumb) * scroll.max;
        drag.current = { y: e.clientY, top: editorRef.current!.scrollTop };
      }}
      onPointerMove={e => { if (drag.current) editorRef.current!.scrollTop = drag.current.top + (e.clientY - drag.current.y) / (scroll.height - scroll.thumb) * scroll.max; }}
      onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }}
      onKeyDown={e => {
        const offsets: Record<string, number> = { ArrowDown: 20, ArrowUp: -20, PageDown: 160, PageUp: -160, Home: -scroll.max, End: scroll.max };
        if (e.key in offsets) { e.preventDefault(); e.stopPropagation(); editorRef.current!.scrollTop += offsets[e.key]; }
      }}>
      <span style={{ height: scroll.thumb, transform: `translateY(${scroll.top}px)` }} />
    </div>}
    {orderTarget && order && createPortal(<RollingOrderNumber value={order} />, orderTarget)}
  </div>;
}
