import { draftMode } from "next/headers";
import { redirect } from "next/navigation";
import { getDraftArticle } from "@/lib/draft";

/**
 * microCMS の「画面プレビュー」から呼ばれる。
 * 遷移先URL: https://{サイト}/api/draft?contentId={CONTENT_ID}&draftKey={DRAFT_KEY}
 *
 * draftKey で実際に下書きを取得できた場合だけ Draft Mode を有効にする。
 * これにより、第三者が任意のURLでプレビュー用 Cookie を発行することを防ぐ。
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const contentId = searchParams.get("contentId");
  const draftKey = searchParams.get("draftKey");

  if (!contentId || !draftKey || !/^[\w-]+$/.test(contentId)) {
    return new Response("contentId と draftKey が必要です", { status: 400 });
  }

  const article = await getDraftArticle(contentId, draftKey);
  if (!article) {
    return new Response("下書きが見つかりません", { status: 404 });
  }

  (await draftMode()).enable();
  redirect(`/articles/${article.id}?draftKey=${encodeURIComponent(draftKey)}`);
}
