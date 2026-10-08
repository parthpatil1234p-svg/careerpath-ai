# Implementation Plan: Recruiter Verification, Real Company Validation & Job Posting System

> **User Request**:
> *"5. Company Recruiters can add job openings. The site will check if the user is actual recruiter or not. In registration form filling, the site should know that the company is real."*

---

## 1. Goal Description

Provide a complete, secure, enterprise-grade **Recruiter & Company Ecosystem** on CareerPath AI where:
1. **Real Company Validation**: During registration form filling, the site verifies in real-time that the employer company is genuine through corporate domain matching, DNS MX record resolution, live website probing, and AI corporate intelligence verification (Gemini 2.5 Flash).
2. **Recruiter Authenticity Check**: Proves that the registrant is an authentic, authorized recruiter for that company through mandatory corporate inbox OTP challenges (`recruiter@company.com`), LinkedIn profile credentials, and automated trust scoring.
3. **Job Opening Management & Applicant Radar**: Verified recruiters can create and manage job postings with required skills, experience levels, and salary ranges. They can view candidate applications sorted by **AI Skill Match Score**, inspect student verified skill badges (`Quiz-Verified`, `Code-Verified`, `Job Ready Tier`), and update candidate hiring stages (`Shortlisted`, `Interview Scheduled`, `Declined`).
4. **Student Experience**: Students discover verified direct company openings on the platform and apply in 1-click using their verified CareerPath AI profile, digital badges, and built ATS resume.

---

