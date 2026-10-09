/**
 * controllers/dashboardController.js — Unified Student Dashboard Controller
 *
 * GET /api/dashboard (protected)
 *
 * Consolidates user profile, active roadmap progress, first 5 upcoming tasks,
 * and contextual next recommended action.
 */

const User = require('../models/User');
const Roadmap = require('../models/Roadmap');
const RoadmapTask = require('../models/RoadmapTask');
const { evaluateJobReadyCertification } = require('../services/readinessService');
const { prisma } = require('../config/prisma');

// Short 15-second in-memory dashboard cache to eliminate redundant multi-second roundtrips
const DASHBOARD_CACHE_TTL_MS = 15000;
const dashboardCache = new Map();

function invalidateDashboardCache(userId) {
  if (userId) {
    dashboardCache.delete(String(userId));
  } else {
    dashboardCache.clear();
  }
}

/**
 * GET /api/dashboard
 * Retrieves comprehensive student dashboard telemetry with sub-second performance
 */
const getDashboard = async (req, res, next) => {
  try {
    const userId = String(req.user._id);
    const roadmapQueryId = req.query.roadmapId ? String(req.query.roadmapId) : null;
    const cacheKey = `${userId}:${roadmapQueryId || 'default'}`;

    // Fast-path: return cached response if valid
    const cachedEntry = dashboardCache.get(cacheKey);
    if (cachedEntry && Date.now() - cachedEntry.timestamp < DASHBOARD_CACHE_TTL_MS) {
      return res.status(200).json(cachedEntry.payload);
    }

    // 1. Fetch user and all active roadmaps (with upcoming tasks included) in ONE concurrent roundtrip
    const [user, allActiveRoadmaps] = await Promise.all([
      User.findById(req.user._id).select('-password').lean(),
      prisma.roadmap.findMany({
        where: { userId: req.user._id, status: 'active' },
        orderBy: { createdAt: 'desc' },
        include: {
          career: true,
          tasks: {
            where: { completed: false },
            orderBy: [{ weekNumber: 'asc' }, { order: 'asc' }],
            take: 5,
          },
        },
      }),
    ]);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found',
      });
    }

    // Determine target active roadmap (either from query or primary active)
    let activeRoadmap = null;
    if (roadmapQueryId) {
      activeRoadmap = allActiveRoadmaps.find(r => String(r.id || r._id) === roadmapQueryId);
    }
    if (!activeRoadmap && allActiveRoadmaps.length > 0) {
      activeRoadmap = allActiveRoadmaps[0];
    }

    const hasEducation =
      user.education &&
      user.education.course &&
      typeof user.education.course === 'string' &&
      user.education.course.trim() !== '';
    const hasInterest = Array.isArray(user.interests) && user.interests.length > 0;
    const hasSkill = Array.isArray(user.skills) && user.skills.length > 0;
    const isProfileComplete = Boolean(hasEducation && hasInterest && hasSkill);

    let roadmapData = null;
    let upcomingTasks = [];
    let nextRecommendedAction = '';

    if (!isProfileComplete) {
      nextRecommendedAction = 'Complete your assessment to discover your career path';
    } else if (!activeRoadmap) {
      // Check if user completed an archived/previous roadmap
      const completedRoadmap = await Roadmap.findOne({
        user: user._id,
        status: 'completed',
      }).sort({ completedAt: -1, updatedAt: -1 }).lean();

      if (completedRoadmap) {
        roadmapData = {
          id: completedRoadmap._id || completedRoadmap.id,
          _id: completedRoadmap._id || completedRoadmap.id,
          career: {
            title: completedRoadmap.careerSnapshot?.title || 'Graduated Track',
            slug: completedRoadmap.careerSnapshot?.slug || '',
            shortDescription: completedRoadmap.careerSnapshot?.shortDescription || '',
          },
          durationWeeks: completedRoadmap.durationWeeks,
          status: completedRoadmap.status,
          totalTasks: completedRoadmap.totalTasks,
          totalTasksCount: completedRoadmap.totalTasks,
          completedTasks: completedRoadmap.completedTasks,
          completedTasksCount: completedRoadmap.completedTasks,
          progressPercentage: 100,
          startedAt: completedRoadmap.startedAt,
          completedAt: completedRoadmap.completedAt,
          weekProgress: completedRoadmap.weekProgress || [],
        };
        nextRecommendedAction =
          'Congratulations! You graduated from this career route. Choose your next route from Recommendations!';
      } else {
        nextRecommendedAction =
          'Choose a recommended career and generate your personalized roadmap';
      }
    } else {
      // User has an active roadmap
      roadmapData = {
        id: activeRoadmap.id || activeRoadmap._id,
        _id: activeRoadmap.id || activeRoadmap._id,
        career: {
          title: activeRoadmap.careerSnapshot?.title || activeRoadmap.career?.title || 'Active Track',
          slug: activeRoadmap.careerSnapshot?.slug || activeRoadmap.career?.slug || '',
          shortDescription: activeRoadmap.careerSnapshot?.shortDescription || activeRoadmap.career?.shortDescription || '',
        },
        durationWeeks: activeRoadmap.durationWeeks,
        status: activeRoadmap.status,
        totalTasks: activeRoadmap.totalTasks,
        totalTasksCount: activeRoadmap.totalTasks,
        completedTasks: activeRoadmap.completedTasks,
        completedTasksCount: activeRoadmap.completedTasks,
        progressPercentage: activeRoadmap.progressPercentage,
        startedAt: activeRoadmap.startedAt,
        weekProgress: activeRoadmap.weekProgress || [],
      };

      // Extract tasks pre-fetched in the same Prisma query (0 extra roundtrips)
      if (Array.isArray(activeRoadmap.tasks) && activeRoadmap.tasks.length > 0) {
        upcomingTasks = activeRoadmap.tasks.map((t) => ({ ...t, _id: t.id }));
      } else if (activeRoadmap.progressPercentage < 100) {
        upcomingTasks = await RoadmapTask.find({
          roadmap: activeRoadmap.id || activeRoadmap._id,
          completed: false,
        })
          .sort({ weekNumber: 1, order: 1 })
          .limit(5)
          .select('-__v')
          .lean();
      }

      if (upcomingTasks.length > 0) {
        const nextTask = upcomingTasks[0];
        nextRecommendedAction = `Next: ${nextTask.title} (Week ${nextTask.weekNumber})`;
      } else if (activeRoadmap.progressPercentage === 100) {
        nextRecommendedAction =
          'Congratulations! You completed your roadmap. Explore a new career path.';
      } else {
        nextRecommendedAction = 'Review your current learning milestones and projects';
      }
    }

    let actionLabel = 'Continue';
    let actionUrl = 'roadmap.html';
    if (!isProfileComplete) {
      actionLabel = 'Complete Assessment';
      actionUrl = 'assessment.html';
    } else if (!activeRoadmap) {
      actionLabel = 'Explore Careers';
      actionUrl = 'recommendations.html';
    }

    // In-memory instant evaluation: pass user and activeRoadmap directly (0 extra DB reads)
    const jobReadyCertification = await evaluateJobReadyCertification(user, activeRoadmap).catch(() => null);

    const sanitizedRepos = (user.githubRepos || []).map((r) => ({
      ...r,
      language: r.language && r.language.trim().toLowerCase() !== 'code' ? r.language.trim() : '',
    }));

    let sanitizedTopLanguages = user.githubProfile?.topLanguages || [];
    if (Array.isArray(sanitizedTopLanguages)) {
      sanitizedTopLanguages = sanitizedTopLanguages.filter((l) => l && l.trim().toLowerCase() !== 'code');
    }

    const sanitizedProfile = user.githubProfile
      ? {
          ...user.githubProfile,
          topLanguages: sanitizedTopLanguages,
        }
      : null;

    const payload = {
      success: true,
      data: {
        user: {
          id: user._id || user.id,
          name: user.name,
          email: user.email,
          education: user.education || {},
          interests: user.interests || [],
          skills: user.skills || [],
          githubProfile: sanitizedProfile,
          githubRepos: sanitizedRepos,
          profileCompleted: isProfileComplete,
          avatarUrl: user.avatarUrl || '',
          resumeUrl: user.resumeUrl || '',
          resumeRecord: user.resumeRecord || null,
          completedPaths: user.completedPaths || [],
          profileStatus: user.profileStatus || { status: 'learning', currentRole: '' },
        },
        activeRoadmaps: allActiveRoadmaps.map((r) => ({
          id: r.id || r._id,
          _id: r.id || r._id,
          career: {
            title: r.careerSnapshot?.title || r.career?.title || 'Active Track',
            slug: r.careerSnapshot?.slug || r.career?.slug || '',
            shortDescription: r.careerSnapshot?.shortDescription || r.career?.shortDescription || '',
          },
          durationWeeks: r.durationWeeks,
          status: r.status,
          progressPercentage: r.progressPercentage,
          totalTasks: r.totalTasks,
          completedTasks: r.completedTasks,
        })),
        activeCount: allActiveRoadmaps.length,
        maxAllowed: 2,
        canEnrollSecondCourse: allActiveRoadmaps.length === 1,
        activeRoadmap: roadmapData,
        jobReadyCertification,
        progress: {
          totalTasks: roadmapData ? roadmapData.totalTasks : 0,
          completedTasks: roadmapData ? roadmapData.completedTasks : 0,
          progressPercentage: roadmapData ? roadmapData.progressPercentage : 0,
        },
        upcomingTasks,
        nextRecommendedAction,
        nextAction: {
          prompt: nextRecommendedAction,
          actionLabel,
          actionUrl,
        },
      },
    };

    // Cache valid payload in memory
    dashboardCache.set(cacheKey, {
      timestamp: Date.now(),
      payload,
    });

    res.status(200).json(payload);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboard,
  invalidateDashboardCache,
};
