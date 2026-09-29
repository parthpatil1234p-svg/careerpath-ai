# Backend Schema & REST API Reference Specification

> **Hack2Ignite 2026–27 · Round 1 Qualifier**  
> **Team:** 404 Brain Not Found  
> **Problem Statement ID:** ED-02 (AI-Powered Career Guidance System)  
> **Backend Stack:** Node.js v18+, Express.js, MongoDB Atlas (Mongoose ODM), JWT, bcryptjs

---

## 1. Production Backend Structure

```
server/
├── server.js                      # Express app entry, rate limiting, process safety listeners
├── seed.js                        # Complete career, skill & quiz database seeding script
├── seedDemoUser.js                # Dedicated evaluator demo user seeder
├── config/
│   └── db.js                      # MongoDB Atlas connection singleton
├── models/
│   ├── User.js                    # Student account, skills, GitHub profile & quiz verification
│   ├── Career.js                  # 15+ industry career definitions & required skills
│   ├── Roadmap.js                 # Generated student roadmaps, weeks & milestones
│   ├── RoadmapTask.js             # Atomic checklist tasks with progress flags
│   └── Skill.js                   # Master skill intelligence directory
├── routes/
│   ├── authRoutes.js              # Register, login, google auth, github auth & POST /github/sync
│   ├── assessmentRoutes.js        # Student profile evaluation & skills submission
│   ├── quizRoutes.js              # Reality-check quiz: /start, /answer, /status, /providers
│   ├── recommendationRoutes.js    # 60/25/15 deterministic matching engine & skill gap analysis
│   ├── roadmapRoutes.js           # 4, 8, 12-week roadmap generation & task progress toggling
│   ├── dashboardRoutes.js         # Unified student analytics, verified skills & goals
│   ├── careerRoutes.js            # Careers directory, slugs & detail lookups
│   ├── jobRoutes.js               # Adzuna & AIDevBoard live Indian tech vacancies
│   ├── chatRoutes.js              # AI Career Mentor (Groq Llama 3.3 + Gemini Flash)
│   ├── skillRoutes.js             # Skill directory & catalog
│   └── userRoutes.js              # Profile updates, Cloudinary avatar & resume uploads
├── controllers/
│   ├── authController.js          # Authentication, token generation & GitHub session sync
│   ├── assessmentController.js    # Assessment validation & student profile updating
│   ├── quizController.js          # Dynamic quiz generation, answer scoring & skill verification
│   ├── recommendationController.js# In-memory matrix matching & gap classification
│   ├── roadmapController.js       # Timeline generation & atomic task completion
│   ├── dashboardController.js     # Dashboard telemetry & progress aggregation
│   └── userController.js          # User profile management & document uploads
├── services/
│   ├── aiQuizGeneratorService.js  # Multi-model Groq Llama + Gemini Flash quiz engine
│   ├── quizService.js             # Quiz business logic, scoring & gap extraction
│   ├── githubService.js           # GitHub REST API repository analysis & language parsing
│   ├── groqService.js             # Groq Cloud AI mentor integration
│   ├── geminiService.js           # Google Gemini AI failover integration
│   ├── jobBoardService.js         # Adzuna & AIDevBoard live job streaming
│   ├── cloudinaryService.js       # Cloudinary media and document management
│   ├── emailService.js            # Nodemailer transactional email delivery
│   ├── recommendationService.js   # 60/25/15 core mathematical scoring
│   └── roadmapService.js          # Roadmap templating & task generation
├── middleware/
│   ├── authMiddleware.js          # JWT Bearer token authentication & user hydration
│   ├── errorMiddleware.js         # Centralized error formatting & status codes
│   └── validateRequest.js         # Express-validator input sanitization
└── data/
    ├── careersData.js             # Predefined career tracks & requirement matrices
    ├── skillsData.js              # Comprehensive skills taxonomy
    ├── quizQuestions.js           # 860+ lines curated fallback domain questions
    └── roadmapTemplates.js        # 4, 8, 12-week weekly milestone blueprints
```

---

## 2. Mongoose Data Models & Schemas

### 2.1 User Model (`server/models/User.js`)
Stores authentication credentials, academic profile, self-reported and verified skills, GitHub repository analytics, and micro-quiz verification state.

```javascript
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: 100
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address']
  },
  password: {
    type: String,
    minlength: 6,
    select: false // Excluded from default queries
  },
  role: {
    type: String,
    enum: ['student', 'admin'],
    default: 'student'
  },
  education: {
    type: String,
    default: '' // e.g., "B.Tech CSE 2nd Year", "BCA 3rd Year"
  },
  branch: {
    type: String,
    default: ''
  },
  college: {
    type: String,
    default: ''
  },
  interests: [{
    type: String,
    trim: true
  }],
  // Multi-tier skill competency structure
  skills: [{
    skillName: { type: String, required: true },
    proficiency: { type: Number, required: true, min: 1, max: 5 },
    isCodeVerified: { type: Boolean, default: false }, // Verified via GitHub code
    isQuizVerified: { type: Boolean, default: false }, // Verified via Reality-Check Quiz
    quizScore: { type: Number, default: null },
    quizVerifiedAt: { type: Date, default: null }
  }],
  // One-time verification policy to prevent re-gating
  hasCompletedSkillVerification: {
    type: Boolean,
    default: false
  },
  // Quiz evaluation metrics
  quizScore: {
    type: Number,
    default: 0
  },
  quizGaps: [{
    skill: String,
    gapDescription: String,
    recommendedAction: String
  }],
  // Connected GitHub telemetry
  githubId: { type: String, default: null },
  githubProfile: {
    username: { type: String, default: null },
    avatarUrl: { type: String, default: null },
    profileUrl: { type: String, default: null },
    publicRepos: { type: Number, default: 0 },
    followers: { type: Number, default: 0 },
    bio: { type: String, default: '' }
  },
  githubRepos: [mongoose.Schema.Types.Mixed], // Cached study repo analysis
  // Google OAuth
  googleId: { type: String, default: null },
  // Cloudinary media
  avatarUrl: { type: String, default: '' },
  resumeUrl: { type: String, default: '' }
}, {
  timestamps: true
});
```

