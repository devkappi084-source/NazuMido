/* ============================================================
   /api/admin — All admin operations
   Routing via ?action= query parameter
   ============================================================ */

import { hashPassword, verifyPassword, genToken, uuid, hmacSign,
         requireAdmin, json, err, cors } from '../_lib.js';

const SESSION_TTL = 8 * 60 * 60 * 1000; // 8 hours

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === 'OPTIONS') return cors();

  const url    = new URL(request.url);
  const action = url.searchParams.get('action');
  const method = request.method;

  // ── Public actions (no auth) ──────────────────────────────
  if (action === 'login' && method === 'POST') return login(request, env);
  if (action === 'setup' && method === 'POST') return setup(request, env);

  // ── Auth required ─────────────────────────────────────────
  const auth = await requireAdmin(request, env);
  if (auth.error) return err(auth.error, auth.status);
  const { user, token } = auth;

  switch (action) {
    case 'check':  return json({ user: safeUser(user) });
    case 'logout': return logout(token, env);

    case 'content':  return crudJSON('config:content',  method, request, env, user, 'content');
    case 'events':   return crudJSON('config:events',   method, request, env, user, 'events');
    case 'settings': return crudJSON('config:settings', method, request, env, user, 'settings');
    case 'gallery':  return crudJSON('config:gallery',  method, request, env, user, 'gallery');

    case 'users':   return handleUsers(method, request, url, env, user);
    case 'members': return handleMembers(method, request, url, env, user);

    case 'event_photos':   return eventPhotos(method, request, url, env, user);
    case 'upload_photo':   return uploadPhoto(request, url, env, user);
    case 'delete_photo':   return deletePhoto(url, env, user);
    case 'preview_photos': return setPreview(request, url, env, user);
    case 'sign_download':  return signDownload(url, env, user);

    case 'vps_config': return handleVpsConfig(method, request, env, user);
    case 'vps_status': return vpsStatus(env, user);

    default: return err('Unbekannte Aktion');
  }
}

// ── Login ────────────────────────────────────────────────────
async function login(request, env) {
  const { email, password } = await request.json().catch(() => ({}));
  if (!email || !password) return err('E-Mail und Passwort erforderlich');

  // Load user by email
  const list = await env.KV.get('admin:users', 'json').catch(() => []);
  const meta = (list || []).find(u => u.email?.toLowerCase() === email.toLowerCase());
  if (!meta) return err('Ungültige Anmeldedaten', 401);

  const user = await env.KV.get(`admin:user:${meta.id}`, 'json').catch(() => null);
  if (!user || !user.active) return err('Konto nicht aktiv', 403);

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) return err('Ungültige Anmeldedaten', 401);

  const token   = genToken();
  const expires = Date.now() + SESSION_TTL;
  await env.KV.put(`admin:session:${token}`, JSON.stringify({ userId: user.id, userName: user.name, expires }),
    { expirationTtl: Math.ceil(SESSION_TTL / 1000) });

  return json({ token, user: safeUser(user) });
}

// ── First-time setup ─────────────────────────────────────────
async function setup(request, env) {
  const existing = await env.KV.get('admin:users', 'json').catch(() => null);
  if (existing && existing.length > 0) return err('Setup bereits abgeschlossen', 409);

  const { adminKey, name, email, password } = await request.json().catch(() => ({}));
  if (adminKey !== env.ADMIN_KEY) return err('Ungültiger Admin-Key', 401);
  if (!name || !email || !password) return err('Name, E-Mail und Passwort erforderlich');
  if (password.length < 8) return err('Passwort muss mind. 8 Zeichen haben');

  const id           = uuid();
  const passwordHash = await hashPassword(password);
  const permissions  = { content: true, events: true, gallery: true, settings: true, users: true, members: true };
  const user         = { id, name, email: email.toLowerCase(), passwordHash, permissions, isOwner: true, active: true, createdAt: new Date().toISOString() };

  await Promise.all([
    env.KV.put(`admin:user:${id}`, JSON.stringify(user)),
    env.KV.put('admin:users', JSON.stringify([{ id, name, email: email.toLowerCase(), active: true, isOwner: true, permissions }])),
  ]);

  return json({ ok: true, message: 'Admin-Account erstellt' });
}

// ── Logout ───────────────────────────────────────────────────
async function logout(token, env) {
  await env.KV.delete(`admin:session:${token}`);
  return json({ ok: true });
}

