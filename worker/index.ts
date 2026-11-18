import schema from "./schema.sql";

export interface Env {
  DB: D1Database;
  ASSETS: R2Bucket;
  ADMIN_EMAIL?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  APP_ORIGIN?: string;
}

type UserRow = {
  id: string;
  email: string;
  name: string;
  password_hash: string | null;
  password_salt: string | null;
  provider: string;
  google_sub: string | null;
  avatar_key: string | null;
  created_at: string;
};

const COOKIE = "ws_session";
const STATE_COOKIE = "ws_google_state";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "OPTIONS") return withCors(new Response(null, { status: 204 }), request);
    return withCors(await handle(request, env), request);
  },
};

async function handle(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (!url.pathname.startsWith("/api")) {
      return json({ error: "Không tìm thấy." }, 404);
    }

    try {
      await ensureSchema(env);
      if (url.pathname === "/api/health") return json({ ok: true });
      if (url.pathname === "/api/auth/register" && request.method === "POST") {
        return register(request, env);
      }
      if (url.pathname === "/api/auth/login" && request.method === "POST") {
        return login(request, env);
      }
      if (url.pathname === "/api/auth/logout" && request.method === "POST") {
        return logout(request, env);
      }
      if (url.pathname === "/api/auth/me" && request.method === "GET") {
        return me(request, env);
      }
      if (url.pathname === "/api/auth/google" && request.method === "GET") {
        return googleStart(request, env);
      }
      if (url.pathname === "/api/auth/google/callback" && request.method === "GET") {
        return googleCallback(request, env);
      }
      if (url.pathname === "/api/me" && request.method === "PATCH") {
        return updateMe(request, env);
      }
      if (url.pathname === "/api/me/avatar" && request.method === "POST") {
        return uploadAvatar(request, env);
      }
      if (url.pathname.startsWith("/api/files/") && request.method === "GET") {
        return readFile(request, env, url.pathname.slice("/api/files/".length));
      }
      if (url.pathname === "/api/requests" && request.method === "POST") {
        return createRequest(request, env);
      }
      if (url.pathname === "/api/projects" && request.method === "GET") {
        return listProjects(request, env);
      }
      if (url.pathname === "/api/chat" && request.method === "GET") {
        return listChat(request, env, url);
      }
      if (url.pathname === "/api/chat" && request.method === "POST") {
        return postChat(request, env);
      }
      return json({ error: "Không tìm thấy." }, 404);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Lỗi máy chủ.";
      return json({ error: message }, 500);
    }
}

async function ensureSchema(env: Env) {
  const statements = schema
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean);
  for (const statement of statements) {
    await env.DB.prepare(statement).run();
  }
}

async function register(request: Request, env: Env) {
  const body = await readJson(request);
  const email = cleanEmail(body.email);
  const name = String(body.name ?? "").trim();
  const password = String(body.password ?? "");
  if (!email || !name || password.length < 8) {
    return json({ error: "Nhập họ tên, email hợp lệ và mật khẩu từ 8 ký tự." }, 400);
  }
  const existing = await env.DB.prepare("SELECT id FROM users WHERE email = ?").bind(email).first();
  if (existing) return json({ error: "Email này đã có tài khoản." }, 409);
  const id = crypto.randomUUID();
  const { hash, salt } = await hashPassword(password);
  await env.DB.prepare(
    "INSERT INTO users (id, email, name, password_hash, password_salt, provider, created_at) VALUES (?, ?, ?, ?, ?, 'password', ?)",
  )
    .bind(id, email, name, hash, salt, new Date().toISOString())
    .run();
  return withSession(env, id, json({ ok: true }));
}

async function login(request: Request, env: Env) {
  const body = await readJson(request);
  const email = cleanEmail(body.email);
  const password = String(body.password ?? "");
  const user = await env.DB.prepare("SELECT * FROM users WHERE email = ?").bind(email).first<UserRow>();
  if (!user?.password_hash || !user.password_salt) {
    return json({ error: "Email hoặc mật khẩu chưa đúng." }, 401);
  }
  const { hash } = await hashPassword(password, fromHex(user.password_salt));
  if (!safeEqual(hash, user.password_hash)) {
    return json({ error: "Email hoặc mật khẩu chưa đúng." }, 401);
  }
  return withSession(env, user.id, json({ ok: true }));
}

