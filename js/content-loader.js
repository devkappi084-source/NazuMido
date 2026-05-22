/* ============================================================
   NazuMido – Dynamic Content Loader
   Lädt Inhalte aus data/*.json und aktualisiert die Seite.
   Funktioniert auf statischen Hosts (Cloudflare Pages, GitHub Pages etc.)
   ============================================================ */

const MONTH_SHORT = ['Jan','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez'];
const MONTH_LONG  = ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];

const TYPE_LABEL = {
    highlight: 'Highlight', ball: 'Ball', familie: 'Familie',
    abschluss: 'Finale',    sonstig: 'Event'
};

function setText(id, text) {
    const el = document.getElementById(id);
    if (el && text) el.textContent = text;
}
function setHTML(id, html) {
    const el = document.getElementById(id);
    if (el && html) el.innerHTML = html;
}
function setHref(id, href) {
    const el = document.getElementById(id);
    if (el && href && href !== '#') el.href = href;
}
function show(id)    { const el = document.getElementById(id); if (el) el.style.display = ''; }
function hide(id)    { const el = document.getElementById(id); if (el) el.style.display = 'none'; }
function svgFacebook() {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>`;
}
function svgInstagram() {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>`;
}

async function loadContent() {
    try {
        const res = await fetch('data/content.json?v=' + Date.now());
        if (!res.ok) return;
        const c = await res.json();

        // Hero
        if (c.hero) {
            setText('hero-pretext',    c.hero.pretext);
            setText('hero-subtitle',   c.hero.subtitle);
            setText('hero-location',   c.hero.location);
            setText('hero-motto',      c.hero.motto);
            setText('nav-title',       c.hero.title);
            setText('nav-subtitle',    c.hero.subtitle);
            setText('footer-title',    c.hero.title);
            setText('footer-subtitle', c.hero.subtitle);
        }
        // About
        if (c.about) {
            setText('about-eyebrow',   c.about.eyebrow);
            setHTML('about-lead',      c.about.lead);
            setText('about-text1',     c.about.text1);
            setHTML('about-text2',     c.about.text2);
            setText('stat-years',      c.about.stat_years);
            setText('stat-members',    c.about.stat_members);
            setText('card1-title',     c.about.card1_title);
            setText('card1-text',      c.about.card1_text);
            setText('card2-title',     c.about.card2_title);
            setText('card2-text',      c.about.card2_text);
            setText('card3-title',     c.about.card3_title);
            setText('card3-text',      c.about.card3_text);
        }
        // Groups
        if (c.groups) {
            setText('garde-desc',    c.groups.garde_desc);
            setText('elferrat-desc', c.groups.elferrat_desc);
            setText('prinzen-desc',  c.groups.prinzen_desc);
            setText('hexen-desc',    c.groups.hexen_desc);
        }
    } catch(e) { /* JSON nicht verfügbar – Standardtexte bleiben */ }
}

async function loadSettings() {
    try {
        const res = await fetch('data/settings.json?v=' + Date.now());
        if (!res.ok) return;
        const s = await res.json();

        // Contact
        if (s.contact) {
            const parts = [
                s.contact.address_name,
                s.contact.address_street,
                s.contact.address_city,
                s.contact.address_country
            ].filter(Boolean);
            setHTML('contact-address', parts.join('<br>'));

            if (s.contact.email) {
                const emailEl = document.getElementById('contact-email-link');
                if (emailEl) { emailEl.href = 'mailto:' + s.contact.email; emailEl.textContent = s.contact.email; }
                const formEmail = document.getElementById('form-email');
                if (formEmail) { formEmail.href = 'mailto:' + s.contact.email; formEmail.textContent = s.contact.email; }
                const mitglied = document.getElementById('mitglied-link');
                if (mitglied) mitglied.href = 'mailto:' + s.contact.email + '?subject=Mitgliedschaft bei NazuMido';
                const gallEmail = document.getElementById('gallery-email-link');
                if (gallEmail) gallEmail.href = 'mailto:' + s.contact.email + '?subject=Fotos NazuMido';
                const footerEmail = document.getElementById('footer-email');
                if (footerEmail) { footerEmail.href = 'mailto:' + s.contact.email; footerEmail.textContent = s.contact.email; }
            }
            if (s.contact.address_city) {
                setText('footer-address-city', s.contact.address_city);
                setText('footer-city', s.contact.address_city + ' · Oberösterreich');
            }
        }

        // Social
        if (s.social) {
            let hasSocial = false;
            const fbLink = document.getElementById('fb-link');
            const igLink = document.getElementById('ig-link');
            if (s.social.facebook && s.social.facebook !== '#') {
                if (fbLink) { fbLink.href = s.social.facebook; fbLink.style.display = ''; }
                hasSocial = true;
                // Footer
                const footSocial = document.getElementById('footer-social');
                if (footSocial) footSocial.innerHTML += `<a href="${s.social.facebook}" class="footer-social-btn" target="_blank" rel="noopener" aria-label="Facebook">${svgFacebook()}</a>`;
            }
            if (s.social.instagram && s.social.instagram !== '#') {
                if (igLink) { igLink.href = s.social.instagram; igLink.style.display = ''; }
                hasSocial = true;
                const footSocial = document.getElementById('footer-social');
                if (footSocial) footSocial.innerHTML += `<a href="${s.social.instagram}" class="footer-social-btn" target="_blank" rel="noopener" aria-label="Instagram">${svgInstagram()}</a>`;
            }
            if (hasSocial) hide('no-social');
        }

        // General
        if (s.general) {
            if (s.general.season) {
                setText('season-label', 'Saison ' + s.general.season);
                setText('btn-termine', 'Termine ' + s.general.season);
                setText('footer-season', 'Saison ' + s.general.season);
            }
        }
    } catch(e) {}
}

