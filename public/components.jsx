const { useState, useEffect, useMemo } = React;

// ---------- Top Bar ----------
function TopBar({ route, navigate, user, onLogout }) {
  const items = [
    { id: 'home', label: 'Start' },
    { id: 'garde', label: 'Garde' },
    { id: 'musikzug', label: 'Musikzug' },
    { id: 'vorsitz', label: 'Präsidium' },
    { id: 'galerie', label: 'Galerie' },
    { id: 'sponsoren', label: 'Sponsoren' },
  ].filter(it => it.id !== 'galerie' || galleryConfig().showInNav);
  const strip = ((window.SITE_CONFIG || SITE_CONFIG).topbarStrip || []).filter(t => String(t).trim());
  // Laufschrift nur, wenn ein Termin ansteht (siehe Einstellungen › Laufschrift)
  const showStrip = showTopbarStrip();
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <header className="topbar">
      {showStrip && (
        <div className="topbar-strip">
          <div className="topbar-strip-track">
            {[...strip, ...strip].map((t, i) => (
              <span key={i}><span className={"dot" + (i % 2 ? " g" : "")}></span>{t}</span>
            ))}
          </div>
        </div>
      )}
      <div className="container">
        <nav className="nav">
          <a className="nav-brand" href="#home"
            onClick={(e) => { e.preventDefault(); navigate('home'); setMobileOpen(false); }}>
            <img src="assets/logo.png" alt="Nazumido Wappen" />
            <span>
              Nazumido
              <small>Faschingsverein · seit 1962</small>
            </span>
          </a>
          <ul className="nav-links">
            {items.map(it => (
              <li key={it.id}>
                <a href={`#${it.id}`}
                  className={route === it.id ? 'active' : ''}
                  onClick={(e) => { e.preventDefault(); navigate(it.id); }}>
                  {it.label}
                </a>
              </li>
            ))}
          </ul>
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }} className="nav-user-area">
              {hasRight(user, 'admin') && (
                <a className="nav-adminlink" href="#admin"
                  onClick={(e) => { e.preventDefault(); navigate('admin'); }}>
                  Verwaltung
                </a>
              )}
              <button className="nav-cta" style={{ background: 'var(--ink)' }}
                onClick={() => navigate('mitglieder')}>
                <span style={{ width: 22, height: 22, borderRadius: 999, background: 'var(--red)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--serif)', fontSize: 14 }}>
                  {user.avatar}
                </span>
                {user.name.split(' ')[0]}
              </button>
            </div>
          ) : (
            <a className="nav-cta" href="#login"
              onClick={(e) => { e.preventDefault(); navigate('login'); }}>
              Mitglieder-Login
              <span aria-hidden>→</span>
            </a>
          )}
          <button className="nav-burger" onClick={() => setMobileOpen(o => !o)} aria-label="Menü">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="7" x2="21" y2="7"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="17" x2="21" y2="17"/>
            </svg>
          </button>
        </nav>
        <div className={"mobile-menu" + (mobileOpen ? ' open' : '')}>
          {items.map(it => (
            <a key={it.id} href={`#${it.id}`}
              onClick={(e) => { e.preventDefault(); navigate(it.id); setMobileOpen(false); }}>
              {it.label}
            </a>
          ))}
          <a href="#mitglieder"
            onClick={(e) => { e.preventDefault(); navigate(user ? 'mitglieder' : 'login'); setMobileOpen(false); }}>
            {user ? `Mitgliederbereich (${user.name})` : 'Mitglieder-Login'}
          </a>
          {user && hasRight(user, 'admin') && (
            <a href="#admin"
              onClick={(e) => { e.preventDefault(); navigate('admin'); setMobileOpen(false); }}>
              Verwaltung
            </a>
          )}
        </div>
      </div>
    </header>
  );
}

