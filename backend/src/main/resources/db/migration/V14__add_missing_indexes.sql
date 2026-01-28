-- Add missing database indexes for performance optimization

-- tasks.assignee_id - FK index for user assignment lookups
CREATE INDEX IF NOT EXISTS idx_tasks_assignee_id ON tasks(assignee_id);

-- password_reset_tokens.user_id - index for token lookups by user
CREATE INDEX IF NOT EXISTS idx_prt_user_id ON password_reset_tokens(user_id);

-- labels.board_id - index for label lookups by board
CREATE INDEX IF NOT EXISTS idx_labels_board_id ON labels(board_id);

-- notifications(recipient_id, type) - composite index for type-filtered queries
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_type ON notifications(recipient_id, type);

-- email_verification_tokens.email - index for verification lookups by email
CREATE INDEX IF NOT EXISTS idx_evt_email ON email_verification_tokens(email);