async function logout(request: Request, env: Env) {
  const token = readCookie(request, COOKIE);
  if (token) await env.DB.prepare("DELETE FROM sessions WHERE token = ?").bind(token).run();
  return json({ ok: true }, 200, clearCookie(COOKIE));
}

async function me(request: Request, env: Env) {
  const user = await currentUser(request, env);
  if (!user) return json({ user: null });
  return json({ user: publicUser(user, env) });
}

async function updateMe(request: Request, env: Env) {
  const user = await currentUser(request, env);
  if (!user) return json({ error: "Bạn cần đăng nhập." }, 401);
  const body = await readJson(request);
  const name = String(body.name ?? user.name).trim();
  if (!name) return json({ error: "Tên không được để trống." }, 400);
  await env.DB.prepare("UPDATE users SET name = ? WHERE id = ?").bind(name, user.id).run();
  return json({ user: publicUser({ ...user, name }, env) });
}

async function uploadAvatar(request: Request, env: Env) {
  const user = await currentUser(request, env);
  if (!user) return json({ error: "Bạn cần đăng nhập." }, 401);
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File) || !file.type.startsWith("image/") || file.size > 2_000_000) {
    return json({ error: "Chọn ảnh nhỏ hơn 2MB." }, 400);
  }
  const key = `avatars/${user.id}/${crypto.randomUUID()}`;
  await env.ASSETS.put(key, await file.arrayBuffer(), {
    httpMetadata: { contentType: file.type },
  });
  await env.DB.prepare("UPDATE users SET avatar_key = ? WHERE id = ?").bind(key, user.id).run();
  return json({ avatarUrl: `/api/files/${key}` });
}

async function readFile(request: Request, env: Env, key: string) {
  const user = await currentUser(request, env);
  if (!user) return json({ error: "Bạn cần đăng nhập." }, 401);
  if (!key.startsWith(`avatars/${user.id}/`) && !isAdmin(user, env)) {
    return json({ error: "Không có quyền xem tệp này." }, 403);
  }
  const object = await env.ASSETS.get(key);
  if (!object) return json({ error: "Không thấy tệp." }, 404);
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("Cache-Control", "private, max-age=3600");
  return new Response(object.body, { headers });
}

async function createRequest(request: Request, env: Env) {
  const user = await currentUser(request, env);
  if (!user) return json({ error: "Bạn cần đăng nhập." }, 401);
  const body = await readJson(request);
  const title = String(body.title ?? "").trim();
  const brief = String(body.brief ?? "").trim();
  const phone = String(body.phone ?? "").trim();
  const templateId = String(body.templateId ?? "").trim() || null;
  if (title.length < 3 || brief.length < 10) {
    return json({ error: "Nhập tên dự án và mô tả ít nhất 10 ký tự." }, 400);
  }
  const id = crypto.randomUUID();
  await env.DB.prepare(
    "INSERT INTO projects (id, user_id, template_id, title, phone, brief, status, created_at) VALUES (?, ?, ?, ?, ?, ?, 'moi', ?)",
  )
    .bind(id, user.id, templateId, title, phone || null, brief, new Date().toISOString())
    .run();
  return json({ id }, 201);
}

async function listProjects(request: Request, env: Env) {
  const user = await currentUser(request, env);
  if (!user) return json({ error: "Bạn cần đăng nhập." }, 401);
  const query = isAdmin(user, env)
    ? "SELECT id, user_id, template_id, title, phone, brief, status, created_at FROM projects ORDER BY created_at DESC"
    : "SELECT id, user_id, template_id, title, phone, brief, status, created_at FROM projects WHERE user_id = ? ORDER BY created_at DESC";
  const statement = env.DB.prepare(query);
  const result = isAdmin(user, env) ? await statement.all() : await statement.bind(user.id).all();
  return json({ projects: result.results ?? [] });
}

