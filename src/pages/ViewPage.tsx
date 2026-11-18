import { Link } from "react-router-dom";
import { templateById, typeById } from "../data/catalog";
import { readDraft } from "../lib/draft";

export function ViewPage() {
  const draft = readDraft();
  const type = typeById(draft.typeId);
  const template = templateById(draft.templateId);

  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-extrabold">Xem trước</h1>
      <article className="overflow-hidden rounded-[28px] bg-white shadow-sm">
        <div className="bg-[#102033] p-5 text-white">
          <p className="text-xs uppercase tracking-[0.16em] text-sky-200">{template?.name ?? type.name}</p>
          <h2 className="mt-2 text-3xl font-extrabold">{draft.headline || draft.name}</h2>
          <p className="mt-2 text-sm text-slate-300">{draft.about || type.blurb}</p>
          {draft.phone && <p className="mt-3 text-sm font-semibold">Liên hệ: {draft.phone}</p>}
        </div>
        <div className="space-y-2 p-4">
          {type.sections.map((section) => (
            <div key={section} className="rounded-2xl bg-slate-50 px-4 py-3">
              <p className="font-semibold">{section}</p>
            </div>
          ))}
        </div>
      </article>
      <Link to="/soan" className="block rounded-full bg-[#102033] py-3 text-center font-bold text-white">Sửa nội dung</Link>
    </div>
  );
}
