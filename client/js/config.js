/**
 * config.js — Frontend Global Configuration
 *
 * Provides centralized API endpoint and runtime settings for CareerPath AI.
 * Automatically switches between local development and production Render backend.
 *
 * ⚠️ PRODUCTION DEPLOYMENT NOTE:
 * When deploying the frontend to Vercel and backend to Render:
 * 1. Replace "YOUR-RENDER-SERVICE" below with your actual deployed Render service slug.
 *    Example: "https://careerpath-ai-api.onrender.com/api"
 * 2. Do not include a trailing slash after "/api".
 */

(function () {
  // Detect local environment based on browser hostname
  const isLocal =
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname === '';

  // Local development backend URL
  const LOCAL_API_URL = 'http://localhost:5000/api';

  // Production Render backend URL
  const PRODUCTION_API_URL = 'https://careerpath-ai-bdbt.onrender.com/api';

  const CONFIG = {
    // Active API Base URL
    API_BASE_URL: isLocal ? LOCAL_API_URL : PRODUCTION_API_URL,

    // Storage keys in localStorage
    TOKEN_KEY: 'careerpath_token',
    USER_KEY: 'careerpath_user',

    // Google OAuth 2.0 Web Client ID
    GOOGLE_CLIENT_ID: '775964648976-uch5uo5ho5185b4sqsuaknkpc2r64g27.apps.googleusercontent.com',

    // GitHub OAuth 2.0 Web Client ID
    GITHUB_CLIENT_ID: 'Ov23liphgi9YF1lbYiUa',

    // App Metadata
    APP_NAME: 'CareerPath AI',
    TAGLINE: 'Autonomous Career GPS & Verified Talent Operating System',
    PLATFORM_NAME: 'CareerPath AI',
    COMPANY_NAME: 'CareerPath AI Technologies Inc.',
    TEAM_NAME: 'CareerPath AI Technologies Inc.',
    EDITION: 'Enterprise Edition 2026',
    VERSION: '2.5.0',
  };

    // Expose to window for vanilla JS scripts
    window.CONFIG = CONFIG;

    // Vercel Web Analytics (@vercel/analytics) Universal Queue & Event Tracker
    window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };
    window.trackVercelEvent = function (name, data) {
      try {
        if (typeof window !== 'undefined' && window.va) {
          window.va('event', { name, data: data || {} });
        }
      } catch (err) {
        console.debug('[Vercel Analytics]', err);
      }
    };

    // Universal Notch Navbar Scroll Elevation
    if (typeof window !== 'undefined') {
      window.addEventListener('scroll', () => {
        const notch = document.querySelector('.cp-navbar-notch');
        if (notch) {
          if (window.scrollY > 25) {
            notch.classList.add('scrolled');
          } else {
            notch.classList.remove('scrolled');
          }
        }
      }, { passive: true });
    }
  })();

