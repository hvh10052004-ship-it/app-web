import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const required = [
  "package.json",
  "index.html",
  "vite.config.ts",
  "tsconfig.json",
  "tsconfig.app.json",
  "tsconfig.node.json",
  "tsconfig.worker.json",
  "capacitor.config.ts",
  "wrangler.jsonc",
  "worker/index.ts",
  "worker/schema.sql",
  "src/main.tsx",
  "src/App.tsx",
];

let failed = false;
for (const file of required) {
  const ok = fs.existsSync(path.join(root, file));
  console.log((ok ? "OK  " : "THIẾU ") + file);
  if (!ok) failed = true;
}

const config = fs.readFileSync(path.join(root, "wrangler.jsonc"), "utf8");
for (const key of ["d1_databases", "r2_buckets", "\"binding\": \"DB\"", "\"binding\": \"ASSETS\"", "assets"]) {
  const ok = config.includes(key);
  console.log((ok ? "OK  " : "THIẾU ") + "wrangler.jsonc có " + key);
  if (!ok) failed = true;
}

const distOk = fs.existsSync(path.join(root, "dist", "index.html"));
console.log((distOk ? "OK  " : "CHƯA ") + "dist/index.html (chạy npm run prepare:frontend nếu chưa có)");

const frontend = path.join(root, "cloudflare-pack", "frontend", "index.html");
const worker = path.join(root, "cloudflare-pack", "worker", "worker", "index.ts");
console.log((fs.existsSync(frontend) ? "OK  " : "CHƯA ") + "cloudflare-pack/frontend");
console.log((fs.existsSync(worker) ? "OK  " : "CHƯA ") + "cloudflare-pack/worker");

if (config.includes("00000000-0000-0000-0000-000000000000")) {
  console.log("LƯU Ý database_id vẫn là chỗ trống. Hãy thay bằng ID D1 thật trước khi bạn tự triển khai.");
}
if (fs.existsSync(path.join(root, ".dev.vars"))) {
  console.log("OK  .dev.vars chỉ nằm trên máy này, không đưa file này lên Cloudflare bằng tay.");
}

if (failed) process.exit(1);
console.log("Đủ file mã nguồn để bạn tự đóng gói.");
