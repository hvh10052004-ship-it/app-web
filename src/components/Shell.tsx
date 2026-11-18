import { useEffect, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";

const links = [
  { to: "/", label: "Trang chủ", end: true, icon: "home" },
  { to: "/mau", label: "Mẫu", end: false, icon: "grid" },
  { to: "/soan", label: "Soạn", end: false, icon: "pen" },
  { to: "/chat", label: "Chat", end: false, icon: "chat" },
  { to: "/xem", label: "Xem", end: false, icon: "eye" },
  { to: "/tai-khoan", label: "Tôi", end: false, icon: "user" },
];

export function Shell() {
  const [dark, setDark] = useState(() => localStorage.getItem("webstudio-theme") === "dark");
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    function sync() {
      setDark(localStorage.getItem("webstudio-theme") === "dark");
    }
    window.addEventListener("webstudio-theme", sync);
    return () => window.removeEventListener("webstudio-theme", sync);
  }, [dark]);
  return (
    <div className={`min-h-screen ${dark ? "bg-[#141210] text-[#f6f3ef]" : "bg-[#f6f3ef] text-[#1c1917]"}`}>
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col">
        <main className="flex-1 px-4 pt-5 pb-28">
          <Outlet />
        </main>
        <nav className={`fixed inset-x-0 bottom-0 mx-auto w-full max-w-md border-t px-1 py-2 ${dark ? "border-stone-700 bg-[#1c1917]" : "border-stone-200 bg-white"}`}>
          <ul className="grid grid-cols-6 text-center text-[10px] font-semibold text-stone-400">
            {links.map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  end={link.end}
                  className={({ isActive }) => `flex flex-col items-center gap-1 py-1 ${isActive ? "text-[#7c5cff]" : ""}`}
                >
                  <NavIcon name={link.icon} />
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

function NavIcon({ name }: { name: string }) {
  const common = { viewBox: "0 0 24 24", className: "h-5 w-5", fill: "none", stroke: "currentColor", strokeWidth: 1.8 };
  if (name === "grid") {
    return (
      <svg {...common}>
        <rect x="4" y="4" width="6" height="6" rx="1" />
        <rect x="14" y="4" width="6" height="6" rx="1" />
        <rect x="4" y="14" width="6" height="6" rx="1" />
        <rect x="14" y="14" width="6" height="6" rx="1" />
      </svg>
    );
  }
  if (name === "pen") {
    return (
      <svg {...common}>
        <path d="M4 20h4l10-10-4-4L4 16v4z" />
      </svg>
    );
  }
  if (name === "chat") {
    return (
      <svg {...common}>
        <path d="M5 6h14v9H8l-3 3V6z" />
      </svg>
    );
  }
  if (name === "eye") {
    return (
      <svg {...common}>
        <path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6S2 12 2 12z" />
        <circle cx="12" cy="12" r="2.5" />
      </svg>
    );
  }
  if (name === "user") {
    return (
      <svg {...common}>
        <circle cx="12" cy="8" r="3" />
        <path d="M5 19c1.5-3 3.8-4 7-4s5.5 1 7 4" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path d="M4 11 12 4l8 7" />
      <path d="M6 10v9h12v-9" />
    </svg>
  );
}
