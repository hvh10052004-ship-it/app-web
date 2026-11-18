import { FormEvent, useEffect, useState } from "react";
import { api } from "../lib/api";
import type { ChatMessage, ChatThread } from "../lib/types";
import { useAuth } from "../context/AuthContext";

export function ChatPage() {
  const { user } = useAuth();
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [error, setError] = useState("");

  async function load(userId?: string) {
    const query = userId ? `?userId=${encodeURIComponent(userId)}` : "";
    const data = await api<{ messages: ChatMessage[]; threads: ChatThread[]; isAdmin: boolean }>("/api/chat" + query);
    setThreads(data.threads);
    setMessages(data.messages);
    return data;
  }

  useEffect(() => {
    void load().catch(() => setError("Chưa tải được tin nhắn."));
  }, []);

  async function openThread(userId: string) {
    setOpenId(userId);
    setError("");
    try {
      await load(user?.isAdmin ? userId : undefined);
    } catch {
      setError("Không mở được nội dung.");
    }
  }

  async function send(event: FormEvent) {
    event.preventDefault();
    const body = text.trim();
    if (!body) return;
    try {
      await api("/api/chat", {
        method: "POST",
        body: JSON.stringify({ body, userId: user?.isAdmin ? openId : undefined }),
      });
      setText("");
      await load(user?.isAdmin ? openId ?? undefined : undefined);
    } catch {
      setError("Chưa gửi được.");
    }
  }

  const title = user?.isAdmin ? "Tin nhắn admin" : "Chat";
  const openThreadInfo = threads.find((item) => item.id === openId);

  return (
    <div className="space-y-4 text-[#1c1917]">
      <header>
        <h1 className="text-[28px] font-extrabold tracking-tight">{title}</h1>
        <p className="mt-1 text-sm text-stone-500">
          {user?.isAdmin ? "Bấm một khách để xem nội dung họ vừa soạn." : "Nội dung đã soạn sẽ nằm trong tin nhắn gửi admin."}
        </p>
      </header>
      {error && <p className="text-sm text-red-600">{error}</p>}

      {user?.isAdmin && !openId && (
        <div className="overflow-hidden rounded-[28px] bg-white">
          {threads.length === 0 && <p className="px-4 py-5 text-sm text-stone-500">Chưa có tin. Khi khách bấm Lưu thông tin, tin sẽ hiện ở đây.</p>}
          {threads.map((thread) => (
            <button key={thread.id} type="button" onClick={() => void openThread(thread.id)} className="block w-full border-b border-stone-100 px-4 py-4 text-left last:border-0">
              <span className="block font-extrabold">{thread.name}</span>
              <span className="mt-1 block text-sm text-stone-500">{thread.email}</span>
              <span className="mt-1 block truncate text-sm text-stone-400">{thread.last_body || "Chưa có nội dung"}</span>
            </button>
          ))}
        </div>
      )}

      {!user?.isAdmin && !openId && (
        <button type="button" onClick={() => void openThread(user?.id || "")} className="block w-full rounded-[28px] bg-white px-4 py-4 text-left">
          <span className="block font-extrabold">Tin nhắn với admin</span>
          <span className="mt-1 block text-sm text-stone-500">
            {messages.at(-1)?.body || "Bấm để xem nội dung đã gửi sau khi soạn"}
          </span>
        </button>
      )}

      {openId && (
        <div className="space-y-3">
          <button type="button" onClick={() => setOpenId(null)} className="text-sm font-semibold text-stone-500">
            ← Danh sách
          </button>
          <h2 className="text-lg font-extrabold">{user?.isAdmin ? openThreadInfo?.name || "Khách" : "Nội dung đã gửi"}</h2>
          <div className="space-y-2">
            {messages.length === 0 && <p className="text-sm text-stone-500">Chưa có nội dung.</p>}
            {messages.map((message) => (
              <article key={message.id} className={`rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap ${message.sender_role === "admin" ? "bg-[#efeaff]" : "bg-white"}`}>
                <p className="mb-1 text-xs font-semibold text-stone-400">{message.sender_role === "admin" ? "Admin" : "Khách"}</p>
                {message.body}
              </article>
            ))}
          </div>
          <form onSubmit={(event) => void send(event)} className="flex gap-2">
            <input value={text} onChange={(event) => setText(event.target.value)} placeholder="Trả lời" className="flex-1 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm" />
            <button className="rounded-2xl bg-[#8b6cff] px-4 text-sm font-bold text-white">Gửi</button>
          </form>
        </div>
      )}
    </div>
  );
}
