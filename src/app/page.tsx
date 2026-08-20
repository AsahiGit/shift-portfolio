import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

export default async function Home() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 text-center">
      <h1 className="text-4xl font-bold text-blue-600">シフ管</h1>
      <p className="mt-4 max-w-md text-slate-600">
        複数のバイト先のシフトと給料をまとめて管理できるWebアプリです。
        バイト先ごとの時給や締め日を登録して、月々の見込み給料を自動計算します。
      </p>
      <div className="mt-8 flex gap-4">
        <Link
          href="/register"
          className="rounded-md bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700"
        >
          新規登録
        </Link>
        <Link
          href="/login"
          className="rounded-md border border-slate-300 px-6 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100"
        >
          ログイン
        </Link>
      </div>
    </main>
  );
}
