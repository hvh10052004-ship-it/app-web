import { Link, useParams } from "react-router-dom";
import { templateById, typeById } from "../data/catalog";
import { readDraft, writeDraft } from "../lib/draft";

export function PreviewPage() {
  const { id = "" } = useParams();
  const item = templateById(id);
  if (!item) return <p>Không thấy mẫu này.</p>;
  const type = typeById(item.type);

  function useTemplate() {
    const draft = readDraft();
    writeDraft({ ...draft, typeId: item!.type, templateId: item!.id, name: item!.name });
  }

  return (
    <div className="space-y-4">
      <Link to="/mau" className="text-sm font-semibold text-slate-500">← Kho mẫu</Link>
      <article className="rounded-[28px] bg-[#102033] p-5 text-white">
        <p className="text-xs uppercase tracking-[0.16em] text-sky-200">{type.name}</p>
        <h1 className="mt-2 text-3xl font-extrabold">{item.name}</h1>
        <p className="mt-2 text-sm text-slate-300">{item.use}</p>
      </article>
      {type.sections.map((section) => (
        <div key={section} className="rounded-3xl bg-white p-4 shadow-sm">
          <p className="font-bold">{section}</p>
          <p className="text-sm text-slate-500">Khối này có trong bản soạn của mẫu {item.name}.</p>
        </div>
      ))}
      <Link to="/soan" onClick={useTemplate} className="block rounded-full bg-[#102033] py-3 text-center font-bold text-white">
        Soạn với mẫu này
      </Link>
    </div>
  );
}
