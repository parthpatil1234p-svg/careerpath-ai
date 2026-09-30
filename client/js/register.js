/**
 * register.js — Two-Step Registration & OTP Verification Controller
 * Team 404 Brain Not Found · CareerPath AI Platform
 */

document.addEventListener('DOMContentLoaded', () => {
  // If already authenticated, redirect to assessment
  if (window.Auth?.isAuthenticated()) {
    window.location.href = 'assessment.html';
    return;
  }

  // DOM Elements - Step 1
  const step1 = document.getElementById('registerStep1');
  const form = document.getElementById('registerForm');
  const alertContainer = document.getElementById('alertContainer');
  const submitBtn = document.getElementById('submitBtn');

  // DOM Elements - Step 2 (OTP)
  const step2 = document.getElementById('registerStep2');
  const displayEmail = document.getElementById('displayTargetEmail');
  const otpForm = document.getElementById('otpForm');
  const verifyOtpBtn = document.getElementById('verifyOtpBtn');
  const btnBackToForm = document.getElementById('btnBackToForm');
  const btnResendOtp = document.getElementById('btnResendOtp');
  const resendCountdown = document.getElementById('resendCountdown');
  const digitInputs = document.querySelectorAll('.otp-digit-field');

  let currentEmail = '';
  let countdownTimer = null;

  const showAlert = (message, type = 'danger') => {
    alertContainer.innerHTML = `
      <div class="alert alert-${type} alert-dismissible fade show d-flex align-items-center gap-2 py-2 px-3 small mb-3" role="alert">
        <i class="bi ${type === 'danger' ? 'bi-exclamation-triangle-fill' : 'bi-check-circle-fill'}"></i>
        <div>${escapeHtml(message)}</div>
        <button type="button" class="btn-close btn-close-white ms-auto p-2" data-bs-dismiss="alert" aria-label="Close"></button>
      </div>
    `;
  };

  // ── Initialize Google Authentication ────────────────────────
  if (window.GoogleAuth) {
    window.GoogleAuth.init({
      buttonId: 'btnGoogleAuth',
      wrapperId: 'g_id_signin_wrapper',
      showAlert,
      setLoadingState: (loading) => {
        const btn = document.getElementById('btnGoogleAuth');
        if (!btn) return;
        if (loading) {
          btn.disabled = true;
          btn.innerHTML = `
            <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            <span>Connecting to Google...</span>
          `;
        } else {
          btn.disabled = false;
          btn.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
              <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.616z"/>
              <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
              <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.347 2.825.957 4.039l3.007-2.332z"/>
              <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z"/>
            </svg>
            <span class="fw-semibold">Sign Up with Google</span>
          `;
        }
      },
      mode: 'signup',
    });
  }

  // ── Initialize GitHub Authentication ────────────────────────
  if (window.GitHubAuth) {
    window.GitHubAuth.init({
      buttonId: 'btnGitHubAuth',
      showAlert,
      mode: 'signup',
    });
  }

  // ── OTP Digit Input Auto-Focus Navigation ───────────────────
  digitInputs.forEach((input, index) => {
    // Digit typing
    input.addEventListener('input', (e) => {
      const val = e.target.value.replace(/\D/g, '');
      e.target.value = val;

      if (val && index < digitInputs.length - 1) {
        digitInputs[index + 1].focus();
      }
    });

    // Backspace handling
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !e.target.value && index > 0) {
        digitInputs[index - 1].focus();
      }
    });

    // Paste handling (e.g. user pastes 6 digits from Gmail)
    input.addEventListener('paste', (e) => {
      e.preventDefault();
      const pasteData = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '');
      if (pasteData.length >= 6) {
        pasteData.slice(0, 6).split('').forEach((char, i) => {
          if (digitInputs[i]) digitInputs[i].value = char;
        });
        digitInputs[5].focus();
      }
    });
  });

  // ── Countdown Timer for Resend OTP ──────────────────────────
  const startResendCountdown = (seconds = 60) => {
    if (countdownTimer) clearInterval(countdownTimer);
    btnResendOtp.disabled = true;

    let remaining = seconds;
    resendCountdown.textContent = `(${remaining}s)`;

    countdownTimer = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        clearInterval(countdownTimer);
        resendCountdown.textContent = '';
        btnResendOtp.disabled = false;
      } else {
        resendCountdown.textContent = `(${remaining}s)`;
      }
    }, 1000);
  };

  // ── Transition to Step 2 (OTP) ──────────────────────────────
  const showOtpStep = (email) => {
    currentEmail = email;
    if (displayEmail) displayEmail.textContent = email;

    step1.classList.add('d-none');
    step2.classList.remove('d-none');
    alertContainer.innerHTML = '';

    // Clear digit inputs and focus first
    digitInputs.forEach(input => input.value = '');
    if (digitInputs[0]) digitInputs[0].focus();

    startResendCountdown(60);
    showAlert('A 6-digit verification code has been sent to your email inbox. Please check your inbox and enter the code below.', 'info');
  };

  // Back to registration form
  if (btnBackToForm) {
    btnBackToForm.addEventListener('click', () => {
      step2.classList.add('d-none');
      step1.classList.remove('d-none');
      alertContainer.innerHTML = '';
      if (countdownTimer) clearInterval(countdownTimer);
    });
  }

  // ── Step 1: Submit Registration Form ────────────────────────
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    alertContainer.innerHTML = '';

    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (!name || name.length < 2) {
      showAlert('Name must be at least 2 characters.');
      return;
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showAlert('Please provide a valid email address.');
      return;
    }

    if (!password || password.length < 6) {
      showAlert('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      showAlert('Passwords do not match. Please re-check.');
      return;
    }

    const originalBtnContent = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = `
      <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
      <span>Creating Account...</span>
    `;

    try {
      const response = await window.API.post('/auth/register', { name, email, password });

      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnContent;

      if (response.success && (response.requiresOtp || !response.data?.token)) {
        showOtpStep(response.email || email);
      } else if (response.success && response.data?.token) {
        window.Auth.setToken(response.data.token);
        window.Auth.setCurrentUser(response.data.user);
        showAlert('Account created successfully! Taking you to assessment...', 'success');
        setTimeout(() => {
          window.location.href = 'assessment.html';
        }, 500);
      } else {
        showAlert(response.message || 'Registration failed. Please try again.');
      }
    } catch (err) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnContent;

      const isExisting =
        (err.message && err.message.toLowerCase().includes('already exists')) ||
        (err.data?.message && err.data.message.toLowerCase().includes('already exists'));

      if (isExisting) {
        alertContainer.innerHTML = `
          <div class="alert alert-warning border border-warning border-opacity-50 p-3 mb-3" role="alert">
            <div class="d-flex align-items-center gap-2 mb-1">
              <i class="bi bi-person-check text-warning fs-5"></i>
              <strong class="text-ink">Account Already Registered</strong>
            </div>
            <p class="small text-secondary mb-2">
              An account with <strong>${escapeHtml(email)}</strong> already exists. You can log in directly:
            </p>
            <a href="login.html" class="btn cp-btn-primary btn-sm w-100 py-1">
              Log In to Dashboard →
            </a>
          </div>
        `;
        return;
      }

      if (err.errors && Array.isArray(err.errors) && err.errors.length > 0) {
        const errorList = err.errors.map((e) => e.message).join('; ');
        showAlert(errorList);
      } else {
        showAlert(err.message || 'Registration failed. Please try again.');
      }
    }
  });

  // ── Step 2: Submit OTP Verification ─────────────────────────
  otpForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    alertContainer.innerHTML = '';

    const enteredOtp = Array.from(digitInputs).map(i => i.value.trim()).join('');

    if (enteredOtp.length !== 6) {
      showAlert('Please enter the complete 6-digit verification code sent to your Gmail.');
      return;
    }

    const originalBtn = verifyOtpBtn.innerHTML;
    verifyOtpBtn.disabled = true;
    verifyOtpBtn.innerHTML = `
      <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
      <span>Verifying Code...</span>
    `;

    try {
      const response = await window.API.post('/auth/verify-otp', {
        email: currentEmail,
        otp: enteredOtp,
      });

      if (response.success && response.data?.token) {
        window.Auth.setToken(response.data.token);
        window.Auth.setCurrentUser(response.data.user);

        showAlert('Account verified successfully! Taking you to assessment...', 'success');

        setTimeout(() => {
          window.location.href = 'assessment.html';
        }, 800);
      } else {
        verifyOtpBtn.disabled = false;
        verifyOtpBtn.innerHTML = originalBtn;
        showAlert(response.message || 'Verification failed. Please check the code.');
      }
    } catch (err) {
      verifyOtpBtn.disabled = false;
      verifyOtpBtn.innerHTML = originalBtn;
      showAlert(err.message || 'Verification failed. Please check code or request a new one.');
    }
  });

  // ── Resend OTP Button ───────────────────────────────────────
  btnResendOtp.addEventListener('click', async () => {
    alertContainer.innerHTML = '';
    btnResendOtp.disabled = true;

    try {
      const response = await window.API.post('/auth/resend-otp', { email: currentEmail });
      if (response.success) {
        startResendCountdown(60);
        showAlert('A fresh 6-digit verification code has been sent to your email inbox!', 'success');
      } else {
        showAlert(response.message || 'Could not resend OTP. Please try again.');
        btnResendOtp.disabled = false;
      }
    } catch (err) {
      btnResendOtp.disabled = false;
      showAlert(err.message || 'Failed to resend code.');
    }
  });

  // ── Step 2 Direct Access Check (e.g. from login redirect) ─────
  const urlParams = new URLSearchParams(window.location.search);
  const targetEmail = urlParams.get('email') || urlParams.get('verifyEmail');
  if ((urlParams.get('verify') === 'true' || urlParams.get('verifyEmail')) && targetEmail) {
    showOtpStep(targetEmail);
    showAlert('Please enter the 6-digit verification code sent to your email to activate your account.', 'info');
  }
});
