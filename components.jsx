const { useState, useEffect, useMemo } = React;

// ---------- Top Bar ----------
function TopBar({ route, navigate, user, onLogout }) {
  const items = [
    { id: 'home', label: 'Start' },
    { id: 'garde', label: 'Garde' },
    { id: 'musikzug', label: 'Musikzug' },
    { id: 'vorsitz', label: 'Vorsitz' },
    { id: 'sponsoren', label: 'Sponsoren' },
  ];
  const strip = [
    'Session 2026 · Helau & Narri!',
    'Großer Faschingsumzug 14. Februar',
    'Prinzenball — Tickets ab sofort',
    'Mini-Garde sucht Nachwuchs',
    'Musikzug holt Bronze',
  ];
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <header className="topbar">
      <div className="topbar-strip">
        <div className="topbar-strip-track">
          {[...strip, ...strip].map((t, i) => (
            <span key={i}><span className={"dot" + (i % 2 ? " g" : "")}></span>{t}</span>
          ))}
        </div>
      </div>
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
                <dd>11.11.2025 — 17.02.2026</dd>
              </div>
              <div>
                <dt>Mitglieder</dt>
                <dd>184 Närrinnen & Narren</dd>
              </div>
              <div>
                <dt>Nächstes Event</dt>
                <dd>Umzug — 14. Februar</dd>
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
            <div className="signature">— Johann Bloderer, Präsident</div>
          </div>
          <div className="welcome-stats">
            <div className="welcome-stat">
              <span className="n"><span className="accent">64</span></span>
              <span className="l">Jahre Tradition</span>
            </div>
            <div className="welcome-stat">
              <span className="n">184</span>
              <span className="l">Mitglieder</span>
            </div>
            <div className="welcome-stat">
              <span className="n"><span className="accent-g">3</span></span>
              <span className="l">Aktive Gruppen</span>
            </div>
            <div className="welcome-stat">
              <span className="n">12</span>
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
            <span className="eyebrow">Aktuelles · Newsletter</span>
            <h2 style={{ marginTop: 14 }}>Aus dem <span className="italic" style={{color:'var(--red)'}}>Vereinsleben</span></h2>
          </div>
          <p className="lead">
            Rückblicke, Ankündigungen und Geschichten — jeden Monat frisch
            aus dem Hofnarrenkessel. Auch als Newsletter direkt ins Postfach.
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

// ---------- Events ----------
function EventsBand({ onOpen }) {
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
          {EVENTS.map(e => (
            <div key={e.id} className="event-row" onClick={() => onOpen(e)}>
              <div className="event-date">
                <span className="d">{e.d}</span>
                <span className="m">{e.m}</span>
              </div>
              <div className="event-title">
                <h3>{e.title}</h3>
                <span className="kind">{e.kind}</span>
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
          ))}
        </div>

        <div className="events-foot">
          <p style={{ color: 'rgba(247,241,230,0.7)', fontSize: 14, margin: 0 }}>
            Alle Termine und vergangene Veranstaltungen findest du im Archiv.
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="btn">Tickets sichern</button>
            <button className="btn ghost">In Kalender exportieren</button>
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------- Sponsors marquee ----------
function SponsorsMarquee() {
  return (
    <section className="sponsors" aria-label="Sponsoren">
      <div className="sponsors-track">
        {[...SPONSORS, ...SPONSORS].map((s, i) => (
          <span key={i}>★ {s}</span>
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
          {PEOPLE.map(p => (
            <div key={p.id} className="person">
              <div className={"person-avatar " + (p.dotColor === 'green' ? 'green' : p.dotColor === 'gold' ? 'gold' : '')}>
                {p.initial}
              </div>
              <div>
                <h4>{p.name}</h4>
                <div className="role">{p.role}</div>
              </div>
              <p className="bio">{p.bio}</p>
              {p.phone && <div className="contact">{p.phone}</div>}
              <div className="contact">{p.contact}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------- Newsletter block (signup) ----------
function NewsletterBlock() {
  const [topics, setTopics] = useState(['Events', 'Garde']);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ first: '', last: '', email: '', kind: 'Fan / Interessent' });
  const allTopics = ['Events', 'Garde', 'Musikzug', 'Vorsitz', 'Mitgliedschaft'];
  const toggle = t => setTopics(topics.includes(t) ? topics.filter(x => x !== t) : [...topics, t]);

  const submit = (e) => {
    e.preventDefault();
    if (!form.email) return;
    setSubmitted(true);
  };

  return (
    <section className="newsletter" id="kontakt">
      <div className="container">
        <div className="newsletter-grid">
          <div>
            <span className="eyebrow">Newsletter & Kontakt</span>
            <h2 style={{ marginTop: 14 }}>
              Bleib am <br/><span className="italic">närrischen</span> Puls.
            </h2>
            <p style={{ marginTop: 22 }}>
              Einmal im Monat schicken wir dir die wichtigsten Neuigkeiten:
              Termine, Rückblicke, Anekdoten. Kein Spam, nur Schalk.
            </p>
            <div style={{ marginTop: 36, fontSize: 14, color: 'rgba(255,255,255,0.78)' }}>
              <strong style={{ color: 'white' }}>Adresse:</strong> Hehenberg 163, 4540 Bad Hall<br/>
              <strong style={{ color: 'white' }}>Mail:</strong> Nazu.Mido@gmx.at &nbsp;·&nbsp;
              <strong style={{ color: 'white' }}>Web:</strong>{' '}
              <a href="https://www.nazu-mido.at" style={{ color: 'rgba(255,255,255,0.78)' }} target="_blank" rel="noopener noreferrer">www.nazu-mido.at</a>
            </div>
          </div>

          <div>
            {!submitted ? (
              <form className="signup" onSubmit={submit}>
                <h3>Newsletter abonnieren</h3>
                <div className="sub">Kostenlos · monatlich · jederzeit kündbar</div>
                <div className="field-row">
                  <div className="field">
                    <label>Vorname</label>
                    <input value={form.first} onChange={e => setForm({...form, first: e.target.value})} placeholder="z.B. Anna" />
                  </div>
                  <div className="field">
                    <label>Nachname</label>
                    <input value={form.last} onChange={e => setForm({...form, last: e.target.value})} placeholder="z.B. Berger" />
                  </div>
                </div>
                <div className="field">
                  <label>E-Mail Adresse</label>
                  <input type="email" required value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="anna@example.at" />
                </div>
                <div className="field">
                  <label>Ich bin…</label>
                  <select value={form.kind} onChange={e => setForm({...form, kind: e.target.value})}>
                    <option>Fan / Interessent</option>
                    <option>Aktives Mitglied</option>
                    <option>Eltern / Erziehungsberechtigte</option>
                    <option>Sponsor / Partner</option>
                  </select>
                </div>
                <label style={{ display: 'block', fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 8 }}>
                  Themen, die mich interessieren
                </label>
                <div className="checks">
                  {allTopics.map(t => (
                    <button type="button" key={t}
                      className={"chip-check" + (topics.includes(t) ? ' on' : '')}
                      onClick={() => toggle(t)}>
                      <span className="dot"></span>{t}
                    </button>
                  ))}
                </div>
                <button type="submit" className="btn" style={{ width: '100%', justifyContent: 'center' }}>
                  Newsletter abonnieren →
                </button>
              </form>
            ) : (
              <div className="signup-success">
                <h3 style={{ fontSize: 32 }}>Helau! 🎉</h3>
                <p style={{ color: 'rgba(255,255,255,0.9)', marginTop: 8 }}>
                  Danke, {form.first || 'liebe:r Freund:in'}.<br/>
                  Wir haben dir eine Bestätigung an<br/>
                  <strong>{form.email}</strong> geschickt.
                </p>
                <button className="btn ink" style={{ marginTop: 18 }}
                  onClick={() => { setSubmitted(false); setForm({first:'',last:'',email:'',kind:'Fan / Interessent'}); }}>
                  Noch jemanden anmelden
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------- Footer ----------
function Footer({ navigate }) {
  const link = (id) => (e) => { e.preventDefault(); navigate(id); };
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
              <li><a href="#vorsitz" onClick={link('vorsitz')}>Vorsitz</a></li>
              <li><a href="#sponsoren" onClick={link('sponsoren')}>Sponsoren</a></li>
            </ul>
          </div>
          <div>
            <h4>Mitglieder</h4>
            <ul>
              <li><a href="#login" onClick={link('login')}>Login</a></li>
              <li><a href="#login" onClick={link('login')}>Registrieren</a></li>
              <li><a href="#mitglieder" onClick={link('mitglieder')}>Interner Bereich</a></li>
              <li><a href="#mitglieder" onClick={link('mitglieder')}>HD-Fotos</a></li>
            </ul>
          </div>
          <div>
            <h4>Kontakt</h4>
            <ul>
              <li>Hehenberg 163</li>
              <li>4540 Bad Hall</li>
              <li>Nazu.Mido@gmx.at</li>
              <li><a href="https://www.nazu-mido.at" style={{ color: 'inherit' }} target="_blank" rel="noopener noreferrer">www.nazu-mido.at</a></li>
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
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  if (!item) return null;
  const isEvent = !!item.kind && item.d;
  const isPhoto = !!item.hdSize;
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
              {user ? (
                <>
                  <p style={{ color: 'var(--green)', fontWeight: 500 }}>
                    Als angemeldetes Mitglied ({user.role}) kannst du die HD-Version herunterladen — {item.hdSize}.
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
                    <span>Die hochauflösende Fassung ({item.hdSize}) ist Mitgliedern vorbehalten. Melde dich an, um sie herunterzuladen.</span>
                  </div>
                  <div className="photo-modal-actions">
                    <button className="btn outline-dark">Web-Version teilen</button>
                  </div>
                </>
              )}
            </>
          ) : isEvent ? (
            <>
              <div className="meta">
                <span>{item.d}. {item.m === 'Feb' ? 'Februar' : item.m === 'Mar' ? 'März' : item.m === 'Nov' ? 'November' : item.m} · {item.day}</span>
                <span>· {item.time}</span>
                <span>· {item.where}</span>
              </div>
              <h3>{item.title}</h3>
              <p style={{ color: 'var(--red)', fontFamily: 'var(--mono)', fontSize: 12, letterSpacing: '0.14em', textTransform: 'uppercase' }}>{item.kind}</p>
              <p>{item.desc}</p>
              <p>Wir freuen uns auf zahlreiche Besucherinnen und Besucher. Für Verpflegung ist gesorgt, der Eintritt ist — sofern nicht anders angegeben — frei.</p>
              <div style={{ display: 'flex', gap: 10, marginTop: 22, flexWrap: 'wrap' }}>
                <button className="btn">Tickets sichern</button>
                <button className="btn outline-dark">Anfahrt anzeigen</button>
              </div>
            </>
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
  GroupsBlock, PeopleBlock, NewsletterBlock, Footer, Modal,
});
