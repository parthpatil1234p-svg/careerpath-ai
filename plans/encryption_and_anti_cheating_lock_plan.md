# Implementation Plan: Client-Side Encrypted Storage & Proctoring Anti-Cheating Lock

> **Context & Requirement**:
> Implementation of the two core security architectures:
> 1. **Client-Side Encrypted Storage with Minimal-Exposure LLM Calls**: Defensible 3-layer security (HSTS/CSP in transit, Web Crypto AES-GCM 256-bit client-side encryption for saved assessments/roadmaps, and zero-PII transient LLM forwarding).
> 2. **Website Anti-Cheating Lock**: Fullscreen enforcement, tab-switch/blur listeners, copy/paste/right-click/devtools blocks, server-enforced question timers, server-side randomization, 3-strike violation logging, and refresh-safe session persistence.

---

## 1. Goal Description

### Part 1: Encryption — "Client-Side Encrypted Storage with Minimal-Exposure LLM Calls"
- **The Reality**: True End-to-End Encryption (E2EE) cannot extend across an LLM inference step because LLMs must read plaintext tokens to reason and generate responses. 
- **The Honest, Defensible Architecture**:
  1. **Layer 1 (In Transit)**: HTTPS/TLS enforced in production (Vercel/Render). Hardened with strict security headers (HSTS, Content-Security-Policy, X-Frame-Options, X-Content-Type-Options).
  2. **Layer 2 (Client-Side Encrypted Storage)**: When a student saves sensitive assessment results, career reflections, or private roadmap data, the browser encrypts the payload using the **Web Crypto API (AES-GCM 256-bit)**. The encryption key is derived client-side from the user's password/passphrase via **PBKDF2 (SHA-256, 100,000 iterations)** with a random 16-byte salt. The server stores only `{ ciphertext, iv, salt }` and **never sees the raw key**. Decryption occurs purely in the student's browser on login.
  3. **Layer 3 (Minimal-Exposure LLM Hop)**: The browser sends only stripped technical attributes (e.g. `skills`, `interests`, `targetRole`) to the backend. Student PII (name, email, phone, college) is sanitized before contacting Groq/Gemini. The LLM response is returned transiently without database logging, and is immediately encrypted client-side before permanent storage.

### Part 2: Website Anti-Cheating Lock
- **The Reality**: Client browsers alone cannot guarantee 100% anti-tamper. Therefore, browser events act as deterrent sensors while the **server remains the authoritative arbiter**:
  1. **Fullscreen Lock**: Enforces `requestFullscreen()` on quiz start; monitors `fullscreenchange` and issues strikes on exit.
  2. **Tab Switch & Focus Detection**: Tracks `visibilitychange` (tab switching) and `window.blur` (alt-tabbing / multi-window).
  3. **Clipboard & DevTools Blocking**: Intercepts `copy`, `paste`, `cut`, `contextmenu`, and shortcut keys (`Ctrl+C`, `Ctrl+V`, `Ctrl+U`, `F12`, `Ctrl+Shift+I`).
  4. **Server-Enforced Timer**: The server records `currentQuestionServedAt` timestamp and rejects submissions that arrive beyond the 45-second limit + 5-second network grace period.
  5. **Server-Side Fisher-Yates Scrambling**: Question sequence and option index (0–3) are shuffled on the server; clients never receive the answer key or predictable option slots.
  6. **3-Strike System with Server Violation Logging**:
     - *Strike 1*: Amber HUD Warning Modal (*"Strike 1/3: Focus violation detected"*).
     - *Strike 2*: Red Warning Modal (*"Strike 2/3: FINAL WARNING. One more violation terminates session!"*).
     - *Strike 3*: Auto-terminates the quiz, locks the session server-side, logs violation history, and sets `integrityScore = 0`.
  7. **One Attempt & Refresh Protection**: Session state is persisted server-side so pressing F5 (refresh) cannot reset questions, bypass strikes, or grant extra time.

