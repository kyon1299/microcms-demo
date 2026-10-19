import Link from "next/link";
import { getCategories } from "@/lib/data";

export async function Header() {
  const categories = await getCategories();

  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <Link href="/" className="site-title">
          Headless Notes
        </Link>
        {/* JavaScript なしでも動くよう、通常のフォーム送信で /search に遷移する */}
        <form action="/search" method="get" className="search-form" role="search">
          <label htmlFor="q" className="visually-hidden">
            記事を検索
          </label>
          <input id="q" name="q" type="search" placeholder="記事を検索" required maxLength={100} />
          <button type="submit">検索</button>
        </form>
      </div>
      <nav className="container category-nav" aria-label="カテゴリ">
        <Link href="/">すべて</Link>
        {categories.map((c) => (
          <Link key={c.id} href={`/category/${c.id}`}>
            {c.name}
          </Link>
        ))}
      </nav>
    </header>
  );
}
