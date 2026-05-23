/* ============================================================
   NazuMido Admin – SPA (Cloudflare KV + Pages Functions)
   Auth: email + password → session token stored in sessionStorage
   ============================================================ */
'use strict';

// ── State ───────────────────────────────────────────────────
const S = {
  token:   null,
  user:    null,
  saving:  false,
  page:    'dashboard',
  // Cached data
  content:  null,  events:   null,
  settings: null,  gallery:  null,
};

// ── API client ───────────────────────────────────────────────
const API = {
  _h() {
    const h = { 'Content-Type': 'application/json' };
    if (S.token) h['Authorization'] = `Bearer ${S.token}`;
    return h;
  },
  async call(method, action, body = null, params = {}) {
    const url = new URL('/api/admin', location.origin);
    url.searchParams.set('action', action);
    Object.entries(params).forEach(([k,v]) => url.searchParams.set(k, v));
    const opts = { method, headers: this._h() };
    if (body) opts.body = JSON.stringify(body);
    const r    = await fetch(url, opts);
    const data = await r.json().catch(() => ({ error: `HTTP ${r.status}` }));
    if (!r.ok) throw new Error(data.error || `HTTP ${r.status}`);
    return data;
  },
  get:    (a, p)    => API.call('GET',    a, null, p),
  post:   (a, b, p) => API.call('POST',   a, b,    p),
  put:    (a, b, p) => API.call('PUT',    a, b,    p),
  delete: (a, p)    => API.call('DELETE', a, null, p),

  async uploadPhoto(eventId, file) {
    const form = new FormData();
    form.append('photos', file);
    const url  = `/api/admin?action=upload_photo&event=${encodeURIComponent(eventId)}`;
    const r    = await fetch(url, { method: 'POST', headers: { 'Authorization': `Bearer ${S.token}` }, body: form });
    const data = await r.json().catch(() => ({ error: `HTTP ${r.status}` }));
    if (!r.ok) throw new Error(data.error || `HTTP ${r.status}`);
    return data;
  }
};

// ── Member API client ────────────────────────────────────────
const MAPI = {
  _h() {
    const h = { 'Content-Type': 'application/json' };
    if (S.token) h['Authorization'] = `Bearer ${S.token}`;
    return h;
  },
  async call(method, action, body = null, params = {}) {
    const url = new URL('/api/admin', location.origin);
    url.searchParams.set('action', action);
    Object.entries(params).forEach(([k,v]) => url.searchParams.set(k, v));
    const opts = { method, headers: this._h() };
    if (body) opts.body = JSON.stringify(body);
    const r    = await fetch(url, opts);
    const data = await r.json().catch(() => ({ error: `HTTP ${r.status}` }));
    if (!r.ok) throw new Error(data.error || `HTTP ${r.status}`);
    return data;
  }
};

// ── UI helpers ────────────────────────────────────────────────
let _flashTimer;
function flash(msg, type = 'success') {
  const area = document.getElementById('flash-area');
  if (!area) return;
  area.innerHTML = `<div class="flash flash-${type}"><span>${type==='success'?'✓':'✕'}</span> ${msg}</div>`;
  clearTimeout(_flashTimer);
  if (type !== 'error') _flashTimer = setTimeout(() => { area.innerHTML = ''; }, 4500);
}
function showLoading(msg = 'Wird geladen…') {
  document.getElementById('loading-msg').textContent = msg;
  document.getElementById('loading-overlay').style.display = 'flex';
}
function hideLoading() { document.getElementById('loading-overlay').style.display = 'none'; }
function openModal(html) {
  document.getElementById('modal-body').innerHTML = html;
  document.getElementById('modal-overlay').style.display = 'flex';
  document.body.style.overflow = 'hidden';
  setTimeout(() => { document.querySelector('#modal-body input, #modal-body textarea, #modal-body select')?.focus(); }, 50);
}
function closeModal() {
  document.getElementById('modal-overlay').style.display = 'none';
  document.body.style.overflow = '';
}
function initTabs() {
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', function() {
      const t = this.dataset.tab;
      document.querySelectorAll('.tab').forEach(x => x.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(x => x.classList.remove('active'));
      this.classList.add('active');
      document.getElementById('tab-' + t)?.classList.add('active');
    });
  });
}
function esc(v) {
  if (v == null) return '';
  return String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function can(perm) { return S.user?.isOwner || S.user?.permissions?.[perm]; }

// ── Auth ──────────────────────────────────────────────────────
function initSetupForm() {
  document.getElementById('setup-form').addEventListener('submit', async e => {
    e.preventDefault();
    const btn = document.getElementById('setup-btn');
    const err = document.getElementById('setup-error');
    btn.textContent = 'Erstelle Account…'; btn.disabled = true; err.style.display = 'none';
    try {
      await fetch('/api/admin?action=setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminKey: document.getElementById('setup-key').value.trim(),
          name:     document.getElementById('setup-name').value.trim(),
          email:    document.getElementById('setup-email').value.trim(),
          password: document.getElementById('setup-pw').value,
        })
      }).then(async r => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || `HTTP ${r.status}`);
      });
      document.getElementById('setup-screen').style.display = 'none';
      document.getElementById('login-screen').style.display = 'flex';
      flash('Account erstellt! Jetzt anmelden.');
    } catch(ex) {
      err.textContent = ex.message; err.style.display = 'block';
    } finally { btn.textContent = 'Account erstellen'; btn.disabled = false; }
  });
}

function initLoginForm() {
  document.getElementById('pw-toggle').addEventListener('click', () => {
    const inp = document.getElementById('login-pw');
    inp.type = inp.type === 'password' ? 'text' : 'password';
  });

  document.getElementById('login-form').addEventListener('submit', async e => {
    e.preventDefault();
    const btn = document.getElementById('login-btn');
    const err = document.getElementById('login-error');
    btn.textContent = 'Anmelden…'; btn.disabled = true; err.style.display = 'none';
    try {
      const { token, user } = await fetch('/api/admin?action=login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email:    document.getElementById('login-email').value.trim(),
          password: document.getElementById('login-pw').value,
        })
      }).then(async r => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || `HTTP ${r.status}`);
        return d;
      });
      S.token = token;
      S.user  = user;
      sessionStorage.setItem('nz_admin_token', token);
      bootApp();
    } catch(ex) {
      err.textContent = ex.message; err.style.display = 'block';
      btn.textContent = 'Anmelden'; btn.disabled = false;
    }
  });
}

