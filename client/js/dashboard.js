/**
 * dashboard.js — Student Dashboard Controller
 *
 * Interacts with:
 * - GET   /api/dashboard
 * - PATCH /api/roadmaps/tasks/:taskId/toggle
 * - window.initProgressOrb() for 3D progress visualization
 */

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Route guard
  if (!window.Auth?.isAuthenticated()) {
    window.Auth?.requireAuth();
    return;
  }

  // 1.1 Verification Gate Check
  if (!window.Auth?.isSkillVerified()) {
    const dashboardContent = document.getElementById('dashboardContent') || document.querySelector('main');
    window.Auth?.renderVerificationGate(
      dashboardContent,
      'Dashboard',
      'Your personal career telemetry, skill readiness scores, and milestone trackers'
    );
    return;
  }

  // 2. DOM Elements
  const loadingState = document.getElementById('loadingState');
  const dashboardErrorState = document.getElementById('dashboardErrorState');
  const dashboardErrorMessage = document.getElementById('dashboardErrorMessage');
  const btnRetryDashboard = document.getElementById('btnRetryDashboard');
  const dashboardContent = document.getElementById('dashboardContent');
  const alertContainer = document.getElementById('alertContainer');

  const userAvatar = document.getElementById('userAvatar');
  const userName = document.getElementById('userName');
  const userEmail = document.getElementById('userEmail');
  const userDegree = document.getElementById('userDegree');
  const userSkillsCount = document.getElementById('userSkillsCount');

  const activeRoadmapPace = document.getElementById('activeRoadmapPace');
  const activeCareerTitle = document.getElementById('activeCareerTitle');
  const activeCareerDesc = document.getElementById('activeCareerDesc');
  const statPercentage = document.getElementById('statPercentage');
  const statTasks = document.getElementById('statTasks');
  const statHours = document.getElementById('statHours');
  const btnGoToRoadmap = document.getElementById('btnGoToRoadmap');

  const nextActionText = document.getElementById('nextActionText');
  const nextActionBtn = document.getElementById('nextActionBtn');
  const upcomingTasksList = document.getElementById('upcomingTasksList');

  let dashboardData = null;

  const setDashboardState = (state, message = '') => {
    loadingState?.classList.toggle('d-none', state !== 'loading');
    dashboardErrorState?.classList.toggle('d-none', state !== 'error');
    dashboardContent?.classList.toggle('d-none', state !== 'ready');
    if (dashboardErrorMessage && message) dashboardErrorMessage.textContent = message;
  };

  const showAlert = (message, type = 'danger') => {
    if (!alertContainer) return;
    alertContainer.innerHTML = `
      <div class="alert alert-${type} alert-dismissible fade show d-flex align-items-center gap-2 py-3 px-4 shadow-sm mb-4" role="alert">
        <i class="bi ${type === 'danger' ? 'bi-exclamation-triangle-fill' : 'bi-check-circle-fill'} fs-5"></i>
        <div class="small">${escapeHtml(message)}</div>
        <button type="button" class="btn-close btn-close-white ms-auto" data-bs-dismiss="alert" aria-label="Close"></button>
      </div>
    `;
  };

  // 3. Load Dashboard Data
  const loadDashboard = async () => {
    setDashboardState('loading');
    try {
      const res = await window.API.get('/dashboard', { auth: true });

      if (res.success && res.data) {
        dashboardData = res.data;
        setDashboardState('ready');
        renderDashboard();
      } else {
        setDashboardState('error', res.message || 'Unable to load dashboard data.');
      }
    } catch (err) {
      if (err.status === 403 || err.requiresSkillVerification) {
        setDashboardState('ready');
        window.Auth?.renderVerificationGate(
          dashboardContent || document.querySelector('main'),
          'Dashboard',
          'Your personal career telemetry, skill readiness scores, and milestone trackers'
        );
        return;
      }
      setDashboardState('error', err.message || 'Failed to fetch student dashboard telemetry.');
    }
  };

  btnRetryDashboard?.addEventListener('click', loadDashboard);

  // 4. Render Dashboard Views
  const renderDashboard = () => {
    if (!dashboardContent) return;
    dashboardContent.classList.remove('d-none');
    const { user, activeRoadmap, upcomingTasks = [], nextAction } = dashboardData || {};

    // Profile Card
    const nameStr = user?.name || 'Student';
    userName.textContent = nameStr;
    if (user?.avatarUrl) {
      userAvatar.innerHTML = `<img src="${escapeHtml(user.avatarUrl)}" alt="${escapeHtml(nameStr)}" class="rounded-circle w-100 h-100" style="object-fit: cover;" />`;
    } else {
      userAvatar.textContent = nameStr.charAt(0).toUpperCase();
    }
    userEmail.textContent = user?.email || '';

    const degreeName = user?.education?.course || user?.education?.degree || 'Degree not specified';
    const branchName = user?.education?.branch ? ` (${user.education.branch})` : '';
    userDegree.innerHTML = `<i class="bi bi-mortarboard-fill text-warning me-1"></i> ${escapeHtml(degreeName + branchName)}`;

    const skillCount = user?.skills?.length || 0;
    userSkillsCount.innerHTML = `<i class="bi bi-tools text-teal me-1"></i> ${skillCount} Skills Logged`;

    // Render Resume Status
    const viewResumeLink = document.getElementById('viewResumeLink');
    const noResumeText = document.getElementById('noResumeText');
    if (user?.resumeUrl) {
      if (viewResumeLink) {
        viewResumeLink.href = 'javascript:void(0)';
        viewResumeLink.removeAttribute('target');
        viewResumeLink.classList.remove('d-none');
        viewResumeLink.onclick = (e) => {
          e.preventDefault();
          openResumeViewerModal();
        };
      }
      if (noResumeText) noResumeText.classList.add('d-none');
    } else {
      if (viewResumeLink) viewResumeLink.classList.add('d-none');
      if (noResumeText) noResumeText.classList.remove('d-none');
    }

    // Render Skills Matrix Card
    renderSkillsMatrix(user?.skills || []);

    // Render GitHub Study Lab & Repositories Card
    renderGitHubStudyLab(user);

    // Active Roadmap & 3D Progress Orb
    if (activeRoadmap) {
      activeCareerTitle.textContent = activeRoadmap.career?.title || 'Selected Career';
      activeCareerDesc.textContent =
        activeRoadmap.career?.shortDescription ||
        'Personalized roadmap generated to close your skill gaps.';
      activeRoadmapPace.textContent = `${activeRoadmap.durationWeeks} Weeks`;

      const pct = Math.round(activeRoadmap.progressPercentage || 0);
      if (typeof window.animateCounter === 'function') {
        window.animateCounter(statPercentage, pct, { suffix: '%', duration: 1.2 });
      } else {
        statPercentage.textContent = `${pct}%`;
      }

      const total = activeRoadmap.totalTasksCount ?? activeRoadmap.totalTasks ?? 0;
      const completed = activeRoadmap.completedTasksCount ?? activeRoadmap.completedTasks ?? 0;
      statTasks.textContent = `${completed} / ${total}`;

      // Estimated hours remaining (estimate 2 hours per incomplete task)
      const remainingTasks = Math.max(0, total - completed);
      statHours.textContent = `~${remainingTasks * 2} hrs left`;

      btnGoToRoadmap.href = 'roadmap.html';
      btnGoToRoadmap.innerHTML = '<i class="bi bi-map-fill me-1"></i> Open Full Roadmap';

      // Initialize 3D Progress Orb
      if (window.initProgressOrb) {
        window.initProgressOrb('progress-orb', pct);
      }
    } else {
      activeCareerTitle.textContent = 'No Active Roadmap Yet';
      activeCareerDesc.textContent = 'Take your assessment and select a career to generate an AI curriculum.';
      activeRoadmapPace.textContent = 'Not Started';
      statPercentage.textContent = '0%';
      statTasks.textContent = '0 / 0';
      statHours.textContent = '0 hrs';

      btnGoToRoadmap.href = 'recommendations.html';
      btnGoToRoadmap.innerHTML = '<i class="bi bi-stars me-1"></i> Choose a Career';

      if (window.initProgressOrb) {
        window.initProgressOrb('progress-orb', 0);
      }
    }

    // Recommended Next Action
    if (nextAction && nextActionBtn) {
      nextActionText.textContent = nextAction.prompt || 'Continue your learning path';
      nextActionBtn.href = nextAction.actionUrl || 'roadmap.html';
      const actionSpan = nextActionBtn.querySelector('span');
      if (actionSpan) {
        actionSpan.textContent = nextAction.actionLabel || 'Proceed';
      }
    }

    // Upcoming Incomplete Tasks
    if (upcomingTasks && upcomingTasks.length > 0) {
      upcomingTasksList.innerHTML = upcomingTasks
        .map((task) => {
          const resourceBadge = task.resource?.url
            ? `<a href="${escapeHtml(task.resource.url)}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-outline-secondary py-0 px-2 ms-2" style="font-size: 0.75rem; border-radius: var(--radius-sm);">
                <i class="bi bi-box-arrow-up-right me-1"></i>${escapeHtml(task.resource.type || 'Resource')}
               </a>`
            : '';

          return `
            <div class="dashboard-task-item d-flex align-items-center justify-content-between gap-3 flex-wrap ${task.completed ? 'is-completed' : ''}" data-task-id="${task._id}">
              <div class="d-flex align-items-center gap-3 flex-grow-1" style="min-width: 0;">
                <input
                  type="checkbox"
                  class="task-checkbox-input"
                  ${task.completed ? 'checked' : ''}
                  data-task-id="${task._id}"
                  aria-label="Mark task ${escapeHtml(task.title)} complete"
                />
                <div>
                  <div class="fw-semibold small task-title mb-0" style="color: var(--ink);">
                    Week ${task.weekNumber}: ${escapeHtml(task.title)}
                  </div>
                  <div class="d-flex align-items-center gap-2 mt-1 flex-wrap">
                    <span class="badge badge-type-${task.type} text-uppercase font-monospace" style="font-size: 0.75rem;">
                      ${escapeHtml(task.type)}
                    </span>
                    <span class="badge badge-priority-${task.priority}" style="font-size: 0.75rem;">
                      ${escapeHtml(task.priority)}
                    </span>
                    <span class="text-secondary" style="font-size: 0.75rem; font-family: var(--font-mono);">
                      <i class="bi bi-clock me-1"></i>${task.estimatedHours || 2}h
                    </span>
                  </div>
                </div>
              </div>
              <div class="d-flex align-items-center gap-2">
                ${resourceBadge}
              </div>
            </div>
          `;
        })
        .join('');

      // Wire Task Checkbox Toggles
      upcomingTasksList.querySelectorAll('.task-checkbox-input').forEach((cb) => {
        cb.addEventListener('change', async (e) => {
          const taskId = e.target.getAttribute('data-task-id');
          const isChecked = e.target.checked;
          const parentItem = e.target.closest('.dashboard-task-item');

          // DISABLE to prevent spamming
          const allCheckboxes = upcomingTasksList.querySelectorAll('.task-checkbox-input');
          allCheckboxes.forEach(c => c.disabled = true);

          if (parentItem) {
            parentItem.classList.toggle('is-completed', isChecked);
          }

          try {
            const res = await window.API.patch(`/roadmaps/tasks/${taskId}/toggle`, {}, { auth: true });

            if (res.success && res.data) {
              const { roadmap } = res.data;
              // Refresh telemetry
              const pct = Math.round(roadmap.progressPercentage || 0);
              statPercentage.textContent = `${pct}%`;
              statTasks.textContent = `${roadmap.completedTasksCount} / ${roadmap.totalTasksCount}`;

              if (window.initProgressOrb) {
                window.initProgressOrb('progress-orb', pct);
              }

              showAlert('Task progress updated!', 'success');
              // Reload dashboard after a brief delay to refresh the first 5 upcoming list
              setTimeout(() => {
                loadDashboard();
              }, 800);
            } else {
              e.target.checked = !isChecked;
              if (parentItem) parentItem.classList.toggle('is-completed', !isChecked);
              showAlert(res.message || 'Failed to toggle task.');
            }
          } catch (err) {
            console.error('Toggle error:', err);
            e.target.checked = !isChecked;
            if (parentItem) parentItem.classList.toggle('is-completed', !isChecked);
            showAlert(err.message || 'Error updating task.');
          } finally {
            // RE-ENABLE
            allCheckboxes.forEach(c => c.disabled = false);
          }
        });
      });
    } else {
      upcomingTasksList.innerHTML = `
        <div class="text-secondary small py-3 text-center">
          ${activeRoadmap ? '🎉 All scheduled tasks completed! Great job!' : 'No active roadmap tasks. Generate a roadmap to begin.'}
        </div>
      `;
    }

    // 4.6 Render Career GPS Telemetry & Modules
    loadJobReadiness();
    loadResumeLab();
    loadMatchedJobs();
  };

  // ── 4.5 Render Skills Matrix in Dashboard ───────────────────────
  const renderSkillsMatrix = (skills) => {
    const container = document.getElementById('dashboardSkillsContainer');
    if (!container) return;

    if (!Array.isArray(skills) || skills.length === 0) {
      container.innerHTML = `
        <div class="d-flex align-items-center justify-content-between w-100 p-3 rounded-2 stat-box-atlas flex-wrap gap-2">
          <span class="text-muted small">
            <i class="bi bi-info-circle text-teal me-1"></i> No technical skills logged yet.
          </span>
          <button type="button" class="btn cp-btn-primary btn-sm px-3" data-bs-toggle="modal" data-bs-target="#manageSkillsModal">
            <i class="bi bi-plus-lg me-1"></i> Add Your Skills
          </button>
        </div>
      `;
      return;
    }

    container.innerHTML = skills.map((s) => {
      const prof = (s.proficiency || 'beginner').toLowerCase();
      let badgeClass = 'badge-navy';
      let icon = 'bi-circle';
      if (prof === 'advanced') {
        badgeClass = 'badge-leaf';
        icon = 'bi-check-circle-fill text-success';
      } else if (prof === 'intermediate') {
        badgeClass = 'badge-teal';
        icon = 'bi-lightning-charge-fill text-info';
      } else {
        badgeClass = 'badge-gold';
        icon = 'bi-arrow-up-circle-fill text-warning';
      }

      const sKey = (s.name || '').toLowerCase();
      const tier = s.verificationTier || (s.isCodeVerified ? 'project_verified' : (s.isQuizVerified ? 'quiz_verified' : 'self_rated'));
      const isUnconfirmed = s.verificationStatus === 'unconfirmed';

      let verifiedBadge = '';
      if (tier === 'interview_verified') {
        verifiedBadge = `<span class="passport-tier-badge badge-passport-t3 ms-1" title="Interview Verified · 100%+ Match Weight"><i class="bi bi-mic-fill"></i> Tier 3: Interview</span>`;
      } else if (tier === 'project_verified' || s.isCodeVerified) {
        verifiedBadge = `<span class="passport-tier-badge badge-passport-t2 ms-1" title="Verified from real GitHub repository code · 100% Match Weight"><i class="bi bi-github"></i> Tier 2: Code Verified</span>`;
      } else if (tier === 'quiz_verified' || s.isQuizVerified) {
        if (isUnconfirmed) {
          verifiedBadge = `
            <span class="passport-tier-badge badge-passport-t1 ms-1" title="Quiz Completed"><i class="bi bi-shield-check"></i> Tier 1: Quiz</span>
            <span class="badge-status-unconfirmed ms-1" title="Proctor Telemetry Anomaly Detected: Tab changes or velocity anomalies require Tier 2 GitHub confirmation"><i class="bi bi-exclamation-triangle-fill"></i> Unconfirmed</span>
          `;
        } else {
          verifiedBadge = `<span class="passport-tier-badge badge-passport-t1 ms-1" title="Reality-Check Quiz Verified · 85% Match Weight"><i class="bi bi-shield-check"></i> Tier 1: Quiz Verified</span>`;
        }
      } else if (['javascript', 'python', 'sql', 'react', 'node.js', 'html', 'css'].includes(sKey)) {
        verifiedBadge = `<a href="quiz.html?skill=${sKey}" class="badge-verify-cta ms-1 text-decoration-none" title="Verify this skill in 2 mins to upgrade to Tier 1"><i class="bi bi-speedometer2"></i> Verify (70%)</a>`;
      } else {
        verifiedBadge = `<span class="passport-tier-badge badge-passport-t0 ms-1" title="Self-Rated · 70% Match Weight"><i class="bi bi-person"></i> Tier 0: Self-Rated (70%)</span>`;
      }

      return `
        <div class="d-inline-flex align-items-center gap-2 px-3 py-2 rounded-2 stat-box-atlas border border-line">
          <i class="bi ${icon} small"></i>
          <span class="fw-semibold text-ink small">${escapeHtml(s.displayName || s.name)}</span>
          <span class="badge ${badgeClass} text-uppercase font-monospace" style="font-size: 0.68rem; letter-spacing: 0.5px;">
            ${escapeHtml(prof)}
          </span>
          ${verifiedBadge}
        </div>
      `;
    }).join('');
  };

  const DEFAULT_GITHUB_AVATAR = 'assets/images/default-avatar.svg';

  const getAccurateStudyRelevance = (repo, profile) => {
    const existing = repo.studyRelevance || '';
    const lang = (repo.language || '').toLowerCase();
    const name = (repo.name || '').toLowerCase();
    const desc = (repo.description || '').toLowerCase();

    // If existing text has the wrong "Demonstrates core Python scripting" on a non-python repo, fix it
    if (existing && !existing.includes('core Python scripting')) {
      return existing;
    }
    if (existing && lang === 'python') {
      return existing;
    }

    const isAiRelated = /(?:^|[-_.\s])(ai|ml|data|bot|model|gpt|llm|nlp|vision|deeplearning)(?:$|[-_.\s])/i.test(name) ||
      desc.includes('machine learning') || desc.includes('artificial intelligence');
    const isBackendRelated = /(?:^|[-_.\s])(api|backend|server|express|nest|django|flask|spring)(?:$|[-_.\s])/i.test(name) ||
      desc.includes('backend') || desc.includes('rest api');
    const isProfileRepo = name === (profile?.username || '').toLowerCase() || name.includes('profile') || name.includes('portfolio') || name.includes('resume');

    if (isProfileRepo) {
      return 'Developer Profile & Portfolio Hub: Academic showcase and technical portfolio overview.';
    }
    if (lang === 'python') {
      return isAiRelated
        ? 'AI & Machine Learning Study: Demonstrates Python scripting, model pipelines, and intelligent data logic.'
        : 'Python Scripting & Automation: Demonstrates backend scripting, modular design, and logic structure.';
    }
    if (lang === 'javascript' || lang === 'typescript') {
      if (isAiRelated) {
        return 'AI-Integrated Web App: Combines intelligent logic with modern frontend & full-stack architecture.';
      }
      if (isBackendRelated) {
        return 'Backend & API Engineering: Server-side architecture, RESTful API design, and asynchronous logic.';
      }
      return 'Full-Stack & Frontend Development: Demonstrates interactive UI engineering, modern state management, and web components.';
    }
    if (lang === 'html' || lang === 'css') {
      return 'Web Interface & UI Fundamentals: Responsive layout engineering, semantic structure, and styling standards.';
    }
    if (lang === 'c++' || lang === 'c' || lang === 'rust') {
      return 'Systems & High-Performance CS: Memory management, foundational data structures, and optimized algorithms.';
    }
    if (lang === 'java' || lang === 'kotlin') {
      return 'Enterprise & OOP Architecture: Demonstrates object-oriented design patterns, typed APIs, and scalable modularity.';
    }
    return isAiRelated
      ? 'Intelligent System Prototype: Hands-on exploration of algorithmic logic and smart system integration.'
      : 'Applied Software Development: Practical code repository contributing to hands-on portfolio verification.';
  };

  // ── 4.55 Render GitHub Study Lab & Repositories ─────────────────
  const renderGitHubStudyLab = (user) => {
    const githubStatusBadge = document.getElementById('githubStatusBadge');
    const btnConnectGitHubDashboard = document.getElementById('btnConnectGitHubDashboard');
    const btnConnectGitHubText = document.getElementById('btnConnectGitHubText');
    const githubConnectedDetails = document.getElementById('githubConnectedDetails');
    const ghUserAvatar = document.getElementById('ghUserAvatar');
    const ghUserName = document.getElementById('ghUserName');
    const ghUserLink = document.getElementById('ghUserLink');
    const ghUserHandle = document.getElementById('ghUserHandle');
    const ghRepoCount = document.getElementById('ghRepoCount');
    const ghFollowerCount = document.getElementById('ghFollowerCount');
    const ghTopLanguagesContainer = document.getElementById('ghTopLanguagesContainer');
    const githubReposContainer = document.getElementById('githubReposContainer');
    const btnConnectGitHubBanner = document.getElementById('btnConnectGitHubBanner');

    const profile = user?.githubProfile;
    const repos = user?.githubRepos || [];
    const isConnected = !!(profile && (profile.username || profile.id));

    const handleConnectClick = async () => {
      const originalText = btnConnectGitHubText ? btnConnectGitHubText.innerHTML : 'Sync Repos';
      if (btnConnectGitHubDashboard) btnConnectGitHubDashboard.disabled = true;
      if (btnConnectGitHubText) {
        btnConnectGitHubText.innerHTML = '<span class="spinner-border spinner-border-sm me-1" role="status"></span> Syncing Repos...';
      }

      const syncHandler = window.GitHubAuth?.syncRepos || window.GitHubAuth?.connectGitHubAccount;
      if (syncHandler) {
        syncHandler(async (err, data) => {
          if (btnConnectGitHubDashboard) btnConnectGitHubDashboard.disabled = false;
          if (btnConnectGitHubText) {
            btnConnectGitHubText.innerHTML = isConnected ? 'Sync Repos' : 'Connect GitHub';
          }

          if (err) {
            showAlert(err.message || 'GitHub sync failed.', 'danger');
          } else {
            const count = data?.repositories?.length || data?.user?.githubRepos?.length || 0;
            const skillsCount = data?.detectedSkills?.length || 0;
            const ghUser = data?.user?.githubProfile?.username || profile?.username || 'user';
            showAlert(`✓ Repositories synchronized via auth system (@${ghUser})! Found ${count} repos and verified ${skillsCount} skills.`, 'success');
            await loadDashboard();
          }
        });
      }
    };

    if (btnConnectGitHubDashboard) {
      btnConnectGitHubDashboard.onclick = handleConnectClick;
    }
    if (btnConnectGitHubBanner) {
      btnConnectGitHubBanner.onclick = handleConnectClick;
    }

    if (isConnected) {
      if (githubStatusBadge) {
        githubStatusBadge.className = 'badge-code-verified status-connected';
        githubStatusBadge.innerHTML = '<i class="bi bi-patch-check-fill text-success me-1"></i> Connected & Verified';
      }
      if (btnConnectGitHubText) {
        btnConnectGitHubText.textContent = 'Sync Repos';
      }
      if (githubConnectedDetails) {
        githubConnectedDetails.classList.remove('d-none');
      }

      if (ghUserAvatar) {
        const candidateSrc = profile.avatarUrl || profile.avatar_url || (profile.username ? `https://github.com/${profile.username}.png` : '') || DEFAULT_GITHUB_AVATAR;
        ghUserAvatar.src = candidateSrc;
        ghUserAvatar.onerror = function () {
          this.onerror = null;
          this.src = DEFAULT_GITHUB_AVATAR;
        };
      }
      if (ghUserName) {
        ghUserName.textContent = profile.name || profile.username || 'GitHub Developer';
      }
      if (ghUserHandle) {
        ghUserHandle.textContent = profile.username || '';
      }
      if (ghUserLink) {
        ghUserLink.href = profile.htmlUrl || `https://github.com/${profile.username}`;
      }
      if (ghRepoCount) {
        ghRepoCount.textContent = profile.publicRepos != null ? profile.publicRepos : repos.length;
      }
      if (ghFollowerCount) {
        ghFollowerCount.textContent = profile.followers != null ? profile.followers : 0;
      }

      // Top languages
      if (ghTopLanguagesContainer) {
        let langs = Array.isArray(profile.topLanguages) ? profile.topLanguages : [];
        if (langs.length === 0 && repos.length > 0) {
          const counts = {};
          repos.forEach(r => {
            if (r.language) counts[r.language] = (counts[r.language] || 0) + 1;
          });
          langs = Object.keys(counts).sort((a, b) => counts[b] - counts[a]).slice(0, 5);
        }

        if (langs.length > 0) {
          ghTopLanguagesContainer.innerHTML = langs.map(lang => `
            <span class="badge badge-navy font-monospace" style="font-size: 0.72rem;">
              <span class="rounded-circle d-inline-block me-1" style="width: 7px; height: 7px; background-color: var(--color-indigo-600, #4F46E5);"></span>
              ${escapeHtml(lang)}
            </span>
          `).join('');
        } else {
          ghTopLanguagesContainer.innerHTML = `<span class="text-muted small">Multi-language code repository</span>`;
        }
      }

      // Repositories Grid
      if (githubReposContainer) {
        if (repos.length === 0) {
          githubReposContainer.innerHTML = `
            <div class="col-12 text-center py-4 text-muted small">
              <div class="p-3 border border-line rounded-2 bg-surface-muted">
                <i class="bi bi-folder-check display-6 text-primary opacity-75 mb-2 d-block"></i>
                <div class="fw-semibold text-ink mb-1">0 Public Repositories Found</div>
                <div class="text-secondary small mb-3">Push public coding projects to your GitHub account to showcase your work here.</div>
                <button type="button" class="btn btn-navy btn-sm px-4 py-2" id="btnSyncEmptyRepos">
                  <i class="bi bi-arrow-repeat me-1"></i> Re-scan Repos
                </button>
              </div>
            </div>
          `;
          const btnSyncEmpty = document.getElementById('btnSyncEmptyRepos');
          if (btnSyncEmpty) btnSyncEmpty.onclick = handleConnectClick;
        } else {
          githubReposContainer.innerHTML = repos.map(repo => {
            const starCount = repo.stargazersCount || 0;
            const starBadge = starCount > 0
              ? `<span class="badge bg-warning bg-opacity-10 text-warning font-monospace" style="font-size: 0.65rem;"><i class="bi bi-star-fill me-1"></i>${starCount}</span>`
              : '';

            const lang = repo.language || 'Code';
            const relevance = getAccurateStudyRelevance(repo, profile);

            return `
              <div class="col-md-6 col-lg-4">
                <div class="repo-card-study h-100 p-3 rounded-2 border border-line bg-white shadow-sm d-flex flex-column justify-content-between">
                  <div>
                    <div class="d-flex align-items-center justify-content-between mb-2">
                      <div class="d-flex align-items-center gap-1.5 overflow-hidden me-2">
                        <i class="bi bi-journal-code text-primary flex-shrink-0"></i>
                        <a href="${escapeHtml(repo.htmlUrl)}" target="_blank" rel="noopener noreferrer" class="fw-bold text-ink text-truncate text-decoration-none small" title="${escapeHtml(repo.name)}">
                          ${escapeHtml(repo.name)}
                        </a>
                      </div>
                      ${starBadge}
                    </div>
                    <p class="text-secondary small mb-3" style="font-size: 0.78rem; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; min-height: 2.3em; line-height: 1.4;">
                      ${escapeHtml(repo.description || 'Open-source project and study artifacts.')}
                    </p>
                  </div>
                  <div>
                    <div class="mb-2 p-1.5 rounded-1 bg-surface-indigo border border-indigo-subtle text-primary font-monospace" style="font-size: 0.68rem; line-height: 1.3;">
                      <i class="bi bi-lightbulb-fill text-warning me-1"></i><strong>Study Relevance:</strong> ${escapeHtml(relevance)}
                    </div>
                    <div class="d-flex align-items-center justify-content-between pt-2 border-top border-line text-muted font-monospace" style="font-size: 0.72rem;">
                      <span class="d-flex align-items-center gap-1.5 text-secondary">
                        <span class="rounded-circle d-inline-block" style="width: 8px; height: 8px; background-color: var(--color-indigo-600, #4F46E5);"></span>
                        ${escapeHtml(lang)}
                      </span>
                      <a href="${escapeHtml(repo.htmlUrl)}" target="_blank" rel="noopener noreferrer" class="text-primary fw-semibold text-decoration-none hover-underline">
                        Open Repo <i class="bi bi-box-arrow-up-right ms-0.5" style="font-size: 0.65rem;"></i>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            `;
          }).join('');
        }
      }
    } else {
      // Not connected
      if (githubStatusBadge) {
        githubStatusBadge.className = 'badge-code-verified status-disconnected';
        githubStatusBadge.innerHTML = '<i class="bi bi-circle-fill text-secondary me-1" style="font-size: 0.5rem;"></i> Not Connected';
      }
      if (btnConnectGitHubText) {
        btnConnectGitHubText.textContent = 'Connect GitHub Account';
      }
      if (githubConnectedDetails) {
        githubConnectedDetails.classList.add('d-none');
      }
      if (githubReposContainer) {
        githubReposContainer.innerHTML = `
          <div class="col-12 text-center py-4 text-muted small">
            <div class="p-3 border border-line rounded-2 bg-surface-muted">
              <i class="bi bi-code-square display-6 text-primary opacity-75 mb-2 d-block"></i>
              <div class="fw-semibold text-ink mb-1">No GitHub Repositories Linked Yet</div>
              <div class="text-secondary small mb-3">Connect your GitHub profile to auto-detect verified skills, audit your study projects, and map them to your active roadmap.</div>
              <button type="button" class="btn btn-navy btn-sm px-4 py-2" id="btnConnectGitHubBanner">
                <i class="bi bi-github me-1"></i> Connect GitHub Account (1-Click)
              </button>
            </div>
          </div>
        `;
        const bannerBtn = document.getElementById('btnConnectGitHubBanner');
        if (bannerBtn) bannerBtn.onclick = handleConnectClick;
      }
    }
  };

  // ── 4.6 Quick Skills Manager Modal Controller ───────────────────
  let editableSkills = [];
  let fullSkillsCatalog = [];

  const modalSkillsList = document.getElementById('modalSkillsList');
  const modalCurrentSkillsCount = document.getElementById('modalCurrentSkillsCount');
  const catalogSkillSelect = document.getElementById('catalogSkillSelect');
  const catalogSkillProficiency = document.getElementById('catalogSkillProficiency');
  const btnAddCatalogSkill = document.getElementById('btnAddCatalogSkill');
  const dashboardCustomSkillName = document.getElementById('dashboardCustomSkillName');
  const dashboardCustomSkillCategory = document.getElementById('dashboardCustomSkillCategory');
  const dashboardCustomSkillProficiency = document.getElementById('dashboardCustomSkillProficiency');
  const btnDashboardAddCustom = document.getElementById('btnDashboardAddCustom');
  const btnSaveQuickSkills = document.getElementById('btnSaveQuickSkills');
  const modalSkillAlert = document.getElementById('modalSkillAlert');

  const showModalAlert = (msg, type = 'danger') => {
    if (!modalSkillAlert) return;
    modalSkillAlert.className = `alert alert-${type} py-2 px-3 small`;
    modalSkillAlert.textContent = msg;
    modalSkillAlert.classList.remove('d-none');
    setTimeout(() => {
      modalSkillAlert?.classList.add('d-none');
    }, 4000);
  };

  // Load catalog into select
  const loadSkillsCatalog = async () => {
    try {
      const res = await window.API.get('/skills');
      if (res.success && Array.isArray(res.data?.skills)) {
        fullSkillsCatalog = res.data.skills;
        if (catalogSkillSelect) {
          catalogSkillSelect.innerHTML =
            '<option value="">Select a skill to add...</option>' +
            fullSkillsCatalog
              .sort((a, b) => a.displayName.localeCompare(b.displayName))
              .map(
                (s) =>
                  `<option value="${escapeHtml(s.name)}" data-display="${escapeHtml(s.displayName)}" data-cat="${escapeHtml(s.category)}">${escapeHtml(s.displayName)} (${escapeHtml(s.category)})</option>`
              )
              .join('');
        }
      }
    } catch (err) {
      console.warn('Could not load skills catalog:', err.message);
    }
  };

  const renderModalSkillsList = () => {
    if (!modalSkillsList) return;
    if (modalCurrentSkillsCount) {
      modalCurrentSkillsCount.textContent = editableSkills.length;
    }

    if (editableSkills.length === 0) {
      modalSkillsList.innerHTML = `
        <div class="text-muted small py-3 text-center border border-dashed rounded-2 border-line">
          No skills added yet. Choose from the catalog below or add a custom skill.
        </div>
      `;
      return;
    }

    modalSkillsList.innerHTML = editableSkills
      .map((s, idx) => {
        const prof = (s.proficiency || 'beginner').toLowerCase();
        return `
        <div class="d-flex align-items-center justify-content-between p-2 rounded-2 stat-box-atlas border border-line gap-2 flex-wrap">
          <div class="d-flex align-items-center gap-2">
            <span class="badge badge-navy small font-monospace">${escapeHtml(s.category || 'tech')}</span>
            <span class="fw-semibold text-ink small">${escapeHtml(s.displayName || s.name)}</span>
          </div>
          <div class="d-flex align-items-center gap-2 ms-auto">
            <div class="btn-group btn-group-sm" role="group" aria-label="Proficiency selector">
              <button type="button" class="btn btn-sm ${prof === 'beginner' ? 'btn-warning text-dark fw-bold' : 'btn-outline-secondary text-muted'} py-0 px-2 font-monospace" style="font-size: 0.7rem;" data-idx="${idx}" data-prof="beginner">
                Beg
              </button>
              <button type="button" class="btn btn-sm ${prof === 'intermediate' ? 'btn-info text-dark fw-bold' : 'btn-outline-secondary text-muted'} py-0 px-2 font-monospace" style="font-size: 0.7rem;" data-idx="${idx}" data-prof="intermediate">
                Int
              </button>
              <button type="button" class="btn btn-sm ${prof === 'advanced' ? 'btn-success text-white fw-bold' : 'btn-outline-secondary text-muted'} py-0 px-2 font-monospace" style="font-size: 0.7rem;" data-idx="${idx}" data-prof="advanced">
                Adv
              </button>
            </div>
            <button type="button" class="btn btn-link text-danger p-0 ms-2 text-decoration-none btn-remove-skill" data-idx="${idx}" title="Remove skill">
              <i class="bi bi-x-circle-fill"></i>
            </button>
          </div>
        </div>
      `;
      })
      .join('');

    // Wire segmented proficiency buttons
    modalSkillsList.querySelectorAll('[data-prof]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.currentTarget.getAttribute('data-idx'), 10);
        const newProf = e.currentTarget.getAttribute('data-prof');
        if (!isNaN(idx) && editableSkills[idx]) {
          editableSkills[idx].proficiency = newProf;
          renderModalSkillsList();
        }
      });
    });

    // Wire remove buttons
    modalSkillsList.querySelectorAll('.btn-remove-skill').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.currentTarget.getAttribute('data-idx'), 10);
        if (!isNaN(idx)) {
          editableSkills.splice(idx, 1);
          renderModalSkillsList();
        }
      });
    });
  };

  // Open modal event listener
  const manageSkillsModalEl = document.getElementById('manageSkillsModal');
  if (manageSkillsModalEl) {
    manageSkillsModalEl.addEventListener('show.bs.modal', () => {
      // Sync fresh working copy
      const user = dashboardData?.user || window.Auth?.getUser?.() || window.Auth?.getCurrentUser?.() || {};
      editableSkills = JSON.parse(JSON.stringify(user.skills || []));
      renderModalSkillsList();
      loadSkillsCatalog();
    });
  }

  // Add from Catalog
  if (btnAddCatalogSkill && catalogSkillSelect) {
    btnAddCatalogSkill.addEventListener('click', () => {
      const selectedName = catalogSkillSelect.value;
      if (!selectedName) {
        showModalAlert('Please select a skill from the list first.', 'warning');
        return;
      }

      if (editableSkills.length >= 25) {
        showModalAlert('Maximum limit of 25 skills reached.', 'warning');
        return;
      }

      if (editableSkills.some((s) => s.name.toLowerCase() === selectedName.toLowerCase())) {
        showModalAlert('This skill is already in your list!', 'info');
        return;
      }

      const selectedOpt = catalogSkillSelect.options[catalogSkillSelect.selectedIndex];
      const displayName = selectedOpt?.getAttribute('data-display') || selectedName;
      const category = selectedOpt?.getAttribute('data-cat') || 'tech';
      const proficiency = catalogSkillProficiency?.value || 'intermediate';

      editableSkills.push({
        name: selectedName.toLowerCase(),
        displayName: displayName,
        category: category,
        proficiency: proficiency,
      });

      catalogSkillSelect.value = '';
      showModalAlert(`✓ Added "${displayName}" (${proficiency})`, 'success');
      renderModalSkillsList();
    });
  }

  // Add Custom Skill
  if (btnDashboardAddCustom && dashboardCustomSkillName) {
    const handleCustomAdd = async () => {
      const rawName = dashboardCustomSkillName.value.trim();
      if (!rawName) {
        showModalAlert('Please enter a custom skill name.', 'warning');
        return;
      }

      if (editableSkills.length >= 25) {
        showModalAlert('Maximum limit of 25 skills reached.', 'warning');
        return;
      }

      const cleanSlug = rawName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      if (editableSkills.some((s) => s.name === cleanSlug)) {
        showModalAlert('This skill is already in your profile!', 'info');
        return;
      }

      const category = dashboardCustomSkillCategory?.value || 'other';
      const proficiency = dashboardCustomSkillProficiency?.value || 'intermediate';

      editableSkills.push({
        name: cleanSlug,
        displayName: rawName,
        category: category,
        proficiency: proficiency,
        isCustom: true,
      });

      // Register with backend in background
      try {
        window.API.post(
          '/skills/custom',
          {
            name: cleanSlug,
            displayName: rawName,
            category: category,
          },
          { auth: true }
        ).catch(() => {});
      } catch (_) {}

      dashboardCustomSkillName.value = '';
      showModalAlert(`✓ Custom skill "${rawName}" added!`, 'success');
      renderModalSkillsList();
    };

    btnDashboardAddCustom.addEventListener('click', handleCustomAdd);
    dashboardCustomSkillName.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleCustomAdd();
      }
    });
  }

  // Save changes & recalculate
  if (btnSaveQuickSkills) {
    btnSaveQuickSkills.addEventListener('click', async () => {
      btnSaveQuickSkills.disabled = true;
      const originalHtml = btnSaveQuickSkills.innerHTML;
      btnSaveQuickSkills.innerHTML = `
        <span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
        Saving & Recalculating...
      `;

      try {
        const res = await window.API.put('/users/me', { skills: editableSkills }, { auth: true });
        if (res.success && res.data?.user) {
          // Update cached user
          window.Auth.setCurrentUser(res.data.user);
          if (dashboardData) {
            dashboardData.user = res.data.user;
          }

          // Update UI
          renderSkillsMatrix(res.data.user.skills || []);
          if (userSkillsCount) {
            userSkillsCount.innerHTML = `<i class="bi bi-tools text-info me-1"></i> ${(res.data.user.skills || []).length} Skills Logged`;
          }

          // Close modal
          const modalInstance = bootstrap.Modal.getInstance(manageSkillsModalEl);
          if (modalInstance) {
            modalInstance.hide();
          }

          showAlert('Skills updated successfully! Your career fit scores and recommendations have been recalculated.', 'success');
        } else {
          showModalAlert(res.message || 'Failed to save skills update.');
        }
      } catch (err) {
        showModalAlert(err.message || 'Error saving skills. Please try again.');
      } finally {
        btnSaveQuickSkills.disabled = false;
        btnSaveQuickSkills.innerHTML = originalHtml;
      }
    });
  }

  // 6. Cloudinary Media Storage Upload Handlers (Avatar & Resume)
  const avatarFileInput = document.getElementById('avatarFileInput');
  if (avatarFileInput && userAvatar) {
    // Open picker when avatar box is clicked
    userAvatar.addEventListener('click', () => {
      avatarFileInput.click();
    });

    avatarFileInput.addEventListener('change', async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const userId = dashboardData?.user?.id || window.Auth?.getUser?.()?.id || window.Auth?.getCurrentUser?.()?.id;
      const originalAvatarContent = userAvatar.innerHTML;
      userAvatar.innerHTML = `<span class="spinner-border spinner-border-sm text-teal" role="status"></span>`;

      try {
        showAlert('Uploading photo to Cloudinary Media Cloud...', 'info');
        const downloadUrl = await window.CloudinaryService.uploadAvatar(file, userId);

        // Update backend user profile
        const updateRes = await window.API.put('/users/me', { avatarUrl: downloadUrl }, { auth: true });
        if (updateRes.success && updateRes.data?.user) {
          window.Auth.setCurrentUser(updateRes.data.user);
          if (dashboardData) dashboardData.user = updateRes.data.user;
          userAvatar.innerHTML = `<img src="${escapeHtml(downloadUrl)}" alt="Avatar" class="rounded-circle w-100 h-100" style="object-fit: cover;" />`;
          showAlert('Profile picture uploaded to Cloudinary and saved successfully!', 'success');
        } else {
          userAvatar.innerHTML = originalAvatarContent;
          showAlert(updateRes.message || 'Failed to save updated avatar in profile.', 'danger');
        }
      } catch (uploadErr) {
        userAvatar.innerHTML = originalAvatarContent;
        showAlert(uploadErr.message || 'Failed to upload photo.', 'danger');
      } finally {
        avatarFileInput.value = '';
      }
    });
  }

  // Resume Upload Handler
  const btnUploadResumeTrigger = document.getElementById('btnUploadResumeTrigger');
  const resumeFileInput = document.getElementById('resumeFileInput');
  if (btnUploadResumeTrigger && resumeFileInput) {
    btnUploadResumeTrigger.addEventListener('click', () => {
      resumeFileInput.click();
    });

    resumeFileInput.addEventListener('change', async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const userId = dashboardData?.user?.id || window.Auth?.getUser?.()?.id || window.Auth?.getCurrentUser?.()?.id;
      const originalBtnHtml = btnUploadResumeTrigger.innerHTML;
      btnUploadResumeTrigger.disabled = true;
      btnUploadResumeTrigger.innerHTML = `<span class="spinner-border spinner-border-sm me-1" role="status"></span> Uploading...`;

      try {
        showAlert('Uploading resume document to Cloudinary...', 'info');
        const downloadUrl = await window.CloudinaryService.uploadResume(file, userId);

        // Save resumeUrl to profile
        const updateRes = await window.API.put('/users/me', { resumeUrl: downloadUrl }, { auth: true });
        if (updateRes.success && updateRes.data?.user) {
          window.Auth.setCurrentUser(updateRes.data.user);
          if (dashboardData) dashboardData.user = updateRes.data.user;

          const viewResumeLink = document.getElementById('viewResumeLink');
          const noResumeText = document.getElementById('noResumeText');
          if (viewResumeLink) {
            viewResumeLink.href = 'javascript:void(0)';
            viewResumeLink.removeAttribute('target');
            viewResumeLink.classList.remove('d-none');
            viewResumeLink.onclick = (e) => {
              e.preventDefault();
              openResumeViewerModal();
            };
          }
          if (noResumeText) noResumeText.classList.add('d-none');

          showAlert('Resume uploaded to Cloudinary and attached to profile successfully!', 'success');
        } else {
          showAlert(updateRes.message || 'Failed to save resume URL in profile.', 'danger');
        }
      } catch (uploadErr) {
        showAlert(uploadErr.message || 'Failed to upload resume document.', 'danger');
      } finally {
        btnUploadResumeTrigger.disabled = false;
        btnUploadResumeTrigger.innerHTML = originalBtnHtml;
        resumeFileInput.value = '';
      }
    });
  }

  // ==========================================================================
  // RESUME DOCUMENT & ATS VIEWER MODAL CONTROLLER
  // ==========================================================================
  let currentResumeMode = 'preview'; // 'preview' | 'pdf'

  async function openResumeViewerModal() {
    const modalEl = document.getElementById('resumeViewerModal');
    if (!modalEl) return;

    const bsModal = bootstrap.Modal.getOrCreateInstance(modalEl);
    bsModal.show();

    const user = dashboardData?.user || window.Auth?.getUser() || {};
    const token = window.Auth?.getToken() || localStorage.getItem('token') || '';
    const apiBase = window.API_BASE_URL || (window.CONFIG?.API_BASE_URL) || 'http://localhost:5000/api';

    // Populate student and file details
    const studentNameEl = document.getElementById('resumeModalStudentName');
    if (studentNameEl) studentNameEl.textContent = `${user.name || 'Student'}'s Resume`;

    const filenameEl = document.getElementById('resumeModalFilename');
    if (filenameEl) {
      filenameEl.innerHTML = `<i class="bi bi-file-earmark-pdf me-1 text-teal"></i> resume_${(user.name || 'document').toLowerCase().replace(/\\s+/g, '_')}.pdf`;
    }

    // Populate ATS score
    const atsScoreEl = document.getElementById('resumeModalAtsScore');
    const atsScore = user.resumeAnalysis?.atsScore || user.readinessData?.resumeScore || user.resumeScore || currentReadinessData?.resumeScore;
    if (atsScoreEl) {
      if (typeof atsScore === 'number' && atsScore > 0) {
        atsScoreEl.textContent = `${atsScore}% ATS Match`;
      } else {
        atsScoreEl.textContent = 'Verified PDF';
      }
    }

    // Direct proxy URLs (authenticated with JWT query token for zero-ACL browser delivery)
    const viewUrl = `${apiBase}/users/resume/view?token=${encodeURIComponent(token)}`;
    const downloadUrl = `${apiBase}/users/resume/download?token=${encodeURIComponent(token)}`;

    // Configure action buttons
    const btnOpenNewTab = document.getElementById('btnOpenResumeNewTab');
    if (btnOpenNewTab) {
      btnOpenNewTab.href = viewUrl;
    }

    const btnDownload = document.getElementById('btnDownloadResume');
    if (btnDownload) {
      btnDownload.href = downloadUrl;
    }

    const btnReplace = document.getElementById('btnReplaceResumeInModal');
    const resumeFileInput = document.getElementById('resumeFileInput');
    if (btnReplace && resumeFileInput) {
      btnReplace.onclick = () => {
        resumeFileInput.click();
      };
    }

    // View mode elements
    const btnToggleMode = document.getElementById('btnToggleResumeViewMode');
    const toggleText = document.getElementById('toggleResumeModeText');
    const previewContainer = document.getElementById('resumeImagePreviewContainer');
    const previewImg = document.getElementById('resumePreviewImage');
    const iframeEl = document.getElementById('resumeViewerIframe');
    const loadingEl = document.getElementById('resumeViewerLoading');
    const errorEl = document.getElementById('resumeViewerError');

    function updateModeDisplay(mode) {
      currentResumeMode = mode;
      if (mode === 'preview') {
        if (toggleText) toggleText.textContent = 'Interactive PDF';
        if (btnToggleMode) btnToggleMode.innerHTML = `<i class="bi bi-file-pdf me-1"></i> <span id="toggleResumeModeText">Interactive PDF</span>`;
        if (iframeEl) iframeEl.classList.add('d-none');
        if (previewContainer) previewContainer.classList.remove('d-none');
      } else {
        if (toggleText) toggleText.textContent = 'Preview Image';
        if (btnToggleMode) btnToggleMode.innerHTML = `<i class="bi bi-image me-1"></i> <span id="toggleResumeModeText">Preview Image</span>`;
        if (previewContainer) previewContainer.classList.add('d-none');
        if (iframeEl) {
          if (!iframeEl.src || iframeEl.src.indexOf('/users/resume/view') === -1) {
            iframeEl.src = viewUrl;
          }
          iframeEl.classList.remove('d-none');
        }
      }
    }

    if (btnToggleMode) {
      btnToggleMode.onclick = () => {
        updateModeDisplay(currentResumeMode === 'preview' ? 'pdf' : 'preview');
      };
    }

    // Reset initial UI states
    if (loadingEl) loadingEl.classList.remove('d-none');
    if (previewContainer) previewContainer.classList.add('d-none');
    if (iframeEl) iframeEl.classList.add('d-none');
    if (errorEl) errorEl.classList.add('d-none');

    try {
      const res = await window.API.get('/users/resume/preview', { auth: true });
      if (res.success && res.data?.previewUrl) {
        if (previewImg) {
          previewImg.onload = () => {
            if (loadingEl) loadingEl.classList.add('d-none');
            updateModeDisplay('preview');
          };
          previewImg.onerror = () => {
            if (loadingEl) loadingEl.classList.add('d-none');
            updateModeDisplay('pdf');
          };
          previewImg.src = res.data.previewUrl;
        }
      } else {
        if (loadingEl) loadingEl.classList.add('d-none');
        updateModeDisplay('pdf');
      }
    } catch (err) {
      console.warn('Preview generation note, falling back to PDF view:', err);
      if (loadingEl) loadingEl.classList.add('d-none');
      updateModeDisplay('pdf');
    }
  }

  // Expose on window for convenience
  window.openResumeViewerModal = openResumeViewerModal;

  // Cleanup on modal close to release memory
  const resumeModalElement = document.getElementById('resumeViewerModal');
  if (resumeModalElement) {
    resumeModalElement.addEventListener('hidden.bs.modal', () => {
      const iframeEl = document.getElementById('resumeViewerIframe');
      if (iframeEl) iframeEl.src = 'about:blank';
    });
  }

  // ==========================================================================
  // CAREER GPS MODULES: READINESS INDEX, RESUME ATS, MOCK INTERVIEW & CERTIFICATE
  // ==========================================================================

  // 1. Holistic 0-100% Job Readiness Index & Digital Certificate
  let currentReadinessData = null;

  const loadJobReadiness = async () => {
    try {
      const res = await window.API.get('/readiness/status', { auth: true });
      if (!res.success || !res.data) return;

      const data = res.data;
      currentReadinessData = data;
      const score = Math.round(data.readinessScore || 0);

      // Score text & gauge
      const readinessScoreText = document.getElementById('readinessScoreText');
      const readinessGaugeVal = document.getElementById('readinessGaugeVal');
      const readinessGaugeCircle = document.getElementById('readinessGaugeCircle');
      const readinessTierBadge = document.getElementById('readinessTierBadge');
      const readinessTargetRoleText = document.getElementById('readinessTargetRoleText');

      if (readinessScoreText) readinessScoreText.textContent = `${score}%`;
      if (readinessGaugeVal) readinessGaugeVal.textContent = `${score}%`;
      if (readinessGaugeCircle) readinessGaugeCircle.style.setProperty('--readiness-pct', score);

      if (readinessTierBadge) {
        readinessTierBadge.className = `badge font-monospace text-uppercase badge-tier-${data.tier || 'foundational'}`;
        readinessTierBadge.textContent = data.tierLabel || 'Foundational Learner';
      }

      if (readinessTargetRoleText) {
        readinessTargetRoleText.innerHTML = `Target Role: <strong class="text-white">${escapeHtml(data.targetRole || 'Software Engineer')}</strong> · Weighted composite score derived from verified skills, roadmap progress, resume ATS compliance, and AI mock interview simulations.`;
      }

      // Breakdown metrics
      const metricVerified = document.getElementById('metricScoreVerified');
      const metricRoadmap = document.getElementById('metricScoreRoadmap');
      const metricResume = document.getElementById('metricScoreResume');
      const metricInterview = document.getElementById('metricScoreInterview');

      if (metricVerified) metricVerified.textContent = `${data.breakdown?.verifiedSkills ?? '--'}%`;
      if (metricRoadmap) metricRoadmap.textContent = `${data.breakdown?.roadmapProgress ?? '--'}%`;
      if (metricResume) metricResume.textContent = `${data.breakdown?.resumeScore ?? '--'}%`;
      if (metricInterview) metricInterview.textContent = `${data.breakdown?.interviewScore ?? '--'}%`;

      // Certificate button state
      const btnViewCertificate = document.getElementById('btnViewCertificate');
      if (btnViewCertificate) {
        if (score >= 85) {
          btnViewCertificate.className = 'btn btn-warning btn-sm px-3 py-1.5 fw-semibold shadow-sm';
          btnViewCertificate.innerHTML = '<i class="bi bi-award-fill me-1"></i> View Career Certificate (Unlocked ✓)';
        } else {
          btnViewCertificate.className = 'btn btn-outline-light btn-sm px-3 py-1.5 fw-semibold';
          btnViewCertificate.innerHTML = '<i class="bi bi-award me-1"></i> Career Certificate (Unlocks at 85%)';
        }
      }

      // Pre-fill Certificate modal
      const certStudentName = document.getElementById('certStudentName');
      const certCareerTitle = document.getElementById('certCareerTitle');
      const certReadinessScore = document.getElementById('certReadinessScore');
      const certVerificationId = document.getElementById('certVerificationId');
      const certIssueDate = document.getElementById('certIssueDate');
      const certSkillsContainer = document.getElementById('certSkillsContainer');

      const user = dashboardData?.user || window.Auth?.getUser();
      if (certStudentName) certStudentName.textContent = user?.name || 'Verified Student';
      if (certCareerTitle) certCareerTitle.textContent = data.targetRole || 'Full-Stack Developer';
      if (certReadinessScore) certReadinessScore.textContent = `${score}% (${data.tierLabel || 'Developing Practitioner'})`;
      if (certVerificationId) certVerificationId.textContent = data.certificateId || ('CP-2026-' + (user?._id || 'PROTOTYPE').slice(-6).toUpperCase());
      if (certIssueDate) {
        const d = data.certifiedAt ? new Date(data.certifiedAt) : new Date();
        certIssueDate.textContent = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      }

      if (certSkillsContainer) {
        const verifiedSkills = (user?.skills || []).filter(s => s.isVerified || s.verificationTier === 'project_verified' || s.verificationTier === 'quiz_verified');
        if (verifiedSkills.length > 0) {
          certSkillsContainer.innerHTML = verifiedSkills.map(s => `
            <span class="badge bg-light text-dark border px-2 py-1">
              <i class="bi bi-check-circle-fill text-success me-1"></i>${escapeHtml(s.name)}
            </span>
          `).join('');
        } else if ((user?.skills || []).length > 0) {
          certSkillsContainer.innerHTML = (user.skills).slice(0, 5).map(s => `
            <span class="badge bg-light text-dark border px-2 py-1">
              <i class="bi bi-patch-check-fill text-primary me-1"></i>${escapeHtml(s.name)}
            </span>
          `).join('');
        } else {
          certSkillsContainer.innerHTML = '<span class="text-muted small">No verified skills yet.</span>';
        }
      }
    } catch (err) {
      console.warn('Failed to load readiness index:', err);
    }
  };

  // 2. AI Resume Lab & ATS Analyzer
  const loadResumeLab = async () => {
    try {
      const res = await window.API.get('/resume/analysis', { auth: true });
      if (res.success && res.data?.analysis) {
        renderResumeAnalysis(res.data.analysis);
      }
    } catch (err) {
      console.warn('No prior resume analysis loaded:', err);
    }

    // Set target role badge
    const resumeTargetCareerBadge = document.getElementById('resumeTargetCareerBadge');
    const activeCareer = dashboardData?.activeRoadmap?.career?.title || 'Full-Stack Developer';
    if (resumeTargetCareerBadge) {
      resumeTargetCareerBadge.textContent = `Target: ${activeCareer}`;
    }

    // Bind scan button
    const btnAnalyzeResume = document.getElementById('btnAnalyzeResume');
    const resumeTextInput = document.getElementById('resumeTextInput');

    if (btnAnalyzeResume) {
      btnAnalyzeResume.onclick = async () => {
        const text = resumeTextInput ? resumeTextInput.value.trim() : '';
        const targetCareer = dashboardData?.activeRoadmap?.career?.title || 'Full-Stack Developer';

        if (!text || text.length < 50) {
          showAlert('Please paste at least 50 characters of your resume content into the text box below to run the ATS analyzer.', 'warning');
          if (resumeTextInput) resumeTextInput.focus();
          return;
        }

        btnAnalyzeResume.disabled = true;
        const originalHtml = btnAnalyzeResume.innerHTML;
        btnAnalyzeResume.innerHTML = '<span class="spinner-border spinner-border-sm me-1" role="status"></span> Scanning ATS Keywords...';

        try {
          const scanRes = await window.API.post('/resume/analyze', {
            resumeText: text,
            targetCareer: targetCareer
          }, { auth: true });

          if (scanRes.success && scanRes.data) {
            renderResumeAnalysis(scanRes.data);
            showAlert(`Resume analyzed! ATS Match Score: ${scanRes.data.atsScore}/100. Check detected keywords & bullet rewrites below.`, 'success');
            // Refresh composite readiness score
            await loadJobReadiness();
          } else {
            showAlert(scanRes.message || 'Failed to analyze resume.', 'danger');
          }
        } catch (scanErr) {
          showAlert(scanErr.message || 'Error analyzing resume.', 'danger');
        } finally {
          btnAnalyzeResume.disabled = false;
          btnAnalyzeResume.innerHTML = originalHtml;
        }
      };
    }
  };

  const renderResumeAnalysis = (analysis) => {
    if (!analysis) return;
    const atsScoreValue = document.getElementById('atsScoreValue');
    const atsProgressBar = document.getElementById('atsProgressBar');
    const atsScoreSummary = document.getElementById('atsScoreSummary');
    const matchedContainer = document.getElementById('matchedKeywordsContainer');
    const missingContainer = document.getElementById('missingKeywordsContainer');
    const matchedCount = document.getElementById('matchedKeywordsCount');
    const missingCount = document.getElementById('missingKeywordsCount');
    const bulletsContainer = document.getElementById('bulletSuggestionsContainer');

    const score = Math.round(analysis.atsScore || 0);
    if (atsScoreValue) atsScoreValue.textContent = score;
    if (atsProgressBar) {
      atsProgressBar.style.width = `${score}%`;
      atsProgressBar.className = `progress-bar readiness-meter-fill ${score >= 75 ? 'bg-success' : score >= 50 ? 'bg-teal' : 'bg-warning'}`;
    }
    if (atsScoreSummary) atsScoreSummary.textContent = analysis.summary || 'Resume analyzed against recruiter keyword benchmarks.';

    // Matched chips
    const matched = analysis.matchedKeywords || [];
    if (matchedCount) matchedCount.textContent = `${matched.length} detected`;
    if (matchedContainer) {
      matchedContainer.innerHTML = matched.length
        ? matched.map(k => `<span class="ats-chip-matched"><i class="bi bi-check-circle-fill"></i> ${escapeHtml(k)}</span>`).join('')
        : '<span class="text-muted small">No exact keyword matches found yet.</span>';
    }

    // Missing chips
    const missing = analysis.missingKeywords || [];
    if (missingCount) missingCount.textContent = `${missing.length} missing`;
    if (missingContainer) {
      missingContainer.innerHTML = missing.length
        ? missing.map(k => `<span class="ats-chip-missing"><i class="bi bi-x-circle-fill"></i> ${escapeHtml(k)}</span>`).join('')
        : '<span class="text-success small"><i class="bi bi-patch-check-fill me-1"></i> Outstanding coverage! No critical missing keywords detected.</span>';
    }

    // Bullet rewrites
    const bullets = analysis.bulletSuggestions || [];
    if (bulletsContainer) {
      if (bullets.length) {
        bulletsContainer.innerHTML = bullets.map((b, idx) => `
          <div class="bullet-rewrite-card">
            <div class="d-flex align-items-center gap-2 mb-1">
              <span class="badge bg-primary bg-opacity-10 text-primary small font-mono">Formula X-Y-Z Rewrite #${idx + 1}</span>
            </div>
            <div>${escapeHtml(b.replace(/^Rewrite:\s*/i, ''))}</div>
          </div>
        `).join('');
      }
    }
  };

  // 3. Real-Time Job Matching & "Bridge the Gap"
  const loadMatchedJobs = async () => {
    const container = document.getElementById('matchedJobsListContainer');
    const badge = document.getElementById('matchedJobsCountBadge');
    if (!container) return;

    try {
      const res = await window.API.get('/jobs/matched-for-user', { auth: true });
      if (!res.success || !res.data?.jobs) {
        container.innerHTML = '<div class="col-12 text-center py-4 text-muted small">Unable to fetch matched job postings.</div>';
        return;
      }

      const jobs = res.data.jobs;
      if (badge) badge.textContent = `${jobs.length} Positions Analyzed`;

      if (jobs.length === 0) {
        container.innerHTML = '<div class="col-12 text-center py-4 text-muted small">No live positions currently match your career profile.</div>';
        return;
      }

      container.innerHTML = jobs.map(job => {
        const isHighMatch = (job.matchPercentage || 0) >= 75;
        const verifiedTags = (job.verifiedSkills || []).map(s => `
          <span class="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 small">
            <i class="bi bi-check-circle-fill me-1"></i>${escapeHtml(s)}
          </span>
        `).join('');

        const missingTags = (job.missingSkills || []).map(s => `
          <button type="button" class="btn btn-outline-danger btn-sm py-0 px-2 font-mono btn-bridge-gap" data-skill="${escapeHtml(s)}" data-job="${escapeHtml(job.title)}" title="1-Click: Add 1-week learning micro-task to your roadmap" style="font-size: 0.72rem;">
            <i class="bi bi-plus-circle me-1"></i>${escapeHtml(s)} <span class="badge bg-danger text-white ms-1" style="font-size: 0.6rem;">Bridge</span>
          </button>
        `).join('');

        return `
          <div class="col-md-6">
            <div class="matched-job-card h-100 d-flex flex-column justify-content-between">
              <div>
                <div class="d-flex align-items-start justify-content-between gap-2 mb-2">
                  <div>
                    <h4 class="h6 fw-bold text-ink mb-1">${escapeHtml(job.title)}</h4>
                    <div class="text-secondary small fw-medium">
                      <i class="bi bi-building me-1 text-teal"></i> ${escapeHtml(job.company)} · <i class="bi bi-geo-alt me-1 text-muted"></i> ${escapeHtml(job.location)}
                    </div>
                  </div>
                  <span class="job-match-badge ${isHighMatch ? 'job-match-high' : ''}">
                    ${job.matchPercentage}% Match
                  </span>
                </div>

                <div class="d-flex align-items-center gap-3 text-muted small mb-3 flex-wrap" style="font-size: 0.78rem;">
                  <span><i class="bi bi-currency-dollar text-warning"></i> ${escapeHtml(job.salary || 'Competitive')}</span>
                  <span><i class="bi bi-briefcase text-teal"></i> ${escapeHtml(job.experience || 'Entry-Level')}</span>
                  <span><i class="bi bi-laptop"></i> ${escapeHtml(job.type || 'Full-Time')}</span>
                </div>

                <!-- Verified vs Missing Skills Breakdown -->
                <div class="mb-3">
                  <div class="text-muted small mb-1" style="font-size: 0.72rem; text-transform: uppercase; font-family: var(--font-mono);">
                    Your Skills: ${verifiedTags || '<span class="text-muted fst-italic">None verified yet</span>'}
                  </div>
                  ${(job.missingSkills || []).length ? `
                    <div class="text-muted small mb-1 mt-2" style="font-size: 0.72rem; text-transform: uppercase; font-family: var(--font-mono);">
                      Missing Skills (Click to Bridge):
                    </div>
                    <div class="d-flex flex-wrap gap-1">
                      ${missingTags}
                    </div>
                  ` : '<div class="text-success small mt-2"><i class="bi bi-shield-check me-1"></i> Full skill alignment! 100% qualified.</div>'}
                </div>
              </div>

              <div class="pt-3 border-top border-line d-flex align-items-center justify-content-between">
                <span class="text-muted small" style="font-size: 0.75rem;">Source: ${escapeHtml(job.source || 'Tech Board')}</span>
                <a href="${escapeHtml(job.url || '#')}" target="_blank" rel="noopener noreferrer" class="btn btn-navy btn-sm px-3 py-1">
                  Quick Apply <i class="bi bi-box-arrow-up-right ms-1"></i>
                </a>
              </div>
            </div>
          </div>
        `;
      }).join('');

      // Wire Bridge the Gap buttons
      container.querySelectorAll('.btn-bridge-gap').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          const skill = btn.getAttribute('data-skill');
          const jobTitle = btn.getAttribute('data-job');
          btn.disabled = true;
          const originalText = btn.innerHTML;
          btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';

          try {
            const bridgeRes = await window.API.post('/jobs/bridge-gap', {
              missingSkill: skill,
              jobTitle: jobTitle
            }, { auth: true });

            if (bridgeRes.success) {
              showAlert(`Success! 1-week micro-task for "${skill}" has been added to your active roadmap.`, 'success');
              btn.className = 'btn btn-outline-success btn-sm py-0 px-2 font-mono';
              btn.innerHTML = `<i class="bi bi-check-circle-fill me-1"></i> Bridged!`;
              // Reload roadmap summary
              await loadDashboard();
            } else {
              showAlert(bridgeRes.message || 'Could not bridge skill gap.', 'warning');
              btn.disabled = false;
              btn.innerHTML = originalText;
            }
          } catch (bridgeErr) {
            showAlert(bridgeErr.message || 'Error injecting gap task to roadmap.', 'danger');
            btn.disabled = false;
            btn.innerHTML = originalText;
          }
        });
      });
    } catch (err) {
      console.warn('Failed to load matched jobs:', err);
      container.innerHTML = '<div class="col-12 text-center py-4 text-muted small">Live job feed unavailable.</div>';
    }
  };

  // 4. Interactive AI Mock Interview Chamber
  let interviewSession = null;
  let currentQuestionIdx = 0;
  let sessionHistory = [];
  let recognitionInstance = null;
  let isSpeechRecording = false;

  const setupMockInterview = () => {
    const btnLaunch = document.getElementById('btnLaunchMockInterview');
    const modalEl = document.getElementById('mockInterviewModal');
    const btnSpeak = document.getElementById('btnSpeakQuestion');
    const btnToggleMic = document.getElementById('btnToggleMic');
    const micStatusText = document.getElementById('micStatusText');
    const answerInput = document.getElementById('interviewAnswerInput');
    const btnSubmit = document.getElementById('btnSubmitAnswer');
    const btnNext = document.getElementById('btnNextQuestion');
    const btnFinalize = document.getElementById('btnFinalizeInterview');
    const questionLoadingEl = document.getElementById('interviewQuestionLoading');
    const questionContainerEl = document.getElementById('interviewQuestionContainer');
    const interviewTargetRole = document.getElementById('interviewTargetRole');
    const interviewProgressText = document.getElementById('interviewProgressText');
    const questionCategoryBadge = document.getElementById('questionCategoryBadge');
    const currentQuestionText = document.getElementById('currentQuestionText');
    const feedbackCard = document.getElementById('evaluationFeedbackCard');

    if (!btnLaunch || !modalEl) return;

    // Launch button handler
    btnLaunch.onclick = async () => {
      const modalInstance = bootstrap.Modal.getOrCreateInstance(modalEl);
      modalInstance.show();

      const user = dashboardData?.user || window.Auth?.getUser() || {};
      const targetRole = dashboardData?.activeRoadmap?.career?.title || 
                         dashboardData?.readinessData?.targetRole || 
                         (user.interests && user.interests[0]) || 
                         'Full-Stack Developer';

      if (interviewTargetRole) interviewTargetRole.textContent = targetRole;
      if (interviewProgressText) interviewProgressText.textContent = 'Question 1 of 3';

      // Show question loading state
      if (questionLoadingEl) questionLoadingEl.classList.remove('d-none');
      if (questionContainerEl) questionContainerEl.classList.add('d-none');
      if (feedbackCard) feedbackCard.classList.add('d-none');
      if (btnSubmit) {
        btnSubmit.disabled = true;
        btnSubmit.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Preparing Questions...';
      }
      if (btnNext) btnNext.classList.add('d-none');
      if (btnFinalize) btnFinalize.classList.add('d-none');

      try {
        const res = await window.API.post('/interview/start', {
          targetRole: targetRole,
          questionCount: 3
        }, { auth: true });

        if (res.success && res.data && Array.isArray(res.data.questions) && res.data.questions.length > 0) {
          interviewSession = res.data;
          currentQuestionIdx = 0;
          sessionHistory = [];
          renderInterviewQuestion();
        } else {
          showAlert(res.message || 'Failed to start interview chamber.', 'danger');
          if (currentQuestionText) currentQuestionText.textContent = 'Failed to load interview question. Please try again.';
          if (questionLoadingEl) questionLoadingEl.classList.add('d-none');
          if (questionContainerEl) questionContainerEl.classList.remove('d-none');
        }
      } catch (err) {
        console.error('Error launching mock interview chamber:', err);
        showAlert(err.message || 'Error launching mock interview chamber.', 'danger');
        if (currentQuestionText) currentQuestionText.textContent = 'Error connecting to AI interviewer. Please check your connection.';
        if (questionLoadingEl) questionLoadingEl.classList.add('d-none');
        if (questionContainerEl) questionContainerEl.classList.remove('d-none');
      }
    };

    // Render Question
    const renderInterviewQuestion = () => {
      if (!interviewSession || !interviewSession.questions || !interviewSession.questions.length) return;
      const q = interviewSession.questions[currentQuestionIdx];
      if (!q) return;

      if (questionLoadingEl) questionLoadingEl.classList.add('d-none');
      if (questionContainerEl) questionContainerEl.classList.remove('d-none');

      const qText = q.question || q.questionText || 'Walk through your technical approach and architectural decision-making process.';
      const rawCategory = q.questionType || q.category || 'TECHNICAL';
      const qCategory = String(rawCategory).replace(/_/g, ' ').toUpperCase();

      if (interviewTargetRole) interviewTargetRole.textContent = interviewSession.targetRole || 'Full-Stack Developer';
      if (interviewProgressText) interviewProgressText.textContent = `Question ${currentQuestionIdx + 1} of ${interviewSession.questions.length}`;
      if (questionCategoryBadge) questionCategoryBadge.textContent = `${qCategory} SCENARIO`;
      if (currentQuestionText) currentQuestionText.textContent = qText;

      if (answerInput) {
        answerInput.value = '';
        answerInput.disabled = false;
        answerInput.focus();
      }
      if (feedbackCard) feedbackCard.classList.add('d-none');

      if (btnSubmit) {
        btnSubmit.classList.remove('d-none');
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = '<i class="bi bi-send-fill me-1"></i> Evaluate Response';
      }
      if (btnNext) btnNext.classList.add('d-none');
      if (btnFinalize) btnFinalize.classList.add('d-none');
    };

    // Text-to-Speech (TTS)
    if (btnSpeak) {
      btnSpeak.onclick = () => {
        if (!interviewSession || !interviewSession.questions) return;
        if (!('speechSynthesis' in window)) {
          showAlert('Text-to-speech audio is not supported in this browser.', 'info');
          return;
        }

        const q = interviewSession.questions[currentQuestionIdx];
        if (!q) return;
        const qText = q.question || q.questionText;
        if (!qText) return;

        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(qText);
        utterance.rate = 0.95;
        utterance.pitch = 1.0;
        const btnSpeakText = document.getElementById('btnSpeakText');
        if (btnSpeakText) btnSpeakText.textContent = 'Speaking...';

        utterance.onend = () => {
          if (btnSpeakText) btnSpeakText.textContent = 'Read Question';
        };
        utterance.onerror = () => {
          if (btnSpeakText) btnSpeakText.textContent = 'Read Question';
        };

        window.speechSynthesis.speak(utterance);
      };
    }

    // Web Speech API STT
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (btnToggleMic) {
      if (!SpeechRecognition) {
        btnToggleMic.title = 'Speech recognition not supported in this browser. Please type your answer.';
      }

      btnToggleMic.onclick = () => {
        if (!SpeechRecognition) {
          showAlert('Microphone voice recognition is not supported in this browser. You can type your response in the box below!', 'info');
          if (answerInput) answerInput.focus();
          return;
        }

        if (isSpeechRecording) {
          if (recognitionInstance) recognitionInstance.stop();
          isSpeechRecording = false;
          btnToggleMic.className = 'btn btn-outline-danger btn-sm px-2 py-0.5';
          if (micStatusText) micStatusText.textContent = 'Start Voice Answer';
        } else {
          recognitionInstance = new SpeechRecognition();
          recognitionInstance.continuous = true;
          recognitionInstance.interimResults = true;
          recognitionInstance.lang = 'en-US';

          recognitionInstance.onstart = () => {
            isSpeechRecording = true;
            btnToggleMic.className = 'btn btn-danger btn-sm px-2 py-0.5 mic-recording-pulse';
            if (micStatusText) micStatusText.textContent = 'Listening (Speak now)...';
          };

          recognitionInstance.onresult = (event) => {
            let transcript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
              transcript += event.results[i][0].transcript;
            }
            if (answerInput && transcript.trim()) {
              answerInput.value = (answerInput.value ? answerInput.value + ' ' : '') + transcript.trim();
            }
          };

          recognitionInstance.onerror = (err) => {
            console.warn('Speech recognition error:', err);
            isSpeechRecording = false;
            btnToggleMic.className = 'btn btn-outline-danger btn-sm px-2 py-0.5';
            if (micStatusText) micStatusText.textContent = 'Start Voice Answer';
          };

          recognitionInstance.onend = () => {
            isSpeechRecording = false;
            btnToggleMic.className = 'btn btn-outline-danger btn-sm px-2 py-0.5';
            if (micStatusText) micStatusText.textContent = 'Start Voice Answer';
          };

          recognitionInstance.start();
        }
      };
    }

    // Submit Answer & Evaluate
    if (btnSubmit) {
      btnSubmit.onclick = async () => {
        const text = answerInput ? answerInput.value.trim() : '';
        if (!text || text.length < 10) {
          showAlert('Please provide an answer of at least 10 characters (either spoken or typed).', 'warning');
          if (answerInput) answerInput.focus();
          return;
        }

        // Stop mic if recording
        if (isSpeechRecording && recognitionInstance) {
          recognitionInstance.stop();
          isSpeechRecording = false;
          if (btnToggleMic) btnToggleMic.className = 'btn btn-outline-danger btn-sm px-2 py-0.5';
          if (micStatusText) micStatusText.textContent = 'Start Voice Answer';
        }

        btnSubmit.disabled = true;
        btnSubmit.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> AI Evaluating...';

        try {
          const currentQ = interviewSession.questions[currentQuestionIdx];
          const qText = currentQ.question || currentQ.questionText || '';
          const qType = currentQ.questionType || currentQ.category || 'technical';
          const targetRole = interviewSession.targetRole || 'Full-Stack Developer';

          const evalRes = await window.API.post('/interview/evaluate', {
            question: qText,
            answer: text,
            questionType: qType,
            targetRole: targetRole,
            sessionId: interviewSession.sessionId,
            questionIndex: currentQuestionIdx
          }, { auth: true });

          if (evalRes.success && evalRes.data) {
            const evalData = evalRes.data;
            const compositeScore = evalData.overallScore ?? evalData.rubric?.compositeScore ?? 75;
            const techScore = evalData.technicalScore ?? evalData.rubric?.technicalDepth ?? compositeScore;
            const commScore = evalData.communicationScore ?? evalData.rubric?.communication ?? compositeScore;
            const pracScore = evalData.practicalScore ?? evalData.rubric?.practicalApplication ?? compositeScore;
            const feedback = evalData.feedback || 'Good structured response.';
            const modelAnswer = evalData.modelAnswer || evalData.modelAnswerSnippet || 'Comprehensive technical design answer.';

            // Record into session history
            sessionHistory.push({
              question: qText,
              questionType: qType,
              answer: text,
              score: compositeScore,
              technicalScore: techScore,
              communicationScore: commScore,
              practicalScore: pracScore,
              feedback: feedback,
              modelAnswer: modelAnswer
            });

            // Populate feedback card
            const evalScoreBadge = document.getElementById('evalScoreBadge');
            const evalFeedbackText = document.getElementById('evalFeedbackText');
            const evalTechScore = document.getElementById('evalTechScore');
            const evalCommScore = document.getElementById('evalCommScore');
            const evalPracScore = document.getElementById('evalPracScore');
            const evalModelAnswer = document.getElementById('evalModelAnswer');

            if (evalScoreBadge) evalScoreBadge.textContent = `Score: ${compositeScore}/100`;
            if (evalFeedbackText) evalFeedbackText.textContent = feedback;
            if (evalTechScore) evalTechScore.textContent = `${techScore}%`;
            if (evalCommScore) evalCommScore.textContent = `${commScore}%`;
            if (evalPracScore) evalPracScore.textContent = `${pracScore}%`;
            if (evalModelAnswer) evalModelAnswer.textContent = modelAnswer;

            if (feedbackCard) feedbackCard.classList.remove('d-none');
            btnSubmit.classList.add('d-none');
            if (answerInput) answerInput.disabled = true;

            // Determine if more questions or finalize
            if (currentQuestionIdx < interviewSession.questions.length - 1) {
              if (btnNext) btnNext.classList.remove('d-none');
            } else {
              if (btnFinalize) btnFinalize.classList.remove('d-none');
            }
          } else {
            showAlert(evalRes.message || 'Failed to evaluate answer.', 'danger');
            btnSubmit.disabled = false;
            btnSubmit.innerHTML = '<i class="bi bi-send-fill me-1"></i> Evaluate Response';
          }
        } catch (evalErr) {
          console.error('Error evaluating interview answer:', evalErr);
          showAlert(evalErr.message || 'Error evaluating interview answer.', 'danger');
          btnSubmit.disabled = false;
          btnSubmit.innerHTML = '<i class="bi bi-send-fill me-1"></i> Evaluate Response';
        }
      };
    }

    // Next Question
    if (btnNext) {
      btnNext.onclick = () => {
        currentQuestionIdx++;
        renderInterviewQuestion();
      };
    }

    // Finalize Interview
    if (btnFinalize) {
      btnFinalize.onclick = async () => {
        btnFinalize.disabled = true;
        btnFinalize.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Finalizing Score...';

        try {
          const avgOverall = Math.round(sessionHistory.reduce((sum, h) => sum + (h.score || 0), 0) / (sessionHistory.length || 1));
          const avgTech = Math.round(sessionHistory.reduce((sum, h) => sum + (h.technicalScore || avgOverall), 0) / (sessionHistory.length || 1));
          const avgComm = Math.round(sessionHistory.reduce((sum, h) => sum + (h.communicationScore || avgOverall), 0) / (sessionHistory.length || 1));
          const avgPrac = Math.round(sessionHistory.reduce((sum, h) => sum + (h.practicalScore || avgOverall), 0) / (sessionHistory.length || 1));

          const finalRes = await window.API.post('/interview/finalize', {
            targetRole: interviewSession.targetRole || 'Full-Stack Developer',
            scores: {
              overallScore: avgOverall,
              technicalScore: avgTech,
              communicationScore: avgComm,
              practicalScore: avgPrac
            },
            history: sessionHistory
          }, { auth: true });

          if (finalRes.success && finalRes.data) {
            const modalInstance = bootstrap.Modal.getInstance(modalEl);
            if (modalInstance) modalInstance.hide();

            const finalScore = finalRes.data.averageScore || finalRes.data.overallScore || avgOverall;
            showAlert(`🎉 Mock interview complete! Overall Interview Score: ${finalScore}/100. Your Career Readiness Index has been updated!`, 'success');
            await loadJobReadiness();
          } else {
            showAlert(finalRes.message || 'Failed to finalize interview.', 'danger');
            btnFinalize.disabled = false;
            btnFinalize.innerHTML = '<i class="bi bi-trophy-fill me-1"></i> Complete & Save Score';
          }
        } catch (finErr) {
          console.error('Error finalizing interview session:', finErr);
          showAlert(finErr.message || 'Error finalizing interview session.', 'danger');
          btnFinalize.disabled = false;
          btnFinalize.innerHTML = '<i class="bi bi-trophy-fill me-1"></i> Complete & Save Score';
        }
      };
    }

    // Modal hide cleanup
    modalEl.addEventListener('hidden.bs.modal', () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (isSpeechRecording && recognitionInstance) {
        recognitionInstance.stop();
        isSpeechRecording = false;
      }
    });
  };

  // 5. Official Certificate Sharing
  const setupCertificateModal = () => {
    const btnShare = document.getElementById('btnShareCertificate');
    if (!btnShare) return;

    btnShare.onclick = () => {
      const certId = document.getElementById('certVerificationId')?.textContent || 'CP-2026';
      const role = document.getElementById('certCareerTitle')?.textContent || 'Full-Stack Developer';

      const shareText = `🎓 I just verified my technical competencies and achieved the Job Ready milestone for ${role} on CareerPath AI! Credential ID: ${certId}. Built by Team 404 Brain Not Found for Hack2Ignite.`;
      const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.origin)}&title=${encodeURIComponent(shareText)}`;

      // Copy credential ID to clipboard
      if (navigator.clipboard) {
        navigator.clipboard.writeText(`CareerPath AI Verified Credential: ${certId} (${role})`);
        showAlert(`Verification ID [${certId}] copied to clipboard! Opening LinkedIn share...`, 'success');
      }

      window.open(linkedInUrl, '_blank', 'width=600,height=600');
    };
  };

  // Safe string escaper
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Initialize and load dashboard
  setupMockInterview();
  setupCertificateModal();
  loadDashboard();
});
