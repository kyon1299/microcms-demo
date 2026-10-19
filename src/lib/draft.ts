import "server-only";
import { ENDPOINTS, isSampleMode } from "./config";
import { getClient } from "./microcms";
import type { Article } from "./types";

/**
 * 下書きの取得。下書きは編集のたびに変わるため、キャッシュしない（"use cache" を付けない）。
 * draftKey が正しくない場合や記事が存在しない場合は null を返す。
 */
export async function getDraftArticle(id: string, draftKey: string): Promise<Article | null> {
  if (isSampleMode) return null;
  try {
    return await getClient().getListDetail<Article>({
      endpoint: ENDPOINTS.articles,
      contentId: id,
      queries: { draftKey },
      customRequestInit: { cache: "no-store" },
    });
  } catch {
    return null;
  }
}
