import { test } from "node:test";
import assert from "node:assert/strict";
import {
  cleanHtml,
  decodeText,
  isUncategorized,
  toContentId,
  toMicroCMSArticle,
  toMicroCMSCategory,
  type WpPost,
} from "../scripts/lib/transform";

test("英数字のスラッグはそのままコンテンツIDにする（URLを維持するため）", () => {
  assert.equal(toContentId("renewal-2026", 101, "wp"), "renewal-2026");
});

test("日本語スラッグは wp-{ID} に置き換える", () => {
  assert.equal(toContentId("%e3%83%98%e3%83%83%e3%83%89", 102, "wp"), "wp-102");
});

test("「未分類」カテゴリは移行対象から外す", () => {
  assert.equal(isUncategorized({ id: 1, name: "未分類", slug: "uncategorized" }), true);
  assert.equal(isUncategorized({ id: 3, name: "お知らせ", slug: "news" }), false);
});

test("カテゴリ名のエンティティを文字に戻す", () => {
  assert.deepEqual(toMicroCMSCategory({ id: 3, name: "News &amp; Topics", slug: "news" }), {
    contentId: "news",
    content: { name: "News & Topics" },
  });
});

test("タイトルの HTML エンティティを文字に戻す", () => {
  assert.equal(decodeText("A &#8211; B"), "A – B");
});

test("ブロックエディタのコメントと空の段落を除去し、画像だけの段落は残す", () => {
  const html = cleanHtml('<!-- wp:paragraph --><p>本文</p><!-- /wp:paragraph --><p> </p><p><img src="a.png"></p>');
  assert.equal(html, '<p>本文</p><p><img src="a.png"></p>');
});

test("記事のカテゴリは、移行対象のうち最初のものを参照する", () => {
  const post: WpPost = {
    id: 102,
    slug: "headless",
    status: "publish",
    date_gmt: "2026-05-10T03:00:00",
    title: { rendered: "タイトル" },
    content: { rendered: "<p>本文</p>" },
    categories: [1, 5],
  };
  // カテゴリ1（未分類）は対応表に無いので、カテゴリ5が使われる
  const result = toMicroCMSArticle(post, new Map([[5, "wp-cat-5"]]));
  assert.equal(result.content.category, "wp-cat-5");
  assert.equal(result.source.publishedAt, "2026-05-10T03:00:00Z");
});

test("移行対象のカテゴリが無い記事はカテゴリなしにする", () => {
  const post: WpPost = {
    id: 1,
    slug: "a",
    status: "publish",
    date_gmt: "2026-01-01T00:00:00",
    title: { rendered: "t" },
    content: { rendered: "<p>c</p>" },
    categories: [1],
  };
  assert.equal(toMicroCMSArticle(post, new Map()).content.category, null);
});
