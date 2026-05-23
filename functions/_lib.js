/* ============================================================
   NazuMido – Shared utilities for Cloudflare Pages Functions
   ============================================================ */

// ── Password hashing (PBKDF2, Web Crypto) ───────────────────
export async function hashPassword(password) {
  const salt    = crypto.getRandomValues(new Uint8Array(16));
  const saltHex = hex(salt);
  const hash    = await pbkdf2(password, saltHex);
  return `${saltHex}:${hash}`;
}

export async function verifyPassword(password, stored) {
  const [saltHex, storedHash] = stored.split(':');
  if (!saltHex || !storedHash) return false;
  const hash = await pbkdf2(password, saltHex);
  // Constant-time compare
  if (hash.length !== storedHash.length) return false;
  let diff = 0;
  for (let i = 0; i < hash.length; i++) diff |= hash.charCodeAt(i) ^ storedHash.charCodeAt(i);
  return diff === 0;
}

async function pbkdf2(password, salt) {
  const enc   = new TextEncoder();
  const key   = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits  = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: enc.encode(salt), iterations: 100_000, hash: 'SHA-256' },
    key, 256
  );
  return hex(new Uint8Array(bits));
}

// ── Token generation ─────────────────────────────────────────
export function genToken(bytes = 32) {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return hex(arr);
}

// ── UUID v4 ──────────────────────────────────────────────────
export function uuid() {
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = hex(b);
  return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}`;
}

// ── HMAC-SHA256 ──────────────────────────────────────────────
export async function hmacSign(message, secret) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  return hex(new Uint8Array(sig));
}

export async function hmacVerify(message, signature, secret) {
  const expected = await hmacSign(message, secret);
  if (expected.length !== signature.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  return diff === 0;
}

// ── Auth: validate admin session ─────────────────────────────
export async function requireAdmin(request, env, permission = null) {
  const token = bearerToken(request);
  if (!token) return { error: 'Nicht angemeldet', status: 401 };

  const session = await env.KV.get(`admin:session:${token}`, 'json').catch(() => null);
  if (!session || session.expires < Date.now()) {
    if (session) env.KV.delete(`admin:session:${token}`);
    return { error: 'Sitzung abgelaufen', status: 401 };
  }

  const user = await env.KV.get(`admin:user:${session.userId}`, 'json').catch(() => null);
  if (!user || !user.active) return { error: 'Benutzer nicht aktiv', status: 403 };

  if (permission && !user.isOwner && !user.permissions?.[permission]) {
    return { error: 'Keine Berechtigung', status: 403 };
  }

  return { user, token };
}

// ── Auth: validate member session ────────────────────────────
export async function requireMember(request, env) {
  const token = bearerToken(request);
  if (!token) return { error: 'Nicht angemeldet', status: 401 };

  const session = await env.KV.get(`member:session:${token}`, 'json').catch(() => null);
  if (!session || session.expires < Date.now()) {
    if (session) env.KV.delete(`member:session:${token}`);
    return { error: 'Sitzung abgelaufen', status: 401 };
  }

  const member = await env.KV.get(`member:${session.memberId}`, 'json').catch(() => null);
  if (!member || !member.active) return { error: 'Konto nicht aktiv', status: 403 };

  return { member, token };
}

// ── Response helpers ─────────────────────────────────────────
const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS }
  });
}

export function err(message, status = 400) {
  return json({ error: message }, status);
}

export function cors() {
  return new Response(null, { status: 204, headers: CORS });
}

// ── Internal helpers ─────────────────────────────────────────
function bearerToken(request) {
  const auth = request.headers.get('Authorization') || '';
  return auth.startsWith('Bearer ') ? auth.slice(7) : null;
}

function hex(arr) {
  return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
}
