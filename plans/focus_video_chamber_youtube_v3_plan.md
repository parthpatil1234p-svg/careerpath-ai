# Implementation Plan: Powering the "Enter Focus Video Chamber" with YouTube Data API v3

> **User Focus**: *"but that can use for the enter focuse video chamber"*
> **Core Objective**: Wire the official **Google YouTube Data API v3 (`Search: list`)** directly into the **"Enter Focus Video Chamber"** (`VideoChamber`) workflow so that clicking the chamber button on any roadmap task loads a genuine, high-quality, embeddable YouTube video masterclass with channel info, an alternative instructor switcher, and full synchronization with the AI Dedication Monitor.

---

## 1. Goal Description

Currently in `careerpath-ai/client/js/roadmap.js`:
1. When a student clicks **"Enter Focus Video Chamber"** (`.btn-open-video-chamber`), the client inspects `task.resource.url`.
2. Because dynamic tasks were previously generated with generic search queries (`https://www.youtube.com/results?search_query=...`), the regex parser `extractYouTubeId` fails to parse a valid 11-character video ID, forcing the chamber to fall back to a hardcoded placeholder video (`mU6anWqZJcc`).
3. If a creator disabled iframe embedding or if a video is a 30-second short, the learning experience breaks.

### What This Feature Delivers to "Enter Focus Video Chamber":
1. **Dynamic Real-Video Resolution**: When entering the Focus Video Chamber, CareerPath AI resolves and embeds the exact, authoritative YouTube video for that specific skill (e.g. React, Python, Docker, MongoDB) via YouTube Data API v3.
2. **In-Chamber Instructor Metadata & Alternative Switcher**:
   - The Focus Video Chamber displays the verified channel name (e.g. *freeCodeCamp.org*, *Programming with Mosh*, *Traversy Media*), thumbnail, and duration badge.
   - Adds an interactive **"🔄 Switch Instructor / Course"** selector inside the chamber modal so students can learn from their preferred educator.
3. **Seamless Dedication Monitor Harmony**:
   - Tab blur / window minimize focus-pause overlay works on the live YouTube iframe.
   - Anti-scrubbing telemetry tracks actual lesson time.
   - 50% Mid-Video Concept Pulse checkpoint halts the video at the halfway mark.
   - 85% Watch-time unlocks the AI Reflection Gate and completion badge.
4. **Quota-Protected Zero-Cost Architecture**:
   - Free tier YouTube API allows only 100 `search.list` calls per day (100 quota units/call).
   - We deploy a **30-day MongoDB TTL Cache (`YoutubeCache.js`)** and a **Curated Fallback Registry** for 30+ core tech stacks. Once resolved, videos are permanently linked to the task, costing **0 quota units** on all subsequent chamber launches.

---

## 2. User Review Required

> [!IMPORTANT]
> **API Key Flexibility (Zero-Breakage Guarantee)**:
> The system is designed to work **both with and without a YouTube API key**.
> - **With API Key (`YOUTUBE_API_KEY`)**: Real-time searches query YouTube Data API v3 with strict filters (`videoEmbeddable=true`, `videoSyndicated=true`, `videoDuration=medium|long`, `safeSearch=strict`).
> - **Without API Key / When Quota Exhausted**: The chamber immediately uses the pre-verified **Curated Fallback Registry** (top-rated courses from freeCodeCamp, Harvard CS50, Mosh, Traversy) with 0 errors and zero downtime.

> [!NOTE]
> **In-Chamber Video Switcher**:
> When a student switches instructors inside the Focus Video Chamber, their selection is saved to the task (`PATCH /api/roadmaps/tasks/:taskId/switch-video`). If they close and re-enter the chamber later, their chosen instructor's video will automatically resume.

---

