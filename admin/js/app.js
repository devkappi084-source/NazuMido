/* ============================================================
   NazuMido Admin – Serverless SPA via GitHub API
   ============================================================ */
'use strict';

// ── Config ──────────────────────────────────────────────────
const CFG = {
  repo:   'devkappi084-source/nazumido',
  branch: 'claude/great-rubin-tXnlB',
  api:    'https://api.github.com'
};

// ── Application state ───────────────────────────────────────
const S = {
  token:       null,
  content:     null,  contentSha:  null,
  events:      null,  eventsSha:   null,
  settings:    null,  settingsSha: null,
  gallery:     null,  gallerySha:  null,
  images:      [],
  logoSha:     null,
  saving:      false,
  page:        'dashboard'
};

// ── GitHub API ──────────────────────────────────────────────
const GH = {
  _h() {
    return {
      'Authorization': `token ${S.token}`,
      'Accept':        'application/vnd.github.v3+json',
      'Content-Type':  'application/json'
    };
  },

  async getJSON(path) {
    const url = `${CFG.api}/repos/${CFG.repo}/contents/${path}?ref=${encodeURIComponent(CFG.branch)}`;
    const r = await fetch(url, { headers: this._h() });
    if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.message || `HTTP ${r.status}`); }
    const d = await r.json();
    return { data: JSON.parse(b64dec(d.content)), sha: d.sha };
  },

  async putJSON(path, data, sha, message) {
    return this._put(path, JSON.stringify(data, null, 2), sha, message);
  },

  async _put(path, text, sha, message) {
    const body = { message, content: b64enc(text), branch: CFG.branch };
    if (sha) body.sha = sha;
    const r = await fetch(`${CFG.api}/repos/${CFG.repo}/contents/${path}`, {
      method: 'PUT', headers: this._h(), body: JSON.stringify(body)
    });
    if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.message || `HTTP ${r.status}`); }
    return r.json();
  },

  async putBinary(path, base64, sha, message) {
    const body = { message, content: base64, branch: CFG.branch };
    if (sha) body.sha = sha;
    const r = await fetch(`${CFG.api}/repos/${CFG.repo}/contents/${path}`, {
      method: 'PUT', headers: this._h(), body: JSON.stringify(body)
    });
    if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.message || `HTTP ${r.status}`); }
    return r.json();
  },

  async deleteFile(path, sha, message) {
    const r = await fetch(`${CFG.api}/repos/${CFG.repo}/contents/${path}`, {
      method: 'DELETE', headers: this._h(),
      body: JSON.stringify({ message, sha, branch: CFG.branch })
    });
    if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.message || `HTTP ${r.status}`); }
    return r.json();
  },

  async listDir(path) {
    const url = `${CFG.api}/repos/${CFG.repo}/contents/${path}?ref=${encodeURIComponent(CFG.branch)}`;
    const r = await fetch(url, { headers: this._h() });
    if (!r.ok) return [];
    const d = await r.json();
    return Array.isArray(d) ? d : [];
  },

  async getFileSha(path) {
    const url = `${CFG.api}/repos/${CFG.repo}/contents/${path}?ref=${encodeURIComponent(CFG.branch)}`;
    const r = await fetch(url, { headers: this._h() });
    if (r.status === 404) return null;
    if (!r.ok) return null;
    const d = await r.json();
    return d.sha || null;
  }
};

// ── Base64 helpers (UTF-8 safe) ─────────────────────────────
function b64enc(str) { return btoa(unescape(encodeURIComponent(str))); }
function b64dec(b64) { return decodeURIComponent(escape(atob(b64.replace(/\n/g, '')))); }

// ── Image resize (client-side, max 1400px, JPEG 85%) ────────
function resizeImage(file, maxPx = 1400) {
  return new Promise(resolve => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      let w = img.width, h = img.height;
      if (w > maxPx || h > maxPx) {
        if (w >= h) { h = Math.round(h * maxPx / w); w = maxPx; }
        else        { w = Math.round(w * maxPx / h); h = maxPx; }
      }
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      c.getContext('2d').drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      c.toBlob(blob => {
        const fr = new FileReader();
        fr.onload = e => resolve(e.target.result.split(',')[1]);
        fr.readAsDataURL(blob);
      }, 'image/jpeg', 0.85);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      // Fallback: read raw as base64
      const fr = new FileReader();
      fr.onload = e => resolve(e.target.result.split(',')[1]);
      fr.readAsDataURL(file);
    };
    img.src = url;
  });
}

