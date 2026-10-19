/**
 * WordPress → microCMS 記事移行スクリプト
 *
 * 使い方:
 *   npm run migrate -- --wp-url https://example.com --dry-run   # 変換結果の確認のみ
 *   npm run migrate -- --wp-url https://example.com             # microCMS に登録
 *   npm run migrate -- --input scripts/fixtures --dry-run       # 保存済み JSON から
 *
 * 必要な環境変数（--dry-run 以外）:
 *   MICROCMS_SERVICE_DOMAIN
 *   MICROCMS_WRITE_API_KEY  … blogs / categories の GET・POST・PUT・PATCH 権限を持つキー
 *
 * 方針:
 *   1. カテゴリを先に登録し、WordPress のカテゴリID → microCMS のIDの対応表を作る
 *   2. 記事を登録する。同じコンテンツIDが既にあれば上書きするため、何度実行しても重複しない
 *   3. 失敗した記事は最後に一覧で表示し、終了コード 1 で終わる
 */
import { parseArgs } from "node:util";
import { createClient, isMicroCMSRequestError } from "microcms-js-sdk";
import {
  isUncategorized,
  toMicroCMSArticle,
  toMicroCMSCategory,
  type MicroCMSArticleInput,
} from "./lib/transform";
import { loadWordPress } from "./lib/wordpress";

const ENDPOINTS = { articles: "blogs", categories: "categories" } as const;
/** microCMS の書き込みAPIのレート制限に配慮した待ち時間 */
const WRITE_INTERVAL_MS = 300;

const { values: args } = parseArgs({
  options: {
    "wp-url": { type: "string" },
    input: { type: "string" },
    "dry-run": { type: "boolean", default: false },
    limit: { type: "string" },
  },
});

async function main() {
  const dryRun = args["dry-run"];
  const limit = args.limit ? Number(args.limit) : undefined;

  console.log(`WordPress からデータを取得しています…`);
  const wp = await loadWordPress({ wpUrl: args["wp-url"], inputDir: args.input });
  console.log(`  記事 ${wp.posts.length}件 / カテゴリ ${wp.categories.length}件`);

  const categories = wp.categories.filter((c) => !isUncategorized(c));
  const categoryInputs = categories.map(toMicroCMSCategory);
  const categoryIdMap = new Map(categories.map((c, i) => [c.id, categoryInputs[i].contentId]));

  const articleInputs = wp.posts.slice(0, limit).map((p) => toMicroCMSArticle(p, categoryIdMap));

  if (dryRun) {
    console.log("\n[dry-run] microCMS には登録しません。変換結果:\n");
    console.log(JSON.stringify({ categories: categoryInputs, articles: articleInputs.map(preview) }, null, 2));
    return;
  }

  const serviceDomain = process.env.MICROCMS_SERVICE_DOMAIN;
  const apiKey = process.env.MICROCMS_WRITE_API_KEY;
  if (!serviceDomain || !apiKey) {
    throw new Error("MICROCMS_SERVICE_DOMAIN と MICROCMS_WRITE_API_KEY を設定してください");
  }
  const client = createClient({ serviceDomain, apiKey, retry: true });

  const failures: { contentId: string; reason: string }[] = [];
  const counts = { created: 0, updated: 0 };

  const upsert = async (endpoint: string, input: { contentId: string; content: Record<string, unknown> }) => {
    try {
      const exists = await client
        .getListDetail({ endpoint, contentId: input.contentId, queries: { fields: "id" } })
        .then(() => true)
        .catch((e) => {
          if (isMicroCMSRequestError(e) && e.status === 404) return false;
          throw e;
        });
      if (exists) {
        await client.update({ endpoint, contentId: input.contentId, content: input.content });
        counts.updated++;
      } else {
        await client.create({ endpoint, contentId: input.contentId, content: input.content });
        counts.created++;
      }
      console.log(`  ${exists ? "更新" : "作成"}: ${endpoint}/${input.contentId}`);
    } catch (e) {
      const reason = e instanceof Error ? e.message : String(e);
      failures.push({ contentId: `${endpoint}/${input.contentId}`, reason });
      console.error(`  失敗: ${endpoint}/${input.contentId} … ${reason}`);
    }
    await sleep(WRITE_INTERVAL_MS);
  };

  console.log("\nカテゴリを登録しています…");
  for (const input of categoryInputs) await upsert(ENDPOINTS.categories, input);

  console.log("\n記事を登録しています…");
  for (const input of articleInputs) await upsert(ENDPOINTS.articles, input);

  console.log(`\n完了: 作成 ${counts.created}件 / 更新 ${counts.updated}件 / 失敗 ${failures.length}件`);
  if (failures.length > 0) {
    console.table(failures);
    process.exitCode = 1;
  }
}

function preview(a: MicroCMSArticleInput) {
  const text = a.content.content.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
  return { ...a, content: { ...a.content, content: `${text.slice(0, 60)}…（${a.content.content.length}文字のHTML）` } };
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
