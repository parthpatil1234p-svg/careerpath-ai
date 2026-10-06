/**
 * main.js - CareerPath AI Landing Page Controller
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
// 1. Navbar - Add 'scrolled' class on scroll for background state
// ============================================================
const mainNav = document.getElementById('mainNav') || document.querySelector('.cp-navbar') || document.querySelector('.cp-navbar-notch');

if (mainNav) {
  window.addEventListener('scroll', () => {
    if (window.scrollY > 30) {
      mainNav.classList.add('scrolled');
    } else {
      mainNav.classList.remove('scrolled');
    }
  }, { passive: true });
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
// 5. Mobile Navigation - Auto close on item click
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
// 6. Domain Switcher Filter for Careers Catalog
// ============================================================
function initDomainFilter() {
  const domainFilterBar = document.getElementById('domainFilterBar');
  if (!domainFilterBar) return;

  const tabButtons = domainFilterBar.querySelectorAll('.domain-tab-btn');
  const trackBlocks = document.querySelectorAll('.domain-track-block');

  tabButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-target');

      // Update active state on buttons
      tabButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      if (target === 'all') {
        trackBlocks.forEach((block) => {
          block.classList.remove('d-none');
          block.style.opacity = '1';
        });
      } else {
        trackBlocks.forEach((block) => {
          const blockDomain = block.getAttribute('data-domain');
          if (blockDomain === target) {
            block.classList.remove('d-none');
            block.style.opacity = '1';
          } else {
            block.classList.add('d-none');
          }
        });
      }
    });
  });
}

// ============================================================
// 7. Adaptive Recruiter Landing Experience (when viewing ?view=public)
// ============================================================
function initRecruiterLandingExperience() {
  if (!window.Auth?.isAuthenticated() || !window.Auth?.isRecruiter()) return;
  const user = window.Auth.getCurrentUser();
  if (!user) return;

  const escapeFn = window.escapeHtml || function(str) { return str || ''; };

  // 1. Sleek top floating session bar
  if (!document.getElementById('recruiterActiveSessionBar')) {
    const banner = document.createElement('div');
    banner.id = 'recruiterActiveSessionBar';
    banner.className = 'recruiter-session-banner py-2 px-3 text-white border-bottom border-primary d-flex align-items-center justify-content-between flex-wrap gap-2';
    banner.style.cssText = 'position: relative; z-index: 1050; background: linear-gradient(90deg, #0F172A 0%, #1E293B 100%) !important; box-shadow: 0 4px 12px rgba(0,0,0,0.15);';
    banner.innerHTML = `
      <div class="d-flex align-items-center gap-2 small flex-wrap">
        <span class="badge bg-primary text-white px-2 py-1"><i class="bi bi-briefcase-fill me-1"></i> Recruiter Mode</span>
        <span class="text-light">Logged in as <strong>${escapeFn(user.name || 'Recruiter')}</strong> ${user.recruiterProfile?.companyName ? `(${escapeFn(user.recruiterProfile.companyName)})` : ''}</span>
        <span class="text-white-50 d-none d-md-inline">&middot; Public Landing Preview Active</span>
      </div>
      <div class="d-flex align-items-center gap-2">
        <a href="recruiter-dashboard.html" class="btn cp-btn-primary btn-sm py-1 px-3 d-inline-flex align-items-center gap-1.5" style="font-size: 0.8rem;">
          <i class="bi bi-speedometer2"></i> Return to Recruiter Dashboard &rarr;
        </a>
      </div>
    `;
    document.body.insertBefore(banner, document.body.firstChild);
  }

  // 2. Adapt Hero CTAs
  const startBtn = document.getElementById('startAssessmentBtn');
  if (startBtn) {
    startBtn.setAttribute('href', 'recruiter-dashboard.html');
    const label = startBtn.querySelector('.rg-label');
    if (label) {
      label.innerHTML = '<i class="bi bi-briefcase-fill me-2"></i> Go to Recruiter Dashboard';
    }
  }

  const startNavBtn = document.getElementById('startAssessmentNavBtn');
  if (startNavBtn) {
    startNavBtn.setAttribute('href', 'recruiter-dashboard.html');
    startNavBtn.innerHTML = '<i class="bi bi-speedometer2 me-1"></i> Recruiter Portal';
  }

  // 3. Secondary CTA adaptation
  const secondaryHeroCta = document.querySelector('.hero-actions a.btn.cp-btn-outline');
  if (secondaryHeroCta) {
    secondaryHeroCta.setAttribute('href', 'recruiter-dashboard.html#postJobModal');
    secondaryHeroCta.innerHTML = '<i class="bi bi-plus-circle me-1.5"></i> Post Job Opening';
  }

  // 4. Subtitle helper note adaptation
  const heroNote = document.querySelector('.hero-text-col p.small.text-secondary');
  if (heroNote) {
    heroNote.innerHTML = '<span class="text-teal fw-medium"><i class="bi bi-building-check me-1"></i> Recruiter Preview Active &middot; Switch between candidates, radar, and postings.</span>';
  }
}

// ============================================================
// Init
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  window.Auth?.initNav();
  initScrollAnimations();
  initCareerCards();
  initMobileNavClose();
  initDomainFilter();
  initRecruiterLandingExperience();

  console.log(
    '%cCareerPath AI | Career Atlas',
    'color: #167D8D; font-size: 16px; font-weight: bold;'
  );
  console.log(
    '%cCareerPath AI | Next-Gen AI Career Intelligence Platform',
    'color: #4F46E5; font-size: 12px;'
  );
});
// ============================================================
// 6. Global Unhandled Promise Rejection - suppress non-critical noise
//    (Cloudinary CDN prefetch, optional analytics, network flakes)
// ============================================================
window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason;
  const msg = reason?.message || String(reason) || '';
  // Allow real errors to surface; suppress known non-critical patterns
  const isBenign =
    msg.includes('cloudinary') ||
    msg.includes('NetworkError') ||
    msg.includes('Failed to fetch') ||
    msg.includes('Load failed') ||
    msg.includes('AbortError');
  if (isBenign) {
    event.preventDefault(); // Prevents "Uncaught (in promise)" in console
  }
});
