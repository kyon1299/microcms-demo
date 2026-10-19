# Headless Notes — Next.js × microCMS デモサイト

ヘッドレスCMSの導入時によく相談される機能をひととおり実装した、Next.js と microCMS のデモサイトです。
あわせて、**WordPress の記事を microCMS へ移行するスクリプト**を同梱しています。

- デモ: https://microcms-demo-five.vercel.app
- microCMS の API キーがなくても、同梱のサンプルデータで動きます

## 機能

| 機能 | 内容 |
|---|---|
| 記事一覧 | 新着順、ページ送り（`/page/2`）、カテゴリ別（`/category/{id}`） |
| 記事詳細 | 見出しからの目次自動生成、OGP などのメタデータ |
| キーワード検索 | microCMS の全文検索（`q` パラメータ）を利用 |
| 下書きプレビュー | microCMS の「画面プレビュー」から、公開前の記事をサイトのデザインで確認 |
| 即時反映 | microCMS の Webhook を受け取り、変更された記事のキャッシュだけを再検証 |
| WordPress 移行 | REST API から記事・カテゴリを取得し、microCMS の書き込み API で登録 |

## 技術構成

- Next.js 16（App Router / Cache Components）、React 19、TypeScript
- microCMS（microcms-js-sdk）
- cheerio（本文 HTML の整形・目次生成）
- テスト: Node.js 標準のテストランナー（`node:test`）＋ tsx
- ホスティング: Vercel

## 設計で工夫した点

### 1. キャッシュを「一覧」と「記事ごと」に分けて再検証する
データ取得関数（`src/lib/data.ts`）に `"use cache"` を付け、一覧には `blogs`、記事には `blogs:{記事ID}` のタグを付けています。
Webhook では変更があった API と記事のタグだけを再検証するため、記事を1件更新しても他の記事のキャッシュはそのまま使えます。

Next.js の推奨は「古い内容を返しつつ裏で更新する」設定ですが、編集者は公開ボタンを押した直後にサイトを確認するため、Webhook では古いキャッシュを返さない設定（`expire: 0`）にしています。

### 2. Webhook とプレビューの安全性
- Webhook は `X-MICROCMS-Signature` を HMAC-SHA256 で検証し、比較には `timingSafeEqual` を使っています（`src/lib/signature.ts`）
- 下書きプレビューは、受け取った `draftKey` で実際に下書きを取得できた場合だけ Draft Mode を有効にします
- プレビュー終了時のリダイレクト先はサイト内のパスに限定し、オープンリダイレクトを防いでいます
- API キーを扱うモジュールには `server-only` を付け、ブラウザ側のコードに含まれないようにしています

### 3. API キーがなくても動く「サンプルデータモード」
商談やデモでは、まず画面を見てもらうことが大切です。環境変数が未設定ならサンプルデータで動くようにしました。
切り替えはデータ取得関数の中だけで行っているため、画面側のコードはどちらのデータかを意識しません。

### 4. 目次はサーバー側で生成する
リッチエディタの HTML をサーバー側で解析して目次を作るため、表示後に目次が現れてレイアウトがずれることがなく、ブラウザに送る JavaScript も増えません。

### 5. 移行スクリプトは「何度実行しても安全」にする
- 同じコンテンツIDが既にあれば上書きするため、途中で失敗しても再実行で続きから移行できます
- WordPress の英数字スラッグはそのままコンテンツIDにし、既存のURLを維持できるようにしています（日本語スラッグは `wp-{ID}`）
- `--dry-run` で、登録せずに変換結果だけを確認できます
- 失敗した記事は最後に一覧で表示し、終了コード 1 を返します

## ディレクトリ構成

```
src/
  app/                    ページとルートハンドラ
    api/draft/            下書きプレビューの開始・終了
    api/revalidate/       Webhook の受け口
  components/             UI コンポーネント
  lib/
    data.ts               公開コンテンツの取得（キャッシュあり）
    draft.ts              下書きの取得（キャッシュなし）
    content.ts            本文 HTML の整形・目次生成
    signature.ts          Webhook の署名検証
  data/sample.ts          サンプルデータ
scripts/
  migrate-wordpress.ts    WordPress → microCMS 移行スクリプト
  lib/transform.ts        変換ロジック（テスト対象）
  fixtures/               動作確認用の WordPress レスポンス
tests/                    単体テスト
```

## ローカルで動かす

```bash
npm install
npm run dev        # http://localhost:3000（サンプルデータで表示）
npm test           # 単体テスト
npm run typecheck  # 型チェック
```

## microCMS とつなぐ

1. microCMS でサービスを作成し、テンプレートで「ブログ」を選ぶ（`blogs` と `categories` の API が作られます）
2. 「API キー」で読み取り用のキー（GET のみ）を作成する
3. `.env.example` を `.env.local` にコピーし、`MICROCMS_SERVICE_DOMAIN` と `MICROCMS_API_KEY` を設定する
4. 下書きプレビュー: `blogs` の API 設定 → 画面プレビュー で、遷移先 URL に次を設定する
   ```
   https://{サイトのURL}/api/draft?contentId={CONTENT_ID}&draftKey={DRAFT_KEY}
   ```
5. 即時反映: `blogs` と `categories` の API 設定 → Webhook → カスタム通知 で、URL に `https://{サイトのURL}/api/revalidate` を、シークレットに `MICROCMS_WEBHOOK_SECRET` と同じ値を設定する

## WordPress から移行する

```bash
# 変換結果を確認する（登録しない）
npm run migrate -- --wp-url https://example.com --dry-run

# microCMS に登録する（MICROCMS_WRITE_API_KEY が必要）
npm run migrate -- --wp-url https://example.com

# 保存済みの JSON で試す
npm run migrate -- --input scripts/fixtures --dry-run
```

**現時点で移行しないもの**
- アイキャッチ画像（本文中の画像は元の URL のまま残るため、WordPress を停止する前に画像の移行が必要）
- 公開日時（microCMS 側の公開日時は移行した日時になります。元の日時はログで確認できます）
- 複数カテゴリ（microCMS の参照は1件のため、最初の有効なカテゴリを使用）

## 開発について

開発には Claude Code を活用しました。設計方針・実装内容はすべて自分で確認し、テストで動作を検証しています。