// ── HTML escape ─────────────────────────────────────────────
function esc(v) {
  if (v == null) return '';
  return String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── Sanitize filename ────────────────────────────────────────
function safeName(name) {
  return name.toLowerCase()
    .replace(/ä/g,'ae').replace(/ö/g,'oe').replace(/ü/g,'ue').replace(/ß/g,'ss')
    .replace(/\s+/g,'-').replace(/[^a-z0-9\-_.]/g,'')
    || 'foto.jpg';
}

// ── Raw image URL (works for public repos) ───────────────────
function rawUrl(repoPath) {
  return `https://raw.githubusercontent.com/${CFG.repo}/${CFG.branch}/${repoPath}`;
}

// ── Flash messages ───────────────────────────────────────────
let _flashTimer = null;
function flash(msg, type = 'success') {
  const area = document.getElementById('flash-area');
  if (!area) return;
  const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ';
  area.innerHTML = `<div class="flash flash-${type}"><span>${icon}</span> ${msg}</div>`;
  clearTimeout(_flashTimer);
  if (type !== 'error') _flashTimer = setTimeout(() => { area.innerHTML = ''; }, 4500);
}

// ── Loading overlay ──────────────────────────────────────────
function showLoading(msg = 'Wird geladen…') {
  const el = document.getElementById('loading-overlay');
  document.getElementById('loading-msg').textContent = msg;
  if (el) el.style.display = 'flex';
}
function hideLoading() {
  const el = document.getElementById('loading-overlay');
  if (el) el.style.display = 'none';
}

// ── Modal ────────────────────────────────────────────────────
function openModal(html) {
  const overlay = document.getElementById('modal-overlay');
  document.getElementById('modal-body').innerHTML = html;
  overlay.style.display = 'flex';
  document.body.style.overflow = 'hidden';
  // Focus first input
  setTimeout(() => {
    const first = document.querySelector('#modal-body input, #modal-body textarea, #modal-body select');
    if (first) first.focus();
  }, 50);
}
function closeModal() {
  document.getElementById('modal-overlay').style.display = 'none';
  document.body.style.overflow = '';
}

// ── Tabs ─────────────────────────────────────────────────────
function initTabs(container) {
  const root = container || document;
  root.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', function() {
      const target = this.dataset.tab;
      root.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      root.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      this.classList.add('active');
      const panel = root.getElementById ? root.getElementById('tab-' + target) : document.getElementById('tab-' + target);
      if (panel) panel.classList.add('active');
    });
  });
}

// ── Auth ─────────────────────────────────────────────────────
function initLogin() {
  document.getElementById('pw-toggle').addEventListener('click', () => {
    const inp = document.getElementById('login-token');
    inp.type = inp.type === 'password' ? 'text' : 'password';
  });

  document.getElementById('login-form').addEventListener('submit', async e => {
    e.preventDefault();
    const token = document.getElementById('login-token').value.trim();
    if (!token) return;

    const btn = document.getElementById('login-btn');
    const errEl = document.getElementById('login-error');
    btn.textContent = 'Verbinden…'; btn.disabled = true;
    errEl.style.display = 'none';

    try {
      const r = await fetch(`${CFG.api}/repos/${CFG.repo}`, {
        headers: { 'Authorization': `token ${token}`, 'Accept': 'application/vnd.github.v3+json' }
      });
      if (r.status === 401) throw new Error('Ungültiges Token. Bitte überprüfen.');
      if (r.status === 404) throw new Error('Repository nicht gefunden oder kein Zugriff.');
      if (!r.ok) throw new Error(`GitHub Fehler: HTTP ${r.status}`);

      S.token = token;
      sessionStorage.setItem('gh_token', token);
      await bootApp();
    } catch(err) {
      errEl.textContent = err.message;
      errEl.style.display = 'block';
      btn.textContent = 'Einloggen';
      btn.disabled = false;
    }
  });
}

async function bootApp() {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('admin-app').style.display = 'flex';
  showLoading('Daten werden geladen…');

  try {
    const [c, ev, st] = await Promise.all([
      GH.getJSON('data/content.json'),
      GH.getJSON('data/events.json'),
      GH.getJSON('data/settings.json')
    ]);
    S.content  = c.data;  S.contentSha  = c.sha;
    S.events   = ev.data; S.eventsSha   = ev.sha;
    S.settings = st.data; S.settingsSha = st.sha;

    try {
      const g = await GH.getJSON('data/gallery.json');
      S.gallery = g.data; S.gallerySha = g.sha;
    } catch { S.gallery = []; S.gallerySha = null; }

    const all = await GH.listDir('images/gallery');
    S.images = all.filter(f => /\.(jpe?g|png|gif|webp)$/i.test(f.name));
    S.logoSha = await GH.getFileSha('images/logo.png');

  } catch(err) {
    flash('Fehler beim Laden: ' + err.message, 'error');
  }

  hideLoading();
  navigate('dashboard');
}

function logout() {
  if (!confirm('Wirklich ausloggen?')) return;
  S.token = null;
  sessionStorage.removeItem('gh_token');
  document.getElementById('admin-app').style.display = 'none';
  document.getElementById('login-screen').style.display = 'flex';
  document.getElementById('login-token').value = '';
}

// ── Router ───────────────────────────────────────────────────
const PAGE_TITLES = {
  dashboard: 'Dashboard',
  content:   'Texte & Inhalte',
  events:    'Veranstaltungen',
  gallery:   'Galerie & Fotos',
  settings:  'Einstellungen'
};

