-- V23: NOT NULL kısıtlamalar ve DEFAULT değerler ekle

-- Önce mevcut NULL değerleri doldur
UPDATE boards SET created_at = NOW() WHERE created_at IS NULL;
UPDATE tasks SET created_at = NOW() WHERE created_at IS NULL;

-- boards tablosu
ALTER TABLE boards ALTER COLUMN name SET NOT NULL;
ALTER TABLE boards ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE boards ALTER COLUMN created_at SET DEFAULT NOW();
ALTER TABLE boards ALTER COLUMN created_at SET NOT NULL;

-- task_lists tablosu
ALTER TABLE task_lists ALTER COLUMN name SET NOT NULL;
ALTER TABLE task_lists ALTER COLUMN board_id SET NOT NULL;

-- tasks tablosu
ALTER TABLE tasks ALTER COLUMN title SET NOT NULL;
ALTER TABLE tasks ALTER COLUMN task_list_id SET NOT NULL;
ALTER TABLE tasks ALTER COLUMN created_at SET DEFAULT NOW();
ALTER TABLE tasks ALTER COLUMN created_at SET NOT NULL;

-- user_profile_pictures tablosu (file_path olmayan kayıtları sil)
DELETE FROM user_profile_pictures WHERE file_path IS NULL;
ALTER TABLE user_profile_pictures ALTER COLUMN file_path SET NOT NULL;
