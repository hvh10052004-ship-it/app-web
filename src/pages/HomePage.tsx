import { Link } from "react-router-dom";

const services = [
  { title: "Landing page", text: "Một trang để chạy quảng cáo và nhận liên hệ." },
  { title: "Website công ty", text: "Giới thiệu năng lực, dịch vụ và dự án." },
  { title: "Cửa hàng", text: "Trưng bày sản phẩm, giá và cách đặt hàng." },
  { title: "Startup", text: "Trang sản phẩm phần mềm và các gói sử dụng." },
];

export function HomePage() {
  return (
    <div className="space-y-4">
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
          <article key={service.title} className="rounded-3xl bg-white p-4 shadow-sm">
            <h2 className="font-bold">{service.title}</h2>
            <p className="mt-2 text-sm leading-5 text-slate-500">{service.text}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
