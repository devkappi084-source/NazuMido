// End-to-End-Test des Cloudflare Workers via Miniflare (echtes D1 + R2, in-process).
import { Miniflare, createFetchMock } from 'miniflare';
import { readFileSync } from 'node:fs';

// Serialisiert eine FormData spec-korrekt (undici) zu Body + Content-Type,
// da Miniflare.dispatchFetch ein FormData-Objekt nicht selbst serialisiert.
async function serializeForm(fd) {
  const req = new Request('http://x', { method: 'POST', body: fd });
  return { ct: req.headers.get('content-type'), buf: new Uint8Array(await req.arrayBuffer()) };
}

const mf = new Miniflare({
  modules: true,
  compatibilityDate: '2024-09-23',
  scriptPath: './dist-worker/worker.js',
  d1Databases: { DB: 'nazumido-test-db' },
  r2Buckets: { BUCKET: 'nazumido-uploads' },
  bindings: {
    ADMIN_USERNAME: 'admin',
    ADMIN_PASSWORD: 'nazumido',
    JWT_SECRET: 'test-secret-nur-fuer-den-test-1234567890',
    JWT_EXPIRES_IN: '604800',
    MAX_UPLOAD_SIZE: '5242880',
  },
  // Unmatched-Routen-Fallback (app.all('*')) braucht ASSETS – hier ein Dummy,
  // damit nichts crasht, falls ein Test danebengreift.
  serviceBindings: { ASSETS: () => new Response('asset-fallback', { status: 200 }) },
});

let pass = 0, fail = 0;
function check(name, cond, extra = '') {
  if (cond) { pass++; console.log(`  ✅ ${name}`); }
  else { fail++; console.log(`  ❌ ${name} ${extra}`); }
}

const BASE = 'http://localhost';
const j = (r) => r.json();

