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
  const selectedSkillsMap = new Map(); // key: skillName, value: { name, displayName, proficiency, ... }
  let currentStep = 1;
  let hasCompletedSkillVerification = false; // Ensures quiz gate is only required once per account

  // Reality Check Quiz Constants
  const AVAILABLE_QUIZ_SKILLS = ['javascript', 'python', 'sql', 'react', 'node.js', 'html', 'css'];
  const SKILL_ALIASES = {
    'nodejs': 'node.js',
    'node': 'node.js',
    'reactjs': 'react',
    'react.js': 'react',
    'html5': 'html',
    'css3': 'css',
    'js': 'javascript',
    'py': 'python'
  };
  const normalizeSkillSlug = (raw) => {
    const s = String(raw || '').trim().toLowerCase();
    return SKILL_ALIASES[s] || s;
  };
  const capitalize = (str) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  const INTEREST_SKILL_AFFINITY = {
    'web development': ['javascript', 'html', 'css', 'react', 'node.js'],
    'backend engineering': ['node.js', 'python', 'sql'],
    'data analysis': ['python', 'sql'],
    'data science': ['python', 'sql'],
    'artificial intelligence': ['python'],
    'problem solving': ['javascript', 'python', 'sql'],
    'app development': ['react', 'javascript'],
    'cloud computing': ['node.js', 'python'],
    'cloud security': ['python', 'sql'],
    'qa testing': ['javascript', 'python'],
    'design': ['html', 'css']
  };

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

  // Prove Your Skills Panel Elements
  const proveSkillsPanel = document.getElementById('proveSkillsPanel');
  const proveSkillsSubtitle = document.getElementById('proveSkillsSubtitle');
  const proveSkillsBadge = document.getElementById('proveSkillsBadge');
  const proveSkillsBadgeText = document.getElementById('proveSkillsBadgeText');
  const proveSkillsList = document.getElementById('proveSkillsList');
  const proveSkillsProgressFill = document.getElementById('proveSkillsProgressFill');
  const step3ContinueBtn = document.getElementById('step3ContinueBtn');

  // Skill Check Modal Elements
  const skillCheckModalEl = document.getElementById('skillCheckModal');
  const modalSkillBadge = document.getElementById('modalSkillBadge');
  const modalProviderBadge = document.getElementById('modalProviderBadge');
  const skillCheckModalTitle = document.getElementById('skillCheckModalTitle');
  const modalDifficultyPill = document.getElementById('modalDifficultyPill');
  const modalLoadingState = document.getElementById('modalLoadingState');
  const modalQuestionState = document.getElementById('modalQuestionState');
  const modalVerdictState = document.getElementById('modalVerdictState');
  const modalStepText = document.getElementById('modalStepText');
  const modalStepper = document.getElementById('modalStepper');
  const modalQuestionPrompt = document.getElementById('modalQuestionPrompt');
  const modalCodeSnippet = document.getElementById('modalCodeSnippet');
  const modalOptionsList = document.getElementById('modalOptionsList');
  const modalFeedbackBox = document.getElementById('modalFeedbackBox');
  const modalFeedbackIcon = document.getElementById('modalFeedbackIcon');
  const modalFeedbackHeadline = document.getElementById('modalFeedbackHeadline');
  const modalFeedbackText = document.getElementById('modalFeedbackText');
  const modalSubmitBtn = document.getElementById('modalSubmitBtn');
  const modalNextBtn = document.getElementById('modalNextBtn');
  const modalVerdictSelfClaimed = document.getElementById('modalVerdictSelfClaimed');
  const modalVerdictVerifiedLevel = document.getElementById('modalVerdictVerifiedLevel');
  const modalVerdictExplanation = document.getElementById('modalVerdictExplanation');
  const modalVerdictGapsWrap = document.getElementById('modalVerdictGapsWrap');
  const modalVerdictGaps = document.getElementById('modalVerdictGaps');
  const modalVerdictDoneBtn = document.getElementById('modalVerdictDoneBtn');

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
      // If account already completed one-time skill verification, never block again!
      if (hasCompletedSkillVerification) {
        return true;
      }
      const required = getRequiredVerificationSkills();
      const verifiedCount = required.filter(s => s.isQuizVerified || s.isCodeVerified).length;
      if (verifiedCount < required.length) {
        showAlert(`Please verify the remaining ${required.length - verifiedCount} skill(s) in the "Prove your skills" panel below to continue.`, 'warning');
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
      const isCodeVerified = selectedObj?.isCodeVerified;
      const isQuizVerified = selectedObj?.isQuizVerified;

      let verifiedBadge = '';
      if (isQuizVerified) {
        verifiedBadge = `<span class="badge bg-success-subtle text-success border border-success ms-1" title="Verified by Reality Check Quiz" style="padding: 1px 5px; font-size: 0.62rem;"><i class="bi bi-patch-check-fill me-1"></i>Verified (${capitalize(selectedObj.verifiedProficiency || selectedObj.proficiency)})</span>`;
      } else if (isCodeVerified) {
        verifiedBadge = `<span class="badge-code-verified ms-1" title="Verified by real GitHub repo code" style="padding: 1px 4px; font-size: 0.62rem;"><i class="bi bi-github"></i></span>`;
      }

      const col = document.createElement('div');
      col.className = 'col-12 col-lg-6';
      col.innerHTML = `
        <div class="skill-picker-card ${isSelected ? 'active-skill' : ''}">
          <div class="d-flex align-items-center justify-content-between gap-3 w-100">
            <div class="form-check m-0 flex-grow-1 d-flex align-items-center gap-2" style="min-width: 0;">
              <input
                class="form-check-input skill-checkbox flex-shrink-0"
                type="checkbox"
                id="skill_${skill.name}"
                ${isSelected ? 'checked' : ''}
              />
              <label class="form-check-label fw-semibold text-ink m-0 d-inline-flex align-items-center gap-1.5" for="skill_${skill.name}" title="${skill.displayName}" style="min-width: 0; cursor: pointer;">
                <span class="skill-name-text">${skill.displayName}</span>
                ${verifiedBadge}
              </label>
            </div>
            <select class="form-select form-select-sm skill-proficiency-select flex-shrink-0"
                    aria-label="${skill.displayName} proficiency level"
                    ${!isSelected || isQuizVerified ? 'disabled' : ''}
                    title="${isQuizVerified ? 'Proficiency calibrated by Reality Check quiz (locked)' : ''}">
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
          const existingUserSkill = (currentUser?.skills || []).find(
            (s) => (s.name || '').toLowerCase() === skill.name.toLowerCase()
          );
          const isQuizVer = Boolean(existingUserSkill?.isQuizVerified);
          const profVal = existingUserSkill?.verifiedProficiency || existingUserSkill?.proficiency || select.value || 'beginner';

          selectedSkillsMap.set(skill.name, {
            name: skill.name,
            displayName: skill.displayName,
            category: skill.category || 'tool',
            proficiency: profVal,
            selfRatedProficiency: existingUserSkill?.selfRatedProficiency || select.value || 'beginner',
            verifiedProficiency: existingUserSkill?.verifiedProficiency || null,
            isQuizVerified: isQuizVer,
            quizScore: existingUserSkill?.quizScore || 0,
            quizGaps: existingUserSkill?.quizGaps || [],
            isCodeVerified: Boolean(existingUserSkill?.isCodeVerified),
            verifiedSource: existingUserSkill?.verifiedSource || 'self'
          });
          select.disabled = isQuizVer;
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
      renderProveSkillsPanel();
      return;
    }

    selectedSkillsSummary.innerHTML = '';
    selectedSkillsMap.forEach((skill) => {
      const pill = document.createElement('span');
      pill.className = 'badge badge-navy border d-inline-flex align-items-center gap-1 py-1 px-2 small';
      let verifiedTag = '';
      if (skill.isQuizVerified) {
        verifiedTag = `<span class="badge bg-success-subtle text-success border border-success ms-1" title="Verified by Reality Check Quiz" style="padding: 1px 5px; font-size: 0.62rem;"><i class="bi bi-patch-check-fill"></i> Verified</span>`;
      } else if (skill.isCodeVerified) {
        verifiedTag = `<span class="badge-code-verified ms-1" title="Verified by GitHub Repo Code" style="padding: 1px 4px; font-size: 0.62rem;"><i class="bi bi-github"></i> Verified</span>`;
      }

      const rawProf = String(skill.verifiedProficiency || skill.proficiency || 'intermediate');
      const shortProf = rawProf.slice(0, 3);

      pill.innerHTML = `
        <span class="fw-semibold text-ink">${escapeHtml(skill.displayName || skill.name)}</span>
        <span class="text-primary fw-bold font-mono" style="font-size: 0.68rem;">(${escapeHtml(shortProf)})</span>
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

    renderProveSkillsPanel();
  };

  // ── Verification Gate: Prove Your Skills Panel Logic ───────────────
  const getRequiredVerificationSkills = () => {
    const candidates = [];
    selectedSkillsMap.forEach((s) => {
      const norm = normalizeSkillSlug(s.name);
      const isBanked = AVAILABLE_QUIZ_SKILLS.includes(norm);
      const profStr = String(s.verifiedProficiency || s.proficiency || '').toLowerCase();
      const selfProfStr = String(s.selfRatedProficiency || '').toLowerCase();
      const isVerified = Boolean(s.isQuizVerified || s.isCodeVerified);
      const isLevelEligible =
        ['intermediate', 'advanced'].includes(profStr) ||
        ['intermediate', 'advanced'].includes(selfProfStr) ||
        isVerified;

      if (isLevelEligible) {
        let score = 0;
        // Prioritize already-verified skills so they ALWAYS remain visible with their checkmarks!
        if (isVerified) {
          score += 1000;
        }
        // Banked skills get a slight affinity boost for 0ms loading
        if (isBanked) {
          score += 20;
        }
        selectedInterests.forEach((interest) => {
          const affinity = INTEREST_SKILL_AFFINITY[interest] || [];
          if (affinity.includes(norm)) score += 10;
        });
        const levelToCheck = String(s.selfRatedProficiency || s.proficiency || '').toLowerCase();
        if (levelToCheck === 'advanced') score += 5;
        else if (levelToCheck === 'intermediate') score += 2;

        candidates.push({ key: s.name, norm, skill: s, score, isVerified, isBanked });
      }
    });

    // If all skills are self-rated beginner, include them as baseline candidates
    if (candidates.length === 0 && selectedSkillsMap.size > 0) {
      selectedSkillsMap.forEach((s) => {
        const norm = normalizeSkillSlug(s.name);
        const isBanked = AVAILABLE_QUIZ_SKILLS.includes(norm);
        candidates.push({ key: s.name, norm, skill: s, score: isBanked ? 20 : 0, isVerified: false, isBanked });
      });
    }

    // Sort by verified first, then score descending, then alphabetical
    candidates.sort((a, b) => {
      if (a.isVerified !== b.isVerified) {
        return a.isVerified ? -1 : 1;
      }
      return b.score - a.score || (a.skill.displayName || a.skill.name).localeCompare(b.skill.displayName || b.skill.name);
    });

    // Always include ALL verified skills that are selected, plus unverified ones up to at least 3 items total
    const verifiedList = candidates.filter(c => c.isVerified).map(c => c.skill);
    const unverifiedList = candidates.filter(c => !c.isVerified).map(c => c.skill);

    const neededUnverified = Math.max(0, 3 - verifiedList.length);
    return [...verifiedList, ...unverifiedList.slice(0, neededUnverified)];
  };

  const renderProveSkillsPanel = () => {
    if (!proveSkillsPanel || !proveSkillsList) return;

    const requiredSkills = getRequiredVerificationSkills();
    const verifiedCount = requiredSkills.filter(s => s.isQuizVerified || s.isCodeVerified).length;
    const isCompleted = hasCompletedSkillVerification || (requiredSkills.length > 0 && verifiedCount >= 1);

    // Check if this account has completed skill verification
    if (isCompleted) {
      hasCompletedSkillVerification = true;
      const currentUser = (typeof window.Auth?.getUser === 'function' ? window.Auth.getUser() : null) ||
                          (typeof window.Auth?.getCurrentUser === 'function' ? window.Auth.getCurrentUser() : null);
      if (currentUser && !currentUser.hasCompletedSkillVerification) {
        currentUser.hasCompletedSkillVerification = true;
        if (typeof window.Auth?.setCurrentUser === 'function') {
          window.Auth.setCurrentUser(currentUser);
        }
        if (typeof window.Auth?.initNav === 'function') {
          window.Auth.initNav();
        }
      }

      if (proveSkillsBadge) {
        proveSkillsBadge.className = 'prove-skills-badge completed';
      }
      if (proveSkillsBadgeText) {
        proveSkillsBadgeText.textContent = 'Account Verified ✓';
      }
      if (proveSkillsProgressFill) {
        proveSkillsProgressFill.style.width = '100%';
        proveSkillsProgressFill.className = 'prove-skills-progress-fill completed';
      }
      if (proveSkillsSubtitle) {
        proveSkillsSubtitle.textContent = 'Your account has verified technical skills. Dashboard, Recommendations, and Active Roadmap are fully unlocked!';
      }
      proveSkillsPanel.classList.add('all-verified');

      if (step3ContinueBtn) {
        step3ContinueBtn.disabled = false;
        step3ContinueBtn.title = 'Continue to Goals';
        step3ContinueBtn.classList.remove('opacity-50');
      }

      // Render Skill Rows
      proveSkillsList.innerHTML = '';
      requiredSkills.forEach((skill) => {
        const isQuizVer = !!skill.isQuizVerified;
        const isCodeVer = !!skill.isCodeVerified;
        const isVerified = isQuizVer || isCodeVer;
        const profStr = String(skill.verifiedProficiency || skill.proficiency || 'intermediate');
        const profClass = profStr.toLowerCase();

        const row = document.createElement('div');
        row.className = `prove-skill-item ${isVerified ? 'item-verified' : ''}`;

        let actionHtml = '';
        if (isQuizVer) {
          actionHtml = `
            <span class="badge bg-success text-white py-1.5 px-3 small d-inline-flex align-items-center gap-1 font-mono shadow-sm">
              <i class="bi bi-patch-check-fill"></i>
              <span>Verified (${escapeHtml(capitalize(profStr))}) ✓</span>
            </span>
          `;
        } else if (isCodeVer) {
          actionHtml = `
            <span class="badge bg-secondary text-white py-1.5 px-3 small d-inline-flex align-items-center gap-1 font-mono shadow-sm" title="Verified from connected GitHub repository code">
              <i class="bi bi-github"></i>
              <span>GitHub-Supported ✓</span>
            </span>
          `;
        } else {
          actionHtml = `
            <button type="button" class="btn-start-check" data-skill="${escapeHtml(skill.name)}" style="background: #475569;" title="Optional practice check - will not block progress">
              <i class="bi bi-play-circle"></i>
              <span>Practice check (Optional)</span>
            </button>
          `;
        }

        let noteHtml = '';
        const selfRatedStr = String(skill.selfRatedProficiency || '').toLowerCase();
        if (isQuizVer && selfRatedStr && selfRatedStr !== profClass) {
          const gapText = skill.quizGaps && skill.quizGaps.length > 0 ? ` Focus on: ${escapeHtml(skill.quizGaps.slice(0, 2).join(', '))}.` : '';
          noteHtml = `
            <div class="skill-adjusted-note">
              <i class="bi bi-info-circle text-primary me-1"></i>
              <span>You claimed <strong>${escapeHtml(capitalize(skill.selfRatedProficiency))}</strong>, quiz calibrated to <strong>${escapeHtml(capitalize(profStr))}</strong>.${gapText}</span>
            </div>
          `;
        }

        const checkmarkIcon = isVerified
          ? `<i class="bi bi-patch-check-fill text-success fs-5 flex-shrink-0" title="Verified Skill ✓"></i>`
          : `<div class="prove-skill-dot"></div>`;

        const verifiedTag = isVerified
          ? `<span class="badge bg-success-subtle text-success border border-success-subtle py-0.5 px-2 ms-1" style="font-size: 0.72rem;"><i class="bi bi-check-lg me-1"></i>Verified</span>`
          : '';

        row.innerHTML = `
          <div class="d-flex align-items-center justify-content-between w-100 flex-wrap gap-2">
            <div class="prove-skill-info">
              ${checkmarkIcon}
              <span class="prove-skill-name">${escapeHtml(skill.displayName || skill.name)}</span>
              ${verifiedTag}
              <span class="prove-skill-level ${escapeHtml(profClass)}">${escapeHtml(capitalize(profStr))}</span>
            </div>
            <div class="prove-skill-action">
              ${actionHtml}
            </div>
          </div>
          ${noteHtml}
        `;

        const checkBtn = row.querySelector('.btn-start-check');
        if (checkBtn) {
          checkBtn.addEventListener('click', () => {
            startSkillCheck(skill.name);
          });
        }

        proveSkillsList.appendChild(row);
      });
      return;
    }

    // When 0 skills need verification (e.g. only beginner or unbanked skills)
    if (requiredSkills.length === 0) {
      if (proveSkillsBadge) {
        proveSkillsBadge.className = 'prove-skills-badge skipped';
      }
      if (proveSkillsBadgeText) {
        proveSkillsBadgeText.textContent = 'No verification required';
      }
      if (proveSkillsProgressFill) {
        proveSkillsProgressFill.style.width = '100%';
        proveSkillsProgressFill.className = 'prove-skills-progress-fill completed';
      }
      if (proveSkillsSubtitle) {
        proveSkillsSubtitle.textContent = "All your selected skills are beginner level or don't require verification. You're ready to proceed to Goals!";
      }
      proveSkillsPanel.classList.remove('all-verified');

      proveSkillsList.innerHTML = `
        <div class="text-muted small py-2 fst-italic">
          <i class="bi bi-check-circle-fill text-success me-1"></i> No Intermediate or Advanced technical claims requiring reality-check verification. You can proceed directly to Goals.
        </div>
      `;

      if (step3ContinueBtn) {
        step3ContinueBtn.disabled = false;
        step3ContinueBtn.title = 'Continue to Goals';
        step3ContinueBtn.classList.remove('opacity-50');
      }
      return;
    }

    const targetTotal = Math.min(3, requiredSkills.length);
    const isAllComplete = verifiedCount >= targetTotal;
    const pct = Math.min(100, Math.round((verifiedCount / targetTotal) * 100));

    if (proveSkillsBadge) {
      proveSkillsBadge.className = `prove-skills-badge ${isAllComplete ? 'completed' : ''}`;
    }
    if (proveSkillsBadgeText) {
      proveSkillsBadgeText.textContent = isAllComplete
        ? `Progress: ${verifiedCount} of ${targetTotal} verified ✓`
        : `Progress: ${verifiedCount} of ${targetTotal} verified`;
    }
    if (proveSkillsProgressFill) {
      proveSkillsProgressFill.style.width = `${pct}%`;
      proveSkillsProgressFill.className = `prove-skills-progress-fill ${isAllComplete ? 'completed' : ''}`;
    }
    if (proveSkillsSubtitle) {
      proveSkillsSubtitle.textContent = isAllComplete
        ? 'Great job! All required skill claims are verified with 100% confidence. You can now continue to Goals.'
        : `Verify ${targetTotal} of your strongest skills to continue to Goals. Each check takes ~90 seconds (5 questions).`;
    }

    if (isAllComplete) {
      proveSkillsPanel.classList.add('all-verified');
      if (step3ContinueBtn) {
        step3ContinueBtn.disabled = false;
        step3ContinueBtn.title = 'Continue to Goals';
        step3ContinueBtn.classList.remove('opacity-50');
      }
    } else {
      proveSkillsPanel.classList.remove('all-verified');
      if (step3ContinueBtn) {
        step3ContinueBtn.disabled = true;
        step3ContinueBtn.title = `Verify ${targetTotal - verifiedCount} more skill(s) to continue to Goals`;
        step3ContinueBtn.classList.add('opacity-50');
      }
    }

    // Render Skill Rows
    proveSkillsList.innerHTML = '';
    requiredSkills.forEach((skill) => {
      const isQuizVer = !!skill.isQuizVerified;
      const isCodeVer = !!skill.isCodeVerified;
      const isVerified = isQuizVer || isCodeVer;
      const profStr = String(skill.verifiedProficiency || skill.proficiency || 'intermediate');
      const profClass = profStr.toLowerCase();

      const row = document.createElement('div');
      row.className = `prove-skill-item ${isVerified ? 'item-verified' : ''}`;

      let actionHtml = '';
      if (isQuizVer) {
        actionHtml = `
          <span class="badge bg-success text-white py-1.5 px-3 small d-inline-flex align-items-center gap-1 font-mono shadow-sm">
            <i class="bi bi-patch-check-fill"></i>
            <span>Verified (${escapeHtml(capitalize(profStr))}) ✓</span>
          </span>
        `;
      } else if (isCodeVer) {
        actionHtml = `
          <span class="badge bg-secondary text-white py-1.5 px-3 small d-inline-flex align-items-center gap-1 font-mono shadow-sm" title="Verified from connected GitHub repository code">
            <i class="bi bi-github"></i>
            <span>GitHub-Supported ✓</span>
          </span>
        `;
      } else {
        actionHtml = `
          <button type="button" class="btn-start-check" data-skill="${escapeHtml(skill.name)}">
            <i class="bi bi-play-circle-fill"></i>
            <span>Start check (90s)</span>
          </button>
        `;
      }

      let noteHtml = '';
      const selfRatedStr = String(skill.selfRatedProficiency || '').toLowerCase();
      if (isQuizVer && selfRatedStr && selfRatedStr !== profClass) {
        const gapText = skill.quizGaps && skill.quizGaps.length > 0 ? ` Focus on: ${escapeHtml(skill.quizGaps.slice(0, 2).join(', '))}.` : '';
        noteHtml = `
          <div class="skill-adjusted-note">
            <i class="bi bi-info-circle text-primary me-1"></i>
            <span>You claimed <strong>${escapeHtml(capitalize(skill.selfRatedProficiency))}</strong>, quiz calibrated to <strong>${escapeHtml(capitalize(profStr))}</strong>.${gapText}</span>
          </div>
        `;
      }

      const checkmarkIcon = isVerified
        ? `<i class="bi bi-patch-check-fill text-success fs-5 flex-shrink-0" title="Verified Skill ✓"></i>`
        : `<div class="prove-skill-dot"></div>`;

      const verifiedTag = isVerified
        ? `<span class="badge bg-success-subtle text-success border border-success-subtle py-0.5 px-2 ms-1" style="font-size: 0.72rem;"><i class="bi bi-check-lg me-1"></i>Verified</span>`
        : '';

      row.innerHTML = `
        <div class="d-flex align-items-center justify-content-between w-100 flex-wrap gap-2">
          <div class="prove-skill-info">
            ${checkmarkIcon}
            <span class="prove-skill-name">${escapeHtml(skill.displayName || skill.name)}</span>
            ${verifiedTag}
            <span class="prove-skill-level ${escapeHtml(profClass)}">${escapeHtml(capitalize(profStr))}</span>
          </div>
          <div class="prove-skill-action">
            ${actionHtml}
          </div>
        </div>
        ${noteHtml}
      `;

      const checkBtn = row.querySelector('.btn-start-check');
      if (checkBtn) {
        checkBtn.addEventListener('click', () => {
          startSkillCheck(skill.name);
        });
      }

      proveSkillsList.appendChild(row);
    });
  };

  // ── Skill Check In-Page Modal Logic ─────────────────────────────────
  let activeQuizSession = null;
  let activeQuestion = null;
  let activeQuestionStep = 1;
  let activeSelectedOptionIndex = null;
  let activeQuizSummary = null;

  const startSkillCheck = async (skillName) => {
    const skill = selectedSkillsMap.get(skillName) ||
      Array.from(selectedSkillsMap.values()).find(s => (s.name || '').toLowerCase() === (skillName || '').toLowerCase());
    if (!skill) return;

    if (!skillCheckModalEl) return;
    const modal = bootstrap.Modal.getOrCreateInstance(skillCheckModalEl);
    modal.show();

    // Reset modal UI state
    if (modalSkillBadge) modalSkillBadge.textContent = skill.displayName || skill.name;
    if (skillCheckModalTitle) skillCheckModalTitle.textContent = `${skill.displayName || skill.name} Reality Check`;
    modalLoadingState?.classList.remove('d-none');
    modalQuestionState?.classList.add('d-none');
    modalVerdictState?.classList.add('d-none');
    modalFeedbackBox?.classList.add('d-none');
    if (modalSubmitBtn) {
      modalSubmitBtn.disabled = true;
      modalSubmitBtn.classList.remove('d-none');
    }
    if (modalNextBtn) {
      modalNextBtn.classList.add('d-none');
    }

    try {
      const savedProvider = localStorage.getItem('cp_quiz_preferred_provider') || 'auto';
      const customKey = localStorage.getItem('cp_custom_quiz_key') || null;

      const res = await window.API.post('/quiz/start', {
        skill: skill.name,
        selfRated: skill.selfRatedProficiency || skill.proficiency || 'intermediate',
        displayName: skill.displayName || skill.name,
        provider: savedProvider !== 'auto' ? savedProvider : undefined,
        userApiKey: customKey || undefined
      }, { auth: true });

      if (!res.success || !res.data?.question) {
        throw new Error(res.message || 'Failed to initialize reality check session.');
      }

      activeQuizSession = {
        sessionId: res.data?.sessionId,
        skillName: skill.name,
        displayName: skill.displayName || skill.name,
        selfRated: skill.selfRatedProficiency || skill.proficiency || 'intermediate',
        provider: res.data?.provider,
        isAIGenerated: Boolean(res.data?.isAIGenerated)
      };
      activeQuestionStep = 1;
      activeQuestion = res.data.question;

      // Update provider badge in modal header
      if (modalProviderBadge) {
        modalProviderBadge.classList.remove('d-none');
        if (res.data.isAIGenerated) {
          const prov = res.data.provider || 'AI';
          const pName = prov === 'groq' ? 'Groq AI (Llama)' :
                        prov === 'gemini' ? 'Google Gemini' :
                        prov === 'custom_api_key' ? 'Custom AI Model' : 'Dynamic AI';
          modalProviderBadge.className = 'badge bg-primary-subtle text-primary border border-primary-subtle px-2 py-0.5 small';
          modalProviderBadge.innerHTML = `<i class="bi bi-cpu me-1"></i>${escapeHtml(pName)}`;
        } else {
          modalProviderBadge.className = 'badge bg-success-subtle text-success border border-success-subtle px-2 py-0.5 small';
          modalProviderBadge.innerHTML = `<i class="bi bi-shield-check me-1"></i>Curated Bank`;
        }
      }

      renderModalQuestion(activeQuestion, 1);
    } catch (err) {
      console.error('Quiz start error:', err);
      showAlert(`Could not start skill check: ${err.message}`, 'danger');
      modal.hide();
    }
  };

  const renderModalQuestion = (question, stepNumber) => {
    modalLoadingState?.classList.add('d-none');
    modalQuestionState?.classList.remove('d-none');
    modalVerdictState?.classList.add('d-none');
    modalFeedbackBox?.classList.add('d-none');

    activeQuestion = question;
    activeQuestionStep = stepNumber;
    activeSelectedOptionIndex = null;

    // Difficulty pill
    const diff = (question.difficulty || 'medium').toLowerCase();
    if (modalDifficultyPill) {
      modalDifficultyPill.className = `difficulty-pill ${diff}`;
      modalDifficultyPill.textContent = diff.toUpperCase();
    }

    // Step text & dots
    if (modalStepText) modalStepText.textContent = `Question ${stepNumber} of 5`;
    if (modalStepper) {
      const dots = modalStepper.querySelectorAll('.quiz-step-dot');
      dots.forEach((dot, idx) => {
        dot.className = 'quiz-step-dot';
        if (idx + 1 === stepNumber) dot.classList.add('active');
        else if (idx + 1 < stepNumber) dot.classList.add('completed');
      });
    }

    // Question title & code snippet
    if (modalQuestionPrompt) modalQuestionPrompt.textContent = question.text || question.prompt || '';
    if (modalCodeSnippet) {
      if (question.codeSnippet) {
        modalCodeSnippet.classList.remove('d-none');
        const codeEl = modalCodeSnippet.querySelector('code');
        if (codeEl) codeEl.textContent = question.codeSnippet;
      } else {
        modalCodeSnippet.classList.add('d-none');
      }
    }

    // Options
    if (modalOptionsList) {
      modalOptionsList.innerHTML = '';
      (question.options || []).forEach((opt, idx) => {
        const optCard = document.createElement('div');
        optCard.className = 'quiz-option-card';
        optCard.setAttribute('data-index', idx);
        optCard.innerHTML = `
          <div class="quiz-option-radio">
            <div class="quiz-option-radio-dot"></div>
          </div>
          <div class="quiz-option-text">${escapeHtml(opt)}</div>
        `;

        optCard.addEventListener('click', () => {
          if (optCard.classList.contains('locked')) return;
          modalOptionsList.querySelectorAll('.quiz-option-card').forEach(c => c.classList.remove('selected'));
          optCard.classList.add('selected');
          activeSelectedOptionIndex = idx;
          if (modalSubmitBtn) modalSubmitBtn.disabled = false;
        });

        modalOptionsList.appendChild(optCard);
      });
    }

    if (modalSubmitBtn) {
      modalSubmitBtn.disabled = true;
      modalSubmitBtn.innerHTML = `<span>Submit Answer</span><i class="bi bi-arrow-right ms-1"></i>`;
      modalSubmitBtn.classList.remove('d-none');
    }
    if (modalNextBtn) {
      modalNextBtn.classList.add('d-none');
    }
  };

  modalSubmitBtn?.addEventListener('click', async () => {
    if (activeSelectedOptionIndex === null) return;

    modalSubmitBtn.disabled = true;
    modalSubmitBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-1" role="status"></span> Checking...`;

    try {
      const res = await window.API.post('/quiz/answer', {
        skill: activeQuizSession?.skillName,
        sessionId: activeQuizSession?.sessionId,
        questionId: activeQuestion?.id,
        selectedIndex: activeSelectedOptionIndex,
        selectedOption: activeSelectedOptionIndex
      }, { auth: true });

      if (!res.success) {
        throw new Error(res.message || 'Failed to submit answer.');
      }

      const data = res.data;
      const correctIdx = Number(data.correctIndex !== undefined ? data.correctIndex : data.correctAnswer);
      const isCorrect = Boolean(data.isCorrect);

      // Lock options and mark colors
      if (modalOptionsList) {
        modalOptionsList.querySelectorAll('.quiz-option-card').forEach((card) => {
          card.classList.add('locked');
          const cIdx = Number(card.getAttribute('data-index'));
          if (cIdx === correctIdx) {
            card.classList.add('option-correct');
          } else if (cIdx === activeSelectedOptionIndex && !isCorrect) {
            card.classList.add('option-wrong');
          }
        });
      }

      // Show feedback box
      if (modalFeedbackBox) {
        modalFeedbackBox.className = `quiz-feedback-box ${isCorrect ? 'correct' : 'incorrect'}`;
        if (modalFeedbackIcon) {
          modalFeedbackIcon.className = `quiz-feedback-icon bi ${isCorrect ? 'bi-check-circle-fill text-success' : 'bi-x-circle-fill text-danger'}`;
        }
        if (modalFeedbackHeadline) {
          modalFeedbackHeadline.textContent = isCorrect ? 'Correct!' : 'Not quite right';
        }
        if (modalFeedbackText) {
          modalFeedbackText.textContent = data.explanation || (isCorrect ? 'Great grasp of this concept!' : 'Review this concept in your study plan.');
        }
        modalFeedbackBox.classList.remove('d-none');
      }

      // Update buttons
      modalSubmitBtn.classList.add('d-none');
      if (modalNextBtn) {
        modalNextBtn.classList.remove('d-none');
        if (data.isFinished) {
          activeQuizSummary = data.summary || data.result;
          modalNextBtn.innerHTML = `<span>View Results</span><i class="bi bi-trophy-fill ms-1"></i>`;

          // 1. Immediately calibrate and verify the skill in selectedSkillsMap!
          const skillName = activeQuizSession?.skillName;
          const skill = selectedSkillsMap.get(skillName) ||
            (skillName ? Array.from(selectedSkillsMap.values()).find(s => (s.name || '').toLowerCase() === skillName.toLowerCase()) : null);

          const verifiedLevel = (
            activeQuizSummary?.verifiedProficiency ||
            activeQuizSummary?.verifiedLevel ||
            activeQuizSummary?.quizSays ||
            (skill ? (skill.verifiedProficiency || skill.proficiency) : 'intermediate') ||
            'intermediate'
          ).toLowerCase();

          if (skill && activeQuizSummary) {
            skill.selfRatedProficiency = skill.selfRatedProficiency || skill.proficiency || 'intermediate';
            skill.proficiency = verifiedLevel;
            skill.verifiedProficiency = verifiedLevel;
            skill.isQuizVerified = true;
            skill.quizScore = typeof activeQuizSummary.score === 'number' ? activeQuizSummary.score : 0;
            skill.quizGaps = activeQuizSummary.gaps || activeQuizSummary.identifiedGaps || [];
            skill.verifiedSource = 'quiz';
            skill.quizSummaryMessage = activeQuizSummary.summaryMessage || activeQuizSummary.realityCheckMessage;
          }

          // 2. Mark account verification complete immediately
          hasCompletedSkillVerification = true;
          const currentUser = (typeof window.Auth?.getUser === 'function' ? window.Auth.getUser() : null) ||
                              (typeof window.Auth?.getCurrentUser === 'function' ? window.Auth.getCurrentUser() : null);
          if (currentUser) {
            currentUser.hasCompletedSkillVerification = true;
            if (activeQuizSummary?.user?.skills) {
              currentUser.skills = activeQuizSummary.user.skills;
            } else if (Array.isArray(currentUser.skills)) {
              let matched = currentUser.skills.find(s => (s.name || '').toLowerCase() === (skillName || '').toLowerCase());
              if (!matched && skillName) {
                matched = { name: skillName, displayName: skill?.displayName || skillName };
                currentUser.skills.push(matched);
              }
              if (matched) {
                matched.selfRatedProficiency = matched.selfRatedProficiency || matched.proficiency || 'intermediate';
                matched.proficiency = verifiedLevel;
                matched.verifiedProficiency = verifiedLevel;
                matched.isQuizVerified = true;
                matched.quizScore = typeof activeQuizSummary.score === 'number' ? activeQuizSummary.score : 0;
                matched.quizGaps = activeQuizSummary.gaps || activeQuizSummary.identifiedGaps || [];
              }
            }
            if (typeof window.Auth?.setCurrentUser === 'function') {
              window.Auth.setCurrentUser(currentUser);
            }
          }

          // 3. Immediately render UI so checkmarks and verified badges appear behind modal!
          try {
            renderSkillsGrid();
            updateSelectedSkillsUI();
            renderProveSkillsPanel();
          } catch (renderErr) {
            console.error('Error re-rendering after quiz finished:', renderErr);
          }
        } else {
          activeQuestion = data.nextQuestion;
          modalNextBtn.innerHTML = `<span>Next Question</span><i class="bi bi-arrow-right ms-1"></i>`;
        }
      }
    } catch (err) {
      console.error('Answer submission error:', err);
      showAlert(`Could not submit answer: ${err.message}`, 'danger');
      if (modalSubmitBtn) {
        modalSubmitBtn.disabled = false;
        modalSubmitBtn.innerHTML = `<span>Submit Answer</span><i class="bi bi-arrow-right ms-1"></i>`;
      }
    }
  });

  modalNextBtn?.addEventListener('click', () => {
    if (activeQuizSummary) {
      // Show verdict state
      modalQuestionState?.classList.add('d-none');
      modalVerdictState?.classList.remove('d-none');

      const skillName = activeQuizSession?.skillName;
      const skill = selectedSkillsMap.get(skillName) ||
        (skillName ? Array.from(selectedSkillsMap.values()).find(s => (s.name || '').toLowerCase() === skillName.toLowerCase()) : null);

      const verifiedLevel = (
        activeQuizSummary.verifiedProficiency ||
        activeQuizSummary.verifiedLevel ||
        activeQuizSummary.quizSays ||
        (skill ? (skill.verifiedProficiency || skill.proficiency) : 'intermediate') ||
        'intermediate'
      ).toLowerCase();

      if (modalVerdictSelfClaimed) {
        modalVerdictSelfClaimed.textContent = capitalize(activeQuizSummary.selfRated || (skill ? skill.selfRatedProficiency || skill.proficiency : 'Intermediate'));
      }
      if (modalVerdictVerifiedLevel) {
        modalVerdictVerifiedLevel.textContent = capitalize(verifiedLevel);
      }
      if (modalVerdictExplanation) {
        modalVerdictExplanation.textContent = activeQuizSummary.summaryMessage || activeQuizSummary.realityCheckMessage || 'Reality check complete.';
      }

      if (modalVerdictGapsWrap && modalVerdictGaps) {
        const gapsList = activeQuizSummary.gaps || activeQuizSummary.identifiedGaps || [];
        if (gapsList.length > 0) {
          modalVerdictGapsWrap.classList.remove('d-none');
          modalVerdictGaps.textContent = gapsList.join(', ');
        } else {
          modalVerdictGapsWrap.classList.add('d-none');
        }
      }

      // Update in selectedSkillsMap
      if (skill) {
        skill.selfRatedProficiency = skill.selfRatedProficiency || skill.proficiency || 'intermediate';
        skill.proficiency = verifiedLevel;
        skill.verifiedProficiency = verifiedLevel;
        skill.isQuizVerified = true;
        skill.quizScore = typeof activeQuizSummary.score === 'number' ? activeQuizSummary.score : 0;
        skill.quizGaps = activeQuizSummary.gaps || activeQuizSummary.identifiedGaps || [];
        skill.verifiedSource = 'quiz';
        skill.quizSummaryMessage = activeQuizSummary.summaryMessage || activeQuizSummary.realityCheckMessage;
      }

      try {
        renderSkillsGrid();
        updateSelectedSkillsUI();
        renderProveSkillsPanel();
      } catch (renderErr) {
        console.error('Error re-rendering in verdict state:', renderErr);
      }
      return;
    }

    if (activeQuestion) {
      renderModalQuestion(activeQuestion, activeQuestionStep + 1);
    }
  });

  modalVerdictDoneBtn?.addEventListener('click', () => {
    if (skillCheckModalEl) {
      bootstrap.Modal.getInstance(skillCheckModalEl)?.hide();
    }

    // Reset active quiz variables
    activeQuizSession = null;
    activeQuestion = null;
    activeQuizSummary = null;

    // Mark account verification complete (only required once per account)
    hasCompletedSkillVerification = true;
    const currentUser = (typeof window.Auth?.getUser === 'function' ? window.Auth.getUser() : null) ||
                        (typeof window.Auth?.getCurrentUser === 'function' ? window.Auth.getCurrentUser() : null);
    if (currentUser) {
      currentUser.hasCompletedSkillVerification = true;
      if (typeof window.Auth?.setCurrentUser === 'function') {
        window.Auth.setCurrentUser(currentUser);
      }
    }
    if (typeof window.Auth?.initNav === 'function') {
      window.Auth.initNav();
    }

    // Refresh UI
    try {
      renderSkillsGrid();
      updateSelectedSkillsUI();
      renderProveSkillsPanel();
    } catch (err) {
      console.error('Error refreshing UI on modal done:', err);
    }

    showAlert('🎉 Account Verified ✓! Your technical skills are verified. Dashboard, Recommendations, and Active Roadmap are now unlocked!', 'success');
  });

  // Ensure modal dismissal (via X button, backdrop click, or ESC) always guarantees immediate UI refresh
  skillCheckModalEl?.addEventListener('hidden.bs.modal', () => {
    activeQuizSession = null;
    activeQuestion = null;
    activeQuizSummary = null;
    try {
      renderSkillsGrid();
      updateSelectedSkillsUI();
      renderProveSkillsPanel();
    } catch (err) {
      console.error('Error refreshing UI on modal hidden:', err);
    }
  });


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
        selfRatedProficiency: proficiency,
        isCustom: true
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

      // 3. Fill Skills (preserve already verified skill statuses if previously tested)
      const currentUser = (typeof window.Auth?.getUser === 'function' ? window.Auth.getUser() : null) ||
                          (typeof window.Auth?.getCurrentUser === 'function' ? window.Auth.getCurrentUser() : null);
      const existingUserSkills = Array.isArray(currentUser?.skills) ? currentUser.skills : [];
      const prevSelectedMap = new Map(selectedSkillsMap);

      selectedSkillsMap.clear();
      const demoSkills = [
        { name: 'html', displayName: 'HTML', proficiency: 'intermediate', category: 'frontend' },
        { name: 'css', displayName: 'CSS', proficiency: 'intermediate', category: 'frontend' },
        { name: 'javascript', displayName: 'JavaScript', proficiency: 'advanced', category: 'frontend' },
        { name: 'react', displayName: 'React', proficiency: 'intermediate', category: 'frontend' },
        { name: 'node.js', displayName: 'Node.js', proficiency: 'intermediate', category: 'backend' },
        { name: 'python', displayName: 'Python', proficiency: 'intermediate', category: 'backend' },
      ];

      demoSkills.forEach((s) => {
        const key = s.name.toLowerCase();
        const fromPrev = prevSelectedMap.get(key) || prevSelectedMap.get(s.name);
        const fromUser = existingUserSkills.find(us => (us.name || '').toLowerCase() === key);

        const isQuizVerified = Boolean(fromPrev?.isQuizVerified || fromUser?.isQuizVerified);
        const isCodeVerified = Boolean(fromPrev?.isCodeVerified || fromUser?.isCodeVerified);
        const verifiedProf = fromPrev?.verifiedProficiency || fromUser?.verifiedProficiency || null;
        const currentProf = verifiedProf || fromPrev?.proficiency || fromUser?.proficiency || s.proficiency;
        const selfRatedProf = fromPrev?.selfRatedProficiency || fromUser?.selfRatedProficiency || s.proficiency;

        selectedSkillsMap.set(key, {
          name: key,
          displayName: s.displayName,
          category: s.category,
          proficiency: currentProf,
          selfRatedProficiency: selfRatedProf,
          verifiedProficiency: verifiedProf,
          isQuizVerified: isQuizVerified,
          isCodeVerified: isCodeVerified,
          quizScore: fromPrev?.quizScore || fromUser?.quizScore || 0,
          quizGaps: fromPrev?.quizGaps || fromUser?.quizGaps || [],
          verifiedSource: isQuizVerified ? 'quiz' : (isCodeVerified ? 'github_repo' : 'self')
        });
      });
      renderSkillsGrid();
      updateSelectedSkillsUI();

      // 4. Fill Career Goal in Step 4
      const careerGoalsInput = document.getElementById('careerGoals');
      if (careerGoalsInput) {
        careerGoalsInput.value = 'Full-Stack Web & AI Application Developer';
      }

      showAlert('✓ Demo profile loaded successfully! Verified skills preserved.', 'success');

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
        const user = (typeof window.Auth?.getUser === 'function' ? window.Auth.getUser() : null) || 
                     (typeof window.Auth?.getCurrentUser === 'function' ? window.Auth.getCurrentUser() : null) || 
                     null;

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

        // 2. Synchronize via Auth System (Zero username prompt)
        const syncHandler = window.GitHubAuth?.syncRepos || window.GitHubAuth?.connectGitHubAccount;
        if (syncHandler) {
          syncHandler((err, data) => {
            btnAutoDetectGitHubSkills.disabled = false;
            btnAutoDetectGitHubSkills.innerHTML = originalText;

            if (err) {
              showAlert(err.message || 'GitHub scan canceled or failed.', 'danger');
              return;
            }

            const verifiedSkills = data?.detectedSkills || data?.verifiedSkills || (data?.user?.skills || []).filter(s => s.isCodeVerified) || [];
            let countAdded = 0;

            verifiedSkills.forEach(s => {
              const key = (s.name || '').toLowerCase();
              if (!key) return;
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
                verifiedSource: s.verifiedSource || 'github_repo'
              });
              countAdded++;
            });

            renderSkillsGrid();
            updateSelectedSkillsUI();
            const ghUser = data?.profile?.username || data?.user?.githubProfile?.username || 'user';
            const repoCount = data?.repositories?.length || data?.repos?.length || data?.user?.githubRepos?.length || 0;
            showAlert(`✓ Scanned @${ghUser} (${repoCount} study repos via auth system) and auto-detected ${countAdded} verified skills!`, 'success');
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
              proficiency: s.verifiedProficiency || s.proficiency || 'beginner',
              isCodeVerified: !!s.isCodeVerified,
              verifiedSource: s.verifiedSource || 'self',
              isQuizVerified: !!s.isQuizVerified,
              selfRatedProficiency: s.selfRatedProficiency || null,
              verifiedProficiency: s.verifiedProficiency || null,
              quizScore: typeof s.quizScore === 'number' ? s.quizScore : 0,
              quizGaps: Array.isArray(s.quizGaps) ? s.quizGaps : [],
              quizVerifiedAt: s.quizVerifiedAt || null,
            });
          });
        }

        if (Array.isArray(user.careerGoals) && user.careerGoals.length > 0) {
          document.getElementById('careerGoals').value = user.careerGoals[0] || '';
        }

        if (user.hasCompletedSkillVerification || (Array.isArray(user.skills) && user.skills.some((s) => s.isQuizVerified))) {
          hasCompletedSkillVerification = true;
        }

        if (typeof window.Auth?.setCurrentUser === 'function') {
          window.Auth.setCurrentUser(user);
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
      hasCompletedSkillVerification: Boolean(hasCompletedSkillVerification),
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

        showAlert('✓ Profile & verified skills saved! Directing you to your career recommendations...', 'success');
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
