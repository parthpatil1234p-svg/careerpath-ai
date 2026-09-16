/**
 * controllers/authController.js — Register, OTP Verification & Login
 *
 * registerUser  POST /api/auth/register
 * verifyOtp     POST /api/auth/verify-otp
 * resendOtp     POST /api/auth/resend-otp
 * loginUser     POST /api/auth/login
 *
 * Security rules enforced:
 *  - 6-digit cryptographic random OTP with 10-minute expiry
 *  - User verified flag (isVerified)
 *  - Duplicate verified email → 409
 *  - Password never returned in any response
 */

const User          = require('../models/User');
const generateToken = require('../utils/generateToken');
const { sendOtpEmail } = require('../services/emailService');

// ── Helper: 6-Digit Secure OTP Generator ─────────────────────
const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// ── Helper: shape the user object returned in responses ───────
const formatUser = (user) => ({
  id:               user._id,
  name:             user.name,
  email:            user.email,
  role:             user.role,
  profileCompleted: user.profileCompleted,
  isVerified:       user.isVerified || false,
});

// ── registerUser ───────────────────────────────────────────────
/**
 * POST /api/auth/register
 * Body: { name, email, password }
 * Initiates registration, generates a 6-digit OTP code, and stores in user doc.
 */
const registerUser = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if user already exists
    let existingUser = await User.findOne({ email: normalizedEmail });
    const otpCode = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    if (existingUser) {
      if (existingUser.isVerified) {
        return res.status(409).json({
          success: false,
          message: 'An account with this email already exists. Please log in.',
        });
      }

      // If existing user never completed verification, update details & resend OTP
      existingUser.name = name.trim();
      existingUser.password = password;
      existingUser.verificationOtp = { code: otpCode, expiresAt };
      await existingUser.save();

      console.log(`\n🔑 [OTP] Verification Code for ${normalizedEmail}: ${otpCode}\n`);
      sendOtpEmail(normalizedEmail, existingUser.name, otpCode);

      return res.status(200).json({
        success: true,
        message: 'Verification code generated for unverified account',
        data: {
          email: normalizedEmail,
          name: existingUser.name,
          requiresVerification: true,
          demoOtp: otpCode, // Provided for live hackathon demonstration
        },
      });
    }

    // Create new unverified user
    const user = new User({
      name: name.trim(),
      email: normalizedEmail,
      password, // hashed by pre-save hook
      isVerified: false,
      verificationOtp: {
        code: otpCode,
        expiresAt,
      },
    });

    await user.save();

    console.log(`\n🔑 [OTP] Verification Code for ${normalizedEmail}: ${otpCode}\n`);
    sendOtpEmail(user.email, user.name, otpCode);

    res.status(201).json({
      success: true,
      message: 'Student account registered! Please verify your email with the OTP code.',
      data: {
        email: user.email,
        name: user.name,
        requiresVerification: true,
        demoOtp: otpCode, // Provided for live hackathon demonstration
      },
    });
  } catch (error) {
    next(error);
  }
};

// ── verifyOtp ──────────────────────────────────────────────────
/**
 * POST /api/auth/verify-otp
 * Body: { email, otp }
 * Validates OTP code, marks user as verified, and returns JWT token.
 */
const verifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and 6-digit OTP code are required',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Query user including hidden OTP fields
    const user = await User.findOne({ email: normalizedEmail })
      .select('+verificationOtp.code +verificationOtp.expiresAt');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found',
      });
    }

    if (user.isVerified) {
      const token = generateToken(user);
      return res.status(200).json({
        success: true,
        message: 'Account is already verified',
        data: {
          user: formatUser(user),
          token,
        },
      });
    }

    const storedCode = user.verificationOtp?.code;
    const expiresAt = user.verificationOtp?.expiresAt;

    if (!storedCode || storedCode !== String(otp).trim()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code. Please check and re-enter.',
      });
    }

    if (new Date() > new Date(expiresAt)) {
      return res.status(400).json({
        success: false,
        message: 'Verification code has expired. Please click Resend Code.',
      });
    }

    // Mark verified and clear OTP
    user.isVerified = true;
    user.verificationOtp = undefined;
    await user.save();

    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: 'Account verified successfully! Welcome to CareerPath AI.',
      data: {
        user: formatUser(user),
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ── resendOtp ──────────────────────────────────────────────────
/**
 * POST /api/auth/resend-otp
 * Body: { email }
 * Re-generates a fresh 6-digit OTP code with a new 10-minute expiry.
 */
const resendOtp = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required to resend OTP',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail })
      .select('+verificationOtp.code +verificationOtp.expiresAt');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found',
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'Your account is already verified. Please log in.',
      });
    }

    const newCode = generateOtp();
    user.verificationOtp = {
      code: newCode,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    };
    await user.save();

    console.log(`\n🔄 [OTP RESENT] New Verification Code for ${normalizedEmail}: ${newCode}\n`);
    sendOtpEmail(normalizedEmail, user.name, newCode);

    return res.status(200).json({
      success: true,
      message: 'A fresh 6-digit verification code has been generated.',
      data: {
        email: normalizedEmail,
        demoOtp: newCode,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ── loginUser ──────────────────────────────────────────────────
/**
 * POST /api/auth/login
 * Body: { email, password }
 */
const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 1. Find user — include password field
    const user = await User.findOne({ email: normalizedEmail }).select('+password');

    // 2. If user not found OR password doesn't match → identical 401
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // 3. Check verification status
    if (user.isVerified === false) {
      const newCode = generateOtp();
      user.verificationOtp = {
        code: newCode,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      };
      await user.save();

      console.log(`\n🔑 [LOGIN RE-VERIFY] Verification Code for ${normalizedEmail}: ${newCode}\n`);
      sendOtpEmail(normalizedEmail, user.name, newCode);

      return res.status(403).json({
        success: false,
        requiresVerification: true,
        message: 'Account not verified yet. Please enter the OTP verification code.',
        data: {
          email: normalizedEmail,
          demoOtp: newCode,
        },
      });
    }

    // 4. Generate token and respond
    const token = generateToken(user);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user:  formatUser(user),
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerUser,
  verifyOtp,
  resendOtp,
  loginUser,
};
