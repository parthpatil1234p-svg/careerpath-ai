/**
 * hero-route-map.js — Interactive Student-Explainable Career Route Map for Hero Section
 * 
 * Replaces the static/empty hero space with a live, interactive 5-station highway:
 * - Station 01: Diagnostic Skill Benchmark
 * - Station 02: Adaptive Milestone Roadmap
 * - Station 03: 30-Min Server-Proctored Test
 * - Station 04: Cryptographic SHA-256 Credential
 * - Station 05: Recruiter Talent Radar Placement
 * 
 * Fully responsive, keyboard accessible (W3C ARIA), zero WebGL overhead, instant FCP/CLS = 0.
 */

(function () {
  'use strict';

  const TRACK_DATA = {
    tech: {
      name: 'Tech & Cloud Engineering',
      progressPercent: 40,
      activeStation: 2,
      stations: {
        1: {
          badge: 'Station 01 · Diagnostic Benchmark',
          title: '4-Step Adaptive Skill Diagnostic',
          desc: 'Evaluates your technical knowledge across 24 software tracks to detect skill gaps and calculate your baseline readiness score.',
          skills: ['Instant Gap Analysis', 'Cosine-Similarity Score', 'Zero Guesswork'],
          actionText: 'Start Diagnostic',
          actionUrl: 'assessment.html'
        },
        2: {
          badge: 'Station 02 · Active Sprint',
          title: 'Weekly Structured Execution Roadmap',
          desc: 'Curated 4–12 week learning schedule broken down into manageable milestones with vetted industry documentation and coding exercises.',
          skills: ['Week-by-Week Milestones', 'Curated Resources', 'Task Checklist'],
          actionText: 'Explore Roadmaps',
          actionUrl: '#solutions'
        },
        3: {
          badge: 'Station 03 · Verification Gate',
          title: '30-Minute Server-Proctored Tests',
          desc: 'Weekly milestone evaluations featuring 10 topic-specific questions with anti-cheat detection, tab lock, and a strict 70% passing threshold.',
          skills: ['Anti-Cheat Tab Monitor', 'Timed 30-Min Clock', 'Tamper-Proof Audit'],
          actionText: 'View Proctor Rules',
          actionUrl: '#pricing'
        },
        4: {
          badge: 'Station 04 · Verified Proof',
          title: 'Cryptographic SHA-256 Credential',
          desc: 'Immutable digital certificate stamped with a cryptographic hash digest and live QR code for instant employer authentication.',
          skills: ['SHA-256 Hash Digest', 'Live QR Validation', 'Zero Fake Resumes'],
          actionText: 'Verify Sample Cert',
          actionUrl: 'verify.html?certId=CP-2026-VRF892'
        },
        5: {
          badge: 'Station 05 · Corporate Radar',
          title: 'Direct Recruiter Talent Radar',
          desc: 'Verified skills bypass applicant tracking black holes and place your validated profile directly onto corporate recruiters\' hiring radar.',
          skills: ['150+ Hiring Partners', 'No Resume Filters', 'Direct Interview Invites'],
          actionText: 'Browse Openings',
          actionUrl: 'jobs.html'
        }
      },
      skills: [
        { id: 'react', mark: '⚛', markClass: 'react-mark', name: 'React', type: 'Frontend' },
        { id: 'javascript', mark: 'JS', markClass: 'js-mark', name: 'JavaScript', type: 'Language' },
        { id: 'python', mark: 'Py', markClass: 'python-mark', name: 'Python', type: 'Language' },
        { id: 'node', mark: 'N', markClass: 'node-mark', name: 'Node.js', type: 'Backend' },
        { id: 'figma', mark: 'F', markClass: 'figma-mark', name: 'Figma', type: 'Design' },
        { id: 'sql', mark: '<i class="bi bi-database-fill"></i>', markClass: 'sql-mark', name: 'SQL', type: 'Data' },
        { id: 'aws', mark: 'aws', markClass: 'aws-mark', name: 'AWS', type: 'Cloud' },
        { id: 'git', mark: '<i class="bi bi-git"></i>', markClass: 'git-mark', name: 'Git', type: 'Workflow' }
      ]
    },
    data: {
      name: 'AI & Data Science',
      progressPercent: 40,
      activeStation: 2,
      stations: {
        1: {
          badge: 'Station 01 · Diagnostic Benchmark',
          title: 'Mathematics & Data Science Diagnostic',
          desc: 'Assesses Python proficiency, SQL query mastery, linear algebra, and data wrangling fundamentals to build your customized AI roadmap.',
          skills: ['Python Diagnostics', 'SQL Logic Benchmark', 'Stats & Linear Algebra'],
          actionText: 'Start Diagnostic',
          actionUrl: 'assessment.html'
        },
        2: {
          badge: 'Station 02 · Active Sprint',
          title: '10-Week AI & Machine Learning Track',
          desc: 'Progress from exploratory data analysis to feature engineering, supervised learning algorithms, and deep neural network deployment.',
          skills: ['Pandas & NumPy', 'Scikit-Learn Modeling', 'PyTorch / TensorFlow'],
          actionText: 'Explore Data Track',
          actionUrl: '#solutions'
        },
        3: {
          badge: 'Station 03 · Verification Gate',
          title: 'Applied Model Evaluation & Data Exams',
          desc: 'Timed 30-minute challenges testing model evaluation metrics (ROC-AUC, F1, precision/recall) and SQL pipeline optimization under proctoring.',
          skills: ['Model Evaluation Cutoff', 'Pipeline Optimization', 'Live Proctoring'],
          actionText: 'View Proctor Rules',
          actionUrl: '#pricing'
        },
        4: {
          badge: 'Station 04 · Verified Proof',
          title: 'Cryptographic AI Engineer Credential',
          desc: 'Digitally verified credentials confirming rigorous data manipulation and machine learning competencies validated by proctored tests.',
          skills: ['Verified Data Proof', 'Immutable Score Ledger', 'SHA-256 Digest'],
          actionText: 'Verify Sample Cert',
          actionUrl: 'verify.html?certId=CP-2026-VRF892'
        },
        5: {
          badge: 'Station 05 · Corporate Radar',
          title: 'Data & AI Talent Pipeline',
          desc: 'Direct hiring connection with data teams at high-growth startups and enterprises seeking pre-vetted machine learning talent.',
          skills: ['Direct Hiring Radar', 'Portfolio Review', 'Data Engineering Roles'],
          actionText: 'Browse AI Roles',
          actionUrl: 'jobs.html'
        }
      },
      skills: [
        { id: 'python', mark: 'Py', markClass: 'python-mark', name: 'Python', type: 'Language' },
        { id: 'sql', mark: '<i class="bi bi-database-fill"></i>', markClass: 'sql-mark', name: 'SQL', type: 'Data' },
        { id: 'aws', mark: 'aws', markClass: 'aws-mark', name: 'AWS', type: 'Cloud' },
        { id: 'git', mark: '<i class="bi bi-git"></i>', markClass: 'git-mark', name: 'Git', type: 'Workflow' },
        { id: 'react', mark: '⚛', markClass: 'react-mark', name: 'React', type: 'Frontend' },
        { id: 'javascript', mark: 'JS', markClass: 'js-mark', name: 'JavaScript', type: 'Language' },
        { id: 'node', mark: 'N', markClass: 'node-mark', name: 'Node.js', type: 'Backend' },
        { id: 'figma', mark: 'F', markClass: 'figma-mark', name: 'Figma', type: 'Design' }
      ]
    },
    business: {
      name: 'Business & Finance',
      progressPercent: 40,
      activeStation: 2,
      stations: {
        1: {
          badge: 'Station 01 · Diagnostic Benchmark',
          title: 'Financial Modeling & Market Analysis',
          desc: 'Evaluates your commercial acumen, Excel proficiency, unit economics understanding, and financial statement analysis.',
          skills: ['P&L Analysis', 'Financial Statements', 'Unit Economics'],
          actionText: 'Start Diagnostic',
          actionUrl: 'assessment.html'
        },
        2: {
          badge: 'Station 02 · Active Sprint',
          title: '6-Week Financial Modeling Sprint',
          desc: 'Structured curriculum covering Discounted Cash Flow (DCF), 3-statement models, valuation multiples, and investor pitch preparation.',
          skills: ['3-Statement Modeling', 'Valuation & Multiples', 'Pitch Decks'],
          actionText: 'Explore Business Track',
          actionUrl: '#solutions'
        },
        3: {
          badge: 'Station 03 · Verification Gate',
          title: 'Proctored Case Study & Financial Tests',
          desc: '30-minute proctored assessments analyzing commercial scenarios, budget allocation, and risk sensitivity modeling.',
          skills: ['Case Study Analysis', 'Timed Financial Scenarios', '70% Minimum Score'],
          actionText: 'View Proctor Rules',
          actionUrl: '#pricing'
        },
        4: {
          badge: 'Station 04 · Verified Proof',
          title: 'Certified Financial Analyst Credential',
          desc: 'Cryptographically certified proof of financial modeling acumen, verified with cryptographic hash and direct employer URL verification.',
          skills: ['Audit-Ready Ledger', 'Employer Verification', 'SHA-256 Digest'],
          actionText: 'Verify Sample Cert',
          actionUrl: 'verify.html?certId=CP-2026-VRF892'
        },
        5: {
          badge: 'Station 05 · Corporate Radar',
          title: 'Investment & Finance Hiring Radar',
          desc: 'Connects directly with corporate development, venture capital, and fintech hiring managers searching for verified financial analysts.',
          skills: ['Direct Finance Radar', 'Fintech Hiring', 'Analyst Fast-Track'],
          actionText: 'Browse Finance Roles',
          actionUrl: 'jobs.html'
        }
      },
      skills: [
        { id: 'sql', mark: '<i class="bi bi-database-fill"></i>', markClass: 'sql-mark', name: 'SQL', type: 'Data' },
        { id: 'python', mark: 'Py', markClass: 'python-mark', name: 'Python', type: 'Analytics' },
        { id: 'git', mark: '<i class="bi bi-git"></i>', markClass: 'git-mark', name: 'Git', type: 'Workflow' },
        { id: 'aws', mark: 'aws', markClass: 'aws-mark', name: 'AWS', type: 'Cloud' },
        { id: 'react', mark: '⚛', markClass: 'react-mark', name: 'React', type: 'Frontend' },
        { id: 'javascript', mark: 'JS', markClass: 'js-mark', name: 'JavaScript', type: 'Language' },
        { id: 'node', mark: 'N', markClass: 'node-mark', name: 'Node.js', type: 'Backend' },
        { id: 'figma', mark: 'F', markClass: 'figma-mark', name: 'Figma', type: 'Design' }
      ]
    },
    design: {
      name: 'UI/UX & Product Design',
      progressPercent: 40,
      activeStation: 2,
      stations: {
        1: {
          badge: 'Station 01 · Diagnostic Benchmark',
          title: 'Design Thinking & Wireframing Benchmark',
          desc: 'Assesses visual hierarchy, user journey mapping, accessibility compliance (WCAG 2.1 AA), and Figma layout proficiency.',
          skills: ['Visual Hierarchy', 'WCAG Accessibility', 'Figma Fundamentals'],
          actionText: 'Start Diagnostic',
          actionUrl: 'assessment.html'
        },
        2: {
          badge: 'Station 02 · Active Sprint',
          title: '8-Week Product Design Sprint',
          desc: 'From heuristic analysis to interactive component design systems, mobile app design tokens, and usability testing protocols.',
          skills: ['Design Systems', 'Micro-interactions', 'Interactive Prototypes'],
          actionText: 'Explore Design Track',
          actionUrl: '#solutions'
        },
        3: {
          badge: 'Station 03 · Verification Gate',
          title: 'Proctored Usability & Design Critique',
          desc: 'Timed 30-minute evaluations covering heuristic evaluation, typography pairing, responsive layout behavior, and user testing methodology.',
          skills: ['A11y Compliance Tests', 'Timed Design Challenges', 'Anti-Cheat Monitored'],
          actionText: 'View Proctor Rules',
          actionUrl: '#pricing'
        },
        4: {
          badge: 'Station 04 · Verified Proof',
          title: 'Verified Product Designer Credential',
          desc: 'Cryptographically secured certificate confirming mastery of production UI design systems and design operations verified on-chain.',
          skills: ['Design Evidence Proof', 'SHA-256 Digest', 'Portfolio Validation'],
          actionText: 'Verify Sample Cert',
          actionUrl: 'verify.html?certId=CP-2026-VRF892'
        },
        5: {
          badge: 'Station 05 · Corporate Radar',
          title: 'Product & Design Talent Radar',
          desc: 'Direct visibility with product teams, design studios, and engineering leads looking for verified interface designers.',
          skills: ['Direct Hiring Radar', 'Design Team Match', 'High-Growth Tech Startups'],
          actionText: 'Browse Design Roles',
          actionUrl: 'jobs.html'
        }
      },
      skills: [
        { id: 'figma', mark: 'F', markClass: 'figma-mark', name: 'Figma', type: 'Design' },
        { id: 'react', mark: '⚛', markClass: 'react-mark', name: 'React', type: 'Frontend' },
        { id: 'javascript', mark: 'JS', markClass: 'js-mark', name: 'JavaScript', type: 'Language' },
        { id: 'git', mark: '<i class="bi bi-git"></i>', markClass: 'git-mark', name: 'Git', type: 'Workflow' },
        { id: 'python', mark: 'Py', markClass: 'python-mark', name: 'Python', type: 'Language' },
        { id: 'node', mark: 'N', markClass: 'node-mark', name: 'Node.js', type: 'Backend' },
        { id: 'sql', mark: '<i class="bi bi-database-fill"></i>', markClass: 'sql-mark', name: 'SQL', type: 'Data' },
        { id: 'aws', mark: 'aws', markClass: 'aws-mark', name: 'AWS', type: 'Cloud' }
      ]
    }
  };

  let currentTrackKey = 'tech';
  let currentStationId = 1;

  function updatePreviewCard(trackKey, stationId) {
    const track = TRACK_DATA[trackKey] || TRACK_DATA.tech;
    const station = track.stations[stationId] || track.stations[1];

    const badgeEl = document.getElementById('previewStationBadge');
    const titleEl = document.getElementById('previewStationTitle');
    const descEl = document.getElementById('previewStationDesc');
    const actionEl = document.getElementById('previewStationAction');
    const skillsEl = document.getElementById('previewStationSkills');

    if (badgeEl) badgeEl.textContent = station.badge;
    if (titleEl) titleEl.textContent = station.title;
    if (descEl) descEl.textContent = station.desc;

    if (actionEl) {
      actionEl.setAttribute('href', station.actionUrl);
      const span = actionEl.querySelector('span');
      if (span) span.textContent = station.actionText;
    }

    if (skillsEl && Array.isArray(station.skills)) {
      skillsEl.innerHTML = station.skills
        .map(skill => `<span class="station-skill-tag"><i class="bi bi-check2"></i> ${escapeHtml(skill)}</span>`)
        .join('');
    }
  }

  function updateHighwayRail(stationId) {
    const stations = document.querySelectorAll('.highway-station');
    stations.forEach(st => {
      const id = Number(st.getAttribute('data-station'));
      st.classList.remove('active');
      if (id === stationId) {
        st.classList.add('active');
      }
    });

    const progressEl = document.getElementById('heroTrackProgress');
    if (progressEl) {
      // Progress percentage based on selected station: 1 -> 15%, 2 -> 35%, 3 -> 58%, 4 -> 80%, 5 -> 100%
      const pctMap = { 1: 15, 2: 35, 3: 58, 4: 80, 5: 100 };
      const pct = pctMap[stationId] || 35;
      progressEl.style.width = pct + '%';
    }
  }

  function renderSkillsGrid(trackKey) {
    const track = TRACK_DATA[trackKey] || TRACK_DATA.tech;
    const grid = document.getElementById('heroSkillsGrid');
    if (!grid || !Array.isArray(track.skills)) return;

    grid.innerHTML = track.skills
      .map(s => `
        <div class="skill-logo-card" data-skill-id="${escapeHtml(s.id)}" aria-haspopup="dialog" aria-controls="skillDetailDialog" aria-label="Learn ${escapeHtml(s.name)}" tabindex="0">
          <span class="skill-logo-mark ${escapeHtml(s.markClass)}" aria-hidden="true">${s.mark}</span>
          <div>
            <span class="skill-logo-name">${escapeHtml(s.name)}</span>
            <span class="skill-logo-type">${escapeHtml(s.type)}</span>
          </div>
        </div>
      `)
      .join('');
  }

  function setTrack(trackKey) {
    if (!TRACK_DATA[trackKey]) return;
    currentTrackKey = trackKey;

    // Update track tab pills
    const pills = document.querySelectorAll('.route-track-pill');
    pills.forEach(pill => {
      const key = pill.getAttribute('data-track');
      const isActive = key === trackKey;
      pill.classList.toggle('active', isActive);
      pill.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });

    updatePreviewCard(currentTrackKey, currentStationId);
    renderSkillsGrid(currentTrackKey);
  }

  function setStation(stationId) {
    currentStationId = Number(stationId);
    updateHighwayRail(currentStationId);
    updatePreviewCard(currentTrackKey, currentStationId);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function init() {
    const hub = document.getElementById('heroRouteHub');
    if (!hub) return;

    // Attach Track Pill Listeners
    const pills = document.querySelectorAll('.route-track-pill');
    const stations = document.querySelectorAll('.highway-station');

    // If route highway stations and track pills are not present, keep static skills showcase intact
    if (!pills.length && !stations.length) return;

    pills.forEach(pill => {
      pill.addEventListener('click', () => {
        const track = pill.getAttribute('data-track');
        setTrack(track);
      });
      pill.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const track = pill.getAttribute('data-track');
          setTrack(track);
        }
      });
    });

    // Attach Station Click & Hover Listeners
    stations.forEach(st => {
      st.addEventListener('click', () => {
        const id = st.getAttribute('data-station');
        setStation(id);
      });
      st.addEventListener('mouseenter', () => {
        const id = st.getAttribute('data-station');
        setStation(id);
      });
      st.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const id = st.getAttribute('data-station');
          setStation(id);
        }
      });
    });

    // Initialize with default track & station
    setTrack('tech');
    setStation(1);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
