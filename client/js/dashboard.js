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

  // 2. DOM Elements
  const loadingState = document.getElementById('loadingState');
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
    try {
      const res = await window.API.get('/dashboard', { auth: true });

      loadingState.classList.add('d-none');

      if (res.success && res.data) {
        dashboardData = res.data;
        renderDashboard();
      } else {
        showAlert(res.message || 'Unable to load dashboard data.');
      }
    } catch (err) {
      loadingState.classList.add('d-none');
      showAlert(err.message || 'Failed to fetch student dashboard telemetry.');
    }
  };

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
        viewResumeLink.href = user.resumeUrl;
        viewResumeLink.classList.remove('d-none');
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

      const verifiedBadge = s.isCodeVerified
        ? `<span class="badge-code-verified ms-1" title="Verified from real GitHub repository code"><i class="bi bi-github"></i> Verified</span>`
        : '';

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

    const handleConnectClick = () => {
      if (window.GitHubAuth?.connectGitHubAccount) {
        window.GitHubAuth.connectGitHubAccount(async (err, data) => {
          if (err) {
            showAlert(err.message || 'GitHub connection failed.', 'danger');
          } else {
            showAlert(`GitHub account @${data.profile?.username || 'user'} connected with ${data.repos?.length || 0} study repos!`, 'success');
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
      const user = dashboardData?.user || window.Auth?.getUser() || {};
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

      const userId = dashboardData?.user?.id || window.Auth?.getUser()?.id;
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

      const userId = dashboardData?.user?.id || window.Auth?.getUser()?.id;
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
            viewResumeLink.href = downloadUrl;
            viewResumeLink.classList.remove('d-none');
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

  // Load dashboard
  loadDashboard();
});
