"use client";

import { use, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";

type Friend = { id: string; name: string; avatarColor: string };
type Message = { id: string; content: string; senderId: string; createdAt: string };

const POLL_INTERVAL_MS = 4000;

export default function ChatPage({ params }: { params: Promise<{ friendId: string }> }) {
  const { friendId } = use(params);
  const { data: session } = useSession();
  const [friend, setFriend] = useState<Friend | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState("");
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  async function load() {
    const res = await fetch(`/api/messages/${friendId}`);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "取得に失敗しました");
      return;
    }
    const data = await res.json();
    setFriend(data.friend);
    setMessages(data.messages);
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [friendId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setSending(true);
    await fetch(`/api/messages/${friendId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    setContent("");
    setSending(false);
    load();
  }

  if (error) {
    return (
      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
        <Link href="/messages" className="text-[13px] text-accent hover:underline">
          ← メッセージ一覧に戻る
        </Link>
        <p className="mt-4 text-[14px] text-red-500">{error}</p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 py-10">
      <Link href="/messages" className="text-[13px] text-accent hover:underline">
        ← メッセージ一覧に戻る
      </Link>
      <h1 className="mb-4 mt-2 text-2xl font-semibold tracking-tight">
        {friend ? friend.name : "読み込み中..."}
      </h1>

      <div className="flex flex-1 flex-col rounded-3xl border border-border bg-surface p-5 shadow-[0_2px_20px_rgba(0,0,0,0.04)]">
        <div className="flex max-h-[50vh] min-h-[40vh] flex-col gap-2 overflow-y-auto pr-1">
          {messages.length === 0 ? (
            <p className="text-[13px] text-muted">まだメッセージがありません。挨拶してみましょう。</p>
          ) : (
            messages.map((m) => {
              const isMine = m.senderId === session?.user?.id;
              return (
                <div
                  key={m.id}
                  className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-[14px] ${
                    isMine
                      ? "self-end bg-accent text-white"
                      : "self-start bg-background text-foreground"
                  }`}
                >
                  {m.content}
                  <span
                    className={`mt-0.5 block text-[10px] ${isMine ? "text-white/70" : "text-muted"}`}
                  >
                    {new Date(m.createdAt).toLocaleTimeString("ja-JP", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={handleSend} className="mt-4 flex gap-2 border-t border-border pt-4">
          <input
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="メッセージを入力..."
            className="flex-1 rounded-xl border border-border bg-background px-3.5 py-2.5 text-[14px] outline-none transition-shadow focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
          <button
            type="submit"
            disabled={sending || !content.trim()}
            className="shrink-0 rounded-full bg-accent px-5 py-2.5 text-[14px] font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
          >
            送信
          </button>
        </form>
      </div>
    </main>
  );
}
