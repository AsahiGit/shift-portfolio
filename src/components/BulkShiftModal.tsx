"use client";

import { useState } from "react";
import { toDateKey } from "@/lib/calendar";

type Workplace = { id: string; name: string; color: string };

const WEEKDAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

const inputClass =
  "w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-[14px] outline-none transition-shadow focus:border-accent focus:ring-2 focus:ring-accent/20";
const labelClass = "mb-1.5 block text-[12px] font-medium text-muted";

export default function BulkShiftModal({
  workplaces,
  onClose,
  onCreated,
}: {
  workplaces: Workplace[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const today = toDateKey(new Date());
  const [workplaceId, setWorkplaceId] = useState(workplaces[0]?.id ?? "");
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [weekdays, setWeekdays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [breakMinutes, setBreakMinutes] = useState("60");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<number | null>(null);

  function toggleWeekday(d: number) {
    setWeekdays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (weekdays.length === 0) {
      setError("曜日を1つ以上選択してください");
      return;
    }
    setSubmitting(true);
    const res = await fetch("/api/shifts/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        workplaceId,
        startDate,
        endDate,
        weekdays,
        startTime,
        endTime,
        breakMinutes,
        status: "PLANNED",
      }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      setError(data.error || "登録に失敗しました");
      return;
    }
    setResult(data.count);
    onCreated();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl border border-border bg-surface p-7 shadow-[0_20px_60px_rgba(0,0,0,0.2)]">
        <h2 className="mb-1 text-[17px] font-semibold tracking-tight">シフト希望の一括登録</h2>
        <p className="mb-5 text-[12px] text-muted">
          期間・曜日・時間を指定して、繰り返しのシフト希望をまとめて登録します(未確定として登録)。
        </p>

        {result !== null ? (
          <div className="flex flex-col gap-4">
            <p className="text-[14px]">{result}件のシフト希望を登録しました。</p>
            <button
              onClick={onClose}
              className="rounded-full bg-accent px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-accent-hover"
            >
              閉じる
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className={labelClass}>バイト先</label>
              <select
                required
                value={workplaceId}
                onChange={(e) => setWorkplaceId(e.target.value)}
                className={inputClass}
              >
                {workplaces.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>開始日</label>
                <input
                  required
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>終了日</label>
                <input
                  required
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
            <div>
              <label className={labelClass}>曜日</label>
              <div className="flex gap-1.5">
                {WEEKDAY_LABELS.map((label, d) => (
                  <button
                    type="button"
                    key={d}
                    onClick={() => toggleWeekday(d)}
                    className={`h-9 w-9 rounded-full text-[13px] font-medium transition-colors ${
                      weekdays.includes(d)
                        ? "bg-accent text-white"
                        : "bg-background text-muted hover:bg-foreground/5"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>開始時刻</label>
                <input
                  required
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>終了時刻</label>
                <input
                  required
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
            <div>
              <label className={labelClass}>休憩時間(分)</label>
              <input
                type="number"
                min={0}
                value={breakMinutes}
                onChange={(e) => setBreakMinutes(e.target.value)}
                className={inputClass}
              />
            </div>
            {error && <p className="text-[13px] text-red-500">{error}</p>}
            <div className="mt-1 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-border px-4 py-2 text-[13px] font-medium text-muted transition-colors hover:bg-foreground/5"
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={submitting || workplaces.length === 0}
                className="rounded-full bg-accent px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
              >
                {submitting ? "登録中..." : "一括登録する"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
