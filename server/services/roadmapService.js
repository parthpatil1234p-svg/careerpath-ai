/**
 * services/roadmapService.js — Deterministic Personalized Roadmap Generation & Progress Tracking
 *
 * Rules:
 *  - Deterministic synthesis; no external AI calls.
 *  - Uses recommendationService to re-evaluate real user skill gaps.
 *  - Matches template by career slug.
 *  - Generates weeks 1–4, 1–8, or 1–12 depending on durationWeeks.
 *  - Prioritizes tasks matching missing skills, then weak skills.
 *  - Calculates and updates roadmap progress metrics.
 */

const Roadmap = require('../models/Roadmap');
const RoadmapTask = require('../models/RoadmapTask');
const roadmapTemplates = require('../data/roadmapTemplates');
const { calculateSkillScore } = require('./recommendationService');

/**
 * Generates structured task objects ready for bulk insertion
 *
 * @param {Object} user - Authenticated user document
 * @param {Object} career - Target career document with populated requiredSkills.skill
 * @param {Number} durationWeeks - 4, 8, or 12
 * @returns {Object} { generatedFrom, taskDocuments }
 */
const generateRoadmapTasks = (user, career, durationWeeks = 4) => {
  const careerSlug = career.slug.toLowerCase().trim();
  let template = roadmapTemplates[careerSlug];

  // Dynamic fallback generator if dedicated template is not predefined
  if (!template) {
    const reqSkills = Array.isArray(career.requiredSkills) ? career.requiredSkills : [];
    const weeks = [];
    const skillsPerWeek = Math.max(1, Math.ceil(reqSkills.length / durationWeeks));

    for (let w = 1; w <= durationWeeks; w++) {
      const startIdx = (w - 1) * skillsPerWeek;
      const weekSkills = reqSkills.slice(startIdx, startIdx + skillsPerWeek);
      const tasks = [];

      if (weekSkills.length === 0) {
        tasks.push({
          order: 1,
          title: `${career.title} Capstone Project & Production Readiness`,
          description: `Synthesize all competencies learned so far into an end-to-end production-grade portfolio project demonstrating real-world readiness for ${career.title} roles.`,
          type: 'project',
          skillName: (reqSkills[0]?.skill?.name || reqSkills[0]?.skillName || 'problem-solving'),
          priority: 'high',
          estimatedHours: 8,
          resource: {
            title: `${career.title} Open Source Reference Projects`,
            url: 'https://github.com/topics/portfolio-project',
            provider: 'GitHub & Open Source Community',
          },
        });
        tasks.push({
          order: 2,
          title: `${career.title} Technical Screening & Mock Assessment`,
          description: `Review foundational algorithms, domain-specific architecture questions, and refine resume project impact bullets.`,
          type: 'assessment',
          skillName: 'communication',
          priority: 'high',
          estimatedHours: 4,
          resource: {
            title: 'Technical Interview Preparation Handbook',
            url: 'https://github.com/jwasham/coding-interview-university',
            provider: 'Tech Interview Handbook',
          },
        });
      } else {
        weekSkills.forEach((rs, i) => {
          const sName = rs.skill?.displayName || rs.skill?.name || rs.skillName || 'Core Competency';
          const sKey = (rs.skill?.name || rs.skillName || 'skill').toLowerCase();

          tasks.push({
            order: i * 2 + 1,
            title: `Master ${sName} Architecture & Core Principles`,
            description: `Deep dive into theoretical foundations, syntactical patterns, and industry best practices for ${sName} in modern enterprise software.`,
            type: 'learn',
            skillName: sKey,
            priority: rs.importance === 'high' ? 'high' : 'medium',
            estimatedHours: rs.importance === 'high' ? 5 : 3,
            resource: {
              title: `${sName} Official Documentation & Guides`,
              url: `https://devdocs.io/`,
              provider: 'DevDocs & Official Documentation',
            },
          });

          tasks.push({
            order: i * 2 + 2,
            title: `Hands-On Lab: Build & Test ${sName} Implementation`,
            description: `Construct a functional component or module demonstrating practical proficiency with ${sName}, including error handling and unit validation.`,
            type: 'practice',
            skillName: sKey,
            priority: rs.importance === 'high' ? 'high' : 'medium',
            estimatedHours: 4,
            resource: {
              title: `${sName} Interactive Hands-On Lab`,
              url: `https://developer.mozilla.org/en-US/search?q=${encodeURIComponent(sName)}`,
              provider: 'Interactive Learning Resource',
            },
          });
        });
      }

      weeks.push({
        weekNumber: w,
        tasks,
      });
    }

    template = {
      title: career.title,
      category: career.category || 'development',
      weeks,
    };
  }

  // 1. Re-evaluate real user skill gaps securely
  const userSkillsMap = new Map();
  if (Array.isArray(user.skills)) {
    user.skills.forEach((s) => {
      if (s.name) {
        userSkillsMap.set(s.name.toLowerCase().trim(), s);
      }
    });
  }

  const { matchedSkills, weakSkills, missingSkills } = calculateSkillScore(
    userSkillsMap,
    career.requiredSkills
  );

  const missingSkillNames = missingSkills.map((s) => s.name.toLowerCase());
  const weakSkillNames = weakSkills.map((s) => s.name.toLowerCase());
  const userInterests = Array.isArray(user.interests) ? user.interests : [];
  const userSkillNames = Array.from(userSkillsMap.keys());

  // 2. Select template weeks up to durationWeeks
  const selectedTemplateWeeks = template.weeks.filter(
    (w) => w.weekNumber <= durationWeeks
  );

  const taskDocuments = [];

  // 3. Process each week and prioritize tasks linked to missing & weak skills
  selectedTemplateWeeks.forEach((week) => {
    // Clone and score each task for prioritization
    const weekTasks = week.tasks.map((task) => {
      const taskSkill = (task.skillName || '').toLowerCase().trim();
      let dynamicPriority = task.priority || 'medium';

      // Elevate priority if this task directly targets one of the user's missing skills
      if (missingSkillNames.includes(taskSkill)) {
        dynamicPriority = 'high';
      } else if (weakSkillNames.includes(taskSkill) && dynamicPriority === 'low') {
        dynamicPriority = 'medium';
      }

      return {
        ...task,
        priority: dynamicPriority,
      };
    });

    // Sort tasks in week: missing skills first, then by original order
    weekTasks.sort((a, b) => {
      const aMissing = missingSkillNames.includes((a.skillName || '').toLowerCase());
      const bMissing = missingSkillNames.includes((b.skillName || '').toLowerCase());
      if (aMissing && !bMissing) return -1;
      if (!aMissing && bMissing) return 1;
      return a.order - b.order;
    });

    // Assign sequential order within the week
    weekTasks.forEach((task, idx) => {
      const validTypes = ['learn', 'practice', 'project', 'assessment', 'interview'];
      const sanitizedType = validTypes.includes(task.type) ? task.type : 'practice';

      taskDocuments.push({
        weekNumber: week.weekNumber,
        order: idx + 1,
        title: task.title,
        description: task.description,
        type: sanitizedType,
        skillName: task.skillName || '',
        priority: task.priority || 'medium',
        estimatedHours: task.estimatedHours || 2,
        resource: task.resource || {},
        completed: false,
      });
    });
  });

  return {
    generatedFrom: {
      missingSkills: missingSkillNames,
      weakSkills: weakSkillNames,
      userInterests,
      userSkillNames,
    },
    taskDocuments,
  };
};

/**
 * Recalculates roadmap progress and updates Roadmap document
 *
 * @param {ObjectId|string} roadmapId
 * @returns {Promise<Object>} Updated roadmap document
 */
const calculateRoadmapProgress = async (roadmapId) => {
  const totalTasks = await RoadmapTask.countDocuments({ roadmap: roadmapId });
  const completedTasks = await RoadmapTask.countDocuments({
    roadmap: roadmapId,
    completed: true,
  });

  const progressPercentage =
    totalTasks > 0 ? Math.min(Math.max(Math.round((completedTasks / totalTasks) * 100), 0), 100) : 0;

  const isFullyCompleted = totalTasks > 0 && completedTasks === totalTasks;

  const updateFields = {
    totalTasks,
    completedTasks,
    progressPercentage,
  };

  if (isFullyCompleted) {
    updateFields.status = 'completed';
    updateFields.completedAt = new Date();
  } else {
    updateFields.status = 'active';
    updateFields.completedAt = null;
  }

  const updatedRoadmap = await Roadmap.findByIdAndUpdate(
    roadmapId,
    { $set: updateFields },
    { new: true }
  );

  return updatedRoadmap;
};

module.exports = {
  generateRoadmapTasks,
  calculateRoadmapProgress,
};
