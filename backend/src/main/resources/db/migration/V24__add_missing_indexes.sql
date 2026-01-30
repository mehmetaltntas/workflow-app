-- V24: Sık sorgulanan kolonlara eksik index'leri ekle

-- subtasks.task_id — PostgreSQL FK'ya otomatik index oluşturmaz
CREATE INDEX IF NOT EXISTS idx_subtasks_task_id ON subtasks(task_id);

-- boards.board_type — getMyTeamBoards(), filtreleme sorguları
CREATE INDEX IF NOT EXISTS idx_boards_board_type ON boards(board_type);

-- boards.status — durum filtreleme, istatistik sorguları
CREATE INDEX IF NOT EXISTS idx_boards_status ON boards(status);

-- tasks.due_date — takvim sayfası sorguları
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);

-- task_lists.due_date — takvim sayfası sorguları
CREATE INDEX IF NOT EXISTS idx_task_lists_due_date ON task_lists(due_date);

-- Case-insensitive email arama için fonksiyonel index
CREATE INDEX IF NOT EXISTS idx_users_email_lower ON users(LOWER(email));
