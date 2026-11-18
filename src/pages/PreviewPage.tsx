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
    <div className="space-y-4 text-[#1c1917]">
      <Link to="/mau" className="text-sm font-semibold text-stone-500">← Kho mẫu</Link>
      <header>
        <p className="text-xs font-semibold uppercase tracking-wide text-[#7c5cff]">{type.name}</p>
        <h1 className="mt-1 text-2xl font-extrabold">{item.name}</h1>
        <p className="mt-1 text-sm text-stone-500">Trang bạn sẽ làm cho {item.use}</p>
      </header>
      <div className="overflow-hidden rounded-[28px] border border-stone-200 bg-white shadow-sm">
        <SiteMock name={item.name} use={item.use} image={item.image} typeId={item.type} />
      </div>
      <p className="text-sm leading-6 text-stone-600">{type.note}</p>
      <Link to="/soan" onClick={useTemplate} className="block rounded-full bg-[#1c1917] py-3 text-center font-bold text-white">
        Soạn với mẫu này
      </Link>
    </div>
  );
}

function SiteMock({ name, use, image, typeId }: { name: string; use: string; image: string; typeId: string }) {
  if (typeId === "company") return <CompanyMock name={name} use={use} image={image} />;
  if (typeId === "saas") return <SaasMock name={name} use={use} image={image} />;
  if (typeId === "ecommerce") return <ShopMock name={name} use={use} image={image} />;
  return <LandingMock name={name} use={use} image={image} />;
}

function LandingMock({ name, use, image }: { name: string; use: string; image: string }) {
  return (
    <div>
      <img src={image} alt="" className="h-40 w-full object-cover" />
      <div className="space-y-4 p-4">
        <p className="text-xs font-semibold uppercase text-[#7c5cff]">{use}</p>
        <h2 className="text-2xl font-extrabold leading-tight">{name}</h2>
        <p className="text-sm text-stone-600">Một trang để chạy quảng cáo, nói rõ giá và nhận thông tin khách.</p>
        <p className="text-lg font-extrabold">890.000đ</p>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <p className="rounded-2xl bg-[#f6f3ef] p-3">Lợi ích 1 — kết quả rõ</p>
          <p className="rounded-2xl bg-[#f6f3ef] p-3">Lợi ích 2 — dùng ngay</p>
        </div>
        <p className="rounded-2xl bg-stone-100 p-3 text-sm">“Đúng thứ mình cần.” — khách dùng {name}</p>
        <div className="rounded-2xl bg-[#1c1917] p-3 text-center text-sm font-bold text-white">Để lại thông tin</div>
      </div>
    </div>
  );
}

function CompanyMock({ name, use, image }: { name: string; use: string; image: string }) {
  return (
    <div>
      <div className="flex items-center justify-between bg-[#1c1917] px-4 py-3 text-white">
        <span className="font-extrabold">{name}</span>
        <span className="text-xs text-stone-300">Dịch vụ · Về chúng tôi · Liên hệ</span>
      </div>
      <img src={image} alt="" className="h-36 w-full object-cover" />
      <div className="space-y-3 p-4">
        <h2 className="text-xl font-extrabold">Giới thiệu {name}</h2>
        <p className="text-sm text-stone-600">Doanh nghiệp thuộc lĩnh vực {use}.</p>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <p className="rounded-2xl bg-[#f6f3ef] p-3 font-semibold">Dịch vụ chính</p>
          <p className="rounded-2xl bg-[#f6f3ef] p-3 font-semibold">Tư vấn riêng</p>
        </div>
        <p className="rounded-2xl border border-stone-200 p-3 text-sm">Đội ngũ — người phụ trách từng hạng mục.</p>
        <p className="text-sm font-semibold">Liên hệ: 0900 000 000</p>
      </div>
    </div>
  );
}

function SaasMock({ name, use, image }: { name: string; use: string; image: string }) {
  return (
    <div>
      <div className="bg-[#241c4a] p-4 text-white">
        <p className="text-xs uppercase tracking-wide text-violet-200">{use}</p>
        <h2 className="mt-2 text-2xl font-extrabold">{name}</h2>
        <p className="mt-2 text-sm text-violet-100">Sản phẩm để đội ngũ làm việc nhanh hơn.</p>
        <div className="mt-3 inline-block rounded-full bg-white px-4 py-2 text-sm font-bold text-[#241c4a]">Dùng thử</div>
      </div>
      <img src={image} alt="" className="h-32 w-full object-cover" />
      <div className="grid grid-cols-3 gap-2 p-4 text-center text-xs font-semibold">
        <p className="rounded-2xl bg-[#f3efff] p-3">Tính năng</p>
        <p className="rounded-2xl bg-[#f3efff] p-3">Bảng giá</p>
        <p className="rounded-2xl bg-[#f3efff] p-3">Đăng ký</p>
      </div>
      <div className="grid grid-cols-2 gap-2 px-4 pb-4 text-sm">
        <p className="rounded-2xl border border-stone-200 p-3">Miễn phí<br />0đ</p>
        <p className="rounded-2xl bg-[#1c1917] p-3 text-white">Pro<br />299.000đ/tháng</p>
      </div>
    </div>
  );
}

function ShopMock({ name, use, image }: { name: string; use: string; image: string }) {
  const products = ["Sản phẩm A", "Sản phẩm B", "Sản phẩm C", "Sản phẩm D"];
  return (
    <div>
      <div className="flex items-center justify-between px-4 py-3">
        <span className="font-extrabold">{name}</span>
        <span className="rounded-full bg-[#1c1917] px-3 py-1 text-xs font-bold text-white">Giỏ · 2</span>
      </div>
      <img src={image} alt="" className="h-32 w-full object-cover" />
      <p className="px-4 pt-3 text-sm text-stone-500">{use}</p>
      <div className="grid grid-cols-2 gap-2 p-4">
        {products.map((product) => (
          <div key={product} className="rounded-2xl bg-[#f6f3ef] p-3">
            <p className="text-sm font-bold">{product}</p>
            <p className="text-xs text-stone-500">129.000đ</p>
          </div>
        ))}
      </div>
      <div className="mx-4 mb-4 rounded-2xl bg-[#1c1917] p-3 text-center text-sm font-bold text-white">Thanh toán · COD</div>
    </div>
  );
}
