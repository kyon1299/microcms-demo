import Image from "next/image";
import Link from "next/link";
import { formatDate } from "@/lib/format";
import type { ArticleSummary } from "@/lib/types";

export function ArticleCard({ article }: { article: ArticleSummary }) {
  return (
    <article className="card">
      <Link href={`/articles/${article.id}`} className="card__link">
        <div className="card__thumb">
          {article.eyecatch ? (
            <Image
              src={article.eyecatch.url}
              alt={article.eyecatch.alt ?? ""}
              width={640}
              height={360}
              sizes="(max-width: 640px) 100vw, 33vw"
            />
          ) : (
            <span aria-hidden="true">{article.title.slice(0, 1)}</span>
          )}
        </div>
        <div className="card__body">
          {article.category && <span className="tag">{article.category.name}</span>}
          <h2 className="card__title">{article.title}</h2>
          <time dateTime={article.publishedAt}>{formatDate(article.publishedAt)}</time>
        </div>
      </Link>
    </article>
  );
}
