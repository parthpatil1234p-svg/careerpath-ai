# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary: Indian engineering & computer science students (e.g. B.Tech, BCA, MCA freshers and skill switchers) seeking clarity, honest skill-gap analysis, and actionable tech career roadmaps.
Secondary: Campus recruiters and Training & Placement Officers (TPOs) seeking verified student profiles with code-grounded proof of work and objective reality-check quiz scores.

## Product Purpose

Democratize AI-driven, evidence-based career guidance. CareerPath AI eliminates career blindness and credential inflation by transforming subjective aspirations into deterministic matching, actionable week-by-week learning milestones, and validated proof-of-work.

## Positioning

Unlike generic roadmap blogs, broad job portals, or ungrounded generative AI chatbots, CareerPath AI uses an explainable deterministic matching algorithm (60% Skill Match + 25% Interest Match + 15% Education Fit) coupled with two-factor skill verification (automated GitHub repository code audit + adaptive reality-check quizzes) and corporate recruiter domain verification.

## Operating Context

- Desktop & mobile web browser environments (wide-viewport optimized, 90% wide layout, fully mobile-responsive).
- Used during academic semester transitions, career discovery phases, placement season prep, and recruiter talent discovery.
- Integrates with live GitHub public repositories, Google Identity Services, and live tech job search aggregations.

## Capabilities and Constraints

- **Career Matching**: Deterministic 60/25/15 weighted matching engine over verified domain tracks (AI/ML, Full-Stack, Cloud/DevOps, CyberSecurity, Data Science, etc.).
- **Actionable Roadmaps**: 4, 8, and 12-week dual concurrent roadmap tracks with atomic task checkboxes, curated learning resources, and progress tracking.
- **Two-Factor Skill Verification**: GitHub code auditing (parsing languages, commits, repos) and adaptive AI reality-check quizzes.
- **Recruiter Portal**: Verified recruiter dashboard with DNS/MX domain validation, candidate talent radar, and job opening management.
- **Technical Stack**: Node.js & Express REST API backend with MongoDB persistence; responsive Vanilla JS, Tailwind CSS, and HTML5 frontend; local dev runtime with dual deployment to Vercel (client) and Render (backend).
- **Constraints**: No hardcoded production credentials; local development integrity must remain functional (`localhost:5500` client and `localhost:5000` API); sub-300ms generation response times.

## Brand Commitments

- **Name**: CareerPath AI
- **Tagline**: Discover Your Career. Bridge Your Skill Gaps. Build Your Future.
- **Team**: 404 Brain Not Found (Hack2Ignite 2026–27, Problem Statement ED-02)
- **Voice**: Authoritative, encouraging, pragmatic, objective, and transparent (no inflated hype; clear gap analysis: 🟢 Matched, 🟡 Upgrade, 🔴 Missing).
- **Design Language**: Futuristic dark/glassmorphic aesthetic with neon accents (Cyan, Emerald, Violet), clean typography (Inter / Plus Jakarta Sans), crisp cards, and responsive bento grids.

## Evidence on Hand

- Hackathon Project Documentation: `docs/PRD.md`, `docs/ARCHITECTURE.md`, `docs/UI-UX-DESIGN.md`, `docs/REQUIREMENTS-MATRIX.md`, `README.md`.
- Working local and production deployments:
  - Frontend: `https://careerpath-ai-jade.vercel.app` (and `http://localhost:5500`)
  - Backend API: `https://careerpath-ai-bdbt.onrender.com` (and `http://localhost:5000`)
- Demo Evaluator Credentials: `demouser@gmail.com` / `demo123` and recruiter demo access.
- Test suites: E2E and unit test scripts under `tests/` and root `test_*.js`.

## Product Principles

1. **Truth Over Hype**: Every career recommendation and skill assessment must be grounded in transparent formulas and objective proof-of-work, not flattering AI hallucinations.
2. **Actionable Over Theoretical**: Never present advice without a concrete next step; roadmaps must break daunting goals into atomic, weekly tasks.
3. **Frictionless Accessibility**: Evaluators, students, and recruiters must be able to experience full functionality immediately via one-click demo accounts, social auth, or guest flows.
4. **Local & Cloud Coexistence**: The platform must run reliably both in production and locally with zero manual setup hassles or hardcoded origin assumptions.

## Accessibility & Inclusion

- Responsive wide-screen bento grid design tested across 320px mobile to 1440px desktop.
- High-contrast text against dark surfaces meeting WCAG AA contrast standards.
- Keyboard-accessible forms and modal dialogs with clear focus rings.
- Graceful fallbacks for WebGL 3D visualizations for lower-powered devices.
