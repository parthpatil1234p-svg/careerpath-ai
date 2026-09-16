/**
 * main.js — CareerPath AI Landing Page Controller
 *
 * Handles:
 *  - Navbar scroll elevation
 *  - Internal anchor link smooth scrolling
 *  - Viewport entry animations using IntersectionObserver
 *  - Career card interaction (navigates to assessment)
 *  - Mobile navbar collapse behavior
 *  - Mounts Career Atlas 3D Compass
 */

// ============================================================
// 1. Navbar — Add 'scrolled' class on scroll for background state
// ============================================================
const mainNav = document.getElementById('mainNav');

if (mainNav) {
  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      mainNav.classList.add('scrolled');
    } else {
      mainNav.classList.remove('scrolled');
    }
  });
}

// ============================================================
// 2. Smooth Scroll for internal anchor links
// ============================================================
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener('click', function (e) {
    const targetId = this.getAttribute('href');
    if (targetId === '#') return;

    const targetEl = document.querySelector(targetId);
    if (targetEl) {
      e.preventDefault();
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

// ============================================================
// 3. Scroll Animations for Cards and Sections
// ============================================================
function initScrollAnimations() {
  const animatableElements = document.querySelectorAll(
    '.step-card, .career-card, .deliverable-item, .section-header'
  );

  if (!animatableElements.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.1,
      rootMargin: '0px 0px -30px 0px',
    }
  );

  animatableElements.forEach((el) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(16px)';
    el.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
    observer.observe(el);
  });
}

// ============================================================
// 4. Career Card Interaction
// ============================================================
function initCareerCards() {
  const careerCards = document.querySelectorAll('.career-card');

  careerCards.forEach((card) => {
    card.addEventListener('click', (e) => {
      // If clicking directly on a link inside the card, let default occur
      if (e.target.closest('a')) return;

      const careerSlug = card.getAttribute('data-career');
      if (careerSlug) {
        window.location.href = `assessment.html?career=${careerSlug}`;
      }
    });

    card.setAttribute('tabindex', '0');
    card.setAttribute('role', 'button');
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        card.click();
      }
    });
  });
}

// ============================================================
// 5. Mobile Navigation — Auto close on item click
// ============================================================
function initMobileNavClose() {
  const navLinks = document.querySelectorAll('.navbar-nav .nav-link');
  const navCollapse = document.getElementById('navMenu');

  if (!navCollapse) return;

  navLinks.forEach((link) => {
    link.addEventListener('click', () => {
      if (navCollapse.classList.contains('show') && typeof bootstrap !== 'undefined') {
        const bsCollapse = bootstrap.Collapse.getInstance(navCollapse);
        if (bsCollapse) bsCollapse.hide();
      }
    });
  });
}

// ============================================================
// Init
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  window.Auth?.initNav();
  initScrollAnimations();
  initCareerCards();
  initMobileNavClose();

  // Initialize 3D Career Atlas Compass
  if (typeof window.initCareerUniverse === 'function') {
    window.initCareerUniverse('careerUniverse');
  }

  console.log(
    '%cCareerPath AI · Career Atlas',
    'color: #167D8D; font-size: 16px; font-weight: bold;'
  );
  console.log(
    '%cTeam 404 Brain Not Found · CareerPath AI Platform',
    'color: #1C355E; font-size: 12px;'
  );
});