async function checkSession() {
  const token = sessionStorage.getItem('nz_admin_token');
  if (!token) return false;
  S.token = token;
  try {
    const { user } = await API.get('check');
    S.user = user;
    return true;
  } catch { S.token = null; sessionStorage.removeItem('nz_admin_token'); return false; }
}

async function checkSetupNeeded() {
  try {
    const r = await fetch('/api/admin?action=setup', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({}) });
    const d = await r.json();
    return r.status !== 409; // 409 = already set up
  } catch { return false; }
}

async function bootApp() {
  document.getElementById('login-screen').style.display  = 'none';
  document.getElementById('setup-screen').style.display  = 'none';
  document.getElementById('admin-app').style.display     = 'flex';
  document.getElementById('header-name').textContent     = S.user.name;
  document.getElementById('header-avatar').textContent   = S.user.name[0].toUpperCase();

  // Show/hide nav items based on permissions
  if (can('users'))   { document.getElementById('nav-users').style.display   = ''; document.getElementById('team-nav').style.display = ''; }
  if (can('members')) { document.getElementById('nav-members').style.display = ''; document.getElementById('team-nav').style.display = ''; }

  showLoading('Daten werden geladen…');
  try {
    const [c, ev, st] = await Promise.all([
      API.get('content'), API.get('events'), API.get('settings')
    ]);
    S.content  = c.data  || null;
    S.events   = ev.data || [];
    S.settings = st.data || null;
    try { const g = await API.get('gallery'); S.gallery = g.data || []; } catch { S.gallery = []; }
  } catch(ex) { flash('Fehler beim Laden: ' + ex.message, 'error'); }
  hideLoading();
  navigate('dashboard');
}

async function doLogout() {
  if (!confirm('Wirklich abmelden?')) return;
  try { await API.post('logout'); } catch {}
  S.token = null; S.user = null;
  sessionStorage.removeItem('nz_admin_token');
  document.getElementById('admin-app').style.display = 'none';
  document.getElementById('login-screen').style.display = 'flex';
}

// ── Router ───────────────────────────────────────────────────
const PAGE_TITLES = { dashboard:'Dashboard', content:'Texte & Inhalte', events:'Veranstaltungen', gallery:'Galerie', settings:'Einstellungen', users:'Benutzer', members:'Mitglieder', myaccount:'Mein Account' };
function navigate(page) {
  S.page = page;
  document.querySelectorAll('.nav-item[data-page]').forEach(el => el.classList.toggle('active', el.dataset.page === page));
  document.getElementById('header-title').textContent = PAGE_TITLES[page] || page;
  document.getElementById('sidebar').classList.remove('open');
  ({ dashboard:renderDashboard, content:renderContent, events:renderEvents, gallery:renderGallery, settings:renderSettings, users:renderUsers, members:renderMembers, myaccount:renderMyAccount }[page] || (() => {}))();
}

// ══════════════════════════════════════════════════════════════
//  DASHBOARD
// ══════════════════════════════════════════════════════════════
const MS = ['Jan','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez'];
const ML = ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];
const TL = { highlight:'Highlight', ball:'Ball', familie:'Familie', abschluss:'Finale', sonstig:'Event' };

function renderDashboard() {
  const now = new Date();
  const up  = (S.events||[]).filter(e => new Date(e.date) >= now).sort((a,b) => a.date.localeCompare(b.date));
  const next = up[0];
  const nextHtml = next ? (() => {
    const d = new Date(next.date);
    return `<div class="next-event"><div class="next-event-date">${String(d.getDate()).padStart(2,'0')}<small>${ML[d.getMonth()]}</small></div><div class="next-event-info"><strong>${esc(next.title)}</strong><span>${esc(next.time||'')}${next.location?' · '+esc(next.location):''}</span></div></div>`;
  })() : '<p class="empty-hint">Keine bevorstehenden Termine</p>';

  const rows = (S.events||[]).slice().sort((a,b)=>a.date.localeCompare(b.date)).slice(0,5).map(e=>{
    const d = new Date(e.date);
    return `<tr class="${d<now?'row-past':''}"><td class="td-date">${String(d.getDate()).padStart(2,'0')}. ${MS[d.getMonth()]} ${d.getFullYear()}</td><td>${esc(e.title)}</td><td><span class="badge-type type-${esc(e.type)}">${esc(TL[e.type]||e.type)}</span></td></tr>`;
  }).join('');

  document.getElementById('page-content').innerHTML = `
    <div class="dashboard-grid">
      <div class="stat-card"><span class="stat-icon">📅</span><div><div class="stat-number">${(S.events||[]).length}</div><div class="stat-label">Termine</div></div></div>
      <div class="stat-card"><span class="stat-icon">⏭️</span><div><div class="stat-number">${up.length}</div><div class="stat-label">Bevorstehend</div></div></div>
      <div class="stat-card"><span class="stat-icon">🤝</span><div><div class="stat-number" id="dash-members">—</div><div class="stat-label">Mitglieder</div></div></div>
      <div class="stat-card"><span class="stat-icon">👤</span><div><div class="stat-number" id="dash-users">—</div><div class="stat-label">Admin-Nutzer</div></div></div>
    </div>
    <div class="dashboard-row">
      <div class="dash-card"><div class="dash-card-head"><h2>Nächster Termin</h2><a class="btn-sm-link" href="#" onclick="navigate('events');return false;">Alle →</a></div>${nextHtml}</div>
      <div class="dash-card"><div class="dash-card-head"><h2>Schnellzugriff</h2></div><div class="quick-actions">
        <button class="quick-btn" onclick="navigate('events')"><span>＋</span> Termin hinzufügen</button>
        <button class="quick-btn" onclick="navigate('gallery')"><span>📷</span> Foto hochladen</button>
        <button class="quick-btn" onclick="navigate('content')"><span>✏️</span> Texte bearbeiten</button>
        <button class="quick-btn" onclick="navigate('settings')"><span>⚙️</span> Einstellungen</button>
      </div></div>
    </div>
    <div class="dashboard-row" style="margin-top:18px">
      <div class="dash-card"><div class="dash-card-head"><h2>Termine (nächste 5)</h2><a class="btn-sm-link" href="#" onclick="navigate('events');return false;">Alle bearbeiten →</a></div>
        ${rows?`<table class="admin-table"><thead><tr><th>Datum</th><th>Titel</th><th>Typ</th></tr></thead><tbody>${rows}</tbody></table>`:'<p class="empty-hint">Noch keine Termine</p>'}
      </div>
    </div>`;

  // Load counts async
  if (can('users'))   API.get('users').then(d => { const el=document.getElementById('dash-users'); if(el) el.textContent=(d.users||[]).length; }).catch(()=>{});
  if (can('members')) API.get('members').then(d => { const el=document.getElementById('dash-members'); if(el) el.textContent=(d.members||[]).length; }).catch(()=>{});
}

