/**
 * routes/authRoutes.js — Authentication Endpoints
 *
 * Mounted at: /api/auth  (in server.js)
 *
 * Routes:
 *   POST /api/auth/register     → validateRegister → registerUser
 *   POST /api/auth/verify-otp   → verifyOtp
 *   POST /api/auth/resend-otp   → resendOtp
 *   POST /api/auth/login        → validateLogin    → loginUser
 */

const express = require('express');

const { registerUser, verifyOtp, resendOtp, loginUser, googleAuth, getGoogleConfig } = require('../controllers/authController');
const { validateRegister, validateLogin }               = require('../middleware/validateRequest');

const router = express.Router();

// POST /api/auth/register
router.post('/register', validateRegister, registerUser);

// POST /api/auth/verify-otp
router.post('/verify-otp', verifyOtp);

// POST /api/auth/resend-otp
router.post('/resend-otp', resendOtp);

// POST /api/auth/login
router.post('/login', validateLogin, loginUser);

// POST /api/auth/google — Google OAuth2 Sign-In & Sign-Up
router.post('/google', googleAuth);

// GET /api/auth/google/config — Public Google Client ID
router.get('/google/config', getGoogleConfig);

module.exports = router;
