/**
 * firebase-config.js — Dynamic Firebase Client SDK Initializer
 *
 * Automatically fetches Firebase configuration from server environment (.env)
 * via GET /api/config/firebase.
 * Keeps all secrets and keys centralized in server/.env with zero frontend hardcoding.
 */

(function () {
  window.initFirebaseConfig = async function () {
    if (window.FIREBASE_CONFIG && window.FIREBASE_CONFIG.apiKey && window.firebaseApp) {
      return window.FIREBASE_CONFIG;
    }

    try {
      const isLocal =
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1' ||
        window.location.hostname === '';

      const apiBase = (window.CONFIG && window.CONFIG.API_BASE_URL)
        ? window.CONFIG.API_BASE_URL
        : (isLocal ? 'http://localhost:5000/api' : 'https://careerpath-ai-bdbt.onrender.com/api');

      const res = await fetch(`${apiBase}/config/firebase`);
      const payload = await res.json();

      if (payload.success && payload.data?.apiKey) {
        window.FIREBASE_CONFIG = payload.data;

        // Initialize compat SDK if script tag is present on page
        if (typeof firebase !== 'undefined') {
          if (!firebase.apps || !firebase.apps.length) {
            const app = firebase.initializeApp(window.FIREBASE_CONFIG);
            window.firebaseApp = app;

            if (typeof firebase.analytics === 'function' && window.FIREBASE_CONFIG.measurementId) {
              window.firebaseAnalytics = firebase.analytics();
            }
            if (typeof firebase.storage === 'function') {
              window.firebaseStorage = firebase.storage();
            }
            console.log('✅ Firebase SDK initialized dynamically from server .env (login-register-fc09e).');
          }
        }

        return window.FIREBASE_CONFIG;
      }
    } catch (err) {
      console.warn('Notice: Firebase config could not be fetched from /api/config/firebase:', err.message);
    }

    return window.FIREBASE_CONFIG;
  };

  // Run automatically when script is parsed
  window.initFirebaseConfig();
})();
