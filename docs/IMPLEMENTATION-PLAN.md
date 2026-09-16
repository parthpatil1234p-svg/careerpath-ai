# 48-Hour Implementation Plan
## CareerPath AI — Hack2Ignite 2026–27

---

## Team Roster

| Member | Primary Role | Secondary |
|--------|-------------|-----------|
| **Parth** | Backend Architecture, Matching Engine, API Routing | Deployment |
| **Asmita** | Three.js 3D Environments, GSAP Animations | Canvas optimization |
| **Aditi** | Frontend UI/UX, Glassmorphism, API Integration | Forms & Validation |
| **Suyog** | Database Models, Seed Data, Roadmap Logic | QA Testing |

---

## Pre-Hackathon Checklist ☑️

Complete **before** the 48-hour clock starts:

- [ ] MongoDB Atlas cluster created (M0 free tier), connection string ready
- [ ] GitHub repository initialized with `main` + `dev` branches
- [ ] Node.js, npm, VS Code installed on all team members' machines
- [ ] Google Fonts imported: Space Grotesk + Inter
- [ ] `.env.example` file committed with placeholder values
- [ ] Postman workspace shared with team
- [ ] Design reference images saved locally
- [ ] All docs (this repo's `docs/` folder) read by every team member

---

## Phase 1: Foundation (Hours 0 – 8)

### 🎯 Goal: Server running, DB connected, auth working, basic UI shell

| Task | Owner | Duration | Status |
|------|-------|----------|--------|
| Init Express server + middleware (cors, helmet, rate-limit) | Parth | 1h | ⬜ |
| Configure MongoDB connection (`config/db.js`) | Parth | 0.5h | ⬜ |
| Create Mongoose schemas (User, Career, Roadmap) | Aditi | 2h | ⬜ |
| Implement Auth routes (register + login) with JWT | Parth | 2h | ⬜ |
| Create auth middleware for protected routes | Parth | 1h | ⬜ |
| Test auth endpoints in Postman | Aditi | 0.5h | ⬜ |
| Setup HTML/CSS boilerplate (`index.html`, `login.html`) | Asmita | 2h | ⬜ |
| Create CSS variables file + glassmorphism base class | Asmita | 1h | ⬜ |
| Build Login/Register UI (glass panel forms) | Asmita | 2h | ⬜ |
| Initialize Three.js boilerplate (renderer, camera, scene) | Suyog | 2h | ⬜ |
| Create basic starfield particle system (background) | Suyog | 2h | ⬜ |

### ✅ Phase 1 Milestone
- `npm run dev` starts the server
- `POST /api/auth/register` and `/login` return JWTs
- `login.html` renders with glassmorphism styles
- Three.js canvas shows animated starfield

---

## Phase 2: Core Logic (Hours 8 – 20)

### 🎯 Goal: Matching engine works, seed data loaded, profile form done, 3D career nodes

| Task | Owner | Duration | Status |
|------|-------|----------|--------|
| Build career matching algorithm (60/25/15 formula) | Parth | 3h | ⬜ |
| Create `POST /api/match/recommend` endpoint | Parth | 1h | ⬜ |
| Create `GET /api/users/profile` + `PUT` endpoints | Parth | 1.5h | ⬜ |
| Generate seed data: 5 careers with full skill requirements | Aditi | 3h | ⬜ |
| Create seed script (`data/seed.js`) + run it | Aditi | 1h | ⬜ |
| Build student onboarding forms (education, skills slider, interest tags) | Asmita | 3h | ⬜ |
| Connect Login/Register UI to auth APIs | Asmita | 1.5h | ⬜ |
| Create Career Universe 3D scene (glowing orbs for each career) | Suyog | 4h | ⬜ |
| Implement Raycaster hover effect on orbs | Suyog | 2h | ⬜ |

### ✅ Phase 2 Milestone
- Matching engine returns correct top-3 careers for test data
- Database has 5 careers with 6–10 skills each
- Profile form submits and saves to DB
- Landing page shows interactive 3D career orbs

---

## Phase 3: Integration & Roadmaps (Hours 20 – 32)

### 🎯 Goal: Frontend ↔ Backend connected, roadmap generation working, 3D roadmap view

| Task | Owner | Duration | Status |
|------|-------|----------|--------|
| Build dashboard page: profile summary + career result cards | Asmita | 3h | ⬜ |
| Connect profile form → `PUT /api/users/profile` → `POST /api/match/recommend` | Asmita | 2h | ⬜ |
| Display career recommendations with scores on dashboard | Asmita | 2h | ⬜ |
| Build skill-gap analysis logic (compare user vs career skills) | Aditi | 2h | ⬜ |
| Build roadmap generation algorithm | Aditi | 3h | ⬜ |
| Create `POST /api/roadmap/generate` endpoint | Parth | 1.5h | ⬜ |
| Create `PUT /api/roadmap/:id/task/:taskId` endpoint | Parth | 1h | ⬜ |
| Create `GET /api/careers` endpoint | Parth | 0.5h | ⬜ |
| Build GSAP camera fly-to animation on career click | Suyog | 3h | ⬜ |
| Build 3D Roadmap Path scene (connected nodes per week) | Suyog | 3h | ⬜ |

### ✅ Phase 3 Milestone
- Full flow works: Register → Profile → Get Recommendations → Select Career → See Skill Gap → Generate Roadmap
- 3D camera animation on career selection
- Roadmap page shows week-by-week tasks

---

## Phase 4: Polishing & Edge Cases (Hours 32 – 42)

### 🎯 Goal: Progress tracking works, mobile fallback, deployment

| Task | Owner | Duration | Status |
|------|-------|----------|--------|
| Build roadmap task completion UI (checkboxes + progress bar) | Asmita | 2h | ⬜ |
| Connect task completion to `PUT /api/roadmap/:id/task/:taskId` | Asmita | 1h | ⬜ |
| Add progress percentage animation (3D + 2D) | Suyog | 2h | ⬜ |
| Implement mobile fallback (hide canvas, show CSS grid) | Suyog | 2h | ⬜ |
| Add form validation (frontend) + error toasts | Asmita | 1.5h | ⬜ |
| Add edge case handling: empty skills, no results, expired JWT | Parth | 2h | ⬜ |
| Add loading states + empty states | Asmita | 1h | ⬜ |
| Deploy backend to Render | Parth | 1h | ⬜ |
| Deploy frontend to Vercel | Parth | 1h | ⬜ |
| Verify CORS between Vercel ↔ Render | Parth + Aditi | 0.5h | ⬜ |
| Full end-to-end testing on deployed URLs | Aditi | 2h | ⬜ |

### ✅ Phase 4 Milestone
- Task checkboxes update progress in DB and UI
- Mobile viewport shows 2D fallback correctly
- Both apps deployed and communicating

---

## Phase 5: Presentation Prep & QA (Hours 42 – 48)

### 🎯 Goal: Demo-ready, bug-free, presentation polished

### ⛔ CODE FREEZE at Hour 44

| Task | Owner | Duration | Status |
|------|-------|----------|--------|
| Final CSS polish (spacing, alignment, responsive tweaks) | Asmita | 2h | ⬜ |
| Final 3D performance optimization (reduce particles on low-end) | Suyog | 1h | ⬜ |
| Fix any remaining bugs from QA | All | 2h | ⬜ |
| Record demo video (screen recording with voiceover) | Parth | 1h | ⬜ |
| Prepare pitch deck (5–7 slides: Problem, Solution, Tech, Demo, Future) | Aditi + Asmita | 2h | ⬜ |
| Practice demo presentation (3-minute walkthrough) | All | 1h | ⬜ |
| Create 3 test user personas and rehearse live demo | All | 1h | ⬜ |

### ✅ Phase 5 Milestone
- 3-minute live demo runs without errors
- Demo video uploaded
- All team members can explain any part of the system

---

## Critical Path ⚠️

The following tasks are on the critical path — a delay here delays the entire project:

```
Auth APIs (Phase 1) → Profile Form (Phase 2) → Matching Engine (Phase 2)
    → Dashboard Integration (Phase 3) → Roadmap Generation (Phase 3)
        → Progress Tracking (Phase 4) → Deployment (Phase 4)
```

If the **matching engine** is delayed, nothing downstream works. Prioritize it above all else.

---

## Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Matching algorithm has bugs | High | Parth writes unit-test-grade Postman checks by Hour 12 |
| Three.js scene crashes on mobile | Medium | Suyog builds 2D fallback early (Phase 2, not Phase 4) |
| MongoDB Atlas cold start is slow | Low | Use `serverSelectionTimeoutMS: 5000` in connection options |
| Render free tier spins down | Medium | Build "wake up" ping into frontend on page load |
| Merge conflicts on `main` | Medium | All work on feature branches; Parth reviews & merges |
