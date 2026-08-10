// src/worker.js — Nazumido als Cloudflare Worker
//
// Ersetzt das frühere Express-Backend (server.js + routes/api.js + db/init.js +
// middleware/auth.js). Läuft „serverless" auf Cloudflare Workers und nutzt:
//
//   • D1      (env.DB)      — SQLite-kompatible Datenbank statt lokaler Datei
//   • R2      (env.BUCKET)  — Objektspeicher für Foto-Uploads statt /uploads-Ordner
//   • Assets  (env.ASSETS)  — statische Website aus dem Ordner ./public
//
// Die REST-API unter /api ist zeichengleich zur bisherigen Express-Version, das
// Frontend (public/) musste daher nicht angepasst werden.

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { sign, verify } from 'hono/jwt';

const app = new Hono();

// ---------------------------------------------------------------------------
// Konstanten
// ---------------------------------------------------------------------------
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const DEFAULT_MAX_UPLOAD = 5 * 1024 * 1024; // 5 MB
const DEFAULT_JWT_EXPIRES = 60 * 60 * 24 * 7; // 7 Tage in Sekunden
const PBKDF2_ITERATIONS = 100_000;

// ===========================================================================
// Hilfsfunktionen: Passwort-Hashing (PBKDF2 über die Web-Crypto-API)
// ---------------------------------------------------------------------------
// Ersetzt bcryptjs. Format:  pbkdf2$<iterationen>$<salt-b64>$<hash-b64>
// ===========================================================================
function bytesToB64(bytes) {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

function b64ToBytes(b64) {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function deriveBits(password, salt, iterations) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
    key,
    256
  );
  return new Uint8Array(bits);
}

async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await deriveBits(password, salt, PBKDF2_ITERATIONS);
  return `pbkdf2$${PBKDF2_ITERATIONS}$${bytesToB64(salt)}$${bytesToB64(hash)}`;
}

// Konstante Laufzeit beim Vergleich, um Timing-Rückschlüsse zu erschweren.
function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function verifyPassword(password, stored) {
  try {
    const [scheme, iterStr, saltB64, hashB64] = String(stored).split('$');
    if (scheme !== 'pbkdf2') return false;
    const bits = await deriveBits(password, b64ToBytes(saltB64), Number(iterStr));
    return timingSafeEqual(bytesToB64(bits), hashB64);
  } catch {
    return false;
  }
}

// ===========================================================================
// Hilfsfunktionen: JWT
// ===========================================================================
// Fehlt das Secret, liefert hono/jwt sonst nur "Cannot read properties of
// undefined (reading 'includes')" — daher hier eine verständliche Meldung.
function requireJwtSecret(env) {
  const secret = env.JWT_SECRET;
  if (typeof secret !== 'string' || secret.length === 0) {
    throw new Error(
      'JWT_SECRET ist im Worker nicht gesetzt. Im Cloudflare-Dashboard unter ' +
        'Workers & Pages → nazumido2 → Settings → Variables and Secrets als Secret ' +
        'anlegen und danach neu deployen. Prüfen mit /api/health.'
    );
  }
  return secret;
}

async function signToken(admin, env) {
  const secret = requireJwtSecret(env);
  const ttl = Number(env.JWT_EXPIRES_IN) || DEFAULT_JWT_EXPIRES;
  const payload = {
    sub: admin.id,
    username: admin.username,
    exp: Math.floor(Date.now() / 1000) + ttl,
  };
  return sign(payload, secret, 'HS256');
}

// Hono-Middleware: schützt Admin-Routen per "Authorization: Bearer <token>".
async function requireAuth(c, next) {
  const header = c.req.header('Authorization') || '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    return c.json({ error: 'Nicht autorisiert: Bearer-Token fehlt' }, 401);
  }
  try {
    const payload = await verify(match[1], requireJwtSecret(c.env), 'HS256');
    c.set('admin', { id: payload.sub, username: payload.username });
    await next();
  } catch (err) {
    const expired = err && (err.name === 'JwtTokenExpired' || /expired/i.test(err.message || ''));
    return c.json(
      { error: expired ? 'Token abgelaufen — bitte erneut anmelden' : 'Ungültiges Token' },
      401
    );
  }
}

