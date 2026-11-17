import { Link } from "react-router-dom";
import { templates } from "../data/templates";

export function TemplatesPage() {
  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-extrabold">Kho mẫu</h1>
      <p className="text-sm text-slate-500">Chọn một hướng giao diện. Bạn vẫn mô tả nội dung riêng khi gửi yêu cầu.</p>
      {templates.map((item) => (
        <Link key={item.id} to={`/mau/${item.id}`} className="block rounded-3xl bg-white p-4 shadow-sm">
          <div className="mb-3 h-2 rounded-full" style={{ background: item.accent }} />
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{item.kind}</p>
          <h2 className="text-lg font-bold">{item.name}</h2>
          <p className="mt-1 text-sm text-slate-500">{item.summary}</p>
        </Link>
      ))}
    </div>
  );
}
