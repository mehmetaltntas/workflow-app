-- V12: Create board_member_assignments table for task/list/subtask assignments

CREATE TABLE board_member_assignments (
    id BIGSERIAL PRIMARY KEY,
    board_member_id BIGINT NOT NULL,
    target_type VARCHAR(10) NOT NULL,
    target_id BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_bma_board_member FOREIGN KEY (board_member_id) REFERENCES board_members(id) ON DELETE CASCADE,
    CONSTRAINT uq_bma_member_target UNIQUE (board_member_id, target_type, target_id),
    CONSTRAINT chk_bma_target_type CHECK (target_type IN ('LIST', 'TASK', 'SUBTASK'))
);

CREATE INDEX idx_bma_board_member_id ON board_member_assignments(board_member_id);
CREATE INDEX idx_bma_target ON board_member_assignments(target_type, target_id);
