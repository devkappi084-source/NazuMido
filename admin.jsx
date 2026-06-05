// Nazumido Admin Panel
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
    return r ? JSON.parse(r) : JSON.parse(JSON.stringify(window[key]));
  } catch(e) { return JSON.parse(JSON.stringify(window[key])); }
}

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 5); }

// ─── Mini Design-System ───────────────────────────────────────────────────────
const S = {
  lbl: { fontSize: 11, fontFamily: 'var(--mono)', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', display: 'block', marginBottom: 5 },
  inp: { width: '100%', padding: '8px 10px', border: '1px solid var(--line)', borderRadius: 6, fontFamily: 'var(--sans)', fontSize: 14, outline: 'none', boxSizing: 'border-box', color: 'var(--ink)', background: 'white' },
  ta:  { width: '100%', padding: '8px 10px', border: '1px solid var(--line)', borderRadius: 6, fontFamily: 'var(--sans)', fontSize: 14, resize: 'vertical', minHeight: 72, boxSizing: 'border-box', color: 'var(--ink)', background: 'white' },
  card:{ background: 'white', border: '1px solid var(--line)', borderRadius: 10, padding: '18px 20px', marginBottom: 10 },
  row: { display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' },
};

function AB({ children, onClick, v = 'primary', style = {}, type = 'button' }) {
  const vs = {
    primary:   { background: 'var(--red)',   color: 'white',          border: 'none' },
    secondary: { background: 'transparent',  color: 'var(--ink)',     border: '1px solid var(--line)' },
    success:   { background: 'var(--green)', color: 'white',          border: 'none' },
    danger:    { background: 'transparent',  color: '#c0392b',        border: '1px solid rgba(192,57,43,0.45)' },
    dark:      { background: 'var(--ink)',   color: 'var(--cream)',   border: 'none' },
  };
  return (
    <button type={type} onClick={onClick}
      style={{ padding: '7px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 13,
               fontFamily: 'var(--sans)', fontWeight: 500, ...vs[v], ...style }}>
      {children}
    </button>
  );
}

function Fld({ label, children, half }) {
  return (
    <div style={{ marginBottom: 12, gridColumn: half ? 'span 1' : undefined }}>
      <label style={S.lbl}>{label}</label>
      {children}
    </div>
  );
}

function Toast({ msg, onDone }) {
  useAdmFx(() => { const t = setTimeout(onDone, 2400); return () => clearTimeout(t); }, []);
  return (
    <div style={{
      position: 'fixed', bottom: 28, right: 28, zIndex: 9999,
      background: 'var(--green)', color: 'white', padding: '12px 22px',
      borderRadius: 8, fontFamily: 'var(--sans)', fontSize: 14, fontWeight: 500,
      boxShadow: '0 4px 24px rgba(0,0,0,0.25)', pointerEvents: 'none',
    }}>✓ {msg}</div>
  );
}

function Chip({ active, onClick, children }) {
  return (
    <button onClick={onClick} style={{
      padding: '6px 16px', borderRadius: 20, cursor: 'pointer', fontSize: 13,
      fontFamily: 'var(--sans)', fontWeight: active ? 600 : 400,
      border: active ? '2px solid var(--red)' : '2px solid var(--line)',
      background: active ? 'rgba(200,32,44,0.07)' : 'white',
      color: active ? 'var(--red)' : 'var(--ink)',
    }}>{children}</button>
  );
}

// Wiederverwendbarer Listen-Editor (für Highlights, Schedule, Repertoire etc.)
function RowListEditor({ items, onChange, fields, addLabel }) {
  const add = () => onChange([...items, Object.fromEntries(fields.map(f => [f.key, '']))]);
  const del = i => onChange(items.filter((_, j) => j !== i));
  const upd = (i, k, v) => onChange(items.map((row, j) => j === i ? { ...row, [k]: v } : row));
  return (
    <div>
      {items.map((row, i) => (
        <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 6, alignItems: 'center' }}>
          {fields.map(f => (
            f.type === 'select'
              ? <select key={f.key} value={row[f.key] || ''} onChange={e => upd(i, f.key, e.target.value)}
                  style={{ ...S.inp, flex: f.flex || 1 }}>
                  {f.options.map(o => <option key={o}>{o}</option>)}
                </select>
              : <input key={f.key} value={row[f.key] || ''} onChange={e => upd(i, f.key, e.target.value)}
                  style={{ ...S.inp, flex: f.flex || 1 }} placeholder={f.placeholder || f.key} />
          ))}
          <button onClick={() => del(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: 18, padding: '0 4px', flexShrink: 0 }}>✕</button>
        </div>
      ))}
      <AB v="secondary" onClick={add} style={{ fontSize: 12, marginTop: 4 }}>+ {addLabel}</AB>
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
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--ink)' }}>
      <div style={{ background: 'var(--paper)', borderRadius: 12, padding: '40px 44px', width: 340, boxShadow: '0 8px 48px rgba(0,0,0,0.5)' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <img src="assets/logo.png" alt="" style={{ width: 52, margin: '0 auto 14px', display: 'block' }} />
          <h2 style={{ fontFamily: 'var(--serif)', margin: 0, fontSize: 28, fontWeight: 400 }}>Verwaltung</h2>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 6 }}>Admin · Nazumido intern</p>
        </div>
        <form onSubmit={submit}>
          <Fld label="Admin-Passwort">
            <input type="password" value={pw} autoFocus onChange={e => { setPw(e.target.value); setErr(''); }} style={S.inp} placeholder="••••••••" />
          </Fld>
          {err && <p style={{ color: 'var(--red)', fontSize: 13, margin: '-4px 0 12px 0' }}>{err}</p>}
          <AB v="dark" type="submit" style={{ width: '100%', textAlign: 'center' }}>Anmelden →</AB>
        </form>
        <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 16, textAlign: 'center' }}>
          Standard: <code style={{ background: 'var(--cream-2)', padding: '1px 5px', borderRadius: 3 }}>{DEFAULT_PW}</code>
        </p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCHNELLZUGRIFF — Einfacher Modus
