# UI/UX & 3D Design System
## CareerPath AI — Hack2Ignite 2026–27

---

## 1. Design Philosophy

**"Futuristic, Sci-Fi EdTech"** — vast dark cosmic backgrounds that make 3D elements glow, paired with clean glassmorphism panels for readable text and data.

### Design Principles
1. **Immersion First:** The 3D Career Universe is the first thing users see — no traditional hero banner.
2. **Clarity Over Clutter:** Data (scores, gaps, tasks) presented in clearly structured cards.
3. **Progressive Disclosure:** Show only what's needed at each step; detail on demand.
4. **Accessible Fallbacks:** Every 3D element has a graceful 2D alternative.

---

## 2. Typography

| Usage | Font | Weight | Source |
|-------|------|--------|--------|
| Headings, 3D Labels | Space Grotesk | 600, 700 | Google Fonts |
| Body Text, UI Elements | Inter | 400, 500, 600 | Google Fonts |
| Code Snippets (if any) | JetBrains Mono | 400 | Google Fonts |

### Scale
```css
--text-xs: 0.75rem;    /* 12px — captions */
--text-sm: 0.875rem;   /* 14px — labels */
--text-base: 1rem;     /* 16px — body */
--text-lg: 1.25rem;    /* 20px — subheadings */
--text-xl: 1.5rem;     /* 24px — section titles */
--text-2xl: 2rem;      /* 32px — page titles */
--text-3xl: 3rem;      /* 48px — hero title */
```

---

## 3. Color Palette

```css
:root {
  /* ── Backgrounds ── */
  --bg-space:       #0B0F19;              /* Deep galaxy - main background */
  --bg-surface:     #111827;              /* Card/panel backgrounds */
  --bg-elevated:    #1F2937;              /* Elevated elements */

  /* ── Primary & Accent ── */
  --primary-glow:   #00F0FF;              /* Cyan — interactive elements, links */
  --secondary-glow: #7000FF;              /* Purple — career accents, gradients */

  /* ── Semantic ── */
  --success:        #00FF66;              /* Green — skill met, task completed */
  --warning:        #FFB800;              /* Yellow — skill gap, needs improvement */
  --danger:         #FF0055;              /* Red — missing skill, errors */

  /* ── Glass ── */
  --glass-bg:       rgba(11, 15, 25, 0.4);
  --glass-border:   rgba(0, 240, 255, 0.2);

  /* ── Text ── */
  --text-main:      #FFFFFF;
  --text-secondary: #D1D5DB;
  --text-muted:     #8B9BB4;
}
```

### Dark Mode
The entire app operates in dark mode by default — the cosmic theme requires it.

---

## 4. Glassmorphism Component

All floating UI panels (modals, cards, dashboards) share this base:

```css
.glass-panel {
  background: var(--glass-bg);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--glass-border);
  border-radius: 16px;
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
  padding: 1.5rem;
}
```

---

## 5. Page / Screen List

| # | Page | URL | Key Components |
|---|------|-----|----------------|
| 1 | Landing | `/` or `index.html` | Three.js Career Universe, hero text, CTA buttons |
| 2 | Login / Register | `/login.html` | Glass-panel auth forms, toggle between login/register |
| 3 | Dashboard | `/dashboard.html` | Profile summary card, top-3 career results, progress overview |
| 4 | Skill-Gap | Section within dashboard | Colour-coded skill comparison |
| 5 | Roadmap | `/roadmap.html` | Week-by-week task list, 3D roadmap path, progress bar |

---

## 6. Navigation Structure

```
┌─────────────────────────────────────────┐
│  Logo   |  Home  |  Dashboard  | Login  │    ← Navbar (glassmorphism)
└─────────────────────────────────────────┘
```

- **Unauthenticated:** Home, Login/Register visible.
- **Authenticated:** Home, Dashboard, Logout visible.
- Mobile: Hamburger menu (Bootstrap collapse).

---

## 7. Component Library

### Buttons
| Variant | Usage | Style |
|---------|-------|-------|
| Primary | Main CTAs ("Get Started", "Generate Roadmap") | Gradient `--primary-glow` → `--secondary-glow`, white text |
| Secondary | Secondary actions ("View Details") | Transparent + border `--primary-glow` |
| Danger | Destructive actions | Solid `--danger` background |

### Cards
- **Career Card:** Glass panel, career icon/emoji top-left, title, match score %, sub-scores.
- **Task Card:** Glass panel with checkbox, title, description, resource link, week badge.
- **Stat Card:** Compact, shows a number + label (e.g., "78% readiness").

### Form Inputs
- Dark background (`--bg-elevated`), light border, focus state glows `--primary-glow`.
- Skill proficiency: Range slider (1–5) with labels.
- Interest tags: Pill-shaped toggles (click to select/deselect).

### Progress Bar
```css
.progress-bar {
  height: 8px;
  border-radius: 4px;
  background: var(--bg-elevated);
}
.progress-bar-fill {
  background: linear-gradient(90deg, var(--primary-glow), var(--secondary-glow));
  transition: width 0.5s ease;
}
```

---

## 8. Three.js Scene Specifications

### Career Universe (Landing Page)
- **Background:** Dark gradient + 200–500 tiny particle "stars" using `BufferGeometry`.
- **Career Nodes:** 5–10 glowing spheres (`SphereGeometry`) positioned in 3D space, each representing a career domain.
- **Hover:** Raycaster detects mouse → GSAP scales orb to 1.2 + brighten PointLight.
- **Click:** GSAP flies camera to selected orb over 1.5s with `power2.inOut` easing.

### Skill Orbit (Dashboard)
- **Concept:** User's skills orbit around a central "You" node — size represents proficiency, color indicates gap status.
- **Animation:** Continuous slow rotation via `requestAnimationFrame`.

### Roadmap Path (Roadmap Page)
- **Concept:** A 3D pathway of connected nodes — each node is a week. Completed nodes glow green, upcoming nodes pulse cyan.
- **Interaction:** Click a node to expand week details in a side panel.

---

## 9. Responsive Design

| Breakpoint | Layout Changes |
|------------|---------------|
| ≥ 1024px | Full 3D scenes, side-by-side panels |
| 768px–1023px | 3D at reduced particle count, stacked panels |
| < 768px | **3D canvas hidden**, 2D CSS grid fallback, simplified career card layout |

### Mobile Fallback Logic
```javascript
if (window.innerWidth < 768 || !isWebGLAvailable()) {
  document.getElementById('three-canvas').style.display = 'none';
  document.getElementById('fallback-grid').style.display = 'grid';
}
```

---

## 10. Loading, Error & Empty States

| State | UI Behavior |
|-------|------------|
| **Loading** | Centered pulsing cyan spinner on `--bg-space` background |
| **API Error** | Red toast notification (auto-dismiss after 5s) |
| **Empty Profile** | Friendly illustration + "Complete your profile to get started" CTA |
| **No Results** | "We couldn't find matching careers. Try adding more skills!" |
| **3D Loading** | Three.js canvas shows loading progress bar before scene renders |

---

## 11. Accessibility

| Aspect | Implementation |
|--------|---------------|
| Color Contrast | All text meets WCAG AA against `--bg-space` |
| Touch Targets | Minimum 44×44px on mobile |
| Keyboard Navigation | Tab order follows visual layout |
| Screen Reader | `aria-label` on 3D canvas, alt text on images |
| Reduced Motion | `prefers-reduced-motion` disables GSAP animations and 3D rotations |
