/**
 * api.js — Reusable API Client Helper
 *
 * Wraps browser fetch() to automatically attach Bearer token, handle JSON
 * payloads, parse standardised API responses, and handle HTTP errors.
 */

const API = {
  /**
   * Generic request dispatcher
   *
   * @param {string} endpoint - e.g. '/careers', '/assessment', '/auth/login'
   * @param {Object} options - { method, body, auth, query }
   * @returns {Promise<Object>} API JSON payload
   */
  async request(endpoint, { method = 'GET', body = null, auth = false, query = null } = {}) {
    const baseUrl = window.CONFIG?.API_BASE_URL || 'http://localhost:5000/api';
    let url = `${baseUrl}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;

    // Append query parameters if provided
    if (query && typeof query === 'object') {
      const searchParams = new URLSearchParams();
      Object.entries(query).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          searchParams.append(key, val);
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        url += (url.includes('?') ? '&' : '?') + queryString;
      }
    }

    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    // Attach JWT Bearer token if required or available
    const token = window.Auth?.getToken();
    if (token && auth !== false) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const fetchConfig = {
      method: method.toUpperCase(),
      headers,
    };

    if (body && ['POST', 'PUT', 'PATCH'].includes(fetchConfig.method)) {
      fetchConfig.body = JSON.stringify(body);
    }

    let warmupTimer = null;
    let warmupToast = null;
    if (!window._serverIsWarm) {
      warmupTimer = setTimeout(() => {
        if (!document.getElementById('cold-start-banner') && document.body) {
          warmupToast = document.createElement('div');
          warmupToast.id = 'cold-start-banner';
          warmupToast.className = 'position-fixed bottom-0 start-50 translate-middle-x mb-4 px-3 py-2 rounded-pill shadow-lg border border-warning bg-dark text-white font-mono small d-flex align-items-center gap-2';
          warmupToast.style.zIndex = '99999';
          warmupToast.innerHTML = '<span class="spinner-border spinner-border-sm text-warning" role="status"></span><span>⚡ Cloud backend is waking up from sleep (Render cold-start)... Hang tight!</span>';
          document.body.appendChild(warmupToast);
        }
      }, 2500);
    }

    try {
      let response;
      try {
        response = await fetch(url, fetchConfig);
      } catch (fetchErr) {
        // If local backend is offline, gracefully failover to live Render cloud backend
        if (url.includes('localhost:5000') || url.includes('127.0.0.1:5000')) {
          console.warn('⚠️ Local backend at localhost:5000 is offline. Failing over to live Render cloud backend...');
          const cloudUrl = url.replace(/https?:\/\/(localhost|127\.0\.0\.1):5000\/api/, 'https://careerpath-ai-bdbt.onrender.com/api');
          response = await fetch(cloudUrl, fetchConfig);
        } else {
          throw fetchErr;
        }
      }

      const data = await response.json().catch(() => ({
        success: false,
        message: `HTTP ${response.status} ${response.statusText || ''}`.trim(),
      }));

      // Handle 401 Unauthorized globally
      if (response.status === 401) {
        if (auth && window.Auth?.isAuthenticated()) {
          console.warn('Session expired or invalid token — logging out');
          window.Auth.logout();
        }
      }

      if (!response.ok) {
        const errorMsg =
          data.message ||
          data.error?.message ||
          (typeof data.error === 'string' ? data.error : null) ||
          (response.status ? `HTTP ${response.status} Error` : 'API request failed');
        const error = new Error(errorMsg);
        error.status = response.status;
        error.errors = data.errors || [];
        error.data = data;
        throw error;
      }

      window._serverIsWarm = true;
      return data;
    } catch (err) {
      // Re-throw structured error for catch blocks in UI scripts
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        const networkErr = new Error(`Cannot connect to backend (${baseUrl}). If using free tier Render, it may take ~30 seconds to wake up from cold sleep.`);
        networkErr.isNetworkError = true;
        throw networkErr;
      }
      throw err;
    } finally {
      if (warmupTimer) clearTimeout(warmupTimer);
      const toastEl = document.getElementById('cold-start-banner');
      if (toastEl) toastEl.remove();
    }
  },

  /**
   * Pre-warm Render backend on initial frontend page load
   */
  warmup() {
    try {
      const baseUrl = window.CONFIG?.API_BASE_URL || 'http://localhost:5000/api';
      const rootUrl = baseUrl.replace(/\/api\/?$/, '');
      fetch(`${rootUrl}/health`, { method: 'GET', cache: 'no-store', mode: 'cors' })
        .then(res => res.json())
        .then(data => {
          if (data?.status === 'healthy') {
            window._serverIsWarm = true;
            console.log('⚡ CareerPath AI backend is awake and ready.');
          }
        })
        .catch(() => {});
    } catch (_) {}
  },

  // Convenience verbs
  get(endpoint, { auth = false, query = null } = {}) {
    return this.request(endpoint, { method: 'GET', auth, query });
  },

  post(endpoint, body, { auth = false } = {}) {
    return this.request(endpoint, { method: 'POST', body, auth });
  },

  put(endpoint, body, { auth = false } = {}) {
    return this.request(endpoint, { method: 'PUT', body, auth });
  },

  patch(endpoint, body, { auth = false } = {}) {
    return this.request(endpoint, { method: 'PATCH', body, auth });
  },

  delete(endpoint, { auth = false } = {}) {
    return this.request(endpoint, { method: 'DELETE', auth });
  },
};

window.API = API;

// Trigger pre-warm immediately when script loads in browser
if (typeof window !== 'undefined') {
  API.warmup();
}
