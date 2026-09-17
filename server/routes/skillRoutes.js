/**
 * routes/skillRoutes.js — Skill Catalog & Custom Skills API Routes
 *
 * GET  /api/skills         (public)
 * POST /api/skills/custom  (protected)
 */

const express = require('express');
const router = express.Router();
const { getSkills, addCustomSkill } = require('../controllers/skillController');
const { protect } = require('../middleware/auth');

// Public catalog listing with optional category & search filters
router.get('/', getSkills);

// Protected custom skill registration
router.post('/custom', protect, addCustomSkill);

module.exports = router;
