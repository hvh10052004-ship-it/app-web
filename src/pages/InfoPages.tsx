import { Link } from "react-router-dom";

export function PrivacyPage() {
  return (
    <Info title="Quyền riêng tư">
      WebStudio chỉ dùng email, tên và nội dung bạn tự nhập để tạo website và trao đổi trong chat. Mật khẩu không lưu trên điện thoại và không đưa vào file APK.
    </Info>
  );
}

export function AboutPage() {
  return (
    <Info title="Giới thiệu">
      WebStudio giúp bạn chọn mẫu, soạn nội dung trên điện thoại, xem trước và gửi yêu cầu. Quản trị viên trả lời trong mục Chat.
    </Info>
  );
}

export function DeveloperPage() {
  return (
    <Info title="Nhà phát triển">
      Ứng dụng dùng React, Vite và Capacitor. Dữ liệu tài khoản nằm trên Cloudflare khi bạn đã đăng nhập. Bản soạn đang lưu tạm trên điện thoại.
    </Info>
  );
}

function Info({ title, children }: { title: string; children: string }) {
  return (
    <article className="space-y-3 rounded-[28px] bg-white p-5 shadow-sm">
      <Link to="/tai-khoan" className="text-sm font-semibold text-slate-500">← Tôi</Link>
      <h1 className="text-2xl font-extrabold">{title}</h1>
      <p className="text-sm leading-6 text-slate-600">{children}</p>
    </article>
  );
}
