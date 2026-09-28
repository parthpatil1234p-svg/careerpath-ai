/**
 * typing-effects.js — Universal Kinetic Character & Particle Typing Animation Engine
 * Team 404 Brain Not Found · CareerPath AI Platform
 *
 * Provides:
 * - Real-time floating holographic character pop on every keystroke
 * - High-speed radial neon particle spark bursts at cursor position
 * - Electric input border wave pulse
 * - Rapid typing combo streak visualizer
 * - Full support across inputs, textareas, password fields, and chat box
 */

(function () {
  'use strict';

  // Check if reduced motion is preferred
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) return;

  const ACCENT_CLASSES = ['accent-cyan', 'accent-purple', 'accent-teal', 'accent-gold', 'accent-rose'];
  const PARTICLE_COLORS = ['#00F2FE', '#7928CA', '#20E3B2', '#F59E0B', '#EC4899', '#38BDF8'];

  let comboCount = 0;
  let comboTimer = null;
  let activeBadge = null;
  let colorIndex = 0;

  /**
   * Calculates the exact pixel coordinates of the caret inside an input or textarea
   */
  function getCaretCoordinates(element) {
    const isInput = element.tagName === 'INPUT';
    const position = element.selectionEnd || element.value.length || 0;

    const div = document.createElement('div');
    const styles = window.getComputedStyle(element);

    const properties = [
      'direction', 'boxSizing', 'width', 'height', 'overflowX', 'overflowY',
      'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth',
      'borderStyle', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
      'fontStyle', 'fontVariant', 'fontWeight', 'fontStretch', 'fontSize',
      'fontSizeAdjust', 'lineHeight', 'fontFamily', 'textAlign', 'textTransform',
      'textIndent', 'textDecoration', 'letterSpacing', 'wordSpacing', 'tabSize'
    ];

    div.style.position = 'fixed';
    div.style.visibility = 'hidden';
    div.style.pointerEvents = 'none';
    div.style.whiteSpace = isInput ? 'pre' : 'pre-wrap';
    div.style.wordWrap = isInput ? 'normal' : 'break-word';
    div.style.top = '0';
    div.style.left = '0';
    div.style.zIndex = '-9999';

    properties.forEach((prop) => {
      div.style[prop] = styles[prop];
    });

    const textBefore = element.value.substring(0, position);
    div.textContent = textBefore;

    const span = document.createElement('span');
    span.textContent = element.value.substring(position) || '.';
    div.appendChild(span);

    document.body.appendChild(div);

    const elemRect = element.getBoundingClientRect();
    const spanRect = span.getBoundingClientRect();
    const divRect = div.getBoundingClientRect();

    let left = elemRect.left + (spanRect.left - divRect.left) - element.scrollLeft;
    let top = elemRect.top + (spanRect.top - divRect.top) - element.scrollTop + (isInput ? elemRect.height / 2 : 12);

    document.body.removeChild(div);

    // Keep coordinates comfortably within the bounding box of the input
    left = Math.max(elemRect.left + 10, Math.min(elemRect.right - 14, left));
    top = Math.max(elemRect.top + 6, Math.min(elemRect.bottom - 6, top));

    return { left, top };
  }

  /**
   * Spawns floating holographic character pop
   */
  function spawnCharacterPop(char, x, y, isPassword) {
    const pop = document.createElement('div');
    pop.className = `cp-char-pop ${ACCENT_CLASSES[colorIndex % ACCENT_CLASSES.length]}`;
    colorIndex++;

    if (isPassword) {
      pop.innerHTML = '<i class="bi bi-shield-fill-check" style="font-size: 0.95rem;"></i>';
    } else if (char === ' ') {
      pop.innerHTML = '␣';
    } else {
      pop.textContent = char;
    }

    pop.style.left = `${x}px`;
    pop.style.top = `${y}px`;

    document.body.appendChild(pop);

    setTimeout(() => {
      pop.remove();
    }, 520);
  }

  /**
   * Spawns glowing cyber particle sparks around the typed character
   */
  function spawnParticleSparks(x, y) {
    const particleCount = 5 + Math.floor(Math.random() * 3);

    for (let i = 0; i < particleCount; i++) {
      const p = document.createElement('div');
      p.className = 'cp-type-particle';

      const angle = (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * 0.5;
      const distance = 16 + Math.random() * 22;
      const dx = Math.cos(angle) * distance;
      const dy = Math.sin(angle) * distance;
      const size = 3 + Math.random() * 3.5;
      const color = PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)];

      p.style.setProperty('--dx', `${dx}px`);
      p.style.setProperty('--dy', `${dy}px`);
      p.style.width = `${size}px`;
      p.style.height = `${size}px`;
      p.style.background = color;
      p.style.boxShadow = `0 0 8px ${color}`;
      p.style.left = `${x}px`;
      p.style.top = `${y}px`;

      document.body.appendChild(p);

      setTimeout(() => {
        p.remove();
      }, 480);
    }
  }

  /**
   * Handles typing combo streak badge
   */
  function updateComboStreak(element) {
    comboCount++;
    clearTimeout(comboTimer);

    const parent = element.parentElement;
    if (!parent) return;

    if (!activeBadge || activeBadge.parentElement !== parent) {
      if (activeBadge) activeBadge.remove();
      activeBadge = document.createElement('div');
      activeBadge.className = 'cp-typing-combo-badge';
      parent.style.position = parent.style.position || 'relative';
      parent.appendChild(activeBadge);
    }

    if (comboCount >= 4) {
      activeBadge.classList.add('visible');
      if (comboCount >= 12) {
        activeBadge.classList.add('fire');
        activeBadge.innerHTML = `🔥 ${comboCount}x Rapid!`;
      } else {
        activeBadge.classList.remove('fire');
        activeBadge.innerHTML = `⚡ ${comboCount}x Speed!`;
      }
    }

    comboTimer = setTimeout(() => {
      comboCount = 0;
      if (activeBadge) {
        activeBadge.classList.remove('visible', 'fire');
      }
    }, 1100);
  }

  /**
   * Main keypress / input listener
   */
  function handleTypingEvent(e) {
    const target = e.target;
    if (!target) return;

    const isInput = target.tagName === 'INPUT' && !['checkbox', 'radio', 'range', 'file', 'color', 'submit', 'button'].includes(target.type);
    const isTextarea = target.tagName === 'TEXTAREA';
    const isContentEditable = target.isContentEditable;

    if (!isInput && !isTextarea && !isContentEditable) return;

    // Trigger subtle active pulse on the input container
    target.classList.add('cp-input-typing-active');
    clearTimeout(target._pulseTimer);
    target._pulseTimer = setTimeout(() => {
      target.classList.remove('cp-input-typing-active');
    }, 300);

    // Resolve typed character
    let char = '';
    if (e.data) {
      char = e.data;
    } else if (e.key && e.key.length === 1) {
      char = e.key;
    } else if (target.value) {
      const pos = target.selectionEnd || target.value.length;
      char = target.value.charAt(pos - 1) || '•';
    }

    if (!char) return;

    const coords = getCaretCoordinates(target);
    const isPassword = target.type === 'password';

    spawnCharacterPop(char, coords.left, coords.top, isPassword);
    spawnParticleSparks(coords.left, coords.top);
    updateComboStreak(target);
  }

  // Bind global event listeners for instant zero-config attachment across all pages
  document.addEventListener('input', handleTypingEvent, { passive: true });

  // Expose global controller if needed
  window.TypingEffects = {
    trigger: (element, char) => {
      if (!element) return;
      const coords = getCaretCoordinates(element);
      spawnCharacterPop(char || '✦', coords.left, coords.top, element.type === 'password');
      spawnParticleSparks(coords.left, coords.top);
    },
  };
})();