// ═══════════════════════════════════════════════════════════════════════════════

function QuickEvents({ onSave }) {
  const [items, setItems] = useAdmSt(() => loadData('EVENTS'));
  const [open, setOpen] = useAdmSt(null);
  const [form, setForm] = useAdmSt({});

  const edit = ev => { setOpen(ev.id); setForm({ ...ev }); };
  const save = id => {
    const next = items.map(e => e.id === id ? { ...form } : e);
    setItems(next); saveData('EVENTS', next); setOpen(null);
    onSave('Event gespeichert');
  };
  const del = id => {
    if (!confirm('Event löschen?')) return;
    const next = items.filter(e => e.id !== id);
    setItems(next); saveData('EVENTS', next); onSave('Event gelöscht');
  };
  const add = () => {
    const ev = { id: uid(), d: '01', m: 'Jan', day: 'Montag', title: 'Neues Event', kind: '', desc: '', time: '19:00 Uhr', where: '' };
    const next = [...items, ev];
    setItems(next); setOpen(ev.id); setForm({ ...ev });
  };

  return (
    <div>
      {items.map(ev => (
        <div key={ev.id} style={S.card}>
          {open === ev.id ? (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <Fld label="Titel"><input value={form.title} onChange={e => setForm({...form, title: e.target.value})} style={S.inp} /></Fld>
                <Fld label="Art"><input value={form.kind} onChange={e => setForm({...form, kind: e.target.value})} style={S.inp} placeholder="Gala · Eintritt frei…" /></Fld>
                <Fld label="Tag"><input value={form.d} onChange={e => setForm({...form, d: e.target.value})} style={S.inp} /></Fld>
                <Fld label="Monat"><input value={form.m} onChange={e => setForm({...form, m: e.target.value})} style={S.inp} placeholder="Feb" /></Fld>
                <Fld label="Wochentag"><input value={form.day} onChange={e => setForm({...form, day: e.target.value})} style={S.inp} /></Fld>
                <Fld label="Uhrzeit"><input value={form.time} onChange={e => setForm({...form, time: e.target.value})} style={S.inp} /></Fld>
                <Fld label="Ort"><input value={form.where} onChange={e => setForm({...form, where: e.target.value})} style={S.inp} /></Fld>
              </div>
              <Fld label="Beschreibung">
                <textarea value={form.desc} onChange={e => setForm({...form, desc: e.target.value})} style={S.ta} />
              </Fld>
              <div style={S.row}>
                <AB onClick={() => save(ev.id)}>Speichern</AB>
                <AB v="secondary" onClick={() => setOpen(null)}>Abbrechen</AB>
                <AB v="danger" onClick={() => del(ev.id)} style={{ marginLeft: 'auto' }}>Löschen</AB>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 14, alignItems: 'center', cursor: 'pointer' }} onClick={() => edit(ev)}>
              <div style={{ textAlign: 'center', minWidth: 44, background: 'var(--cream)', borderRadius: 8, padding: '6px 10px', flexShrink: 0 }}>
                <div style={{ fontFamily: 'var(--serif)', fontSize: 22, lineHeight: 1 }}>{ev.d}</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase', color: 'var(--muted)' }}>{ev.m}</div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>{ev.title}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>{ev.time} · {ev.where}</div>
              </div>
              <span style={{ color: 'var(--muted)', fontSize: 12 }}>bearbeiten →</span>
            </div>
          )}
        </div>
      ))}
      <AB v="secondary" onClick={add} style={{ width: '100%', textAlign: 'center', marginTop: 4 }}>+ Event hinzufügen</AB>
    </div>
  );
}

function QuickNews({ onSave }) {
  const [items, setItems] = useAdmSt(() => loadData('NEWS'));
  const [open, setOpen] = useAdmSt(null);
  const [form, setForm] = useAdmSt({});

  const edit = n => { setOpen(n.id); setForm({ ...n }); };
  const save = id => {
    const next = items.map(n => n.id === id ? { ...form } : n);
    setItems(next); saveData('NEWS', next); setOpen(null);
    onSave('Neuigkeit gespeichert');
  };
  const del = id => {
    if (!confirm('Neuigkeit löschen?')) return;
    const next = items.filter(n => n.id !== id);
    setItems(next); saveData('NEWS', next); onSave('Neuigkeit gelöscht');
  };
  const add = () => {
    const n = { id: uid(), tag: 'Ankündigung', tagColor: 'green', date: '', readTime: '2 min', title: 'Neue Neuigkeit', excerpt: '', body: [''] };
    const next = [n, ...items];
    setItems(next); setOpen(n.id); setForm({ ...n });
  };

  return (
    <div>
      {items.map(n => (
        <div key={n.id} style={S.card}>
          {open === n.id ? (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 10 }}>
                <Fld label="Titel"><input value={form.title} onChange={e => setForm({...form, title: e.target.value})} style={S.inp} /></Fld>
                <Fld label="Datum"><input value={form.date} onChange={e => setForm({...form, date: e.target.value})} style={S.inp} placeholder="18. Februar 2026" /></Fld>
                <Fld label="Kategorie"><input value={form.tag} onChange={e => setForm({...form, tag: e.target.value})} style={S.inp} /></Fld>
                <Fld label="Farbe">
                  <select value={form.tagColor} onChange={e => setForm({...form, tagColor: e.target.value})} style={S.inp}>
                    <option value="red">Rot</option><option value="green">Grün</option><option value="gold">Gold</option>
                  </select>
                </Fld>
              </div>
              <Fld label="Kurztext">
                <textarea value={form.excerpt} onChange={e => setForm({...form, excerpt: e.target.value})} style={S.ta} />
              </Fld>
              <div style={S.row}>
                <AB onClick={() => save(n.id)}>Speichern</AB>
                <AB v="secondary" onClick={() => setOpen(null)}>Abbrechen</AB>
                <AB v="danger" onClick={() => del(n.id)} style={{ marginLeft: 'auto' }}>Löschen</AB>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', cursor: 'pointer' }} onClick={() => edit(n)}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, marginBottom: 2 }}>{n.title}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>{n.date} · {n.tag}</div>
              </div>
              <span style={{ color: 'var(--muted)', fontSize: 12 }}>bearbeiten →</span>
            </div>
          )}
        </div>
      ))}
      <AB v="secondary" onClick={add} style={{ width: '100%', textAlign: 'center', marginTop: 4 }}>+ Neuigkeit hinzufügen</AB>
    </div>
  );
}

