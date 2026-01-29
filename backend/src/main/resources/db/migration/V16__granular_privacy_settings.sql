-- V16: Granular privacy settings (Detayli gizlilik ayarlari)

-- Step 1: Add privacy_mode column to users table
-- Values: HIDDEN (Gizli), PUBLIC (Herkese Acik), PRIVATE (Ozel - granular)
ALTER TABLE users ADD COLUMN privacy_mode VARCHAR(10) NOT NULL DEFAULT 'HIDDEN';

-- Step 2: Migrate existing data from is_profile_public
UPDATE users SET privacy_mode = CASE
    WHEN is_profile_public = TRUE THEN 'PUBLIC'
    ELSE 'HIDDEN'
END;

-- Step 3: Create granular privacy settings table (only used when privacy_mode = PRIVATE)
CREATE TABLE user_privacy_settings (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    version BIGINT NOT NULL DEFAULT 0,
    show_profile_picture BOOLEAN NOT NULL DEFAULT TRUE,
    show_overall_progress BOOLEAN NOT NULL DEFAULT TRUE,
    show_board_stats BOOLEAN NOT NULL DEFAULT TRUE,
    show_list_stats BOOLEAN NOT NULL DEFAULT TRUE,
    show_task_stats BOOLEAN NOT NULL DEFAULT TRUE,
    show_subtask_stats BOOLEAN NOT NULL DEFAULT TRUE,
    show_team_board_stats BOOLEAN NOT NULL DEFAULT TRUE,
    show_top_categories BOOLEAN NOT NULL DEFAULT TRUE,
    show_connection_count BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT fk_privacy_settings_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_privacy_settings_user_id ON user_privacy_settings(user_id);

-- Step 4: Add constraint for privacy_mode values
ALTER TABLE users ADD CONSTRAINT chk_privacy_mode CHECK (privacy_mode IN ('HIDDEN', 'PUBLIC', 'PRIVATE'));

-- Step 5: Drop old column
ALTER TABLE users DROP COLUMN is_profile_public;
