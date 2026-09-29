/**
 * services/quizService.js — Adaptive Skill Quiz & Reality-Check Engine
 *
 * Team 404 Brain Not Found · Hack2Ignite 2026-27
 *
 * Core Logic:
 * - 6 Questions per skill session.
 * - Starts at 'medium' difficulty.
 * - Right answer -> harder next (medium -> hard, easy -> medium).
 * - Wrong answer -> easier next (medium -> easy, hard -> medium).
 * - Real-time validation + punchy 1-line educational explanation.
 * - Reality-Check comparison (You Said vs. Quiz Says) with topic gap extraction.
 * - Evaluates qualification rubric (Advanced >= 3 Hard correct; Intermediate >= 3 Med/Hard correct).
 */

const User = require('../models/User');
const {
  QUIZ_QUESTIONS,
  AVAILABLE_QUIZ_SKILLS,
  normalizeSkillKey,
  getQuestion,
  getQuestionById,
} = require('../data/quizQuestions');

// In-memory active session store (keyed by `${userId}_${skill}`)
const activeSessions = new Map();

/**
 * Start an adaptive quiz session for a user and skill
 */
async function startQuizSession(userId, skill) {
  const normalizedSkill = normalizeSkillKey(skill);
  if (!QUIZ_QUESTIONS[normalizedSkill]) {
    throw new Error(`Quiz is available for: ${AVAILABLE_QUIZ_SKILLS.join(', ')}. Selected: "${skill}"`);
  }

  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  const existingSkill = (user.skills || []).find(
    (s) => (s.name || '').toLowerCase() === normalizedSkill
  );

  const selfRated = existingSkill?.selfRatedProficiency || existingSkill?.proficiency || 'intermediate';

  // Question 1 starts at Medium
  const firstQuestion = getQuestion(normalizedSkill, 'medium', []);
  if (!firstQuestion) {
    throw new Error('No questions available for this skill');
  }

  const sessionKey = `${userId}_${normalizedSkill}`;
  const sessionData = {
    userId,
    skill: normalizedSkill,
    displayName: existingSkill?.displayName || normalizedSkill.toUpperCase(),
    selfRated,
    currentStep: 1,
    totalSteps: 5,
    currentDifficulty: 'medium',
    currentQuestionId: firstQuestion.id,
    answeredQuestions: [], // history of { id, difficulty, selectedIndex, isCorrect, topic }
    score: 0,
    hardCorrectCount: 0,
    identifiedGaps: new Set(),
    startedAt: Date.now()
  };

  activeSessions.set(sessionKey, sessionData);

  // Return first question payload (sanitized without correctIndex)
  return {
    sessionId: sessionKey,
    skill: normalizedSkill,
    displayName: sessionData.displayName,
    selfRatedProficiency: selfRated,
    selfRated,
    questionIndex: 1,
    currentStep: 1,
    totalQuestions: 5,
    totalSteps: 5,
    currentDifficulty: 'medium',
    difficulty: 'medium',
    question: {
      id: firstQuestion.id,
      topic: firstQuestion.topic,
      text: firstQuestion.question,
      prompt: firstQuestion.question,
      codeSnippet: firstQuestion.codeSnippet || null,
      options: firstQuestion.options
    }
  };
}

/**
 * Submit an answer, receive immediate validation + explanation, and fetch next adaptive question
 */
async function submitAnswer(userId, skill, questionId, selectedIndex) {
  const normalizedSkill = normalizeSkillKey(skill);
  const sessionKey = `${userId}_${normalizedSkill}`;
  const session = activeSessions.get(sessionKey);

  if (!session) {
    throw new Error('No active quiz session found. Please start the quiz again.');
  }

  const question = getQuestionById(normalizedSkill, questionId);
  if (!question) {
    throw new Error('Question not found in question bank');
  }

  const isCorrect = Number(selectedIndex) === question.correctIndex;
  const currentDiff = question.difficulty;

  // Track state
  if (isCorrect) {
    session.score += 1;
    if (currentDiff === 'hard') {
      session.hardCorrectCount += 1;
    }
  } else {
    // Collect gap topic
    if (question.topic) {
      session.identifiedGaps.add(question.topic);
    }
  }

  session.answeredQuestions.push({
    id: question.id,
    difficulty: currentDiff,
    selectedIndex: Number(selectedIndex),
    correctIndex: question.correctIndex,
    isCorrect,
    topic: question.topic,
    explanation: question.explanation
  });

  const isLastQuestion = session.currentStep >= session.totalSteps;

  if (isLastQuestion) {
    // Finalize quiz results
    const summary = await finalizeQuiz(userId, normalizedSkill, session);
    activeSessions.delete(sessionKey);

    return {
      isCorrect,
      correctIndex: question.correctIndex,
      correctAnswer: question.correctIndex,
      explanation: question.explanation,
      isFinished: true,
      isCompleted: true,
      currentScore: session.score,
      summary,
      result: summary
    };
  }

  // Calculate next adaptive difficulty
  let nextDiff = currentDiff;
  if (isCorrect) {
    if (currentDiff === 'easy') nextDiff = 'medium';
    else if (currentDiff === 'medium') nextDiff = 'hard';
    else if (currentDiff === 'hard') nextDiff = 'hard';
  } else {
    if (currentDiff === 'hard') nextDiff = 'medium';
    else if (currentDiff === 'medium') nextDiff = 'easy';
    else if (currentDiff === 'easy') nextDiff = 'easy';
  }

  session.currentStep += 1;
  session.currentDifficulty = nextDiff;

  const usedIds = session.answeredQuestions.map((q) => q.id);
  const nextQ = getQuestion(normalizedSkill, nextDiff, usedIds);
  session.currentQuestionId = nextQ.id;

  return {
    isCorrect,
    correctIndex: question.correctIndex,
    correctAnswer: question.correctIndex,
    explanation: question.explanation,
    isFinished: false,
    isCompleted: false,
    currentScore: session.score,
    nextStep: session.currentStep,
    totalSteps: session.totalSteps,
    nextDifficulty: nextDiff,
    nextQuestion: {
      id: nextQ.id,
      topic: nextQ.topic,
      text: nextQ.question,
      prompt: nextQ.question,
      codeSnippet: nextQ.codeSnippet || null,
      difficulty: nextDiff,
      options: nextQ.options
    }
  };
}

