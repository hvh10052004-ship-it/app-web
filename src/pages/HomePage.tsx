import { useState } from "react";
import { Link } from "react-router-dom";
import { siteTypes } from "../data/catalog";
import { readDraft, writeDraft, type Draft } from "../lib/draft";
import { useAuth } from "../context/AuthContext";

const icons = ["doc", "doc", "megaphone", "bag"] as const;

export function HomePage() {
  const { user } = useAuth();
  const [draft, setDraft] = useState<Draft>(readDraft);
  const current = siteTypes.find((item) => item.id === draft.typeId) ?? siteTypes[0];
  const filled = [draft.headline, draft.about, draft.phone].filter((item) => item.trim()).length;
  const progress = Math.round((filled / 3) * 100);
  const code = draft.name.replace(/\s+/g, "").slice(0, 6).toUpperCase() || "SITE";
  const letter = (user?.name || "H").trim().slice(0, 1).toUpperCase();

  function choose(typeId: Draft["typeId"]) {
    const next = { ...draft, typeId };
    writeDraft(next);
    setDraft(next);
  }

  return (
    <div className="space-y-5 bg-[#f6f3ef] pb-6 text-[#1c1917]">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-[28px] font-extrabold leading-tight tracking-tight">Tạo website của bạn</h1>
          <p className="mt-1 text-sm leading-5 text-stone-500">Chọn loại site — soạn trên điện thoại, xuất bản ngay</p>
        </div>
        <Link to="/tai-khoan" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#1c1917] text-sm font-bold text-white">
          {letter}
        </Link>
      </header>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-stone-700">Các loại website</h2>
        <div className="grid grid-cols-2 gap-3">
          {siteTypes.map((item, index) => {
            const selected = draft.typeId === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => choose(item.id)}
                className={`rounded-3xl bg-white p-3 text-left shadow-sm ${selected ? "ring-2 ring-[#7c5cff]" : ""}`}
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f3efff] text-[#7c5cff]">
                  <TypeIcon name={icons[index]} />
                </span>
                <p className="mt-3 text-xs font-semibold text-stone-400">{String(index + 1).padStart(2, "0")}</p>
                <h3 className="mt-1 text-[15px] font-extrabold leading-5">{item.name}</h3>
                <p className="mt-1 text-xs leading-4 text-stone-500">{item.blurb}</p>
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-3xl bg-white p-4 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#7c5cff]">Chú thích tóm tắt</p>
        <h2 className="mt-1 text-base font-extrabold">{current.name}</h2>
        <p className="mt-2 text-sm leading-6 text-stone-600">{current.note}</p>
        <ul className="mt-3 flex flex-wrap gap-2">
          {current.sections.map((section) => (
            <li key={section} className="rounded-full bg-[#f3efff] px-3 py-1 text-xs font-semibold text-[#5b45c7]">
              {section}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-stone-700">Đang soạn</h2>
        <article className="overflow-hidden rounded-[28px] bg-[#24211f] p-3 text-white">
          <div className="flex gap-3">
            <img
              src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=160&q=60"
              alt=""
              className="h-16 w-16 rounded-2xl object-cover"
            />
            <div>
              <h3 className="text-base font-extrabold">{current.name}</h3>
              <p className="text-xs text-stone-300">{current.name} · {code}</p>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs text-stone-300">
            <span>Hoàn thiện nội dung</span>
            <span>{progress}%</span>
          </div>
          <div className="mt-2 h-1.5 rounded-full bg-white/15">
            <div className="h-1.5 rounded-full bg-white" style={{ width: `${progress}%` }} />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Link to="/xem" className="rounded-2xl bg-[#3a3633] py-3 text-center text-sm font-bold">Xem trang</Link>
            <Link to="/soan/noi-dung" className="rounded-2xl bg-[#8b6cff] py-3 text-center text-sm font-bold">Tiếp tục soạn</Link>
          </div>
        </article>
        <div className="mt-3 space-y-2">
          {current.sections.map((section) => (
            <div key={section} className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 text-sm shadow-sm">
              <span className="flex items-center gap-3 font-semibold">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#f6f3ef] text-stone-500">
                  <TypeIcon name="bag" />
                </span>
                {section}
              </span>
              <span className="text-stone-400">{progress === 100 ? "Đủ" : "Thiếu"}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function TypeIcon({ name }: { name: (typeof icons)[number] }) {
  if (name === "bag") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M6 8h12l-1 12H7L6 8z" />
        <path d="M9 8V7a3 3 0 0 1 6 0v1" />
      </svg>
    );
  }
  if (name === "megaphone") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M4 10v4h3l6 3V7L7 10H4z" />
        <path d="M16 9a4 4 0 0 1 0 6" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M7 3h7l5 5v13H7V3z" />
      <path d="M14 3v5h5" />
    </svg>
  );
}