async function listChat(request: Request, env: Env, url: URL) {
  const user = await currentUser(request, env);
  if (!user) return json({ error: "Bạn cần đăng nhập." }, 401);
  const requested = url.searchParams.get("userId");
  const threadUserId = isAdmin(user, env) && requested ? requested : user.id;
  if (!isAdmin(user, env) && threadUserId !== user.id) {
    return json({ error: "Không có quyền." }, 403);
  }
  const messages = await env.DB.prepare(
    "SELECT id, thread_user_id, sender_role, body, created_at FROM messages WHERE thread_user_id = ? ORDER BY created_at ASC",
  )
    .bind(threadUserId)
    .all();
  let threads: unknown[] = [];
  if (isAdmin(user, env)) {
    const rows = await env.DB.prepare(
      `SELECT u.id, u.name, u.email,
        (SELECT body FROM messages m WHERE m.thread_user_id = u.id ORDER BY created_at DESC LIMIT 1) AS last_body
       FROM users u
       WHERE u.id IN (SELECT DISTINCT thread_user_id FROM messages)
       ORDER BY u.created_at DESC`,
    ).all();
    threads = rows.results ?? [];
  }
  return json({ messages: messages.results ?? [], threads, isAdmin: isAdmin(user, env) });
}

async function postChat(request: Request, env: Env) {
  const user = await currentUser(request, env);
  if (!user) return json({ error: "Bạn cần đăng nhập." }, 401);
  const body = await readJson(request);
  const text = String(body.body ?? "").trim();
  if (!text || text.length > 2000) return json({ error: "Tin nhắn trống hoặc quá dài." }, 400);
  const admin = isAdmin(user, env);
  const threadUserId = admin ? String(body.userId ?? "") : user.id;
  if (!threadUserId) return json({ error: "Thiếu cuộc trò chuyện." }, 400);
  await env.DB.prepare(
    "INSERT INTO messages (id, thread_user_id, sender_id, sender_role, body, created_at) VALUES (?, ?, ?, ?, ?, ?)",
  )
    .bind(
      crypto.randomUUID(),
      threadUserId,
      user.id,
      admin ? "admin" : "customer",
      text,
      new Date().toISOString(),
    )
    .run();
  return json({ ok: true }, 201);
}

function googleStart(request: Request, env: Env) {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    return json(
      { error: "Đăng nhập Google chưa được cấu hình. Thêm GOOGLE_CLIENT_ID và GOOGLE_CLIENT_SECRET trên Worker." },
      503,
    );
  }
  const origin = appOrigin(request, env);
  const state = crypto.randomUUID();
  const redirect = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  redirect.searchParams.set("client_id", env.GOOGLE_CLIENT_ID);
  redirect.searchParams.set("redirect_uri", `${origin}/api/auth/google/callback`);
  redirect.searchParams.set("response_type", "code");
  redirect.searchParams.set("scope", "openid email profile");
  redirect.searchParams.set("state", state);
  const headers = new Headers({ Location: redirect.toString() });
  headers.append("Set-Cookie", cookie(STATE_COOKIE, state, 600));
  return new Response(null, { status: 302, headers });
}

