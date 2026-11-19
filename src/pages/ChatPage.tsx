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
    form.set("asCustomer", "1");
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
      await api("/api/chat", { method: "POST", body: JSON.stringify({ body, groupId: groupId === "direct" ? undefined : groupId, asCustomer: true }) });
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
          {chatRows(groups, messages, user?.id).map((row) => (
            <button
              key={row.id}
              type="button"
              onClick={() => {
                markSeen(row.id, row.at);
                setSlide("in");
                setGroupId(row.id);
              }}
              className="block w-full rounded-3xl bg-white px-4 py-4 text-left"
            >
              <span className="flex items-center justify-between gap-2">
                <span className="flex min-w-0 items-center gap-2">
                  {row.avatarUrl && <img src={row.avatarUrl} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover" />}
                  <span className={`truncate ${row.unread ? "font-extrabold text-[#1c1917]" : "font-semibold text-stone-500"}`}>{row.title}</span>
                </span>
                <span className={`shrink-0 text-xs ${row.unread ? "font-bold text-[#1c1917]" : "text-stone-400"}`}>{chatTime(row.at)}</span>
              </span>
              <span className={`mt-1 block truncate text-sm ${row.unread ? "font-semibold text-stone-800" : "text-stone-400"}`}>{row.preview}</span>
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
              setSlide("in");
            }
          }}
        >
          <header className="flex items-center gap-2 border-b border-stone-200 bg-white px-2 py-3">
            <button type="button" onClick={() => setSlide("out")} className="flex h-10 w-10 items-center justify-center text-2xl" aria-label="Thoát cuộc nhắn">
              ←
            </button>
            {groupId !== "direct" && (
              current?.avatarUrl ? (
                <img src={current.avatarUrl} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" />
              ) : (
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#efeaff] text-sm font-bold">{(current?.title || groupName || "N").slice(0, 1)}</span>
              )
            )}
            <div className="min-w-0">
              <h1 className="truncate text-lg font-extrabold">{groupId === "direct" ? "Nhắn riêng với admin" : `${current?.title || groupName || "Nhóm"}${current?.code ? " · " + current.code : ""}`}</h1>
            </div>
          </header>
          <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-3 py-3">
            {messages.length === 0 && <p className="text-sm text-stone-500">Chưa có tin. Hãy nhắn để admin thấy.</p>}
            {messages.map((message) => {
              const mine = Boolean(message.sender_id) && message.sender_id === user?.id;
              const label = message.sender_name || (message.sender_role === "admin" ? "Admin" : "Khách");
              return (
                <article key={message.id} className={`w-fit max-w-[80%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap ${mine ? "self-start bg-white" : "self-end bg-[#efeaff]"}`}>
                  <p className="mb-1 flex justify-between gap-3 text-xs font-bold text-[#5b45c7]"><span>{label}</span><span className="font-semibold text-stone-400">{chatTime(message.created_at)}</span></p>
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

const SEEN_KEY = "webstudio-chat-seen";

function readSeen() {
  try {
    return JSON.parse(localStorage.getItem(SEEN_KEY) || "{}") as Record<string, string>;
  } catch {
    return {};
  }
}

function markSeen(id: string, at: string) {
  const seen = readSeen();
  seen[id] = at || new Date().toISOString();
  localStorage.setItem(SEEN_KEY, JSON.stringify(seen));
}

function chatTime(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  }
  return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
}

function chatRows(groups: ChatGroup[], messages: ChatMessage[], userId?: string) {
  const seen = readSeen();
  const direct = messages.at(-1);
  const rows = [
    {
      id: "direct",
      title: "Nhắn riêng với admin",
      code: "",
      avatarUrl: null as string | null,
      preview: direct?.body || direct?.attachment_name || "Chỉ bạn và admin",
      at: direct?.created_at || "",
      sender: direct?.sender_id,
    },
    ...groups.map((group) => ({
      id: group.id,
      title: group.title + (group.code ? " · " + group.code : ""),
      code: group.code,
      avatarUrl: group.avatarUrl,
      preview: group.last_body || "Chưa có tin",
      at: group.last_at || "",
      sender: group.last_sender_id,
    })),
  ];
  return rows
    .map((row) => ({ ...row, unread: Boolean(row.at && row.sender && row.sender !== userId && (seen[row.id] || "") < row.at) }))
    .sort((a, b) => (b.at || "").localeCompare(a.at || ""));
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

function isImageMessage(message: ChatMessage) {
  if (message.attachment_type?.startsWith("image/")) return true;
  return /\.(png|jpe?g|gif|webp|bmp|heic)$/i.test(message.attachment_name || message.attachment_key || "");
}

function Attachment({ message }: { message: ChatMessage }) {
  const [open, setOpen] = useState(false);
  if (!message.attachment_key) return null;
  const href = `/api/files/${message.attachment_key.split("/").map(encodeURIComponent).join("/")}`;
  if (isImageMessage(message)) {
    return (
      <>
        <button type="button" onClick={() => setOpen(true)} className="mt-2 block">
          <img src={href} alt={message.attachment_name || "Ảnh"} className="h-24 w-24 rounded-xl object-cover" />
        </button>
        {open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setOpen(false)}>
            <img src={href} alt={message.attachment_name || "Ảnh"} className="max-h-full max-w-full object-contain" />
          </div>
        )}
      </>
    );
  }
  return (
    <a href={href} className="mt-2 block font-semibold text-[#5b45c7]" target="_blank" rel="noreferrer">
      Tệp: {message.attachment_name || "Tải xuống"}
    </a>
  );
}
