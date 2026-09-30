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

  // Certificate Issuance on >= 85%
  let certId = user.jobReadiness?.certificateId;
  let certifiedAt = user.jobReadiness?.certifiedAt;
  if (compositeScore >= 85 && !certId) {
    certId = `CP-2026-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    certifiedAt = new Date();
  }

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

module.exports = {
  computeStudentReadiness
};
