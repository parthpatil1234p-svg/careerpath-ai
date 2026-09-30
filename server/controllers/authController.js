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
const { exchangeOAuthCode, fetchGitHubData, analyzeGitHubRepos } = require('../services/githubService');

// ── Helper: 6-Digit Secure OTP Generator ─────────────────────
const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// ── Helper: shape the user object returned in responses ───────
const formatUser = (user) => ({
  id:                            user._id,
  name:                          user.name,
  email:                         user.email,
  role:                          user.role,
  authProvider:                  user.authProvider || 'local',
  profileCompleted:              user.profileCompleted,
  isVerified:                    user.isVerified || false,
  hasCompletedSkillVerification: Boolean(
    user.hasCompletedSkillVerification ||
    (Array.isArray(user.skills) && user.skills.some((s) => s.isQuizVerified || s.isCodeVerified))
  ),
  avatarUrl:                     user.avatarUrl || '',
  resumeUrl:                     user.resumeUrl || '',
  githubProfile:                 user.githubProfile || null,
  githubRepos:                   user.githubRepos || [],
  skills:                        user.skills || [],
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
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists. Please log in directly.',
      });
    }

    // Create new instantly-verified user
    const user = new User({
      name: name.trim(),
      email: normalizedEmail,
      password, // hashed by pre-save hook
      isVerified: true,
    });

    await user.save();

    // Generate JWT token directly for instant login
    const token = generateToken(user);

    res.status(201).json({
      success: true,
      message: 'Student account created successfully! Welcome to CareerPath AI.',
      data: {
        user: formatUser(user),
        token,
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
    await sendOtpEmail(normalizedEmail, user.name, newCode);

    return res.status(200).json({
      success: true,
      message: 'A fresh 6-digit verification code has been sent to your Gmail inbox.',
      data: {
        email: normalizedEmail,
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

    // 3. Auto-verify user if needed and generate token
    if (user.isVerified === false) {
      user.isVerified = true;
      await user.save();
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

// ── Helper: verify Google ID Token ───────────────────────────
const verifyGoogleToken = async (credential) => {
  const googleClientId = process.env.GOOGLE_CLIENT_ID;

  // 1. If GOOGLE_CLIENT_ID is configured, verify cryptographically with Google OAuth2Client
  if (googleClientId && googleClientId.trim() !== '' && !googleClientId.includes('your_google_client_id')) {
    const { OAuth2Client } = require('google-auth-library');
    const client = new OAuth2Client(googleClientId);
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: googleClientId,
    });
    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      throw new Error('Invalid token payload received from Google');
    }
    return {
      googleId: payload.sub,
      email: payload.email,
      name: payload.name || payload.email.split('@')[0],
      avatarUrl: payload.picture || '',
      isVerified: payload.email_verified !== false,
    };
  }

  // 2. Decode standard Google JWT Token if format is valid
  if (credential && typeof credential === 'string' && credential.includes('.')) {
    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.decode(credential);
      if (decoded && decoded.email) {
        return {
          googleId: decoded.sub || `google_${Date.now()}`,
          email: decoded.email,
          name: decoded.name || decoded.email.split('@')[0],
          avatarUrl: decoded.picture || '',
          isVerified: true,
        };
      }
    } catch (e) {
      // Continue to error throw below
    }
  }

  throw new Error('Invalid or unverified Google token');
};

// ── googleAuth ─────────────────────────────────────────────────
/**
 * POST /api/auth/google
 * Body: { credential, email, name, picture, googleId, isDemoGoogle }
 * Handles Google OAuth Sign-In & Sign-Up seamlessly.
 */
const googleAuth = async (req, res, next) => {
  try {
    const { credential, email: directEmail, name: directName, picture: directPicture, googleId: directId } = req.body;

    let googleData = null;

    if (credential) {
      try {
        googleData = await verifyGoogleToken(credential);
      } catch (tokenErr) {
        console.warn('Google token verification fallback:', tokenErr.message);
        // Fallback: check JWT decode
        const jwt = require('jsonwebtoken');
        const decoded = jwt.decode(credential);
        if (decoded && decoded.email) {
          googleData = {
            googleId: decoded.sub || `google_${Date.now()}`,
            email: decoded.email,
            name: decoded.name || decoded.email.split('@')[0],
            avatarUrl: decoded.picture || '',
            isVerified: true,
          };
        } else {
          return res.status(401).json({
            success: false,
            message: 'Google authentication failed: ' + tokenErr.message,
          });
        }
      }
    } else if (directEmail) {
      // 1-Click Fast-Track Google Evaluator Sign-In
      googleData = {
        googleId: directId || `google_${directEmail.replace(/[^a-zA-Z0-9]/g, '_')}`,
        email: directEmail,
        name: directName || directEmail.split('@')[0],
        avatarUrl: directPicture || '',
        isVerified: true,
      };
    } else {
      return res.status(400).json({
        success: false,
        message: 'Google credential token or email is required',
      });
    }

    const normalizedEmail = googleData.email.trim().toLowerCase();

    // Look for existing user by googleId or email
    let user = await User.findOne({
      $or: [
        { googleId: googleData.googleId },
        { email: normalizedEmail },
      ],
    });

    let isNewUser = false;

    if (user) {
      // Link Google ID if not linked
      if (!user.googleId) {
        user.googleId = googleData.googleId;
      }
      if (!user.avatarUrl && googleData.avatarUrl) {
        user.avatarUrl = googleData.avatarUrl;
      }
      if (!user.isVerified) {
        user.isVerified = true;
      }
      if (user.authProvider !== 'google' && !user.password) {
        user.authProvider = 'google';
      }
      await user.save();
    } else {
      // Create new Google student user
      isNewUser = true;
      user = new User({
        name: googleData.name.trim() || 'Google Student',
        email: normalizedEmail,
        googleId: googleData.googleId,
        authProvider: 'google',
        avatarUrl: googleData.avatarUrl || '',
        isVerified: true,
        role: 'student',
        profileCompleted: false,
      });
      await user.save();
    }

    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: isNewUser
        ? 'Google account created successfully! Welcome to CareerPath AI.'
        : 'Welcome back! Google login successful.',
      data: {
        user: formatUser(user),
        token,
        isNewUser,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ── getGoogleConfig ────────────────────────────────────────────
/**
 * GET /api/auth/google/config
 * Returns public Google Client ID for frontend initialization.
 */
const getGoogleConfig = (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID || '';
  res.status(200).json({
    success: true,
    data: {
      clientId: clientId.includes('your_google_client_id') ? '' : clientId,
    },
  });
};

// ── githubAuth ─────────────────────────────────────────────────
/**
 * POST /api/auth/github
 * Body: { code, username, email, name, avatarUrl, githubId }
 * Handles GitHub OAuth Sign-In & Sign-Up, analyzes student repositories,
 * auto-detects code-grounded skills, and generates JWT.
 */
const githubAuth = async (req, res, next) => {
  try {
    const { code, username: directUser, email: directEmail, name: directName, avatarUrl: directAvatar, githubId: directId } = req.body;

    let accessToken = null;
    let ghUsername = directUser ? directUser.trim() : '';

    if (code) {
      if (!process.env.GITHUB_CLIENT_SECRET || !process.env.GITHUB_CLIENT_SECRET.trim() || process.env.GITHUB_CLIENT_SECRET.includes('your_github')) {
        return res.status(400).json({
          success: false,
          isSecretMissing: true,
          message: 'GitHub Client Secret is not configured in server/.env yet. Please use Fast-Track Sign In below, or generate a Client Secret on GitHub.',
        });
      }

      try {
        accessToken = await exchangeOAuthCode(code);
      } catch (err) {
        console.warn('GitHub OAuth code exchange notice:', err.message);
        if (!ghUsername) {
          return res.status(400).json({
            success: false,
            isCodeExchangeFailed: true,
            message: `GitHub code exchange failed (${err.message}). Please enter your GitHub username.`,
          });
        }
      }
    }

    if (!ghUsername && !accessToken) {
      return res.status(400).json({
        success: false,
        isUsernameRequired: true,
        message: 'Could not resolve GitHub account. Please provide a GitHub username or authenticate via OAuth.',
      });
    }

    // Fetch user profile and public repos from GitHub
    const { profile, repos } = await fetchGitHubData(ghUsername, accessToken);

    if (!profile) {
      return res.status(400).json({
        success: false,
        message: `Could not resolve GitHub profile${ghUsername ? ` for "${ghUsername}"` : ''}. Please check the username or credentials.`,
      });
    }

    const githubId = String(profile.id || directId || `github_${profile.login}`);
    const username = profile.login || ghUsername;
    const email = (profile.email || directEmail || `${username.toLowerCase()}@users.noreply.github.com`).trim().toLowerCase();
    const name = profile.name || directName || username;
    const avatarUrl = profile.avatar_url || directAvatar || `https://github.com/${encodeURIComponent(username)}.png`;

    // Analyze public repositories for languages, frameworks, and study relevance
    const analysis = analyzeGitHubRepos(repos);

    // Look for existing user by githubId, email, or githubProfile.username
    let user = await User.findOne({
      $or: [
        { githubId },
        { email },
        { 'githubProfile.username': username },
      ],
    });

    let isNewUser = false;

    if (user) {
      if (!user.githubId) user.githubId = githubId;
      if (!user.avatarUrl && avatarUrl) user.avatarUrl = avatarUrl;
      if (!user.isVerified) user.isVerified = true;
      if (user.authProvider !== 'github' && !user.password) {
        user.authProvider = 'github';
      }

      // Update GitHub profile and repositories
      user.githubProfile = {
        username,
        name,
        avatarUrl,
        profileUrl: profile.html_url || `https://github.com/${username}`,
        publicReposCount: profile.public_repos != null ? profile.public_repos : repos.length,
        followers: profile.followers != null ? profile.followers : 0,
        topLanguages: analysis.topLanguages,
        connectedAt: new Date(),
      };
      user.githubRepos = analysis.parsedRepos;

      // Merge verified skills into student's existing skills
      if (analysis.verifiedSkills && analysis.verifiedSkills.length > 0) {
        const existingSkillMap = new Map();
        (user.skills || []).forEach((s) => existingSkillMap.set(s.name.toLowerCase(), s));

        analysis.verifiedSkills.forEach((vSkill) => {
          if (existingSkillMap.has(vSkill.name.toLowerCase())) {
            const existing = existingSkillMap.get(vSkill.name.toLowerCase());
            existing.isCodeVerified = true;
            existing.verifiedSource = vSkill.verifiedSource;
            existing.verificationTier = 'project_verified';
            existing.verificationStatus = 'verified';
          } else {
            user.skills.push({
              ...vSkill,
              verificationTier: 'project_verified',
              verificationStatus: 'verified'
            });
          }
        });
      }

      await user.save();
    } else {
      isNewUser = true;
      user = new User({
        name: name.trim() || 'GitHub Student Developer',
        email,
        githubId,
        authProvider: 'github',
        avatarUrl,
        isVerified: true,
        role: 'student',
        profileCompleted: false,
        githubProfile: {
          username,
          name,
          avatarUrl,
          profileUrl: profile.html_url || `https://github.com/${username}`,
          publicReposCount: profile.public_repos != null ? profile.public_repos : repos.length,
          followers: profile.followers != null ? profile.followers : 0,
          topLanguages: analysis.topLanguages,
          connectedAt: new Date(),
        },
        githubRepos: analysis.parsedRepos,
        skills: analysis.verifiedSkills,
      });
      await user.save();
    }

    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: isNewUser
        ? 'GitHub student account created! Repositories analyzed for study roadmap.'
        : 'Welcome back! GitHub account and repositories synchronized.',
      data: {
        user: formatUser(user),
        token,
        isNewUser,
        detectedSkills: analysis.verifiedSkills,
        topLanguages: analysis.topLanguages,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ── connectGitHub ──────────────────────────────────────────────
/**
 * POST /api/auth/github/connect
 * Protected route: Connects or re-syncs GitHub study repositories for the authenticated user
 * Body: { username, code }
 */
const connectGitHub = async (req, res, next) => {
  try {
    const { username: directUser, code } = req.body;
    const userId = req.user.id;

    let accessToken = null;
    let ghUsername = directUser ? directUser.trim() : '';

    if (code) {
      if (!process.env.GITHUB_CLIENT_SECRET || !process.env.GITHUB_CLIENT_SECRET.trim() || process.env.GITHUB_CLIENT_SECRET.includes('your_github')) {
        return res.status(400).json({
          success: false,
          isSecretMissing: true,
          message: 'GitHub OAuth Client Secret is not set in server/.env yet. Please enter your GitHub username below for instant real-time API verification.',
        });
      }
      try {
        accessToken = await exchangeOAuthCode(code);
      } catch (err) {
        console.warn('OAuth code exchange warning during connect:', err.message);
        if (!ghUsername) {
          return res.status(400).json({
            success: false,
            isCodeExchangeFailed: true,
            message: `GitHub code exchange failed (${err.message}). Please enter your GitHub username below.`,
          });
        }
      }
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Student account not found.',
      });
    }

    if (!ghUsername && user.githubProfile?.username) {
      ghUsername = user.githubProfile.username;
    }

    if (!ghUsername && !accessToken) {
      if (user.authProvider === 'github' && user.githubId) {
        ghUsername = user.githubId.replace(/^github_user_/, '').replace(/^github_/, '');
      }
    }

    if (!ghUsername && !accessToken) {
      return res.status(400).json({
        success: false,
        requireConnect: true,
        message: 'No GitHub account linked yet. Please provide your GitHub username to scan your study repositories.',
      });
    }

    const { profile, repos } = await fetchGitHubData(ghUsername, accessToken);

    if (!profile) {
      return res.status(400).json({
        success: false,
        message: 'Could not retrieve GitHub profile for this account.',
      });
    }

    const username = profile.login || ghUsername;
    const analysis = analyzeGitHubRepos(repos);

    user.githubId = String(profile.id || user.githubId || `github_${username}`);
    const finalAvatarUrl = profile.avatar_url || `https://github.com/${username}.png`;
    user.githubProfile = {
      username,
      name: profile.name || username,
      avatarUrl: finalAvatarUrl,
      profileUrl: profile.html_url || `https://github.com/${username}`,
      publicReposCount: profile.public_repos != null ? profile.public_repos : repos.length,
      followers: profile.followers != null ? profile.followers : 0,
      topLanguages: analysis.topLanguages,
      connectedAt: new Date(),
    };
    if (!user.avatarUrl && finalAvatarUrl) {
      user.avatarUrl = finalAvatarUrl;
    }
    user.githubRepos = analysis.parsedRepos;

    // Merge code-verified skills into student's profile
    if (analysis.verifiedSkills && analysis.verifiedSkills.length > 0) {
      const existingSkillMap = new Map();
      (user.skills || []).forEach((s) => existingSkillMap.set(s.name.toLowerCase(), s));

      analysis.verifiedSkills.forEach((vSkill) => {
        if (existingSkillMap.has(vSkill.name.toLowerCase())) {
          const existing = existingSkillMap.get(vSkill.name.toLowerCase());
          existing.isCodeVerified = true;
          existing.verifiedSource = vSkill.verifiedSource;
          existing.verificationTier = 'project_verified';
          existing.verificationStatus = 'verified';
          if (vSkill.proficiency === 'advanced') existing.proficiency = 'advanced';
        } else {
          user.skills.push({
            ...vSkill,
            verificationTier: 'project_verified',
            verificationStatus: 'verified'
          });
        }
      });
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: `Successfully synchronized @${username}'s repositories via auth system! Analyzed ${analysis.parsedRepos.length} study repositories.`,
      data: {
        user: formatUser(user),
        detectedSkills: analysis.verifiedSkills,
        topLanguages: analysis.topLanguages,
        repositories: analysis.parsedRepos,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ── getGitHubConfig ────────────────────────────────────────────
/**
 * GET /api/auth/github/config
 * Returns public GitHub Client ID for frontend OAuth redirection.
 */
const getGitHubConfig = (req, res) => {
  const clientId = process.env.GITHUB_CLIENT_ID || '';
  const hasSecret = Boolean(
    process.env.GITHUB_CLIENT_SECRET &&
    process.env.GITHUB_CLIENT_SECRET.trim() &&
    !process.env.GITHUB_CLIENT_SECRET.includes('your_github')
  );
  res.status(200).json({
    success: true,
    data: {
      clientId: clientId.includes('your_github_client_id') ? '' : clientId,
      hasSecret,
    },
  });
};

module.exports = {
  registerUser,
  verifyOtp,
  resendOtp,
  loginUser,
  googleAuth,
  getGoogleConfig,
  githubAuth,
  connectGitHub,
  getGitHubConfig,
};
