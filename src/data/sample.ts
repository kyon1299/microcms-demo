import type { Article, Category } from "@/lib/types";

/**
 * microCMS の API キーが未設定のときに使うサンプルデータ。
 * 形は microCMS のレスポンスと同じにしてあり、画面側のコードは切り替えを意識しない。
 */

const at = (date: string) => ({
  createdAt: date,
  updatedAt: date,
  publishedAt: date,
  revisedAt: date,
});

export const sampleCategories: Category[] = [
  { id: "news", name: "お知らせ", ...at("2026-10-01T00:00:00.000Z") },
  { id: "dev", name: "開発メモ", ...at("2026-10-01T00:00:00.000Z") },
  { id: "guide", name: "使い方", ...at("2026-10-01T00:00:00.000Z") },
];

const [news, dev, guide] = sampleCategories;

export const sampleArticles: Article[] = [
  {
    id: "webhook-revalidate",
    title: "microCMSのWebhookで、公開した記事をすぐにサイトへ反映する",
    category: dev,
    ...at("2026-10-18T09:00:00.000Z"),
    content: `
<p>このサイトは記事の一覧や本文をキャッシュしていますが、microCMSで記事を公開・更新・削除すると、Webhookを受け取って該当するキャッシュだけを破棄します。</p>
<h2>仕組み</h2>
<p>microCMSのWebhook（カスタム通知）で <code>/api/revalidate</code> にPOSTします。サイト側では署名を検証したうえで、API名と記事IDに対応するキャッシュタグを再検証します。</p>
<h3>署名の検証</h3>
<p>リクエストヘッダー <code>X-MICROCMS-Signature</code> の値と、シークレットで計算したHMAC-SHA256を比較します。比較には <code>timingSafeEqual</code> を使い、タイミング攻撃を防いでいます。</p>
<h3>どのキャッシュを消すか</h3>
<p>一覧用のタグ（例：<code>blogs</code>）と、記事ごとのタグ（例：<code>blogs:記事ID</code>）を分けています。記事を1件更新しても、他の記事のキャッシュはそのまま使えます。</p>
<h2>すぐに反映させる理由</h2>
<p>Next.jsの推奨は「古い内容を返しつつ裏で更新する」設定ですが、編集者は公開ボタンを押した直後に確認したいはずです。そのため、Webhookでは古いキャッシュを残さない設定にしています。</p>
`,
  },
  {
    id: "draft-preview",
    title: "下書きプレビューの設定方法",
    category: guide,
    ...at("2026-10-17T09:00:00.000Z"),
    content: `
<p>microCMSの管理画面で「画面プレビュー」を設定すると、公開前の記事をサイトのデザインのまま確認できます。</p>
<h2>管理画面での設定</h2>
<p>APIの設定 → 画面プレビュー で、遷移先URLに次の形式を入力します。</p>
<pre><code>https://（サイトのURL）/api/draft?contentId={CONTENT_ID}&amp;draftKey={DRAFT_KEY}</code></pre>
<h2>サイト側の動き</h2>
<p><code>/api/draft</code> は、受け取った <code>draftKey</code> で実際に記事を取得できるかを確認してから、Next.jsのDraft Modeを有効にします。存在しない記事や不正なキーではプレビューを開始しません。</p>
<h3>プレビューの終了</h3>
<p>プレビュー中は画面上部に帯が表示され、「プレビューを終了」から通常表示に戻れます。</p>
`,
  },
  {
    id: "wordpress-migration",
    title: "WordPressの記事をmicroCMSへ移行するスクリプトを用意しました",
    category: dev,
    ...at("2026-10-16T09:00:00.000Z"),
    content: `
<p>WordPressで運用しているサイトをヘッドレスCMSへ移す際、一番手間がかかるのは既存記事の移行です。このリポジトリには、WordPressのREST APIから記事を取得し、microCMSの書き込みAPIで登録するスクリプトを同梱しています。</p>
<h2>できること</h2>
<ul>
<li>カテゴリを先に移行し、記事のカテゴリ参照を自動で紐づける</li>
<li>本文中の見出しや段落はHTMLのまま移行する</li>
<li><code>--dry-run</code> で、登録せずに変換結果だけを確認する</li>
<li>同じIDで再実行しても重複しない（既存の記事は上書き）</li>
</ul>
<h2>注意点</h2>
<p>アイキャッチ画像は移行の対象外です。本文中の画像は元のURLのまま残るため、WordPress側のサーバーを停止する前に画像の移行が必要です。</p>
`,
  },
  {
    id: "site-open",
    title: "デモサイトを公開しました",
    category: news,
    ...at("2026-10-15T09:00:00.000Z"),
    content: `
<p>Next.jsとmicroCMSを組み合わせたデモサイトを公開しました。ヘッドレスCMSを導入するときに、よく相談される機能をひととおり実装しています。</p>
<h2>主な機能</h2>
<ul>
<li>記事一覧（ページ送り・カテゴリ別）</li>
<li>キーワード検索</li>
<li>記事本文の目次の自動生成</li>
<li>下書きプレビュー</li>
<li>Webhookによる即時反映</li>
</ul>
`,
  },
  {
    id: "table-of-contents",
    title: "記事本文から目次を自動で作る",
    category: dev,
    ...at("2026-10-14T09:00:00.000Z"),
    content: `
<p>microCMSのリッチエディタで書いた本文はHTMLとして返ってきます。サーバー側でHTMLを解析し、見出しから目次を作っています。</p>
<h2>処理の流れ</h2>
<h3>見出しを抜き出す</h3>
<p>本文中の <code>h2</code> と <code>h3</code> を取り出し、それぞれにアンカー用のIDを付けます。</p>
<h3>目次として表示する</h3>
<p>取り出した見出しをリストにして、本文の横に表示します。</p>
<h2>サーバーで処理する理由</h2>
<p>ブラウザ側で処理すると、表示後に目次が現れて画面がずれます。サーバーで処理すればその心配がなく、JavaScriptも増えません。</p>
`,
  },
  {
    id: "search",
    title: "キーワード検索の使い方",
    category: guide,
    ...at("2026-10-13T09:00:00.000Z"),
    content: `
<p>ヘッダーの検索ボックスから、記事のタイトルや本文を全文検索できます。</p>
<h2>仕組み</h2>
<p>microCMSのコンテンツAPIの <code>q</code> パラメータを使っています。検索用のサーバーを別に用意する必要はありません。</p>
`,
  },
  {
    id: "sample-mode",
    title: "APIキーがなくても動く「サンプルデータモード」",
    category: dev,
    ...at("2026-10-12T09:00:00.000Z"),
    content: `
<p>環境変数を設定していない場合、このサイトは同梱のサンプルデータで動きます。</p>
<h2>なぜ用意したか</h2>
<p>商談やデモの場では、まず画面を見てもらうことが大切です。アカウントの準備を待たずに動かせるようにしました。</p>
<h2>切り替えの仕組み</h2>
<p>データ取得の関数の中だけで切り替えているので、画面側のコードはどちらのデータかを意識しません。</p>
`,
  },
];
