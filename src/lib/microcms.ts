import "server-only";
import { createClient } from "microcms-js-sdk";

let client: ReturnType<typeof createClient> | null = null;

/**
 * microCMS クライアント（サーバー専用）。
 * API キーをブラウザに渡さないよう、`server-only` でクライアントコンポーネントからの import を防いでいる。
 */
export function getClient() {
  if (client) return client;
  const serviceDomain = process.env.MICROCMS_SERVICE_DOMAIN;
  const apiKey = process.env.MICROCMS_API_KEY;
  if (!serviceDomain || !apiKey) {
    throw new Error("MICROCMS_SERVICE_DOMAIN と MICROCMS_API_KEY を設定してください");
  }
  client = createClient({ serviceDomain, apiKey, retry: true });
  return client;
}
