// src/worker.js — Nazumido als Cloudflare Worker
//
// Ersetzt das frühere Express-Backend (server.js + routes/api.js + db/init.js +
// middleware/auth.js). Läuft „serverless" auf Cloudflare Workers und nutzt:
//
//   • D1      (env.DB)      — SQLite-kompatible Datenbank statt lokaler Datei
//   • R2      (env.BUCKET)  — Objektspeicher für Foto-Uploads statt /uploads-Ordner
//   • Assets  (env.ASSETS)  — statische Website aus dem Ordner ./public
//
// Die REST-API unter /api ist zeichengleich zur bisherigen Express-Version.
//
// HINWEIS: Die Website selbst liest ihre Inhalte aus public/data.jsx (plus den
// Admin-Überschreibungen im localStorage). Die einzige Route, die sie aufruft,
// ist POST /api/reservations — dort werden Ticket-Reservierungen gespeichert und
// die Bestätigungsmail verschickt. Verwaltet wird ansonsten über das Panel unter
// #admin; das frühere zweite Dashboard unter /admin wurde entfernt. Der Rest der
// API bleibt für eine spätere serverseitige Speicherung erhalten.

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

// Tabelle der Ticket-Reservierungen — liegt auch in schema.sql, wird hier aber
// bei Bedarf angelegt, damit ein bestehendes D1 ohne Migration weiterläuft.
async function ensureReservationsTable(env) {
  await env.DB.exec(
    'CREATE TABLE IF NOT EXISTS reservations (' +
      'id INTEGER PRIMARY KEY AUTOINCREMENT, ' +
      'code TEXT NOT NULL, ' +
      'event_id TEXT, event_title TEXT NOT NULL, event_date TEXT, event_iso TEXT, ' +
      'event_time TEXT, event_where TEXT, ' +
      'name TEXT NOT NULL, email TEXT NOT NULL, phone TEXT, ' +
      'seats INTEGER NOT NULL DEFAULT 1, note TEXT, ' +
      'ip_hash TEXT, mail_status TEXT, ' +
      "created_at TEXT NOT NULL DEFAULT (datetime('now')))"
  );
}

function makeReservationCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = crypto.getRandomValues(new Uint8Array(5));
  let out = '';
  for (const b of bytes) out += alphabet[b % alphabet.length];
  return 'NZ-' + out;
}

// Gekürzter Hash der Absender-IP — reicht für die Missbrauchsbremse, ist aber
// keine gespeicherte IP-Adresse.
async function hashIp(ip) {
  if (!ip) return '';
  const bits = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('nazumido:' + ip));
  return bytesToB64(new Uint8Array(bits)).slice(0, 16);
}

// ===========================================================================
// Hilfsfunktionen: E-Mail-Versand
// ---------------------------------------------------------------------------
// Cloudflare Workers haben keinen eigenen Mailversand; verschickt wird über die
// HTTP-API eines Anbieters. Unterstützt werden Resend, Brevo und Mailgun — die
// Wahl ergibt sich aus MAIL_PROVIDER bzw. daraus, welcher Schlüssel gesetzt ist:
//
//   npx wrangler secret put RESEND_API_KEY      (bzw. BREVO_API_KEY / MAILGUN_API_KEY)
//   [vars] MAIL_FROM = "Faschingsverein Nazumido <tickets@nazu-mido.at>"
//   [vars] CLUB_EMAIL = "Nazu.Mido@gmx.at"      Kopie an den Verein
//
// Fehlt der Schlüssel oder MAIL_FROM, wird nichts verschickt (configured:false)
// und die Website fällt auf den mailto-Link zurück.
// ===========================================================================
function mailConfig(env) {
  const explicit = String(env.MAIL_PROVIDER || '').toLowerCase();
  const provider =
    explicit ||
    (env.RESEND_API_KEY ? 'resend' : env.BREVO_API_KEY ? 'brevo' : env.MAILGUN_API_KEY ? 'mailgun' : '');
  const from = String(env.MAIL_FROM || '').trim();
  const match = from.match(/^\s*(.*?)\s*<([^>]+)>\s*$/);
  return {
    provider,
    from,
    fromName: match ? match[1].replace(/^"|"$/g, '') : String(env.MAIL_FROM_NAME || 'Faschingsverein Nazumido'),
    fromEmail: match ? match[2] : from,
    club: String(env.CLUB_EMAIL || '').trim(),
    configured: !!provider && !!from,
  };
}

