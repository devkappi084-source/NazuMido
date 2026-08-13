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

// Letztes Wort einer Überschrift kursiv/farbig hervorheben
function accentTitle(text, color) {
  const words = String(text || '').trim().split(/\s+/).filter(Boolean);
  if (words.length < 2) {
    return <span className="italic" style={{ color }}>{words[0] || ''}</span>;
  }
  const last = words.pop();
  return <>{words.join(' ')} <span className="italic" style={{ color }}>{last}</span></>;
}

// ---------- Photo Card (shared) ----------
function PhotoCard({ photo, onOpen }) {
  const g = galleryConfig();
  const hdOpen = canDownloadHd();
  return (
    <div className="photo-card" onClick={() => onOpen(photo)}>
      {photo.src ? <img src={photo.src} alt={photo.title} /> : <div className="ph">Foto · {photo.title}</div>}
      {g.showAlbumBadge && photo.album && <span className="album-badge">{photo.album}</span>}
      <span className={"hd-badge " + (hdOpen ? '' : 'locked')}>
        <span className="dot"></span>
        {hdOpen ? 'HD verfügbar' : '🔒 HD'}
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
  const g = galleryConfig();
  const all = window.PHOTOS || PHOTOS;
  const photos = all.filter(p => p.group === group || group === 'Allgemein').slice(0, g.photosPerGroup);
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
            {g.hdMembersOnly
              ? 'Klick ein Foto an: Mitglieder können die HD-Version herunterladen, Gäste bekommen die Web-Vorschau.'
              : 'Klick ein Foto an — jede Aufnahme steht in voller Auflösung zum Download bereit.'}
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

  const g = galleryConfig();
  const photos = window.PHOTOS || PHOTOS;
  const groups = ['Alle', ...photoGroups()];
  const years = [...new Set(photos.map(photoYear).filter(Boolean))].sort((a, b) => b - a);

  // Ausgeblendete Filter dürfen die Auswahl nicht einschränken
  const activeGroup = g.showGroupFilter ? group : 'Alle';
  const activeYear  = g.showYearFilter  ? year  : 'Alle';

  const filtered = photos.filter(p =>
    (activeGroup === 'Alle' || p.group === activeGroup) &&
    (activeYear === 'Alle' || photoYear(p) === activeYear)
  );

  // Nach Jahr gruppieren; Reihenfolge kommt aus den Galerie-Einstellungen,
  // Fotos ohne Jahr landen am Ende
  const buckets = [];
  filtered.forEach(p => {
    const y = photoYear(p);
    let b = buckets.find(x => x.year === y);
    if (!b) { b = { year: y, photos: [] }; buckets.push(b); }
    b.photos.push(p);
  });
  buckets.sort((a, b) => g.sort === 'alt'
    ? (a.year || Infinity) - (b.year || Infinity)
    : (b.year || 0) - (a.year || 0));

  const newest = years.length ? years[0] : '—';

  return (
    <>
      <SubHero
        navigate={navigate}
        breadcrumb="Galerie"
        kicker={g.kicker}
        title={accentTitle(g.title, 'var(--red)')}
        tagline={g.tagline}
        facts={[
          { label: 'Fotos im Archiv', value: photos.length },
          { label: 'Jahrgänge', value: years.length },
          { label: 'Bereiche', value: `${groups.length - 1} Gruppen` },
          { label: 'Neueste Session', value: newest },
        ]}
      />

      <section className="block" style={{ paddingTop: 60 }}>
        <div className="container">
          <div className="section-head">
            <div>
              <span className="eyebrow">{g.sectionEyebrow}</span>
              <h2 style={{ marginTop: 14, fontSize: 'clamp(36px, 4.4vw, 64px)' }}>
                {accentTitle(g.sectionTitle, 'var(--green)')}
              </h2>
            </div>
            <p className="lead">{g.sectionLead}</p>
          </div>

          {(g.showGroupFilter || g.showYearFilter) && (
            <div className="gallery-filters">
              {g.showGroupFilter && (
                <div className="gallery-filter-row">
                  <span className="lbl">Gruppe</span>
                  {groups.map(name => (
                    <button key={name}
                      className={"chip-check" + (group === name ? ' on' : '')}
                      onClick={() => setGroup(name)}>
                      <span className="dot"></span>{name}
                    </button>
                  ))}
                  {!g.showYearFilter && (
                    <span className="gallery-result">
                      {filtered.length} {filtered.length === 1 ? 'Foto' : 'Fotos'}
                    </span>
                  )}
                </div>
              )}
              {g.showYearFilter && (
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
              )}
            </div>
          )}

          {buckets.length === 0 ? (
            <div className="gallery-empty">
              <strong>{g.emptyTitle}</strong>
              {g.emptyText}
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

      {g.showHdSection && (
        <section className="block" style={{ background: 'var(--ink)', color: 'var(--cream)', textAlign: 'center' }}>
          <div className="container">
            <span className="eyebrow" style={{ color: 'rgba(247,241,230,0.6)' }}>HD-Download</span>
            <h2 style={{ marginTop: 14, color: 'var(--cream)' }}>
              {accentTitle(g.hdTitle, 'var(--gold)')}
            </h2>
            <p style={{ maxWidth: 580, margin: '20px auto 30px', color: 'rgba(247,241,230,0.8)' }}>
              {g.hdText}
            </p>
            <div style={{ display: 'inline-flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
              {currentUser() ? (
                <button className="btn" onClick={() => navigate('mitglieder')}>Zum Mitgliederbereich</button>
              ) : g.hdMembersOnly ? (
                <button className="btn" onClick={() => navigate('login')}>Mitglieder-Login</button>
              ) : null}
              <button className="btn ghost" onClick={() => navigate('home')}>Zurück zur Startseite</button>
            </div>
          </div>
        </section>
      )}
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
            {(window.PEOPLE || PEOPLE).map(p => <PersonCard key={p.id} person={p} />)}
          </div>
        </div>
      </section>

      <GroupPhotos group="Präsidium" onOpen={onOpenPhoto} navigate={navigate} />
    </>
  );
}

// ---------- Sponsors Page ----------
// ---------- Reservierungsseite (#reservierung/<event-id>) ----------
// Wird in einem eigenen Tab geöffnet, sofern „Eigener Tab" in den
// Ticket-Einstellungen aktiv ist. Die Reservierung landet in derselben Liste
// (localStorage) wie im Modal — der Admin exportiert bzw. druckt sie von dort.
function ReservationPage({ eventId, navigate }) {
  const cfg = ticketConfig();
  const event = eventId ? findEvent(eventId) : null;
  const st = event ? ticketState(event) : null;
  const open = !!(st && st.open);
  const options = reservableEvents();

  const facts = event
    ? [
        { label: 'Termin', value: eventDateLabel(event) },
        { label: 'Beginn', value: event.time || '—' },
        { label: 'Ort', value: event.where || '—' },
        { label: 'Preis', value: event.price || 'Freier Eintritt' },
      ]
    : [
        { label: 'Termine offen', value: String(options.length) },
        { label: 'Plätze je Buchung', value: `max. ${cfg.maxPerBooking}` },
        { label: 'Bestätigung', value: 'per E-Mail' },
      ];

  // Warum ist gerade nicht reservierbar?
  const closedText = !event
    ? 'Dieser Termin ist nicht (mehr) im Kalender.'
    : st.reason === 'past'
    ? 'Dieser Termin ist bereits vorbei.'
    : st.reason === 'soon'
    ? `Die Reservierung öffnet am ${dateLabel(st.opensAt)}.`
    : cfg.closedText;

  return (
    <>
      <SubHero
        kicker="Online-Reservierung"
        title={event ? accentTitle(event.title, 'var(--gold)') : accentTitle('Tickets reservieren', 'var(--gold)')}
        tagline={cfg.lead}
        facts={facts}
        breadcrumb="Reservierung"
        navigate={navigate}
      />
      <section className="block">
        <div className="container">
          <div className="reservation-panel">
            {event && open ? (
              <TicketForm
                event={event}
                standalone
                backLabel="← Zurück zur Startseite"
                onBack={() => navigate('home')}
              />
            ) : (
              <div className="ticket-form">
                <button type="button" className="ticket-back" onClick={() => navigate('home')}>
                  ← Zurück zur Startseite
                </button>
                <h3>{event ? event.title : 'Termin wählen'}</h3>
                <div className="ticket-hint">
                  <strong>🎫 Keine Reservierung möglich</strong>
                  <span>{closedText}</span>
                </div>
                {!!options.length && (
                  <>
                    <p className="ticket-lead" style={{ marginTop: 22 }}>
                      {event ? 'Für diese Termine kannst du stattdessen reservieren:' : 'Für diese Termine ist die Reservierung offen:'}
                    </p>
                    <ul className="reservation-picks">
                      {options.map(ev => (
                        <li key={ev.id}>
                          <a href={`#reservierung/${ev.id}`} onClick={e => { e.preventDefault(); navigate(`reservierung/${ev.id}`); }}>
                            <strong>{ev.title}</strong>
                            <span>{eventDateLabel(ev)}{ev.time ? ` · ${ev.time}` : ''}{ev.where ? ` · ${ev.where}` : ''}</span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}

function SponsorsPage({ navigate }) {
  const tiers = window.SPONSORS_TIERS || SPONSORS_TIERS;
  const totalCount = tiers.reduce((acc, t) => acc + t.sponsors.length, 0);
  const withLogo = tiers.reduce((acc, t) => acc + t.sponsors.filter(s => s.logo).length, 0);
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
          { label: 'Hauptsponsoren', value: (tiers[0] && tiers[0].sponsors.length) || 0 },
          { label: 'Mit Logo', value: withLogo },
          { label: 'Längste Partnerschaft', value: 'seit 1962' },
        ]}
      />

      <section className="block">
        <div className="container">
          {tiers.map((tier, i) => (
            <div key={i} className={"sponsor-tier " + tier.color}>
              <div className="sponsor-tier-head">
                <h3>{tier.tier}</h3>
                <p>{tier.desc}</p>
              </div>
              <div className="sponsor-grid">
                {tier.sponsors.map((s, j) => {
                  // Mit hinterlegter Adresse wird die Karte zum Link
                  const Tag = s.url ? 'a' : 'div';
                  const linkProps = s.url ? { href: s.url, target: '_blank', rel: 'noopener noreferrer' } : {};
                  return (
                    <Tag key={j} className={'sponsor-card' + (s.logo ? ' has-logo' : '')} {...linkProps}>
                      {s.logo && (
                        <div className="logo"><img src={s.logo} alt={s.name} loading="lazy" /></div>
                      )}
                      <div>
                        <div className="name">{s.name}</div>
                        <div className="branch">{s.branch}</div>
                      </div>
                      <div className="since">seit {s.since}</div>
                    </Tag>
                  );
                })}
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
  SubHero, PhotoCard, GroupPhotos, GaleriePage, accentTitle,
  GardePage, MusikzugPage, VorsitzPage, SponsorsPage, ReservationPage,
});
