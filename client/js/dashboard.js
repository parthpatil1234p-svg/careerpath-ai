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
    userAvatar.textContent = nameStr.charAt(0).toUpperCase();
    userEmail.textContent = user?.email || '';

    const degreeName = user?.education?.degree ? `${user.education.degree}` : 'Degree not specified';
    userDegree.innerHTML = `<i class="bi bi-mortarboard-fill text-warning me-1"></i> ${escapeHtml(degreeName)}`;

    const skillCount = user?.skills?.length || 0;
    userSkillsCount.innerHTML = `<i class="bi bi-tools text-info me-1"></i> ${skillCount} Skills Logged`;

    // Render Skills Matrix Card
    renderSkillsMatrix(user?.skills || []);

    // Active Roadmap & 3D Progress Orb
    if (activeRoadmap) {
      activeCareerTitle.textContent = activeRoadmap.career?.title || 'Selected Career';
      activeCareerDesc.textContent =
        activeRoadmap.career?.shortDescription ||
        'Personalized roadmap generated to close your skill gaps.';
      activeRoadmapPace.textContent = `${activeRoadmap.durationWeeks} Weeks`;

      const pct = Math.round(activeRoadmap.progressPercentage || 0);
      statPercentage.textContent = `${pct}%`;
      statTasks.textContent = `${activeRoadmap.completedTasksCount || 0} / ${activeRoadmap.totalTasksCount || 0}`;

      // Estimated hours remaining (estimate 2 hours per incomplete task)
      const remainingTasks = (activeRoadmap.totalTasksCount || 0) - (activeRoadmap.completedTasksCount || 0);
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
            ? `<a href="${escapeHtml(task.resource.url)}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-outline-secondary py-0 px-2 ms-2" style="font-size: 0.72rem; border-radius: var(--radius-sm);">
                <i class="bi bi-box-arrow-up-right me-1"></i>${escapeHtml(task.resource.type || 'Resource')}
               </a>`
            : '';

          return `
            <div class="dashboard-task-item d-flex align-items-center justify-content-between gap-3 ${task.completed ? 'is-completed' : ''}" data-task-id="${task._id}">
              <div class="d-flex align-items-center gap-3">
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
                  <div class="d-flex align-items-center gap-2 mt-1">
                    <span class="badge badge-type-${task.type} text-uppercase font-monospace" style="font-size: 0.62rem;">
                      ${escapeHtml(task.type)}
                    </span>
                    <span class="badge badge-priority-${task.priority}" style="font-size: 0.62rem;">
                      ${escapeHtml(task.priority)}
                    </span>
                    <span class="text-secondary" style="font-size: 0.72rem; font-family: var(--font-mono);">
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
      let badgeClass = 'bg-secondary text-white';
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

      return `
        <div class="d-inline-flex align-items-center gap-2 px-3 py-2 rounded-2 stat-box-atlas border border-line">
          <i class="bi ${icon} small"></i>
          <span class="fw-semibold text-white small">${escapeHtml(s.displayName || s.name)}</span>
          <span class="badge ${badgeClass} text-uppercase font-monospace" style="font-size: 0.68rem; letter-spacing: 0.5px;">
            ${escapeHtml(prof)}
          </span>
        </div>
      `;
    }).join('');
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
            <span class="fw-semibold text-white small">${escapeHtml(s.displayName || s.name)}</span>
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
