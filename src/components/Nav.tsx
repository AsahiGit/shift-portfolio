"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";

export default function Nav() {
  const pathname = usePathname();
  const { data: session } = useSession();

  if (!session) return null;

  const linkClass = (href: string) =>
    `rounded-full px-4 py-1.5 text-[13px] font-medium transition-colors ${
      pathname === href
        ? "bg-foreground text-background"
        : "text-muted hover:bg-foreground/5 hover:text-foreground"
    }`;

  return (
    <nav className="glass sticky top-0 z-40 border-b border-border">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-3">
        <div className="flex items-center gap-4">
          <span className="text-[17px] font-semibold tracking-tight">ラクシフ</span>
          <div className="flex items-center gap-1">
            <Link href="/dashboard" className={linkClass("/dashboard")}>
              カレンダー
            </Link>
            <Link href="/workplaces" className={linkClass("/workplaces")}>
              バイト先管理
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[13px] text-muted">{session.user?.name}</span>
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
