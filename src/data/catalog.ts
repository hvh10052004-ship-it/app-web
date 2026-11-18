export const siteTypes = [
  { id: "landing", name: "Landing Page", blurb: "1 trang, chạy ads, thu lead, bán 1 sản phẩm.", sections: ["Hero + giá", "Lợi ích", "Đánh giá", "Form"] },
  { id: "company", name: "Website công ty", blurb: "Giới thiệu doanh nghiệp, dịch vụ, đội ngũ, liên hệ.", sections: ["Trang chủ", "Dịch vụ", "Về chúng tôi", "Liên hệ"] },
  { id: "saas", name: "Website Startup / SaaS", blurb: "Giới thiệu sản phẩm, bảng giá, đăng ký dùng thử.", sections: ["Hero sản phẩm", "Tính năng", "Bảng giá", "Đăng ký"] },
  { id: "ecommerce", name: "Web bán hàng / E-commerce", blurb: "Danh mục, sản phẩm, giỏ hàng, đặt hàng COD.", sections: ["Trang chủ shop", "Sản phẩm", "Giỏ hàng", "Thanh toán"] },
] as const;

export type SiteTypeId = (typeof siteTypes)[number]["id"];

export const catalog = [
  { id: "aura", type: "landing" as SiteTypeId, name: "AURA Glow", use: "Mỹ phẩm / skincare", image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=600&q=60" },
  { id: "event", type: "landing" as SiteTypeId, name: "Open Day", use: "Sự kiện / workshop", image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=600&q=60" },
  { id: "nova", type: "company" as SiteTypeId, name: "Nova Legal", use: "Văn phòng / dịch vụ", image: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=600&q=60" },
  { id: "build", type: "company" as SiteTypeId, name: "KienBuild", use: "Xây dựng / nội thất", image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=600&q=60" },
  { id: "pulse", type: "saas" as SiteTypeId, name: "Pulse Analytics", use: "SaaS dashboard", image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=60" },
  { id: "flow", type: "saas" as SiteTypeId, name: "Flow CRM", use: "Startup B2B", image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=60" },
  { id: "green", type: "ecommerce" as SiteTypeId, name: "Green Store", use: "Tạp hóa / organic", image: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=60" },
  { id: "mode", type: "ecommerce" as SiteTypeId, name: "Mode Apparel", use: "Thời trang", image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=600&q=60" },
];

export function typeById(id: string) {
  return siteTypes.find((item) => item.id === id) ?? siteTypes[0];
}

export function templateById(id: string) {
  return catalog.find((item) => item.id === id);
}
