import { revalidateTag } from "next/cache";
import { cacheTags } from "@/lib/config";
import { verifySignature } from "@/lib/signature";

type WebhookBody = {
  service?: string;
  api?: string;
  id?: string | null;
  type?: "new" | "edit" | "delete";
};

/**
 * microCMS の Webhook（カスタム通知）を受け取り、該当するキャッシュを再検証する。
 * 管理画面の Webhook 設定で、シークレットに MICROCMS_WEBHOOK_SECRET と同じ値を設定する。
 */
export async function POST(request: Request) {
  const secret = process.env.MICROCMS_WEBHOOK_SECRET;
  if (!secret) {
    return Response.json({ message: "MICROCMS_WEBHOOK_SECRET が未設定です" }, { status: 500 });
  }

  // 署名は生のリクエストボディから計算されるため、JSON として読む前に文字列で取得する
  const rawBody = await request.text();
  const signature = request.headers.get("x-microcms-signature");
  if (!verifySignature(rawBody, signature, secret)) {
    return Response.json({ message: "署名が一致しません" }, { status: 401 });
  }

  let body: WebhookBody;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return Response.json({ message: "不正なリクエストです" }, { status: 400 });
  }
  if (!body.api) {
    return Response.json({ message: "api がありません" }, { status: 400 });
  }

  // 編集者は公開直後に確認するため、古いキャッシュを返さない設定（expire: 0）で再検証する
  const tags = [cacheTags.list(body.api)];
  if (body.id) tags.push(cacheTags.item(body.api, body.id));
  for (const tag of tags) revalidateTag(tag, { expire: 0 });

  return Response.json({ revalidated: tags });
}
