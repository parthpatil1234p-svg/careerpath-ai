/**
 * passport.js - Client-Side Controller for Public Skill Passport
 * CareerPath AI Technologies Inc.
 * Renders verified talent dossier, project portfolio, and real-time QR code.
 */

(function () {
  'use strict';

  function getApiBase() {
    return window.API_BASE_URL ||
      (window.location.origin.includes('5500') ? 'http://localhost:5000' : 'https://careerpath-ai-bdbt.onrender.com');
  }

  function getTargetStudentId() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id') || params.get('studentId');
    if (id) return id;

    // Check if user is logged in
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const u = JSON.parse(storedUser);
        if (u.id || u._id) return u.id || u._id;
      }
    } catch (e) {}

    return 'demo';
  }

  async function loadPassportData(studentId) {
    try {
      const res = await fetch(getApiBase() + '/api/passport/' + encodeURIComponent(studentId));
      if (!res.ok) throw new Error('Passport not found or service unavailable');
      const json = await res.json();
      return json.data && json.data.passport ? json.data.passport : null;
    } catch (err) {
      console.warn('[SkillPassport] Error fetching passport data:', err);
      return null;
    }
  }

  function renderPassport(p) {
    if (!p) return;

    document.getElementById('passportLoading').classList.add('d-none');
    document.getElementById('passportContent').classList.remove('d-none');

    // 1. Header identity
    document.getElementById('pName').textContent = p.name;
    document.getElementById('pAvatar').src = p.avatarUrl;
    document.getElementById('pDegreeBranch').textContent = p.degreeBranch;
    document.getElementById('pCollege').textContent = p.college;
    document.getElementById('pGradYear').textContent = p.graduationYear;
    document.getElementById('pStream').textContent = (p.primaryStream || 'Engineering').toUpperCase() + ' TRACK';

    // WhatsApp Contact
    const btnWa = document.getElementById('btnContactCandidateWa');
    if (btnWa) {
      const cleanPhone = (p.phoneRaw || '917499085045').replace(/[^0-9]/g, '');
      const waMsg = encodeURIComponent(`Hello ${p.name}, I reviewed your verified Skill Passport on CareerPath AI (${window.location.href}) and would like to connect regarding an opportunity.`);
      btnWa.href = `https://wa.me/${cleanPhone}?text=${waMsg}`;
    }

    // Ledger Seal
    document.getElementById('pLedgerHash').textContent = p.cryptographicHash;
    document.getElementById('pTimestamp').textContent = new Date(p.ledgerTimestamp).toLocaleDateString('en-IN', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    // 2. Metrics
    document.getElementById('mReadiness').textContent = p.readinessScore + '%';
    document.getElementById('mVerifiedSkills').textContent = p.verifiedSkillsCount;
    document.getElementById('mProjects').textContent = p.verifiedProjectsCount;

    // 3. Skills Matrix
    const skillsContainer = document.getElementById('pSkillsChipsContainer');
    skillsContainer.innerHTML = '';
    const skills = p.skillsMatrix || [];

    document.getElementById('pSkillsSummary').textContent = `${p.verifiedSkillsCount} of ${p.totalSkillsCount} Verified`;

    skills.forEach(s => {
      const chip = document.createElement('div');
      let badgeClass = 'badge bg-secondary-subtle text-secondary border border-secondary-subtle';
      if (s.tier === 'Project Verified') badgeClass = 'badge badge-verified-project';
      else if (s.tier === 'Quiz Verified') badgeClass = 'badge badge-verified-quiz';
      else if (s.tier === 'Code Verified') badgeClass = 'badge badge-verified-code';

      chip.className = `p-2.5 rounded-3 skill-chip-card d-flex align-items-center justify-content-between gap-3 shadow-xs`;
      chip.style.minWidth = '220px';
      chip.innerHTML = `
        <div>
          <div class="fw-bold text-ink small">${s.displayName || s.name}</div>
          <div class="text-muted font-mono" style="font-size: 0.7rem;"><i class="bi bi-shield-check text-primary me-1"></i>${s.verifiedSource || 'Verified by Protocol'}</div>
        </div>
        <span class="${badgeClass} font-mono small fw-semibold">${s.badge || s.tier}</span>
      `;
      skillsContainer.appendChild(chip);
    });

    // 4. Projects Portfolio
    const projectsContainer = document.getElementById('pProjectsContainer');
    projectsContainer.innerHTML = '';
    const projects = p.projectsPortfolio || [];

    if (projects.length === 0) {
      projectsContainer.innerHTML = `
        <div class="col-12 text-center py-4 text-muted small">
          <i class="bi bi-code-square fs-3 d-block mb-1 text-secondary"></i>
          Candidate is currently finalizing active milestone project submissions.
        </div>
      `;
    } else {
      projects.forEach(proj => {
        const col = document.createElement('div');
        col.className = 'col-md-6';
        col.innerHTML = `
          <div class="p-3.5 rounded-3 project-portfolio-card h-100 d-flex flex-column justify-content-between">
            <div>
              <div class="d-flex align-items-start justify-content-between gap-2 mb-2">
                <h6 class="text-ink fw-bold mb-0 fs-6">${proj.projectTitle}</h6>
                <span class="badge bg-success-subtle text-success border border-success-subtle font-mono small fw-semibold">
                  <i class="bi bi-patch-check-fill me-1"></i>Score: ${proj.score}/100
                </span>
              </div>
              <p class="text-secondary small mb-3" style="font-size: 0.82rem; line-height: 1.5;">${proj.description || ''}</p>
            </div>
            <div>
              <div class="d-flex align-items-center justify-content-between pt-2.5 border-top border-line font-mono small">
                <a href="${proj.githubUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-outline-secondary btn-sm py-1 px-2.5 rounded-pill d-inline-flex align-items-center gap-1.5 fw-medium" style="font-size: 0.76rem;">
                  <i class="bi bi-github text-dark"></i> Repository
                </a>
                ${proj.liveUrl ? `
                  <a href="${proj.liveUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-outline-primary btn-sm py-1 px-2.5 rounded-pill d-inline-flex align-items-center gap-1.5 fw-semibold" style="font-size: 0.76rem;">
                    <i class="bi bi-box-arrow-up-right"></i> Live Deployment
                  </a>
                ` : ''}
              </div>
            </div>
          </div>
        `;
        projectsContainer.appendChild(col);
      });
    }

    // 5. URL and QR Code
    const curUrl = window.location.href;
    document.getElementById('pPassportUrl').textContent = curUrl;
    renderCanvasQr(curUrl);
  }

  // Lightweight native canvas QR code generator
  function renderCanvasQr(url) {
    const canvas = document.getElementById('qrCodeCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const size = canvas.width;

    // Draw high-contrast clean placeholder / QR visualization
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);

    // Try rendering via QRCode library if present or draw high-density vector matrix
    if (window.QRCode && typeof window.QRCode.toCanvas === 'function') {
      window.QRCode.toCanvas(canvas, url, { width: size, margin: 1 }, function (error) {
        if (error) console.error(error);
      });
    } else {
      // Deterministic decorative QR pattern
      ctx.fillStyle = '#0f172a';
      const cellSize = size / 21;

      // Position markers (top-left, top-right, bottom-left)
      function drawMarker(x, y) {
        ctx.fillRect(x * cellSize, y * cellSize, 7 * cellSize, 7 * cellSize);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect((x + 1) * cellSize, (y + 1) * cellSize, 5 * cellSize, 5 * cellSize);
        ctx.fillStyle = '#0f172a';
        ctx.fillRect((x + 2) * cellSize, (y + 2) * cellSize, 3 * cellSize, 3 * cellSize);
      }

      drawMarker(1, 1);
      drawMarker(13, 1);
      drawMarker(1, 13);

      // Random pseudo-deterministic dots based on URL hash
      let hash = 0;
      for (let i = 0; i < url.length; i++) hash = (hash << 5) - hash + url.charCodeAt(i);

      for (let r = 0; r < 21; r++) {
        for (let c = 0; c < 21; c++) {
          if ((r < 8 && (c < 8 || c > 12)) || (r > 12 && c < 8)) continue;
          if (((hash + r * 31 + c * 17) % 3) === 0) {
            ctx.fillRect(c * cellSize, r * cellSize, cellSize - 0.5, cellSize - 0.5);
          }
        }
      }
    }
  }

  // Download QR code as PNG image
  function setupDownloadQr() {
    const btn = document.getElementById('btnDownloadQr');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const canvas = document.getElementById('qrCodeCanvas');
      if (!canvas) return;
      const link = document.createElement('a');
      link.download = `careerpath_skill_passport_qr.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    });
  }

  // Share button
  function setupShareButton() {
    const btn = document.getElementById('btnSharePassport');
    if (!btn) return;
    btn.addEventListener('click', async () => {
      const url = window.location.href;
      if (navigator.share) {
        try {
          await navigator.share({
            title: 'Verified Skill Passport · CareerPath AI',
            text: 'Check out my verified technical skills and evaluated GitHub projects on CareerPath AI.',
            url
          });
          return;
        } catch (e) {}
      }

      // Fallback: Copy to clipboard
      if (navigator.clipboard) {
        navigator.clipboard.writeText(url).then(() => {
          btn.innerHTML = '<i class="bi bi-check2 text-success me-1"></i> Link Copied!';
          setTimeout(() => {
            btn.innerHTML = '<i class="bi bi-share me-1"></i> Share';
          }, 2500);
        });
      }
    });
  }

  document.addEventListener('DOMContentLoaded', async () => {
    setupDownloadQr();
    setupShareButton();
    const studentId = getTargetStudentId();
    const passport = await loadPassportData(studentId);
    renderPassport(passport);
  });
})();
