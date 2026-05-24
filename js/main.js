/* ============================================================
   NazuMido – Main JavaScript (Redesign)
   ============================================================ */

(function () {
  'use strict';

  /* ============================================================
     SPA ROUTER
     ============================================================ */
  const PAGES = ['home', 'garde', 'musikzug', 'vorsitz', 'sponsoren'];

  function getRoute() {
    const hash = window.location.hash.replace('#', '').trim();
    return PAGES.includes(hash) ? hash : 'home';
  }

  function showPage(route) {
    // Hide all pages
    PAGES.forEach(function (r) {
      var el = document.getElementById('page-' + r);
      if (el) {
        if (r === route) {
          el.classList.remove('hidden');
        } else {
          el.classList.add('hidden');
        }
      }
    });

    // Update nav active states
    document.querySelectorAll('[data-route]').forEach(function (el) {
      if (el.dataset.route === route) {
        el.classList.add('active');
      } else {
        el.classList.remove('active');
      }
    });

    // Scroll to top when switching pages
    window.scrollTo(0, 0);

    // Re-observe any reveal elements on the newly shown page
    var pageEl = document.getElementById('page-' + route);
    if (pageEl) {
      pageEl.querySelectorAll('.reveal-up, .reveal-left, .reveal-right').forEach(function (el) {
        if (!el.classList.contains('in-view')) {
          revealObserver.observe(el);
        }
      });
    }
  }

  function navigate(route) {
    if (!PAGES.includes(route)) route = 'home';
    window.location.hash = route === 'home' ? 'home' : route;
    showPage(route);
    closeMobileMenu();
  }

  // Handle hash changes (back/forward, direct links)
  window.addEventListener('hashchange', function () {
    var route = getRoute();
    showPage(route);
  });

  // Wire up all [data-route] elements
  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-route]');
    if (el && el.dataset.route) {
      e.preventDefault();
      navigate(el.dataset.route);
    }

    // data-route-anchor: navigate to home then scroll to anchor
    var anchorEl = e.target.closest('[data-route-anchor]');
    if (anchorEl && anchorEl.dataset.routeAnchor) {
      e.preventDefault();
      var anchorId = anchorEl.dataset.routeAnchor;
      navigate('home');
      setTimeout(function () {
        var target = document.getElementById(anchorId);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 80);
    }
  });

  // Initial page load
  showPage(getRoute());

  /* ============================================================
     TOPBAR MARQUEE
     ============================================================ */
  var MARQUEE_ITEMS = [
    'Saison 2026/2027 · Helau & Narri!',
    'Narrenruf 11. November 2026 · 11:11 Uhr',
    'Garde – Nachwuchs willkommen',
    'Großer Faschingsumzug · Frühjahr 2027',
    'info@nazu-mido.at · Kirchdorf an der Krems',
    'Musikzug sucht Verstärkung · Mi 19:30',
    'NazuMido – Narrenzunft der schwarzen Grafen'
  ];

  var track = document.getElementById('topbar-strip-track');
  if (track) {
    var doubled = MARQUEE_ITEMS.concat(MARQUEE_ITEMS);
    track.innerHTML = doubled.map(function (item) {
      return '<span>' + item + '</span>';
    }).join('');
  }

  /* ============================================================
     NAV BURGER / MOBILE MENU
     ============================================================ */
  var burger = document.getElementById('nav-burger');
  var mobileMenu = document.getElementById('mobile-menu');

  function closeMobileMenu() {
    if (mobileMenu) mobileMenu.classList.remove('open');
    if (burger) burger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  if (burger && mobileMenu) {
    burger.addEventListener('click', function () {
      var isOpen = mobileMenu.classList.toggle('open');
      burger.setAttribute('aria-expanded', String(isOpen));
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });
  }

  // Close mobile menu on outside click
  document.addEventListener('click', function (e) {
    if (mobileMenu && mobileMenu.classList.contains('open')) {
      var topbar = document.getElementById('topbar');
      if (topbar && !topbar.contains(e.target)) {
        closeMobileMenu();
      }
    }
  });

  /* ============================================================
     CONFETTI (CSS spans in hero)
     ============================================================ */
  var CONFETTI_COLORS = ['#C8202C', '#1E6E3F', '#FBF8F2', '#C9A24B', '#16140F'];
  var confettiEl = document.getElementById('confetti');

  if (confettiEl) {
    var html = '';
    for (var i = 0; i < 24; i++) {
      var color = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
      var left = Math.random() * 100;
      var top  = Math.random() * 100;
      var rot  = Math.random() * 360;
      var dur  = 4 + Math.random() * 8;
      var delay = Math.random() * -10;
      html += '<span style="'
        + 'background:' + color + ';'
        + 'left:' + left + '%;'
        + 'top:' + top + '%;'
        + 'transform:rotate(' + rot + 'deg);'
        + 'animation-duration:' + dur.toFixed(1) + 's;'
        + 'animation-delay:' + delay.toFixed(1) + 's;'
        + '"></span>';
    }
    confettiEl.innerHTML = html;
  }

  /* ============================================================
     NEWS FEED
     ============================================================ */
  var NEWS = [
    {
      id: 'n1',
      title: 'Rückblick: Großer Faschingsumzug 2025',
      tag: 'Rückblick',
      date: 'März 2025',
      excerpt: 'Tausende Besucher säumten die Straßen Kirchdorfs, als wir mit allen drei Gruppen durch die Innenstadt zogen. Ein unvergesslicher Tag voller Konfetti, Musik und Lachen.',
      img: 'images/band.jpg',
      full: 'Der diesjährige Faschingsumzug war ohne Zweifel unser bisher größtes Spektakel. Mit 18 Festwagen, der gesamten Garde in neuen Kostümen und dem Musikzug an der Spitze zogen wir durch eine jubelnde Menschenmenge. Mehr als 4.000 Besucher feierten mit uns – Danke an alle, die dabei waren!'
    },
    {
      id: 'n2',
      title: 'Ankündigung: Narrenruf am 11.11.2026',
      tag: 'Ankündigung',
      date: 'Oktober 2026',
      excerpt: 'Der Startschuss für die neue Saison fällt am 11. November 2026 um 11 Uhr 11 auf dem Stadtplatz. Seid dabei!',
      img: '',
      full: 'Traditionsgemäß eröffnen wir die Faschingssaison 2026/2027 mit dem feierlichen Narrenruf am Kirchdorfer Stadtplatz. Die Garde eröffnet das Programm, der Musikzug liefert die Beschallung und der Vorsitz ruft die närrische Zeit offiziell aus. Eintritt frei für alle!'
    },
    {
      id: 'n3',
      title: 'Neue Choreografie für die Hauptgarde',
      tag: 'Garde',
      date: 'September 2026',
      excerpt: 'Unsere Gardetrainerin hat die Sommerpause genutzt und eine völlig neue Show-Choreografie erarbeitet. Premiere beim Narrenruf!',
      img: 'images/garde.jpg',
      full: 'Nach wochenlanger Probenarbeit ist es vollbracht: Die Hauptgarde präsentiert zur Saison 2026/2027 ein brandneues Programm mit Elementen aus modernem Gesellschaftstanz und klassischer Faschingstradition. Die Premiere findet beim Narrenruf am 11.11. statt.'
    },
    {
      id: 'n4',
      title: 'Musikzug: Neue Mitglieder gesucht!',
      tag: 'Musikzug',
      date: 'August 2026',
      excerpt: 'Für die kommende Saison suchen wir Verstärkung bei den Bläsern und Trommeln. Probestunde jeden Mittwoch!',
      img: '',
      full: 'Der Musikzug wächst! Wir freuen uns über alle, die Lust haben, bei uns mitzuspielen – ob Anfänger oder erfahrener Musiker. Einfach mittwochs ab 19:30 Uhr im Vereinshaus vorbeischauen. Instrumente zum Ausprobieren sind vorhanden.'
    },
    {
      id: 'n5',
      title: 'Vereinsgrillfest: Ein Abend unter Freunden',
      tag: 'Vereinsleben',
      date: 'Juli 2026',
      excerpt: 'Beim jährlichen Grillfest kamen alle drei Gruppen und ihre Familien zusammen. Ein wunderschöner Sommerabend!',
      img: 'images/gruppe.jpg',
      full: 'Rund 80 Mitglieder, Freunde und Familien feierten beim diesjährigen Grillfest auf dem Vereinsgelände. Der Abend klang mit Lagerfeuer, Gitarrenmusik und vielen schönen Gesprächen weit nach Mitternacht aus. Wir freuen uns schon auf nächstes Jahr!'
    }
  ];

  var currentTag = 'Alle';

  function renderFeed(tag) {
    var grid = document.getElementById('feed-grid');
    if (!grid) return;

    var filtered = tag === 'Alle' ? NEWS : NEWS.filter(function (n) { return n.tag === tag; });

    if (!filtered.length) {
      grid.innerHTML = '<p style="color:var(--muted);font-size:14px;grid-column:1/-1">Keine Beiträge in dieser Kategorie.</p>';
      return;
    }

    grid.innerHTML = filtered.map(function (item, i) {
      var isFeature = i === 0 && tag === 'Alle';
      var imgHtml = item.img
        ? '<div class="feed-media"><img src="' + item.img + '" alt="' + item.title + '" loading="lazy"></div>'
        : '<div class="feed-media"><div class="feed-media-placeholder">NazuMido</div></div>';
      return '<div class="feed-card' + (isFeature ? ' feature' : '') + ' reveal-up" data-news-id="' + item.id + '" style="transition-delay:' + (i * 0.06) + 's">'
        + imgHtml
        + '<div class="feed-body">'
        + '<div class="feed-meta">' + item.date + '</div>'
        + '<span class="feed-tag">' + item.tag + '</span>'
        + '<h3>' + item.title + '</h3>'
        + '<p>' + item.excerpt + '</p>'
        + '<span class="feed-readmore">Weiterlesen &#8594;</span>'
        + '</div>'
        + '</div>';
    }).join('');

    // Wire click to open modal
    grid.querySelectorAll('.feed-card').forEach(function (card) {
      card.addEventListener('click', function () {
        var id = card.dataset.newsId;
        var item = NEWS.find(function (n) { return n.id === id; });
        if (item) openModal(item, 'news');
      });
    });

    // Re-observe reveal elements
    grid.querySelectorAll('.reveal-up').forEach(function (el) {
      revealObserver.observe(el);
    });
  }

  // Feed tabs
  var feedTabs = document.getElementById('feed-tabs');
  if (feedTabs) {
    feedTabs.addEventListener('click', function (e) {
      var btn = e.target.closest('.feed-tab');
      if (!btn) return;
      feedTabs.querySelectorAll('.feed-tab').forEach(function (t) { t.classList.remove('active'); });
      btn.classList.add('active');
      currentTag = btn.dataset.tag || 'Alle';
      renderFeed(currentTag);
    });
  }
  renderFeed('Alle');

  /* ============================================================
     SPONSORS MARQUEE
     ============================================================ */
  var SPONSORS = [
    'Raiffeisenbank Kirchdorf',
    'Stadtgemeinde Kirchdorf',
    'Bäckerei Hofer',
    'Druckerei Lindner',
    'AutoHaus Kirchdorf',
    'Gasthof zur Post',
    'Metzgerei Berger',
    'Optik Reiter',
    'Elektro Pichler',
    'Tischlerei Eder',
    'Bauunternehmen Huber',
    'Café Central'
  ];

  var sponsorsTrack = document.getElementById('sponsors-track');
  if (sponsorsTrack) {
    var all = SPONSORS.concat(SPONSORS); // doubled for infinite scroll
    sponsorsTrack.innerHTML = all.map(function (s) {
      return '<span>★ ' + s + '</span>';
    }).join('');
  }

  /* ============================================================
     EVENT ROW CLICK (existing static rows + dynamically added)
     ============================================================ */
  // Stored event data for modal (populated by content-loader too)
  window._eventData = {};

  function wireEventRows() {
    document.querySelectorAll('.event-row').forEach(function (row) {
      if (row._wired) return;
      row._wired = true;
      row.addEventListener('click', function () {
        var id = row.dataset.eventId || '';
        var data = window._eventData[id];
        if (!data) {
          // Build from DOM content
          var titleEl = row.querySelector('.event-title h3');
          var kindEl  = row.querySelector('.event-title .kind');
          var descEl  = row.querySelector('.event-desc');
          var whereEl = row.querySelector('.event-where');
          var dEl     = row.querySelector('.event-date .d');
          var mEl     = row.querySelector('.event-date .m');
          data = {
            title:       titleEl ? titleEl.textContent : 'Event',
            kind:        kindEl  ? kindEl.textContent  : '',
            description: descEl  ? descEl.textContent  : '',
            where:       whereEl ? whereEl.textContent.trim() : '',
            day:         dEl     ? dEl.textContent      : '',
            month:       mEl     ? mEl.textContent      : ''
          };
        }
        openModal(data, 'event');
      });
    });
  }
  wireEventRows();

  /* ============================================================
     MODAL
     ============================================================ */
  var modalBack  = document.getElementById('modal-back');
  var modalClose = document.getElementById('modal-close');
  var modalBody  = document.getElementById('modal-body');
  var modalMedia = document.getElementById('modal-media');
  var modalImg   = document.getElementById('modal-img');

  window.openModal = function (item, type) {
    if (!modalBack || !modalBody) return;

    if (type === 'news') {
      // Show image if available
      if (item.img) {
        modalMedia.style.display = '';
        modalImg.src = item.img;
        modalImg.alt = item.title;
      } else {
        modalMedia.style.display = 'none';
      }
      modalBody.innerHTML = ''
        + '<span class="modal-tag">' + (item.tag || 'Aktuelles') + '</span>'
        + '<div class="modal-meta"><span>' + (item.date || '') + '</span></div>'
        + '<h3>' + item.title + '</h3>'
        + '<p>' + (item.full || item.excerpt || '') + '</p>';
    } else if (type === 'event') {
      modalMedia.style.display = 'none';
      modalBody.innerHTML = ''
        + '<span class="modal-tag">Termin</span>'
        + '<div class="modal-meta">'
        + (item.day && item.month ? '<span>' + item.day + '. ' + item.month + '</span>' : '')
        + (item.where ? '<span>' + item.where + '</span>' : '')
        + '</div>'
        + '<h3>' + (item.title || 'Event') + '</h3>'
        + (item.kind  ? '<p style="font-family:var(--mono);font-size:11px;color:var(--muted);letter-spacing:0.1em;text-transform:uppercase;margin-bottom:12px">' + item.kind + '</p>' : '')
        + (item.description ? '<p>' + item.description + '</p>' : '');
    }

    modalBack.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  };

  function closeModal() {
    if (modalBack) modalBack.style.display = 'none';
    document.body.style.overflow = '';
  }

  if (modalClose) modalClose.addEventListener('click', closeModal);
  if (modalBack) {
    modalBack.addEventListener('click', function (e) {
      if (e.target === modalBack) closeModal();
    });
  }
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      closeModal();
      closeLightbox();
    }
  });

  /* ============================================================
     GROUP CARD CLICKS — handled by the [data-route] listener above
     ============================================================ */

  /* ============================================================
     NEWSLETTER FORM
     ============================================================ */
  var newsletterForm = document.getElementById('newsletter-form');
  var signupSuccess  = document.getElementById('signup-success');
  var signupReset    = document.getElementById('signup-reset');

  if (newsletterForm) {
    newsletterForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var email = newsletterForm.querySelector('input[type="email"]');
      if (!email || !email.value.trim()) {
        if (email) { email.focus(); email.style.borderColor = 'var(--red)'; }
        return;
      }
      newsletterForm.style.display = 'none';
      if (signupSuccess) signupSuccess.style.display = '';
    });
  }

  if (signupReset) {
    signupReset.addEventListener('click', function () {
      if (signupSuccess) signupSuccess.style.display = 'none';
      if (newsletterForm) {
        newsletterForm.style.display = '';
        newsletterForm.reset();
      }
    });
  }

  /* ============================================================
     TOPIC CHIPS
     ============================================================ */
  var topicChips = document.getElementById('topic-chips');
  if (topicChips) {
    topicChips.addEventListener('click', function (e) {
      var chip = e.target.closest('.chip-check');
      if (chip) {
        chip.classList.toggle('on');
      }
    });
  }

  /* ============================================================
     GALLERY LIGHTBOX
     ============================================================ */
  var lightbox = document.getElementById('lightbox');
  var lbImg    = document.getElementById('lbImg');
  var lbClose  = document.getElementById('lbClose');
  var lbPrev   = document.getElementById('lbPrev');
  var lbNext   = document.getElementById('lbNext');
  var galleryImgs = [];
  var lbIndex = 0;

  function openLightbox(index) {
    if (!galleryImgs.length) return;
    lbIndex = index;
    lbImg.src = galleryImgs[lbIndex];
    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeLightbox() {
    if (lightbox) lightbox.classList.remove('open');
    document.body.style.overflow = '';
  }
  window.closeLightbox = closeLightbox;

  function initGallery() {
    galleryImgs = [];
    document.querySelectorAll('.gallery-grid img').forEach(function (img, i) {
      galleryImgs.push(img.src);
      img.parentElement.style.cursor = 'pointer';
      img.parentElement.addEventListener('click', function () {
        openLightbox(i);
      });
    });
  }
  initGallery();

  if (lbClose) lbClose.addEventListener('click', closeLightbox);
  if (lightbox) {
    lightbox.addEventListener('click', function (e) {
      if (e.target === lightbox || e.target === lbImg) closeLightbox();
    });
  }
  if (lbPrev) {
    lbPrev.addEventListener('click', function (e) {
      e.stopPropagation();
      lbIndex = (lbIndex - 1 + galleryImgs.length) % galleryImgs.length;
      lbImg.src = galleryImgs[lbIndex];
    });
  }
  if (lbNext) {
    lbNext.addEventListener('click', function (e) {
      e.stopPropagation();
      lbIndex = (lbIndex + 1) % galleryImgs.length;
      lbImg.src = galleryImgs[lbIndex];
    });
  }

  /* ============================================================
     SCROLL REVEAL (IntersectionObserver)
     Only translateY — never translateX to avoid horizontal scroll
     ============================================================ */
  var revealObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.07, rootMargin: '0px 0px -32px 0px' });

  // Observe all static reveal elements
  document.querySelectorAll('.reveal-up, .reveal-left, .reveal-right').forEach(function (el) {
    revealObserver.observe(el);
  });

  // Expose for content-loader.js
  window.revealObserver = revealObserver;
  window.wireEventRows  = wireEventRows;
  window.initGallery    = initGallery;

})();
