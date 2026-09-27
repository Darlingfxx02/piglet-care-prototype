import authorPhoto from "./assets/author.jpg";

export function AuthorLinks({ onAssignment, figma = false }: { onAssignment: () => void; figma?: boolean }) {
  return <div className="author-links">
    <img className="author-photo" src={authorPhoto} alt="Фото автора кейса" />
    <a href="https://darlingdesign.pro" target="_blank" rel="noopener noreferrer">Открыть портфолио</a>
    <button onClick={onAssignment}>Открыть задание</button>
    {figma && <a className="figma-link" href="https://www.figma.com/design/vzAY4n6b7O17dfOATlQ5vD?node-id=459-3" target="_blank" rel="noopener noreferrer">Figma</a>}
  </div>;
}
