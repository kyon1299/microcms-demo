import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleList, ArticleListSkeleton } from "@/components/ArticleList";
import { getCategories, getCategory } from "@/lib/data";

export async function generateStaticParams() {
  const categories = await getCategories();
  return categories.map((c) => ({ categoryId: c.id }));
}

export async function generateMetadata({ params }: PageProps<"/category/[categoryId]">): Promise<Metadata> {
  const { categoryId } = await params;
  const category = await getCategory(categoryId);
  return { title: category?.name ?? "カテゴリ" };
}

async function Content({ params }: Pick<PageProps<"/category/[categoryId]">, "params">) {
  const { categoryId } = await params;
  const category = await getCategory(categoryId);
  if (!category) notFound();

  return (
    <>
      <h1 className="page-title">{category.name}</h1>
      <ArticleList page={1} basePath={`/category/${category.id}`} categoryId={category.id} />
    </>
  );
}

export default function Page({ params }: PageProps<"/category/[categoryId]">) {
  return (
    <Suspense fallback={<ArticleListSkeleton />}>
      <Content params={params} />
    </Suspense>
  );
}
