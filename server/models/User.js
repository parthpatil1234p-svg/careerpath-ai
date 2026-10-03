/**
 * models/User.js — Mongoose User Schema
 *
 * Defines the shape of every document in the `users` MongoDB collection.
 *
 * Fields:
 *  name, email, password (hashed), role, education, interests,
 *  skills (with proficiency), careerGoals, profileCompleted
 *
 * Security:
 *  - Password is hashed with bcrypt (salt rounds 12) in a pre-save hook.
 *  - Password field uses `select: false` so it is NEVER returned by default.
 *  - Use .select('+password') only when you need to compare for login.
 */

const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

// ── Sub-schema: a single skill entry ─────────────────────────
const SkillSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Skill name is required'],
      trim: true,
      lowercase: true,
    },
    displayName: {
      type: String,
      trim: true,
    },
    proficiency: {
      type: String,
      enum: {
        values: ['beginner', 'intermediate', 'advanced'],
        message: 'Proficiency must be beginner, intermediate, or advanced',
      },
      required: [true, 'Skill proficiency is required'],
      lowercase: true,
    },
    isCodeVerified: {
      type: Boolean,
      default: false,
    },
    verifiedSource: {
      type: String,
      default: '',
    },
    selfRatedProficiency: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: null,
    },
    isQuizVerified: {
      type: Boolean,
      default: false,
    },
    verifiedProficiency: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: null,
    },
    quizScore: {
      type: Number,
      default: 0,
    },
    quizGaps: {
      type: [String],
      default: [],
    },
    quizVerifiedAt: {
      type: Date,
      default: null,
    },
    verificationTier: {
      type: String,
      enum: ['self_rated', 'quiz_verified', 'project_verified', 'interview_verified'],
      default: 'self_rated',
    },
    verificationStatus: {
      type: String,
      enum: ['unverified', 'verified', 'unconfirmed', 'flagged', 'flagged_cheating'],
      default: 'unverified',
    },
    integrityScore: {
      type: Number,
      default: 100, // 0 - 100 based on velocity and tab switches
      min: 0,
      max: 100,
    },
    quizAttemptsCount: {
      type: Number,
      default: 0,
    },
    lastQuizAttemptAt: {
      type: Date,
      default: null,
    },
    nextRetakeAvailableAt: {
      type: Date,
      default: null,
    },
    tabSwitchCount: {
      type: Number,
      default: 0,
    },
    velocityAnomalyCount: {
      type: Number,
      default: 0,
    },
    howVerified: {
      type: String,
      enum: ['self_rated', 'skill_check', 'weekly_test', 'github_repo', 'interview'],
      default: 'self_rated',
    },
    latestResult: {
      type: String,
      default: '',
    },
    refreshByDate: {
      type: Date,
      default: null,
    },
  },
  { _id: false } // No separate _id for sub-documents
);

