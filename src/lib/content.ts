import * as cheerio from "cheerio";

export type TocItem = { id: string; text: string; level: 2 | 3 };

/**
 * リッチエディタの HTML を整形し、見出しから目次を作る。
 * - h2/h3 にアンカー用の id を付ける（既に id があればそれを使う）
 * - 外部リンクは新しいタブで開き、rel="noopener noreferrer" を付ける
 * サーバー側で処理するため、表示後に目次が出てレイアウトがずれることがない。
 */
export function processContent(html: string): { html: string; toc: TocItem[] } {
  const $ = cheerio.load(html, null, false);
  const toc: TocItem[] = [];

  $("h2, h3").each((index, el) => {
    const $el = $(el);
    const id = $el.attr("id") || `heading-${index + 1}`;
    $el.attr("id", id);
    toc.push({ id, text: $el.text().trim(), level: el.tagName === "h2" ? 2 : 3 });
  });

  $('a[href^="http"]').each((_, el) => {
    $(el).attr("target", "_blank").attr("rel", "noopener noreferrer");
  });

  return { html: $.html(), toc };
}

/** 一覧やメタデータ用に、HTML からプレーンテキストの抜粋を作る */
export function excerpt(html: string, length = 100): string {
  const text = cheerio.load(html).text().replace(/\s+/g, " ").trim();
  return text.length > length ? `${text.slice(0, length)}…` : text;
}
