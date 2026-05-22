/* ============================================================
   NazuMido – Main JavaScript
   ============================================================ */

(function () {
  'use strict';

  /* --- Navbar: scroll effect + active link --- */
  const navbar  = document.getElementById('navbar');
  const burger  = document.getElementById('burger');
  const navMenu = document.getElementById('nav-links');
  const navLinks = navMenu.querySelectorAll('a');

  function updateNavbar() {
    if (window.scrollY > 60) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }
  window.addEventListener('scroll', updateNavbar, { passive: true });
  updateNavbar();

  /* Active section tracking */
  const sections = document.querySelectorAll('section[id]');
  function updateActiveLink() {
    const scrollY = window.scrollY + navbar.offsetHeight + 40;
    let current = '';
    sections.forEach(sec => {
      if (scrollY >= sec.offsetTop) current = sec.id;
    });
    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === '#' + current) link.classList.add('active');
    });
  }
  window.addEventListener('scroll', updateActiveLink, { passive: true });

  /* --- Burger menu --- */
  burger.addEventListener('click', () => {
    const isOpen = navMenu.classList.toggle('open');
    burger.classList.toggle('open', isOpen);
    burger.setAttribute('aria-expanded', String(isOpen));
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      navMenu.classList.remove('open');
      burger.classList.remove('open');
      burger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    });
  });

  /* Close menu on outside click */
  document.addEventListener('click', e => {
    if (navMenu.classList.contains('open') && !navbar.contains(e.target)) {
      navMenu.classList.remove('open');
      burger.classList.remove('open');
      burger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }
  });

  /* --- Smooth scroll with nav offset --- */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      const target = document.querySelector(targetId);
      if (!target) return;
      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.pageYOffset - navbar.offsetHeight - 16;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });

  /* --- Scroll reveal (Intersection Observer) --- */
  const revealEls = document.querySelectorAll('.reveal-up, .reveal-left, .reveal-right');
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

  revealEls.forEach(el => revealObserver.observe(el));

  /* --- Confetti canvas animation --- */
  const canvas = document.getElementById('confetti-canvas');
  const ctx    = canvas.getContext('2d');

  let W = 0, H = 0;
  function resizeCanvas() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas, { passive: true });

  const COLORS  = ['#c9a84c', '#f0c040', '#9a7a30', '#4a1070', '#7a3aaa', '#ffffff', '#e8c870', '#d4a040'];
  const SHAPES  = ['circle', 'rect', 'diamond'];
  const COUNT   = 90;

  class Particle {
    constructor(randomY = false) {
      this.init(randomY);
    }
    init(randomY = false) {
      this.x     = Math.random() * W;
      this.y     = randomY ? Math.random() * H : -20 - Math.random() * 80;
      this.size  = Math.random() * 5 + 2;
      this.color = COLORS[Math.floor(Math.random() * COLORS.length)];
      this.shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
      this.vx    = (Math.random() - 0.5) * 1.2;
      this.vy    = Math.random() * 1.4 + 0.6;
      this.rot   = Math.random() * Math.PI * 2;
      this.rotV  = (Math.random() - 0.5) * 0.08;
      this.alpha = Math.random() * 0.45 + 0.2;
      this.wave  = Math.random() * 2.5;
      this.waveS = Math.random() * 0.025 + 0.008;
      this.t     = Math.random() * Math.PI * 2;
    }
    update() {
      this.t  += this.waveS;
      this.x  += this.vx + Math.sin(this.t) * this.wave;
      this.y  += this.vy;
      this.rot += this.rotV;
      if (this.y > H + 30) this.init(false);
    }
    draw() {
      ctx.save();
      ctx.globalAlpha = this.alpha;
      ctx.fillStyle   = this.color;
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rot);
      if (this.shape === 'circle') {
        ctx.beginPath();
        ctx.arc(0, 0, this.size, 0, Math.PI * 2);
        ctx.fill();
      } else if (this.shape === 'rect') {
        ctx.fillRect(-this.size, -this.size * 0.5, this.size * 2, this.size);
      } else {
        ctx.beginPath();
        ctx.moveTo(0, -this.size * 1.4);
        ctx.lineTo(this.size, 0);
        ctx.lineTo(0,  this.size * 1.4);
        ctx.lineTo(-this.size, 0);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }
  }

  const particles = Array.from({ length: COUNT }, () => new Particle(true));
  let animating = true;
  let rafId;

  function animate() {
    if (!animating) return;
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => { p.update(); p.draw(); });
    rafId = requestAnimationFrame(animate);
  }
  animate();

  /* Pause confetti when hero is out of view */
  const hero = document.getElementById('hero');
  const heroObs = new IntersectionObserver(([entry]) => {
    animating = entry.isIntersecting;
    if (animating) {
      rafId = requestAnimationFrame(animate);
    } else {
      cancelAnimationFrame(rafId);
      ctx.clearRect(0, 0, W, H);
    }
  }, { threshold: 0 });
  heroObs.observe(hero);

  /* --- Contact form (demo handler) --- */
  const form      = document.getElementById('contact-form');
  const submitBtn = document.getElementById('submit-btn');

  if (form && submitBtn) {
    form.addEventListener('submit', e => {
      e.preventDefault();

      const email   = form.querySelector('#email').value.trim();
      const message = form.querySelector('#message').value.trim();

      if (!email || !message) {
        const missing = !email ? form.querySelector('#email') : form.querySelector('#message');
        missing.focus();
        missing.style.borderColor = '#cc4444';
        setTimeout(() => { missing.style.borderColor = ''; }, 2000);
        return;
      }

      submitBtn.classList.add('success');
      submitBtn.querySelector('.btn-text').textContent = 'Nachricht empfangen!';
      submitBtn.querySelector('.btn-icon').textContent = '✓';
      submitBtn.disabled = true;

      setTimeout(() => {
        submitBtn.classList.remove('success');
        submitBtn.querySelector('.btn-text').textContent = 'Nachricht senden';
        submitBtn.querySelector('.btn-icon').textContent = '✉️';
        submitBtn.disabled = false;
        form.reset();
      }, 3500);
    });

    /* Live validation feedback */
    form.querySelectorAll('input[required], textarea[required]').forEach(field => {
      field.addEventListener('blur', () => {
        if (field.value.trim()) {
          field.style.borderColor = 'rgba(80,180,80,0.5)';
        } else {
          field.style.borderColor = '';
        }
      });
      field.addEventListener('input', () => {
        field.style.borderColor = '';
      });
    });
  }

})();