async function loadEvents() {
    try {
        const res = await fetch('data/events.json?v=' + Date.now());
        if (!res.ok) return;
        const events = await res.json();

        if (!events.length) return;

        // Sort by date
        events.sort((a, b) => a.date.localeCompare(b.date));

        // Find featured + others
        let featured = events.find(e => e.featured) || events[0];
        let others   = events.filter(e => e !== featured).slice(0, 4);

        // Build featured
        const d       = new Date(featured.date);
        const featEl  = document.querySelector('.event-featured');
        if (featEl) {
            featEl.querySelector('.efd-day').textContent   = String(d.getDate()).padStart(2,'0');
            featEl.querySelector('.efd-month').textContent = MONTH_LONG[d.getMonth()];
            featEl.querySelector('.efd-year').textContent  = d.getFullYear();
            const body = featEl.querySelector('.event-featured-body');
            body.querySelector('h3').textContent   = featured.title;
            body.querySelector('p').textContent    = featured.description || '';
            const meta = body.querySelector('.event-meta');
            meta.innerHTML = '';
            if (featured.location) meta.innerHTML += `<span class="event-meta-item">📍 ${featured.location}</span>`;
            if (featured.time)     meta.innerHTML += `<span class="event-meta-item">🕐 ${featured.time}</span>`;
        }

        // Build list
        const listEl = document.getElementById('events-list');
        if (listEl && others.length) {
            listEl.innerHTML = others.map((e, i) => {
                const ed   = new Date(e.date);
                const type = e.type || 'sonstig';
                return `
                <div class="event-row reveal-right" style="transition-delay:${i*0.1}s">
                    <div class="event-row-date">
                        <span class="erd-month">${MONTH_SHORT[ed.getMonth()]}</span>
                        <span class="erd-year">'${String(ed.getFullYear()).slice(2)}</span>
                    </div>
                    <div class="event-row-content">
                        <h4>${e.title}</h4>
                        <p>${e.description || ''}</p>
                    </div>
                    <span class="event-type ${type}">${TYPE_LABEL[type] || 'Event'}</span>
                </div>`;
            }).join('');
        }
    } catch(e) {}
}

async function loadGallery() {
    try {
        // Try to load gallery.json if it exists (optional)
        const res = await fetch('data/gallery.json?v=' + Date.now());
        if (!res.ok) return;
        const images = await res.json();
        if (!images.length) return;

        const grid = document.getElementById('gallery-grid');
        if (!grid) return;

        grid.innerHTML = images.slice(0, 9).map((img, i) => {
            const isWide = i === 0 || i === 5;
            return `
            <div class="gallery-item ${isWide ? 'gallery-wide' : ''} reveal-up" style="transition-delay:${i*0.05}s">
                <img src="images/gallery/${img.filename}" alt="${img.title || 'NazuMido Foto'}" class="gallery-real-img" loading="lazy">
                <div class="gallery-overlay">
                    <span class="gallery-zoom">🔍</span>
                    ${img.title ? `<span class="gallery-label">${img.title}</span>` : ''}
                </div>
            </div>`;
        }).join('');

    } catch(e) { /* Kein gallery.json – statische Fotos bleiben */ }
}

// Run all loaders
Promise.all([loadContent(), loadSettings(), loadEvents(), loadGallery()]).then(() => {
    // Re-trigger reveal observer for dynamically added elements
    document.querySelectorAll('.reveal-right, .reveal-up, .reveal-left').forEach(el => {
        if (!el.classList.contains('in-view')) {
            revealObserver?.observe(el);
        }
    });
});
