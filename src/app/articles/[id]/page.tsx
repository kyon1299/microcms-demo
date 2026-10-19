import { Suspense } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { draftMode } from "next/headers";
import { notFound } from "next/navigation";
import { Toc } from "@/components/Toc";
import { excerpt, processContent } from "@/lib/content";
import { getArticle, getPrerenderArticleIds } from "@/lib/data";
import { getDraftArticle } from "@/lib/draft";
import { formatDate } from "@/lib/format";

type Props = PageProps<"/articles/[id]">;

export async function generateStaticParams() {
  const ids = await getPrerenderArticleIds();
  return ids.map((id) => ({ id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const article = await getArticle(id);
  if (!article) return { title: "記事が見つかりません" };
  const description = excerpt(article.content);
  return {
    title: article.title,
    description,
    openGraph: {
      title: article.title,
      description,
      type: "article",
      images: article.eyecatch ? [article.eyecatch.url] : undefined,
    },
  };
}

async function ArticleBody({ params, searchParams }: Props) {
  const { id } = await params;

  // 下書きプレビュー中だけ draftKey を使って最新の下書きを取得する
  const { isEnabled: isDraft } = await draftMode();
  let article = null;
  if (isDraft) {
    const { draftKey } = await searchParams;
    if (typeof draftKey === "string") article = await getDraftArticle(id, draftKey);
  }
  article ??= await getArticle(id);
  if (!article) notFound();

  const { html, toc } = processContent(article.content);

  return (
    <>
      {isDraft && (
        <div className="draft-banner" role="status">
          下書きプレビュー中です。
          {/* プリフェッチで Cookie が消えないよう、Link ではなく a 要素を使う */}
          <a href={`/api/draft/disable?redirect=/articles/${id}`}>プレビューを終了</a>
        </div>
      )}
      <article className="article">
        <header className="article__header">
          {article.category && (
            <Link href={`/category/${article.category.id}`} className="tag">
              {article.category.name}
            </Link>
          )}
          <h1>{article.title}</h1>
          <p className="article__meta">
            <time dateTime={article.publishedAt}>{formatDate(article.publishedAt ?? article.createdAt)}</time>
            {article.revisedAt && article.revisedAt !== article.publishedAt && (
              <span>（更新：{formatDate(article.revisedAt)}）</span>
            )}
          </p>
        </header>
        {article.eyecatch && (
          <Image
            className="article__eyecatch"
            src={article.eyecatch.url}
            alt={article.eyecatch.alt ?? ""}
            width={article.eyecatch.width ?? 1200}
            height={article.eyecatch.height ?? 630}
            sizes="(max-width: 960px) 100vw, 720px"
            priority
          />
        )}
        <div className="article__layout">
          <aside className="article__toc">
            <Toc items={toc} />
          </aside>
          {/* microCMS の管理画面で編集者が入力した HTML のみを表示する */}
          <div className="prose" dangerouslySetInnerHTML={{ __html: html }} />
        </div>
      </article>
    </>
  );
}

export default function Page(props: Props) {
  return (
    <Suspense fallback={<div className="article article--skeleton" aria-busy="true" />}>
      <ArticleBody {...props} />
    </Suspense>
  );
}
