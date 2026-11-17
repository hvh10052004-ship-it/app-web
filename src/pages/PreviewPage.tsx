import { Link, useParams } from "react-router-dom";
import { findTemplate } from "../data/templates";

export function PreviewPage() {
  const { id = "" } = useParams();
  const template = findTemplate(id);
  if (!template) return <p>Không thấy mẫu này.</p>;

  return (
    <div className="space-y-4">
      <Link to="/mau" className="text-sm font-semibold text-slate-500">
        ← Kho mẫu
      </Link>
      <article className="overflow-hidden rounded-[28px] bg-white shadow-sm">
        <div className="p-5 text-white" style={{ background: template.ink }}>
          <p className="text-xs uppercase tracking-[0.16em]" style={{ color: template.accent }}>
            {template.kind}
          </p>
          <h1 className="mt-2 text-3xl font-extrabold">{template.name}</h1>
          <p className="mt-2 text-sm text-white/75">{template.summary}</p>
          <span className="mt-4 inline-block rounded-full px-4 py-2 text-sm font-bold text-white" style={{ background: template.accent }}>
            Bắt đầu
          </span>
        </div>
        <div className="space-y-3 p-4">
          {template.points.map((point) => (
            <div key={point} className="rounded-2xl bg-slate-50 px-4 py-3">
              <p className="font-semibold">{point}</p>
              <p className="text-sm text-slate-500">Khối nội dung sẽ được viết theo ngành của bạn.</p>
            </div>
          ))}
        </div>
      </article>
      <Link
        to={`/yeu-cau?mau=${template.id}`}
        className="block rounded-full bg-[#102033] py-3 text-center font-bold text-white"
      >
        Dùng mẫu này
      </Link>
    </div>
  );
}
