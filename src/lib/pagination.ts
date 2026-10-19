/** 2ページ目以降は `${basePath}/page/2` の形式。1ページ目は basePath そのもの */
export function pageHref(basePath: string, page: number) {
  if (page <= 1) return basePath;
  return `${basePath === "/" ? "" : basePath}/page/${page}`;
}
