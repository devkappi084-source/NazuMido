/* ============================================================
   NazuMido Mitgliederbereich – SPA
   ============================================================ */
'use strict';

const S = { token: null, member: null };

// ── API ──────────────────────────────────────────────────────
async function mapi(action, params = {}) {
  const url = new URL('/api/member', location.origin);
  url.searchParams.set('action', action);
  Object.entries(params).forEach(([k,v]) => url.searchParams.set(k, v));
  const r = await fetch(url, {
    headers: S.token ? { 'Authorization': `Bearer ${S.token}` } : {}
  });
  const d = await r.json().catch(() => ({ error: `HTTP ${r.status}` }));
  if (!r.ok) throw new Error(d.error || `HTTP ${r.status}`);
  return d;
}

async function mpost(action, body) {
  const r = await fetch(`/api/member?action=${action}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(S.token ? { 'Authorization': `Bearer ${S.token}` } : {}) },
    body: JSON.stringify(body)
  });
  const d = await r.json().catch(() => ({ error: `HTTP ${r.status}` }));
  if (!r.ok) throw new Error(d.error || `HTTP ${r.status}`);
  return d;
}

// ── Flash ────────────────────────────────────────────────────
function flash(msg, type = 'success') {
  const el = document.getElementById('flash-bar');
  if (!el) return;
  el.innerHTML = `<div class="flash flash-${type}">${msg}</div>`;
  if (type !== 'error') setTimeout(() => { el.innerHTML = ''; }, 3500);
}

// ── Auth ─────────────────────────────────────────────────────
document.getElementById('login-form').addEventListener('submit', async e => {
  e.preventDefault();
  const btn = document.getElementById('login-btn');
  const err = document.getElementById('login-error');
  btn.textContent = 'Anmelden…'; btn.disabled = true; err.style.display = 'none';
  try {
    const { token, member } = await mpost('login', {
      email:    document.getElementById('m-email').value.trim(),
      password: document.getElementById('m-pw').value,
    });
    S.token  = token;
    S.member = member;
    sessionStorage.setItem('nz_member_token', token);
    bootApp();
  } catch(ex) {
    err.textContent = ex.message; err.style.display = 'block';
    btn.textContent = 'Anmelden'; btn.disabled = false;
  }
});

function bootApp() {
  document.getElementById('login-view').style.display = 'none';
  document.getElementById('app-view').style.display   = 'flex';
  document.getElementById('user-name').textContent    = S.member.name;
  document.getElementById('user-avatar').textContent  = S.member.name[0].toUpperCase();
  showEvents();
}

async function doLogout() {
  try { await mpost('logout', {}); } catch {}
  S.token = null; S.member = null;
  sessionStorage.removeItem('nz_member_token');
  document.getElementById('app-view').style.display   = 'none';
  document.getElementById('login-view').style.display = 'flex';
}

// ── Routing ──────────────────────────────────────────────────
const TYPE_LABELS = { highlight:'Highlight', ball:'Ball', familie:'Familie', abschluss:'Finale', sonstig:'Event' };
const MONTHS = ['Jan','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez'];

function esc(v) {
  if (v == null) return '';
  return String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── Event list ───────────────────────────────────────────────
async function showEvents() {
  const el = document.getElementById('app-content');
  el.innerHTML = `<h1 class="page-title">VERANSTALTUNGEN</h1><p class="page-sub">Klicke auf ein Event um die Fotos zu sehen</p><div class="center"><div class="spinner"></div></div>`;

  try {
    // Load events from KV/config
    const r = await fetch('/api/config', { cache: 'no-store' });
    const cfg = r.ok ? await r.json() : {};
    const events = (cfg.events || []).sort((a,b) => b.date.localeCompare(a.date));

    if (!events.length) {
      el.innerHTML = `<h1 class="page-title">VERANSTALTUNGEN</h1><div class="center">Noch keine Termine</div>`;
      return;
    }

    // Also fetch photo counts for each event
    const cards = events.map(ev => {
      const d    = new Date(ev.date);
      const type = ev.type || 'sonstig';
      return `<div class="event-card" onclick="showEventPhotos(${ev.id},'${esc(ev.title)}')">
        <div class="event-card-date">${String(d.getDate()).padStart(2,'0')}. ${MONTHS[d.getMonth()]} ${d.getFullYear()}</div>
        <div class="event-card-title">${esc(ev.title)}</div>
        <span class="badge badge-${type}">${esc(TYPE_LABELS[type]||type)}</span>
        ${ev.location ? `<div class="event-card-count" style="margin-top:6px">📍 ${esc(ev.location)}</div>` : ''}
      </div>`;
    }).join('');

    el.innerHTML = `<h1 class="page-title">VERANSTALTUNGEN</h1><p class="page-sub">Klicke auf ein Event um die Fotos zu sehen · Du bist eingeloggt als <strong>${esc(S.member.name)}</strong></p><div class="event-cards">${cards}</div>`;
  } catch(ex) {
    el.innerHTML = `<h1 class="page-title">VERANSTALTUNGEN</h1><div class="center" style="color:#ff8888">Fehler: ${esc(ex.message)}</div>`;
  }
}

// ── Event photos ─────────────────────────────────────────────
async function showEventPhotos(eventId, title) {
  const el = document.getElementById('app-content');
  el.innerHTML = `
    <button class="back-btn" onclick="showEvents()">← Zurück</button>
    <h1 class="page-title">${esc(title)}</h1>
    <p class="page-sub">Klicke auf ein Foto zum Herunterladen</p>
    <div class="center"><div class="spinner"></div></div>`;

  try {
    const { photos, previews } = await mapi('photos', { event: eventId });
    const previewSet = new Set((previews||[]).map(p => p.filename));

    if (!photos.length && !previews.length) {
      el.querySelector('.center').innerHTML = '<p>Noch keine Fotos für diese Veranstaltung</p>';
      return;
    }

    // Show all photos, previews without signed URL (just as thumbnails), full ones with download
    const allFiles = photos.length > 0 ? photos : (previews||[]).map(p => ({ filename: p.filename, isPreviewOnly: true }));

    const grid = allFiles.map(p => {
      const fp = previews.find(x => x.filename === p.filename);
      const thumbSrc = fp?.thumb ? `data:image/jpeg;base64,${fp.thumb}` : '';
      return `<div class="photo-item" onclick="downloadPhoto(${eventId},'${esc(p.filename)}','${esc(p.filename)}')">
        ${thumbSrc ? `<img src="${thumbSrc}" alt="${esc(p.filename)}" loading="lazy">` : `<img src="" alt="${esc(p.filename)}" loading="lazy" onerror="this.style.display='none'" data-event="${eventId}" data-file="${esc(p.filename)}" class="lazy-sign">`}
        ${previewSet.has(p.filename) ? '<span class="preview-badge">Vorschau</span>' : ''}
        <button class="photo-dl" onclick="event.stopPropagation();downloadPhoto(${eventId},'${esc(p.filename)}')">⬇ Download</button>
      </div>`;
    }).join('');

    el.innerHTML = `
      <button class="back-btn" onclick="showEvents()">← Zurück zur Übersicht</button>
      <h1 class="page-title">${esc(title)}</h1>
      <p class="page-sub">${allFiles.length} Foto(s) · Klicke zum Herunterladen</p>
      <div class="photo-grid">${grid}</div>`;

    // Lazy-load signed URLs for photos without preview thumbnail
    loadSignedThumbs(eventId);
  } catch(ex) {
    el.innerHTML = `
      <button class="back-btn" onclick="showEvents()">← Zurück</button>
      <div class="center" style="color:#ff8888">Fehler: ${esc(ex.message)}</div>`;
  }
}

async function loadSignedThumbs(eventId) {
  const imgs = document.querySelectorAll(`img.lazy-sign[data-event="${eventId}"]`);
  for (const img of imgs) {
    try {
      const { url } = await mapi('download', { event: eventId, file: img.dataset.file });
      img.src = url;
      img.classList.remove('lazy-sign');
    } catch {}
  }
}

async function downloadPhoto(eventId, filename) {
  try {
    const { url } = await mapi('download', { event: eventId, file: filename });
    const a       = document.createElement('a');
    a.href        = url;
    a.download    = filename;
    a.target      = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } catch(ex) { flash('Download-Fehler: ' + ex.message, 'error'); }
}

// ── Init ─────────────────────────────────────────────────────
(async () => {
  const token = sessionStorage.getItem('nz_member_token');
  if (token) {
    S.token = token;
    try {
      const { member } = await mapi('check');
      S.member = member;
      bootApp();
      return;
    } catch { S.token = null; sessionStorage.removeItem('nz_member_token'); }
  }
})();
