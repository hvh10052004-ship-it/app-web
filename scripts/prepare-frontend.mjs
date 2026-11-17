import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const from = path.join(root, "dist");
const to = path.join(root, "cloudflare-pack", "frontend");

if (!fs.existsSync(path.join(from, "index.html"))) {
  console.error("Chưa có dist/index.html. Hãy chạy npm run build:ui trước.");
  process.exit(1);
}

fs.rmSync(to, { recursive: true, force: true });
fs.mkdirSync(to, { recursive: true });
fs.cpSync(from, to, { recursive: true });
console.log("Đã copy giao diện vào cloudflare-pack/frontend");
