"use client";

import { useEffect, useMemo, useState } from "react";
import { getMonthGrid, isSameDay, toDateKey } from "@/lib/calendar";
import { calculateShiftWage } from "@/lib/wage";
import ShiftFormModal, { ShiftFormValues } from "@/components/ShiftFormModal";

type Workplace = {
  id: string;
  name: string;
  color: string;
  hourlyWage: number;
  nightRate: number;
  overtimeRate: number;
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
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-slate-500">
            {year}年{month + 1}月 確定分の給料
          </p>
          <p className="mt-1 text-2xl font-bold text-blue-600">
            {summary.confirmedTotal.toLocaleString()}円
          </p>
          {summary.plannedTotal > 0 && (
            <p className="mt-1 text-xs text-slate-400">
              +希望シフト分 {summary.plannedTotal.toLocaleString()}円(未確定)
            </p>
          )}
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="mb-2 text-xs font-medium text-slate-500">バイト先別内訳</p>
          {summary.byWorkplace.length === 0 ? (
            <p className="text-sm text-slate-400">シフトがありません</p>
          ) : (
            <ul className="flex flex-col gap-1">
              {summary.byWorkplace.map((w) => (
                <li key={w.name} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: w.color }}
                    />
                    {w.name}
                  </span>
                  <span>{w.total.toLocaleString()}円</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <button
            onClick={() => setMonthDate(new Date(year, month - 1, 1))}
            className="rounded-md px-3 py-1 text-sm hover:bg-slate-100"
          >
            ← 前月
          </button>
          <h2 className="font-bold">
            {year}年{month + 1}月
          </h2>
          <button
            onClick={() => setMonthDate(new Date(year, month + 1, 1))}
            className="rounded-md px-3 py-1 text-sm hover:bg-slate-100"
          >
            次月 →
          </button>
        </div>

        <div className="grid grid-cols-7 text-center text-xs font-medium text-slate-500">
          {WEEKDAYS.map((w) => (
            <div key={w} className="py-2">
              {w}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {grid.map((d) => {
            const key = toDateKey(d);
            const dayShifts = shiftsByDay.get(key) ?? [];
            const inMonth = d.getMonth() === month;
            const isToday = isSameDay(d, today);
            return (
              <button
                key={key}
                onClick={() => openNewShift(d)}
                className={`min-h-24 rounded-md border p-1 text-left align-top ${
                  inMonth ? "border-slate-200 bg-white" : "border-slate-100 bg-slate-50"
                } ${isToday ? "ring-2 ring-blue-400" : ""} hover:bg-blue-50`}
              >
                <span className={`text-xs ${inMonth ? "text-slate-700" : "text-slate-300"}`}>
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
                      className="truncate rounded px-1 py-0.5 text-[10px] text-white"
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
        {loading && <p className="mt-3 text-xs text-slate-400">読み込み中...</p>}
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
    </main>
  );
}
