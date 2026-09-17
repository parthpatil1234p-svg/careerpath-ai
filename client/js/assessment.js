/**
 * assessment.js — Student Profile & Skill Assessment Controller
 *
 * Implements:
 * - 4-step progressive wizard with validation and step navigation
 * - Preloading existing user profile via GET /api/users/me
 * - Interactive interest chip toggling
 * - Category-filtered skill picker with proficiency selects
 * - Submitting assessment payload to PUT /api/assessment
 * - Preserves all existing IDs, fields, and API contracts
 */

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Guard page
  if (!window.Auth?.isAuthenticated()) {
    window.Auth?.requireAuth();
    return;
  }

  // 2. Constants & Data
  const ALL_INTERESTS = [
    { id: 'web development', label: 'Web Development', icon: 'bi-code-slash' },
    { id: 'app development', label: 'App Development', icon: 'bi-phone' },
    { id: 'data analysis', label: 'Data Analysis', icon: 'bi-graph-up-arrow' },
    { id: 'artificial intelligence', label: 'Artificial Intelligence', icon: 'bi-cpu' },
    { id: 'design', label: 'Creative Design & UI/UX', icon: 'bi-palette' },
    { id: 'cybersecurity', label: 'Cybersecurity', icon: 'bi-shield-shaded' },
    { id: 'problem solving', label: 'Problem Solving & Logic', icon: 'bi-lightbulb' },
    { id: 'business', label: 'Business & Tech Analytics', icon: 'bi-briefcase' },
    { id: 'gaming', label: 'Game Development & 3D', icon: 'bi-controller' },
    { id: 'cloud computing', label: 'Cloud Computing & DevOps', icon: 'bi-cloud' },
  ];

  const FALLBACK_SKILLS = [
    // Frontend
    { name: 'html', displayName: 'HTML', category: 'frontend' },
    { name: 'css', displayName: 'CSS', category: 'frontend' },
    { name: 'javascript', displayName: 'JavaScript', category: 'frontend' },
    { name: 'responsive-design', displayName: 'Responsive Design', category: 'frontend' },
    { name: 'react', displayName: 'React', category: 'frontend' },
    { name: 'bootstrap', displayName: 'Bootstrap', category: 'frontend' },
    // Backend
    { name: 'node.js', displayName: 'Node.js', category: 'backend' },
    { name: 'express.js', displayName: 'Express.js', category: 'backend' },
    { name: 'rest-apis', displayName: 'REST APIs', category: 'backend' },
    { name: 'authentication', displayName: 'Authentication', category: 'backend' },
    { name: 'python', displayName: 'Python', category: 'backend' },
    // Database
    { name: 'mongodb', displayName: 'MongoDB', category: 'database' },
    { name: 'sql', displayName: 'SQL', category: 'database' },
    { name: 'mysql', displayName: 'MySQL', category: 'database' },
    { name: 'database-design', displayName: 'Database Design', category: 'database' },
    // Data
    { name: 'excel', displayName: 'Excel', category: 'data' },
    { name: 'statistics', displayName: 'Statistics', category: 'data' },
    { name: 'power-bi', displayName: 'Power BI', category: 'data' },
    { name: 'data-visualization', displayName: 'Data Visualization', category: 'data' },
    { name: 'data-cleaning', displayName: 'Data Cleaning', category: 'data' },
    // Design
    { name: 'figma', displayName: 'Figma', category: 'design' },
    { name: 'wireframing', displayName: 'Wireframing', category: 'design' },
    { name: 'prototyping', displayName: 'Prototyping', category: 'design' },
    { name: 'user-research', displayName: 'User Research', category: 'design' },
    { name: 'visual-design', displayName: 'Visual Design', category: 'design' },
    // Security
    { name: 'networking', displayName: 'Networking', category: 'security' },
    { name: 'linux', displayName: 'Linux', category: 'security' },
    { name: 'cybersecurity-fundamentals', displayName: 'Cybersecurity Fundamentals', category: 'security' },
    { name: 'ethical-hacking', displayName: 'Ethical Hacking', category: 'security' },
    { name: 'owasp-basics', displayName: 'OWASP Basics', category: 'security' },
    // Soft & Tool
    { name: 'git', displayName: 'Git', category: 'tool' },
    { name: 'github', displayName: 'GitHub', category: 'tool' },
    { name: 'problem-solving', displayName: 'Problem Solving', category: 'soft-skill' },
    { name: 'communication', displayName: 'Communication', category: 'soft-skill' },
    { name: 'teamwork', displayName: 'Teamwork', category: 'soft-skill' },
    // Modern & Trending Skills
    { name: 'typescript', displayName: 'TypeScript', category: 'frontend' },
    { name: 'next.js', displayName: 'Next.js', category: 'frontend' },
    { name: 'tailwind-css', displayName: 'Tailwind CSS', category: 'frontend' },
    { name: 'flutter', displayName: 'Flutter', category: 'frontend' },
    { name: 'fastapi', displayName: 'FastAPI', category: 'backend' },
    { name: 'graphql', displayName: 'GraphQL', category: 'backend' },
    { name: 'docker', displayName: 'Docker', category: 'cloud' },
    { name: 'kubernetes', displayName: 'Kubernetes', category: 'cloud' },
    { name: 'aws', displayName: 'AWS Cloud', category: 'cloud' },
    { name: 'langchain', displayName: 'LangChain', category: 'data' },
    { name: 'generative-ai', displayName: 'Generative AI & LLMs', category: 'data' },
    { name: 'pytorch', displayName: 'PyTorch', category: 'data' },
  ];

  // 3. State
  let allAvailableSkills = [...FALLBACK_SKILLS];
  const selectedInterests = new Set();
  const selectedSkillsMap = new Map(); // key: skillName, value: { name, displayName, proficiency }
  let currentStep = 1;

  // 4. DOM Elements
  const alertContainer = document.getElementById('alertContainer');
  const interestChipsWrapper = document.getElementById('interestChipsWrapper');
  const interestCount = document.getElementById('interestCount');
  const skillsGrid = document.getElementById('skillsGrid');
  const skillSearchInput = document.getElementById('skillSearchInput');
  const skillCategoryFilter = document.getElementById('skillCategoryFilter');
  const selectedSkillsSummary = document.getElementById('selectedSkillsSummary');
  const selectedSkillsCount = document.getElementById('selectedSkillsCount');
  const clearAllSkillsBtn = document.getElementById('clearAllSkillsBtn');
  const form = document.getElementById('assessmentForm');
  const submitBtn = document.getElementById('submitAssessmentBtn');

  // Step Wizard Elements
  const stepPanels = [
    document.getElementById('stepPanel1'),
    document.getElementById('stepPanel2'),
    document.getElementById('stepPanel3'),
    document.getElementById('stepPanel4'),
  ];
  const desktopNavItems = [
    document.getElementById('navStep1'),
    document.getElementById('navStep2'),
    document.getElementById('navStep3'),
    document.getElementById('navStep4'),
  ];
  const mobileStepLabel = document.getElementById('mobileStepLabel');
  const mobileStepPercent = document.getElementById('mobileStepPercent');
  const mobileProgressBar = document.getElementById('mobileProgressBar');

  let currentCategoryFilter = 'all';
  let currentSearchQuery = '';

  const showAlert = (message, type = 'danger') => {
    if (!alertContainer) return;
    alertContainer.innerHTML = `
      <div class="alert alert-${type} alert-dismissible fade show d-flex align-items-center gap-2 py-3 px-4 shadow-sm mb-4" role="alert">
        <i class="bi ${type === 'danger' ? 'bi-exclamation-triangle-fill' : 'bi-check-circle-fill'} fs-5"></i>
        <div class="small">${escapeHtml(message)}</div>
        <button type="button" class="btn-close ms-auto" data-bs-dismiss="alert" aria-label="Close"></button>
      </div>
    `;
    window.scrollTo({ top: 120, behavior: 'smooth' });
  };

  // 5. Step Navigation System
  const STEP_TITLES = [
    'Academic Background',
    'Domains of Interest',
    'Skills & Proficiency',
    'Career Aspirations',
  ];

  const updateStepUI = (targetStep) => {
    currentStep = targetStep;

    // Show active panel
    stepPanels.forEach((panel, idx) => {
      if (panel) {
        panel.classList.toggle('active', idx + 1 === currentStep);
      }
    });

    // Update desktop stepper
    desktopNavItems.forEach((item, idx) => {
      if (item) {
        item.classList.toggle('active', idx + 1 === currentStep);
        if (idx + 1 < currentStep) {
          item.classList.add('completed');
        } else {
          item.classList.remove('completed');
        }
      }
    });

    // Update mobile progress bar
    if (mobileStepLabel) {
      mobileStepLabel.textContent = `Step ${currentStep} of 4: ${STEP_TITLES[currentStep - 1]}`;
    }
    const pct = currentStep * 25;
    if (mobileStepPercent) mobileStepPercent.textContent = `${pct}%`;
    if (mobileProgressBar) {
      mobileProgressBar.style.width = `${pct}%`;
      mobileProgressBar.setAttribute('aria-valuenow', pct);
    }

    window.scrollTo({ top: 140, behavior: 'smooth' });
  };

  const validateStep = (step) => {
    if (alertContainer) alertContainer.innerHTML = '';
    if (step === 1) {
      const fullName = document.getElementById('fullName').value.trim();
      const course = document.getElementById('course').value.trim();
      if (!fullName) {
        showAlert('Please enter your full name.');
        return false;
      }
      if (!course) {
        showAlert('Please enter your degree or course (e.g. BCA, B.Tech, B.Sc Computer Science).');
        return false;
      }
      return true;
    }
    if (step === 2) {
      if (selectedInterests.size === 0) {
        showAlert('Please select at least 1 domain of interest before proceeding.');
        return false;
      }
      return true;
    }
    if (step === 3) {
      if (selectedSkillsMap.size === 0) {
        showAlert('Please select at least 1 skill you possess before proceeding.');
        return false;
      }
      return true;
    }
    return true;
  };

  // Wire Step Buttons
  document.getElementById('step1ContinueBtn')?.addEventListener('click', () => {
    if (validateStep(1)) updateStepUI(2);
  });

  document.getElementById('step2BackBtn')?.addEventListener('click', () => {
    updateStepUI(1);
  });
  document.getElementById('step2ContinueBtn')?.addEventListener('click', () => {
    if (validateStep(2)) updateStepUI(3);
  });

  document.getElementById('step3BackBtn')?.addEventListener('click', () => {
    updateStepUI(2);
  });
  document.getElementById('step3ContinueBtn')?.addEventListener('click', () => {
    if (validateStep(3)) updateStepUI(4);
  });

  document.getElementById('step4BackBtn')?.addEventListener('click', () => {
    updateStepUI(3);
  });

  // Allow clicking desktop stepper items if prior steps are valid
  desktopNavItems.forEach((item, idx) => {
    item?.addEventListener('click', () => {
      const target = idx + 1;
      if (target <= currentStep) {
        updateStepUI(target);
      } else {
        // Validate intermediate steps
        for (let s = currentStep; s < target; s++) {
          if (!validateStep(s)) return;
        }
        updateStepUI(target);
      }
    });
  });

  // 6. Render Interest Chips
  const renderInterests = () => {
    if (!interestChipsWrapper) return;
    interestChipsWrapper.innerHTML = '';

    ALL_INTERESTS.forEach((interest) => {
      const isSelected = selectedInterests.has(interest.id);
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = `interest-chip ${isSelected ? 'selected' : ''}`;
      chip.innerHTML = `
        <i class="bi ${interest.icon}"></i>
        <span>${interest.label}</span>
      `;

      chip.addEventListener('click', () => {
        if (selectedInterests.has(interest.id)) {
          selectedInterests.delete(interest.id);
        } else {
          if (selectedInterests.size >= 10) {
            showAlert('You can select a maximum of 10 interests.', 'warning');
            return;
          }
          selectedInterests.add(interest.id);
        }
        renderInterests();
      });

      interestChipsWrapper.appendChild(chip);
    });

    if (interestCount) {
      interestCount.textContent = selectedInterests.size;
    }
  };

  // 7. Render Available Skills Grid
  const renderSkillsGrid = () => {
    if (!skillsGrid) return;
    skillsGrid.innerHTML = '';

    const filtered = allAvailableSkills.filter((skill) => {
      const matchesCategory =
        currentCategoryFilter === 'all' ||
        skill.category === currentCategoryFilter ||
        (currentCategoryFilter === 'data' && ['database', 'data'].includes(skill.category));

      const matchesSearch =
        !currentSearchQuery ||
        skill.displayName.toLowerCase().includes(currentSearchQuery) ||
        skill.name.toLowerCase().includes(currentSearchQuery);

      return matchesCategory && matchesSearch;
    });

    if (filtered.length === 0) {
      skillsGrid.innerHTML = `
        <div class="col-12 text-center py-4 text-muted small">
          <i class="bi bi-search me-1"></i> No matching skills found for "${escapeHtml(currentSearchQuery)}".
        </div>
      `;
      return;
    }

    filtered.forEach((skill) => {
      const isSelected = selectedSkillsMap.has(skill.name);
      const currentProficiency = isSelected ? selectedSkillsMap.get(skill.name).proficiency : 'beginner';

      const col = document.createElement('div');
      col.className = 'col-sm-6 col-md-4';
      col.innerHTML = `
        <div class="skill-picker-card ${isSelected ? 'active-skill' : ''}">
          <div class="d-flex align-items-center justify-content-between gap-2">
            <div class="form-check m-0 flex-grow-1 text-truncate">
              <input
                class="form-check-input skill-checkbox"
                type="checkbox"
                id="skill_${skill.name}"
                ${isSelected ? 'checked' : ''}
              />
              <label class="form-check-label text-truncate fw-medium" for="skill_${skill.name}" title="${skill.displayName}">
                ${skill.displayName}
              </label>
            </div>
            <select class="form-select form-select-sm skill-proficiency-select py-0 px-2"
                    style="width: 105px; font-size: 0.75rem; height: 26px;"
                    ${!isSelected ? 'disabled' : ''}>
              <option value="beginner" ${currentProficiency === 'beginner' ? 'selected' : ''}>Beginner</option>
              <option value="intermediate" ${currentProficiency === 'intermediate' ? 'selected' : ''}>Intermediate</option>
              <option value="advanced" ${currentProficiency === 'advanced' ? 'selected' : ''}>Advanced</option>
            </select>
          </div>
        </div>
      `;

      const checkbox = col.querySelector('.skill-checkbox');
      const select = col.querySelector('.skill-proficiency-select');

      checkbox.addEventListener('change', (e) => {
        if (e.target.checked) {
          if (selectedSkillsMap.size >= 20) {
            e.target.checked = false;
            showAlert('You can select a maximum of 20 skills for assessment.', 'warning');
            return;
          }
          selectedSkillsMap.set(skill.name, {
            name: skill.name,
            displayName: skill.displayName,
            proficiency: select.value || 'beginner',
          });
          select.disabled = false;
        } else {
          selectedSkillsMap.delete(skill.name);
          select.disabled = true;
        }
        updateSelectedSkillsUI();
        renderSkillsGrid();
      });

      select.addEventListener('change', (e) => {
        if (selectedSkillsMap.has(skill.name)) {
          selectedSkillsMap.get(skill.name).proficiency = e.target.value;
          updateSelectedSkillsUI();
        }
      });

      skillsGrid.appendChild(col);
    });
  };

  // 8. Update Selected Skills Summary Box
  const updateSelectedSkillsUI = () => {
    if (selectedSkillsCount) {
      selectedSkillsCount.textContent = selectedSkillsMap.size;
    }

    if (!selectedSkillsSummary) return;

    if (selectedSkillsMap.size === 0) {
      selectedSkillsSummary.innerHTML = `
        <span class="text-muted small fst-italic">No skills selected yet. Click any skill above to add it.</span>
      `;
      return;
    }

    selectedSkillsSummary.innerHTML = '';
    selectedSkillsMap.forEach((skill) => {
      const pill = document.createElement('span');
      pill.className = 'badge badge-navy border d-inline-flex align-items-center gap-1 py-1 px-2 small';
      pill.innerHTML = `
        <span class="text-white">${escapeHtml(skill.displayName)}</span>
        <span class="text-teal fw-bold font-mono" style="font-size: 0.68rem;">(${skill.proficiency.slice(0, 3)})</span>
        <i class="bi bi-x ms-1 cursor-pointer" title="Remove" style="cursor: pointer;"></i>
      `;

      pill.querySelector('.bi-x').addEventListener('click', () => {
        selectedSkillsMap.delete(skill.name);
        updateSelectedSkillsUI();
        renderSkillsGrid();
      });

      selectedSkillsSummary.appendChild(pill);
    });
  };

  // 9. Filters & Search Handlers
  if (skillCategoryFilter) {
    skillCategoryFilter.querySelectorAll('button').forEach((btn) => {
      btn.addEventListener('click', () => {
        skillCategoryFilter.querySelectorAll('button').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        currentCategoryFilter = btn.getAttribute('data-cat') || 'all';
        renderSkillsGrid();
      });
    });
  }

  if (skillSearchInput) {
    skillSearchInput.addEventListener('input', (e) => {
      currentSearchQuery = e.target.value.trim().toLowerCase();
      renderSkillsGrid();
    });
  }

  if (clearAllSkillsBtn) {
    clearAllSkillsBtn.addEventListener('click', () => {
      selectedSkillsMap.clear();
      updateSelectedSkillsUI();
      renderSkillsGrid();
    });
  }

  // Custom Skill Addition Handler
  const customSkillNameInput = document.getElementById('customSkillName');
  const customSkillCategorySelect = document.getElementById('customSkillCategory');
  const customSkillProficiencySelect = document.getElementById('customSkillProficiency');
  const btnAddCustomSkill = document.getElementById('btnAddCustomSkill');
  const customSkillFeedback = document.getElementById('customSkillFeedback');

  if (btnAddCustomSkill && customSkillNameInput) {
    const handleAddCustomSkill = async () => {
      const rawName = customSkillNameInput.value.trim();
      if (!rawName) {
        if (customSkillFeedback) {
          customSkillFeedback.className = 'small mt-2 text-danger';
          customSkillFeedback.textContent = 'Please enter a skill name (e.g. Rust, Solidity, Blender).';
          customSkillFeedback.classList.remove('d-none');
        }
        return;
      }

      if (selectedSkillsMap.size >= 20) {
        showAlert('You can select a maximum of 20 skills for assessment.', 'warning');
        return;
      }

      const cleanSlug = rawName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const category = customSkillCategorySelect?.value || 'other';
      const proficiency = customSkillProficiencySelect?.value || 'intermediate';

      // Ensure skill is registered in available list
      let existing = allAvailableSkills.find((s) => s.name === cleanSlug);
      if (!existing) {
        existing = {
          name: cleanSlug,
          displayName: rawName,
          category: category,
          isCustom: true,
        };
        allAvailableSkills.unshift(existing);
      }

      // Add to selected map
      selectedSkillsMap.set(cleanSlug, {
        name: cleanSlug,
        displayName: rawName,
        proficiency: proficiency,
      });

      // Register with backend catalog in background
      try {
        window.API.post('/skills/custom', {
          name: cleanSlug,
          displayName: rawName,
          category: category,
        }, { auth: true }).catch(() => {});
      } catch (_) {}

      // Reset input & provide quick visual confirmation
      customSkillNameInput.value = '';
      if (customSkillFeedback) {
        customSkillFeedback.className = 'small mt-2 text-teal';
        customSkillFeedback.textContent = `✓ "${rawName}" added to your skills!`;
        customSkillFeedback.classList.remove('d-none');
        setTimeout(() => {
          customSkillFeedback.classList.add('d-none');
        }, 3500);
      }

      renderSkillsGrid();
      updateSelectedSkillsUI();
    };

    btnAddCustomSkill.addEventListener('click', handleAddCustomSkill);
    customSkillNameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleAddCustomSkill();
      }
    });
  }

  // Load Remote Skills from Catalog
  const loadRemoteSkills = async () => {
    try {
      const res = await window.API.get('/skills');
      if (res.success && Array.isArray(res.data?.skills) && res.data.skills.length > 0) {
        const map = new Map();
        FALLBACK_SKILLS.forEach((s) => map.set(s.name, s));
        res.data.skills.forEach((s) => map.set(s.name, {
          name: s.name,
          displayName: s.displayName,
          category: s.category,
        }));
        allAvailableSkills = Array.from(map.values());
      }
    } catch (err) {
      console.warn('Using local fallback skills catalog:', err.message);
    }
  };

  // 10. Preload Profile Data
  const preloadProfile = async () => {
    await loadRemoteSkills();
    try {
      const response = await window.API.get('/users/me', { auth: true });
      if (response.success && response.data?.user) {
        const user = response.data.user;

        if (user.name) document.getElementById('fullName').value = user.name;
        if (user.education) {
          if (user.education.course) document.getElementById('course').value = user.education.course;
          if (user.education.branch) document.getElementById('branch').value = user.education.branch;
          if (user.education.year) document.getElementById('year').value = user.education.year;
          if (user.education.college) document.getElementById('college').value = user.education.college;
        }

        if (Array.isArray(user.interests)) {
          user.interests.forEach((i) => selectedInterests.add(String(i).toLowerCase()));
        }

        if (Array.isArray(user.skills)) {
          user.skills.forEach((s) => {
            selectedSkillsMap.set(s.name.toLowerCase(), {
              name: s.name.toLowerCase(),
              displayName: s.displayName || s.name,
              proficiency: s.proficiency || 'beginner',
            });
          });
        }

        if (Array.isArray(user.careerGoals) && user.careerGoals.length > 0) {
          document.getElementById('careerGoals').value = user.careerGoals[0] || '';
        }
      }
    } catch (err) {
      console.warn('Could not preload existing profile:', err.message);
    }

    renderInterests();
    renderSkillsGrid();
    updateSelectedSkillsUI();
    updateStepUI(1);
  };

  // 11. Form Submission
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (alertContainer) alertContainer.innerHTML = '';

    const originalBtnHtml = submitBtn ? submitBtn.innerHTML : '';
    const resetSubmitBtn = () => {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnHtml;
      }
    };

    const fullName = document.getElementById('fullName').value.trim();
    const course = document.getElementById('course').value.trim();
    const branch = document.getElementById('branch').value.trim();
    const year = document.getElementById('year').value;
    const college = document.getElementById('college').value.trim();
    const goalText = document.getElementById('careerGoals').value.trim();

    if (!fullName) {
      updateStepUI(1);
      showAlert('Full Name is required.');
      return;
    }

    if (!course) {
      updateStepUI(1);
      showAlert('Degree or Course is required.');
      return;
    }

    if (selectedInterests.size === 0) {
      updateStepUI(2);
      showAlert('Please select at least 1 domain of interest.');
      return;
    }

    if (selectedSkillsMap.size === 0) {
      updateStepUI(3);
      showAlert('Please select at least 1 skill you possess.');
      return;
    }

    const payload = {
      name: fullName,
      education: {
        course,
        branch,
        year,
        college,
      },
      interests: Array.from(selectedInterests),
      skills: Array.from(selectedSkillsMap.values()),
      careerGoals: goalText ? [goalText] : [],
    };

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `
        <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
        <span>Calculating Career Matches...</span>
      `;
    }

    try {
      const response = await window.API.put('/assessment', payload, { auth: true });

      if (response.success) {
        if (response.data?.user) {
          window.Auth.setCurrentUser(response.data.user);
        }

        showAlert('Assessment saved! Directing you to your recommendations...', 'success');
        resetSubmitBtn();

        setTimeout(() => {
          window.location.href = 'recommendations.html';
        }, 600);
      } else {
        showAlert(response.message || 'Failed to submit assessment.');
        resetSubmitBtn();
      }
    } catch (err) {
      resetSubmitBtn();

      if (err.errors && Array.isArray(err.errors) && err.errors.length > 0) {
        const errorMsg = err.errors.map((e) => e.message).join('; ');
        showAlert(errorMsg);
      } else {
        showAlert(err.message || 'Error saving assessment. Please try again.');
      }
    }
  });

  // Initial load
  preloadProfile();
});