// ══════════════════════════════════════════════════════════════
//  CONTENT
// ══════════════════════════════════════════════════════════════
function renderContent() {
  const h = S.content?.hero||{}, a = S.content?.about||{}, g = S.content?.groups||{};
  document.getElementById('page-content').innerHTML = `
    <div class="tabs">
      <button class="tab active" data-tab="hero">Hero</button>
      <button class="tab" data-tab="about">Über uns</button>
      <button class="tab" data-tab="groups">Gruppen</button>
    </div>
    <div class="tab-panel active" id="tab-hero"><div class="form-card"><div class="form-card-title">Hero-Bereich</div>
      <div class="form-grid-2"><div class="form-group"><label>Vortext</label><input id="c-pretext" value="${esc(h.pretext)}"></div><div class="form-group"><label>Standort</label><input id="c-location" value="${esc(h.location)}"></div></div>
      <div class="form-grid-2"><div class="form-group"><label>Titel</label><input id="c-title" value="${esc(h.title)}"></div><div class="form-group"><label>Untertitel</label><input id="c-subtitle" value="${esc(h.subtitle)}"></div></div>
      <div class="form-group"><label>Motto</label><input id="c-motto" value="${esc(h.motto)}"></div>
      <div class="form-actions"><button class="btn-save" onclick="saveContent(this)">Speichern &amp; Live schalten</button></div>
    </div></div>
    <div class="tab-panel" id="tab-about"><div class="form-card"><div class="form-card-title">Über uns</div>
      <div class="form-group"><label>Eyebrow</label><input id="c-eyebrow" value="${esc(a.eyebrow)}"></div>
      <div class="form-group"><label>Lead (HTML)</label><textarea id="c-lead" rows="3">${esc(a.lead)}</textarea></div>
      <div class="form-group"><label>Absatz 1</label><textarea id="c-text1" rows="3">${esc(a.text1)}</textarea></div>
      <div class="form-group"><label>Absatz 2 (HTML)</label><textarea id="c-text2" rows="3">${esc(a.text2)}</textarea></div>
      <div class="form-grid-2"><div class="form-group"><label>Stat: Jahre</label><input id="c-stat-years" value="${esc(a.stat_years)}"></div><div class="form-group"><label>Stat: Mitglieder</label><input id="c-stat-members" value="${esc(a.stat_members)}"></div></div>
    </div><div class="form-card"><div class="form-card-title">Info-Karten</div>
      <div class="form-grid-3"><div class="form-group"><label>Karte 1 Titel</label><input id="c-card1-title" value="${esc(a.card1_title)}"></div><div class="form-group"><label>Karte 2 Titel</label><input id="c-card2-title" value="${esc(a.card2_title)}"></div><div class="form-group"><label>Karte 3 Titel</label><input id="c-card3-title" value="${esc(a.card3_title)}"></div></div>
      <div class="form-group"><label>Karte 1 Text</label><textarea id="c-card1-text" rows="2">${esc(a.card1_text)}</textarea></div>
      <div class="form-group"><label>Karte 2 Text</label><textarea id="c-card2-text" rows="2">${esc(a.card2_text)}</textarea></div>
      <div class="form-group"><label>Karte 3 Text</label><textarea id="c-card3-text" rows="2">${esc(a.card3_text)}</textarea></div>
      <div class="form-actions"><button class="btn-save" onclick="saveContent(this)">Speichern &amp; Live schalten</button></div>
    </div></div>
    <div class="tab-panel" id="tab-groups"><div class="form-card"><div class="form-card-title">Gruppen</div>
      <div class="form-group"><label>🩰 Garde</label><textarea id="c-garde" rows="3">${esc(g.garde_desc)}</textarea></div>
      <div class="form-group"><label>👑 Elferrat</label><textarea id="c-elferrat" rows="3">${esc(g.elferrat_desc)}</textarea></div>
      <div class="form-group"><label>💑 Prinzenpaar</label><textarea id="c-prinzen" rows="3">${esc(g.prinzen_desc)}</textarea></div>
      <div class="form-group"><label>🧙 Hexen</label><textarea id="c-hexen" rows="3">${esc(g.hexen_desc)}</textarea></div>
      <div class="form-actions"><button class="btn-save" onclick="saveContent(this)">Speichern &amp; Live schalten</button></div>
    </div></div>`;
  initTabs();
}

async function saveContent(btn) {
  if (S.saving) return; S.saving = true;
  const o = btn.textContent; btn.textContent = 'Speichern…'; btn.disabled = true;
  const v = id => document.getElementById(id)?.value ?? '';
  try {
    const data = {
      hero:   { pretext:v('c-pretext'), title:v('c-title'), subtitle:v('c-subtitle'), location:v('c-location'), motto:v('c-motto') },
      about:  { eyebrow:v('c-eyebrow'), lead:v('c-lead'), text1:v('c-text1'), text2:v('c-text2'), stat_years:v('c-stat-years'), stat_members:v('c-stat-members'), card1_title:v('c-card1-title'), card1_text:v('c-card1-text'), card2_title:v('c-card2-title'), card2_text:v('c-card2-text'), card3_title:v('c-card3-title'), card3_text:v('c-card3-text') },
      groups: { garde_desc:v('c-garde'), elferrat_desc:v('c-elferrat'), prinzen_desc:v('c-prinzen'), hexen_desc:v('c-hexen') }
    };
    await API.put('content', data);
    S.content = data;
    flash('Inhalte gespeichert! Sofort live.');
  } catch(ex) { flash('Fehler: ' + ex.message, 'error'); }
  finally { S.saving=false; btn.textContent=o; btn.disabled=false; }
}

