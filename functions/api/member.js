/* ============================================================
   /api/member — Member auth + event photo access
   ============================================================ */

import { hashPassword, verifyPassword, genToken, hmacSign,
         requireMember, json, err, cors } from '../_lib.js';

const SESSION_TTL = 30 * 24 * 60 * 60 * 1000; // 30 days

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === 'OPTIONS') return cors();
  if (!env.KV) return err('KV-Datenbank nicht eingerichtet. Bitte KV-Namespace in Cloudflare Pages einrichten.', 503);

  const url    = new URL(request.url);
  const action = url.searchParams.get('action');
  const method = request.method;

  // ── Public ───────────────────────────────────────────────
  if (action === 'login'  && method === 'POST') return login(request, env);
  if (action === 'logout' && method === 'POST') return logout(request, env);

  // ── Auth required ────────────────────────────────────────
  if (action === 'check') {
    const auth = await requireMember(request, env);
    if (auth.error) return err(auth.error, auth.status);
    return json({ member: safeMember(auth.member) });
  }

  if (action === 'photos') {
    const auth = await requireMember(request, env);
    if (auth.error) return err(auth.error, auth.status);
    return getPhotos(url, env);
  }

  if (action === 'download') {
    const auth = await requireMember(request, env);
    if (auth.error) return err(auth.error, auth.status);
    return memberSignDownload(url, env);
  }

  if (action === 'change_password' && method === 'POST') {
    const auth = await requireMember(request, env);
    if (auth.error) return err(auth.error, auth.status);
    return changePassword(request, env, auth.member);
  }

  return err('Unbekannte Aktion');
}

async function login(request, env) {
  const { email, password } = await request.json().catch(() => ({}));
  if (!email || !password) return err('E-Mail und Passwort erforderlich');

  const list = await env.KV.get('member:list', 'json').catch(() => []);
  const meta = (list || []).find(m => m.email?.toLowerCase() === email.toLowerCase());
  if (!meta) return err('Ungültige Anmeldedaten', 401);

  const member = await env.KV.get(`member:${meta.id}`, 'json').catch(() => null);
  if (!member || !member.active) return err('Konto nicht aktiv', 403);

  const ok = await verifyPassword(password, member.passwordHash);
  if (!ok) return err('Ungültige Anmeldedaten', 401);

  const token   = genToken();
  const expires = Date.now() + SESSION_TTL;
  await env.KV.put(
    `member:session:${token}`,
    JSON.stringify({ memberId: member.id, memberName: member.name, expires }),
    { expirationTtl: Math.ceil(SESSION_TTL / 1000) }
  );

  return json({ token, member: safeMember(member) });
}

async function logout(request, env) {
  const auth = request.headers.get('Authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (token) await env.KV.delete(`member:session:${token}`);
  return json({ ok: true });
}

async function getPhotos(url, env) {
  const eventId = url.searchParams.get('event');
  if (!eventId) return err('Event-ID fehlt');

  const meta = await env.KV.get(`event:${eventId}:photos`, 'json').catch(() => null);
  return json({
    photos:   meta?.photos   || [],
    previews: meta?.previews || [],
  });
}

async function memberSignDownload(url, env) {
  const eventId  = url.searchParams.get('event');
  const filename = url.searchParams.get('file');
  if (!eventId || !filename) return err('Event-ID und Dateiname erforderlich');
  if (!env.HMAC_SECRET || !env.PHOTOS_VPS_URL) return err('Foto-Server nicht konfiguriert', 503);

  const expires = Date.now() + 15 * 60 * 1000; // 15 min
  const msg     = `${eventId}/${filename}:${expires}`;
  const sig     = await hmacSign(msg, env.HMAC_SECRET);

  return json({
    url: `${env.PHOTOS_VPS_URL}/events/${eventId}/${encodeURIComponent(filename)}?expires=${expires}&sig=${sig}`
  });
}

async function changePassword(request, env, member) {
  const { currentPassword, newPassword } = await request.json().catch(() => ({}));
  if (!currentPassword || !newPassword) return err('Aktuelles und neues Passwort erforderlich');
  if (newPassword.length < 6) return err('Passwort muss mind. 6 Zeichen haben');

  const full = await env.KV.get(`member:${member.id}`, 'json').catch(() => null);
  if (!full) return err('Mitglied nicht gefunden', 404);

  const ok = await verifyPassword(currentPassword, full.passwordHash);
  if (!ok) return err('Aktuelles Passwort falsch', 401);

  full.passwordHash = await hashPassword(newPassword);
  await env.KV.put(`member:${member.id}`, JSON.stringify(full));
  return json({ ok: true });
}

function safeMember(m) {
  return { id: m.id, name: m.name, email: m.email, active: m.active };
}