// ── Sub-schema: education details ────────────────────────────
const EducationSchema = new mongoose.Schema(
  {
    course:  { type: String, trim: true, default: '' },
    branch:  { type: String, trim: true, default: '' },
    year:    { type: String, trim: true, default: '' },
    college: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

// ── Sub-schema: GitHub Repository for Study Tracking ─────────
const GithubRepoSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    description: { type: String, trim: true, default: '' },
    htmlUrl: { type: String, trim: true },
    language: { type: String, trim: true, default: '' },
    stars: { type: Number, default: 0 },
    forks: { type: Number, default: 0 },
    topics: { type: [String], default: [] },
    detectedSkills: { type: [String], default: [] },
    studyRelevance: { type: String, default: '' },
    updatedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

// ── Sub-schema: GitHub Profile Details ────────────────────────
const GithubProfileSchema = new mongoose.Schema(
  {
    username: { type: String, trim: true, default: '' },
    name: { type: String, trim: true, default: '' },
    avatarUrl: { type: String, trim: true, default: '' },
    profileUrl: { type: String, trim: true, default: '' },
    publicReposCount: { type: Number, default: 0 },
    followers: { type: Number, default: 0 },
    topLanguages: { type: [String], default: [] },
    connectedAt: { type: Date, default: null },
  },
  { _id: false }
);

// ── Sub-schema: Resume ATS Analysis ───────────────────────────
const ResumeAnalysisSchema = new mongoose.Schema(
  {
    atsScore: { type: Number, default: 0, min: 0, max: 100 },
    targetCareer: { type: String, trim: true, default: '' },
    extractedSkills: { type: [String], default: [] },
    matchedKeywords: { type: [String], default: [] },
    missingKeywords: { type: [String], default: [] },
    bulletSuggestions: { type: [String], default: [] },
    summary: { type: String, default: '' },
    analyzedAt: { type: Date, default: null },
  },
  { _id: false }
);

// ── Sub-schema: AI Mock Interview Session ─────────────────────
const MockInterviewSchema = new mongoose.Schema(
  {
    overallScore: { type: Number, default: 0, min: 0, max: 100 },
    technicalScore: { type: Number, default: 0, min: 0, max: 100 },
    communicationScore: { type: Number, default: 0, min: 0, max: 100 },
    practicalScore: { type: Number, default: 0, min: 0, max: 100 },
    targetRole: { type: String, default: '' },
    completedAt: { type: Date, default: null },
    history: [
      {
        question: { type: String, required: true },
        questionType: { type: String, default: 'technical' },
        answer: { type: String, default: '' },
        score: { type: Number, default: 0 },
        feedback: { type: String, default: '' },
        modelAnswer: { type: String, default: '' },
      },
    ],
  },
  { _id: false }
);

// ── Sub-schema: Job Readiness Index & Digital Certificate ─────
const JobReadinessSchema = new mongoose.Schema(
  {
    readinessScore: { type: Number, default: 0, min: 0, max: 100 },
    tier: {
      type: String,
      enum: ['foundational', 'developing', 'interview_ready', 'job_ready'],
      default: 'foundational',
    },
    tierLabel: { type: String, default: 'Foundational Learner' },
    certificateId: { type: String, default: '' },
    certifiedAt: { type: Date, default: null },
    calculatedAt: { type: Date, default: null },
    breakdown: {
      verifiedSkills: { type: Number, default: 0 },
      roadmapProgress: { type: Number, default: 0 },
      resumeScore: { type: Number, default: 0 },
      interviewScore: { type: Number, default: 0 },
    },
  },
  { _id: false }
);

// ── Sub-schema: Built Resume Structure ────────────────────────
const BuiltResumeSchema = new mongoose.Schema(
  {
    template: {
      type: String,
      enum: ['student', 'modern', 'professional', 'ats_simple'],
      default: 'student',
    },
    personalInfo: {
      fullName: { type: String, default: '' },
      headline: { type: String, default: '' },
      title: { type: String, default: '' },
      email: { type: String, default: '' },
      phone: { type: String, default: '' },
      location: { type: String, default: '' },
      linkedIn: { type: String, default: '' },
      gitHub: { type: String, default: '' },
      portfolio: { type: String, default: '' },
    },
    summary: { type: String, default: '' },
    education: [
      {
        degree: { type: String, default: '' },
        college: { type: String, default: '' },
        university: { type: String, default: '' },
        startYear: { type: String, default: '' },
        gradYear: { type: String, default: '' },
        score: { type: String, default: '' },
      },
    ],
    skills: [
      {
        name: { type: String, default: '' },
        level: { type: String, default: 'Intermediate' },
        isVerified: { type: Boolean, default: false },
        category: { type: String, default: 'Technical' },
      },
    ],
    projects: [
      {
        title: { type: String, default: '' },
        description: { type: String, default: '' },
        techStack: { type: [String], default: [] },
        githubUrl: { type: String, default: '' },
        liveUrl: { type: String, default: '' },
        isVerified: { type: Boolean, default: false },
      },
    ],
    experience: [
      {
        company: { type: String, default: '' },
        role: { type: String, default: '' },
        type: { type: String, default: 'Internship' }, // Full-time, Internship, Hackathon, Freelance
        duration: { type: String, default: '' },
        responsibilities: { type: [String], default: [] },
      },
    ],
    certifications: [
      {
        name: { type: String, default: '' },
        issuer: { type: String, default: '' },
        date: { type: String, default: '' },
        credentialUrl: { type: String, default: '' },
      },
    ],
    additional: {
      languages: { type: [String], default: [] },
      achievements: { type: [String], default: [] },
      hobbies: { type: [String], default: [] },
    },
    updatedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

// ── Sub-schema: Recruiter Corporate Profile ───────────────────
const RecruiterProfileSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', default: null },
    companyName: { type: String, trim: true, default: '' },
    companyDomain: { type: String, lowercase: true, trim: true, default: '' },
    title: { type: String, trim: true, default: '' }, // e.g. "Senior Technical Recruiter"
    corporateEmail: { type: String, lowercase: true, trim: true, default: '' },
    linkedinUrl: { type: String, trim: true, default: '' },
    workPhone: { type: String, trim: true, default: '' },
    verificationStatus: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending',
    },
    verificationScore: { type: Number, default: 0, min: 0, max: 100 },
    verificationMethod: { type: String, default: 'corporate_email_otp_plus_ai_intel' },
    canPostJobs: { type: Boolean, default: false },
    verifiedAt: { type: Date, default: null },
  },
  { _id: false }
);

// ── Main User Schema ──────────────────────────────────────────
const UserSchema = new mongoose.Schema(
  {
    // Basic identity
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2,  'Name must be at least 2 characters'],
      maxlength: [60, 'Name must not exceed 60 characters'],
    },

    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Please provide a valid email address',
      ],
    },

    // select: false → password is NEVER returned in a query unless explicitly asked
    password: {
      type: String,
      required: function () {
        return !this.googleId && !this.githubId && this.authProvider === 'local';
      },
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },

    // Google OAuth integration
    googleId: {
      type: String,
      sparse: true,
      index: true,
      default: null,
    },

    // GitHub OAuth & Study Integration
    githubId: {
      type: String,
      sparse: true,
      index: true,
      default: null,
    },
    githubProfile: {
      type: GithubProfileSchema,
      default: () => ({}),
    },
    githubRepos: {
      type: [GithubRepoSchema],
      default: [],
    },

    // Identity provider ('local', 'google', or 'github')
    authProvider: {
      type: String,
      enum: {
        values: ['local', 'google', 'github'],
        message: 'Auth provider must be local, google, or github',
      },
      default: 'local',
    },

    // Role-based access control (student, admin, or recruiter)
    role: {
      type: String,
      enum: {
        values: ['student', 'admin', 'recruiter'],
        message: 'Role must be student, admin, or recruiter',
      },
      default: 'student',
    },

    // Corporate recruiter verification profile
    recruiterProfile: {
      type: RecruiterProfileSchema,
      default: () => ({}),
    },

    // Primary Stream / Domain (Step 0)
    primaryStream: {
      type: String,
      enum: {
        values: ['engineering', 'business', 'marketing', 'creative', 'cross'],
        message: 'Invalid primary stream',
      },
      default: 'engineering',
      lowercase: true,
    },

    // Academic background
    education: {
      type: EducationSchema,
      default: () => ({}),
    },

    // Career interests (e.g. ["AI/ML", "Web Development"])
    interests: {
      type: [String],
      default: [],
    },

    // Skills the student currently has
    skills: {
      type: [SkillSchema],
      default: [],
    },

    // What the student wants to achieve (e.g. ["Get a job at a startup"])
    careerGoals: {
      type: [String],
      default: [],
    },

    // Profile photo & Resume stored via Cloudinary Media Storage
    avatarUrl: {
      type: String,
      default: '',
      trim: true,
    },
    resumeUrl: {
      type: String,
      default: '',
      trim: true,
    },

    // Enhanced 3-State Resume Lifecycle Record
    resumeRecord: {
      fileLocation: { type: String, default: '' },
      fileName: { type: String, default: '' },
      fileSize: { type: Number, default: 0 },
      firstUploadedDate: { type: Date, default: null },
      lastUpdatedDate: { type: Date, default: null },
      publicId: { type: String, default: '' },
    },

    // Graduation & Milestone Portfolio Records
    completedPaths: [
      {
        roadmap: { type: mongoose.Schema.Types.ObjectId, ref: 'Roadmap' },
        role: { type: String, default: '' },
        careerTitle: { type: String, default: '' },
        slug: { type: String, default: '' },
        credentialId: { type: String, default: '' },
        verificationCode: { type: String, default: '' },
        completionDate: { type: Date, default: Date.now },
        skillsGained: { type: [String], default: [] },
      },
    ],

    // Timestamp of last route abandonment for 7-day rate-limiting cooldown
    lastAbandonedRouteAt: {
      type: Date,
      default: null,
    },

    // User Career Phase Status (Learning | Job-seeking | Working)
    profileStatus: {
      status: {
        type: String,
        enum: ['learning', 'job_seeking', 'working'],
        default: 'learning',
      },
      currentRole: { type: String, default: '' },
    },

    // True once the user has filled in education + interests + skills
    profileCompleted: {
      type: Boolean,
      default: false,
    },

    // One-Time Account Skill Verification Status (ensures quiz is only required once per account)
    hasCompletedSkillVerification: {
      type: Boolean,
      default: false,
    },

    // AI Resume ATS Analysis (Career GPS Step 8)
    resumeAnalysis: {
      type: ResumeAnalysisSchema,
      default: () => ({}),
    },

    // AI Mock Interview Performance (Career GPS Step 9)
    mockInterview: {
      type: MockInterviewSchema,
      default: () => ({}),
    },

    // Overall Job Readiness Index & Digital Certificate (Career GPS Step 11)
    jobReadiness: {
      type: JobReadinessSchema,
      default: () => ({}),
    },

    // Interactive In-App Resume Builder draft state
    builtResume: {
      type: BuiltResumeSchema,
      default: () => ({}),
    },

    // One-Time Verification (OTP) Status
    isVerified: {
      type: Boolean,
      default: false,
    },

    // 6-digit verification code with expiration & 5-minute rate limit tracking
    verificationOtp: {
      code: {
        type: String,
        select: false,
      },
      expiresAt: {
        type: Date,
        select: false,
      },
      sendHistory: {
        type: [Date],
        select: false,
        default: [],
      },
    },

    // Client-Side Encrypted Storage Vault (Zero-knowledge encrypted payload)
    encryptedVault: {
      ciphertext: { type: String, default: null },
      iv: { type: String, default: null },
      salt: { type: String, default: null },
      version: { type: String, default: 'AES-GCM-256' },
      algorithm: { type: String, default: 'AES-GCM' },
      iterations: { type: Number, default: 100000 },
      updatedAt: { type: Date, default: null },
    },
  },
  {
    // Automatically adds createdAt and updatedAt fields
    timestamps: true,
  }
);

// ── Pre-save hook: Hash password before saving ────────────────
// Only runs when the password field has been modified (new user or password change).
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();

  try {
    // 12 salt rounds — secure enough for 2024 hardware, reasonable performance
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// ── Instance method: compare a plain password with the stored hash ────
UserSchema.methods.comparePassword = async function (enteredPassword) {
  // `this.password` is only available if the document was queried with .select('+password')
  if (!this.password) return false;
  return bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
