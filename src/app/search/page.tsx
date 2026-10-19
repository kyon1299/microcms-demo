import { Suspense } from "react";
import type { Metadata } from "next";
import { ArticleCard } from "@/components/ArticleCard";
import { ArticleListSkeleton } from "@/components/ArticleList";
import { getArticles } from "@/lib/data";

export const metadata: Metadata = {
  title: "検索",
  robots: { index: false },
};

async function Results({ searchParams }: Pick<PageProps<"/search">, "searchParams">) {
  const { q } = await searchParams;
  const keyword = typeof q === "string" ? q.trim().slice(0, 100) : "";

  if (!keyword) {
    return <p className="empty">キーワードを入力してください。</p>;
  }

  const { contents, totalCount } = await getArticles({ q: keyword });

  return (
    <>
      <p className="search-summary">
        「{keyword}」の検索結果：{totalCount}件
        {totalCount > contents.length && `（上位${contents.length}件を表示）`}
      </p>
      {contents.length === 0 ? (
        <p className="empty">該当する記事はありませんでした。</p>
      ) : (
        <div className="card-grid">
          {contents.map((a) => (
            <ArticleCard key={a.id} article={a} />
          ))}
        </div>
      )}
    </>
  );
}

export default function Page({ searchParams }: PageProps<"/search">) {
  return (
    <>
      <h1 className="page-title">検索</h1>
      <Suspense fallback={<ArticleListSkeleton />}>
        <Results searchParams={searchParams} />
      </Suspense>
    </>
  );
}
