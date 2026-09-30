# 🔌 CareerPath AI — REST API Reference Specification

> **🏆 Hack2Ignite 2026–27 · Official Submission**  
> **Base Production URL:** `https://careerpath-ai-bdbt.onrender.com`  
> **Base Local Development URL:** `http://localhost:5000`  
> **Authentication:** Bearer JWT in `Authorization` header (`Bearer <token>`)  
> **Response Format:** JSON (`application/json`)  

---

## 📑 Directory of API Modules
1. [Authentication Endpoints (`/api/auth`)](#1-authentication-endpoints-apiauth)
2. [User Profile & Single Resume Endpoints (`/api/users`)](#2-user-profile--single-resume-endpoints-apiusers)
3. [Student Assessment Endpoints (`/api/assessment`)](#3-student-assessment-endpoints-apiassessment)
4. [Recommendation Engine Endpoints (`/api/recommendations`)](#4-recommendation-engine-endpoints-apirecommendations)
5. [Hardened Roadmap & Progression Endpoints (`/api/roadmaps`)](#5-hardened-roadmap--progression-endpoints-apiroadmaps)
6. [Adaptive Reality-Check Quiz Endpoints (`/api/quiz`)](#6-adaptive-reality-check-quiz-endpoints-apiquiz)
7. [Skill Readiness & Job-Ready Check Endpoints (`/api/readiness`)](#7-skill-readiness--job-ready-check-endpoints-apireadiness)
8. [Live Market Jobs Telemetry (`/api/jobs`)](#8-live-market-jobs-telemetry-apijobs)
9. [AI Career Mentor (`/api/chat`)](#9-ai-career-mentor-apichat)
10. [Student Dashboard Aggregator (`/api/dashboard`)](#10-student-dashboard-aggregator-apidashboard)
11. [System Health Telemetry (`/api/health`)](#11-system-health-telemetry-apihealth)

---

## 1. Authentication Endpoints (`/api/auth`)

### 1.1 Register New Student
- **Endpoint:** `POST /api/auth/register`
- **Access:** Public
- **Request Body:**
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "Password123"
}
```
- **Response `201 Created`:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "651a2f...",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "role": "student"
  }
}
```

### 1.2 Login Student
- **Endpoint:** `POST /api/auth/login`
- **Access:** Public
- **Request Body:**
```json
{
  "email": "demouser@gmail.com",
  "password": "demo123"
}
```
- **Response `200 OK`:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "651a2f...",
    "name": "Demo Student",
    "email": "demouser@gmail.com"
  }
}
```

### 1.3 Auth-Based GitHub Repository Sync
- **Endpoint:** `POST /api/auth/github/sync`
- **Access:** Protected (`Bearer <token>`)
- **Description:** Resolves student's connected GitHub identity directly from their authenticated session, inspects public repositories, extracts language distributions, and awards glowing `isCodeVerified: true` badges without manual username prompts.
- **Response `200 OK`:**
```json
{
  "success": true,
  "message": "Repositories synchronized successfully.",
  "reposCount": 8,
  "verifiedLanguages": ["JavaScript", "HTML", "CSS", "Python"],
  "studyProjects": [
    {
      "name": "ecommerce-frontend",
      "language": "JavaScript",
      "studyRelevance": "Primary foundation for React & DOM manipulation"
    }
  ]
}
```

---

## 2. User Profile & Single Resume Endpoints (`/api/users`)

### 2.1 Get Active Single Resume
- **Endpoint:** `GET /api/users/resume`
- **Access:** Protected (`Bearer <token>`)
- **Description:** Returns metadata for the student's single verified resume.
- **Response `200 OK`:**
```json
{
  "success": true,
  "hasResume": true,
  "resume": {
    "id": "652b3...",
    "fileName": "Jane_Doe_Resume.pdf",
    "fileSize": 142850,
    "fileType": "application/pdf",
    "fileUrl": "https://res.cloudinary.com/...",
    "createdAt": "2026-09-30T10:00:00.000Z",
    "updatedAt": "2026-09-30T10:00:00.000Z"
  }
}
```
- **Response `200 OK` (No Resume):**
```json
{
  "success": true,
  "hasResume": false,
  "resume": null
}
```

### 2.2 Upload or Replace Single Resume
- **Endpoint:** `POST /api/users/resume`
- **Access:** Protected (`Bearer <token>`)
- **Headers:** `Content-Type: multipart/form-data`
- **Form Data:** `resumeFile` (File, max 5MB, PDF/DOCX/DOC)
- **Validation:** Inspected for magic bytes (`%PDF`, `PK\x03\x04`, `\xD0\xCF\x11\xE0`).
- **Behavior:** Transactionally deletes any pre-existing Cloudinary asset before saving the new file.
- **Response `201 Created` / `200 OK`:**
```json
{
  "success": true,
  "message": "Resume uploaded and verified successfully.",
  "resume": {
    "fileName": "Jane_Doe_Software_Resume.pdf",
    "fileSize": 215400,
    "fileUrl": "https://res.cloudinary.com/...",
    "updatedAt": "2026-09-30T10:05:00.000Z"
  }
}
```
- **Error Responses:**
  - `400 Bad Request`: `{"success": false, "code": "INVALID_FILE_SIGNATURE", "message": "Uploaded file content does not match genuine PDF or Word document signatures."}`
  - `413 Payload Too Large`: `{"success": false, "code": "FILE_TOO_LARGE", "message": "File exceeds maximum 5MB size limit."}`

### 2.3 Delete Single Resume
- **Endpoint:** `DELETE /api/users/resume`
- **Access:** Protected (`Bearer <token>`)
- **Description:** Transactionally destroys asset from Cloudinary CDN and deletes the database record.
- **Response `200 OK`:**
```json
{
  "success": true,
  "message": "Resume deleted successfully from cloud storage and profile."
}
```

---

## 3. Student Assessment Endpoints (`/api/assessment`)

### 3.1 Submit Academic & Skill Assessment
- **Endpoint:** `POST /api/assessment`
- **Access:** Protected (`Bearer <token>`)
- **Request Body:**
```json
{
  "course": "B.Tech",
  "branch": "Computer Science & Engineering",
  "year": "Third Year",
  "college": "Raisoni Tech Institute",
  "primaryStream": "Tech & Engineering",
  "interests": ["Web Development", "Cloud Architecture", "System Design"],
  "skills": [
    { "name": "JavaScript", "level": "Intermediate" },
    { "name": "React", "level": "Beginner" },
    { "name": "Node.js", "level": "Beginner" },
    { "name": "HTML", "level": "Advanced" },
    { "name": "CSS", "level": "Advanced" }
  ]
}
```
- **Response `200 OK`:**
```json
{
  "success": true,
  "message": "Assessment profile saved successfully.",
  "totalSkillsRecorded": 5,
  "primaryStream": "Tech & Engineering"
}
```

---

## 4. Recommendation Engine Endpoints (`/api/recommendations`)

### 4.1 Generate Career Recommendations (60/25/15 Match)
- **Endpoint:** `POST /api/recommendations/generate`
- **Access:** Protected (`Bearer <token>`)
- **Description:** Evaluates all candidate careers using the deterministic 60% Skills, 25% Interests, 15% Academics formula, scoped to the user's primary stream.
- **Response `200 OK`:**
```json
{
  "success": true,
  "recommendations": [
    {
      "careerId": "651c8...",
      "careerTitle": "Full-Stack Developer",
      "slug": "full-stack-developer",
      "category": "Development",
      "overallScore": 84,
      "breakdown": {
        "skillScore": 52.5,
        "interestScore": 20.0,
        "academicScore": 11.5
      },
      "salaryRange": "₹4.5 LPA – ₹9.5 LPA",
      "skillGap": {
        "matched": ["JavaScript", "HTML", "CSS"],
        "upgradeNeeded": ["React"],
        "missing": ["Node.js", "Express", "MongoDB", "Docker"]
      },
      "marketDemand": "High",
      "activeRouteEnrolled": true
    }
  ],
  "activeRoute": {
    "hasActiveRoute": true,
    "roadmapId": "653a1...",
    "careerTitle": "Full-Stack Developer",
    "progress": 45,
    "currentWeekString": "Week 2 of 4"
  }
}
```

---

## 5. Hardened Roadmap & Progression Endpoints (`/api/roadmaps`)

### 5.1 Generate New Roadmap (Gated Single Active Route)
- **Endpoint:** `POST /api/roadmaps/generate`
- **Access:** Protected (`Bearer <token>`)
- **Request Body:**
```json
{
  "careerId": "651c8...",
  "durationWeeks": 8
}
```
- **Response `201 Created`:**
```json
{
  "success": true,
  "message": "8-week adaptive roadmap created successfully.",
  "roadmap": {
    "id": "653a1...",
    "careerTitle": "Full-Stack Developer",
    "status": "active",
    "progress": 0,
    "durationWeeks": 8,
    "weeks": [
      {
        "weekNumber": 1,
        "title": "Backend Fundamentals with Node.js",
        "tasks": [
          { "id": "t1", "title": "Setup Express Server & Routes", "completed": false }
        ]
      }
    ]
  }
}
```
- **Error Response `409 Conflict` (Active Route In Progress):**
```json
{
  "success": false,
  "code": "ACTIVE_ROUTE_IN_PROGRESS",
  "message": "An active career route is already in progress. Complete or abandon your current route before starting a new one.",
  "activeRoadmap": {
    "id": "653a1...",
    "careerTitle": "Full-Stack Developer",
    "progress": 45,
    "currentWeek": 2
  }
}
```

### 5.2 Get Current Active Roadmap
- **Endpoint:** `GET /api/roadmaps/current`
- **Access:** Protected (`Bearer <token>`)
- **Response `200 OK`:**
```json
{
  "success": true,
  "hasActiveRoadmap": true,
  "canEnrollNewRoute": false,
  "roadmap": {
    "id": "653a1...",
    "careerTitle": "Full-Stack Developer",
    "progress": 45,
    "currentWeekNumber": 2,
    "currentWeekString": "Week 2 of 8",
    "weeks": [...]
  }
}
```

### 5.3 Abandon Current Active Route (7-Day Cooldown Protected)
- **Endpoint:** `POST /api/roadmaps/current/abandon`
- **Access:** Protected (`Bearer <token>`)
- **Request Body:**
```json
{
  "reason": "Transitioning to Cloud Engineering specialization"
}
```
- **Behavior:**
  - Marks current active roadmap status as `'abandoned'`.
  - Stamps `abandonedAt: new Date()` on roadmap.
  - Updates `user.lastAbandonedRouteAt = new Date()`.
  - **Preserves 100% of student's completed tasks, quiz history, and verified skills.**
- **Response `200 OK`:**
```json
{
  "success": true,
  "message": "Career route abandoned non-destructively. All verified skills and progress history have been preserved.",
  "abandonedRoadmapId": "653a1...",
  "cooldownUntil": "2026-10-07T10:00:00.000Z"
}
```
- **Error Response `429 Too Many Requests` (Cooldown Active):**
```json
{
  "success": false,
  "code": "ABANDON_COOLDOWN_ACTIVE",
  "message": "You can only abandon an active career route once every 7 days. Your next available abandonment is in 5 day(s).",
  "cooldownExpiresAt": "2026-10-05T14:30:00.000Z"
}
```

### 5.4 Resume Abandoned Roadmap
- **Endpoint:** `POST /api/roadmaps/:id/resume`
- **Access:** Protected (`Bearer <token>`)
- **Description:** Re-activates an abandoned roadmap if the student has no other active route.
- **Response `200 OK`:**
```json
{
  "success": true,
  "message": "Roadmap successfully resumed.",
  "roadmap": {
    "id": "653a1...",
    "status": "active",
    "progress": 45
  }
}
```

### 5.5 Atomic Task Checkbox Update
- **Endpoint:** `PATCH /api/roadmaps/tasks/:id`
- **Access:** Protected (`Bearer <token>`)
- **Request Body:**
```json
{
  "completed": true
}
```
- **Response `200 OK`:**
```json
{
  "success": true,
  "taskId": "t1",
  "completed": true,
  "newProgress": 50,
  "completedTasksCount": 8,
  "totalTasksCount": 16
}
```

---

## 6. Adaptive Reality-Check Quiz Endpoints (`/api/quiz`)

### 6.1 Start Adaptive Micro-Quiz
- **Endpoint:** `POST /api/quiz/start`
- **Access:** Public / Protected
- **Request Body:**
```json
{
  "skill": "JavaScript",
  "level": "Intermediate",
  "provider": "groq"
}
```
- **Response `200 OK`:**
```json
{
  "success": true,
  "quizSessionId": "sess_9123...",
  "skill": "JavaScript",
  "totalQuestions": 5,
  "firstQuestion": {
    "questionId": "q1",
    "question": "What is the output of `typeof NaN` in modern ECMAScript?",
    "options": ["\"number\"", "\"NaN\"", "\"undefined\"", "\"object\""]
  }
}
```

### 6.2 Submit Question Answer
- **Endpoint:** `POST /api/quiz/answer`
- **Access:** Public / Protected
- **Request Body:**
```json
{
  "quizSessionId": "sess_9123...",
  "questionId": "q1",
  "selectedOptionIndex": 0
}
```
- **Response `200 OK`:**
```json
{
  "success": true,
  "isCorrect": true,
  "explanation": "In JavaScript, NaN is a numeric value representing 'Not-a-Number', so typeof NaN returns 'number'.",
  "nextQuestion": {
    "questionId": "q2",
    "question": "..."
  },
  "isCompleted": false
}
```

---

## 7. Skill Readiness & Job-Ready Check Endpoints (`/api/readiness`)

### 7.1 Evaluate 4-Rule Job Ready Certification
- **Endpoint:** `GET /api/readiness/job-ready-check`
- **Access:** Protected (`Bearer <token>`)
- **Description:** Evaluates the student's qualifications against the 4 strict industry standards.
- **Response `200 OK`:**
```json
{
  "success": true,
  "isJobReady": true,
  "certificationDate": "2026-09-30T10:00:00.000Z",
  "targetCareer": "Full-Stack Developer",
  "rules": {
    "rule1_readinessScore": {
      "name": "Overall Readiness Score ≥ 70%",
      "passed": true,
      "currentScore": 82,
      "threshold": 70
    },
    "rule2_verifiedSkills": {
      "name": "Role-Specific Verified Skills ≥ 4",
      "passed": true,
      "verifiedCount": 5,
      "threshold": 4,
      "verifiedSkills": ["JavaScript", "React", "Node.js", "HTML", "CSS"]
    },
    "rule3_roadmapProgress": {
      "name": "Active Roadmap Progress ≥ 80% or Graduated",
      "passed": true,
      "progress": 85,
      "threshold": 80
    },
    "rule4_skillRetention": {
      "name": "Zero Expired Skills (< 90 Days)",
      "passed": true,
      "expiredCount": 0
    }
  },
  "missingCriteria": []
}
```

---

## 8. Live Market Jobs Telemetry (`/api/jobs`)

### 8.1 Fetch Live Indian Jobs via Adzuna API
- **Endpoint:** `GET /api/jobs/adzuna?title=Full+Stack+Developer&location=India`
- **Access:** Public
- **Response `200 OK`:**
```json
{
  "success": true,
  "query": "Full Stack Developer",
  "totalJobsFound": 4820,
  "salaryTelemetry": {
    "minSalary": 450000,
    "maxSalary": 1200000,
    "averageSalary": 780000,
    "currency": "INR",
    "formattedRange": "₹4.5 LPA – ₹12.0 LPA"
  },
  "listings": [
    {
      "id": "adz_1",
      "title": "Full Stack Engineer (MERN)",
      "company": "Infosys",
      "location": "Bengaluru, Karnataka",
      "salary": "₹6.5 LPA – ₹8.5 LPA",
      "applyUrl": "https://..."
    }
  ]
}
```

---

## 9. AI Career Mentor (`/api/chat`)

### 9.1 Send Career Coaching Message
- **Endpoint:** `POST /api/chat/message`
- **Access:** Protected (`Bearer <token>`) / Demo
- **Request Body:**
```json
{
  "message": "What portfolio projects should I build to stand out for a Junior Backend Engineer role?",
  "activeCareerSlug": "backend-engineer"
}
```
- **Response `200 OK`:**
```json
{
  "success": true,
  "reply": "For a Junior Backend Engineer in the Indian market, prioritize 2 production-grade projects: 1) A distributed rate-limiter or caching service using Redis and Node.js with benchmark graphs, and 2) A RESTful multi-tenant billing system with role-based access control (RBAC).",
  "inferenceEngine": "Groq Llama 3.3 70B",
  "latencyMs": 284
}
```

---

## 10. Student Dashboard Aggregator (`/api/dashboard`)

### 10.1 Aggregate Complete Student Metrics
- **Endpoint:** `GET /api/dashboard`
- **Access:** Protected (`Bearer <token>`)
- **Response `200 OK`:**
```json
{
  "success": true,
  "user": {
    "name": "Demo Student",
    "primaryStream": "Tech & Engineering"
  },
  "activeRoadmap": {
    "id": "653a1...",
    "careerTitle": "Full-Stack Developer",
    "progress": 45,
    "currentWeekString": "Week 2 of 4",
    "nextTask": "Implement JWT Middleware"
  },
  "resume": {
    "hasResume": true,
    "fileName": "Demo_Resume.pdf"
  },
  "jobReadyCertification": {
    "isJobReady": false,
    "passedRulesCount": 3,
    "totalRulesCount": 4
  },
  "studyLab": {
    "reposCount": 6,
    "topLanguages": ["JavaScript", "TypeScript"]
  }
}
```

---

## 11. System Health Telemetry (`/api/health`)

### 11.1 Check Health & Uptime
- **Endpoint:** `GET /api/health`
- **Access:** Public
- **Response `200 OK`:**
```json
{
  "status": "healthy",
  "uptime": "142 hours, 18 minutes",
  "database": "connected",
  "environment": "production",
  "version": "1.0.0"
}
```
