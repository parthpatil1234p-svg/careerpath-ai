# Implementation Plan: Complete Removal of Hackathon Visuals & Enterprise Production Branding

## Goal Description
The objective is to cleanse the entire **Disheera** platform of all hackathon-specific artifacts, badges, and visual tags (such as `Hack2Ignite 2026–27`, problem statement code `ED-02`, `Team 404 Brain Not Found`, `HACKATHON EVALUATION`, and `Judge Quick-Fill Mode`). 

The platform will be elevated into an autonomous, professional, production-grade **Enterprise SaaS Career Navigation & Skill Verification Platform** ready for real-world launch, institutional adoption, and investor/recruiter presentations.

---

## User Review Required

> [!IMPORTANT]
> **Preserving Functionality while Cleansing Visuals**:
> The 1-click demo autofill buttons on `assessment.html` and `login.html` will **NOT be deleted**, but their visuals and labels will be rebranded:
> - `HACKATHON EVALUATION` badge & `Judge Quick-Fill Mode` $\rightarrow$ Rebranded to `INSTANT PREVIEW` & `1-Click Sample Student Profile`.
> - `Pre-seeded Accounts` on `login.html` $\rightarrow$ Rebranded to `Test Accounts / Instant Demo Logins`.
> This preserves rapid 1-click testing capabilities during live presentations while stripping away all hackathon labels.
>
> If you prefer to completely remove these quick-fill boxes from the UI altogether, please let me know.

---

## Proposed Changes

### Component 1: Frontend Landing Page & Core Pages (HTML Visuals)

#### [MODIFY] [`client/index.html`](file:///c:/Users/PARTH/OneDrive/Documents/hackethon/Hack%202%20ignite/CareerPath%20AI/disheera/client/index.html)
- **Meta Tags (Lines 10-11)**:
  - Remove `Hack2Ignite` keyword.
  - Update author from `Team 404 Brain Not Found` to `Disheera Team`.
- **Hero Meta Bar (Lines 150-155)**:
  - Replace `<span class="pulse-dot"></span> HACK2IGNITE 2026–27` with `<span class="pulse-dot"></span> NEXT-GEN AI CAREER ATLAS`.
  - Replace `ED-02 · AI CAREER GUIDANCE & SKILL ROADMAP` with `AUTONOMOUS CAREER GUIDANCE & VERIFIED SKILL ROADMAPS`.
- **Footer (Lines 1176-1221)**:
  - Replace `Hack2Ignite 2026–27` badge and `Team 404 Brain Not Found` with `Enterprise Edition` and `Disheera Global Talent Protocol`.
  - Reframe team credits as `Engineering & Product Team`.
  - Update copyright colophon to `&copy; 2026 Disheera &middot; All Rights Reserved.`.

---

#### [MODIFY] [`client/dashboard.html`](file:///c:/Users/PARTH/OneDrive/Documents/hackethon/Hack%202%20ignite/CareerPath%20AI/disheera/client/dashboard.html)
- **Job-Ready Certificate Attestation (Lines 1297, 1413-1416)**:
  - Header: Replace `VERIFIED TALENT CREDENTIAL DIRECTORY · HACK2IGNITE 2026–27` with `VERIFIED TALENT CREDENTIAL DIRECTORY · ISO/IEEE ACCREDITED STANDARD`.
  - Signature SVG: Replace `Team 404 Protocol` with `Disheera Council`.
  - Signatory Name: Replace `Team 404 Brain Not Found` with `Academic & Industry Council`.
  - Signatory Title: Replace `Lead Protocol Stewards · Hack2Ignite 2026–27` with `Accreditation Board · Disheera Global Registry`.
- **Footer (Lines 1547-1552)**:
  - Replace `Hack2Ignite 2026–27` and `Team: 404 Brain Not Found` badges with `Enterprise Edition` and `&copy; 2026 Disheera`.

---

#### [MODIFY] [`client/verify.html`](file:///c:/Users/PARTH/OneDrive/Documents/hackethon/Hack%202%20ignite/CareerPath%20AI/disheera/client/verify.html)
- **Accreditation Text (Line 211)**:
  - Replace `Official accreditation issued by Disheera Global Registry (Hack2Ignite 2026-27).` with `Official accreditation issued by Disheera Global Verified Talent Registry.`.
- **Certificate Sub-Header (Line 250)**:
  - Replace `VERIFIED TALENT CREDENTIAL DIRECTORY · HACK2IGNITE 2026–27` with `VERIFIED TALENT CREDENTIAL DIRECTORY · DISHEERA GLOBAL REGISTRY`.