function QuickPhotos({ onSave }) {
  const [items, setItems] = useAdmSt(() => loadData('PHOTOS'));
  const [open, setOpen] = useAdmSt(null);
  const [form, setForm] = useAdmSt({});

  const edit = p => { setOpen(p.id); setForm({ ...p }); };
  const save = id => {
    const next = items.map(p => p.id === id ? { ...form } : p);
    setItems(next); saveData('PHOTOS', next); setOpen(null);
    onSave('Foto gespeichert');
  };
  const del = id => {
    if (!confirm('Foto entfernen?')) return;
    const next = items.filter(p => p.id !== id);
    setItems(next); saveData('PHOTOS', next); onSave('Foto gelöscht');
  };
  const add = () => {
    const p = { id: uid(), src: null, title: 'Neues Foto', date: '', group: 'Allgemein', size: '1024×768', hdSize: '4096×3072' };
    const next = [...items, p];
    setItems(next); setOpen(p.id); setForm({ ...p });
  };

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
        {items.map(p => (
          <div key={p.id} style={{ ...S.card, padding: '14px 16px' }}>
            {open === p.id ? (
              <div>
                <Fld label="Titel"><input value={form.title} onChange={e => setForm({...form, title: e.target.value})} style={S.inp} /></Fld>
                <Fld label="Datum"><input value={form.date} onChange={e => setForm({...form, date: e.target.value})} style={S.inp} placeholder="Feb 2026" /></Fld>
                <Fld label="Gruppe">
                  <select value={form.group} onChange={e => setForm({...form, group: e.target.value})} style={S.inp}>
                    {['Garde','Musikzug','Vorsitz','Allgemein'].map(g => <option key={g}>{g}</option>)}
                  </select>
                </Fld>
                <Fld label="Bilddatei (Pfad)">
                  <input value={form.src || ''} onChange={e => setForm({...form, src: e.target.value || null})} style={S.inp} placeholder="assets/foto.jpg" />
                </Fld>
                <div style={{ ...S.row, marginTop: 4 }}>
                  <AB onClick={() => save(p.id)} style={{ flex: 1, textAlign: 'center' }}>OK</AB>
                  <AB v="secondary" onClick={() => setOpen(null)}>✕</AB>
                  <AB v="danger" onClick={() => del(p.id)}>🗑</AB>
                </div>
              </div>
            ) : (
              <div>
                {p.src
                  ? <img src={p.src} alt="" style={{ width: '100%', height: 90, objectFit: 'cover', borderRadius: 6, marginBottom: 8 }} />
                  : <div style={{ width: '100%', height: 90, background: 'var(--cream)', borderRadius: 6, marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: 'var(--muted)' }}>Kein Bild</div>}
                <div style={{ fontWeight: 600, fontSize: 13 }}>{p.title}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)', margin: '2px 0 8px' }}>{p.date} · {p.group}</div>
                <AB v="secondary" onClick={() => edit(p)} style={{ width: '100%', textAlign: 'center', fontSize: 12 }}>Bearbeiten</AB>
              </div>
            )}
          </div>
        ))}
      </div>
      <AB v="secondary" onClick={add} style={{ marginTop: 10, width: '100%', textAlign: 'center' }}>+ Foto hinzufügen</AB>
    </div>
  );
}

function QuickInfo({ onSave }) {
  const [cfg, setCfg] = useAdmSt(() => loadData('SITE_CONFIG'));
  const f = k => ({ value: cfg[k] || '', onChange: e => setCfg({...cfg, [k]: e.target.value}), style: S.inp });
  const save = () => { saveData('SITE_CONFIG', cfg); onSave('Vereinsinfo gespeichert'); };
  return (
    <div>
      <div style={S.card}>
        <div style={{ fontWeight: 600, marginBottom: 12 }}>Hero & Statistiken</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Fld label="Mitgliederzahl"><input {...f('memberCount')} /></Fld>
          <Fld label="Saisonzeitraum"><input {...f('season')} /></Fld>
          <Fld label="Nächstes Event (Hero)"><input {...f('heroNextEvent')} /></Fld>
          <Fld label="Präsident Name"><input {...f('presidentName')} /></Fld>
          <Fld label="Jahre Tradition"><input {...f('welcomeYears')} /></Fld>
          <Fld label="Events pro Jahr"><input {...f('welcomeEvents')} /></Fld>
        </div>
      </div>
      <div style={S.card}>
        <div style={{ fontWeight: 600, marginBottom: 12 }}>Kontaktdaten</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Fld label="Adresse (Straße)"><input {...f('address')} /></Fld>
          <Fld label="Ort"><input {...f('city')} /></Fld>
          <Fld label="Telefon"><input {...f('phone')} /></Fld>
          <Fld label="E-Mail"><input {...f('email')} /></Fld>
        </div>
      </div>
      <div style={S.card}>
        <div style={{ fontWeight: 600, marginBottom: 8 }}>Laufschrift (Topbar)</div>
        <p style={{ fontSize: 12, color: 'var(--muted)', margin: '0 0 10px' }}>Ein Eintrag pro Zeile</p>
        <textarea
          value={(cfg.topbarStrip || []).join('\n')}
          onChange={e => setCfg({...cfg, topbarStrip: e.target.value.split('\n')})}
          style={{ ...S.ta, minHeight: 100 }}
        />
      </div>
      <AB onClick={save}>Vereinsinfo speichern</AB>
    </div>
  );
}

