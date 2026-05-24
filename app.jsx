const { useState: useStateApp, useEffect: useEffectApp } = React;

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

  const handleNav = (id) => {
    // 'home' route should also handle some legacy anchor ids
    if (['events', 'news', 'groups', 'people', 'kontakt'].includes(id)) {
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

  return (
    <>
      <TopBar
        route={route}
        navigate={handleNav}
        user={auth.user}
        onLogout={auth.logout}
      />

      {route === 'home' && (
        <main>
          <Hero navigate={handleNav} />
          <Welcome />
          <NewsFeed onOpen={setModal} />
          <SponsorsMarquee />
          <EventsBand onOpen={setModal} />
          <GroupsBlock navigate={handleNav} />
          <PeopleBlock />
          <NewsletterBlock />
        </main>
      )}

      {route === 'garde' && (
        <main><GardePage navigate={handleNav} onOpenPhoto={setModal} /></main>
      )}
      {route === 'musikzug' && (
        <main><MusikzugPage navigate={handleNav} onOpenPhoto={setModal} /></main>
      )}
      {route === 'vorsitz' && (
        <main><VorsitzPage navigate={handleNav} onOpenPhoto={setModal} /></main>
      )}
      {route === 'sponsoren' && (
        <main><SponsorsPage navigate={handleNav} /></main>
      )}
      {route === 'login' && (
        <main><LoginPage auth={auth} navigate={handleNav} /></main>
      )}
      {route === 'mitglieder' && auth.user && (
        <main><MemberDashboard user={auth.user} auth={auth} navigate={handleNav} onOpenPhoto={setModal} /></main>
      )}
      {route === 'mitglieder' && !auth.user && (
        <main><LoginPage auth={auth} navigate={handleNav} /></main>
      )}

      <Footer navigate={handleNav} />
      <Modal item={modal} onClose={() => setModal(null)} user={auth.user} />
    </>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