// ===========================================================================
// Hilfsfunktionen: D1
// ===========================================================================
function db(c) {
  return c.env.DB;
}

// Hält den Standard-Admin mit dem Secret ADMIN_PASSWORD in Einklang (das
// Passwort muss zur Laufzeit gehasht werden und kann daher nicht in schema.sql
// stehen):
//
//   • Kein Admin vorhanden  -> wird angelegt (ADMIN_PASSWORD, sonst 'nazumido').
//   • Admin vorhanden und ADMIN_PASSWORD gesetzt, passt aber nicht zum
//     gespeicherten Hash -> das Passwort wird auf ADMIN_PASSWORD aktualisiert.
//
// Dadurch wirkt ein nachträglich gesetztes/geändertes ADMIN_PASSWORD sofort;
// vorher galt es nur beim allerersten Login.
async function ensureAdmin(env) {
  const username = env.ADMIN_USERNAME || 'admin';
  const configured = typeof env.ADMIN_PASSWORD === 'string' ? env.ADMIN_PASSWORD : '';

  const existing = await env.DB.prepare('SELECT id, password_hash FROM admins WHERE username = ?')
    .bind(username)
    .first();

  if (!existing) {
    const hash = await hashPassword(configured || 'nazumido');
    await env.DB.prepare('INSERT INTO admins (username, password_hash) VALUES (?, ?)')
      .bind(username, hash)
      .run();
    return;
  }

  if (configured && !(await verifyPassword(configured, existing.password_hash))) {
    const hash = await hashPassword(configured);
    await env.DB.prepare('UPDATE admins SET password_hash = ? WHERE id = ?')
      .bind(hash, existing.id)
      .run();
  }
}

// ===========================================================================
// CORS — bei gleicher Domain (Standard) unkritisch; erlaubt zusätzlich
// localhost für die lokale Entwicklung mit `wrangler dev`.
// ===========================================================================
app.use(
  '/api/*',
  cors({
    origin: (origin) => {
      if (!origin) return origin; // same-origin / curl
      if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return origin;
      return origin; // gleiche Domain im Produktivbetrieb
    },
    credentials: true,
  })
);

// ===========================================================================
// Health / Info
// ===========================================================================
// Listet NUR die Namen der vorhandenen Bindings/Variablen auf (niemals Werte).
// Damit lässt sich im Browser prüfen, ob z. B. JWT_SECRET zur Laufzeit ankommt.
app.get('/api/health', (c) => {
  const bindings = {};
  for (const key of Object.keys(c.env || {})) {
    const val = c.env[key];
    bindings[key] = typeof val === 'string' ? `string(${val.length})` : typeof val;
  }
  return c.json({
    status: 'ok',
    service: 'nazumido-api',
    time: new Date().toISOString(),
    bindings,
  });
});

// ===========================================================================
// ÖFFENTLICH: Beiträge (nur aktive)
// ===========================================================================
app.get('/api/posts', async (c) => {
  const { results } = await db(c)
    .prepare('SELECT * FROM posts WHERE is_active = 1 ORDER BY created_at DESC, id DESC')
    .all();
  return c.json(results || []);
});

app.get('/api/posts/:id', async (c) => {
  const row = await db(c)
    .prepare('SELECT * FROM posts WHERE id = ? AND is_active = 1')
    .bind(c.req.param('id'))
    .first();
  if (!row) return c.json({ error: 'Beitrag nicht gefunden' }, 404);
  return c.json(row);
});

