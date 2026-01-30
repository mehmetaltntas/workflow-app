-- V22: Add role column to board_members for moderator support
ALTER TABLE board_members ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'MEMBER';

-- Add check constraint for valid roles
ALTER TABLE board_members ADD CONSTRAINT board_members_role_check
    CHECK (role IN ('MEMBER', 'MODERATOR'));

-- Add index for efficient moderator counting per board
CREATE INDEX idx_board_members_board_role ON board_members (board_id, role);
