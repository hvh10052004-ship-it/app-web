import { Link } from "react-router-dom";
import { catalog, siteTypes } from "../data/catalog";

export function TemplatesPage() {
  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-extrabold">Kho mẫu</h1>
      {siteTypes.map((type) => (
        <section key={type.id} className="space-y-2">
          <h2 className="text-sm font-bold text-slate-500">{type.name}</h2>
          {catalog.filter((item) => item.type === type.id).map((item) => (
            <Link key={item.id} to={`/mau/${item.id}`} className="block rounded-3xl bg-white p-4 shadow-sm">
              <p className="font-bold">{item.name}</p>
              <p className="text-sm text-slate-500">{item.use}</p>
            </Link>
          ))}
        </section>
      ))}
    </div>
  );
}
