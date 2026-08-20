"use client";

import { useEffect, useMemo, useState } from "react";
import { getMonthGrid, isSameDay, toDateKey } from "@/lib/calendar";
import { calculateShiftWage } from "@/lib/wage";
import ShiftFormModal, { ShiftFormValues } from "@/components/ShiftFormModal";
import BulkShiftModal from "@/components/BulkShiftModal";

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
  memo: string | null;
  status: "PLANNED" | "CONFIRMED" | "DONE";
  workplaceId: string;
  workplace: Workplace;
};

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

const emptyFormFor = (date: string): ShiftFormValues => ({
  date,
  startTime: "09:00",
  endTime: "17:00",
  breakMinutes: "60",
  memo: "",
  status: "CONFIRMED",
  workplaceId: "",
});

export default function DashboardPage() {
  const [monthDate, setMonthDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [workplaces, setWorkplaces] = useState<Workplace[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalValues, setModalValues] = useState<ShiftFormValues | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showBulkModal, setShowBulkModal] = useState(false);

  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const grid = useMemo(() => getMonthGrid(year, month), [year, month]);

  useEffect(() => {
    fetch("/api/workplaces")
      .then((r) => r.json())
      .then(setWorkplaces);
  }, []);

  useEffect(() => {
    setLoading(true);
    const from = new Date(year, month, 1).toISOString();
    const to = new Date(year, month + 1, 0, 23, 59, 59).toISOString();
    fetch(`/api/shifts?from=${from}&to=${to}`)
      .then((r) => r.json())
      .then((data) => {
        setShifts(data);
        setLoading(false);
      });
  }, [year, month]);

  const shiftsByDay = useMemo(() => {
    const map = new Map<string, Shift[]>();
    for (const s of shifts) {
      const key = toDateKey(new Date(s.date));
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    }
    return map;
  }, [shifts]);

  const summary = useMemo(() => {
    let confirmedTotal = 0;
    let plannedTotal = 0;
    const byWorkplace = new Map<string, { name: string; color: string; total: number }>();

    for (const s of shifts) {
      const pay = calculateShiftWage({
        startTime: s.startTime,
        endTime: s.endTime,
        breakMinutes: s.breakMinutes,
        hourlyWage: s.workplace.hourlyWage,
        nightRate: s.workplace.nightRate,
        overtimeRate: s.workplace.overtimeRate,
        wageRules: s.workplace.wageRules,
      }).totalPay;

      if (s.status === "PLANNED") {
        plannedTotal += pay;
      } else {
        confirmedTotal += pay;
      }

      const entry = byWorkplace.get(s.workplaceId) ?? {
        name: s.workplace.name,
        color: s.workplace.color,
        total: 0,
      };
      entry.total += pay;
      byWorkplace.set(s.workplaceId, entry);
    }

    return { confirmedTotal, plannedTotal, byWorkplace: Array.from(byWorkplace.values()) };
  }, [shifts]);

  function openNewShift(date: Date) {
    if (workplaces.length === 0) {
      alert("先にバイト先を登録してください");
      return;
    }
    setEditingId(null);
    setModalValues(emptyFormFor(toDateKey(date)));
  }

  function openEditShift(s: Shift) {
    setEditingId(s.id);
    setModalValues({
      id: s.id,
      date: toDateKey(new Date(s.date)),
      startTime: s.startTime,
      endTime: s.endTime,
      breakMinutes: String(s.breakMinutes),
      memo: s.memo ?? "",
      status: s.status,
      workplaceId: s.workplaceId,
    });
  }

  async function handleSave(values: ShiftFormValues) {
    const url = editingId ? `/api/shifts/${editingId}` : "/api/shifts";
    const method = editingId ? "PATCH" : "POST";
    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    setModalValues(null);
    setEditingId(null);
    reloadShifts();
  }

  async function handleDelete() {
    if (!editingId) return;
    if (!confirm("このシフトを削除しますか?")) return;
    await fetch(`/api/shifts/${editingId}`, { method: "DELETE" });
    setModalValues(null);
    setEditingId(null);
    reloadShifts();
  }

  function reloadShifts() {
    const from = new Date(year, month, 1).toISOString();
    const to = new Date(year, month + 1, 0, 23, 59, 59).toISOString();
    fetch(`/api/shifts?from=${from}&to=${to}`)
      .then((r) => r.json())
      .then(setShifts);
  }

  const today = new Date();

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-10">
      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-3xl border border-border bg-surface p-6 shadow-[0_2px_20px_rgba(0,0,0,0.04)]">
          <p className="text-[12px] font-medium text-muted">
            {year}年{month + 1}月 確定分の給料
          </p>
          <p className="mt-1.5 text-[34px] font-semibold tracking-tight text-foreground">
            ¥{summary.confirmedTotal.toLocaleString()}
          </p>
          {summary.plannedTotal > 0 && (
            <p className="mt-1 text-[12px] text-muted">
              +希望シフト分 ¥{summary.plannedTotal.toLocaleString()}(未確定)
            </p>
          )}
        </div>
        <div className="rounded-3xl border border-border bg-surface p-6 shadow-[0_2px_20px_rgba(0,0,0,0.04)]">
          <p className="mb-3 text-[12px] font-medium text-muted">バイト先別内訳</p>
          {summary.byWorkplace.length === 0 ? (
            <p className="text-[13px] text-muted">シフトがありません</p>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {summary.byWorkplace.map((w) => (
                <li key={w.name} className="flex items-center justify-between text-[14px]">
                  <span className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: w.color }}
                    />
                    {w.name}
                  </span>
                  <span className="font-medium tabular-nums">
                    ¥{w.total.toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

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
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowBulkModal(true)}
              className="rounded-full bg-accent/10 px-3 py-1.5 text-[13px] font-medium text-accent transition-colors hover:bg-accent/20"
            >
              一括登録
            </button>
            <button
              onClick={() => setMonthDate(new Date(year, month + 1, 1))}
              className="rounded-full px-3 py-1.5 text-[13px] font-medium text-muted transition-colors hover:bg-foreground/5 hover:text-foreground"
            >
              次月 →
            </button>
          </div>
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
              <button
                key={key}
                onClick={() => openNewShift(d)}
                className={`min-h-24 rounded-xl p-1.5 text-left align-top transition-colors ${
                  inMonth ? "bg-background" : "bg-transparent"
                } hover:bg-accent/5`}
              >
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
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditShift(s);
                      }}
                      className="truncate rounded-md px-1.5 py-0.5 text-[10px] font-medium text-white"
                      style={{
                        backgroundColor: s.workplace.color,
                        opacity: s.status === "PLANNED" ? 0.5 : 1,
                      }}
                    >
                      {s.startTime}-{s.endTime} {s.workplace.name}
                    </span>
                  ))}
                </div>
              </button>
            );
          })}
        </div>
        {loading && <p className="mt-3 text-[12px] text-muted">読み込み中...</p>}
      </div>

      {modalValues && (
        <ShiftFormModal
          workplaces={workplaces}
          initial={modalValues}
          onClose={() => {
            setModalValues(null);
            setEditingId(null);
          }}
          onSave={handleSave}
          onDelete={editingId ? handleDelete : undefined}
        />
      )}

      {showBulkModal && (
        <BulkShiftModal
          workplaces={workplaces}
          onClose={() => setShowBulkModal(false)}
          onCreated={reloadShifts}
        />
      )}
    </main>
  );
}