---

## 2. User Review Required

> [!IMPORTANT]
> **Pitching & Presentation Wording (Judges/Demo)**:
> In the demo and pitch, **do NOT call it "E2E Encryption"**. 
> Call it: **"Client-Side Encrypted Storage with Minimal-Exposure LLM Calls"**.
> Explain the flow: *User types → TLS in transit → Server calls LLM (transient plaintext, no logging) → Response returns → Browser encrypts with AES-GCM using password-derived PBKDF2 key → Server stores ciphertext.*

> [!NOTE]
> **Anti-Cheat Lock Target Area**:
> The anti-cheat lock is specifically applied to the **Adaptive Skill Reality-Check Quiz** (`quiz.html` & `assessment.html` verification modal) which unlocks the official **"Verified Skill Badges"** in the resume builder and recruiter portal.

---

## 3. Architecture & Data Flow

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│             LAYERED ENCRYPTION & ANTI-CHEATING LOCK ARCHITECTURE                                 │
├──────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                  │
│   [CLIENT BROWSER]                                              [CAREERPATH AI BACKEND]          │
│                                                                                                  │
│   A. CLIENT-SIDE ENCRYPTION (AES-GCM-256 + PBKDF2)                                               │
│   ├── User logs in / enters password                                                             │
│   ├── Web Crypto API derives 256-bit Key via PBKDF2 (SHA-256, 100k rounds, salt)                │
│   ├── Student Assessment / Reflection / Notes                                                    │
│   ├── Encrypts client-side with AES-GCM (12-byte IV)                                             │
│   │                                                                                              │
│   └── Sends { ciphertext, iv, salt } ────────TLS (HTTPS)────────► Stored in MongoDB              │
│                                                                   (Zero knowledge of raw key)    │
│                                                                                                  │
│   B. MINIMAL-EXPOSURE LLM CALL                                                                   │
│   ├── Strip PII (No name, email, phone)                                                          │
│   └── Send technical payload { skills, interests } ──TLS───────► Forward to Groq/Gemini          │
│                                                                  • Transient hop only            │
│   ┌───────────────────────────────────────────────────────────── • Nothing logged/persisted      │
│   ▼                                                                                              │
│   Response arrives ──► Browser encrypts with key ──────────────► Stored as ciphertext           │
│                                                                                                  │
│   C. ANTI-CHEATING PROCTORING LOCK                                                               │
│   ├── [Enter Fullscreen] (requestFullscreen)                                                     │
│   ├── [Event Traps]: blur, visibilitychange, contextmenu, copy, paste, F12, Ctrl+U              │
│   │                                                                                              │
│   ├── Violation Event Triggered?                                                                 │
│   │   ├── Strike 1 ──► Amber Alert Modal + POST /api/quiz/violation { type: 'tab_switch' }       │
│   │   ├── Strike 2 ──► Red Final Warning Modal + POST /api/quiz/violation                        │
│   │   └── Strike 3 ──► Auto-Submit / Lock Session + POST /api/quiz/violation                     │
│   │                                                                │                             │
│   │                                                                ▼                             │
│   │                                                [Server Enforces Strikeout]                   │
│   │                                                • Marks session.isLocked = true               │
│   │                                                • Sets integrityScore = 0                     │
│   │                                                • Prevents refresh reset                      │
│   │                                                                                              │
│   └── Server Timer Guard: Submissions > 45s + grace period auto-rejected by server               │
│                                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Proposed Changes

### Component 1: Encryption & Security Headers

