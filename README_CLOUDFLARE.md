# Tự triển khai WebStudio lên Cloudflare

Thư mục này là ứng dụng React + Vite. Website Next.js ở thư mục gốc của repo không nằm trong gói này. Không có lệnh nào trong tài liệu tự đẩy code lên Cloudflare.

## File bạn sẽ dùng

- `wrangler.jsonc`: Worker, D1 (`DB`), R2 (`ASSETS`) và thư mục giao diện `dist`.
- `worker/index.ts`: API đăng nhập, dự án, chat, ảnh.
- `worker/schema.sql`: bảng D1.
- `cloudflare-pack/frontend`: giao diện đã build, dùng để tải lên.
- `cloudflare-pack/worker`: bản sao mã Worker để bạn giữ hoặc tải lên.

`database_id` trong `wrangler.jsonc` đang là ô trống `00000000-0000-0000-0000-000000000000`. Bạn thay bằng ID Cloudflare cấp sau khi tạo D1. Không điền token giả.

## Lệnh trên máy

Trong thư mục `webstudio-app`:

```powershell
npm install
npm run build:ui
npm run prepare:frontend
npm run package:worker
npm run check:deploy
```

- `build:ui`: kiểm tra TypeScript và build giao diện web. Thư mục `dist` cũng là thư mục Capacitor dùng cho Android (`webDir` trong `capacitor.config.ts`).
- `prepare:frontend`: build lại, rồi copy `dist` sang `cloudflare-pack/frontend`.
- `package:worker`: copy mã Worker và `wrangler.jsonc` sang `cloudflare-pack/worker`. Không gọi Cloudflare.
- `check:deploy`: kiểm tra file bắt buộc còn đủ trước khi bạn triển khai.

## Việc bạn làm trên Cloudflare

1. Đăng nhập dashboard Cloudflare và tạo một Worker tên `webstudio-app`.
2. Tạo D1 tên `webstudio-app`. Copy Database ID vào `database_id` trong `wrangler.jsonc`.
3. Mở console D1 và chạy nội dung file `worker/schema.sql`.
4. Tạo bucket R2 tên `webstudio-assets`. Trong Worker, binding tên `ASSETS`.
5. Binding D1 tên `DB`.
6. Biến `APP_ORIGIN` đặt bằng địa chỉ thật của ứng dụng, ví dụ `https://webstudio-app.<tai-khoan>.workers.dev`. Không đặt mật khẩu vào biến này.
7. Nếu dùng Google, tạo OAuth client trên Google Cloud. Redirect URI là `https://<địa-chỉ-app>/api/auth/google/callback`. Đặt secret `GOOGLE_CLIENT_ID` và `GOOGLE_CLIENT_SECRET` trong mục Settings của Worker. Đặt `ADMIN_EMAIL` là email quản trị. Không ghi các giá trị này vào mã React.
8. Tải giao diện: nội dung `cloudflare-pack/frontend` là static assets của Worker. API `/api/*` do `worker/index.ts` xử lý.
9. Nếu bạn dùng Wrangler trên máy của mình, sau khi đã điền ID thật:

```powershell
npx wrangler d1 execute webstudio-app --remote --file=worker/schema.sql
npx wrangler deploy
```

Chỉ chạy `wrangler deploy` khi bạn muốn. Các lệnh `build:ui`, `prepare:frontend`, `package:worker` và `check:deploy` không triển khai.

## Chạy thử local trước khi tải lên

```powershell
npm run dev:api
npm run dev
```

Mở `http://127.0.0.1:5173`. File `.dev.vars` (xem `.dev.vars.example`) chỉ dùng local. Không đưa file đó vào gói tải lên.
