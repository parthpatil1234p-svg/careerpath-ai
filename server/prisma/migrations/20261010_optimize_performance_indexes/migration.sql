-- ==============================================================================
-- Migration: 20261010_optimize_performance_indexes
-- Description: Add composite and covering indexes for main application read queries
--              and drop redundant duplicate single-column indexes.
-- Execution Safety: Uses CREATE INDEX CONCURRENTLY so live operations are not blocked.
-- Reversible: See rollback.sql to undo all changes.
-- ==============================================================================

-- ── 1. Roadmap & Tasks Performance Indexes ────────────────────────────────────
-- Speeds up: GET /api/dashboard & GET /api/roadmaps/current
-- Eliminates in-memory quicksort on createdAt and filters by active status directly.
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_roadmap_user_status_created"
ON "Roadmap" ("userId", "status", "createdAt" DESC);

-- Speeds up: GET /api/roadmaps/current & GET /api/roadmaps/:id
-- Provides presorted sequential access by week and task order with zero in-memory sort.
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_roadmaptask_roadmap_week_order"
ON "RoadmapTask" ("roadmapId", "weekNumber" ASC, "order" ASC);

-- Speeds up: GET /api/dashboard upcoming unfinished task queries (LIMIT 5).
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_roadmaptask_roadmap_completed_week_order"
ON "RoadmapTask" ("roadmapId", "completed", "weekNumber" ASC, "order" ASC);

-- ── 2. Recruiter Portal & Talent Radar Performance Indexes ────────────────────
-- Speeds up: GET /api/recruiter/jobs/:id/applicants (Candidate Talent Radar)
-- Eliminates sorting over hundreds of applications; streams candidates in descending match score.
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_jobapplication_job_matchscore_created"
ON "JobApplication" ("jobId", "matchScore" DESC, "createdAt" DESC);

-- Speeds up: GET /api/jobs/my-applications (Student applications list)
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_jobapplication_student_created"
ON "JobApplication" ("studentId", "createdAt" DESC);

-- Speeds up: GET /api/recruiter/jobs (Recruiter's posted openings list)
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_jobopening_recruiter_created"
ON "JobOpening" ("recruiterId", "createdAt" DESC);

-- ── 3. Milestone Test & Assessment Attempts Performance Indexes ───────────────
-- Speeds up: POST /api/roadmaps/milestone/start & GET /api/roadmaps/milestone/status
-- Resolves active test attempts and past attempt questions in a single index lookup.
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_attempt_user_roadmap_week_created"
ON "Attempt" ("userId", "roadmapId", "roadmapWeek", "createdAt" DESC);

-- Speeds up: Background cronService.validateSkillCurrency (180-day audit)
-- Replaces expensive Seq Scan (whole table scan) with an Index Scan on createdAt.
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_attempt_created_at"
ON "Attempt" ("createdAt" DESC);

-- ── 4. Skill Catalog & Taxonomy Performance Indexes ───────────────────────────
-- Speeds up: GET /api/skills?category=... (Skill assessment and explorer)
-- Eliminates quicksort on displayName by providing pre-ordered index traversal.
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_skill_active_category_displayname"
ON "Skill" ("active", "category", "displayName" ASC);

-- ── 5. Drop Redundant Duplicate Indexes (Unused & Slowing Down Writes) ─────────
-- These 6 indexes are exact single-column duplicates of existing UNIQUE constraints.
-- Removing them eliminates duplicate B-tree maintenance on every INSERT and UPDATE.
DROP INDEX CONCURRENTLY IF EXISTS "User_email_idx";
DROP INDEX CONCURRENTLY IF EXISTS "Resume_userId_idx";
DROP INDEX CONCURRENTLY IF EXISTS "Company_domain_idx";
DROP INDEX CONCURRENTLY IF EXISTS "Career_slug_idx";
DROP INDEX CONCURRENTLY IF EXISTS "Skill_name_idx";
DROP INDEX CONCURRENTLY IF EXISTS "YoutubeCache_queryKey_idx";
