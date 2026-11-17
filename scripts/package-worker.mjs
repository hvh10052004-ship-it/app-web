import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const to = path.join(root, "cloudflare-pack", "worker");
const files = ["worker/index.ts", "worker/schema.sql", "worker/schema.d.ts", "wrangler.jsonc"];

fs.mkdirSync(to, { recursive: true });
for (const file of files) {
  const source = path.join(root, file);
  if (!fs.existsSync(source)) {
    console.error("Thiếu file: " + file);
    process.exit(1);
  }
  const dest = path.join(to, file);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(source, dest);
}
console.log("Đã đóng gói mã Worker vào cloudflare-pack/worker");
