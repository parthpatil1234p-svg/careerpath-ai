# Implementation Plan: Strict Recruiter vs Student Portal Isolation (RBAC Walls)

> **User Request**:
> *"/plan but as a recruiter not open the student portal & as a student not open the recruiter portal"*

---

## 1. Goal Description

Enforce strict, bi-directional role-based access control (RBAC) so that:
1. **Recruiter Isolation**: When logged in as a Recruiter, the user cannot access any Student Portal pages (`dashboard.html`, `assessment.html`, `recommendations.html`, `roadmap.html`, `resume-builder.html`, `quiz.html`). Any direct URL navigation immediately redirects to `recruiter-dashboard.html` with an informative restriction notice.
2. **Student Isolation**: When logged in as a Student, the user cannot access the Recruiter Portal (`recruiter-dashboard.html` or recruiter management tools). Any attempt to access recruiter pages immediately redirects to `dashboard.html` with an access-denied notice.
3. **API Level Isolation**: All backend student endpoints (`/api/dashboard`, `/api/assessment`, `/api/recommendations`, `/api/roadmaps`, `/api/resume`, `/api/quiz`, `/api/interview`, `/api/readiness`) return `403 FORBIDDEN` for recruiters (`RECRUITER_ACCESS_DENIED`). All recruiter endpoints (`/api/recruiter/*`) return `403 FORBIDDEN` for students (`STUDENT_ACCESS_DENIED`).
4. **Dynamic Navigation & Portal Identity**: Both portals render role-specific navigation bars, brand tags, and links with no cross-portal leakage.

---

