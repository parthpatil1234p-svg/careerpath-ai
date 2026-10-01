/**
 * services/readinessService.js — Holistic Job Readiness Index & Digital Certification Engine
 *
 * Formula:
 * Readiness Index = (Verified Skills * 0.35) + (Roadmap Tasks * 0.30) + (Resume ATS * 0.15) + (Mock Interview * 0.20)
 *
 * Team 404 Brain Not Found · Hack2Ignite 2026–27
 */

const User = require('../models/User');
const Roadmap = require('../models/Roadmap');
const RoadmapTask = require('../models/RoadmapTask');
const crypto = require('crypto');

/**
 * Computes live job readiness index and certification state for a student.
 */
async function computeStudentReadiness(userId) {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  const activeRoadmap = await Roadmap.findOne({ user: userId, status: 'active' }).populate('career');

  // 1. Verified Skills Score (35% weight)
  const skills = user.skills || [];
  let verifiedSkillsScore = 50; // default baseline for enrolled student
  if (skills.length > 0) {
    let weightedCount = 0;
    skills.forEach(s => {
      const isCode = s.isCodeVerified || s.verificationTier === 'project_verified';
      const isQuiz = s.isQuizVerified || s.verificationTier === 'quiz_verified';
      if (isCode) weightedCount += 1.0;
      else if (isQuiz) weightedCount += (s.verificationStatus === 'unconfirmed' ? 0.75 : 0.85);
      else weightedCount += 0.5;
    });
    verifiedSkillsScore = Math.min(100, Math.round((weightedCount / Math.max(3, skills.length)) * 100));
  }

  // 2. Roadmap Tasks & Projects (30% weight)
  let roadmapProgressScore = 40;
  if (activeRoadmap) {
    roadmapProgressScore = Math.min(100, Math.max(0, activeRoadmap.progressPercentage || 0));
  }

  // 3. Resume ATS Score (15% weight)
  const resumeScore = (user.resumeAnalysis && typeof user.resumeAnalysis.atsScore === 'number' && user.resumeAnalysis.atsScore > 0)
    ? user.resumeAnalysis.atsScore
    : 65; // baseline unanalyzed

  // 4. Mock Interview Score (20% weight)
  const interviewScore = (user.mockInterview && typeof user.mockInterview.overallScore === 'number' && user.mockInterview.overallScore > 0)
    ? user.mockInterview.overallScore
    : 60; // baseline unconducted

  // Composite 0-100 Calculation
  const compositeScore = Math.min(100, Math.max(20, Math.round(
    (verifiedSkillsScore * 0.35) +
    (roadmapProgressScore * 0.30) +
    (resumeScore * 0.15) +
    (interviewScore * 0.20)
  )));

  // Tier Assignment
  let tier = 'foundational';
  let tierLabel = 'Foundational Learner';
  if (compositeScore >= 85) {
    tier = 'job_ready';
    tierLabel = '🔥 JOB READY CERTIFIED';
  } else if (compositeScore >= 71) {
    tier = 'interview_ready';
    tierLabel = 'Interview Ready';
  } else if (compositeScore >= 41) {
    tier = 'developing';
    tierLabel = 'Developing Practitioner';
  }

  // Certificate ID preserved if previously earned
  let certId = user.jobReadiness?.certificateId || '';
  let certifiedAt = user.jobReadiness?.certifiedAt || null;

  const result = {
    readinessScore: compositeScore,
    tier,
    tierLabel,
    certificateId: certId || '',
    certifiedAt: certifiedAt || null,
    calculatedAt: new Date(),
    targetRole: activeRoadmap?.career?.title || (user.interests && user.interests[0]) || 'Full-Stack Developer',
    breakdown: {
      verifiedSkills: verifiedSkillsScore,
      roadmapProgress: roadmapProgressScore,
      resumeScore,
      interviewScore
    },
    metricsSummary: [
      { label: 'Technical Verification', weight: '35%', score: verifiedSkillsScore, icon: 'bi-patch-check-fill' },
      { label: 'Roadmap Milestone Mastery', weight: '30%', score: roadmapProgressScore, icon: 'bi-map-fill' },
      { label: 'Resume ATS Alignment', weight: '15%', score: resumeScore, icon: 'bi-file-earmark-person-fill' },
      { label: 'AI Mock Interview', weight: '20%', score: interviewScore, icon: 'bi-mic-fill' },
    ]
  };

  user.jobReadiness = result;
  await user.save();

  return result;
}

