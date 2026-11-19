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
  is_admin?: number;
  nickname?: string | null;
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
      if (url.pathname === "/api/me/security" && request.method === "POST") {
        return updateSecurity(request, env);
      }
      if (url.pathname.startsWith("/api/files/") && request.method === "GET") {
        const key = decodeURIComponent(url.pathname.slice("/api/files/".length));
        return readFile(request, env, key);
      }
      if (url.pathname === "/api/requests" && request.method === "POST") {
        return createRequest(request, env);
      }
      if (url.pathname === "/api/projects" && request.method === "GET") {
        return listProjects(request, env);
      }
      if (url.pathname === "/api/groups" && request.method === "POST") {
        return createGroup(request, env);
      }
      if (url.pathname === "/api/groups/join" && request.method === "POST") {
        return joinGroup(request, env);
      }
      if (url.pathname === "/api/chat" && request.method === "GET") {
        return listChat(request, env, url);
      }
      if (url.pathname === "/api/chat" && request.method === "POST") {
        return postChat(request, env);
      }
      if (url.pathname === "/api/chat/file" && request.method === "POST") {
        return postChatFile(request, env);
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
  try {
    await env.DB.prepare("ALTER TABLE users ADD COLUMN is_admin INTEGER NOT NULL DEFAULT 0").run();
  } catch {
    // Cột đã có.
  }
  await env.DB.prepare(
    `CREATE TABLE IF NOT EXISTS groups (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      created_at TEXT NOT NULL
    )`,
  ).run();
  try {
    await env.DB.prepare("ALTER TABLE groups ADD COLUMN owner_id TEXT").run();
  } catch {
    // Cột đã có.
  }
  await env.DB.prepare(
    `CREATE TABLE IF NOT EXISTS group_members (
      group_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      PRIMARY KEY (group_id, user_id)
    )`,
  ).run();
  try {
    await env.DB.prepare("ALTER TABLE messages ADD COLUMN group_id TEXT").run();
  } catch {
    // Cột đã có.
  }
  try {
    await env.DB.prepare("ALTER TABLE users ADD COLUMN nickname TEXT").run();
  } catch {
    // Cột đã có.
  }
  for (const column of ["attachment_key", "attachment_name", "attachment_type"]) {
    try {
      await env.DB.prepare(`ALTER TABLE messages ADD COLUMN ${column} TEXT`).run();
    } catch {
      // Cột đã có.
    }
  }
}

const ADMIN_ORIGIN = "https://webstudio-admin.hvh10052004.workers.dev";

function fromAdminApp(request: Request) {
  return request.headers.get("Origin") === ADMIN_ORIGIN;
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
  if (fromAdminApp(request)) {
    await env.DB.prepare("UPDATE users SET is_admin = 1 WHERE id = ?").bind(id).run();
  }
  const token = await openSession(env, id);
  return json({ ok: true, token }, 200, sessionCookie(token));
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
  if (fromAdminApp(request)) {
    await env.DB.prepare("UPDATE users SET is_admin = 1 WHERE id = ?").bind(user.id).run();
  }
  const token = await openSession(env, user.id);
  return json({ ok: true, token }, 200, sessionCookie(token));
}

async function logout(request: Request, env: Env) {
  const token = sessionToken(request);
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
  const nickname = String(body.nickname ?? user.nickname ?? "").trim().slice(0, 40);
  if (!name) return json({ error: "Tên không được để trống." }, 400);
  await env.DB.prepare("UPDATE users SET name = ?, nickname = ? WHERE id = ?").bind(name, nickname, user.id).run();
  return json({ user: publicUser({ ...user, name, nickname }, env) });
}