## 2. Portal Boundary Architecture

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                 AUTHENTICATION DISPATCHER (LOGIN)                                │
├──────────────────────────────────────────────────────────────────────────────────────────────────┤
│   POST /api/auth/login  ──► Returns JWT with role: 'student' | 'recruiter'                       │
│                                                                                                  │
│             ┌──────────────────────────────────────────────┴──────────────────────────────┐       │
│             ▼                                                                             ▼       │
│   ROLE === 'student'                                                           ROLE === 'recruiter'│
│   Redirects to: dashboard.html                                      Redirects to: recruiter-dashboard.html
│                                                                                                  │
├──────────────────────────────────────────────────────┬───────────────────────────────────────────┤
│                STUDENT PORTAL ZONE                   │           RECRUITER PORTAL ZONE           │
├──────────────────────────────────────────────────────┼───────────────────────────────────────────┤
│  Frontend Pages:                                     │  Frontend Pages:                          │
│  • dashboard.html                                    │  • recruiter-dashboard.html               │
│  • assessment.html                                   │  • (future recruiter sub-pages)           │
│  • recommendations.html                              │                                           │
│  • roadmap.html                                      │  Guard: Auth.requireRecruiter()           │
│  • resume-builder.html                               │  If student visits:                       │
│  • quiz.html                                         │  ==> Redirect to dashboard.html           │
│                                                      │                                           │
│  Guard: Auth.requireStudent()                        │                                           │
│  If recruiter visits:                                │                                           │
│  ==> Redirect to recruiter-dashboard.html            │                                           │
│                                                      │                                           │
├──────────────────────────────────────────────────────┼───────────────────────────────────────────┤
│  Protected Backend Endpoints (requireStudent):       │  Protected Backend Endpoints (requireRecruiter)
│  • /api/dashboard                                    │  • /api/recruiter/jobs (Create/Manage)    │
│  • /api/assessment                                   │  • /api/recruiter/jobs/:id/applicants     │
│  • /api/recommendations                              │  • /api/recruiter/applications/:id/status │
│  • /api/roadmaps/*                                   │  • /api/recruiter/profile                 │
│  • /api/resume/*                                     │                                           │
│  • /api/quiz/*                                       │  If student calls:                        │
│  • /api/interview/*                                  │  ==> HTTP 403 (STUDENT_ACCESS_DENIED)     │
│  • /api/readiness/*                                  │                                           │
│                                                      │                                           │
│  If recruiter calls:                                 │                                           │
│  ==> HTTP 403 (RECRUITER_ACCESS_DENIED)              │                                           │
└──────────────────────────────────────────────────────┴───────────────────────────────────────────┘
```

---

## 3. User Review Required

> [!IMPORTANT]
> **Bi-directional Hard Redirection**: Direct typing of URLs in the browser address bar (e.g., a recruiter pasting `http://localhost:5500/roadmap.html` or a student typing `http://localhost:5500/recruiter-dashboard.html`) will be trapped immediately before any private data is rendered, redirecting to the authorized portal with a visual toast banner explaining the boundary.

> [!NOTE]
> **Dual-Role Accounts**: An account is either a student account or a company recruiter account. A company recruiter hiring developers should not have a student career learning roadmap on that corporate account. If a recruiter wishes to learn as a student, they can register a separate student account using their personal email.

---

## 4. Proposed Changes

### Component 1: Client-Side Auth Guards & Routing Walls

#### [MODIFY] `client/js/auth.js`
1. Define page classification catalogs:
   ```javascript
   const STUDENT_PAGES = [
     'dashboard.html',
     'assessment.html',
     'recommendations.html',
     'roadmap.html',
     'resume-builder.html',
     'quiz.html',
   ];

   const RECRUITER_PAGES = [
     'recruiter-dashboard.html',
   ];
   ```
2. Implement `Auth.requireStudent()`:
   - Verifies user is authenticated.
   - If `user.role === 'recruiter'`:
     - Sets session flash: `sessionStorage.setItem('portal_redirect_alert', 'Recruiter accounts cannot access the student learning portal. You have been redirected to your Recruiter Dashboard.')`.
     - Immediately executes: `window.location.replace('recruiter-dashboard.html')`.
     - Returns `false`.
   - Returns `true`.
3. Implement `Auth.requireRecruiter()`:
   - Verifies user is authenticated.
   - If `user.role === 'student'`:
     - Sets session flash: `sessionStorage.setItem('portal_redirect_alert', 'Student accounts cannot access the company recruiter portal. You have been redirected to your Student Dashboard.')`.
     - Immediately executes: `window.location.replace('dashboard.html')`.
     - Returns `false`.
   - Returns `true`.
4. Automated page load boundary check in `auth.js`:
   - Automatically executes on script evaluation: if the active pathname matches a student page and user is recruiter, it intercepts and redirects before any page rendering takes place.
5. Display Flash Alert helper `Auth.consumePortalAlert()`:
   - On destination page, reads and clears `sessionStorage.getItem('portal_redirect_alert')`, rendering a friendly warning banner at the top of the dashboard.

#### [MODIFY] `client/js/login.js`
- Route users strictly according to their role upon login:
  ```javascript
  if (user.role === 'recruiter') {
    window.location.href = 'recruiter-dashboard.html';
  } else if (user.role === 'student') {
    if (user.profileCompleted) {
      window.location.href = 'dashboard.html';
    } else {
      window.location.href = 'assessment.html';
    }
  } else if (user.role === 'admin') {
    window.location.href = 'dashboard.html';
  }
  ```

#### [MODIFY] Student Pages (`dashboard.html`, `assessment.html`, `recommendations.html`, `roadmap.html`, `resume-builder.html`, `quiz.html`)
- In their controller init scripts (`dashboard.js`, `assessment.js`, `roadmap.js`, etc.):
  - Replace `Auth.requireAuth()` with `Auth.requireStudent()`.
  - Check and render `Auth.consumePortalAlert()`.

#### [MODIFY] `client/recruiter-dashboard.html` & `client/js/recruiter.js`
- Call `Auth.requireRecruiter()` immediately on DOM load.
- Render recruiter-tailored navbar: Recruiter Dashboard, Post Job, Applicants, Company Verification Badge, Logout.

---

### Component 2: Backend API Guards & Middlewares

#### [MODIFY] `server/middleware/authMiddleware.js`
1. Export `requireStudent`:
   ```javascript
   const requireStudent = (req, res, next) => {
     if (req.user.role === 'recruiter') {
       return res.status(403).json({
         success: false,
         code: 'RECRUITER_ACCESS_DENIED',
         message: 'Access denied. Recruiter accounts cannot access student learning and roadmap resources. Please use the Recruiter Portal.',
       });
     }
     next();
   };
   ```
2. Export `requireRecruiter`:
   ```javascript
   const requireRecruiter = (req, res, next) => {
     if (req.user.role === 'student') {
       return res.status(403).json({
         success: false,
         code: 'STUDENT_ACCESS_DENIED',
         message: 'Access denied. Student accounts cannot access the company recruiter portal.',
       });
     }
     next();
   };
   ```
3. Export `requireVerifiedRecruiter`:
   ```javascript
   const requireVerifiedRecruiter = (req, res, next) => {
     if (req.user.role !== 'recruiter' && req.user.role !== 'admin') {
       return res.status(403).json({
         success: false,
         code: 'STUDENT_ACCESS_DENIED',
         message: 'Access denied. Recruiter account required.',
       });
     }
     if (req.user.role === 'recruiter' && req.user.recruiterProfile?.verificationStatus !== 'verified') {
       return res.status(403).json({
         success: false,
         code: 'RECRUITER_NOT_VERIFIED',
         message: 'Recruiter account is pending corporate verification. Company details must be verified before posting jobs.',
       });
     }
     next();
   };
   ```

#### [MODIFY] Student Route Files:
Attach `requireStudent` middleware to all student-specific routes:
1. `server/routes/dashboardRoutes.js`: `router.get('/', protect, requireStudent, ...)`
2. `server/routes/assessmentRoutes.js`: `protect, requireStudent`
3. `server/routes/recommendationRoutes.js`: `protect, requireStudent`
4. `server/routes/roadmapRoutes.js`: `protect, requireStudent`
5. `server/routes/resumeRoutes.js`: `protect, requireStudent`
6. `server/routes/quizRoutes.js`: `protect, requireStudent`
7. `server/routes/interviewRoutes.js`: `protect, requireStudent`
8. `server/routes/readinessRoutes.js`: `protect, requireStudent`
9. `server/routes/evidenceRoutes.js`: `protect, requireStudent`

#### [MODIFY] Recruiter Route File:
`server/routes/recruiterRoutes.js`:
- Attach `protect, requireRecruiter` to all recruiter routes.
- Attach `protect, requireVerifiedRecruiter` to `POST /jobs`.

---

## 5. Verification Plan

### Automated Tests
1. **Recruiter Blocked from Student APIs**:
   - Authenticate as a user with `role: 'recruiter'`.
   - Send `GET /api/dashboard` with recruiter token -> Assert `HTTP 403 Forbidden` (`code: 'RECRUITER_ACCESS_DENIED'`).
   - Send `POST /api/roadmaps/generate` with recruiter token -> Assert `HTTP 403 Forbidden` (`code: 'RECRUITER_ACCESS_DENIED'`).
   - Send `POST /api/resume/analyze-ats` with recruiter token -> Assert `HTTP 403 Forbidden` (`code: 'RECRUITER_ACCESS_DENIED'`).
2. **Student Blocked from Recruiter APIs**:
   - Authenticate as a user with `role: 'student'`.
   - Send `POST /api/recruiter/jobs` with student token -> Assert `HTTP 403 Forbidden` (`code: 'STUDENT_ACCESS_DENIED'`).
   - Send `GET /api/recruiter/jobs` with student token -> Assert `HTTP 403 Forbidden` (`code: 'STUDENT_ACCESS_DENIED'`).
3. **Login Redirection Accuracy**:
   - Send `POST /api/auth/login` for recruiter account -> Assert `role: 'recruiter'`.
   - Client redirects to `recruiter-dashboard.html`.
   - Send `POST /api/auth/login` for student account -> Assert `role: 'student'`.
   - Client redirects to `dashboard.html`.

### Manual UI Verification
1. **Recruiter Trying to Open Student Pages**:
   - Log in as a Recruiter.
   - Manually type `http://localhost:5500/dashboard.html` in browser address bar.
   - **Expectation**: Browser immediately redirects back to `http://localhost:5500/recruiter-dashboard.html` with an alert: *"Recruiter accounts cannot access the student learning portal."*
   - Manually type `http://localhost:5500/roadmap.html` or `resume-builder.html`.
   - **Expectation**: Immediate redirect back to `recruiter-dashboard.html`.
2. **Student Trying to Open Recruiter Portal**:
   - Log in as a Student.
   - Manually type `http://localhost:5500/recruiter-dashboard.html` in browser address bar.
   - **Expectation**: Browser immediately redirects back to `http://localhost:5500/dashboard.html` with an alert: *"Student accounts cannot access the company recruiter portal."*
3. **Navbar Sanity**:
   - Recruiter sees Recruiter Portal links only.
   - Student sees Student Portal links only.
