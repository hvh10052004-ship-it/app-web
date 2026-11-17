import { FormEvent, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { templates } from "../data/templates";
import { ApiError, api } from "../lib/api";

export function RequestPage() {
  const { user, loading } = useAuth();
  const [params] = useSearchParams();
  const [templateId, setTemplateId] = useState(params.get("mau") ?? templates[0].id);
  const [title, setTitle] = useState("");
  const [phone, setPhone] = useState("");
  const [brief, setBrief] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");
    try {
      await api("/api/requests", {
        method: "POST",
        body: JSON.stringify({ templateId, title, phone, brief }),
      });
      setTitle("");
      setPhone("");
      setBrief("");
      setMessage("Đã lưu yêu cầu vào lịch sử dự án.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Không gửi được.");
    }
  }

  if (loading) return <p>Đang tải…</p>;
  if (!user) {
    return (
      <div className="rounded-3xl bg-white p-5 shadow-sm">
        <h1 className="text-xl font-extrabold">Đăng nhập để gửi yêu cầu</h1>
        <Link to="/dang-nhap" className="mt-4 inline-block rounded-full bg-[#102033] px-4 py-2 font-bold text-white">
          Đăng nhập
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-[28px] bg-white p-4 shadow-sm">
      <h1 className="text-2xl font-extrabold">Yêu cầu tạo website</h1>
      <label className="block text-sm font-semibold">
        Mẫu
        <select className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-3" value={templateId} onChange={(e) => setTemplateId(e.target.value)}>
          {templates.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name} — {item.kind}
            </option>
          ))}
        </select>
      </label>
      <Field label="Tên dự án" value={title} onChange={setTitle} />
      <Field label="Số điện thoại" value={phone} onChange={setPhone} />
      <label className="block text-sm font-semibold">
        Mô tả
        <textarea className="mt-1 min-h-32 w-full rounded-2xl border border-slate-200 px-3 py-3" value={brief} onChange={(e) => setBrief(e.target.value)} />
      </label>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {message && <p className="text-sm text-emerald-700">{message}</p>}
      <button className="w-full rounded-full bg-[#102033] py-3 font-bold text-white">Gửi yêu cầu</button>
    </form>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block text-sm font-semibold">
      {label}
      <input className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-3" value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}
