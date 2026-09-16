# Application Flow
## CareerPath AI — Hack2Ignite 2026–27

---

## 1. High-Level User Journey

```mermaid
flowchart LR
    A[Landing Page<br/>3D Career Universe] --> B[Register / Login]
    B --> C[Onboarding<br/>Fill Profile]
    C --> D[Career Matching<br/>Engine Runs]
    D --> E[View Top 3<br/>Career Results]
    E --> F[Select Career →<br/>Skill-Gap Analysis]
    F --> G[Choose Timeline<br/>4 / 8 / 12 weeks]
    G --> H[Roadmap<br/>Generated]
    H --> I[Track Progress<br/>Complete Tasks]
```

---

## 2. Authentication Flow

```mermaid
sequenceDiagram
    actor Student
    participant FE as Frontend
    participant BE as Backend (Express)
    participant DB as MongoDB Atlas

    Note over Student,DB: === REGISTRATION ===
    Student->>FE: Fill name, email, password
    FE->>FE: Validate inputs (non-empty, email format, password ≥ 6 chars)
    FE->>BE: POST /api/auth/register { name, email, password }
    BE->>DB: Check if email already exists
    alt Email Already Registered
        BE-->>FE: 400 { error: "Email already in use" }
        FE-->>Student: Show error toast
    else New Email
        BE->>BE: Hash password (bcrypt, 10 rounds)
        BE->>DB: Insert new User document
        BE->>BE: Sign JWT with userId
        BE-->>FE: 201 { token, user: { id, name, email } }
        FE->>FE: Store token in localStorage
        FE-->>Student: Redirect to Onboarding
    end

    Note over Student,DB: === LOGIN ===
    Student->>FE: Enter email + password
    FE->>BE: POST /api/auth/login { email, password }
    BE->>DB: Find User by email
    alt User Not Found
        BE-->>FE: 401 { error: "Invalid credentials" }
    else User Found
        BE->>BE: bcrypt.compare(password, hash)
        alt Password Mismatch
            BE-->>FE: 401 { error: "Invalid credentials" }
        else Password Matches
            BE->>BE: Sign JWT
            BE-->>FE: 200 { token, user }
            FE->>FE: Store token, redirect to Dashboard
        end
    end
```

---

## 3. Onboarding → Career Matching Flow

```mermaid
flowchart TD
    A[Dashboard: Profile Incomplete] --> B[Step 1: Select Education Level]
    B --> C[Step 2: Select Skills + Rate Proficiency 1-5]
    C --> D[Step 3: Select Interest Tags]
    D --> E[Submit Profile]
    E --> F[PUT /api/users/profile]
    F --> G{Profile Saved?}
    G -- Yes --> H[POST /api/match/recommend]
    G -- No --> I[Show Validation Error]
    
    H --> J{Matching Engine}
    J --> K[Calculate Skill Score ×0.60]
    J --> L[Calculate Interest Score ×0.25]
    J --> M[Calculate Education Score ×0.15]
    
    K & L & M --> N[Aggregate: Total Score per Career]
    N --> O[Sort Descending]
    O --> P[Return Top 3 Careers with Scores]
    P --> Q[Render Career Cards / 3D Career Universe]
```

---

## 4. Skill-Gap → Roadmap Generation Flow

```mermaid
flowchart TD
    A[User Clicks on a Career Card] --> B[GET /api/careers/:id]
    B --> C[Display Career Detail Page]
    C --> D[Show Skill-Gap Analysis]
    
    D --> E{For Each Required Skill}
    E --> F[User Has Skill?]
    F -- Yes --> G[Proficiency ≥ Required?]
    G -- Yes --> H[✅ Green: Skill Met]
    G -- No --> I[⚠️ Yellow: Needs Improvement]
    F -- No --> J[🔴 Red: Missing Skill]
    
    H & I & J --> K[Calculate Readiness %]
    K --> L[User Chooses Timeline: 4 / 8 / 12 Weeks]
    L --> M[POST /api/roadmap/generate]
    
    M --> N{Roadmap Engine}
    N --> O[List All Gap Skills]
    O --> P[Sort: Foundational → Advanced]
    P --> Q[Distribute Tasks Across Weeks]
    Q --> R[Attach Resource Links]
    R --> S[Save Roadmap to DB]
    S --> T[Return Roadmap JSON]
    T --> U[Render Week-by-Week Task List + 3D Roadmap Path]
```

---

## 5. Progress Tracking Flow

```mermaid
sequenceDiagram
    actor Student
    participant FE as Frontend
    participant BE as Backend
    participant DB as MongoDB

    Student->>FE: Check a task checkbox
    FE->>BE: PUT /api/roadmap/:roadmapId/task/:taskId { isCompleted: true }
    BE->>DB: Update task's isCompleted flag
    BE->>BE: Recalculate overall progress %
    BE-->>FE: 200 { updatedProgress: 45 }
    FE->>FE: Update progress bar + 3D roadmap visual
    FE-->>Student: Show "Great job!" animation
```

---

## 6. Logout Flow

```mermaid
flowchart LR
    A[User Clicks Logout] --> B[Remove JWT from localStorage]
    B --> C[Redirect to Landing Page]
```

> **Note:** Since JWT is stateless, no server-side session invalidation is needed. Token simply expires after 24 hours.

---

## 7. Error States Summary

| Scenario | User Sees |
|----------|-----------|
| Invalid email/password on login | Red toast: "Invalid credentials" |
| Registration with existing email | Red toast: "Email already in use" |
| Expired/missing JWT on protected route | Redirect to login page |
| Empty profile fields on submit | Inline validation messages |
| API server unreachable | "Server unavailable, please try later" modal |
| 3D WebGL not supported | Automatic fallback to 2D CSS grid layout |
