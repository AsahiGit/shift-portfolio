"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";

export default function Nav() {
  const pathname = usePathname();
  const { data: session } = useSession();

  if (!session) return null;

  const linkClass = (href: string) =>
    `px-3 py-2 rounded-md text-sm font-medium ${
      pathname === href
        ? "bg-blue-600 text-white"
        : "text-slate-600 hover:bg-slate-200"
    }`;

  return (
    <nav className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-blue-600">シフ管</span>
          <Link href="/dashboard" className={linkClass("/dashboard")}>
            カレンダー
          </Link>
          <Link href="/workplaces" className={linkClass("/workplaces")}>
            バイト先管理
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-500">{session.user?.name}</span>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-sm text-slate-500 hover:text-red-600"
          >
            ログアウト
          </button>
        </div>
      </div>
    </nav>
  );
}
