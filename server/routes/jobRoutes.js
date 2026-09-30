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

const { protect } = require('../middleware/authMiddleware');
const User = require('../models/User');
const Roadmap = require('../models/Roadmap');
const RoadmapTask = require('../models/RoadmapTask');

/**
 * GET /api/jobs/matched-for-user
 * Fetches real jobs and computes Match % against candidate's verified skills
 */
router.get('/matched-for-user', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const activeRoadmap = await Roadmap.findOne({ user: req.user._id, status: 'active' }).populate('career');
    const careerSlug = activeRoadmap?.career?.slug || 'front-end-developer';

    const jobsData = await getJobsForCareer(careerSlug, { limit: 8 });
    const userSkillsMap = new Map();
    (user?.skills || []).forEach(s => {
      userSkillsMap.set((s.name || '').toLowerCase(), s);
    });

    const evaluatedJobs = (jobsData.jobs || []).map(job => {
      const jobTags = (job.tags || []).map(t => String(t).toLowerCase());
      if (jobTags.length === 0) {
        return { ...job, matchPercentage: 80, matchedTags: [], missingTags: [] };
      }

      let matches = 0;
      const matchedTags = [];
      const missingTags = [];

      jobTags.forEach(tag => {
        const uSkill = userSkillsMap.get(tag);
        if (uSkill) {
          const isVer = uSkill.isCodeVerified || uSkill.isQuizVerified;
          matches += (isVer ? 1.0 : 0.7);
          matchedTags.push({
            name: tag,
            isVerified: Boolean(isVer),
            tier: uSkill.verificationTier || (isVer ? 'quiz_verified' : 'self_rated')
          });
        } else {
          missingTags.push(tag);
        }
      });

      const rawPct = Math.round((matches / jobTags.length) * 100);
      const matchPercentage = Math.min(98, Math.max(45, rawPct));

      return {
        ...job,
        matchPercentage,
        matchedTags,
        missingTags
      };
    });

    // Sort by highest match %
    evaluatedJobs.sort((a, b) => b.matchPercentage - a.matchPercentage);

    return res.status(200).json({
      success: true,
      message: 'Personalized matched jobs with exact match percentages',
      data: {
        total: evaluatedJobs.length,
        jobs: evaluatedJobs,
        careerTitle: activeRoadmap?.career?.title || 'Developer'
      }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/jobs/bridge-gap
 * Injects a 1-week learning micro-task for a missing job skill into student's active roadmap
 */
router.post('/bridge-gap', protect, async (req, res, next) => {
  try {
    const { skillName, jobTitle } = req.body;
    if (!skillName) {
      return res.status(400).json({ success: false, message: 'Skill name is required to bridge the gap.' });
    }

    const roadmap = await Roadmap.findOne({ user: req.user._id, status: 'active' });
    if (!roadmap) {
      return res.status(404).json({ success: false, message: 'No active roadmap found. Please generate a roadmap first.' });
    }

    const existingTasks = await RoadmapTask.find({ roadmap: roadmap._id });
    const maxOrder = existingTasks.length > 0 ? Math.max(...existingTasks.map(t => t.order || 1)) : 1;
    const currentWeek = 1; // place in current week for immediate focus

    const newTask = await RoadmapTask.create({
      roadmap: roadmap._id,
      weekNumber: currentWeek,
      order: maxOrder + 1,
      title: `Bridge the Gap: Master ${skillName.toUpperCase()}`,
      description: `Targeted industry requirement for "${jobTitle || 'High-Match Tech Role'}". Complete hands-on tutorials and build a proof project.`,
      type: 'learn',
      skillName: skillName.toLowerCase(),
      priority: 'high',
      estimatedHours: 4,
      resource: {
        title: `${skillName} Official Documentation & Guides`,
        url: `https://developer.mozilla.org/en-US/search?q=${encodeURIComponent(skillName)}`,
        provider: 'MDN / Documentation'
      },
      completed: false
    });

    roadmap.totalTasks = existingTasks.length + 1;
    roadmap.progressPercentage = Math.round((roadmap.completedTasks / roadmap.totalTasks) * 100);
    await roadmap.save();

    return res.status(201).json({
      success: true,
      message: `🎯 Gap bridged! Added "${newTask.title}" to Week 1 of your active roadmap.`,
      data: {
        task: newTask,
        roadmap: {
          totalTasks: roadmap.totalTasks,
          completedTasks: roadmap.completedTasks,
          progressPercentage: roadmap.progressPercentage
        }
      }
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
