import { useState, useLayoutEffect, type RefObject, type CSSProperties } from "react";
import { Icon, Modal } from "../shared/UI";

const documents = [
  { id: "transport", title: "Ветеринарный документ", subtitle: "эВСД для перевозки", breed: "Ландрас", order: "3205", date: "24.09.2026", kind: "Перевозка" },
  { id: "register", title: "Карточка учёта", subtitle: "Сведения о группе", breed: "Ландрас", order: "3205", date: "22.09.2026", kind: "Учёт" },
  { id: "lab", title: "Результаты исследований", subtitle: "Лабораторный протокол", breed: "Дюрок", order: "748", date: "21.09.2026", kind: "Здоровье" },
  { id: "vaccination", title: "Сведения о вакцинации", subtitle: "Ветеринарные мероприятия", breed: "Беркшир", order: "19642", date: "20.09.2026", kind: "Здоровье" },
  { id: "exam", title: "Ветеринарный осмотр", subtitle: "Заключение специалиста", breed: "Мангалица", order: "5819", date: "19.09.2026", kind: "Здоровье" },
  { id: "receipt", title: "Акт приёма-передачи", subtitle: "Документ по заказу", breed: "Дюрок", order: "748", date: "18.09.2026", kind: "Получение" },
];

export function Documents({ onClose, onSelect, headerRef }: { onClose: () => void; onSelect: (names: string[]) => void; headerRef: RefObject<HTMLElement | null> }) {
  const [top, setTop] = useState(120);
  useLayoutEffect(() => {
    const header = headerRef.current;
    if (!header) return;
    const measure = () => setTop(header.getBoundingClientRect().bottom);
    const observer = new ResizeObserver(measure);
    observer.observe(header);
    window.addEventListener('resize', measure);
    measure();
    return () => { observer.disconnect(); window.removeEventListener('resize', measure); };
  }, [headerRef]);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const filtered = documents.filter(d => `${d.title} ${d.subtitle} ${d.breed} ${d.order} ${d.kind}`.toLocaleLowerCase('ru').includes(query.trim().replace('№', '').toLocaleLowerCase('ru')));
  return (
    <Modal title="Ваши документы" onClose={onClose} className="documents-screen" style={{ '--documents-top': `${top}px` } as CSSProperties}>
      <label className="documents-search">
        <Icon name="search" />
        <input autoFocus aria-label="Поиск документов" placeholder="Название, порода или заказ" value={query} onChange={e => setQuery(e.target.value)} />
        {query && <button aria-label="Очистить поиск" onClick={() => setQuery("")}><Icon name="close" /></button>}
      </label>
      <div className="documents-scroll">
        <div className="documents-grid">
          {filtered.map(d => <button className="document-card" key={d.id} aria-pressed={selected.includes(d.id)} onClick={() => setSelected(ids => ids.includes(d.id) ? ids.filter(id => id !== d.id) : [...ids, d.id])}>
            <div className="document-preview" aria-hidden="true">
              <span className="document-check">{selected.includes(d.id) && <svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="m4 8 2.5 2.5L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}</span>
              <div className="document-paper">
                <span className="document-paper-label">{d.kind}</span>
                <strong>{d.title}</strong>
                <span className="document-metadata"><span>{d.breed}</span><span>№{d.order}</span></span>
                <div className="document-lines"><i /><i /><i /><i /><i /></div>
                <small>{d.date}</small>
              </div>
            </div>
            <strong>{d.title}</strong>
            <span className="document-metadata"><span>{d.breed}</span><span>№{d.order}</span></span>
          </button>)}
        </div>
        {!filtered.length && <div className="documents-empty">Ничего не найдено<p>Попробуйте название или номер заказа</p></div>}
      </div>
      <footer className="documents-footer">
        <button className="primary" disabled={!selected.length} onClick={() => onSelect(documents.filter(d => selected.includes(d.id)).map(d => `${d.title} · ${d.breed} · №${d.order}`))}>Выбрать{selected.length ? ` (${selected.length})` : ''}</button>
      </footer>
    </Modal>
  );
}
