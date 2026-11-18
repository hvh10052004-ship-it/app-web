import { FormEvent, useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ApiError, api, saveSession } from "../lib/api";

export function LoginPage() {
  const navigate = useNavigate();
  const { user, refresh } = useAuth();
  const [params] = useSearchParams();
  useEffect(() => {
    if (user) navigate("/");
  }, [user, navigate]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(params.get("loi") === "google" ? "Đăng nhập Google chưa hoàn tất." : "");

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      const data = await api<{ token?: string }>("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
      if (data.token) saveSession(data.token);
      await refresh();
      navigate("/");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Không đăng nhập được.");
    }
  }

  return (
    <AuthCard title="Đăng nhập" error={error} onSubmit={onSubmit}>
      <Input label="Email" type="email" value={email} onChange={setEmail} />
      <Input label="Mật khẩu" type="password" value={password} onChange={setPassword} />
      <button className="w-full rounded-full bg-[#102033] py-3 font-bold text-white">Vào ứng dụng</button>
      <Link to="/dang-ky" className="block text-center text-sm font-semibold text-slate-500">
        Chưa có tài khoản? Đăng ký
      </Link>
    </AuthCard>
  );
}

export function RegisterPage() {
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      const data = await api<{ token?: string }>("/api/auth/register", { method: "POST", body: JSON.stringify({ name, email, password }) });
      if (data.token) saveSession(data.token);
      await refresh();
      navigate("/");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Không tạo được tài khoản.");
    }
  }

  return (
    <AuthCard title="Đăng ký" error={error} onSubmit={onSubmit}>
      <Input label="Họ tên" value={name} onChange={setName} />
      <Input label="Email" type="email" value={email} onChange={setEmail} />
      <Input label="Mật khẩu" type="password" value={password} onChange={setPassword} />
      <button className="w-full rounded-full bg-[#102033] py-3 font-bold text-white">Tạo tài khoản</button>
      <Link to="/dang-nhap" className="block text-center text-sm font-semibold text-slate-500">
        Đã có tài khoản? Đăng nhập
      </Link>
    </AuthCard>
  );
}

function AuthCard({
  title,
  error,
  onSubmit,
  children,
}: {
  title: string;
  error: string;
  onSubmit: (event: FormEvent) => void;
  children: ReactNode;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-[28px] bg-white p-5 shadow-sm">
      <h1 className="text-2xl font-extrabold">{title}</h1>
      {children}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="block text-sm font-semibold">
      {label}
      <input className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-3" type={type} value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}