function SimpleMode({ onSave }) {
  const [tab, setTab] = useAdmSt('events');
  const tabs = [
    { id: 'events', label: '🗓️ Events' },
    { id: 'news',   label: '📰 Neuigkeiten' },
    { id: 'photos', label: '📸 Fotos' },
    { id: 'info',   label: 'ℹ️ Vereinsinfo' },
  ];
  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {tabs.map(t => <Chip key={t.id} active={tab === t.id} onClick={() => setTab(t.id)}>{t.label}</Chip>)}
      </div>
      {tab === 'events' && <QuickEvents onSave={onSave} />}
      {tab === 'news'   && <QuickNews   onSave={onSave} />}
      {tab === 'photos' && <QuickPhotos onSave={onSave} />}
      {tab === 'info'   && <QuickInfo   onSave={onSave} />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// VOLLZUGRIFF — Erweiterter Modus
// ═══════════════════════════════════════════════════════════════════════════════

// Erweiterte News-Editor (+ Artikel-Absätze)
function AdvNews({ onSave }) {
  const [items, setItems] = useAdmSt(() => loadData('NEWS'));
  const [open, setOpen] = useAdmSt(null);
  const [form, setForm] = useAdmSt({});

  const edit = n => { setOpen(n.id); setForm({ ...n, body: [...(n.body || [])] }); };
  const save = id => {
    const next = items.map(n => n.id === id ? { ...form } : n);
    setItems(next); saveData('NEWS', next); setOpen(null); onSave('Neuigkeit gespeichert');
  };
  const del = id => {
    if (!confirm('Löschen?')) return;
    const next = items.filter(n => n.id !== id);
    setItems(next); saveData('NEWS', next); onSave('Gelöscht');
  };
  const add = () => {
    const n = { id: uid(), tag: 'Ankündigung', tagColor: 'green', date: '', readTime: '2 min', title: 'Neue Neuigkeit', excerpt: '', body: [''] };
    setItems([n, ...items]); setOpen(n.id); setForm({ ...n });
  };
  const addPara = () => setForm({...form, body: [...(form.body||[]), '']});
  const delPara = i => setForm({...form, body: form.body.filter((_,j)=>j!==i)});
  const updPara = (i,v) => { const b=[...form.body]; b[i]=v; setForm({...form,body:b}); };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <AB onClick={add}>+ Neuigkeit hinzufügen</AB>
      </div>
      {items.map(n => (
        <div key={n.id} style={{ ...S.card, borderLeft: open===n.id ? '3px solid var(--red)' : '3px solid transparent' }}>
          {open === n.id ? (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 10 }}>
                <Fld label="Titel"><input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} style={S.inp} /></Fld>
                <Fld label="Datum"><input value={form.date} onChange={e=>setForm({...form,date:e.target.value})} style={S.inp} /></Fld>
                <Fld label="Lesezeit"><input value={form.readTime} onChange={e=>setForm({...form,readTime:e.target.value})} style={S.inp} /></Fld>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: 10 }}>
                <Fld label="Kategorie"><input value={form.tag} onChange={e=>setForm({...form,tag:e.target.value})} style={S.inp} /></Fld>
                <Fld label="Farbe">
                  <select value={form.tagColor} onChange={e=>setForm({...form,tagColor:e.target.value})} style={S.inp}>
                    <option value="red">Rot</option><option value="green">Grün</option><option value="gold">Gold</option>
                  </select>
                </Fld>
                <Fld label="Bild-Pfad (optional)">
                  <input value={form.image||''} onChange={e=>setForm({...form,image:e.target.value||undefined})} style={S.inp} placeholder="assets/foto.jpg" />
                </Fld>
              </div>
              <Fld label="Kurztext (Vorschau)">
                <textarea value={form.excerpt} onChange={e=>setForm({...form,excerpt:e.target.value})} style={S.ta} />
              </Fld>
              <div style={{ marginBottom: 12 }}>
                <label style={S.lbl}>Artikel-Absätze</label>
                {(form.body||[]).map((p,i) => (
                  <div key={i} style={{ display:'flex', gap:6, marginBottom:6 }}>
                    <textarea value={p} onChange={e=>updPara(i,e.target.value)} style={{...S.ta, minHeight:56, flex:1}} />
                    <button onClick={()=>delPara(i)} style={{background:'none',border:'none',cursor:'pointer',color:'var(--muted)',fontSize:16,padding:'8px 4px',alignSelf:'flex-start'}}>✕</button>
                  </div>
                ))}
                <AB v="secondary" onClick={addPara} style={{ fontSize: 12 }}>+ Absatz hinzufügen</AB>
              </div>
              <div style={S.row}>
                <AB onClick={() => save(n.id)}>Speichern</AB>
                <AB v="secondary" onClick={() => setOpen(null)}>Abbrechen</AB>
                <AB v="danger" onClick={() => del(n.id)} style={{ marginLeft: 'auto' }}>Löschen</AB>
              </div>
            </div>
          ) : (
            <div style={{ display:'flex', gap:12, alignItems:'flex-start', cursor:'pointer' }} onClick={()=>edit(n)}>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:11, fontFamily:'var(--mono)', textTransform:'uppercase', color:'var(--muted)' }}>{n.date} · {n.tag}</div>
                <div style={{ fontWeight:600, fontSize:15, marginTop:2 }}>{n.title}</div>
                <div style={{ fontSize:13, color:'var(--ink-2)', marginTop:3, overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>{n.excerpt}</div>
              </div>
              <span style={{ color:'var(--muted)', fontSize:12, whiteSpace:'nowrap' }}>bearbeiten →</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// Personen / Vorstand
function AdvPeople({ onSave }) {
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
    setItems(next); saveData('PEOPLE', next); onSave('Person gelöscht');
  };
  const add = () => {
    const p = { id: uid(), initial: '?', name: 'Neue Person', role: '', group: 'Vorsitz', dotColor: 'red', bio: '', contact: '' };
    setItems([...items, p]); setOpen(p.id); setForm({...p});
  };

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:12 }}>
        <AB onClick={add}>+ Person hinzufügen</AB>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:12 }}>
        {items.map(p => (
          <div key={p.id} style={{ ...S.card, borderLeft: open===p.id ? '3px solid var(--red)' : '3px solid transparent' }}>
            {open === p.id ? (
              <div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                  <Fld label="Name"><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} style={S.inp} /></Fld>
                  <Fld label="Kürzel"><input value={form.initial} onChange={e=>setForm({...form,initial:e.target.value})} style={S.inp} maxLength={2} /></Fld>
                  <Fld label="Rolle / Funktion"><input value={form.role} onChange={e=>setForm({...form,role:e.target.value})} style={S.inp} /></Fld>
                  <Fld label="Gruppe">
                    <select value={form.group} onChange={e=>setForm({...form,group:e.target.value})} style={S.inp}>
                      <option>Vorsitz</option><option>Garde</option><option>Musikzug</option>
                    </select>
                  </Fld>
                  <Fld label="Farbe">
                    <select value={form.dotColor} onChange={e=>setForm({...form,dotColor:e.target.value})} style={S.inp}>
                      <option value="red">Rot</option><option value="green">Grün</option><option value="gold">Gold</option>
                    </select>
                  </Fld>
                  <Fld label="Kontakt / E-Mail"><input value={form.contact} onChange={e=>setForm({...form,contact:e.target.value})} style={S.inp} /></Fld>
                </div>
                <Fld label="Biografie">
                  <textarea value={form.bio} onChange={e=>setForm({...form,bio:e.target.value})} style={S.ta} />
                </Fld>
                <div style={S.row}>
                  <AB onClick={()=>save(p.id)}>Speichern</AB>
                  <AB v="secondary" onClick={()=>setOpen(null)}>Abbrechen</AB>
                  <AB v="danger" onClick={()=>del(p.id)} style={{marginLeft:'auto'}}>Löschen</AB>
                </div>
              </div>
            ) : (
              <div onClick={()=>edit(p)} style={{cursor:'pointer'}}>
                <div style={{display:'flex',gap:10,alignItems:'center',marginBottom:6}}>
                  <div style={{width:36,height:36,borderRadius:18,flexShrink:0,
                    background:p.dotColor==='green'?'var(--green)':p.dotColor==='gold'?'var(--gold)':'var(--red)',
                    color:'white',display:'flex',alignItems:'center',justifyContent:'center',
                    fontFamily:'var(--serif)',fontSize:16}}>
                    {p.initial}
                  </div>
                  <div>
                    <div style={{fontWeight:600,fontSize:14}}>{p.name}</div>
                    <div style={{fontSize:12,color:'var(--muted)'}}>{p.role} · {p.group}</div>
                  </div>
                </div>
                <p style={{fontSize:13,color:'var(--ink-2)',margin:0}}>{p.bio}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Gruppen-Details (Garde / Musikzug / Vorsitz)
function AdvGruppen({ onSave }) {
  const [tab, setTab] = useAdmSt('garde');
  const [garde,    setGarde]    = useAdmSt(() => loadData('GARDE'));
  const [musikzug, setMusikzug] = useAdmSt(() => loadData('MUSIKZUG'));
  const [vorsitz,  setVorsitz]  = useAdmSt(() => loadData('VORSITZ'));

  return (
    <div>
      <div style={{ display:'flex', gap:8, marginBottom:20 }}>
        {[['garde','💃 Garde'],['musikzug','🎺 Musikzug'],['vorsitz','🏛 Vorsitz']].map(([id,label]) => (
          <Chip key={id} active={tab===id} onClick={()=>setTab(id)}>{label}</Chip>
        ))}
      </div>

      {tab === 'garde' && (
        <div>
          <div style={S.card}>
            <div style={{fontWeight:600,marginBottom:12}}>Allgemein</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
              <Fld label="Mitglieder"><input type="number" value={garde.members} onChange={e=>setGarde({...garde,members:+e.target.value})} style={S.inp} /></Fld>
              <Fld label="Trainerin"><input value={garde.trainer} onChange={e=>setGarde({...garde,trainer:e.target.value})} style={S.inp} /></Fld>
              <Fld label="Training"><input value={garde.practice} onChange={e=>setGarde({...garde,practice:e.target.value})} style={S.inp} /></Fld>
            </div>
            <Fld label="Tagline"><input value={garde.tagline} onChange={e=>setGarde({...garde,tagline:e.target.value})} style={S.inp} /></Fld>
          </div>
          <div style={S.card}>
            <div style={{fontWeight:600,marginBottom:10}}>Untergruppen</div>
            <RowListEditor items={garde.groups} onChange={v=>setGarde({...garde,groups:v})}
              fields={[{key:'name',placeholder:'Name',flex:2},{key:'age',placeholder:'Alter'},{key:'count',placeholder:'Anz.'}]}
              addLabel="Untergruppe" />
          </div>
          <div style={S.card}>
            <div style={{fontWeight:600,marginBottom:10}}>Trainingsplan</div>
            <RowListEditor items={garde.schedule} onChange={v=>setGarde({...garde,schedule:v})}
              fields={[{key:'d',placeholder:'Tag'},{key:'t',placeholder:'Uhr'},{key:'what',placeholder:'Inhalt',flex:3}]}
              addLabel="Einheit" />
          </div>
          <div style={S.card}>
            <div style={{fontWeight:600,marginBottom:10}}>Meilensteine</div>
            <RowListEditor items={garde.highlights} onChange={v=>setGarde({...garde,highlights:v})}
              fields={[{key:'year',placeholder:'Jahr'},{key:'text',placeholder:'Text',flex:4}]}
              addLabel="Meilenstein" />
          </div>
          <AB onClick={()=>{saveData('GARDE',garde);onSave('Garde gespeichert');}}>Garde speichern</AB>
        </div>
      )}

      {tab === 'musikzug' && (
        <div>
          <div style={S.card}>
            <div style={{fontWeight:600,marginBottom:12}}>Allgemein</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
              <Fld label="Mitglieder"><input type="number" value={musikzug.members} onChange={e=>setMusikzug({...musikzug,members:+e.target.value})} style={S.inp} /></Fld>
              <Fld label="Kapellmeister"><input value={musikzug.trainer} onChange={e=>setMusikzug({...musikzug,trainer:e.target.value})} style={S.inp} /></Fld>
              <Fld label="Probe"><input value={musikzug.practice} onChange={e=>setMusikzug({...musikzug,practice:e.target.value})} style={S.inp} /></Fld>
            </div>
            <Fld label="Tagline"><input value={musikzug.tagline} onChange={e=>setMusikzug({...musikzug,tagline:e.target.value})} style={S.inp} /></Fld>
          </div>
          <div style={S.card}>
            <div style={{fontWeight:600,marginBottom:10}}>Register</div>
            <RowListEditor items={musikzug.groups} onChange={v=>setMusikzug({...musikzug,groups:v})}
              fields={[{key:'name',placeholder:'Register',flex:2},{key:'count',placeholder:'Anz.'}]}
              addLabel="Register" />
          </div>
          <div style={S.card}>
            <div style={{fontWeight:600,marginBottom:10}}>Repertoire</div>
            {musikzug.repertoire.map((r,i) => (
              <div key={i} style={{display:'flex',gap:6,marginBottom:6}}>
                <input value={r} onChange={e=>{const rep=[...musikzug.repertoire];rep[i]=e.target.value;setMusikzug({...musikzug,repertoire:rep});}} style={{...S.inp,flex:1}} />
                <button onClick={()=>setMusikzug({...musikzug,repertoire:musikzug.repertoire.filter((_,j)=>j!==i)})} style={{background:'none',border:'none',cursor:'pointer',color:'var(--muted)',fontSize:18}}>✕</button>
              </div>
            ))}
            <AB v="secondary" onClick={()=>setMusikzug({...musikzug,repertoire:[...musikzug.repertoire,'']})} style={{fontSize:12}}>+ Stück hinzufügen</AB>
          </div>
          <div style={S.card}>
            <div style={{fontWeight:600,marginBottom:10}}>Meilensteine</div>
            <RowListEditor items={musikzug.highlights} onChange={v=>setMusikzug({...musikzug,highlights:v})}
              fields={[{key:'year',placeholder:'Jahr'},{key:'text',placeholder:'Text',flex:4}]}
              addLabel="Meilenstein" />
          </div>
          <AB onClick={()=>{saveData('MUSIKZUG',musikzug);onSave('Musikzug gespeichert');}}>Musikzug speichern</AB>
        </div>
      )}

      {tab === 'vorsitz' && (
        <div>
          <div style={S.card}>
            <div style={{fontWeight:600,marginBottom:12}}>Allgemein</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
              <Fld label="Mitglieder"><input type="number" value={vorsitz.members} onChange={e=>setVorsitz({...vorsitz,members:+e.target.value})} style={S.inp} /></Fld>
              <Fld label="Sitzung"><input value={vorsitz.practice} onChange={e=>setVorsitz({...vorsitz,practice:e.target.value})} style={S.inp} /></Fld>
            </div>
            <Fld label="Tagline"><input value={vorsitz.tagline} onChange={e=>setVorsitz({...vorsitz,tagline:e.target.value})} style={S.inp} /></Fld>
          </div>
          <div style={S.card}>
            <div style={{fontWeight:600,marginBottom:10}}>Aufgaben</div>
            {vorsitz.responsibilities.map((r,i) => (
              <div key={i} style={{display:'flex',gap:6,marginBottom:6}}>
                <input value={r} onChange={e=>{const v=[...vorsitz.responsibilities];v[i]=e.target.value;setVorsitz({...vorsitz,responsibilities:v});}} style={{...S.inp,flex:1}} />
                <button onClick={()=>setVorsitz({...vorsitz,responsibilities:vorsitz.responsibilities.filter((_,j)=>j!==i)})} style={{background:'none',border:'none',cursor:'pointer',color:'var(--muted)',fontSize:18}}>✕</button>
              </div>
            ))}
            <AB v="secondary" onClick={()=>setVorsitz({...vorsitz,responsibilities:[...vorsitz.responsibilities,'']})} style={{fontSize:12}}>+ Aufgabe</AB>
          </div>
          <div style={S.card}>
            <div style={{fontWeight:600,marginBottom:10}}>Vereinsgeschichte</div>
            <RowListEditor items={vorsitz.history} onChange={v=>setVorsitz({...vorsitz,history:v})}
              fields={[{key:'year',placeholder:'Jahr'},{key:'text',placeholder:'Text',flex:4}]}
              addLabel="Eintrag" />
          </div>
          <AB onClick={()=>{saveData('VORSITZ',vorsitz);onSave('Vorsitz gespeichert');}}>Vorsitz speichern</AB>
        </div>
      )}
    </div>
  );
}

// Sponsoren
function AdvSponsors({ onSave }) {
  const [tiers, setTiers] = useAdmSt(() => loadData('SPONSORS_TIERS'));

  const updSponsor = (ti,si,k,v) => setTiers(tiers.map((t,i)=>i!==ti?t:{...t,sponsors:t.sponsors.map((s,j)=>j!==si?s:{...s,[k]:v})}));
  const delSponsor = (ti,si) => { if(!confirm('Sponsor entfernen?'))return; const next=tiers.map((t,i)=>i!==ti?t:{...t,sponsors:t.sponsors.filter((_,j)=>j!==si)}); setTiers(next); saveData('SPONSORS_TIERS',next); onSave('Sponsor gelöscht'); };
  const addSponsor = ti => setTiers(tiers.map((t,i)=>i!==ti?t:{...t,sponsors:[...t.sponsors,{name:'Neuer Sponsor',since:new Date().getFullYear(),branch:''}]}));
  const save = () => { saveData('SPONSORS_TIERS', tiers); onSave('Sponsoren gespeichert'); };

  const tierBorderColor = { Hauptsponsor:'var(--red)', Premium:'var(--green)', Förderer:'var(--gold)' };
  return (
    <div>
      {tiers.map((tier,ti) => (
        <div key={ti} style={{...S.card, borderLeft:`4px solid ${tierBorderColor[tier.tier]||'var(--line)'}`}}>
          <div style={{fontWeight:700,fontSize:16,marginBottom:4}}>{tier.tier}</div>
          <p style={{fontSize:13,color:'var(--muted)',margin:'0 0 14px'}}>{tier.desc}</p>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill, minmax(260px, 1fr))',gap:8}}>
            {tier.sponsors.map((s,si) => (
              <div key={si} style={{background:'var(--cream)',borderRadius:8,padding:'12px 14px'}}>
                <div style={{display:'flex',gap:8,marginBottom:6}}>
                  <input value={s.name} onChange={e=>updSponsor(ti,si,'name',e.target.value)} style={{...S.inp,fontWeight:600}} />
                  <button onClick={()=>delSponsor(ti,si)} style={{background:'none',border:'none',cursor:'pointer',color:'var(--muted)',fontSize:18,flexShrink:0}}>✕</button>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6}}>
                  <input value={s.branch} onChange={e=>updSponsor(ti,si,'branch',e.target.value)} style={S.inp} placeholder="Branche" />
                  <input type="number" value={s.since} onChange={e=>updSponsor(ti,si,'since',+e.target.value)} style={S.inp} placeholder="Seit" />
                </div>
              </div>
            ))}
          </div>
          <AB v="secondary" onClick={()=>addSponsor(ti)} style={{marginTop:10,fontSize:12}}>+ Sponsor hinzufügen</AB>
        </div>
      ))}
      <AB onClick={save} style={{marginTop:8}}>Alle Sponsoren speichern</AB>
    </div>
  );
}

// Mitglieder-Interner Bereich (Dokumente je Rolle)
function AdvInternal({ onSave }) {
  const [data, setData] = useAdmSt(() => loadData('INTERNAL'));
  const [role, setRole] = useAdmSt('Mitglied');

  const upd = (i,k,v) => setData({...data,[role]:data[role].map((d,j)=>j===i?{...d,[k]:v}:d)});
  const del = i => { if(!confirm('Entfernen?'))return; setData({...data,[role]:data[role].filter((_,j)=>j!==i)}); };
  const add = () => setData({...data,[role]:[...data[role],{kind:'doc',icon:'📄',title:'Neues Dokument',meta:''}]});
  const save = () => { saveData('INTERNAL',data); onSave('Mitglieder-Bereich gespeichert'); };

  return (
    <div>
      <p style={{fontSize:13,color:'var(--muted)',marginBottom:16}}>
        Jede Rolle sieht im Mitglieder-Dashboard nur ihre eigenen Inhalte. Einträge mit <code>kind: "photos"</code> öffnen die Fotogalerie.
      </p>
      <div style={{display:'flex',gap:8,marginBottom:20}}>
        {['Mitglied','Trainerin','Vorstand'].map(r => <Chip key={r} active={role===r} onClick={()=>setRole(r)}>{r}</Chip>)}
      </div>
      {(data[role]||[]).map((doc,i) => (
        <div key={i} style={{...S.card,display:'grid',gridTemplateColumns:'44px 1fr 1fr 80px auto',gap:10,alignItems:'center'}}>
          <input value={doc.icon} onChange={e=>upd(i,'icon',e.target.value)} style={{...S.inp,textAlign:'center',fontSize:18,padding:'6px'}} />
          <input value={doc.title} onChange={e=>upd(i,'title',e.target.value)} style={S.inp} />
          <input value={doc.meta} onChange={e=>upd(i,'meta',e.target.value)} style={S.inp} placeholder="Meta (Typ, Größe…)" />
          <select value={doc.kind} onChange={e=>upd(i,'kind',e.target.value)} style={S.inp}>
            <option value="doc">doc</option><option value="photos">photos</option>
          </select>
          <button onClick={()=>del(i)} style={{background:'none',border:'none',cursor:'pointer',color:'var(--muted)',fontSize:18}}>✕</button>
        </div>
      ))}
      <div style={{...S.row,marginTop:8}}>
        <AB v="secondary" onClick={add}>+ Dokument hinzufügen</AB>
        <AB onClick={save}>Speichern</AB>
      </div>
    </div>
  );
}

// Einstellungen
function AdvSettings({ onSave }) {
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
    ['NEWS','EVENTS','GROUPS','PEOPLE','PHOTOS','GARDE','MUSIKZUG','VORSITZ','SPONSORS_TIERS','SPONSORS','INTERNAL','SITE_CONFIG'].forEach(k => localStorage.removeItem(PFX + k));
    onSave('Zurückgesetzt — lädt neu…');
    setTimeout(() => window.location.reload(), 1200);
  };

  return (
    <div>
      <div style={S.card}>
        <div style={{fontWeight:600,fontSize:15,marginBottom:12}}>Admin-Passwort ändern</div>
        <form onSubmit={changePass}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <Fld label="Neues Passwort"><input type="password" value={pw} onChange={e=>{setPw(e.target.value);setErr('');}} style={S.inp} /></Fld>
            <Fld label="Bestätigen"><input type="password" value={pw2} onChange={e=>{setPw2(e.target.value);setErr('');}} style={S.inp} /></Fld>
          </div>
          {err && <p style={{color:'var(--red)',fontSize:13,margin:'-4px 0 10px'}}>{err}</p>}
          <AB type="submit">Passwort speichern</AB>
        </form>
      </div>
      <div style={{...S.card, borderLeft:'3px solid #e74c3c'}}>
        <div style={{fontWeight:600,fontSize:15,marginBottom:8}}>Alle Änderungen zurücksetzen</div>
        <p style={{fontSize:13,color:'var(--muted)',margin:'0 0 14px'}}>
          Setzt alle im Admin gespeicherten Anpassungen zurück auf den originalen Datenstand der Webseite.
        </p>
        <AB v="danger" onClick={resetAll}>Auf Standardwerte zurücksetzen</AB>
      </div>
    </div>
  );
}