// ══════════════════════════════════════════════════════════════
//  EVENTS
// ══════════════════════════════════════════════════════════════
function renderEvents() {
  const now = new Date();
  const rows = (S.events||[]).slice().sort((a,b)=>a.date.localeCompare(b.date)).map(e => {
    const d = new Date(e.date);
    return `<tr class="${d<now?'row-past':''}">
      <td class="td-date">${String(d.getDate()).padStart(2,'0')}. ${MS[d.getMonth()]} ${d.getFullYear()}</td>
      <td>${esc(e.title)}${e.featured?'<span class="badge-featured">★</span>':''}</td>
      <td><span class="badge-type type-${esc(e.type)}">${esc(TL[e.type]||e.type)}</span></td>
      <td style="color:var(--text-muted);font-size:.82rem">${esc(e.location||'—')}</td>
      <td><div class="td-actions">
        <button class="action-edit" onclick="editEvent(${e.id})">✏ Bearbeiten</button>
        <button class="action-edit" style="color:#88aaff;border-color:rgba(136,170,255,.3)" onclick="managePhotos(${e.id},'${esc(e.title)}')">📷 Fotos</button>
        <button class="action-del" onclick="deleteEvent(${e.id})">✕</button>
      </div></td>
    </tr>`;
  }).join('');

  document.getElementById('page-content').innerHTML = `
    <div class="page-actions"><button class="btn-add" onclick="editEvent(null)">＋ Termin hinzufügen</button></div>
    <div class="table-card"><table class="admin-table">
      <thead><tr><th>Datum</th><th>Titel</th><th>Typ</th><th>Ort</th><th>Aktionen</th></tr></thead>
      <tbody>${rows||'<tr><td colspan="5" class="empty-hint" style="padding:28px;text-align:center">Keine Termine</td></tr>'}</tbody>
    </table></div>`;
}

function editEvent(id) {
  const e = id!=null ? (S.events||[]).find(x=>x.id===id) : null;
  openModal(`
    <div class="modal-head"><h2>${e?'✏ Bearbeiten':'＋ Neuer Termin'}</h2><button class="modal-close" onclick="closeModal()">✕</button></div>
    <div class="modal-form">
      <div class="form-grid-2">
        <div class="form-group"><label>Datum *</label><input type="date" id="ev-date" value="${esc(e?.date||'')}"></div>
        <div class="form-group"><label>Uhrzeit</label><input id="ev-time" placeholder="20:00 Uhr" value="${esc(e?.time||'')}"></div>
      </div>
      <div class="form-group"><label>Titel *</label><input id="ev-title" value="${esc(e?.title||'')}"></div>
      <div class="form-group"><label>Beschreibung</label><textarea id="ev-desc" rows="3">${esc(e?.description||'')}</textarea></div>
      <div class="form-grid-2">
        <div class="form-group"><label>Ort</label><input id="ev-location" value="${esc(e?.location||'')}"></div>
        <div class="form-group"><label>Typ</label><select id="ev-type">
          ${Object.entries(TL).map(([v,l])=>`<option value="${v}"${e?.type===v?' selected':''}>${l}</option>`).join('')}
        </select></div>
      </div>
      <div class="form-group"><label class="check-label"><input type="checkbox" id="ev-featured" ${e?.featured?'checked':''}> Als Featured markieren (großes Bild auf Startseite)</label></div>
    </div>
    <div class="modal-actions">
      <button class="btn-cancel" onclick="closeModal()">Abbrechen</button>
      <button class="btn-save" onclick="saveEvent(${id!=null?id:'null'},this)">Speichern</button>
    </div>`);
}

async function saveEvent(id, btn) {
  const date  = document.getElementById('ev-date').value;
  const title = document.getElementById('ev-title').value.trim();
  if (!date||!title) { flash('Datum und Titel erforderlich','error'); return; }
  const o = btn.textContent; btn.textContent='Speichern…'; btn.disabled=true;
  try {
    const featured = document.getElementById('ev-featured').checked;
    const newEv = { id: id!=null?id:Date.now(), date, time:document.getElementById('ev-time').value.trim(), title, description:document.getElementById('ev-desc').value.trim(), location:document.getElementById('ev-location').value.trim(), type:document.getElementById('ev-type').value, featured };
    let list = (S.events||[]).slice();
    if (featured) list = list.map(e=>({...e,featured:false}));
    S.events = id!=null ? list.map(e=>e.id===id?newEv:e) : [...list, newEv];
    await API.put('events', S.events);
    closeModal(); flash('Termin gespeichert!'); renderEvents();
  } catch(ex) { flash('Fehler: '+ex.message,'error'); btn.textContent=o; btn.disabled=false; }
}

async function deleteEvent(id) {
  const ev = (S.events||[]).find(e=>e.id===id);
  if (!ev||!confirm(`"${ev.title}" löschen?`)) return;
  try {
    S.events = S.events.filter(e=>e.id!==id);
    await API.put('events', S.events);
    flash('Termin gelöscht.'); renderEvents();
  } catch(ex) { flash('Fehler: '+ex.message,'error'); }
}

// ── Event photo management ────────────────────────────────────
async function managePhotos(eventId, title) {
  if (!can('gallery')) { flash('Keine Berechtigung','error'); return; }
  showLoading('Fotos laden…');
  let photos = [], previews = [];
  try {
    const r = await API.get('event_photos', { event: eventId });
    photos   = r.photos   || [];
    previews = r.previews || [];
  } catch {}
  hideLoading();

  const previewNames = new Set(previews.map(p => p.filename));
  const thumbs = photos.map(p => `
    <div class="photo-item ${previewNames.has(p.filename)?'is-preview':''}" id="ph-${esc(p.filename)}" data-fn="${esc(p.filename)}">
      <img src="/api/admin?action=sign_download&event=${eventId}&file=${encodeURIComponent(p.filename)}" alt="${esc(p.filename)}" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 1 1%22/>'">
      ${previewNames.has(p.filename)?'<span class="photo-preview-badge">Preview</span>':''}
      <div class="photo-item-overlay">
        <span style="font-size:.7rem;color:white;word-break:break-all">${esc(p.filename)}</span>
        <button class="photo-del" onclick="deleteEventPhoto(${eventId},'${esc(p.filename)}')">Löschen</button>
      </div>
    </div>`).join('');

  openModal(`
    <div class="modal-head"><h2>📷 Fotos – ${esc(title)}</h2><button class="modal-close" onclick="closeModal()">✕</button></div>
    <div class="modal-form">
      <p style="font-size:.82rem;color:var(--text-muted);margin-bottom:14px">Klicke auf ein Foto um es als Vorschau (max. 3) zu markieren. Vorschaubilder sind auch ohne Login sichtbar.</p>
      <label class="btn-add" style="cursor:pointer;margin-bottom:16px;display:inline-flex">
        📤 Fotos hochladen
        <input type="file" accept="image/*" multiple style="display:none" onchange="uploadEventPhotos(${eventId},this)">
      </label>
      <div class="photo-grid" id="photo-grid">${thumbs||'<p class="empty-hint">Noch keine Fotos hochgeladen</p>'}</div>
    </div>
    <div class="modal-actions">
      <button class="btn-cancel" onclick="closeModal()">Schließen</button>
      <button class="btn-save" onclick="savePreviewPhotos(${eventId})">Vorschau speichern</button>
    </div>`);

  // Toggle preview on click
  document.querySelectorAll('.photo-item').forEach(el => {
    el.addEventListener('click', e => {
      if (e.target.tagName === 'BUTTON') return;
      const selected = document.querySelectorAll('.photo-item.is-preview');
      if (!el.classList.contains('is-preview') && selected.length >= 3) {
        flash('Maximal 3 Vorschaubilder', 'error'); return;
      }
      el.classList.toggle('is-preview');
      const badge = el.querySelector('.photo-preview-badge');
      if (el.classList.contains('is-preview')) {
        if (!badge) el.insertAdjacentHTML('afterbegin', '<span class="photo-preview-badge">Preview</span>');
      } else { badge?.remove(); }
    });
  });
}

