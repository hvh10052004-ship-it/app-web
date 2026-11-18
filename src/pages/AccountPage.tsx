import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { typeById } from "../data/catalog";
import { readDraft } from "../lib/draft";
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
    sessionStorage.removeItem("webstudio-gate");
    await refresh();
    navigate("/");
  }

  const draft = readDraft();
  const type = typeById(draft.typeId);
  const code = draft.name.replace(/\s+/g, "").slice(0, 6).toUpperCase() || "SITE";

  return (
    <div className="space-y-4 text-[#1c1917]">
      <section className="flex items-center gap-3">
        <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-[#7c5cff] text-lg font-bold text-white">
          {user.avatarUrl ? <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" /> : user.name.slice(0, 1)}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-extrabold">{user.name}</h1>
          <p className="text-sm text-stone-500">{type.name} · {code}</p>
          <p className="text-xs text-stone-400">Đăng nhập: {user.email}</p>
        </div>
        <button type="button" onClick={() => void logout()} className="rounded-2xl bg-white px-3 py-3 text-sm font-bold" aria-label="Đăng xuất">
          ⎋
        </button>
      </section>
      <Menu />
      <form onSubmit={save} className="space-y-3 rounded-[28px] bg-white p-4">
        <label className="block text-sm font-semibold">
          Hồ sơ — tên hiển thị
          <input className="mt-1 w-full rounded-2xl border border-stone-200 px-3 py-3" value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="block text-sm font-semibold">
          Ảnh đại diện
          <input className="mt-1 block w-full text-sm" type="file" accept="image/*" onChange={(e) => void onAvatar(e.target.files?.[0])} />
        </label>
        {message && <p className="text-sm text-emerald-700">{message}</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button className="w-full rounded-full bg-[#7c5cff] py-3 font-bold text-white">Lưu hồ sơ</button>
      </form>
    </div>
  );
}

function Menu() {
  const rows = [
    ["/tai-khoan", "Hồ sơ"],
    ["/tai-khoan", "Giao diện"],
    ["/toi/quyen-rieng-tu", "Quyền riêng tư"],
    ["/tai-khoan", "Tài khoản và bảo mật"],
    ["/toi/nha-phat-trien", "Nhà phát triển"],
    ["/toi/gioi-thieu", "Giới thiệu"],
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
