// End-to-End-Test des Cloudflare Workers via Miniflare (echtes D1 + R2, in-process).
import { Miniflare } from 'miniflare';
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

} catch (e) {
  console.error('\nTEST-CRASH:', e);
  fail++;
} finally {
  await mf.dispose();
}

console.log(`\n===== Ergebnis: ${pass} bestanden, ${fail} fehlgeschlagen =====`);
process.exit(fail ? 1 : 0);
