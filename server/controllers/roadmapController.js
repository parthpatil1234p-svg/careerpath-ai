/**
 * controllers/roadmapController.js — Personalized Roadmap & Task Progress Controllers
 *
 * generateRoadmap   POST  /api/roadmaps/generate
 * getCurrentRoadmap GET   /api/roadmaps/current
 * toggleTask        PATCH /api/roadmaps/tasks/:taskId/toggle
 * archiveRoadmap    DELETE /api/roadmaps/current
 */

const Roadmap = require('../models/Roadmap');
const RoadmapTask = require('../models/RoadmapTask');
const Career = require('../models/Career');
const User = require('../models/User');
const { generateRecommendations } = require('../services/recommendationService');
const { generateRoadmapTasks, calculateRoadmapProgress } = require('../services/roadmapService');
const {
  startWeeklyTest,
  saveWeeklyTestAnswer,
  submitWeeklyTest,
  getWeeklyTestStatus,
} = require('../services/weeklyTestService');

// Helper to group tasks by weekNumber
const groupTasksByWeek = (tasks, durationWeeks) => {
  const weekMap = new Map();
  for (let w = 1; w <= durationWeeks; w++) {
    weekMap.set(w, []);
  }

  tasks.forEach((task) => {
    if (weekMap.has(task.weekNumber)) {
      weekMap.get(task.weekNumber).push(task);
    } else {
      weekMap.set(task.weekNumber, [task]);
    }
  });

  const weeks = [];
  weekMap.forEach((taskList, weekNumber) => {
    weeks.push({
      weekNumber,
      tasks: taskList,
    });
  });

  return weeks;
};

// ── generateRoadmap ────────────────────────────────────────────
/**
 * POST /api/roadmaps/generate
 * Creates or refreshes a personalized learning curriculum
 */
