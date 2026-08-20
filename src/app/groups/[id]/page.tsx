"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getMonthGrid, isSameDay, toDateKey } from "@/lib/calendar";

type Member = { id: string; name: string; avatarColor: string };
type GroupDetail = {
  id: string;
  name: string;
  color: string;
  ownerId: string;
  isOwner: boolean;
  members: Member[];
};
type Friend = { id: string; name: string };
type Shift = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  user: Member;
  workplace: { name: string; color: string };
};

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

export default function GroupDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [addFriendId, setAddFriendId] = useState("");
  const [monthDate, setMonthDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const grid = useMemo(() => getMonthGrid(year, month), [year, month]);

  async function loadGroup() {
    const res = await fetch(`/api/groups/${id}`);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "取得に失敗しました");
      return;
    }
    setGroup(await res.json());
  }

  async function loadShifts() {
    setLoading(true);
    const from = new Date(year, month, 1).toISOString();
    const to = new Date(year, month + 1, 0, 23, 59, 59).toISOString();
    const res = await fetch(`/api/groups/${id}/shifts?from=${from}&to=${to}`);
    setShifts(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    loadGroup();
    fetch("/api/friends")
      .then((r) => r.json())
      .then((d) => setFriends(d.friends));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    loadShifts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, year, month]);

  const shiftsByDay = useMemo(() => {
    const map = new Map<string, Shift[]>();
    for (const s of shifts) {
      const key = toDateKey(new Date(s.date));
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    }
    return map;
  }, [shifts]);

  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault();
    if (!addFriendId) return;
    await fetch(`/api/groups/${id}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: addFriendId }),
    });
    setAddFriendId("");
    loadGroup();
  }

  async function handleRemoveMember(userId: string) {
    await fetch(`/api/groups/${id}/members/${userId}`, { method: "DELETE" });
    loadGroup();
  }

  const today = new Date();
  const availableFriends = friends.filter(
    (f) => !group?.members.some((m) => m.id === f.id)
  );

  if (error) {
    return (
      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-10">
        <Link href="/groups" className="text-[13px] text-accent hover:underline">
          ← グループ一覧に戻る
        </Link>
        <p className="mt-4 text-[14px] text-red-500">{error}</p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-10">
      <Link href="/groups" className="text-[13px] text-accent hover:underline">
        ← グループ一覧に戻る
      </Link>
      <h1 className="mb-6 mt-2 text-2xl font-semibold tracking-tight">
        {group ? group.name : "読み込み中..."}
      </h1>

      <div className="mb-6 rounded-3xl border border-border bg-surface p-6 shadow-[0_2px_20px_rgba(0,0,0,0.04)]">
        <p className="mb-3 text-[12px] font-medium text-muted">メンバー</p>
        <ul className="flex flex-col gap-2">
          {group?.members.map((m) => (
            <li key={m.id} className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-[14px]">
                <span
                  className="flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold text-white"
                  style={{ backgroundColor: m.avatarColor }}
                >
                  {m.name.charAt(0)}
                </span>
                {m.name}
                {m.id === group.ownerId && (
                  <span className="text-[11px] text-muted">(オーナー)</span>
                )}
              </span>
              {group.isOwner && m.id !== group.ownerId && (
                <button
                  onClick={() => handleRemoveMember(m.id)}
                  className="rounded-full px-3 py-1 text-[12px] font-medium text-red-500 transition-colors hover:bg-red-50"
                >
                  削除
                </button>
              )}
            </li>
          ))}
        </ul>

        {group?.isOwner && availableFriends.length > 0 && (
          <form onSubmit={handleAddMember} className="mt-4 flex gap-2 border-t border-border pt-4">
            <select
              value={addFriendId}
              onChange={(e) => setAddFriendId(e.target.value)}
              className="flex-1 rounded-xl border border-border bg-background px-3.5 py-2.5 text-[14px] outline-none"
            >
              <option value="">フレンドを選択</option>
              {availableFriends.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="rounded-full bg-accent px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-accent-hover"
            >
              追加
            </button>
          </form>
        )}
      </div>

      <p className="mb-3 text-[12px] text-muted">
        メンバーの確定シフトの時間帯のみ表示されます(時給・給料は非表示)
      </p>

      <div className="rounded-3xl border border-border bg-surface p-6 shadow-[0_2px_20px_rgba(0,0,0,0.04)]">
        <div className="mb-5 flex items-center justify-between">
          <button
            onClick={() => setMonthDate(new Date(year, month - 1, 1))}
            className="rounded-full px-3 py-1.5 text-[13px] font-medium text-muted transition-colors hover:bg-foreground/5 hover:text-foreground"
          >
            ← 前月
          </button>
          <h2 className="text-[17px] font-semibold tracking-tight">
            {year}年{month + 1}月
          </h2>
          <button
            onClick={() => setMonthDate(new Date(year, month + 1, 1))}
            className="rounded-full px-3 py-1.5 text-[13px] font-medium text-muted transition-colors hover:bg-foreground/5 hover:text-foreground"
          >
            次月 →
          </button>
        </div>

        <div className="grid grid-cols-7 text-center text-[11px] font-medium text-muted">
          {WEEKDAYS.map((w) => (
            <div key={w} className="py-2">
              {w}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {grid.map((d) => {
            const key = toDateKey(d);
            const dayShifts = shiftsByDay.get(key) ?? [];
            const inMonth = d.getMonth() === month;
            const isToday = isSameDay(d, today);
            return (
              <div key={key} className="min-h-24 rounded-xl bg-background p-1.5 text-left align-top">
                <span
                  className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[12px] ${
                    isToday
                      ? "bg-accent font-semibold text-white"
                      : inMonth
                        ? "text-foreground"
                        : "text-muted/40"
                  }`}
                >
                  {d.getDate()}
                </span>
                <div className="mt-1 flex flex-col gap-0.5">
                  {dayShifts.map((s) => (
                    <span
                      key={s.id}
                      className="truncate rounded-md px-1.5 py-0.5 text-[10px] font-medium text-white"
                      style={{ backgroundColor: s.workplace.color }}
                    >
                      {s.user.name}: {s.startTime}-{s.endTime}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        {loading && <p className="mt-3 text-[12px] text-muted">読み込み中...</p>}
      </div>
    </main>
  );
}
