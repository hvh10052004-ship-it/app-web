import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const links = [
  { to: "/", label: "Trang chủ", end: true },
  { to: "/mau", label: "Kho mẫu" },
  { to: "/yeu-cau", label: "Yêu cầu" },
  { to: "/chat", label: "Chat" },
  { to: "/tai-khoan", label: "Tài khoản" },
];

export function Shell() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#dbe7ff,transparent_36%),linear-gradient(#e7eef8,#f8fafc)] text-[#102033]">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col">
        <header className="flex items-center justify-between px-4 pt-5 pb-3">
          <div>
            <p className="text-lg font-extrabold tracking-tight">WebStudio</p>
            <p className="text-xs text-slate-500">{user ? user.name : "Tạo website cho doanh nghiệp"}</p>
          </div>
          <NavLink
            to="/du-an"
            className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm"
          >
            Dự án
          </NavLink>
        </header>
        <main className="flex-1 px-4 pb-24">
          <Outlet />
        </main>
        <nav className="fixed inset-x-0 bottom-0 mx-auto w-full max-w-md border-t border-white/70 bg-white/90 px-2 py-2 backdrop-blur">
          <ul className="grid grid-cols-5 gap-1 text-center text-[11px] font-semibold text-slate-500">
            {links.map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  end={link.end}
                  className={({ isActive }) =>
                    `block rounded-2xl px-1 py-2 ${isActive ? "bg-[#102033] text-white" : ""}`
                  }
                >
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  );
}