async function uploadEventPhotos(eventId, input) {
  const files = Array.from(input.files || []);
  if (!files.length) return;
  showLoading(`${files.length} Foto(s) werden hochgeladen…`);
  let done = 0;
  for (const file of files) {
    try {
      await API.uploadPhoto(eventId, file);
      done++;
    } catch(ex) { flash(`Fehler bei ${file.name}: ${ex.message}`, 'error'); }
  }
  hideLoading();
  if (done > 0) { flash(`${done} Foto(s) hochgeladen!`); closeModal(); }
}

async function deleteEventPhoto(eventId, filename) {
  if (!confirm(`"${filename}" löschen?`)) return;
  try {
    await API.delete('delete_photo', { event: eventId, file: filename });
    document.getElementById(`ph-${filename}`)?.remove();
    flash('Foto gelöscht.');
  } catch(ex) { flash('Fehler: ' + ex.message, 'error'); }
}

async function savePreviewPhotos(eventId) {
  const selected = Array.from(document.querySelectorAll('.photo-item.is-preview')).map(el => ({ filename: el.dataset.fn, base64: null }));
  try {
    await API.put('preview_photos', { previews: selected }, { event: eventId });
    closeModal(); flash('Vorschaubilder gesetzt!');
  } catch(ex) { flash('Fehler: ' + ex.message, 'error'); }
}

// ══════════════════════════════════════════════════════════════
//  GALLERY (homepage decorative photos via GitHub API)
// ══════════════════════════════════════════════════════════════
function renderGallery() {
  const items = (S.gallery||[]);
  const grid  = items.map((img,i) => `
    <div class="gallery-manage-item">
      <img src="../images/gallery/${esc(img.filename)}" alt="${esc(img.filename)}" loading="lazy" onerror="this.style.opacity='.2'">
      <div class="gallery-manage-overlay">
        <span class="gallery-img-name">${esc(img.filename)}</span>
        <div class="form-group" style="margin:4px 0"><input class="gal-title-inp" data-fn="${esc(img.filename)}" value="${esc(img.title||'')}" placeholder="Bildbeschriftung" style="font-size:.75rem;padding:5px 8px"></div>
        <button class="gallery-del-btn" onclick="deleteGalleryItem('${esc(img.filename)}')">🗑 Entfernen</button>
      </div>
    </div>`).join('');

  document.getElementById('page-content').innerHTML = `
    <div class="form-card" style="margin-bottom:20px">
      <div class="form-card-title">Logo hochladen</div>
      <div class="logo-preview-wrap">
        <img class="logo-preview" src="../images/logo.png?v=${Date.now()}" alt="Logo" onerror="this.style.opacity='.2'">
        <div><p style="font-size:.85rem;color:var(--text-muted);margin-bottom:12px">PNG mit Transparenz empfohlen</p>
          <label class="btn-add" style="cursor:pointer">📁 Logo hochladen<input type="file" accept="image/*" style="display:none" onchange="uploadLogoGH(this)"></label>
        </div>
      </div>
    </div>
    <div class="form-card upload-card" style="margin-bottom:20px">
      <div class="form-card-title">Galerie-Fotos (Startseite)</div>
      <div class="upload-drop" id="upload-drop">
        <input type="file" class="upload-input" accept="image/*" multiple onchange="uploadGalleryGH(this.files)">
        <div class="upload-drop-inner"><span class="upload-icon">📸</span><p>Fotos hochladen</p><span class="upload-hint">Wird automatisch optimiert · in GitHub-Repo gespeichert</span></div>
      </div>
      <div id="upload-preview" class="upload-preview"></div>
    </div>
    <div class="form-card">
      <div class="form-card-title">Vorhandene Galerie-Fotos (${items.length})</div>
      ${grid?`<div class="gallery-manage-grid">${grid}</div><div class="form-actions"><button class="btn-save" onclick="saveGalleryTitles(this)">Beschriftungen speichern</button></div>`:'<p class="empty-hint">Noch keine Fotos</p>'}
    </div>`;
}

async function saveGalleryTitles(btn) {
  const titles = {};
  document.querySelectorAll('.gal-title-inp').forEach(inp => { titles[inp.dataset.fn] = inp.value.trim(); });
  const updated = (S.gallery||[]).map(img => ({ ...img, title: titles[img.filename] ?? img.title }));
  const o = btn.textContent; btn.textContent='Speichern…'; btn.disabled=true;
  try { await API.put('gallery', updated); S.gallery=updated; flash('Beschriftungen gespeichert!'); }
  catch(ex) { flash('Fehler: '+ex.message,'error'); }
  finally { btn.textContent=o; btn.disabled=false; }
}

async function deleteGalleryItem(filename) {
  if (!confirm(`"${filename}" aus der Galerie entfernen?`)) return;
  S.gallery = (S.gallery||[]).filter(g => g.filename !== filename);
  try { await API.put('gallery', S.gallery); flash('Foto entfernt.'); renderGallery(); }
  catch(ex) { flash('Fehler: '+ex.message,'error'); }
}

// Logo + gallery uploads still use GitHub API (images live in the repo)
const GH_REPO   = 'devkappi084-source/nazumido';
const GH_BRANCH = 'claude/great-rubin-tXnlB';
let _ghToken = sessionStorage.getItem('nz_gh_token') || null;

async function getGHToken() {
  if (_ghToken) return _ghToken;
  const t = prompt('GitHub Personal Access Token für Bild-Upload:');
  if (t) { _ghToken = t.trim(); sessionStorage.setItem('nz_gh_token', _ghToken); }
  return _ghToken;
}

