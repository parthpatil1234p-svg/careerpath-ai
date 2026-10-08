# Implementation Plan: AI-Monitored Video Dedication & Anti-Slacking Learning Chamber

> **Context & Requirement**:
> *"Resources :- If there is video then there must be a AI detected system or whatever so that the user can't take it lightly & will do the whole course with dedication."*

---

### Goal
Eliminate passive video watching, skipping, scrubbing to the end, background tab idling, and trivial checkbox clicking for video learning resources. Provide a modern in-app **Dedicated Focus Learning Chamber** featuring real-time tab visibility monitoring, anti-scrubbing controls, mid-video AI comprehension checkpoints, an LLM-evaluated reflection gate, and server-authoritative completion locking.

---

### Architecture Overview: The 5-Pillar Dedication System

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                   CAREERPATH AI DEDICATED LEARNING CHAMBER                       │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│   1. ACTIVE TAB / FOCUS GUARDIAN                                                │
│      • Page Visibility API + window.onblur detection                             │
│      • If user leaves tab, switches window, or minimizes:                         │
│        ==> Video immediately AUTO-PAUSES with focus warning banner.              │
│                                                                                  │
│   2. ANTI-SCRUBBING & SPEED CONTROLS                                             │
│      • Fast-forward seek disabled past highest continuously watched timestamp.   │
│      • Playback rate capped at 1.5x (prevents 3x/4x unintelligible speed-running).│
│                                                                                  │
│   3. MID-VIDEO AI CONCEPT PULSE (50% Checkpoint)                                 │
│      • Video seamlessly pauses at 50% watch time.                                │
│      • Interactive single-concept question generated from video skill topic.     │
│      • Must answer correctly to unlock remainder of the lesson.                  │
│                                                                                  │
│   4. POST-VIDEO REFLECTION & AI EVALUATION (Gemini 2.5 Flash)                    │
│      • At 90%+ watch time, student writes a 2-3 sentence key takeaway summary.   │
│      • Gemini evaluates relevance, depth, and rejects spam/gibberish.            │
│      • Passes with score >= 60% and issues verified video learning badge.        │
│                                                                                  │
│   5. SERVER-AUTHORITATIVE TASK GATE                                              │
│      • PATCH /api/roadmaps/tasks/:taskId/toggle rejects unverified video tasks   │
│        with HTTP 403 (VIDEO_VERIFICATION_REQUIRED).                              │
│      • Only verified video completion sets task.completed = true.                │
│                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

### Assumptions & Technical Constraints
1. **Video Sources**: Curriculum tasks feature video resources from YouTube (`youtube.com`, `youtu.be`), freeCodeCamp video tutorials, Coursera, documentation videos, or direct video embeds.
2. **Player Engine**: The learning chamber uses the YouTube IFrame Player API for YouTube resources, with HTML5 `<video>` fallback for direct MP4 sources, and a dedicated External Focused Study Timer with AI Verification Quiz for external non-embeddable platforms.
3. **Session Security**: All verification requests (`POST /api/roadmaps/tasks/:taskId/verify-video`) use `req.user._id` from authenticated JWT sessions and verify that the task belongs to the user's active roadmap.
4. **Environment**: Backend runs on Node.js/Express (`http://localhost:5000`), client on port 5500, with existing Gemini/Groq services for AI evaluations.

---

### Implementation Plan

#### Step 1: Database Schema Expansion for Video Tracking
- **Files**:
  - `server/models/RoadmapTask.js`
- **Changes**:
  - Update `resource` subdocument with `mediaType: { type: String, enum: ['video', 'reading', 'doc', 'lab', 'project'], default: 'reading' }`.
  - Add video tracking fields to `RoadmapTaskSchema`:
    - `isVideoTask`: `{ type: Boolean, default: false, index: true }`
    - `videoWatchTimeSeconds`: `{ type: Number, default: 0 }`
    - `videoDurationSeconds`: `{ type: Number, default: 0 }`
    - `videoMaxWatchedTime`: `{ type: Number, default: 0 }`
    - `videoMidCheckPassed`: `{ type: Boolean, default: false }`
    - `isVideoVerified`: `{ type: Boolean, default: false, index: true }`
    - `videoVerifiedAt`: `{ type: Date, default: null }`
    - `videoReflectionSummary`: `{ type: String, trim: true, default: '' }`
    - `videoAiScore`: `{ type: Number, default: 0 }`
    - `videoAiFeedback`: `{ type: String, default: '' }`
- **Verify**:
  - Start server or run schema test script: `npm test` or `node -e "require('./server/models/RoadmapTask')"` to confirm model compilation with no syntax errors.

