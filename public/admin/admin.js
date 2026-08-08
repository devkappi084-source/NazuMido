// admin.js — Frontend-Logik für das Nazumido Admin-Dashboard
// Reines Vanilla-JavaScript. Kommuniziert mit der REST-API unter /api,
// Authentifizierung per JWT (Bearer-Token im localStorage).

(function () {
  'use strict';

  const API = '/api';
  const TOKEN_KEY = 'nazumido_admin_token';
  const THEME_KEY = 'nazumido_admin_theme';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // ------------------------------------------------------------------ Helpers
  function getToken() { return localStorage.getItem(TOKEN_KEY) || ''; }
  function setToken(t) {
    if (t) localStorage.setItem(TOKEN_KEY, t);
    else localStorage.removeItem(TOKEN_KEY);
  }

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

  // Zentraler API-Aufruf: hängt Bearer-Token an und behandelt 401 einheitlich.
  async function api(path, opts = {}) {
    const headers = Object.assign({}, opts.headers);
    const token = getToken();
    if (token) headers.Authorization = 'Bearer ' + token;

    const res = await fetch(API + path, Object.assign({}, opts, { headers }));
    const isJson = (res.headers.get('content-type') || '').includes('application/json');
    const data = isJson ? await res.json() : null;

    if (res.status === 401) {
      setToken('');
      showLogin();
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

  // ------------------------------------------------------------- View-Steuerung
  const loginView = $('#login-view');
  const appView = $('#app-view');

  function showApp(username) {
    loginView.hidden = true;
    appView.hidden = false;
    if (username) {
      $('#user-name').textContent = username;
      $('#user-avatar').textContent = username.charAt(0) || 'A';
    }
    loadPosts();
    loadSettings();
  }

  function showLogin() {
    loginView.hidden = false;
    appView.hidden = true;
  }

  // Sidebar-Navigation zwischen den Sektionen
  $$('.navitem[data-view]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const view = btn.dataset.view;
      $$('.navitem[data-view]').forEach((b) => b.classList.toggle('active', b === btn));
      $$('.view').forEach((v) => v.classList.toggle('active', v.id === 'view-' + view));
    });
  });

  // ------------------------------------------------------------- Login / Logout
  const loginForm = $('#login-form');
  const loginError = $('#login-error');

  loginForm.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    loginError.hidden = true;
    try {
      const data = await api('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: $('#username').value,
          password: $('#password').value,
        }),
      });
      setToken(data.token);
      loginForm.reset();
      showApp(data.admin.username);
      toast('Willkommen, ' + data.admin.username, 'ok');
    } catch (e) {
      loginError.textContent = e.message;
      loginError.hidden = false;
    }
  });

  $('#logout-btn').addEventListener('click', () => {
    setToken('');
    toast('Abgemeldet');
    showLogin();
  });

  // =========================================================================
  // BEITRÄGE
  // =========================================================================
  const postList = $('#post-list');
  let postsCache = [];

  async function loadPosts() {
    try {
      // Admin-Endpunkt liefert auch Entwürfe (is_active = 0)
      postsCache = await api('/admin/posts');
      renderPosts();
    } catch (e) {
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

  // Datei hochladen und URL zurückgeben
  async function uploadFile(input) {
    const file = input.files && input.files[0];
    if (!file) return null;
    const fd = new FormData();
    fd.append('photo', file);
    const data = await api('/upload', { method: 'POST', body: fd });
    return data.url;
  }

  postForm.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const submitBtn = postForm.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    try {
      const uploaded = await uploadFile(photoFile);
      const payload = {
        title: $('#p-title').value.trim(),
        content: $('#p-content').value,
        photo_url: uploaded || photoUrl.value || null,
        is_active: activeToggle.checked,
      };
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

  settingsForm.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const submitBtn = settingsForm.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
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
    }
  });

  // ----------------------------------------------------------------- Start
  if (getToken()) showApp();
  else showLogin();
})();
