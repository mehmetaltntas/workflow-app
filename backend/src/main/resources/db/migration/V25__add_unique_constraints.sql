-- V25: Board bazında unique kısıtlamalar ekle

ALTER TABLE labels ADD CONSTRAINT uq_labels_board_name UNIQUE (board_id, name);
ALTER TABLE task_lists ADD CONSTRAINT uq_task_lists_board_name UNIQUE (board_id, name);
