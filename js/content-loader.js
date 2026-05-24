/* ============================================================
   NazuMido – Dynamic Content Loader (Redesign)
   1. Fetches /api/config for live KV overrides (instant updates)
   2. Falls back to data/*.json static files when KV is empty
   ============================================================ */

const MONTH_SHORT = ['Jan','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez'];
const MONTH_LONG  = ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];

function setText(id, text) {
    const el = document.getElementById(id);
    if (el && text != null) el.textContent = text;
}
function setHTML(id, html) {
    const el = document.getElementById(id);
    if (el && html != null) el.innerHTML = html;
}
function setHref(id, href) {
    const el = document.getElementById(id);
    if (el && href && href !== '#') el.href = href;
}

function svgFacebook() {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>`;
}
function svgInstagram() {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>`;
}

// ── KV override cache (fetched once per page load) ───────────
let _kv = null;
async function kv() {
    if (_kv !== null) return _kv;
    try {
        const r = await fetch('/api/config', { cache: 'no-store' });
        _kv = r.ok ? await r.json() : {};
    } catch { _kv = {}; }
    return _kv;
}
async function fetchJSON(path) {
    try {
        const r = await fetch(path + '?v=' + Date.now());
        return r.ok ? r.json() : null;
    } catch { return null; }
}

/* ============================================================
   CONTENT (hero, about, groups text)
   ============================================================ */
async function loadContent() {
    const overrides = await kv();
    const c = overrides.content || await fetchJSON('data/content.json');
    if (!c) return;

    if (c.hero) {
        // Update hero eyebrow/sub text if available in KV
        if (c.hero.pretext)    setText('hero-eyebrow', c.hero.pretext);
        if (c.hero.subtitle)   setText('hero-sub',     c.hero.subtitle);
        if (c.hero.title) {
            setText('footer-title', c.hero.title);
        }
        if (c.hero.subtitle)   setText('footer-subtitle', c.hero.subtitle);
    }
    if (c.about) {
        if (c.about.lead)        setHTML('about-lead',   c.about.lead);
        if (c.about.text1)       setText('about-text1',  c.about.text1);
        if (c.about.text2)       setHTML('about-text2',  c.about.text2);
        if (c.about.stat_years)  setText('stat-years',   c.about.stat_years);
        if (c.about.stat_members) setText('stat-members', c.about.stat_members);
    }
    if (c.groups) {
        if (c.groups.garde_desc)   setText('garde-desc',   c.groups.garde_desc);
        if (c.groups.musikzug_desc) setText('musikzug-desc', c.groups.musikzug_desc);
        // Support both elferrat_desc and vorsitz_desc
        const vd = c.groups.vorsitz_desc || c.groups.elferrat_desc;
        if (vd) setText('vorsitz-desc', vd);
    }
}

/* ============================================================
   SETTINGS (contact, social, general)
   ============================================================ */
async function loadSettings() {
    const overrides = await kv();
    const s = overrides.settings || await fetchJSON('data/settings.json');
    if (!s) return;

    if (s.contact) {
        // Build address string
        const parts = [
            s.contact.address_name,
            s.contact.address_street,
            s.contact.address_city,
            s.contact.address_country
        ].filter(Boolean);
        if (parts.length) setHTML('contact-address', parts.join(', '));

        if (s.contact.email) {
            const e = s.contact.email;
            // Update all email links
            ['contact-email-link', 'footer-email', 'gallery-email-link'].forEach(id => {
                const el = document.getElementById(id);
                if (el) {
                    if (id === 'gallery-email-link') {
                        el.href = 'mailto:' + e + '?subject=Fotos NazuMido';
                    } else {
                        el.href = 'mailto:' + e;
                        if (id === 'contact-email-link') el.textContent = e;
                        if (id === 'footer-email')       el.textContent = e;
                    }
                }
            });
        }

        if (s.contact.address_city) {
            setText('footer-address-city', s.contact.address_city);
        }
    }

    if (s.social) {
        const socialContainers = ['footer-social', 'footer-social-links'];
        const links = [];
        if (s.social.facebook && s.social.facebook !== '#') {
            links.push(`<a href="${s.social.facebook}" target="_blank" rel="noopener" aria-label="Facebook">${svgFacebook()}</a>`);
        }
        if (s.social.instagram && s.social.instagram !== '#') {
            links.push(`<a href="${s.social.instagram}" target="_blank" rel="noopener" aria-label="Instagram">${svgInstagram()}</a>`);
        }
        if (links.length) {
            socialContainers.forEach(id => {
                const el = document.getElementById(id);
                if (el) el.innerHTML = links.join('');
            });
        }
    }

    if (s.general) {
        if (s.general.season) {
            setText('footer-season',  'Saison ' + s.general.season);
            setText('events-eyebrow', 'Kalender · ' + s.general.season);
            setText('people-eyebrow', 'Vorstand · Saison ' + s.general.season);
            setText('footer-copy',    '© ' + new Date().getFullYear() + ' NazuMido – Narrenzunft der schwarzen Grafen | Kirchdorf an der Krems');
        }
        if (s.general.members) {
            setText('hero-members', s.general.members + ' Närrinnen & Narren');
            setText('stat-members', s.general.members);
        }
    }
}

