import { FormEvent, useState, type MouseEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ApiError, api, clearSession } from "../lib/api";

export function AccountPage() {
  const { user, loading, refresh } = useAuth();
  const navigate = useNavigate();

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

  async function logout() {
    await api("/api/auth/logout", { method: "POST" });
    clearSession();
    await refresh();
    navigate("/");
  }

  return (
    <div className="space-y-4 text-[#1c1917]">
      <section className="flex items-center gap-3">
        <Link to="/toi/ho-so" className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-[#7c5cff] text-lg font-bold text-white" aria-label="Mở hồ sơ">
          {user.avatarUrl ? <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" /> : user.name.slice(0, 1)}
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-extrabold">{user.name}</h1>
        </div>
        <button type="button" onClick={() => void logout()} className="rounded-2xl bg-white px-3 py-3 text-sm font-bold" aria-label="Đăng xuất">
          ⎋
        </button>
      </section>
      <Menu />
    </div>
  );
}

const NICK_KEY = "webstudio-nickname";

export function ProfilePage() {
  const { user, refresh } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [nick, setNick] = useState(() => localStorage.getItem(NICK_KEY) ?? "");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  if (!user) return null;

  async function save(event: FormEvent) {
    event.preventDefault();
    setError("");
    localStorage.setItem(NICK_KEY, nick.trim());
    try {
      await api("/api/me", { method: "PATCH", body: JSON.stringify({ name }) });
      await refresh();
      setMessage("Đã lưu tên và biệt danh.");
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
      setMessage("Đã đổi ảnh đại diện.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Không tải ảnh được. Ảnh cần nhỏ hơn 2MB.");
    }
  }

  return (
    <form onSubmit={save} className="space-y-4 text-[#1c1917]">
      <Link to="/tai-khoan" className="text-sm font-semibold text-stone-500">← Tôi</Link>
      <h1 className="text-2xl font-extrabold">Hồ sơ</h1>
      <div className="flex items-center gap-4 rounded-[28px] bg-white p-4">
        <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-[#7c5cff] text-xl font-bold text-white">
          {user.avatarUrl ? <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" /> : user.name.slice(0, 1)}
        </div>
        <label className="text-sm font-bold text-[#7c5cff]">
          Thay avatar
          <input className="sr-only" type="file" accept="image/*" onChange={(event) => void onAvatar(event.target.files?.[0])} />
        </label>
      </div>
      <label className="block text-sm font-semibold">
        Tên
        <input className="mt-1 w-full rounded-2xl border border-stone-200 bg-white px-3 py-3" value={name} onChange={(event) => setName(event.target.value)} />
      </label>
      <label className="block text-sm font-semibold">
        Biệt danh
        <input className="mt-1 w-full rounded-2xl border border-stone-200 bg-white px-3 py-3" value={nick} onChange={(event) => setNick(event.target.value)} placeholder="Tên ngắn mọi người gọi bạn" />
      </label>
      {message && <p className="text-sm text-emerald-700">{message}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button className="w-full rounded-full bg-[#7c5cff] py-3 font-bold text-white">Lưu hồ sơ</button>
    </form>
  );
}

export function ThemePage() {
  const current = localStorage.getItem("webstudio-theme") === "dark" ? "dark" : "light";
  const [theme, setTheme] = useState(current);

  function choose(next: "light" | "dark", event: MouseEvent<HTMLButtonElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const size = Math.hypot(window.innerWidth, window.innerHeight) * 2.2;
    const wave = document.createElement("span");
    wave.className = "theme-ripple";
    wave.dataset.mode = next;
    wave.style.left = `${x}px`;
    wave.style.top = `${y}px`;
    wave.style.width = `${size}px`;
    wave.style.height = `${size}px`;
    document.body.appendChild(wave);
    window.setTimeout(() => {
      localStorage.setItem("webstudio-theme", next);
      document.documentElement.dataset.theme = next;
      window.dispatchEvent(new Event("webstudio-theme"));
      setTheme(next);
    }, 2000);
    wave.addEventListener("animationend", () => wave.remove());
  }

  return (
    <div className="space-y-4 text-[#1c1917]">
      <Link to="/tai-khoan" className="text-sm font-semibold text-stone-500">← Tôi</Link>
      <h1 className="text-2xl font-extrabold">Giao diện</h1>
      <div className="grid grid-cols-2 gap-3">
        <button type="button" onClick={(event) => choose("light", event)} className={`rounded-3xl bg-white p-4 text-left ${theme === "light" ? "ring-2 ring-[#7c5cff]" : ""}`}>
          <span className="theme-swatch block h-16 rounded-2xl" style={{ background: "#f6f3ef" }} />
          <span className="mt-3 block font-extrabold">Sáng</span>
        </button>
        <button type="button" onClick={(event) => choose("dark", event)} className={`rounded-3xl bg-white p-4 text-left ${theme === "dark" ? "ring-2 ring-[#7c5cff]" : ""}`}>
          <span className="theme-swatch block h-16 rounded-2xl" style={{ background: "#141210" }} />
          <span className="mt-3 block font-extrabold">Tối</span>
        </button>
      </div>
    </div>
  );
}

function Menu() {
  const rows = [
    ["/toi/ho-so", "Hồ sơ", "Tên, biệt danh, avatar"],
    ["/toi/giao-dien", "Giao diện", "Sáng hoặc tối"],
    ["/toi/quyen-rieng-tu", "Quyền riêng tư", "Email và mật khẩu"],
    ["/toi/nha-phat-trien", "Nhà phát triển", "Ứng dụng và dữ liệu"],
    ["/toi/gioi-thieu", "Giới thiệu", "WebStudio làm gì"],
  ];
  return (
    <div className="overflow-hidden rounded-[28px] bg-white shadow-sm">
      {rows.map(([to, label, hint]) => (
        <Link key={to} to={to} className="block border-b border-stone-100 px-5 py-4 last:border-0">
          <span className="block font-semibold">{label}</span>
          <span className="mt-1 block text-sm text-stone-500">{hint}</span>
        </Link>
      ))}
    </div>
  );
}