// ===========================================================================
// ÖFFENTLICH: Einstellungen als Objekt { key: value }
// ===========================================================================
app.get('/api/settings', async (c) => {
  const { results } = await db(c).prepare('SELECT key, value FROM settings').all();
  const settings = {};
  for (const { key, value } of results || []) settings[key] = value;
  return c.json(settings);
});

// ===========================================================================
// AUTH: Login — liefert bei Erfolg ein JWT
// ===========================================================================
app.post('/api/login', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const { username, password } = body || {};
  if (!username || !password) {
    return c.json({ error: 'username und password sind erforderlich' }, 400);
  }

  // Standard-Admin bei allererstem Login anlegen.
  await ensureAdmin(c.env);

  const admin = await db(c)
    .prepare('SELECT * FROM admins WHERE username = ?')
    .bind(username)
    .first();

  // Auch bei unbekanntem Nutzer einen Vergleich durchführen (Timing-Schutz).
  const stored = admin ? admin.password_hash : 'pbkdf2$1$AAAA$AAAA';
  const ok = await verifyPassword(password, stored);

  if (!admin || !ok) {
    return c.json({ error: 'Ungültige Anmeldedaten' }, 401);
  }

  const token = await signToken(admin, c.env);
  return c.json({ token, admin: { id: admin.id, username: admin.username } });
});

// ===========================================================================
// GESCHÜTZT: Beiträge verwalten
// ===========================================================================
app.get('/api/admin/posts', requireAuth, async (c) => {
  const { results } = await db(c)
    .prepare('SELECT * FROM posts ORDER BY created_at DESC, id DESC')
    .all();
  return c.json(results || []);
});

app.post('/api/admin/posts', requireAuth, async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const { title, content, photo_url, is_active } = body || {};
  if (!title || !String(title).trim()) {
    return c.json({ error: 'title ist erforderlich' }, 400);
  }
  const created = await db(c)
    .prepare(
      `INSERT INTO posts (title, content, photo_url, is_active)
       VALUES (?, ?, ?, ?) RETURNING *`
    )
    .bind(
      String(title).trim(),
      content ?? null,
      photo_url ?? null,
      is_active === undefined ? 1 : is_active ? 1 : 0
    )
    .first();
  return c.json(created, 201);
});

app.put('/api/admin/posts/:id', requireAuth, async (c) => {
  const id = c.req.param('id');
  const existing = await db(c).prepare('SELECT * FROM posts WHERE id = ?').bind(id).first();
  if (!existing) return c.json({ error: 'Beitrag nicht gefunden' }, 404);

  const body = await c.req.json().catch(() => ({}));
  const merged = {
    title: body.title ?? existing.title,
    content: body.content ?? existing.content,
    photo_url: body.photo_url ?? existing.photo_url,
    is_active:
      body.is_active === undefined ? existing.is_active : body.is_active ? 1 : 0,
  };
  if (!merged.title || !String(merged.title).trim()) {
    return c.json({ error: 'title darf nicht leer sein' }, 400);
  }

  const updated = await db(c)
    .prepare(
      `UPDATE posts
          SET title = ?, content = ?, photo_url = ?, is_active = ?,
              updated_at = datetime('now')
        WHERE id = ? RETURNING *`
    )
    .bind(merged.title, merged.content, merged.photo_url, merged.is_active, id)
    .first();
  return c.json(updated);
});

app.delete('/api/admin/posts/:id', requireAuth, async (c) => {
  const id = c.req.param('id');
  const res = await db(c).prepare('DELETE FROM posts WHERE id = ?').bind(id).run();
  if (!res.meta || res.meta.changes === 0) {
    return c.json({ error: 'Beitrag nicht gefunden' }, 404);
  }
  return c.json({ deleted: true, id: Number(id) });
});