---

#### Step 2: AI Video Reflection & Checkpoint Evaluator Services
- **Files**:
  - `server/services/geminiService.js`
- **Changes**:
  - Implement `evaluateVideoReflection({ taskTitle, skillName, videoTitle, reflectionText })`:
    - Constructs prompt directing Gemini 2.5 Flash (with Groq Llama 3 fallback) to evaluate the student's submission.
    - Evaluates: (a) relevance to the topic, (b) specific terminology used, (c) proof of comprehension, (d) rejection of low-effort spam (e.g., "nice video", "watched", random keyboard mashing).
    - Returns structured JSON: `{ passed: boolean, score: number, feedback: string, keyConceptsIdentified: string[] }`.
  - Implement `generateVideoConceptCheckpoint({ taskTitle, skillName, videoTitle })`:
    - Dynamically generates 1 targeted multiple-choice pulse question (question, 4 choices, correct answer index, quick explanation) for the mid-video comprehension pause.
- **Verify**:
  - Test evaluator function with dummy inputs (both spam input like "good" and legitimate response like "Learned how Flexbox justify-content and align-items align flex items along the main and cross axes.") to ensure strict scoring.

---

#### Step 3: Backend Controller & Video Verification Endpoints
- **Files**:
  - `server/controllers/roadmapController.js`
  - `server/routes/roadmapRoutes.js`
- **Changes**:
  - **Task Toggle Lock (`toggleTask`)**:
    - Check if `task.isVideoTask === true` and `task.isVideoVerified !== true`.
    - If user attempts to mark completed via standard checkbox, reject with `403 Forbidden`:
      ```json
      {
        "success": false,
        "code": "VIDEO_VERIFICATION_REQUIRED",
        "message": "This video lesson requires active learning verification. Please complete the video session and AI Reflection in the learning chamber."
      }
      ```
  - **New Endpoint: `POST /api/roadmaps/tasks/:taskId/verify-video`**:
    - Validates that the task belongs to the authenticated user's active roadmap.
    - Validates minimum watch threshold (`watchTimeSeconds >= 0.8 * durationSeconds` or minimum continuous watch duration).
    - Validates `midCheckPassed === true`.
    - Calls `geminiService.evaluateVideoReflection` on student's reflection text.
    - If `evalResult.passed`:
      - Sets `task.isVideoVerified = true`, `task.videoVerifiedAt = new Date()`, `task.videoReflectionSummary = reflectionText`, `task.videoAiScore = evalResult.score`, `task.videoAiFeedback = evalResult.feedback`.
      - Automatically sets `task.completed = true`, `task.completedAt = new Date()`.
      - Recalculates roadmap progress via `calculateRoadmapProgress(roadmap._id)`.
      - If all tasks in current week are done, advances week to `awaiting_test`.
      - Returns HTTP 200 with verification details and updated roadmap progress.
    - If rejected by AI:
      - Returns HTTP 422 with AI feedback explaining what was missing so student can elaborate.
  - **New Endpoint: `GET /api/roadmaps/tasks/:taskId/video-checkpoint`**:
    - Returns mid-video checkpoint question for the specified task.
  - **Register routes in `roadmapRoutes.js`**:
    - `POST /tasks/:taskId/verify-video` (with `protect`, `validateTaskId`)
    - `GET /tasks/:taskId/video-checkpoint` (with `protect`, `validateTaskId`)
- **Verify**:
  - Send direct curl/Postman request to `PATCH /api/roadmaps/tasks/:taskId/toggle` on an unverified video task -> confirm 403 returned.
  - Test `POST /api/roadmaps/tasks/:taskId/verify-video` -> verify database record updates and roadmap percentage recalculates.

---

#### Step 4: Video Focus Learning Chamber Modal (UI)
- **Files**:
  - `client/roadmap.html`
- **Changes**:
  - Insert modern accessible Bootstrap/Tailwind modal `#videoChamberModal`:
    - **Chamber Header**: Task title, skill badge, and dynamic **Focus Status Badge**:
      - 🟢 *Active Focus & Learning*
      - 🟡 *Focus Paused: Window Inactive*
    - **Focus Warning Overlay**: Floats over the video player if the student leaves tab or minimizes window, with friendly prompt: *"Focus Paused. Return to this tab to resume your lesson."*
    - **Responsive Player Container**: Embedded YouTube IFrame / HTML5 video player with clean styling.
    - **Mid-Video Pulse Check Panel**: Appears at 50% timestamp with 1 interactive question and instant explanation.
    - **Post-Video AI Reflection Panel**:
      - Unlocks when video reaches >= 90% completion.
      - Guided prompt: *"Write 2–3 key takeaways or how you will apply this concept in your hands-on code."*
      - Textarea with live character counter (min 40 characters).
      - "Verify with AI" button with animated spinner.
      - Feedback alert card displaying Gemini's evaluation and score.
