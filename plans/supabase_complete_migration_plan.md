# CareerPath AI — Complete MongoDB to Supabase (PostgreSQL) Migration Plan

> **Platform**: CareerPath AI Technologies Inc.  
> **Target Database**: Supabase PostgreSQL (Project ID: `naefjieafxfdzliphaxb`)  
> **ORM Engine**: Prisma ORM  
> **Status**: ✅ Fully Implemented (Plan #37)  
> **Tracking File**: [`careerpath-ai/plans/supabase_complete_migration_plan.md`](./supabase_complete_migration_plan.md)  

---

## 1. Executive Summary & Goal Description

CareerPath AI is transitioning its persistent database layer from **MongoDB Atlas (NoSQL)** to **Supabase (PostgreSQL)** using **Prisma ORM**. 

### Why Supabase PostgreSQL?
1. **Relational Integrity**: Strict foreign key constraints and referential cascades prevent orphan records across roadmaps, tasks, attempts, and job applications.
2. **Partial Unique Indexes**: Native PostgreSQL partial indexes allow database-level enforcement of business rules (e.g., at most one `active` roadmap per user).
3. **JSONB Power**: Complex subdocuments (quizzes, resume structures, encrypted vaults, and attempt logs) map directly to PostgreSQL `Json` columns, combining relational reliability with document flexibility.
4. **Zero-Delay Auth & Serverless Compatibility**: Supabase connection poolers (Transaction / Session modes) enable instant connection reuse for Vercel Serverless and Render persistent runtimes without socket exhaustion.

### Supabase Project Configuration:
- **`DATABASE_URL`**: `postgresql://postgres:[PASSWORD]@db.naefjieafxfdzliphaxb.supabase.co:5432/postgres` (configured in `server/.env`)
- **`SUPABASE_URL`**: `https://naefjieafxfdzliphaxb.supabase.co`
- **`SUPABASE_ANON_KEY`**: `[CONFIGURED_IN_SERVER_ENV]`
- **`SUPABASE_SECRET_KEY`**: `[CONFIGURED_IN_SERVER_ENV]`
- **`SUPABASE_JWKS_URL`**: `https://naefjieafxfdzliphaxb.supabase.co/auth/v1/.well-known/jwks.json`

---

## 2. User Review Required & Safety Measures

> [!IMPORTANT]
> **Git Safety First**: Before any schema modification, dependencies, or scripts are added, we will create and switch to a dedicated Git branch:
> ```bash
> git checkout -b feature/supabase-migration
> ```
> This ensures `main` remains untouched until migration is 100% verified.

> [!IMPORTANT]
> **Zero Password Invalidation (Bcrypt Integrity)**:
> MongoDB stores passwords hashed with `bcrypt` (salt rounds 12). The migration script transfers these exact raw hash strings directly into the PostgreSQL `password` column without re-hashing or decoding. Existing user passwords will work identically without needing password resets.

> [!TIP]
> **ID Mapping Strategy**:
> We will configure `id String @id` in Prisma rather than auto-incrementing integers. This allows the migration script to copy the existing 24-character hexadecimal MongoDB `_id` values directly as primary keys. All existing JWT tokens, local storage references, and foreign key relations will remain completely valid with zero translation overhead.

---

## 3. The 12 Models Mapping Architecture

All 12 MongoDB models will be mapped to a clean Prisma schema (`server/prisma/schema.prisma`):

```mermaid
erDiagram
    User ||--o{ Roadmap : "owns"
    User ||--o{ Attempt : "records"
    User ||--o| Resume : "has one"
    User ||--o{ JobOpening : "posts (as recruiter)"
    User ||--o{ JobApplication : "applies (as student)"
    Career ||--o{ Roadmap : "blueprint for"
    Roadmap ||--o{ RoadmapTask : "contains"
    Roadmap ||--o{ Attempt : "tracks"
    Company ||--o{ JobOpening : "offers"
    JobOpening ||--o{ JobApplication : "receives"
    Skill ||--o{ Career : "required by"
    YoutubeCache ||--o{ RoadmapTask : "caches videos"
    CampusLead }|..|| User : "partner intake"
```

### Detailed Relational Model Specifications:

#### 1. `User`
- **Primary Columns**: `id` (String `@id`), `name` (String), `email` (String `@unique`), `password` (String?), `googleId` (String? `@unique`), `githubId` (String? `@unique`), `authProvider` (String `@default("local")`), `role` (String `@default("student")`), `primaryStream` (String `@default("engineering")`), `avatarUrl` (String?), `resumeUrl` (String?), `profileCompleted` (Boolean `@default(false)`), `isVerified` (Boolean `@default(false)`), `hasCompletedSkillVerification` (Boolean `@default(false)`), `lastAbandonedRouteAt` (DateTime?).
- **JSONB Columns**: `education`, `interests`, `skills`, `careerGoals`, `githubProfile`, `githubRepos`, `recruiterProfile`, `resumeRecord`, `completedPaths`, `profileStatus`, `resumeAnalysis`, `mockInterview`, `jobReadiness`, `builtResume`, `verificationOtp`, `encryptedVault`.
- **Timestamps**: `createdAt` (DateTime `@default(now())`), `updatedAt` (DateTime `@updatedAt`).

#### 2. `Roadmap`
- **Primary Columns**: `id` (String `@id`), `userId` (String `@relation`), `careerId` (String `@relation`), `durationWeeks` (Int `@default(4)`), `status` (String `@default("active")`), `abandonedAt` (DateTime?), `totalTasks` (Int `@default(0)`), `completedTasks` (Int `@default(0)`), `progressPercentage` (Float `@default(0)`), `startedAt` (DateTime `@default(now())`), `completedAt` (DateTime?).
- **JSONB Columns**: `careerSnapshot`, `generatedFrom`, `weekProgress`.
- **Special Constraint**: **PostgreSQL Partial Unique Index**:
  ```sql
  CREATE UNIQUE INDEX idx_single_active_route ON "Roadmap"("userId") WHERE status = 'active';
  ```

#### 3. `RoadmapTask`
- **Primary Columns**: `id` (String `@id`), `roadmapId` (String `@relation(onDelete: Cascade)`), `weekNumber` (Int), `order` (Int), `title` (String), `description` (String), `type` (String `@default("learn")`), `skillName` (String?), `priority` (String `@default("medium")`), `estimatedHours` (Int `@default(2)`), `completed` (Boolean `@default(false)`), `completedAt` (DateTime?), `isVideoTask` (Boolean `@default(false)`), `videoWatchTimeSeconds` (Int `@default(0)`), `videoDurationSeconds` (Int `@default(0)`).
- **JSONB Columns**: `resource`, `videoVerification`.

#### 4. `Career`
- **Primary Columns**: `id` (String `@id`), `title` (String `@unique`), `slug` (String `@unique`), `shortDescription` (String), `longDescription` (String), `category` (String), `icon` (String?), `color` (String?), `active` (Boolean `@default(true)`).
- **JSONB Columns**: `educationPreferences`, `interestTags`, `requiredSkills`.

#### 5. `Skill`
- **Primary Columns**: `id` (String `@id`), `name` (String `@unique`), `displayName` (String), `category` (String), `description` (String?), `active` (Boolean `@default(true)`).

#### 6. `Attempt`
- **Primary Columns**: `id` (String `@id`), `userId` (String `@relation`), `type` (String), `skill` (String?), `roadmapId` (String?), `roadmapWeek` (Int?), `score` (Float), `total` (Int), `percent` (Float), `passed` (Boolean `@default(false)`), `startTime` (DateTime), `deadline` (DateTime), `submitTime` (DateTime?).
- **JSONB Columns**: `topicTags`, `questionsAsked`, `missedTopics`, `integrityMetadata`.

#### 7. `Resume`
- **Primary Columns**: `id` (String `@id`), `userId` (String `@unique` `@relation`), `originalName` (String), `fileType` (String), `sizeBytes` (Int), `fileLocation` (String), `publicId` (String), `version` (Int `@default(1)`), `extractedText` (String?), `atsScore` (Float?), `firstUploadedAt` (DateTime), `lastUpdatedAt` (DateTime).

#### 8. `Company`
- **Primary Columns**: `id` (String `@id`), `name` (String), `domain` (String `@unique`), `website` (String?), `logoUrl` (String?), `industry` (String?), `headquarters` (String?), `companySize` (String?), `cinNumber` (String?), `linkedinUrl` (String?), `isVerified` (Boolean `@default(false)`), `verificationScore` (Float `@default(0)`).
- **JSONB Columns**: `verificationDetails`.

#### 9. `JobOpening`
- **Primary Columns**: `id` (String `@id`), `recruiterId` (String `@relation`), `companyId` (String `@relation`), `companyName` (String), `companyLogo` (String?), `companyWebsite` (String?), `isCompanyVerified` (Boolean `@default(true)`), `title` (String), `careerSlug` (String), `jobType` (String), `workplace` (String), `location` (String?), `experienceLevel` (String?), `salaryMin` (Float?), `salaryMax` (Float?), `salaryCurrency` (String?), `description` (String), `minimumReadinessScore` (Float?), `status` (String `@default("active")`), `applicationsCount` (Int `@default(0)`), `deadline` (DateTime?).
- **JSONB Columns**: `responsibilities`, `requiredSkills`.

#### 10. `JobApplication`
- **Primary Columns**: `id` (String `@id`), `jobId` (String `@relation`), `studentId` (String `@relation`), `recruiterId` (String `@relation`), `matchScore` (Float), `readinessTier` (String?), `resumeUrl` (String?), `coverNote` (String?), `status` (String `@default("applied")`), `recruiterNotes` (String?), `appliedAt` (DateTime).
- **JSONB Columns**: `matchedSkills`, `missingSkills`, `builtResumeSnapshot`.
- **Constraint**: `@@unique([jobId, studentId])`.

#### 11. `YoutubeCache`
- **Primary Columns**: `id` (String `@id`), `queryKey` (String `@unique`), `skillName` (String?), `source` (String `@default("curated_registry")`).
- **JSONB Columns**: `videos`.

#### 12. `CampusLead`
- **Primary Columns**: `id` (String `@id`), `collegeName` (String), `cityState` (String?), `contactPerson` (String), `designation` (String), `email` (String), `phone` (String), `batchSize` (String), `preferredDemoDate` (DateTime?), `source` (String), `voiceAiCallId` (String?), `status` (String `@default("new")`), `notes` (String?).

---

## 4. Proposed Changes & Implementation Phases

### Phase 1: Git Safety & Isolation
- Create and switch to `feature/supabase-migration`:
  ```powershell
  git checkout -b feature/supabase-migration
  ```

---

### Phase 2: Prisma ORM Installation & Schema Definition
- Install Prisma dependencies in `careerpath-ai/server`:
  ```powershell
  npm install @prisma/client
  npm install -D prisma
  ```
- [NEW] `server/prisma/schema.prisma` with all 12 models.
- Run `npx prisma db push` to generate all tables and constraints directly on the Supabase database.
- Execute SQL partial unique index:
  ```sql
  CREATE UNIQUE INDEX IF NOT EXISTS idx_single_active_route ON "Roadmap"("userId") WHERE status = 'active';
  ```
- Generate Prisma Client:
  ```powershell
  npx prisma generate
  ```

---

### Phase 3: Automated Data Migration Script (`scripts/migrate_mongo_to_supabase.js`)
- [NEW] `server/scripts/migrate_mongo_to_supabase.js`:
  1. Concurrently connects to MongoDB Atlas (`MONGODB_URI`) and Supabase PostgreSQL (`PrismaClient`).
  2. Migrates collections in strict dependency order:
     - Step 1: `Skill`
     - Step 2: `Career`
     - Step 3: `Company`
     - Step 4: `User` (transfers `password` bcrypt hashes unchanged)
     - Step 5: `Roadmap`
     - Step 6: `RoadmapTask`
     - Step 7: `Attempt`
     - Step 8: `Resume`
     - Step 9: `JobOpening`
     - Step 10: `JobApplication`
     - Step 11: `YoutubeCache`
     - Step 12: `CampusLead`
  3. Outputs clean progress counts and validation statistics.

---

### Phase 4: Database Client Singleton & Server Startup
- [NEW] `server/config/prisma.js`:
  Singleton Prisma client instance with error logging and connection health checking.
- [MODIFY] `server/server.js`:
  Verify Supabase PostgreSQL connection via `prisma.$connect()` on startup alongside or transitioning from MongoDB.

---

### Phase 5: Environment & Hygiene
- [MODIFY] `server/.env`:
  Append `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SECRET_KEY`, `SUPABASE_JWKS_URL`.
- [MODIFY] `server/.env.example`:
  Add placeholders for all Supabase variables.

---

### Phase 6: Comprehensive Verification Test Suite
- [NEW] `server/tests/supabase_migration_verification.js`:
  1. **Record Count Check**: Compares MongoDB vs. Supabase counts for all 12 collections.
  2. **Password Auth Check**: Verifies sample user password using `bcrypt.compare` against the Supabase row.
  3. **Relational Integrity Check**: Validates foreign key linkage (`User` $\rightarrow$ `Roadmap` $\rightarrow$ `RoadmapTasks`).
  4. **Single Active Route Constraint Check**: Tests inserting two `status: 'active'` roadmaps for the same user and confirms PostgreSQL rejects the second one.
  5. **Health Check**: Validates `/api/health` response.

---

## 5. Verification Plan

### Automated Tests:
```powershell
# 1. Verify Prisma Schema & Client Generation
npx prisma validate --schema=server/prisma/schema.prisma
npx prisma generate --schema=server/prisma/schema.prisma

# 2. Run Data Migration
node server/scripts/migrate_mongo_to_supabase.js

# 3. Run End-to-End Supabase Verification Suite
node server/tests/supabase_migration_verification.js

# 4. Syntax and Integrity Check
node --check server/server.js
```

### Manual Verification:
1. Start local server with `npm start` and verify `PostgreSQL (Supabase) Connected` in terminal logs.
2. Log into the web application via `client/login.html` using an existing account and verify immediate successful authentication.
3. Open `client/roadmap.html` and verify user's active roadmap, tasks, and progress load properly from Supabase.

---

## 6. Master Tracker Status Update

| # | Plan File | Plan Description | Status |
|:---:|---|---|:---:|
| **36** | [`hybrid_backend_architecture_plan.md`](./hybrid_backend_architecture_plan.md) | Hybrid Vercel REST + Render Real-Time + Shared Atlas DB | **✅ Yes (Implemented)** |
| **37** | [`supabase_complete_migration_plan.md`](./supabase_complete_migration_plan.md) | Complete MongoDB to Supabase (PostgreSQL) Migration with Prisma ORM | **✅ Yes (Implemented)** |