// ── Generic JSON CRUD ────────────────────────────────────────
async function crudJSON(kvKey, method, request, env, user, perm) {
  if (method === 'GET') {
    const data = await env.KV.get(kvKey, 'json').catch(() => null);
    return json({ data });
  }
  if (method === 'PUT') {
    if (!user.isOwner && !user.permissions?.[perm]) return err('Keine Berechtigung', 403);
    const body = await request.json();
    await env.KV.put(kvKey, JSON.stringify(body));
    return json({ ok: true });
  }
  return err('Methode nicht erlaubt', 405);
}

// ── Users ────────────────────────────────────────────────────
async function handleUsers(method, request, url, env, caller) {
  if (!caller.isOwner && !caller.permissions?.users) return err('Keine Berechtigung', 403);

  const id = url.searchParams.get('id');

  if (method === 'GET') {
    const list = await env.KV.get('admin:users', 'json').catch(() => []);
    return json({ users: list || [] });
  }

  if (method === 'POST') {
    const { name, email, password, permissions } = await request.json().catch(() => ({}));
    if (!name || !email || !password) return err('Name, E-Mail und Passwort erforderlich');
    if (password.length < 8) return err('Passwort muss mind. 8 Zeichen haben');

    const list = await env.KV.get('admin:users', 'json').catch(() => []) || [];
    if (list.find(u => u.email === email.toLowerCase())) return err('E-Mail bereits vergeben');

    const newId = uuid();
    const perms = sanitizePermissions(permissions);
    const hash  = await hashPassword(password);
    const user  = { id: newId, name, email: email.toLowerCase(), passwordHash: hash, permissions: perms, isOwner: false, active: true, createdAt: new Date().toISOString() };
    const meta  = { id: newId, name, email: email.toLowerCase(), active: true, isOwner: false, permissions: perms };

    await Promise.all([
      env.KV.put(`admin:user:${newId}`, JSON.stringify(user)),
      env.KV.put('admin:users', JSON.stringify([...list, meta])),
    ]);
    return json({ ok: true, id: newId });
  }

  if (!id) return err('Benutzer-ID fehlt');

  if (method === 'PUT') {
    const user = await env.KV.get(`admin:user:${id}`, 'json').catch(() => null);
    if (!user) return err('Benutzer nicht gefunden', 404);
    if (user.isOwner && !caller.isOwner) return err('Owner kann nicht geändert werden', 403);

    const { name, email, password, permissions, active } = await request.json().catch(() => ({}));
    const updated = {
      ...user,
      name:        name        || user.name,
      email:       email       ? email.toLowerCase() : user.email,
      permissions: permissions ? sanitizePermissions(permissions) : user.permissions,
      active:      active !== undefined ? active : user.active,
    };
    if (password && password.length >= 8) updated.passwordHash = await hashPassword(password);

    const list = (await env.KV.get('admin:users', 'json').catch(() => []) || [])
      .map(u => u.id === id ? { id, name: updated.name, email: updated.email, active: updated.active, isOwner: updated.isOwner, permissions: updated.permissions } : u);

    await Promise.all([
      env.KV.put(`admin:user:${id}`, JSON.stringify(updated)),
      env.KV.put('admin:users', JSON.stringify(list)),
    ]);
    return json({ ok: true });
  }

  if (method === 'DELETE') {
    const user = await env.KV.get(`admin:user:${id}`, 'json').catch(() => null);
    if (!user) return err('Benutzer nicht gefunden', 404);
    if (user.isOwner) return err('Owner-Account kann nicht gelöscht werden', 403);
    if (id === (await requireAdmin(request, env)).user?.id) return err('Eigenen Account nicht löschbar', 403);

    const list = (await env.KV.get('admin:users', 'json').catch(() => []) || []).filter(u => u.id !== id);
    await Promise.all([
      env.KV.delete(`admin:user:${id}`),
      env.KV.put('admin:users', JSON.stringify(list)),
    ]);
    return json({ ok: true });
  }

  return err('Methode nicht erlaubt', 405);
}

