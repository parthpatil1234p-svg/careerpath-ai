# Implementation Plan: YouTube Data API v3 (`Search: list`) Integration for Video Learning Chamber

> **Context & Requirement**:
> The user provided the official Google documentation for `YouTube Data API v3: Search: list` (`GET https://www.googleapis.com/youtube/v3/search`).
> Currently, `roadmapService.js` and dynamic task generation was using static search query links (`https://www.youtube.com/results?search_query=...`) which cannot be embedded in our in-app `VideoChamber` player and fall back to a hardcoded video ID.
> By integrating the official YouTube Data API v3 `search.list` method, CareerPath AI will dynamically fetch, embed, and cache real, embeddable video masterclasses and tutorials for every skill and topic in the student's roadmap.

---

## 1. Problem Analysis & Core Value

| Current Limitation | Root Cause | Elevated Solution with YouTube Data API v3 |
| :--- | :--- | :--- |
| **Broken / Generic Video URLs** | Tasks in dynamic roadmaps use generic search query URLs (`youtube.com/results?search_query=...`), not direct video IDs (`watch?v=...`). | Query `https://www.googleapis.com/youtube/v3/search` with `part=snippet`, `type=video`, and `videoEmbeddable=true` to retrieve exact `videoId`s and embed URLs. |
| **In-App Embed Failure** | Many YouTube videos cannot be embedded in `<iframe>` if the creator disabled third-party embedding. | Strict filter `videoEmbeddable=true` and `videoSyndicated=true` guarantees 100% playable videos inside the in-app `VideoChamber`. |
| **Shorts / Clickbait Noise** | Default YouTube search returns 30-second shorts and unrelated clickbait. | Filter `videoDuration=medium` (4–20 mins) or `videoDuration=long` (20+ mins) and `safeSearch=strict` to isolate genuine educational masterclasses. |
| **Strict 100 Calls/Day Quota Limit** | `search.list` has a high quota cost of **100 units** (out of free tier 10,000 units/day), meaning only 100 searches/day. | **Multi-Tier 30-Day MongoDB Cache (`YoutubeCache.js`) + Curated Offline Fallback Registry** ensures quota is never exceeded and costs $0. |

---

## 2. System Architecture: YouTube Search & Quota Protection Engine

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                   YOUTUBE DATA API v3 (Search: list) ARCHITECTURE                                │
├──────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                  │
│   Incoming Request: Find Video Tutorial for [Skill: "React", Topic: "State & Hooks"]            │
│                                      │                                                           │
│                                      ▼                                                           │
│   STEP 1: Check MongoDB 30-Day Cache (YoutubeCache Collection)                                   │
│   ├── Found in Cache?                                                                            │
│   │   ├── YES ──► Return cached video (0ms latency, 0 YouTube quota units consumed!)             │
│   │   └── NO  ──► Proceed to Step 2                                                              │
│                                                                                                  │
│   STEP 2: Query YouTube Data API v3 (search.list)                                                │
│   ├── Endpoint: GET https://www.googleapis.com/youtube/v3/search                                 │
│   ├── Parameters:                                                                                │
│   │   • part = "snippet"                                                                         │
│   │   • q = "${skillName} complete tutorial beginners freecodecamp | traversy | mosh"           │
│   │   • type = "video"                                                                           │
│   │   • videoEmbeddable = "true"  (Ensures no iframe block errors!)                              │
│   │   • videoSyndicated = "true"  (Allowed to play outside youtube.com)                          │
│   │   • videoDuration = "medium" | "long"  (Filters out shorts & clips)                          │
│   │   • order = "relevance"                                                                      │
│   │   • safeSearch = "strict"                                                                    │
│   │   • maxResults = 5                                                                           │
│   │                                                                                              │
│   ├── Success (HTTP 200)?                                                                        │
│   │   ├── Extract: videoId, title, description, thumbnail, channelTitle                          │
│   │   └── Save to MongoDB YoutubeCache (30-day TTL auto-expiry)                                  │
│   │                                                                                              │
│   └── API Key Missing OR Quota Exceeded (HTTP 403 / 429)?                                        │
│       └── STEP 3: Curated Offline Fallback Registry (Zero-Fail Guarantee)                        │
│           • Instant fallback to pre-verified authoritative courses                               │
│             (freeCodeCamp, Harvard CS50, Net Ninja, Fireship, Mosh)                              │
│           • 0 errors, 100% uptime!                                                               │
│                                                                                                  │
├──────────────────────────────────────────────────────────────────────────────────────────────────┤
│                     CONSUMPTION IN CAREERPATH AI PLATFORM                                        │
├──────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                  │
│   A. Roadmap Generation (roadmapService.js):                                                     │
│      • Automatically binds the top verified video embed URL to RoadmapTask.resource.url          │
│                                                                                                  │
│   B. In-App Video Learning Chamber (VideoChamber Modal):                                         │
│      • Streams video directly in modal with tab focus auto-pause & anti-scrubbing               │
│      • "Switch Instructor / Alternative Videos" drawer lets students pick their favorite teacher  │
│                                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Proposed Changes

