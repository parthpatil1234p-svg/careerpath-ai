/**
 * routes/jobRoutes.js — AI Dev Board Live Jobs API Routes
 * Team 404 Brain Not Found · Hack2Ignite 2026–27
 */

const express = require('express');
const router = express.Router();
const { getJobsForCareer, searchLiveJobs, searchAdzunaJobs, matchJobsWithSkills } = require('../services/jobBoardService');

/**
 * GET /api/jobs/adzuna
 * Direct real-time job search via Adzuna API (India localized tech hiring)
 */
router.get('/adzuna', async (req, res, next) => {
  try {
    const { q, country, limit } = req.query;
    const jobs = await searchAdzunaJobs({
      query: q || 'developer',
      country: country || 'in',
      limit: parseInt(limit, 10) || 8
    });
    return res.status(200).json({
      success: true,
      message: 'Adzuna real-time job openings',
      data: { total: jobs ? jobs.length : 0, jobs: jobs || [] }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/jobs/career/:slug
 * Fetches live tech & AI jobs mapped to a specific recommended career path
 * e.g., /api/jobs/career/front-end-developer?globalRemote=true
 */
router.get('/career/:slug', async (req, res, next) => {
  try {
    const { slug } = req.params;
    const globalRemote = req.query.globalRemote === 'true';
    const limit = parseInt(req.query.limit, 10) || 8;

    const data = await getJobsForCareer(slug, { globalRemote, limit });
    return res.status(200).json({
      success: true,
      message: `Live market opportunities for ${slug}`,
      data
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/jobs
 * General job search filter
 */
router.get('/', async (req, res, next) => {
  try {
    const { q, tags, workplace, level } = req.query;
    const globalRemote = req.query.globalRemote === 'true';
    const limit = parseInt(req.query.limit, 10) || 10;

    const result = await searchLiveJobs({
      query: q || '',
      tags: tags || '',
      workplace: workplace || '',
      globalRemote,
      level: level || '',
      limit
    });

    return res.status(200).json({
      success: true,
      message: 'Active developer job listings',
      data: result || { total: 0, jobs: [] }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/jobs/match
 * Matches jobs against user skills array
 */
router.post('/match', async (req, res, next) => {
  try {
    const { skills, workplace, limit } = req.body;
    const result = await matchJobsWithSkills(skills, {
      workplace: workplace || 'remote',
      limit: limit || 6
    });

    return res.status(200).json({
      success: true,
      message: 'Matched live job opportunities',
      data: result
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
