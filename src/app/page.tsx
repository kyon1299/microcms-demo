import { ArticleList } from "@/components/ArticleList";

export default function Home() {
  return (
    <>
      <h1 className="page-title">新着記事</h1>
      <ArticleList page={1} basePath="/" />
    </>
  );
}