try {
  // --- Schema laden -------------------------------------------------------
  const db = await mf.getD1Database('DB');
  const sql = readFileSync('./schema.sql', 'utf8')
    .split('\n').filter((l) => !l.trim().startsWith('--')).join('\n');
  for (const stmt of sql.split(';').map((s) => s.trim()).filter(Boolean)) {
    await db.prepare(stmt).run();
  }
  console.log('Schema geladen.\n');

  // --- Health -------------------------------------------------------------
  let r = await mf.dispatchFetch(`${BASE}/api/health`);
  let d = await j(r);
  check('GET /api/health -> ok', r.status === 200 && d.status === 'ok');

  // --- Öffentliche Beiträge (nur aktive, geseedet) ------------------------
  r = await mf.dispatchFetch(`${BASE}/api/posts`);
  d = await j(r);
  check('GET /api/posts -> 2 Seed-Beiträge', r.status === 200 && d.length === 2, `(len=${d.length})`);

  // --- Einstellungen ------------------------------------------------------
  r = await mf.dispatchFetch(`${BASE}/api/settings`);
  d = await j(r);
  check('GET /api/settings -> vereinsname', d.vereinsname === 'Faschingsverein Nazumido');

  // --- Login falsch -------------------------------------------------------
  r = await mf.dispatchFetch(`${BASE}/api/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'FALSCH' }),
  });
  check('POST /api/login falsch -> 401', r.status === 401);

  // --- Admin ohne Token ---------------------------------------------------
  r = await mf.dispatchFetch(`${BASE}/api/admin/posts`);
  check('GET /api/admin/posts ohne Token -> 401', r.status === 401);

  // --- Login korrekt (legt Admin lazy an, hasht via PBKDF2) --------------
  r = await mf.dispatchFetch(`${BASE}/api/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'nazumido' }),
  });
  d = await j(r);
  check('POST /api/login korrekt -> Token', r.status === 200 && !!d.token, `(status=${r.status})`);
  const token = d.token;
  const auth = { Authorization: 'Bearer ' + token };

  // --- Zweiter Login: prüft, dass gespeicherter PBKDF2-Hash verifiziert ---
  r = await mf.dispatchFetch(`${BASE}/api/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'nazumido' }),
  });
  check('POST /api/login erneut -> PBKDF2-Verify ok', r.status === 200);

  // --- Admin-Liste mit Token ---------------------------------------------
  r = await mf.dispatchFetch(`${BASE}/api/admin/posts`, { headers: auth });
  d = await j(r);
  check('GET /api/admin/posts mit Token -> 200', r.status === 200 && Array.isArray(d));

  // --- Beitrag anlegen ----------------------------------------------------
  r = await mf.dispatchFetch(`${BASE}/api/admin/posts`, {
    method: 'POST', headers: { ...auth, 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'Testbeitrag', content: 'Inhalt', is_active: 0 }),
  });
  d = await j(r);
  const newId = d.id;
  check('POST /api/admin/posts -> 201 + id', r.status === 201 && !!newId, `(status=${r.status})`);
  check('  neuer Beitrag ist Entwurf (is_active=0)', d.is_active === 0);

  // --- Entwurf taucht NICHT in öffentlicher Liste auf ---------------------
  r = await mf.dispatchFetch(`${BASE}/api/posts`);
  d = await j(r);
  check('GET /api/posts zeigt Entwurf nicht', d.every((p) => p.id !== newId));

  // --- Beitrag bearbeiten (veröffentlichen) ------------------------------
  r = await mf.dispatchFetch(`${BASE}/api/admin/posts/${newId}`, {
    method: 'PUT', headers: { ...auth, 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'Testbeitrag (bearbeitet)', is_active: 1 }),
  });
  d = await j(r);
  check('PUT /api/admin/posts/:id -> Titel+Status geändert',
    r.status === 200 && d.title === 'Testbeitrag (bearbeitet)' && d.is_active === 1);
  check('  content blieb erhalten (Merge)', d.content === 'Inhalt', `(content=${d.content})`);

  // --- Jetzt in öffentlicher Liste sichtbar ------------------------------
  r = await mf.dispatchFetch(`${BASE}/api/posts`);
  d = await j(r);
  check('GET /api/posts zeigt veröffentlichten Beitrag', d.some((p) => p.id === newId));

  // --- Einstellungen aktualisieren ---------------------------------------
  r = await mf.dispatchFetch(`${BASE}/api/admin/settings`, {
    method: 'PUT', headers: { ...auth, 'Content-Type': 'application/json' },
    body: JSON.stringify({ telefon: '0000 / 123', email: 'neu@nazumido.at' }),
  });
  d = await j(r);
  check('PUT /api/admin/settings -> upsert', r.status === 200 && d.telefon === '0000 / 123' && d.email === 'neu@nazumido.at');

  // --- Foto-Upload nach R2 + Auslieferung --------------------------------
  const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3, 4]);
  const fd = new FormData();
  fd.append('photo', new File([png], 'logo.png', { type: 'image/png' }));
  let up = await serializeForm(fd);
  r = await mf.dispatchFetch(`${BASE}/api/upload`, { method: 'POST', headers: { ...auth, 'Content-Type': up.ct }, body: up.buf });
  d = await j(r);
  const url = d.url;
  check('POST /api/upload -> 201 + /uploads-URL', r.status === 201 && url && url.startsWith('/uploads/'), `(status=${r.status}, url=${url})`);

  r = await mf.dispatchFetch(`${BASE}${url}`);
  const bytes = new Uint8Array(await r.arrayBuffer());
  check('GET /uploads/:key -> aus R2, korrekte Bytes',
    r.status === 200 && bytes.length === png.length && bytes[1] === 0x50,
    `(status=${r.status}, len=${bytes.length}, ct=${r.headers.get('content-type')})`);

  // --- Upload falscher Typ abgewiesen ------------------------------------
  const fd2 = new FormData();
  fd2.append('photo', new File([new Uint8Array([1, 2, 3])], 'x.pdf', { type: 'application/pdf' }));
  up = await serializeForm(fd2);
  r = await mf.dispatchFetch(`${BASE}/api/upload`, { method: 'POST', headers: { ...auth, 'Content-Type': up.ct }, body: up.buf });
  check('POST /api/upload PDF -> 400 abgewiesen', r.status === 400);

  // --- Beitrag löschen ----------------------------------------------------
  r = await mf.dispatchFetch(`${BASE}/api/admin/posts/${newId}`, { method: 'DELETE', headers: auth });
  d = await j(r);
  check('DELETE /api/admin/posts/:id -> deleted', r.status === 200 && d.deleted === true);

  r = await mf.dispatchFetch(`${BASE}/api/admin/posts/999999`, { method: 'DELETE', headers: auth });
  check('DELETE nicht existierend -> 404', r.status === 404);

  // --- Ungültiges Token ---------------------------------------------------
  r = await mf.dispatchFetch(`${BASE}/api/admin/posts`, { headers: { Authorization: 'Bearer kaputt.token.hier' } });
  check('GET /api/admin/posts mit kaputtem Token -> 401', r.status === 401);

  // --- Unbekannte API-Route ----------------------------------------------
  r = await mf.dispatchFetch(`${BASE}/api/gibtsnicht`);
  d = await j(r);
  check('GET /api/gibtsnicht -> 404 JSON', r.status === 404 && d.error === 'Endpunkt nicht gefunden');

  // --- Reservierungen -----------------------------------------------------
  const reservation = {
    code: 'NZ-TEST1',
    eventId: 'e2', eventTitle: 'Prinzenball', eventDate: '17. Jänner 2026',
    eventIso: '2026-01-17', eventTime: '20:11 Uhr', eventWhere: 'Kulturhaus',
    name: 'Jürgen Größwang', email: 'juergen@example.at', phone: '+43 664 123',
    count: 4, note: 'Tisch nahe der Bühne',
  };
  r = await mf.dispatchFetch(`${BASE}/api/reservations`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(reservation),
  });
  d = await j(r);
  check('POST /api/reservations -> 200 + Kennung', r.status === 200 && d.ok === true && d.code === 'NZ-TEST1', `(status=${r.status})`);
  check('  ohne Mailanbieter -> mail.configured=false', d.mail && d.mail.configured === false, `(mail=${JSON.stringify(d.mail)})`);

  const stored = await db.prepare('SELECT * FROM reservations WHERE code = ?').bind('NZ-TEST1').first();
  check('  in D1 gespeichert', !!stored && stored.seats === 4 && stored.name === 'Jürgen Größwang',
    `(row=${JSON.stringify(stored)})`);

  r = await mf.dispatchFetch(`${BASE}/api/reservations`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...reservation, code: 'NZ-TEST2', email: 'keine-mail' }),
  });
  check('POST /api/reservations ohne gültige E-Mail -> 400', r.status === 400);

  r = await mf.dispatchFetch(`${BASE}/api/reservations`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...reservation, code: 'NZ-TEST3', count: 0 }),
  });
  check('POST /api/reservations mit 0 Plätzen -> 400', r.status === 400);

  r = await mf.dispatchFetch(`${BASE}/api/reservations`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...reservation, code: '', name: 'Ohne Kennung' }),
  });
  d = await j(r);
  check('POST /api/reservations ohne Kennung -> Server vergibt eine', r.status === 200 && /^NZ-[A-Z0-9]{5}$/.test(d.code || ''), `(code=${d.code})`);

  r = await mf.dispatchFetch(`${BASE}/api/admin/reservations`);
  check('GET /api/admin/reservations ohne Token -> 401', r.status === 401);

  r = await mf.dispatchFetch(`${BASE}/api/admin/reservations`, { headers: auth });
  d = await j(r);
  check('GET /api/admin/reservations mit Token -> Liste', r.status === 200 && d.some((x) => x.code === 'NZ-TEST1'), `(len=${d.length})`);

  // --- Bestätigungsmail (Anbieter-API wird abgefangen) --------------------
  // Zweite Instanz mit Mailanbieter; der Aufruf an api.resend.com wird
  // abgefangen, damit der Test ohne Netz und ohne echten Schlüssel läuft.
  const sent = [];
  const fetchMock = createFetchMock();
  fetchMock.disableNetConnect();
  fetchMock
    .get('https://api.resend.com')
    .intercept({ path: '/emails', method: 'POST' })
    // opts.body ist ein ReadableStream — asynchron einlesen und die Promise merken
    .reply(200, (opts) => { sent.push(new Response(opts.body).text().then((t) => JSON.parse(t))); return { id: 'mock' }; })
    .times(2);

  const mfMail = new Miniflare({
    modules: true,
    compatibilityDate: '2024-09-23',
    scriptPath: './dist-worker/worker.js',
    d1Databases: { DB: 'nazumido-mail-db' },
    r2Buckets: { BUCKET: 'nazumido-uploads' },
    fetchMock,
    bindings: {
      JWT_SECRET: 'test-secret-nur-fuer-den-test-1234567890',
      RESEND_API_KEY: 'test-key',
      MAIL_FROM: 'Faschingsverein Nazumido <tickets@nazu-mido.at>',
      CLUB_EMAIL: 'verein@nazu-mido.at',
    },
    serviceBindings: { ASSETS: () => new Response('asset-fallback', { status: 200 }) },
  });
  try {
    r = await mfMail.dispatchFetch(`${BASE}/api/reservations`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...reservation, code: 'NZ-MAIL1' }),
    });
    d = await j(r);
    const mails = await Promise.all(sent);
    check('POST /api/reservations mit Anbieter -> Mail verschickt',
      r.status === 200 && d.mail && d.mail.visitor === 'sent' && d.mail.club === 'sent',
      `(mail=${JSON.stringify(d.mail)})`);
    check('  Bestätigung geht an die Besucher:in', mails[0] && mails[0].to[0] === 'juergen@example.at', `(to=${mails[0] && mails[0].to})`);
    check('  Kennung und Termin stehen im Text',
      mails[0] && mails[0].subject.includes('NZ-MAIL1') && mails[0].text.includes('Prinzenball'));
    check('  Kopie geht an den Verein', mails[1] && mails[1].to[0] === 'verein@nazu-mido.at', `(to=${mails[1] && mails[1].to})`);
  } finally {
    await mfMail.dispose();
  }

} catch (e) {
  console.error('\nTEST-CRASH:', e);
  fail++;
} finally {
  await mf.dispose();
}

console.log(`\n===== Ergebnis: ${pass} bestanden, ${fail} fehlgeschlagen =====`);
process.exit(fail ? 1 : 0);
