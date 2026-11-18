import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { siteTypes, typeById } from "../data/catalog";
import { api, ApiError } from "../lib/api";
import { readDraft, readDraftOf, writeDraft, type Draft } from "../lib/draft";

const notes = [
  "1 trang bán sản phẩm, thu lead",
  "Giới thiệu doanh nghiệp và dịch vụ",
  "Sản phẩm, bảng giá, đăng ký dùng thử",
  "Danh mục, sản phẩm, đặt hàng COD",
];

export function ComposePage() {
  const navigate = useNavigate();

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
              writeDraft(readDraftOf(item.id));
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

const fieldsByType = {
  landing: [
    { key: "name", label: "Tên sản phẩm", placeholder: "Serum AURA" },
    { key: "headline", label: "Giá bán", placeholder: "890.000đ" },
    { key: "about", label: "Lợi ích và đánh giá", placeholder: "Da sáng hơn sau 2 tuần. Khách nói dùng thấy khác.", area: true },
    { key: "phone", label: "Zalo nhận form", placeholder: "0900 000 000" },
  ],
  company: [
    { key: "name", label: "Tên công ty", placeholder: "Nova Legal" },
    { key: "headline", label: "Câu trên trang chủ", placeholder: "Tư vấn pháp lý cho doanh nghiệp" },
    { key: "about", label: "Dịch vụ và đội ngũ", placeholder: "Hợp đồng, sở hữu trí tuệ. Đội ngũ luật sư phụ trách.", area: true },
    { key: "phone", label: "Số liên hệ", placeholder: "028 0000 0000" },
  ],
  saas: [
    { key: "name", label: "Tên sản phẩm", placeholder: "Pulse Analytics" },
    { key: "headline", label: "Câu giới thiệu", placeholder: "Xem số liệu kinh doanh trong một màn hình" },
    { key: "about", label: "Tính năng và bảng giá", placeholder: "Báo cáo, cảnh báo. Miễn phí và gói 299.000đ/tháng.", area: true },
    { key: "phone", label: "Lời đăng ký dùng thử", placeholder: "Dùng thử 14 ngày, không cần thẻ" },
  ],
  ecommerce: [
    { key: "name", label: "Tên shop", placeholder: "Green Store" },
    { key: "headline", label: "Danh mục chính", placeholder: "Rau củ, đồ khô, đồ uống" },
    { key: "about", label: "Sản phẩm nổi bật", placeholder: "Rau organic 45.000đ, trà sen 89.000đ", area: true },
    { key: "phone", label: "Thanh toán / COD", placeholder: "Giao nội thành, thu COD" },
  ],
} as const;

export function ComposeFormPage() {
  const [draft, setDraft] = useState<Draft>(readDraft());
  const [saved, setSaved] = useState("");
  const type = typeById(draft.typeId);
  const fields = fieldsByType[draft.typeId];

  function update(patch: Partial<Draft>) {
    const next = { ...draft, ...patch };
    setDraft(next);
    writeDraft(next);
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    writeDraft(draft);
    const lines = fields.map((field) => `${field.label}: ${draft[field.key].trim() || "(chưa nhập)"}`);
    const products = draft.products
      .filter((item) => item.name.trim())
      .map((item, index) => `${index + 1}. ${item.name} — ${item.price || "chưa có giá"}${item.note ? ` (${item.note})` : ""}`);
    const body = [`Yêu cầu soạn ${type.name}`, ...lines, ...(products.length ? ["Sản phẩm:", ...products] : [])].join("\n");
    try {
      await api("/api/chat", { method: "POST", body: JSON.stringify({ body }) });
      setSaved("Đã lưu và gửi vào tin nhắn của admin.");
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Chưa gửi được tin nhắn.";
      setSaved("Đã lưu trên máy. " + message);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 text-[#1c1917]">
      <Link to="/soan" className="text-sm font-semibold text-stone-500">← Soạn</Link>
      <h1 className="text-2xl font-extrabold">{type.name}</h1>
      <p className="text-sm leading-6 text-stone-500">{type.note}</p>
      {fields.map((field) =>
        "area" in field ? (
          <label key={field.key} className="block text-sm font-semibold">
            {field.label}
            <textarea
              className="mt-1 min-h-28 w-full rounded-2xl border border-stone-200 bg-white px-3 py-3"
              placeholder={field.placeholder}
              value={draft[field.key]}
              onChange={(event) => update({ [field.key]: event.target.value })}
            />
          </label>
        ) : (
          <Field
            key={field.key}
            label={field.label}
            placeholder={field.placeholder}
            value={draft[field.key]}
            onChange={(value) => update({ [field.key]: value })}
          />
        ),
      )}
      {draft.typeId === "ecommerce" && <ProductEditor products={draft.products} onChange={(products) => update({ products })} />}
      {saved && <p className="text-sm text-emerald-700">{saved}</p>}
      <button className="w-full rounded-full bg-[#7c5cff] py-3 font-bold text-white">Lưu thông tin</button>
    </form>
  );
}

function ProductEditor({ products, onChange }: { products: Draft["products"]; onChange: (products: Draft["products"]) => void }) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [note, setNote] = useState("");

  function add() {
    if (!name.trim()) return;
    onChange([...products, { id: crypto.randomUUID(), name: name.trim(), price: price.trim(), note: note.trim() }]);
    setName("");
    setPrice("");
    setNote("");
  }

  return (
    <div className="space-y-3 rounded-3xl bg-white p-4">
      <h2 className="font-extrabold">Sản phẩm</h2>
      {products.length === 0 && <p className="text-sm text-stone-500">Chưa có sản phẩm. Thêm từng món bên dưới.</p>}
      {products.map((item) => (
        <div key={item.id} className="flex items-start justify-between gap-3 rounded-2xl bg-[#f6f3ef] px-3 py-3">
          <div>
            <p className="font-bold">{item.name}</p>
            <p className="text-sm text-stone-500">{item.price || "Chưa có giá"}{item.note ? ` · ${item.note}` : ""}</p>
          </div>
          <button type="button" className="text-sm font-semibold text-red-600" onClick={() => onChange(products.filter((entry) => entry.id !== item.id))}>
            Xóa
          </button>
        </div>
      ))}
      <input className="w-full rounded-2xl border border-stone-200 px-3 py-3" placeholder="Tên sản phẩm" value={name} onChange={(event) => setName(event.target.value)} />
      <input className="w-full rounded-2xl border border-stone-200 px-3 py-3" placeholder="Giá, ví dụ 45.000đ" value={price} onChange={(event) => setPrice(event.target.value)} />
      <input className="w-full rounded-2xl border border-stone-200 px-3 py-3" placeholder="Ghi chú ngắn" value={note} onChange={(event) => setNote(event.target.value)} />
      <button type="button" onClick={add} className="w-full rounded-full bg-[#1c1917] py-3 font-bold text-white">
        Thêm sản phẩm
      </button>
    </div>
  );
}

function Field({ label, value, placeholder, onChange }: { label: string; value: string; placeholder: string; onChange: (value: string) => void }) {
  return (
    <label className="block text-sm font-semibold">
      {label}
      <input className="mt-1 w-full rounded-2xl border border-stone-200 bg-white px-3 py-3" placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}
