"use client";

import { useEffect, useState } from "react";

type Workplace = {
  id: string;
  name: string;
  hourlyWage: number;
  color: string;
  closingDay: number;
  nightRate: number;
  overtimeRate: number;
};

const emptyForm = {
  name: "",
  hourlyWage: "",
  color: "#3b82f6",
  closingDay: "31",
  nightRate: "1.25",
  overtimeRate: "1.25",
};

export default function WorkplacesPage() {
  const [workplaces, setWorkplaces] = useState<Workplace[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    const res = await fetch("/api/workplaces");
    setWorkplaces(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function startEdit(w: Workplace) {
    setEditingId(w.id);
    setForm({
      name: w.name,
      hourlyWage: String(w.hourlyWage),
      color: w.color,
      closingDay: String(w.closingDay),
      nightRate: String(w.nightRate),
      overtimeRate: String(w.overtimeRate),
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const url = editingId ? `/api/workplaces/${editingId}` : "/api/workplaces";
    const method = editingId ? "PATCH" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "保存に失敗しました");
      return;
    }
    cancelEdit();
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("このバイト先を削除しますか?関連するシフトも全て削除されます。")) return;
    await fetch(`/api/workplaces/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
      <h1 className="mb-6 text-xl font-bold">バイト先管理</h1>

      <form
        onSubmit={handleSubmit}
        className="mb-8 grid grid-cols-2 gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:grid-cols-3"
      >
        <div className="col-span-2 sm:col-span-1">
          <label className="mb-1 block text-xs font-medium text-slate-600">
            バイト先名
          </label>
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            placeholder="例: セブンイレブン渋谷店"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">
            時給(円)
          </label>
          <input
            required
            type="number"
            min={1}
            value={form.hourlyWage}
            onChange={(e) => setForm({ ...form, hourlyWage: e.target.value })}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">
            カレンダー色
          </label>
          <input
            type="color"
            value={form.color}
            onChange={(e) => setForm({ ...form, color: e.target.value })}
            className="h-9 w-full rounded-md border border-slate-300"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">
            給料締め日
          </label>
          <select
            value={form.closingDay}
            onChange={(e) => setForm({ ...form, closingDay: e.target.value })}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
              <option key={d} value={d}>
                {d}日{d === 31 ? "(月末)" : ""}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">
            深夜割増率(22-5時)
          </label>
          <input
            type="number"
            step="0.01"
            min={1}
            value={form.nightRate}
            onChange={(e) => setForm({ ...form, nightRate: e.target.value })}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">
            残業割増率(8h超)
          </label>
          <input
            type="number"
            step="0.01"
            min={1}
            value={form.overtimeRate}
            onChange={(e) => setForm({ ...form, overtimeRate: e.target.value })}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        {error && <p className="col-span-full text-sm text-red-600">{error}</p>}
        <div className="col-span-full flex gap-3">
          <button
            type="submit"
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            {editingId ? "更新する" : "追加する"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={cancelEdit}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-100"
            >
              キャンセル
            </button>
          )}
        </div>
      </form>

      {loading ? (
        <p className="text-sm text-slate-500">読み込み中...</p>
      ) : workplaces.length === 0 ? (
        <p className="text-sm text-slate-500">バイト先が登録されていません。</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {workplaces.map((w) => (
            <li
              key={w.id}
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <span
                  className="h-4 w-4 rounded-full"
                  style={{ backgroundColor: w.color }}
                />
                <div>
                  <p className="font-medium">{w.name}</p>
                  <p className="text-xs text-slate-500">
                    時給{w.hourlyWage}円 / 締め日{w.closingDay}日 / 深夜×
                    {w.nightRate} / 残業×{w.overtimeRate}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => startEdit(w)}
                  className="rounded-md px-3 py-1 text-sm text-blue-600 hover:bg-blue-50"
                >
                  編集
                </button>
                <button
                  onClick={() => handleDelete(w.id)}
                  className="rounded-md px-3 py-1 text-sm text-red-600 hover:bg-red-50"
                >
                  削除
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