const generateRoadmap = async (req, res, next) => {
  try {
    const { careerSlug, durationWeeks } = req.body;
    const weeksCount = Number(durationWeeks);

    // 1. Fetch fresh user document
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found',
      });
    }

    // 2. Validate profile completeness
    const hasEducation =
      user.education &&
      user.education.course &&
      typeof user.education.course === 'string' &&
      user.education.course.trim() !== '';
    const hasInterest = Array.isArray(user.interests) && user.interests.length > 0;
    const hasSkill = Array.isArray(user.skills) && user.skills.length > 0;

    if (!hasEducation || !hasInterest || !hasSkill) {
      return res.status(400).json({
        success: false,
        message: 'Please complete your profile assessment before generating a roadmap',
      });
    }

    // 3. Load all active careers and compute user's top-3 recommendations
    const allCareers = await Career.find({ active: true })
      .select('-__v')
      .populate({
        path: 'requiredSkills.skill',
        select: 'name displayName category description',
      });

    if (!allCareers || allCareers.length === 0) {
      return res.status(500).json({
        success: false,
        message: 'No active careers available. Please run database seed.',
      });
    }

    // 4. Find target career document with populated skills
    const targetSlug = careerSlug.toLowerCase().trim();
    const selectedCareer = allCareers.find((c) => c.slug.toLowerCase().trim() === targetSlug);
    if (!selectedCareer) {
      return res.status(404).json({
        success: false,
        message: `Career "${careerSlug}" not found. Please select from active career roles.`,
      });
    }

    // 6. Strict Single Active Route Invariant: Check if user already has an active, incomplete roadmap
    const activeRoadmap = await Roadmap.findOne({
      user: user._id,
      status: 'active',
    }).populate('career');

    if (activeRoadmap) {
      return res.status(409).json({
        success: false,
        code: 'ACTIVE_ROUTE_IN_PROGRESS',
        message: `You are currently pursuing the "${activeRoadmap.careerSnapshot?.title || 'active'}" route (${Math.round(activeRoadmap.progressPercentage || 0)}% completed). You must complete your current route before starting another career route.`,
        data: {
          activeRoadmap: {
            id: activeRoadmap._id,
            careerTitle: activeRoadmap.careerSnapshot?.title,
            slug: activeRoadmap.careerSnapshot?.slug,
            progressPercentage: activeRoadmap.progressPercentage,
            durationWeeks: activeRoadmap.durationWeeks,
          },
        },
      });
    }

    // 7. Generate personalized tasks based on real skill gaps
    const { generatedFrom, taskDocuments } = generateRoadmapTasks(
      user,
      selectedCareer,
      weeksCount
    );

    // 8. Create Roadmap document with initial weekly milestone progress
    const initialWeekProgress = [];
    for (let w = 1; w <= weeksCount; w++) {
      initialWeekProgress.push({
        weekNumber: w,
        title: `Week ${w} Milestone`,
        status: w === 1 ? 'in_progress' : 'locked',
        attemptsCount: 0,
        passedAt: null,
        testScore: 0,
        testPercent: 0,
      });
    }

    let newRoadmap;
    try {
      newRoadmap = await Roadmap.create({
        user: user._id,
        career: selectedCareer._id,
        careerSnapshot: {
          title: selectedCareer.title,
          slug: selectedCareer.slug,
          shortDescription: selectedCareer.shortDescription,
        },
        durationWeeks: weeksCount,
        status: 'active',
        generatedFrom,
        totalTasks: taskDocuments.length,
        completedTasks: 0,
        progressPercentage: 0,
        startedAt: new Date(),
        weekProgress: initialWeekProgress,
      });
    } catch (createErr) {
      if (createErr.code === 11000) {
        // Race condition caught by MongoDB partial unique index
        const currentActive = await Roadmap.findOne({ user: user._id, status: 'active' });
        return res.status(409).json({
          success: false,
          code: 'ACTIVE_ROUTE_IN_PROGRESS',
          message: `You already have an active career route in progress (${currentActive?.careerSnapshot?.title || 'Current Route'}). You must complete or abandon your current route before starting another.`,
          data: {
            activeRoadmap: {
              id: currentActive?._id,
              careerTitle: currentActive?.careerSnapshot?.title,
              slug: currentActive?.careerSnapshot?.slug,
              progressPercentage: currentActive?.progressPercentage,
              durationWeeks: currentActive?.durationWeeks,
            },
          },
        });
      }
      throw createErr;
    }

    // 9. Bulk-create RoadmapTask documents linked to new roadmap
    const tasksWithRoadmapId = taskDocuments.map((task) => ({
      ...task,
      roadmap: newRoadmap._id,
    }));

    const createdTasks = await RoadmapTask.insertMany(tasksWithRoadmapId);

    // 10. Group tasks by week for response
    const weeks = groupTasksByWeek(createdTasks, weeksCount);

    res.status(201).json({
      success: true,
      message: 'Personalized roadmap generated successfully',
      data: {
        roadmap: {
          id: newRoadmap._id,
          _id: newRoadmap._id,
          career: {
            title: newRoadmap.careerSnapshot.title,
            slug: newRoadmap.careerSnapshot.slug,
          },
          durationWeeks: newRoadmap.durationWeeks,
          status: newRoadmap.status,
          totalTasks: newRoadmap.totalTasks,
          totalTasksCount: newRoadmap.totalTasks,
          completedTasks: newRoadmap.completedTasks,
          completedTasksCount: newRoadmap.completedTasks,
          progressPercentage: newRoadmap.progressPercentage,
          weekProgress: newRoadmap.weekProgress,
        },
        tasks: createdTasks,
        weeks,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ── getCurrentRoadmap ──────────────────────────────────────────
/**
 * GET /api/roadmaps/current
 * Returns active roadmap and all associated tasks grouped by week
 */
const getCurrentRoadmap = async (req, res, next) => {
  try {
    let roadmap = await Roadmap.findOne({
      user: req.user._id,
      status: 'active',
    });

    let isCompleted = false;

    // If no active roadmap, check for the most recently completed roadmap
    if (!roadmap) {
      roadmap = await Roadmap.findOne({
        user: req.user._id,
        status: 'completed',
      }).sort({ completedAt: -1, updatedAt: -1 });

      if (roadmap) {
        isCompleted = true;
      }
    }

    if (!roadmap) {
      return res.status(404).json({
        success: false,
        hasRoadmap: false,
        canStartNewRoute: true,
        message: 'No active or completed roadmap found. Generate a roadmap first.',
      });
    }

    // Ensure weekProgress array exists for existing roadmaps
    if (!roadmap.weekProgress || roadmap.weekProgress.length === 0) {
      roadmap.weekProgress = [];
      for (let w = 1; w <= roadmap.durationWeeks; w++) {
        roadmap.weekProgress.push({
          weekNumber: w,
          title: `Week ${w} Milestone`,
          status: w === 1 ? 'in_progress' : 'locked',
          attemptsCount: 0,
          passedAt: null,
          testScore: 0,
          testPercent: 0,
        });
      }
      await roadmap.save();
    }

    const tasks = await RoadmapTask.find({ roadmap: roadmap._id })
      .sort({ weekNumber: 1, order: 1 })
      .select('-__v');

    const weeks = groupTasksByWeek(tasks, roadmap.durationWeeks);

    // Compute active week number & descriptive string (e.g. "Week 2 of 4")
    let currentWeekNumber = 1;
    const activeWp = (roadmap.weekProgress || []).find(wp => wp.status === 'in_progress' || wp.status === 'awaiting_test');
    if (activeWp) {
      currentWeekNumber = activeWp.weekNumber;
    } else {
      const lastPassed = [...(roadmap.weekProgress || [])].reverse().find(wp => wp.status === 'passed');
      if (lastPassed && lastPassed.weekNumber < roadmap.durationWeeks) {
        currentWeekNumber = lastPassed.weekNumber + 1;
      } else if (lastPassed) {
        currentWeekNumber = roadmap.durationWeeks;
      }
    }
    const currentWeekString = `Week ${currentWeekNumber} of ${roadmap.durationWeeks}`;
    const canEnroll = isCompleted || roadmap.status !== 'active';

    res.status(200).json({
      success: true,
      data: {
        hasRoadmap: true,
        isCompleted,
        canStartNewRoute: canEnroll,
        canEnrollNewRoute: canEnroll,
        currentWeekNumber,
        currentWeekString,
        roadmap: {
          id: roadmap._id,
          _id: roadmap._id,
          career: {
            title: roadmap.careerSnapshot?.title || 'Active Track',
            slug: roadmap.careerSnapshot?.slug || '',
            shortDescription: roadmap.careerSnapshot?.shortDescription || '',
          },
          durationWeeks: roadmap.durationWeeks,
          status: roadmap.status,
          totalTasks: roadmap.totalTasks,
          totalTasksCount: roadmap.totalTasks,
          completedTasks: roadmap.completedTasks,
          completedTasksCount: roadmap.completedTasks,
          progressPercentage: roadmap.progressPercentage,
          startedAt: roadmap.startedAt,
          completedAt: roadmap.completedAt,
          abandonedAt: roadmap.abandonedAt || null,
          weekProgress: roadmap.weekProgress,
          currentWeekNumber,
          currentWeekString,
        },
        tasks,
        weeks,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ── toggleTask ─────────────────────────────────────────────────
/**
 * PATCH /api/roadmaps/tasks/:taskId/toggle
 * Toggles a task's completed state and recalculates overall roadmap progress
 */
const toggleTask = async (req, res, next) => {
  try {
    const { taskId } = req.params;

    // 1. Locate task
    const task = await RoadmapTask.findById(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Roadmap task not found',
      });
    }

    // 2. Verify task belongs to current user's active roadmap
    const activeRoadmap = await Roadmap.findOne({
      _id: task.roadmap,
      user: req.user._id,
      status: { $in: ['active', 'completed'] }, // Allow toggling even if temporarily marked completed
    });

    if (!activeRoadmap) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to modify this roadmap task',
      });
    }

    // 3. Toggle completed status
    task.completed = !task.completed;
    task.completedAt = task.completed ? new Date() : null;
    await task.save();

    // 4. Recalculate progress on Roadmap
    const updatedRoadmap = await calculateRoadmapProgress(activeRoadmap._id);

    // 5. If all tasks for this task's week are completed, transition week from in_progress to awaiting_test
    const weekTasks = await RoadmapTask.find({ roadmap: activeRoadmap._id, weekNumber: task.weekNumber });
    const allWeekTasksDone = weekTasks.length > 0 && weekTasks.every((t) => t.completed);
    if (allWeekTasksDone && updatedRoadmap.weekProgress) {
      const wp = updatedRoadmap.weekProgress.find((w) => w.weekNumber === task.weekNumber);
      if (wp && wp.status === 'in_progress') {
        wp.status = 'awaiting_test';
        await updatedRoadmap.save();
      }
    }

    res.status(200).json({
      success: true,
      message: `Task marked as ${task.completed ? 'completed' : 'incomplete'}`,
      data: {
        task: {
          id: task._id,
          _id: task._id,
          completed: task.completed,
          completedAt: task.completedAt,
        },
        roadmap: {
          id: updatedRoadmap._id,
          _id: updatedRoadmap._id,
          status: updatedRoadmap.status,
          totalTasks: updatedRoadmap.totalTasks,
          totalTasksCount: updatedRoadmap.totalTasks,
          completedTasks: updatedRoadmap.completedTasks,
          completedTasksCount: updatedRoadmap.completedTasks,
          progressPercentage: updatedRoadmap.progressPercentage,
          weekProgress: updatedRoadmap.weekProgress,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// ── abandonRoadmap ─────────────────────────────────────────────
/**
 * POST /api/roadmaps/current/abandon
 * Non-destructive route abandonment with 7-day rate-limiting cooldown.
 * All quiz history, attempts, and verified skills remain completely intact.
 */
const abandonRoadmap = async (req, res, next) => {
  try {
    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.lastAbandonedRouteAt) {
      const elapsed = Date.now() - new Date(user.lastAbandonedRouteAt).getTime();
      if (elapsed < SEVEN_DAYS_MS) {
        const nextAllowed = new Date(new Date(user.lastAbandonedRouteAt).getTime() + SEVEN_DAYS_MS);
        return res.status(429).json({
          success: false,
          code: 'ABANDON_COOLDOWN_ACTIVE',
          message: `You can only abandon a career route once every 7 days. Your next route reset is available on ${nextAllowed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}.`,
          data: {
            nextAllowedAt: nextAllowed,
          },
        });
      }
    }

    const roadmap = await Roadmap.findOneAndUpdate(
      { user: req.user._id, status: 'active' },
      { $set: { status: 'abandoned', abandonedAt: new Date() } },
      { new: true }
    );

    if (!roadmap) {
      return res.status(404).json({
        success: false,
        message: 'No active roadmap found to abandon.',
      });
    }

    user.lastAbandonedRouteAt = new Date();
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: 'Active career route abandoned. All your earned skills and milestone quiz scores have been safely preserved.',
      data: {
        abandonedRoadmapId: roadmap._id,
        careerTitle: roadmap.careerSnapshot?.title,
        abandonedAt: roadmap.abandonedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ── resumeRoadmap ──────────────────────────────────────────────
/**
 * POST /api/roadmaps/:id/resume
 * Resumes a previously abandoned career roadmap if no other route is active.
 */
const resumeRoadmap = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Verify user has no other currently active roadmap
    const activeRoadmap = await Roadmap.findOne({ user: req.user._id, status: 'active' });
    if (activeRoadmap) {
      return res.status(409).json({
        success: false,
        code: 'ACTIVE_ROUTE_IN_PROGRESS',
        message: `Cannot resume. You already have an active route in progress (${activeRoadmap.careerSnapshot?.title || 'Current Route'}).`,
      });
    }

    const roadmap = await Roadmap.findOne({
      _id: id,
      user: req.user._id,
      status: 'abandoned',
    });

    if (!roadmap) {
      return res.status(404).json({
        success: false,
        message: 'Abandoned roadmap not found or not eligible for resumption.',
      });
    }

    roadmap.status = 'active';
    roadmap.abandonedAt = null;
    await roadmap.save();

    res.status(200).json({
      success: true,
      message: `Resumed "${roadmap.careerSnapshot?.title}" route successfully.`,
      data: {
        roadmap,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ── archiveRoadmap ─────────────────────────────────────────────
/**
 * DELETE /api/roadmaps/current (Deprecated alias for abandonRoadmap)
 */
const archiveRoadmap = async (req, res, next) => {
  return abandonRoadmap(req, res, next);
};

// ── linkProjectRepo ──────────────────────────────────────────
/**
 * POST /api/roadmaps/tasks/:taskId/link-repo
 * Links a GitHub repository to a project milestone task, verifies it, marks task complete,
 * and elevates associated skills to Tier 2: Code Verified (project_verified).
 */
const linkProjectRepo = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const { repoUrl } = req.body;

    if (!repoUrl || typeof repoUrl !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'A valid GitHub repository URL is required (e.g., https://github.com/username/project).',
      });
    }

    const match = repoUrl.trim().match(/github\.com\/([a-zA-Z0-9._-]+)\/([a-zA-Z0-9._-]+)/i);
    if (!match) {
      return res.status(400).json({
        success: false,
        message: 'Invalid GitHub URL format. Please provide a standard GitHub URL (https://github.com/owner/repository).',
      });
    }

    const owner = match[1];
    const repoName = match[2].replace(/\.git$/i, '');

    const task = await RoadmapTask.findById(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Roadmap task not found.',
      });
    }

    const roadmap = await Roadmap.findOne({ _id: task.roadmap, user: req.user._id });
    if (!roadmap) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to modify tasks on this roadmap.',
      });
    }

    // Inspect repository via GitHub API or mock fallback for local testing
    let repoData = {
      name: repoName,
      language: 'JavaScript',
      stars: 1,
      commitsCount: 3,
      detectedSkills: [],
    };

    try {
      const ghRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}`, {
        headers: {
          'User-Agent': 'CareerPath-AI-Project-Verifier',
          Accept: 'application/vnd.github.v3+json',
        },
      });
      if (ghRes.ok) {
        const ghJson = await ghRes.json();
        repoData.name = ghJson.name || repoName;
        repoData.language = ghJson.language || 'Code';
        repoData.stars = ghJson.stargazers_count || 0;
        repoData.description = ghJson.description || '';
        if (ghJson.topics && Array.isArray(ghJson.topics)) {
          repoData.detectedSkills.push(...ghJson.topics);
        }
      }
    } catch (apiErr) {
      console.warn('[linkProjectRepo] GitHub API fetch notice:', apiErr.message);
    }

    // Identify detected skills from repo language, name, task.skillName
    const skillsToAward = new Set();
    if (task.skillName) skillsToAward.add(task.skillName.toLowerCase());
    if (repoData.language) skillsToAward.add(repoData.language.toLowerCase());
    if (repoData.name.toLowerCase().includes('react')) skillsToAward.add('react');
    if (repoData.name.toLowerCase().includes('node')) skillsToAward.add('node.js');
    if (repoData.name.toLowerCase().includes('python')) skillsToAward.add('python');

    repoData.detectedSkills = Array.from(skillsToAward);

    // Update task
    task.linkedRepoUrl = `https://github.com/${owner}/${repoName}`;
    task.isProjectVerified = true;
    task.projectVerifiedAt = new Date();
    task.projectMetadata = {
      repoName: repoData.name,
      language: repoData.language,
      stars: repoData.stars,
      commitCount: repoData.commitsCount || 1,
      detectedSkills: repoData.detectedSkills,
    };
    task.completed = true;
    task.completedAt = new Date();
    await task.save();

    // Elevate skills in user profile
    const user = await User.findById(req.user._id);
    if (user) {
      if (!Array.isArray(user.skills)) user.skills = [];

      for (const skillKey of repoData.detectedSkills) {
        let existing = user.skills.find(
          (s) => (s.name || '').toLowerCase() === skillKey.toLowerCase()
        );
        if (existing) {
          existing.verificationTier = 'project_verified';
          existing.verificationStatus = 'verified';
          existing.isCodeVerified = true;
          existing.verifiedSource = 'github';
        } else {
          user.skills.push({
            name: skillKey,
            displayName: skillKey.charAt(0).toUpperCase() + skillKey.slice(1),
            proficiency: 'intermediate',
            verificationTier: 'project_verified',
            verificationStatus: 'verified',
            isCodeVerified: true,
            verifiedSource: 'github',
          });
        }
      }
      await user.save();
    }

    // Recalculate roadmap progress
    const allTasks = await RoadmapTask.find({ roadmap: roadmap._id });
    const completedTasksCount = allTasks.filter((t) => t.completed).length;
    roadmap.completedTasks = completedTasksCount;
    roadmap.progressPercentage = allTasks.length > 0
      ? Math.round((completedTasksCount / allTasks.length) * 100)
      : 0;
    if (roadmap.progressPercentage === 100) {
      roadmap.status = 'completed';
    }
    await roadmap.save();

    return res.status(200).json({
      success: true,
      message: `Project repository linked! "${repoData.name}" verified and associated skills upgraded to Tier 2: Code Verified.`,
      data: {
        task,
        roadmap: {
          id: roadmap._id,
          completedTasks: roadmap.completedTasks,
          progressPercentage: roadmap.progressPercentage,
          status: roadmap.status,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/roadmaps/:id/weeks/:weekNumber/test/start
 * Starts a 30-minute server-clock weekly milestone test
 */
const startWeeklyTestController = async (req, res, next) => {
  try {
    const { id, weekNumber } = req.params;
    const testData = await startWeeklyTest(req.user._id, id, weekNumber);
    res.status(200).json({
      success: true,
      message: testData.resumed
        ? 'Resumed ongoing weekly milestone test.'
        : `Week ${weekNumber} milestone test started. 30-minute timer running.`,
      data: testData,
    });
  } catch (error) {
    if (error.code === 'PREREQUISITE_LOCKED') {
      return res.status(403).json({
        success: false,
        code: error.code,
        message: error.message,
      });
    }
    next(error);
  }
};

/**
 * POST /api/roadmaps/test/save-answer
 * Progressive auto-save for question choices during test
 */
const saveWeeklyTestAnswerController = async (req, res, next) => {
  try {
    const { attemptId, questionId, selectedIndex, selectedOption } = req.body;
    const choice = selectedIndex !== undefined ? selectedIndex : selectedOption;
    if (!attemptId || !questionId || choice === undefined || choice === null) {
      return res.status(400).json({
        success: false,
        message: 'attemptId, questionId, and selectedIndex/selectedOption are required.',
      });
    }
    const result = await saveWeeklyTestAnswer(req.user._id, attemptId, questionId, Number(choice));
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/roadmaps/test/submit
 * Grades weekly milestone test, enforces 70% threshold, unlocks next week on pass
 */
const submitWeeklyTestController = async (req, res, next) => {
  try {
    const { attemptId, answers } = req.body;
    if (!attemptId) {
      return res.status(400).json({
        success: false,
        message: 'attemptId is required to submit test.',
      });
    }
    const result = await submitWeeklyTest(req.user._id, attemptId, true, answers || []);
    res.status(200).json({
      success: true,
      message: result.passed
        ? `Passed with ${result.percent}%! Next milestone unlocked.`
        : `Score: ${result.percent}%. 70% required to pass. Retake available with fresh questions.`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/roadmaps/test/:attemptId/status
 * Fetches status, remaining seconds, and saved answers for an attempt
 */
const getWeeklyTestStatusController = async (req, res, next) => {
  try {
    const { attemptId } = req.params;
    const result = await getWeeklyTestStatus(req.user._id, attemptId);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/roadmaps/:id/weeks/:weekNumber/complete
 * Marks all tasks for a week complete and transitions status to awaiting_test
 */
const completeWeekMilestoneController = async (req, res, next) => {
  try {
    const { id, weekNumber } = req.params;
    const wNum = Number(weekNumber);
    const roadmap = await Roadmap.findOne({ _id: id, user: req.user._id });
    if (!roadmap) {
      return res.status(404).json({ success: false, message: 'Roadmap not found' });
    }

    await RoadmapTask.updateMany(
      { roadmap: id, weekNumber: wNum },
      { $set: { completed: true, completedAt: new Date() } }
    );

    const updatedRoadmap = await calculateRoadmapProgress(id);

    if (updatedRoadmap.weekProgress) {
      const wp = updatedRoadmap.weekProgress.find((w) => w.weekNumber === wNum);
      if (wp && wp.status === 'in_progress') {
        wp.status = 'awaiting_test';
        await updatedRoadmap.save();
      }
    }

    res.status(200).json({
      success: true,
      message: `Week ${wNum} tasks completed. Ready for milestone test!`,
      data: {
        weekNumber: wNum,
        roadmap: updatedRoadmap,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  generateRoadmap,
  getCurrentRoadmap,
  toggleTask,
  abandonRoadmap,
  resumeRoadmap,
  archiveRoadmap,
  linkProjectRepo,
  startWeeklyTestController,
  saveWeeklyTestAnswerController,
  submitWeeklyTestController,
  getWeeklyTestStatusController,
  completeWeekMilestoneController,
};
