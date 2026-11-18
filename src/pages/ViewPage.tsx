import { Link } from "react-router-dom";
import { siteTypes, templateById, typeById } from "../data/catalog";
import { readDraft, readSaved } from "../lib/draft";

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

export function ViewDetailPage() {
  const draft = readDraft();
  const type = typeById(draft.typeId);
  const template = templateById(draft.templateId);
  return (
    <div className="space-y-3">
      <Link to="/xem" className="text-sm font-semibold text-stone-500">← Xem trang</Link>
      <article className="overflow-hidden rounded-[28px] bg-white shadow-sm">
        <div className="bg-[#24211f] p-5 text-white">
          <p className="text-xs uppercase tracking-[0.16em] text-stone-300">{template?.name ?? type.name}</p>
          <h2 className="mt-2 text-3xl font-extrabold">{draft.headline || draft.name}</h2>
          <p className="mt-2 text-sm text-stone-300">{draft.about || type.blurb}</p>
        </div>
      </article>
    </div>
  );
}
