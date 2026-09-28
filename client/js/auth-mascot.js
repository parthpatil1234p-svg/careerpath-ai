/**
 * auth-mascot.js — Interactive Cyber Mascot ("Atlas Bot")
 * Team 404 Brain Not Found · CareerPath AI Platform
 *
 * Implements:
 * - Real-time typing cursor tracking
 * - Smooth head tilt & eye movement
 * - Password peek-a-boo (covers eyes on password focus, peeks on visibility toggle)
 * - Validation reaction animations
 */

(function () {
  const MASCOT_SVG = `
    <div class="auth-mascot-wrapper" id="authMascotWrapper">
      <svg class="auth-mascot-svg" viewBox="0 0 120 110" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="mascotHelmetGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#1E293B" />
            <stop offset="100%" stop-color="#0F172A" />
          </linearGradient>
          <linearGradient id="mascotVisorGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#020617" />
            <stop offset="100%" stop-color="#0B1120" />
          </linearGradient>
          <linearGradient id="mascotNeonTeal" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#00F2FE" />
            <stop offset="100%" stop-color="#4FACFE" />
          </linearGradient>
          <filter id="neonGlow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        <!-- Body & Collar -->
        <g id="mascotBody">
          <path d="M42 82 L78 82 L86 102 L34 102 Z" fill="#0F172A" stroke="rgba(0, 242, 254, 0.4)" stroke-width="1.5" />
          <!-- Neon Core -->
          <circle cx="60" cy="94" r="4" fill="url(#mascotNeonTeal)" filter="url(#neonGlow)" />
        </g>

        <!-- Head Group (Tilts & Moves) -->
        <g id="mascotHead" class="mascot-head">
          <!-- Antenna -->
          <line x1="60" y1="24" x2="60" y2="10" stroke="#00F2FE" stroke-width="2.5" stroke-linecap="round" />
          <circle cx="60" cy="8" r="4" class="mascot-antenna-beacon" />

          <!-- Ear Pods / Headset Nodes -->
          <rect x="24" y="38" width="8" height="18" rx="4" fill="#00F2FE" opacity="0.8" filter="url(#neonGlow)" />
          <rect x="88" y="38" width="8" height="18" rx="4" fill="#00F2FE" opacity="0.8" filter="url(#neonGlow)" />

          <!-- Main Helmet Shell -->
          <rect x="28" y="22" width="64" height="52" rx="16" fill="url(#mascotHelmetGrad)" stroke="#00F2FE" stroke-width="2" />

          <!-- Digital Visor Screen -->
          <rect x="34" y="30" width="52" height="34" rx="10" fill="url(#mascotVisorGrad)" stroke="rgba(0, 242, 254, 0.3)" stroke-width="1" />

          <!-- Eyes Group (Blinks on idle, tracks on typing) -->
          <g id="mascotEyesGroup" class="mascot-eyes-group">
            <!-- Left Eye -->
            <g id="mascotEyeL" class="mascot-eye-pupil left">
              <ellipse cx="48" cy="46" rx="5" ry="6.5" fill="#00F2FE" filter="url(#neonGlow)" />
              <circle cx="46.5" cy="44" r="1.8" fill="#FFFFFF" />
            </g>

            <!-- Right Eye -->
            <g id="mascotEyeR" class="mascot-eye-pupil right">
              <ellipse cx="72" cy="46" rx="5" ry="6.5" fill="#00F2FE" filter="url(#neonGlow)" />
              <circle cx="70.5" cy="44" r="1.8" fill="#FFFFFF" />
            </g>
          </g>

          <!-- Digital Smile / Expression -->
          <path id="mascotMouth" d="M54 58 Q60 62 66 58" stroke="#00F2FE" stroke-width="2" fill="none" stroke-linecap="round" opacity="0.85" />
        </g>

        <!-- Mechanical Hands (Covers eyes on password) -->
        <g id="mascotHandL" class="mascot-hand left">
          <rect x="20" y="80" width="22" height="22" rx="7" fill="#1E293B" stroke="#00F2FE" stroke-width="2" />
          <circle cx="31" cy="91" r="3" fill="#00F2FE" opacity="0.7" />
        </g>

        <g id="mascotHandR" class="mascot-hand right">
          <rect x="78" y="80" width="22" height="22" rx="7" fill="#1E293B" stroke="#00F2FE" stroke-width="2" />
          <circle cx="89" cy="91" r="3" fill="#00F2FE" opacity="0.7" />
        </g>
      </svg>
    </div>
  `;

  function initMascot(targetContainerId = 'authMascotContainer') {
    const container = document.getElementById(targetContainerId);
    if (!container) return;

    container.innerHTML = MASCOT_SVG;

    const wrapper = document.getElementById('authMascotWrapper');
    const eyeL = document.getElementById('mascotEyeL');
    const eyeR = document.getElementById('mascotEyeR');
    const head = document.getElementById('mascotHead');
    const mouth = document.getElementById('mascotMouth');

    if (!wrapper || !eyeL || !eyeR || !head) return;

    let isPasswordFocused = false;
    let isPasswordRevealed = false;

    // Typing tracker
    const trackInput = (input) => {
      if (isPasswordFocused) return;
      if (!input) return;

      const len = input.value.length;
      // Map length (0 to 30) to range [-7, +7]
      const deltaX = Math.min(Math.max((len - 8) * 0.5, -7), 7);
      const deltaY = 3.5; // Look downward toward input box
      const rotateDeg = deltaX * 0.9;

      eyeL.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
      eyeR.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
      head.style.transform = `rotate(${rotateDeg}deg)`;
    };

    const resetMascot = () => {
      if (isPasswordFocused) return;
      eyeL.style.transform = 'translate(0, 0)';
      eyeR.style.transform = 'translate(0, 0)';
      head.style.transform = 'rotate(0deg)';
      wrapper.classList.remove('covering-eyes', 'peeking');
    };

    // Attach to standard text inputs
    const standardInputs = document.querySelectorAll(
      '#name, #email, #course, #branch, #college, #currentYear, #interests, input[type="text"], input[type="email"]'
    );

    standardInputs.forEach((inp) => {
      inp.addEventListener('focus', () => {
        isPasswordFocused = false;
        wrapper.classList.remove('covering-eyes', 'peeking');
        trackInput(inp);
      });
      inp.addEventListener('input', () => trackInput(inp));
      inp.addEventListener('blur', () => {
        setTimeout(() => {
          if (!document.activeElement || !document.activeElement.matches('input')) {
            resetMascot();
          }
        }, 80);
      });
    });

    // Attach to Password inputs
    const passwordInputs = document.querySelectorAll('#password, #confirmPassword, input[type="password"]');

    passwordInputs.forEach((passInp) => {
      passInp.addEventListener('focus', () => {
        isPasswordFocused = true;
        if (isPasswordRevealed) {
          wrapper.classList.remove('covering-eyes');
          wrapper.classList.add('peeking');
        } else {
          wrapper.classList.add('covering-eyes');
          wrapper.classList.remove('peeking');
        }
      });

      passInp.addEventListener('blur', () => {
        isPasswordFocused = false;
        setTimeout(() => {
          if (!document.activeElement || !document.activeElement.matches('input[type="password"]')) {
            wrapper.classList.remove('covering-eyes', 'peeking');
            resetMascot();
          }
        }, 80);
      });
    });

    // Password Toggle (Eye Button) Listener
    const toggleBtns = document.querySelectorAll('.toggle-password-btn, #btnTogglePassword');
    toggleBtns.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const parentGroup = btn.closest('.input-group');
        const passField = parentGroup ? parentGroup.querySelector('input') : document.getElementById('password');

        if (!passField) return;

        if (passField.type === 'password') {
          passField.type = 'text';
          isPasswordRevealed = true;
          btn.innerHTML = '<i class="bi bi-eye-slash text-teal"></i>';
          if (isPasswordFocused || document.activeElement === passField) {
            wrapper.classList.remove('covering-eyes');
            wrapper.classList.add('peeking');
          }
        } else {
          passField.type = 'password';
          isPasswordRevealed = false;
          btn.innerHTML = '<i class="bi bi-eye"></i>';
          if (isPasswordFocused || document.activeElement === passField) {
            wrapper.classList.add('covering-eyes');
            wrapper.classList.remove('peeking');
          }
        }
      });
    });

    // Happy reaction on form submission
    const form = document.querySelector('form');
    if (form) {
      form.addEventListener('submit', () => {
        wrapper.classList.add('happy');
        if (mouth) mouth.setAttribute('d', 'M50 56 Q60 66 70 56');
        setTimeout(() => {
          wrapper.classList.remove('happy');
          if (mouth) mouth.setAttribute('d', 'M54 58 Q60 62 66 58');
        }, 1200);
      });
    }
  }

  window.AuthMascot = { init: initMascot };

  document.addEventListener('DOMContentLoaded', () => {
    initMascot();
  });
})();
