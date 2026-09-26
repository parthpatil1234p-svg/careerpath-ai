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
             style="background:rgba(0,242,254,0.08);border:1px solid rgba(0,242,254,0.28);border-radius:20px;padding:0.3rem 0.9rem;"
             title="Logged in as ${escapeHtml(user.name || 'Student')}">
            <i class="bi bi-person-circle" style="color:#00F2FE;font-size:1rem;"></i>
            <span style="color:#E2E8F0;font-size:0.82rem;font-family:monospace;letter-spacing:0.02em;">${escapeHtml(user.name || 'Student')}</span>
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
