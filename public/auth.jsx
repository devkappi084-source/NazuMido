// Auth: login, register, member dashboard
const { useState: useStateA, useEffect: useEffectA } = React;

// ---------- useAuth Hook (localStorage based) ----------
function useAuth() {
  const [user, setUser] = useStateA(() => {
    try {
      const raw = localStorage.getItem('nazumido_user');
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  });

  useEffectA(() => {
    if (user) {
      localStorage.setItem('nazumido_user', JSON.stringify(user));
      window.__currentUser = user;
    } else {
      localStorage.removeItem('nazumido_user');
      window.__currentUser = null;
    }
  }, [user]);

  const login = (email, password) => {
    // demoUsers() statt DEMO_USERS: im Admin angelegte Konten liegen auf window
    const mail = String(email || '').trim().toLowerCase();
    const u = demoUsers().find(x => String(x.email).toLowerCase() === mail && x.password === password);
    if (u) {
      setUser({ ...u, password: undefined });
      return { ok: true };
    }
    // Also accept any registered user
    try {
      const registered = JSON.parse(localStorage.getItem('nazumido_registry') || '[]');
      const r = registered.find(x => x.email === email && x.password === password);
      if (r) {
        setUser({ ...r, password: undefined });
        return { ok: true };
      }
    } catch (e) {}
    return { ok: false, error: 'E-Mail oder Passwort nicht korrekt.' };
  };

  const register = (data) => {
    if (!data.email || !data.password || !data.name) {
      return { ok: false, error: 'Bitte alle Felder ausfüllen.' };
    }
    if (data.password.length < 4) {
      return { ok: false, error: 'Passwort muss mindestens 4 Zeichen lang sein.' };
    }
    try {
      const registered = JSON.parse(localStorage.getItem('nazumido_registry') || '[]');
      if (registered.find(x => x.email === data.email) || demoUsers().find(x => x.email === data.email)) {
        return { ok: false, error: 'Diese E-Mail ist bereits registriert.' };
      }
      // Rollen mit `signup: false` (Trainer:in, Vorstand, Admin) kann man nicht
      // selbst vergeben — das Konto startet als Mitglied, der Wunsch wird notiert
      // und im Admin unter „Benutzer" freigeschaltet.
      const wanted = roleInfo(data.role || 'Mitglied');
      const granted = wanted.signup === false ? 'Mitglied' : wanted.id;
      const newUser = {
        ...data,
        role: granted,
        requestedRole: wanted.signup === false ? wanted.id : undefined,
        avatar: data.name.charAt(0).toUpperCase(),
      };
      registered.push(newUser);
      localStorage.setItem('nazumido_registry', JSON.stringify(registered));
      setUser({ ...newUser, password: undefined });
      return { ok: true };
    } catch (e) {
      return { ok: false, error: 'Registrierung fehlgeschlagen.' };
    }
  };

  const logout = () => setUser(null);

  return { user, login, register, logout };
}

// ---------- Login / Register Page ----------
function LoginPage({ auth, navigate }) {
  const [mode, setMode] = useStateA('login');
  const [form, setForm] = useStateA({ email: '', password: '', name: '', role: 'Mitglied' });
  const [err, setErr] = useStateA('');

  const submit = (e) => {
    e.preventDefault();
    setErr('');
    let res;
    if (mode === 'login') {
      res = auth.login(form.email, form.password);
    } else {
      res = auth.register(form);
    }
    if (!res.ok) setErr(res.error);
    else navigate('mitglieder');
  };

  const fillDemo = (u) => {
    setMode('login');
    setForm({ ...form, email: u.email, password: u.password });
  };

  return (
    <div className="auth-wrap">
      <div className="auth-visual">
        <div>
          <div className="logo-mark"><img src="assets/logo.png" alt="Nazumido" /></div>
          <span className="eyebrow no-rule" style={{ color: 'rgba(247,241,230,0.7)' }}>Mitgliederbereich</span>
          <h2 style={{ marginTop: 12 }}>
            Hinter den<br/>
            <span style={{ fontStyle: 'italic', color: 'var(--red)' }}>Kulissen.</span>
          </h2>
          <p>
            Interne Termine, vertrauliche Dokumente, HD-Fotodownloads und
            rollenspezifische Inhalte für Mitglieder, Trainer:innen und Vorstand.
          </p>
        </div>
        <div>
          <div className="demo-card">
            <strong>Zugänge (zum Testen)</strong>
            {demoUsers().map((u, i) => (
              <div key={i} className="demo-row">
                <div>
                  <div style={{ color: 'var(--paper)' }}>{roleInfo(u.role).label}</div>
                  <div style={{ opacity: 0.7, fontSize: 11 }}>{u.email}</div>
                  <div style={{ opacity: 0.55, fontSize: 10, fontFamily: 'var(--mono)' }}>
                    {userRights(u).length} Rechte
                  </div>
                </div>
                <button onClick={() => fillDemo(u)}>Übernehmen</button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <form className="auth-form" onSubmit={submit}>
        <div className="breadcrumb" style={{ marginBottom: 24 }}>
          <a href="#home" onClick={(e) => { e.preventDefault(); navigate('home'); }}>Start</a>
          <span className="sep">›</span>
          <span>Mitgliederbereich</span>
        </div>

        <h3>{mode === 'login' ? 'Willkommen zurück' : 'Konto erstellen'}</h3>
        <div className="sub">
          {mode === 'login'
            ? 'Melde dich mit deinen Zugangsdaten an.'
            : 'Erstelle ein neues Mitgliedskonto in wenigen Schritten.'}
        </div>

        <div className="switcher">
          <button type="button" className={mode === 'login' ? 'active' : ''} onClick={() => { setMode('login'); setErr(''); }}>
            Anmelden
          </button>
          <button type="button" className={mode === 'register' ? 'active' : ''} onClick={() => { setMode('register'); setErr(''); }}>
            Registrieren
          </button>
        </div>

        {err && <div className="err">{err}</div>}

        {mode === 'register' && (
          <div className="field">
            <label>Voller Name</label>
            <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="z.B. Anna Berger" required />
          </div>
        )}

        <div className="field">
          <label>E-Mail Adresse</label>
          <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="anna@example.at" required />
        </div>

        <div className="field">
          <label>Passwort</label>
          <input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder="••••••••" required />
        </div>

        {mode === 'register' && (
          <div className="field">
            <label>Ich bin…</label>
            <select value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
              {roles().map(r => (
                <option key={r.id} value={r.id}>
                  {r.label}{r.signup === false ? ' (Freischaltung nötig)' : ''}
                </option>
              ))}
            </select>
            <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>
              {roleInfo(form.role).desc}
              {roleInfo(form.role).signup === false && (
                <> <strong>Hinweis:</strong> Dein Konto startet als Mitglied — die höhere Rolle
                schaltet der Schriftführer im Vereinssystem frei.</>
              )}
            </p>
          </div>
        )}

        <button type="submit" className="btn" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}>
          {mode === 'login' ? 'Anmelden →' : 'Konto erstellen →'}
        </button>

        <p style={{ marginTop: 18, fontSize: 13, color: 'var(--muted)' }}>
          {mode === 'login' ? (
            <>Noch kein Konto? <a href="#" style={{ color: 'var(--red)', fontWeight: 500 }} onClick={(e) => { e.preventDefault(); setMode('register'); }}>Jetzt registrieren</a></>
          ) : (
            <>Schon registriert? <a href="#" style={{ color: 'var(--red)', fontWeight: 500 }} onClick={(e) => { e.preventDefault(); setMode('login'); }}>Hier anmelden</a></>
          )}
        </p>
      </form>
    </div>
  );
}

// ---------- Member Dashboard ----------
// Farbwerte der Rollen für Pille und Avatar
const ROLE_TONES = {
  red:   { bg: 'var(--red)',   fg: 'var(--paper)', pill: '' },
  green: { bg: 'var(--green)', fg: 'var(--paper)', pill: 'green' },
  gold:  { bg: 'var(--gold)',  fg: 'var(--ink)',   pill: 'gold' },
  ink:   { bg: 'var(--ink)',   fg: 'var(--paper)', pill: 'ink' },
};

function MemberDashboard({ user, auth, navigate, onOpenPhoto }) {
  const info = roleInfo(user.role);
  const role = info.id;
  const rights = userRights(user);
  const can = id => rights.indexOf(id) !== -1;
  const custom = Array.isArray(user.rights);

  // Dokumente der Rolle, gefiltert nach den Rechten des Kontos
  const internal = window.INTERNAL || INTERNAL;
  const docs = (internal[role] || internal.Mitglied || [])
    .filter(d => !d.right || can(d.right));

  const tone = ROLE_TONES[info.color] || ROLE_TONES.green;
  const photos = window.PHOTOS || PHOTOS;

  // Ohne das Recht „intern" bleibt das Dashboard zu (z. B. gesperrte Konten)
  if (!can('intern')) {
    return (
      <div className="dash">
        <div className="container" style={{ maxWidth: 620 }}>
          <div className="dash-section">
            <h3>Kein Zugriff</h3>
            <p className="desc">
              Deine Rolle „{info.label}" ist derzeit nicht für den Mitgliederbereich
              freigeschaltet. Melde dich beim Schriftführer, wenn das ein Irrtum ist.
            </p>
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button className="btn outline-dark" onClick={() => navigate('home')}>Zur Startseite</button>
              <button className="btn outline-dark" onClick={() => { auth.logout(); navigate('home'); }}>Abmelden</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dash">
      <div className="container">
        <div className="breadcrumb" style={{ marginBottom: 24 }}>
          <a href="#home" onClick={(e) => { e.preventDefault(); navigate('home'); }}>Start</a>
          <span className="sep">›</span>
          <span>Mitgliederbereich</span>
        </div>

        <div className="dash-head">
          <div className="dash-greeting">
            <span className="eyebrow no-rule">Eingeloggt · session 2026</span>
            <h2>Helau, <span style={{ fontStyle: 'italic', color: 'var(--red)' }}>{user.name.split(' ')[0]}</span>.</h2>
            <div className={"role-pill " + tone.pill}>
              <span className="dot"></span>
              Rolle · {info.label}{user.group ? ` · ${user.group}` : ''}
              {custom && ' · individuell'}
            </div>
            {user.requestedRole && (
              <p style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 10 }}>
                Freischaltung als <strong>{roleInfo(user.requestedRole).label}</strong> ist beantragt.
              </p>
            )}
          </div>
          <div className="dash-user">
            <div className="dash-avatar" style={{ background: tone.bg, color: tone.fg }}>
              {user.avatar}
            </div>
            <div className="dash-user-info">
              <strong>{user.name}</strong>
              {user.email}
              <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                <button className="btn outline-dark" style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => { auth.logout(); navigate('home'); }}>
                  Abmelden
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="dash-grid">
          <div>
            <div className="dash-section">
              <h3>Interne Dokumente</h3>
              <p className="desc">{info.desc}</p>
              {docs.length ? (
                <ul className="dash-doclist">
                  {docs.map((doc, i) => (
                    <li key={i}>
                      <div className="ico">{doc.icon}</div>
                      <div>
                        <div className="ti">{doc.title}</div>
                        <div className="mt">{doc.meta}</div>
                      </div>
                      <button className="btn-mini"
                        onClick={() => doc.kind === 'photos' ? navigate('galerie')
                          : doc.kind === 'admin' ? navigate('admin')
                          : alert('Demo: Dokument-Download startet…')}>
                        {doc.kind === 'photos' ? 'Galerie' : doc.kind === 'admin' ? 'Öffnen →' : 'Öffnen'}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="desc">Für deine Rolle sind derzeit keine Dokumente hinterlegt.</p>
              )}
            </div>

            <div className="dash-section">
              <h3>Fotogalerie · HD-Download</h3>
              <p className="desc">
                {can('hdfotos')
                  ? 'Alle Galerien stehen dir in voller Auflösung zur Verfügung. Klick auf ein Bild zum Herunterladen.'
                  : 'Deine Rolle sieht die Web-Vorschau. Den HD-Download schaltet der Vorstand pro Konto frei.'}
              </p>
              <div className="photo-grid" style={{ marginTop: 6 }}>
                {photos.slice(0, 8).map(p => (
                  <PhotoCard key={p.id} photo={p} onOpen={onOpenPhoto} />
                ))}
              </div>
              <button className="btn outline-dark" style={{ marginTop: 18 }} onClick={() => navigate('galerie')}>
                Ganzes Archiv ansehen <span aria-hidden>→</span>
              </button>
            </div>
          </div>

          <div>
            <div className="dash-section">
              <h3>Schnellzugriff</h3>
              <p className="desc">Bereiche, die du häufig brauchst.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button className="btn outline-dark" style={{ justifyContent: 'space-between', width: '100%' }} onClick={() => navigate('garde')}>
                  <span>Garde-Bereich</span><span>→</span>
                </button>
                <button className="btn outline-dark" style={{ justifyContent: 'space-between', width: '100%' }} onClick={() => navigate('musikzug')}>
                  <span>Musikzug-Bereich</span><span>→</span>
                </button>
                <button className="btn outline-dark" style={{ justifyContent: 'space-between', width: '100%' }} onClick={() => navigate('vorsitz')}>
                  <span>Präsidium-Bereich</span><span>→</span>
                </button>
                <button className="btn outline-dark" style={{ justifyContent: 'space-between', width: '100%' }} onClick={() => navigate('galerie')}>
                  <span>Fotogalerie</span><span>→</span>
                </button>
                <button className="btn outline-dark" style={{ justifyContent: 'space-between', width: '100%' }} onClick={() => navigate('sponsoren')}>
                  <span>Sponsorenübersicht</span><span>→</span>
                </button>
                {can('admin') && (
                  <button className="btn" style={{ justifyContent: 'space-between', width: '100%' }} onClick={() => navigate('admin')}>
                    <span>Website-Verwaltung</span><span>→</span>
                  </button>
                )}
              </div>
            </div>

            <div className="dash-section">
              <h3>Deine Rechte</h3>
              <p className="desc">
                {custom
                  ? 'Für dieses Konto wurden die Rechte individuell vergeben.'
                  : `Ergibt sich aus deiner Rolle „${info.label}".`}
              </p>
              <ul className="rights-list">
                {(window.RIGHTS || RIGHTS).map(r => (
                  <li key={r.id} className={can(r.id) ? 'on' : 'off'}>
                    <span className="mark" aria-hidden>{can(r.id) ? '✓' : '—'}</span>
                    <span>
                      <b>{r.label}</b>
                      <em>{r.desc}</em>
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {can('termine') && (
            <div className="dash-section">
              <h3>Nächste interne Termine</h3>
              <p className="desc">Nur für Mitglieder sichtbar.</p>
              <ul className="dash-doclist">
                <li>
                  <div className="ico">🗓️</div>
                  <div>
                    <div className="ti">Generalprobe Umzug</div>
                    <div className="mt">12. Feb · 19:00 · Festplatz</div>
                  </div>
                </li>
                <li>
                  <div className="ico">🍽️</div>
                  <div>
                    <div className="ti">Helferessen Vorbesprechung</div>
                    <div className="mt">10. Feb · 19:30 · Gasthof Hofer</div>
                  </div>
                </li>
                {can('training') && (
                  <li>
                    <div className="ico">🔒</div>
                    <div>
                      <div className="ti">Trainer:innen-Briefing</div>
                      <div className="mt">08. Feb · 17:30 · Turnsaal</div>
                    </div>
                  </li>
                )}
                {can('finanzen') && (
                  <li>
                    <div className="ico">🔒</div>
                    <div>
                      <div className="ti">Vorstandssitzung</div>
                      <div className="mt">06. Feb · 19:30 · Vereinsraum</div>
                    </div>
                  </li>
                )}
              </ul>
            </div>
            )}

            <div className="dash-section" style={{ background: 'var(--ink)', color: 'var(--paper)', borderColor: 'var(--ink)' }}>
              <h3 style={{ color: 'var(--paper)' }}>Mitgliederausweis</h3>
              <p style={{ color: 'rgba(247,241,230,0.7)', fontSize: 13.5, marginBottom: 18 }}>
                Dein digitaler Vereinsausweis für Saison 2026 — vorzeigen bei
                Veranstaltungen für vergünstigte Tickets.
              </p>
              <div style={{ background: 'var(--paper)', color: 'var(--ink)', borderRadius: 8, padding: 20, fontFamily: 'var(--mono)', fontSize: 13 }}>
                <div style={{ fontFamily: 'var(--serif)', fontSize: 22 }}>{user.name}</div>
                <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)', marginTop: 4 }}>
                  {info.label} {user.group ? `· ${user.group}` : ''}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 18, alignItems: 'end' }}>
                  <div>
                    <div style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>Gültig</div>
                    <div>11.11.2025 — 17.02.2026</div>
                  </div>
                  <div style={{ fontFamily: 'var(--serif)', fontSize: 28, color: 'var(--red)' }}>★</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { useAuth, LoginPage, MemberDashboard });