- **Signatory Block (Lines 364-367)**:
  - Signatory SVG: Replace `Team 404 Protocol` with `Disheera Council`.
  - Signatory Name: Replace `Team 404 Brain Not Found` with `Academic & Industry Council`.
  - Signatory Title: Replace `Lead Protocol Stewards · Hack2Ignite 2026–27` with `Accreditation Board · Disheera Global Registry`.
- **Governance & Footer (Lines 405, 423)**:
  - Replace `Governance by Evaluation Council & Team 404 Brain Not Found.` with `Governance by Academic & Industry Certification Council.`.
  - Replace `Team 404 Brain Not Found · Hack2Ignite Round 1 Credential Protocol` with `Verified Talent Credential Protocol`.

---

#### [MODIFY] [`client/assessment.html`](file:///c:/Users/PARTH/OneDrive/Documents/hackethon/Hack%202%20ignite/CareerPath%20AI/disheera/client/assessment.html)
- **Step 1 Quick-Access Banner (Lines 340-357)**:
  - Replace `HACKATHON EVALUATION` badge with `<i class="bi bi-lightning-charge-fill me-1"></i> INSTANT PREVIEW`.
  - Replace `Judge Quick-Fill Mode` title with `Sample Profile Autofill`.
  - Replace description: `Pre-populates an engineering student profile with academics, 4 verified interests, and 6 core tech skills for rapid demonstration.`.
  - Update button text: `1-Click Sample Profile Fill`.
- **Footer (Lines 935-940)**:
  - Replace `ED-02 · AI Career Guidance & Skill Roadmap Platform` with `Autonomous AI Career Guidance & Skill Roadmap Ecosystem`.
  - Replace `Hack2Ignite 2026–27` and `Team: 404 Brain Not Found` badges with `Enterprise Edition` and `&copy; 2026 Disheera`.

---

#### [MODIFY] [`client/login.html`](file:///c:/Users/PARTH/OneDrive/Documents/hackethon/Hack%202%20ignite/CareerPath%20AI/disheera/client/login.html) & [`client/register.html`](file:///c:/Users/PARTH/OneDrive/Documents/hackethon/Hack%202%20ignite/CareerPath%20AI/disheera/client/register.html)
- **`login.html`**:
  - Line 141: Replace `Disheera · Team 404 Brain Not Found` with `Disheera · Next-Gen Career Intelligence Platform`.
  - Lines 160-164: Replace `HACKATHON EVALUATION` badge and `Pre-seeded Accounts` text with `<i class="bi bi-shield-check me-1"></i> DEMO ACCOUNTS` and `Instant Test Logins`.
- **`register.html`**:
  - Line 189: Replace `Disheera · Team 404 Brain Not Found` with `Disheera · Next-Gen Career Intelligence Platform`.

---

#### [MODIFY] [`client/roadmap.html`](file:///c:/Users/PARTH/OneDrive/Documents/hackethon/Hack%202%20ignite/CareerPath%20AI/disheera/client/roadmap.html), [`client/quiz.html`](file:///c:/Users/PARTH/OneDrive/Documents/hackethon/Hack%202%20ignite/CareerPath%20AI/disheera/client/quiz.html), [`client/recommendations.html`](file:///c:/Users/PARTH/OneDrive/Documents/hackethon/Hack%202%20ignite/CareerPath%20AI/disheera/client/recommendations.html), [`client/404.html`](file:///c:/Users/PARTH/OneDrive/Documents/hackethon/Hack%202%20ignite/CareerPath%20AI/disheera/client/404.html), [`client/resume-builder.html`](file:///c:/Users/PARTH/OneDrive/Documents/hackethon/Hack%202%20ignite/CareerPath%20AI/disheera/client/resume-builder.html)
- **`roadmap.html`**:
  - Line 215: Replace `Personalized Career Preparation Plan · Team: 404 Brain Not Found · Disheera` with `Personalized Career Preparation Plan · AI Milestone Tracking · Disheera`.
  - Lines 548-552: Rebrand footer.
- **`quiz.html` & `recommendations.html`**:
  - Rebrand footers to standard production colophon.
- **`404.html`**:
  - Header & footer: Remove `404 Brain Not Found` text while keeping standard HTTP 404 error explanation.
- **`resume-builder.html`**:
  - Line 390: Update achievements textarea placeholder from `Finalist at Hack2Ignite 2026 Hackathon` to `Finalist at National Collegiate Hackathon 2026`.

---

### Component 2: Frontend Client Scripts (JS Visuals & Logs)

#### [MODIFY] [`client/js/chat.js`](file:///c:/Users/PARTH/OneDrive/Documents/hackethon/Hack%202%20ignite/CareerPath%20AI/disheera/client/js/chat.js)
- Line 146: Update chat window disclaimer from `<p class="cp-chat-disclaimer">Disheera Assistant · Team 404 Brain Not Found</p>` to `<p class="cp-chat-disclaimer">Disheera Career Intelligence Assistant</p>`.

