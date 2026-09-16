# Product Requirements Document (PRD)
## CareerPath AI — Hack2Ignite 2026–27

---

## 1. Product Overview

**CareerPath AI** is an intelligent, 3D-driven web application designed to guide students toward their ideal career paths based on a multidimensional analysis of their skills, interests, and educational background.

**One-liner:** AI-powered career recommendations + personalized learning roadmaps, presented inside an immersive 3D web experience.

**Domain:** EduTech / AI for Good

---

## 2. Problem Statement

Indian students, especially in their first two years of college, often face:
- Lack of awareness about which careers exist beyond the top 5 "safe" options.
- No clear understanding of which skills they already have vs. which they still need.
- Generic advice (from relatives, teachers, YouTube) that doesn't account for their individual strengths.
- No concrete, week-by-week action plan to get from "interested" to "job-ready."

This leads to wrong specialization choices, wasted semesters, and growing anxiety.

---

## 3. Goals & Objectives

| Goal | Measurable Objective |
|------|---------------------|
| Personalized matching | Achieve >80% relevance in top-3 career suggestions for test personas |
| Actionable roadmaps | Generate valid 4/8/12-week plans with no empty weeks |
| Engaging experience | 3D scene runs at 60 FPS on mid-range laptops |
| Hackathon demo | Full end-to-end flow functional within 48 hours |

---

## 4. Target Users

### Persona 1 — Rohan (The Confused Fresher)
- **Age:** 18, 1st-year B.Tech CSE student
- **Problem:** Knows basic Python and HTML, but doesn't know whether to pursue web dev, data science, or something entirely different.
- **Needs:** Clear career options mapped to his current skills, with a step-by-step learning plan.

### Persona 2 — Priya (The Skill Switcher)
- **Age:** 21, 3rd-year Mechanical Engineering student
- **Problem:** Realized she enjoys design more than thermodynamics; wants to pivot to UI/UX design but doesn't know where to start.
- **Needs:** An honest skill-gap analysis showing exactly what she needs to learn, and a 12-week roadmap to get there.

---

## 5. Functional Requirements

### FR-1: Authentication
| ID | Requirement |
|----|------------|
| FR-1.1 | Email/password registration with bcrypt hashing |
| FR-1.2 | Login returns a JWT valid for 24 hours |
| FR-1.3 | Protected routes require a valid JWT in Authorization header |

### FR-2: Student Profile
| ID | Requirement |
|----|------------|
| FR-2.1 | User inputs current education level (e.g., "B.Tech 2nd Year") |
| FR-2.2 | User selects existing skills and rates proficiency on a 1–5 scale |
| FR-2.3 | User selects areas of interest from predefined tags |
| FR-2.4 | Profile can be updated at any time |

### FR-3: Career Recommendation Engine
| ID | Requirement |
|----|------------|
| FR-3.1 | Calculates match scores using: Skill Match (60%) + Interest Match (25%) + Education Match (15%) |
| FR-3.2 | Returns top 3 career recommendations sorted by score |
| FR-3.3 | Includes individual sub-scores (skill, interest, education) in the response |

### FR-4: Skill-Gap Analysis
| ID | Requirement |
|----|------------|
| FR-4.1 | Compares user's current skills vs. required skills for a selected career |
| FR-4.2 | Highlights missing skills and under-leveled skills (proficiency gap) |
| FR-4.3 | Calculates an overall "readiness percentage" |

### FR-5: Roadmap Generation
| ID | Requirement |
|----|------------|
| FR-5.1 | Generates 4, 8, or 12-week roadmaps based on the skill gap |
| FR-5.2 | Each week contains actionable tasks with descriptions and resource links |
| FR-5.3 | Tasks are ordered by difficulty (foundational → advanced) |

### FR-6: Progress Tracking
| ID | Requirement |
|----|------------|
| FR-6.1 | Users can mark individual tasks as completed |
| FR-6.2 | Dashboard shows overall progress percentage |
| FR-6.3 | Visual progress animation in the 3D roadmap view |

---

## 6. User Stories

| Story | Acceptance Criteria |
|-------|-------------------|
| As a student, I can register and create my profile so that the system knows my background. | Registration succeeds; profile page shows education, skills, and interests. |
| As a student, I can get career recommendations so I know which paths fit me best. | After submitting profile, top 3 careers appear with match percentages. |
| As a student, I can see a skill-gap analysis for a career so I understand what I'm missing. | Selecting a career shows green (have), yellow (weak), and red (missing) skills. |
| As a student, I can generate a roadmap so I have a clear study plan. | Selecting a timeline (4/8/12 weeks) generates a week-by-week task list. |
| As a student, I can track my progress so I stay motivated. | Checking off tasks updates the progress bar and 3D visual. |

---

## 7. Non-Functional Requirements

| Category | Requirement |
|----------|------------|
| Performance | Career matching API responds in < 800ms |
| Graphics | 3D scenes run at ≥ 60 FPS on mid-range hardware |
| Mobile | Graceful fallback to 2D views on screens < 768px wide |
| Security | NoSQL injection prevention via Mongoose schemas; CORS restricted; rate limiting |
| Availability | Deployed backend handles at least 50 concurrent users on Render free tier |

---

## 8. Constraints

- **Budget:** $0 — all services must be free tier.
- **Timeframe:** 48-hour hackathon qualifier round.
- **Team Size:** 4 members.
- **No external ML models for MVP** — algorithm is rule-based (weighted scoring).

---

## 9. Success Criteria (Hackathon)

1. ✅ Full user journey works end-to-end during the live demo.
2. ✅ 3D landing page renders without frame drops.
3. ✅ Career recommendations are accurate for at least 3 distinct test personas.
4. ✅ Generated roadmaps contain no empty weeks and at least 3 tasks per week.
5. ✅ Judges can interact with the platform live and get meaningful results.

---

## 10. Future Scope (Post-Hackathon)

- Gemini AI chatbot for conversational career advice
- Resume upload → AI skill extraction
- GitHub profile analysis → auto-populate coding skills
- Admin panel for CRUD operations on the career/skill database
- Multi-language support
- Peer comparison and community features
