import { asset } from "../shared/assets";
import { Icon } from "../shared/UI";

export function AttachmentCard({ name, onRemove }: { name: string; onRemove?: () => void }) {
  const [title, ...details] = name.split(' · ');
  const extension = title.match(/\.([a-z0-9]{1,6})$/i)?.[1]?.toUpperCase();
  return <article className="chat-document-card" aria-label={name.replaceAll(" · ", ", ")}>
    <div className="chat-document-top">
      <strong>{title}</strong>
      <img className="chat-file-art" src={asset("documentArt")} alt="" />
      {onRemove && <button type="button" className="chat-document-remove" aria-label={`Убрать ${title}`} onClick={onRemove}><svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="m1.5 1.5 9 9m0-9-9 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg></button>}
    </div>
    <div className="chat-document-caption"><Icon name="documents" /><span>{details.find(detail => detail.startsWith('№')) || (extension ? `Файл ${extension}` : 'Документ')}</span></div>
  </article>;
}
