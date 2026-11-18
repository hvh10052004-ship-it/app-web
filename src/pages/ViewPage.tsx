import { FormEvent, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { siteTypes, typeById, type SiteTypeId } from "../data/catalog";
import { api, ApiError } from "../lib/api";
import { readDraftOf, readSaved, writeDraft, type Draft, type Product } from "../lib/draft";

export function ViewPage() {
  const saved = readSaved();
  return (
    <div className="text-[#1c1917]">
      <h1 className="text-[28px] font-extrabold tracking-tight">Xem trang</h1>
      <p className="mt-1 text-sm text-stone-500">Mỗi loại website là một trang riêng — hiện sau khi lưu thông tin</p>
      <div className="mt-4 overflow-hidden rounded-[28px] bg-white">
        {siteTypes.map((item, index) => (
          <Link key={item.id} to={saved[item.id] ? `/xem/${item.id}` : "/soan/noi-dung"} className="block border-b border-stone-100 px-4 py-4 last:border-0">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f3efff] text-sm font-bold text-[#7c5cff]">{index + 1}</span>
            <span className="mt-2 block font-extrabold">{item.name}</span>
            <span className="mt-1 block text-sm text-stone-500">
              {saved[item.id] ? "Đã lưu — bấm để xem trang" : "Chưa lưu — soạn rồi bấm Lưu thông tin"}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

const fieldsByType = {
  landing: [
    { key: "name", label: "Tên sản phẩm" },
    { key: "headline", label: "Giá bán" },
    { key: "about", label: "Lợi ích và đánh giá", area: true },
    { key: "phone", label: "Zalo nhận form" },
  ],
  company: [
    { key: "name", label: "Tên công ty" },
    { key: "headline", label: "Câu trên trang chủ" },
    { key: "about", label: "Dịch vụ và đội ngũ", area: true },
    { key: "phone", label: "Số liên hệ" },
  ],
  saas: [
    { key: "name", label: "Tên sản phẩm" },
    { key: "headline", label: "Câu giới thiệu" },
    { key: "about", label: "Tính năng và bảng giá", area: true },
    { key: "phone", label: "Lời đăng ký dùng thử" },
  ],
  ecommerce: [
    { key: "name", label: "Tên shop" },
    { key: "headline", label: "Danh mục chính" },
    { key: "about", label: "Sản phẩm nổi bật", area: true },
    { key: "phone", label: "Thanh toán / COD" },
  ],
} as const;

export function ViewDetailPage() {
  const { loai = "" } = useParams();
  const type = typeById(loai);
  const [draft, setDraft] = useState<Draft>(() => readDraftOf(type.id as SiteTypeId));
  const [saved, setSaved] = useState("");
  const fields = fieldsByType[type.id];

  function update(key: keyof Draft, value: string) {
    setDraft({ ...draft, [key]: value, typeId: type.id });
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const next = { ...draft, typeId: type.id };
    writeDraft(next);
    const lines = fields.map((field) => `${field.label}: ${next[field.key].trim() || "(chưa nhập)"}`);
    const products = next.products
      .filter((item) => item.name.trim())
      .map((item, index) => `${index + 1}. ${item.name} — ${item.price || "chưa có giá"}`);
    try {
      await api("/api/chat", {
        method: "POST",
        body: JSON.stringify({ body: [`Đã sửa ${type.name}`, ...lines, ...(products.length ? ["Sản phẩm:", ...products] : [])].join("\n") }),
      });
      setSaved("Đã sửa và gửi lại tin nhắn cho admin.");
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Chưa gửi được tin nhắn.";
      setSaved("Đã sửa trên máy. " + message);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 text-[#1c1917]">
      <Link to="/xem" className="text-sm font-semibold text-stone-500">← Xem trang</Link>
      <article className="overflow-hidden rounded-[28px] bg-[#24211f] p-5 text-white">
        <p className="text-xs uppercase tracking-[0.16em] text-stone-300">{type.name}</p>
        <h2 className="mt-2 text-3xl font-extrabold">{draft.name || "Chưa có tên"}</h2>
        <p className="mt-2 text-sm text-stone-300">{draft.headline || type.blurb}</p>
      </article>
      <h3 className="text-lg font-extrabold">Sửa thông tin</h3>
      {fields.map((field) => (
        <label key={field.key} className="block text-sm font-semibold">
          {field.label}
          {"area" in field ? (
            <textarea
              className="mt-1 min-h-28 w-full rounded-2xl border border-stone-200 bg-white px-3 py-3"
              value={draft[field.key]}
              onChange={(event) => update(field.key, event.target.value)}
            />
          ) : (
            <input
              className="mt-1 w-full rounded-2xl border border-stone-200 bg-white px-3 py-3"
              value={draft[field.key]}
              onChange={(event) => update(field.key, event.target.value)}
            />
          )}
        </label>
      ))}
      {type.id === "ecommerce" && (
        <ProductList
          products={draft.products}
          onChange={(products) => setDraft({ ...draft, products, typeId: type.id })}
        />
      )}
      {saved && <p className="text-sm text-emerald-700">{saved}</p>}
      <button className="w-full rounded-full bg-[#7c5cff] py-3 font-bold text-white">Lưu phần đã sửa</button>
    </form>
  );
}

function ProductList({ products, onChange }: { products: Product[]; onChange: (products: Product[]) => void }) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");

  return (
    <div className="space-y-2 rounded-3xl bg-white p-4">
      <h3 className="font-extrabold">Sản phẩm</h3>
      {products.map((item) => (
        <div key={item.id} className="flex justify-between text-sm">
          <span>{item.name} · {item.price || "chưa có giá"}</span>
          <button type="button" className="font-semibold text-red-600" onClick={() => onChange(products.filter((entry) => entry.id !== item.id))}>Xóa</button>
        </div>
      ))}
      <input className="w-full rounded-2xl border border-stone-200 px-3 py-3" placeholder="Tên sản phẩm" value={name} onChange={(event) => setName(event.target.value)} />
      <input className="w-full rounded-2xl border border-stone-200 px-3 py-3" placeholder="Giá" value={price} onChange={(event) => setPrice(event.target.value)} />
      <button
        type="button"
        className="w-full rounded-full bg-[#1c1917] py-3 font-bold text-white"
        onClick={() => {
          if (!name.trim()) return;
          onChange([...products, { id: crypto.randomUUID(), name: name.trim(), price: price.trim(), note: "" }]);
          setName("");
          setPrice("");
        }}
      >
        Thêm sản phẩm
      </button>
    </div>
  );
}
