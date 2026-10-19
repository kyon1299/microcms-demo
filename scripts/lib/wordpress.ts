import { readFile } from "node:fs/promises";
import path from "node:path";
import type { WpCategory, WpPost } from "./transform";

type Source = { wpUrl?: string; inputDir?: string };

/**
 * WordPress から公開済みの記事とカテゴリを取得する。
 * - wpUrl:    REST API（/wp-json/wp/v2/）から全件取得
 * - inputDir: REST API のレスポンスを保存した JSON（posts.json / categories.json）を読む
 */
export async function loadWordPress({ wpUrl, inputDir }: Source) {
  if (inputDir) {
    const read = async <T>(file: string) => JSON.parse(await readFile(path.join(inputDir, file), "utf8")) as T;
    const [posts, categories] = await Promise.all([read<WpPost[]>("posts.json"), read<WpCategory[]>("categories.json")]);
    return { posts: posts.filter((p) => p.status === "publish"), categories };
  }
  if (!wpUrl) throw new Error("--wp-url か --input のどちらかを指定してください");

  const base = wpUrl.replace(/\/$/, "");
  const [posts, categories] = await Promise.all([
    fetchAll<WpPost>(`${base}/wp-json/wp/v2/posts`, "id,slug,status,date_gmt,title,content,categories"),
    fetchAll<WpCategory>(`${base}/wp-json/wp/v2/categories`, "id,name,slug"),
  ]);
  return { posts, categories };
}

/** REST API は1回100件までのため、X-WP-TotalPages を見て全ページ取得する */
async function fetchAll<T>(endpoint: string, fields: string): Promise<T[]> {
  const results: T[] = [];
  let page = 1;
  let totalPages = 1;
  do {
    const url = `${endpoint}?per_page=100&page=${page}&_fields=${fields}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`WordPress API エラー: ${res.status} ${url}`);
    results.push(...((await res.json()) as T[]));
    totalPages = Number(res.headers.get("x-wp-totalpages") ?? "1");
    page++;
  } while (page <= totalPages);
  return results;
}