function navigate(page) {
  S.page = page;
  document.querySelectorAll('.nav-item[data-page]').forEach(el => {
    el.classList.toggle('active', el.dataset.page === page);
  });
  const titleEl = document.getElementById('header-title');
  if (titleEl) titleEl.textContent = PAGE_TITLES[page] || page;
  document.getElementById('sidebar').classList.remove('open');
  const content = document.getElementById('page-content');
  if (content) content.scrollTop = 0;

  const fn = { dashboard: renderDashboard, content: renderContent, events: renderEvents, gallery: renderGallery, settings: renderSettings }[page];
  if (fn) fn();
}

// ══════════════════════════════════════════════════════════════
//  DASHBOARD
// ══════════════════════════════════════════════════════════════
const MSHORT = ['Jan','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez'];
const MLONG  = ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];
const TYPE_LABELS = { highlight:'Highlight', ball:'Ball', familie:'Familie', abschluss:'Finale', sonstig:'Event' };

function renderDashboard() {
  const now = new Date();
  const upcoming = (S.events||[]).filter(e => new Date(e.date) >= now).sort((a,b) => a.date.localeCompare(b.date));
  const next = upcoming[0];

  const nextHtml = next ? (() => {
    const d = new Date(next.date);
    return `<div class="next-event">
      <div class="next-event-date">${String(d.getDate()).padStart(2,'0')}<small>${MLONG[d.getMonth()]}</small></div>
      <div class="next-event-info">
        <strong>${esc(next.title)}</strong>
        <span>${esc(next.time||'')}${next.location ? ' · '+esc(next.location) : ''}</span>
      </div>
    </div>`;
  })() : '<p class="empty-hint">Keine bevorstehenden Veranstaltungen</p>';

  const rowsHtml = (S.events||[]).sort((a,b) => a.date.localeCompare(b.date)).slice(0,5).map(e => {
    const d = new Date(e.date);
    const past = d < now;
    return `<tr class="${past?'row-past':''}">
      <td class="td-date">${String(d.getDate()).padStart(2,'0')}. ${MSHORT[d.getMonth()]} ${d.getFullYear()}</td>
      <td>${esc(e.title)}</td>
      <td><span class="badge-type type-${esc(e.type)}">${esc(TYPE_LABELS[e.type]||e.type)}</span></td>
    </tr>`;
  }).join('');

  const thumbsHtml = S.images.slice(0,8).map(img =>
    `<div class="dash-gallery-item"><img src="${rawUrl('images/gallery/'+img.name)}?v=${Date.now()}" alt="${esc(img.name)}" loading="lazy" onerror="this.parentElement.style.background='var(--input-bg)'"></div>`
  ).join('');

  document.getElementById('page-content').innerHTML = `
    <div class="dashboard-grid">
      <div class="stat-card"><span class="stat-icon">📅</span><div><div class="stat-number">${(S.events||[]).length}</div><div class="stat-label">Termine gesamt</div></div></div>
      <div class="stat-card"><span class="stat-icon">⏭️</span><div><div class="stat-number">${upcoming.length}</div><div class="stat-label">Bevorstehend</div></div></div>
      <div class="stat-card"><span class="stat-icon">🖼️</span><div><div class="stat-number">${S.images.length}</div><div class="stat-label">Fotos</div></div></div>
      <div class="stat-card"><span class="stat-icon">👥</span><div><div class="stat-number">${esc(S.settings?.general?.members||'—')}</div><div class="stat-label">Mitglieder</div></div></div>
    </div>

    <div class="dashboard-row">
      <div class="dash-card">
        <div class="dash-card-head"><h2>Nächster Termin</h2><a class="btn-sm-link" href="#" onclick="navigate('events');return false;">Alle Termine →</a></div>
        ${nextHtml}
      </div>
      <div class="dash-card">
        <div class="dash-card-head"><h2>Schnellzugriff</h2></div>
        <div class="quick-actions">
          <button class="quick-btn" onclick="navigate('events')"><span>＋</span> Termin hinzufügen</button>
          <button class="quick-btn" onclick="navigate('gallery')"><span>📷</span> Foto hochladen</button>
          <button class="quick-btn" onclick="navigate('content')"><span>✏️</span> Texte bearbeiten</button>
          <button class="quick-btn" onclick="navigate('settings')"><span>⚙️</span> Einstellungen</button>
        </div>
      </div>
    </div>

    <div class="dashboard-row" style="margin-top:18px">
      <div class="dash-card">
        <div class="dash-card-head"><h2>Termine (nächste 5)</h2><a class="btn-sm-link" href="#" onclick="navigate('events');return false;">Alle bearbeiten →</a></div>
        ${rowsHtml ? `<table class="admin-table"><thead><tr><th>Datum</th><th>Titel</th><th>Typ</th></tr></thead><tbody>${rowsHtml}</tbody></table>` : '<p class="empty-hint">Noch keine Termine angelegt</p>'}
      </div>
      ${S.images.length > 0 ? `
      <div class="dash-card">
        <div class="dash-card-head"><h2>Galerie-Vorschau</h2><a class="btn-sm-link" href="#" onclick="navigate('gallery');return false;">Verwalten →</a></div>
        <div class="dash-gallery">${thumbsHtml}</div>
      </div>` : ''}
    </div>
  `;
}

