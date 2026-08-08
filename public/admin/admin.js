// admin.js — Frontend-Logik für das Nazumido Admin-Panel
// Kommuniziert mit der REST-API unter /api.

(function () {
  'use strict';

  const API = '/api';

  // -------------------------------------------------------------------------
  // Hilfsfunktionen
  // -------------------------------------------------------------------------
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

  async function api(path, opts) {
    const res = await fetch(API + path, opts);
    const isJson = (res.headers.get('content-type') || '').includes('application/json');
    const data = isJson ? await res.json() : null;
    if (!res.ok) throw new Error((data && data.error) || 'HTTP ' + res.status);
    return data;
  }

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
  // NEWS
  // -------------------------------------------------------------------------
  const newsForm = document.getElementById('news-form');
  const newsList = document.getElementById('news-list');

  async function loadNews() {
    try {
      const items = await api('/news');
      if (!items.length) {
        newsList.innerHTML = '<p class="empty">Noch keine Neuigkeiten.</p>';
        return;
      }
      newsList.innerHTML = items
        .map(
          (n) => `
          <div class="item">
            <div>
              <h3>${esc(n.title)}</h3>
              <div class="meta">${esc(n.tag || '—')} · ${esc(n.created_at || '')}</div>
            </div>
            <button class="del" data-id="${n.id}">Löschen</button>
          </div>`
        )
        .join('');
      newsList.querySelectorAll('.del').forEach((b) =>
        b.addEventListener('click', () => delNews(b.dataset.id))
      );
    } catch (e) {
      newsList.innerHTML = '<p class="empty">Fehler: ' + esc(e.message) + '</p>';
    }
  }

  newsForm.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const fd = new FormData(newsForm);
    try {
      await api('/news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: fd.get('title'),
          tag: fd.get('tag'),
          tag_color: fd.get('tag_color'),
          excerpt: fd.get('excerpt'),
          body: fd.get('body'),
          feature: fd.get('feature') ? 1 : 0,
        }),
      });
      newsForm.reset();
      toast('Neuigkeit gespeichert');
      loadNews();
    } catch (e) {
      toast(e.message, true);
    }
  });

  async function delNews(id) {
    if (!confirm('Diese Neuigkeit wirklich löschen?')) return;
    try {
      await api('/news/' + id, { method: 'DELETE' });
      toast('Gelöscht');
      loadNews();
    } catch (e) {
      toast(e.message, true);
    }
  }

  // -------------------------------------------------------------------------
  // EVENTS
  // -------------------------------------------------------------------------
  const eventForm = document.getElementById('event-form');
  const eventList = document.getElementById('event-list');

  async function loadEvents() {
    try {
      const items = await api('/events');
      if (!items.length) {
        eventList.innerHTML = '<p class="empty">Keine Veranstaltungen.</p>';
        return;
      }
      eventList.innerHTML = items
        .map(
          (e) => `
          <div class="item">
            <div>
              <h3>${esc(e.title)}</h3>
              <div class="meta">${esc(e.event_date || '')} ${esc(e.event_time || '')} · ${esc(e.location || '')}</div>
            </div>
            <button class="del" data-id="${e.id}">Löschen</button>
          </div>`
        )
        .join('');
      eventList.querySelectorAll('.del').forEach((b) =>
        b.addEventListener('click', () => delEvent(b.dataset.id))
      );
    } catch (e) {
      eventList.innerHTML = '<p class="empty">Fehler: ' + esc(e.message) + '</p>';
    }
  }

  eventForm.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const fd = new FormData(eventForm);
    try {
      await api('/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: fd.get('title'),
          kind: fd.get('kind'),
          event_date: fd.get('event_date'),
          event_time: fd.get('event_time'),
          location: fd.get('location'),
          description: fd.get('description'),
        }),
      });
      eventForm.reset();
      toast('Veranstaltung gespeichert');
      loadEvents();
    } catch (e) {
      toast(e.message, true);
    }
  });

  async function delEvent(id) {
    if (!confirm('Diese Veranstaltung wirklich löschen?')) return;
    try {
      await api('/events/' + id, { method: 'DELETE' });
      toast('Gelöscht');
      loadEvents();
    } catch (e) {
      toast(e.message, true);
    }
  }

  // -------------------------------------------------------------------------
  // PHOTOS
  // -------------------------------------------------------------------------
  const photoForm = document.getElementById('photo-form');
  const photoList = document.getElementById('photo-list');

  async function loadPhotos() {
    try {
      const items = await api('/photos');
      if (!items.length) {
        photoList.innerHTML = '<p class="empty">Noch keine Fotos.</p>';
        return;
      }
      photoList.innerHTML = items
        .map(
          (p) => `
          <figure>
            <img src="${esc(p.url)}" alt="${esc(p.title || '')}" />
            <button class="del" data-id="${p.id}">✕</button>
          </figure>`
        )
        .join('');
      photoList.querySelectorAll('.del').forEach((b) =>
        b.addEventListener('click', () => delPhoto(b.dataset.id))
      );
    } catch (e) {
      photoList.innerHTML = '<p class="empty">Fehler: ' + esc(e.message) + '</p>';
    }
  }

  photoForm.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    // Datei per multipart/form-data hochladen — kein JSON-Header setzen!
    const fd = new FormData(photoForm);
    try {
      const res = await fetch(API + '/uploads', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload fehlgeschlagen');
      photoForm.reset();
      toast('Foto hochgeladen');
      loadPhotos();
    } catch (e) {
      toast(e.message, true);
    }
  });

  async function delPhoto(id) {
    if (!confirm('Dieses Foto wirklich löschen?')) return;
    try {
      const res = await fetch(API + '/uploads/' + id, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Löschen fehlgeschlagen');
      toast('Gelöscht');
      loadPhotos();
    } catch (e) {
      toast(e.message, true);
    }
  }

  // -------------------------------------------------------------------------
  // Initial laden
  // -------------------------------------------------------------------------
  loadNews();
  loadEvents();
  loadPhotos();
})();