/* ============================================================
   EVENTS (render into #events-list in the new design style)
   ============================================================ */
async function loadEvents() {
    const overrides = await kv();
    const events    = overrides.events || await fetchJSON('data/events.json');
    if (!events || !events.length) return;

    events.sort((a, b) => a.date.localeCompare(b.date));

    // Filter to future/upcoming events (up to 6)
    const now     = new Date().toISOString().slice(0, 10);
    const upcoming = events.filter(e => e.date >= now).slice(0, 6);
    const toShow   = upcoming.length ? upcoming : events.slice(0, 6);

    // Update hero "next event" meta
    if (toShow.length) {
        const first = toShow[0];
        const fd    = new Date(first.date);
        setText('hero-next-event', first.title);
        setText('hero-season', '11.11.2026 — Frühjahr 2027');
    }

    const listEl = document.getElementById('events-list');
    if (!listEl || !toShow.length) return;

    const arrowSvg = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>`;

    listEl.innerHTML = toShow.map((e, i) => {
        const ed  = new Date(e.date);
        const day = ed.getDate();
        const mon = MONTH_SHORT[ed.getMonth()];
        const eventId = e.id || ('ev_' + i);

        // Store event data for modal
        if (window._eventData) {
            window._eventData[eventId] = {
                title:       e.title,
                kind:        (e.type || 'Event'),
                description: e.description || '',
                day:         day,
                month:       mon,
                where:       e.location || 'Kirchdorf an der Krems',
                time:        e.time || ''
            };
        }

        return `
        <div class="event-row reveal-up" style="transition-delay:${i * 0.08}s" data-event-id="${eventId}">
          <div class="event-date">
            <span class="d">${day}</span>
            <span class="m">${mon}</span>
          </div>
          <div class="event-title">
            <h3>${e.title}</h3>
            <span class="kind">${e.type || 'Event'} · ${ed.getFullYear()}</span>
          </div>
          <div class="event-desc">${e.description || ''}</div>
          <div class="event-where">
            ${e.time ? `<span class="time">${e.time}</span>` : '<span class="time">—</span>'}
            ${e.location || 'Kirchdorf an der Krems'}
          </div>
          <div class="event-arrow" aria-hidden>${arrowSvg}</div>
        </div>`;
    }).join('');

    // Re-wire click handlers after DOM update
    if (typeof window.wireEventRows === 'function') {
        window.wireEventRows();
    }

    // Re-observe reveal elements
    listEl.querySelectorAll('.reveal-up').forEach(el => {
        if (window.revealObserver && !el.classList.contains('in-view')) {
            window.revealObserver.observe(el);
        }
    });
}

/* ============================================================
   GALLERY (KV-driven photo grid)
   ============================================================ */
async function loadGallery() {
    const overrides = await kv();
    const images    = overrides.gallery || await fetchJSON('data/gallery.json');
    if (!images || !images.length) return;

    const grid = document.getElementById('gallery-grid');
    if (!grid) return;

    grid.innerHTML = images.slice(0, 5).map((img, i) => {
        const isBig = i === 0;
        const src   = 'images/gallery/' + img.filename;
        const alt   = img.title || 'NazuMido Foto';
        return `<div class="${isBig ? 'big' : ''}">
            <img src="${src}" alt="${alt}" loading="lazy"
                 onerror="this.parentElement.innerHTML='<div class=placeholder>${alt}</div>'">
        </div>`;
    }).join('');

    // Re-init lightbox after gallery content update
    if (typeof window.initGallery === 'function') {
        window.initGallery();
    }
}

/* ============================================================
   Bootstrap
   ============================================================ */
Promise.all([
    loadContent(),
    loadSettings(),
    loadEvents(),
    loadGallery()
]).then(() => {
    // Observe any dynamically added reveal elements
    document.querySelectorAll('.reveal-up, .reveal-left, .reveal-right').forEach(el => {
        if (window.revealObserver && !el.classList.contains('in-view')) {
            window.revealObserver.observe(el);
        }
    });
});