async function sendMail(env, msg) {
  const cfg = mailConfig(env);
  if (!cfg.configured) return { ok: false, reason: 'not-configured' };

  let request;
  if (cfg.provider === 'resend') {
    request = ['https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: cfg.from, to: [msg.to], subject: msg.subject,
        text: msg.text, html: msg.html, reply_to: msg.replyTo || undefined,
      }),
    }];
  } else if (cfg.provider === 'brevo') {
    request = ['https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': env.BREVO_API_KEY, 'Content-Type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({
        sender: { email: cfg.fromEmail, name: cfg.fromName },
        to: [{ email: msg.to }], subject: msg.subject,
        textContent: msg.text, htmlContent: msg.html,
        replyTo: msg.replyTo ? { email: msg.replyTo } : undefined,
      }),
    }];
  } else if (cfg.provider === 'mailgun') {
    const host = String(env.MAILGUN_REGION || '').toLowerCase() === 'eu' ? 'api.eu.mailgun.net' : 'api.mailgun.net';
    const form = new URLSearchParams({ from: cfg.from, to: msg.to, subject: msg.subject, text: msg.text });
    if (msg.html) form.set('html', msg.html);
    if (msg.replyTo) form.set('h:Reply-To', msg.replyTo);
    request = [`https://${host}/v3/${env.MAILGUN_DOMAIN}/messages`, {
      method: 'POST',
      headers: { Authorization: 'Basic ' + btoa(`api:${env.MAILGUN_API_KEY}`) },
      body: form,
    }];
  } else {
    return { ok: false, reason: `unbekannter Anbieter: ${cfg.provider}` };
  }

  try {
    const resp = await fetch(request[0], request[1]);
    if (!resp.ok) {
      const detail = (await resp.text().catch(() => '')).slice(0, 300);
      console.error('[mail] Anbieter antwortete', resp.status, detail);
      return { ok: false, reason: `HTTP ${resp.status}` };
    }
    return { ok: true };
  } catch (err) {
    console.error('[mail] Versand fehlgeschlagen:', err && err.message);
    return { ok: false, reason: (err && err.message) || 'Netzwerkfehler' };
  }
}

function reservationMailTexts(res) {
  const when = `${res.eventDate}${res.eventTime ? ', ' + res.eventTime : ''}`;
  const rows = [
    ['Veranstaltung', res.eventTitle],
    ['Termin', when],
    res.eventWhere ? ['Ort', res.eventWhere] : null,
    ['Plätze', String(res.count)],
    ['Auf den Namen', res.name],
    res.phone ? ['Telefon', res.phone] : null,
    res.note ? ['Anmerkung', res.note] : null,
    ['Kennung', res.code],
  ].filter(Boolean);

  const escapeHtml = (v) => String(v == null ? '' : v)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  const table = rows
    .map(([k, v]) =>
      `<tr><td style="padding:6px 0;color:#7C7363;font-size:12px;text-transform:uppercase;letter-spacing:.08em">${escapeHtml(k)}</td>` +
      `<td style="padding:6px 0;text-align:right;font-weight:600">${escapeHtml(v)}</td></tr>`)
    .join('');

  return {
    rows,
    text: rows.map(([k, v]) => `${k}: ${v}`).join('\n'),
    html:
      `<div style="font-family:Helvetica,Arial,sans-serif;color:#16140F;max-width:520px">` +
      `<p style="border-bottom:3px solid #C8202C;padding-bottom:8px;margin:0 0 18px;` +
      `font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#7C7363">Faschingsverein Nazumido</p>` +
      `<h2 style="margin:0 0 6px;font-size:22px">Reservierung ${escapeHtml(res.code)}</h2>` +
      `<p style="margin:0 0 18px;color:#3A352B">${escapeHtml(res.eventTitle)} — ${escapeHtml(when)}</p>` +
      `<table style="width:100%;border-collapse:collapse;font-size:14px">${table}</table>`,
  };
}

