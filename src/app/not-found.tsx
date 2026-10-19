import Link from "next/link";

export default function NotFound() {
  return (
    <div className="not-found">
      <h1 className="page-title">ページが見つかりません</h1>
      <p>URLが間違っているか、記事が削除された可能性があります。</p>
      <Link href="/">トップへ戻る</Link>
    </div>
  );
}
