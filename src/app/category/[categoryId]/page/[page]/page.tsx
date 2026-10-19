import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleList, ArticleListSkeleton } from "@/components/ArticleList";
import { getCategory } from "@/lib/data";

type Props = PageProps<"/category/[categoryId]/page/[page]">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { categoryId, page } = await params;
  const category = await getCategory(categoryId);
  return { title: `${category?.name ?? "カテゴリ"}（${page}ページ目）` };
}

async function Content({ params }: Pick<Props, "params">) {
  const { categoryId, page } = await params;
  const category = await getCategory(categoryId);
  if (!category) notFound();

  return (
    <>
      <h1 className="page-title">{category.name}</h1>
      <ArticleList page={Number(page)} basePath={`/category/${category.id}`} categoryId={category.id} />
    </>
  );
}

export default function Page({ params }: Props) {
  return (
    <Suspense fallback={<ArticleListSkeleton />}>
      <Content params={params} />
    </Suspense>
  );
}
