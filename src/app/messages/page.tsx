"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Friend = { id: string; name: string; avatarColor: string };
type Message = { id: string; content: string; senderId: string; createdAt: string };
type Conversation = { friend: Friend; lastMessage: Message | null; unreadCount: number };

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[] | null>(null);

  useEffect(() => {
    fetch("/api/messages")
      .then((r) => r.json())
      .then(setConversations);
  }, []);

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">メッセージ</h1>

      {!conversations ? (
        <p className="text-[13px] text-muted">読み込み中...</p>
      ) : conversations.length === 0 ? (
        <p className="text-[13px] text-muted">
          まだフレンドがいません。
          <Link href="/friends" className="ml-1 text-accent hover:underline">
            フレンドを追加する
          </Link>
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {conversations.map((c) => (
            <li key={c.friend.id}>
              <Link
                href={`/messages/${c.friend.id}`}
                className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-4 shadow-[0_2px_20px_rgba(0,0,0,0.04)] transition-shadow hover:shadow-[0_4px_24px_rgba(0,0,0,0.08)]"
              >
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[16px] font-semibold text-white"
                  style={{ backgroundColor: c.friend.avatarColor }}
                >
                  {c.friend.name.charAt(0)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-medium">{c.friend.name}</p>
                  <p className="truncate text-[12px] text-muted">
                    {c.lastMessage ? c.lastMessage.content : "まだメッセージがありません"}
                  </p>
                </div>
                {c.unreadCount > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-[11px] font-semibold text-white">
                    {c.unreadCount}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