## 3. End-to-End User Flow in the Focus Video Chamber

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                   "ENTER FOCUS VIDEO CHAMBER" + YOUTUBE v3 USER FLOW                             │
├──────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                  │
│   1. Student navigates to Roadmap (roadmap.html)                                                 │
│   2. Clicks "[▶ Enter Focus Video Chamber]" on a task (e.g., "React State & Hooks")              │
│                                                                                                  │
│                                      │                                                           │
│                                      ▼                                                           │
│   3. VideoChamber.open({ taskId, taskTitle, videoUrl, skillName }) executes:                     │
│      ├── Does task.resource.url contain a valid 11-char YouTube ID?                              │
│      │   ├── YES ──► Load YouTube Player immediately                                             │
│      │   └── NO (or search link) ──► Query /api/youtube/resolve?skill=react&topic=...            │
│      │                               └── Returns top embeddable video + instructor metadata      │
│                                                                                                  │
│                                      │                                                           │
│                                      ▼                                                           │
│   4. Focus Video Chamber Modal Opens:                                                            │
│      ├── Left Panel:                                                                             │
│      │   • Real YouTube video streams in high resolution via YT Iframe API                       │
│      │   • Instructor bar: "👨‍🏫 Instructor: freeCodeCamp.org" + [🔄 Switch Instructor] button     │
│      │   • Dedication Monitor: Tab-focus tracker + Anti-scrubbing + Progress bar                 │
│      │                                                                                           │
│      │   • At 50% time ──► Video auto-pauses & "Mid-Video Concept Pulse" test appears            │
│      │                                                                                           │
│      └── Right Panel:                                                                            │
│          • At 85% time ──► AI Reflection Gate unlocks                                            │
│          • Student writes concept reflection ──► Verified with AI & task completed!              │
│                                                                                                  │
│   5. (Optional) Student clicks [🔄 Switch Instructor]:                                           │
│      ├── An offcanvas/drawer opens showing 3–4 alternative top tutorials                         │
│      │   (e.g., Traversy Media, Programming with Mosh, Net Ninja)                                │
│      └── Clicking a card swaps player video instantly + updates task in DB                       │
│                                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Proposed Changes

### Component 1: Database & Model Layer

#### [NEW] `server/models/YoutubeCache.js`
Stores cached YouTube searches with auto-expiring 30-day TTL index:
- `queryKey`: String, unique index (e.g., `skill:react:video`)
- `skillName`: String, indexed
- `videos`: Array of:
  - `videoId`: String (11 characters)
  - `title`: String
  - `channelTitle`: String
  - `thumbnailUrl`: String
  - `durationCategory`: String ('medium' | 'long')
  - `embedUrl`: String (`https://www.youtube.com/embed/{videoId}`)
  - `watchUrl`: String (`https://www.youtube.com/watch?v={videoId}`)
- `createdAt`: Date, default `Date.now`, with index `{ expires: '30d' }`

---

### Component 2: YouTube Search Service & Curated Registry

#### [NEW] `server/services/youtubeService.js`
- **`searchYouTubeVideos(query, { skillName, maxResults = 5 })`**:
  1. Checks `YoutubeCache` in MongoDB first.
  2. If absent and `process.env.YOUTUBE_API_KEY` exists, queries `https://www.googleapis.com/youtube/v3/search` with parameters:
     - `part`: `snippet`
     - `q`: `${query} full course tutorial`
     - `type`: `video`
     - `videoEmbeddable`: `true` (guarantees iframe embed permission)
     - `videoSyndicated`: `true` (guarantees playback outside youtube.com)
     - `videoDuration`: `medium` or `long` (filters out shorts/clips)
     - `order`: `relevance`
     - `safeSearch`: `strict`
     - `maxResults`: `maxResults`
  3. Caches response in `YoutubeCache`.
  4. If API key is missing or quota is 403/429, falls back to `CURATED_FALLBACK_REGISTRY`.
- **`resolveVideoForTask(skillName, topic)`**:
  - Returns the optimal #1 video for direct embedding into the Focus Video Chamber.
- **`CURATED_FALLBACK_REGISTRY`**:
  - Full catalog of verified courses across 30+ skills (JavaScript, TypeScript, React, Vue, Node.js, Python, Django, FastAPI, SQL, MongoDB, Docker, Kubernetes, AWS, Git, System Design, Cybersecurity, etc.).

---

### Component 3: Express Routes & Roadmap Integration

#### [NEW] `server/routes/youtubeRoutes.js`
Mounted under `/api/youtube`:
- `GET /resolve`:
  - Query: `?skill=react&topic=hooks`
  - Returns top playable video + alternatives for immediate Focus Chamber injection.
- `GET /search`:
  - Query: `?q=docker+tutorial&maxResults=5`
  - Returns list of matching videos for the "Switch Instructor" drawer.
