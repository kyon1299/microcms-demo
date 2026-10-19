import { notFound } from "next/navigation";
import { PER_PAGE } from "@/lib/config";
import { getArticles } from "@/lib/data";
import { ArticleCard } from "./ArticleCard";
import { Pagination } from "./Pagination";

type Props = {
  page: number;
  basePath: string;
  categoryId?: string;
};

/** 記事一覧とページ送り。トップ・カテゴリ別の両方で使う */
export async function ArticleList({ page, basePath, categoryId }: Props) {
  if (!Number.isInteger(page) || page < 1) notFound();

  const { contents, totalCount } = await getArticles({ page, categoryId });
  const totalPages = Math.max(1, Math.ceil(totalCount / PER_PAGE));
  if (page > totalPages) notFound();

  if (contents.length === 0) {
    return <p className="empty">記事はまだありません。</p>;
  }

  return (
    <>
      <div className="card-grid">
        {contents.map((a) => (
          <ArticleCard key={a.id} article={a} />
        ))}
      </div>
      <Pagination current={page} totalPages={totalPages} basePath={basePath} />
    </>
  );
}

export function ArticleListSkeleton() {
  return (
    <div className="card-grid" aria-busy="true" aria-label="読み込み中">
      {Array.from({ length: PER_PAGE }, (_, i) => (
        <div key={i} className="card card--skeleton" />
      ))}
    </div>
  );
}