// ── Members ──────────────────────────────────────────────────
async function handleMembers(method, request, url, env, caller) {
  if (!caller.isOwner && !caller.permissions?.members) return err('Keine Berechtigung', 403);

  const id = url.searchParams.get('id');

  if (method === 'GET') {
    const list = await env.KV.get('member:list', 'json').catch(() => []);
    return json({ members: list || [] });
  }

  if (method === 'POST') {
    const { name, email, password } = await request.json().catch(() => ({}));
    if (!name || !email || !password) return err('Name, E-Mail und Passwort erforderlich');
    if (password.length < 6) return err('Passwort muss mind. 6 Zeichen haben');

    const list = await env.KV.get('member:list', 'json').catch(() => []) || [];
    if (list.find(m => m.email === email.toLowerCase())) return err('E-Mail bereits vergeben');

    const newId  = uuid();
    const hash   = await hashPassword(password);
    const member = { id: newId, name, email: email.toLowerCase(), passwordHash: hash, active: true, createdBy: caller.id, createdAt: new Date().toISOString() };
    const meta   = { id: newId, name, email: email.toLowerCase(), active: true, createdAt: member.createdAt };

    await Promise.all([
      env.KV.put(`member:${newId}`, JSON.stringify(member)),
      env.KV.put('member:list', JSON.stringify([...list, meta])),
    ]);
    return json({ ok: true, id: newId });
  }

  if (!id) return err('Mitglieds-ID fehlt');

  if (method === 'PUT') {
    const member = await env.KV.get(`member:${id}`, 'json').catch(() => null);
    if (!member) return err('Mitglied nicht gefunden', 404);

    const { name, email, password, active } = await request.json().catch(() => ({}));
    const updated = {
      ...member,
      name:   name   || member.name,
      email:  email  ? email.toLowerCase() : member.email,
      active: active !== undefined ? active : member.active,
    };
    if (password && password.length >= 6) updated.passwordHash = await hashPassword(password);

    const list = (await env.KV.get('member:list', 'json').catch(() => []) || [])
      .map(m => m.id === id ? { id, name: updated.name, email: updated.email, active: updated.active, createdAt: updated.createdAt } : m);

    await Promise.all([
      env.KV.put(`member:${id}`, JSON.stringify(updated)),
      env.KV.put('member:list', JSON.stringify(list)),
    ]);
    return json({ ok: true });
  }

  if (method === 'DELETE') {
    const list = (await env.KV.get('member:list', 'json').catch(() => []) || []).filter(m => m.id !== id);
    await Promise.all([
      env.KV.delete(`member:${id}`),
      env.KV.put('member:list', JSON.stringify(list)),
    ]);
    return json({ ok: true });
  }

  return err('Methode nicht erlaubt', 405);
}

// ── Event photos ─────────────────────────────────────────────
async function eventPhotos(method, request, url, env, user) {
  if (!user.isOwner && !user.permissions?.gallery) return err('Keine Berechtigung', 403);
  const eventId = url.searchParams.get('event');
  if (!eventId) return err('Event-ID fehlt');

  if (method === 'GET') {
    const meta = await env.KV.get(`event:${eventId}:photos`, 'json').catch(() => null);
    return json({ photos: meta?.photos || [], previews: meta?.previews || [] });
  }
  return err('Methode nicht erlaubt', 405);
}

async function uploadPhoto(request, url, env, user) {
  if (!user.isOwner && !user.permissions?.gallery) return err('Keine Berechtigung', 403);
  const eventId = url.searchParams.get('event');
  if (!eventId) return err('Event-ID fehlt');
  const vpsBase = await getVpsUrl(env);
  if (!vpsBase || !env.VPS_API_KEY) return err('VPS nicht konfiguriert', 503);

  // Proxy the multipart upload to the VPS
  const form = await request.formData();
  const vpsUrl = `${vpsBase}/events/${eventId}/upload`;
  const vpsRes = await fetch(vpsUrl, {
    method: 'POST',
    headers: { 'x-api-key': env.VPS_API_KEY },
    body: form,
  });
  if (!vpsRes.ok) {
    const e = await vpsRes.json().catch(() => ({}));
    return err(e.error || `VPS Fehler: ${vpsRes.status}`, 502);
  }
  const result = await vpsRes.json();

  // Update photo metadata in KV
  const meta = await env.KV.get(`event:${eventId}:photos`, 'json').catch(() => ({ photos: [], previews: [] })) || { photos: [], previews: [] };
  for (const filename of (result.uploaded || [])) {
    if (!meta.photos.find(p => p.filename === filename)) {
      meta.photos.push({ filename, uploadedAt: new Date().toISOString() });
    }
  }
  await env.KV.put(`event:${eventId}:photos`, JSON.stringify(meta));

  return json({ ok: true, uploaded: result.uploaded || [] });
}