### Component A: Database Cache Model

#### [NEW] `server/models/YoutubeCache.js`
Stores cached YouTube API search results with MongoDB TTL index:
- `queryKey`: `{ type: String, required: true, unique: true, index: true }` (normalized lowercase query, e.g. `skill:react:tutorial`)
- `skillName`: `{ type: String, lowercase: true, index: true }`
- `videos`: `[{ videoId: String, title: String, description: String, channelTitle: String, thumbnailUrl: String, publishedAt: String, embedUrl: String, watchUrl: String }]`
- `createdAt`: `{ type: Date, default: Date.now, expires: '30d' }` (MongoDB auto-deletes expired cache after 30 days)

---

### Component B: YouTube Integration Service & Curated Registry

#### [NEW] `server/services/youtubeService.js`
Enterprise-grade wrapper for YouTube Data API v3:
1. **`searchYouTubeTutorials(query, { skillName, maxResults = 5, duration = 'medium' })`**:
   - Checks MongoDB cache first.
   - If not cached, sends HTTP request to `https://www.googleapis.com/youtube/v3/search` with the exact query parameters:
     ```javascript
     const params = new URLSearchParams({
       key: process.env.YOUTUBE_API_KEY || process.env.GOOGLE_API_KEY,
       part: 'snippet',
       q: `${query} tutorial course`,
       type: 'video',
       videoEmbeddable: 'true',
       videoSyndicated: 'true',
       videoDuration: duration, // 'medium' or 'long'
       order: 'relevance',
       safeSearch: 'strict',
       relevanceLanguage: 'en',
       maxResults: String(maxResults),
     });
     ```
   - Normalizes and sanitizes results.
   - Saves to `YoutubeCache`.
2. **`getBestVideoForSkill(skillName, topic = '')`**:
   - Returns the #1 highest-ranked video matching the skill for direct roadmap assignment.
3. **`CURATED_FALLBACK_REGISTRY`**:
   - Zero-quota offline dictionary containing verified high-quality YouTube tutorials for all 30+ core technologies:
     - `javascript`: `https://www.youtube.com/watch?v=PkZNo7MFNFg` (freeCodeCamp JS Course)
     - `react`: `https://www.youtube.com/watch?v=bMknfKXIFA8` (React Full Course)
     - `python`: `https://www.youtube.com/watch?v=_uQrJ0TkZlc` (Programming with Mosh Python)
     - `node.js`: `https://www.youtube.com/watch?v=Oe421EPjeBE` (Node.js & Express)
     - `html`: `https://www.youtube.com/watch?v=kUMe1FH4CHE` (HTML5 Full Course)
     - `css`: `https://www.youtube.com/watch?v=OXGznpKZ_sA` (CSS3 Masterclass)
     - `git`: `https://www.youtube.com/watch?v=RGOj5yH7evk` (Git & GitHub Crash Course)
     - `sql`: `https://www.youtube.com/watch?v=HXV3zeRR3h4` (SQL for Beginners)
     - `docker`: `https://www.youtube.com/watch?v=fqMOX6JJhGo` (Docker in 100 Seconds / Tutorial)
     - ...and more.

