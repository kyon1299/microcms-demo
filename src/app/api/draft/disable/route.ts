import { draftMode } from "next/headers";
import { redirect } from "next/navigation";

/** 下書きプレビューを終了して、通常の記事ページに戻る */
export async function GET(request: Request) {
  (await draftMode()).disable();

  const target = new URL(request.url).searchParams.get("redirect") ?? "/";
  // オープンリダイレクトを防ぐため、サイト内のパスだけを許可する
  redirect(target.startsWith("/") && !target.startsWith("//") ? target : "/");
}