async function ghPutFile(path, base64, sha, message) {
  const token = await getGHToken();
  if (!token) throw new Error('Kein GitHub Token');
  const body = { message, content: base64, branch: GH_BRANCH };
  if (sha) body.sha = sha;
  const r = await fetch(`https://api.github.com/repos/${GH_REPO}/contents/${path}`, {
    method: 'PUT',
    headers: { 'Authorization': `token ${token}`, 'Accept': 'application/vnd.github.v3+json', 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!r.ok) { const e = await r.json().catch(()=>{}); throw new Error(e?.message || `HTTP ${r.status}`); }
  return r.json();
}

async function ghGetSha(path) {
  const token = await getGHToken();
  if (!token) return null;
  const r = await fetch(`https://api.github.com/repos/${GH_REPO}/contents/${path}?ref=${GH_BRANCH}`, {
    headers: { 'Authorization': `token ${token}`, 'Accept': 'application/vnd.github.v3+json' }
  });
  if (r.status === 404) return null;
  const d = await r.json();
  return d.sha || null;
}

async function uploadLogoGH(input) {
  const file = input.files[0]; if (!file) return;
  showLoading('Logo wird hochgeladen…');
  try {
    const sha    = await ghGetSha('images/logo.png');
    const fr     = new FileReader();
    fr.onload = async ev => {
      try {
        const b64 = ev.target.result.split(',')[1];
        await ghPutFile('images/logo.png', b64, sha, 'Admin: Logo aktualisiert');
        hideLoading(); flash('Logo hochgeladen! Seite baut neu (~1 Min.)');
      } catch(ex) { hideLoading(); flash('Fehler: '+ex.message,'error'); }
    };
    fr.readAsDataURL(file);
  } catch(ex) { hideLoading(); flash('Fehler: '+ex.message,'error'); }
}

async function uploadGalleryGH(files) {
  if (!files?.length) return;
  const arr = Array.from(files).filter(f => f.type.startsWith('image/'));
  if (!arr.length) return;
  const prev = document.getElementById('upload-preview');
  prev.innerHTML = arr.map(f=>`<div class="upload-thumb" id="ug-${f.name}"><div style="width:100%;aspect-ratio:1;background:var(--input-bg);border-radius:5px;display:flex;align-items:center;justify-content:center">⏳</div><span>${esc(f.name)}</span></div>`).join('');
  let done = 0;
  for (const file of arr) {
    const fname = file.name.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9.\-_]/g,'');
    try {
      const sha = await ghGetSha(`images/gallery/${fname}`);
      await new Promise((res,rej) => {
        const fr = new FileReader(); fr.onload = async ev => {
          try { await ghPutFile(`images/gallery/${fname}`, ev.target.result.split(',')[1], sha, `Admin: Galerie-Foto – ${fname}`); res(); }
          catch(ex) { rej(ex); }
        }; fr.readAsDataURL(file);
      });
      if (!S.gallery.find(g=>g.filename===fname)) S.gallery.push({ filename:fname, title:'' });
      document.getElementById(`ug-${file.name}`)?.querySelector('div')?.remove();
      document.getElementById(`ug-${file.name}`)?.insertAdjacentHTML('afterbegin', `<span style="color:#6adf7a">✓</span>`);
      done++;
    } catch(ex) {
      document.getElementById(`ug-${file.name}`)?.insertAdjacentHTML('afterbegin', `<span style="color:#ff8888">✕</span>`);
      flash(`Fehler bei ${fname}: ${ex.message}`, 'error');
    }
  }
  if (done) { await API.put('gallery', S.gallery); flash(`${done} Foto(s) hochgeladen!`); }
}

// ══════════════════════════════════════════════════════════════
//  SETTINGS
// ══════════════════════════════════════════════════════════════
function renderSettings() {
  const c = S.settings?.contact||{}, soc = S.settings?.social||{}, g = S.settings?.general||{};
  document.getElementById('page-content').innerHTML = `
    <div class="tabs">
      <button class="tab active" data-tab="contact">Kontakt</button>
      <button class="tab" data-tab="social">Social Media</button>
      <button class="tab" data-tab="general">Allgemein</button>
    </div>
    <div class="tab-panel active" id="tab-contact"><div class="form-card"><div class="form-card-title">Kontaktdaten</div>
      <div class="form-group"><label>Vereinsname</label><input id="s-name" value="${esc(c.address_name)}"></div>
      <div class="form-grid-2"><div class="form-group"><label>Straße</label><input id="s-street" value="${esc(c.address_street)}"></div><div class="form-group"><label>PLZ &amp; Ort</label><input id="s-city" value="${esc(c.address_city)}"></div></div>
      <div class="form-grid-2"><div class="form-group"><label>Land</label><input id="s-country" value="${esc(c.address_country)}"></div><div class="form-group"><label>E-Mail</label><input type="email" id="s-email" value="${esc(c.email)}"></div></div>
      <div class="form-group"><label>Website</label><input id="s-website" value="${esc(c.website)}"></div>
      <div class="form-actions"><button class="btn-save" onclick="saveSettings(this)">Speichern &amp; Live schalten</button></div>
    </div></div>
    <div class="tab-panel" id="tab-social"><div class="form-card"><div class="form-card-title">Social Media</div>
      <div class="form-group"><label>Facebook URL</label><input id="s-fb" value="${esc(soc.facebook==='#'?'':soc.facebook)}" placeholder="https://www.facebook.com/..."></div>
      <div class="form-group"><label>Instagram URL</label><input id="s-ig" value="${esc(soc.instagram==='#'?'':soc.instagram)}" placeholder="https://www.instagram.com/..."></div>
      <div class="form-actions"><button class="btn-save" onclick="saveSettings(this)">Speichern &amp; Live schalten</button></div>
    </div></div>
    <div class="tab-panel" id="tab-general"><div class="form-card"><div class="form-card-title">Allgemein</div>
      <div class="form-grid-3"><div class="form-group"><label>Saison</label><input id="s-season" value="${esc(g.season)}"></div><div class="form-group"><label>Gegründet</label><input id="s-founded" value="${esc(g.founded)}"></div><div class="form-group"><label>Mitglieder</label><input id="s-members" value="${esc(g.members)}"></div></div>
      <div class="form-actions"><button class="btn-save" onclick="saveSettings(this)">Speichern &amp; Live schalten</button></div>
    </div></div>`;
  initTabs();
}

