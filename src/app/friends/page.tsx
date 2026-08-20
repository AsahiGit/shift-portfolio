"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type FriendUser = { id: string; name: string; friendCode?: string };
type Friend = FriendUser & { friendshipId: string };

type FriendsData = {
  friendCode: string;
  friends: Friend[];
  incomingRequests: { id: string; from: FriendUser }[];
  outgoingRequests: { id: string; to: FriendUser }[];
};

const inputClass =
  "w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-[14px] outline-none transition-shadow focus:border-accent focus:ring-2 focus:ring-accent/20";

export default function FriendsPage() {
  const [data, setData] = useState<FriendsData | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);

  async function load() {
    const res = await fetch("/api/friends");
    setData(await res.json());
  }

  useEffect(() => {
    load();
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    const res = await fetch("/api/friends", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ friendCode: code }),
    });
    const result = await res.json();
    if (!res.ok) {
      setError(result.error || "申請に失敗しました");
      return;
    }
    setMessage("フレンド申請を送りました");
    setCode("");
    load();
  }

  async function handleAccept(id: string) {
    await fetch(`/api/friends/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "accept" }),
    });
    load();
  }

  async function handleRemove(id: string) {
    await fetch(`/api/friends/${id}`, { method: "DELETE" });
    load();
  }

  function copyCode() {
    if (!data) return;
    navigator.clipboard.writeText(data.friendCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  if (!data) {
    return (
      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-10">
        <p className="text-[13px] text-muted">読み込み中...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-10">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">フレンド</h1>

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-3xl border border-border bg-surface p-6 shadow-[0_2px_20px_rgba(0,0,0,0.04)]">
          <p className="mb-2 text-[12px] font-medium text-muted">あなたのフレンドコード</p>
          <div className="flex items-center gap-2">
            <span className="rounded-xl bg-background px-4 py-2 text-[20px] font-semibold tracking-widest">
              {data.friendCode}
            </span>
            <button
              onClick={copyCode}
              className="rounded-full px-3 py-1.5 text-[13px] font-medium text-accent transition-colors hover:bg-accent/10"
            >
              {copied ? "コピー済み" : "コピー"}
            </button>
          </div>
          <p className="mt-2 text-[12px] text-muted">このコードを友達に共有してもらいましょう</p>
        </div>

        <div className="rounded-3xl border border-border bg-surface p-6 shadow-[0_2px_20px_rgba(0,0,0,0.04)]">
          <p className="mb-2 text-[12px] font-medium text-muted">フレンドコードで申請</p>
          <form onSubmit={handleAdd} className="flex gap-2">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="例: A1B2C3D4"
              className={inputClass}
            />
            <button
              type="submit"
              className="shrink-0 rounded-full bg-accent px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-accent-hover"
            >
              申請
            </button>
          </form>
          {error && <p className="mt-2 text-[12px] text-red-500">{error}</p>}
          {message && <p className="mt-2 text-[12px] text-accent">{message}</p>}
        </div>
      </div>

      {data.incomingRequests.length > 0 && (
        <div className="mb-6">
          <p className="mb-3 text-[13px] font-semibold">受け取った申請</p>
          <ul className="flex flex-col gap-2">
            {data.incomingRequests.map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between rounded-2xl border border-border bg-surface p-4 shadow-[0_2px_20px_rgba(0,0,0,0.04)]"
              >
                <span className="text-[14px] font-medium">{r.from.name}</span>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleAccept(r.id)}
                    className="rounded-full px-3.5 py-1.5 text-[13px] font-medium text-accent transition-colors hover:bg-accent/10"
                  >
                    承認
                  </button>
                  <button
                    onClick={() => handleRemove(r.id)}
                    className="rounded-full px-3.5 py-1.5 text-[13px] font-medium text-red-500 transition-colors hover:bg-red-50"
                  >
                    拒否
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {data.outgoingRequests.length > 0 && (
        <div className="mb-6">
          <p className="mb-3 text-[13px] font-semibold">申請中</p>
          <ul className="flex flex-col gap-2">
            {data.outgoingRequests.map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between rounded-2xl border border-border bg-surface p-4 shadow-[0_2px_20px_rgba(0,0,0,0.04)]"
              >
                <span className="text-[14px] text-muted">{r.to.name} への申請中</span>
                <button
                  onClick={() => handleRemove(r.id)}
                  className="rounded-full px-3.5 py-1.5 text-[13px] font-medium text-muted transition-colors hover:bg-foreground/5"
                >
                  取り消す
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <p className="mb-3 text-[13px] font-semibold">フレンド一覧</p>
        {data.friends.length === 0 ? (
          <p className="text-[13px] text-muted">まだフレンドがいません。</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {data.friends.map((f) => (
              <li
                key={f.id}
                className="flex items-center justify-between rounded-2xl border border-border bg-surface p-4 shadow-[0_2px_20px_rgba(0,0,0,0.04)]"
              >
                <span className="text-[14px] font-medium">{f.name}</span>
                <div className="flex items-center gap-1">
                  <Link
                    href={`/friends/${f.id}`}
                    className="rounded-full px-3.5 py-1.5 text-[13px] font-medium text-accent transition-colors hover:bg-accent/10"
                  >
                    シフトを見る
                  </Link>
                  <button
                    onClick={() => {
                      if (confirm(`${f.name}さんをフレンドから削除しますか?`)) {
                        handleRemove(f.friendshipId);
                      }
                    }}
                    className="rounded-full px-3.5 py-1.5 text-[13px] font-medium text-red-500 transition-colors hover:bg-red-50"
                  >
                    削除
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
