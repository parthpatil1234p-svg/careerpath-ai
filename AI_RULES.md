# AI Operating Rules & Project Standards

## Architecture & Tech Stack
- **Frontend**: Vanilla HTML5, CSS3, JavaScript (ES6+), Bootstrap 5.3, Bootstrap Icons, Three.js hero globe.
- **Backend**: Node.js, Express 4.x, MongoDB Atlas with Mongoose.
- **Dual AI Engine**: Groq (Llama 3.3 70B) primary + Google Gemini (2.0 Flash) fallback.
- **Telemetry**: Live developer job board integration via `aidevboard.com`.
- **Authentication**: JWT Bearer auth, bcrypt password hashing, 6-digit OTP verification via Gmail SMTP with demo autofill helper.

## Operational Directives
1. **Never break existing code**: Make surgical edits; maintain backwards compatibility with existing endpoints and localStorage schemas.
2. **Fail-Safe Principle**: All external APIs (email, AI models, job board) must have non-blocking fallbacks/caches to ensure zero demo crashes during hackathon pitch.
3. **Deployment Topology**:
   - Frontend: Vercel (`https://careerpath-ai-jade.vercel.app`)
   - Backend: Render (`https://careerpath-ai-bdbt.onrender.com`)
   - Database: MongoDB Atlas (Cluster0)
4. **Git Hygiene**: Always commit clean, structured commits directly to `main` and keep remote GitHub synchronized.
