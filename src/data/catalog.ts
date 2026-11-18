export const siteTypes = [
  { id: "landing", name: "Landing Page", blurb: "1 trang, chạy ads, thu lead, bán 1 sản phẩm.", sections: ["Hero + giá", "Lợi ích", "Đánh giá", "Form"] },
  { id: "company", name: "Website công ty", blurb: "Giới thiệu doanh nghiệp, dịch vụ, đội ngũ, liên hệ.", sections: ["Trang chủ", "Dịch vụ", "Về chúng tôi", "Liên hệ"] },
  { id: "saas", name: "Website Startup / SaaS", blurb: "Giới thiệu sản phẩm, bảng giá, đăng ký dùng thử.", sections: ["Hero sản phẩm", "Tính năng", "Bảng giá", "Đăng ký"] },
  { id: "ecommerce", name: "Web bán hàng / E-commerce", blurb: "Danh mục, sản phẩm, giỏ hàng, đặt hàng COD.", sections: ["Trang chủ shop", "Sản phẩm", "Giỏ hàng", "Thanh toán"] },
] as const;

export type SiteTypeId = (typeof siteTypes)[number]["id"];

export const catalog = [
  { id: "aura", type: "landing" as SiteTypeId, name: "AURA Glow", use: "Mỹ phẩm / skincare" },
  { id: "event", type: "landing" as SiteTypeId, name: "Open Day", use: "Sự kiện / workshop" },
  { id: "nova", type: "company" as SiteTypeId, name: "Nova Legal", use: "Văn phòng / dịch vụ" },
  { id: "build", type: "company" as SiteTypeId, name: "KienBuild", use: "Xây dựng / nội thất" },
  { id: "pulse", type: "saas" as SiteTypeId, name: "Pulse Analytics", use: "SaaS dashboard" },
  { id: "flow", type: "saas" as SiteTypeId, name: "Flow CRM", use: "Startup B2B" },
  { id: "green", type: "ecommerce" as SiteTypeId, name: "Green Store", use: "Tạp hóa / organic" },
  { id: "mode", type: "ecommerce" as SiteTypeId, name: "Mode Apparel", use: "Thời trang" },
];

export function typeById(id: string) {
  return siteTypes.find((item) => item.id === id) ?? siteTypes[0];
}

export function templateById(id: string) {
  return catalog.find((item) => item.id === id);
}