#### [NEW] `client/js/crypto-vault.js`
A self-contained client-side encryption utility utilizing the native browser Web Crypto API:
- `CryptoVault.deriveKey(password, salt)`: Derives an AES-GCM 256-bit CryptoKey using PBKDF2 with SHA-256 and 100,000 iterations.
- `CryptoVault.encrypt(plainTextOrObject, password, existingSalt = null)`: Generates 12-byte IV, encrypts payload, and returns base64 `{ ciphertext, iv, salt, algorithm: 'AES-GCM-256' }`.
- `CryptoVault.decrypt(encryptedPayload, password)`: Decodes base64, derives key from provided salt, decrypts with AES-GCM, and returns parsed JSON.
- `CryptoVault.sanitizeForLLM(payload)`: Strips `name`, `email`, `phone`, `college`, and sensitive identifiers before sending to LLM endpoints.

#### [MODIFY] `server/server.js`
- Configure Helmet with explicit security headers:
  ```javascript
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://www.youtube.com", "https://s.ytimg.com"],
        frameSrc: ["'self'", "https://www.youtube.com", "https://www.youtube-nocookie.com"],
        imgSrc: ["'self'", "data:", "https:", "blob:"],
        connectSrc: ["'self'", "http://localhost:5000", "http://127.0.0.1:5000", "https://api.groq.com", "https://generativelanguage.googleapis.com"],
      }
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    },
    frameguard: { action: 'sameorigin' },
    noSniff: true
  }));
  ```

#### [MODIFY] `server/models/User.js`
- Add encrypted vault schema field:
  ```javascript
  encryptedVault: {
    ciphertext: { type: String, default: null },
    iv: { type: String, default: null },
    salt: { type: String, default: null },
    version: { type: String, default: 'AES-GCM-256' },
    updatedAt: { type: Date, default: null }
  }
  ```

#### [NEW/MODIFY] `server/controllers/assessmentController.js`
- Support saving and retrieving `encryptedVault` payload on `PUT /api/assessment` and `GET /api/assessment`. The server stores the encrypted string blindly without knowing the user's password or decryption key.

---

### Component 2: Anti-Cheating Lock & Proctoring Engine

#### [NEW] `client/js/anti-cheat-lock.js`
Reusable proctoring controller for the skill verification quiz:
1. **Fullscreen Controller**:
   - `enterFullscreen()`: Invokes `element.requestFullscreen()`.
   - `handleFullscreenChange()`: If user exits fullscreen during active quiz, registers a violation.
2. **Tab Switch & Window Blur Listeners**:
   - `visibilitychange`: Detects when tab is switched.
   - `blur`: Detects when OS focus shifts to another app.
3. **Input & Shortcut Blockers**:
   - Blocks `contextmenu` (right click).
   - Blocks `copy`, `paste`, `cut` clipboard events.
   - Intercepts key combinations: `F12`, `Ctrl+Shift+I`, `Ctrl+Shift+J`, `Ctrl+Shift+C`, `Ctrl+U`, `Ctrl+C`, `Ctrl+V`.
4. **3-Strike HUD Modal Controller**:
   - Renders a floating, high-contrast Proctoring HUD.
   - On Strike 1: Displays Amber Warning Modal.
   - On Strike 2: Displays Red Urgent Warning Modal.
   - On Strike 3: Renders Lockout Screen, stops question timer, and sends immediate termination payload to server.
5. **Violation Reporter**:
   - Dispatches `POST /api/quiz/violation` with `{ sessionId, violationType, details, timestamp }`.

#### [MODIFY] `server/services/quizService.js`
1. **Session State Augmentation**:
   - Add to `sessionData`:
     ```javascript
     strikes: [],
     strikeCount: 0,
     isLocked: false,
     lockReason: null,
     fullscreenExits: 0,
     clipboardViolations: 0,
     currentQuestionServedAt: Date.now(),
     timeLimitSeconds: 45
     ```
2. **Server-Side Timer Enforcement**:
   - In `submitAnswer`:
     ```javascript
     const elapsedSeconds = (Date.now() - session.currentQuestionServedAt) / 1000;
     const MAX_ALLOWED_SECONDS = session.timeLimitSeconds + 5; // 5s network grace period
     if (elapsedSeconds > MAX_ALLOWED_SECONDS) {
       // Flag submission as late; award 0 points for this question due to timer expiry
       isLate = true;
     }
     ```
