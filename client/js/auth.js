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
   * Guard for protected pages: redirects unauthenticated users to login.html
   */
  requireAuth() {
    if (!this.isAuthenticated()) {
      const currentPath = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.href = `login.html?redirect=${currentPath}`;
    }
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
   * Initializes navbar user state (displays username or login/signup buttons)
   */
  initNav() {
    const user = this.getCurrentUser();
    const authActions = document.getElementById('authNavActions');
    if (!authActions) return;

    if (this.isAuthenticated() && user) {
      authActions.innerHTML = `
        <div class="d-flex align-items-center gap-2">
          <a href="dashboard.html"
             class="d-none d-md-flex align-items-center gap-2 text-decoration-none text-nowrap"
             style="background:#EEF2FF;border:1px solid #C7D2FE;border-radius:20px;padding:0.35rem 0.9rem;"
             title="Logged in as ${escapeHtml(user.name || 'Student')}">
            <i class="bi bi-person-circle" style="color:#4F46E5;font-size:1rem;"></i>
            <span style="color:#1E1B4B;font-size:0.85rem;font-weight:600;letter-spacing:0.01em;">${escapeHtml(user.name || 'Student')}</span>
          </a>
          <a href="dashboard.html" class="btn cp-btn-primary btn-sm px-3 d-inline-flex align-items-center gap-1 text-nowrap">
            <i class="bi bi-speedometer2"></i>
            <span>Dashboard</span>
          </a>
          <button id="logoutBtn" class="btn btn-outline-danger btn-sm px-2 d-inline-flex align-items-center" onclick="Auth.logout()" title="Sign Out">
            <i class="bi bi-box-arrow-right"></i>
          </button>
        </div>
      `;

      const mobileActions = document.getElementById('notchMobileAuthActions');
      if (mobileActions) {
        mobileActions.innerHTML = `
          <a class="btn cp-btn-primary btn-sm flex-grow-1 text-center" href="dashboard.html">
            <i class="bi bi-speedometer2 me-1"></i> Dashboard (${escapeHtml(user.name || 'Student')})
          </a>
          <button class="btn btn-outline-danger btn-sm px-3" onclick="Auth.logout()" title="Sign Out">
            <i class="bi bi-box-arrow-right"></i>
          </button>
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
