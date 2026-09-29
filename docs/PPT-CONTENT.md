# Official Presentation Deck Content & Speaker Notes

> **🏆 Hack2Ignite 2026–27 · Team 404 Brain Not Found**  
> **Project:** CareerPath AI (Problem Statement: ED-02)  
> **Format:** 10-Slide Pitch Deck Structure & Speaker Scripts

---

## Slide 1: Title & Hook
- **Slide Title:** CareerPath AI — Discover Your Career. Bridge Your Skill Gaps. Build Your Future.
- **Sub-headline:** An Explainable AI Career Atlas & Milestone Roadmap Ecosystem for Indian Engineering Students.
- **Team:** 404 Brain Not Found (Parth Patil, Aditi Vispute, Suyog Pawar, Sanika Bodhnawar)
- **Speaker Note:** "Good morning, respected judges. Over 1.5 million engineers graduate in India every year, but more than 80% struggle to meet industry hiring benchmarks. We built CareerPath AI to replace generic advice with transparent, math-backed guidance and actionable milestone roadmaps."

---

## Slide 2: The Core Problem
- **Key Points:**
  - 1st & 2nd-year students face career blindness beyond the top 5 default tech roles.
  - Existing career quizzes give vague personality scores without actionable steps.
  - Massive disconnect between college syllabi and real industry hiring requirements.
  - Placement officers (TPOs) lack real-time visibility into student skill readiness.

---

## Slide 3: Our Solution — CareerPath AI
- **Key Points:**
  - **3D Interactive Career Atlas:** Three.js constellation mapping 15 high-demand career pathways.
  - **Deterministic 60/25/15 Algorithm:** Explainable scoring based on 60% skill depth, 25% interest overlap, and 15% academic alignment.
  - **Adaptive Milestone Roadmaps:** 4, 8, or 12-week time-boxed learning curriculums with weekly task verification.
  - **Live Job Market Telemetry:** Real-time Indian CTC ranges and vacancies streamed via Adzuna API.

---

## Slide 4: Interactive Architecture & Tech Stack
- **Architecture Highlights:**
  - **Frontend:** Vanilla HTML5/CSS3, Bootstrap 5.3, Three.js WebGL (with instant 2D glassmorphic fallback).
  - **Backend:** Node.js, Express REST API, MongoDB Atlas cloud cluster.
  - **Dual-Engine AI Mentor:** Groq Llama 3.3 70B (<500ms) with automated Google Gemini 2.0 Flash failover.
  - **Verification:** GitHub study connector scanning public repositories for code-grounded proof of work.

---

## Slide 5: Live Demo & User Flow (The Golden Path)
- **Key Demo Moments:**
  - Instant frictionless sign-in with 1-click Google / GitHub OAuth.
  - 3-step profiler evaluating 76+ industry skills with GitHub auto-detection.
  - Transparent 60/25/15 career match breakdown with color-coded skill gap analysis.
  - Generating an 8-week roadmap with atomic progress tracking and 1-click PDF study export.

---

## Slide 6: Verification & Code-Grounded Telemetry
- **Key Points:**
  - Not just self-reported data: GitHub Study Lab connects student repos and tags skills as `Verified by GitHub Code`.
  - Atomic server-side recalculation of roadmap completion percentages.
  - Performance benchmarks: <50ms recommendation engine, 60 FPS WebGL rendering, 100% pass on 21 automated API tests.

---

## Slide 7: Competitive Matrix
- **Comparison:**
  - Traditional Quizzes: Black-box, non-actionable, personality-focused.
  - YouTube/Medium: Disconnected, overwhelming, zero roadmap tracking.
  - CareerPath AI: **Explainable mathematical scoring + Adaptive roadmaps + Code verification + Live Indian market telemetry**.

---

## Slide 8: Business Model & Financial Sustainability (How It Makes Money)
- **Core Philosophy:** **Free for students, always.**
- **B2B Revenue Streams:**
  1. **College Placement SaaS (TPO Portal):** Yearly license (₹1.5L–₹3.5L/campus) providing batch skill heatmaps, curriculum gap analytics, and NAAC/NIRF accreditation reports.
  2. **Recruiter Talent Intelligence:** Companies pay ₹24,999/month for verified candidate access, cutting technical screening costs by 60%.
  3. **Ethical Learning Partnerships:** Contextual, strictly labeled sponsored certification referrals (15–25% revenue share).
- **Financial Projections:** 96% software gross margins scaling from ₹30 Lakhs ARR (Year 1) to ₹8.1+ Crores ARR (Year 3).
- **Full Documentation:** See [`docs/BUSINESS-MODEL.md`](BUSINESS-MODEL.md).

---

## Slide 9: Future Scope & Roadmap (Phase 2 to 4)
- **Phase 2 (Q4 2026):** Resume & Portfolio Gap Analyzer (`/resume-audit`).
- **Phase 3 (Q1 2027):** AI Mock Interview Voice Coach (`/interview`) & WhatsApp streak bot.
- **Phase 4 (Q2 2027):** College Placement Mentor Portal (`/mentor-portal`) & Corporate Hiring Pipeline.

---

## Slide 10: Conclusion & Q&A
- **Summary:** CareerPath AI bridges the degree-to-industry gap through transparent, math-backed guidance.
- **Rulebook Compliance:** All AI usage disclosed; 100% original code architecture built by Team 404 Brain Not Found.
- **Call to Action:** Try the live app at [careerpath-ai-jade.vercel.app](https://careerpath-ai-jade.vercel.app).