---

## 3. Complete REST API Endpoints Specification

### 3.1 Authentication & GitHub Session Sync (`/api/auth`)

| Method | Endpoint | Access | Purpose |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Create new student account, hashes password via bcrypt |
| `POST` | `/api/auth/login` | Public | Authenticate email + password, returns JWT token |
| `POST` | `/api/auth/google` | Public | Google Identity Services OAuth sign-in / sign-up |
| `POST` | `/api/auth/github` | Public | Fast-track GitHub OAuth connection |
| `POST` | `/api/auth/github/sync` | Protected (JWT) | **Auth-based repository sync:** Resolves student GitHub identity from session, fetches public repos, calculates top languages, marks `isCodeVerified: true` with zero manual prompt |

#### Sample Request: `POST /api/auth/github/sync`
```http
POST /api/auth/github/sync HTTP/1.1
Host: localhost:5000
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{ "auth": true }
```

#### Sample Response: `POST /api/auth/github/sync` (200 OK)
```json
{
  "success": true,
  "message": "Successfully synchronized @parthpatil1234p-svg's repositories via auth system! Analyzed 7 study repositories.",
  "data": {
    "username": "parthpatil1234p-svg",
    "reposCount": 7,
    "topLanguages": ["JavaScript", "HTML", "CSS", "TypeScript"],
    "verifiedSkills": ["JavaScript", "HTML", "CSS", "TypeScript"]
  }
}
```

---

### 3.2 Adaptive Skill Reality-Check Micro-Quiz (`/api/quiz`)

| Method | Endpoint | Access | Purpose |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/quiz/start` | Optional / Demo | Initializes a 5-question technical quiz for selected skills. Invokes Groq Llama 3.3 70B, Gemini 2.5 Flash, or domain fallback |
| `POST` | `/api/quiz/answer` | Optional / Demo | Evaluates submitted answer, provides instant explanation, updates running score, and advances question stepper |
| `GET` | `/api/quiz/status` | Protected (JWT) | Returns verification status, verified skills list, and total verified count for current student |
| `GET` | `/api/quiz/providers`| Public | Returns available AI quiz generation providers (Groq, Gemini, BYOK, Fallback) |

#### Sample Request: `POST /api/quiz/start`
```json
{
  "skill": "JavaScript",
  "difficulty": "intermediate",
  "provider": "groq",
  "apiKey": ""
}
```

#### Sample Response: `POST /api/quiz/start` (200 OK)
```json
{
  "success": true,
  "data": {
    "sessionId": "quiz_session_88192a",
    "skill": "JavaScript",
    "questionIndex": 1,
    "totalQuestions": 5,
    "question": "What is the expected output of `typeof null` in standard JavaScript?",
    "options": [
      "\"null\"",
      "\"undefined\"",
      "\"object\"",
      "\"boolean\""
    ],
    "timeLimitSeconds": 45,
    "engine": "Groq Llama 3.3 70B"
  }
}
```

---

### 3.3 Career Recommendations & Matching Engine (`/api/recommendations`)

| Method | Endpoint | Access | Purpose |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/recommendations/generate` | Protected (JWT) | Executes 60/25/15 deterministic scoring algorithm across all 15 career tracks |
| `GET` | `/api/recommendations/latest` | Protected (JWT) | Retrieves previously computed top recommendations and tri-color skill gaps |

---

### 3.4 Roadmap & Task Execution (`/api/roadmaps`)

| Method | Endpoint | Access | Purpose |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/roadmaps/generate` | Protected (JWT) | Generates customized 4, 8, or 12-week roadmap based on student's missing skills |
| `GET` | `/api/roadmaps/current` | Protected (JWT) | Returns active roadmap, weekly milestones, resource links, and progress |
| `PATCH`| `/api/roadmaps/tasks/:taskId` | Protected (JWT) | Toggles milestone task completion; triggers atomic percentage progress recalculation |

---

### 3.5 Student Dashboard (`/api/dashboard`)

| Method | Endpoint | Access | Purpose |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/dashboard` | Protected (JWT) | Returns unified profile summary, active career goal, upcoming tasks, verified skills, and 0–100% progress metrics |

---

### 3.6 AI Mentor & Live Market Telemetry (`/api/chat` & `/api/jobs`)

| Method | Endpoint | Access | Purpose |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/chat/message` | Protected / Demo | Sends question to AI Career Mentor (Groq Llama 3.3 70B with Gemini Flash failover) |
| `GET` | `/api/jobs/adzuna` | Public | Real-time Indian tech job listings & CTC salary data from Adzuna API |
| `GET` | `/api/jobs/career/:slug` | Public | Localized vacancies filtered by specific career track |
