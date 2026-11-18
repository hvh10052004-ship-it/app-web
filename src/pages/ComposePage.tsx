import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { siteTypes, typeById } from "../data/catalog";
import { readDraft, writeDraft, type Draft } from "../lib/draft";

const notes = [
  "1 trang bán sản phẩm, thu lead",
  "Giới thiệu doanh nghiệp và dịch vụ",
  "Sản phẩm, bảng giá, đăng ký dùng thử",
  "Danh mục, sản phẩm, đặt hàng COD",
];

export function ComposePage() {
  const navigate = useNavigate();
  const draft = readDraft();

  return (
    <div className="text-[#1c1917]">
      <h1 className="text-[28px] font-extrabold tracking-tight">Soạn thông tin website</h1>
      <p className="mt-1 text-sm text-stone-500">Chọn loại website để bắt đầu — mỗi loại lưu riêng</p>
      <div className="mt-4 overflow-hidden rounded-[28px] bg-white">
        {siteTypes.map((item, index) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              writeDraft({ ...draft, typeId: item.id });
              navigate("/soan/noi-dung");
            }}
            className="flex w-full gap-3 border-b border-stone-100 px-4 py-4 text-left last:border-0"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f3efff] text-sm font-bold text-[#7c5cff]">{index + 1}</span>
            <span>
              <span className="block font-extrabold">{item.name}</span>
              <span className="mt-1 block text-sm text-stone-500">{notes[index]}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function ComposeFormPage() {
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
    setSaved("Đã lưu thông tin.");
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 text-[#1c1917]">
      <Link to="/soan" className="text-sm font-semibold text-stone-500">← Soạn</Link>
      <h1 className="text-2xl font-extrabold">{type.name}</h1>
      <Field label="Tên website" value={draft.name} onChange={(name) => update({ name })} />
      <Field label="Tiêu đề" value={draft.headline} onChange={(headline) => update({ headline })} />
      <Field label="Số điện thoại / Zalo" value={draft.phone} onChange={(phone) => update({ phone })} />
      <label className="block text-sm font-semibold">
        Giới thiệu
        <textarea className="mt-1 min-h-28 w-full rounded-2xl border border-stone-200 bg-white px-3 py-3" value={draft.about} onChange={(e) => update({ about: e.target.value })} />
      </label>
      {saved && <p className="text-sm text-emerald-700">{saved}</p>}
      <button className="w-full rounded-full bg-[#7c5cff] py-3 font-bold text-white">Lưu thông tin</button>
    </form>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block text-sm font-semibold">
      {label}
      <input className="mt-1 w-full rounded-2xl border border-stone-200 bg-white px-3 py-3" value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}