- **Verify**:
  - Open `roadmap.html` in browser, inspect modal markup and responsiveness on mobile and desktop viewports.

---

#### Step 5: Client-Side Focus Guardian & Video Chamber Controller
- **Files**:
  - `client/js/roadmap.js`
- **Changes**:
  - **Task Item Rendering**:
    - Detect if task is a video task (`task.isVideoTask || task.resource?.type === 'video' || task.resource?.url.includes('youtube')`).
    - If `task.isVideoVerified`:
      - Render green verification badge: `<span class="badge bg-success-subtle text-success border border-success-subtle"><i class="bi bi-patch-check-fill me-1"></i> Video Verified ✓ (${task.videoAiScore}%)</span>`.
      - Checkbox is enabled and checked.
    - If unverified:
      - Render dedicated CTA: `<button class="btn btn-outline-teal btn-sm py-1 px-2 btn-open-video-chamber" data-task-id="${task._id}"><i class="bi bi-play-circle-fill me-1"></i> Enter Focus Video Chamber</button>`.
      - Checkbox is disabled with tooltip: *"Complete video & AI checkpoint to unlock"*.
  - **Video Chamber Engine (`window.VideoChamber`)**:
    - Loads YouTube IFrame API on demand.
    - **Focus & Visibility Watcher**:
      ```javascript
      document.addEventListener('visibilitychange', () => {
        if (document.hidden && isPlaying) {
          player.pauseVideo();
          showFocusPausedOverlay();
        }
      });
      window.addEventListener('blur', () => {
        if (isPlaying) {
          player.pauseVideo();
          showFocusPausedOverlay();
        }
      });
      ```
    - **Anti-Scrubbing Guard**:
      - Tracks `maxWatchedTime`.
      - On timeupdate / interval check: if `currentTime > maxWatchedTime + 2`, snaps player back: `player.seekTo(maxWatchedTime, true)` and shows alert: *"Fast-forwarding disabled. Active learning requires sequential viewing."*
      - Playback speed restricted to `<= 1.5x`.
    - **Mid-Video Pulse Trigger**:
      - Pauses at `duration * 0.5`, shows mid-video checkpoint modal.
    - **Post-Video Submission**:
      - Submits reflection to `/api/roadmaps/tasks/:taskId/verify-video`.
      - Displays AI score, feedback, and triggers confetti on success, then updates local task state and refreshes roadmap progress bar.
- **Verify**:
  - Click "Enter Focus Video Chamber" -> video loads cleanly.
  - Switch tabs or minimize browser -> video pauses immediately and shows warning.
  - Attempt to drag slider to end -> video snaps back to furthest watched point.
  - Reach 50% -> mid-video pulse check triggers.
  - Complete video and submit reflection -> Gemini evaluates and marks task complete.

---

#### Step 6: Retrofit Existing Templates & Auto-Detection
- **Files**:
  - `server/data/roadmapTemplates.js`
  - `server/services/roadmapService.js`
- **Changes**:
  - Tag all video tasks in `roadmapTemplates.js` with `isVideoTask: true` and `resource.mediaType: 'video'` (e.g., freeCodeCamp video courses, YouTube tutorials).
  - In `roadmapService.js` dynamic generation, if a recommended task contains video keywords or YouTube links, auto-set `isVideoTask: true`.
- **Verify**:
  - Inspect generated roadmaps; verify video tasks carry `isVideoTask: true` flag.

---

### Risks & Mitigations
| Risk | Severity | Mitigation |
| :--- | :---: | :--- |
| **YouTube Embed Restrictions** (Video owner disabled embedding) | Medium | Detect player embed error (`onError` code 101/150). Automatically fallback to **External Focus Timer Mode** with dynamic 3-question AI Comprehension Assessment. |
| **Strict AI Evaluation False Negatives** | Low | Provide helpful rejection feedback with the exact reason (e.g., *"Mention how async/await relates to Promises"*), allowing immediate resubmission without penalty. |
| **Network Hiccups During Video Submission** | Low | Save draft reflection in `localStorage` so student never loses their written summary if their internet connection drops. |

---

### Rollback Plan
- If issues occur with video embed APIs, the server flag `isVideoTask` can be temporarily bypassed by setting a configuration flag `ENFORCE_VIDEO_VERIFICATION=false` in `.env`, returning `toggleTask` to normal behavior without breaking any existing student progress or database schemas.
