-- V17: Add missing version column to board_member_assignments table (optimistic locking)
ALTER TABLE board_member_assignments ADD COLUMN IF NOT EXISTS version BIGINT NOT NULL DEFAULT 0;
