-- V13: Sync existing database schema with current entity definitions
-- The original tables were created by ddl-auto before Flyway was introduced.
-- V1 baseline used IF NOT EXISTS, so existing tables were not updated.
-- This migration adds all missing columns.

-- ===============================
-- boards table
-- ===============================
ALTER TABLE boards ADD COLUMN IF NOT EXISTS version BIGINT NOT NULL DEFAULT 0;
ALTER TABLE boards ADD COLUMN IF NOT EXISTS category VARCHAR(255);
ALTER TABLE boards ADD COLUMN IF NOT EXISTS created_at TIMESTAMP;
-- Widen description from VARCHAR(105) to VARCHAR(500) if needed
ALTER TABLE boards ALTER COLUMN description TYPE VARCHAR(500);

-- ===============================
-- tasks table
-- ===============================
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS version BIGINT NOT NULL DEFAULT 0;

-- ===============================
-- subtasks table
-- ===============================
ALTER TABLE subtasks ADD COLUMN IF NOT EXISTS version BIGINT NOT NULL DEFAULT 0;
ALTER TABLE subtasks ADD COLUMN IF NOT EXISTS description VARCHAR(100);
ALTER TABLE subtasks ADD COLUMN IF NOT EXISTS link VARCHAR(500);
ALTER TABLE subtasks ADD COLUMN IF NOT EXISTS created_at TIMESTAMP;

-- ===============================
-- task_lists table
-- ===============================
ALTER TABLE task_lists ADD COLUMN IF NOT EXISTS version BIGINT NOT NULL DEFAULT 0;
ALTER TABLE task_lists ADD COLUMN IF NOT EXISTS description VARCHAR(100);
ALTER TABLE task_lists ADD COLUMN IF NOT EXISTS due_date DATE;
ALTER TABLE task_lists ADD COLUMN IF NOT EXISTS priority VARCHAR(255);
ALTER TABLE task_lists ADD COLUMN IF NOT EXISTS created_at TIMESTAMP;

-- ===============================
-- labels table
-- ===============================
ALTER TABLE labels ADD COLUMN IF NOT EXISTS version BIGINT NOT NULL DEFAULT 0;

-- ===============================
-- users table
-- ===============================
ALTER TABLE users ADD COLUMN IF NOT EXISTS version BIGINT NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(255) NOT NULL DEFAULT 'LOCAL';