// Bestätigung an die Besucher:in + Benachrichtigung an den Verein
async function sendReservationMails(env, res) {
  const cfg = mailConfig(env);
  if (!cfg.configured) return { configured: false, status: 'not-configured' };

  const t = reservationMailTexts(res);
  const visitor = await sendMail(env, {
    to: res.email,
    replyTo: cfg.club || undefined,
    subject: `Reservierung ${res.code} — ${res.eventTitle}`,
    text:
      `Hallo ${res.name},\n\nvielen Dank für deine Reservierung! Wir haben sie notiert:\n\n` +
      `${t.text}\n\n` +
      `Bitte hol deine Karten spätestens 15 Minuten vor Beginn an der Abendkasse ab — ` +
      `Kennung und Name genügen. Die Reservierung ist unverbindlich; wenn du doch nicht ` +
      `kommen kannst, sag uns bitte kurz Bescheid.\n\n` +
      `Närrische Grüße\nFaschingsverein Nazumido`,
    html:
      t.html +
      `<p style="margin:18px 0 0;font-size:14px;color:#3A352B">Bitte hol deine Karten spätestens ` +
      `15 Minuten vor Beginn an der Abendkasse ab — Kennung und Name genügen.</p>` +
      `<p style="margin:18px 0 0;font-size:14px;color:#3A352B">Närrische Grüße<br>Faschingsverein Nazumido</p></div>`,
  });

  let club = { ok: false, reason: 'no-club-address' };
  if (cfg.club) {
    club = await sendMail(env, {
      to: cfg.club,
      replyTo: res.email,
      subject: `Neue Reservierung ${res.code} — ${res.eventTitle} (${res.count} Plätze)`,
      text: `Neue Online-Reservierung:\n\n${t.text}\nE-Mail: ${res.email}\n`,
      html: t.html + `<p style="margin:18px 0 0;font-size:14px">E-Mail: ${res.email}</p></div>`,
    });
  }

  return {
    configured: true,
    visitor: visitor.ok ? 'sent' : visitor.reason,
    club: club.ok ? 'sent' : club.reason,
    status: visitor.ok ? 'sent' : 'error',
  };
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
// ÖFFENTLICH: Ticket-Reservierungen
// ---------------------------------------------------------------------------
// POST /api/reservations speichert die Reservierung in D1 und verschickt zwei
// Mails: die Bestätigung an die Besucher:in und eine Benachrichtigung an den
// Verein. Ist kein Mailanbieter hinterlegt (siehe mailConfig), wird nur
// gespeichert und `mail.configured: false` gemeldet — die Website bietet dann
// wie bisher den mailto-Link an.
// ===========================================================================
app.post('/api/reservations', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const clean = (v, max) => String(v == null ? '' : v).replace(/[\u0000-\u001F\u007F]/g, ' ').trim().slice(0, max);

  const res = {
    code:       clean(body.code, 24) || makeReservationCode(),
    eventId:    clean(body.eventId, 64),
    eventTitle: clean(body.eventTitle, 160),
    eventDate:  clean(body.eventDate, 80),
    eventIso:   clean(body.eventIso, 10),
    eventTime:  clean(body.eventTime, 40),
    eventWhere: clean(body.eventWhere, 120),
    name:       clean(body.name, 120),
    email:      clean(body.email, 160),
    phone:      clean(body.phone, 60),
    note:       clean(body.note, 400),
    count:      parseInt(body.count, 10),
  };

  if (!res.name)  return c.json({ error: 'Name fehlt' }, 400);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(res.email)) return c.json({ error: 'E-Mail-Adresse ungültig' }, 400);
  if (!res.eventTitle) return c.json({ error: 'Veranstaltung fehlt' }, 400);
  if (!(res.count > 0) || res.count > 50) return c.json({ error: 'Platzanzahl ungültig' }, 400);

  await ensureReservationsTable(c.env);

  // Einfache Missbrauchsbremse: pro Absender-IP höchstens 10 Reservierungen je
  // Stunde. Gespeichert wird nur ein gekürzter Hash, nicht die IP selbst.
  const ipHash = await hashIp(c.req.header('CF-Connecting-IP') || '');
  if (ipHash) {
    const recent = await db(c)
      .prepare("SELECT COUNT(*) AS n FROM reservations WHERE ip_hash = ? AND created_at > datetime('now', '-1 hour')")
      .bind(ipHash)
      .first();
    if (recent && Number(recent.n) >= 10) {
      return c.json({ error: 'Zu viele Reservierungen in kurzer Zeit — bitte später erneut versuchen.' }, 429);
    }
  }

  const mail = await sendReservationMails(c.env, res);

  await db(c)
    .prepare(
      `INSERT INTO reservations
         (code, event_id, event_title, event_date, event_iso, event_time, event_where,
          name, email, phone, seats, note, ip_hash, mail_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      res.code, res.eventId, res.eventTitle, res.eventDate, res.eventIso, res.eventTime,
      res.eventWhere, res.name, res.email, res.phone, res.count, res.note, ipHash, mail.status
    )
    .run();

  return c.json({ ok: true, code: res.code, mail });
});

// Reservierungen für das Admin-Panel (JWT nötig, siehe /api/login)
app.get('/api/admin/reservations', requireAuth, async (c) => {
  await ensureReservationsTable(c.env);
  const { results } = await db(c)
    .prepare('SELECT * FROM reservations ORDER BY event_iso ASC, created_at DESC')
    .all();
  return c.json(results || []);
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
// Verwaltung: Es gibt genau EIN Admin-Panel — das der Website selbst
// (public/admin.jsx, Route #admin). /admin und /login leiten dorthin weiter,
// damit alte Lesezeichen weiterhin funktionieren.
// ===========================================================================
app.get('/admin', (c) => c.redirect('/#admin', 302));
app.get('/login', (c) => c.redirect('/#login', 302));

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
