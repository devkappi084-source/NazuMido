// Detail pages: Garde, Musikzug, Präsidium, Sponsoren
const { useState: useStateD } = React;

// ---------- Shared subhero ----------
function SubHero({ kicker, title, tagline, facts, breadcrumb, navigate }) {
  return (
    <section className="subhero">
      <div className="container">
        <div className="breadcrumb">
          <a href="#home" onClick={(e) => { e.preventDefault(); navigate('home'); }}>Start</a>
          <span className="sep">›</span>
          <span>{breadcrumb}</span>
        </div>
        <div className="subhero-grid">
          <div>
            <div className="divider-bars" style={{ marginBottom: 24 }}>
              <span className="r"></span>
              <span className="w"></span>
              <span className="g"></span>
            </div>
            <span className="eyebrow no-rule">{kicker}</span>
            <h1 style={{ marginTop: 12 }}>{title}</h1>
            <p className="tagline">{tagline}</p>
          </div>
          <dl className="subhero-facts">
            {facts.map((f, i) => (
              <div key={i} className="fact">
                <dt>{f.label}</dt>
                <dd>{f.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}

// ---------- Photo Card (shared) ----------
function PhotoCard({ photo, onOpen }) {
  return (
    <div className="photo-card" onClick={() => onOpen(photo)}>
      {photo.src ? <img src={photo.src} alt={photo.title} /> : <div className="ph">Foto · {photo.title}</div>}
      {photo.album && <span className="album-badge">{photo.album}</span>}
      <span className={"hd-badge " + (window.__currentUser ? '' : 'locked')}>
        <span className="dot"></span>
        {window.__currentUser ? 'HD verfügbar' : '🔒 HD'}
      </span>
      <div className="photo-card-info">
        <div className="t">{photo.title}</div>
        <div className="d">{photo.date}{photo.group ? ` · ${photo.group}` : ''}</div>
      </div>
    </div>
  );
}

// ---------- Photo Strip (group-specific) ----------
function GroupPhotos({ group, onOpen, navigate }) {
  const photos = PHOTOS.filter(p => p.group === group || group === 'Allgemein').slice(0, 8);
  if (!photos.length) return null;
  return (
    <section className="block" style={{ paddingTop: 60 }}>
      <div className="container">
        <div className="section-head">
          <div>
            <span className="eyebrow">Galerie</span>
            <h2 style={{ marginTop: 14, fontSize: 'clamp(36px, 4.4vw, 64px)' }}>Aus unserer <span className="italic" style={{color:'var(--red)'}}>Linse</span></h2>
          </div>
          <p className="lead">
            Klick ein Foto an: Mitglieder können die HD-Version herunterladen,
            Gäste bekommen die Web-Vorschau.
          </p>
        </div>
        <div className="photo-grid">
          {photos.map(p => <PhotoCard key={p.id} photo={p} onOpen={onOpen} />)}
        </div>
        {navigate && (
          <div style={{ marginTop: 28, display: 'flex', justifyContent: 'center' }}>
            <button className="btn outline-dark" onClick={() => navigate('galerie')}>
              Zur ganzen Galerie <span aria-hidden>→</span>
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

// ---------- Galerie Page ----------
function GaleriePage({ navigate, onOpenPhoto }) {
  const [group, setGroup] = useStateD('Alle');
  const [year, setYear] = useStateD('Alle');

  const groups = ['Alle', ...(window.PHOTO_GROUPS || ['Garde', 'Musikzug', 'Präsidium', 'Allgemein'])];
  const years = [...new Set(PHOTOS.map(photoYear).filter(Boolean))].sort((a, b) => b - a);

  const filtered = PHOTOS.filter(p =>
    (group === 'Alle' || p.group === group) &&
    (year === 'Alle' || photoYear(p) === year)
  );

  // Nach Jahr gruppieren, neueste zuerst; Fotos ohne Jahr landen am Ende
  const buckets = [];
  filtered.forEach(p => {
    const y = photoYear(p);
    let b = buckets.find(x => x.year === y);
    if (!b) { b = { year: y, photos: [] }; buckets.push(b); }
    b.photos.push(p);
  });
  buckets.sort((a, b) => (b.year || 0) - (a.year || 0));

  const newest = years.length ? years[0] : '—';

  return (
    <>
      <SubHero
        navigate={navigate}
        breadcrumb="Galerie"
        kicker="Bildarchiv · seit 1962"
        title={<>Unsere <span style={{color:'var(--red)', fontStyle:'italic'}}>Galerie</span></>}
        tagline={SITE_CONFIG.galleryTagline}
        facts={[
          { label: 'Fotos im Archiv', value: PHOTOS.length },
          { label: 'Jahrgänge', value: years.length },
          { label: 'Bereiche', value: `${groups.length - 1} Gruppen` },
          { label: 'Neueste Session', value: newest },
        ]}
      />

      <section className="block" style={{ paddingTop: 60 }}>
        <div className="container">
          <div className="section-head">
            <div>
              <span className="eyebrow">Rückblick</span>
              <h2 style={{ marginTop: 14, fontSize: 'clamp(36px, 4.4vw, 64px)' }}>
                Jahr für <span className="italic" style={{color:'var(--green)'}}>Jahr</span>
              </h2>
            </div>
            <p className="lead">
              Garde, Musikzug, Präsidium und das ganze närrische Vereinsleben —
              filtere nach Gruppe oder Saison und klick ein Foto für die Großansicht.
            </p>
          </div>

          <div className="gallery-filters">
            <div className="gallery-filter-row">
              <span className="lbl">Gruppe</span>
              {groups.map(g => (
                <button key={g}
                  className={"chip-check" + (group === g ? ' on' : '')}
                  onClick={() => setGroup(g)}>
                  <span className="dot"></span>{g}
                </button>
              ))}
            </div>
            <div className="gallery-filter-row">
              <span className="lbl">Jahr</span>
              <button className={"chip-check" + (year === 'Alle' ? ' on' : '')} onClick={() => setYear('Alle')}>
                <span className="dot"></span>Alle
              </button>
              {years.map(y => (
                <button key={y}
                  className={"chip-check" + (year === y ? ' on' : '')}
                  onClick={() => setYear(y)}>
                  <span className="dot"></span>{y}
                </button>
              ))}
              <span className="gallery-result">
                {filtered.length} {filtered.length === 1 ? 'Foto' : 'Fotos'}
              </span>
            </div>
          </div>

          {buckets.length === 0 ? (
            <div className="gallery-empty">
              <strong>Noch nichts im Kasten</strong>
              Für diese Auswahl gibt es aktuell keine Fotos. Probier eine andere
              Gruppe oder ein anderes Jahr.
            </div>
          ) : (
            buckets.map(b => (
              <div key={b.year || 'ohne'} className="gallery-year">
                <div className="gallery-year-head">
                  <span className="y">{b.year || 'Ohne Jahr'}</span>
                  <span className="season">{b.year ? `Session ${b.year}` : 'Datum unbekannt'}</span>
                  <span className="count">{b.photos.length} {b.photos.length === 1 ? 'Aufnahme' : 'Aufnahmen'}</span>
                </div>
                <div className="photo-grid">
                  {b.photos.map(p => <PhotoCard key={p.id} photo={p} onOpen={onOpenPhoto} />)}
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="block" style={{ background: 'var(--ink)', color: 'var(--cream)', textAlign: 'center' }}>
        <div className="container">
          <span className="eyebrow" style={{ color: 'rgba(247,241,230,0.6)' }}>HD-Download</span>
          <h2 style={{ marginTop: 14, color: 'var(--cream)' }}>
            Fotos in voller <span className="italic" style={{color:'var(--gold)'}}>Auflösung</span>
          </h2>
          <p style={{ maxWidth: 580, margin: '20px auto 30px', color: 'rgba(247,241,230,0.8)' }}>
            Die Web-Vorschau ist für alle da. Mitglieder laden jede Aufnahme
            zusätzlich in Originalgröße herunter — inklusive Archivbestand seit 2012.
          </p>
          <div style={{ display: 'inline-flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
            {window.__currentUser ? (
              <button className="btn" onClick={() => navigate('mitglieder')}>Zum Mitgliederbereich</button>
            ) : (
              <button className="btn" onClick={() => navigate('login')}>Mitglieder-Login</button>
            )}
            <button className="btn ghost" onClick={() => navigate('home')}>Zurück zur Startseite</button>
          </div>
        </div>
      </section>
    </>
  );
}

// ---------- Garde Page ----------
function GardePage({ navigate, onOpenPhoto }) {
  const d = GARDE;
  return (
    <>
      <SubHero
        navigate={navigate}
        breadcrumb="Garde"
        kicker="Gruppe · Tanz"
        title={<>Die <span style={{color:'var(--red)', fontStyle:'italic'}}>Garde</span></>}
        tagline={d.tagline}
        facts={[
          { label: 'Gegründet', value: d.founded },
          { label: 'Aktive Mitglieder', value: d.members },
          { label: 'Training', value: d.practice },
          { label: 'Leitung', value: d.trainer },
        ]}
      />

      <section className="block" style={{ paddingTop: 80 }}>
        <div className="container">
          <div className="section-head">
            <div>
              <span className="eyebrow">Unsere Garde</span>
              <h2 style={{ marginTop: 14, fontSize: 'clamp(36px, 5vw, 72px)' }}>
                Die <span className="italic" style={{color:'var(--green)'}}>Showgrafen</span>
              </h2>
            </div>
            <p className="lead">
              Eine eingespielte Truppe, ein gemeinsames Ziel: die große Bühne.
              Pailletten, Präzision und pure Energie — das sind unsere Showgrafen.
            </p>
          </div>
          <div className="subgroup-grid" style={d.groups.length === 1 ? { gridTemplateColumns: '1fr', maxWidth: 520, margin: '0 auto' } : null}>
            {d.groups.map((g, i) => (
              <div key={i} className={"subgroup-card " + g.color}>
                <div className="dot"></div>
                <h4>{g.name}</h4>
                <div className="meta">Altersgruppe {g.age}</div>
                <span className="count">{g.count}<small>Aktive Tänzerinnen</small></span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="block" style={{ background: 'var(--cream)' }}>
        <div className="container">
          <div className="split-grid">
            <div>
              <span className="eyebrow">Trainingsplan</span>
              <h2 style={{ marginTop: 14, fontSize: 'clamp(36px, 4.4vw, 60px)' }}>
                Schritt für <span className="italic" style={{color:'var(--red)'}}>Schritt</span>
              </h2>
              <p style={{ marginTop: 22, color: 'var(--ink-2)' }}>
                Zwei Trainingseinheiten pro Woche. Choreografien, Technik,
                Sprungkraft, Ausdruck — und jede Menge Spaß.
              </p>
              <table className="schedule-table" style={{ marginTop: 28 }}>
                <thead>
                  <tr><th>Tag</th><th>Zeit</th><th>Inhalt</th></tr>
                </thead>
                <tbody>
                  {d.schedule.map((s, i) => (
                    <tr key={i}>
                      <td className="day">{s.d}</td>
                      <td className="time">{s.t}</td>
                      <td>{s.what}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div>
              <span className="eyebrow">Meilensteine</span>
              <h2 style={{ marginTop: 14, fontSize: 'clamp(36px, 4.4vw, 60px)' }}>
                Auf der <span className="italic" style={{color:'var(--green)'}}>Bühne</span>
              </h2>
              <p style={{ marginTop: 22, color: 'var(--ink-2)' }}>
                Eine Auswahl unserer schönsten Momente der letzten Jahre.
              </p>
              <div className="timeline" style={{ marginTop: 28 }}>
                {d.highlights.map((h, i) => (
                  <div key={i} className="timeline-row">
                    <div className="y">{h.year}</div>
                    <div className="t">{h.text}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <GroupPhotos group="Garde" onOpen={onOpenPhoto} navigate={navigate} />

      <section className="block" style={{ background: 'var(--ink)', color: 'var(--cream)', textAlign: 'center' }}>
        <div className="container">
          <span className="eyebrow" style={{ color: 'rgba(247,241,230,0.6)' }}>Mitmachen</span>
          <h2 style={{ marginTop: 14, color: 'var(--cream)' }}>
            Lust auf das <span className="italic" style={{color:'var(--red)'}}>Rampenlicht</span>?
          </h2>
          <p style={{ maxWidth: 560, margin: '20px auto 30px', color: 'rgba(247,241,230,0.8)' }}>
            Wir freuen uns über tanzfreudigen Nachwuchs bei den Showgrafen.
            Komm einfach unverbindlich zu einem Probetraining vorbei.
          </p>
          <div style={{ display: 'inline-flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
            <button className="btn">Probetraining anfragen</button>
            <button className="btn ghost" onClick={() => navigate('home')}>Zurück zur Startseite</button>
          </div>
        </div>
      </section>
    </>
  );
}

// ---------- Musikzug Page ----------
function MusikzugPage({ navigate, onOpenPhoto }) {
  const d = MUSIKZUG;
  return (
    <>
      <SubHero
        navigate={navigate}
        breadcrumb="Musikzug"
        kicker="Gruppe · Musik"
        title={<>Der <span style={{color:'var(--green)', fontStyle:'italic'}}>Musikzug</span></>}
        tagline={d.tagline}
        facts={[
          { label: 'Gegründet', value: d.founded },
          { label: 'Aktive Musiker', value: d.members },
          { label: 'Probe', value: d.practice },
          { label: 'Kapellmeister', value: d.trainer },
        ]}
      />

      <section className="block" style={{ paddingTop: 80 }}>
        <div className="container">
          <div className="section-head">
            <div>
              <span className="eyebrow">Register</span>
              <h2 style={{ marginTop: 14, fontSize: 'clamp(36px, 5vw, 72px)' }}>
                Drei <span className="italic" style={{color:'var(--red)'}}>Stimmen</span>
              </h2>
            </div>
            <p className="lead">
              Vom rhythmischen Fundament bis zur schmetternden Melodie —
              jede:r findet das passende Instrument.
            </p>
          </div>
          <div className="subgroup-grid">
            {d.groups.map((g, i) => (
              <div key={i} className={"subgroup-card " + g.color}>
                <div className="dot"></div>
                <h4>{g.name}</h4>
                <div className="meta">{g.age === '—' ? 'alle Altersgruppen' : g.age}</div>
                <span className="count">{g.count}<small>Aktive Mitglieder</small></span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="block" style={{ background: 'var(--cream)' }}>
        <div className="container">
          <div className="split-grid">
            <div>
              <span className="eyebrow">Repertoire</span>
              <h2 style={{ marginTop: 14, fontSize: 'clamp(36px, 4.4vw, 60px)' }}>
                Unsere <span className="italic" style={{color:'var(--red)'}}>Hits</span>
              </h2>
              <p style={{ marginTop: 22, color: 'var(--ink-2)' }}>
                Klassiker, Eigenkompositionen, Faschingshymnen — ein Auszug
                aus dem aktuellen Programm.
              </p>
              <ul className="repertoire-list" style={{ marginTop: 28 }}>
                {d.repertoire.map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            </div>
            <div>
              <span className="eyebrow">Höhepunkte</span>
              <h2 style={{ marginTop: 14, fontSize: 'clamp(36px, 4.4vw, 60px)' }}>
                Im <span className="italic" style={{color:'var(--green)'}}>Rückblick</span>
              </h2>
              <p style={{ marginTop: 22, color: 'var(--ink-2)' }}>
                Auftritte, Preise, Meilensteine der letzten Jahre.
              </p>
              <div className="timeline" style={{ marginTop: 28 }}>
                {d.highlights.map((h, i) => (
                  <div key={i} className="timeline-row">
                    <div className="y">{h.year}</div>
                    <div className="t">{h.text}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <GroupPhotos group="Musikzug" onOpen={onOpenPhoto} navigate={navigate} />

      <section className="block" style={{ background: 'var(--ink)', color: 'var(--cream)', textAlign: 'center' }}>
        <div className="container">
          <span className="eyebrow" style={{ color: 'rgba(247,241,230,0.6)' }}>Mitspielen</span>
          <h2 style={{ marginTop: 14, color: 'var(--cream)' }}>
            Bring deinen <span className="italic" style={{color:'var(--gold)'}}>Klang</span> ein
          </h2>
          <p style={{ maxWidth: 560, margin: '20px auto 30px', color: 'rgba(247,241,230,0.8)' }}>
            Egal ob Anfänger oder Profi — wir suchen Verstärkung an allen
            Instrumenten. Schau Mittwoch Abend bei der Probe vorbei.
          </p>
          <div style={{ display: 'inline-flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
            <button className="btn">Probe besuchen</button>
            <button className="btn ghost" onClick={() => navigate('home')}>Zurück zur Startseite</button>
          </div>
        </div>
      </section>
    </>
  );
}

// ---------- Präsidium Page ----------
function VorsitzPage({ navigate, onOpenPhoto }) {
  const d = VORSITZ;
  return (
    <>
      <SubHero
        navigate={navigate}
        breadcrumb="Präsidium"
        kicker="Gruppe · Repräsentation"
        title={<>Das <span style={{color:'var(--red)', fontStyle:'italic'}}>Präsidium</span></>}
        tagline={d.tagline}
        facts={[
          { label: 'Gegründet', value: d.founded },
          { label: 'Mitglieder', value: d.members },
          { label: 'Sitzung', value: d.practice },
          { label: 'Präsident', value: 'Markus Reiter' },
        ]}
      />

      <section className="block" style={{ paddingTop: 80 }}>
        <div className="container">
          <div className="split-grid">
            <div>
              <span className="eyebrow">Aufgaben</span>
              <h2 style={{ marginTop: 14, fontSize: 'clamp(36px, 4.4vw, 60px)' }}>
                Was wir <span className="italic" style={{color:'var(--green)'}}>tun</span>
              </h2>
              <p style={{ marginTop: 22, color: 'var(--ink-2)' }}>
                Hinter jeder gelungenen Veranstaltung steckt ein Stück
                Organisation. Das sind die Bereiche, die das Präsidium abdeckt:
              </p>
              <ol className="responsibility-list" style={{ marginTop: 22 }}>
                {d.responsibilities.map((r, i) => <li key={i}><span>{r}</span></li>)}
              </ol>
            </div>
            <div>
              <span className="eyebrow">Geschichte</span>
              <h2 style={{ marginTop: 14, fontSize: 'clamp(36px, 4.4vw, 60px)' }}>
                Sechs <span className="italic" style={{color:'var(--red)'}}>Jahrzehnte</span>
              </h2>
              <p style={{ marginTop: 22, color: 'var(--ink-2)' }}>
                Die wichtigsten Stationen unserer Vereinsgeschichte.
              </p>
              <div className="timeline" style={{ marginTop: 28 }}>
                {d.history.map((h, i) => (
                  <div key={i} className="timeline-row">
                    <div className="y">{h.year}</div>
                    <div className="t">{h.text}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="block" style={{ background: 'var(--cream)' }}>
        <div className="container">
          <div className="section-head">
            <div>
              <span className="eyebrow">Funktionärinnen & Funktionäre</span>
              <h2 style={{ marginTop: 14 }}>
                Die <span className="italic" style={{color:'var(--red)'}}>Köpfe</span> 2026
              </h2>
            </div>
            <p className="lead">
              Acht Ehrenamtliche tragen den Verein durch das Jahr.
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
                <div className="contact">{p.contact}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <GroupPhotos group="Präsidium" onOpen={onOpenPhoto} navigate={navigate} />
    </>
  );
}

// ---------- Sponsors Page ----------
function SponsorsPage({ navigate }) {
  const totalCount = SPONSORS_TIERS.reduce((acc, t) => acc + t.sponsors.length, 0);
  return (
    <>
      <SubHero
        navigate={navigate}
        breadcrumb="Sponsoren"
        kicker="Partner · Förderer"
        title={<>Mit <span style={{color:'var(--red)', fontStyle:'italic'}}>Dank</span></>}
        tagline="Ohne unsere Sponsoren, Partner und Förderer wäre Nazumido nicht das, was es heute ist. Danke!"
        facts={[
          { label: 'Sponsoren gesamt', value: totalCount },
          { label: 'Hauptsponsoren', value: SPONSORS_TIERS[0].sponsors.length },
          { label: 'Längste Partnerschaft', value: 'seit 1962' },
          { label: 'Neu in 2025', value: '2 Förderer' },
        ]}
      />

      <section className="block">
        <div className="container">
          {SPONSORS_TIERS.map((tier, i) => (
            <div key={i} className={"sponsor-tier " + tier.color}>
              <div className="sponsor-tier-head">
                <h3>{tier.tier}</h3>
                <p>{tier.desc}</p>
              </div>
              <div className="sponsor-grid">
                {tier.sponsors.map((s, j) => (
                  <div key={j} className="sponsor-card">
                    <div>
                      <div className="name">{s.name}</div>
                      <div className="branch">{s.branch}</div>
                    </div>
                    <div className="since">seit {s.since}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="sponsor-cta">
            <div>
              <span className="eyebrow" style={{ color: 'rgba(247,241,230,0.6)' }}>Sponsor werden</span>
              <h3 style={{ marginTop: 12 }}>
                Werde Teil unserer<br/>
                <span style={{ color: 'var(--red)', fontStyle: 'italic' }}>närrischen Familie</span>
              </h3>
              <p>
                Sponsoring beim Nazumido bedeutet sichtbar werden — auf Plakaten,
                Programmen, Wagen, Bannern und in unseren digitalen Kanälen.
                Wir freuen uns auf ein persönliches Gespräch.
              </p>
              <div style={{ display: 'flex', gap: 10, marginTop: 24, flexWrap: 'wrap' }}>
                <button className="btn">Sponsoring-Anfrage</button>
                <button className="btn ghost" style={{ borderColor: 'rgba(247,241,230,0.3)' }}>
                  Mediadaten (PDF)
                </button>
              </div>
            </div>
            <ul className="sponsor-cta-list">
              <li>Logo auf allen Print-Materialien der Saison</li>
              <li>Banner-Platzierung bei Umzug und Bällen</li>
              <li>Nennung auf Webseite und Social Media</li>
              <li>VIP-Plätze beim Prinzenball</li>
              <li>Persönliche Einladung zur Sponsorengala</li>
              <li>Drei Sponsoring-Pakete ab 250 € / Jahr</li>
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}

Object.assign(window, {
  SubHero, PhotoCard, GroupPhotos, GaleriePage,
  GardePage, MusikzugPage, VorsitzPage, SponsorsPage,
});
