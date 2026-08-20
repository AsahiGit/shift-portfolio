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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-lg">
        <h2 className="mb-4 text-lg font-bold">
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
            <label className="mb-1 block text-xs font-medium text-slate-600">
              バイト先
            </label>
            <select
              required
              value={values.workplaceId}
              onChange={(e) => update("workplaceId", e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
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
              <label className="mb-1 block text-xs font-medium text-slate-600">
                開始時刻
              </label>
              <input
                required
                type="time"
                value={values.startTime}
                onChange={(e) => update("startTime", e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                終了時刻
              </label>
              <input
                required
                type="time"
                value={values.endTime}
                onChange={(e) => update("endTime", e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              休憩時間(分)
            </label>
            <input
              type="number"
              min={0}
              value={values.breakMinutes}
              onChange={(e) => update("breakMinutes", e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              ステータス
            </label>
            <select
              value={values.status}
              onChange={(e) => update("status", e.target.value as ShiftFormValues["status"])}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="PLANNED">希望(未確定)</option>
              <option value="CONFIRMED">確定</option>
              <option value="DONE">勤務済み</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              メモ
            </label>
            <input
              value={values.memo}
              onChange={(e) => update("memo", e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          <div className="mt-2 flex justify-between gap-3">
            <div>
              {onDelete && (
                <button
                  type="button"
                  onClick={onDelete}
                  className="rounded-md px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  削除
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-100"
              >
                キャンセル
              </button>
              <button
                type="submit"
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
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
