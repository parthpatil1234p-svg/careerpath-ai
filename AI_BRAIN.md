# AI Brain — CareerPath AI Durable Memory

## Project Overview
CareerPath AI is an AI-powered career navigation atlas for students and fresh graduates, developed for **Hack2Ignite 2026–27 (Round 1)** by **Team 404 Brain Not Found**.

## Key URLs
- **Vercel Frontend**: `https://careerpath-ai-jade.vercel.app`
- **Render Backend**: `https://careerpath-ai-bdbt.onrender.com`
- **GitHub Repository**: `https://github.com/parthpatil1234p-svg/careerpath-ai.git` (branch: `main`)

## Core System Architecture
### 1. Client (`client/`)
- `js/config.js`: Detects localhost vs production; sets `API_BASE_URL` (`http://localhost:5000/api` vs `https://careerpath-ai-bdbt.onrender.com/api`).
- `js/api.js`: Universal fetch wrapper with token injection, timeout and network recovery messaging.
- `js/auth.js`: Token & user profile storage in `localStorage`.
- `register.html` & `js/register.js`: 2-step onboarding with 6-digit OTP boxes, auto-advance, direct `?verify=true&email=...` query support, and real-time Gmail inbox delivery.
- `login.html` & `js/login.js`: Student login; detects 403 unverified accounts and provides instant OTP redirection.
- `assessment.html`: Multi-category student assessment collecting skills, domain interests, and soft skills.
- `recommendations.html`: 60/25/15 career-fit evaluation, dynamic roadmaps, and live jobs modal via aidevboard API.
- `roadmap.html`: Interactive 4, 8, or 12-week roadmaps with checkboxes and documentation references.
- `chat.html`: Dual-engine AI Career Mentor with stream/markdown parsing.
- `favicon.svg` & `favicon.ico`: High-DPI glowing neon cyan/purple tech compass icon linked across all HTML templates.

### 2. Backend (`server/`)
- `server.js`: Express entry point, helmet, CORS (allows localhost and `*.vercel.app`), rate-limiting.
- `config/db.js`: Resilient MongoDB Atlas connector (non-crashing if network drops).
- `models/User.js`: User schema with `isVerified` and `verificationOtp: { code, expiresAt }`.
- `controllers/authController.js`: Registration, OTP generation, verification, resend, login.
- `services/emailService.js`: Nodemailer with Gmail SMTP and dark-mode HTML template.
- `services/jobBoardService.js`: Integration with `aidevboard.com/api/v1/jobs` with failover caching.
- `services/aiService.js`: Dual-engine AI pipeline (Groq primary, Gemini fallback, curated static fallback).

## Known Gotchas & Decisions
- **Render Free Tier Cold Starts**: Takes ~30-50s to spin up if dormant. Frontend displays friendly advisory instead of generic errors.
- **MongoDB Atlas Whitelist**: Ensure `0.0.0.0/0` is set on Atlas to allow Render containers to connect without IP blocking.
- **Gmail App Passwords**: Used for Nodemailer (`EMAIL_PASS=vxwvvhrcgjbtedam`).
