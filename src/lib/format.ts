/** ISO 8601 の日時を「2026年10月19日」の形式で表示する（日本時間） */
export function formatDate(iso?: string): string {
  if (!iso) return "";
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(iso));
}