// ===========================================================================
// GESCHÜTZT: Einstellungen aktualisieren (Teil-Update per Objekt)
// ===========================================================================
app.put('/api/admin/settings', requireAuth, async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const keys = Object.keys(body || {});
  if (keys.length === 0) {
    return c.json({ error: 'Es wurden keine Einstellungen übermittelt' }, 400);
  }

  const stmt = db(c).prepare(
    `INSERT INTO settings (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`
  );
  const batch = keys.map((key) =>
    stmt.bind(key, body[key] == null ? null : String(body[key]))
  );
  await db(c).batch(batch);

  const { results } = await db(c).prepare('SELECT key, value FROM settings').all();
  const settings = {};
  for (const { key, value } of results || []) settings[key] = value;
  return c.json(settings);
});

// ===========================================================================
// GESCHÜTZT: Foto-Upload nach R2 (Feldname "photo")
// ===========================================================================
app.post('/api/upload', requireAuth, async (c) => {
  const maxSize = Number(c.env.MAX_UPLOAD_SIZE) || DEFAULT_MAX_UPLOAD;

  let form;
  try {
    form = await c.req.formData();
  } catch {
    return c.json({ error: 'Ungültige Formulardaten' }, 400);
  }

  const file = form.get('photo');
  if (!file || typeof file === 'string') {
    return c.json({ error: 'Keine Datei empfangen (Feldname "photo")' }, 400);
  }
  if (!ALLOWED_MIME.has(file.type)) {
    return c.json({ error: 'Nur Bilddateien (JPEG, PNG, WebP, GIF) sind erlaubt' }, 400);
  }

  const buf = await file.arrayBuffer();
  if (buf.byteLength > maxSize) {
    return c.json({ error: `Upload-Fehler: Datei zu groß (max. ${maxSize} Bytes)` }, 400);
  }

  const key = makeObjectKey(file.name, file.type);
  await c.env.BUCKET.put(key, buf, { httpMetadata: { contentType: file.type } });

  return c.json(
    { filename: key, mimetype: file.type, size: buf.byteLength, url: `/uploads/${key}` },
    201
  );
});

function makeObjectKey(originalName, mime) {
  const extFromMime = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'image/gif': '.gif',
  };
  const dot = String(originalName || '').lastIndexOf('.');
  const ext = (dot >= 0 ? originalName.slice(dot) : extFromMime[mime] || '').toLowerCase();
  const base =
    String(originalName || '')
      .slice(0, dot >= 0 ? dot : undefined)
      .replace(/[^a-z0-9_-]/gi, '_')
      .slice(0, 40) || 'foto';
  const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
  return `${base}-${unique}${ext}`;
}

// ===========================================================================
// Hochgeladene Fotos aus R2 ausliefern (ersetzt express.static('/uploads'))
// ===========================================================================
app.get('/uploads/:key{.+}', async (c) => {
  const key = c.req.param('key');
  const obj = await c.env.BUCKET.get(key);
  if (!obj) return c.notFound();

  const headers = new Headers();
  obj.writeHttpMetadata(headers);
  headers.set('etag', obj.httpEtag);
  headers.set('cache-control', 'public, max-age=31536000, immutable');
  return new Response(obj.body, { headers });
});

// ===========================================================================
// Admin-Panel bequem unter /admin (public/admin/dashboard.html)
// ===========================================================================
app.get('/admin', (c) =>
  c.env.ASSETS.fetch(new Request(new URL('/admin/dashboard.html', c.req.url)))
);

// ===========================================================================
// 404 für unbekannte API-Routen (JSON statt HTML-Asset)
// ===========================================================================
app.all('/api/*', (c) => c.json({ error: 'Endpunkt nicht gefunden' }, 404));

// ===========================================================================
// Alles andere -> statische Assets (Fallback; normalerweise liefert Cloudflare
// passende Dateien schon vor dem Worker aus).
// ===========================================================================
app.all('*', (c) => c.env.ASSETS.fetch(c.req.raw));

// Zentrale Fehlerbehandlung
app.onError((err, c) => {
  console.error('[worker] Fehler:', err && err.message);
  return c.json({ error: (err && err.message) || 'Interner Serverfehler' }, 500);
});

export default app;
