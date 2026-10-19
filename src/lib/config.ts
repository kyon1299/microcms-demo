/** 1ページあたりの表示件数 */
export const PER_PAGE = 6;

/** microCMS のエンドポイント名（「ブログ」テンプレートの既定値） */
export const ENDPOINTS = {
  articles: "blogs",
  categories: "categories",
} as const;

/** キャッシュタグ。Webhook で受け取った API 名と ID からこの形式のタグを再検証する */
export const cacheTags = {
  list: (endpoint: string) => endpoint,
  item: (endpoint: string, id: string) => `${endpoint}:${id}`,
};

/**
 * 環境変数が揃っていない場合はサンプルデータで動かす。
 * microCMS のアカウントがなくても `npm run dev` で画面を確認できるようにするため。
 */
export const isSampleMode = !process.env.MICROCMS_SERVICE_DOMAIN || !process.env.MICROCMS_API_KEY;
