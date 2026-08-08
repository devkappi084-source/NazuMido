// admin.js — Frontend-Logik für das Nazumido Admin-Panel
// Kommuniziert mit der REST-API unter /api. Authentifizierung per JWT.

(function () {
  'use strict';

  const API = '/api';
  const TOKEN_KEY = 'nazumido_admin_token';

  // -------------------------------------------------------------------------
  // Hilfsfunktionen
  // -------------------------------------------------------------------------
  function getToken() {
    return localStorage.getItem(TOKEN_KEY) || '';
  }
  function setToken(t) {
    if (t) localStorage.setItem(TOKEN_KEY, t);
    else localStorage.removeItem(TOKEN_KEY);
  }

  function toast(msg, isError) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.className = 'toast show' + (isError ? ' error' : '');
    setTimeout(() => (t.className = 'toast'), 2800);
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])
    );
  }

  // Zentraler API-Aufruf. Hängt bei Bedarf den Bearer-Token an und behandelt
  // 401 (Session abgelaufen) einheitlich.
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

  // -------------------------------------------------------------------------
  // Ansichtssteuerung (Login <-> App)
  // -------------------------------------------------------------------------
  const loginView = document.getElementById('login-view');
  const appView = document.getElementById('app-view');
  const logoutBtn = document.getElementById('logout');

  function showApp() {
    loginView.hidden = true;
    appView.hidden = false;
    logoutBtn.hidden = false;
    loadPosts();
    loadSettings();
  }

  function showLogin() {
    loginView.hidden = false;
    appView.hidden = true;
    logoutBtn.hidden = true;
  }

  // -------------------------------------------------------------------------
  // Login / Logout
  // -------------------------------------------------------------------------
  const loginForm = document.getElementById('login-form');
  loginForm.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const fd = new FormData(loginForm);
    try {
      const data = await api('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: fd.get('username'),
          password: fd.get('password'),
        }),
      });
      setToken(data.token);
      loginForm.reset();
      toast('Willkommen, ' + data.admin.username);
      showApp();
    } catch (e) {
      toast(e.message, true);
    }
  });

  logoutBtn.addEventListener('click', () => {
    setToken('');
    toast('Abgemeldet');
    showLogin();
  });

  // -------------------------------------------------------------------------
  // Tabs
  // -------------------------------------------------------------------------
  document.querySelectorAll('.tab').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach((b) => b.classList.remove('active'));
      document.querySelectorAll('.tabpanel').forEach((p) => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
    });
  });

  // -------------------------------------------------------------------------
  // BEITRÄGE (Posts)
  // -------------------------------------------------------------------------
  const postForm = document.getElementById('post-form');
  const postList = document.getElementById('post-list');
  const postFormTitle = document.getElementById('post-form-title');
  const postCancel = document.getElementById('post-cancel');

  async function loadPosts() {
    try {
      // Auch inaktive Beiträge im Admin anzeigen: dazu einzeln laden wäre
      // teuer — der öffentliche Endpunkt liefert nur aktive. Wir zeigen hier
      // daher alle aktiven; inaktive werden nach dem Deaktivieren ausgeblendet.
      const items = await api('/posts');
      if (!items.length) {
        postList.innerHTML = '<p class="empty">Noch keine Beiträge.</p>';
        return;
      }
      postList.innerHTML = items
        .map(
          (p) => `
          <div class="item">
            <div class="item-main">
              <h3>${esc(p.title)}</h3>
              <div class="meta">
                ${esc((p.created_at || '').slice(0, 16))}
                ${p.photo_url ? ' · 📷' : ''}
                ${p.is_active ? '' : ' · <span class="inactive">inaktiv</span>'}
              </div>
            </div>
            <div class="item-actions">
              <button class="edit" data-id="${p.id}">Bearbeiten</button>
              <button class="del" data-id="${p.id}">Löschen</button>
            </div>
          </div>`
        )
        .join('');
      postList.querySelectorAll('.edit').forEach((b) =>
        b.addEventListener('click', () => startEdit(items.find((p) => p.id == b.dataset.id)))
      );
      postList.querySelectorAll('.del').forEach((b) =>
        b.addEventListener('click', () => delPost(b.dataset.id))
      );
    } catch (e) {
      postList.innerHTML = '<p class="empty">Fehler: ' + esc(e.message) + '</p>';
    }
  }

  // Falls eine Datei gewählt wurde, zuerst hochladen und die URL zurückgeben.
  async function maybeUpload() {
    const fileInput = postForm.querySelector('input[name="photo"]');
    if (!fileInput.files || !fileInput.files.length) return null;
    const fd = new FormData();
    fd.append('photo', fileInput.files[0]);
    const data = await api('/upload', { method: 'POST', body: fd });
    return data.url;
  }

  postForm.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const fd = new FormData(postForm);
    const id = fd.get('id');
    try {
      // Neues Foto hochladen (falls gewählt) und photo_url setzen
      const uploadedUrl = await maybeUpload();
      const photo_url = uploadedUrl || fd.get('photo_url') || null;

      const payload = {
        title: fd.get('title'),
        content: fd.get('content'),
        photo_url,
        is_active: postForm.querySelector('input[name="is_active"]').checked,
      };

      if (id) {
        await api('/admin/posts/' + id, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        toast('Beitrag aktualisiert');
      } else {
        await api('/admin/posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        toast('Beitrag gespeichert');
      }
      resetPostForm();
      loadPosts();
    } catch (e) {
      toast(e.message, true);
    }
  });

  function startEdit(post) {
    if (!post) return;
    postForm.querySelector('input[name="id"]').value = post.id;
    postForm.querySelector('input[name="title"]').value = post.title || '';
    postForm.querySelector('textarea[name="content"]').value = post.content || '';
    postForm.querySelector('input[name="photo_url"]').value = post.photo_url || '';
    postForm.querySelector('input[name="is_active"]').checked = !!post.is_active;
    postFormTitle.textContent = 'Beitrag bearbeiten';
    postCancel.hidden = false;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function resetPostForm() {
    postForm.reset();
    postForm.querySelector('input[name="id"]').value = '';
    postForm.querySelector('input[name="is_active"]').checked = true;
    postFormTitle.textContent = 'Beitrag anlegen';
    postCancel.hidden = true;
  }

  postCancel.addEventListener('click', resetPostForm);

  async function delPost(id) {
    if (!confirm('Diesen Beitrag wirklich löschen?')) return;
    try {
      await api('/admin/posts/' + id, { method: 'DELETE' });
      toast('Gelöscht');
      loadPosts();
    } catch (e) {
      toast(e.message, true);
    }
  }

  // -------------------------------------------------------------------------
  // EINSTELLUNGEN (Settings)
  // -------------------------------------------------------------------------
  const settingsForm = document.getElementById('settings-form');
  const settingsFields = document.getElementById('settings-fields');
  const settingsAdd = document.getElementById('settings-add');

  function settingRow(key, value) {
    const wrap = document.createElement('div');
    wrap.className = 'setting-row';
    wrap.innerHTML = `
      <input class="skey" placeholder="Schlüssel" value="${esc(key)}" />
      <input class="sval" placeholder="Wert" value="${esc(value)}" />`;
    return wrap;
  }

  async function loadSettings() {
    try {
      const settings = await api('/settings');
      settingsFields.innerHTML = '';
      const keys = Object.keys(settings);
      if (!keys.length) {
        settingsFields.appendChild(settingRow('', ''));
      } else {
        keys.forEach((k) => settingsFields.appendChild(settingRow(k, settings[k])));
      }
    } catch (e) {
      settingsFields.innerHTML = '<p class="empty">Fehler: ' + esc(e.message) + '</p>';
    }
  }

  settingsAdd.addEventListener('click', () => {
    settingsFields.appendChild(settingRow('', ''));
  });

  settingsForm.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const payload = {};
    settingsFields.querySelectorAll('.setting-row').forEach((row) => {
      const key = row.querySelector('.skey').value.trim();
      const value = row.querySelector('.sval').value;
      if (key) payload[key] = value;
    });
    if (!Object.keys(payload).length) {
      toast('Keine Einstellungen zum Speichern', true);
      return;
    }
    try {
      await api('/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      toast('Einstellungen gespeichert');
      loadSettings();
    } catch (e) {
      toast(e.message, true);
    }
  });

  // -------------------------------------------------------------------------
  // Start: Token vorhanden? -> App, sonst Login
  // -------------------------------------------------------------------------
  if (getToken()) showApp();
  else showLogin();
})();