// ══════════════════════════════════════════════════════════════
//  CONTENT
// ══════════════════════════════════════════════════════════════
function renderContent() {
  const h = S.content?.hero   || {};
  const a = S.content?.about  || {};
  const g = S.content?.groups || {};

  document.getElementById('page-content').innerHTML = `
    <div class="tabs">
      <button class="tab active" data-tab="hero">Hero / Titel</button>
      <button class="tab" data-tab="about">Über uns</button>
      <button class="tab" data-tab="groups">Gruppen</button>
    </div>

    <!-- TAB: Hero -->
    <div class="tab-panel active" id="tab-hero">
      <div class="form-card">
        <div class="form-card-title">Hero-Bereich (Startseite oben)</div>
        <div class="form-grid-2">
          <div class="form-group"><label>Vortext (über dem Titel)</label><input id="c-pretext" value="${esc(h.pretext)}"></div>
          <div class="form-group"><label>Standort</label><input id="c-location" value="${esc(h.location)}"></div>
        </div>
        <div class="form-grid-2">
          <div class="form-group"><label>Titel (Vereinsname)</label><input id="c-title" value="${esc(h.title)}"></div>
          <div class="form-group"><label>Untertitel</label><input id="c-subtitle" value="${esc(h.subtitle)}"></div>
        </div>
        <div class="form-group"><label>Motto / Slogan</label><input id="c-motto" value="${esc(h.motto)}" placeholder='z.B. "Jetzt wird&apos;s närrisch!"'></div>
        <div class="form-actions"><button class="btn-save" onclick="saveContent(this)">Speichern &amp; Veröffentlichen</button></div>
      </div>
    </div>

    <!-- TAB: About -->
    <div class="tab-panel" id="tab-about">
      <div class="form-card">
        <div class="form-card-title">Über uns – Haupttexte</div>
        <div class="form-group"><label>Eyebrow (kleiner Text über der Überschrift)</label><input id="c-eyebrow" value="${esc(a.eyebrow)}"></div>
        <div class="form-group"><label>Lead-Text (Einleitung, HTML erlaubt z.B. &lt;strong&gt;)</label><textarea id="c-lead" rows="3">${esc(a.lead)}</textarea></div>
        <div class="form-group"><label>Absatz 1</label><textarea id="c-text1" rows="3">${esc(a.text1)}</textarea></div>
        <div class="form-group"><label>Absatz 2 (HTML erlaubt z.B. &lt;em&gt;)</label><textarea id="c-text2" rows="3">${esc(a.text2)}</textarea></div>
        <div class="form-grid-2">
          <div class="form-group"><label>Statistik: Jahre (z.B. "50+")</label><input id="c-stat-years" value="${esc(a.stat_years)}"></div>
          <div class="form-group"><label>Statistik: Mitglieder (z.B. "100+")</label><input id="c-stat-members" value="${esc(a.stat_members)}"></div>
        </div>
      </div>
      <div class="form-card">
        <div class="form-card-title">Info-Karten (3 Kacheln)</div>
        <div class="form-grid-3">
          <div class="form-group"><label>Karte 1 – Titel</label><input id="c-card1-title" value="${esc(a.card1_title)}"></div>
          <div class="form-group"><label>Karte 2 – Titel</label><input id="c-card2-title" value="${esc(a.card2_title)}"></div>
          <div class="form-group"><label>Karte 3 – Titel</label><input id="c-card3-title" value="${esc(a.card3_title)}"></div>
        </div>
        <div class="form-group"><label>Karte 1 – Text</label><textarea id="c-card1-text" rows="2">${esc(a.card1_text)}</textarea></div>
        <div class="form-group"><label>Karte 2 – Text</label><textarea id="c-card2-text" rows="2">${esc(a.card2_text)}</textarea></div>
        <div class="form-group"><label>Karte 3 – Text</label><textarea id="c-card3-text" rows="2">${esc(a.card3_text)}</textarea></div>
        <div class="form-actions"><button class="btn-save" onclick="saveContent(this)">Speichern &amp; Veröffentlichen</button></div>
      </div>
    </div>

    <!-- TAB: Groups -->
    <div class="tab-panel" id="tab-groups">
      <div class="form-card">
        <div class="form-card-title">Gruppen-Beschreibungen</div>
        <div class="form-group"><label>🩰 Garde – Beschreibung</label><textarea id="c-garde" rows="3">${esc(g.garde_desc)}</textarea></div>
        <div class="form-group"><label>👑 Elferrat – Beschreibung</label><textarea id="c-elferrat" rows="3">${esc(g.elferrat_desc)}</textarea></div>
        <div class="form-group"><label>💑 Prinzenpaar – Beschreibung</label><textarea id="c-prinzen" rows="3">${esc(g.prinzen_desc)}</textarea></div>
        <div class="form-group"><label>🧙 Hexen – Beschreibung</label><textarea id="c-hexen" rows="3">${esc(g.hexen_desc)}</textarea></div>
        <div class="form-actions"><button class="btn-save" onclick="saveContent(this)">Speichern &amp; Veröffentlichen</button></div>
      </div>
    </div>
  `;
  initTabs();
}

