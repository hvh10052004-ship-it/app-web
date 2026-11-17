import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ApiError, api } from "../lib/api";
import type { ChatMessage, ChatThread } from "../lib/types";

export function ChatPage() {
  const { user, loading } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [threadId, setThreadId] = useState("");
  const [text, setText] = useState("");
  const [error, setError] = useState("");

  async function load(activeThread = threadId) {
    const query = activeThread ? `?userId=${encodeURIComponent(activeThread)}` : "";
    const data = await api<{ messages: ChatMessage[]; threads: ChatThread[] }>(`/api/chat${query}`);
    setMessages(data.messages);
    setThreads(data.threads);
  }

  useEffect(() => {
    if (!user) return;
    void load().catch(() => setError("Chưa kết nối được cuộc trò chuyện. Hãy bật API local."));
    const timer = window.setInterval(() => {
      void load().catch(() => undefined);
    }, 4000);
    return () => window.clearInterval(timer);
  }, [user, threadId]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!text.trim()) return;
    try {
      await api("/api/chat", {
        method: "POST",
        body: JSON.stringify({ body: text, userId: threadId || undefined }),
      });
      setText("");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Không gửi được.");
    }
  }

  if (loading) return <p>Đang tải…</p>;
  if (!user) {
    return (
      <Link to="/dang-nhap" className="block rounded-3xl bg-white p-5 font-bold shadow-sm">
        Đăng nhập để chat
      </Link>
    );
  }

  return (
    <div className="flex h-[70vh] flex-col rounded-[28px] bg-white p-3 shadow-sm">
      <h1 className="px-2 py-2 text-xl font-extrabold">{user.isAdmin ? "Chat quản trị" : "Chat với WebStudio"}</h1>
      {user.isAdmin && (
        <select className="mx-2 mb-2 rounded-2xl border border-slate-200 px-3 py-2" value={threadId} onChange={(e) => setThreadId(e.target.value)}>
          <option value="">Chọn khách hàng</option>
          {threads.map((thread) => (
            <option key={thread.id} value={thread.id}>
              {thread.name} — {thread.last_body || "Chưa có tin"}
            </option>
          ))}
        </select>
      )}
      <div className="flex-1 space-y-2 overflow-auto px-2">
        {messages.map((message) => (
          <p
            key={message.id}
            className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
              message.sender_role === "admin" ? "bg-slate-100" : "ml-auto bg-[#102033] text-white"
            }`}
          >
            {message.body}
          </p>
        ))}
        {messages.length === 0 && <p className="text-sm text-slate-400">Chưa có tin nhắn.</p>}
      </div>
      {error && <p className="px-2 text-sm text-red-600">{error}</p>}
      <form onSubmit={onSubmit} className="mt-2 flex gap-2">
        <input className="flex-1 rounded-full border border-slate-200 px-4 py-3" value={text} onChange={(e) => setText(e.target.value)} placeholder="Nhập tin nhắn" />
        <button className="rounded-full bg-[#102033] px-4 font-bold text-white">Gửi</button>
      </form>
    </div>
  );
}
