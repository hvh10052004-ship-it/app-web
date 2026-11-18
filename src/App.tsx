import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { Shell } from "./components/Shell";
import { AccountPage } from "./pages/AccountPage";
import { LoginPage, RegisterPage } from "./pages/AuthPages";
import { ChatPage } from "./pages/ChatPage";
import { HomePage } from "./pages/HomePage";
import { ComposePage } from "./pages/ComposePage";
import { AboutPage, DeveloperPage, PrivacyPage } from "./pages/InfoPages";
import { PreviewPage } from "./pages/PreviewPage";
import { ProjectsPage } from "./pages/ProjectsPage";
import { RequestPage } from "./pages/RequestPage";
import { TemplatesPage } from "./pages/TemplatesPage";
import { ViewPage } from "./pages/ViewPage";

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Shell />}>
            <Route index element={<HomePage />} />
            <Route path="mau" element={<TemplatesPage />} />
            <Route path="mau/:id" element={<PreviewPage />} />
            <Route path="soan" element={<ComposePage />} />
            <Route path="xem" element={<ViewPage />} />
            <Route path="yeu-cau" element={<RequestPage />} />
            <Route path="chat" element={<ChatPage />} />
            <Route path="toi/quyen-rieng-tu" element={<PrivacyPage />} />
            <Route path="toi/gioi-thieu" element={<AboutPage />} />
            <Route path="toi/nha-phat-trien" element={<DeveloperPage />} />
            <Route path="du-an" element={<ProjectsPage />} />
            <Route path="tai-khoan" element={<AccountPage />} />
            <Route path="dang-nhap" element={<LoginPage />} />
            <Route path="dang-ky" element={<RegisterPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
