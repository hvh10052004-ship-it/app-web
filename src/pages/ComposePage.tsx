import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { typeById } from "../data/catalog";
import { readDraft, writeDraft, type Draft } from "../lib/draft";

export function ComposePage() {
  const [draft, setDraft] = useState<Draft>(readDraft());
  const [saved, setSaved] = useState("");
  const type = typeById(draft.typeId);

  function update(patch: Partial<Draft>) {
    const next = { ...draft, ...patch };
    setDraft(next);
    writeDraft(next);
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    writeDraft(draft);
    setSaved("Đã lưu bản soạn trên máy. Bạn có thể xem trước hoặc gửi yêu cầu.");
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <h1 className="text-2xl font-extrabold">Soạn website</h1>
      <p className="text-sm text-slate-500">{type.name}: {type.sections.join(" · ")}</p>
      <Field label="Tên website" value={draft.name} onChange={(name) => update({ name })} />
      <Field label="Tiêu đề" value={draft.headline} onChange={(headline) => update({ headline })} />
      <Field label="Số điện thoại / Zalo" value={draft.phone} onChange={(phone) => update({ phone })} />
      <label className="block text-sm font-semibold">
        Giới thiệu
        <textarea className="mt-1 min-h-28 w-full rounded-2xl border border-slate-200 px-3 py-3" value={draft.about} onChange={(e) => update({ about: e.target.value })} />
      </label>
      {saved && <p className="text-sm text-emerald-700">{saved}</p>}
      <button className="w-full rounded-full bg-[#102033] py-3 font-bold text-white">Lưu bản soạn</button>
      <Link to="/xem" className="block rounded-full border border-slate-200 py-3 text-center font-bold">Xem trước</Link>
      <Link to="/yeu-cau" className="block text-center text-sm font-semibold text-slate-500">Gửi yêu cầu cho WebStudio</Link>
    </form>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block text-sm font-semibold">
      {label}
      <input className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-3" value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}