async function googleCallback(request: Request, env: Env) {
  const url = new URL(request.url);
  const origin = appOrigin(request, env);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (!code || !state || state !== readCookie(request, STATE_COOKIE)) {
    return Response.redirect(`${origin}/dang-nhap?loi=google`, 302);
  }
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    return Response.redirect(`${origin}/dang-nhap?loi=google`, 302);
  }
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      redirect_uri: `${origin}/api/auth/google/callback`,
      grant_type: "authorization_code",
    }),
  });
  if (!tokenRes.ok) return Response.redirect(`${origin}/dang-nhap?loi=google`, 302);
  const tokenJson = (await tokenRes.json()) as { access_token?: string };
  const profileRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${tokenJson.access_token}` },
  });
  if (!profileRes.ok) return Response.redirect(`${origin}/dang-nhap?loi=google`, 302);
  const profile = (await profileRes.json()) as { sub?: string; email?: string; name?: string };
  const email = cleanEmail(profile.email);
  if (!email || !profile.sub) return Response.redirect(`${origin}/dang-nhap?loi=google`, 302);
  let user = await env.DB.prepare("SELECT * FROM users WHERE email = ?").bind(email).first<UserRow>();
  if (!user) {
    const id = crypto.randomUUID();
    await env.DB.prepare(
      "INSERT INTO users (id, email, name, provider, google_sub, created_at) VALUES (?, ?, ?, 'google', ?, ?)",
    )
      .bind(id, email, profile.name || email, profile.sub, new Date().toISOString())
      .run();
    user = await env.DB.prepare("SELECT * FROM users WHERE id = ?").bind(id).first<UserRow>();
  } else if (!user.google_sub) {
    await env.DB.prepare("UPDATE users SET google_sub = ?, provider = 'google' WHERE id = ?")
      .bind(profile.sub, user.id)
      .run();
  }
  if (!user) return Response.redirect(`${origin}/dang-nhap?loi=google`, 302);
  const token = crypto.randomUUID() + crypto.randomUUID();
  const expires = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 14;
  await env.DB.prepare("INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)")
    .bind(token, user.id, expires)
    .run();
  const headers = new Headers({ Location: `${origin}/dang-nhap?google=1` });
  headers.append("Set-Cookie", cookie(COOKIE, token, 60 * 60 * 24 * 14));
  headers.append("Set-Cookie", clearCookie(STATE_COOKIE));
  return new Response(null, { status: 302, headers });
}

function publicUser(user: UserRow, env: Env) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    provider: user.provider,
    avatarUrl: user.avatar_key ? `/api/files/${user.avatar_key}` : null,
    isAdmin: isAdmin(user, env),
  };
}

function isAdmin(user: UserRow, env: Env) {
  return Boolean(env.ADMIN_EMAIL && user.email.toLowerCase() === env.ADMIN_EMAIL.toLowerCase());
}

async function currentUser(request: Request, env: Env) {
  const token = readCookie(request, COOKIE);
  if (!token) return null;
  const now = Math.floor(Date.now() / 1000);
  const row = await env.DB.prepare(
    `SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id
     WHERE s.token = ? AND s.expires_at > ?`,
  )
    .bind(token, now)
    .first<UserRow>();
  return row;
}

async function withSession(env: Env, userId: string, response: Response) {
  const token = crypto.randomUUID() + crypto.randomUUID();
  const expires = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 14;
  await env.DB.prepare("INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)")
    .bind(token, userId, expires)
    .run();
  const headers = new Headers(response.headers);
  headers.append("Set-Cookie", cookie(COOKIE, token, 60 * 60 * 24 * 14));
  return new Response(response.body, { status: response.status, headers });
}

async function hashPassword(password: string, salt = crypto.getRandomValues(new Uint8Array(16))) {
  const passwordBytes = new TextEncoder().encode(password);
  const bytes = new Uint8Array(salt.length + passwordBytes.length);
  bytes.set(salt);
  bytes.set(passwordBytes, salt.length);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return { hash: toHex(new Uint8Array(digest)), salt: toHex(salt) };
}

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function toHex(bytes: Uint8Array) {
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function fromHex(hex: string) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i += 1) bytes[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return bytes;
}

function cookie(name: string, value: string, maxAge: number) {
  return `${name}=${value}; HttpOnly; Path=/; SameSite=None; Secure; Max-Age=${maxAge}`;
}

function withCors(response: Response, request: Request) {
  const origin = request.headers.get("Origin");
  if (!origin) return response;
  const headers = new Headers(response.headers);
  headers.set("Access-Control-Allow-Origin", origin);
  headers.set("Access-Control-Allow-Credentials", "true");
  headers.set("Access-Control-Allow-Headers", "Content-Type");
  headers.set("Access-Control-Allow-Methods", "GET,POST,PATCH,OPTIONS");
  headers.set("Vary", "Origin");
  return new Response(response.body, { status: response.status, headers });
}

function clearCookie(name: string) {
  return `${name}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0`;
}

function readCookie(request: Request, name: string) {
  const header = request.headers.get("Cookie") ?? "";
  const item = header.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${name}=`));
  return item ? item.slice(name.length + 1) : "";
}

function appOrigin(request: Request, env: Env) {
  const requestOrigin = new URL(request.url).origin;
  if (requestOrigin.startsWith("https://")) return requestOrigin;
  return (env.APP_ORIGIN || requestOrigin).replace(/\/$/, "");
}

function cleanEmail(value: unknown) {
  const email = String(value ?? "").trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : "";
}

async function readJson(request: Request) {
  try {
    return (await request.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function json(data: unknown, status = 200, extraCookie?: string) {
  const headers = new Headers({ "Content-Type": "application/json; charset=utf-8" });
  if (extraCookie) headers.append("Set-Cookie", extraCookie);
  return new Response(JSON.stringify(data), { status, headers });
}