// Vollzugriff-Container mit Sidebar-Navigation
function AdvancedMode({ onSave }) {
  const [tab, setTab] = useAdmSt('events');
  const tabs = [
    { id:'events',   icon:'🗓️', label:'Events'           },
    { id:'news',     icon:'📰', label:'Neuigkeiten'       },
    { id:'photos',   icon:'📸', label:'Fotos'             },
    { id:'people',   icon:'👥', label:'Personen'          },
    { id:'gruppen',  icon:'🏆', label:'Gruppen'           },
    { id:'sponsors', icon:'💼', label:'Sponsoren'         },
    { id:'internal', icon:'🔒', label:'Mitglieder-Inhalt' },
    { id:'settings', icon:'⚙️', label:'Einstellungen'     },
  ];
  return (
    <div style={{display:'flex',gap:28}}>
      {/* Sidebar */}
      <div style={{width:196,flexShrink:0}}>
        <div style={{position:'sticky',top:76}}>
          {tabs.map(t => (
            <button key={t.id} onClick={()=>setTab(t.id)} style={{
              display:'flex',alignItems:'center',gap:9,width:'100%',padding:'10px 14px',
              borderRadius:8,cursor:'pointer',fontSize:13.5,fontFamily:'var(--sans)',
              border:'none',textAlign:'left',marginBottom:2,
              background: tab===t.id ? 'white' : 'transparent',
              color:       tab===t.id ? 'var(--red)' : 'var(--ink-2)',
              fontWeight:  tab===t.id ? 600 : 400,
              boxShadow:   tab===t.id ? '0 1px 5px rgba(0,0,0,0.08)' : 'none',
            }}>
              <span>{t.icon}</span>{t.label}
            </button>
          ))}
        </div>
      </div>
      {/* Inhalt */}
      <div style={{flex:1,minWidth:0}}>
        {tab==='events'   && <QuickEvents onSave={onSave} />}
        {tab==='news'     && <AdvNews     onSave={onSave} />}
        {tab==='photos'   && <QuickPhotos onSave={onSave} />}
        {tab==='people'   && <AdvPeople   onSave={onSave} />}
        {tab==='gruppen'  && <AdvGruppen  onSave={onSave} />}
        {tab==='sponsors' && <AdvSponsors onSave={onSave} />}
        {tab==='internal' && <AdvInternal onSave={onSave} />}
        {tab==='settings' && <AdvSettings onSave={onSave} />}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// HAUPT-ADMIN-SEITE
// ═══════════════════════════════════════════════════════════════════════════════
function AdminPage({ navigate }) {
  const [authed, setAuthed] = useAdmSt(() => sessionStorage.getItem(SESS_KEY) === '1');
  const [mode,   setMode]   = useAdmSt('simple');
  const [toast,  setToast]  = useAdmSt(null);

  if (!authed) return <AdminLogin onAuth={() => setAuthed(true)} />;

  const logout = () => { sessionStorage.removeItem(SESS_KEY); setAuthed(false); };

  return (
    <div style={{minHeight:'100vh', background:'#edeae4', fontFamily:'var(--sans)'}}>

      {/* Header */}
      <div style={{background:'var(--ink)',position:'sticky',top:0,zIndex:100,boxShadow:'0 2px 12px rgba(0,0,0,0.3)'}}>
        <div style={{display:'flex',alignItems:'center',gap:16,padding:'0 32px',height:56}}>
          <a href="#home" onClick={e=>{e.preventDefault();navigate('home');}}
            style={{display:'flex',alignItems:'center',gap:10,color:'var(--cream)',textDecoration:'none'}}>
            <img src="assets/logo.png" style={{width:28,height:28}} alt="" />
            <span style={{fontFamily:'var(--serif)',fontSize:18}}>Nazumido</span>
            <span style={{color:'rgba(247,241,230,0.35)',fontSize:13,marginLeft:2}}>/ Admin</span>
          </a>

          <div style={{flex:1}} />

          {/* Modus-Umschalter */}
          <div style={{display:'flex',background:'rgba(255,255,255,0.1)',borderRadius:8,padding:3,gap:2}}>
            {[['simple','Schnellzugriff'],['advanced','Vollzugriff']].map(([id,label]) => (
              <button key={id} onClick={()=>setMode(id)} style={{
                padding:'5px 14px',borderRadius:6,cursor:'pointer',fontSize:12.5,
                fontFamily:'var(--sans)',fontWeight:500,border:'none',
                background: mode===id ? 'white' : 'transparent',
                color:       mode===id ? 'var(--ink)' : 'rgba(247,241,230,0.65)',
              }}>{label}</button>
            ))}
          </div>

          <button onClick={logout} style={{color:'rgba(247,241,230,0.55)',background:'none',border:'none',cursor:'pointer',fontSize:13,fontFamily:'var(--sans)',marginLeft:4}}>
            Abmelden
          </button>
        </div>
      </div>

      {/* Seiteninhalt */}
      <div style={{maxWidth:1200,margin:'0 auto',padding:'32px 32px 64px'}}>
        <div style={{marginBottom:28}}>
          <h1 style={{fontFamily:'var(--serif)',fontSize:30,fontWeight:400,margin:0}}>
            {mode==='simple' ? 'Schnellzugriff' : 'Vollzugriff'}
          </h1>
          <p style={{color:'var(--muted)',fontSize:14,marginTop:6,marginBottom:0}}>
            {mode==='simple'
              ? 'Events, Neuigkeiten, Fotos und Vereinsinfos schnell bearbeiten.'
              : 'Vollständige Kontrolle über alle Inhalte, Gruppen, Sponsoren und Einstellungen.'}
          </p>
        </div>

        {mode==='simple'   && <SimpleMode   onSave={setToast} />}
        {mode==='advanced' && <AdvancedMode onSave={setToast} />}
      </div>

      {toast && <Toast msg={toast} onDone={()=>setToast(null)} />}
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
