import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Shell } from "./components/Shell";
import { AccountPage, ProfilePage, ThemePage } from "./pages/AccountPage";
import { LoginPage, RegisterPage } from "./pages/AuthPages";
import { ChatPage } from "./pages/ChatPage";
import { HomePage } from "./pages/HomePage";
import { ComposeFormPage, ComposePage } from "./pages/ComposePage";
import { AboutPage, DeveloperPage, PrivacyPage } from "./pages/InfoPages";
import { PreviewPage } from "./pages/PreviewPage";
import { ProjectsPage } from "./pages/ProjectsPage";
import { RequestPage } from "./pages/RequestPage";
import { TemplatesPage } from "./pages/TemplatesPage";
import { ViewDetailPage, ViewPage } from "./pages/ViewPage";

function RequireAuth() {
  const { user, loading } = useAuth();
  const entered = sessionStorage.getItem("webstudio-gate") === "1";
  if (loading) return <p className="p-6 text-sm text-stone-500">Đang mở đăng nhập…</p>;
  if (!entered || !user) return <Navigate to="/dang-nhap" replace />;
  return <Outlet />;
}

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="dang-nhap" element={<LoginPage />} />
          <Route path="dang-ky" element={<RegisterPage />} />
          <Route element={<RequireAuth />}>
          <Route element={<Shell />}>
            <Route index element={<HomePage />} />
            <Route path="mau" element={<TemplatesPage />} />
            <Route path="mau/:id" element={<PreviewPage />} />
            <Route path="soan" element={<ComposePage />} />
            <Route path="soan/noi-dung" element={<ComposeFormPage />} />
            <Route path="xem" element={<ViewPage />} />
            <Route path="xem/:loai" element={<ViewDetailPage />} />
            <Route path="yeu-cau" element={<RequestPage />} />
            <Route path="chat" element={<ChatPage />} />
            <Route path="toi/ho-so" element={<ProfilePage />} />
            <Route path="toi/giao-dien" element={<ThemePage />} />
            <Route path="toi/quyen-rieng-tu" element={<PrivacyPage />} />
            <Route path="toi/gioi-thieu" element={<AboutPage />} />
            <Route path="toi/nha-phat-trien" element={<DeveloperPage />} />
            <Route path="du-an" element={<ProjectsPage />} />
            <Route path="tai-khoan" element={<AccountPage />} />
          </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