- `PATCH /tasks/:taskId/switch-video`:
  - Body: `{ videoId, videoTitle, channelTitle, videoUrl }`
  - Persists the student's chosen instructor video directly to `RoadmapTask.resource`.

#### [MODIFY] `server/server.js`
- Mount `app.use('/api/youtube', youtubeRoutes)`.

#### [MODIFY] `server/services/roadmapService.js`
- Replace initial dummy search query URLs (`youtube.com/results?search_query=...`) with direct video resolution via `youtubeService.resolveVideoForTask(skillName)`.

#### [MODIFY] `server/.env.example`
- Add `YOUTUBE_API_KEY=your_google_youtube_data_api_v3_key`.

---

### Component 4: Frontend "Focus Video Chamber" UI & Logic

#### [MODIFY] `client/roadmap.html`
- Inside `#videoChamberModal`:
  - Add **Instructor Metadata Badge** below the modal title:
    `<span id="chamberInstructorBadge" class="badge bg-dark-subtle text-ink border font-mono small"><i class="bi bi-person-video3 me-1 text-teal"></i> <span id="chamberInstructorName">Instructor: freeCodeCamp.org</span></span>`
  - Add **Switch Instructor Button**:
    `<button type="button" class="btn btn-outline-teal btn-sm py-1 px-3 font-mono ms-2" id="btnToggleInstructorDrawer"><i class="bi bi-arrow-left-right me-1"></i> Switch Instructor / Course</button>`
  - Add **Offcanvas / Drawer (`#instructorDrawer`)**:
    - Slides in or overlays on the left/right of the modal.
    - Shows alternative top-rated video cards with thumbnails, instructor names, and a `"Watch This Course Instead"` button.

#### [MODIFY] `client/js/roadmap.js`
- Update `VideoChamber`:
  1. **Smart Video Resolution in `VideoChamber.open()`**:
     - If `videoUrl` is missing or is an un-embeddable search query link, automatically calls `/api/youtube/resolve?skill=${skillName}` before mounting the player.
  2. **Instructor & Metadata Display**:
     - Populates channel name, thumbnail, and course title.
  3. **Alternative Video Drawer & Switching**:
     - Clicking "Switch Instructor" calls `/api/youtube/search?q=${skillName}` and renders instructor cards.
     - Clicking an alternative instructor card calls `player.loadVideoById(newVideoId)`, updates telemetry, and sends `PATCH /api/youtube/tasks/:taskId/switch-video` so the choice is saved permanently.
  4. **Telemetry & Guard Maintenance**:
     - Retains all Dedication Monitor features (Anti-scrubbing, blur pause, 50% pulse checkpoint, 85% reflection gate).

---

## 5. Verification Plan

### Automated Tests
Create `server/tests/youtube_chamber_test.js`:
1. **Fallback Resolution Test**:
   - Request video for `"react"` without API key -> Verifies valid YouTube video ID, title, and channel are returned from curated registry.
2. **Cache Integrity Test**:
   - Query a key -> Mock YouTube response -> Verify stored in `YoutubeCache`.
   - Query second time -> Verify loaded from MongoDB cache (`isCached: true`) without external API call.
3. **Task Video Switch Endpoint Test**:
   - Issue `PATCH /api/youtube/tasks/:taskId/switch-video` -> Verify `RoadmapTask.resource.url` is updated with the new video ID.

### Manual UI Verification
1. Launch client (`http://localhost:5500/roadmap.html`) and backend (`http://localhost:5000`).
2. Log in as a student and view active roadmap.
3. Click **"Enter Focus Video Chamber"** on any task:
   - **Verification**: Real, playable video tutorial loads in the embedded player (no search query error or fallback placeholder).
   - **Verification**: Instructor name (e.g. *freeCodeCamp.org*) is displayed in the chamber header.
4. Click **"Switch Instructor / Course"**:
   - Drawer opens with alternative instructors (e.g. *Traversy Media*, *Mosh*).
   - Click an alternative course: the player switches smoothly to the new video, and the task reflects the new URL.
5. Test Focus Pausing:
   - Switch browser tab -> Verify video auto-pauses and "Focus Paused · Tab Inactive" overlay appears.
   - Click "Click to Resume Active Focus" -> Video resumes playback.
6. Verify at 50% watch time: Mid-Video Concept Pulse activates.
7. Verify at 85% watch time: AI Reflection Gate unlocks for completion.
