/**
 * recommendations.js — Career Recommendations & Skill Gap Analysis
 *
 * Calls POST /api/recommendations/generate, displays the top ranked careers,
 * renders skill gap indicators (matched/developing/missing), score breakdown bars,
 * and wires duration selection modal for roadmap generation.
 */

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Route guard
  if (!window.Auth?.isAuthenticated()) {
    window.Auth?.requireAuth();
    return;
  }

  // 2. DOM Elements
  const loadingState = document.getElementById('loadingState');
  const incompleteState = document.getElementById('incompleteProfileState');
  const container = document.getElementById('recommendationsContainer');
  const alertContainer = document.getElementById('alertContainer');
  const roadmapModalEl = document.getElementById('roadmapDurationModal');
  const modalCareerTitle = document.getElementById('modalCareerTitle');
  const btnConfirmGenerate = document.getElementById('btnConfirmGenerate');
  const skillOrbitTitle = document.getElementById('skillOrbitTitle');

  // Live Jobs Modal DOM Elements (AI Dev Board API)
  const liveJobsModalEl = document.getElementById('liveJobsModal');
  const jobsModalCareerTitle = document.getElementById('jobsModalCareerTitle');
  const jobsLoadingState = document.getElementById('jobsLoadingState');
  const jobsListContainer = document.getElementById('jobsListContainer');
  const jobsEmptyState = document.getElementById('jobsEmptyState');
  const filterGlobalRemote = document.getElementById('filterGlobalRemote');

  let roadmapModal = null;
  if (roadmapModalEl && typeof bootstrap !== 'undefined') {
    roadmapModal = new bootstrap.Modal(roadmapModalEl);
  }

  let liveJobsModal = null;
  if (liveJobsModalEl && typeof bootstrap !== 'undefined') {
    liveJobsModal = new bootstrap.Modal(liveJobsModalEl);
  }

  // Future-Proof & What-If Modal DOM Elements
  const futureProofModalEl = document.getElementById('futureProofModal');
  const whatIfModalEl = document.getElementById('whatIfSimulatorModal');

  let futureProofModal = null;
  if (futureProofModalEl && typeof bootstrap !== 'undefined') {
    futureProofModal = new bootstrap.Modal(futureProofModalEl);
  }

  let whatIfModal = null;
  if (whatIfModalEl && typeof bootstrap !== 'undefined') {
    whatIfModal = new bootstrap.Modal(whatIfModalEl);
  }

  const fpModalCareerTitle = document.getElementById('fpModalCareerTitle');
  const fpModalScoreDisplay = document.getElementById('fpModalScoreDisplay');
  const fpModalRatingBadge = document.getElementById('fpModalRatingBadge');
  const fpTransferableVal = document.getElementById('fpTransferableVal');
  const fpTransferableBar = document.getElementById('fpTransferableBar');
  const fpAdaptabilityVal = document.getElementById('fpAdaptabilityVal');
  const fpAdaptabilityBar = document.getElementById('fpAdaptabilityBar');
  const fpDemandVal = document.getElementById('fpDemandVal');
  const fpDemandBar = document.getElementById('fpDemandBar');
  const fpResilienceVal = document.getElementById('fpResilienceVal');
  const fpResilienceBar = document.getElementById('fpResilienceBar');

  const whatIfCareerTitle = document.getElementById('whatIfCareerTitle');
  const whatIfCurrentScore = document.getElementById('whatIfCurrentScore');
  const whatIfSkillSelect = document.getElementById('whatIfSkillSelect');
  const whatIfSkillContext = document.getElementById('whatIfSkillContext');
  const whatIfDeltaBadge = document.getElementById('whatIfDeltaBadge');
  const whatIfBeforeScore = document.getElementById('whatIfBeforeScore');
  const whatIfAfterScore = document.getElementById('whatIfAfterScore');
  const whatIfBeforeGaps = document.getElementById('whatIfBeforeGaps');
  const whatIfAfterGaps = document.getElementById('whatIfAfterGaps');
  const whatIfBeforeDuration = document.getElementById('whatIfBeforeDuration');
  const whatIfAfterDuration = document.getElementById('whatIfAfterDuration');
  const whatIfNarrativeText = document.getElementById('whatIfNarrativeText');
  const whatIfApplyRoadmapBtn = document.getElementById('whatIfApplyRoadmapBtn');

  let activeWhatIfItem = null;

  // Curated Prototype Future-Proof Data Dictionary (Guidance Indicator)
  // Formula: Future-Proof Score = 40% Transferable Skills + 25% Learning Adaptability + 20% Demand Signal + 15% Automation Resilience
  const FUTURE_PROOF_DATA = {
    'frontend-developer': { transferable: 86, adaptability: 90, demand: 88, automationResilience: 82, rating: 'High Resilience' },
    'full-stack-developer': { transferable: 92, adaptability: 92, demand: 94, automationResilience: 88, rating: 'Very High Resilience' },
    'data-analyst': { transferable: 84, adaptability: 85, demand: 86, automationResilience: 78, rating: 'Moderate-High Resilience' },
    'ui-ux-designer': { transferable: 88, adaptability: 86, demand: 85, automationResilience: 84, rating: 'High Resilience' },
    'cybersecurity-analyst': { transferable: 90, adaptability: 94, demand: 96, automationResilience: 92, rating: 'Exceptional Resilience' },
    'ai-ml-engineer': { transferable: 94, adaptability: 96, demand: 98, automationResilience: 94, rating: 'Exceptional Resilience' },
    'devops-cloud-engineer': { transferable: 90, adaptability: 92, demand: 95, automationResilience: 90, rating: 'Exceptional Resilience' },
    'mobile-app-developer': { transferable: 85, adaptability: 88, demand: 86, automationResilience: 80, rating: 'High Resilience' },
    'backend-engineer': { transferable: 92, adaptability: 90, demand: 93, automationResilience: 89, rating: 'Very High Resilience' },
    'data-scientist': { transferable: 91, adaptability: 92, demand: 92, automationResilience: 88, rating: 'Very High Resilience' },
    'qa-automation-engineer': { transferable: 82, adaptability: 86, demand: 84, automationResilience: 76, rating: 'Moderate Resilience' },
    'blockchain-developer': { transferable: 86, adaptability: 88, demand: 82, automationResilience: 84, rating: 'High Resilience' },
    'product-manager': { transferable: 95, adaptability: 90, demand: 89, automationResilience: 92, rating: 'Exceptional Resilience' },
    'cloud-architect': { transferable: 93, adaptability: 94, demand: 96, automationResilience: 93, rating: 'Exceptional Resilience' },
    'default': { transferable: 85, adaptability: 88, demand: 87, automationResilience: 83, rating: 'High Resilience' }
  };

  const getFutureProofMetrics = (slug, category) => {
    const key = (slug || '').toLowerCase().trim();
    const data = FUTURE_PROOF_DATA[key] || FUTURE_PROOF_DATA['default'];
    const score = Math.round(
      data.transferable * 0.40 +
      data.adaptability * 0.25 +
      data.demand * 0.20 +
      data.automationResilience * 0.15
    );
    return { ...data, score };
  };

  const openFutureProofModal = (careerTitle, slug, category) => {
    const metrics = getFutureProofMetrics(slug, category);
    if (fpModalCareerTitle) fpModalCareerTitle.textContent = careerTitle;
    if (fpModalScoreDisplay) fpModalScoreDisplay.textContent = `${metrics.score}/100`;
    if (fpModalRatingBadge) {
      fpModalRatingBadge.textContent = metrics.rating;
      fpModalRatingBadge.className = `badge font-mono px-3 py-1 ${metrics.score >= 88 ? 'bg-success' : 'bg-primary'}`;
    }
    if (fpTransferableVal) fpTransferableVal.textContent = `${metrics.transferable}/100`;
    if (fpTransferableBar) fpTransferableBar.style.width = `${metrics.transferable}%`;

    if (fpAdaptabilityVal) fpAdaptabilityVal.textContent = `${metrics.adaptability}/100`;
    if (fpAdaptabilityBar) fpAdaptabilityBar.style.width = `${metrics.adaptability}%`;

    if (fpDemandVal) fpDemandVal.textContent = `${metrics.demand}/100`;
    if (fpDemandBar) fpDemandBar.style.width = `${metrics.demand}%`;

    if (fpResilienceVal) fpResilienceVal.textContent = `${metrics.automationResilience}/100`;
    if (fpResilienceBar) fpResilienceBar.style.width = `${metrics.automationResilience}%`;

    if (futureProofModal) {
      futureProofModal.show();
    }
  };

  const openWhatIfSimulator = (item) => {
    activeWhatIfItem = item;
    const { career, finalScore, scoreBreakdown = {}, weakSkills = [], missingSkills = [], matchedSkills = [] } = item;

    if (whatIfCareerTitle) whatIfCareerTitle.textContent = career.title;
    if (whatIfCurrentScore) whatIfCurrentScore.textContent = `${finalScore}%`;
    if (whatIfBeforeScore) whatIfBeforeScore.textContent = `${finalScore}%`;

    const candidateSkills = [
      ...weakSkills.map(s => ({ ...s, type: 'Developing', currentProf: s.userProficiency || 'Beginner' })),
      ...missingSkills.map(s => ({ ...s, type: 'Missing', currentProf: 'None' }))
    ];

    if (!whatIfSkillSelect) return;

    if (candidateSkills.length === 0) {
      whatIfSkillSelect.innerHTML = '<option value="">All primary skills already mastered!</option>';
      if (whatIfDeltaBadge) whatIfDeltaBadge.textContent = '+0% Max Fit';
      if (whatIfAfterScore) whatIfAfterScore.textContent = `${finalScore}%`;
      if (whatIfBeforeGaps) whatIfBeforeGaps.textContent = '0';
      if (whatIfAfterGaps) whatIfAfterGaps.textContent = '0';
      if (whatIfBeforeDuration) whatIfBeforeDuration.textContent = '4 Wks';
      if (whatIfAfterDuration) whatIfAfterDuration.textContent = '4 Wks';
      if (whatIfNarrativeText) whatIfNarrativeText.textContent = 'Your profile already matches all core technical competencies for this path!';
    } else {
      whatIfSkillSelect.innerHTML = candidateSkills.map((s, idx) => `
        <option value="${idx}">
          ${escapeHtml(s.displayName || s.name)} (${s.type}: currently ${escapeHtml(s.currentProf)})
        </option>
      `).join('');

      runWhatIfCalculation(candidateSkills[0], candidateSkills);
    }

    if (whatIfModal) {
      whatIfModal.show();
    }
  };

  const runWhatIfCalculation = (selectedSkill, allCandidates) => {
    if (!activeWhatIfItem || !selectedSkill) return;
    const { finalScore, scoreBreakdown = {}, weakSkills = [], missingSkills = [], matchedSkills = [], career } = activeWhatIfItem;

    const levelRadio = document.querySelector('input[name="whatIfLevel"]:checked');
    const targetLevel = levelRadio ? levelRadio.value : 'Intermediate';

    const totalSkills = Math.max(1, (matchedSkills.length + weakSkills.length + missingSkills.length));

    // Transparent calculation strictly conforming to 60% skills + 25% interests + 15% education
    let factor = 0.35;
    if (selectedSkill.type === 'Developing') {
      factor = targetLevel === 'Advanced' ? 0.50 : 0.30;
    } else {
      factor = targetLevel === 'Advanced' ? 0.90 : 0.70;
    }

    const skillBoost = Math.round((factor / totalSkills) * 100);
    const currentSkillMatch = scoreBreakdown.skillMatch || 50;
    const newSkillMatch = Math.min(100, currentSkillMatch + skillBoost);

    const newFinalScore = Math.min(99, Math.round(
      newSkillMatch * 0.60 +
      (scoreBreakdown.interestMatch || 0) * 0.25 +
      (scoreBreakdown.educationMatch || 0) * 0.15
    ));

    const delta = Math.max(1, newFinalScore - finalScore);
    const oldGaps = weakSkills.length + missingSkills.length;
    const newGaps = Math.max(0, oldGaps - 1);
    const oldDuration = oldGaps >= 4 ? 8 : 4;
    const newDuration = Math.max(4, oldDuration - (delta >= 12 ? 3 : delta >= 6 ? 2 : 1));
    const savedWeeks = Math.max(1, oldDuration - newDuration);

    if (whatIfDeltaBadge) whatIfDeltaBadge.textContent = `+${delta}% Boost`;
    if (whatIfBeforeScore) whatIfBeforeScore.textContent = `${finalScore}%`;
    if (whatIfAfterScore) whatIfAfterScore.textContent = `${newFinalScore}%`;
    if (whatIfBeforeGaps) whatIfBeforeGaps.textContent = `${oldGaps}`;
    if (whatIfAfterGaps) whatIfAfterGaps.textContent = `${newGaps}`;
    if (whatIfBeforeDuration) whatIfBeforeDuration.textContent = `${oldDuration} Wks`;
    if (whatIfAfterDuration) whatIfAfterDuration.textContent = `${newDuration} Wks`;

    if (whatIfSkillContext) {
      whatIfSkillContext.innerHTML = `<span class="text-teal fw-semibold">${escapeHtml(selectedSkill.displayName || selectedSkill.name)}</span> is a core skill (${selectedSkill.type}). Target: <strong class="text-ink">${targetLevel}</strong>.`;
    }

    if (whatIfNarrativeText) {
      whatIfNarrativeText.innerHTML = `
        Upgrading <strong class="text-ink">${escapeHtml(selectedSkill.displayName || selectedSkill.name)}</strong> from <em>${escapeHtml(selectedSkill.currentProf)}</em> to <strong>${targetLevel}</strong> resolves a high-impact bottleneck for ${escapeHtml(career.title)}.
        By strengthening the 60% skill match component from ${currentSkillMatch}% to ${newSkillMatch}%, your career match jumps from <span class="text-muted text-decoration-line-through">${finalScore}%</span> to <strong class="text-success">${newFinalScore}%</strong> (+${delta}%), shortening your placement-readiness timeline by <strong>${savedWeeks} ${savedWeeks === 1 ? 'week' : 'weeks'}</strong>.
      `;
    }
  };

  // Wire What-If Simulator interactive controls
  if (whatIfSkillSelect) {
    whatIfSkillSelect.addEventListener('change', () => {
      if (!activeWhatIfItem) return;
      const candidateSkills = [
        ...activeWhatIfItem.weakSkills.map(s => ({ ...s, type: 'Developing', currentProf: s.userProficiency || 'Beginner' })),
        ...activeWhatIfItem.missingSkills.map(s => ({ ...s, type: 'Missing', currentProf: 'None' }))
      ];
      const idx = parseInt(whatIfSkillSelect.value, 10);
      if (!isNaN(idx) && candidateSkills[idx]) {
        runWhatIfCalculation(candidateSkills[idx], candidateSkills);
      }
    });
  }

  document.querySelectorAll('input[name="whatIfLevel"]').forEach(radio => {
    radio.addEventListener('change', () => {
      if (!activeWhatIfItem) return;
      const candidateSkills = [
        ...activeWhatIfItem.weakSkills.map(s => ({ ...s, type: 'Developing', currentProf: s.userProficiency || 'Beginner' })),
        ...activeWhatIfItem.missingSkills.map(s => ({ ...s, type: 'Missing', currentProf: 'None' }))
      ];
      const idx = parseInt(whatIfSkillSelect.value, 10);
      if (!isNaN(idx) && candidateSkills[idx]) {
        runWhatIfCalculation(candidateSkills[idx], candidateSkills);
      }
    });
  });

  if (whatIfApplyRoadmapBtn) {
    whatIfApplyRoadmapBtn.addEventListener('click', () => {
      if (!activeWhatIfItem) return;
      if (whatIfModal) whatIfModal.hide();
      selectedCareerTitle = activeWhatIfItem.career.title;
      selectedCareerSlug = activeWhatIfItem.career.slug;
      if (modalCareerTitle) modalCareerTitle.textContent = selectedCareerTitle;
      setTimeout(() => {
        if (roadmapModal) roadmapModal.show();
      }, 300);
    });
  }

  let selectedCareerSlug = null;
  let selectedCareerTitle = null;

  let activeJobsCareerSlug = null;
  let activeJobsCareerTitle = null;

  // Load and render real-time market jobs for a career track
  const loadJobsForCareer = async (slug, title, isGlobalRemote = false) => {
    activeJobsCareerSlug = slug;
    activeJobsCareerTitle = title;

    if (jobsModalCareerTitle) jobsModalCareerTitle.textContent = title;
    if (jobsLoadingState) jobsLoadingState.classList.remove('d-none');
    if (jobsListContainer) {
      jobsListContainer.classList.add('d-none');
      jobsListContainer.innerHTML = '';
    }
    if (jobsEmptyState) jobsEmptyState.classList.add('d-none');

    if (liveJobsModal) {
      liveJobsModal.show();
    }

    try {
      const res = await window.API.get(`/jobs/career/${slug}`, {
        query: { globalRemote: isGlobalRemote ? 'true' : 'false', limit: 8 }
      });

      if (jobsLoadingState) jobsLoadingState.classList.add('d-none');

      const jobs = res.data?.jobs || [];
      if (jobs.length === 0) {
        if (jobsEmptyState) jobsEmptyState.classList.remove('d-none');
        return;
      }

      if (jobsListContainer) {
        jobsListContainer.classList.remove('d-none');
        jobsListContainer.innerHTML = jobs.map(job => `
          <div class="job-item-card">
            <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-start gap-2 mb-2">
              <div>
                <h4 class="h6 fw-bold text-ink mb-1 d-flex align-items-center gap-2 flex-wrap">
                  <span>${escapeHtml(job.title)}</span>
                  ${job.globalRemote ? '<span class="atlas-badge text-teal border-teal"><i class="bi bi-globe me-1"></i>Worldwide Remote</span>' : ''}
                </h4>
                <div class="job-company-tag d-flex align-items-center gap-2 flex-wrap">
                  <span><i class="bi bi-building me-1 text-cyan"></i>${escapeHtml(job.companyName)}</span>
                  <span>•</span>
                  <span><i class="bi bi-geo-alt me-1 text-muted"></i>${escapeHtml(job.location)}</span>
                  <span>•</span>
                  <span class="text-secondary font-mono small">${escapeHtml(job.source || 'Live API')}</span>
                </div>
              </div>
              <div class="d-flex align-items-center gap-2 flex-wrap">
                <span class="job-salary-badge">
                  <i class="bi bi-cash-stack me-1"></i>${escapeHtml(job.salaryText)}
                </span>
                <span class="job-remote-badge text-uppercase">
                  ${escapeHtml(job.workplace)}
                </span>
              </div>
            </div>

            <!-- Tags & Direct Apply -->
            <div class="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3 pt-2 border-top border-line mt-2">
              <div class="d-flex flex-wrap gap-1">
                ${(job.tags || []).map(t => `<span class="badge skill-pill matched-pill font-mono" style="font-size: 0.68rem;">#${escapeHtml(t)}</span>`).join('')}
              </div>
              <a href="${escapeHtml(job.url)}" target="_blank" rel="noopener noreferrer" class="btn cp-btn-primary btn-sm px-3 py-1 text-nowrap">
                <span>View & Apply</span>
                <i class="bi bi-box-arrow-up-right ms-1 small"></i>
              </a>
            </div>
          </div>
        `).join('');
      }
    } catch (err) {
      if (jobsLoadingState) jobsLoadingState.classList.add('d-none');
      if (jobsEmptyState) {
        jobsEmptyState.classList.remove('d-none');
        const h4 = jobsEmptyState.querySelector('h4');
        const p = jobsEmptyState.querySelector('p');
        if (h4) h4.textContent = 'Could not load live jobs';
        if (p) p.textContent = err.message || 'Please check your connection and try again.';
      }
    }
  };

  // Switch filter between all and global remote
  if (filterGlobalRemote) {
    filterGlobalRemote.addEventListener('change', (e) => {
      if (activeJobsCareerSlug) {
        loadJobsForCareer(activeJobsCareerSlug, activeJobsCareerTitle, e.target.checked);
      }
    });
  }

  // Duration option radio selection styling
  document.querySelectorAll('input[name="durationWeeks"]').forEach((radio) => {
    radio.addEventListener('change', (e) => {
      document.querySelectorAll('.duration-option').forEach((el) => el.classList.remove('active-option'));
      const parentLabel = e.target.closest('.duration-option');
      if (parentLabel) {
        parentLabel.classList.add('active-option');
      }
    });
  });

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

  // 3. Fetch Recommendations
  const renderSkillMap = (recommendation) => {
    const map = document.getElementById('skillTileMap');
    if (!map || !recommendation) return;

    if (skillOrbitTitle) {
      skillOrbitTitle.textContent = `${recommendation.career.title} — Skill Map`;
    }

    const groups = [
      { label: 'Matched', className: 'matched', skills: recommendation.matchedSkills || [] },
      { label: 'Developing', className: 'weak', skills: recommendation.weakSkills || [] },
      { label: 'Missing', className: 'missing', skills: recommendation.missingSkills || [] },
    ];
    const skills = groups.flatMap((group) => group.skills.map((skill) => ({ ...skill, status: group.label, statusClass: group.className })));

    if (!skills.length) {
      map.innerHTML = '<p class="text-muted small mb-0">No skill details are available for this career yet.</p>';
      return;
    }

    map.innerHTML = skills.map((skill) => {
      const name = skill.displayName || skill.name || 'Skill';
      const skillId = String(skill.name || name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const mark = name.trim().split(/[\s/.-]+/).filter(Boolean).slice(0, 2).map((word) => word[0]).join('').toUpperCase();
      return `
        <button class="career-skill-tile skill-status-${skill.statusClass}" type="button"
          data-skill-id="${escapeHtml(skillId)}" data-skill-name="${escapeHtml(name)}"
          data-skill-status="${escapeHtml(skill.status)}" data-skill-category="${escapeHtml(skill.category || 'Technology')}"
          aria-haspopup="dialog" aria-controls="skillDetailDialog" aria-label="Learn ${escapeHtml(name)} (${skill.status})">
          <span class="career-skill-mark" aria-hidden="true">${escapeHtml(mark || 'S')}</span>
          <span class="career-skill-copy"><strong>${escapeHtml(name)}</strong><span>${escapeHtml(skill.status)}</span></span>
          <i class="bi bi-arrow-up-right skill-tile-arrow" aria-hidden="true"></i>
        </button>
      `;
    }).join('');
  };

  const loadRecommendations = async () => {
    try {
      const response = await window.API.post('/recommendations/generate', {}, { auth: true });

      loadingState.classList.add('d-none');

      if (response.success && response.data?.recommendations) {
        const recommendations = response.data.recommendations;

        if (recommendations.length === 0) {
          showAlert('No career recommendations could be computed. Please check your assessment inputs.', 'warning');
          return;
        }

        renderRecommendations(recommendations, response.data.profileSummary);

        renderSkillMap(recommendations[0]);
      } else {
        showAlert(response.message || 'Unable to generate recommendations.');
      }
    } catch (err) {
      loadingState.classList.add('d-none');

      if (
        err.status === 400 || err.status === 404 || err.status === 422 ||
        (err.message && err.message.toLowerCase().includes('complete your profile'))
      ) {
        incompleteState.classList.remove('d-none');
      } else if (err.isNetworkError || err.message === 'Failed to fetch') {
        showAlert('Network error: server is unreachable. Please check your connection.');
      } else if (err.status === 401) {
        window.location.href = '/login.html';
      } else {
        showAlert(err.message || 'Failed to load recommendations. Please try again.');
      }
    }
  };

  // 4. Render Recommendations Cards
  const renderRecommendations = (recommendations, profileSummary) => {
    container.classList.remove('d-none');
    container.innerHTML = '';

    recommendations.forEach((item, index) => {
      const { rank, career, finalScore, scoreBreakdown, whyRecommended, matchedSkills = [], weakSkills = [], missingSkills = [], aiBrief } = item;
      const isTopRank = rank === 1;
      const fpMetrics = getFutureProofMetrics(career.slug || career.id, career.category);

      const card = document.createElement('div');
      card.className = `recommendation-card card p-4 p-md-5 mb-4 ${isTopRank ? 'top-match-card' : 'secondary-match-card'}`;

      card.innerHTML = `
        <!-- Header: Top Match Badge / Rank & Title -->
        <div class="row align-items-center mb-4 g-3">
          <div class="col-md-8">
            <div class="d-flex align-items-center gap-2 mb-2 flex-wrap">
              <span class="badge ${isTopRank ? 'badge-navy' : 'cp-tag'} px-3 py-1 font-mono">
                ${isTopRank ? '★ BEST ROUTE FOR NOW' : `ROUTE #${rank}`}
              </span>
              <span class="atlas-badge">
                ${escapeHtml(career.category)}
              </span>
            </div>
            <h2 class="h3 fw-bold text-ink mb-2 d-flex align-items-center gap-2">
              <i class="bi ${career.icon || 'bi-signpost-2-fill'} text-teal"></i>
              <span>${escapeHtml(career.title)}</span>
            </h2>
            <p class="text-muted small mb-0" style="max-width: 650px;">
              ${escapeHtml(career.shortDescription)}
            </p>
            <div class="mt-2 d-flex align-items-center gap-2 flex-wrap">
              <div class="future-proof-pill d-inline-flex align-items-center gap-2 px-3 py-1 rounded-pill">
                <i class="bi bi-shield-check text-cyan"></i>
                <span class="small fw-semibold text-ink" style="font-size: 0.78rem;">Future-Proof:</span>
                <span class="badge font-mono ${fpMetrics.score >= 88 ? 'bg-success' : 'bg-primary'}" style="font-size: 0.72rem;">${fpMetrics.score}/100</span>
                <span class="text-muted font-mono" style="font-size: 0.72rem;">· ${fpMetrics.rating}</span>
                <button type="button" class="btn btn-link p-0 text-cyan ms-1 future-proof-info-btn" data-career-title="${escapeHtml(career.title)}" data-career-slug="${escapeHtml(career.slug || '')}" data-career-category="${escapeHtml(career.category || '')}" title="View Future-Proof Score formula & breakdown">
                  <i class="bi bi-info-circle"></i>
                </button>
              </div>
            </div>
          </div>

          <!-- Career Fit Score Gauge -->
          <div class="col-md-4 text-md-end">
            <div class="match-score-badge d-inline-block text-center p-3">
              <div class="display-6 fw-bold text-primary font-mono">
                ${finalScore}%
              </div>
              <div class="text-muted small font-mono text-uppercase" style="font-size: 0.68rem; letter-spacing: 0.05em;">
                Career Fit
              </div>
              <div class="text-muted" style="font-size: 0.65rem;">Based on skills, interests, education</div>
            </div>
          </div>
        </div>

        <!-- Score Breakdown Meters -->
        <div class="score-breakdown-box mb-4">
          <div class="row g-3">
            <!-- Skill Match (60%) -->
            <div class="col-sm-4">
              <div class="d-flex justify-content-between text-muted small mb-1">
                <span><i class="bi bi-tools text-teal me-1"></i> Skills (60%)</span>
                <span class="text-ink fw-bold font-mono">${scoreBreakdown.skillMatch}%</span>
              </div>
              <div class="progress" style="height: 6px;">
                <div class="progress-bar bg-info" role="progressbar" style="width: ${scoreBreakdown.skillMatch}%;" aria-valuenow="${scoreBreakdown.skillMatch}" aria-valuemin="0" aria-valuemax="100"></div>
              </div>
            </div>

            <!-- Interest Match (25%) -->
            <div class="col-sm-4">
              <div class="d-flex justify-content-between text-muted small mb-1">
                <span><i class="bi bi-heart text-teal me-1"></i> Interests (25%)</span>
                <span class="text-ink fw-bold font-mono">${scoreBreakdown.interestMatch}%</span>
              </div>
              <div class="progress" style="height: 6px;">
                <div class="progress-bar bg-primary" role="progressbar" style="width: ${scoreBreakdown.interestMatch}%;" aria-valuenow="${scoreBreakdown.interestMatch}" aria-valuemin="0" aria-valuemax="100"></div>
              </div>
            </div>

            <!-- Education Match (15%) -->
            <div class="col-sm-4">
              <div class="d-flex justify-content-between text-muted small mb-1">
                <span><i class="bi bi-mortarboard text-gold me-1"></i> Education (15%)</span>
                <span class="text-ink fw-bold font-mono">${scoreBreakdown.educationMatch}%</span>
              </div>
              <div class="progress" style="height: 6px;">
                <div class="progress-bar bg-warning" role="progressbar" style="width: ${scoreBreakdown.educationMatch}%;" aria-valuenow="${scoreBreakdown.educationMatch}" aria-valuemin="0" aria-valuemax="100"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- AI-Powered Career Fit Brief & Market Telemetry -->
        ${aiBrief ? `
        <div class="ai-brief-card p-3 p-md-4 mb-4">
          <div class="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
            <div class="d-flex align-items-center gap-2">
              <span class="badge-ai-pulse"><span class="pulse-dot"></span> AI CAREER BRIEF</span>
              <span class="font-mono text-muted" style="font-size: 0.7rem;">2026–27 INDUSTRY TELEMETRY</span>
            </div>
            <div class="d-flex align-items-center gap-2 font-mono text-cyan" style="font-size: 0.85rem;">
              <i class="bi bi-cash-stack"></i> <strong>${escapeHtml(aiBrief.salaryRange)}</strong>
            </div>
          </div>

          <div class="row g-3">
            <div class="col-md-7">
              <div class="ai-brief-text small mb-2">
                <i class="bi bi-stars text-cyan me-1"></i>
                <strong class="text-ink">Why You Fit:</strong> ${escapeHtml(aiBrief.whyYouFit)}
              </div>
              ${aiBrief.actionableTip ? `
              <div class="ai-brief-tip small text-muted mt-2">
                <strong class="text-ink"><i class="bi bi-lightbulb-fill text-gold me-1"></i>Actionable Pro-Tip:</strong> ${escapeHtml(aiBrief.actionableTip)}
              </div>` : ''}
            </div>

            <div class="col-md-5">
              <div class="ai-bottleneck-box p-3">
                <div class="font-mono text-rose fw-bold mb-1" style="font-size: 0.72rem; letter-spacing: 0.05em;">
                  <i class="bi bi-exclamation-octagon-fill me-1"></i> KEY BOTTLENECK
                </div>
                <div class="small text-secondary">${escapeHtml(aiBrief.keyBottleneck)}</div>
              </div>
              <div class="mt-2 text-muted font-mono" style="font-size: 0.72rem;">
                <i class="bi bi-graph-up-arrow text-emerald me-1"></i> ${escapeHtml(aiBrief.hiringDemand)}
              </div>
            </div>
          </div>
        </div>
        ` : `
        <!-- Fallback Why Recommended Context -->
        <div class="why-recommended-banner mb-4 d-flex align-items-start gap-3">
          <i class="bi bi-info-circle text-teal fs-5 mt-1 flex-shrink-0"></i>
          <div>
            <span class="fw-bold small d-block mb-1">Evaluation Rationale:</span>
            <p class="small mb-0">${escapeHtml(whyRecommended)}</p>
          </div>
        </div>
        `}

        <!-- Skill Gap Analysis Grid -->
        <div class="skill-gap-analysis mb-4">
          <div class="text-xs font-mono text-muted text-uppercase fw-bold mb-2">
            Skill Breakdown
          </div>

          <div class="row g-3">
            <!-- 1. Matched Skills (Green) -->
            <div class="col-md-4">
              <div class="gap-column">
                <div class="d-flex align-items-center justify-content-between mb-2">
                  <span class="text-leaf small fw-bold text-uppercase">
                    <i class="bi bi-check-circle-fill me-1"></i> Matched (${matchedSkills.length})
                  </span>
                </div>
                <div class="d-flex flex-wrap gap-1">
                  ${
                    matchedSkills.length > 0
                      ? matchedSkills
                          .map(
                            (s) => `
                        <span class="badge skill-pill matched-pill" title="Proficiency: ${s.userProficiency}">
                          <i class="bi bi-check2"></i> ${escapeHtml(s.displayName)}
                        </span>
                      `
                          )
                          .join('')
                      : '<span class="text-muted small fst-italic">None matched yet</span>'
                  }
                </div>
              </div>
            </div>

            <!-- 2. Weak Skills (Gold) -->
            <div class="col-md-4">
              <div class="gap-column">
                <div class="d-flex align-items-center justify-content-between mb-2">
                  <span class="text-gold small fw-bold text-uppercase">
                    <i class="bi bi-arrow-up-circle-fill me-1"></i> Developing (${weakSkills.length})
                  </span>
                </div>
                <div class="d-flex flex-wrap gap-1">
                  ${
                    weakSkills.length > 0
                      ? weakSkills
                          .map(
                            (s) => `
                        <span class="badge skill-pill weak-pill" title="Current: ${s.userProficiency}, Required: ${s.requiredProficiency}">
                          <i class="bi bi-arrow-up"></i> ${escapeHtml(s.displayName)}
                        </span>
                      `
                          )
                          .join('')
                      : '<span class="text-muted small fst-italic">No skills needing upgrades</span>'
                  }
                </div>
              </div>
            </div>

            <!-- 3. Missing Skills (Coral) -->
            <div class="col-md-4">
              <div class="gap-column">
                <div class="d-flex align-items-center justify-content-between mb-2">
                  <span class="text-coral small fw-bold text-uppercase">
                    <i class="bi bi-plus-circle-fill me-1"></i> Missing (${missingSkills.length})
                  </span>
                </div>
                <div class="d-flex flex-wrap gap-1">
                  ${
                    missingSkills.length > 0
                      ? missingSkills
                          .map(
                            (s) => `
                        <span class="badge skill-pill missing-pill" title="Required: ${s.requiredProficiency} (${s.importance} importance)">
                          <i class="bi bi-plus"></i> ${escapeHtml(s.displayName)}
                        </span>
                      `
                          )
                          .join('')
                      : '<span class="text-muted small fst-italic">No missing core skills</span>'
                  }
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Action Footer -->
        <div class="d-flex flex-column flex-sm-row justify-content-between align-items-center gap-3 pt-3 border-top">
          <div class="text-muted small">
            <i class="bi bi-compass me-1 text-teal"></i> ${missingSkills.length + weakSkills.length} skills to strengthen for this career trajectory
          </div>
          <div class="d-flex align-items-center gap-2 flex-wrap">
            <button
              type="button"
              class="btn what-if-btn btn-sm px-3 py-2 fw-semibold"
              data-career-title="${escapeHtml(career.title)}"
              data-career-slug="${escapeHtml(career.slug)}"
            >
              <i class="bi bi-lightning-charge-fill text-warning me-1"></i>
              <span>What-If Simulator</span>
            </button>
            <button
              type="button"
              class="btn cp-btn-outline btn-sm px-3 py-2 fw-semibold view-jobs-btn"
              data-career-title="${escapeHtml(career.title)}"
              data-career-slug="${escapeHtml(career.slug)}"
            >
              <i class="bi bi-briefcase-fill text-cyan me-1"></i>
              <span>Live Market Jobs</span>
            </button>
            <button
              type="button"
              class="btn ${isTopRank ? 'cp-btn-primary' : 'cp-btn-outline'} btn-sm px-4 py-2 fw-semibold choose-career-btn"
              data-career-title="${escapeHtml(career.title)}"
              data-career-slug="${escapeHtml(career.slug)}"
            >
              <span>Build Roadmap for ${escapeHtml(career.title)}</span>
              <i class="bi bi-arrow-right ms-1"></i>
            </button>
          </div>
        </div>
      `;

      // Bind Future-Proof Info button click
      const fpBtn = card.querySelector('.future-proof-info-btn');
      if (fpBtn) {
        fpBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          const title = fpBtn.getAttribute('data-career-title');
          const slug = fpBtn.getAttribute('data-career-slug');
          const cat = fpBtn.getAttribute('data-career-category');
          openFutureProofModal(title, slug, cat);
        });
      }

      // Bind What-If Simulator button click
      const whatIfBtn = card.querySelector('.what-if-btn');
      if (whatIfBtn) {
        whatIfBtn.addEventListener('click', () => {
          openWhatIfSimulator(item);
        });
      }

      // Bind View Live Jobs button click
      const viewJobsBtn = card.querySelector('.view-jobs-btn');
      if (viewJobsBtn) {
        viewJobsBtn.addEventListener('click', () => {
          const title = viewJobsBtn.getAttribute('data-career-title');
          const slug = viewJobsBtn.getAttribute('data-career-slug');
          const isGlobal = filterGlobalRemote ? filterGlobalRemote.checked : false;
          loadJobsForCareer(slug, title, isGlobal);
        });
      }

      // Bind Choose Career button click
      const chooseBtn = card.querySelector('.choose-career-btn');
      chooseBtn.addEventListener('click', () => {
        selectedCareerTitle = chooseBtn.getAttribute('data-career-title');
        selectedCareerSlug = chooseBtn.getAttribute('data-career-slug');
        if (modalCareerTitle) modalCareerTitle.textContent = selectedCareerTitle;

        if (roadmapModal) {
          roadmapModal.show();
        }
      });

      container.appendChild(card);
    });
  };

  // Handle roadmap generation confirmation
  if (btnConfirmGenerate) {
    btnConfirmGenerate.addEventListener('click', async () => {
      if (!selectedCareerSlug) return;

      const selectedDurationRadio = document.querySelector('input[name="durationWeeks"]:checked');
      const durationWeeks = selectedDurationRadio ? parseInt(selectedDurationRadio.value, 10) : 8;

      const btnText = btnConfirmGenerate.querySelector('.btn-text');
      const spinner = btnConfirmGenerate.querySelector('.spinner-border');

      try {
        btnConfirmGenerate.disabled = true;
        btnConfirmGenerate.setAttribute('data-generating', 'true');
        if (btnText) btnText.textContent = 'Generating Roadmap...';
        if (spinner) spinner.classList.remove('d-none');

        const res = await window.API.post(
          '/roadmaps/generate',
          { careerSlug: selectedCareerSlug, durationWeeks },
          { auth: true }
        );

        if (res.success) {
          if (roadmapModal) roadmapModal.hide();
          showAlert('Personalized roadmap created successfully! Redirecting...', 'success');
          setTimeout(() => {
            window.location.href = 'roadmap.html';
          }, 600);
          return;
        } else {
          showAlert(res.message || 'Failed to generate roadmap.', 'danger');
        }
      } catch (err) {
        console.error('Roadmap generation error:', err);
        showAlert(err.message || 'An error occurred while generating roadmap.', 'danger');
      } finally {
        if (!window.location.href.includes('roadmap.html')) {
          btnConfirmGenerate.disabled = false;
          btnConfirmGenerate.removeAttribute('data-generating');
          if (btnText) btnText.innerHTML = '<i class="bi bi-map me-1"></i> Build My Roadmap';
          if (spinner) spinner.classList.add('d-none');
        }
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

  // Load recommendations
  loadRecommendations();
});
