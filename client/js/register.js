/**
 * register.js — Two-Step Registration & OTP Verification Controller
 * Team 404 Brain Not Found · Hack2Ignite 2026–27
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
  const demoOtpBadge = document.getElementById('demoOtpBadge');
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

    // Paste handling (e.g. user pastes 6 digits)
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

  // Autofill all digit boxes with a code
  const fillOtpCode = (code) => {
    if (!code) return;
    const str = String(code).trim();
    str.split('').slice(0, 6).forEach((digit, i) => {
      if (digitInputs[i]) digitInputs[i].value = digit;
    });
    if (digitInputs[5]) digitInputs[5].focus();
  };

  // Demo OTP Badge click-to-autofill helper
  if (demoOtpBadge) {
    demoOtpBadge.addEventListener('click', () => {
      const code = demoOtpBadge.textContent.trim();
      if (code && code !== '------') {
        fillOtpCode(code);
        showAlert('Demo code autofilled! Click Verify to activate.', 'info');
      }
    });
  }

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
  const showOtpStep = (email, demoCode) => {
    currentEmail = email;
    if (displayEmail) displayEmail.textContent = email;
    if (demoOtpBadge && demoCode) {
      demoOtpBadge.textContent = demoCode;
    }

    step1.classList.add('d-none');
    step2.classList.remove('d-none');
    alertContainer.innerHTML = '';

    // Clear digit inputs and focus first
    digitInputs.forEach(input => input.value = '');
    if (digitInputs[0]) digitInputs[0].focus();

    startResendCountdown(60);
    showAlert('A 6-digit verification code has been generated.', 'info');
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
      <span>Generating Verification Code...</span>
    `;

    try {
      const response = await window.API.post('/auth/register', { name, email, password });

      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnContent;

      if (response.success && response.data?.requiresVerification) {
        showOtpStep(response.data.email, response.data.demoOtp);
      } else if (response.success && response.data?.token) {
        // Fallback direct login if already verified
        window.Auth.setToken(response.data.token);
        window.Auth.setCurrentUser(response.data.user);
        window.location.href = 'assessment.html';
      } else {
        showAlert(response.message || 'Registration failed. Please try again.');
      }
    } catch (err) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnContent;

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
      showAlert('Please enter the complete 6-digit verification code.');
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
      if (response.success && response.data?.demoOtp) {
        if (demoOtpBadge) demoOtpBadge.textContent = response.data.demoOtp;
        showAlert('New verification code generated and sent!', 'success');
        startResendCountdown(60);
      } else {
        showAlert(response.message || 'Could not resend OTP. Please try again.');
        btnResendOtp.disabled = false;
      }
    } catch (err) {
      btnResendOtp.disabled = false;
      showAlert(err.message || 'Failed to resend code.');
    }
  });
});
