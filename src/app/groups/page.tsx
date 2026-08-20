"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Member = { id: string; name: string; avatarColor: string };
type Group = {
  id: string;
  name: string;
  color: string;
  ownerId: string;
  isOwner: boolean;
  members: Member[];
};

const inputClass =
  "w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-[14px] outline-none transition-shadow focus:border-accent focus:ring-2 focus:ring-accent/20";

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[] | null>(null);
  const [name, setName] = useState("");
  const [color, setColor] = useState("#0071e3");
  const [error, setError] = useState("");

  async function load() {
    const res = await fetch("/api/groups");
    setGroups(await res.json());
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, color }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "作成に失敗しました");
      return;
    }
    setName("");
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("このグループを削除しますか?")) return;
    await fetch(`/api/groups/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">グループ</h1>

      <form
        onSubmit={handleCreate}
        className="mb-8 flex flex-wrap items-end gap-3 rounded-3xl border border-border bg-surface p-6 shadow-[0_2px_20px_rgba(0,0,0,0.04)]"
      >
        <div className="flex-1">
          <label className="mb-1.5 block text-[12px] font-medium text-muted">グループ名</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例: バイト先の同期"
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-[12px] font-medium text-muted">色</label>
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="h-[42px] w-16 rounded-xl border border-border"
          />
        </div>
        <button
          type="submit"
          className="rounded-full bg-accent px-5 py-2.5 text-[14px] font-medium text-white transition-colors hover:bg-accent-hover"
        >
          作成
        </button>
        {error && <p className="w-full text-[13px] text-red-500">{error}</p>}
      </form>

      {!groups ? (
        <p className="text-[13px] text-muted">読み込み中...</p>
      ) : groups.length === 0 ? (
        <p className="text-[13px] text-muted">まだグループがありません。</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {groups.map((g) => (
            <li
              key={g.id}
              className="rounded-2xl border border-border bg-surface p-5 shadow-[0_2px_20px_rgba(0,0,0,0.04)]"
            >
              <div className="flex items-center justify-between">
                <Link
                  href={`/groups/${g.id}`}
                  className="flex items-center gap-2.5 text-[15px] font-medium hover:underline"
                >
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: g.color }}
                  />
                  {g.name}
                </Link>
                {g.isOwner && (
                  <button
                    onClick={() => handleDelete(g.id)}
                    className="rounded-full px-3.5 py-1.5 text-[12px] font-medium text-red-500 transition-colors hover:bg-red-50"
                  >
                    削除
                  </button>
                )}
              </div>
              <div className="mt-3 flex -space-x-2">
                {g.members.map((m) => (
                  <span
                    key={m.id}
                    title={m.name}
                    className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-surface text-[11px] font-semibold text-white"
                    style={{ backgroundColor: m.avatarColor }}
                  >
                    {m.name.charAt(0)}
                  </span>
                ))}
                <span className="ml-3 flex items-center text-[12px] text-muted">
                  {g.members.length}人
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
