# CareerPath AI — Career Atlas Frontend Documentation

> **Hack2Ignite 2026–27 · Team 404 Brain Not Found**  
> *Theme: Career Atlas (Cartographic Precision, Human-Crafted Editorial Polish)*

The `client/` directory contains the complete redesigned presentation and interaction tier of CareerPath AI. It is architected as an intentional, high-performance static web application built without bulky frontend frameworks—delivering instant page loads, zero build overhead, and universal browser compatibility while replacing generic AI landing page clichés with a warm, cartographic Career Atlas aesthetic.

---

## 🧭 Design System: "Career Atlas"

- **Visual Concept:** Warm, archival paper tones combined with deep nautical navy, precise editorial typography, and cartographic charting accents.
- **Palette:**
  - Ink (Primary Text): `#162033`
  - Paper (Page Canvas): `#F7F4EE`
  - Surface (Card Canvas): `#FFFFFF`
  - Navy (Structure & Headings): `#1C355E`
  - Teal (Exploration & Routes): `#167D8D`
  - Coral (Skill Gaps & Deadlines): `#E76F51`
  - Gold (Assessments & In-Progress): `#D99A2B`
  - Leaf Green (Acquired Skills & Done): `#4F8A5B`
  - Line (Cartographic Borders): `#D9D5CC`
  - Muted Text: `#667085`
- **Typography:**
  - Headings: `DM Serif Display` (editorial warmth and human craft)
  - Body & UI: `Manrope` (crisp, readable geometric sans)
  - Coordinates & Meta: `IBM Plex Mono` (cartographic precision)

---

## 🛠️ Technologies Used

- **HTML5:** Semantic document structuring, form accessibility, and responsive viewports.
- **Modular CSS3:** Layered design system (`tokens.css`, `base.css`, `layout.css`, `components.css`, `pages.css`, `three.css`, `roadmap.css`, `dashboard.css`, aggregated by `style.css`).
- **Bootstrap 5.3:** Grid scaffolding, responsive breakpoints, and modal dialogs.
- **JavaScript (ES6+):** Vanilla DOM controllers, `fetch` API abstraction, route guards, and JWT persistence.
- **Three.js (r128):** Hardware-accelerated 3D WebGL visualizations designed as functional map artifacts (compass waypoints, skill orbits, route maps, journey markers).
- **GSAP (GreenSock):** Subtle micro-interactions and smooth camera lerps.

---

## 📄 Application Pages & Preserved Element IDs

| File | Route | Redesign Details | Key Preserved IDs / Hooks |
| :--- | :--- | :--- | :--- |
| `index.html` | `/` | Asymmetric split hero, 3 numbered workflow steps, 5 accredited careers, 4 platform deliverables, team attribution colophon. | `#canvas-container`, `#webgl-fallback`, `#mobileNavToggle` |
| `login.html` | `/login.html` | Quiet 2-column desktop split (orientation panel + clean form), mobile form first, focus outlines. | `#loginForm`, `#email`, `#password`, `#submitBtn`, `#alertContainer` |
| `register.html` | `/register.html` | Quiet 2-column split with onboarding summary and clean registration inputs. | `#registerForm`, `#name`, `#email`, `#password`, `#confirmPassword`, `#submitBtn`, `#alertContainer` |
| `assessment.html` | `/assessment.html` | 4-step progressive wizard (Academics, Interests, Skills, Goals), desktop left stepper, category filter tabs, proficiency selects. | `#assessmentForm`, `#interestChipsWrapper`, `#skillsGrid`, `#skillSearchInput`, `#skillCategoryFilter`, `#submitAssessmentBtn` |
| `recommendations.html` | `/recommendations.html` | Results-first layout, "Best route for now" hero panel, 3-color gap analysis, duration selection modal (4/8/12 weeks). | `#recommendationsContainer`, `#skillOrbitTitle`, `#roadmapDurationModal`, `#btnConfirmGenerate` |
| `roadmap.html` | `/roadmap.html` | Route-map timeline, active route summary header, 3D milestone stepping stones, live task checkboxes with immediate API sync. | `#roadmapContent`, `#weeksContainer`, `#roadmapPercentage`, `#roadmapProgressBar`, `#careerIcon` |
| `dashboard.html` | `/dashboard.html` | Student command center, active goal telemetry, calibrated 3D Journey Marker, live priority task queue. | `#dashboardContent`, `#userAvatar`, `#userName`, `#statPercentage`, `#progress-orb`, `#upcomingTasksList` |
| `404.html` | `/404.html` | Cartographic "Waypoint Uncharted" error page with warm paper card and coordinate badge. | Clean navigation links |

---

## 🧭 3D Visualizations & Fallback System

CareerPath AI features four purposeful 3D visual experiences:
1. **Career Atlas Compass** (`js/three-career-universe.js`): Central octahedron compass waypoint connected to 5 career nodes (Front-End, Full-Stack, Data Analyst, UI/UX, Cybersecurity) with clickable interactive tooltips.
2. **Skill Map** (`js/three-skill-orbit.js`): Target career core surrounded by up to 12 skill nodes color-coded Leaf Green (Matched), Gold (Weak), and Coral (Missing).
3. **Route Map** (`js/three-roadmap-path.js`): Stepping-stone milestone platforms with numbered weeks; clicking a platform smoothly scrolls directly to that week's card.
4. **Journey Marker** (`js/three-progress.js`): Calibrated compass ring with completion fill arc and progress needle reflecting completed task telemetry.

### Graceful Fallback Guarantee
If WebGL is disabled or unsupported, every visualizer detects the condition and renders crisp, accessible **2D HTML/CSS cards**. Core user workflows are never blocked.

---

## ⚙️ Local Development Instructions

Because this is a static frontend, no build step or `npm install` is required in `client/`.

### Option 1: Python HTTP Server (Recommended)
```bash
cd client
python -m http.server 5500
```
Open **[http://localhost:5500](http://localhost:5500)** in your browser.

### Option 2: Node `serve`
```bash
npm run client:serve
# or: npx --yes serve client -p 5500
```

---

## 🔌 API Configuration (`js/config.js`)

Frontend API calls automatically resolve backend routes:
```javascript
const isLocal =
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1';

const LOCAL_API_URL = 'http://localhost:5000/api';
const PRODUCTION_API_URL = 'https://YOUR-RENDER-SERVICE.onrender.com/api';

const CONFIG = {
  API_BASE_URL: isLocal ? LOCAL_API_URL : PRODUCTION_API_URL,
  TOKEN_KEY: 'careerpath_token',
  USER_KEY: 'careerpath_user'
};
```

---

## ☁️ Vercel Deployment

1. Set **Root Directory** to `client`.
2. Set **Framework Preset** to `Other`.
3. Leave Build Command and Output Directory empty.
4. Update `client/js/config.js` with your deployed Render backend URL.
