"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

type Profile = {
  id: string;
  name: string;
  email: string;
  bio: string | null;
  avatarColor: string;
  friendCode: string;
  createdAt: string;
};

const inputClass =
  "w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-[14px] outline-none transition-shadow focus:border-accent focus:ring-2 focus:ring-accent/20";
const labelClass = "mb-1.5 block text-[12px] font-medium text-muted";

export default function ProfilePage() {
  const { update } = useSession();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarColor, setAvatarColor] = useState("#0071e3");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((data: Profile) => {
        setProfile(data);
        setName(data.name);
        setBio(data.bio ?? "");
        setAvatarColor(data.avatarColor);
      });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, bio, avatarColor }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error || "保存に失敗しました");
      return;
    }
    setProfile(data);
    await update({ name: data.name });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  if (!profile) {
    return (
      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
        <p className="text-[13px] text-muted">読み込み中...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">プロフィール</h1>

      <div className="mb-6 flex items-center gap-4 rounded-3xl border border-border bg-surface p-6 shadow-[0_2px_20px_rgba(0,0,0,0.04)]">
        <span
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-[24px] font-semibold text-white"
          style={{ backgroundColor: avatarColor }}
        >
          {name.charAt(0) || "?"}
        </span>
        <div>
          <p className="text-[15px] font-medium">{profile.name}</p>
          <p className="text-[12px] text-muted">{profile.email}</p>
          <p className="mt-1 text-[11px] text-muted">
            {new Date(profile.createdAt).toLocaleDateString("ja-JP")} 登録 / フレンドコード{" "}
            {profile.friendCode}
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 rounded-3xl border border-border bg-surface p-8 shadow-[0_2px_20px_rgba(0,0,0,0.04)]"
      >
        <div>
          <label className={labelClass}>名前</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>自己紹介</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            placeholder="よろしくお願いします!"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>アバターカラー</label>
          <input
            type="color"
            value={avatarColor}
            onChange={(e) => setAvatarColor(e.target.value)}
            className="h-[42px] w-24 rounded-xl border border-border"
          />
        </div>
        {error && <p className="text-[13px] text-red-500">{error}</p>}
        <div>
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-accent px-5 py-2.5 text-[14px] font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
          >
            {saving ? "保存中..." : saved ? "保存しました" : "保存する"}
          </button>
        </div>
      </form>
    </main>
  );
}
