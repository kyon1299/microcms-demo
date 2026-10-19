import Link from "next/link";
import { pageHref } from "@/lib/pagination";

type Props = {
  current: number;
  totalPages: number;
  /** 1ページ目のURL（例: "/" や "/category/news"） */
  basePath: string;
};

export function Pagination({ current, totalPages, basePath }: Props) {
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <nav className="pagination" aria-label="ページ送り">
      {current > 1 && (
        <Link href={pageHref(basePath, current - 1)} rel="prev">
          前へ
        </Link>
      )}
      {pages.map((p) =>
        p === current ? (
          <span key={p} aria-current="page">
            {p}
          </span>
        ) : (
          <Link key={p} href={pageHref(basePath, p)}>
            {p}
          </Link>
        ),
      )}
      {current < totalPages && (
        <Link href={pageHref(basePath, current + 1)} rel="next">
          次へ
        </Link>
      )}
    </nav>
  );
}
