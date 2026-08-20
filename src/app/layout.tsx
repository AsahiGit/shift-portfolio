import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/Providers";
import Nav from "@/components/Nav";

export const metadata: Metadata = {
  title: "ラクシフ | バイトシフト・給料管理",
  description: "複数バイトのシフトと給料をまとめて管理できるWebアプリ",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ja" className="h-full antialiased">
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <Providers>
          <Nav />
          {children}
        </Providers>
      </body>
    </html>
  );
}