async function saveContent(btn) {
  if (S.saving) return;
  S.saving = true;
  const orig = btn.textContent;
  btn.textContent = 'Speichern…'; btn.disabled = true;

  const val = id => document.getElementById(id)?.value ?? '';

  try {
    const newContent = {
      hero: {
        pretext:  val('c-pretext'),
        title:    val('c-title'),
        subtitle: val('c-subtitle'),
        location: val('c-location'),
        motto:    val('c-motto')
      },
      about: {
        eyebrow:      val('c-eyebrow'),
        lead:         val('c-lead'),
        text1:        val('c-text1'),
        text2:        val('c-text2'),
        stat_years:   val('c-stat-years'),
        stat_members: val('c-stat-members'),
        card1_title:  val('c-card1-title'),
        card1_text:   val('c-card1-text'),
        card2_title:  val('c-card2-title'),
        card2_text:   val('c-card2-text'),
        card3_title:  val('c-card3-title'),
        card3_text:   val('c-card3-text')
      },
      groups: {
        garde_desc:    val('c-garde'),
        elferrat_desc: val('c-elferrat'),
        prinzen_desc:  val('c-prinzen'),
        hexen_desc:    val('c-hexen')
      }
    };

    const res = await GH.putJSON('data/content.json', newContent, S.contentSha, 'Admin: Inhalte aktualisiert');
    S.content    = newContent;
    S.contentSha = res.content.sha;
    flash('✓ Gespeichert! Cloudflare Pages baut die Seite neu (~1 Min.)');
  } catch(err) {
    flash('Fehler: ' + err.message, 'error');
  } finally {
    S.saving = false;
    btn.textContent = orig; btn.disabled = false;
  }
}

// ══════════════════════════════════════════════════════════════
//  EVENTS
// ══════════════════════════════════════════════════════════════
function renderEvents() {
  const sorted = (S.events||[]).slice().sort((a,b) => a.date.localeCompare(b.date));
  const now = new Date();

  const rows = sorted.map(e => {
    const d    = new Date(e.date);
    const past = d < now;
    return `<tr class="${past?'row-past':''}">
      <td class="td-date">${String(d.getDate()).padStart(2,'0')}. ${MSHORT[d.getMonth()]} ${d.getFullYear()}</td>
      <td>
        ${esc(e.title)}
        ${e.featured ? '<span class="badge-featured">★</span>' : ''}
        ${past ? '<span class="badge-past">Vergangen</span>' : ''}
      </td>
      <td><span class="badge-type type-${esc(e.type)}">${esc(TYPE_LABELS[e.type]||e.type)}</span></td>
      <td style="color:var(--text-muted);font-size:.82rem">${esc(e.location||'—')}</td>
      <td><div class="td-actions">
        <button class="action-edit" onclick="editEvent(${e.id})">✏ Bearbeiten</button>
        <button class="action-del"  onclick="deleteEvent(${e.id})">✕ Löschen</button>
      </div></td>
    </tr>`;
  }).join('');

  document.getElementById('page-content').innerHTML = `
    <div class="page-actions">
      <button class="btn-add" onclick="editEvent(null)">＋ Termin hinzufügen</button>
    </div>
    <div class="table-card">
      <table class="admin-table">
        <thead><tr><th>Datum</th><th>Titel</th><th>Typ</th><th>Ort</th><th>Aktionen</th></tr></thead>
        <tbody>${rows || '<tr><td colspan="5" class="empty-hint" style="padding:28px;text-align:center">Noch keine Termine vorhanden</td></tr>'}</tbody>
      </table>
    </div>
  `;
}

