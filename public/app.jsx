// Admin-Inhalte über den Grundstand aus data.jsx legen — bevor gerendert wird.
// Quelle ist die Datenbank (GET /api/content), damit Änderungen im Admin-Panel
// für alle Besucher:innen gelten. Ist die API nicht erreichbar (Datei direkt
// geöffnet, statischer Server ohne Pages Function), gelten wie früher die
// Überschreibungen im localStorage dieses Browsers.
const CONTENT_KEYS = ['NEWS','EVENTS','GROUPS','PEOPLE','PHOTOS','PHOTO_GROUPS','GARDE','MUSIKZUG','VORSITZ','SPONSORS_TIERS','INTERNAL','SITE_CONFIG','ROLES','DEMO_USERS'];

function applyContent(content) {
  CONTENT_KEYS.forEach(k => {
    if (content[k] !== undefined && content[k] !== null) window[k] = content[k];
  });
  if (content.SPONSORS_TIERS) {
    window.SPONSORS = window.SPONSORS_TIERS.flatMap(t => t.sponsors.map(s => s.name));
  }
}

function applyLocalOverrides() {
  const content = {};
  CONTENT_KEYS.forEach(k => {
    try {
      const raw = localStorage.getItem('nzadm_' + k);
      if (raw) content[k] = JSON.parse(raw);
    } catch(e) {}
  });
  applyContent(content);
}

// window.__nzContent sagt dem Admin-Panel, woher die Inhalte stammen.
async function loadContent() {
  const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = setTimeout(() => ctrl && ctrl.abort(), 4000);
  try {
    if (location.protocol === 'file:') throw new Error('file');
    const resp = await fetch('/api/content', { cache: 'no-store', signal: ctrl ? ctrl.signal : undefined });
    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    const data = await resp.json();
    if (!data || typeof data.content !== 'object') throw new Error('kein Inhalt');
    applyContent(data.content);
    window.__nzContent = { source: 'server', updatedAt: data.updatedAt, uploads: !!data.uploads };
  } catch (e) {
    applyLocalOverrides();
    window.__nzContent = { source: 'local', uploads: false };
  } finally {
    clearTimeout(timer);
  }
}

window.NZ_CONTENT_KEYS = CONTENT_KEYS;
window.nzApplyContent = applyContent;

const { useState: useStateApp, useEffect: useEffectApp } = React;

// Abschnitte der Startseite, die per Hash angesprungen werden
const ANCHOR_IDS = ['events', 'news', 'groups', 'people', 'kontakt'];

function App() {
  const auth = useAuth();
  const [route, setRouteRaw] = useStateApp(() => {
    const hash = (window.location.hash || '').replace(/^#\/?/, '');
    return hash || 'home';
  });
  const [modal, setModal] = useStateApp(null);

  const navigate = (id) => {
    // No pre-guard: the render branch handles unauthenticated 'mitglieder' by showing LoginPage.
    // (Pre-guarding here breaks login-then-redirect because setUser hasn't flushed yet.)
    setRouteRaw(id);
    window.location.hash = id;
    setTimeout(() => window.scrollTo({ top: 0 }), 0);
  };

  // Listen for hash changes (back/forward)
  useEffectApp(() => {
    const onHash = () => {
      const hash = (window.location.hash || '').replace(/^#\/?/, '');
      setRouteRaw(hash || 'home');
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  // Expose current user on window for shared photo card component
  useEffectApp(() => { window.__currentUser = auth.user; }, [auth.user]);

  // Routen können einen Parameter tragen: „reservierung/e2" → routeName + routeParam
  const rawName    = route.split('/')[0];
  const routeParam = route.split('/')[1] || '';
  // Anker der Startseite (auch als Direktlink #kontakt) zeigen die Startseite
  const routeName  = ANCHOR_IDS.includes(rawName) ? 'home' : rawName;

  // Direktlink auf einen Anker: nach dem Rendern dorthin scrollen
  useEffectApp(() => {
    if (!ANCHOR_IDS.includes(rawName)) return;
    const t = setTimeout(() => {
      const el = document.getElementById(rawName);
      if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 80 });
    }, 60);
    return () => clearTimeout(t);
  }, [rawName]);

  const handleNav = (id) => {
    // 'home' route should also handle some legacy anchor ids
    if (ANCHOR_IDS.includes(id)) {
      navigate('home');
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) {
          const top = el.getBoundingClientRect().top + window.scrollY - 80;
          window.scrollTo({ top, behavior: 'smooth' });
        }
      }, 50);
      return;
    }
    navigate(id);
  };

  if (routeName === 'admin') {
    if (typeof AdminPage === 'undefined' || typeof AdminErrorBoundary === 'undefined') {
      return <div style={{padding:40,fontFamily:'var(--sans,sans-serif)'}}>Admin-Panel lädt nicht — bitte Seite neu laden (<strong>Strg+Shift+R</strong>).</div>;
    }
    return (
      <AdminErrorBoundary>
        <AdminPage navigate={handleNav} />
      </AdminErrorBoundary>
    );
  }

  return (
    <>
      <TopBar
        route={routeName}
        navigate={handleNav}
        user={auth.user}
        onLogout={auth.logout}
      />

      {routeName === 'home' && (
        <main>
          <Hero navigate={handleNav} />
          <Welcome />
          <NewsFeed onOpen={setModal} />
          <SponsorsMarquee />
          <EventsBand onOpen={setModal} />
          <GroupsBlock navigate={handleNav} />
          <PeopleBlock />
          <ContactBlock />
        </main>
      )}

      {routeName === 'reservierung' && (
        <main><ReservationPage eventId={routeParam} navigate={handleNav} /></main>
      )}

      {routeName === 'garde' && (
        <main><GardePage navigate={handleNav} onOpenPhoto={setModal} /></main>
      )}
      {routeName === 'musikzug' && (
        <main><MusikzugPage navigate={handleNav} onOpenPhoto={setModal} /></main>
      )}
      {routeName === 'vorsitz' && (
        <main><VorsitzPage navigate={handleNav} onOpenPhoto={setModal} /></main>
      )}
      {(routeName === 'galerie' || routeName === 'photos') && (
        <main><GaleriePage navigate={handleNav} onOpenPhoto={setModal} /></main>
      )}
      {routeName === 'sponsoren' && (
        <main><SponsorsPage navigate={handleNav} /></main>
      )}
      {routeName === 'login' && (
        <main><LoginPage auth={auth} navigate={handleNav} /></main>
      )}
      {routeName === 'mitglieder' && auth.user && (
        <main><MemberDashboard user={auth.user} auth={auth} navigate={handleNav} onOpenPhoto={setModal} /></main>
      )}
      {routeName === 'mitglieder' && !auth.user && (
        <main><LoginPage auth={auth} navigate={handleNav} /></main>
      )}

      <Footer navigate={handleNav} />
      <Modal item={modal} onClose={() => setModal(null)} user={auth.user} />
    </>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
loadContent().finally(() => root.render(<App />));
