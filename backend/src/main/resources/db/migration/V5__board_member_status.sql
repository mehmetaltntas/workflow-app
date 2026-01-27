ALTER TABLE board_members ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'ACCEPTED';
CREATE INDEX IF NOT EXISTS idx_board_members_status ON board_members(status);
