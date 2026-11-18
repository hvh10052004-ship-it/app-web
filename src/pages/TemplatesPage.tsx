import { useState } from "react";
import { Link } from "react-router-dom";
import { catalog, siteTypes } from "../data/catalog";

const filters = [
  { id: "all", label: "Tất cả" },
  { id: "landing", label: "Landing" },
  { id: "company", label: "Công ty" },
  { id: "saas", label: "SaaS" },
  { id: "ecommerce", label: "Bán hàng" },
] as const;

export function TemplatesPage() {
  const [filter, setFilter] = useState<(typeof filters)[number]["id"]>("all");
  const items = catalog.filter((item) => filter === "all" || item.type === filter);

  return (
    <div className="space-y-4 text-[#1c1917]">
      <header>
        <h1 className="text-[28px] font-extrabold tracking-tight">Mẫu website</h1>
        <p className="mt-1 text-sm text-stone-500">Chọn mẫu theo loại — rồi chỉ sửa chữ và ảnh</p>
      </header>
      <div className="flex gap-2 overflow-auto pb-1">
        {filters.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setFilter(item.id)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${filter === item.id ? "bg-[#1c1917] text-white" : "bg-white text-[#1c1917]"}`}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {items.map((item) => {
          const type = siteTypes.find((entry) => entry.id === item.type);
          const kind = type?.id === "landing" ? "Landing" : type?.id === "company" ? "Công ty" : type?.id === "saas" ? "SaaS" : "Bán hàng";
          return (
            <Link key={item.id} to={`/mau/${item.id}`} className="block">
              <img src={item.image} alt="" className="h-28 w-full rounded-2xl object-cover" />
              <h2 className="mt-2 font-extrabold">{item.name}</h2>
              <p className="text-xs text-stone-500">{kind} · {item.use}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
