"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";

export default function Nav() {
  const pathname = usePathname();
  const { data: session } = useSession();

  if (!session) return null;

  const linkClass = (href: string) =>
    `rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors ${
      pathname === href
        ? "bg-foreground text-background"
        : "text-muted hover:bg-foreground/5 hover:text-foreground"
    }`;

  return (
    <nav className="glass sticky top-0 z-40 border-b border-border">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-y-2 px-6 py-3">
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-[17px] font-semibold tracking-tight">ラクシフ</span>
          <div className="flex flex-wrap items-center gap-1">
            <Link href="/dashboard" className={linkClass("/dashboard")}>
              カレンダー
            </Link>
            <Link href="/workplaces" className={linkClass("/workplaces")}>
              バイト先管理
            </Link>
            <Link href="/income" className={linkClass("/income")}>
              年間収入
            </Link>
            <Link href="/friends" className={linkClass("/friends")}>
              フレンド
            </Link>
            <Link href="/messages" className={linkClass("/messages")}>
              メッセージ
            </Link>
            <Link href="/groups" className={linkClass("/groups")}>
              グループ
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/profile"
            className="text-[13px] text-muted transition-colors hover:text-foreground"
          >
            {session.user?.name}
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-[13px] text-muted transition-colors hover:text-foreground"
          >
            ログアウト
          </button>
        </div>
      </div>
    </nav>
  );
}
