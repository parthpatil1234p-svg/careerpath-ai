# Implementation Plan: Strict Anti-Cheating Lockdown & Disqualification Protocol

> **User Feedback & Context**:
> *"now here in this ss it has given only warning, but with only warning ntnng is gonna happen, it should br smthng strict cuz the the user is cheating and it's a big deal"*
> 
> The user provided the following screenshot from the **Skill Reality Check Modal** (`client/assessment.html` & `client/js/assessment.js`):
> 
> ![Current Weak Proctor Warning](file:///C:/Users/PARTH/.gemini/antigravity/brain/0c496c2a-761b-466e-ac21-a7de2b4734ea/.user_uploaded/media_1791005895800.png)
> 
> Currently, the system only shows a harmless yellow toast:
> `⚠️ Proctor Notice: Window blur detected. Please stay focused on the quiz.`
> The toast disappears after 4.5s and the user is free to switch tabs, consult ChatGPT, copy-paste answers, and game the system with zero consequences.

---

## 1. Goal Description

Transform the weak toast into an **unforgiving, high-stakes, strict Anti-Cheating Lockdown Engine** across both the **In-Modal Assessment Reality Check** (`assessment.html`) and the **Standalone Quiz Hub** (`quiz.html`):

### The 4 Pillars of Strict Enforcement:
1. **Interactive Freeze & Strike Modal Overlays**:
   - Instead of a tiny fading toast, any window blur or tab switch **immediately freezes the quiz** and displays a high-impact, blocking Strike Modal that requires explicit user acknowledgement to continue.
2. **Real Punitive Penalties**:
   - **Strike 1 (-10s & -25% Integrity)**: Drains 10 seconds directly off the countdown clock and deducts 25% from the candidate's integrity score.
   - **Strike 2 (-10s & -50% Integrity)**: Drains another 10 seconds; drops integrity to 25%; displays a full-screen red warning sirens banner (*"FINAL CHANCE BEFORE DISQUALIFICATION"*).
   - **Strike 3 (IMMEDIATE DISQUALIFICATION & 24H LOCKOUT)**:
     - Abruptly **kills the test session** on the spot.
     - Question is wiped from DOM.
     - Candidate is awarded **0% Score (FAILED - INTEGRITY VIOLATION)**.
     - Backend permanently records cheating violation and activates a **strict 24-hour lockout** on this skill. Refreshing the browser (F5) will NOT reset the test.
3. **Anti-Leak & Copy-Paste Lockdown**:
   - CSS `user-select: none;` on question prompt and code snippets so text cannot be highlighted and dragged into search engines.
   - Right-click (`contextmenu`) is strictly disabled.
   - `copy`, `cut`, and `paste` events are blocked. Any attempt to use `Ctrl+C` or `Ctrl+V` immediately triggers a **proctor strike**!
   - Inspect shortcut keys (`F12`, `Ctrl+Shift+I`, `Ctrl+U`) are blocked.
4. **Live Visual Strike HUD**:
   - A high-visibility Strike Indicator in the modal header: `Strikes: 0 / 3` (Green) ➔ `1 / 3` (Amber) ➔ `2 / 3` (Red) ➔ `3 / 3` (Disqualified).

---

## 2. User Review Required

> [!IMPORTANT]
> **Strictness Philosophy**:
> - **Accidental clicks**: Strike 1 is a warning with a small timer penalty (-10s), giving honest users one chance if they accidentally clicked outside or had an OS notification.
> - **Repeated Cheating**: Strike 2 is the final alarm. Strike 3 is complete, unrecoverable disqualification for 24 hours.
> - **Server Persistence**: The strikeout state is written to MongoDB. Even if a student reloads the browser, clears localStorage, or closes the tab, the server returns `429 Cooldown Active: Locked due to cheating disqualification`.

---

## 3. Strict 3-Strike State Machine

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                   STRICT ANTI-CHEATING LOCKDOWN STATE MACHINE                                    │
├──────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                  │
│   Active Quiz Session Running (45s Timer Ticking)                                                │
│                                                                                                  │
│   VIOLATION EVENT DETECTED:                                                                      │
│   [Tab Switch / Visibility Change] OR [Window Blur / Alt-Tab] OR [Copy/Paste/Inspect Attempt]    │
│                                      │                                                           │
│                                      ▼                                                           │
│   ┌────────────────────────────────────────────────────────────────────────┐                     │
│   │ STRIKE 1: Amber Alert Freeze                                           │                     │
│   ├────────────────────────────────────────────────────────────────────────┤                     │
│   │ • Timer instantly penalizes: -10 Seconds deducted from clock           │                     │
│   │ • Integrity Score drops to 75%                                         │                     │
│   │ • Full-screen Amber Modal: "STRIKE 1 of 3: Cheating Violation Logged"  │                     │
│   │ • Action: User must click [I Acknowledge & Resume Focus]               │                     │
│   └──────────────────────────────────┬─────────────────────────────────────┘                     │
│                                      │ (If violated again)                                       │
│                                      ▼                                                           │
│   ┌────────────────────────────────────────────────────────────────────────┐                     │
│   │ STRIKE 2: Critical Red Alert Freeze                                    │                     │
│   ├────────────────────────────────────────────────────────────────────────┤                     │
│   │ • Timer instantly penalizes: -10 Seconds deducted                      │                     │
│   │ • Integrity Score drops to 40%                                         │                     │
│   │ • Flashing Red Warning Modal: "STRIKE 2 of 3: FINAL WARNING!"          │                     │
│   │ • Action: User must click [Acknowledge Final Chance]                   │                     │
│   └──────────────────────────────────┬─────────────────────────────────────┘                     │
│                                      │ (If violated 3rd time)                                    │
│                                      ▼                                                           │
│   ┌────────────────────────────────────────────────────────────────────────┐                     │
│   │ STRIKE 3: IMMEDIATE TERMINATION & 24-HOUR LOCKOUT                      │                     │
│   ├────────────────────────────────────────────────────────────────────────┤                     │
│   │ • Quiz instantly TERMINATED & Question wiped                           │                     │
│   │ • Score: 0% | Result: FAILED / INTEGRITY VIOLATION                     │                     │
│   │ • Backend Call: POST /api/quiz/disqualify                              │                     │
│   │ • Database updated: status = 'flagged_cheating', cooldown = 24 Hours   │                     │
│   │ • Lockout Screen displayed (Padlock icon + 24-hr countdown)            │                     │
│   │ • Refreshing (F5) or re-opening modal shows ACCOUNT LOCKED screen      │                     │
│   └────────────────────────────────────────────────────────────────────────┘                     │
│                                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Proposed Changes

### Component 1: Client Modal UI & Styling (`client/assessment.html` & `client/css/quiz.css`)

#### [MODIFY] `client/assessment.html`
1. **Modal Header Live Strike HUD**:
   - Replace or augment line 714:
     ```html
     <div class="d-flex align-items-center gap-2">
       <span class="badge bg-success-subtle text-success border border-success-subtle font-mono px-2.5 py-1" id="modalStrikesBadge">
         <i class="bi bi-shield-check me-1"></i> Strikes: <span id="modalStrikesCount">0</span>/3
       </span>
       <span class="difficulty-pill medium" id="modalDifficultyPill">MEDIUM</span>
       <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close" id="modalCloseBtn"></button>
     </div>
     ```
2. **Copy & Right-Click Disabling**:
   - Add class `proctored-no-select` to `#modalQuestionPrompt` and `#modalCodeSnippet`.
3. **Strict Strike Overlay Modals inside `#skillCheckModal`**:
   - Add `#modalStrikeOverlay`: A high-contrast blocking backdrop that appears when a strike occurs:
     - **Strike 1 View**: Amber warning card with explanation of penalty (-10s, -25% integrity) and `[Resume Test]` button.
     - **Strike 2 View**: Crimson alert card with alarm banner (*"FINAL WARNING: ONE MORE STRIKE WILL RESULT IN IMMEDIATE DISQUALIFICATION"*) and `[I Understand - Last Chance]` button.
     - **Strike 3 View**: Dark crimson Disqualification Screen with locked padlock, 0% score display, and 24-hour lockout notice.

#### [MODIFY] `client/css/quiz.css`
- Add styling for `.proctored-no-select` (`user-select: none; -webkit-user-select: none;`).
- Add styling for `#modalStrikeOverlay` (full modal coverage, frosted glass backdrop, pulsing warning border).
- Add styling for `.quiz-strike-badge.warning` (amber) and `.quiz-strike-badge.danger` (red pulse).

---

### Component 2: Client Proctoring Logic (`client/js/assessment.js` & `client/js/quiz.js`)

#### [MODIFY] `client/js/assessment.js`
1. **State Variables**:
   ```javascript
   let modalStrikes = 0;
   let isModalDisqualified = false;
   ```
2. **Strict Event Listeners**:
   - In `visibilitychange`:
     ```javascript
     if (document.hidden && isQuizActive) {
       triggerStrictProctorStrike('Tab switch detected');
     }
     ```
   - In `window.blur`:
     ```javascript
     if (isQuizActive) {
       triggerStrictProctorStrike('Window blur / Alt-Tab detected');
     }
     ```
   - In `contextmenu`, `copy`, `paste`, `cut`:
     ```javascript
     e.preventDefault();
     triggerStrictProctorStrike('Unauthorized clipboard or context menu action');
     ```
   - In `keydown` (detecting `F12`, `Ctrl+Shift+I`, `Ctrl+U`, `Ctrl+C`, `Ctrl+V`):
     ```javascript
     e.preventDefault();
     triggerStrictProctorStrike('Unauthorized developer shortcut');
     ```
3. **`triggerStrictProctorStrike(reason)` Function**:
   - Increments `modalStrikes++`.
   - Pauses question countdown timer.
   - **Strike 1**:
     - Deducts 10s from `modalRemainingSeconds = Math.max(5, modalRemainingSeconds - 10)`.
     - Updates HUD badge to Amber: `Strikes: 1/3`.
     - Shows Strike 1 Overlay Modal.
   - **Strike 2**:
     - Deducts another 10s.
     - Updates HUD badge to Red: `Strikes: 2/3`.
     - Shows Strike 2 Critical Warning Overlay.
   - **Strike 3 (TERMINATION)**:
     - Sets `isModalDisqualified = true`.
     - Completely hides `#modalQuestionState`.
     - Dispatches `POST /api/quiz/disqualify` to server.
     - Renders Strike 3 Disqualification View (0% Score, 24-Hour Lockout active).
     - Disables all quiz buttons permanently.

#### [MODIFY] `client/js/quiz.js`
- Mirror the exact same strict 3-strike freeze, timer deduction, and termination state to the standalone `quiz.html` page.

---

### Component 3: Server Authoritative Disqualification (`server/controllers/quizController.js` & `server/services/quizService.js`)

#### [NEW ENDPOINT] `POST /api/quiz/disqualify`
In `server/controllers/quizController.js`:
- Parameters: `{ skill, sessionId, reason, strikes }`
- **Actions**:
  1. Finds the user in MongoDB.
  2. Locates the skill record (or creates it if missing).
  3. Updates skill record:
     ```javascript
     skillRecord.isQuizVerified = false;
     skillRecord.quizScore = 0;
     skillRecord.integrityScore = 0;
     skillRecord.verificationStatus = 'flagged_cheating';
     skillRecord.verificationTier = 'self_rated';
     skillRecord.tabSwitchCount = strikes || 3;
     skillRecord.nextRetakeAvailableAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24-hr lockout
     ```
  4. Destroys the active session in `quizService` so it cannot be resumed.
  5. Returns `{ success: true, disqualified: true, retryAfterHours: 24, message: 'Candidate disqualified for cheating.' }`.

#### [MODIFY] `server/routes/quizRoutes.js`
- Mount `router.post('/disqualify', authMiddleware, quizController.disqualifyUser)`.

---

## 5. Verification Plan

### Automated Tests
Create `server/tests/strict_anticheat_test.js`:
1. **Disqualification API Test**:
   - Issue `POST /api/quiz/disqualify` with `{ skill: 'python', strikes: 3, reason: 'Tab switch limit exceeded' }`.
   - Assert response returns `disqualified: true` and `retryAfterHours: 24`.
   - Fetch user profile -> Verify `python` has `isQuizVerified: false`, `quizScore: 0`, `integrityScore: 0`, and `nextRetakeAvailableAt` set 24 hours into the future.
2. **Immediate Lockout Rejection Test**:
   - Immediately attempt `POST /api/quiz/start` for `python`.
   - Assert response returns `429 Too Many Requests` with `cooldownActive: true`.

### Manual UI Verification (Directly testing the user's scenario)
1. Open `http://localhost:5500/assessment.html`.
2. Go to Step 3 and click **"Start check (90s)"** on **Python** (exact same screen as the screenshot).
3. **Test Strike 1**:
   - Switch browser tab or click on desktop outside the browser.
   - **Observed Result**:
     - Timer drops by 10 seconds immediately.
     - Quiz freezes.
     - **Strike 1 Overlay Modal** covers the screen: *"STRIKE 1 of 3: Cheating Violation Logged (-10s penalty)"*.
     - Click *"I Acknowledge & Resume Focus"* to unfreeze.
4. **Test Strike 2**:
   - Press `Ctrl+C` or switch tab again.
   - **Observed Result**:
     - Timer drops another 10 seconds.
     - **Strike 2 Red Alarm Modal** covers the screen: *"CRITICAL FINAL WARNING: One more violation will immediately disqualify you"*.
     - Click *"Acknowledge Final Chance"* to unfreeze.
5. **Test Strike 3**:
   - Switch tab a third time.
   - **Observed Result**:
     - **Test is IMMEDIATELY TERMINATED!**
     - Screen turns crimson with a locked padlock: *"🚫 ASSESSMENT TERMINATED: DISQUALIFIED FOR CHEATING (Score: 0%, 24h Lockout)"*.
     - Press `F5` (Refresh) and try to start Python check again -> **Blocked: Cooldown Active (24 hours remaining)**.