async function saveSettings(btn) {
  if (S.saving) return; S.saving=true;
  const o = btn.textContent; btn.textContent='Speichern…'; btn.disabled=true;
  const v = id => document.getElementById(id)?.value?.trim()||'';
  try {
    const data = {
      contact: { address_name:v('s-name'), address_street:v('s-street'), address_city:v('s-city'), address_country:v('s-country'), email:v('s-email'), website:v('s-website') },
      social:  { facebook:v('s-fb')||'#', instagram:v('s-ig')||'#' },
      general: { season:v('s-season'), founded:v('s-founded'), members:v('s-members') }
    };
    await API.put('settings', data); S.settings=data;
    flash('Einstellungen gespeichert! Sofort live.');
  } catch(ex) { flash('Fehler: '+ex.message,'error'); }
  finally { S.saving=false; btn.textContent=o; btn.disabled=false; }
}

// ══════════════════════════════════════════════════════════════
//  USERS
// ══════════════════════════════════════════════════════════════
const PERM_LABELS = { content:'Texte', events:'Termine', gallery:'Galerie', settings:'Einstellungen', users:'Benutzer', members:'Mitglieder' };

async function renderUsers() {
  if (!can('users')) { document.getElementById('page-content').innerHTML='<p class="empty-hint" style="padding:40px;text-align:center">Keine Berechtigung</p>'; return; }
  showLoading();
  let users = [];
  try { users = (await API.get('users')).users || []; } catch(ex) { flash('Fehler: '+ex.message,'error'); }
  hideLoading();

  const rows = users.map(u => `<tr>
    <td><strong>${esc(u.name)}</strong>${u.isOwner?'<span class="badge-owner">Owner</span>':''}</td>
    <td style="color:var(--text-muted);font-size:.85rem">${esc(u.email)}</td>
    <td>${Object.entries(u.permissions||{}).filter(([,v])=>v).map(([k])=>`<span class="badge-type type-sonstig" style="margin:1px">${esc(PERM_LABELS[k]||k)}</span>`).join(' ')||'—'}</td>
    <td><span class="badge-active ${u.active?'on':'off'}">${u.active?'Aktiv':'Inaktiv'}</span></td>
    <td><div class="td-actions">
      <button class="action-edit" onclick="editUser('${esc(u.id)}')">✏ Bearbeiten</button>
      ${!u.isOwner?`<button class="action-del" onclick="deleteUser('${esc(u.id)}','${esc(u.name)}')">✕</button>`:''}
    </div></td>
  </tr>`).join('');

  document.getElementById('page-content').innerHTML = `
    <div class="page-actions"><button class="btn-add" onclick="editUser(null)">＋ Benutzer hinzufügen</button></div>
    <div class="table-card"><table class="admin-table">
      <thead><tr><th>Name</th><th>E-Mail</th><th>Berechtigungen</th><th>Status</th><th>Aktionen</th></tr></thead>
      <tbody>${rows||'<tr><td colspan="5" class="empty-hint" style="padding:28px;text-align:center">Keine Benutzer</td></tr>'}</tbody>
    </table></div>`;
}

function permCheckboxes(perms) {
  return Object.entries(PERM_LABELS).map(([k,l]) => `
    <div class="perm-item"><input type="checkbox" id="p-${k}" ${perms?.[k]?'checked':''}>
    <label for="p-${k}">${esc(l)}</label></div>`).join('');
}

async function editUser(id) {
  let user = null;
  if (id) {
    showLoading();
    try { const r = await API.get('users'); user = (r.users||[]).find(u=>u.id===id); } catch {}
    hideLoading();
  }
  openModal(`
    <div class="modal-head"><h2>${user?'✏ Benutzer bearbeiten':'＋ Neuer Benutzer'}</h2><button class="modal-close" onclick="closeModal()">✕</button></div>
    <div class="modal-form">
      <div class="form-grid-2">
        <div class="form-group"><label>Name *</label><input id="u-name" value="${esc(user?.name||'')}"></div>
        <div class="form-group"><label>E-Mail *</label><input type="email" id="u-email" value="${esc(user?.email||'')}"></div>
      </div>
      <div class="form-group"><label>Passwort ${user?'(leer = unverändert)':'*'}</label><input type="password" id="u-pw" autocomplete="new-password" minlength="8"></div>
      <div class="form-group"><label>Berechtigungen</label><div class="perm-grid">${permCheckboxes(user?.permissions)}</div></div>
      <div class="form-group"><label class="check-label"><input type="checkbox" id="u-active" ${!user||user.active?'checked':''}> Konto aktiv</label></div>
    </div>
    <div class="modal-actions">
      <button class="btn-cancel" onclick="closeModal()">Abbrechen</button>
      <button class="btn-save" onclick="saveUser('${id||''}',this)">Speichern</button>
    </div>`);
}

async function saveUser(id, btn) {
  const name  = document.getElementById('u-name').value.trim();
  const email = document.getElementById('u-email').value.trim();
  const pw    = document.getElementById('u-pw').value;
  if (!name||!email) { flash('Name und E-Mail erforderlich','error'); return; }
  if (!id && !pw)    { flash('Passwort erforderlich','error'); return; }
  const o = btn.textContent; btn.textContent='Speichern…'; btn.disabled=true;
  const permissions = {};
  Object.keys(PERM_LABELS).forEach(k => { permissions[k] = document.getElementById(`p-${k}`)?.checked || false; });
  const body = { name, email, permissions, active: document.getElementById('u-active').checked };
  if (pw) body.password = pw;
  try {
    if (id) await API.put('users', body, { id });
    else    await API.post('users', body);
    closeModal(); flash(id?'Benutzer aktualisiert!':'Benutzer erstellt!'); renderUsers();
  } catch(ex) { flash('Fehler: '+ex.message,'error'); btn.textContent=o; btn.disabled=false; }
}

async function deleteUser(id, name) {
  if (!confirm(`Benutzer "${name}" wirklich löschen?`)) return;
  try { await API.delete('users', { id }); flash('Benutzer gelöscht.'); renderUsers(); }
  catch(ex) { flash('Fehler: '+ex.message,'error'); }
}

