-- ==============================================================================
-- Rollback: 20261010_optimize_performance_indexes
-- Description: Undoes all changes from migration.sql:
--              Drops performance indexes and restores redundant single-column indexes.
-- Execution Safety: Uses DROP INDEX CONCURRENTLY and CREATE INDEX CONCURRENTLY.
-- ==============================================================================

-- ── 1. Drop Performance Indexes ───────────────────────────────────────────────
DROP INDEX CONCURRENTLY IF EXISTS "idx_roadmap_user_status_created";
DROP INDEX CONCURRENTLY IF EXISTS "idx_roadmaptask_roadmap_week_order";
DROP INDEX CONCURRENTLY IF EXISTS "idx_roadmaptask_roadmap_completed_week_order";
DROP INDEX CONCURRENTLY IF EXISTS "idx_jobapplication_job_matchscore_created";
DROP INDEX CONCURRENTLY IF EXISTS "idx_jobapplication_student_created";
DROP INDEX CONCURRENTLY IF EXISTS "idx_jobopening_recruiter_created";
DROP INDEX CONCURRENTLY IF EXISTS "idx_attempt_user_roadmap_week_created";
DROP INDEX CONCURRENTLY IF EXISTS "idx_attempt_created_at";
DROP INDEX CONCURRENTLY IF EXISTS "idx_skill_active_category_displayname";

-- ── 2. Restore Original Redundant Indexes ─────────────────────────────────────
CREATE INDEX CONCURRENTLY IF NOT EXISTS "User_email_idx" ON "User" (email);
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Resume_userId_idx" ON "Resume" ("userId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Company_domain_idx" ON "Company" (domain);
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Career_slug_idx" ON "Career" (slug);
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Skill_name_idx" ON "Skill" (name);
CREATE INDEX CONCURRENTLY IF NOT EXISTS "YoutubeCache_queryKey_idx" ON "YoutubeCache" ("queryKey");
