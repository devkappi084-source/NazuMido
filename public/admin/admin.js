// admin.js — Frontend-Logik für das Nazumido Admin-Dashboard
//
// Reines Vanilla-JavaScript (Fetch API + Event-Listener). Kommuniziert mit der
// REST-API unter /api, Authentifizierung per JWT (Bearer-Token im localStorage).
//
// Login läuft über die separate Seite /login.html. Dieses Skript setzt ein
// gültiges Token voraus: fehlt es (oder antwortet die API mit 401), wird
// automatisch zur Login-Seite umgeleitet.

(function () {
  'use strict';

  const API = '/api';
  const LOGIN_URL = '/login.html';
  const TOKEN_KEY = 'nazumido_admin_token';
  const NAME_KEY = 'nazumido_admin_name';
  const THEME_KEY = 'nazumido_admin_theme';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // ------------------------------------------------------------------ Token
  function getToken() { return localStorage.getItem(TOKEN_KEY) || ''; }

  // Token + gespeicherte Sitzungsdaten entfernen
  function clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(NAME_KEY);
  }

  // Abmelden / fehlende Berechtigung → zurück zur Login-Seite
  function redirectToLogin() {
    window.location.replace(LOGIN_URL);
  }

  // ------------------------------------------------------------------ Auth-Gate
  // Ohne Token gibt es kein Dashboard: sofort umleiten und Skript beenden,
  // bevor irgendwelche geschützten Daten geladen werden.
  if (!getToken()) {
    redirectToLogin();
    return;
  }

  // ------------------------------------------------------------------ Helpers
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
    );
  }

  let toastTimer;
  function toast(msg, type) {
    const t = $('#toast');
    const icon = type === 'error' ? '⚠️' : type === 'ok' ? '✅' : 'ℹ️';
    t.innerHTML = `<span>${icon}</span> ${esc(msg)}`;
    t.className = 'toast show' + (type ? ' ' + type : '');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (t.className = 'toast'), 3000);
  }

  // Zentraler API-Aufruf: hängt das Bearer-Token an, wandelt JSON um und
  // behandelt Auth- (401) sowie Netzwerkfehler einheitlich.
  async function api(path, opts = {}) {
    const headers = Object.assign({}, opts.headers);
    const token = getToken();
    if (token) headers.Authorization = 'Bearer ' + token;

    let res;
    try {
      res = await fetch(API + path, Object.assign({}, opts, { headers }));
    } catch (err) {
      // fetch wirft nur bei Netzwerk-/Verbindungsfehlern
      throw new Error('Server nicht erreichbar. Bitte Verbindung prüfen.');
    }

    const isJson = (res.headers.get('content-type') || '').includes('application/json');
    const data = isJson ? await res.json() : null;

    // Auth-Fehler: Sitzung verwerfen und zur Login-Seite umleiten.
    if (res.status === 401) {
      clearSession();
      redirectToLogin();
      throw new Error((data && data.error) || 'Sitzung abgelaufen');
    }
    if (!res.ok) throw new Error((data && data.error) || 'HTTP ' + res.status);
    return data;
  }

  // ------------------------------------------------------------------ Theme
  function applyTheme(theme) {
    if (theme === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
    else document.documentElement.removeAttribute('data-theme');
    const btn = $('#theme-toggle');
    if (btn) btn.textContent = theme === 'dark' ? '☀️' : '🌙';
  }
  applyTheme(localStorage.getItem(THEME_KEY) || 'light');

  $('#theme-toggle').addEventListener('click', () => {
    const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    localStorage.setItem(THEME_KEY, next);
    applyTheme(next);
  });

  // ------------------------------------------------------------- Kopf / Benutzer
  function showUser() {
    const name = localStorage.getItem(NAME_KEY) || 'Admin';
    $('#user-name').textContent = name;
    $('#user-avatar').textContent = (name.charAt(0) || 'A').toUpperCase();
  }

  // Sidebar-Navigation zwischen den Sektionen
  $$('.navitem[data-view]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const view = btn.dataset.view;
      $$('.navitem[data-view]').forEach((b) => b.classList.toggle('active', b === btn));
      $$('.view').forEach((v) => v.classList.toggle('active', v.id === 'view-' + view));
    });
  });

  // ------------------------------------------------------------------ Logout
  $('#logout-btn').addEventListener('click', () => {
    clearSession();
    redirectToLogin();
  });

  // =========================================================================
  // BEITRÄGE
  // =========================================================================
  const postList = $('#post-list');
  let postsCache = [];

  function renderLoading() {
    postList.innerHTML =
      '<div class="empty"><span class="big">⏳</span>Beiträge werden geladen …</div>';
  }

  async function loadPosts() {
    renderLoading();
    try {
      // Admin-Endpunkt liefert auch Entwürfe (is_active = 0)
      postsCache = await api('/admin/posts');
      renderPosts();
    } catch (e) {
      // Bei 401 läuft bereits die Umleitung; Fehlermeldung nur informativ.
      postList.innerHTML = `<div class="empty"><span class="big">⚠️</span>Fehler: ${esc(e.message)}</div>`;
    }
  }

  function renderPosts() {
    if (!postsCache.length) {
      postList.innerHTML =
        '<div class="empty"><span class="big">📭</span>Noch keine Beiträge. Lege den ersten an!</div>';
      return;
    }
    postList.innerHTML = postsCache
      .map((p) => {
        const thumb = p.photo_url
          ? `<div class="post-thumb"><img src="${esc(p.photo_url)}" alt="" /></div>`
          : `<div class="post-thumb">📝</div>`;
        const date = (p.created_at || '').slice(0, 10);
        const badge = p.is_active
          ? '<span class="badge pub"><span class="dot"></span>Veröffentlicht</span>'
          : '<span class="badge draft"><span class="dot"></span>Entwurf</span>';
        return `
          <article class="post-item">
            ${thumb}
            <div class="post-main">
              <h3>${esc(p.title)}</h3>
              <div class="excerpt">${esc(p.content || '—')}</div>
              <div class="post-meta">${badge}<span>🗓️ ${esc(date)}</span></div>
            </div>
            <div class="post-actions">
              <button class="mini edit" data-id="${p.id}" title="Bearbeiten" aria-label="Bearbeiten">✏️</button>
              <button class="mini del" data-id="${p.id}" title="Löschen" aria-label="Löschen">🗑️</button>
            </div>
          </article>`;
      })
      .join('');

    $$('.post-actions .edit', postList).forEach((b) =>
      b.addEventListener('click', () => openModal(postsCache.find((p) => p.id == b.dataset.id)))
    );
    $$('.post-actions .del', postList).forEach((b) =>
      b.addEventListener('click', () => delPost(b.dataset.id))
    );
  }

  async function delPost(id) {
    const post = postsCache.find((p) => p.id == id);
    // Bestätigungsdialog vor dem endgültigen Löschen
    if (!confirm(`Beitrag „${post ? post.title : ''}" wirklich löschen?`)) return;
    try {
      await api('/admin/posts/' + id, { method: 'DELETE' });
      toast('Beitrag gelöscht', 'ok');
      loadPosts();
    } catch (e) {
      toast(e.message, 'error');
    }
  }

  // ------------------------------------------------------------- Modal (Beitrag)
  const modal = $('#post-modal');
  const postForm = $('#post-form');
  const photoPreview = $('#photo-preview');
  const photoFile = $('#photo-file');
  const photoUrl = $('#p-photo_url');
  const photoClear = $('#photo-clear');
  const activeToggle = $('#p-active');

  function setPhotoPreview(url) {
    if (url) {
      photoPreview.innerHTML = `<img src="${esc(url)}" alt="" />`;
      photoClear.hidden = false;
    } else {
      photoPreview.textContent = '🖼️';
      photoClear.hidden = true;
    }
  }

  function updateActiveLabel() {
    $('#p-active-label').innerHTML = activeToggle.checked
      ? 'Veröffentlicht <small>Für alle Besucher sichtbar</small>'
      : 'Entwurf <small>Nur intern sichtbar, nicht auf der Website</small>';
  }
  activeToggle.addEventListener('change', updateActiveLabel);

  // Beitrag bearbeiten: Formular mit vorhandenen Daten füllen; neuer Beitrag:
  // Formular zurücksetzen.
  function openModal(post) {
    postForm.reset();
    photoFile.value = '';
    if (post) {
      $('#modal-title').textContent = 'Beitrag bearbeiten';
      $('#p-id').value = post.id;
      $('#p-title').value = post.title || '';
      $('#p-content').value = post.content || '';
      photoUrl.value = post.photo_url || '';
      activeToggle.checked = !!post.is_active;
      setPhotoPreview(post.photo_url);
    } else {
      $('#modal-title').textContent = 'Neuer Beitrag';
      $('#p-id').value = '';
      photoUrl.value = '';
      activeToggle.checked = true;
      setPhotoPreview('');
    }
    updateActiveLabel();
    modal.classList.add('open');
    setTimeout(() => $('#p-title').focus(), 50);
  }

  function closeModal() { modal.classList.remove('open'); }

  $('#new-post').addEventListener('click', () => openModal(null));
  $('#modal-close').addEventListener('click', closeModal);
  $('#modal-cancel').addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('open')) closeModal();
  });

  // Foto wählen -> lokale Vorschau (Upload erst beim Speichern)
  $('#photo-pick').addEventListener('click', () => photoFile.click());
  photoFile.addEventListener('change', () => {
    const file = photoFile.files && photoFile.files[0];
    if (file) setPhotoPreview(URL.createObjectURL(file));
  });
  photoClear.addEventListener('click', () => {
    photoFile.value = '';
    photoUrl.value = '';
    setPhotoPreview('');
  });

  // Datei per Multipart-FormData hochladen und die öffentliche URL zurückgeben
  async function uploadFile(input) {
    const file = input.files && input.files[0];
    if (!file) return null;
    const fd = new FormData();
    fd.append('photo', file);
    const data = await api('/upload', { method: 'POST', body: fd });
    return data.url;
  }

  // Speichern: ggf. Foto hochladen, dann Beitrag anlegen (POST) oder
  // aktualisieren (PUT). Loading-State über den deaktivierten Button.
  postForm.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const submitBtn = postForm.querySelector('button[type="submit"]');
    const original = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = '⏳ Speichern …';
    try {
      const uploaded = await uploadFile(photoFile);
      const payload = {
        title: $('#p-title').value.trim(),
        content: $('#p-content').value,
        photo_url: uploaded || photoUrl.value || null,
        is_active: activeToggle.checked,
      };

      if (!payload.title) {
        toast('Bitte einen Titel eingeben', 'error');
        return;
      }

      const id = $('#p-id').value;
      if (id) {
        await api('/admin/posts/' + id, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        toast('Beitrag aktualisiert', 'ok');
      } else {
        await api('/admin/posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        toast('Beitrag gespeichert', 'ok');
      }
      closeModal();
      loadPosts();
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = original;
    }
  });

  // =========================================================================
  // EINSTELLUNGEN
  // =========================================================================
  const settingsForm = $('#settings-form');
  const logoPreview = $('#logo-preview');
  const logoFile = $('#logo-file');
  const logoUrl = $('#s-logo_url');

  function setLogoPreview(url) {
    if (url) logoPreview.innerHTML = `<img src="${esc(url)}" alt="" />`;
    else logoPreview.textContent = '🎭';
  }

  async function loadSettings() {
    try {
      const s = await api('/settings');
      $('#s-vereinsname').value = s.vereinsname || '';
      $('#s-beschreibung').value = s.beschreibung || '';
      $('#s-email').value = s.email || '';
      $('#s-telefon').value = s.telefon || '';
      $('#s-adresse').value = s.adresse || '';
      logoUrl.value = s.logo_url || '';
      setLogoPreview(s.logo_url);
    } catch (e) {
      toast('Einstellungen konnten nicht geladen werden: ' + e.message, 'error');
    }
  }

  $('#logo-pick').addEventListener('click', () => logoFile.click());
  logoFile.addEventListener('change', () => {
    const file = logoFile.files && logoFile.files[0];
    if (file) setLogoPreview(URL.createObjectURL(file));
  });

  // Speichern: optionalen Logo-Upload durchführen, dann alle Felder per
  // PUT /api/admin/settings übertragen.
  settingsForm.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const submitBtn = settingsForm.querySelector('button[type="submit"]');
    const original = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = '⏳ Speichern …';
    try {
      const uploaded = await uploadFile(logoFile);
      const payload = {
        vereinsname: $('#s-vereinsname').value,
        beschreibung: $('#s-beschreibung').value,
        email: $('#s-email').value,
        telefon: $('#s-telefon').value,
        adresse: $('#s-adresse').value,
        logo_url: uploaded || logoUrl.value || '',
      };
      await api('/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (uploaded) { logoUrl.value = uploaded; logoFile.value = ''; }
      toast('Einstellungen gespeichert', 'ok');
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = original;
    }
  });

  // ----------------------------------------------------------------- Start
  // Token liegt vor (Auth-Gate oben) → Dashboard initialisieren.
  showUser();
  loadPosts();
  loadSettings();
})();
