import { FormEvent, useEffect, useState } from "react";
import { api, ApiError } from "../lib/api";
import type { ChatGroup, ChatMessage } from "../lib/types";
import { useAuth } from "../context/AuthContext";

export function ChatPage() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<ChatGroup[]>([]);
  const [groupId, setGroupId] = useState<string | null>(null);
  const [slide, setSlide] = useState<"in" | "out">("in");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [code, setCode] = useState("");
  const [groupName, setGroupName] = useState("");
  const [error, setError] = useState("");
  const [invite, setInvite] = useState("");
  const [emojiOpen, setEmojiOpen] = useState(false);

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

  async function sendFile(file: File) {
    const form = new FormData();
    form.set("file", file);
    if (groupId && groupId !== "direct") form.set("groupId", groupId);
    try {
      await api("/api/chat/file", { method: "POST", body: form });
      await load(groupId);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Chưa gửi được tệp.");
    }
  }

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
        body: JSON.stringify({ title: groupName.trim() || "Nhóm với admin" }),
      });
      setInvite(data.code);
      setSlide("in");
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
      setSlide("in");
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
          <input
            value={groupName}
            onChange={(event) => setGroupName(event.target.value)}
            placeholder="Tên nhóm, ví dụ Nhóm thiết kế"
            className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm"
          />
          <button type="button" onClick={() => void createGroup()} className="w-full rounded-2xl bg-[#8b6cff] py-3 text-sm font-bold text-white">
            Tạo nhóm và lấy mã mời
          </button>
          <form onSubmit={(event) => void join(event)} className="flex gap-2">
            <input value={code} onChange={(event) => setCode(event.target.value)} placeholder="NHẬP MÃ NHÓM" className="flex-1 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm uppercase" />
            <button className="rounded-2xl bg-[#1c1917] px-4 text-sm font-bold text-white">Vào</button>
          </form>
          <button type="button" onClick={() => { setSlide("in"); setGroupId("direct"); }} className="block w-full rounded-3xl bg-white px-4 py-4 text-left">
            <span className="block font-extrabold">Nhắn riêng với admin</span>
            <span className="mt-1 block text-sm text-stone-500">Chỉ bạn và admin</span>
          </button>
          {groups.map((group) => (
            <button key={group.id} type="button" onClick={() => { setInvite(group.code); setSlide("in"); setGroupId(group.id); }} className="block w-full rounded-3xl bg-white px-4 py-4 text-left">
              <span className="block font-extrabold">{group.title}</span>
              <span className="mt-1 block text-sm text-stone-500">Mã {group.code}</span>
              <span className="mt-1 block truncate text-sm text-stone-400">{group.last_body || "Chưa có tin"}</span>
            </button>
          ))}
        </div>
      )}

      {groupId && (
        <div
          className={`fixed inset-x-0 top-0 bottom-[4.25rem] z-20 mx-auto flex w-full max-w-md flex-col bg-[#f6f3ef] ${slide === "out" ? "chat-slide-out" : "chat-slide-in"}`}
          onAnimationEnd={() => {
            if (slide === "out") {
              setGroupId(null);
              setInvite("");
              setSlide("in");
            }
          }}
        >
          <header className="flex items-center gap-2 border-b border-stone-200 bg-white px-2 py-3">
            <button type="button" onClick={() => setSlide("out")} className="flex h-10 w-10 items-center justify-center text-2xl" aria-label="Thoát cuộc nhắn">
              ←
            </button>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-extrabold">{groupId === "direct" ? "Nhắn riêng với admin" : current?.title || groupName || "Nhóm"}</h1>
              {groupId !== "direct" && <p className="truncate text-xs text-stone-500">Mã {invite || current?.code}</p>}
            </div>
          </header>
          <div className="flex-1 space-y-2 overflow-y-auto px-3 py-3">
            {messages.length === 0 && <p className="text-sm text-stone-500">Chưa có tin. Hãy nhắn để admin thấy.</p>}
            {messages.map((message) => {
              const mine = message.sender_role !== "admin" && message.sender_name === user?.name;
              return (
                <article key={message.id} className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap ${message.sender_role === "admin" ? "bg-[#efeaff]" : mine ? "ml-auto bg-white" : "bg-white"}`}>
                  <p className="mb-1 text-xs font-semibold text-stone-400">{message.sender_role === "admin" ? "Admin" : message.sender_name || "Thành viên"}</p>
                  {message.body && <p>{message.body}</p>}
                  <Attachment message={message} />
                </article>
              );
            })}
          </div>
          {emojiOpen && <EmojiBar onPick={(emoji) => setText((value) => value + emoji)} />}
          <form onSubmit={(event) => void send(event)} className="flex gap-2 border-t border-stone-200 bg-[#f6f3ef] px-3 py-2">
            <label className="flex items-center rounded-2xl bg-white px-3 text-lg" title="Gửi ảnh hoặc tệp">
              📎
              <input
                className="sr-only"
                type="file"
                accept="image/*,.pdf,.zip,.txt,.doc,.docx"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  event.target.value = "";
                  if (file) void sendFile(file);
                }}
              />
            </label>
            <button type="button" className="rounded-2xl bg-white px-3 text-lg" onClick={() => setEmojiOpen((value) => !value)} title="Biểu cảm">
              😊
            </button>
            <input value={text} onChange={(event) => setText(event.target.value)} placeholder="Nhắn trong nhóm" className="flex-1 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm" />
            <button className="rounded-2xl bg-[#8b6cff] px-4 text-sm font-bold text-white">Gửi</button>
          </form>
        </div>
      )}
    </div>
  );
}

const emojis = ["😀", "😂", "😍", "👍", "🙏", "🎉", "❤️", "😢", "😮", "🔥", "✅"];

function EmojiBar({ onPick }: { onPick: (emoji: string) => void }) {
  return (
    <div className="flex gap-2 overflow-auto rounded-2xl bg-white px-3 py-2">
      {emojis.map((emoji) => (
        <button key={emoji} type="button" className="text-2xl" onClick={() => onPick(emoji)}>
          {emoji}
        </button>
      ))}
    </div>
  );
}

function Attachment({ message }: { message: ChatMessage }) {
  if (!message.attachment_key) return null;
  const href = `/api/files/${message.attachment_key}`;
  if (message.attachment_type?.startsWith("image/")) {
    return <img src={href} alt={message.attachment_name || "Ảnh"} className="mt-2 max-h-52 rounded-xl object-cover" />;
  }
  return (
    <a href={href} className="mt-2 block font-semibold text-[#5b45c7]" target="_blank" rel="noreferrer">
      Tệp: {message.attachment_name || "Tải xuống"}
    </a>
  );
}
