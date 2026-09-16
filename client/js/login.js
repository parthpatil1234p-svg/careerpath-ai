/**
 * login.js — Login Controller
 *
 * Handles login submission, validation, auth token persistence, and redirection.
 */

document.addEventListener('DOMContentLoaded', () => {
  // If already authenticated, redirect to assessment
  if (window.Auth?.isAuthenticated()) {
    window.location.href = 'assessment.html';
    return;
  }

  const form = document.getElementById('loginForm');
  const alertContainer = document.getElementById('alertContainer');
  const submitBtn = document.getElementById('submitBtn');

  const showAlert = (message, type = 'danger') => {
    alertContainer.innerHTML = `
      <div class="alert alert-${type} alert-dismissible fade show d-flex align-items-center gap-2 py-2 px-3 small mb-3" role="alert">
        <i class="bi ${type === 'danger' ? 'bi-exclamation-triangle-fill' : 'bi-check-circle-fill'}"></i>
        <div>${escapeHtml(message)}</div>
        <button type="button" class="btn-close btn-close-white ms-auto p-2" data-bs-dismiss="alert" aria-label="Close"></button>
      </div>
    `;
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    alertContainer.innerHTML = '';

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    if (!email || !password) {
      showAlert('Please enter both your email address and password.');
      return;
    }

    // Button loading state
    const originalBtnContent = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = `
      <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
      <span>Signing In...</span>
    `;

    try {
      const response = await window.API.post('/auth/login', { email, password });

      if (response.success && response.data?.token) {
        window.Auth.setToken(response.data.token);
        window.Auth.setCurrentUser(response.data.user);

        showAlert('Login successful! Redirecting...', 'success');

        // Check for redirect param
        const urlParams = new URLSearchParams(window.location.search);
        const redirect = urlParams.get('redirect');

        setTimeout(() => {
          if (redirect) {
            window.location.href = decodeURIComponent(redirect);
          } else if (response.data.user?.profileCompleted) {
            window.location.href = 'recommendations.html';
          } else {
            window.location.href = 'assessment.html';
          }
        }, 700);
      } else {
        showAlert(response.message || 'Login failed. Please check your credentials.');
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnContent;
      }
    } catch (err) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnContent;

      const isUnverified =
        err.status === 403 &&
        (err.data?.requiresVerification ||
          (err.message && err.message.toLowerCase().includes('verified')));

      if (isUnverified) {
        const targetEmail = err.data?.data?.email || email;
        const demoOtp = err.data?.data?.demoOtp || '';
        const verifyUrl = `register.html?verify=true&email=${encodeURIComponent(targetEmail)}${demoOtp ? '&demoOtp=' + encodeURIComponent(demoOtp) : ''}`;

        alertContainer.innerHTML = `
          <div class="alert alert-warning border border-warning border-opacity-50 p-3 mb-3" role="alert">
            <div class="d-flex align-items-center gap-2 mb-2">
              <i class="bi bi-shield-exclamation text-warning fs-5"></i>
              <strong class="text-white">Email Verification Required</strong>
            </div>
            <p class="small text-white-50 mb-2">
              Your account is not verified yet. A 6-digit verification code has been generated for <strong>${escapeHtml(targetEmail)}</strong>.
            </p>
            <a href="${verifyUrl}" class="btn cp-btn-primary btn-sm w-100 py-2 d-flex align-items-center justify-content-center gap-2">
              <span>Enter 6-Digit OTP Code</span>
              <i class="bi bi-arrow-right"></i>
            </a>
          </div>
        `;

        setTimeout(() => {
          window.location.href = verifyUrl;
        }, 2200);
        return;
      }

      showAlert(err.message || 'Login failed. Please try again.');
    }
  });
});
