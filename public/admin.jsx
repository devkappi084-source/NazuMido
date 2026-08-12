// Nazumido Admin Panel — im Design der Website (#admin)
const { useState: useAdmSt, useEffect: useAdmFx } = React;

// ─── Persistenz-Helpers ───────────────────────────────────────────────────────
const PFX = 'nzadm_';
const SESS_KEY = 'nzadm_sess';
const PW_KEY   = 'nzadm_pw';
const DEFAULT_PW = 'admin2026';

function saveData(key, data) {
  localStorage.setItem(PFX + key, JSON.stringify(data));
  window[key] = data;
  if (key === 'SPONSORS_TIERS') {
    const flat = data.flatMap(t => t.sponsors.map(s => s.name));
    window.SPONSORS = flat;
    localStorage.setItem(PFX + 'SPONSORS', JSON.stringify(flat));
  }
}

function loadData(key) {
  try {
    const r = localStorage.getItem(PFX + key);
    if (r) return JSON.parse(r);
  } catch(e) {}
  try {
    return JSON.parse(JSON.stringify(window[key]));
  } catch(e) {
    return window[key];
  }
}

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 5); }

// Galerie-Gruppen sind in den Einstellungen änderbar — daher bei jedem Render
// frisch lesen statt einmalig beim Laden festhalten.
function groupOptions() {
  const g = window.PHOTO_GROUPS;
  return Array.isArray(g) && g.length ? g : ['Garde', 'Musikzug', 'Präsidium', 'Allgemein'];
}

// Galerie-Einstellungen inkl. Standardwerten lesen
function galleryCfg() {
  return typeof galleryConfig === 'function'
    ? galleryConfig()
    : Object.assign({}, window.GALLERY_DEFAULTS, (window.SITE_CONFIG || {}).gallery);
}

// ─── UI-Bausteine (Design-System der Website) ─────────────────────────────────
function Btn({ children, onClick, v = 'primary', className = '', type = 'button' }) {
  const variant = v === 'primary' ? '' : ' ' + v;
  return (
    <button type={type} onClick={onClick} className={'adm-btn' + variant + (className ? ' ' + className : '')}>
      {children}
    </button>
  );
}

function Fld({ label, children }) {
  return (
    <div className="adm-field">
      <label>{label}</label>
      {children}
    </div>
  );
}

function Inp(props) { return <input {...props} className={'adm-input ' + (props.className || '')} />; }
function Txt(props) { return <textarea {...props} className={'adm-textarea ' + (props.className || '')} />; }
function Sel(props) { return <select {...props} className={'adm-select ' + (props.className || '')} />; }

function Toast({ msg, onDone }) {
  useAdmFx(() => { const t = setTimeout(onDone, 2400); return () => clearTimeout(t); }, []);
  return (
    <div className="adm-toast"><span className="dot"></span>{msg}</div>
  );
}

function Chip({ active, onClick, children }) {
  return (
    <button className={'adm-chip' + (active ? ' on' : '')} onClick={onClick}>{children}</button>
  );
}

// Schalter für Ja/Nein-Einstellungen
function Toggle({ label, desc, checked, onChange }) {
  return (
    <label className={'adm-toggle' + (checked ? ' on' : '')}>
      <input type="checkbox" checked={!!checked} onChange={e => onChange(e.target.checked)} />
      <span className="box" aria-hidden>✓</span>
      <span className="txt">
        <b>{label}</b>
        {desc && <em>{desc}</em>}
      </span>
    </label>
  );
}

// Großer Ein/Aus-Schalter (Laufschrift, Online-Reservierung)
function PowerBtn({ on, onLabel, offLabel, onChange }) {
  return (
    <button className={'adm-power' + (on ? ' on' : '')}
      aria-pressed={!!on} onClick={() => onChange(!on)}>
      <span className="led" aria-hidden></span>{on ? onLabel : offLabel}
    </button>
  );
}

// Kopfzeile eines Bereichs
function PanelHead({ title, desc, action }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap', marginBottom: 18 }}>
      <div style={{ flex: 1, minWidth: 220 }}>
        <span className="eyebrow">{title}</span>
        {desc && <p className="adm-card-desc" style={{ margin: '10px 0 0' }}>{desc}</p>}
      </div>
      {action}
    </div>
  );
}

// Wiederverwendbarer Listen-Editor (Highlights, Trainingsplan, Register …)
function RowListEditor({ items, onChange, fields, addLabel }) {
  const add = () => onChange([...items, Object.fromEntries(fields.map(f => [f.key, '']))]);
  const del = i => onChange(items.filter((_, j) => j !== i));
  const upd = (i, k, v) => onChange(items.map((row, j) => j === i ? { ...row, [k]: v } : row));
  return (
    <div>
      {items.map((row, i) => (
        <div key={i} className="adm-inline-row">
          {fields.map(f => (
            f.type === 'select'
              ? <Sel key={f.key} value={row[f.key] || ''} onChange={e => upd(i, f.key, e.target.value)}
                  style={{ flex: f.flex || 1 }}>
                  {f.options.map(o => <option key={o}>{o}</option>)}
                </Sel>
              : <Inp key={f.key} value={row[f.key] || ''} onChange={e => upd(i, f.key, e.target.value)}
                  style={{ flex: f.flex || 1 }} placeholder={f.placeholder || f.key} />
          ))}
          <button className="adm-iconbtn" onClick={() => del(i)} aria-label="Zeile entfernen">✕</button>
        </div>
      ))}
      <Btn v="ghost" className="sm" onClick={add}>+ {addLabel}</Btn>
    </div>
  );
}

