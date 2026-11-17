export type Template = {
  id: string;
  name: string;
  kind: string;
  summary: string;
  accent: string;
  ink: string;
  points: string[];
};

export const templates: Template[] = [
  {
    id: "lan-gioi-thieu",
    name: "Làn sáng",
    kind: "Landing page",
    summary: "Một trang quảng cáo dịch vụ, nút gọi hành động rõ và khối báo giá ngắn.",
    accent: "#6d5efc",
    ink: "#1a1440",
    points: ["Tiêu đề lớn", "3 lợi ích", "Bảng giá", "Form liên hệ"],
  },
  {
    id: "nha-xuong",
    name: "Xưởng gọn",
    kind: "Website công ty",
    summary: "Trang doanh nghiệp với giới thiệu, dịch vụ và dự án đã làm.",
    accent: "#0f766e",
    ink: "#042f2e",
    points: ["Giới thiệu", "Dịch vụ", "Dự án", "Liên hệ"],
  },
  {
    id: "cua-hang",
    name: "Quầy nhỏ",
    kind: "Bán hàng",
    summary: "Cửa hàng với lưới sản phẩm, giá và nút đặt hàng.",
    accent: "#ea580c",
    ink: "#431407",
    points: ["Sản phẩm", "Giá", "Ưu đãi", "Đặt hàng"],
  },
  {
    id: "quy-dao",
    name: "Quỹ đạo",
    kind: "Startup / SaaS",
    summary: "Trang sản phẩm phần mềm, tính năng và lời kêu gọi dùng thử.",
    accent: "#0284c7",
    ink: "#082f49",
    points: ["Sản phẩm", "Tính năng", "Bảng gói", "Dùng thử"],
  },
  {
    id: "pho-dem",
    name: "Phố đêm",
    kind: "Nhà hàng",
    summary: "Thực đơn nổi bật, không khí tối và nút đặt bàn.",
    accent: "#f59e0b",
    ink: "#1c1408",
    points: ["Món nổi bật", "Không gian", "Đặt bàn", "Bản đồ"],
  },
  {
    id: "lop-hoc",
    name: "Lớp học",
    kind: "Giáo dục",
    summary: "Trang khóa học với lịch khai giảng và giáo viên.",
    accent: "#7c3aed",
    ink: "#2e1065",
    points: ["Khóa học", "Giáo viên", "Lịch học", "Đăng ký"],
  },
];

export function findTemplate(id: string) {
  return templates.find((item) => item.id === id);
}
