/**
 * github-auth.js — Client-Side GitHub Authentication & Study Connector
 * Team 404 Brain Not Found · CareerPath AI Platform
 *
 * Implements:
 * - GitHub OAuth2 web flow authentication
 * - Fast-Track Live GitHub Repository Connector (via public GitHub REST API)
 * - Repository & Skill Synchronization for Student Studies & Roadmaps
 */

window.GitHubAuth = (function () {
  let githubClientId = '';

  /**
   * Sends GitHub authentication payload to backend API
   */
  const sendGitHubAuthPayload = async (payload, callbacks = {}) => {
    const { showAlert, setLoadingState, onSuccess } = callbacks;

    if (setLoadingState) setLoadingState(true);

    try {
      const response = await window.API.post('/auth/github', payload);

      if (response.success && response.data?.token) {
        window.Auth.setToken(response.data.token);
        window.Auth.setCurrentUser(response.data.user);

        if (showAlert) {
          showAlert(response.message || 'GitHub authentication successful!', 'success');
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
        }, 600);
      } else {
        if (showAlert) {
          showAlert(response.message || 'GitHub authentication failed.');
        }
        if (setLoadingState) setLoadingState(false);
      }
    } catch (err) {
      if (showAlert) {
        showAlert(err.message || 'An error occurred during GitHub authentication.');
      }
      if (setLoadingState) setLoadingState(false);
    }
  };

  /**
   * Connects GitHub profile & study repositories for an already authenticated user
   */
  const connectGitHubAccount = async (username, callbacks = {}) => {
    const { showAlert = () => {}, setLoadingState = () => {}, onSuccess = null } = callbacks;

    if (setLoadingState) setLoadingState(true);

    try {
      const response = await window.API.post('/auth/github/connect', { username });

      if (response.success && response.data?.user) {
        window.Auth.setCurrentUser(response.data.user);
        if (showAlert) {
          showAlert(response.message || 'GitHub repositories linked to your study profile!', 'success');
        }
        if (onSuccess) {
          onSuccess(response.data);
        }
      } else {
        if (showAlert) {
          showAlert(response.message || 'Could not connect GitHub account.');
        }
      }
    } catch (err) {
      if (showAlert) {
        showAlert(err.message || 'Failed to connect GitHub account.');
      }
    } finally {
      if (setLoadingState) setLoadingState(false);
    }
  };

  /**
   * Renders the Fast-Track GitHub Evaluator Modal
   */
  const showFastTrackGitHubModal = (callbacks = {}, isConnectOnly = false) => {
    let modalEl = document.getElementById('githubFastTrackModal');
    if (!modalEl) {
      modalEl = document.createElement('div');
      modalEl.id = 'githubFastTrackModal';
      modalEl.className = 'modal fade';
      modalEl.tabIndex = -1;
      modalEl.setAttribute('aria-labelledby', 'githubFastTrackModalLabel');
      modalEl.setAttribute('aria-hidden', 'true');

      modalEl.innerHTML = `
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content glass-card border border-info border-opacity-25 bg-dark text-white p-2">
            <div class="modal-header border-bottom border-secondary border-opacity-25 pb-3">
              <div class="d-flex align-items-center gap-2">
                <div class="d-flex align-items-center justify-content-center bg-white rounded-circle p-1" style="width: 32px; height: 32px;">
                  <i class="bi bi-github text-dark fs-5"></i>
                </div>
                <div>
                  <h3 class="modal-title h6 fw-bold mb-0 text-white" id="githubFastTrackModalLabel">
                    ${isConnectOnly ? 'Connect GitHub Study Repositories' : 'GitHub Student Authentication'}
                  </h3>
                  <span class="font-mono text-muted small" style="font-size: 0.72rem;">Live Public GitHub API · Code-Grounded Verification</span>
                </div>
              </div>
              <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body py-3">
              <div class="p-3 mb-3 rounded-2 bg-black bg-opacity-40 border border-secondary border-opacity-25">
                <div class="d-flex align-items-center gap-3">
                  <div class="rounded-circle bg-secondary bg-opacity-20 text-white d-flex align-items-center justify-content-center fw-bold" style="width: 44px; height: 44px; font-size: 1.2rem;">
                    <i class="bi bi-code-slash text-teal"></i>
                  </div>
                  <div class="flex-grow-1 overflow-hidden">
                    <div class="fw-semibold text-white text-truncate" id="ghPreviewUsername">parthpatil1234p-svg</div>
                    <div class="text-muted small font-mono text-truncate" id="ghPreviewSub">Public Repositories & Tech Stack Analyzer</div>
                  </div>
                  <span class="badge bg-teal bg-opacity-25 text-teal font-mono small">CODE AUDIT</span>
                </div>
              </div>

              <div class="mb-3">
                <label for="ghUsernameInput" class="form-label small text-muted">Enter any GitHub Username (or test with demo):</label>
                <div class="input-group input-group-sm">
                  <span class="input-group-text bg-dark border-secondary border-opacity-50 text-muted">https://github.com/</span>
                  <input type="text" id="ghUsernameInput" class="form-control bg-dark text-white border-secondary border-opacity-50 font-mono" placeholder="username" value="parthpatil1234p-svg" />
                </div>
                <div class="form-text text-muted small">CareerPath AI will analyze your real public repos to detect skills and map them to your career roadmap.</div>
              </div>

              <!-- Quick Demo Presets -->
              <div class="d-flex align-items-center gap-2 mb-2 flex-wrap">
                <span class="text-muted small font-mono" style="font-size: 0.72rem;">Quick Presets:</span>
                <button type="button" class="btn btn-outline-secondary btn-sm py-0 px-2 font-mono small gh-preset-btn" data-user="parthpatil1234p-svg">parthpatil1234p-svg</button>
                <button type="button" class="btn btn-outline-secondary btn-sm py-0 px-2 font-mono small gh-preset-btn" data-user="octocat">octocat</button>
              </div>
            </div>
            <div class="modal-footer border-top border-secondary border-opacity-25 pt-3">
              <button type="button" class="btn btn-outline-secondary btn-sm" data-bs-dismiss="modal">Cancel</button>
              <button type="button" id="btnConfirmFastTrackGitHub" class="btn cp-btn-primary btn-sm px-4 d-flex align-items-center gap-2">
                <i class="bi bi-arrow-repeat"></i>
                <span>Analyze & Link Repositories</span>
              </button>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(modalEl);

      const usernameInput = modalEl.querySelector('#ghUsernameInput');
      const previewUsername = modalEl.querySelector('#ghPreviewUsername');

      usernameInput.addEventListener('input', (e) => {
        previewUsername.textContent = e.target.value.trim() || 'student-dev';
      });

      modalEl.querySelectorAll('.gh-preset-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          const user = btn.getAttribute('data-user');
          usernameInput.value = user;
          previewUsername.textContent = user;
        });
      });

      const confirmBtn = modalEl.querySelector('#btnConfirmFastTrackGitHub');
      confirmBtn.addEventListener('click', () => {
        const username = usernameInput.value.trim() || 'parthpatil1234p-svg';
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
      });
    }

    const modalInstance = new bootstrap.Modal(modalEl);
    modalInstance.show();
  };

  /**
   * Initializes GitHub Auth Button on Login or Register
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

    // 1. Resolve GitHub Client ID if configured
    if (window.CONFIG?.GITHUB_CLIENT_ID) {
      githubClientId = window.CONFIG.GITHUB_CLIENT_ID.trim();
    }
    try {
      const configRes = await window.API.get('/auth/github/config');
      if (configRes.success && configRes.data?.clientId) {
        githubClientId = configRes.data.clientId.trim();
      }
    } catch (e) {
      // Continue silently with fast-track mode
    }

    // 2. Check if page loaded with ?code= from GitHub OAuth redirect
    const urlParams = new URLSearchParams(window.location.search);
    const oauthCode = urlParams.get('code');
    if (oauthCode && !window.Auth?.isAuthenticated()) {
      sendGitHubAuthPayload({ code: oauthCode }, { showAlert, setLoadingState, onSuccess });
      return;
    }

    // 3. Attach click listener
    btnGitHub.addEventListener('click', (e) => {
      e.preventDefault();

      if (githubClientId && !githubClientId.includes('your_github')) {
        // Real GitHub OAuth redirect
        const redirectUri = encodeURIComponent(`${window.location.origin}${window.location.pathname}`);
        window.location.href = `https://github.com/login/oauth/authorize?client_id=${githubClientId}&redirect_uri=${redirectUri}&scope=read:user,repo`;
      } else {
        // Fast-track Live Public API Modal
        showFastTrackGitHubModal({ showAlert, setLoadingState, onSuccess }, false);
      }
    });
  };

  return {
    init,
    sendGitHubAuthPayload,
    connectGitHubAccount,
    showFastTrackGitHubModal,
  };
})();