// Einfache Textliste (Repertoire, Aufgaben …)
function TextListEditor({ items, onChange, addLabel, placeholder }) {
  return (
    <div>
      {items.map((val, i) => (
        <div key={i} className="adm-inline-row">
          <Inp value={val} placeholder={placeholder}
            onChange={e => onChange(items.map((v, j) => j === i ? e.target.value : v))}
            style={{ flex: 1 }} />
          <button className="adm-iconbtn" onClick={() => onChange(items.filter((_, j) => j !== i))} aria-label="Eintrag entfernen">✕</button>
        </div>
      ))}
      <Btn v="ghost" className="sm" onClick={() => onChange([...items, ''])}>+ {addLabel}</Btn>
    </div>
  );
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────
function AdminLogin({ onAuth }) {
  const [pw, setPw] = useAdmSt('');
  const [err, setErr] = useAdmSt('');
  const submit = e => {
    e.preventDefault();
    if (pw === (localStorage.getItem(PW_KEY) || DEFAULT_PW)) {
      sessionStorage.setItem(SESS_KEY, '1');
      onAuth();
    } else setErr('Falsches Passwort.');
  };
  return (
    <div className="adm-login">
      <div className="adm-login-card">
        <img src="assets/logo.png" alt="Nazumido Wappen" />
        <h2>Verwaltung</h2>
        <div className="sub">Admin · Nazumido intern</div>
        <form onSubmit={submit}>
          <Fld label="Admin-Passwort">
            <Inp type="password" value={pw} autoFocus placeholder="••••••••"
              onChange={e => { setPw(e.target.value); setErr(''); }} />
          </Fld>
          {err && <p className="adm-err">{err}</p>}
          <Btn v="dark" type="submit" className="block">Anmelden →</Btn>
        </form>
        <p className="hint">Standard: <code>{DEFAULT_PW}</code></p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// EVENTS
// ═══════════════════════════════════════════════════════════════════════════════
// Steht dieser Termin noch bevor? (heute zählt als anstehend)
function isUpcoming(ev) {
  const at = window.eventDate ? window.eventDate(ev) : null;
  if (!at) return false;
  const now = new Date();
  return at >= new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

// Wie steht es aktuell um die Online-Reservierung dieses Termins?
function ticketStatusText(ev) {
  const st = window.ticketState ? window.ticketState(ev) : null;
  const lbl = d => (window.dateLabel ? window.dateLabel(d) : '');
  if (!st) return '';
  if (st.reason === 'open') return '● Reservierung ist offen — Besucher:innen können Plätze buchen.';
  if (st.reason === 'soon') return `○ Reservierung öffnet automatisch am ${lbl(st.opensAt)}.`;
  if (st.reason === 'past') return '○ Termin ist vorbei — es kann nicht mehr reserviert werden.';
  if (st.reason === 'off')  return '○ Online-Reservierung ist global ausgeschaltet (Einstellungen › Tickets).';
  return '○ Für diesen Termin nicht freigeschaltet.';
}

function AdmEvents({ onSave }) {
  const [items, setItems] = useAdmSt(() => loadData('EVENTS'));
  const [open, setOpen] = useAdmSt(null);
  const [form, setForm] = useAdmSt({});
  const upcoming = items.filter(isUpcoming).length;

  const edit = ev => { setOpen(ev.id); setForm({ ...ev }); };
  const save = id => {
    const next = items.map(e => e.id === id ? { ...form } : e);
    setItems(next); saveData('EVENTS', next); setOpen(null);
    onSave('Event gespeichert');
  };
  const del = id => {
    if (!confirm('Event löschen?')) return;
    const next = items.filter(e => e.id !== id);
    setItems(next); saveData('EVENTS', next); setOpen(null); onSave('Event gelöscht');
  };
  const add = () => {
    const ev = { id: uid(), d: '01', m: 'Jan', year: String(new Date().getFullYear() + 1), day: 'Montag', title: 'Neues Event', kind: '', desc: '', time: '19:00 Uhr', where: '', tickets: false };
    const next = [...items, ev];
    setItems(next); setOpen(ev.id); setForm({ ...ev });
  };

  return (
    <div>
      <PanelHead
        title={`${items.length} Termine · ${upcoming} anstehend`}
        desc="Alles, was im Veranstaltungskalender der Startseite erscheint. Steht kein Termin mehr an, verschwindet die Laufschrift im Kopfbereich."
        action={<Btn onClick={add}>+ Event hinzufügen</Btn>}
      />
      {items.map(ev => (
        <div key={ev.id} className={'adm-card' + (open === ev.id ? ' open' : '')}>
          {open === ev.id ? (
            <div>
              <div className="adm-grid-2">
                <Fld label="Titel"><Inp value={form.title} onChange={e => setForm({...form, title: e.target.value})} /></Fld>
                <Fld label="Art"><Inp value={form.kind} onChange={e => setForm({...form, kind: e.target.value})} placeholder="Gala · Eintritt frei…" /></Fld>
              </div>
              <div className="adm-grid-3">
                <Fld label="Tag"><Inp value={form.d} onChange={e => setForm({...form, d: e.target.value})} placeholder="14" /></Fld>
                <Fld label="Monat"><Inp value={form.m} onChange={e => setForm({...form, m: e.target.value})} placeholder="Feb" /></Fld>
                <Fld label="Jahr"><Inp value={form.year || ''} onChange={e => setForm({...form, year: e.target.value})} placeholder={String(new Date().getFullYear())} /></Fld>
              </div>
              <p className="adm-card-desc" style={{ margin: '-6px 0 14px' }}>
                {isUpcoming(form)
                  ? '● Termin steht noch an — die Laufschrift im Kopfbereich wird angezeigt.'
                  : '○ Termin ist vorbei. Ohne Jahresangabe gilt das laufende Jahr.'}
              </p>
              <div className="adm-grid-3">
                <Fld label="Wochentag"><Inp value={form.day} onChange={e => setForm({...form, day: e.target.value})} /></Fld>
                <Fld label="Uhrzeit"><Inp value={form.time} onChange={e => setForm({...form, time: e.target.value})} /></Fld>
                <Fld label="Ort"><Inp value={form.where} onChange={e => setForm({...form, where: e.target.value})} /></Fld>
              </div>
              <Fld label="Beschreibung">
                <Txt value={form.desc} onChange={e => setForm({...form, desc: e.target.value})} />
              </Fld>

              <span className="adm-section-label">Online-Reservierung</span>
              <div className="adm-toggles" style={{ margin: '2px 0 12px' }}>
                <Toggle label="Tickets online reservierbar"
                  desc="Zeigt den Reservieren-Button in Terminliste und Detailfenster"
                  checked={!!form.tickets} onChange={v => setForm({...form, tickets: v})} />
              </div>
              <p className="adm-card-desc" style={{ margin: '0 0 14px' }}>{ticketStatusText(form)}</p>
              {form.tickets && (
                <>
                  <div className="adm-grid-2">
                    <Fld label="Preis / Eintritt">
                      <Inp value={form.price || ''} placeholder="28 € · Mitglieder 24 €"
                        onChange={e => setForm({...form, price: e.target.value})} />
                    </Fld>
                    <Fld label="Kontingent (Plätze, optional)">
                      <Inp type="number" min="0" value={form.seats || ''} placeholder="180"
                        onChange={e => setForm({...form, seats: e.target.value ? Number(e.target.value) : undefined})} />
                    </Fld>
                  </div>
                  <Fld label="Hinweis im Reservierungsformular (optional)">
                    <Inp value={form.ticketNote || ''} placeholder="Tischreservierungen ab 6 Personen bitte vermerken."
                      onChange={e => setForm({...form, ticketNote: e.target.value})} />
                  </Fld>
                </>
              )}

              <div className="adm-actions">
                <Btn onClick={() => save(ev.id)}>Speichern</Btn>
                <Btn v="ghost" onClick={() => setOpen(null)}>Abbrechen</Btn>
                <Btn v="danger" className="right" onClick={() => del(ev.id)}>Löschen</Btn>
              </div>
            </div>
          ) : (
            <div className="adm-row" onClick={() => edit(ev)}>
              <div className="adm-datetile">
                <div className="d">{ev.d}</div>
                <div className="m">{ev.m}</div>
              </div>
              <div className="grow">
                <div className="t">{ev.title}</div>
                <div className="m">
                  {ev.time} · {ev.where || 'Ort offen'}
                  {ev.tickets ? ' · 🎫 Reservierung' : ''}
                </div>
              </div>
              <span className="x">bearbeiten →</span>
            </div>
          )}
        </div>
      ))}

      <AdmReservations onSave={onSave} />
    </div>
  );
}

// ─── Eingegangene Reservierungen ──────────────────────────────────────────────
// Ohne Backend liegen Reservierungen im localStorage des Browsers, in dem sie
// abgeschickt wurden — hier sichtbar sind also die eigenen bzw. die an einem
// gemeinsam genutzten Gerät angelegten.
function AdmReservations({ onSave }) {
  const [list, setList] = useAdmSt(() => (window.loadReservations ? window.loadReservations() : []));
  const [shown, setShown] = useAdmSt(false);
  const [pick, setPick]   = useAdmSt('alle');   // Filter: 'alle' oder eventId/-titel

  const persist = (next, msg) => {
    setList(next);
    if (window.saveReservations) window.saveReservations(next);
    if (msg) onSave(msg);
  };
  const del = id => {
    if (!confirm('Reservierung löschen?')) return;
    persist(list.filter(r => r.id !== id), 'Reservierung gelöscht');
  };
  const clear = () => {
    if (!confirm(`Alle ${list.length} Reservierungen aus diesem Browser löschen?`)) return;
    persist([], 'Reservierungen gelöscht');
  };

  // Nach Termin gruppieren — jüngster Termin zuerst, innerhalb alphabetisch
  const bucketsOf = (rows) => {
    const out = [];
    rows.forEach(r => {
      const key = String(r.eventId || r.eventTitle || '—');
      let b = out.find(x => x.key === key);
      if (!b) { out.push(b = { key, title: r.eventTitle || 'Ohne Termin', date: r.eventDate || '', iso: r.eventIso || '', rows: [] }); }
      b.rows.push(r);
    });
    out.sort((a, b) => String(a.iso).localeCompare(String(b.iso)));
    out.forEach(b => {
      b.rows = b.rows.slice().sort((x, y) => String(x.name || '').localeCompare(String(y.name || ''), 'de'));
      b.seats = b.rows.reduce((a, r) => a + (parseInt(r.count, 10) || 0), 0);
    });
    return out;
  };

  const filtered = pick === 'alle'
    ? list
    : list.filter(r => String(r.eventId || r.eventTitle) === pick);
  const buckets = bucketsOf(filtered);
  const seats = filtered.reduce((a, r) => a + (parseInt(r.count, 10) || 0), 0);
  // Auswahlliste der Termine, für die es Reservierungen gibt
  const picks = bucketsOf(list).map(b => ({ key: b.key, label: `${b.title}${b.date ? ' · ' + b.date : ''} (${b.rows.length})` }));

  const stamp = new Date().toISOString().slice(0, 10);
  const fileTag = pick === 'alle' ? 'alle' : (buckets[0] ? buckets[0].title : pick)
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const exportCsv = () => {
    const cell = v => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
    const rows = [['Code','Eingegangen','Veranstaltung','Termin','Uhrzeit','Ort','Name','E-Mail','Telefon','Plätze','Anmerkung']];
    buckets.forEach(b => b.rows.forEach(r => rows.push(
      [r.code, r.at, r.eventTitle, r.eventDate, r.eventTime, r.eventWhere, r.name, r.email, r.phone, r.count, r.note]
    )));
    const csv = '﻿' + rows.map(r => r.map(cell).join(';')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `reservierungen-${fileTag}-${stamp}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };

  // Druckansicht: eigener Tab mit Teilnehmerliste je Termin
  const printList = () => {
    const esc = v => String(v == null ? '' : v)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const club = window.SITE_CONFIG || {};
    const body = buckets.map(b => `
      <section>
        <h2>${esc(b.title)}</h2>
        <p class="when">${esc(b.date)}${b.rows[0] && b.rows[0].eventTime ? ' · ' + esc(b.rows[0].eventTime) : ''}${b.rows[0] && b.rows[0].eventWhere ? ' · ' + esc(b.rows[0].eventWhere) : ''}</p>
        <table>
          <thead><tr><th>Name</th><th>Kontakt</th><th class="n">Plätze</th><th>Kennung</th><th>Anmerkung</th><th class="box">Da</th></tr></thead>
          <tbody>
            ${b.rows.map(r => `<tr>
              <td><strong>${esc(r.name)}</strong></td>
              <td>${esc(r.email)}${r.phone ? '<br>' + esc(r.phone) : ''}</td>
              <td class="n">${esc(r.count)}</td>
              <td class="mono">${esc(r.code)}</td>
              <td>${esc(r.note)}</td>
              <td class="box"></td>
            </tr>`).join('')}
          </tbody>
          <tfoot><tr><td colspan="2">${b.rows.length} Reservierung${b.rows.length === 1 ? '' : 'en'}</td><td class="n">${b.seats}</td><td colspan="3"></td></tr></tfoot>
        </table>
      </section>`).join('');

    const html = `<!doctype html><html lang="de"><head><meta charset="utf-8">
      <title>Reservierungen ${esc(stamp)}</title>
      <style>
        * { box-sizing: border-box; }
        body { font-family: -apple-system, "Segoe UI", Helvetica, Arial, sans-serif; color: #16140F; margin: 32px; }
        header { border-bottom: 3px solid #C8202C; padding-bottom: 12px; margin-bottom: 26px; }
        header h1 { font-size: 22px; margin: 0 0 4px; }
        header p { margin: 0; font-size: 12px; color: #7C7363; letter-spacing: 0.06em; text-transform: uppercase; }
        section { margin-bottom: 34px; page-break-inside: avoid; }
        section h2 { font-size: 17px; margin: 0 0 2px; color: #9C1822; }
        .when { margin: 0 0 12px; font-size: 12px; color: #7C7363; }
        table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
        th, td { text-align: left; padding: 7px 8px; border-bottom: 1px solid rgba(22,20,15,0.15); vertical-align: top; }
        thead th { font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; color: #7C7363; border-bottom: 1px solid #16140F; }
        tfoot td { font-weight: 600; border-top: 1px solid #16140F; border-bottom: 0; }
        .n { text-align: right; white-space: nowrap; }
        .mono { font-family: ui-monospace, Menlo, Consolas, monospace; font-size: 11.5px; }
        .box { width: 34px; }
        tbody .box { border-left: 1px solid rgba(22,20,15,0.15); }
        footer { margin-top: 30px; font-size: 11px; color: #7C7363; border-top: 1px solid rgba(22,20,15,0.15); padding-top: 10px; }
        @media print { body { margin: 12mm; } }
      </style></head><body>
      <header>
        <h1>Reservierungen — Faschingsverein Nazumido</h1>
        <p>${esc(pick === 'alle' ? 'Alle Termine' : (buckets[0] ? buckets[0].title : ''))} · Stand ${esc(new Date().toLocaleDateString('de-AT'))} · ${filtered.length} Reservierung${filtered.length === 1 ? '' : 'en'} · ${seats} ${seats === 1 ? 'Platz' : 'Plätze'}</p>
      </header>
      ${body || '<p>Keine Reservierungen.</p>'}
      <footer>${esc(club.address || '')}${club.city ? ', ' + esc(club.city) : ''} · ${esc(club.email || '')}${club.phone ? ' · ' + esc(club.phone) : ''}</footer>
      </body></html>`;

    const win = window.open('', '_blank');
    if (!win) { alert('Der Browser hat das Druckfenster blockiert — bitte Pop-ups für diese Seite erlauben.'); return; }
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => { try { win.print(); } catch (e) {} }, 250);
  };

  return (
    <div className="adm-card" style={{ marginTop: 26 }}>
      <div className="adm-card-title">Reservierungen ({list.length})</div>
      <p className="adm-card-desc">
        {list.length
          ? `${filtered.length} Anfrage${filtered.length === 1 ? '' : 'n'} · ${seats} Plätze${pick === 'alle' ? ' insgesamt' : ' für diesen Termin'}.`
          : 'Noch keine Reservierungen in diesem Browser.'}
      </p>
      <div className="adm-note">
        Reservierungen werden im Browser der Besucher:in gespeichert und zusätzlich
        per E-Mail an <code>{(window.ticketConfig ? window.ticketConfig().notifyEmail : '') || (window.SITE_CONFIG || {}).email}</code>
        {' '}geschickt. Verlässlich ist der E-Mail-Eingang — diese Liste zeigt nur, was an diesem Gerät angelegt wurde.
      </div>
      {!!picks.length && (
        <Fld label="Termin">
          <Sel value={pick} onChange={e => setPick(e.target.value)}>
            <option value="alle">Alle Termine ({list.length})</option>
            {picks.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
          </Sel>
        </Fld>
      )}
      <div className="adm-actions">
        <Btn v="ghost" className="sm" onClick={() => setShown(s => !s)}>
          {shown ? 'Liste einklappen' : 'Liste anzeigen'}
        </Btn>
        {!!filtered.length && <Btn className="sm" onClick={printList}>Liste drucken</Btn>}
        {!!filtered.length && <Btn v="ghost" className="sm" onClick={exportCsv}>Als CSV exportieren</Btn>}
        {!!list.length && <Btn v="danger" className="sm right" onClick={clear}>Alle löschen</Btn>}
      </div>
      {shown && buckets.map(b => (
        <div key={b.key} style={{ marginTop: 16 }}>
          <span className="adm-section-label">{b.title} · {b.date} · {b.seats} Plätze</span>
          {b.rows.map(r => (
            <div key={r.id} className="adm-res">
              <div className="who">
                <b>{r.name}</b> — {r.email}{r.phone ? ` · ${r.phone}` : ''}
              </div>
              <div className="seats">{r.count}</div>
              <div className="meta">
                {r.code} · {String(r.at || '').slice(0, 10)}
                <button className="adm-iconbtn" style={{ marginLeft: 10 }}
                  onClick={() => del(r.id)} aria-label="Reservierung löschen">✕</button>
              </div>
              {r.note && <div className="note">{r.note}</div>}
            </div>
          ))}
        </div>
      ))}
      {shown && !buckets.length && (
        <p className="adm-card-desc" style={{ marginTop: 14 }}>Für diesen Termin liegen keine Reservierungen vor.</p>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// NEUIGKEITEN
// ═══════════════════════════════════════════════════════════════════════════════
function AdmNews({ onSave, full }) {
  const [items, setItems] = useAdmSt(() => loadData('NEWS'));
  const [open, setOpen] = useAdmSt(null);
  const [form, setForm] = useAdmSt({});

  const edit = n => { setOpen(n.id); setForm({ ...n, body: [...(n.body || [])] }); };
  const save = id => {
    const next = items.map(n => n.id === id ? { ...form } : n);
    setItems(next); saveData('NEWS', next); setOpen(null); onSave('Neuigkeit gespeichert');
  };
  const del = id => {
    if (!confirm('Neuigkeit löschen?')) return;
    const next = items.filter(n => n.id !== id);
    setItems(next); saveData('NEWS', next); setOpen(null); onSave('Neuigkeit gelöscht');
  };
  const add = () => {
    const n = { id: uid(), tag: 'Ankündigung', tagColor: 'green', date: '', readTime: '2 min', title: 'Neue Neuigkeit', excerpt: '', body: [''] };
    setItems([n, ...items]); setOpen(n.id); setForm({ ...n });
  };

  return (
    <div>
      <PanelHead
        title={`${items.length} Beiträge`}
        desc="Rückblicke und Ankündigungen für den Newsfeed der Startseite."
        action={<Btn onClick={add}>+ Neuigkeit hinzufügen</Btn>}
      />
      {items.map(n => (
        <div key={n.id} className={'adm-card' + (open === n.id ? ' open' : '')}>
          {open === n.id ? (
            <div>
              <div className="adm-grid-3">
                <Fld label="Titel"><Inp value={form.title} onChange={e => setForm({...form, title: e.target.value})} /></Fld>
                <Fld label="Datum"><Inp value={form.date} onChange={e => setForm({...form, date: e.target.value})} placeholder="18. Februar 2026" /></Fld>
                <Fld label="Lesezeit"><Inp value={form.readTime} onChange={e => setForm({...form, readTime: e.target.value})} placeholder="2 min" /></Fld>
              </div>
              <div className="adm-grid-3">
                <Fld label="Kategorie"><Inp value={form.tag} onChange={e => setForm({...form, tag: e.target.value})} /></Fld>
                <Fld label="Farbe">
                  <Sel value={form.tagColor} onChange={e => setForm({...form, tagColor: e.target.value})}>
                    <option value="red">Rot</option><option value="green">Grün</option><option value="gold">Gold</option>
                  </Sel>
                </Fld>
                <Fld label="Bild-Pfad (optional)">
                  <Inp value={form.image || ''} onChange={e => setForm({...form, image: e.target.value || undefined})} placeholder="assets/foto.jpg" />
                </Fld>
              </div>
              <Fld label="Kurztext (Vorschau)">
                <Txt value={form.excerpt} onChange={e => setForm({...form, excerpt: e.target.value})} />
              </Fld>
              {full && (
                <div className="adm-field">
                  <label>Artikel-Absätze</label>
                  {(form.body || []).map((p, i) => (
                    <div key={i} className="adm-inline-row" style={{ alignItems: 'flex-start' }}>
                      <Txt value={p} style={{ flex: 1, minHeight: 62 }}
                        onChange={e => { const b = [...form.body]; b[i] = e.target.value; setForm({...form, body: b}); }} />
                      <button className="adm-iconbtn" onClick={() => setForm({...form, body: form.body.filter((_, j) => j !== i)})} aria-label="Absatz entfernen">✕</button>
                    </div>
                  ))}
                  <Btn v="ghost" className="sm" onClick={() => setForm({...form, body: [...(form.body || []), '']})}>+ Absatz hinzufügen</Btn>
                </div>
              )}
              <div className="adm-actions">
                <Btn onClick={() => save(n.id)}>Speichern</Btn>
                <Btn v="ghost" onClick={() => setOpen(null)}>Abbrechen</Btn>
                <Btn v="danger" className="right" onClick={() => del(n.id)}>Löschen</Btn>
              </div>
            </div>
          ) : (
            <div className="adm-row" onClick={() => edit(n)}>
              <div className="grow">
                <div className="m">{n.date || 'ohne Datum'} · {n.tag}</div>
                <div className="t" style={{ marginTop: 3 }}>{n.title}</div>
                <div className="excerpt">{n.excerpt}</div>
              </div>
              <span className="x">bearbeiten →</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// GALERIE-EINSTELLUNGEN — Texte, Darstellung, Gruppen, HD-Freigabe
// Wird sowohl im Galerie-Tab (eingeklappt) als auch in den Einstellungen genutzt.
// ═══════════════════════════════════════════════════════════════════════════════
function AdmGallerySettings({ onSave, onChanged, collapsible = false }) {
  const [shown, setShown]   = useAdmSt(!collapsible);
  const [cfg, setCfg]       = useAdmSt(() => loadData('SITE_CONFIG'));
  const [g, setG]           = useAdmSt(() => galleryCfg());
  const [rows, setRows]     = useAdmSt(() => groupOptions().map(n => ({ orig: n, name: n })));
  const [origs]             = useAdmSt(() => groupOptions().slice());
  const [err, setErr]       = useAdmSt('');

  const set = (k, v) => setG({ ...g, [k]: v });
  const txt = k => ({ value: g[k] || '', onChange: e => set(k, e.target.value) });

  const addGroup = () => setRows([...rows, { orig: null, name: '' }]);
  const updGroup = (i, v) => setRows(rows.map((r, j) => j === i ? { ...r, name: v } : r));
  const delGroup = i => {
    const r = rows[i];
    if (r.orig && !confirm(`Gruppe „${r.orig}" entfernen? Fotos dieser Gruppe werden umgehängt.`)) return;
    setRows(rows.filter((_, j) => j !== i));
  };

  const save = () => {
    const names = rows.map(r => (r.name || '').trim()).filter(Boolean);
    if (!names.length) { setErr('Mindestens eine Galerie-Gruppe wird gebraucht.'); return; }
    if (new Set(names).size !== names.length) { setErr('Gruppennamen müssen eindeutig sein.'); return; }
    setErr('');

    // Umbenannte und entfernte Gruppen: Fotos mitziehen bzw. auffangen
    const fallback = names.includes('Allgemein') ? 'Allgemein' : names[0];
    const map = {};
    rows.forEach(r => {
      const n = (r.name || '').trim();
      if (r.orig && n && n !== r.orig) map[r.orig] = n;
    });
    origs.forEach(o => {
      if (!rows.some(r => r.orig === o)) map[o] = fallback;
    });

    if (Object.keys(map).length) {
      const photos = (loadData('PHOTOS') || []).map(p => map[p.group] ? { ...p, group: map[p.group] } : p);
      saveData('PHOTOS', photos);
    }
    saveData('PHOTO_GROUPS', names);
    setRows(names.map(n => ({ orig: n, name: n })));

    const nextCfg = { ...cfg };
    delete nextCfg.galleryTagline; // Altbestand: Text liegt jetzt in gallery.tagline
    const n = parseInt(g.photosPerGroup, 10);
    nextCfg.gallery = { ...g, photosPerGroup: n > 0 ? n : (window.GALLERY_DEFAULTS || {}).photosPerGroup || 8 };
    setCfg(nextCfg);
    setG(nextCfg.gallery);
    saveData('SITE_CONFIG', nextCfg);

    onSave('Galerie-Einstellungen gespeichert');
    if (onChanged) onChanged();
  };

  const reset = () => {
    if (!confirm('Galerie-Einstellungen (Texte, Darstellung, HD) auf Standard zurücksetzen?')) return;
    const defaults = { ...(window.GALLERY_DEFAULTS || {}) };
    const nextCfg = { ...cfg, gallery: defaults };
    delete nextCfg.galleryTagline;
    setCfg(nextCfg); setG(defaults); setErr('');
    saveData('SITE_CONFIG', nextCfg);
    onSave('Galerie-Einstellungen zurückgesetzt');
    if (onChanged) onChanged();
  };

  if (collapsible && !shown) {
    return (
      <div className="adm-card">
        <div className="adm-card-title">Galerie-Einstellungen</div>
        <p className="adm-card-desc">
          Texte, Filter, Sortierung, Gruppen und HD-Freigabe der Galerie-Seite.
          Dieselben Einstellungen findest du im Vollzugriff unter „Einstellungen".
        </p>
        <Btn v="ghost" onClick={() => setShown(true)}>Einstellungen öffnen</Btn>
      </div>
    );
  }

  return (
    <div>
      {collapsible && (
        <div className="adm-toolbar">
          <span className="adm-section-label" style={{ margin: 0 }}>Galerie-Einstellungen</span>
          <Btn v="ghost" className="sm right" onClick={() => setShown(false)}>Einklappen</Btn>
        </div>
      )}

      <div className="adm-card">
        <div className="adm-card-title">Texte der Galerie-Seite</div>
        <p className="adm-card-desc">Kopfbereich und Überschriften auf <code>#galerie</code>. Beim Titel wird das letzte Wort farbig hervorgehoben.</p>
        <div className="adm-grid-2">
          <Fld label="Kicker (über dem Titel)"><Inp {...txt('kicker')} placeholder="Bildarchiv · seit 1962" /></Fld>
          <Fld label="Seitentitel"><Inp {...txt('title')} placeholder="Unsere Galerie" /></Fld>
        </div>
        <Fld label="Einleitungstext"><Txt {...txt('tagline')} /></Fld>
        <div className="adm-grid-2">
          <Fld label="Abschnitts-Kicker"><Inp {...txt('sectionEyebrow')} placeholder="Rückblick" /></Fld>
          <Fld label="Abschnitts-Überschrift"><Inp {...txt('sectionTitle')} placeholder="Jahr für Jahr" /></Fld>
        </div>
        <Fld label="Abschnitts-Text"><Txt {...txt('sectionLead')} /></Fld>
        <div className="adm-grid-2">
          <Fld label="Titel „keine Fotos“"><Inp {...txt('emptyTitle')} placeholder="Noch nichts im Kasten" /></Fld>
          <Fld label="Text „keine Fotos“"><Inp {...txt('emptyText')} /></Fld>
        </div>
      </div>

      <div className="adm-card">
        <div className="adm-card-title">Darstellung</div>
        <p className="adm-card-desc">Filter, Sortierung und wie viele Fotos auf den Gruppenseiten erscheinen.</p>
        <div className="adm-grid-2">
          <Fld label="Sortierung der Jahrgänge">
            <Sel value={g.sort} onChange={e => set('sort', e.target.value)}>
              <option value="neu">Neueste Session zuerst</option>
              <option value="alt">Älteste Session zuerst</option>
            </Sel>
          </Fld>
          <Fld label="Fotos je Gruppenseite">
            <Inp type="number" min="1" value={g.photosPerGroup}
              onChange={e => set('photosPerGroup', e.target.value)} />
          </Fld>
        </div>
        <div className="adm-toggles">
          <Toggle label="Galerie im Menü zeigen" desc="Link in Navigation und Footer"
            checked={g.showInNav} onChange={v => set('showInNav', v)} />
          <Toggle label="Filter nach Gruppe" desc="Chip-Zeile „Gruppe“ auf der Galerie-Seite"
            checked={g.showGroupFilter} onChange={v => set('showGroupFilter', v)} />
          <Toggle label="Filter nach Jahr" desc="Chip-Zeile „Jahr“ auf der Galerie-Seite"
            checked={g.showYearFilter} onChange={v => set('showYearFilter', v)} />
          <Toggle label="Anlass-Badge auf Fotos" desc="Zeigt das Album auf der Fotokachel"
            checked={g.showAlbumBadge} onChange={v => set('showAlbumBadge', v)} />
        </div>
      </div>

      <div className="adm-card">
        <div className="adm-card-title">HD-Download</div>
        <p className="adm-card-desc">Steuert die Freigabe der hochauflösenden Fassungen und den dunklen Abschnitt am Seitenende.</p>
        <div className="adm-toggles">
          <Toggle label="HD nur für Mitglieder" desc="Aus: jede Besucherin kann HD laden"
            checked={g.hdMembersOnly} onChange={v => set('hdMembersOnly', v)} />
          <Toggle label="HD-Abschnitt anzeigen" desc="Dunkler Block am Ende der Galerie"
            checked={g.showHdSection} onChange={v => set('showHdSection', v)} />
        </div>
        {g.showHdSection && (
          <>
            <Fld label="Überschrift HD-Abschnitt"><Inp {...txt('hdTitle')} placeholder="Fotos in voller Auflösung" /></Fld>
            <Fld label="Text HD-Abschnitt"><Txt {...txt('hdText')} /></Fld>
          </>
        )}
      </div>

      <div className="adm-card">
        <div className="adm-card-title">Galerie-Gruppen</div>
        <p className="adm-card-desc">
          Bereiche für Filter und Foto-Zuordnung. Umbenennen zieht die betroffenen
          Fotos automatisch mit; entfernte Gruppen landen bei
          <strong> {rows.some(r => (r.name || '').trim() === 'Allgemein') ? 'Allgemein' : ((rows[0] && rows[0].name) || '—')}</strong>.
        </p>
        <div className="adm-note">
          Die Namen <code>Garde</code>, <code>Musikzug</code> und <code>Präsidium</code> steuern
          zusätzlich die Fotostreifen auf den jeweiligen Gruppenseiten — wer sie umbenennt,
          lässt dort keine Fotos mehr erscheinen.
        </div>
        {rows.map((r, i) => (
          <div key={i} className="adm-inline-row">
            <Inp value={r.name} placeholder="Gruppenname" style={{ flex: 1 }}
              onChange={e => updGroup(i, e.target.value)} />
            <button className="adm-iconbtn" onClick={() => delGroup(i)} aria-label="Gruppe entfernen">✕</button>
          </div>
        ))}
        <Btn v="ghost" className="sm" onClick={addGroup}>+ Gruppe hinzufügen</Btn>
      </div>

      {err && <p className="adm-err">{err}</p>}
      <div className="adm-actions">
        <Btn onClick={save}>Galerie-Einstellungen speichern</Btn>
        <Btn v="ghost" className="right" onClick={reset}>Texte &amp; Darstellung zurücksetzen</Btn>
      </div>
      <p className="adm-card-desc" style={{ margin: '10px 0 0' }}>
        Zurücksetzen betrifft nur Texte, Darstellung und HD-Freigabe — Gruppen und
        Fotos bleiben unverändert.
      </p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// GALERIE — Fotos vergangener Jahre
// ═══════════════════════════════════════════════════════════════════════════════
function AdmGalerie({ onSave }) {
  const [items, setItems] = useAdmSt(() => loadData('PHOTOS'));
  const [open, setOpen] = useAdmSt(null);
  const [form, setForm] = useAdmSt({});
  const [fYear, setFYear] = useAdmSt('Alle');
  const [fGroup, setFGroup] = useAdmSt('Alle');

  const yearOf = p => (window.photoYear ? window.photoYear(p) : (p.year || null));
  const years = [...new Set(items.map(yearOf).filter(Boolean))].sort((a, b) => b - a);

  const persist = (next, msg) => { setItems(next); saveData('PHOTOS', next); if (msg) onSave(msg); };

  const edit = p => { setOpen(p.id); setForm({ ...p }); };
  const save = id => {
    const next = items.map(p => p.id === id ? { ...form, year: form.year ? Number(form.year) : null } : p);
    setOpen(null); persist(next, 'Foto gespeichert');
  };
  const del = id => {
    if (!confirm('Foto aus der Galerie entfernen?')) return;
    setOpen(null); persist(items.filter(p => p.id !== id), 'Foto gelöscht');
  };
  const add = () => {
    const y = fYear === 'Alle' ? new Date().getFullYear() : fYear;
    const p = {
      id: uid(), src: null, title: 'Neues Foto', date: '', year: y,
      group: fGroup === 'Alle' ? 'Allgemein' : fGroup, album: '',
      size: '1024×768', hdSize: '4096×3072',
    };
    setItems([p, ...items]); setOpen(p.id); setForm({ ...p });
  };

  // Nach Änderungen an den Galerie-Einstellungen (z. B. umbenannte Gruppen)
  // Fotoliste und Filter frisch einlesen
  const reload = () => {
    setItems(loadData('PHOTOS'));
    setOpen(null);
    if (fGroup !== 'Alle' && !groupOptions().includes(fGroup)) setFGroup('Alle');
  };

  const visible = items.filter(p =>
    (fYear === 'Alle' || yearOf(p) === fYear) &&
    (fGroup === 'Alle' || p.group === fGroup)
  );

  // nach Jahr bündeln, neueste Saison zuerst
  const buckets = [];
  visible.forEach(p => {
    const y = yearOf(p);
    let b = buckets.find(x => x.year === y);
    if (!b) { b = { year: y, photos: [] }; buckets.push(b); }
    b.photos.push(p);
  });
  buckets.sort((a, b) => (b.year || 0) - (a.year || 0));

  return (
    <div>
      <PanelHead
        title={`${items.length} Fotos · ${years.length} Jahrgänge`}
        desc="Diese Fotos erscheinen auf der Galerie-Seite (#galerie) und in den Gruppen-Bereichen. Fotos ohne Bildpfad werden als Platzhalter angezeigt."
        action={<Btn onClick={add}>+ Foto hinzufügen</Btn>}
      />

      <AdmGallerySettings onSave={onSave} onChanged={reload} collapsible />

      <div className="adm-toolbar">
        <span className="adm-section-label" style={{ margin: 0 }}>Filter</span>
        <Sel value={fYear} onChange={e => setFYear(e.target.value === 'Alle' ? 'Alle' : Number(e.target.value))}>
          <option value="Alle">Alle Jahre</option>
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </Sel>
        <Sel value={fGroup} onChange={e => setFGroup(e.target.value)}>
          <option value="Alle">Alle Gruppen</option>
          {groupOptions().map(g => <option key={g} value={g}>{g}</option>)}
        </Sel>
        <span className="adm-section-label right" style={{ margin: 0 }}>
          {visible.length} {visible.length === 1 ? 'Foto' : 'Fotos'} sichtbar
        </span>
      </div>

      {buckets.length === 0 && (
        <div className="adm-note">Für diese Auswahl gibt es noch keine Fotos. Leg mit <strong>+ Foto hinzufügen</strong> das erste an.</div>
      )}

      {buckets.map(b => (
        <div key={b.year || 'ohne'}>
          <div className="adm-year-band">
            <span className="y">{b.year || 'Ohne Jahr'}</span>
            <span className="c">{b.photos.length} {b.photos.length === 1 ? 'Aufnahme' : 'Aufnahmen'}</span>
          </div>
          <div className="adm-photo-grid">
            {b.photos.map(p => (
              <div key={p.id} className={'adm-photo' + (open === p.id ? ' open' : '')}>
                {open === p.id ? (
                  <div style={{ padding: '16px 16px 18px' }}>
                    <Fld label="Titel"><Inp value={form.title} onChange={e => setForm({...form, title: e.target.value})} /></Fld>
                    <div className="adm-grid-2">
                      <Fld label="Datum"><Inp value={form.date} onChange={e => setForm({...form, date: e.target.value})} placeholder="Feb 2026" /></Fld>
                      <Fld label="Jahr"><Inp type="number" value={form.year || ''} onChange={e => setForm({...form, year: e.target.value})} placeholder="2026" /></Fld>
                    </div>
                    <Fld label="Gruppe">
                      <Sel value={form.group} onChange={e => setForm({...form, group: e.target.value})}>
                        {groupOptions().map(g => <option key={g}>{g}</option>)}
                      </Sel>
                    </Fld>
                    <Fld label="Album / Anlass">
                      <Inp value={form.album || ''} onChange={e => setForm({...form, album: e.target.value})} placeholder="Faschingsumzug" />
                    </Fld>
                    <Fld label="Bilddatei (Pfad)">
                      <Inp value={form.src || ''} onChange={e => setForm({...form, src: e.target.value || null})} placeholder="assets/foto.jpg" />
                    </Fld>
                    <div className="adm-grid-2">
                      <Fld label="Web-Größe"><Inp value={form.size || ''} onChange={e => setForm({...form, size: e.target.value})} /></Fld>
                      <Fld label="HD-Größe"><Inp value={form.hdSize || ''} onChange={e => setForm({...form, hdSize: e.target.value})} /></Fld>
                    </div>
                    <div className="adm-actions">
                      <Btn className="sm" onClick={() => save(p.id)}>Speichern</Btn>
                      <Btn v="ghost" className="sm" onClick={() => setOpen(null)}>Abbrechen</Btn>
                      <Btn v="danger" className="sm right" onClick={() => del(p.id)}>Löschen</Btn>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="adm-photo-thumb">
                      {p.src ? <img src={p.src} alt={p.title} /> : <div className="ph">Kein Bild</div>}
                      <span className="year">{yearOf(p) || '—'}</span>
                    </div>
                    <div className="adm-photo-body">
                      <div className="t">{p.title}</div>
                      <div className="m">{p.date || 'ohne Datum'} · {p.group}{p.album ? ` · ${p.album}` : ''}</div>
                      <Btn v="ghost" className="sm block" onClick={() => edit(p)}>Bearbeiten</Btn>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PERSONEN
// ═══════════════════════════════════════════════════════════════════════════════
function AdmPeople({ onSave }) {
  const [items, setItems] = useAdmSt(() => loadData('PEOPLE'));
  const [open, setOpen] = useAdmSt(null);
  const [form, setForm] = useAdmSt({});

  const edit = p => { setOpen(p.id); setForm({...p}); };
  const save = id => {
    const next = items.map(p => p.id === id ? {...form} : p);
    setItems(next); saveData('PEOPLE', next); setOpen(null); onSave('Person gespeichert');
  };
  const del = id => {
    if (!confirm('Person löschen?')) return;
    const next = items.filter(p => p.id !== id);
    setItems(next); saveData('PEOPLE', next); setOpen(null); onSave('Person gelöscht');
  };
  const add = () => {
    const p = { id: uid(), initial: '?', name: 'Neue Person', role: '', group: 'Präsidium', dotColor: 'red', bio: '', contact: '' };
    setItems([...items, p]); setOpen(p.id); setForm({...p});
  };

  return (
    <div>
      <PanelHead
        title={`${items.length} Funktionär:innen`}
        desc="Erscheinen auf der Startseite und im Präsidiums-Bereich."
        action={<Btn onClick={add}>+ Person hinzufügen</Btn>}
      />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
        {items.map(p => (
          <div key={p.id} className={'adm-card' + (open === p.id ? ' open' : '') + ' accent-' + (p.dotColor || 'red')} style={{ marginBottom: 0 }}>
            {open === p.id ? (
              <div>
                <div className="adm-grid-2">
                  <Fld label="Name"><Inp value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></Fld>
                  <Fld label="Kürzel"><Inp value={form.initial} maxLength={2} onChange={e => setForm({...form, initial: e.target.value})} /></Fld>
                  <Fld label="Rolle / Funktion"><Inp value={form.role} onChange={e => setForm({...form, role: e.target.value})} /></Fld>
                  <Fld label="Gruppe">
                    <Sel value={form.group} onChange={e => setForm({...form, group: e.target.value})}>
                      <option>Präsidium</option><option>Garde</option><option>Musikzug</option>
                    </Sel>
                  </Fld>
                  <Fld label="Farbe">
                    <Sel value={form.dotColor} onChange={e => setForm({...form, dotColor: e.target.value})}>
                      <option value="red">Rot</option><option value="green">Grün</option><option value="gold">Gold</option>
                    </Sel>
                  </Fld>
                  <Fld label="Kontakt / E-Mail"><Inp value={form.contact} onChange={e => setForm({...form, contact: e.target.value})} /></Fld>
                </div>
                <Fld label="Telefon (optional)">
                  <Inp value={form.phone || ''} onChange={e => setForm({...form, phone: e.target.value || undefined})} />
                </Fld>
                <Fld label="Biografie">
                  <Txt value={form.bio} onChange={e => setForm({...form, bio: e.target.value})} />
                </Fld>
                <div className="adm-actions">
                  <Btn className="sm" onClick={() => save(p.id)}>Speichern</Btn>
                  <Btn v="ghost" className="sm" onClick={() => setOpen(null)}>Abbrechen</Btn>
                  <Btn v="danger" className="sm right" onClick={() => del(p.id)}>Löschen</Btn>
                </div>
              </div>
            ) : (
              <div>
                <div className="adm-row" style={{ marginBottom: 12, cursor: 'default' }}>
                  <div className={'adm-avatar ' + (p.dotColor || 'red')}>
                    <span className="dot"></span>{p.initial}
                  </div>
                  <div className="grow">
                    <div className="t">{p.name}</div>
                    <div className="m">{p.role} · {p.group}</div>
                  </div>
                </div>
                <p style={{ fontSize: 13.5, color: 'var(--ink-2)', margin: '0 0 14px' }}>{p.bio}</p>
                <Btn v="ghost" className="sm block" onClick={() => edit(p)}>Bearbeiten</Btn>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// GRUPPEN (Garde / Musikzug / Präsidium)
// ═══════════════════════════════════════════════════════════════════════════════
function AdmGruppen({ onSave }) {
  const [tab, setTab] = useAdmSt('garde');
  const [garde,    setGarde]    = useAdmSt(() => loadData('GARDE'));
  const [musikzug, setMusikzug] = useAdmSt(() => loadData('MUSIKZUG'));
  const [vorsitz,  setVorsitz]  = useAdmSt(() => loadData('VORSITZ'));

  return (
    <div>
      <div className="adm-chips">
        {[['garde','💃 Garde'],['musikzug','🎺 Musikzug'],['vorsitz','🏛 Präsidium']].map(([id, label]) => (
          <Chip key={id} active={tab === id} onClick={() => setTab(id)}>{label}</Chip>
        ))}
      </div>

      {tab === 'garde' && (
        <div>
          <div className="adm-card">
            <div className="adm-card-title">Allgemein</div>
            <div className="adm-grid-3">
              <Fld label="Mitglieder"><Inp type="number" value={garde.members} onChange={e => setGarde({...garde, members: +e.target.value})} /></Fld>
              <Fld label="Trainerin"><Inp value={garde.trainer} onChange={e => setGarde({...garde, trainer: e.target.value})} /></Fld>
              <Fld label="Training"><Inp value={garde.practice} onChange={e => setGarde({...garde, practice: e.target.value})} /></Fld>
            </div>
            <Fld label="Tagline"><Inp value={garde.tagline} onChange={e => setGarde({...garde, tagline: e.target.value})} /></Fld>
          </div>
          <div className="adm-card">
            <div className="adm-card-title">Untergruppen</div>
            <p className="adm-card-desc">Name, Altersgruppe und Anzahl der Aktiven.</p>
            <RowListEditor items={garde.groups} onChange={v => setGarde({...garde, groups: v})}
              fields={[{key:'name',placeholder:'Name',flex:2},{key:'age',placeholder:'Alter'},{key:'count',placeholder:'Anz.'}]}
              addLabel="Untergruppe" />
          </div>
          <div className="adm-card">
            <div className="adm-card-title">Trainingsplan</div>
            <RowListEditor items={garde.schedule} onChange={v => setGarde({...garde, schedule: v})}
              fields={[{key:'d',placeholder:'Tag'},{key:'t',placeholder:'Uhr'},{key:'what',placeholder:'Inhalt',flex:3}]}
              addLabel="Einheit" />
          </div>
          <div className="adm-card">
            <div className="adm-card-title">Meilensteine</div>
            <RowListEditor items={garde.highlights} onChange={v => setGarde({...garde, highlights: v})}
              fields={[{key:'year',placeholder:'Jahr'},{key:'text',placeholder:'Text',flex:4}]}
              addLabel="Meilenstein" />
          </div>
          <Btn onClick={() => { saveData('GARDE', garde); onSave('Garde gespeichert'); }}>Garde speichern</Btn>
        </div>
      )}

      {tab === 'musikzug' && (
        <div>
          <div className="adm-card">
            <div className="adm-card-title">Allgemein</div>
            <div className="adm-grid-3">
              <Fld label="Mitglieder"><Inp type="number" value={musikzug.members} onChange={e => setMusikzug({...musikzug, members: +e.target.value})} /></Fld>
              <Fld label="Kapellmeister"><Inp value={musikzug.trainer} onChange={e => setMusikzug({...musikzug, trainer: e.target.value})} /></Fld>
              <Fld label="Probe"><Inp value={musikzug.practice} onChange={e => setMusikzug({...musikzug, practice: e.target.value})} /></Fld>
            </div>
            <Fld label="Tagline"><Inp value={musikzug.tagline} onChange={e => setMusikzug({...musikzug, tagline: e.target.value})} /></Fld>
          </div>
          <div className="adm-card">
            <div className="adm-card-title">Register</div>
            <RowListEditor items={musikzug.groups} onChange={v => setMusikzug({...musikzug, groups: v})}
              fields={[{key:'name',placeholder:'Register',flex:2},{key:'count',placeholder:'Anz.'}]}
              addLabel="Register" />
          </div>
          <div className="adm-card">
            <div className="adm-card-title">Repertoire</div>
            <TextListEditor items={musikzug.repertoire} placeholder="Stück"
              onChange={v => setMusikzug({...musikzug, repertoire: v})} addLabel="Stück hinzufügen" />
          </div>
          <div className="adm-card">
            <div className="adm-card-title">Meilensteine</div>
            <RowListEditor items={musikzug.highlights} onChange={v => setMusikzug({...musikzug, highlights: v})}
              fields={[{key:'year',placeholder:'Jahr'},{key:'text',placeholder:'Text',flex:4}]}
              addLabel="Meilenstein" />
          </div>
          <Btn onClick={() => { saveData('MUSIKZUG', musikzug); onSave('Musikzug gespeichert'); }}>Musikzug speichern</Btn>
        </div>
      )}

      {tab === 'vorsitz' && (
        <div>
          <div className="adm-card">
            <div className="adm-card-title">Allgemein</div>
            <div className="adm-grid-2">
              <Fld label="Mitglieder"><Inp type="number" value={vorsitz.members} onChange={e => setVorsitz({...vorsitz, members: +e.target.value})} /></Fld>
              <Fld label="Sitzung"><Inp value={vorsitz.practice} onChange={e => setVorsitz({...vorsitz, practice: e.target.value})} /></Fld>
            </div>
            <Fld label="Tagline"><Inp value={vorsitz.tagline} onChange={e => setVorsitz({...vorsitz, tagline: e.target.value})} /></Fld>
          </div>
          <div className="adm-card">
            <div className="adm-card-title">Aufgaben</div>
            <TextListEditor items={vorsitz.responsibilities} placeholder="Aufgabe"
              onChange={v => setVorsitz({...vorsitz, responsibilities: v})} addLabel="Aufgabe" />
          </div>
          <div className="adm-card">
            <div className="adm-card-title">Vereinsgeschichte</div>
            <RowListEditor items={vorsitz.history} onChange={v => setVorsitz({...vorsitz, history: v})}
              fields={[{key:'year',placeholder:'Jahr'},{key:'text',placeholder:'Text',flex:4}]}
              addLabel="Eintrag" />
          </div>
          <Btn onClick={() => { saveData('VORSITZ', vorsitz); onSave('Präsidium gespeichert'); }}>Präsidium speichern</Btn>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SPONSOREN
// ═══════════════════════════════════════════════════════════════════════════════
function AdmSponsors({ onSave }) {
  const [tiers, setTiers] = useAdmSt(() => loadData('SPONSORS_TIERS'));

  const updSponsor = (ti, si, k, v) => setTiers(tiers.map((t, i) => i !== ti ? t : {...t, sponsors: t.sponsors.map((s, j) => j !== si ? s : {...s, [k]: v})}));
  const delSponsor = (ti, si) => {
    if (!confirm('Sponsor entfernen?')) return;
    const next = tiers.map((t, i) => i !== ti ? t : {...t, sponsors: t.sponsors.filter((_, j) => j !== si)});
    setTiers(next); saveData('SPONSORS_TIERS', next); onSave('Sponsor gelöscht');
  };
  const addSponsor = ti => setTiers(tiers.map((t, i) => i !== ti ? t : {...t, sponsors: [...t.sponsors, { name: 'Neuer Sponsor', since: new Date().getFullYear(), branch: '' }]}));
  const save = () => { saveData('SPONSORS_TIERS', tiers); onSave('Sponsoren gespeichert'); };

  const accent = { Hauptsponsor: 'accent-red', Premium: 'accent-green', Förderer: 'accent-gold' };

  return (
    <div>
      <PanelHead
        title={`${tiers.reduce((a, t) => a + t.sponsors.length, 0)} Partner`}
        desc="Drei Stufen — Reihenfolge und Farbe entsprechen der Sponsorenseite."
        action={<Btn onClick={save}>Alle Sponsoren speichern</Btn>}
      />
      {tiers.map((tier, ti) => (
        <div key={ti} className={'adm-card ' + (accent[tier.tier] || '')}>
          <div className="adm-card-title">{tier.tier}</div>
          <p className="adm-card-desc">{tier.desc}</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10 }}>
            {tier.sponsors.map((s, si) => (
              <div key={si} className="adm-subcard">
                <div className="adm-inline-row">
                  <Inp value={s.name} onChange={e => updSponsor(ti, si, 'name', e.target.value)} style={{ fontWeight: 600 }} />
                  <button className="adm-iconbtn" onClick={() => delSponsor(ti, si)} aria-label="Sponsor entfernen">✕</button>
                </div>
                <div className="adm-grid-2">
                  <Inp value={s.branch} onChange={e => updSponsor(ti, si, 'branch', e.target.value)} placeholder="Branche" />
                  <Inp type="number" value={s.since} onChange={e => updSponsor(ti, si, 'since', +e.target.value)} placeholder="Seit" />
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12 }}>
            <Btn v="ghost" className="sm" onClick={() => addSponsor(ti)}>+ Sponsor hinzufügen</Btn>
          </div>
        </div>
      ))}
      <Btn onClick={save}>Alle Sponsoren speichern</Btn>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MITGLIEDER-INHALTE
// ═══════════════════════════════════════════════════════════════════════════════
function AdmInternal({ onSave }) {
  const [data, setData] = useAdmSt(() => loadData('INTERNAL'));
  const [role, setRole] = useAdmSt('Mitglied');

  const upd = (i, k, v) => setData({...data, [role]: data[role].map((d, j) => j === i ? {...d, [k]: v} : d)});
  const del = i => { if (!confirm('Entfernen?')) return; setData({...data, [role]: data[role].filter((_, j) => j !== i)}); };
  const add = () => setData({...data, [role]: [...data[role], { kind: 'doc', icon: '📄', title: 'Neues Dokument', meta: '' }]});
  const save = () => { saveData('INTERNAL', data); onSave('Mitglieder-Bereich gespeichert'); };

  return (
    <div>
      <div className="adm-note">
        Jede Rolle sieht im Mitglieder-Dashboard nur ihre eigenen Inhalte.
        Einträge mit <code>photos</code> verlinken auf die Fotogalerie.
      </div>
      <div className="adm-chips">
        {['Mitglied','Trainerin','Vorstand'].map(r => (
          <Chip key={r} active={role === r} onClick={() => setRole(r)}>{r}</Chip>
        ))}
      </div>
      {(data[role] || []).map((doc, i) => (
        <div key={i} className="adm-card" style={{ display: 'grid', gridTemplateColumns: '54px 1.4fr 1.4fr 110px 40px', gap: 10, alignItems: 'center' }}>
          <Inp value={doc.icon} onChange={e => upd(i, 'icon', e.target.value)} style={{ textAlign: 'center', fontSize: 18 }} />
          <Inp value={doc.title} onChange={e => upd(i, 'title', e.target.value)} />
          <Inp value={doc.meta} onChange={e => upd(i, 'meta', e.target.value)} placeholder="Meta (Typ, Größe…)" />
          <Sel value={doc.kind} onChange={e => upd(i, 'kind', e.target.value)}>
            <option value="doc">Dokument</option><option value="photos">Galerie</option>
          </Sel>
          <button className="adm-iconbtn" onClick={() => del(i)} aria-label="Eintrag entfernen">✕</button>
        </div>
      ))}
      <div className="adm-actions">
        <Btn v="ghost" onClick={add}>+ Dokument hinzufügen</Btn>
        <Btn onClick={save}>Speichern</Btn>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// VEREINSINFO
// ═══════════════════════════════════════════════════════════════════════════════
// Vorlauf der Laufschrift in Tagen — eingestellt wird in Wochen
function stripLeadDays(cfg) {
  if (cfg.topbarStripWeeks !== undefined && cfg.topbarStripWeeks !== null && cfg.topbarStripWeeks !== '') {
    const w = parseInt(cfg.topbarStripWeeks, 10);
    return w > 0 ? w * 7 : 0;
  }
  const d = parseInt(cfg.topbarStripDays, 10);
  return d > 0 ? d : 0;
}

// Zeigt an, ob die Laufschrift mit den aktuellen Terminen sichtbar wäre
function stripPreview(cfg) {
  if (cfg.topbarStripOnlyWithEvent === false) return 'Laufschrift läuft dauerhaft — unabhängig von den Terminen.';
  const list = window.upcomingEvents ? window.upcomingEvents(stripLeadDays(cfg)) : [];
  const weeks = parseInt(cfg.topbarStripWeeks, 10) > 0 ? parseInt(cfg.topbarStripWeeks, 10) : 0;
  const range = weeks ? `in den nächsten ${weeks} Woche${weeks === 1 ? '' : 'n'}` : 'insgesamt';
  if (!list.length) return `Kein Termin ${range} — Laufschrift bleibt ausgeblendet.`;
  const next = list[0];
  return `${list.length} Termin${list.length > 1 ? 'e' : ''} ${range} anstehend, nächster: `
    + `${next.title} (${next.d}. ${next.m}) — Laufschrift wird angezeigt.`;
}

function AdmInfo({ onSave }) {
  const [cfg, setCfg] = useAdmSt(() => {
    const c = loadData('SITE_CONFIG');
    // Altbestand: Vorlauf lag in Tagen vor, eingestellt wird jetzt in Wochen
    if (c.topbarStripWeeks === undefined || c.topbarStripWeeks === null || c.topbarStripWeeks === '') {
      const d = parseInt(c.topbarStripDays, 10);
      c.topbarStripWeeks = d > 0 ? Math.ceil(d / 7) : 0;
    }
    return c;
  });
  const f = k => ({ value: cfg[k] || '', onChange: e => setCfg({...cfg, [k]: e.target.value}) });
  const stripOn = cfg.topbarStripEnabled !== false;
  const save = () => {
    const next = { ...cfg };
    const w = parseInt(next.topbarStripWeeks, 10);
    next.topbarStripWeeks = w > 0 ? w : 0;
    delete next.topbarStripDays; // ersetzt durch topbarStripWeeks
    setCfg(next); saveData('SITE_CONFIG', next); onSave('Vereinsinfo gespeichert');
  };
  return (
    <div>
      <div className="adm-card">
        <div className="adm-card-title">Hero & Statistiken</div>
        <p className="adm-card-desc">Zahlen und Texte im Kopfbereich der Startseite.</p>
        <div className="adm-grid-3">
          <Fld label="Mitgliederzahl"><Inp {...f('memberCount')} /></Fld>
          <Fld label="Saisonzeitraum"><Inp {...f('season')} /></Fld>
          <Fld label="Nächstes Event"><Inp {...f('heroNextEvent')} /></Fld>
          <Fld label="Präsident Name"><Inp {...f('presidentName')} /></Fld>
          <Fld label="Jahre Tradition"><Inp {...f('welcomeYears')} /></Fld>
          <Fld label="Events pro Jahr"><Inp {...f('welcomeEvents')} /></Fld>
        </div>
      </div>
      <div className="adm-card">
        <div className="adm-card-title">Kontaktdaten</div>
        <div className="adm-grid-2">
          <Fld label="Adresse (Straße)"><Inp {...f('address')} /></Fld>
          <Fld label="Ort"><Inp {...f('city')} /></Fld>
          <Fld label="Telefon"><Inp {...f('phone')} /></Fld>
          <Fld label="E-Mail"><Inp {...f('email')} /></Fld>
          <Fld label="Website (URL)"><Inp {...f('website')} /></Fld>
          <Fld label="Website (Anzeige)"><Inp {...f('websiteLabel')} /></Fld>
        </div>
      </div>
      <div className="adm-card">
        <div className="adm-card-title">Laufschrift (Leiste ganz oben)</div>
        <p className="adm-card-desc">
          Die schmale Leiste über der Navigation. Mit dem Schalter komplett ein- oder
          ausblenden — oder alle Termine eintragen und einstellen, wie viele Wochen
          vorher sie von selbst auftauchen soll.
        </p>
        <div className="adm-powerrow">
          <PowerBtn on={stripOn}
            onLabel="Leiste ist eingeschaltet" offLabel="Leiste ist ausgeschaltet"
            onChange={v => setCfg({...cfg, topbarStripEnabled: v})} />
          <span className="state">
            {stripOn ? stripPreview(cfg) : 'Die Leiste bleibt ausgeblendet — unabhängig von den Terminen.'}
          </span>
        </div>
        {stripOn && (
          <>
            <Fld label="Texte — ein Eintrag pro Zeile">
              <Txt style={{ minHeight: 110 }}
                value={(cfg.topbarStrip || []).join('\n')}
                onChange={e => setCfg({...cfg, topbarStrip: e.target.value.split('\n')})} />
            </Fld>
            <div className="adm-toggles" style={{ marginTop: 4 }}>
              <Toggle label="Nur bei anstehenden Terminen zeigen"
                desc="Aus: Laufschrift läuft immer"
                checked={cfg.topbarStripOnlyWithEvent !== false}
                onChange={v => setCfg({...cfg, topbarStripOnlyWithEvent: v})} />
            </div>
            {cfg.topbarStripOnlyWithEvent !== false && (
              <div className="adm-grid-2" style={{ marginTop: 14 }}>
                <Fld label="Vorlauf in Wochen (0 = jeder künftige Termin)">
                  <Inp type="number" min="0" value={cfg.topbarStripWeeks ?? 0}
                    onChange={e => setCfg({...cfg, topbarStripWeeks: e.target.value})} />
                </Fld>
                <Fld label="Aktuell">
                  <div className="adm-card-desc" style={{ margin: '10px 0 0' }}>
                    {stripPreview(cfg)}
                  </div>
                </Fld>
              </div>
            )}
          </>
        )}
      </div>
      <Btn onClick={save}>Vereinsinfo speichern</Btn>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TICKET-EINSTELLUNGEN — Online-Reservierung für Veranstaltungen
// ═══════════════════════════════════════════════════════════════════════════════
function ticketCfg() {
  return typeof ticketConfig === 'function'
    ? ticketConfig()
    : Object.assign({}, window.TICKET_DEFAULTS, (window.SITE_CONFIG || {}).tickets);
}

function AdmTicketSettings({ onSave }) {
  const [cfg, setCfg] = useAdmSt(() => loadData('SITE_CONFIG'));
  const [t, setT]     = useAdmSt(() => ticketCfg());

  const set = (k, v) => setT({ ...t, [k]: v });
  const txt = k => ({ value: t[k] || '', onChange: e => set(k, e.target.value) });
  const events = (loadData('EVENTS') || []).filter(e => e.tickets);

  const save = () => {
    const max = parseInt(t.maxPerBooking, 10);
    const weeks = parseInt(t.openWeeks, 10);
    const next = {
      ...cfg,
      tickets: {
        ...t,
        maxPerBooking: max > 0 ? max : (window.TICKET_DEFAULTS || {}).maxPerBooking || 10,
        openWeeks: weeks > 0 ? weeks : 0,
      },
    };
    setCfg(next); setT(next.tickets);
    saveData('SITE_CONFIG', next);
    onSave('Ticket-Einstellungen gespeichert');
  };

  const reset = () => {
    if (!confirm('Ticket-Einstellungen auf Standard zurücksetzen?')) return;
    const defaults = { ...(window.TICKET_DEFAULTS || {}) };
    const next = { ...cfg, tickets: defaults };
    setCfg(next); setT(defaults);
    saveData('SITE_CONFIG', next);
    onSave('Ticket-Einstellungen zurückgesetzt');
  };

  return (
    <div>
      <div className="adm-card">
        <div className="adm-card-title">Online-Reservierung</div>
        <p className="adm-card-desc">
          Hauptschalter für die Ticket-Reservierung. Welche Termine reservierbar
          sind, stellst du beim jeweiligen Event unter <strong>Events</strong> ein.
        </p>
        <div className="adm-powerrow">
          <PowerBtn on={t.enabled !== false}
            onLabel="Reservierung ist eingeschaltet" offLabel="Reservierung ist ausgeschaltet"
            onChange={v => set('enabled', v)} />
          <span className="state">
            {t.enabled === false
              ? 'Auf der Website erscheinen keine Reservieren-Buttons.'
              : (events.length
                  ? `${events.length} Termin${events.length === 1 ? '' : 'e'} mit Reservierung: ${events.map(e => e.title).join(', ')}.`
                  : 'Noch kein Termin für die Reservierung freigeschaltet — im Tab „Events" aktivieren.')}
          </span>
        </div>
        <div className="adm-toggles">
          <Toggle label="Button in der Terminliste" desc="Reservieren direkt aus der Event-Liste heraus"
            checked={t.showInEvents !== false} onChange={v => set('showInEvents', v)} />
          <Toggle label="Eigener Tab für die Reservierung" desc="Aus: Reservierung öffnet im Fenster über dem Termin"
            checked={t.openInNewTab !== false} onChange={v => set('openInNewTab', v)} />
          <Toggle label="Telefonnummer verpflichtend" desc="Aus: Telefon ist optional"
            checked={!!t.requirePhone} onChange={v => set('requirePhone', v)} />
          <Toggle label="E-Mail-Kopie anbieten" desc="Link „Reservierung per E-Mail senden“ nach dem Absenden"
            checked={t.showMailCopy !== false} onChange={v => set('showMailCopy', v)} />
        </div>
      </div>

      <div className="adm-card">
        <div className="adm-card-title">Zeitraum & Umfang</div>
        <p className="adm-card-desc">
          Trag alle Termine ein — die Reservierung öffnet dann von selbst die
          eingestellte Zahl an Wochen vor dem jeweiligen Termin und schließt am Eventtag.
        </p>
        <div className="adm-grid-3">
          <Fld label="Reservierung öffnet … Wochen vorher (0 = sofort)">
            <Inp type="number" min="0" value={t.openWeeks ?? 0}
              onChange={e => set('openWeeks', e.target.value)} />
          </Fld>
          <Fld label="Plätze je Reservierung (max.)">
            <Inp type="number" min="1" value={t.maxPerBooking ?? 10}
              onChange={e => set('maxPerBooking', e.target.value)} />
          </Fld>
          <Fld label="Reservierungen an (E-Mail)">
            <Inp {...txt('notifyEmail')} placeholder={(window.SITE_CONFIG || {}).email || 'Nazu.Mido@gmx.at'} />
          </Fld>
        </div>
        <div className="adm-note">
          {parseInt(t.openWeeks, 10) > 0
            ? `Beispiel: Ein Termin am 14. Februar ist ab ${parseInt(t.openWeeks, 10)} Woche${parseInt(t.openWeeks, 10) === 1 ? '' : 'n'} davor reservierbar.`
            : 'Alle freigeschalteten Termine sind sofort reservierbar.'}
          {' '}Leere E-Mail bedeutet: Reservierungen gehen an die Vereinsadresse aus der Vereinsinfo.
        </div>
      </div>

      <div className="adm-card">
        <div className="adm-card-title">Texte</div>
        <p className="adm-card-desc">Beschriftung und Texte im Reservierungsfenster.</p>
        <div className="adm-grid-2">
          <Fld label="Button-Text"><Inp {...txt('ctaLabel')} placeholder="Tickets reservieren" /></Fld>
          <Fld label="Überschrift im Formular"><Inp {...txt('title')} placeholder="Tickets reservieren" /></Fld>
        </div>
        <Fld label="Einleitungstext"><Txt {...txt('lead')} /></Fld>
        <div className="adm-grid-2">
          <Fld label="Überschrift nach dem Absenden"><Inp {...txt('successTitle')} placeholder="Reservierung notiert!" /></Fld>
          <Fld label="Text „keine Reservierung möglich“"><Inp {...txt('closedText')} /></Fld>
        </div>
        <Fld label="Bestätigungstext"><Txt {...txt('successText')} /></Fld>
      </div>

      <div className="adm-actions">
        <Btn onClick={save}>Ticket-Einstellungen speichern</Btn>
        <Btn v="ghost" className="right" onClick={reset}>Auf Standard zurücksetzen</Btn>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// EINSTELLUNGEN
// ═══════════════════════════════════════════════════════════════════════════════
function AdmSettings({ onSave }) {
  const [section, setSection] = useAdmSt('galerie');
  const [pw, setPw] = useAdmSt('');
  const [pw2, setPw2] = useAdmSt('');
  const [err, setErr] = useAdmSt('');

  const changePass = e => {
    e.preventDefault();
    if (pw.length < 4) { setErr('Mindestens 4 Zeichen.'); return; }
    if (pw !== pw2)    { setErr('Passwörter stimmen nicht überein.'); return; }
    localStorage.setItem(PW_KEY, pw);
    setPw(''); setPw2(''); setErr('');
    onSave('Passwort geändert');
  };

  const resetAll = () => {
    if (!confirm('Wirklich alle Änderungen zurücksetzen? Die Seite wird danach neu geladen.')) return;
    ['NEWS','EVENTS','GROUPS','PEOPLE','PHOTOS','PHOTO_GROUPS','GARDE','MUSIKZUG','VORSITZ','SPONSORS_TIERS','SPONSORS','INTERNAL','SITE_CONFIG']
      .forEach(k => localStorage.removeItem(PFX + k));
    onSave('Zurückgesetzt — lädt neu…');
    setTimeout(() => window.location.reload(), 1200);
  };

  return (
    <div>
      <div className="adm-chips">
        {[['galerie','📸 Galerie'],['tickets','🎫 Tickets'],['zugang','🔑 Zugang'],['daten','♻️ Daten']].map(([id, label]) => (
          <Chip key={id} active={section === id} onClick={() => setSection(id)}>{label}</Chip>
        ))}
      </div>

      {section === 'galerie' && <AdmGallerySettings onSave={onSave} />}

      {section === 'tickets' && <AdmTicketSettings onSave={onSave} />}

      {section === 'zugang' && (
      <div className="adm-card">
        <div className="adm-card-title">Admin-Passwort ändern</div>
        <p className="adm-card-desc">Gilt für die Anmeldung an diesem Panel (lokal im Browser gespeichert).</p>
        <form onSubmit={changePass}>
          <div className="adm-grid-2">
            <Fld label="Neues Passwort"><Inp type="password" value={pw} onChange={e => { setPw(e.target.value); setErr(''); }} /></Fld>
            <Fld label="Bestätigen"><Inp type="password" value={pw2} onChange={e => { setPw2(e.target.value); setErr(''); }} /></Fld>
          </div>
          {err && <p className="adm-err">{err}</p>}
          <Btn type="submit">Passwort speichern</Btn>
        </form>
      </div>
      )}

      {section === 'daten' && (
      <div className="adm-card accent-red">
        <div className="adm-card-title">Alle Änderungen zurücksetzen</div>
        <p className="adm-card-desc">
          Setzt sämtliche im Admin gespeicherten Anpassungen auf den originalen
          Datenstand der Website zurück — inklusive Galerie, Galerie-Gruppen und
          Galerie-Einstellungen.
        </p>
        <Btn v="danger" onClick={resetAll}>Auf Standardwerte zurücksetzen</Btn>
      </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// HAUPT-ADMIN-SEITE
// ═══════════════════════════════════════════════════════════════════════════════
const ADM_TABS = [
  { id: 'events',   icon: '🗓️', label: 'Events',      title: 'Veranstaltungen', desc: 'Termine des Vereinskalenders anlegen, ändern und löschen.',                simple: true },
  { id: 'news',     icon: '📰', label: 'Neuigkeiten', title: 'Neuigkeiten',     desc: 'Beiträge für den Newsfeed der Startseite.',                                simple: true },
  { id: 'galerie',  icon: '📸', label: 'Galerie',     title: 'Galerie',         desc: 'Fotos vergangener Jahre — nach Saison, Gruppe und Anlass sortiert.',        simple: true },
  { id: 'info',     icon: 'ℹ️', label: 'Vereinsinfo', title: 'Vereinsinfo',     desc: 'Kennzahlen, Kontaktdaten und die Laufschrift im Seitenkopf.',              simple: true },
  { id: 'people',   icon: '👥', label: 'Personen',    title: 'Personen',        desc: 'Präsidium, Trainer:innen und Funktionär:innen der Saison.' },
  { id: 'gruppen',  icon: '🏆', label: 'Gruppen',     title: 'Gruppen',         desc: 'Detailseiten von Garde, Musikzug und Präsidium.' },
  { id: 'sponsors', icon: '💼', label: 'Sponsoren',   title: 'Sponsoren',       desc: 'Partner und Förderer in drei Stufen.' },
  { id: 'internal', icon: '🔒', label: 'Intern',      title: 'Mitglieder-Inhalte', desc: 'Dokumente und Links im internen Bereich — je Rolle.' },
  { id: 'settings', icon: '⚙️', label: 'Einstellungen', title: 'Einstellungen', desc: 'Galerie, Ticket-Reservierung, Zugang und Wiederherstellung des Original-Datenstands.', simple: true },
];

function AdminPage({ navigate }) {
  const [authed, setAuthed] = useAdmSt(() => sessionStorage.getItem(SESS_KEY) === '1');
  const [mode,   setMode]   = useAdmSt('simple');
  const [tab,    setTab]    = useAdmSt('events');
  const [toast,  setToast]  = useAdmSt(null);

  if (!authed) return <AdminLogin onAuth={() => setAuthed(true)} />;

  const logout = () => { sessionStorage.removeItem(SESS_KEY); setAuthed(false); };
  const tabs = mode === 'simple' ? ADM_TABS.filter(t => t.simple) : ADM_TABS;
  const active = tabs.find(t => t.id === tab) || tabs[0];

  const switchMode = id => {
    setMode(id);
    const next = id === 'simple' ? ADM_TABS.filter(t => t.simple) : ADM_TABS;
    if (!next.some(t => t.id === tab)) setTab(next[0].id);
  };

  return (
    <div className="adm">
      <header className="adm-bar">
        <div className="adm-bar-inner">
          <a className="adm-brand" href="#home" onClick={e => { e.preventDefault(); navigate('home'); }}>
            <img src="assets/logo.png" alt="Nazumido Wappen" />
            <b>Nazumido</b>
            <span>Verwaltung</span>
          </a>
          <div className="adm-bar-spacer" />
          <div className="adm-modes">
            {[['simple','Schnellzugriff'],['advanced','Vollzugriff']].map(([id, label]) => (
              <button key={id} className={'adm-mode' + (mode === id ? ' on' : '')} onClick={() => switchMode(id)}>
                {label}
              </button>
            ))}
          </div>
          <a className="adm-barlink hide-sm" href="#home" onClick={e => { e.preventDefault(); navigate('home'); }}>
            Website
          </a>
          <button className="adm-barlink" onClick={logout}>Abmelden</button>
        </div>
        <div className="adm-stripe">
          <span className="r"></span><span className="w"></span><span className="g"></span>
        </div>
      </header>

      <div className="adm-wrap">
        <div className="adm-head">
          <span className="eyebrow no-rule">
            {mode === 'simple' ? 'Schnellzugriff · Session 2026' : 'Vollzugriff · Session 2026'}
          </span>
          <h1>{active.title}</h1>
          <p className="lead">{active.desc}</p>
        </div>

        <div className="adm-layout">
          <nav className="adm-nav">
            {tabs.map(t => (
              <button key={t.id} className={'adm-navitem' + (tab === t.id ? ' on' : '')} onClick={() => setTab(t.id)}>
                <span aria-hidden>{t.icon}</span>{t.label}
              </button>
            ))}
          </nav>

          <div style={{ minWidth: 0 }}>
            {active.id === 'events'   && <AdmEvents   onSave={setToast} />}
            {active.id === 'news'     && <AdmNews     onSave={setToast} full={mode === 'advanced'} />}
            {active.id === 'galerie'  && <AdmGalerie  onSave={setToast} />}
            {active.id === 'info'     && <AdmInfo     onSave={setToast} />}
            {active.id === 'people'   && <AdmPeople   onSave={setToast} />}
            {active.id === 'gruppen'  && <AdmGruppen  onSave={setToast} />}
            {active.id === 'sponsors' && <AdmSponsors onSave={setToast} />}
            {active.id === 'internal' && <AdmInternal onSave={setToast} />}
            {active.id === 'settings' && <AdmSettings onSave={setToast} />}
          </div>
        </div>
      </div>

      {toast && <Toast msg={toast} onDone={() => setToast(null)} />}
    </div>
  );
}

class AdminErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { err: null };
  }
  static getDerivedStateFromError(err) {
    return { err };
  }
  render() {
    if (this.state.err) {
      return (
        <div style={{padding:40,fontFamily:'var(--sans,sans-serif)',maxWidth:700,margin:'80px auto'}}>
          <h2 style={{color:'#c0392b',marginBottom:12}}>Admin-Panel Fehler</h2>
          <p style={{marginBottom:16}}>Das Admin-Panel konnte nicht geladen werden. Bitte Seite neu laden (<strong>Strg+Shift+R</strong>).</p>
          <pre style={{background:'#f8f0f0',border:'1px solid #f5c6cb',borderRadius:8,padding:16,fontSize:13,overflowX:'auto',whiteSpace:'pre-wrap',wordBreak:'break-word'}}>
            {this.state.err && (this.state.err.stack || this.state.err.message || String(this.state.err))}
          </pre>
          <button onClick={() => this.setState({ err: null })}
            style={{marginTop:16,padding:'8px 20px',background:'#c0392b',color:'white',border:'none',borderRadius:6,cursor:'pointer',fontFamily:'var(--sans,sans-serif)'}}>
            Neu versuchen
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

Object.assign(window, { AdminPage, AdminErrorBoundary });
