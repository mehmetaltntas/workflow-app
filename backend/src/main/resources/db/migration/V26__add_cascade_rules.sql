-- V26: Join tablolarına ON DELETE CASCADE kuralları ekle

-- task_labels
ALTER TABLE task_labels DROP CONSTRAINT IF EXISTS task_labels_task_id_fkey;
ALTER TABLE task_labels ADD CONSTRAINT task_labels_task_id_fkey
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE;

ALTER TABLE task_labels DROP CONSTRAINT IF EXISTS task_labels_label_id_fkey;
ALTER TABLE task_labels ADD CONSTRAINT task_labels_label_id_fkey
    FOREIGN KEY (label_id) REFERENCES labels(id) ON DELETE CASCADE;

-- task_list_labels
ALTER TABLE task_list_labels DROP CONSTRAINT IF EXISTS task_list_labels_task_list_id_fkey;
ALTER TABLE task_list_labels ADD CONSTRAINT task_list_labels_task_list_id_fkey
    FOREIGN KEY (task_list_id) REFERENCES task_lists(id) ON DELETE CASCADE;

ALTER TABLE task_list_labels DROP CONSTRAINT IF EXISTS task_list_labels_label_id_fkey;
ALTER TABLE task_list_labels ADD CONSTRAINT task_list_labels_label_id_fkey
    FOREIGN KEY (label_id) REFERENCES labels(id) ON DELETE CASCADE;

-- labels → boards
ALTER TABLE labels DROP CONSTRAINT IF EXISTS labels_board_id_fkey;
ALTER TABLE labels ADD CONSTRAINT labels_board_id_fkey
    FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE;

-- task_lists → boards
ALTER TABLE task_lists DROP CONSTRAINT IF EXISTS task_lists_board_id_fkey;
ALTER TABLE task_lists ADD CONSTRAINT task_lists_board_id_fkey
    FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE;

-- tasks → task_lists
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_task_list_id_fkey;
ALTER TABLE tasks ADD CONSTRAINT tasks_task_list_id_fkey
    FOREIGN KEY (task_list_id) REFERENCES task_lists(id) ON DELETE CASCADE;
