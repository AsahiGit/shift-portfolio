import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

export default async function Home() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <main className="flex flex-1 flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-background to-white px-6 py-24 text-center">
      <p className="mb-3 text-[13px] font-semibold uppercase tracking-widest text-accent">
        Shift & Wage Manager
      </p>
      <h1 className="max-w-2xl text-5xl font-bold tracking-tight text-foreground sm:text-6xl">
        ラクシフ
      </h1>
      <p className="mt-6 max-w-md text-[17px] leading-relaxed text-muted">
        複数のバイト先のシフトと給料を、ひとつのカレンダーで。
        時給や締め日を登録するだけで、月々の見込み給料を自動で計算します。
      </p>
      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/register"
          className="rounded-full bg-accent px-8 py-3 text-[15px] font-medium text-white shadow-sm transition-colors hover:bg-accent-hover"
        >
          無料で始める
        </Link>
        <Link
          href="/login"
          className="rounded-full border border-border px-8 py-3 text-[15px] font-medium text-foreground transition-colors hover:bg-foreground/5"
        >
          ログイン
        </Link>
      </div>

      <div className="mt-20 grid w-full max-w-3xl grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { title: "複数バイト対応", desc: "職場ごとに時給・締め日を管理" },
          { title: "自動給料計算", desc: "深夜・残業割増も自動で反映" },
          { title: "月次サマリー", desc: "確定分と見込み額をひと目で" },
        ].map((f) => (
          <div
            key={f.title}
            className="rounded-2xl border border-border bg-surface/60 p-6 text-left shadow-[0_2px_20px_rgba(0,0,0,0.04)]"
          >
            <p className="text-[15px] font-semibold text-foreground">{f.title}</p>
            <p className="mt-1 text-[13px] text-muted">{f.desc}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
