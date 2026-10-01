/**
 * auth.js — Client-Side Authentication State & Helpers
 *
 * Manages JWT storage, active user persistence, route protection, and logout.
 */

const Auth = {
  /**
   * Retrieves the stored JWT token
   * @returns {string|null}
   */
  getToken() {
    return localStorage.getItem(window.CONFIG?.TOKEN_KEY || 'careerpath_token');
  },

  /**
   * Stores the JWT token
   * @param {string} token
   */
  setToken(token) {
    if (token) {
      localStorage.setItem(window.CONFIG?.TOKEN_KEY || 'careerpath_token', token);
    }
  },

  /**
   * Removes the JWT token
   */
  removeToken() {
    localStorage.removeItem(window.CONFIG?.TOKEN_KEY || 'careerpath_token');
  },

  /**
   * Retrieves stored user summary object
   * @returns {Object|null}
   */
  getCurrentUser() {
    const raw = localStorage.getItem(window.CONFIG?.USER_KEY || 'careerpath_user');
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  /**
   * Retrieves stored user summary object (alias for getCurrentUser)
   * @returns {Object|null}
   */
  getUser() {
    return this.getCurrentUser();
  },

  /**
   * Getter property for user summary
   * @returns {Object|null}
   */
  get user() {
    return this.getCurrentUser();
  },

  /**
   * Stores user summary
   * @param {Object} user
   */
  setCurrentUser(user) {
    if (user) {
      localStorage.setItem(window.CONFIG?.USER_KEY || 'careerpath_user', JSON.stringify(user));
    }
  },

  /**
   * Checks if user has a valid active session
   * @returns {boolean}
   */
  isAuthenticated() {
    const token = this.getToken();
    return Boolean(token && token.trim() !== '');
  },

  /**
   * Alias for isAuthenticated()
   * @returns {boolean}
   */
  isLoggedIn() {
    return this.isAuthenticated();
  },

  /**
   * Guard for protected pages: redirects unauthenticated users to login.html
   */
  requireAuth() {
    if (!this.isAuthenticated()) {
      const currentPath = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.href = `login.html?redirect=${currentPath}`;
    }
  },

  /**
   * Checks whether the current user is an admin or demo user
   * @returns {boolean}
   */
  isAdmin() {
    const user = this.getCurrentUser();
    if (!user) return false;
    if (user.role === 'admin' || user.isAdmin || user.isDemo) return true;
    const email = (user.email || '').toLowerCase();
    return email === 'demouser@gmail.com' || email === 'kajimew275@blobapps.com' || email.includes('admin') || email.includes('demo');
  },

  isDemo() {
    return this.isAdmin();
  },

  /**
   * Checks whether the active user is a verified corporate recruiter
   * @returns {boolean}
   */
  isRecruiter() {
    const user = this.getCurrentUser();
    if (!user) return false;
    return user.role === 'recruiter' || Boolean(user.isRecruiter) || Boolean(user.recruiterProfile?.canPostJobs);
  },

  /**
   * Guard for recruiter-only pages: redirects students or unauthenticated users
   * @returns {boolean}
   */
  requireRecruiter() {
    this.requireAuth();
    if (!this.isRecruiter() && !this.isAdmin()) {
      window.location.href = 'dashboard.html';
      return false;
    }
    return true;
  },

  /**
   * Logs out the user by clearing localStorage and redirecting to login.html
   */
  logout() {
    this.removeToken();
    localStorage.removeItem(window.CONFIG?.USER_KEY || 'careerpath_user');
    window.location.href = 'login.html';
  },

  /**
   * Checks whether the active user has completed skill verification
   * (either via adaptive check or GitHub code verification)
   * @returns {boolean}
   */
  isSkillVerified() {
    if (this.isAdmin()) return true;
    const user = this.getCurrentUser();
    if (!user) return false;
    return Boolean(
      user.hasCompletedSkillVerification ||
      (Array.isArray(user.skills) && user.skills.some((s) => s.isQuizVerified || s.isCodeVerified))
    );
  },

  /**
   * Guard for skill-verified pages
   * @returns {boolean}
   */
  requireSkillVerification() {
    this.requireAuth();
    return this.isSkillVerified();
  },

  /**
   * Renders the high-aesthetic Skill Verification Gate into a target container
   * @param {HTMLElement} container
   * @param {string} pageName
   * @param {string} description
   */
  renderVerificationGate(container, pageName, description) {
    if (!container) return;
    const loadingEl = document.getElementById('loadingState') || document.getElementById('roadmapLoading');
    if (loadingEl) loadingEl.classList.add('d-none');

    container.classList.remove('d-none');
    container.innerHTML = `
      <div class="row justify-content-center py-5">
        <div class="col-lg-8 col-xl-7">
          <div class="card p-4 p-md-5 text-center shadow-lg border border-warning-subtle" 
               style="background: radial-gradient(circle at top, rgba(234, 179, 8, 0.09), transparent 70%), var(--bg-card); border-radius: 1.25rem;">
            <div class="mb-3">
              <span class="badge badge-gold fs-6 px-3 py-1.5 rounded-pill" style="font-family: var(--font-body);">
                <i class="bi bi-shield-lock-fill me-1"></i> Skill Verification Gate Active
              </span>
            </div>
            <div class="display-3 text-warning mb-3">
              <i class="bi bi-lock-fill"></i>
            </div>
            <h2 class="h3 fw-bold text-ink mb-2">${escapeHtml(pageName)} is Locked</h2>
            <p class="text-muted mb-4 lead" style="font-size: 1.05rem;">
              ${escapeHtml(description)} require verified skill data to generate. Complete <strong>"Prove your skills"</strong> in your assessment to earn your <strong>Account Verified ✓</strong> credential and unlock this page.
            </p>
            <div class="p-3 mb-4 rounded-3 stat-box-atlas text-start d-flex align-items-center gap-3 border border-line">
              <div class="rounded-circle p-2 bg-primary-subtle text-primary fs-4 flex-shrink-0">
                <i class="bi bi-lightning-charge-fill"></i>
              </div>
              <div>
                <div class="fw-semibold text-ink">90-Second Adaptive Check or GitHub Sync</div>
                <div class="small text-muted">Answer 5 quick adaptive questions or auto-sync your GitHub repositories to prove your skills and unlock all platform features.</div>
              </div>
            </div>
            <div class="d-flex justify-content-center gap-3 flex-wrap">
              <a href="assessment.html#proveSkillsPanel" class="btn cp-btn-primary px-4 py-2.5 fw-semibold d-inline-flex align-items-center gap-2">
                <i class="bi bi-shield-check"></i>
                <span>Prove Your Skills to Unlock</span>
                <i class="bi bi-arrow-right"></i>
              </a>
              <a href="index.html" class="btn btn-outline-secondary px-3 py-2.5">
                Back to Home
              </a>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  /**
   * Initializes navbar user state (displays username or login/signup buttons)
   */
  initNav() {
    const user = this.getCurrentUser();
    const authActions = document.getElementById('authNavActions');
    if (!authActions) return;

    if (this.isAuthenticated() && user) {
      const isVerified = this.isSkillVerified();

      const statusBadge = isVerified
        ? `<span class="badge badge-leaf d-inline-flex align-items-center gap-1.5 px-2.5 py-1 rounded-pill shadow-xs" style="font-family:var(--font-body);font-size:0.75rem;font-weight:600;letter-spacing:0.01em;" title="Account Verified — All pages unlocked">
             <i class="bi bi-patch-check-fill text-success" style="font-size:0.85rem;"></i>
             <span>Account Verified ✓</span>
           </span>`
        : `<a href="assessment.html#proveSkillsPanel" class="badge badge-gold d-inline-flex align-items-center gap-1.5 px-2.5 py-1 rounded-pill text-decoration-none shadow-xs" style="font-family:var(--font-body);font-size:0.75rem;font-weight:600;" title="Prove your skills to unlock Dashboard & Roadmaps">
             <i class="bi bi-lock-fill text-warning"></i>
             <span>Unverified · Prove Skills</span>
           </a>`;

      const unverifiedActionBtn = !isVerified
        ? `<a href="assessment.html#proveSkillsPanel" class="btn cp-btn-primary btn-sm px-3 d-inline-flex align-items-center gap-1 text-nowrap">
             <i class="bi bi-shield-check"></i>
             <span>Verify to Unlock</span>
           </a>`
        : '';

      authActions.innerHTML = `
        <div class="d-flex align-items-center gap-2">
          ${statusBadge}
          <a href="dashboard.html"
             class="d-none d-md-flex align-items-center gap-2 text-decoration-none text-nowrap"
             style="background:#EEF2FF;border:1px solid #C7D2FE;border-radius:20px;padding:0.32rem 0.85rem;transition:all var(--transition-fast);"
             title="Logged in as ${escapeHtml(user.name || 'Student')} · View Dashboard">
            <i class="bi bi-person-circle" style="color:#4F46E5;font-size:0.95rem;"></i>
            <span style="color:#1E1B4B;font-size:0.84rem;font-weight:600;font-family:var(--font-body);letter-spacing:0.01em;">${escapeHtml(user.name || 'Student')}</span>
          </a>
          ${unverifiedActionBtn}
          <button id="logoutBtn" class="btn btn-outline-danger btn-sm px-2.5 py-1 d-inline-flex align-items-center" onclick="Auth.logout()" title="Sign Out">
            <i class="bi bi-box-arrow-right"></i>
          </button>
        </div>
      `;

      const mobileActions = document.getElementById('notchMobileAuthActions');
      if (mobileActions) {
        mobileActions.innerHTML = `
          <div class="d-flex flex-column gap-2 w-100">
            <div class="d-flex justify-content-center">${statusBadge}</div>
            <div class="d-flex gap-2">
              <a class="btn cp-btn-primary btn-sm flex-grow-1 text-center" href="${isVerified ? 'dashboard.html' : 'assessment.html#proveSkillsPanel'}">
                <i class="bi ${isVerified ? 'bi-speedometer2' : 'bi-lock-fill'} me-1"></i> ${isVerified ? 'Dashboard' : 'Verify to Unlock'}
              </a>
              <button class="btn btn-outline-danger btn-sm px-3" onclick="Auth.logout()" title="Sign Out">
                <i class="bi bi-box-arrow-right"></i>
              </button>
            </div>
          </div>
        `;
      }
    }
  },
};

// Safe HTML escaper helper
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

window.Auth = Auth;

// Auto-initialize navbar on page load across all pages
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.Auth?.initNav();
  });
} else {
  window.Auth?.initNav();
}
