"use cache";

import { cacheLife, cacheTag } from "next/cache";
import { isMicroCMSRequestError } from "microcms-js-sdk";
import { sampleArticles, sampleCategories } from "@/data/sample";
import { ENDPOINTS, PER_PAGE, cacheTags, isSampleMode } from "./config";
import { getClient } from "./microcms";
import type { Article, ArticleList, ArticleSummary, Category } from "./types";

/**
 * 公開済みコンテンツの取得（キャッシュあり）。
 * - 一覧は `blogs`、記事は `blogs:{id}` のタグを付け、Webhook で必要な分だけ再検証する
 * - API キーが無い場合はサンプルデータを返す
 */

const LIST_FIELDS = ["id", "title", "eyecatch", "category", "createdAt", "updatedAt", "publishedAt", "revisedAt"];

type ListQuery = { page?: number; categoryId?: string; q?: string };

export async function getArticles({ page = 1, categoryId, q }: ListQuery = {}): Promise<ArticleList> {
  cacheLife("days");
  cacheTag(cacheTags.list(ENDPOINTS.articles));

  const offset = (page - 1) * PER_PAGE;

  if (isSampleMode) {
    const keyword = q?.toLowerCase();
    const filtered = sampleArticles
      .filter((a) => !categoryId || a.category?.id === categoryId)
      .filter((a) => !keyword || `${a.title}${a.content}`.toLowerCase().includes(keyword));
    return {
      contents: filtered.slice(offset, offset + PER_PAGE).map(toSummary),
      totalCount: filtered.length,
    };
  }

  const res = await getClient().getList<ArticleSummary>({
    endpoint: ENDPOINTS.articles,
    queries: {
      limit: PER_PAGE,
      offset,
      fields: LIST_FIELDS,
      orders: "-publishedAt",
      filters: categoryId ? `category[equals]${categoryId}` : undefined,
      q: q || undefined,
    },
  });
  return { contents: res.contents, totalCount: res.totalCount };
}

export async function getArticle(id: string): Promise<Article | null> {
  cacheLife("days");
  cacheTag(cacheTags.item(ENDPOINTS.articles, id));

  if (isSampleMode) {
    return sampleArticles.find((a) => a.id === id) ?? null;
  }

  try {
    return await getClient().getListDetail<Article>({ endpoint: ENDPOINTS.articles, contentId: id });
  } catch (e) {
    if (isNotFound(e)) return null;
    throw e;
  }
}

export async function getCategories(): Promise<Category[]> {
  cacheLife("days");
  cacheTag(cacheTags.list(ENDPOINTS.categories));

  if (isSampleMode) return sampleCategories;

  return getClient().getAllContents<Category>({
    endpoint: ENDPOINTS.categories,
    queries: { fields: ["id", "name", "createdAt", "updatedAt", "publishedAt", "revisedAt"] },
  });
}

export async function getCategory(id: string): Promise<Category | null> {
  const categories = await getCategories();
  return categories.find((c) => c.id === id) ?? null;
}

/** ビルド時に事前生成する記事ID（新しい順に最大100件。残りは初回アクセス時に生成） */
export async function getPrerenderArticleIds(): Promise<string[]> {
  cacheLife("days");
  cacheTag(cacheTags.list(ENDPOINTS.articles));

  if (isSampleMode) return sampleArticles.map((a) => a.id);

  const res = await getClient().getList<{ id: string }>({
    endpoint: ENDPOINTS.articles,
    queries: { limit: 100, fields: ["id"], orders: "-publishedAt" },
  });
  return res.contents.map((c) => c.id);
}

function toSummary(article: Article): ArticleSummary {
  const summary: Partial<Article> = { ...article };
  delete summary.content;
  return summary as ArticleSummary;
}

function isNotFound(e: unknown) {
  return isMicroCMSRequestError(e) && e.status === 404;
}
