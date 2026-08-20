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
  color: "#0071e3",
  closingDay: "31",
  nightRate: "1.25",
  overtimeRate: "1.25",
};

const inputClass =
  "w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-[14px] outline-none transition-shadow focus:border-accent focus:ring-2 focus:ring-accent/20";
const labelClass = "mb-1.5 block text-[12px] font-medium text-muted";

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
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-10">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">バイト先管理</h1>

      <form
        onSubmit={handleSubmit}
        className="mb-8 grid grid-cols-2 gap-5 rounded-3xl border border-border bg-surface p-8 shadow-[0_2px_20px_rgba(0,0,0,0.04)] sm:grid-cols-3"
      >
        <div className="col-span-2 sm:col-span-1">
          <label className={labelClass}>バイト先名</label>
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className={inputClass}
            placeholder="例: セブンイレブン渋谷店"
          />
        </div>
        <div>
          <label className={labelClass}>時給(円)</label>
          <input
            required
            type="number"
            min={1}
            value={form.hourlyWage}
            onChange={(e) => setForm({ ...form, hourlyWage: e.target.value })}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>カレンダー色</label>
          <input
            type="color"
            value={form.color}
            onChange={(e) => setForm({ ...form, color: e.target.value })}
            className="h-[42px] w-full rounded-xl border border-border"
          />
        </div>
        <div>
          <label className={labelClass}>給料締め日</label>
          <select
            value={form.closingDay}
            onChange={(e) => setForm({ ...form, closingDay: e.target.value })}
            className={inputClass}
          >
            {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
              <option key={d} value={d}>
                {d}日{d === 31 ? "(月末)" : ""}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>深夜割増率(22-5時)</label>
          <input
            type="number"
            step="0.01"
            min={1}
            value={form.nightRate}
            onChange={(e) => setForm({ ...form, nightRate: e.target.value })}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>残業割増率(8h超)</label>
          <input
            type="number"
            step="0.01"
            min={1}
            value={form.overtimeRate}
            onChange={(e) => setForm({ ...form, overtimeRate: e.target.value })}
            className={inputClass}
          />
        </div>
        {error && <p className="col-span-full text-[13px] text-red-500">{error}</p>}
        <div className="col-span-full flex gap-3 pt-1">
          <button
            type="submit"
            className="rounded-full bg-accent px-5 py-2.5 text-[14px] font-medium text-white transition-colors hover:bg-accent-hover"
          >
            {editingId ? "更新する" : "追加する"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={cancelEdit}
              className="rounded-full border border-border px-5 py-2.5 text-[14px] text-muted transition-colors hover:bg-foreground/5"
            >
              キャンセル
            </button>
          )}
        </div>
      </form>

      {loading ? (
        <p className="text-[13px] text-muted">読み込み中...</p>
      ) : workplaces.length === 0 ? (
        <p className="text-[13px] text-muted">バイト先が登録されていません。</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {workplaces.map((w) => (
            <li
              key={w.id}
              className="flex items-center justify-between rounded-2xl border border-border bg-surface p-5 shadow-[0_2px_20px_rgba(0,0,0,0.04)] transition-shadow hover:shadow-[0_4px_24px_rgba(0,0,0,0.08)]"
            >
              <div className="flex items-center gap-3.5">
                <span
                  className="h-9 w-9 rounded-full"
                  style={{ backgroundColor: w.color }}
                />
                <div>
                  <p className="text-[15px] font-medium">{w.name}</p>
                  <p className="text-[12px] text-muted">
                    時給{w.hourlyWage}円 / 締め日{w.closingDay}日 / 深夜×
                    {w.nightRate} / 残業×{w.overtimeRate}
                  </p>
                </div>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => startEdit(w)}
                  className="rounded-full px-3.5 py-1.5 text-[13px] font-medium text-accent transition-colors hover:bg-accent/10"
                >
                  編集
                </button>
                <button
                  onClick={() => handleDelete(w.id)}
                  className="rounded-full px-3.5 py-1.5 text-[13px] font-medium text-red-500 transition-colors hover:bg-red-50"
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
