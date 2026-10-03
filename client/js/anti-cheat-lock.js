/**
 * anti-cheat-lock.js — Proctoring & Anti-Cheating Lock Controller
 *
 * Implements authoritative client-side deterrence sensors & HUD controllers:
 *   1. Fullscreen Enforcement (requestFullscreen & exit detection)
 *   2. Tab Switch & Blur Listeners (visibilitychange, window.blur)
 *   3. Clipboard & DevTools Blocking (copy, paste, cut, contextmenu, F12, Ctrl+U, Ctrl+Shift+I)
 *   4. 3-Strike HUD Modals (Strike 1 Amber, Strike 2 Red Urgent, Strike 3 Termination)
 *   5. Authoritative Server Violation Sync (POST /api/quiz/violation)
 *
 * CareerPath AI · Team 404 Brain Not Found
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.AntiCheatLock = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  class AntiCheatController {
    constructor(options = {}) {
      this.sessionId = options.sessionId || null;
      this.skill = options.skill || null;
      this.maxStrikes = options.maxStrikes || 3;
      this.strikeCount = 0;
      this.isArmed = false;
      this.isLocked = false;
      this.lockReason = null;
      this.lastViolationTime = 0;
      this.violationDebounceMs = options.violationDebounceMs || 800; // prevent double-triggering on simultaneous blur+visibilitychange

      // Callbacks
      this.onStrikeCallback = options.onStrike || null;
      this.onLockoutCallback = options.onLockout || null;
      this.onNoticeCallback = options.onNotice || null;

      // Bound event listeners
      this._handleVisibilityChange = this._handleVisibilityChange.bind(this);
      this._handleWindowBlur = this._handleWindowBlur.bind(this);
      this._handleFullscreenChange = this._handleFullscreenChange.bind(this);
      this._handleKeydown = this._handleKeydown.bind(this);
      this._handleContextMenu = this._handleContextMenu.bind(this);
      this._handleClipboard = this._handleClipboard.bind(this);

      this._initDomModals();
    }

    /**
     * Arm the proctoring lock (starts monitoring and attaches listeners)
     */
    arm(sessionInfo = {}) {
      if (sessionInfo.sessionId) this.sessionId = sessionInfo.sessionId;
      if (sessionInfo.skill) this.skill = sessionInfo.skill;
      if (typeof sessionInfo.strikeCount === 'number') this.strikeCount = sessionInfo.strikeCount;
      if (sessionInfo.isLocked) {
        this.isLocked = true;
        this.lockReason = sessionInfo.lockReason || 'SESSION_LOCKED';
        this._showLockoutModal(this.lockReason);
        return;
      }

      this.isArmed = true;
      this._attachListeners();
      this._updateHudBadge();
    }

    /**
     * Disarm the proctoring lock (quiz completed or left)
     */
    disarm() {
      this.isArmed = false;
      this._detachListeners();
      this._removeModals();
    }

    /**
     * Request fullscreen mode on start
     */
    async requestFullscreen(targetElement = document.documentElement) {
      try {
        if (!document.fullscreenElement && targetElement.requestFullscreen) {
          await targetElement.requestFullscreen();
          return true;
        }
      } catch (err) {
        console.warn('[AntiCheatLock] Fullscreen request not granted or user dismissed:', err.message);
        return false;
      }
      return false;
    }

    /**
     * Check if currently in fullscreen
     */
    isFullscreen() {
      return Boolean(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement);
    }

    /**
     * Exit fullscreen mode cleanly
     */
    async exitFullscreen() {
      try {
        if (document.fullscreenElement && document.exitFullscreen) {
          await document.exitFullscreen();
        }
      } catch (_) {}
    }

    /**
     * Attach all security listeners
     */
    _attachListeners() {
      document.addEventListener('visibilitychange', this._handleVisibilityChange);
      window.addEventListener('blur', this._handleWindowBlur);
      document.addEventListener('fullscreenchange', this._handleFullscreenChange);
      document.addEventListener('webkitfullscreenchange', this._handleFullscreenChange);
      window.addEventListener('keydown', this._handleKeydown, true);
      window.addEventListener('contextmenu', this._handleContextMenu, true);
      window.addEventListener('copy', this._handleClipboard, true);
      window.addEventListener('paste', this._handleClipboard, true);
      window.addEventListener('cut', this._handleClipboard, true);
    }

    /**
     * Detach all security listeners
     */
    _detachListeners() {
      document.removeEventListener('visibilitychange', this._handleVisibilityChange);
      window.removeEventListener('blur', this._handleWindowBlur);
      document.removeEventListener('fullscreenchange', this._handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', this._handleFullscreenChange);
      window.removeEventListener('keydown', this._handleKeydown, true);
      window.removeEventListener('contextmenu', this._handleContextMenu, true);
      window.removeEventListener('copy', this._handleClipboard, true);
      window.removeEventListener('paste', this._handleClipboard, true);
      window.removeEventListener('cut', this._handleClipboard, true);
    }

    _handleVisibilityChange() {
      if (!this.isArmed || this.isLocked) return;
      if (document.hidden) {
        this._recordViolation('tab_switch', 'User switched browser tab during active assessment');
      }
    }

    _handleWindowBlur() {
      if (!this.isArmed || this.isLocked) return;
      this._recordViolation('window_blur', 'Assessment window lost focus (application switch or secondary monitor click)');
    }

    _handleFullscreenChange() {
      if (!this.isArmed || this.isLocked) return;
      if (!this.isFullscreen()) {
        this._recordViolation('fullscreen_exit', 'User exited enforced fullscreen mode');
      }
    }

    _handleKeydown(e) {
      if (!this.isArmed) return;

      const key = e.key;
      const isCtrl = e.ctrlKey || e.metaKey;
      const isShift = e.shiftKey;

      // DevTools shortcuts: F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C
      if (
        key === 'F12' ||
        (isCtrl && isShift && ['I', 'i', 'J', 'j', 'C', 'c'].includes(key)) ||
        (isCtrl && ['u', 'U'].includes(key)) // View Source
      ) {
        e.preventDefault();
        e.stopPropagation();
        this._showToastNotice('🔒 Developer tools and source view are disabled during skill verification.');
        this._recordViolation('devtools_attempt', `Attempted devtools key combo: ${key}`);
        return false;
      }

      // Clipboard shortcuts: Ctrl+C, Ctrl+V, Ctrl+X
      if (isCtrl && ['c', 'C', 'v', 'V', 'x', 'X'].includes(key)) {
        e.preventDefault();
        e.stopPropagation();
        this._showToastNotice('🔒 Copying and pasting are disabled to ensure credential integrity.');
        this._recordViolation('clipboard_shortcut', `Attempted clipboard shortcut: Ctrl+${key.toUpperCase()}`);
        return false;
      }

      // Print shortcut: Ctrl+P
      if (isCtrl && ['p', 'P'].includes(key)) {
        e.preventDefault();
        e.stopPropagation();
        this._showToastNotice('🔒 Printing is disabled during active quiz.');
        return false;
      }
    }

    _handleContextMenu(e) {
      if (!this.isArmed) return;
      e.preventDefault();
      e.stopPropagation();
      this._showToastNotice('🔒 Right-click inspect menu is disabled during assessment.');
      return false;
    }

    _handleClipboard(e) {
      if (!this.isArmed) return;
      e.preventDefault();
      e.stopPropagation();
      this._showToastNotice('🔒 Clipboard access is disabled during active verification.');
      return false;
    }

    /**
     * Dispatch violation to backend and trigger HUD warnings
     */
    async _recordViolation(type, message) {
      const now = Date.now();
      if (now - this.lastViolationTime < this.violationDebounceMs) {
        return; // debounce rapid consecutive blur+visibilitychange events
      }
      this.lastViolationTime = now;

      // Optimistic increment
      this.strikeCount += 1;
      const strikesRemaining = Math.max(0, this.maxStrikes - this.strikeCount);

      console.warn(`[AntiCheatLock] Proctoring Violation [${type}]: ${message}. Strike ${this.strikeCount}/${this.maxStrikes}`);

      // Sync with server authoritative state
      try {
        if (window.API && (this.sessionId || this.skill)) {
          const resp = await window.API.post('/quiz/violation', {
            sessionId: this.sessionId,
            skill: this.skill,
            violationType: type,
            details: { message, timestamp: now }
          }, { auth: true });

          if (resp && resp.data) {
            this.strikeCount = resp.data.strikeCount || this.strikeCount;
            if (resp.data.isLocked) {
              this.isLocked = true;
              this.lockReason = resp.data.lockReason || 'REPEATED_PROCTORING_VIOLATIONS';
            }
          }
        }
      } catch (err) {
        console.error('[AntiCheatLock] Failed to report violation to server:', err);
      }

      this._updateHudBadge();

      // Trigger callbacks
      if (this.onStrikeCallback) {
        this.onStrikeCallback(this.strikeCount, strikesRemaining, type);
      }

      // Display corresponding Strike Modal
      if (this.strikeCount === 1) {
        this._showStrike1Modal(message);
      } else if (this.strikeCount === 2) {
        this._showStrike2Modal(message);
      } else if (this.strikeCount >= 3 || this.isLocked) {
        this.isLocked = true;
        this.lockReason = 'REPEATED_PROCTORING_VIOLATIONS';
        this._showLockoutModal('Repeated proctoring violations (3/3 strikes). Your assessment session has been locked and terminated.');
        if (this.onLockoutCallback) {
          this.onLockoutCallback(this.lockReason);
        }
      }
    }

    /**
     * Update Proctoring HUD indicator badge on the page
     */
    _updateHudBadge() {
      const strikeEl = document.getElementById('strikeBadgeCount');
      const badgeContainer = document.getElementById('proctoringHudBadge');
      if (strikeEl) {
        strikeEl.textContent = this.strikeCount;
      }
      if (badgeContainer) {
        badgeContainer.classList.remove('d-none', 'bg-success', 'bg-warning', 'bg-danger');
        if (this.strikeCount === 0) {
          badgeContainer.className = 'badge bg-success-subtle text-success border border-success-subtle px-2 py-1 small';
        } else if (this.strikeCount === 1) {
          badgeContainer.className = 'badge bg-warning-subtle text-warning border border-warning-subtle px-2 py-1 small';
        } else {
          badgeContainer.className = 'badge bg-danger-subtle text-danger border border-danger-subtle px-2 py-1 small';
        }
      }
    }

    _showToastNotice(text) {
      let toast = document.getElementById('antiCheatToast');
      if (!toast) {
        toast = document.createElement('div');
        toast.id = 'antiCheatToast';
        toast.style.cssText = `
          position: fixed;
          bottom: 24px;
          right: 24px;
          z-index: 100000;
          background: rgba(15, 23, 42, 0.95);
          color: #F8FAFC;
          padding: 12px 18px;
          border-radius: 8px;
          font-family: var(--font-sans, system-ui, sans-serif);
          font-size: 0.88rem;
          box-shadow: 0 10px 25px rgba(0,0,0,0.3);
          border-left: 4px solid #F59E0B;
          pointer-events: none;
          transition: opacity 0.3s ease, transform 0.3s ease;
          display: flex;
          align-items: center;
          gap: 8px;
        `;
        document.body.appendChild(toast);
      }
      toast.innerHTML = text;
      toast.style.opacity = '1';
      toast.style.transform = 'translateY(0)';

      clearTimeout(this._toastTimeout);
      this._toastTimeout = setTimeout(() => {
        if (toast) {
          toast.style.opacity = '0';
          toast.style.transform = 'translateY(10px)';
        }
      }, 2500);
    }

    _initDomModals() {
      if (document.getElementById('antiCheatModalBackdrop')) return;

      const backdrop = document.createElement('div');
      backdrop.id = 'antiCheatModalBackdrop';
      backdrop.style.cssText = `
        display: none;
        position: fixed;
        inset: 0;
        z-index: 99999;
        background: rgba(15, 23, 42, 0.82);
        backdrop-filter: blur(6px);
        align-items: center;
        justify-content: center;
        padding: 20px;
        font-family: var(--font-sans, system-ui, sans-serif);
      `;

      backdrop.innerHTML = `
        <div id="antiCheatModalCard" style="
          background: #FFFFFF;
          color: #0F172A;
          max-width: 520px;
          width: 100%;
          border-radius: 16px;
          padding: 28px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.4);
          text-align: center;
          position: relative;
          border: 2px solid transparent;
        ">
          <div id="antiCheatModalIcon" style="font-size: 3rem; margin-bottom: 12px;"></div>
          <h3 id="antiCheatModalTitle" style="font-weight: 800; margin-bottom: 10px; font-size: 1.35rem;"></h3>
          <p id="antiCheatModalDesc" style="color: #475569; font-size: 0.95rem; line-height: 1.6; margin-bottom: 20px;"></p>
          <div id="antiCheatModalExtra" style="margin-bottom: 24px;"></div>
          <div id="antiCheatModalActions" style="display: flex; justify-content: center; gap: 12px;"></div>
        </div>
      `;

      document.body.appendChild(backdrop);
    }

    _showStrike1Modal(details) {
      const backdrop = document.getElementById('antiCheatModalBackdrop');
      const card = document.getElementById('antiCheatModalCard');
      const icon = document.getElementById('antiCheatModalIcon');
      const title = document.getElementById('antiCheatModalTitle');
      const desc = document.getElementById('antiCheatModalDesc');
      const extra = document.getElementById('antiCheatModalExtra');
      const actions = document.getElementById('antiCheatModalActions');

      if (!backdrop || !card) return;

      card.style.borderColor = '#F59E0B';
      icon.innerHTML = '<span style="color: #F59E0B;">⚠️</span>';
      title.innerHTML = '<span style="color: #D97706;">Strike 1 of 3: Focus Violation Detected</span>';
      desc.innerHTML = `
        The proctoring system detected an unauthorized window change or focus loss.<br>
        <span style="font-size: 0.85rem; color: #64748B;">Reason: ${details || 'Tab switch or window blur'}</span>
      `;
      extra.innerHTML = `
        <div style="background: #FEF3C7; color: #92400E; padding: 12px; border-radius: 8px; font-size: 0.88rem; font-weight: 600;">
          ⚠️ 2 Strikes Remaining. Next violation triggers a red final warning!
        </div>
      `;
      actions.innerHTML = `
        <button id="btnAcknowledgeStrike1" style="
          background: #4F46E5;
          color: #FFFFFF;
          border: none;
          padding: 10px 24px;
          border-radius: 8px;
          font-weight: 700;
          font-size: 0.95rem;
          cursor: pointer;
        ">I Understand — Resume Assessment</button>
      `;

      backdrop.style.display = 'flex';

      document.getElementById('btnAcknowledgeStrike1')?.addEventListener('click', async () => {
        backdrop.style.display = 'none';
        await this.requestFullscreen();
      });
    }

    _showStrike2Modal(details) {
      const backdrop = document.getElementById('antiCheatModalBackdrop');
      const card = document.getElementById('antiCheatModalCard');
      const icon = document.getElementById('antiCheatModalIcon');
      const title = document.getElementById('antiCheatModalTitle');
      const desc = document.getElementById('antiCheatModalDesc');
      const extra = document.getElementById('antiCheatModalExtra');
      const actions = document.getElementById('antiCheatModalActions');

      if (!backdrop || !card) return;

      card.style.borderColor = '#EF4444';
      icon.innerHTML = '<span style="color: #DC2626;">🚨</span>';
      title.innerHTML = '<span style="color: #DC2626;">Strike 2 of 3: FINAL WARNING!</span>';
      desc.innerHTML = `
        Another security focus violation was recorded.<br>
        <strong style="color: #991B1B;">ONE MORE VIOLATION WILL PERMANENTLY TERMINATE THIS ASSESSMENT.</strong><br>
        <span style="font-size: 0.85rem; color: #64748B;">Reason: ${details || 'Unfocused browser window or tab switch'}</span>
      `;
      extra.innerHTML = `
        <div style="background: #FEE2E2; color: #991B1B; padding: 12px; border-radius: 8px; font-size: 0.88rem; font-weight: 700;">
          🛑 STRIKE 2/3: Keep this window fullscreen and do not switch applications!
        </div>
      `;
      actions.innerHTML = `
        <button id="btnAcknowledgeStrike2" style="
          background: #DC2626;
          color: #FFFFFF;
          border: none;
          padding: 10px 24px;
          border-radius: 8px;
          font-weight: 800;
          font-size: 0.95rem;
          cursor: pointer;
        ">Return to Fullscreen & Focus</button>
      `;

      backdrop.style.display = 'flex';

      document.getElementById('btnAcknowledgeStrike2')?.addEventListener('click', async () => {
        backdrop.style.display = 'none';
        await this.requestFullscreen();
      });
    }

    _showLockoutModal(reason) {
      const backdrop = document.getElementById('antiCheatModalBackdrop');
      const card = document.getElementById('antiCheatModalCard');
      const icon = document.getElementById('antiCheatModalIcon');
      const title = document.getElementById('antiCheatModalTitle');
      const desc = document.getElementById('antiCheatModalDesc');
      const extra = document.getElementById('antiCheatModalExtra');
      const actions = document.getElementById('antiCheatModalActions');

      if (!backdrop || !card) return;

      card.style.borderColor = '#991B1B';
      icon.innerHTML = '<span style="color: #991B1B;">🔒</span>';
      title.innerHTML = '<span style="color: #991B1B;">Assessment Session Locked (Terminated)</span>';
      desc.innerHTML = `
        Your quiz session has been terminated due to repeated proctoring violations (3 strikes accumulated).<br>
        The server has locked this attempt. Integrity score is marked as <strong>0% (Flagged)</strong>.
      `;
      extra.innerHTML = `
        <div style="background: #F8FAFC; border: 1px solid #E2E8F0; padding: 12px; border-radius: 8px; text-align: left; font-size: 0.85rem; color: #334155;">
          <div><strong>Reason:</strong> ${reason || 'REPEATED_PROCTORING_VIOLATIONS'}</div>
          <div><strong>Strikes:</strong> 3 / 3 (Strikeout)</div>
          <div><strong>Retake:</strong> Retake will be available after cooldown period.</div>
        </div>
      `;
      actions.innerHTML = `
        <a href="dashboard.html" style="
          display: inline-block;
          background: #0F172A;
          color: #FFFFFF;
          text-decoration: none;
          padding: 10px 24px;
          border-radius: 8px;
          font-weight: 700;
          font-size: 0.95rem;
        ">Return to Dashboard</a>
      `;

      backdrop.style.display = 'flex';
      this.disarm();
    }

    _removeModals() {
      const backdrop = document.getElementById('antiCheatModalBackdrop');
      if (backdrop && !this.isLocked) {
        backdrop.style.display = 'none';
      }
    }
  }

  return AntiCheatController;
});
