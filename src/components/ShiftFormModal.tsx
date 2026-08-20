"use client";

import { useState } from "react";

type Workplace = {
  id: string;
  name: string;
  color: string;
};

export type ShiftFormValues = {
  id?: string;
  date: string; // yyyy-mm-dd
  startTime: string;
  endTime: string;
  breakMinutes: string;
  memo: string;
  status: "PLANNED" | "CONFIRMED" | "DONE";
  workplaceId: string;
};

const inputClass =
  "w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-[14px] outline-none transition-shadow focus:border-accent focus:ring-2 focus:ring-accent/20";
const labelClass = "mb-1.5 block text-[12px] font-medium text-muted";

export default function ShiftFormModal({
  workplaces,
  initial,
  onClose,
  onSave,
  onDelete,
}: {
  workplaces: Workplace[];
  initial: ShiftFormValues;
  onClose: () => void;
  onSave: (values: ShiftFormValues) => void;
  onDelete?: () => void;
}) {
  const [values, setValues] = useState<ShiftFormValues>(initial);

  function update<K extends keyof ShiftFormValues>(key: K, value: ShiftFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-3xl border border-border bg-surface p-7 shadow-[0_20px_60px_rgba(0,0,0,0.2)]">
        <h2 className="mb-5 text-[17px] font-semibold tracking-tight">
          {values.date} のシフト{values.id ? "編集" : "追加"}
        </h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSave(values);
          }}
          className="flex flex-col gap-4"
        >
          <div>
            <label className={labelClass}>バイト先</label>
            <select
              required
              value={values.workplaceId}
              onChange={(e) => update("workplaceId", e.target.value)}
              className={inputClass}
            >
              <option value="">選択してください</option>
              {workplaces.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>開始時刻</label>
              <input
                required
                type="time"
                value={values.startTime}
                onChange={(e) => update("startTime", e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>終了時刻</label>
              <input
                required
                type="time"
                value={values.endTime}
                onChange={(e) => update("endTime", e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <label className={labelClass}>休憩時間(分)</label>
            <input
              type="number"
              min={0}
              value={values.breakMinutes}
              onChange={(e) => update("breakMinutes", e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>ステータス</label>
            <select
              value={values.status}
              onChange={(e) => update("status", e.target.value as ShiftFormValues["status"])}
              className={inputClass}
            >
              <option value="PLANNED">希望(未確定)</option>
              <option value="CONFIRMED">確定</option>
              <option value="DONE">勤務済み</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>メモ</label>
            <input
              value={values.memo}
              onChange={(e) => update("memo", e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="mt-2 flex justify-between gap-3">
            <div>
              {onDelete && (
                <button
                  type="button"
                  onClick={onDelete}
                  className="rounded-full px-4 py-2 text-[13px] font-medium text-red-500 transition-colors hover:bg-red-50"
                >
                  削除
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-border px-4 py-2 text-[13px] font-medium text-muted transition-colors hover:bg-foreground/5"
              >
                キャンセル
              </button>
              <button
                type="submit"
                className="rounded-full bg-accent px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-accent-hover"
              >
                保存
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