async function updateSecurity(request: Request, env: Env) {
  const user = await currentUser(request, env);
  if (!user) return json({ error: "Bạn cần đăng nhập." }, 401);
  const body = await readJson(request);
  const email = cleanEmail(body.email);
  const currentPassword = String(body.currentPassword ?? "");
  const newPassword = String(body.newPassword ?? "");
  if (!email) return json({ error: "Email chưa hợp lệ." }, 400);
  if (!user.password_hash || !user.password_salt) {
    return json({ error: "Tài khoản Google đổi email và mật khẩu tại Google." }, 400);
  }
  if (!currentPassword) return json({ error: "Nhập mật khẩu hiện tại." }, 400);
  const { hash } = await hashPassword(currentPassword, fromHex(user.password_salt));
  if (!safeEqual(hash, user.password_hash)) return json({ error: "Mật khẩu hiện tại chưa đúng." }, 401);
  const taken = await env.DB.prepare("SELECT id FROM users WHERE email = ? AND id != ?").bind(email, user.id).first();
  if (taken) return json({ error: "Email này đã có tài khoản khác." }, 409);
  let passwordHash = user.password_hash;
  let passwordSalt = user.password_salt;
  if (newPassword) {
    if (newPassword.length < 8) return json({ error: "Mật khẩu mới cần từ 8 ký tự." }, 400);
    const next = await hashPassword(newPassword);
    passwordHash = next.hash;
    passwordSalt = next.salt;
  }
  await env.DB.prepare("UPDATE users SET email = ?, password_hash = ?, password_salt = ? WHERE id = ?")
    .bind(email, passwordHash, passwordSalt, user.id)
    .run();
  return json({ user: publicUser({ ...user, email }, env) });
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
  if (!key.startsWith("chat/")) {
    const user = await currentUser(request, env);
    if (!user) return json({ error: "Bạn cần đăng nhập." }, 401);
    if (!key.startsWith(`avatars/${user.id}/`) && !isAdmin(user, env)) {
      return json({ error: "Không có quyền xem tệp này." }, 403);
    }
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
  const groupId = url.searchParams.get("groupId");
  const groups = await listVisibleGroups(env, user);
  if (groupId) {
    if (!isAdmin(user, env)) {
      const member = await env.DB.prepare("SELECT 1 AS ok FROM group_members WHERE group_id = ? AND user_id = ?")
        .bind(groupId, user.id)
        .first();
      if (!member) return json({ error: "Bạn chưa ở trong nhóm này." }, 403);
    }
    const messages = await env.DB.prepare(
      `SELECT m.id, m.sender_role, m.body, m.created_at, m.attachment_key, m.attachment_name, m.attachment_type, COALESCE(NULLIF(u.nickname, ''), u.name) AS sender_name, m.sender_id
       FROM messages m LEFT JOIN users u ON u.id = m.sender_id
       WHERE m.group_id = ? ORDER BY m.created_at ASC`,
    )
      .bind(groupId)
      .all();
    return json({ messages: messages.results ?? [], groups, isAdmin: isAdmin(user, env) });
  }
  const requested = url.searchParams.get("userId");
  const threadUserId = isAdmin(user, env) && requested ? requested : user.id;
  if (!isAdmin(user, env) && threadUserId !== user.id) {
    return json({ error: "Không có quyền." }, 403);
  }
  const messages = await env.DB.prepare(
    `SELECT m.id, m.thread_user_id, m.sender_role, m.body, m.created_at, m.attachment_key, m.attachment_name, m.attachment_type, COALESCE(NULLIF(u.nickname, ''), u.name) AS sender_name, m.sender_id
     FROM messages m LEFT JOIN users u ON u.id = m.sender_id
     WHERE m.thread_user_id = ? AND m.group_id IS NULL ORDER BY m.created_at ASC`,
  )
    .bind(threadUserId)
    .all();
  let threads: unknown[] = [];
  if (isAdmin(user, env)) {
    const rows = await env.DB.prepare(
      `SELECT u.id, u.name, u.email,
        (SELECT body FROM messages m WHERE m.thread_user_id = u.id AND m.group_id IS NULL ORDER BY created_at DESC LIMIT 1) AS last_body,
        (SELECT created_at FROM messages m WHERE m.thread_user_id = u.id AND m.group_id IS NULL ORDER BY created_at DESC LIMIT 1) AS last_at,
        (SELECT sender_id FROM messages m WHERE m.thread_user_id = u.id AND m.group_id IS NULL ORDER BY created_at DESC LIMIT 1) AS last_sender_id
       FROM users u
       WHERE u.is_admin = 0 AND u.id IN (SELECT DISTINCT thread_user_id FROM messages WHERE group_id IS NULL)
       ORDER BY last_at DESC`,
    ).all();
    threads = rows.results ?? [];
  }
  return json({ messages: messages.results ?? [], threads, groups, isAdmin: isAdmin(user, env) });
}

async function listVisibleGroups(env: Env, user: UserRow) {
  const query = isAdmin(user, env)
    ? `SELECT g.id, g.code, g.title, g.owner_id,
        (SELECT avatar_key FROM users WHERE id = g.owner_id) AS avatar_key,
        (SELECT body FROM messages m WHERE m.group_id = g.id ORDER BY created_at DESC LIMIT 1) AS last_body,
        (SELECT created_at FROM messages m WHERE m.group_id = g.id ORDER BY created_at DESC LIMIT 1) AS last_at,
        (SELECT sender_id FROM messages m WHERE m.group_id = g.id ORDER BY created_at DESC LIMIT 1) AS last_sender_id
       FROM groups g ORDER BY last_at DESC`
    : `SELECT g.id, g.code, g.title, g.owner_id,
        (SELECT avatar_key FROM users WHERE id = g.owner_id) AS avatar_key,
        (SELECT body FROM messages m WHERE m.group_id = g.id ORDER BY created_at DESC LIMIT 1) AS last_body,
        (SELECT created_at FROM messages m WHERE m.group_id = g.id ORDER BY created_at DESC LIMIT 1) AS last_at,
        (SELECT sender_id FROM messages m WHERE m.group_id = g.id ORDER BY created_at DESC LIMIT 1) AS last_sender_id
       FROM groups g JOIN group_members gm ON gm.group_id = g.id
       WHERE gm.user_id = ? ORDER BY last_at DESC`;
  const statement = env.DB.prepare(query);
  const rows = isAdmin(user, env) ? await statement.all() : await statement.bind(user.id).all();
  return (rows.results ?? []).map((row) => {
    const item = row as { avatar_key?: string | null };
    return { ...item, avatarUrl: item.avatar_key ? `/api/files/${item.avatar_key}` : null };
  });
}

async function createGroup(request: Request, env: Env) {
  const user = await currentUser(request, env);
  if (!user) return json({ error: "Bạn cần đăng nhập." }, 401);
  const body = await readJson(request);
  const title = String(body.title ?? "Nhóm với admin").trim().slice(0, 40) || "Nhóm với admin";
  const id = crypto.randomUUID();
  const code = Math.random().toString(36).slice(2, 8).toUpperCase();
  await env.DB.prepare("INSERT INTO groups (id, code, title, owner_id, created_at) VALUES (?, ?, ?, ?, ?)").bind(id, code, title, user.id, new Date().toISOString()).run();
  await env.DB.prepare("INSERT INTO group_members (group_id, user_id) VALUES (?, ?)").bind(id, user.id).run();
  return json({ id, code, title }, 201);
}

async function joinGroup(request: Request, env: Env) {
  const user = await currentUser(request, env);
  if (!user) return json({ error: "Bạn cần đăng nhập." }, 401);
  const body = await readJson(request);
  const code = String(body.code ?? "").trim().toUpperCase();
  const group = await env.DB.prepare("SELECT id, code, title FROM groups WHERE code = ?").bind(code).first<{ id: string; code: string; title: string }>();
  if (!group) return json({ error: "Không thấy nhóm với mã này." }, 404);
  await env.DB.prepare("INSERT OR IGNORE INTO group_members (group_id, user_id) VALUES (?, ?)").bind(group.id, user.id).run();
  return json(group);
}

async function postChat(request: Request, env: Env) {
  const user = await currentUser(request, env);
  if (!user) return json({ error: "Bạn cần đăng nhập." }, 401);
  const body = await readJson(request);
  const text = String(body.body ?? "").trim();
  const attachmentKey = String(body.attachmentKey ?? "").trim();
  if ((!text && !attachmentKey) || text.length > 2000) return json({ error: "Tin nhắn trống hoặc quá dài." }, 400);
  if (attachmentKey && !attachmentKey.startsWith(`chat/${user.id}/`)) {
    return json({ error: "Tệp không hợp lệ." }, 400);
  }
  const staff = isAdmin(user, env);
  const admin = staff && body.asCustomer !== true;
  const groupId = String(body.groupId ?? "").trim();
  const attachmentName = String(body.attachmentName ?? "").slice(0, 120);
  const attachmentType = String(body.attachmentType ?? "").slice(0, 80);
  if (groupId) {
    if (!staff) {
      const member = await env.DB.prepare("SELECT 1 AS ok FROM group_members WHERE group_id = ? AND user_id = ?")
        .bind(groupId, user.id)
        .first();
      if (!member) return json({ error: "Bạn chưa ở trong nhóm này." }, 403);
    }
    await saveMessage(env, user, admin, user.id, groupId, text, attachmentKey, attachmentName, attachmentType);
    return json({ ok: true }, 201);
  }
  const requested = String(body.userId ?? "").trim();
  const threadUserId = admin && requested ? requested : user.id;
  await saveMessage(env, user, admin, threadUserId, null, text, attachmentKey, attachmentName, attachmentType);
  return json({ ok: true }, 201);
}

async function postChatFile(request: Request, env: Env) {
  const user = await currentUser(request, env);
  if (!user) return json({ error: "Bạn cần đăng nhập." }, 401);
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File) || file.size < 1 || file.size > 8_000_000) {
    return json({ error: "Chọn ảnh hoặc tệp nhỏ hơn 8MB." }, 400);
  }
  const safeName = file.name.replace(/[^\w.\- ]+/g, "").slice(0, 80) || "tep";
  const key = `chat/${user.id}/${crypto.randomUUID()}-${safeName}`;
  await env.ASSETS.put(key, await file.arrayBuffer(), { httpMetadata: { contentType: file.type || "application/octet-stream" } });
  const staff = isAdmin(user, env);
  const admin = staff && form.get("asCustomer") !== "1";
  const groupId = String(form.get("groupId") ?? "").trim();
  const caption = String(form.get("body") ?? "").trim().slice(0, 2000);
  if (groupId) {
    if (!staff) {
      const member = await env.DB.prepare("SELECT 1 AS ok FROM group_members WHERE group_id = ? AND user_id = ?").bind(groupId, user.id).first();
      if (!member) return json({ error: "Bạn chưa ở trong nhóm này." }, 403);
    }
    await saveMessage(env, user, admin, user.id, groupId, caption, key, safeName, file.type || "application/octet-stream");
    return json({ ok: true }, 201);
  }
  const requested = String(form.get("userId") ?? "").trim();
  const threadUserId = admin && requested ? requested : user.id;
  await saveMessage(env, user, admin, threadUserId, null, caption, key, safeName, file.type || "application/octet-stream");
  return json({ ok: true }, 201);
}

