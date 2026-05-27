import type { Metadata } from "next";
import Link from "next/link";
import { AppNav } from "@/components/app-nav";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lantern Library",
  description: "ระบบห้องสมุดสำหรับงานยืมคืนหนังสือที่พัฒนาด้วย Next.js App Router"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div className="site-background" />
        <div className="page-shell">
          <header className="site-header">
            <Link href="/" className="brand">
              <span className="brand-mark">LL</span>
              <span>
                <strong>Lantern Library</strong>
                <small>ระบบจัดการงานยืมคืนหนังสือ</small>
              </span>
            </Link>
            <AppNav />
          </header>
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
