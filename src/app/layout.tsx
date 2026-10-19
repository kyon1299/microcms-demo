import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { isSampleMode } from "@/lib/config";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Headless Notes", template: "%s | Headless Notes" },
  description: "Next.js と microCMS で構築したヘッドレスCMSのデモサイト",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>
        <Header />
        <main className="container main">{children}</main>
        <footer className="site-footer">
          <div className="container">
            <p>Next.js × microCMS デモサイト</p>
            {isSampleMode && <p className="sample-note">現在はサンプルデータで表示しています（microCMS の API キー未設定）</p>}
          </div>
        </footer>
      </body>
    </html>
  );
}
