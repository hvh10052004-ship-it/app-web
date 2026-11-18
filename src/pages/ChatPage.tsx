import { FormEvent, useState } from "react";
import { readDraft } from "../lib/draft";
import { typeById } from "../data/catalog";

type Room = { code: string; title: string; note: string };

const CODE_KEY = "webstudio-share-code";
const ROOM_KEY = "webstudio-rooms";

function myCode() {
  const current = localStorage.getItem(CODE_KEY);
  if (current) return current;
  const next = Math.random().toString(36).slice(2, 8).toUpperCase();
  localStorage.setItem(CODE_KEY, next);
  return next;
}

function readRooms(): Room[] {
  try {
    return JSON.parse(localStorage.getItem(ROOM_KEY) || "[]") as Room[];
  } catch {
    return [];
  }
}

export function ChatPage() {
  const draft = readDraft();
  const type = typeById(draft.typeId);
  const [code] = useState(myCode);
  const [input, setInput] = useState("");
  const [rooms, setRooms] = useState<Room[]>(readRooms);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  function save(next: Room[]) {
    setRooms(next);
    localStorage.setItem(ROOM_KEY, JSON.stringify(next));
  }

  function connect(event: FormEvent) {
    event.preventDefault();
    const value = input.trim().toUpperCase();
    if (!/^[A-Z0-9]{4,8}$/.test(value)) {
      setError("Nhập mã từ 4 đến 8 ký tự.");
      return;
    }
    setError("");
    if (!rooms.some((room) => room.code === value)) {
      save([{ code: value, title: `Nhóm ${value}`, note: "Chưa có tin" }, ...rooms]);
    }
    setInput("");
  }

  function createRoom() {
    const value = Math.random().toString(36).slice(2, 8).toUpperCase();
    save([{ code: value, title: `Nhóm ${value}`, note: "Chưa có tin" }, ...rooms]);
  }

  return (
    <div className="space-y-4 text-[#1c1917]">
      <header>
        <h1 className="text-[28px] font-extrabold tracking-tight">Chat</h1>
        <p className="mt-1 text-sm text-stone-500">Chia sẻ mã của bạn hoặc nhập mã để kết nối</p>
      </header>
      <div className="flex items-center justify-between rounded-3xl bg-white px-4 py-3">
        <div>
          <p className="text-xs text-stone-400">Mã của bạn</p>
          <p className="text-2xl font-extrabold tracking-[0.18em]">{code}</p>
        </div>
        <button
          type="button"
          className="rounded-2xl bg-[#8b6cff] px-4 py-3 text-sm font-bold text-white"
          onClick={() => {
            void navigator.clipboard?.writeText(code);
            setCopied(true);
          }}
        >
          {copied ? "Đã chép" : "Sao chép"}
        </button>
      </div>
      <form onSubmit={connect} className="flex gap-2">
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="NHẬP MÃ KẾT NỐI"
          className="flex-1 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm uppercase"
        />
        <button className="rounded-2xl bg-[#8b6cff] px-4 text-sm font-bold text-white">Kết nối</button>
      </form>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="button" onClick={createRoom} className="text-sm font-semibold text-[#5b4dff]">
        Tạo nhóm và lấy mã chia sẻ
      </button>
      <div className="space-y-4">
        <Row badge="S" title={type.name} note="Chat cùng người soạn website này" side="Nhóm site" />
        {rooms.map((room) => (
          <Row key={room.code} badge="N" title={room.title} note={room.note} side={room.code} />
        ))}
      </div>
    </div>
  );
}

function Row({ badge, title, note, side }: { badge: string; title: string; note: string; side: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#efeaff] font-bold text-[#7c5cff]">{badge}</span>
      <div className="min-w-0 flex-1">
        <p className="font-extrabold">{title}</p>
        <p className="text-sm text-stone-500">{note}</p>
      </div>
      <span className="text-xs text-stone-400">{side}</span>
    </div>
  );
}