/**
 * Finalize quiz, apply qualification rubric, and persist to user profile in MongoDB
 */
async function finalizeQuiz(userId, skill, session) {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  const totalAnswered = session.answeredQuestions.length;
  const score = session.score;
  const hardCorrect = session.hardCorrectCount;
  const gapsArray = Array.from(session.identifiedGaps);

  // Rubric for 5-question adaptive micro-checks:
  // Advanced: At least 2 Hard questions correct AND score >= 3 (or overall score >= 4)
  // Intermediate: Score >= 2 (or at least 1 Hard correct)
  // Beginner: Otherwise (score <= 1)
  let verifiedLevel = 'beginner';
  if ((hardCorrect >= 2 && score >= 3) || score >= 4) {
    verifiedLevel = 'advanced';
  } else if (score >= 2 || hardCorrect >= 1) {
    verifiedLevel = 'intermediate';
  } else {
    verifiedLevel = 'beginner';
  }

  // Locate skill in user document
  const skillIndex = (user.skills || []).findIndex(
    (s) => (s.name || '').toLowerCase() === skill
  );

  const selfRated = session.selfRated || 'intermediate';

  if (skillIndex !== -1) {
    const existing = user.skills[skillIndex];
    existing.selfRatedProficiency = existing.selfRatedProficiency || existing.proficiency || selfRated;
    // Replace proficiency with verified level for downstream algorithms & roadmaps
    existing.proficiency = verifiedLevel;
    existing.verifiedProficiency = verifiedLevel;
    existing.isQuizVerified = true;
    existing.quizScore = score;
    existing.quizGaps = gapsArray;
    existing.quizVerifiedAt = new Date();
  } else {
    // If skill wasn't in list, append it
    user.skills.push({
      name: skill,
      displayName: session.displayName || skill.toUpperCase(),
      proficiency: verifiedLevel,
      selfRatedProficiency: selfRated,
      verifiedProficiency: verifiedLevel,
      isQuizVerified: true,
      quizScore: score,
      quizGaps: gapsArray,
      quizVerifiedAt: new Date()
    });
  }

  await user.save();

  // Determine comparison status
  const levelOrder = { beginner: 1, intermediate: 2, advanced: 3 };
  const selfOrder = levelOrder[selfRated.toLowerCase()] || 2;
  const verifiedOrder = levelOrder[verifiedLevel] || 2;

  let comparisonStatus = 'matched';
  if (verifiedOrder < selfOrder) {
    comparisonStatus = 'downgraded';
  } else if (verifiedOrder > selfOrder) {
    comparisonStatus = 'upgraded';
  }

  // Construct educational feedback message
  let summaryMessage = `You claimed ${capitalize(selfRated)}, and the quiz confirmed ${capitalize(verifiedLevel)}.`;
  if (comparisonStatus === 'downgraded') {
    const gapList = gapsArray.slice(0, 2).join(' and ');
    summaryMessage = `You claimed ${capitalize(selfRated)}, but the quiz indicates ${capitalize(verifiedLevel)}. We recommend focusing on ${gapList || 'core concepts'} in your upcoming roadmap.`;
  } else if (comparisonStatus === 'upgraded') {
    summaryMessage = `Great job! You claimed ${capitalize(selfRated)}, but tested at an ${capitalize(verifiedLevel)} level!`;
  }

  return {
    skill,
    displayName: session.displayName || capitalize(skill),
    score,
    total: totalAnswered,
    totalQuestions: totalAnswered,
    hardCorrect,
    selfRated: selfRated.toLowerCase(),
    selfRatedProficiency: selfRated.toLowerCase(),
    quizSays: verifiedLevel,
    verifiedProficiency: verifiedLevel,
    comparisonStatus,
    identifiedGaps: gapsArray,
    gaps: gapsArray,
    summaryMessage,
    realityCheckMessage: summaryMessage,
    isQuizVerified: true,
    verifiedAt: new Date(),
    user
  };
}

function capitalize(s) {
  if (!s) return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

module.exports = {
  startQuizSession,
  submitAnswer,
  finalizeQuiz
};