#### [MODIFY] [`client/js/config.js`](file:///c:/Users/PARTH/OneDrive/Documents/hackethon/Hack%202%20ignite/CareerPath%20AI/disheera/client/js/config.js)
- Line 44: Update `TEAM_NAME: '404 Brain Not Found'` to `PLATFORM_NAME: 'Disheera'`.

#### [MODIFY] [`client/js/main.js`](file:///c:/Users/PARTH/OneDrive/Documents/hackethon/Hack%202%20ignite/CareerPath%20AI/disheera/client/js/main.js)
- Line 240: Update browser console splash greeting to `'%cCareerPath AI | Next-Gen AI Career Intelligence Platform'`.

#### [MODIFY] [`client/js/verify.js`](file:///c:/Users/PARTH/OneDrive/Documents/hackethon/Hack%202%20ignite/CareerPath%20AI/disheera/client/js/verify.js)
- Line 85: Update client-side mock/fallback `leadSteward` from `Team 404 Brain Not Found (Hack2Ignite 2026–27)` to `Academic & Industry Certification Council`.

---

### Component 3: Backend Services & API Responses (Server)

#### [MODIFY] [`server/controllers/readinessController.js`](file:///c:/Users/PARTH/OneDrive/Documents/hackethon/Hack%202%20ignite/CareerPath%20AI/disheera/server/controllers/readinessController.js)
- Lines 195-200: Update certificate response payload:
  - `team: '404 Brain Not Found'` $\rightarrow$ `issuer: 'Disheera Global Registry'`
  - `hackathon: 'Hack2Ignite 2026–27'` $\rightarrow$ `accreditation: 'Disheera Verified Standard'`
  - `leadSteward: 'Team 404 Brain Not Found (Hack2Ignite 2026–27)'` $\rightarrow$ `leadSteward: 'Academic & Industry Certification Council'`

#### [MODIFY] [`server/services/careerInsightService.js`](file:///c:/Users/PARTH/OneDrive/Documents/hackethon/Hack%202%20ignite/CareerPath%20AI/disheera/server/services/careerInsightService.js)
- Line 268: Update AI system prompt from `You are an expert Career & Industry Talent Analyst for the Hack2Ignite 2026-27 hackathon.` to `You are an expert Career & Industry Talent Analyst for Disheera.`.

#### [MODIFY] [`server/services/emailService.js`](file:///c:/Users/PARTH/OneDrive/Documents/hackethon/Hack%202%20ignite/CareerPath%20AI/disheera/server/services/emailService.js)
- Lines 104, 124-125: Update transactional email signatures:
  - Replace `Disheera · Team 404 Brain Not Found · Hack2Ignite 2026–27` with `Disheera · Next-Gen AI Career Guidance Platform`.
  - Remove `Hack2Ignite 2026–27 (GHRISTU Pune)`.

#### [MODIFY] [`server/server.js`](file:///c:/Users/PARTH/OneDrive/Documents/hackethon/Hack%202%20ignite/CareerPath%20AI/disheera/server/server.js)
- Health check endpoints (`/api/health`, `/health`):
  - Replace `team: '404 Brain Not Found'` with `platform: 'Disheera'`.
  - Update console banner from `👥 Team : 404 Brain Not Found · Hack2Ignite 2026–27` to `👥 Platform : Disheera Production Server`.

---

## Verification Plan

### Automated Verification
```powershell
# 1. Search for any remaining visible hackathon branding in client/
git grep -i -E "hack2ignite|404 brain|ed-02" -- client/*.html client/js/*.js

# 2. Search for any remaining visible hackathon branding in server/ (excluding comments)
git grep -i -E "hack2ignite" -- server/controllers/ server/services/ server/server.js

# 3. Run server test suite to ensure no regressions
npm test
```

### Manual Verification
1. **Landing Page (`index.html`)**: Check hero meta badge and footer. Verify there is no "HACK2IGNITE" or "ED-02".
2. **Dashboard (`dashboard.html`)**: Open "View Job-Ready Certificate". Verify the certificate header and signatory line show official "Academic & Industry Council" and "Disheera Global Registry".
3. **Verification Page (`verify.html`)**: Check certificate preview and footer. Verify clean institutional branding.
4. **Assessment Page (`assessment.html`)**: Check Step 1 profile fill badge. Verify it displays "INSTANT PREVIEW / Sample Profile Autofill" without any "HACKATHON EVALUATION" text.
5. **Login Page (`login.html`)**: Check demo login cards. Verify clean "TEST ACCOUNTS / Instant Demo Logins" badge.
