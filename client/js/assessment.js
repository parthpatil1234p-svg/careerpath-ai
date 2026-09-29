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
    { id: 'app development', label: 'Mobile App Development', icon: 'bi-phone' },
    { id: 'data analysis', label: 'Data Analysis & BI', icon: 'bi-graph-up-arrow' },
    { id: 'artificial intelligence', label: 'Artificial Intelligence & ML', icon: 'bi-cpu' },
    { id: 'design', label: 'Creative Design & UI/UX', icon: 'bi-palette' },
    { id: 'cybersecurity', label: 'Cybersecurity & Defense', icon: 'bi-shield-shaded' },
    { id: 'cloud computing', label: 'Cloud Computing & DevOps', icon: 'bi-cloud' },
    { id: 'backend engineering', label: 'Backend & Distributed Systems', icon: 'bi-hdd-network' },
    { id: 'data science', label: 'Data Science & Deep Learning', icon: 'bi-clipboard-data' },
    { id: 'qa testing', label: 'QA & Test Automation', icon: 'bi-check2-circle' },
    { id: 'gaming', label: 'Game Development & 3D', icon: 'bi-controller' },
    { id: 'blockchain', label: 'Blockchain & Web3', icon: 'bi-link-45deg' },
    { id: 'cloud security', label: 'Cloud Security & DevSecOps', icon: 'bi-shield-lock' },
    { id: 'product management', label: 'Technical Product Strategy', icon: 'bi-kanban' },
    { id: 'problem solving', label: 'Problem Solving & Logic', icon: 'bi-lightbulb' },
  ];

  const FALLBACK_SKILLS = [
    // Frontend (9)
    { name: 'html', displayName: 'HTML', category: 'frontend' },
    { name: 'css', displayName: 'CSS', category: 'frontend' },
    { name: 'javascript', displayName: 'JavaScript', category: 'frontend' },
    { name: 'responsive-design', displayName: 'Responsive Design', category: 'frontend' },
    { name: 'react', displayName: 'React', category: 'frontend' },
    { name: 'bootstrap', displayName: 'Bootstrap', category: 'frontend' },
    { name: 'typescript', displayName: 'TypeScript', category: 'frontend' },
    { name: 'next.js', displayName: 'Next.js', category: 'frontend' },
    { name: 'tailwind-css', displayName: 'Tailwind CSS', category: 'frontend' },

    // Backend (10)
    { name: 'node.js', displayName: 'Node.js', category: 'backend' },
    { name: 'express.js', displayName: 'Express.js', category: 'backend' },
    { name: 'rest-apis', displayName: 'REST APIs', category: 'backend' },
    { name: 'authentication', displayName: 'Authentication', category: 'backend' },
    { name: 'python', displayName: 'Python', category: 'backend' },
    { name: 'fastapi', displayName: 'FastAPI', category: 'backend' },
    { name: 'graphql', displayName: 'GraphQL', category: 'backend' },
    { name: 'java', displayName: 'Java', category: 'backend' },
    { name: 'spring-boot', displayName: 'Spring Boot', category: 'backend' },
    { name: 'kafka', displayName: 'Apache Kafka', category: 'backend' },
    { name: 'csharp', displayName: 'C# Programming', category: 'backend' },
    { name: 'cpp', displayName: 'C++ Programming', category: 'backend' },

    // Database (6)
    { name: 'mongodb', displayName: 'MongoDB', category: 'database' },
    { name: 'sql', displayName: 'SQL', category: 'database' },
    { name: 'mysql', displayName: 'MySQL', category: 'database' },
    { name: 'database-design', displayName: 'Database Design', category: 'database' },
    { name: 'postgresql', displayName: 'PostgreSQL', category: 'database' },
    { name: 'redis', displayName: 'Redis Caching', category: 'database' },

    // Data & AI (13)
    { name: 'excel', displayName: 'Excel', category: 'data' },
    { name: 'statistics', displayName: 'Statistics', category: 'data' },
    { name: 'power-bi', displayName: 'Power BI', category: 'data' },
    { name: 'data-visualization', displayName: 'Data Visualization', category: 'data' },
    { name: 'data-cleaning', displayName: 'Data Cleaning', category: 'data' },
    { name: 'pandas', displayName: 'Pandas & NumPy', category: 'data' },
    { name: 'langchain', displayName: 'LangChain', category: 'ai' },
    { name: 'generative-ai', displayName: 'Generative AI & LLMs', category: 'ai' },
    { name: 'pytorch', displayName: 'PyTorch', category: 'ai' },
    { name: 'tensorflow', displayName: 'TensorFlow', category: 'ai' },
    { name: 'scikit-learn', displayName: 'Scikit-Learn', category: 'ai' },
    { name: 'deep-learning', displayName: 'Deep Learning', category: 'ai' },
    { name: 'natural-language-processing', displayName: 'NLP (Natural Language Processing)', category: 'ai' },

    // Design (5)
    { name: 'figma', displayName: 'Figma', category: 'design' },
    { name: 'wireframing', displayName: 'Wireframing', category: 'design' },
    { name: 'prototyping', displayName: 'Prototyping', category: 'design' },
    { name: 'user-research', displayName: 'User Research', category: 'design' },
    { name: 'visual-design', displayName: 'Visual Design', category: 'design' },

    // Security (5)
    { name: 'networking', displayName: 'Networking', category: 'security' },
    { name: 'linux', displayName: 'Linux', category: 'security' },
    { name: 'cybersecurity-fundamentals', displayName: 'Cybersecurity Fundamentals', category: 'security' },
    { name: 'ethical-hacking', displayName: 'Ethical Hacking', category: 'security' },
    { name: 'owasp-basics', displayName: 'OWASP Basics', category: 'security' },

    // Cloud & DevOps (5)
    { name: 'docker', displayName: 'Docker', category: 'cloud' },
    { name: 'kubernetes', displayName: 'Kubernetes', category: 'cloud' },
    { name: 'aws', displayName: 'AWS Cloud', category: 'cloud' },
    { name: 'terraform', displayName: 'Terraform & IaC', category: 'cloud' },
    { name: 'firebase', displayName: 'Firebase & Firestore', category: 'cloud' },

    // Mobile (3)
    { name: 'flutter', displayName: 'Flutter', category: 'mobile' },
    { name: 'react-native', displayName: 'React Native', category: 'mobile' },
    { name: 'dart', displayName: 'Dart', category: 'mobile' },

    // QA & Testing (4)
    { name: 'cypress', displayName: 'Cypress E2E Testing', category: 'testing' },
    { name: 'selenium', displayName: 'Selenium WebDriver', category: 'testing' },
    { name: 'playwright', displayName: 'Playwright Automation', category: 'testing' },
    { name: 'postman', displayName: 'Postman & API Testing', category: 'testing' },

    // Gaming (2)
    { name: 'unity', displayName: 'Unity Engine', category: 'gaming' },
    { name: 'unreal-engine', displayName: 'Unreal Engine 5', category: 'gaming' },

    // Web3 (3)
    { name: 'solidity', displayName: 'Solidity Smart Contracts', category: 'web3' },
    { name: 'web3js', displayName: 'Web3.js & Ethers.js', category: 'web3' },
    { name: 'smart-contracts', displayName: 'Smart Contract Architecture', category: 'web3' },

    // Product & Management (3)
    { name: 'agile-scrum', displayName: 'Agile & Scrum Methodology', category: 'product' },
    { name: 'product-management', displayName: 'Product Management & PRDs', category: 'product' },
    { name: 'user-stories', displayName: 'User Story Mapping & JIRA', category: 'product' },

    // Soft Skills & Tools (5)
    { name: 'git', displayName: 'Git', category: 'tool' },
    { name: 'github', displayName: 'GitHub', category: 'tool' },
    { name: 'ci-cd', displayName: 'CI/CD & GitHub Actions', category: 'tool' },
    { name: 'problem-solving', displayName: 'Problem Solving', category: 'soft-skill' },
    { name: 'communication', displayName: 'Communication', category: 'soft-skill' },
    { name: 'teamwork', displayName: 'Teamwork', category: 'soft-skill' },
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
        (currentCategoryFilter === 'data' && ['database', 'data', 'ai'].includes(skill.category)) ||
        (currentCategoryFilter === 'cloud' && ['cloud', 'tool'].includes(skill.category)) ||
        (currentCategoryFilter === 'security' && ['security'].includes(skill.category)) ||
        (currentCategoryFilter === 'frontend' && ['frontend', 'mobile'].includes(skill.category)) ||
        (currentCategoryFilter === 'backend' && ['backend', 'database'].includes(skill.category));

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
      const selectedObj = isSelected ? selectedSkillsMap.get(skill.name) : null;
      const currentProficiency = selectedObj ? selectedObj.proficiency : 'beginner';
      const isVerified = selectedObj?.isCodeVerified;
      const verifiedBadge = isVerified
        ? `<span class="badge-code-verified ms-1" title="Verified by real GitHub repo code" style="padding: 1px 4px; font-size: 0.62rem;"><i class="bi bi-github"></i></span>`
        : '';

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
              <label class="form-check-label text-truncate fw-medium d-inline-flex align-items-center gap-1" for="skill_${skill.name}" title="${skill.displayName}">
                <span class="text-truncate">${skill.displayName}</span>
                ${verifiedBadge}
              </label>
            </div>
            <select class="form-select form-select-sm skill-proficiency-select"
                    aria-label="${skill.displayName} proficiency level"
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
            category: skill.category || 'tool',
            proficiency: select.value || 'beginner',
            isCodeVerified: false,
            verifiedSource: 'self'
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
      const verifiedTag = skill.isCodeVerified
        ? `<span class="badge-code-verified ms-1" title="Verified by GitHub Repo Code" style="padding: 1px 4px; font-size: 0.62rem;"><i class="bi bi-github"></i> Verified</span>`
        : '';
      pill.innerHTML = `
        <span class="fw-semibold text-ink">${escapeHtml(skill.displayName)}</span>
        <span class="text-primary fw-bold font-mono" style="font-size: 0.68rem;">(${skill.proficiency.slice(0, 3)})</span>
        ${verifiedTag}
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

  // Hackathon Judge Demo Profile Auto-Fill Handler
  const btnJudgeDemoFill = document.getElementById('btnJudgeDemoFill');
  if (btnJudgeDemoFill) {
    btnJudgeDemoFill.addEventListener('click', () => {
      // 1. Fill Academics
      const nameInput = document.getElementById('fullName');
      const courseInput = document.getElementById('course');
      const branchInput = document.getElementById('branch');
      const yearInput = document.getElementById('year');
      const collegeInput = document.getElementById('college');

      if (nameInput) nameInput.value = 'Parth Patil';
      if (courseInput) courseInput.value = 'B.Tech Computer Science';
      if (branchInput) branchInput.value = 'Information Technology';
      if (yearInput) yearInput.value = 'Third Year';
      if (collegeInput) collegeInput.value = 'Pune Institute of Technology';

      // 2. Fill Interests
      selectedInterests.clear();
      ['web development', 'artificial intelligence', 'problem solving', 'cloud computing'].forEach((i) => {
        selectedInterests.add(i);
      });
      renderInterests();

      // 3. Fill Skills
      selectedSkillsMap.clear();
      const demoSkills = [
        { name: 'html', displayName: 'HTML', proficiency: 'intermediate' },
        { name: 'css', displayName: 'CSS', proficiency: 'intermediate' },
        { name: 'javascript', displayName: 'JavaScript', proficiency: 'advanced' },
        { name: 'react', displayName: 'React', proficiency: 'intermediate' },
        { name: 'node.js', displayName: 'Node.js', proficiency: 'intermediate' },
        { name: 'python', displayName: 'Python', proficiency: 'intermediate' },
      ];
      demoSkills.forEach((s) => selectedSkillsMap.set(s.name, s));
      renderSkillsGrid();
      updateSelectedSkillsUI();

      // 4. Fill Career Goal in Step 4
      const careerGoalsInput = document.getElementById('careerGoals');
      if (careerGoalsInput) {
        careerGoalsInput.value = 'Full-Stack Web & AI Application Developer';
      }

      showAlert('✓ Demo profile loaded successfully! You can review each step or proceed to submission.', 'success');

      // Scroll smoothly to step 1 form
      const formEl = document.getElementById('assessmentForm');
      if (formEl) formEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  // Auto-Detect Skills from GitHub Repos Handler
  const btnAutoDetectGitHubSkills = document.getElementById('btnAutoDetectGitHubSkills');
  if (btnAutoDetectGitHubSkills) {
    btnAutoDetectGitHubSkills.addEventListener('click', async () => {
      const originalText = btnAutoDetectGitHubSkills.innerHTML;
      btnAutoDetectGitHubSkills.disabled = true;
      btnAutoDetectGitHubSkills.innerHTML = `<span class="spinner-border spinner-border-sm me-1" role="status"></span> Scanning Repos...`;

      try {
        const user = window.Auth?.getUser();

        // 1. If user already has connected GitHub repos and verified skills in their profile
        if (user?.githubProfile?.username && Array.isArray(user.skills) && user.skills.some(s => s.isCodeVerified)) {
          let countAdded = 0;
          user.skills.forEach(s => {
            if (s.isCodeVerified) {
              const key = s.name.toLowerCase();
              if (!allAvailableSkills.some(item => item.name.toLowerCase() === key)) {
                allAvailableSkills.unshift({
                  name: key,
                  displayName: s.displayName || s.name,
                  category: s.category || 'backend'
                });
              }
              selectedSkillsMap.set(key, {
                name: key,
                displayName: s.displayName || s.name,
                category: s.category || 'backend',
                proficiency: s.proficiency || 'intermediate',
                isCodeVerified: true,
                verifiedSource: 'github_repo'
              });
              countAdded++;
            }
          });

          renderSkillsGrid();
          updateSelectedSkillsUI();
          showAlert(`✓ Auto-detected ${countAdded} verified skills directly from your connected GitHub (@${user.githubProfile.username}) repositories!`, 'success');
          btnAutoDetectGitHubSkills.disabled = false;
          btnAutoDetectGitHubSkills.innerHTML = `<i class="bi bi-patch-check-fill text-success"></i> <span>${countAdded} Skills Verified</span>`;
          return;
        }

        // 2. Otherwise trigger 1-Click Fast-Track GitHub modal
        if (window.GitHubAuth?.connectGitHubAccount) {
          window.GitHubAuth.connectGitHubAccount((err, data) => {
            btnAutoDetectGitHubSkills.disabled = false;
            btnAutoDetectGitHubSkills.innerHTML = originalText;

            if (err) {
              showAlert(err.message || 'GitHub scan canceled or failed.', 'danger');
              return;
            }

            const verifiedSkills = data?.verifiedSkills || [];
            let countAdded = 0;

            verifiedSkills.forEach(s => {
              const key = s.name.toLowerCase();
              if (!allAvailableSkills.some(item => item.name.toLowerCase() === key)) {
                allAvailableSkills.unshift({
                  name: key,
                  displayName: s.displayName || s.name,
                  category: s.category || 'backend'
                });
              }
              selectedSkillsMap.set(key, {
                name: key,
                displayName: s.displayName || s.name,
                category: s.category || 'backend',
                proficiency: s.proficiency || 'intermediate',
                isCodeVerified: true,
                verifiedSource: 'github_repo'
              });
              countAdded++;
            });

            renderSkillsGrid();
            updateSelectedSkillsUI();
            showAlert(`✓ Scanned @${data.profile?.username} (${data.repos?.length || 0} study repos) and auto-detected ${countAdded} verified skills!`, 'success');
            btnAutoDetectGitHubSkills.innerHTML = `<i class="bi bi-patch-check-fill text-success"></i> <span>${countAdded} Skills Verified</span>`;
          });
        } else {
          showAlert('GitHub integration script not loaded. Please refresh.', 'warning');
          btnAutoDetectGitHubSkills.disabled = false;
          btnAutoDetectGitHubSkills.innerHTML = originalText;
        }
      } catch (err) {
        console.error('GitHub auto-detect error:', err);
        showAlert(err.message || 'Failed to auto-detect skills from GitHub.', 'danger');
        btnAutoDetectGitHubSkills.disabled = false;
        btnAutoDetectGitHubSkills.innerHTML = originalText;
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
            const key = s.name.toLowerCase();
            if (!allAvailableSkills.some(item => item.name.toLowerCase() === key)) {
              allAvailableSkills.unshift({
                name: key,
                displayName: s.displayName || s.name,
                category: s.category || 'tool'
              });
            }
            selectedSkillsMap.set(key, {
              name: key,
              displayName: s.displayName || s.name,
              category: s.category || 'tool',
              proficiency: s.proficiency || 'beginner',
              isCodeVerified: !!s.isCodeVerified,
              verifiedSource: s.verifiedSource || 'self'
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
        <span class="rg-shine"><span></span></span>
        <span class="rg-bg"></span>
        <span class="rg-label">
          <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
          <span>Calculating Career Matches...</span>
        </span>
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