## 2. Architecture & Verification Pipeline

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                     LAYER 1: REGISTRATION & REAL COMPANY VERIFICATION                   │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                         │
│   Registration Form (register.html)                                                     │
│   ├── User selects: [🏢 Company Recruiter]                                              │
│   ├── Enters: Work Email (e.g. alex@razorpay.com), Website (https://razorpay.com)       │
│   │                                                                                     │
│   ▼                                                                                     │
│   POST /api/recruiter/verify-company-precheck                                           │
│   ├── Check 1: Webmail Blacklist (Rejects @gmail.com, @yahoo.com, @outlook.com, etc.)   │
│   ├── Check 2: Domain Cross-Match (email domain "razorpay.com" === website domain)      │
│   ├── Check 3: DNS MX Resolution (Checks if domain has active mail exchange servers)    │
│   ├── Check 4: HTTP/HTTPS Live Probe (Checks if company website resolves 200 OK)        │
│   └── Check 5: Gemini AI Intelligence (Checks company legitimacy, industry & scale)     │
│                                                                                         │
│   ▼ Visual Feedback in Form                                                             │
│   🟢 "✓ Verified Corporate Domain: Razorpay Software Pvt Ltd · Fintech (Score: 98/100)" │
│                                                                                         │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                     LAYER 2: RECRUITER AUTHENTICITY VERIFICATION                         │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                         │
│   Corporate Email OTP Challenge                                                         │
│   ├── 6-Digit cryptographic OTP dispatched to alex@razorpay.com                         │
│   ├── Only an authorized individual with inbox access can retrieve the code             │
│   ├── Validates Recruiter LinkedIn URL + Job Title                                      │
│   └── Sets User.role = 'recruiter', verificationStatus = 'verified', canPostJobs = true │
│                                                                                         │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                     LAYER 3: JOB OPENINGS & APPLICANT MATCHING                          │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                         │
│   Recruiter Dashboard (recruiter-dashboard.html)                                        │
│   ├── Post New Job Opening (Title, Career Track, Required Skills, Salary, Type)         │
│   ├── Guarded by: requireVerifiedRecruiter middleware                                   │
│   └── Manage Active Jobs, View Applicants & Match Scores                                │
│                                                                                         │
│   Student Job Board (jobs.html)                                                         │
│   ├── Displays "⭐ Verified Recruiter Direct Opening"                                   │
│   ├── 1-Click Apply using verified skills, readiness score & ATS resume                 │
│   └── Recruiter reviews applicants sorted by Match % with verified badges              │
│                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. User Review Required

> [!IMPORTANT]
> **Corporate Email Requirement**: To prevent impersonation and spam job postings, recruiter registration strictly mandates an official corporate/work email (e.g. `@google.com`, `@infosys.com`, `@startup.io`). Free webmail services (`@gmail.com`, `@yahoo.com`, `@outlook.com`, `@hotmail.com`, `@proton.me`, etc.) are blocked for recruiter accounts.

> [!NOTE]
> **Seamless Auto-Verification**: If a recruiter's company domain resolves with valid MX records and the Gemini corporate check achieves $\ge 75\%$ confidence, the recruiter is granted immediate posting rights upon OTP verification, with no manual admin delay required.

---

## 4. Proposed Changes

Grouped by component, logically ordered:

---

### Component A: Database Models

#### [NEW] `server/models/Company.js`
Defines the canonical company entity in MongoDB:
- `name`: String (e.g., "Razorpay", "Google", "Zomato")
- `domain`: String (unique index, e.g., "razorpay.com")
- `website`: String (e.g., "https://razorpay.com")
- `logoUrl`: String (auto-fetched or custom)
- `industry`: String (e.g., "Fintech", "Cloud Software")
- `headquarters`: String
- `companySize`: String (e.g., "500-1000 employees")
- `cinNumber`: String (Corporate Identity Number / Tax ID)
- `linkedinUrl`: String
- `isVerified`: Boolean (default: true once checks pass)
- `verificationScore`: Number (0-100)
- `verificationDetails`: `{ dnsValid: Boolean, websiteLive: Boolean, domainMatch: Boolean, aiSummary: String, verifiedAt: Date }`
- `recruiters`: `[{ type: ObjectId, ref: 'User' }]`

#### [MODIFY] `server/models/User.js`
- Update `role` enum to include `'recruiter'`:
  ```javascript
  role: {
    type: String,
    enum: {
      values: ['student', 'admin', 'recruiter'],
      message: 'Role must be student, admin, or recruiter',
    },
    default: 'student',
  }
  ```
- Add `recruiterProfile` subdocument:
  ```javascript
  recruiterProfile: {
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
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
    verificationScore: { type: Number, default: 0 },
    verificationMethod: { type: String, default: 'corporate_email_otp_plus_ai_intel' },
    canPostJobs: { type: Boolean, default: false },
    verifiedAt: { type: Date, default: null },
  }
  ```

#### [NEW] `server/models/JobOpening.js`
Defines recruiter-posted job opportunities:
- `recruiter`: Ref to `User` (required)
- `company`: Ref to `Company` (required)
- `companyName`: String
- `companyLogo`: String
- `companyWebsite`: String
- `isCompanyVerified`: Boolean
- `title`: String (e.g., "Full-Stack Node.js & React Developer")
- `careerSlug`: String (`front-end-developer`, `backend-architect`, etc.)
- `jobType`: Enum (`full-time`, `part-time`, `internship`, `contract`)
- `workplace`: Enum (`remote`, `hybrid`, `on-site`)
- `location`: String (e.g., "Bengaluru, India" or "Remote")
- `experienceLevel`: Enum (`fresher`, `entry`, `mid`, `senior`)
- `salaryRange`: `{ min: Number, max: Number, currency: String, isDisclosed: Boolean }`
- `requiredSkills`: `[{ skillName: String, minimumProficiency: String, requiresVerification: Boolean }]`
- `description`: String
- `responsibilities`: `[String]`
- `requirements`: `[String]`
- `status`: Enum (`active`, `paused`, `closed`)
- `applicantsCount`: Number (default: 0)
- `viewsCount`: Number (default: 0)
- `deadline`: Date

#### [NEW] `server/models/JobApplication.js`
Defines candidate job submissions:
- `job`: Ref to `JobOpening` (required)
- `student`: Ref to `User` (required)
- `recruiter`: Ref to `User` (required)
- `matchScore`: Number (0-100%)
- `matchedSkills`: `[String]`
- `missingSkills`: `[String]`
- `readinessTier`: String
- `resumeUrl`: String
- `builtResumeSnapshot`: Object
- `coverNote`: String
- `status`: Enum (`applied`, `reviewed`, `shortlisted`, `rejected`, `interview_scheduled`)
- `recruiterNotes`: String
- `appliedAt`: Date (default: Date.now)

---

### Component B: Backend Verification Services & APIs

#### [NEW] `server/services/companyVerificationService.js`
Multi-layer automated company legitimacy engine:
1. `isFreeWebmail(emailDomain)`: Tests against 50+ free webmail providers (`gmail`, `yahoo`, `hotmail`, `outlook`, `proton`, `icloud`, `mailinator`, etc.).
2. `extractDomain(input)`: Sanitizes URLs and emails into root domain (e.g. `https://careers.google.com` -> `google.com`).
3. `checkDnsMx(domain)`: Uses Node.js native `dns.promises.resolveMx(domain)` to verify mail server presence.
4. `checkWebsiteLive(domain)`: Performs fast HEAD/GET request with timeout to verify site uptime and metadata.
5. `verifyCompanyWithAi({ companyName, domain, website, cin })`: Prompts Gemini 2.5 Flash to verify company existence, industry, legitimacy score, and flags.
6. `computeOverallCompanyVerification(...)`: Combines MX, website, domain-match, and AI score into a final composite confidence score (0-100%).

#### [NEW] `server/controllers/recruiterController.js`
- `verifyCompanyPrecheck`: Live validation called by the registration form. Returns legitimacy badge, confidence score, and company metadata.
- `registerRecruiter`: Registers the recruiter, validates corporate email, computes verification score, stores unverified account, and dispatches 6-digit OTP.
- `getRecruiterProfile`: Returns logged-in recruiter details, company record, and posting permissions.
- `createJob`: Validates posting requirements, ensures recruiter is verified, creates `JobOpening` document.
- `getMyJobs`: Returns all jobs created by recruiter with live counts.
- `getJobDetails`: Returns single job with applications list.
- `updateJob`: Edit job parameters or toggle status (`active` / `paused` / `closed`).
- `deleteJob`: Soft delete / archive job.
- `getJobApplicants`: Fetches applicants for a job, enriched with candidate verified skill badges, ATS scores, and match percentages.
- `updateApplicationStatus`: Updates student status (`shortlisted`, `interview_scheduled`, `rejected`).

#### [NEW] `server/routes/recruiterRoutes.js`
Mounted at `/api/recruiter`:
- `POST /verify-company-precheck` (Public)
- `POST /register` (Public)
- `GET  /profile` (Protected, `protect`, `authorize('recruiter', 'admin')`)
- `POST /jobs` (Protected, `protect`, `requireVerifiedRecruiter`)
- `GET  /jobs` (Protected, `protect`, `authorize('recruiter', 'admin')`)
- `GET  /jobs/:id` (Protected, `protect`, `authorize('recruiter', 'admin')`)
- `PATCH /jobs/:id` (Protected, `protect`, `authorize('recruiter', 'admin')`)
- `DELETE /jobs/:id` (Protected, `protect`, `authorize('recruiter', 'admin')`)
- `GET  /jobs/:id/applicants` (Protected, `protect`, `authorize('recruiter', 'admin')`)
- `PATCH /applications/:appId/status` (Protected, `protect`, `authorize('recruiter', 'admin')`)

#### [MODIFY] `server/middleware/authMiddleware.js`
- Add `requireVerifiedRecruiter` guard to protect job creation and applicant review.

#### [MODIFY] `server/routes/jobRoutes.js`
- Add student direct endpoints:
  - `GET /api/jobs/recruiter-openings`: Returns direct verified company openings with student-specific match scores.
  - `POST /api/jobs/:id/apply`: 1-Click apply for students using their verified skills and resume.
  - `GET /api/jobs/my-applications`: Lists all jobs student has applied to.

#### [MODIFY] `server/server.js`
- Mount `app.use('/api/recruiter', recruiterRoutes)`.

---

### Component C: Frontend UI & Client Integration

#### [MODIFY] `client/register.html`
- **Role Switcher Header**:
  - Two prominent tabs: `[ 🎓 Student Enrollment ]` and `[ 🏢 Company Recruiter Onboarding ]`.
- **Recruiter Registration Form**:
  - Work Email Input with live warning if `@gmail.com` is entered:
    *"⚠️ Recruiters must use an official corporate email (e.g. name@company.com)."*
  - Company Name & Official Website fields.
  - Recruiter Title & Personal LinkedIn URL.
  - Live **"Verify Company" Pill**: Runs debounced check against `/api/recruiter/verify-company-precheck` and displays:
    - 🟢 *"✓ Verified Company: Razorpay Software Pvt Ltd · Fintech (Score: 98/100)"*
    - 🔴 *"Company verification failed: Corporate email does not match company domain or domain does not resolve."*
  - 6-Digit Corporate Email OTP screen.

#### [MODIFY] `client/js/register.js`
- Add recruiter tab toggle state.
- Real-time debounced company validation handler.
- Dispatch recruiter registration and handle corporate OTP submission.

#### [NEW] `client/recruiter-dashboard.html` & `client/js/recruiter.js`
- **Header**: Recruiter name, Company Name, Verified Company Badge (`✓ Verified Enterprise`).
- **Stats Row**:
  - Active Job Openings
  - Total Candidates Applied
  - Shortlisted Applicants
  - Company Trust Score
- **"Post New Job Opening" Modal**:
  - Job title, career track dropdown, workplace type (Remote / Hybrid / Onsite), experience level.
  - Required skills tag selector with checkbox: *"Mandate CareerPath AI Skill Verification"*.
  - Salary range, role description, qualifications, and deadline.
- **Active Jobs Table**:
  - Title, Career Track, Date Posted, Status Toggle (Active/Paused), Applicants count, "View Applicants" action.
- **Applicant Review Drawer / Modal**:
  - Candidate Cards ranked by Match Score (e.g., `94% Match`).
  - Badges for candidate's verified skills (`Quiz-Verified Python`, `Code-Verified React`, `Job Ready Tier`).
  - Candidate built ATS resume viewer link.
  - Quick recruiter action buttons: `Shortlist`, `Interview`, `Reject`.

#### [MODIFY] `client/js/auth.js` & `client/js/login.js`
- Add `Auth.isRecruiter()` and `Auth.requireRecruiter()` helpers.
- On successful login, if `user.role === 'recruiter'`, automatically redirect to `recruiter-dashboard.html`.

#### [MODIFY] `client/jobs.html`
- Render recruiter-posted jobs prominently with a **"⭐ Direct Recruiter Post"** badge, company logo, verified badge, and 1-Click "Apply with CareerPath AI Profile" button.

---

## 5. Verification Plan

### Automated Tests
1. **Corporate Domain & Webmail Rejection Test**:
   - Attempt recruiter registration with `test@gmail.com` -> Assert HTTP 400 rejection: "Corporate email required".
   - Attempt recruiter registration with email domain `user@stripe.com` and website `https://razorpay.com` -> Assert HTTP 400 rejection: "Corporate email domain must match company website".
2. **Real-time DNS & AI Company Intelligence Test**:
   - Call `/api/recruiter/verify-company-precheck` with `google.com` / `razorpay.com` -> Assert HTTP 200, `isRealCompany: true`, `confidenceScore >= 80`.
   - Call `/api/recruiter/verify-company-precheck` with `fakefakedomainnotreal999.xyz` -> Assert HTTP 422, `isRealCompany: false`.
3. **Recruiter OTP & Activation Test**:
   - Register recruiter with valid company details -> Verify user created with `role: 'recruiter'`, `verificationStatus: 'pending'`.
   - Verify OTP -> User activated with `verificationStatus: 'verified'`, `canPostJobs: true`.
4. **Job Posting & Access Guard Test**:
   - Attempt job creation as student -> Assert HTTP 403 Forbidden.
   - Attempt job creation as verified recruiter -> Assert HTTP 201 Created.
5. **Applicant Match & Direct Apply Test**:
   - Student with verified skills applies to the job -> Assert application created with computed match percentage.
   - Recruiter loads applicants -> Assert applicant appears sorted with verified badges.

### Manual Verification
1. Open `http://localhost:5500/register.html`.
2. Click "Company Recruiter" tab.
3. Type `alex@gmail.com` -> Observe immediate red inline warning blocking free webmail.
4. Type `recruiter@razorpay.com` and website `https://razorpay.com` -> Observe green corporate verification badge.
5. Complete registration, enter OTP in modal -> Redirected to `recruiter-dashboard.html`.
6. Click "Post New Job", fill details, and submit -> Job appears instantly in Active Jobs list.
7. Open `http://localhost:5500/login.html`, log in as student -> View posted job in Job Board and submit 1-click application.
8. Switch back to Recruiter Dashboard -> View the applicant with match score and verified skill badges.
