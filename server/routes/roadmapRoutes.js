/**
 * routes/roadmapRoutes.js — Roadmap & Task Execution Endpoints
 *
 * Mounted at: /api/roadmaps (in server.js)
 *
 * All routes require authentication:
 *   POST   /api/roadmaps/generate          → generateRoadmap
 *   GET    /api/roadmaps/current           → getCurrentRoadmap
 *   PATCH  /api/roadmaps/tasks/:taskId/toggle → toggleTask
 *   DELETE /api/roadmaps/current           → archiveRoadmap
 */

const express = require('express');
const router = express.Router();
const { protect, requireSkillVerification } = require('../middleware/authMiddleware');
const {
  validateRoadmapGeneration,
  validateTaskId,
} = require('../middleware/validateRequest');
const {
  generateRoadmap,
  getCurrentRoadmap,
  toggleTask,
  archiveRoadmap,
  linkProjectRepo,
} = require('../controllers/roadmapController');

router.post('/generate', protect, requireSkillVerification, validateRoadmapGeneration, generateRoadmap);
router.get('/current', protect, requireSkillVerification, getCurrentRoadmap);
router.patch('/tasks/:taskId/toggle', protect, validateTaskId, toggleTask);
router.post('/tasks/:taskId/link-repo', protect, validateTaskId, linkProjectRepo);
router.delete('/current', protect, archiveRoadmap);

module.exports = router;
