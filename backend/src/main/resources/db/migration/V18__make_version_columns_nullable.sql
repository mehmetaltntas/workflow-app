-- V18: Make version columns nullable to match entity model (Long type)
-- Hibernate 7.2.1 strictly validates nullability: Long is nullable in Java,
-- so the database column must also be nullable.

ALTER TABLE board_member_assignments ALTER COLUMN version DROP NOT NULL;
ALTER TABLE boards ALTER COLUMN version DROP NOT NULL;
ALTER TABLE tasks ALTER COLUMN version DROP NOT NULL;
ALTER TABLE subtasks ALTER COLUMN version DROP NOT NULL;
ALTER TABLE task_lists ALTER COLUMN version DROP NOT NULL;
ALTER TABLE labels ALTER COLUMN version DROP NOT NULL;
ALTER TABLE users ALTER COLUMN version DROP NOT NULL;
