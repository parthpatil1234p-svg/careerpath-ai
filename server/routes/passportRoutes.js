/**
 * passportRoutes.js - Public Skill Passport Routes
 * Mounted at /api/passport
 */

const express = require('express');
const router = express.Router();
const { getPassportById } = require('../controllers/passportController');

// Public route for recruiters & public verification
router.get('/:id', getPassportById);

module.exports = router;
