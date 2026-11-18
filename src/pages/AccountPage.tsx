import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ApiError, api } from "../lib/api";

export function AccountPage() {
  const { user, loading, refresh } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  useEffect(() => {
    if (user) setName(user.name);
  }, [user]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  if (loading) return <p>Đang tải…</p>;
  if (!user) {
    return (
      <div className="space-y-3 rounded-[28px] bg-white p-5 shadow-sm">
        <h1 className="text-2xl font-extrabold">Tài khoản</h1>
        <Link to="/dang-nhap" className="block rounded-full bg-[#102033] py-3 text-center font-bold text-white">
          Đăng nhập
        </Link>
        <Link to="/dang-ky" className="block rounded-full border border-slate-200 py-3 text-center font-bold">
          Tạo tài khoản
        </Link>
        <Menu />
      </div>
    );
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      await api("/api/me", { method: "PATCH", body: JSON.stringify({ name }) });
      await refresh();
      setMessage("Đã lưu tên hiển thị.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Không lưu được.");
    }
  }

  async function onAvatar(file: File | undefined) {
    if (!file) return;
    const form = new FormData();
    form.set("file", file);
    try {
      await api("/api/me/avatar", { method: "POST", body: form });
      await refresh();
      setMessage("Đã lưu ảnh đại diện.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Không tải ảnh được.");
    }
  }

  async function logout() {
    await api("/api/auth/logout", { method: "POST" });
    await refresh();
    navigate("/");
  }

  return (
    <div className="space-y-4">
      <section className="rounded-[28px] bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-slate-100 font-bold">
            {user.avatarUrl ? <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" /> : user.name.slice(0, 1)}
          </div>
          <div>
            <h1 className="text-xl font-extrabold">{user.name}</h1>
            <p className="text-sm text-slate-500">{user.email}</p>
            {user.isAdmin && <p className="text-xs font-semibold text-sky-700">Quản trị viên</p>}
          </div>
        </div>
        <label className="mt-4 block text-sm font-semibold">
          Ảnh đại diện
          <input className="mt-1 block w-full text-sm" type="file" accept="image/*" onChange={(e) => void onAvatar(e.target.files?.[0])} />
        </label>
      </section>
      <form onSubmit={save} className="space-y-3 rounded-[28px] bg-white p-5 shadow-sm">
        <label className="block text-sm font-semibold">
          Tên hiển thị
          <input className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-3" value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        {message && <p className="text-sm text-emerald-700">{message}</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button className="w-full rounded-full bg-[#102033] py-3 font-bold text-white">Lưu</button>
        <button type="button" onClick={() => void logout()} className="w-full rounded-full border border-slate-200 py-3 font-semibold">
          Đăng xuất
        </button>
      </form>
      <Menu />
    </div>
  );
}

function Menu() {
  const rows = [
    ["/du-an", "Lịch sử dự án"],
    ["/yeu-cau", "Gửi yêu cầu"],
    ["/toi/quyen-rieng-tu", "Quyền riêng tư"],
    ["/toi/gioi-thieu", "Giới thiệu"],
    ["/toi/nha-phat-trien", "Nhà phát triển"],
  ];
  return (
    <div className="overflow-hidden rounded-[28px] bg-white shadow-sm">
      {rows.map(([to, label]) => (
        <Link key={to} to={to} className="block border-b border-slate-100 px-5 py-4 font-semibold last:border-0">
          {label}
        </Link>
      ))}
    </div>
  );
}