async function saveMessage(
  env: Env,
  user: UserRow,
  admin: boolean,
  threadUserId: string,
  groupId: string | null,
  text: string,
  attachmentKey: string,
  attachmentName: string,
  attachmentType: string,
) {
  await env.DB.prepare(
    `INSERT INTO messages (id, thread_user_id, sender_id, sender_role, body, created_at, group_id, attachment_key, attachment_name, attachment_type)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      crypto.randomUUID(),
      threadUserId,
      user.id,
      admin ? "admin" : "customer",
      text,
      new Date().toISOString(),
      groupId,
      attachmentKey || null,
      attachmentName || null,
      attachmentType || null,
    )
    .run();
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
    nickname: user.nickname || "",
    provider: user.provider,
    avatarUrl: user.avatar_key ? `/api/files/${user.avatar_key}` : null,
    isAdmin: isAdmin(user, env),
  };
}

function isAdmin(user: UserRow, env: Env) {
  if (Number(user.is_admin) === 1) return true;
  return Boolean(env.ADMIN_EMAIL && user.email.toLowerCase() === env.ADMIN_EMAIL.toLowerCase());
}

async function openSession(env: Env, userId: string) {
  const token = crypto.randomUUID() + crypto.randomUUID();
  const expires = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30;
  await env.DB.prepare("INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)")
    .bind(token, userId, expires)
    .run();
  return token;
}

function sessionCookie(token: string) {
  return cookie(COOKIE, token, 60 * 60 * 24 * 30);
}

function sessionToken(request: Request) {
  const header = request.headers.get("Authorization") ?? "";
  if (header.startsWith("Bearer ")) return header.slice(7).trim();
  return readCookie(request, COOKIE);
}

async function currentUser(request: Request, env: Env) {
  const token = sessionToken(request);
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
  headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
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
