# Official Hackathon Demo Script — Golden Path Walkthrough (3-Minute Evaluator Guide)

> **🏆 Hack2Ignite 2026–27 · Team 404 Brain Not Found**  
> **Problem Statement ID:** ED-02 (AI Career Guidance and Skill Roadmap Platform)  
> **Presenter / Speaker Guide:** 3–4 Minute Live Prototype Demonstration

---

## ⏱️ Live Demonstration Timeline & Speaking Notes

### 🎬 Minute 0:00 – 0:35 · Hook & Frictionless Authentication
- **Action:** Open landing page at `http://localhost:5500/index.html` (or [live Vercel URL](https://careerpath-ai-jade.vercel.app)).
- **What to show:**
  1. Highlight the **CareerPath AI** headline and EduTech positioning: *"Discover Your Career. Bridge Your Skill Gaps. Build Your Future."*
  2. Point out the interactive **Three.js 3D Career Universe** constellation.
  3. Click **"Get Started"** to navigate to `/login.html`.
  4. Click the purple button: **"⚡ 1-Click Fill Demo Account"** (`demouser@gmail.com` / `demo123`) and hit **Login**.
- **Speaker Script:**
  > *"Respected judges, every year over 1.5 million engineers graduate in India, but more than 80% struggle to meet industry hiring benchmarks because of generic advice and self-reported resume inflation. Today, we present CareerPath AI — an explainable, code-grounded career navigation engine."*

---

### 🎬 Minute 0:35 – 1:20 · Assessment & Auth-Based GitHub Repository Sync
- **Action:** Navigate to `/assessment.html`.
- **What to show:**
  1. Show academic profile inputs (Course: B.Tech, Year: Third Year).
  2. Scroll to the **Skills Profiler** section.
  3. Click **"Auto-Detect Skills"**:
     - *Point out that NO manual username prompt modal appears.*
     - Show the inline loading state and success toast: *"✓ Repositories synchronized via auth system!"*
  4. Show the green luminous badges: `[✓ Code Verified]` attached to detected technologies (JavaScript, HTML, CSS, TypeScript).
- **Speaker Script:**
  > *"Instead of relying on unverified claims, CareerPath AI introduces two-factor skill verification. Notice how clicking 'Auto-Detect Skills' directly queries our backend via an authenticated session token, fetching real public GitHub repositories, calculating language distributions, and issuing verified code badges with zero friction."*

---

### 🎬 Minute 1:20 – 2:05 · Adaptive Skill Reality-Check Micro-Quiz
- **Action:** Click **"Take Reality-Check Quiz"** or navigate to `/quiz.html`.
- **What to show:**
  1. Show the **Provider Switcher / BYOK Modal**: point out that judges can toggle between **Groq Llama 3.3 70B** (<300ms speed), **Google Gemini 2.5 Flash**, or enter their own API key.
  2. Answer Question 1 of 5: show instant pedagogical explanation explaining *why* the answer is correct or incorrect.
  3. Show the dynamic stepper dots advancing from Question 1 to 5.
  4. Complete the 5 questions to display the scorecard.
  5. Explain the **One-Time Verification Rule**: the student is marked as `isQuizVerified: true` and `hasCompletedSkillVerification: true`, permanently recording their competency without annoying re-gating.
- **Speaker Script:**
  > *"To defeat resume inflation, our adaptive micro-quiz generates 5 dynamic reality-check questions using Groq Llama 3.3 70B in under 300 milliseconds, with automated Google Gemini failover. Once verified, this credential is saved permanently to the student's profile."*

---

### 🎬 Minute 2:05 – 2:45 · Explainable Recommendations & Live Market Telemetry
- **Action:** Navigate to `/recommendations.html`.
- **What to show:**
  1. Point out the **Top 3 Recommended Careers** (e.g., Full Stack Developer, DevOps Engineer, Data Scientist).
  2. Highlight the **60/25/15 Mathematical Breakdown**: 60% Skill Match, 25% Interest Overlap, 15% Academic Alignment.
  3. Show the **Tri-Color Skill Gap Matrix**:
     - 🟢 **Matched Skills** (with verified badges)
     - 🟡 **Proficiency Upgrades**
     - 🔴 **Missing Skills** (the exact curriculum for the roadmap)
  4. Click **"Live Market Telemetry & CTC"**: show real-time Indian tech job listings and salary ranges fetched from the **Adzuna Developer API**.
- **Speaker Script:**
  > *"Unlike black-box AI tools, our recommendation engine uses an explainable 60/25/15 formula. Students immediately see their tri-color skill gap analysis, alongside live Indian CTC salary ranges and vacancies streamed via the Adzuna API."*

---

### 🎬 Minute 2:45 – 3:30 · Adaptive Roadmap & Student Dashboard
- **Action:** Click **"Build My Roadmap"** (choose 8 Weeks) ➔ then open `/dashboard.html`.
- **What to show:**
  1. On `/roadmap.html`: show week-by-week actionable tasks with verified documentation links. Check off one task to show progress recalculating.
  2. Click **"1-Click Print / PDF Export"** to showcase clean printing layout.
  3. Open `/dashboard.html`:
     - Point out the **Accessible 2D SVG Percentage Progress Gauge** (0–100%).
     - Show the **GitHub Study Lab** displaying connected repositories and language telemetry.
     - Demonstrate clicking **"Sync Repos"** on the dashboard (updates instantly via auth token).
  4. Open the floating **`🤖 AI Mentor`** drawer in the bottom right corner and send a sample question: *"How do I prepare for React system design interviews?"* Show sub-500ms AI response.
- **Speaker Script:**
  > *"Finally, students receive a time-boxed roadmap. Checking off tasks atomically updates our accessible 2D percentage progress meter on the dashboard. Along with our 24/7 AI Mentor, CareerPath AI transforms career confusion into disciplined, daily progress. Thank you!"*

---

## 🛡️ Quick Answers for Judges' Questions

| Question from Evaluator | Winning Response |
| :--- | :--- |
| **"Is the AI advice trustworthy?"** | *"Yes. We don't ask the AI to guess a career blindly. We use a deterministic 60/25/15 mathematical formula for recommendations, and use AI strictly for generating validated quiz questions and conversational mentoring."* |
| **"How does the app prevent cheating on self-reported skills?"** | *"Through our two-factor verification pipeline: 1) Auth-based GitHub repo code scanning (`isCodeVerified`), and 2) Dynamic 5-question reality-check micro-quizzes (`isQuizVerified`)."* |
| **"How does the business sustain itself without charging students?"** | *"CareerPath AI is free for students always. We monetize via an institutional B2B placement SaaS for colleges (TPO Portal for NAAC/NIRF reporting at ₹1.99L/year) and a recruiter verified-talent pass at ₹24,999/month."* |