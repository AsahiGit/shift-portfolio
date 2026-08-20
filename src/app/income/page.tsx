"use client";

import { useEffect, useMemo, useState } from "react";
import { calculateShiftWage } from "@/lib/wage";

type WageRule = { label: string; startTime: string; endTime: string; rate: number };

type Workplace = {
  id: string;
  name: string;
  color: string;
  hourlyWage: number;
  nightRate: number;
  overtimeRate: number;
  wageRules: WageRule[];
};

type Shift = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  breakMinutes: number;
  status: "PLANNED" | "CONFIRMED" | "DONE";
  workplaceId: string;
  workplace: Workplace;
};

const MONTH_LABELS = Array.from({ length: 12 }, (_, i) => `${i + 1}月`);

export default function IncomePage() {
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const from = new Date(year, 0, 1).toISOString();
    const to = new Date(year, 11, 31, 23, 59, 59).toISOString();
    fetch(`/api/shifts?from=${from}&to=${to}`)
      .then((r) => r.json())
      .then((data) => {
        setShifts(data);
        setLoading(false);
      });
  }, [year]);

  const monthlyTotals = useMemo(() => {
    const totals = Array(12).fill(0) as number[];
    for (const s of shifts) {
      if (s.status === "PLANNED") continue;
      const month = new Date(s.date).getMonth();
      const pay = calculateShiftWage({
        startTime: s.startTime,
        endTime: s.endTime,
        breakMinutes: s.breakMinutes,
        hourlyWage: s.workplace.hourlyWage,
        nightRate: s.workplace.nightRate,
        overtimeRate: s.workplace.overtimeRate,
        wageRules: s.workplace.wageRules,
      }).totalPay;
      totals[month] += pay;
    }
    return totals;
  }, [shifts]);

  const yearTotal = monthlyTotals.reduce((a, b) => a + b, 0);
  const max = Math.max(...monthlyTotals, 1);
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">年間収入</h1>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setYear((y) => y - 1)}
            className="rounded-full px-3 py-1.5 text-[13px] font-medium text-muted transition-colors hover:bg-foreground/5 hover:text-foreground"
          >
            ← {year - 1}年
          </button>
          <span className="px-2 text-[15px] font-semibold">{year}年</span>
          <button
            onClick={() => setYear((y) => y + 1)}
            className="rounded-full px-3 py-1.5 text-[13px] font-medium text-muted transition-colors hover:bg-foreground/5 hover:text-foreground"
          >
            {year + 1}年 →
          </button>
        </div>
      </div>

      <div className="mb-6 rounded-3xl border border-border bg-surface p-6 shadow-[0_2px_20px_rgba(0,0,0,0.04)]">
        <p className="text-[12px] font-medium text-muted">{year}年 確定分の合計給料</p>
        <p className="mt-1.5 text-[34px] font-semibold tracking-tight text-foreground">
          ¥{yearTotal.toLocaleString()}
        </p>
      </div>

      <div className="rounded-3xl border border-border bg-surface p-6 shadow-[0_2px_20px_rgba(0,0,0,0.04)]">
        {loading ? (
          <p className="text-[13px] text-muted">読み込み中...</p>
        ) : (
          <div className="flex h-64 items-end gap-2 sm:gap-3">
            {monthlyTotals.map((total, i) => {
              const heightPct = (total / max) * 100;
              const isCurrent = year === currentYear && i === currentMonth;
              return (
                <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
                  <span className="text-[10px] tabular-nums text-muted">
                    {total > 0 ? Math.round(total / 1000) + "k" : ""}
                  </span>
                  <div className="flex w-full flex-1 items-end">
                    <div
                      className={`w-full rounded-t-md transition-all ${
                        isCurrent ? "bg-accent" : "bg-accent/40"
                      }`}
                      style={{ height: `${Math.max(heightPct, total > 0 ? 2 : 0)}%` }}
                    />
                  </div>
                  <span
                    className={`text-[11px] ${isCurrent ? "font-semibold text-foreground" : "text-muted"}`}
                  >
                    {MONTH_LABELS[i]}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
