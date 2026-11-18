import { useState } from "react";
import { Link } from "react-router-dom";
import { siteTypes } from "../data/catalog";
import { readDraft, writeDraft, type Draft } from "../lib/draft";

const services = [
  { title: "Landing page", text: "Một trang để chạy quảng cáo và nhận liên hệ.", to: "/mau" },
  { title: "Website công ty", text: "Giới thiệu năng lực, dịch vụ và dự án.", to: "/mau" },
  { title: "Cửa hàng", text: "Trưng bày sản phẩm, giá và cách đặt hàng.", to: "/yeu-cau" },
  { title: "Startup", text: "Trang sản phẩm phần mềm và các gói sử dụng.", to: "/yeu-cau" },
];

export function HomePage() {
  const [draft, setDraft] = useState<Draft>(readDraft);
  const current = siteTypes.find((item) => item.id === draft.typeId) ?? siteTypes[0];

  return (
    <div className="space-y-4 pb-4">
      <section className="overflow-hidden rounded-[28px] bg-[#102033] p-5 text-white shadow-xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-200">Dịch vụ tạo website</p>
        <h1 className="mt-3 text-3xl font-extrabold leading-tight">Website rõ việc, dễ xem trên điện thoại.</h1>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          Chọn mẫu, xem trước, rồi gửi yêu cầu. Đội ngũ WebStudio trao đổi với bạn ngay trong ứng dụng.
        </p>
        <div className="mt-5 flex gap-2">
          <Link to="/mau" className="rounded-full bg-white px-4 py-2 text-sm font-bold text-[#102033]">
            Xem kho mẫu
          </Link>
          <Link to="/yeu-cau" className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold">
            Gửi yêu cầu
          </Link>
        </div>
      </section>
      <section className="grid grid-cols-2 gap-3">
        {services.map((service) => (
          <Link key={service.title} to={service.to} className="rounded-3xl bg-white p-4 shadow-sm">
            <h2 className="font-bold">{service.title}</h2>
            <p className="mt-2 text-sm leading-5 text-slate-500">{service.text}</p>
          </Link>
        ))}
      </section>
      <section className="rounded-[28px] bg-[#102033] p-5 text-white">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-200">Tạo website của bạn</p>
        <h1 className="mt-2 text-3xl font-extrabold leading-tight">{draft.name}</h1>
        <p className="mt-2 text-sm text-slate-300">{current.name}. Soạn trên điện thoại, rồi xem trước.</p>
        <div className="mt-4 flex gap-2">
          <Link to="/soan" className="rounded-full bg-white px-4 py-2 text-sm font-bold text-[#102033]">Soạn tiếp</Link>
          <Link to="/xem" className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold">Xem trước</Link>
        </div>
      </section>
      <div className="grid grid-cols-2 gap-3">
        {siteTypes.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              const next = { ...draft, typeId: item.id };
              writeDraft(next);
              setDraft(next);
            }}
            className={`rounded-3xl bg-white p-4 text-left shadow-sm ${draft.typeId === item.id ? "ring-2 ring-[#102033]" : ""}`}
          >
            <h2 className="font-bold">{item.name}</h2>
            <p className="mt-1 text-sm text-slate-500">{item.blurb}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
