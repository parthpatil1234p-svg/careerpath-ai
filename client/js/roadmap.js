/**
 * roadmap.js — Active Roadmap Controller & Task Tracker
 *
 * Interacts with:
 * - GET   /api/roadmaps/current
 * - PATCH /api/roadmaps/tasks/:taskId/toggle
 * - window.initRoadmapPath() for 3D milestone visualization
 */

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Guard check
  if (!window.Auth?.isAuthenticated()) {
    window.Auth?.requireAuth();
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

  // 3. Fetch active roadmap
  const loadRoadmap = async () => {
    try {
      const res = await window.API.get('/roadmaps/current', { auth: true });

      loadingState.classList.add('d-none');

      if (res.success && res.data?.roadmap) {
        currentRoadmap = res.data.roadmap;
        currentTasks = res.data.tasks || [];
        renderRoadmap();
      } else {
        emptyState.classList.remove('d-none');
      }
    } catch (err) {
      loadingState.classList.add('d-none');
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

    if (durationBadgeEl) durationBadgeEl.textContent = `${currentRoadmap.durationWeeks} Weeks`;
    if (paceBadgeEl) {
      paceBadgeEl.textContent =
        currentRoadmap.durationWeeks === 4
          ? 'Fast-track Pace'
          : currentRoadmap.durationWeeks === 12
          ? 'Deep Dive Pace'
          : 'Balanced Pace';
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

    Object.keys(weekMap).forEach((wNum) => {
      const weekNumber = parseInt(wNum, 10);
      const tasks = weekMap[weekNumber];
      const completedCount = tasks.filter((t) => t.completed).length;
      const isCompleted = tasks.length > 0 && completedCount === tasks.length;
      const milestone = weeklyMilestones.find((m) => m.weekNumber === weekNumber);
      const isActive = milestone?.isActive;

      const weekCard = document.createElement('div');
      weekCard.className = `week-card card p-4 mb-4 ${isActive ? 'active-week' : ''} ${isCompleted ? 'completed-week' : ''}`;
      weekCard.id = `week-card-${weekNumber}`;

      weekCard.innerHTML = `
        <div class="d-flex flex-column flex-md-row align-items-md-center justify-content-between mb-3 pb-3 border-bottom gap-2">
          <div class="d-flex align-items-center gap-3">
            <div class="week-badge-pill">
              ${isCompleted ? '<i class="bi bi-check2"></i>' : weekNumber}
            </div>
            <div>
              <div class="d-flex align-items-center gap-2">
                <h3 class="h5 fw-bold text-white mb-0">Week ${weekNumber}</h3>
                ${isActive ? '<span class="badge badge-teal">Current Focus</span>' : ''}
                ${isCompleted ? '<span class="badge badge-matched">Completed</span>' : ''}
              </div>
              <p class="text-muted small mb-0">
                ${tasks[0]?.skill ? `Mastering skill: <strong class="text-teal">${escapeHtml(tasks[0].skill.displayName || tasks[0].skill.name)}</strong>` : 'Core Career Competencies'}
              </p>
            </div>
          </div>
          <div class="text-md-end text-muted small">
            <span class="fw-bold text-white">${completedCount} of ${tasks.length}</span> tasks finished
          </div>
        </div>

        <!-- Tasks List -->
        <div class="tasks-list d-flex flex-column gap-3" id="week-tasks-${weekNumber}">
          ${tasks
            .map((task) => {
              const resourceBadge = task.resource?.url
                ? `<a href="${escapeHtml(task.resource.url)}" target="_blank" rel="noopener noreferrer" class="resource-link-btn" title="${escapeHtml(task.resource.title)}">
                    <i class="bi bi-box-arrow-up-right me-1"></i>${escapeHtml(task.resource.type || 'Resource')}
                   </a>`
                : '';

              return `
                <div class="task-item d-flex align-items-start gap-3 ${task.completed ? 'is-completed' : ''}" data-task-id="${task._id}">
                  <div class="task-checkbox-wrap pt-1">
                    <input
                      type="checkbox"
                      class="form-check-input task-checkbox-input"
                      ${task.completed ? 'checked' : ''}
                      data-task-id="${task._id}"
                    />
                  </div>
                  <div class="flex-grow-1">
                    <div class="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-1">
                      <h4 class="h6 fw-semibold text-white mb-0 task-title">
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

            updateProgressUI(roadmap.progressPercentage, roadmap.completedTasksCount, roadmap.totalTasksCount);

            // Update week card completed state
            const parentWeekCard = taskItem.closest('.week-card');
            if (parentWeekCard) {
              const weekCheckboxes = parentWeekCard.querySelectorAll('.task-checkbox-input');
              const allChecked = Array.from(weekCheckboxes).every((cb) => cb.checked);
              parentWeekCard.classList.toggle('completed-week', allChecked);
              const pill = parentWeekCard.querySelector('.week-badge-pill');
              if (pill) {
                const wNum = parentWeekCard.id.replace('week-card-', '');
                pill.innerHTML = allChecked ? '<i class="bi bi-check2"></i>' : wNum;
              }
            }

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

  loadRoadmap();
});