// ══════════════════════════════════════════════════════════════
//  MEMBERS
// ══════════════════════════════════════════════════════════════
async function renderMembers() {
  if (!can('members')) { document.getElementById('page-content').innerHTML='<p class="empty-hint" style="padding:40px;text-align:center">Keine Berechtigung</p>'; return; }
  showLoading();
  let members = [];
  try { members = (await API.get('members')).members || []; } catch(ex) { flash('Fehler: '+ex.message,'error'); }
  hideLoading();

  const rows = members.map(m => `<tr>
    <td>${esc(m.name)}</td>
    <td style="color:var(--text-muted);font-size:.85rem">${esc(m.email)}</td>
    <td><span class="badge-active ${m.active?'on':'off'}">${m.active?'Aktiv':'Inaktiv'}</span></td>
    <td style="color:var(--text-muted);font-size:.78rem">${m.createdAt ? new Date(m.createdAt).toLocaleDateString('de-AT') : '—'}</td>
    <td><div class="td-actions">
      <button class="action-edit" onclick="editMember('${esc(m.id)}','${esc(m.name)}','${esc(m.email)}',${m.active})">✏ Bearbeiten</button>
      <button class="action-del" onclick="deleteMember('${esc(m.id)}','${esc(m.name)}')">✕</button>
    </div></td>
  </tr>`).join('');

  document.getElementById('page-content').innerHTML = `
    <div class="page-actions"><button class="btn-add" onclick="editMember(null)">＋ Mitglied hinzufügen</button></div>
    <div class="table-card"><table class="admin-table">
      <thead><tr><th>Name</th><th>E-Mail</th><th>Status</th><th>Hinzugefügt</th><th>Aktionen</th></tr></thead>
      <tbody>${rows||'<tr><td colspan="5" class="empty-hint" style="padding:28px;text-align:center">Keine Mitglieder</td></tr>'}</tbody>
    </table></div>`;
}

function editMember(id, name='', email='', active=true) {
  openModal(`
    <div class="modal-head"><h2>${id?'✏ Mitglied bearbeiten':'＋ Mitglied hinzufügen'}</h2><button class="modal-close" onclick="closeModal()">✕</button></div>
    <div class="modal-form">
      <div class="form-grid-2">
        <div class="form-group"><label>Name *</label><input id="m-name" value="${esc(name)}"></div>
        <div class="form-group"><label>E-Mail *</label><input type="email" id="m-email" value="${esc(email)}"></div>
      </div>
      <div class="form-group"><label>Passwort ${id?'(leer = unverändert)':'*'} (min. 6 Zeichen)</label><input type="password" id="m-pw" autocomplete="new-password" minlength="6"></div>
      <div class="form-group"><label class="check-label"><input type="checkbox" id="m-active" ${active?'checked':''}> Konto aktiv (kann sich einloggen)</label></div>
    </div>
    <div class="modal-actions">
      <button class="btn-cancel" onclick="closeModal()">Abbrechen</button>
      <button class="btn-save" onclick="saveMember('${id||''}',this)">Speichern</button>
    </div>`);
}

async function saveMember(id, btn) {
  const name  = document.getElementById('m-name').value.trim();
  const email = document.getElementById('m-email').value.trim();
  const pw    = document.getElementById('m-pw').value;
  if (!name||!email) { flash('Name und E-Mail erforderlich','error'); return; }
  if (!id && !pw)    { flash('Passwort erforderlich','error'); return; }
  const o = btn.textContent; btn.textContent='Speichern…'; btn.disabled=true;
  const body = { name, email, active: document.getElementById('m-active').checked };
  if (pw) body.password = pw;
  try {
    if (id) await API.put('members', body, { id });
    else    await API.post('members', body);
    closeModal(); flash(id?'Mitglied aktualisiert!':'Mitglied erstellt!'); renderMembers();
  } catch(ex) { flash('Fehler: '+ex.message,'error'); btn.textContent=o; btn.disabled=false; }
}

async function deleteMember(id, name) {
  if (!confirm(`Mitglied "${name}" wirklich löschen? Fotos bleiben erhalten.`)) return;
  try { await API.delete('members', { id }); flash('Mitglied gelöscht.'); renderMembers(); }
  catch(ex) { flash('Fehler: '+ex.message,'error'); }
}

// ══════════════════════════════════════════════════════════════
//  MY ACCOUNT
// ══════════════════════════════════════════════════════════════
function renderMyAccount() {
  document.getElementById('page-content').innerHTML = `
    <div class="form-card" style="max-width:500px">
      <div class="form-card-title">Passwort ändern</div>
      <div class="form-group"><label>Aktuelles Passwort</label><input type="password" id="pw-current"></div>
      <div class="form-group"><label>Neues Passwort (min. 8 Zeichen)</label><input type="password" id="pw-new" minlength="8"></div>
      <div class="form-group"><label>Neues Passwort wiederholen</label><input type="password" id="pw-confirm"></div>
      <div class="form-actions"><button class="btn-save" onclick="changeAdminPassword(this)">Passwort ändern</button></div>
    </div>`;
}

async function changeAdminPassword(btn) {
  const cur  = document.getElementById('pw-current').value;
  const nw   = document.getElementById('pw-new').value;
  const conf = document.getElementById('pw-confirm').value;
  if (!cur||!nw) { flash('Alle Felder erforderlich','error'); return; }
  if (nw !== conf) { flash('Passwörter stimmen nicht überein','error'); return; }
  if (nw.length < 8) { flash('Mind. 8 Zeichen','error'); return; }
  const o = btn.textContent; btn.textContent='Ändern…'; btn.disabled=true;
  try {
    await API.put('users', { password: nw, _currentPassword: cur }, { id: S.user.id });
    flash('Passwort geändert!'); document.getElementById('pw-current').value=''; document.getElementById('pw-new').value=''; document.getElementById('pw-confirm').value='';
  } catch(ex) { flash('Fehler: '+ex.message,'error'); }
  finally { btn.textContent=o; btn.disabled=false; }
}

// ══════════════════════════════════════════════════════════════
//  INIT
// ══════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', async () => {
  document.getElementById('burger-btn').addEventListener('click', () => document.getElementById('sidebar').classList.toggle('open'));
  document.getElementById('sidebar-close').addEventListener('click', () => document.getElementById('sidebar').classList.remove('open'));
  document.getElementById('modal-overlay').addEventListener('click', e => { if (e.target.id==='modal-overlay') closeModal(); });
  document.addEventListener('keydown', e => { if (e.key==='Escape') closeModal(); });

  initLoginForm();
  initSetupForm();

  showLoading('Überprüfe Anmeldung…');
  const loggedIn = await checkSession();
  hideLoading();

  if (loggedIn) {
    bootApp();
  } else {
    // Check if setup is needed
    const needsSetup = await checkSetupNeeded();
    if (needsSetup) {
      document.getElementById('login-screen').style.display = 'none';
      document.getElementById('setup-screen').style.display = 'flex';
    }
  }
});
