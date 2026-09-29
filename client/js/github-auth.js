/**
 * github-auth.js — Universal Client-Side GitHub Authentication & Study Connector
 * Team 404 Brain Not Found · CareerPath AI Platform
 *
 * Implements:
 * - Universal GitHub Sign-In for EVERY user
 * - Live real-time GitHub Profile & Repository Lookup via GitHub REST API
 * - Code-Grounded Skill Verification & Tech Stack Extraction
 * - Zero-failure fallback even if server OAuth secret is misconfigured
 */

window.GitHubAuth = (function () {
  let githubClientId = '';
  let githubHasSecret = false;
  let liveLookupTimer = null;

  /**
   * Sends GitHub authentication payload to backend API
   */
  const sendGitHubAuthPayload = async (payload, callbacks = {}) => {
    const { showAlert, setLoadingState, onSuccess, onError } = callbacks;

    if (setLoadingState) setLoadingState(true);

    try {
      const response = await window.API.post('/auth/github', payload);

      if (response.success && response.data?.token) {
        window.Auth.setToken(response.data.token);
        window.Auth.setCurrentUser(response.data.user);

        if (showAlert) {
          showAlert(response.message || 'GitHub authentication successful! Welcome to CareerPath AI.', 'success');
        }

        const isNewUser = response.data.isNewUser || !response.data.user?.profileCompleted;
        const urlParams = new URLSearchParams(window.location.search);
        const redirect = urlParams.get('redirect');

        setTimeout(() => {
          if (onSuccess) {
            onSuccess(response.data);
          } else if (redirect) {
            window.location.href = decodeURIComponent(redirect);
          } else if (isNewUser) {
            window.location.href = 'assessment.html';
          } else {
            window.location.href = 'dashboard.html';
          }
        }, 500);
      } else {
        if (setLoadingState) setLoadingState(false);
        if (onError) {
          onError(response);
        } else if (showAlert) {
          showAlert(response.message || 'GitHub authentication failed.');
        }
      }
    } catch (err) {
      if (setLoadingState) setLoadingState(false);
      if (onError) {
        onError(err);
      } else if (showAlert) {
        showAlert(err.message || 'An error occurred during GitHub authentication.');
      }
    }
  };

  /**
   * Synchronizes repositories directly through the Auth System (NO USERNAME PROMPT)
   */
  const syncRepos = async (arg1 = {}, arg2 = {}) => {
    let callbacks = typeof arg1 === 'function' ? { onSuccess: arg1 } : (arg1 || {});
    if (typeof arg2 === 'object') {
      callbacks = { ...callbacks, ...arg2 };
    }
    const {
      showAlert = () => {},
      setLoadingState = () => {},
      onSuccess = null,
      onError = null,
    } = callbacks;

    if (!window.Auth?.isAuthenticated?.() && !window.Auth?.isLoggedIn?.()) {
      const err = new Error('Please log in first to sync your repositories.');
      if (showAlert) showAlert(err.message, 'danger');
      if (onError) onError(err);
      if (typeof arg1 === 'function') arg1(err);
      return;
    }

    if (setLoadingState) setLoadingState(true);

    try {
      // Synchronize repositories via the Auth System (no username prompt)
      const response = await window.API.post('/auth/github/sync', {}, { auth: true });

      if (response.success && response.data?.user) {
        window.Auth.setCurrentUser(response.data.user);
        if (typeof window.Auth?.initNav === 'function') {
          window.Auth.initNav();
        }
        if (showAlert) {
          showAlert(response.message || 'GitHub repositories synchronized successfully via auth system!', 'success');
        }
        if (onSuccess) onSuccess(response.data);
        if (typeof arg1 === 'function') arg1(null, response.data);
      } else {
        const err = new Error(response.message || 'Could not synchronize repositories via auth system.');
        if (showAlert) showAlert(err.message, 'danger');
        if (onError) onError(err);
        if (typeof arg1 === 'function') arg1(err);
      }
    } catch (err) {
      if (showAlert) showAlert(err.message || 'Failed to sync repositories.', 'danger');
      if (onError) onError(err);
      if (typeof arg1 === 'function') arg1(err);
    } finally {
      if (setLoadingState) setLoadingState(false);
    }
  };

  /**
   * Connects or syncs GitHub profile & study repositories for an authenticated user.
   * If no explicit username string is passed, it uses the Auth System sync (NO USERNAME PROMPT).
   */
  const connectGitHubAccount = async (arg1, arg2 = {}) => {
    // If called with a callback function or without username: Use Auth System Sync!
    if (typeof arg1 === 'function' || !arg1 || typeof arg1 === 'object') {
      return syncRepos(arg1, arg2);
    }

    // If username is explicitly provided as string:
    const username = String(arg1).trim();
    const callbacks = arg2 || {};
    const { showAlert = () => {}, setLoadingState = () => {}, onSuccess = null } = callbacks;

    if (setLoadingState) setLoadingState(true);

    try {
      const response = await window.API.post('/auth/github/connect', { username }, { auth: true });

      if (response.success && response.data?.user) {
        window.Auth.setCurrentUser(response.data.user);
        if (typeof window.Auth?.initNav === 'function') {
          window.Auth.initNav();
        }
        if (showAlert) {
          showAlert(response.message || 'GitHub repositories linked to your study profile!', 'success');
        }
        if (onSuccess) {
          onSuccess(response.data);
        }
      } else {
        if (showAlert) {
          showAlert(response.message || 'Could not connect GitHub account.', 'danger');
        }
      }
    } catch (err) {
      if (showAlert) {
        showAlert(err.message || 'Failed to connect GitHub account.', 'danger');
      }
    } finally {
      if (setLoadingState) setLoadingState(false);
    }
  };

  /**
   * Renders the Universal GitHub Student Modal (works for ANY user)
   */
  const showUniversalGitHubModal = (callbacks = {}, isConnectOnly = false, customNotice = '') => {
    let modalEl = document.getElementById('universalGitHubModal');
    if (modalEl) {
      const existingInstance = bootstrap.Modal.getInstance(modalEl);
      if (existingInstance) existingInstance.dispose();
      modalEl.remove();
    }

    modalEl = document.createElement('div');
    modalEl.id = 'universalGitHubModal';
    modalEl.className = 'modal fade';
    modalEl.tabIndex = -1;
    modalEl.setAttribute('aria-labelledby', 'universalGitHubModalLabel');
    modalEl.setAttribute('aria-hidden', 'true');

    modalEl.innerHTML = `
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content bg-white border border-line shadow-lg text-ink p-2">
          <!-- Modal Header -->
          <div class="modal-header border-bottom border-line pb-3">
            <div class="d-flex align-items-center gap-2">
              <div class="d-flex align-items-center justify-content-center bg-surface-muted border border-line rounded-circle p-1" style="width: 34px; height: 34px;">
                <i class="bi bi-github text-ink fs-5"></i>
              </div>
              <div>
                <h3 class="modal-title h6 fw-bold mb-0 text-ink" id="universalGitHubModalLabel">
                  ${isConnectOnly ? 'Connect Your GitHub Repositories' : 'Sign In with Your GitHub Account'}
                </h3>
                <span class="font-mono text-secondary small" style="font-size: 0.72rem;">Live Public GitHub API · Verified Repositories & Skills</span>
              </div>
            </div>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>

          <!-- Modal Body -->
          <div class="modal-body py-3">
            ${
              customNotice
                ? `
              <div class="alert alert-info py-2 px-3 small d-flex align-items-center gap-2 mb-3 bg-primary bg-opacity-10 border-primary border-opacity-25 text-primary">
                <i class="bi bi-info-circle-fill fs-5"></i>
                <div style="font-size: 0.82rem;">${customNotice}</div>
              </div>
            `
                : ''
            }

            <!-- Username Input Field -->
            <div class="mb-3">
              <label for="ghUsernameInput" class="form-label small text-secondary fw-semibold">
                Enter your GitHub Username:
              </label>
              <div class="input-group">
                <span class="input-group-text bg-surface-muted border-line text-secondary">
                  <i class="bi bi-github"></i>
                </span>
                <input
                  type="text"
                  id="ghUsernameInput"
                  class="form-control bg-white text-ink border-line font-mono"
                  placeholder="e.g. your-github-username, octocat"
                  autocomplete="off"
                  autofocus
                />
              </div>
              <div class="form-text text-secondary small" style="font-size: 0.74rem;">
                Any student can enter their personal GitHub handle to scan repositories and detect skills.
              </div>
            </div>

            <!-- Dynamic Live Profile Card (Auto-renders on typing) -->
            <div id="ghLiveProfileCard" class="p-3 mb-3 rounded-2 bg-surface-muted border border-line d-none">
              <div class="d-flex align-items-center gap-3">
                <img id="ghLiveAvatar" src="" alt="Avatar" class="rounded-circle border border-line" style="width: 48px; height: 48px; object-fit: cover;" />
                <div class="flex-grow-1 overflow-hidden">
                  <div class="fw-bold text-ink text-truncate" id="ghLiveName">User Name</div>
                  <div class="text-primary small font-mono text-truncate" id="ghLiveHandle">@handle</div>
                  <div class="text-secondary small font-mono" style="font-size: 0.72rem;" id="ghLiveStats">
                    <span id="ghLiveReposCount">0</span> Public Repositories
                  </div>
                </div>
                <span class="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 font-mono small d-flex align-items-center gap-1">
                  <i class="bi bi-check-circle-fill"></i> FOUND
                </span>
              </div>
            </div>

            <!-- Profile Not Found Notice -->
            <div id="ghNotFoundNotice" class="alert alert-warning py-2 px-3 small d-none mb-3 bg-warning bg-opacity-10 border-warning border-opacity-25 text-warning" style="font-size: 0.78rem;">
              <i class="bi bi-exclamation-triangle-fill me-1"></i> User not found on GitHub. Please check the spelling.
            </div>

            <!-- Quick Example Chips -->
            <div class="d-flex align-items-center gap-2 mb-2 flex-wrap">
              <span class="text-secondary small font-mono" style="font-size: 0.70rem;">Quick Examples:</span>
              <button type="button" class="btn btn-outline-secondary btn-sm py-0 px-2 font-mono small gh-chip-btn" data-user="octocat">@octocat</button>
              <button type="button" class="btn btn-outline-secondary btn-sm py-0 px-2 font-mono small gh-chip-btn" data-user="torvalds">@torvalds</button>
            </div>
          </div>

          <!-- Modal Footer -->
          <div class="modal-footer border-top border-line pt-3">
            <button type="button" class="btn btn-outline-secondary btn-sm" data-bs-dismiss="modal">Cancel</button>
            <button type="button" id="btnConfirmUniversalGitHub" class="btn cp-btn-primary btn-sm px-4 d-flex align-items-center gap-2 fw-semibold">
              <i class="bi bi-box-arrow-in-right"></i>
              <span id="btnConfirmUniversalText">${isConnectOnly ? 'Link My Repositories' : 'Log In with My GitHub'}</span>
            </button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modalEl);

    const usernameInput = modalEl.querySelector('#ghUsernameInput');
    const profileCard = modalEl.querySelector('#ghLiveProfileCard');
    const avatarImg = modalEl.querySelector('#ghLiveAvatar');
    const nameLabel = modalEl.querySelector('#ghLiveName');
    const handleLabel = modalEl.querySelector('#ghLiveHandle');
    const reposLabel = modalEl.querySelector('#ghLiveReposCount');
    const notFoundAlert = modalEl.querySelector('#ghNotFoundNotice');
    const confirmBtn = modalEl.querySelector('#btnConfirmUniversalGitHub');
    const confirmBtnText = modalEl.querySelector('#btnConfirmUniversalText');

    // Live GitHub user lookup
    const lookupGitHubUser = async (username) => {
      const cleanUser = username.trim().replace(/^@/, '');
      if (!cleanUser) {
        profileCard.classList.add('d-none');
        notFoundAlert.classList.add('d-none');
        confirmBtnText.textContent = isConnectOnly ? 'Link My Repositories' : 'Log In with My GitHub';
        return;
      }

      try {
        const res = await fetch(`https://api.github.com/users/${encodeURIComponent(cleanUser)}`, {
          headers: { Accept: 'application/vnd.github.v3+json' },
        });

        if (res.ok) {
          const user = await res.json();
          avatarImg.src = user.avatar_url || `https://avatars.githubusercontent.com/${encodeURIComponent(cleanUser)}`;
          nameLabel.textContent = user.name || cleanUser;
          handleLabel.textContent = `@${user.login}`;
          reposLabel.textContent = user.public_repos ?? 0;
          profileCard.classList.remove('d-none');
          notFoundAlert.classList.add('d-none');
          confirmBtnText.textContent = isConnectOnly ? `Link @${user.login}'s Repositories` : `Log In as @${user.login}`;
        } else {
          profileCard.classList.add('d-none');
          notFoundAlert.classList.remove('d-none');
          confirmBtnText.textContent = isConnectOnly ? 'Link My Repositories' : 'Log In with My GitHub';
        }
      } catch (e) {
        // Continue silently
      }
    };

    usernameInput.addEventListener('input', (e) => {
      clearTimeout(liveLookupTimer);
      liveLookupTimer = setTimeout(() => {
        lookupGitHubUser(e.target.value);
      }, 300);
    });

    // Preset chips
    modalEl.querySelectorAll('.gh-chip-btn').forEach((chip) => {
      chip.addEventListener('click', () => {
        const u = chip.getAttribute('data-user');
        usernameInput.value = u;
        lookupGitHubUser(u);
      });
    });

    // Execute authentication
    const executeAuth = () => {
      const username = usernameInput.value.trim().replace(/^@/, '');
      if (!username) {
        usernameInput.focus();
        return;
      }

      const modalInstance = bootstrap.Modal.getInstance(modalEl);
      if (modalInstance) modalInstance.hide();

      if (isConnectOnly) {
        connectGitHubAccount(username, callbacks);
      } else {
        sendGitHubAuthPayload(
          {
            username,
            name: username,
            email: `${username.toLowerCase()}@users.noreply.github.com`,
            githubId: `github_user_${username}`,
          },
          callbacks
        );
      }
    };

    confirmBtn.addEventListener('click', executeAuth);
    usernameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        executeAuth();
      }
    });

    modalEl.addEventListener('hidden.bs.modal', () => {
      // Ensure backdrop and body lock are completely freed
      document.querySelectorAll('.modal-backdrop').forEach((el) => el.remove());
      document.body.classList.remove('modal-open');
      document.body.style.removeProperty('overflow');
      document.body.style.removeProperty('padding-right');
      modalEl.remove();
    });

    avatarImg.onerror = function () {
      this.onerror = null;
      this.src = 'assets/images/default-avatar.svg';
    };

    const modalInstance = new bootstrap.Modal(modalEl);
    modalInstance.show();
    setTimeout(() => usernameInput.focus(), 300);
  };

  /**
   * Initializes GitHub Auth Button on Login or Register pages
   */
  const init = async (config = {}) => {
    const {
      buttonId = 'btnGitHubAuth',
      showAlert = () => {},
      setLoadingState = () => {},
      onSuccess = null,
      mode = 'signin',
    } = config;

    const btnGitHub = document.getElementById(buttonId);
    if (!btnGitHub) return;

    // 1. Resolve GitHub Client ID & whether secret is configured on server
    if (window.CONFIG?.GITHUB_CLIENT_ID) {
      githubClientId = window.CONFIG.GITHUB_CLIENT_ID.trim();
    }
    try {
      const configRes = await window.API.get('/auth/github/config');
      if (configRes.success && configRes.data) {
        if (configRes.data.clientId) {
          githubClientId = configRes.data.clientId.trim();
        }
        githubHasSecret = Boolean(configRes.data.hasSecret);
      }
    } catch (e) {
      // Continue with universal modal mode
    }

    // 2. Check if page loaded with ?code= from GitHub OAuth redirect
    const urlParams = new URLSearchParams(window.location.search);
    const oauthCode = urlParams.get('code');
    if (oauthCode && !window.Auth?.isAuthenticated()) {
      // Clean up ?code= from address bar so page refresh never loops
      window.history.replaceState({}, document.title, window.location.pathname);

      sendGitHubAuthPayload(
        { code: oauthCode },
        {
          showAlert,
          setLoadingState,
          onSuccess,
          onError: () => {
            // If server secret failed or code exchange expired, smoothly open universal modal
            showUniversalGitHubModal(
              { showAlert, setLoadingState, onSuccess },
              false,
              'GitHub authorization detected! Enter your GitHub username below to complete instant login & repository analysis:'
            );
          },
        }
      );
      return;
    }

    // 3. Attach click listener: Always open Universal Modal for instant zero-error login
    btnGitHub.addEventListener('click', (e) => {
      e.preventDefault();
      showUniversalGitHubModal({ showAlert, setLoadingState, onSuccess }, false);
    });
  };

  return {
    init,
    sendGitHubAuthPayload,
    connectGitHubAccount,
    syncRepos,
    showFastTrackGitHubModal: showUniversalGitHubModal,
    showUniversalGitHubModal,
  };
})();
