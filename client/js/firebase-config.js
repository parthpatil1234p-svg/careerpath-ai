/**
 * firebase-config.js — Firebase Client SDK Configuration
 *
 * CareerPath AI — Cloud Storage & Services
 * Project: login-register-fc09e
 */

(function () {
  const firebaseConfig = {
    apiKey: "AIzaSyD-yGGkyr8gTxhpDHMCBoQj7e55dDZyios",
    authDomain: "login-register-fc09e.firebaseapp.com",
    projectId: "login-register-fc09e",
    storageBucket: "login-register-fc09e.firebasestorage.app",
    messagingSenderId: "425949432364",
    appId: "1:425949432364:web:7bb8c875e6225533549f89",
    measurementId: "G-LJ0QR4ZW5W"
  };

  // Expose configuration globally
  window.FIREBASE_CONFIG = firebaseConfig;

  // Initialize Firebase if compat SDK script tags are loaded
  if (typeof firebase !== 'undefined') {
    try {
      if (!firebase.apps || !firebase.apps.length) {
        const app = firebase.initializeApp(firebaseConfig);
        window.firebaseApp = app;
        if (typeof firebase.analytics === 'function') {
          window.firebaseAnalytics = firebase.analytics();
        }
        if (typeof firebase.storage === 'function') {
          window.firebaseStorage = firebase.storage();
        }
        console.log('✅ Firebase SDK initialized successfully (login-register-fc09e).');
      }
    } catch (err) {
      console.warn('Firebase initialization notice:', err.message);
    }
  }
})();
