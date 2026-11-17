import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { findTemplate } from "../data/templates";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import type { Project } from "../lib/types";

const statusLabel: Record<string, string> = { moi: "Mới gửi" };

export function ProjectsPage() {
  const { user, loading } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    api<{ projects: Project[] }>("/api/projects")
      .then((data) => setProjects(data.projects))
      .catch(() => setError("Chưa tải được lịch sử. Hãy bật API local."));
  }, [user]);

  if (loading) return <p>Đang tải…</p>;
  if (!user) return <NeedLogin />;
  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-extrabold">Lịch sử dự án</h1>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {projects.length === 0 && !error && <p className="text-sm text-slate-500">Chưa có yêu cầu nào.</p>}
      {projects.map((project) => {
        const template = project.template_id ? findTemplate(project.template_id) : undefined;
        return (
          <article key={project.id} className="rounded-3xl bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-bold">{project.title}</h2>
              <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold">
                {statusLabel[project.status] ?? project.status}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-400">{new Date(project.created_at).toLocaleString("vi-VN")}</p>
            <p className="mt-2 text-sm text-slate-600">{template ? `${template.name} · ` : ""}{project.brief}</p>
          </article>
        );
      })}
    </div>
  );
}

function NeedLogin() {
  return (
    <Link to="/dang-nhap" className="block rounded-3xl bg-white p-5 font-bold shadow-sm">
      Đăng nhập để xem dự án
    </Link>
  );
}
