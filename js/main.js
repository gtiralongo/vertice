/* ============================================================
   VÉRTICE GIN DE PUEBLO — Main JavaScript
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  // ---- Age Gate ----
  const ageGate = document.getElementById('age-gate');
  const verifyAge = document.getElementById('verify-age');
  const denyAge = document.getElementById('deny-age');

  if (ageGate && verifyAge) {
    const ageVerified = sessionStorage.getItem('vertice-age-verified');
    if (ageVerified) {
      ageGate.classList.add('age-gate--hidden');
    } else {
      ageGate.classList.remove('age-gate--hidden');
      document.body.style.overflow = 'hidden';
    }
    verifyAge.addEventListener('click', () => {
      sessionStorage.setItem('vertice-age-verified', 'true');
      ageGate.classList.add('age-gate--hidden');
      document.body.style.overflow = '';
    });
    if (denyAge) {
      denyAge.addEventListener('click', () => {
        window.location.href = 'https://www.google.com';
      });
    }
  }

  // ---- Header scroll effect ----
  const header = document.querySelector('.header');
  let lastScroll = 0;
  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    if (scrollY > 50) {
      header.classList.add('header--scrolled');
    } else {
      header.classList.remove('header--scrolled');
    }
    lastScroll = scrollY;
  }, { passive: true });

  // ---- Mobile Nav ----
  const hamburger = document.querySelector('.hamburger');
  const nav = document.querySelector('.header__nav');
  const overlay = document.querySelector('.nav-overlay');

  function toggleNav(open) {
    if (open === undefined) {
      const isOpen = nav.classList.contains('header__nav--open');
      open = !isOpen;
    }
    nav.classList.toggle('header__nav--open', open);
    hamburger.classList.toggle('hamburger--open', open);
    if (overlay) overlay.classList.toggle('nav-overlay--visible', open);
    document.body.style.overflow = open ? 'hidden' : '';
  }

  if (hamburger) {
    hamburger.addEventListener('click', () => toggleNav());
  }
  if (overlay) {
    overlay.addEventListener('click', () => toggleNav(false));
  }

  // Close nav on link click
  nav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => toggleNav(false));
  });

  // ---- Active nav link ----
  const currentFile = window.location.pathname.split('/').pop() || 'index.html';
  nav.querySelectorAll('a').forEach(link => {
    const href = link.getAttribute('href');
    if (!href || href === '#' || href.startsWith('http') || href.startsWith('wa.')) return;
    if (href === '/' || href === '../') {
      if (currentFile === '' || currentFile === 'index.html') link.classList.add('active');
      return;
    }
    const linkFile = href.split('/').pop();
    if (linkFile && linkFile === currentFile) link.classList.add('active');
  });

  // ---- Scroll animations (Intersection Observer) ----
  const fadeElements = document.querySelectorAll('.fade-in');
  if (fadeElements.length > 0) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('fade-in--visible');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });
    fadeElements.forEach(el => observer.observe(el));
  }

  // ---- WhatsApp click tracking ----
  document.querySelectorAll('[data-wa]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const message = btn.dataset.waMessage || 'Hola Vértice! Quiero consultar por el gin.';
      const phone = btn.dataset.waPhone || '549XXXXXXXXXX';
      const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
      window.open(url, '_blank');

      // GA4 event (if gtag exists)
      if (typeof gtag === 'function') {
        gtag('event', 'click_whatsapp', {
          'button_location': btn.dataset.waLocation || 'generic',
          'button_text': btn.innerText.trim()
        });
      }
    });
  });

  // ---- Newsletter form ----
  const newsletterForm = document.getElementById('newsletter-form');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = newsletterForm.querySelector('input[type="email"]');
      const email = input.value.trim();
      if (!email) return;

      const btn = newsletterForm.querySelector('button');
      const originalText = btn.innerText;
      btn.disabled = true;
      btn.innerText = 'Enviando...';

      // Simulate submission — replace with Formspree / etc.
      setTimeout(() => {
        btn.innerText = '¡Gracias! Te escribimos pronto 🧉';
        btn.classList.remove('btn--cobre');
        btn.classList.add('btn--wa');
        input.value = '';
        setTimeout(() => {
          btn.disabled = false;
          btn.innerText = originalText;
          btn.classList.remove('btn--wa');
          btn.classList.add('btn--cobre');
        }, 3000);
      }, 1200);
    });
  }

  // ---- Lazy load images ----
  const lazyImages = document.querySelectorAll('img[data-src]');
  if (lazyImages.length > 0) {
    const imgObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
          imgObserver.unobserve(img);
        }
      });
    }, { rootMargin: '200px' });
    lazyImages.forEach(img => imgObserver.observe(img));
  }
});