3. **`recordViolation(userId, skill, violationType, details)`**:
   - Validates session, appends to `session.strikes`.
   - Increments `session.strikeCount`.
   - Deducts from `integrityScore` (Strike 1: -15%, Strike 2: -25%, Strike 3: 0%).
   - If `strikeCount >= 3`: sets `session.isLocked = true` and `session.lockReason = 'REPEATED_PROCTORING_VIOLATIONS'`.
   - Returns `{ strikeCount, strikesRemaining: Math.max(0, 3 - strikeCount), isLocked: session.isLocked }`.
4. **Active Session Recovery (`getActiveSession`)**:
   - When student refreshes browser, returns current question index, sanitized question text/options, elapsed question time, and existing strikes so the attempt cannot be reset by reloading.

#### [MODIFY] `server/controllers/quizController.js`
- **[NEW ENDPOINT] `POST /api/quiz/violation`**:
  - Body: `{ sessionId, violationType, details }`
  - Records violation on the server and returns current strike count.
- **[NEW ENDPOINT] `GET /api/quiz/active-session`**:
  - Returns active proctored session state for recovery on page reload.

#### [MODIFY] `server/routes/quizRoutes.js`
- Mount `/violation` and `/active-session`.

#### [MODIFY] `client/js/quiz.js` & `client/quiz.html`
- Wire `AntiCheatLock` into the quiz start flow:
  - Entering quiz prompts for Fullscreen and arms event traps.
  - Answers submitted include proctoring telemetry.
  - If Strike 3 fires, switches immediately to lock view and prevents further input.

---

## 5. Verification Plan

### Automated Tests
Create `server/tests/security_and_anticheat_test.js`:
1. **Server-Side Timer Test**:
   - Start quiz session -> Simulates answer arriving after 55 seconds (exceeding 45s limit + 5s grace) -> Assert rejected or scored as late.
2. **Strike System & Lockout Test**:
   - Trigger violation 1 -> Verify strikeCount = 1, isLocked = false.
   - Trigger violation 2 -> Verify strikeCount = 2, isLocked = false.
   - Trigger violation 3 -> Verify strikeCount = 3, isLocked = true.
   - Attempt to submit answer after strike 3 -> Assert 403 Forbidden / Session locked.
3. **Session Refresh Persistence Test**:
   - Start quiz -> Query `GET /api/quiz/active-session` -> Verify exact same question ID and strike count returned.
4. **Crypto Vault Unit Test** (Node.js Web Crypto):
   - Encrypt mock assessment object with password `StudentSecret123!` -> Verify ciphertext cannot be read as plaintext.
   - Decrypt with correct password -> Assert exact payload restored.
   - Decrypt with wrong password -> Assert decryption fails with authentication tag mismatch.

### Manual Verification Flow for Demo
1. **Client-Side Encryption Demo**:
   - Open DevTools Network tab.
   - Save assessment or reflection -> Observe that the payload sent to `/api/assessment` has `{ ciphertext: "...", iv: "...", salt: "..." }`. The server never receives raw plaintext or user password.
2. **Anti-Cheating Fullscreen & Tab Switch Demo**:
   - Go to `http://localhost:5500/quiz.html` and start any reality-check quiz.
   - Screen enters Fullscreen mode.
   - Press `Esc` or click outside -> **Strike 1 Warning Modal** appears with buzzer audio/visual cue.
   - Switch tab -> **Strike 2 Warning Modal** appears: *"FINAL WARNING: Next violation terminates quiz!"*
   - Right-click or press `Ctrl+C` -> Blocked with toast notice.
   - Alt-Tab again -> **Strike 3 Lockout Screen** appears; quiz auto-submits, score marked *Unconfirmed (Proctoring Failed)*.
   - Refresh page (F5) -> Session remains locked; cannot reset test!
