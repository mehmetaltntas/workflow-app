-- =============================================
-- V1__baseline.sql
-- Mevcut veritabanı şemasının Flyway baseline tanımı
-- Tüm entity sınıflarından türetilmiştir.
-- =============================================

-- ===============================
-- ENUM TİPLERİ (PostgreSQL)
-- ===============================
-- Hibernate @Enumerated(EnumType.STRING) kullanıldığı için
-- enum değerleri VARCHAR olarak saklanır, ayrı tip tanımlamaya gerek yok.

-- ===============================
-- TABLOLAR
-- ===============================

-- 1. Users tablosu
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255),
    email VARCHAR(255) UNIQUE,
    profile_picture TEXT,
    google_id VARCHAR(255) UNIQUE,
    auth_provider VARCHAR(255) NOT NULL DEFAULT 'LOCAL'
);

-- 2. Boards tablosu
CREATE TABLE IF NOT EXISTS boards (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255),
    status VARCHAR(255) DEFAULT 'PLANLANDI',
    link VARCHAR(255),
    description VARCHAR(500),
    deadline TIMESTAMP,
    category VARCHAR(255),
    slug VARCHAR(255) UNIQUE,
    created_at TIMESTAMP,
    user_id BIGINT,
    CONSTRAINT fk_boards_user FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 3. Labels tablosu
CREATE TABLE IF NOT EXISTS labels (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    color VARCHAR(255) NOT NULL,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    board_id BIGINT NOT NULL,
    CONSTRAINT fk_labels_board FOREIGN KEY (board_id) REFERENCES boards(id)
);

-- 4. Task Lists tablosu
CREATE TABLE IF NOT EXISTS task_lists (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255),
    description VARCHAR(100),
    link VARCHAR(255),
    is_completed BOOLEAN DEFAULT FALSE,
    due_date DATE,
    priority VARCHAR(255),
    created_at TIMESTAMP,
    board_id BIGINT,
    CONSTRAINT fk_task_lists_board FOREIGN KEY (board_id) REFERENCES boards(id)
);

-- 5. Tasks tablosu
CREATE TABLE IF NOT EXISTS tasks (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255),
    description VARCHAR(100),
    link VARCHAR(255),
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP,
    due_date DATE,
    priority VARCHAR(10) DEFAULT 'NONE',
    position INTEGER,
    task_list_id BIGINT,
    assignee_id BIGINT,
    CONSTRAINT fk_tasks_task_list FOREIGN KEY (task_list_id) REFERENCES task_lists(id),
    CONSTRAINT fk_tasks_assignee FOREIGN KEY (assignee_id) REFERENCES users(id)
);

-- 6. Subtasks tablosu
CREATE TABLE IF NOT EXISTS subtasks (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    position INTEGER DEFAULT 0,
    description VARCHAR(100),
    link VARCHAR(500),
    task_id BIGINT NOT NULL,
    CONSTRAINT fk_subtasks_task FOREIGN KEY (task_id) REFERENCES tasks(id)
);

-- 7. Refresh Tokens tablosu
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id BIGSERIAL PRIMARY KEY,
    token VARCHAR(255) NOT NULL UNIQUE,
    expiry_date TIMESTAMP WITH TIME ZONE NOT NULL,
    user_id BIGINT NOT NULL,
    CONSTRAINT fk_refresh_tokens_user FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 8. Password Reset Tokens tablosu
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(6) NOT NULL,
    user_id BIGINT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT fk_password_reset_tokens_user FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 9. Board Members tablosu
CREATE TABLE IF NOT EXISTS board_members (
    id BIGSERIAL PRIMARY KEY,
    version BIGINT NOT NULL DEFAULT 0,
    board_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_board_members_board FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE,
    CONSTRAINT fk_board_members_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT uq_board_members_board_user UNIQUE (board_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_board_members_board_id ON board_members(board_id);
CREATE INDEX IF NOT EXISTS idx_board_members_user_id ON board_members(user_id);

-- 10. Email Verification Tokens tablosu
CREATE TABLE IF NOT EXISTS email_verification_tokens (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    code VARCHAR(6) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used BOOLEAN NOT NULL DEFAULT FALSE
);

-- ===============================
-- JOIN TABLOLARI (Many-to-Many)
-- ===============================

-- Task - Label ilişkisi
CREATE TABLE IF NOT EXISTS task_labels (
    task_id BIGINT NOT NULL,
    label_id BIGINT NOT NULL,
    PRIMARY KEY (task_id, label_id),
    CONSTRAINT fk_task_labels_task FOREIGN KEY (task_id) REFERENCES tasks(id),
    CONSTRAINT fk_task_labels_label FOREIGN KEY (label_id) REFERENCES labels(id)
);

-- TaskList - Label ilişkisi
CREATE TABLE IF NOT EXISTS task_list_labels (
    task_list_id BIGINT NOT NULL,
    label_id BIGINT NOT NULL,
    PRIMARY KEY (task_list_id, label_id),
    CONSTRAINT fk_task_list_labels_task_list FOREIGN KEY (task_list_id) REFERENCES task_lists(id),
    CONSTRAINT fk_task_list_labels_label FOREIGN KEY (label_id) REFERENCES labels(id)
);

-- ===============================
-- INDEX TANIMLARI
-- ===============================
CREATE INDEX IF NOT EXISTS idx_boards_user_id ON boards(user_id);
CREATE INDEX IF NOT EXISTS idx_task_lists_board_id ON task_lists(board_id);
CREATE INDEX IF NOT EXISTS idx_tasks_task_list_id ON tasks(task_list_id);
CREATE INDEX IF NOT EXISTS idx_tasks_position ON tasks(position);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token);
