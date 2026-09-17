# Requirements Traceability Matrix (RTM)

> **Hack2Ignite 2026–27 | Round 1**  
> **Project:** CareerPath AI  
> **Team:** 404 Brain Not Found (Parth Patil, Aditi Vispute, Asmita Lokhande, Suyog Pawar)  

---

## 1. Source Classification Key

| Code | Category | Definition | Authority |
|---|---|---|---|
| `RULE` | Official Hackathon Rule | Compulsory organizer rulebook condition | **Mandatory** |
| `PS` | Official Problem Statement | Organizer-provided domain challenge requirement | **Mandatory** |
| `TEAM` | Internal Product Decision | Team-designed feature to solve the problem | **Planned** |
| `TECH` | Technical Decision | Architecture, framework, and database choices | **Planned** |
| `SUGGESTION` | Optional Improvement | Enhancements to add only if time permits | **Optional** |
| `ASSUMPTION` | Unconfirmed Belief | Working hypothesis requiring verification | **Verify First** |

### Rule of Governance
$$\text{RULE} + \text{PS} = \mathbf{Mandatory} \quad\vert\quad \text{TEAM} + \text{TECH} = \mathbf{Planned\ Implementation} \quad\vert\quad \text{SUGGESTION} = \mathbf{Optional} \quad\vert\quad \text{ASSUMPTION} = \mathbf{Verify\ Before\ Building}$$

---

## 2. Full Traceability Matrix

| ID | Requirement | Source | Category | Priority | Planned Implementation | Verification Method | Status |
|---|---|---|---|---|---|---|---|
| **RULE-001** | Develop within official 48-hour window (16–18 Sept 2026) | Rulebook Section 2 | `RULE` | **Critical** | Continuous commits during active window | GitHub commit timestamps | Active |
| **RULE-002** | Maintain clear GitHub commit history | Rulebook Section 3 | `RULE` | **Critical** | Feature-based atomic commits | Git log inspection | Active |
| **RULE-003** | Disclose AI tool usage in PPT and README | Rulebook Section 4 | `RULE` | **Critical** | Explicit disclosure in `README.md` & PPT slide | Submission document review | Planned |
| **RULE-004** | Deliver original implementation | Rulebook Section 5 | `RULE` | **Critical** | Custom-built algorithms, schemas, and UI | Originality audit | Active |
| **RULE-005** | No timestamp or git history manipulation | Rulebook Section 6 | `RULE` | **Critical** | Real-time pushing, no amended dates | Git reflog verification | Active |
| **RULE-006** | Zero exposed secrets or credentials | Rulebook Section 7 | `RULE` | **Critical** | `.gitignore` `.env`, only `.env.example` in repo | Repo secret scan / grep | Active |
| **RULE-007** | Use only permitted open-source libraries / tools | Rulebook Section 8 | `RULE` | **Critical** | Express, Mongoose, JWT, Three.js, Bootstrap | `package.json` license check | Active |
| **RULE-008** | Submit prototype, PPT, and accessible links | Rulebook Section 9 | `RULE` | **Critical** | Vercel (FE), Render (BE), PPT deck | Incognito live link test | Planned |
| **PS-001** | EduTech Track: Build solution for student learning & career progression | Official Track Announcement | `PS` | **Critical** | CareerPath AI guidance & roadmap platform | EduTech problem domain compliance | Active |
| **TEAM-001** | Student profile (Education, skills 1–5, interests) | PRD Section 5.2 | `TEAM` | **Critical** | `User.js` model, profile API, onboarding form | Form submission & DB check | Planned |
| **TEAM-002** | Career matching engine with score breakdown | PRD Section 5.3 | `TEAM` | **Critical** | 60/25/15 weighted algorithm in `/api/match/recommend` | Persona unit testing | Planned |
| **TEAM-003** | Skill-gap analysis (Have, Weak, Missing status) | PRD Section 5.4 | `TEAM` | **Critical** | Gap calculation logic + color-coded dashboard | Skill comparison test | Planned |
| **TEAM-004** | Dynamic roadmap generation (4/8/12 weeks) | PRD Section 5.5 | `TEAM` | **Critical** | Topological task sequencer in `/api/roadmap/generate` | Non-empty weeks validation | Planned |
| **TEAM-005** | Task progress checklist & persistence | PRD Section 5.6 | `TEAM` | **High** | `PUT /api/roadmap/:id/task/:taskId` + reactive bar | Task toggle & progress math | Planned |
| **TEAM-006** | Seed database with 5 complete industry careers | Implementation Plan | `TEAM` | **Critical** | `data/seed.js` script with complete benchmark skills | MongoDB query verification | **Verified** |
| **TECH-001** | Express.js REST API with security middleware | TRD Section 3 | `TECH` | **Critical** | Helmet, CORS, rate-limiter, error middleware | `GET /api/health` test | **Verified** |
| **TECH-002** | MongoDB Atlas with Mongoose ODM | TRD Section 4 | `TECH` | **Critical** | `config/db.js` + `User.js`, `Career.js`, `Roadmap.js` | Schema compile & connect | **Verified** |
| **TECH-003** | Stateless JWT + bcrypt authentication | BACKEND-SCHEMA | `TECH` | **Critical** | `/api/auth/register`, `/login`, auth middleware | Auth token & protected routes | **Verified** |
| **TECH-004** | Glassmorphism responsive UI with Bootstrap 5 | UI-UX-DESIGN | `TECH` | **High** | CSS variables, glass panels, Bootstrap grid | Cross-browser visual check | Planned |
| **TECH-005** | Three.js 3D Career Universe & Starfield | UI-UX-DESIGN | `TECH` | **Medium** | `three-scene.js` WebGL canvas on landing page | FPS & performance audit | Planned |
| **TECH-006** | Mobile & non-WebGL 2D grid fallback | TRD Section 7 | `TECH` | **High** | Screen width `< 768px` / WebGL test fallback | Mobile viewport testing | Planned |
| **SUGG-001** | Gemini AI conversational career advisor | PRD Section 10 | `SUGGESTION` | **Low** | Post-MVP conversational assistant endpoint | API response evaluation | Postponed |
| **SUGG-002** | Resume PDF parsing & skill extraction | PRD Section 10 | `SUGGESTION` | **Low** | PDF OCR extraction service | Parsing accuracy test | Postponed |
| **SUGG-003** | GitHub profile analysis for coding skills | PRD Section 10 | `SUGGESTION` | **Low** | GitHub REST API integration | Public repo skill mapper | Postponed |
| **ASSUMP-001** | 60/25/15 weighting formula reflects student fit | TRD Section 5 | `ASSUMPTION` | **Medium** | Modular scoring functions in matching controller | Persona test verification | Planned |
| **ASSUMP-002** | 3D visual theme delivers higher judge engagement | UI-UX-DESIGN | `ASSUMPTION` | **Medium** | Three.js visualizer with robust 2D fallback | Hardware compatibility test | Planned |

---

## 3. Maintenance Policy

1. Every newly planned feature must be assigned an ID (`TEAM-xxx`, `TECH-xxx`, `SUGG-xxx`).
2. When the official problem statement is provided, extract mandatory requirements as `PS-001`, `PS-002`, etc., and map them directly to implementation tasks.
3. Status transitions: `Planned` $\to$ `Active` $\to$ `Verified` (or `Postponed`).