// ---------- Hero ----------
function Hero({ navigate }) {
  const confettiPieces = useMemo(() => {
    const colors = ['#C8202C', '#1E6E3F', '#FBF8F2', '#C9A24B', '#16140F'];
    return Array.from({ length: 24 }, (_, i) => ({
      left: Math.random() * 100,
      top: Math.random() * 100,
      rot: Math.random() * 360,
      color: colors[i % colors.length],
    }));
  }, []);
  return (
    <section className="hero" id="home">
      <div className="confetti" aria-hidden>
        {confettiPieces.map((c, i) => (
          <span key={i} style={{
            left: `${c.left}%`, top: `${c.top}%`,
            background: c.color,
            transform: `rotate(${c.rot}deg)`,
            opacity: 0.5,
          }} />
        ))}
      </div>
      <div className="container">
        <div className="hero-grid">
          <div>
            <div className="divider-bars">
              <span className="r"></span>
              <span className="w"></span>
              <span className="g"></span>
            </div>
            <span className="eyebrow no-rule">Session 2026 · Helau & Narri</span>
            <h1 style={{ marginTop: 12 }}>
              Nazu<span className="accent">·</span><br/>
              <span className="accent-g">mido</span>
            </h1>
            <p className="hero-sub">
              Der Faschingsverein aus Micheldorf — seit über sechs Jahrzehnten
              bunt, laut und herzlich.
            </p>
            <dl className="hero-meta">
              <div>
                <dt>Saison</dt>
                <dd>{SITE_CONFIG.season}</dd>
              </div>
              <div>
                <dt>Mitglieder</dt>
                <dd>{SITE_CONFIG.memberCount} Närrinnen & Narren</dd>
              </div>
              <div>
                <dt>Nächstes Event</dt>
                <dd>{SITE_CONFIG.heroNextEvent}</dd>
              </div>
            </dl>
          </div>
          <div className="hero-poster">
            <div className="logo-disc">
              <img src="assets/logo.png" alt="Nazumido Wappen" />
            </div>
            <div className="hero-poster-footer">
              <span>Wappen 1962</span>
              <span>★ Helau ★</span>
              <span>Micheldorf · OÖ</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------- Welcome ----------
function Welcome() {
  return (
    <section className="welcome block">
      <div className="container">
        <div className="welcome-grid">
          <div className="welcome-text">
            <span className="eyebrow">Willkommen</span>
            <h2 style={{ marginTop: 16 }}>
              Die Narrenzunft der<br/><span className="it">Schwarzen Grafen.</span>
            </h2>
            <p style={{ marginTop: 22 }}>
              Die NAZU-MIDO ist seit 1996 ein eingetragener Verein, der sich
              bemüht, das Brauchtum im und um den Fasching in Micheldorf zu pflegen.
            </p>
            <p>
              Unser Name leitet sich von den alten Sensenschmieden ab — diese wurden
              als schwarze Grafen bezeichnet. In unserem Wappen finden sich die Farben
              von Micheldorf und die sogenannte Feinsonne, ein Zeichen, das von den
              ansässigen Schmieden verwendet wurde.
            </p>
            <p>
              Offizielle Botschafter für die 5. Jahreszeit sind Präsident Johann Bloderer
              und Vizepräsidentin Tamara Schubert. Musikalisch werden wir von unserem
              Trommler- und Fanfarenzug vertreten, diverse Veranstaltungen werden durch
              Aufführungen unserer Tanzgruppe aufgewertet.
            </p>
            <div className="signature">— {SITE_CONFIG.presidentName}, Präsident</div>
          </div>
          <div className="welcome-stats">
            <div className="welcome-stat">
              <span className="n"><span className="accent">{SITE_CONFIG.welcomeYears}</span></span>
              <span className="l">Jahre Tradition</span>
            </div>
            <div className="welcome-stat">
              <span className="n">{SITE_CONFIG.welcomeMembers}</span>
              <span className="l">Mitglieder</span>
            </div>
            <div className="welcome-stat">
              <span className="n"><span className="accent-g">{SITE_CONFIG.welcomeGroups}</span></span>
              <span className="l">Aktive Gruppen</span>
            </div>
            <div className="welcome-stat">
              <span className="n">{SITE_CONFIG.welcomeEvents}</span>
              <span className="l">Events pro Jahr</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------- News Feed ----------
function NewsFeed({ onOpen }) {
  const [tag, setTag] = useState('Alle');
  const items = tag === 'Alle' ? NEWS : NEWS.filter(n => n.tag === tag);
  return (
    <section className="block" id="news">
      <div className="container">
        <div className="section-head">
          <div>
            <span className="eyebrow">Aktuelles</span>
            <h2 style={{ marginTop: 14 }}>Aus dem <span className="italic" style={{color:'var(--red)'}}>Vereinsleben</span></h2>
          </div>
          <p className="lead">
            Rückblicke, Ankündigungen und Geschichten — jeden Monat frisch
            aus dem Hofnarrenkessel.
          </p>
        </div>

        <div className="feed-tabs">
          {TAGS.map(t => (
            <button key={t} className={"feed-tab" + (tag === t ? ' active' : '')} onClick={() => setTag(t)}>
              {t}
            </button>
          ))}
        </div>

        <div className="feed-grid">
          {items.map((n) => (
            <article key={n.id}
              className={"feed-card" + (n.feature && tag === 'Alle' ? ' feature' : '')}
              onClick={() => onOpen(n)}>
              <div className="feed-media">
                {n.image ? <img src={n.image} alt="" /> : <div className="feed-media-placeholder">Foto · {n.tag}</div>}
                <span className={"feed-tag " + (n.tagColor || 'red')}>
                  <span className="dot"></span>{n.tag}
                </span>
              </div>
              <div className="feed-body">
                <div className="feed-meta">
                  <span>{n.date}</span>
                  <span>· {n.readTime}</span>
                </div>
                <h3 className="feed-title">{n.title}</h3>
                <p className="feed-excerpt">{n.excerpt}</p>
                <span className="feed-readmore">Weiterlesen →</span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

// Reservierung in einem eigenen Browser-Tab öffnen (#reservierung/<event-id>).
// Gibt false zurück, wenn das nicht gewünscht oder vom Popup-Blocker verhindert
// wurde — dann übernimmt wie bisher das Modal.
function openTicketTab(event) {
  if (!event || ticketConfig().openInNewTab === false) return false;
  const url = `${window.location.pathname}${window.location.search}#reservierung/${event.id}`;
  const win = window.open(url, '_blank', 'noopener');
  if (!win) return false;
  try { win.focus(); } catch (e) {}
  return true;
}

// ---------- Events ----------
function EventsBand({ onOpen }) {
  const cfg = ticketConfig();
  // Reservierung öffnen: eigener Tab, sonst Modal direkt im Formular
  const startTickets = (e) => { if (!openTicketTab(e)) onOpen({ ...e, _tickets: true }); };
  const openTickets = (e, ev) => { ev.stopPropagation(); startTickets(e); };
  const nextTicketEvent = reservableEvents()[0];
  return (
    <section className="block events-band" id="events">
      <div className="container">
        <div className="section-head">
          <div>
            <span className="eyebrow">Kalender · 2026</span>
            <h2 style={{ marginTop: 14, color: 'var(--cream)' }}>
              Kommende <span className="italic" style={{color:'var(--gold)'}}>Events</span>
            </h2>
          </div>
          <p className="lead">
            Von Umzug bis Kehraus: hier laufen alle Fäden zusammen.
            Klick auf ein Event für Details, Tickets und Anfahrt.
          </p>
        </div>

        <div className="events-list">
          {allEvents().map(e => {
            const st = ticketState(e);
            return (
            <div key={e.id} className="event-row" onClick={() => onOpen(e)}>
              <div className="event-date">
                <span className="d">{e.d}</span>
                <span className="m">{e.m}</span>
              </div>
              <div className="event-title">
                <h3>{e.title}</h3>
                <span className="kind">{e.kind}</span>
                {cfg.showInEvents && st.open && (
                  <button className="event-ticket" onClick={ev => openTickets(e, ev)}>
                    <span className="dot" aria-hidden></span>{cfg.ctaLabel}
                  </button>
                )}
                {cfg.showInEvents && st.reason === 'soon' && (
                  <span className="event-ticket soon">
                    <span className="dot" aria-hidden></span>
                    Reservierung ab {dateLabel(st.opensAt)}
                  </span>
                )}
              </div>
              <div className="event-desc">{e.desc}</div>
              <div className="event-where">
                <span className="time">{e.time}</span>
                {e.day} · {e.where}
              </div>
              <div className="event-arrow" aria-hidden>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="5" y1="12" x2="19" y2="12"/>
                  <polyline points="12 5 19 12 12 19"/>
                </svg>
              </div>
            </div>
            );
          })}
        </div>

        <div className="events-foot">
          <p style={{ color: 'rgba(247,241,230,0.7)', fontSize: 14, margin: 0 }}>
            {nextTicketEvent
              ? `Online-Reservierung offen für „${nextTicketEvent.title}" am ${eventDateLabel(nextTicketEvent)}.`
              : 'Alle Termine und vergangene Veranstaltungen findest du im Archiv.'}
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {nextTicketEvent && (
              <button className="btn" onClick={() => startTickets(nextTicketEvent)}>
                {cfg.ctaLabel}
              </button>
            )}
            <button className="btn ghost">In Kalender exportieren</button>
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------- Ticket-Reservierung (Event-Modal oder eigene Seite) ----------
// `standalone` = eigener Tab (#reservierung): breitere Darstellung, Druck-Button
// und Hinweis, dass die Reservierung in der Vereinsliste liegt.
function TicketForm({ event, onBack, backLabel, standalone }) {
  const cfg = ticketConfig();
  const [form, setForm] = useState({ name: '', email: '', phone: '', count: 2, note: '' });
  const [err, setErr] = useState('');
  const [done, setDone] = useState(null);
  // Zustand der automatischen Bestätigungsmail: null = kein Versuch,
  // 'sending' | 'sent' | 'failed'
  const [mail, setMail] = useState(null);
  const max = cfg.maxPerBooking;
  const when = eventDateLabel(event);
  const f = k => ({ value: form[k], onChange: e => { setForm({ ...form, [k]: e.target.value }); setErr(''); } });

  const submit = (e) => {
    e.preventDefault();
    const count = parseInt(form.count, 10);
    if (!form.name.trim())  { setErr('Bitte gib deinen Namen an.'); return; }
    if (!form.email.trim()) { setErr('Ohne E-Mail-Adresse können wir die Reservierung nicht bestätigen.'); return; }
    if (cfg.requirePhone && !form.phone.trim()) { setErr('Bitte gib eine Telefonnummer an.'); return; }
    if (!(count > 0) || count > max) { setErr(`Bitte 1 bis ${max} Plätze wählen.`); return; }
    const at = eventDate(event);
    const entry = addReservation({
      eventId: event.id,
      eventTitle: event.title,
      eventDate: when,
      // ISO-Datum für Sortierung und Filter in der Admin-Liste
      eventIso: at ? `${at.getFullYear()}-${String(at.getMonth() + 1).padStart(2, '0')}-${String(at.getDate()).padStart(2, '0')}` : '',
      eventTime: event.time || '',
      eventWhere: event.where || '',
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      count,
      note: form.note.trim(),
    });
    setDone(entry);
    // Bestätigungsmail übernimmt der Worker; klappt das nicht (kein Backend,
    // Anbieter nicht eingerichtet), bleibt der mailto-Link als Weg.
    if (cfg.autoMail !== false) {
      setMail({ state: 'sending' });
      submitReservation(entry).then(r => {
        setMail(r.ok && r.mail && r.mail.visitor === 'sent'
          ? { state: 'sent' }
          : { state: 'failed', reason: (r.mail && r.mail.visitor) || r.reason });
      });
    }
  };

  if (done) {
    const to = cfg.notifyEmail || siteConfig().email || '';
    const body = [
      `Reservierung ${done.code}`,
      `Veranstaltung: ${done.eventTitle} am ${done.eventDate}${done.eventTime ? ', ' + done.eventTime : ''}`,
      `Name: ${done.name}`,
      `E-Mail: ${done.email}`,
      done.phone ? `Telefon: ${done.phone}` : null,
      `Plätze: ${done.count}`,
      done.note ? `Anmerkung: ${done.note}` : null,
    ].filter(Boolean).join('\n');
    const mailto = `mailto:${to}?subject=${encodeURIComponent(`Ticket-Reservierung ${done.code} — ${done.eventTitle}`)}&body=${encodeURIComponent(body)}`;
    return (
      <div className="ticket-done">
        <span className="code">{done.code}</span>
        <h3>{cfg.successTitle}</h3>
        <p>{cfg.successText}</p>
        <ul className="ticket-summary">
          <li><span>Veranstaltung</span><strong>{done.eventTitle}</strong></li>
          <li><span>Termin</span><strong>{done.eventDate}{done.eventTime ? ` · ${done.eventTime}` : ''}</strong></li>
          {done.eventWhere && <li><span>Ort</span><strong>{done.eventWhere}</strong></li>}
          <li><span>Plätze</span><strong>{done.count}</strong></li>
          <li><span>Auf den Namen</span><strong>{done.name}</strong></li>
        </ul>
        {mail && (
          <div className={'ticket-mailstate' + (mail.state === 'sent' ? ' ok' : mail.state === 'failed' ? ' warn' : '')}>
            {mail.state === 'sending' && <>Bestätigung wird an <strong>{done.email}</strong> geschickt …</>}
            {mail.state === 'sent' && <>✓ Bestätigung an <strong>{done.email}</strong> geschickt.</>}
            {mail.state === 'failed' && <>Die Bestätigungsmail konnte nicht automatisch verschickt werden. Lade sie als PDF herunter{cfg.showMailCopy && to ? ' oder schick uns die Reservierung per E-Mail' : ''} — wir melden uns.</>}
          </div>
        )}
        <div className="photo-modal-actions">
          {cfg.offerPdf !== false && window.NzPdf && (
            <button className="btn" onClick={() => window.NzPdf.saveReservationPdf(done, cfg)}>
              Bestätigung als PDF
            </button>
          )}
          {cfg.showMailCopy && to && (!mail || mail.state !== 'sent') && (
            <a className="btn outline-dark" href={mailto}>Reservierung per E-Mail senden</a>
          )}
          <button className="btn outline-dark" onClick={onBack}>{backLabel || 'Zurück zum Termin'}</button>
        </div>
        {standalone && (
          <p className="ticket-fineprint" style={{ marginTop: 18 }}>
            Deine Reservierung liegt jetzt unter der Kennung <strong>{done.code}</strong> in
            unserer Liste. Notiere sie dir — an der Abendkasse genügt sie zusammen mit deinem Namen.
          </p>
        )}
      </div>
    );
  }

  return (
    <form className="ticket-form" onSubmit={submit}>
      <button type="button" className="ticket-back" onClick={onBack}>{backLabel || '← Zurück zum Termin'}</button>
      <h3>{cfg.title}</h3>
      <p className="ticket-lead">{cfg.lead}</p>
      <ul className="ticket-summary">
        <li><span>Veranstaltung</span><strong>{event.title}</strong></li>
        <li><span>Termin</span><strong>{when}{event.time ? ` · ${event.time}` : ''}</strong></li>
        {event.where && <li><span>Ort</span><strong>{event.where}</strong></li>}
        {event.price && <li><span>Preis</span><strong>{event.price}</strong></li>}
        {event.seats && <li><span>Kontingent</span><strong>{event.seats} Plätze</strong></li>}
      </ul>
      {event.ticketNote && <div className="ticket-note">{event.ticketNote}</div>}
      <div className="field-row">
        <div className="field">
          <label>Name *</label>
          <input {...f('name')} placeholder="Anna Berger" />
        </div>
        <div className="field">
          <label>E-Mail *</label>
          <input type="email" {...f('email')} placeholder="anna@example.at" />
        </div>
      </div>
      <div className="field-row">
        <div className="field">
          <label>Telefon {cfg.requirePhone ? '*' : '(optional)'}</label>
          <input {...f('phone')} placeholder="+43 664 …" />
        </div>
        <div className="field">
          <label>Plätze (max. {max})</label>
          <input type="number" min="1" max={max} {...f('count')} />
        </div>
      </div>
      <div className="field">
        <label>Anmerkung (optional)</label>
        <input {...f('note')} placeholder="Tisch bei der Bühne, Kinderstuhl …" />
      </div>
      {err && <p className="ticket-err">{err}</p>}
      <button type="submit" className="btn" style={{ width: '100%', justifyContent: 'center' }}>
        {cfg.ctaLabel} →
      </button>
      <p className="ticket-fineprint">
        Unverbindliche Reservierung — wir melden uns per E-Mail. Deine Daten
        verwenden wir ausschließlich für diese Veranstaltung.
      </p>
    </form>
  );
}

// ---------- Sponsors marquee ----------
// Sponsoren mit hinterlegtem Logo laufen als Bild mit, alle anderen als Name.
function SponsorsMarquee() {
  const list = sponsorList();
  if (!list.length) return null;
  return (
    <section className="sponsors" aria-label="Sponsoren">
      <div className="sponsors-track">
        {[...list, ...list].map((s, i) => (
          s.logo
            ? <span key={i} className="with-logo"><img src={s.logo} alt={s.name} loading="lazy" /></span>
            : <span key={i}>★ {s.name}</span>
        ))}
      </div>
    </section>
  );
}

// ---------- Groups (clickable) ----------
function GroupsBlock({ navigate }) {
  return (
    <section className="block" id="groups">
      <div className="container">
        <div className="section-head">
          <div>
            <span className="eyebrow">Unsere Gruppen</span>
            <h2 style={{ marginTop: 14 }}>
              Drei Truppen.<br/>
              <span className="italic" style={{color:'var(--green)'}}>Ein</span> Verein.
            </h2>
          </div>
          <p className="lead">
            Tanzen, musizieren, repräsentieren — bei uns findet jede:r
            den passenden Platz. Klick eine Gruppe für mehr.
          </p>
        </div>

        <div className="groups-grid">
          {GROUPS.map(g => (
            <article key={g.id} className="group-card" onClick={() => navigate(g.id)}>
              {g.image
                ? <img className="photo" src={g.image} alt={g.title} />
                : <div className="photo-placeholder">{g.placeholder || g.title}</div>}
              <div className="group-card-body">
                <span className={"kicker " + (g.kickerColor === 'green' ? 'green' : '')}>
                  <span className="dot"></span>{g.kicker}
                </span>
                <h3>{g.title}</h3>
                <p>{g.desc}</p>
                <div className="stat-row">
                  {g.stats.map((s, i) => <span key={i}>{s}</span>)}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------- People ----------
// Eine Personenkarte — mit Foto, sonst mit dem Kürzel als Platzhalter.
// Wird auf der Startseite und im Präsidiums-Bereich verwendet.
function PersonCard({ person }) {
  const p = person;
  const tone = p.dotColor === 'green' ? 'green' : p.dotColor === 'gold' ? 'gold' : '';
  return (
    <div className="person">
      <div className={'person-avatar ' + tone + (p.photo ? ' has-photo' : '')}>
        {p.photo ? <img src={p.photo} alt={p.name} loading="lazy" /> : p.initial}
      </div>
      <div>
        <h4>{p.name}</h4>
        <div className="role">{p.role}</div>
      </div>
      <p className="bio">{p.bio}</p>
      {p.phone && <div className="contact">{p.phone}</div>}
      <div className="contact">{p.contact}</div>
    </div>
  );
}

function PeopleBlock() {
  return (
    <section className="block" id="people" style={{ background: 'var(--cream)' }}>
      <div className="container">
        <div className="section-head">
          <div>
            <span className="eyebrow">Vorstand · Saison 2026</span>
            <h2 style={{ marginTop: 14 }}>
              Die <span className="italic" style={{color:'var(--red)'}}>Köpfe</span> hinter dem Trubel
            </h2>
          </div>
          <p className="lead">
            Acht Ehrenamtliche, ein Ziel: dass dieses Dorf jedes Jahr im
            Februar zumindest ein bisschen den Verstand verliert.
          </p>
        </div>
        <div className="people-grid">
          {(window.PEOPLE || PEOPLE).map(p => <PersonCard key={p.id} person={p} />)}
        </div>
      </div>
    </section>
  );
}

// ---------- Kontaktblock ----------
function ContactBlock() {
  const cfg = siteConfig();
  return (
    <section className="contactband" id="kontakt">
      <div className="container">
        <div className="contactband-grid">
          <div>
            <span className="eyebrow">Kontakt</span>
            <h2 style={{ marginTop: 14 }}>
              Schreib uns —<br/>wir sind <span className="italic">für dich da</span>.
            </h2>
            <p style={{ marginTop: 22 }}>
              Fragen zu Terminen, Karten oder einer Mitgliedschaft? Melde dich
              einfach per Mail oder Telefon — wir antworten so schnell es der
              Fasching zulässt.
            </p>
          </div>

          <div className="contact-card">
            <h3>Faschingsverein Nazumido</h3>
            <ul className="contact-list">
              <li><span>Adresse</span><strong>{cfg.address}<br/>{cfg.city}</strong></li>
              <li><span>Telefon</span><strong><a href={`tel:${String(cfg.phone || '').replace(/\s/g, '')}`}>{cfg.phone}</a></strong></li>
              <li><span>E-Mail</span><strong><a href={`mailto:${cfg.email}`}>{cfg.email}</a></strong></li>
              <li><span>Web</span><strong>
                <a href={cfg.website} target="_blank" rel="noopener noreferrer">{cfg.websiteLabel}</a>
              </strong></li>
            </ul>
            <a className="btn" href={`mailto:${cfg.email}`} style={{ marginTop: 24 }}>
              E-Mail schreiben →
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------- Footer ----------
function Footer({ navigate }) {
  const link = (id) => (e) => { e.preventDefault(); navigate(id); };
  const gallery = galleryConfig();
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <div className="footer-brand">
              <img src="assets/logo.png" alt="Nazumido Wappen" />
              <div>
                Nazumido
                <small>Faschingsverein · seit 1962</small>
              </div>
            </div>
            <p style={{ marginTop: 22, fontSize: 14.5, color: 'rgba(247,241,230,0.75)', maxWidth: 360 }}>
              Drei Farben. Ein Verein. Sechs Jahrzehnte Schalk im Nacken.
              Wir freuen uns auf dich — ob auf der Bühne oder im Publikum.
            </p>
          </div>
          <div>
            <h4>Gruppen</h4>
            <ul>
              <li><a href="#garde" onClick={link('garde')}>Garde</a></li>
              <li><a href="#musikzug" onClick={link('musikzug')}>Musikzug</a></li>
              <li><a href="#vorsitz" onClick={link('vorsitz')}>Präsidium</a></li>
              {gallery.showInNav && <li><a href="#galerie" onClick={link('galerie')}>Galerie</a></li>}
              <li><a href="#sponsoren" onClick={link('sponsoren')}>Sponsoren</a></li>
            </ul>
          </div>
          <div>
            <h4>Mitglieder</h4>
            <ul>
              <li><a href="#login" onClick={link('login')}>Login</a></li>
              <li><a href="#login" onClick={link('login')}>Registrieren</a></li>
              <li><a href="#mitglieder" onClick={link('mitglieder')}>Interner Bereich</a></li>
              {gallery.showInNav && <li><a href="#galerie" onClick={link('galerie')}>HD-Fotos</a></li>}
            </ul>
          </div>
          <div>
            <h4>Kontakt</h4>
            <ul>
              <li>{SITE_CONFIG.address}</li>
              <li>{SITE_CONFIG.city}</li>
              <li>{SITE_CONFIG.email}</li>
              <li><a href={SITE_CONFIG.website} style={{ color: 'inherit' }} target="_blank" rel="noopener noreferrer">{SITE_CONFIG.websiteLabel}</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 Faschingsverein Nazumido · ZVR 123 456 789</span>
          <span>Impressum · Datenschutz · Vereinsstatut</span>
        </div>
      </div>
    </footer>
  );
}

// ---------- Modal ----------
function Modal({ item, onClose, user }) {
  const [tickets, setTickets] = useState(false);
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  // Reservierung direkt öffnen, wenn der Termin über einen Ticket-Button kam
  useEffect(() => { setTickets(!!(item && item._tickets && ticketState(item).open)); }, [item]);
  if (!item) return null;
  const isEvent = !!item.kind && item.d;
  const isPhoto = !!item.hdSize;
  // HD-Download: entweder in den Galerie-Einstellungen für alle freigegeben
  // oder das Konto hat das Recht „hdfotos" (siehe Rollen im Admin)
  const hdOpen = canDownloadHd(user);
  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Schließen">✕</button>
        {item.image && !isPhoto && (
          <div className="modal-media"><img src={item.image} alt="" /></div>
        )}
        {isPhoto && (
          <div className="modal-media" style={{ background: 'var(--ink)' }}>
            {item.src
              ? <img src={item.src} alt={item.title} />
              : <div className="ph" style={{ width: '100%', height: '100%' }}>{item.title}</div>}
          </div>
        )}
        <div className="modal-body">
          {isPhoto ? (
            <>
              <div className="meta">
                <span>{item.date}</span>
                <span>· {item.group}</span>
                <span>· Web: {item.size}</span>
              </div>
              <h3>{item.title}</h3>
              <p>Diese Aufnahme stammt aus unserem Vereinsarchiv. Die Web-Vorschau steht allen Besucherinnen offen.</p>
              {hdOpen ? (
                <>
                  <p style={{ color: 'var(--green)', fontWeight: 500 }}>
                    {user
                      ? `Als ${roleInfo(user.role).label} kannst du die HD-Version herunterladen — ${item.hdSize}.`
                      : `Diese Galerie gibt die HD-Version für alle frei — ${item.hdSize}.`}
                  </p>
                  <div className="photo-modal-actions">
                    <button className="btn" onClick={() => alert(`HD-Download startet (${item.hdSize}) — Demo`)}>
                      ↓ HD herunterladen ({item.hdSize})
                    </button>
                    <button className="btn outline-dark">Web-Version teilen</button>
                  </div>
                </>
              ) : (
                <>
                  <div className="photo-lock-notice">
                    <strong>🔒 HD-Version</strong>
                    <span>
                      {user
                        ? `Die hochauflösende Fassung (${item.hdSize}) ist für die Rolle „${roleInfo(user.role).label}" nicht freigegeben.`
                        : `Die hochauflösende Fassung (${item.hdSize}) ist Mitgliedern vorbehalten. Melde dich an, um sie herunterzuladen.`}
                    </span>
                  </div>
                  <div className="photo-modal-actions">
                    <button className="btn outline-dark">Web-Version teilen</button>
                  </div>
                </>
              )}
            </>
          ) : isEvent ? (
            tickets ? (
              <TicketForm event={item} onBack={() => setTickets(false)} />
            ) : (
            <>
              <div className="meta">
                <span>{eventDateLabel(item)} · {item.day}</span>
                <span>· {item.time}</span>
                <span>· {item.where}</span>
              </div>
              <h3>{item.title}</h3>
              <p style={{ color: 'var(--red)', fontFamily: 'var(--mono)', fontSize: 12, letterSpacing: '0.14em', textTransform: 'uppercase' }}>{item.kind}</p>
              <p>{item.desc}</p>
              <p>Wir freuen uns auf zahlreiche Besucherinnen und Besucher. Für Verpflegung ist gesorgt, der Eintritt ist — sofern nicht anders angegeben — frei.</p>
              {(() => {
                const st = ticketState(item);
                if (st.reason === 'soon') {
                  return (
                    <div className="ticket-hint">
                      <strong>🎫 Online-Reservierung</strong>
                      <span>Ab {dateLabel(st.opensAt)} kannst du hier Plätze für diesen Termin reservieren{item.price ? ` — ${item.price}` : ''}.</span>
                    </div>
                  );
                }
                if (!st.open && st.reason !== 'past') {
                  return (
                    <div className="ticket-hint">
                      <strong>🎫 Karten</strong>
                      <span>{st.cfg.closedText}</span>
                    </div>
                  );
                }
                return null;
              })()}
              <div style={{ display: 'flex', gap: 10, marginTop: 22, flexWrap: 'wrap' }}>
                {ticketState(item).open && (
                  <button className="btn" onClick={() => { if (!openTicketTab(item)) setTickets(true); }}>
                    {ticketConfig().ctaLabel}
                  </button>
                )}
                <button className="btn outline-dark">Anfahrt anzeigen</button>
              </div>
            </>
            )
          ) : (
            <>
              <div className="meta">
                <span>{item.date}</span>
                <span>· {item.readTime} Lesezeit</span>
                <span>· {item.tag}</span>
              </div>
              <h3>{item.title}</h3>
              {(item.body || [item.excerpt]).map((p, i) => (
                <p key={i}>{p}</p>
              ))}
              <div style={{ display: 'flex', gap: 10, marginTop: 22, flexWrap: 'wrap' }}>
                <button className="btn">Per E-Mail teilen</button>
                <button className="btn outline-dark">Alle Beiträge</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, {
  TopBar, Hero, Welcome, NewsFeed, EventsBand, SponsorsMarquee,
  GroupsBlock, PersonCard, PeopleBlock, ContactBlock, Footer, Modal, TicketForm, openTicketTab,
});
