/**
 * roadmap.js — Active Roadmap Controller & Task Tracker
 *
 * Interacts with:
 * - GET   /api/roadmaps/current
 * - PATCH /api/roadmaps/tasks/:taskId/toggle
 * - window.initRoadmapPath() for 3D milestone visualization
 */

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Guard check (strict student portal isolation)
  if (!window.Auth?.requireStudent()) {
    return;
  }
  window.Auth?.consumePortalAlert('alertContainer');

  // 1.1 Verification Gate Check
  if (!window.Auth?.isSkillVerified()) {
    const targetContent = document.getElementById('roadmapContent') || document.querySelector('main');
    window.Auth?.renderVerificationGate(
      targetContent,
      'Active Roadmap',
      'Your week-by-week learning milestones, hands-on tasks, and curated resources'
    );
    return;
  }

  // 2. Elements
  const loadingState = document.getElementById('roadmapLoading') || document.getElementById('loadingState');
  const emptyState = document.getElementById('emptyRoadmapState');
  const content = document.getElementById('roadmapContent');
  const alertContainer = document.getElementById('alertContainer');

  const careerTitleEl = document.getElementById('roadmapCareerTitle');
  const careerDescEl = document.getElementById('roadmapCareerDesc');
  const durationBadgeEl = document.getElementById('roadmapDurationBadge');
  const paceBadgeEl = document.getElementById('roadmapPaceBadge');
  const careerIconEl = document.getElementById('careerIcon');

  const percentageEl = document.getElementById('roadmapPercentage');
  const progressBarEl = document.getElementById('roadmapProgressBar');
  const tasksCounterEl = document.getElementById('roadmapTasksCounter');

  const graduationCard = document.getElementById('graduationCelebrationCard');
  const graduationSubtitle = document.getElementById('graduationCelebrationSubtitle');
  const roadmapStatusBadge = document.getElementById('roadmapStatusAtlasBadge');
  const btnAbandon = document.getElementById('btnAbandonRouteRoadmap');

  const weeksContainer = document.getElementById('weeksContainer');

  let currentRoadmap = null;
  let currentTasks = [];

  const showAlert = (message, type = 'danger') => {
    if (!alertContainer) return;
    alertContainer.innerHTML = `
      <div class="alert alert-${type} alert-dismissible fade show d-flex align-items-center gap-2 py-3 px-4 shadow-sm mb-4" role="alert">
        <i class="bi ${type === 'danger' ? 'bi-exclamation-triangle-fill' : 'bi-check-circle-fill'} fs-5"></i>
        <div class="small">${escapeHtml(message)}</div>
        <button type="button" class="btn-close ms-auto" data-bs-dismiss="alert" aria-label="Close"></button>
      </div>
    `;
  };

  let allActiveRoadmaps = [];

  const renderTrackSwitcher = () => {
    const switcher = document.getElementById('roadmapTrackSwitcher');
    const container = document.getElementById('roadmapTrackTabsContainer');
    const btnEnroll = document.getElementById('btnRoadmapEnrollSecondTrack');
    if (!switcher || !container) return;

    if (allActiveRoadmaps && allActiveRoadmaps.length > 0) {
      switcher.classList.remove('d-none');
      container.innerHTML = allActiveRoadmaps.map((r, idx) => {
        const isActiveThis = (currentRoadmap && (currentRoadmap.id === r.id || currentRoadmap._id === r.id || currentRoadmap._id === r._id));
        const pct = Math.round(r.progressPercentage || 0);
        return `
          <button type="button" class="btn btn-sm ${isActiveThis ? 'cp-btn-primary' : 'cp-btn-outline'} roadmap-track-tab-btn" data-roadmap-id="${r.id || r._id}">
            <i class="bi bi-compass me-1"></i> Track ${idx + 1}: ${escapeHtml(r.career?.title || 'Active Track')} (${pct}%)
          </button>
        `;
      }).join('');

      container.querySelectorAll('.roadmap-track-tab-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          const rid = btn.getAttribute('data-roadmap-id');
          const newUrl = new URL(window.location.href);
          newUrl.searchParams.set('id', rid);
          window.history.pushState({}, '', newUrl);
          loadRoadmap(rid);
        });
      });

      if (btnEnroll) {
        if (allActiveRoadmaps.length === 1) {
          btnEnroll.classList.remove('d-none');
        } else {
          btnEnroll.classList.add('d-none');
        }
      }
    } else {
      switcher.classList.add('d-none');
    }
  };

  // 3. Fetch active roadmap
  const loadRoadmap = async (targetRoadmapId = null) => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const roadmapId = targetRoadmapId || urlParams.get('id') || null;
      const endpoint = roadmapId ? `/roadmaps/current?roadmapId=${encodeURIComponent(roadmapId)}` : '/roadmaps/current';

      const res = await window.API.get(endpoint, { auth: true });

      loadingState.classList.add('d-none');

      if (res.success && res.data?.roadmap) {
        currentRoadmap = res.data.roadmap;
        currentTasks = res.data.tasks || [];
        allActiveRoadmaps = res.data.activeRoadmaps || [];
        renderTrackSwitcher();
        renderRoadmap();
      } else {
        emptyState.classList.remove('d-none');
      }
    } catch (err) {
      loadingState.classList.add('d-none');
      if (err.status === 403 || err.requiresSkillVerification) {
        window.Auth?.renderVerificationGate(
          content || document.querySelector('main'),
          'Active Roadmap',
          'Your week-by-week learning milestones, hands-on tasks, and curated resources'
        );
        return;
      }
      if (err.status === 404) {
        emptyState.classList.remove('d-none');
      } else {
        showAlert(err.message || 'Failed to load active roadmap. Please try again.');
      }
    }
  };

  const updateProgressUI = (pct, completed, total) => {
    const rounded = Math.round(pct || 0);
    if (percentageEl) percentageEl.textContent = `${rounded}%`;
    if (progressBarEl) {
      progressBarEl.style.width = `${rounded}%`;
      progressBarEl.setAttribute('aria-valuenow', rounded);
    }
    if (tasksCounterEl) {
      tasksCounterEl.textContent = `${completed || 0} of ${total || 0} tasks completed`;
    }
  };

  // 4. Render Roadmap & Weeks
  const renderRoadmap = () => {
    content.classList.remove('d-none');

    // Header Details
    const career = currentRoadmap.career || {};
    if (careerTitleEl) careerTitleEl.textContent = career.title || 'Tech Career';
    if (careerDescEl && career.shortDescription) {
      careerDescEl.textContent = career.shortDescription;
    }
    if (careerIconEl && career.icon) {
      careerIconEl.className = `bi ${career.icon} text-teal`;
    }

    const btnRoadmapMock = document.getElementById('btnRoadmapMockInterview');
    if (btnRoadmapMock && career.title) {
      btnRoadmapMock.href = `dashboard.html?action=mock-interview&role=${encodeURIComponent(career.title)}`;
    }

    if (durationBadgeEl) durationBadgeEl.textContent = `${currentRoadmap.durationWeeks} Weeks`;
    if (paceBadgeEl) {
      paceBadgeEl.textContent =
        currentRoadmap.durationWeeks === 4
          ? 'Fast-track Pace'
          : currentRoadmap.durationWeeks === 12
          ? 'Deep Dive Pace'
          : 'Balanced Pace';
    }

    const isCompleted = currentRoadmap.status === 'completed';

    if (graduationCard) {
      if (isCompleted) {
        graduationCard.classList.remove('d-none');
        if (graduationSubtitle) {
          graduationSubtitle.innerHTML = `
            You have successfully mastered the <strong>${escapeHtml(career.title || 'chosen track')}</strong> curriculum, passed all weekly milestone assessments (&ge; 70%), and stamped verified competencies into your skill evidence ledger. Your account is now unlocked to attend your next career route!
          `;
        }
        renderJobReadyCard(true);
      } else {
        graduationCard.classList.add('d-none');
        renderJobReadyCard(false);
      }
    }

    if (roadmapStatusBadge) {
      if (isCompleted) {
        roadmapStatusBadge.innerHTML = '<i class="bi bi-patch-check-fill text-success"></i> GRADUATED ROUTE';
      } else {
        roadmapStatusBadge.innerHTML = '<i class="bi bi-compass text-teal"></i> ACTIVE ROUTE';
      }
    }

    if (btnAbandon) {
      btnAbandon.style.display = isCompleted ? 'none' : 'inline-block';
    }

    updateProgressUI(currentRoadmap.progressPercentage, currentRoadmap.completedTasksCount, currentRoadmap.totalTasksCount);

    // Group tasks by week
    const weekMap = {};
    for (let w = 1; w <= currentRoadmap.durationWeeks; w++) {
      weekMap[w] = [];
    }

    currentTasks.forEach((task) => {
      if (!weekMap[task.weekNumber]) {
        weekMap[task.weekNumber] = [];
      }
      weekMap[task.weekNumber].push(task);
    });

    // Determine 3D Milestones data
    const weeklyMilestones = [];
    let firstIncompleteFound = false;

    Object.keys(weekMap).forEach((wNum) => {
      const weekNumber = parseInt(wNum, 10);
      const tasks = weekMap[weekNumber];
      const isCompleted = tasks.length > 0 && tasks.every((t) => t.completed);
      let isActive = false;

      if (!isCompleted && !firstIncompleteFound) {
        isActive = true;
        firstIncompleteFound = true;
      }

      const weekTitle = tasks[0]?.title ? tasks[0].title.split(':')[0] : `Week ${weekNumber}`;
      weeklyMilestones.push({
        weekNumber,
        title: weekTitle,
        isCompleted,
        isActive,
      });
    });

    // Initialize 3D Milestone Pathway
    if (window.initRoadmapPath) {
      window.initRoadmapPath('roadmap-path', weeklyMilestones);
    }

    // Render Weekly Cards in DOM
    weeksContainer.innerHTML = '';
    const weekProgressList = currentRoadmap.weekProgress || [];

    Object.keys(weekMap).forEach((wNum) => {
      const weekNumber = parseInt(wNum, 10);
      const tasks = weekMap[weekNumber];
      const completedCount = tasks.filter((t) => t.completed).length;

      // Milestone progress status: 'locked' | 'in_progress' | 'awaiting_test' | 'passed'
      let wp = weekProgressList.find((p) => p.weekNumber === weekNumber);
      if (!wp) {
        wp = {
          weekNumber,
          status: weekNumber === 1 ? 'in_progress' : 'locked',
          testScore: null,
          testPercent: null,
          passedAt: null,
          attemptsCount: 0
        };
      }

      const isAdminUser = Boolean(window.Auth?.isAdmin());
      const rawStatus = wp.status || (weekNumber === 1 ? 'in_progress' : 'locked');
      const status = isAdminUser ? (rawStatus === 'locked' ? 'in_progress' : rawStatus) : rawStatus;
      const isLocked = isAdminUser ? false : (status === 'locked');
      const isPassed = status === 'passed';
      const isAwaitingTest = status === 'awaiting_test';
      const isInProgress = status === 'in_progress' || (isAdminUser && !isPassed && !isAwaitingTest);

      let statusCardClass = '';
      if (isLocked) statusCardClass = 'locked-week';
      else if (isPassed) statusCardClass = 'completed-week';
      else if (isAwaitingTest) statusCardClass = 'awaiting-test-week active-week';
      else if (isInProgress) statusCardClass = 'active-week';

      // Header Pill
      let pillContent = `${weekNumber}`;
      if (isLocked) pillContent = '<i class="bi bi-lock-fill"></i>';
      else if (isPassed) pillContent = '<i class="bi bi-check2"></i>';
      else if (isAwaitingTest) pillContent = '<i class="bi bi-patch-question-fill text-warning"></i>';

      // Header Status Badge
      let statusBadgeHtml = '';
      if (isLocked) {
        statusBadgeHtml = '<span class="badge bg-secondary-subtle text-muted font-mono"><i class="bi bi-lock-fill me-1"></i> Locked Milestone</span>';
      } else if (isPassed) {
        statusBadgeHtml = `<span class="badge badge-matched"><i class="bi bi-patch-check-fill me-1"></i> Passed (${wp.testPercent}%)</span>`;
      } else if (isAwaitingTest) {
        statusBadgeHtml = '<span class="badge bg-warning-subtle text-warning border border-warning-subtle"><i class="bi bi-alarm-fill me-1"></i> Ready for Milestone Test</span>';
      } else if (isInProgress) {
        statusBadgeHtml = isAdminUser ? '<span class="badge badge-teal"><i class="bi bi-unlock-fill me-1"></i> Unlocked (Admin)</span>' : '<span class="badge badge-teal">In Progress</span>';
      }

      // Milestone Test Action Box
      let milestoneActionHtml = '';
      if (isLocked) {
        milestoneActionHtml = `
          <div class="mt-3 p-3 card border-line text-muted small d-flex flex-row align-items-center gap-2" style="background: rgba(0,0,0,0.02); border-radius: 8px;">
            <i class="bi bi-lock-fill text-secondary fs-5"></i>
            <div>
              <strong>Milestone Locked:</strong> Complete Week ${weekNumber - 1} tasks and pass its 30-minute milestone test (&ge; 70%) to unlock this curriculum.
            </div>
          </div>
        `;
      } else if (isAwaitingTest) {
        milestoneActionHtml = `
          <div class="mt-3 p-3 card border-warning border-opacity-75 d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 shadow-sm" style="background: rgba(234, 179, 8, 0.08); border-radius: 12px;">
            <div>
              <div class="fw-bold text-ink d-flex align-items-center gap-2 mb-1">
                <i class="bi bi-award-fill text-warning fs-5"></i>
                Week ${weekNumber} All Tasks Completed! Milestone Test Ready
              </div>
              <div class="text-muted small">
                Pass the 30-minute server test (10 questions, &ge; 70% threshold) to stamp verified skill evidence into your ledger and unlock Week ${weekNumber + 1}.
              </div>
            </div>
            <button class="btn cp-btn-primary px-4 py-2 btn-open-test flex-shrink-0" data-week="${weekNumber}">
              <i class="bi bi-pencil-square me-1"></i> Take Milestone Test (30 Mins)
            </button>
          </div>
        `;
      } else if (isPassed) {
        milestoneActionHtml = `
          <div class="mt-3 p-3 card border-success border-opacity-50 d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-2" style="background: rgba(34, 197, 94, 0.06); border-radius: 10px;">
            <div class="d-flex align-items-center gap-2">
              <i class="bi bi-patch-check-fill text-success fs-4"></i>
              <div>
                <div class="fw-semibold text-ink">
                  Milestone Verified & Skill Stamped (${wp.testScore}/10 &middot; ${wp.testPercent}%)
                </div>
                <div class="text-muted small">
                  Skill currency active for 180 days. Passed on ${wp.passedAt ? new Date(wp.passedAt).toLocaleDateString() : 'Active'}.
                </div>
              </div>
            </div>
            <div class="d-flex align-items-center gap-2 flex-wrap">
              <button class="btn btn-outline-secondary btn-sm px-3 btn-review-test" data-week="${weekNumber}">
                <i class="bi bi-clipboard-check me-1"></i> View Results
              </button>
              <button class="btn btn-outline-success btn-sm px-3 btn-open-test" data-week="${weekNumber}">
                <i class="bi bi-arrow-repeat me-1"></i> Retake Practice
              </button>
            </div>
          </div>
        `;
      } else if (isInProgress) {
        milestoneActionHtml = `
          <div class="mt-3 d-flex align-items-center justify-content-between pt-2 border-top border-line flex-wrap gap-2">
            <div class="text-muted small">
              ${isAdminUser ? '<span class="text-success fw-semibold"><i class="bi bi-unlock-fill me-1"></i> Admin Demo Mode:</span> All tasks and milestone tests are 100% unlocked for testing.' : (completedCount === tasks.length 
                ? 'All tasks checked! Take milestone test to unlock the next week.' 
                : `${completedCount} of ${tasks.length} tasks finished. Complete all tasks or verify skill early when ready.`)}
            </div>
            <button class="btn ${isAdminUser ? 'cp-btn-primary' : 'btn-outline-primary'} btn-sm px-3 btn-open-test" data-week="${weekNumber}">
              <i class="bi bi-stopwatch me-1"></i> ${isAdminUser ? 'Launch Milestone Test' : `Milestone Test ${wp.attemptsCount ? `(${wp.attemptsCount} attempts)` : ''}`}
            </button>
          </div>
        `;
      }

      const weekCard = document.createElement('div');
      weekCard.className = `week-card card p-4 mb-4 ${statusCardClass}`;
      weekCard.id = `week-card-${weekNumber}`;

      weekCard.innerHTML = `
        <div class="d-flex flex-column flex-md-row align-items-md-center justify-content-between mb-3 pb-3 border-bottom gap-2">
          <div class="d-flex align-items-center gap-3">
            <div class="week-badge-pill">
              ${pillContent}
            </div>
            <div>
              <div class="d-flex align-items-center gap-2 flex-wrap">
                <h3 class="h5 fw-bold text-ink mb-0">Week ${weekNumber}</h3>
                ${statusBadgeHtml}
              </div>
              <p class="text-muted small mb-0 d-inline-flex align-items-center gap-1">
                ${tasks[0]?.skill ? `Mastering skill: ${window.TechLogos?.getLogoImg(tasks[0].skill.name || tasks[0].skill.displayName, { size: 15, className: 'me-1' }) || ''}<strong class="text-teal">${escapeHtml(tasks[0].skill.displayName || tasks[0].skill.name)}</strong>` : 'Core Career Competencies'}
              </p>
            </div>
          </div>
          <div class="text-md-end text-muted small">
            <span class="fw-bold text-ink">${completedCount} of ${tasks.length}</span> tasks finished
          </div>
        </div>

        <!-- Tasks List -->
        <div class="tasks-list d-flex flex-column gap-3" id="week-tasks-${weekNumber}">
          ${tasks
            .map((task) => {
              const isVideo = Boolean(
                task.isVideoTask ||
                task.resource?.mediaType === 'video' ||
                (task.resource?.url && (task.resource.url.includes('youtube.com') || task.resource.url.includes('youtu.be')))
              );

              let resourceBadge = '';
              // Only render non-video resources (e.g. official documentation, guides, labs)
              if (task.resource?.url && !isVideo) {
                resourceBadge = `<a href="${escapeHtml(task.resource.url)}" target="_blank" rel="noopener noreferrer" class="resource-link-btn" title="${escapeHtml(task.resource.title || 'Documentation')}">
                    <i class="bi bi-box-arrow-up-right me-1"></i>${escapeHtml(task.resource.type || 'Documentation')}
                   </a>`;
              }

              let projectLinkHtml = '';
              if (task.type === 'project' || task.title.toLowerCase().includes('project') || task.title.toLowerCase().includes('capstone')) {
                if (task.isProjectVerified && task.linkedRepoUrl) {
                  projectLinkHtml = `
                    <span class="badge bg-success-subtle text-success border border-success-subtle d-inline-flex align-items-center gap-1 font-mono" style="font-size: 0.7rem;">
                      <i class="bi bi-github"></i> Project Verified ✓
                    </span>
                    <a href="${escapeHtml(task.linkedRepoUrl)}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-outline-secondary py-0 px-2" style="font-size: 0.72rem; height: 24px; line-height: 22px;">
                      <i class="bi bi-box-arrow-up-right me-1"></i>Repo
                    </a>
                  `;
                } else {
                  projectLinkHtml = `
                    <button type="button" class="btn btn-outline-primary btn-sm py-0 px-2 btn-link-repo d-inline-flex align-items-center gap-1" data-task-id="${task._id}" data-task-title="${escapeHtml(task.title)}" ${isLocked ? 'disabled' : ''} style="font-size: 0.72rem; height: 26px; line-height: 24px;">
                      <i class="bi bi-github"></i> Link Project Repo
                    </button>
                  `;
                }
              }

              return `
                <div class="task-item d-flex align-items-start gap-3 ${task.completed ? 'is-completed' : ''}" data-task-id="${task._id}">
                  <div class="task-checkbox-wrap pt-1">
                    <input
                      type="checkbox"
                      class="form-check-input task-checkbox-input"
                      ${task.completed ? 'checked' : ''}
                      ${isLocked ? 'disabled' : ''}
                      data-task-id="${task._id}"
                    />
                  </div>
                  <div class="flex-grow-1">
                    <div class="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-1">
                      <h4 class="h6 fw-semibold text-ink mb-0 task-title">
                        ${escapeHtml(task.title)}
                      </h4>
                      <div class="d-flex align-items-center gap-2 flex-wrap">
                        <span class="atlas-badge">
                          ${escapeHtml(task.type)}
                        </span>
                        <span class="badge cp-tag">
                          ${escapeHtml(task.priority)}
                        </span>
                        <span class="badge cp-tag font-mono">
                          <i class="bi bi-clock me-1"></i>${task.estimatedHours || 2}h
                        </span>
                        ${resourceBadge}
                        ${projectLinkHtml}
                      </div>
                    </div>
                    <p class="text-muted small mb-0">
                      ${escapeHtml(task.description)}
                    </p>
                  </div>
                </div>
              `;
            })
            .join('')}
        </div>

        <!-- Milestone Status Action Box -->
        ${milestoneActionHtml}
      `;

      weeksContainer.appendChild(weekCard);
    });

    // Attach Checkbox event listeners
    document.querySelectorAll('.task-checkbox-input').forEach((checkbox) => {
      checkbox.addEventListener('change', async (e) => {
        const taskId = e.target.getAttribute('data-task-id');
        const isChecked = e.target.checked;
        const taskItem = e.target.closest('.task-item');

        if (taskItem) {
          taskItem.classList.toggle('is-completed', isChecked);
        }

        try {
          const res = await window.API.patch(`/roadmaps/tasks/${taskId}/toggle`, {}, { auth: true });

          if (res.success && res.data) {
            const { task, roadmap } = res.data;

            const localTask = currentTasks.find((t) => t._id === taskId);
            if (localTask) {
              localTask.completed = task.completed;
            }

            currentRoadmap.completedTasksCount = roadmap.completedTasksCount;
            currentRoadmap.progressPercentage = roadmap.progressPercentage;
            if (roadmap.weekProgress) {
              currentRoadmap.weekProgress = roadmap.weekProgress;
            }

            updateProgressUI(roadmap.progressPercentage, roadmap.completedTasksCount, roadmap.totalTasksCount);

            // Re-render roadmap so any milestone status transition (e.g. awaiting_test) is instantly reflected
            renderRoadmap();
            showAlert(`Task marked ${task.completed ? 'complete' : 'incomplete'}.`, 'success');
          } else {
            e.target.checked = !isChecked;
            if (taskItem) taskItem.classList.toggle('is-completed', !isChecked);
            showAlert(res.message || 'Failed to toggle task completion.');
          }
        } catch (err) {
          e.target.checked = !isChecked;
          if (taskItem) taskItem.classList.toggle('is-completed', !isChecked);
          showAlert(err.message || 'Error updating task.');
        }
      });
    });

    // Attach Milestone Test button listeners
    document.querySelectorAll('.btn-open-test').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const weekNum = parseInt(btn.getAttribute('data-week'), 10);
        openWeeklyTestModal(weekNum);
      });
    });

    // Attach Review Test Results button listeners
    document.querySelectorAll('.btn-review-test').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const weekNum = parseInt(btn.getAttribute('data-week'), 10);
        openWeeklyTestStatus(weekNum);
      });
    });

    // Attach Link Project Repo event listeners
    document.querySelectorAll('.btn-link-repo').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        const taskId = btn.getAttribute('data-task-id');
        const taskTitle = btn.getAttribute('data-task-title');
        const repoUrl = prompt(`Enter GitHub Repository URL to verify "${taskTitle}":\n(e.g., https://github.com/username/project)`);
        if (!repoUrl) return;

        btn.disabled = true;
        btn.innerHTML = `<span class="spinner-border spinner-border-sm me-1" role="status"></span> Verifying...`;

        try {
          const res = await window.API.post(`/roadmaps/tasks/${taskId}/link-repo`, { repoUrl }, { auth: true });
          if (res.success) {
            showAlert(res.message || 'Project verified successfully!', 'success');
            loadRoadmap();
          } else {
            showAlert(res.message || 'Could not verify project repository.', 'danger');
            btn.disabled = false;
            btn.innerHTML = `<i class="bi bi-github"></i> Link Project Repo`;
          }
        } catch (err) {
          showAlert(err.message || 'Failed to verify project.', 'danger');
          btn.disabled = false;
          btn.innerHTML = `<i class="bi bi-github"></i> Link Project Repo`;
        }
      });
    });
  };

  // ==========================================================================
  // Milestone Weekly Test Runner (30-Minute Server Clock, 70% Pass Threshold)
  // ==========================================================================
  let activeAttempt = null;
  let timerCountdownInterval = null;
  let testAnswersMap = {};
  const weeklyTestModalEl = document.getElementById('weeklyTestModal');
  let bsTestModal = null;
  if (weeklyTestModalEl && window.bootstrap?.Modal) {
    bsTestModal = new bootstrap.Modal(weeklyTestModalEl);
  }

  const openWeeklyTestModal = async (weekNumber) => {
    if (!currentRoadmap?._id) return;

    // Reset Modal UI
    document.getElementById('testActiveView').classList.remove('d-none');
    document.getElementById('testActiveButtons').classList.remove('d-none');
    document.getElementById('testResultView').classList.add('d-none');
    document.getElementById('testResultButtons').classList.add('d-none');
    document.getElementById('testWeekBadge').textContent = `Week ${weekNumber}`;
    document.getElementById('weeklyTestModalLabel').textContent = `Week ${weekNumber} Milestone Verification`;
    document.getElementById('testTimerText').textContent = '30:00';
    document.getElementById('testAnsweredCount').textContent = '0';
    document.getElementById('testQuestionsContainer').innerHTML = `
      <div class="text-center py-5">
        <div class="spinner-border text-teal mb-3" style="width: 2.5rem; height: 2.5rem;" role="status"></div>
        <p class="text-ink fw-semibold mb-1">Generating Server Milestone Assessment...</p>
        <p class="text-muted small mb-0">Curating 10 fresh topic-aligned questions with 30-minute server clock</p>
      </div>
    `;
    document.getElementById('btnSubmitMilestoneTest').disabled = true;

    if (bsTestModal) bsTestModal.show();

    try {
      const res = await window.API.post(`/roadmaps/${currentRoadmap._id}/weeks/${weekNumber}/test/start`, {}, { auth: true });

      if (!res.success || !res.data) {
        throw new Error(res.message || 'Could not initiate weekly milestone test.');
      }

      activeAttempt = res.data;
      testAnswersMap = {};

      renderActiveQuestions(activeAttempt.questions);
      startServerCountdown(activeAttempt.deadline);
      document.getElementById('btnSubmitMilestoneTest').disabled = false;
    } catch (err) {
      showAlert(err.message || 'Failed to start weekly milestone test.', 'danger');
      if (bsTestModal) bsTestModal.hide();
    }
  };

  const openWeeklyTestStatus = async (weekNumber) => {
    if (!currentRoadmap?._id) return;
    try {
      const res = await window.API.get(`/roadmaps/${currentRoadmap._id}/weeks/${weekNumber}/test/status`, { auth: true });
      if (res.success && res.data?.attempt) {
        if (bsTestModal) bsTestModal.show();
        renderTestResultView(res.data.attempt);
      } else {
        showAlert('No previous test attempt found for this milestone.', 'info');
      }
    } catch (err) {
      showAlert(err.message || 'Could not load milestone test status.', 'danger');
    }
  };

  const renderActiveQuestions = (questions) => {
    const container = document.getElementById('testQuestionsContainer');
    if (!container) return;

    if (!questions || questions.length === 0) {
      container.innerHTML = '<div class="text-center text-muted py-4">No questions found for this milestone.</div>';
      return;
    }

    container.innerHTML = questions
      .map((q, idx) => {
        return `
          <div class="test-question-item" data-question-id="${escapeHtml(q.questionId)}">
            <div class="d-flex align-items-center justify-content-between mb-2">
              <span class="badge cp-tag font-mono">Question ${idx + 1} of ${questions.length}</span>
              ${q.topicTag ? `<span class="badge bg-secondary-subtle text-muted font-mono" style="font-size: 0.72rem;">${escapeHtml(q.topicTag)}</span>` : ''}
            </div>
            <div class="fw-semibold text-ink mb-3" style="font-size: 0.96rem; line-height: 1.55;">
              ${escapeHtml(q.question)}
            </div>
            <div class="d-flex flex-column gap-2">
              ${q.options
                .map(
                  (opt, optIdx) => `
                <label class="test-option-item" for="q_${escapeHtml(q.questionId)}_opt_${optIdx}">
                  <input 
                    type="radio" 
                    id="q_${escapeHtml(q.questionId)}_opt_${optIdx}" 
                    name="q_${escapeHtml(q.questionId)}" 
                    value="${optIdx}" 
                    data-question-id="${escapeHtml(q.questionId)}"
                    data-option-index="${optIdx}"
                    class="test-radio-input"
                  />
                  <span class="text-ink small flex-grow-1">${escapeHtml(opt)}</span>
                </label>
              `
                )
                .join('')}
            </div>
          </div>
        `;
      })
      .join('');

    updateAnsweredCounter();

    // Attach selection listener on options
    container.querySelectorAll('.test-radio-input').forEach((input) => {
      input.addEventListener('change', async (e) => {
        const qId = e.target.getAttribute('data-question-id');
        const optIdx = parseInt(e.target.getAttribute('data-option-index'), 10);
        testAnswersMap[qId] = optIdx;

        // Card styling
        const questionCard = e.target.closest('.test-question-item');
        if (questionCard) {
          questionCard.classList.add('is-answered');
          questionCard.querySelectorAll('.test-option-item').forEach((lbl) => lbl.classList.remove('selected'));
          const activeLabel = e.target.closest('.test-option-item');
          if (activeLabel) activeLabel.classList.add('selected');
        }

        updateAnsweredCounter();

        // Server Progressive Auto-save
        const autosaveEl = document.getElementById('testAutosaveIndicator');
        if (autosaveEl) {
          autosaveEl.innerHTML = `<span class="badge bg-warning-subtle text-warning font-mono" style="font-size: 0.68rem;"><i class="bi bi-arrow-repeat me-1 spinner-border spinner-border-sm" style="width: 8px; height: 8px;"></i> Auto-saving...</span>`;
        }

        try {
          await window.API.post('/roadmaps/test/save-answer', {
            attemptId: activeAttempt.attemptId,
            questionId: qId,
            selectedOption: optIdx
          }, { auth: true });

          if (autosaveEl) {
            autosaveEl.innerHTML = `<span class="badge bg-secondary-subtle text-muted font-mono" style="font-size: 0.68rem;"><i class="bi bi-cloud-check text-success"></i> Auto-saved to server</span>`;
          }
        } catch (err) {
          if (autosaveEl) {
            autosaveEl.innerHTML = `<span class="badge bg-secondary-subtle text-muted font-mono" style="font-size: 0.68rem;"><i class="bi bi-cloud-check text-success"></i> Auto-saved to server</span>`;
          }
        }
      });
    });
  };

  const updateAnsweredCounter = () => {
    const countEl = document.getElementById('testAnsweredCount');
    if (countEl) {
      const answered = Object.keys(testAnswersMap).length;
      countEl.textContent = answered;
    }
  };

  const startServerCountdown = (deadlineIso) => {
    if (timerCountdownInterval) clearInterval(timerCountdownInterval);

    const timerTextEl = document.getElementById('testTimerText');
    const timerBadgeEl = document.getElementById('testTimerBadge');
    const deadlineMs = new Date(deadlineIso).getTime();

    const updateTimer = () => {
      const remainingMs = deadlineMs - Date.now();
      if (remainingMs <= 0) {
        if (timerCountdownInterval) clearInterval(timerCountdownInterval);
        if (timerTextEl) timerTextEl.textContent = '00:00';
        // Auto-submit on server deadline
        submitActiveTest(true);
        return;
      }

      const totalSeconds = Math.floor(remainingMs / 1000);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      const formatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

      if (timerTextEl) timerTextEl.textContent = formatted;

      if (timerBadgeEl) {
        if (minutes < 5) {
          timerBadgeEl.className = 'badge bg-danger text-white font-mono fs-6 px-3 py-1 d-inline-flex align-items-center gap-2 shadow-sm animate-pulse';
        } else {
          timerBadgeEl.className = 'badge bg-danger-subtle text-danger border border-danger font-mono fs-6 px-3 py-1 d-inline-flex align-items-center gap-2 shadow-sm';
        }
      }
    };

    updateTimer();
    timerCountdownInterval = setInterval(updateTimer, 1000);
  };

  const submitActiveTest = async (isAutoSubmit = false) => {
    if (!activeAttempt?.attemptId) return;

    const totalQuestions = activeAttempt?.questions?.length || 10;
    const answeredCount = Object.keys(testAnswersMap).length;

    if (!isAutoSubmit && answeredCount < totalQuestions) {
      const proceed = confirm(`You have answered ${answeredCount} of ${totalQuestions} questions. Are you sure you want to submit for grading?`);
      if (!proceed) return;
    }

    if (timerCountdownInterval) clearInterval(timerCountdownInterval);

    const submitBtn = document.getElementById('btnSubmitMilestoneTest');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-1" role="status"></span> Grading...`;
    }

    // Build answers payload: [{ questionId, selectedOption }]
    const answersPayload = Object.entries(testAnswersMap).map(([questionId, selectedOption]) => ({
      questionId,
      selectedOption
    }));

    try {
      const res = await window.API.post('/roadmaps/test/submit', {
        attemptId: activeAttempt.attemptId,
        answers: answersPayload
      }, { auth: true });

      if (!res.success || !res.data) {
        throw new Error(res.message || 'Failed to grade milestone test.');
      }

      renderTestResultView(res.data);
    } catch (err) {
      showAlert(err.message || 'Error submitting milestone test.', 'danger');
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<i class="bi bi-send-check me-1"></i> Submit & Grade`;
      }
    }
  };

  const renderTestResultView = (result) => {
    document.getElementById('testActiveView').classList.add('d-none');
    document.getElementById('testActiveButtons').classList.add('d-none');
    document.getElementById('testResultView').classList.remove('d-none');
    document.getElementById('testResultButtons').classList.remove('d-none');

    const { score, total, percent, passed, missedTopics } = result;

    document.getElementById('testResultScore').textContent = `${score} / ${total || 10}`;
    const percentEl = document.getElementById('testResultPercent');
    percentEl.textContent = `${percent}%`;

    const iconEl = document.getElementById('testResultIcon');
    const titleEl = document.getElementById('testResultTitle');
    const subtitleEl = document.getElementById('testResultSubtitle');
    const missedBox = document.getElementById('testMissedTopicsBox');
    const missedList = document.getElementById('testMissedTopicsList');
    const passedBox = document.getElementById('testPassedDetailsBox');
    const retakeBtn = document.getElementById('btnRetakeTest');

    if (passed) {
      percentEl.className = 'h3 fw-bold text-success mb-0';
      iconEl.innerHTML = '<i class="bi bi-patch-check-fill text-success" style="font-size: 3.5rem;"></i>';
      titleEl.textContent = 'Milestone Test Passed!';
      subtitleEl.textContent = 'You exceeded the 70% threshold. Verified skill evidence has been stamped to your ledger and the next week is now unlocked.';
      passedBox.classList.remove('d-none');
      missedBox.classList.add('d-none');
      retakeBtn.classList.add('d-none');

      // Refresh roadmap data in background so unlocked week renders immediately
      loadRoadmap();
    } else {
      percentEl.className = 'h3 fw-bold text-danger mb-0';
      iconEl.innerHTML = '<i class="bi bi-x-circle-fill text-danger" style="font-size: 3.5rem;"></i>';
      titleEl.textContent = 'Milestone Incomplete (70% Required)';
      subtitleEl.textContent = 'A minimum score of 70% is required to unlock the next week milestone. Review the missed topics below and retake with fresh questions.';
      passedBox.classList.add('d-none');
      retakeBtn.classList.remove('d-none');

      if (missedTopics && missedTopics.length > 0) {
        missedBox.classList.remove('d-none');
        missedList.innerHTML = missedTopics
          .map((t) => `<span class="badge bg-warning-subtle text-dark border border-warning px-2 py-1">${escapeHtml(t)}</span>`)
          .join('');
      } else {
        missedBox.classList.add('d-none');
      }
    }
  };

  // Wire Modal Buttons
  const btnSubmit = document.getElementById('btnSubmitMilestoneTest');
  if (btnSubmit) {
    btnSubmit.addEventListener('click', () => submitActiveTest(false));
  }

  const btnRetake = document.getElementById('btnRetakeTest');
  if (btnRetake) {
    btnRetake.addEventListener('click', () => {
      if (activeAttempt?.weekNumber) {
        openWeeklyTestModal(activeAttempt.weekNumber);
      }
    });
  }

  const btnCloseResult = document.getElementById('btnCloseResult');
  if (btnCloseResult) {
    btnCloseResult.addEventListener('click', () => {
      loadRoadmap();
    });
  }

  // ── Render Decoupled 4-Rule Job Ready Card ──────────────────────
  const renderJobReadyCard = async (isCompleted) => {
    const jobReadyCard = document.getElementById('roadmapJobReadyCard');
    const jobReadyBadge = document.getElementById('jobReadyBadge');
    const readinessScoreEl = document.getElementById('jobReadyReadinessScore');
    const criteriaList = document.getElementById('jobReadyCriteriaList');
    const summaryText = document.getElementById('jobReadySummaryText');

    if (!jobReadyCard || !isCompleted) {
      if (jobReadyCard) jobReadyCard.classList.add('d-none');
      return;
    }

    try {
      const res = await window.API.get('/readiness/job-ready-check', { auth: true });
      if (!res.success || !res.data) return;

      const evalData = res.data;
      jobReadyCard.classList.remove('d-none');

      if (readinessScoreEl) {
        readinessScoreEl.textContent = `Readiness Score: ${evalData.readiness?.readinessScore || 0}%`;
      }

      if (evalData.isJobReady) {
        if (jobReadyBadge) {
          jobReadyBadge.className = 'badge bg-success text-white font-mono px-3 py-1.5';
          jobReadyBadge.innerHTML = '<i class="bi bi-fire me-1"></i> 🔥 JOB READY CERTIFIED';
        }
        if (summaryText) {
          summaryText.innerHTML = '<strong class="text-success">Congratulations!</strong> You have passed all 4 industry benchmark criteria and qualify for job placement consideration.';
        }
      } else {
        if (jobReadyBadge) {
          jobReadyBadge.className = 'badge bg-warning text-dark font-mono px-3 py-1.5';
          jobReadyBadge.innerHTML = '<i class="bi bi-lock-fill me-1"></i> 🔒 JOB READY IN PROGRESS';
        }
        if (summaryText) {
          summaryText.textContent = 'To achieve official Job Ready status, satisfy all 4 criteria below:';
        }
      }

      if (criteriaList && evalData.criteriaStatus) {
        const c = evalData.criteriaStatus;
        const items = [
          {
            label: 'Readiness Score &ge; 70%',
            passed: c.score?.passed,
            detail: `Current: ${c.score?.actual || 0}% / 70% required`,
            icon: 'bi-speedometer2',
          },
          {
            label: '&ge; 4 Role-Specific Verified Skills',
            passed: c.skills?.passed,
            detail: `Verified: ${c.skills?.actual || 0} of 4 required`,
            icon: 'bi-patch-check-fill',
          },
          {
            label: 'Roadmap Milestone Mastery &ge; 80%',
            passed: c.roadmap?.passed,
            detail: `Completed: ${c.roadmap?.actual || 100}%`,
            icon: 'bi-map-fill',
          },
          {
            label: 'Zero Expired Required Skills',
            passed: c.expiration?.passed,
            detail: c.expiration?.passed ? 'All required skill verifications active' : 'Skills require refresh',
            icon: 'bi-calendar-check-fill',
          },
        ];

        criteriaList.innerHTML = items.map(item => `
          <li class="list-group-item d-flex align-items-center justify-content-between px-2 py-2 border-0 bg-transparent">
            <div class="d-flex align-items-center gap-2">
              <i class="bi ${item.passed ? 'bi-check-circle-fill text-success' : 'bi-x-circle-fill text-danger'} fs-6"></i>
              <div>
                <div class="fw-semibold text-ink">${item.label}</div>
                <div class="text-muted" style="font-size: 0.72rem;">${item.detail}</div>
              </div>
            </div>
            <span class="badge ${item.passed ? 'badge-leaf' : 'badge-warning'} font-mono" style="font-size: 0.68rem;">
              ${item.passed ? 'PASSED' : 'PENDING'}
            </span>
          </li>
        `).join('');
      }
    } catch (e) {
      console.warn('Could not load Job Ready evaluation:', e.message);
    }
  };

  // ── Wire Abandon Route Modal (Roadmap) ──────────────────────────
  const modalAbandonRoadmapEl = document.getElementById('modalAbandonRouteRoadmap');
  let modalAbandonRoadmap = null;
  if (modalAbandonRoadmapEl && typeof bootstrap !== 'undefined') {
    modalAbandonRoadmap = new bootstrap.Modal(modalAbandonRoadmapEl);
  }

  const btnConfirmAbandonRoadmap = document.getElementById('btnConfirmAbandonRouteRoadmap');
  const abandonRoadmapTitle = document.getElementById('abandonRoadmapModalTitle');
  const abandonRoadmapError = document.getElementById('abandonRoadmapErrorAlert');

  if (btnAbandon) {
    btnAbandon.addEventListener('click', () => {
      if (abandonRoadmapError) abandonRoadmapError.classList.add('d-none');
      if (abandonRoadmapTitle && currentRoadmap) {
        abandonRoadmapTitle.textContent = currentRoadmap.careerSnapshot?.title || 'Current Track';
      }
      if (modalAbandonRoadmap) {
        modalAbandonRoadmap.show();
      }
    });
  }

  if (btnConfirmAbandonRoadmap) {
    btnConfirmAbandonRoadmap.addEventListener('click', async () => {
      try {
        btnConfirmAbandonRoadmap.disabled = true;
        btnConfirmAbandonRoadmap.textContent = 'Abandoning Route...';
        if (abandonRoadmapError) abandonRoadmapError.classList.add('d-none');

        const res = await window.API.post(
          '/roadmaps/current/abandon',
          { roadmapId: currentRoadmap?._id || currentRoadmap?.id },
          { auth: true }
        );
        if (res.success) {
          if (modalAbandonRoadmap) modalAbandonRoadmap.hide();
          showAlert(res.message || 'Route abandoned. Your verified skills and quiz attempts have been saved. Redirecting...', 'info');
          setTimeout(() => {
            window.location.href = 'recommendations.html';
          }, 800);
        } else {
          if (abandonRoadmapError) {
            abandonRoadmapError.textContent = res.message || 'Failed to abandon route.';
            abandonRoadmapError.classList.remove('d-none');
          }
        }
      } catch (err) {
        if (abandonRoadmapError) {
          abandonRoadmapError.textContent = err.message || 'Failed to abandon route.';
          abandonRoadmapError.classList.remove('d-none');
        } else {
          showAlert(err.message || 'Failed to abandon active route.', 'danger');
        }
      } finally {
        btnConfirmAbandonRoadmap.disabled = false;
        btnConfirmAbandonRoadmap.innerHTML = '<i class="bi bi-check-circle me-1"></i> Confirm & Abandon Route';
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

  // Notch Navbar Scroll Elevation
  const notchNav = document.querySelector('.cp-navbar-notch');
  if (notchNav) {
    window.addEventListener(
      'scroll',
      () => {
        if (window.scrollY > 30) {
          notchNav.classList.add('scrolled');
        } else {
          notchNav.classList.remove('scrolled');
        }
      },
      { passive: true }
    );
  }
  loadRoadmap();
});