async function deletePhoto(url, env, user) {
  if (!user.isOwner && !user.permissions?.gallery) return err('Keine Berechtigung', 403);
  const eventId  = url.searchParams.get('event');
  const filename = url.searchParams.get('file');
  if (!eventId || !filename) return err('Event-ID und Dateiname erforderlich');
  const vpsBase = await getVpsUrl(env);
  if (!vpsBase || !env.VPS_API_KEY) return err('VPS nicht konfiguriert', 503);

  const vpsUrl = `${vpsBase}/events/${eventId}/${encodeURIComponent(filename)}`;
  await fetch(vpsUrl, { method: 'DELETE', headers: { 'x-api-key': env.VPS_API_KEY } });

  // Remove from KV metadata
  const meta = await env.KV.get(`event:${eventId}:photos`, 'json').catch(() => ({ photos: [], previews: [] })) || { photos: [], previews: [] };
  meta.photos   = meta.photos.filter(p => p.filename !== filename);
  meta.previews = (meta.previews || []).filter(p => p.filename !== filename);
  await env.KV.put(`event:${eventId}:photos`, JSON.stringify(meta));

  return json({ ok: true });
}

async function setPreview(request, url, env, user) {
  if (!user.isOwner && !user.permissions?.gallery) return err('Keine Berechtigung', 403);
  const eventId = url.searchParams.get('event');
  if (!eventId) return err('Event-ID fehlt');

  const { previews } = await request.json().catch(() => ({}));
  if (!Array.isArray(previews)) return err('previews muss ein Array sein');

  // previews: [{ filename, base64 }] — small thumbnails stored in KV
  const meta = await env.KV.get(`event:${eventId}:photos`, 'json').catch(() => ({ photos: [], previews: [] })) || { photos: [], previews: [] };
  meta.previews = previews.slice(0, 3).map(p => ({
    filename: p.filename,
    thumb:    p.base64 || null,
  }));
  await env.KV.put(`event:${eventId}:photos`, JSON.stringify(meta));

  return json({ ok: true });
}

async function signDownload(url, env, user) {
  if (!user.isOwner && !user.permissions?.gallery) return err('Keine Berechtigung', 403);
  const eventId  = url.searchParams.get('event');
  const filename = url.searchParams.get('file');
  if (!eventId || !filename) return err('Event-ID und Dateiname erforderlich');
  if (!env.HMAC_SECRET) return err('HMAC_SECRET nicht konfiguriert', 503);
  const vpsBase = await getVpsUrl(env);
  if (!vpsBase) return err('VPS-URL nicht konfiguriert', 503);

  const expires = Date.now() + 15 * 60 * 1000; // 15 min
  const msg     = `${eventId}/${filename}:${expires}`;
  const sig     = await hmacSign(msg, env.HMAC_SECRET);

  return json({
    url: `${vpsBase}/events/${eventId}/${encodeURIComponent(filename)}?expires=${expires}&sig=${sig}`
  });
}

// ── VPS configuration ────────────────────────────────────────
async function handleVpsConfig(method, request, env, user) {
  if (!user.isOwner && !user.permissions?.settings) return err('Keine Berechtigung', 403);

  if (method === 'GET') {
    const cfg = await env.KV.get('config:vps', 'json').catch(() => null);
    return json({ vps: { url: cfg?.url || env.PHOTOS_VPS_URL || '' } });
  }

  if (method === 'PUT') {
    const { url } = await request.json().catch(() => ({}));
    if (!url) return err('URL erforderlich');
    await env.KV.put('config:vps', JSON.stringify({ url: url.replace(/\/$/, '') }));
    return json({ ok: true });
  }

  return err('Methode nicht erlaubt', 405);
}

async function vpsStatus(env, user) {
  if (!user.isOwner && !user.permissions?.settings) return err('Keine Berechtigung', 403);
  const vpsUrl = await getVpsUrl(env);
  if (!vpsUrl) return json({ ok: false, error: 'Keine VPS-URL konfiguriert' });

  try {
    const r    = await fetch(`${vpsUrl}/health`, { signal: AbortSignal.timeout(5000) });
    const data = r.ok ? await r.json().catch(() => ({})) : {};
    return json({ ok: r.ok, status: r.status, data });
  } catch (e) {
    return json({ ok: false, error: e.message });
  }
}

// Resolves VPS base URL: KV overrides env var
async function getVpsUrl(env) {
  const cfg = await env.KV.get('config:vps', 'json').catch(() => null);
  return cfg?.url || env.PHOTOS_VPS_URL || null;
}

// ── Helpers ───────────────────────────────────────────────────
function safeUser(u) {
  return { id: u.id, name: u.name, email: u.email, isOwner: u.isOwner, permissions: u.permissions, active: u.active };
}

function sanitizePermissions(raw) {
  const keys = ['content', 'events', 'gallery', 'settings', 'users', 'members'];
  const out  = {};
  keys.forEach(k => { out[k] = !!(raw?.[k]); });
  return out;
}
