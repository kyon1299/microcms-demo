import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * microCMS Webhook の署名（X-MICROCMS-Signature）を検証する。
 * リクエストボディをシークレットで HMAC-SHA256 した16進文字列と一致すれば正当なリクエスト。
 * 比較には timingSafeEqual を使い、比較時間の差から署名を推測されないようにする。
 */
export function verifySignature(rawBody: string, signature: string | null, secret: string): boolean {
  if (!signature) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
}
