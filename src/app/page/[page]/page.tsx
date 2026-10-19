import { Suspense } from "react";
import type { Metadata } from "next";
import { ArticleList, ArticleListSkeleton } from "@/components/ArticleList";

export async function generateMetadata({ params }: PageProps<"/page/[page]">): Promise<Metadata> {
  const { page } = await params;
  return { title: `新着記事（${page}ページ目）` };
}

async function Content({ params }: Pick<PageProps<"/page/[page]">, "params">) {
  const { page } = await params;
  return <ArticleList page={Number(page)} basePath="/" />;
}

export default function Page({ params }: PageProps<"/page/[page]">) {
  return (
    <>
      <h1 className="page-title">新着記事</h1>
      <Suspense fallback={<ArticleListSkeleton />}>
        <Content params={params} />
      </Suspense>
    </>
  );
}