---

### Component C: REST API Endpoints & Routes

#### [NEW] `server/routes/youtubeRoutes.js`
Mounted at `/api/youtube`:
- `GET /search`:
  - Query params: `q`, `skill`, `maxResults`
  - Returns top 5 embeddable tutorial videos.
- `GET /skill/:skillName`:
  - Returns best matched video tutorial and alternatives for a given competency.
- `PATCH /tasks/:taskId/switch-video`:
  - Switches a roadmap task's assigned video to a student's chosen instructor.

#### [MODIFY] `server/services/roadmapService.js`
- Replace broken search query URLs (`https://www.youtube.com/results?search_query=...`) with direct embeddable video URLs resolved via `youtubeService.getBestVideoForSkill(skillName)`.

#### [MODIFY] `server/server.js`
- Mount `app.use('/api/youtube', youtubeRoutes)`.

#### [MODIFY] `server/.env.example`
- Add `YOUTUBE_API_KEY=your_youtube_data_api_v3_key`.

---

### Component D: Frontend Video Chamber & Alternative Instructor Switcher

#### [MODIFY] `client/roadmap.html`
- In `#videoChamberModal`:
  - Add video metadata bar under the title: Instructor / Channel Name, Duration badge, and **"🔄 Switch Instructor / Videos"** button.
  - Add an offcanvas/drawer `#alternativeVideosDrawer` displaying 3–5 alternative YouTube courses for the current topic.

#### [MODIFY] `client/js/roadmap.js`
- Enhance `VideoChamber`:
  - Populate actual channel name and video thumbnail.
  - When "Switch Instructor" is clicked, fetch alternative videos from `/api/youtube/search?skill=${currentSkill}`.
  - Clicking an alternative video updates the player instantly (`player.loadVideoById(newVideoId)`) and persists the preference!

---

## 4. Quota Economics & Safety Analysis

- **YouTube Search Quota Cost**: 100 units per search.
- **Free Quota**: 10,000 units/day = 100 searches/day.
- **Why our design NEVER breaks or hits limits**:
  1. **30-Day Database Cache**: If 100 students take the Front-End Developer roadmap, only the first generation calls YouTube (100 units). The remaining 99 students use the cache (**0 units consumed**).
  2. **Curated Fallback Registry**: If the user runs without an API key or exhausts quota, the fallback registry steps in seamlessly.
  3. **Task-Level Persistence**: Once a task is saved in MongoDB, its video ID is stored permanently on `RoadmapTask.resource.url`. Repeated watches cost **0 units**.

---

## 5. Verification Plan

### Automated Tests
Create `server/test_youtube_service.js`:
1. **Curated Registry Test**:
   - Call `youtubeService.getBestVideoForSkill('react')` without API key -> Assert valid YouTube `watch?v=...` URL returned with title and channel.
2. **Cache Storage & Retrieval Test**:
   - Query a mock video -> verify it is stored in `YoutubeCache`.
   - Query the same key again -> verify it is retrieved from MongoDB cache with `isCached: true`.
3. **Embeddability Assertion**:
   - Verify all returned video URLs match YouTube 11-character video ID regex (`watch?v=XXXXXXXXXXX` or `embed/XXXXXXXXXXX`).

### Manual UI Verification
1. Open `http://localhost:5500/roadmap.html`.
2. Click **"Enter Focus Video Chamber"** on any task.
3. **Verify**: An authentic educational video loads and plays immediately inside the embedded player (no search query error!).
4. Click **"Switch Instructor"**:
   - Alternative high-rated YouTube tutorials appear (e.g. freeCodeCamp, Traversy Media, Programming with Mosh).
   - Selecting a different instructor smoothly reloads the player with the chosen video.
