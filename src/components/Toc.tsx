import type { TocItem } from "@/lib/content";

export function Toc({ items }: { items: TocItem[] }) {
  if (items.length === 0) return null;
  return (
    <nav className="toc" aria-label="目次">
      <p className="toc__title">目次</p>
      <ol>
        {items.map((item) => (
          <li key={item.id} className={item.level === 3 ? "toc__sub" : undefined}>
            <a href={`#${item.id}`}>{item.text}</a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
