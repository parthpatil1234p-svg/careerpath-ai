/**
 * js/quiz.js — Adaptive Skill Reality-Check Controller
 *
 * Implements the 6-question dynamic difficulty micro-quiz.
 * Compares "You Said" vs "Quiz Says" and unlocks the verified credential.
 *
 * CareerPath AI · Team: 404 Brain Not Found
 */

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Check Authentication (Graceful guest view + Auto-auth on start)
  const isAuth = Boolean(window.Auth?.isAuthenticated?.() || window.Auth?.isLoggedIn?.());

  // 2. DOM Elements
  const alertContainer = document.getElementById('quizAlertContainer');
  const skillSelectorTabs = document.getElementById('skillSelectorTabs');

  // Screens
  const screenIntro = document.getElementById('screenIntro');
  const screenQuiz = document.getElementById('screenQuiz');
  const screenVerdict = document.getElementById('screenVerdict');

  // Intro Screen Elements
  const introSkillCategory = document.getElementById('introSkillCategory');
  const introSkillTitle = document.getElementById('introSkillTitle');
  const introSkillDesc = document.getElementById('introSkillDesc');
  const introSelfRatedProficiency = document.getElementById('introSelfRatedProficiency');
  const btnStartQuiz = document.getElementById('btnStartQuiz');

  // Quiz Screen Elements
  const activeSkillBadge = document.getElementById('activeSkillBadge');
  const qCurrent = document.getElementById('qCurrent');
  const qTotal = document.getElementById('qTotal');
  const difficultyPill = document.getElementById('difficultyPill');
  const difficultyLabel = document.getElementById('difficultyLabel');
  const quizStepper = document.getElementById('quizStepper');
  const questionPrompt = document.getElementById('questionPrompt');
  const questionCode = document.getElementById('questionCode');
  const optionsContainer = document.getElementById('optionsContainer');
  const feedbackBox = document.getElementById('feedbackBox');
  const feedbackIcon = document.getElementById('feedbackIcon');
  const feedbackTitle = document.getElementById('feedbackTitle');
  const feedbackText = document.getElementById('feedbackText');
  const topicName = document.getElementById('topicName');
  const btnSubmitAnswer = document.getElementById('btnSubmitAnswer');
  const btnNextQuestion = document.getElementById('btnNextQuestion');

  // Verdict Screen Elements
  const verdictClaimed = document.getElementById('verdictClaimed');
  const verdictActual = document.getElementById('verdictActual');
  const verdictScore = document.getElementById('verdictScore');
  const verdictMessage = document.getElementById('verdictMessage');
  const verdictGapsSection = document.getElementById('verdictGapsSection');
  const verdictGapsList = document.getElementById('verdictGapsList');
  const btnQuizAnotherSkill = document.getElementById('btnQuizAnotherSkill');

  // 3. State
  const SUPPORTED_SKILLS = [
    { key: 'javascript', label: 'JavaScript', icon: 'bi-filetype-js', category: 'Frontend & Full-Stack' },
    { key: 'python', label: 'Python', icon: 'bi-filetype-py', category: 'AI & Data Engineering' },
    { key: 'sql', label: 'SQL', icon: 'bi-database-fill', category: 'Databases & Backend' },
  ];

  let currentUser = window.Auth?.getCurrentUser ? window.Auth.getCurrentUser() : null;
  let userSkills = [];
  let activeSkillKey = 'javascript';
  let activeSkillInfo = null;

  let currentSessionId = null;
  let currentQuestion = null;
  let currentQuestionIdx = 1;
  let selectedOptionIdx = null;
  let isAnswerLocked = false;
  let nextQuestionData = null;
  let sessionCompleted = false;
  let sessionResultData = null;

  // 4. Utility Functions
  const showAlert = (message, type = 'danger') => {
    if (!alertContainer) return;
    alertContainer.innerHTML = `
      <div class="alert alert-${type} alert-dismissible fade show d-flex align-items-center gap-2 py-3 px-4 shadow-sm mb-4" role="alert">
        <i class="bi ${type === 'danger' ? 'bi-exclamation-triangle-fill' : 'bi-check-circle-fill'} fs-5"></i>
        <div class="small">${escapeHtml(message)}</div>
        <button type="button" class="btn-close ms-auto" data-bs-dismiss="alert" aria-label="Close"></button>
      </div>
    `;
    window.scrollTo({ top: 100, behavior: 'smooth' });
  };

  const escapeHtml = (str) => {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  };

  const capitalize = (str) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  // 5. Load User Profile & Check Skills
  const initUserSkills = async () => {
    try {
      if (window.Auth?.isAuthenticated?.()) {
        const res = await window.API.get('/users/me', { auth: true });
        if (res.success && res.data?.user) {
          currentUser = res.data.user;
          window.Auth.setCurrentUser(currentUser);
          userSkills = currentUser.skills || [];
        } else if (currentUser) {
          userSkills = currentUser.skills || [];
        }
      } else if (currentUser) {
        userSkills = currentUser.skills || [];
      }
    } catch (err) {
      if (currentUser) {
        userSkills = currentUser.skills || [];
      }
    }

    // Determine initial skill from query params
    const urlParams = new URLSearchParams(window.location.search);
    const paramSkill = (urlParams.get('skill') || '').toLowerCase().trim();
    if (paramSkill && SUPPORTED_SKILLS.some((s) => s.key === paramSkill)) {
      activeSkillKey = paramSkill;
    } else {
      // Find first unverified skill user possesses
      const match = SUPPORTED_SKILLS.find((sup) => {
        const uSkill = userSkills.find((us) => (us.name || '').toLowerCase() === sup.key);
        return uSkill && !uSkill.isQuizVerified;
      });
      activeSkillKey = match ? match.key : 'javascript';
    }

    renderSkillTabs();
    loadIntroForSkill(activeSkillKey);
  };

  // 6. Render Skill Switcher Tabs
  const renderSkillTabs = () => {
    if (!skillSelectorTabs) return;

    skillSelectorTabs.innerHTML = SUPPORTED_SKILLS.map((item) => {
      const uSkill = userSkills.find((s) => (s.name || '').toLowerCase() === item.key);
      const isVerified = Boolean(uSkill?.isQuizVerified);
      const isActive = item.key === activeSkillKey;

      const badgeHtml = isVerified
        ? `<span class="badge-pill-verified"><i class="bi bi-check2"></i> Verified</span>`
        : uSkill
        ? `<span class="badge badge-gold" style="font-size: 0.65rem;">Self-Rated</span>`
        : `<span class="badge bg-secondary" style="font-size: 0.65rem;">Optional</span>`;

      return `
        <button type="button" class="skill-select-btn ${isActive ? 'active' : ''}" data-skill="${item.key}">
          <i class="bi ${item.icon}"></i>
          <span>${item.label}</span>
          ${badgeHtml}
        </button>
      `;
    }).join('');

    // Attach click events
    skillSelectorTabs.querySelectorAll('.skill-select-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const skill = btn.getAttribute('data-skill');
        if (skill && skill !== activeSkillKey) {
          activeSkillKey = skill;
          renderSkillTabs();
          loadIntroForSkill(activeSkillKey);
        }
      });
    });
  };

  // 7. Load Intro for Target Skill
  const loadIntroForSkill = (skillKey) => {
    activeSkillInfo = SUPPORTED_SKILLS.find((s) => s.key === skillKey) || SUPPORTED_SKILLS[0];
    const userSkillObj = userSkills.find((s) => (s.name || '').toLowerCase() === skillKey);

    const selfRated = userSkillObj?.selfRatedProficiency || userSkillObj?.proficiency || 'intermediate';
    const isVerified = Boolean(userSkillObj?.isQuizVerified);

    if (introSkillCategory) introSkillCategory.textContent = activeSkillInfo.category;
    if (introSkillTitle) introSkillTitle.textContent = `${activeSkillInfo.label} Reality-Check`;
    if (introSelfRatedProficiency) introSelfRatedProficiency.textContent = capitalize(selfRated);

    if (introSkillDesc) {
      if (isVerified) {
        introSkillDesc.innerHTML = `
          You have already verified this skill at the <strong class="text-success">${capitalize(userSkillObj.verifiedProficiency || selfRated)}</strong> level.
          Taking it again will recalibrate your knowledge and refresh your reality-check score.
        `;
      } else {
        introSkillDesc.innerHTML = `
          You self-rated this skill as <strong class="text-primary">${capitalize(selfRated)}</strong>.
          Take this 2-minute reality-check to confirm your knowledge level and earn your verified badge.
        `;
      }
    }

    if (btnStartQuiz) {
      btnStartQuiz.innerHTML = `
        <span>Start 2-Min Reality-Check</span>
        <i class="bi bi-lightning-charge-fill ms-1"></i>
      `;
      btnStartQuiz.disabled = false;
    }

    // Switch view to intro
    screenIntro.classList.remove('d-none');
    screenQuiz.classList.add('d-none');
    screenVerdict.classList.add('d-none');
  };

  // 8. Start Quiz Action
  if (btnStartQuiz) {
    btnStartQuiz.addEventListener('click', async () => {
      btnStartQuiz.disabled = true;
      btnStartQuiz.innerHTML = `
        <span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
        <span>Initializing Reality-Check...</span>
      `;

      // Seamless Demo Auto-Auth if guest / unauthenticated
      if (!window.Auth?.isAuthenticated?.()) {
        try {
          const autoRes = await window.API.post('/auth/login', {
            email: 'demouser@gmail.com',
            password: 'demo123'
          });
          if (autoRes.success && autoRes.data?.token) {
            window.Auth.setToken(autoRes.data.token);
            window.Auth.setCurrentUser(autoRes.data.user);
            currentUser = autoRes.data.user;
            userSkills = currentUser.skills || [];
            if (window.Auth.initNav) window.Auth.initNav();
          }
        } catch (_) {
          const currentUrl = encodeURIComponent(window.location.pathname + window.location.search);
          window.location.href = `login.html?redirect=${currentUrl}`;
          return;
        }
      }

      try {
        const response = await window.API.post('/quiz/start', { skill: activeSkillKey }, { auth: true });

        if (response.success && response.data) {
          const data = response.data;
          currentSessionId = data.sessionId;
          currentQuestionIdx = data.questionIndex || 1;
          currentQuestion = data.question;
          sessionCompleted = false;
          nextQuestionData = null;
          sessionResultData = null;

          // Transition to Quiz Screen
          screenIntro.classList.add('d-none');
          screenVerdict.classList.add('d-none');
          screenQuiz.classList.remove('d-none');

          renderActiveQuestion(data.question, data.currentDifficulty, currentQuestionIdx, data.totalQuestions || 5);
        } else {
          showAlert(response.message || 'Could not start quiz session.');
          btnStartQuiz.disabled = false;
          btnStartQuiz.innerHTML = `<span>Start 2-Min Reality-Check</span> <i class="bi bi-lightning-charge-fill ms-1"></i>`;
        }
      } catch (err) {
        console.error('Quiz start error:', err);
        showAlert(err.message || 'Network error starting quiz. Please try again.');
        btnStartQuiz.disabled = false;
        btnStartQuiz.innerHTML = `<span>Start 2-Min Reality-Check</span> <i class="bi bi-lightning-charge-fill ms-1"></i>`;
      }
    });
  }

  // 9. Render Question
  const renderActiveQuestion = (q, difficulty, qIndex, qTotalCount) => {
    isAnswerLocked = false;
    selectedOptionIdx = null;

    // Meta Bar
    if (activeSkillBadge) activeSkillBadge.textContent = activeSkillInfo.label.toUpperCase();
    if (qCurrent) qCurrent.textContent = qIndex;
    if (qTotal) qTotal.textContent = qTotalCount;

    // Difficulty Pill
    const diff = (difficulty || 'medium').toLowerCase();
    if (difficultyPill && difficultyLabel) {
      difficultyPill.className = `difficulty-pill ${diff}`;
      difficultyLabel.textContent = capitalize(diff);
    }

    // Stepper Dots
    if (quizStepper) {
      const dots = quizStepper.querySelectorAll('.quiz-step-dot');
      dots.forEach((dot, idx) => {
        dot.className = 'quiz-step-dot';
        if (idx < qIndex - 1) {
          dot.classList.add('completed');
        } else if (idx === qIndex - 1) {
          dot.classList.add('active');
        }
      });
    }

    // Prompt & Code
    if (questionPrompt) questionPrompt.textContent = q.prompt || 'Question prompt';

    if (questionCode) {
      if (q.codeSnippet && q.codeSnippet.trim()) {
        questionCode.classList.remove('d-none');
        questionCode.querySelector('code').textContent = q.codeSnippet;
      } else {
        questionCode.classList.add('d-none');
      }
    }

    // Topic
    if (topicName) topicName.textContent = q.topic || 'General';

    // Options Cards
    if (optionsContainer) {
      optionsContainer.innerHTML = (q.options || []).map((optText, idx) => `
        <div class="quiz-option-card" data-idx="${idx}">
          <div class="quiz-option-radio">
            <div class="quiz-option-radio-dot"></div>
          </div>
          <span class="quiz-option-text">${escapeHtml(optText)}</span>
        </div>
      `).join('');

      // Option click handler
      optionsContainer.querySelectorAll('.quiz-option-card').forEach((card) => {
        card.addEventListener('click', () => {
          if (isAnswerLocked) return;

          optionsContainer.querySelectorAll('.quiz-option-card').forEach((c) => c.classList.remove('selected'));
          card.classList.add('selected');
          selectedOptionIdx = parseInt(card.getAttribute('data-idx'), 10);

          if (btnSubmitAnswer) {
            btnSubmitAnswer.disabled = false;
          }
        });
      });
    }

    // Feedback & Action Buttons
    if (feedbackBox) feedbackBox.classList.add('d-none');
    if (btnSubmitAnswer) {
      btnSubmitAnswer.classList.remove('d-none');
      btnSubmitAnswer.disabled = true;
      btnSubmitAnswer.innerHTML = `<span>Submit Answer</span> <i class="bi bi-check2 ms-1"></i>`;
    }
    if (btnNextQuestion) {
      btnNextQuestion.classList.add('d-none');
    }
  };

  // 10. Submit Answer
  if (btnSubmitAnswer) {
    btnSubmitAnswer.addEventListener('click', async () => {
      if (selectedOptionIdx === null || isAnswerLocked) return;

      isAnswerLocked = true;
      btnSubmitAnswer.disabled = true;
      btnSubmitAnswer.innerHTML = `
        <span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
        <span>Verifying...</span>
      `;

      try {
        const response = await window.API.post(
          '/quiz/answer',
          {
            skill: activeSkillKey,
            sessionId: currentSessionId,
            questionId: currentQuestion.id,
            selectedIndex: selectedOptionIdx,
            selectedOption: selectedOptionIdx,
          },
          { auth: true }
        );

        if (response.success && response.data) {
          const resData = response.data;
          const isCorrect = Boolean(resData.isCorrect);
          const correctAnswer = Number(resData.correctAnswer !== undefined ? resData.correctAnswer : resData.correctIndex);
          const explanation = resData.explanation || '';
          const isCompleted = Boolean(resData.isCompleted || resData.isFinished);
          const nextQuestion = resData.nextQuestion;
          const nextDifficulty = resData.nextDifficulty;
          const result = resData.result || resData.summary;

          // Lock option cards styling
          optionsContainer.querySelectorAll('.quiz-option-card').forEach((card) => {
            card.classList.add('locked');
            const idx = parseInt(card.getAttribute('data-idx'), 10);

            if (idx === correctAnswer) {
              card.classList.add('option-correct');
            } else if (idx === selectedOptionIdx && !isCorrect) {
              card.classList.add('option-wrong');
            }
          });

          // Show Instant Feedback
          if (feedbackBox) {
            feedbackBox.className = `quiz-feedback-box ${isCorrect ? 'correct' : 'incorrect'}`;
            if (feedbackIcon) {
              feedbackIcon.innerHTML = isCorrect
                ? '<i class="bi bi-check-circle-fill"></i>'
                : '<i class="bi bi-x-circle-fill"></i>';
            }
            if (feedbackTitle) {
              feedbackTitle.textContent = isCorrect ? 'Spot on! Correct answer.' : 'Not quite.';
            }
            if (feedbackText) {
              feedbackText.textContent = explanation || '';
            }
            feedbackBox.classList.remove('d-none');
          }

          // Stepper dot update for current
          if (quizStepper) {
            const dots = quizStepper.querySelectorAll('.quiz-step-dot');
            if (dots[currentQuestionIdx - 1]) {
              dots[currentQuestionIdx - 1].classList.remove('active');
              dots[currentQuestionIdx - 1].classList.add('completed');
            }
          }

          // State for next step
          sessionCompleted = Boolean(isCompleted);
          nextQuestionData = nextQuestion;
          sessionResultData = result;

          // Toggle action buttons
          btnSubmitAnswer.classList.add('d-none');
          btnNextQuestion.classList.remove('d-none');

          if (sessionCompleted) {
            btnNextQuestion.innerHTML = `<span>See Reality-Check Verdict</span> <i class="bi bi-trophy-fill ms-1"></i>`;
          } else {
            btnNextQuestion.innerHTML = `<span>Next Question (${nextDifficulty ? capitalize(nextDifficulty) : 'Adaptive'})</span> <i class="bi bi-arrow-right ms-1"></i>`;
          }
        } else {
          showAlert(response.message || 'Error checking answer.');
          isAnswerLocked = false;
          btnSubmitAnswer.disabled = false;
          btnSubmitAnswer.innerHTML = `<span>Submit Answer</span> <i class="bi bi-check2 ms-1"></i>`;
        }
      } catch (err) {
        showAlert(err.message || 'Failed to submit answer. Please try again.');
        isAnswerLocked = false;
        btnSubmitAnswer.disabled = false;
        btnSubmitAnswer.innerHTML = `<span>Submit Answer</span> <i class="bi bi-check2 ms-1"></i>`;
      }
    });
  }

  // 11. Next Question Button Handler
  if (btnNextQuestion) {
    btnNextQuestion.addEventListener('click', () => {
      if (sessionCompleted && sessionResultData) {
        renderVerdict(sessionResultData);
      } else if (nextQuestionData) {
        currentQuestionIdx++;
        currentQuestion = nextQuestionData;
        renderActiveQuestion(
          currentQuestion,
          nextQuestionData.difficulty || 'medium',
          currentQuestionIdx,
          5
        );
      }
    });
  }

  // 12. Render Reality-Check Verdict
  const renderVerdict = (result) => {
    screenQuiz.classList.add('d-none');
    screenVerdict.classList.remove('d-none');
    window.scrollTo({ top: 120, behavior: 'smooth' });

    const claimed = result.selfRatedProficiency || result.selfRated || 'Intermediate';
    const actual = result.verifiedProficiency || result.quizSays || result.verifiedLevel || 'Intermediate';

    if (verdictClaimed) verdictClaimed.textContent = capitalize(claimed);
    if (verdictActual) verdictActual.textContent = capitalize(actual);

    if (verdictScore) {
      verdictScore.textContent = `Score: ${result.score || 0} / ${result.totalQuestions || result.total || 5} Correct`;
    }

    if (verdictMessage) {
      verdictMessage.textContent = result.realityCheckMessage || result.summaryMessage || 'Reality-check validation complete.';
    }

    // Render Gaps
    if (verdictGapsList && verdictGapsSection) {
      const gaps = Array.isArray(result.gaps) ? result.gaps : Array.isArray(result.identifiedGaps) ? result.identifiedGaps : [];
      if (gaps.length > 0) {
        verdictGapsSection.classList.remove('d-none');
        verdictGapsList.innerHTML = gaps
          .map((g) => `<span class="gap-pill"><i class="bi bi-bookmark-check me-1"></i>${escapeHtml(g)}</span>`)
          .join('');
      } else {
        verdictGapsSection.classList.add('d-none');
      }
    }

    // Refresh user's updated skill list in memory
    const userToSave = result.user || currentUser;
    if (userToSave) {
      userToSave.hasCompletedSkillVerification = true;
      if (result.user?.skills) userToSave.skills = result.user.skills;
      window.Auth.setCurrentUser(userToSave);
      userSkills = userToSave.skills || [];
      renderSkillTabs();
    }
  };

  // 13. Verify Another Skill
  if (btnQuizAnotherSkill) {
    btnQuizAnotherSkill.addEventListener('click', () => {
      // Find next unverified skill
      const nextSkill = SUPPORTED_SKILLS.find((sup) => {
        if (sup.key === activeSkillKey) return false;
        const u = userSkills.find((us) => (us.name || '').toLowerCase() === sup.key);
        return u && !u.isQuizVerified;
      }) || SUPPORTED_SKILLS.find((s) => s.key !== activeSkillKey) || SUPPORTED_SKILLS[0];

      activeSkillKey = nextSkill.key;
      renderSkillTabs();
      loadIntroForSkill(activeSkillKey);
    });
  }

  // Initial Boot
  if (window.Auth?.initNav) {
    window.Auth.initNav();
  }
  initUserSkills();
});
