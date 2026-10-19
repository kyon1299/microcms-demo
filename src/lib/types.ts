import type { MicroCMSImage, MicroCMSListContent } from "microcms-js-sdk";

/**
 * microCMS の「ブログ」テンプレートと同じスキーマ。
 * - blogs:      title / content（リッチエディタ）/ eyecatch / category（コンテンツ参照）
 * - categories: name
 */
export type Category = MicroCMSListContent & {
  name: string;
};

export type Article = MicroCMSListContent & {
  title: string;
  content: string;
  eyecatch?: MicroCMSImage;
  category?: Category | null;
};

/** 一覧表示用（本文を含まない軽量な型） */
export type ArticleSummary = Omit<Article, "content">;

export type ArticleList = {
  contents: ArticleSummary[];
  totalCount: number;
};
