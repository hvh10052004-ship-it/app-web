import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ApiError, api } from "../lib/api";

export function PrivacyPage() {
  const { user, refresh } = useAuth();
  const [email, setEmail] = useState(user?.email ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function save(event: FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");
    try {
      await api("/api/me/security", {
        method: "POST",
        body: JSON.stringify({ email, currentPassword, newPassword }),
      });
      await refresh();
      setCurrentPassword("");
      setNewPassword("");
      setMessage("Đã cập nhật email và mật khẩu.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Chưa lưu được.");
    }
  }

  return (
    <form onSubmit={save} className="space-y-4 text-[#1c1917]">
      <Link to="/tai-khoan" className="text-sm font-semibold text-stone-500">← Tôi</Link>
      <h1 className="text-2xl font-extrabold">Quyền riêng tư</h1>
      <p className="text-sm leading-6 text-stone-500">Email dùng để đăng nhập. Mật khẩu chỉ lưu dạng mã hóa trên máy chủ, không nằm trong ứng dụng.</p>
      <label className="block text-sm font-semibold">
        Email
        <input type="email" className="mt-1 w-full rounded-2xl border border-stone-200 bg-white px-3 py-3" value={email} onChange={(event) => setEmail(event.target.value)} />
      </label>
      <label className="block text-sm font-semibold">
        Mật khẩu hiện tại
        <input type="password" className="mt-1 w-full rounded-2xl border border-stone-200 bg-white px-3 py-3" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} />
      </label>
      <label className="block text-sm font-semibold">
        Mật khẩu mới
        <input type="password" className="mt-1 w-full rounded-2xl border border-stone-200 bg-white px-3 py-3" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} placeholder="Để trống nếu chỉ đổi email" />
      </label>
      {message && <p className="text-sm text-emerald-700">{message}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button className="w-full rounded-full bg-[#7c5cff] py-3 font-bold text-white">Lưu quyền riêng tư</button>
    </form>
  );
}

export function AboutPage() {
  return (
    <article className="space-y-4 text-[#1c1917]">
      <Link to="/tai-khoan" className="text-sm font-semibold text-stone-500">← Tôi</Link>
      <div className="overflow-hidden rounded-[28px] bg-[#241c4a] p-6 text-white">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-200">WebStudio</p>
        <h1 className="mt-2 text-3xl font-extrabold leading-tight">Soạn website ngay trên điện thoại</h1>
        <p className="mt-3 text-sm leading-6 text-violet-100">Chọn loại trang, xem mẫu, điền nội dung và gửi cho người phụ trách. Mọi thứ nằm trong một ứng dụng.</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[
          ["01", "Chọn loại", "Landing, công ty, SaaS hoặc bán hàng."],
          ["02", "Xem mẫu", "Mỗi mẫu là một trang mẫu để hình dung."],
          ["03", "Soạn", "Ô thông tin đổi theo loại website."],
          ["04", "Gửi", "Nội dung vào mục tin nhắn của admin."],
        ].map(([step, title, text]) => (
          <div key={step} className="rounded-3xl bg-white p-4 shadow-sm">
            <p className="text-xs font-bold text-[#7c5cff]">{step}</p>
            <h2 className="mt-2 font-extrabold">{title}</h2>
            <p className="mt-1 text-sm leading-5 text-stone-500">{text}</p>
          </div>
        ))}
      </div>
    </article>
  );
}

export function DeveloperPage() {
  const cards = [
    ["Giao diện", "React và Vite, xem được trên điện thoại qua Capacitor."],
    ["Tài khoản", "Đăng ký, đăng nhập và phiên làm việc trên Cloudflare Workers."],
    ["Dữ liệu", "Hồ sơ và tin nhắn nằm trên D1. Ảnh đại diện nằm trên R2."],
    ["Bản soạn", "Nội dung từng loại website được giữ riêng trên máy bạn."],
  ];
  return (
    <article className="space-y-4 text-[#1c1917]">
      <Link to="/tai-khoan" className="text-sm font-semibold text-stone-500">← Tôi</Link>
      <div className="rounded-[28px] bg-[#1c1917] p-6 text-white">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-400">Nhà phát triển</p>
        <h1 className="mt-2 text-3xl font-extrabold">WebStudio</h1>
        <p className="mt-3 text-sm leading-6 text-stone-300">Ứng dụng khách để tạo website. Không nhúng mật khẩu hay khóa bí mật trong file cài đặt.</p>
      </div>
      <div className="space-y-3">
        {cards.map(([title, text]) => (
          <div key={title} className="rounded-3xl bg-white p-4 shadow-sm">
            <h2 className="font-extrabold">{title}</h2>
            <p className="mt-1 text-sm leading-6 text-stone-500">{text}</p>
          </div>
        ))}
      </div>
    </article>
  );
}