/**
 * Evaluates the strict 4-Rule "Job Ready" Certification:
 * 1. Composite Readiness Score >= 70%
 * 2. >= 4 role-specific verified skills
 * 3. Roadmap progress >= 80% (or completed)
 * 4. Zero expired required skills
 */
async function evaluateJobReadyCertification(userId, activeOrCompletedRoadmap = null) {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  let roadmap = activeOrCompletedRoadmap;
  if (!roadmap) {
    roadmap = await Roadmap.findOne({
      user: userId,
      status: { $in: ['active', 'completed'] },
    }).sort({ updatedAt: -1 }).populate('career');
  }

  const readiness = await computeStudentReadiness(userId);
  const now = new Date();

  // Rule 1: Readiness score >= 70%
  const isScoreOk = readiness.readinessScore >= 70;

  // Rule 2: At least 4 verified skills required for the role
  const career = roadmap?.career;
  const requiredSkillNames = (career?.requiredSkills || []).map(rs => 
    (rs.skill?.name || rs.skillName || (typeof rs.skill === 'string' ? rs.skill : '')).toLowerCase().trim()
  ).filter(Boolean);

  const verifiedRoleSkills = (user.skills || []).filter(s => {
    const isVerified = s.isQuizVerified || s.isCodeVerified || s.verificationStatus === 'verified' || s.verificationTier === 'quiz_verified' || s.verificationTier === 'project_verified';
    const isRoleSkill = requiredSkillNames.length > 0
      ? requiredSkillNames.includes((s.name || '').toLowerCase().trim())
      : (s.isQuizVerified || s.verificationStatus === 'verified');
    const notExpired = !s.refreshByDate || new Date(s.refreshByDate) > now;
    return isVerified && isRoleSkill && notExpired;
  });
  const isSkillsCountOk = verifiedRoleSkills.length >= 4;

  // Rule 3: Roadmap 80% or more complete (or completed)
  const roadmapPct = roadmap?.progressPercentage || 0;
  const isRoadmapOk = roadmapPct >= 80 || roadmap?.status === 'completed';

  // Rule 4: No expired required skills
  const hasExpiredRequiredSkills = (user.skills || []).some(s => {
    const isRoleSkill = requiredSkillNames.length > 0
      ? requiredSkillNames.includes((s.name || '').toLowerCase().trim())
      : false;
    return isRoleSkill && s.refreshByDate && new Date(s.refreshByDate) <= now;
  });
  const isNotExpiredOk = !hasExpiredRequiredSkills;

  const isJobReady = isScoreOk && isSkillsCountOk && isRoadmapOk && isNotExpiredOk;
  let certificateId = user.jobReadiness?.certificateId || '';
  let certifiedAt = user.jobReadiness?.certifiedAt || null;

  if (isJobReady) {
    if (!certificateId) {
      certificateId = `CP-2026-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
      certifiedAt = new Date();
      user.jobReadiness = user.jobReadiness || {};
      user.jobReadiness.certificateId = certificateId;
      user.jobReadiness.certifiedAt = certifiedAt;
      user.jobReadiness.tier = 'job_ready';
      user.jobReadiness.tierLabel = '🔥 JOB READY CERTIFIED';
      await user.save();
    }
  }

  const missingCriteria = [];
  if (!isScoreOk) missingCriteria.push(`Readiness score must reach 70% (currently ${readiness.readinessScore}%)`);
  if (!isSkillsCountOk) missingCriteria.push(`Requires at least 4 role-specific verified skills (currently ${verifiedRoleSkills.length} of 4)`);
  if (!isRoadmapOk) missingCriteria.push(`Roadmap must be at least 80% complete (currently ${roadmapPct}%)`);
  if (hasExpiredRequiredSkills) missingCriteria.push(`One or more required role skills have expired and need refreshing`);

  return {
    isJobReady,
    certificateId,
    certifiedAt,
    missingCriteria,
    criteriaStatus: {
      score: { required: 70, actual: readiness.readinessScore, passed: isScoreOk },
      skills: { required: 4, actual: verifiedRoleSkills.length, passed: isSkillsCountOk },
      roadmap: { required: 80, actual: roadmapPct, passed: isRoadmapOk },
      expiration: { passed: isNotExpiredOk },
    },
    readiness,
  };
}

module.exports = {
  computeStudentReadiness,
  evaluateJobReadyCertification,
};