function editEvent(id) {
  const e   = id != null ? (S.events||[]).find(ev => ev.id === id) : null;
  const isNew = !e;

  openModal(`
    <div class="modal-head">
      <h2>${isNew ? '＋ Termin hinzufügen' : '✏ Termin bearbeiten'}</h2>
      <button class="modal-close" onclick="closeModal()">✕</button>
    </div>
    <div class="modal-form">
      <div class="form-grid-2">
        <div class="form-group"><label>Datum *</label><input type="date" id="ev-date" value="${esc(e?.date||'')}"></div>
        <div class="form-group"><label>Uhrzeit</label><input type="text" id="ev-time" placeholder="20:00 Uhr" value="${esc(e?.time||'')}"></div>
      </div>
      <div class="form-group"><label>Titel *</label><input id="ev-title" value="${esc(e?.title||'')}" placeholder="z.B. Großer Faschingsball"></div>
      <div class="form-group"><label>Beschreibung</label><textarea id="ev-desc" rows="3" placeholder="Kurze Beschreibung…">${esc(e?.description||'')}</textarea></div>
      <div class="form-grid-2">
        <div class="form-group"><label>Ort</label><input id="ev-location" value="${esc(e?.location||'')}" placeholder="Kirchdorf an der Krems"></div>
        <div class="form-group">
          <label>Typ</label>
          <select id="ev-type">
            ${Object.entries(TYPE_LABELS).map(([v,l]) => `<option value="${v}"${e?.type===v?' selected':''}>${l}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="form-group">
        <label class="check-label">
          <input type="checkbox" id="ev-featured" ${e?.featured?'checked':''}>
          Als Featured markieren (wird groß auf der Seite hervorgehoben)
        </label>
      </div>
    </div>
    <div class="modal-actions">
      <button class="btn-cancel" onclick="closeModal()">Abbrechen</button>
      <button class="btn-save" onclick="saveEvent(${id!=null?id:'null'}, this)">Speichern</button>
    </div>
  `);
}

async function saveEvent(id, btn) {
  const date  = document.getElementById('ev-date').value;
  const title = document.getElementById('ev-title').value.trim();
  if (!date || !title) { flash('Datum und Titel sind Pflichtfelder.', 'error'); return; }

  const orig = btn.textContent;
  btn.textContent = 'Speichern…'; btn.disabled = true;

  try {
    const featured = document.getElementById('ev-featured').checked;
    const newEv = {
      id:          id != null ? id : Date.now(),
      date,
      time:        document.getElementById('ev-time').value.trim(),
      title,
      description: document.getElementById('ev-desc').value.trim(),
      location:    document.getElementById('ev-location').value.trim(),
      type:        document.getElementById('ev-type').value,
      featured
    };

    // Un-feature others when new one is featured
    let evList = (S.events||[]).slice();
    if (featured) evList = evList.map(e => ({...e, featured: false}));

    if (id != null) {
      S.events = evList.map(e => e.id === id ? newEv : e);
    } else {
      S.events = [...evList, newEv];
    }

    const res = await GH.putJSON('data/events.json', S.events, S.eventsSha,
      `Admin: Termin ${id != null ? 'bearbeitet' : 'hinzugefügt'} – ${title}`);
    S.eventsSha = res.content.sha;
    closeModal();
    flash('Termin gespeichert!');
    renderEvents();
  } catch(err) {
    flash('Fehler: ' + err.message, 'error');
    btn.textContent = orig; btn.disabled = false;
  }
}

async function deleteEvent(id) {
  const ev = (S.events||[]).find(e => e.id === id);
  if (!ev) return;
  if (!confirm(`Termin "${ev.title}" wirklich löschen?`)) return;

  try {
    S.events = S.events.filter(e => e.id !== id);
    const res = await GH.putJSON('data/events.json', S.events, S.eventsSha, `Admin: Termin gelöscht – ${ev.title}`);
    S.eventsSha = res.content.sha;
    flash('Termin gelöscht.');
    renderEvents();
  } catch(err) {
    flash('Fehler: ' + err.message, 'error');
  }
}

// ══════════════════════════════════════════════════════════════
//  GALLERY
// ══════════════════════════════════════════════════════════════
function renderGallery() {
  const thumbs = S.images.map(img => `
    <div class="gallery-manage-item">
      <img src="${rawUrl('images/gallery/'+img.name)}?v=${Date.now()}" alt="${esc(img.name)}" loading="lazy"
           onerror="this.style.display='none'">
      <div class="gallery-manage-overlay">
        <span class="gallery-img-name">${esc(img.name)}</span>
        <button class="gallery-del-btn" onclick="deleteGalleryImage('${esc(img.name)}','${esc(img.sha)}')">🗑 Löschen</button>
      </div>
    </div>`).join('');

  document.getElementById('page-content').innerHTML = `
    <!-- Logo -->
    <div class="form-card" style="margin-bottom:20px">
      <div class="form-card-title">Logo / Vereinswappen</div>
      <div class="logo-preview-wrap">
        <img class="logo-preview" id="logo-prev"
             src="${rawUrl('images/logo.png')}?v=${Date.now()}"
             alt="Logo" onerror="this.style.opacity='.2'">
        <div>
          <p style="font-size:.85rem;color:var(--text-muted);margin-bottom:14px">
            Empfohlen: PNG mit Transparenz, mind. 200×200 px
          </p>
          <label class="btn-add" style="cursor:pointer">
            📁 Logo hochladen
            <input type="file" accept="image/*" style="display:none" onchange="uploadLogo(this)">
          </label>
        </div>
      </div>
    </div>

    <!-- Upload -->
    <div class="form-card upload-card" style="margin-bottom:20px">
      <div class="form-card-title">Fotos hochladen</div>
      <div class="upload-drop" id="upload-drop">
        <input type="file" class="upload-input" id="gallery-input"
               accept="image/*" multiple onchange="handleGalleryUpload(this.files)">
        <div class="upload-drop-inner">
          <span class="upload-icon">📸</span>
          <p>Fotos hier hineinziehen oder klicken</p>
          <span class="upload-hint">JPG, PNG, WebP · Wird automatisch auf 1400 px optimiert</span>
        </div>
      </div>
      <div id="upload-preview" class="upload-preview"></div>
    </div>

    <!-- Existing -->
    <div class="form-card">
      <div class="form-card-title">Vorhandene Fotos (${S.images.length})</div>
      ${thumbs ? `<div class="gallery-manage-grid">${thumbs}</div>` : '<p class="empty-hint">Noch keine Fotos hochgeladen</p>'}
    </div>
  `;

  // Drag & drop
  const drop = document.getElementById('upload-drop');
  drop.addEventListener('dragover',  e => { e.preventDefault(); drop.classList.add('drag-over'); });
  drop.addEventListener('dragleave', () => drop.classList.remove('drag-over'));
  drop.addEventListener('drop', e => {
    e.preventDefault(); drop.classList.remove('drag-over');
    handleGalleryUpload(e.dataTransfer.files);
  });
}

async function uploadLogo(input) {
  const file = input.files[0];
  if (!file) return;
  showLoading('Logo wird hochgeladen…');
  try {
    const fr = new FileReader();
    fr.onload = async ev => {
      try {
        const base64 = ev.target.result.split(',')[1];
        const res = await GH.putBinary('images/logo.png', base64, S.logoSha, 'Admin: Logo aktualisiert');
        S.logoSha = res.content.sha;
        hideLoading();
        flash('Logo hochgeladen! Seite wird in ~1 Min. neu gebaut.');
        const prev = document.getElementById('logo-prev');
        if (prev) { prev.style.opacity = ''; prev.src = rawUrl('images/logo.png') + '?v=' + Date.now(); }
      } catch(err) { hideLoading(); flash('Fehler: ' + err.message, 'error'); }
    };
    fr.readAsDataURL(file);
  } catch(err) {
    hideLoading(); flash('Fehler: ' + err.message, 'error');
  }
}

async function handleGalleryUpload(files) {
  if (!files || !files.length) return;
  const arr = Array.from(files).filter(f => f.type.startsWith('image/'));
  if (!arr.length) return;

  const preview = document.getElementById('upload-preview');
  if (!preview) return;

  // Show placeholders
  preview.innerHTML = arr.map(f =>
    `<div class="upload-thumb" id="uth-${safeName(f.name)}">
      <div style="width:100%;aspect-ratio:1;background:var(--input-bg);border-radius:5px;display:flex;align-items:center;justify-content:center;font-size:1.5rem">⏳</div>
      <span>${esc(f.name)}</span>
    </div>`
  ).join('');

  let uploaded = 0;
  for (const file of arr) {
    const fname = safeName(file.name);
    const thumbEl = document.getElementById('uth-' + fname);
    try {
      const base64 = await resizeImage(file, 1400);
      const existSha = await GH.getFileSha(`images/gallery/${fname}`);
      const res = await GH.putBinary(`images/gallery/${fname}`, base64, existSha,
        `Admin: Galerie-Foto hochgeladen – ${fname}`);

      // Update state
      S.images = S.images.filter(i => i.name !== fname);
      S.images.push({ name: fname, sha: res.content.sha });

      // Update gallery.json
      S.gallery = S.gallery || [];
      if (!S.gallery.find(g => g.filename === fname)) S.gallery.push({ filename: fname, title: '' });
      const gjRes = await GH.putJSON('data/gallery.json', S.gallery, S.gallerySha, 'Admin: Galerie aktualisiert');
      S.gallerySha = gjRes.content.sha;

      uploaded++;
      if (thumbEl) thumbEl.innerHTML = `
        <img src="${rawUrl('images/gallery/'+fname)}?v=${Date.now()}" alt="${esc(fname)}" style="border-radius:5px;width:100%;aspect-ratio:1;object-fit:cover">
        <span style="color:#6adf7a">✓ ${esc(fname)}</span>`;
    } catch(err) {
      if (thumbEl) thumbEl.innerHTML = `
        <div style="background:rgba(200,30,30,.2);width:100%;aspect-ratio:1;border-radius:5px;display:flex;align-items:center;justify-content:center;font-size:.8rem;color:#ff8888">Fehler</div>
        <span style="color:#ff8888">${esc(fname)}</span>`;
      flash(`Fehler bei ${fname}: ${err.message}`, 'error');
    }
  }

  if (uploaded > 0) {
    flash(`${uploaded} Foto${uploaded>1?'s':''} hochgeladen! Seite wird neu gebaut.`);
    // Refresh grid after short delay
    setTimeout(renderGallery, 500);
  }
}

async function deleteGalleryImage(name, sha) {
  if (!confirm(`Foto "${name}" wirklich löschen?`)) return;
  showLoading('Foto wird gelöscht…');
  try {
    await GH.deleteFile(`images/gallery/${name}`, sha, `Admin: Galerie-Foto gelöscht – ${name}`);
    S.images  = S.images.filter(i => i.name !== name);
    S.gallery = (S.gallery||[]).filter(g => g.filename !== name);
    const res = await GH.putJSON('data/gallery.json', S.gallery, S.gallerySha, 'Admin: Galerie aktualisiert');
    S.gallerySha = res.content.sha;
    hideLoading();
    flash('Foto gelöscht.');
    renderGallery();
  } catch(err) {
    hideLoading();
    flash('Fehler: ' + err.message, 'error');
  }
}

// ══════════════════════════════════════════════════════════════
//  SETTINGS
// ══════════════════════════════════════════════════════════════
function renderSettings() {
  const c   = S.settings?.contact || {};
  const soc = S.settings?.social  || {};
  const g   = S.settings?.general || {};

  document.getElementById('page-content').innerHTML = `
    <div class="tabs">
      <button class="tab active" data-tab="contact">Kontakt</button>
      <button class="tab" data-tab="social">Social Media</button>
      <button class="tab" data-tab="general">Allgemein</button>
    </div>

    <!-- Kontakt -->
    <div class="tab-panel active" id="tab-contact">
      <div class="form-card">
        <div class="form-card-title">Kontaktdaten</div>
        <div class="form-group"><label>Vereinsname (für Adresse)</label><input id="s-addr-name" value="${esc(c.address_name)}"></div>
        <div class="form-grid-2">
          <div class="form-group"><label>Straße &amp; Hausnummer</label><input id="s-addr-street" value="${esc(c.address_street)}"></div>
          <div class="form-group"><label>PLZ &amp; Ort</label><input id="s-addr-city" value="${esc(c.address_city)}"></div>
        </div>
        <div class="form-grid-2">
          <div class="form-group"><label>Land</label><input id="s-addr-country" value="${esc(c.address_country)}"></div>
          <div class="form-group"><label>E-Mail-Adresse</label><input type="email" id="s-email" value="${esc(c.email)}"></div>
        </div>
        <div class="form-group"><label>Website</label><input id="s-website" value="${esc(c.website)}" placeholder="www.nazu-mido.at"></div>
        <div class="form-actions"><button class="btn-save" onclick="saveSettings(this)">Speichern &amp; Veröffentlichen</button></div>
      </div>
    </div>

    <!-- Social -->
    <div class="tab-panel" id="tab-social">
      <div class="form-card">
        <div class="form-card-title">Social Media Links</div>
        <p class="form-note" style="margin-bottom:18px">Vollständige URL eingeben. Leer lassen = nicht anzeigen.</p>
        <div class="form-group">
          <label>Facebook</label>
          <input id="s-facebook" value="${esc(soc.facebook==='#'?'':soc.facebook)}" placeholder="https://www.facebook.com/nazumido">
        </div>
        <div class="form-group">
          <label>Instagram</label>
          <input id="s-instagram" value="${esc(soc.instagram==='#'?'':soc.instagram)}" placeholder="https://www.instagram.com/nazumido">
        </div>
        <div class="form-actions"><button class="btn-save" onclick="saveSettings(this)">Speichern &amp; Veröffentlichen</button></div>
      </div>
    </div>

    <!-- Allgemein -->
    <div class="tab-panel" id="tab-general">
      <div class="form-card">
        <div class="form-card-title">Allgemeine Informationen</div>
        <div class="form-grid-3">
          <div class="form-group"><label>Saison (z.B. "2026/2027")</label><input id="s-season" value="${esc(g.season)}"></div>
          <div class="form-group"><label>Gegründet (Jahr)</label><input id="s-founded" value="${esc(g.founded)}"></div>
          <div class="form-group"><label>Mitglieder (z.B. "100+")</label><input id="s-members" value="${esc(g.members)}"></div>
        </div>
        <div class="form-actions"><button class="btn-save" onclick="saveSettings(this)">Speichern &amp; Veröffentlichen</button></div>
      </div>
    </div>
  `;
  initTabs();
}

async function saveSettings(btn) {
  if (S.saving) return;
  S.saving = true;
  const orig = btn.textContent;
  btn.textContent = 'Speichern…'; btn.disabled = true;

  const val = id => document.getElementById(id)?.value?.trim() ?? '';

  try {
    const fb = val('s-facebook');
    const ig = val('s-instagram');
    const newSettings = {
      contact: {
        address_name:    val('s-addr-name'),
        address_street:  val('s-addr-street'),
        address_city:    val('s-addr-city'),
        address_country: val('s-addr-country'),
        email:           val('s-email'),
        website:         val('s-website')
      },
      social: {
        facebook:  fb || '#',
        instagram: ig || '#'
      },
      general: {
        season:  val('s-season'),
        founded: val('s-founded'),
        members: val('s-members')
      }
    };

    const res = await GH.putJSON('data/settings.json', newSettings, S.settingsSha, 'Admin: Einstellungen aktualisiert');
    S.settings    = newSettings;
    S.settingsSha = res.content.sha;
    flash('Einstellungen gespeichert! Seite wird neu gebaut.');
  } catch(err) {
    flash('Fehler: ' + err.message, 'error');
  } finally {
    S.saving = false;
    btn.textContent = orig; btn.disabled = false;
  }
}

// ══════════════════════════════════════════════════════════════
//  INIT
// ══════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  // Burger menu
  document.getElementById('burger-btn').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('open');
  });
  document.getElementById('sidebar-close').addEventListener('click', () => {
    document.getElementById('sidebar').classList.remove('open');
  });

  // Close modal on overlay click
  document.getElementById('modal-overlay').addEventListener('click', e => {
    if (e.target.id === 'modal-overlay') closeModal();
  });

  // Escape key closes modal
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModal();
  });

  // Check for existing session
  const saved = sessionStorage.getItem('gh_token');
  if (saved) {
    S.token = saved;
    bootApp();
  } else {
    initLogin();
  }
});
