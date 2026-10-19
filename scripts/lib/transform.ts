import * as cheerio from "cheerio";

/** WordPress REST API（/wp-json/wp/v2/...）のレスポンスのうち、移行に使う項目 */
export type WpCategory = { id: number; name: string; slug: string };
export type WpPost = {
  id: number;
  slug: string;
  status: string;
  date_gmt: string;
  title: { rendered: string };
  content: { rendered: string };
  categories: number[];
};

export type MicroCMSCategoryInput = { contentId: string; content: { name: string } };
export type MicroCMSArticleInput = {
  contentId: string;
  content: { title: string; content: string; category: string | null };
  /** 元記事の情報（ログ・確認用。microCMS には送らない） */
  source: { wpId: number; publishedAt: string };
};

/** microCMS のコンテンツIDに使える文字（半角英数字・ハイフン・アンダースコア） */
const CONTENT_ID_PATTERN = /^[a-zA-Z0-9_-]{1,50}$/;

/** WordPress の「未分類」はカテゴリなしとして扱う */
const UNCATEGORIZED_SLUGS = new Set(["uncategorized", "未分類"]);

/**
 * WordPress のスラッグをそのままコンテンツIDにできれば使う（URLを維持でき、SEO上も有利）。
 * 日本語スラッグなど使えない場合は `${prefix}-${WordPressのID}` にする。
 */
export function toContentId(slug: string, wpId: number, prefix: string): string {
  const decoded = safeDecode(slug);
  return CONTENT_ID_PATTERN.test(decoded) ? decoded : `${prefix}-${wpId}`;
}

export function isUncategorized(category: WpCategory): boolean {
  return UNCATEGORIZED_SLUGS.has(safeDecode(category.slug));
}

export function toMicroCMSCategory(category: WpCategory): MicroCMSCategoryInput {
  return {
    contentId: toContentId(category.slug, category.id, "wp-cat"),
    content: { name: decodeText(category.name) },
  };
}

/**
 * WordPress の記事を microCMS の「ブログ」スキーマに変換する。
 * @param categoryIdMap WordPress のカテゴリID → microCMS のコンテンツID
 */
export function toMicroCMSArticle(post: WpPost, categoryIdMap: Map<number, string>): MicroCMSArticleInput {
  // microCMS のコンテンツ参照は1件のため、WordPress で最初に付いている有効なカテゴリを使う
  const category = post.categories.map((id) => categoryIdMap.get(id)).find((id) => id !== undefined) ?? null;

  return {
    contentId: toContentId(post.slug, post.id, "wp"),
    content: {
      title: decodeText(post.title.rendered),
      content: cleanHtml(post.content.rendered),
      category,
    },
    source: { wpId: post.id, publishedAt: post.date_gmt.endsWith("Z") ? post.date_gmt : `${post.date_gmt}Z` },
  };
}

/** タイトルなどに含まれる HTML エンティティ（&#8211; など）を文字に戻す */
export function decodeText(html: string): string {
  return cheerio.load(`<p>${html}</p>`, null, false)("p").text().trim();
}

/**
 * 本文の HTML を microCMS のリッチエディタ向けに整える。
 * - ブロックエディタのコメント（<!-- wp:paragraph --> など）を除去
 * - 中身のない段落を除去
 */
export function cleanHtml(html: string): string {
  const $ = cheerio.load(html, null, false);
  $("*")
    .contents()
    .filter((_, node) => node.type === "comment")
    .remove();
  $.root()
    .contents()
    .filter((_, node) => node.type === "comment")
    .remove();
  $("p").each((_, el) => {
    const $el = $(el);
    if ($el.text().trim() === "" && $el.find("img, iframe, video").length === 0) $el.remove();
  });
  return $.html().trim();
}

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
