"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getMonthGrid, isSameDay, toDateKey } from "@/lib/calendar";

type Shift = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  workplace: { name: string; color: string };
};

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

export default function FriendShiftsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [monthDate, setMonthDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [friendName, setFriendName] = useState("");
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const grid = useMemo(() => getMonthGrid(year, month), [year, month]);

  useEffect(() => {
    setLoading(true);
    setError("");
    const from = new Date(year, month, 1).toISOString();
    const to = new Date(year, month + 1, 0, 23, 59, 59).toISOString();
    fetch(`/api/friends/${id}/shifts?from=${from}&to=${to}`)
      .then(async (r) => {
        if (!r.ok) {
          const data = await r.json();
          throw new Error(data.error || "取得に失敗しました");
        }
        return r.json();
      })
      .then((data) => {
        setFriendName(data.friend.name);
        setShifts(data.shifts);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
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

  const today = new Date();

  if (error) {
    return (
      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-10">
        <Link href="/friends" className="text-[13px] text-accent hover:underline">
          ← フレンド一覧に戻る
        </Link>
        <p className="mt-4 text-[14px] text-red-500">{error}</p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-10">
      <Link href="/friends" className="text-[13px] text-accent hover:underline">
        ← フレンド一覧に戻る
      </Link>
      <h1 className="mb-6 mt-2 text-2xl font-semibold tracking-tight">
        {friendName ? `${friendName}さんのシフト` : "読み込み中..."}
      </h1>
      <p className="mb-6 text-[12px] text-muted">
        シフトの時間帯のみ共有されます(時給・給料は表示されません)
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
                      {s.startTime}-{s.endTime} {s.workplace.name}
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
