/**
 * recommendations.js — Career Recommendations & Skill Gap Analysis
 *
 * Calls POST /api/recommendations/generate, displays the top ranked careers,
 * renders skill gap indicators (matched/developing/missing), score breakdown bars,
 * mounts 3D Skill Map, and wires duration selection modal for roadmap generation.
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

  let roadmapModal = null;
  if (roadmapModalEl && typeof bootstrap !== 'undefined') {
    roadmapModal = new bootstrap.Modal(roadmapModalEl);
  }

  let selectedCareerSlug = null;
  let selectedCareerTitle = null;

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

        // Mount 3D Skill Map for top match
        const topRec = recommendations[0];
        if (topRec && window.initSkillOrbit) {
          if (skillOrbitTitle) {
            skillOrbitTitle.textContent = `${topRec.career.title} — Skill Map`;
          }
          window.initSkillOrbit('skill-orbit', {
            careerTitle: topRec.career.title,
            matchedSkills: topRec.matchedSkills,
            weakSkills: topRec.weakSkills,
            missingSkills: topRec.missingSkills,
          });
        }
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
      const { rank, career, finalScore, scoreBreakdown, whyRecommended, matchedSkills, weakSkills, missingSkills, aiBrief } = item;
      const isTopRank = rank === 1;

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
            <h2 class="h3 fw-bold text-white mb-2 d-flex align-items-center gap-2">
              <i class="bi ${career.icon || 'bi-signpost-2-fill'} text-teal"></i>
              <span>${escapeHtml(career.title)}</span>
            </h2>
            <p class="text-muted small mb-0" style="max-width: 650px;">
              ${escapeHtml(career.shortDescription)}
            </p>
          </div>

          <!-- Career Fit Score Gauge -->
          <div class="col-md-4 text-md-end">
            <div class="match-score-badge d-inline-block text-center p-3">
              <div class="display-6 fw-bold text-white font-mono">
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
                <span class="text-white fw-bold font-mono">${scoreBreakdown.skillMatch}%</span>
              </div>
              <div class="progress" style="height: 6px;">
                <div class="progress-bar bg-info" role="progressbar" style="width: ${scoreBreakdown.skillMatch}%;" aria-valuenow="${scoreBreakdown.skillMatch}" aria-valuemin="0" aria-valuemax="100"></div>
              </div>
            </div>

            <!-- Interest Match (25%) -->
            <div class="col-sm-4">
              <div class="d-flex justify-content-between text-muted small mb-1">
                <span><i class="bi bi-heart text-teal me-1"></i> Interests (25%)</span>
                <span class="text-white fw-bold font-mono">${scoreBreakdown.interestMatch}%</span>
              </div>
              <div class="progress" style="height: 6px;">
                <div class="progress-bar bg-primary" role="progressbar" style="width: ${scoreBreakdown.interestMatch}%;" aria-valuenow="${scoreBreakdown.interestMatch}" aria-valuemin="0" aria-valuemax="100"></div>
              </div>
            </div>

            <!-- Education Match (15%) -->
            <div class="col-sm-4">
              <div class="d-flex justify-content-between text-muted small mb-1">
                <span><i class="bi bi-mortarboard text-gold me-1"></i> Education (15%)</span>
                <span class="text-white fw-bold font-mono">${scoreBreakdown.educationMatch}%</span>
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
                <strong class="text-white">Why You Fit:</strong> ${escapeHtml(aiBrief.whyYouFit)}
              </div>
              ${aiBrief.actionableTip ? `
              <div class="ai-brief-tip small text-muted mt-2">
                <strong class="text-white"><i class="bi bi-lightbulb-fill text-gold me-1"></i>Actionable Pro-Tip:</strong> ${escapeHtml(aiBrief.actionableTip)}
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
      `;

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
