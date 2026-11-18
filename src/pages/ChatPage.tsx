import { FormEvent, useEffect, useState } from "react";
import { api, ApiError } from "../lib/api";
import type { ChatGroup, ChatMessage } from "../lib/types";
import { useAuth } from "../context/AuthContext";

export function ChatPage() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<ChatGroup[]>([]);
  const [groupId, setGroupId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [invite, setInvite] = useState("");

  async function load(nextGroup = groupId) {
    const selected = nextGroup && nextGroup !== "direct" ? nextGroup : "";
    const query = selected ? `?groupId=${encodeURIComponent(selected)}` : "";
    const data = await api<{ messages: ChatMessage[]; groups: ChatGroup[] }>("/api/chat" + query);
    setGroups(data.groups);
    setMessages(data.messages);
  }

  useEffect(() => {
    void load(groupId).catch(() => setError("Chưa tải được tin nhắn."));
    const timer = window.setInterval(() => {
      void load(groupId).catch(() => undefined);
    }, 4000);
    return () => window.clearInterval(timer);
  }, [groupId]);

  async function send(event: FormEvent) {
    event.preventDefault();
    const body = text.trim();
    if (!body) return;
    try {
      await api("/api/chat", { method: "POST", body: JSON.stringify({ body, groupId: groupId === "direct" ? undefined : groupId }) });
      setText("");
      await load(groupId);
    } catch {
      setError("Chưa gửi được.");
    }
  }

  async function createGroup() {
    setError("");
    try {
      const data = await api<{ id: string; code: string }>("/api/groups", {
        method: "POST",
        body: JSON.stringify({ title: "Nhóm với admin" }),
      });
      setInvite(data.code);
      setGroupId(data.id);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Chưa tạo được nhóm.");
    }
  }

  async function join(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      const data = await api<{ id: string; code: string }>("/api/groups/join", {
        method: "POST",
        body: JSON.stringify({ code }),
      });
      setCode("");
      setInvite(data.code);
      setGroupId(data.id);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Không vào được nhóm.");
    }
  }

  const current = groups.find((item) => item.id === groupId);

  return (
    <div className="flex min-h-[70vh] flex-col gap-3 text-[#1c1917]">
      <header>
        <h1 className="text-[28px] font-extrabold tracking-tight">Chat</h1>
        <p className="mt-1 text-sm text-stone-500">Mời người khác bằng mã nhóm, rồi cùng nhắn với admin.</p>
      </header>
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!groupId && (
        <div className="space-y-3">
          <button type="button" onClick={() => void createGroup()} className="w-full rounded-2xl bg-[#8b6cff] py-3 text-sm font-bold text-white">
            Tạo nhóm và lấy mã mời
          </button>
          <form onSubmit={(event) => void join(event)} className="flex gap-2">
            <input value={code} onChange={(event) => setCode(event.target.value)} placeholder="NHẬP MÃ NHÓM" className="flex-1 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm uppercase" />
            <button className="rounded-2xl bg-[#1c1917] px-4 text-sm font-bold text-white">Vào</button>
          </form>
          <button type="button" onClick={() => setGroupId("direct")} className="block w-full rounded-3xl bg-white px-4 py-4 text-left">
            <span className="block font-extrabold">Nhắn riêng với admin</span>
            <span className="mt-1 block text-sm text-stone-500">Chỉ bạn và admin</span>
          </button>
          {groups.map((group) => (
            <button key={group.id} type="button" onClick={() => { setInvite(group.code); setGroupId(group.id); }} className="block w-full rounded-3xl bg-white px-4 py-4 text-left">
              <span className="block font-extrabold">{group.title}</span>
              <span className="mt-1 block text-sm text-stone-500">Mã {group.code}</span>
              <span className="mt-1 block truncate text-sm text-stone-400">{group.last_body || "Chưa có tin"}</span>
            </button>
          ))}
        </div>
      )}

      {groupId && (
        <>
          <button type="button" onClick={() => { setGroupId(null); setInvite(""); }} className="text-sm font-semibold text-stone-500">← Danh sách</button>
          <div className="rounded-3xl bg-white px-4 py-3">
            <p className="font-extrabold">{groupId === "direct" ? "Nhắn riêng với admin" : current?.title || "Nhóm"}</p>
            {groupId !== "direct" && <p className="mt-1 text-sm text-stone-500">Mã mời: {invite || current?.code}. Gửi mã này cho người muốn vào nhóm.</p>}
          </div>
          <div className="flex-1 space-y-2">
            {messages.length === 0 && <p className="text-sm text-stone-500">Chưa có tin. Hãy nhắn để admin thấy.</p>}
            {messages.map((message) => {
              const mine = message.sender_role !== "admin" && message.sender_name === user?.name;
              return (
                <article key={message.id} className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap ${message.sender_role === "admin" ? "bg-[#efeaff]" : mine ? "ml-auto bg-white" : "bg-white"}`}>
                  <p className="mb-1 text-xs font-semibold text-stone-400">{message.sender_role === "admin" ? "Admin" : message.sender_name || "Thành viên"}</p>
                  {message.body}
                </article>
              );
            })}
          </div>
          <form onSubmit={(event) => void send(event)} className="sticky bottom-0 flex gap-2">
            <input value={text} onChange={(event) => setText(event.target.value)} placeholder="Nhắn trong nhóm" className="flex-1 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm" />
            <button className="rounded-2xl bg-[#8b6cff] px-4 text-sm font-bold text-white">Gửi</button>
          </form>
        </>
      )}
    </div>
  );
}
