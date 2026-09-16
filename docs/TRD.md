# Technical Requirements Document (TRD)
## CareerPath AI — Hack2Ignite 2026–27

---

## 1. Technical Overview

CareerPath AI uses a **decoupled client-server architecture** with a static HTML/JS frontend communicating with a Node.js/Express REST API backed by MongoDB Atlas.

```
┌──────────────────────────┐     HTTPS/REST     ┌──────────────────────┐
│     CLIENT (Vercel)      │ ◄────────────────► │   SERVER (Render)    │
│  HTML · CSS · JS         │                    │   Express.js         │
│  Three.js · GSAP         │                    │   Mongoose · JWT     │
│  Bootstrap               │                    │   bcrypt             │
└──────────────────────────┘                    └──────────┬───────────┘
                                                           │
                                                           ▼
                                                ┌──────────────────────┐
                                                │  MongoDB Atlas       │
                                                │  (Free M0 Cluster)  │
                                                └──────────────────────┘
```

---

## 2. Frontend Architecture

| Aspect | Choice | Rationale |
|--------|--------|-----------|
| Language | Vanilla JS (ES6+) | Simple, no build step required |
| UI Framework | Bootstrap 5 | Fast responsive layouts |
| 3D Engine | Three.js | WebGL 3D rendering |
| Animation | GSAP | GPU-accelerated camera transitions |
| HTTP Client | Fetch API | Native, no extra dependency |

### Page Structure
| Page | File | Purpose |
|------|------|---------|
| Landing | `index.html` | 3D Career Universe, hero section |
| Auth | `login.html` | Login + Register forms |
| Dashboard | `dashboard.html` | Profile summary, top-3 careers, progress |
| Roadmap | `roadmap.html` | Week-by-week task viewer + 3D roadmap path |

---

## 3. Backend Architecture

| Aspect | Choice |
|--------|--------|
| Runtime | Node.js v18+ |
| Framework | Express.js |
| ODM | Mongoose 7+ |
| Auth | jsonwebtoken + bcryptjs |
| Security | cors, express-rate-limit, helmet |
| Dev Server | nodemon |

### Server Layers
```
Routes → Controllers → Services/Logic → Models → MongoDB
```

- **Routes** define endpoint paths and HTTP methods.
- **Controllers** handle request/response and input validation.
- **Business logic** (matching engine, roadmap generation) lives in controllers or dedicated utility files.
- **Models** define Mongoose schemas and indexes.

---

## 4. Database Architecture

**Engine:** MongoDB Atlas M0 (Free Tier), single replica set.

### Collections

| Collection | Purpose | Key Fields |
|------------|---------|------------|
| `users` | Student accounts | email (unique), password (hashed), education, skills[], interests[] |
| `careers` | Career entries | title, requiredSkills[], tags[], baseEducationScore |
| `roadmaps` | Learning plans | userId (ref), targetCareerId (ref), durationWeeks, tasks[] |

### Indexes
| Collection | Index | Type |
|------------|-------|------|
| users | `{ email: 1 }` | Unique |
| careers | `{ title: "text", tags: "text" }` | Text |
| roadmaps | `{ userId: 1 }` | Standard |

---

## 5. Career Matching Algorithm — Full Breakdown

### 5.1 Master Formula

```
Total Score = (SkillScore × 0.60) + (InterestScore × 0.25) + (EducationScore × 0.15)
```

### 5.2 Skill Score (0–100)

For each career's `requiredSkills` array:

```
SkillScore = (Σ min(userProficiency / requiredProficiency, 1.0)) / totalRequiredSkills × 100
```

- If a skill is missing entirely → contributes 0.
- If `isCritical: true` skill is missing → apply a 20-point penalty.
- Proficiency is clamped at 1.0 (over-qualification doesn't boost score).

### 5.3 Interest Score (0–100)

```
InterestScore = (|userInterests ∩ careerTags| / |careerTags|) × 100
```

### 5.4 Education Score (0–100)

- Compares user's stated education level against the career's `baseEducationScore`.
- Direct mapping: if user meets or exceeds the minimum, score = 100; otherwise, proportional.

---

## 6. Roadmap Generation Algorithm

1. **Input:** Selected career + user's current skills + chosen duration (4/8/12 weeks).
2. **Compute Skill Gaps:** For each required skill where `userProficiency < requiredProficiency`, calculate `gap = required - current`.
3. **Sort Gaps:** Foundational skills first, advanced skills later.
4. **Distribute Across Weeks:** Evenly distribute learning tasks across the chosen number of weeks, ensuring no week is empty and no single week is overloaded (max 5 tasks per week).
5. **Attach Resources:** Each task gets a `title`, `description`, and `resourceLink` (from the career's skill metadata).

---

## 7. Three.js & Graphics Specifications

| Parameter | Value |
|-----------|-------|
| Renderer | `WebGLRenderer({ antialias: true, alpha: true })` |
| Camera | `PerspectiveCamera(75, aspect, 0.1, 1000)` |
| Ambient Light | `AmbientLight(0xffffff, 0.4)` |
| Point Lights | Attached to career nodes, color matches career domain |
| Particle Count | 200–500 particles for background stars |

### Interactions
- **Raycaster:** Mouse hover on career orb → GSAP scale to 1.2 + brighten attached PointLight.
- **Click:** Camera flies to selected orb via `gsap.to(camera.position, { duration: 1.5, ease: "power2.inOut" })`.
- **Mobile Fallback:** If `window.innerWidth < 768` or WebGL unsupported → hide `<canvas>`, show a CSS grid of career cards instead.

---

## 8. Security Protocols

| Threat | Mitigation |
|--------|-----------|
| NoSQL Injection | Mongoose schemas enforce strict types; no raw query construction |
| Brute Force | `express-rate-limit`: max 100 requests per 15 minutes per IP |
| XSS | No `innerHTML` with user data; CSP headers via `helmet` |
| CORS Abuse | `cors({ origin: 'https://your-vercel-domain.vercel.app' })` |
| Token Theft | JWT expires in 24h; stored in `localStorage` (acceptable for hackathon scope) |

---

## 9. Deployment Architecture

| Component | Platform | Free Tier Limits |
|-----------|----------|-----------------|
| Frontend | Vercel | Unlimited static hosting |
| Backend | Render | 750 hours/month (spins down after inactivity) |
| Database | MongoDB Atlas M0 | 512 MB storage, shared cluster |

### CI/CD
- Push to `main` → Vercel auto-deploys frontend.
- Push to `main` → Render auto-deploys backend service.

---

## 10. Testing Strategy (Hackathon Scope)

| Type | Tool | Scope |
|------|------|-------|
| API Testing | Postman | All endpoints with valid/invalid payloads |
| Manual UI | Browser | Chrome, Edge, 1 mobile viewport |
| 3D Performance | Chrome DevTools (Performance tab) | Verify 60 FPS target |
| Edge Cases | Manual | Empty skills, no interests, invalid JWT |
