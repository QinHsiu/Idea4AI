import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Idea4AI",
  description: "Validate vibe coding ideas before you build",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>
        <header className="site-header">
          <Link href="/" className="brand">
            Idea4AI
          </Link>
          <nav>
            <Link href="/validate">验证</Link>
            <Link href="/ideas">历史</Link>
          </nav>
        </header>
        <div className="site-main">{children}</div>
      </body>
    </html>
  );
}
