-- V23: NOT NULL kısıtlamalar ve DEFAULT değerler ekle

-- boards tablosu
ALTER TABLE boards ALTER COLUMN name SET NOT NULL;
ALTER TABLE boards ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE boards ALTER COLUMN created_at SET NOT NULL;
ALTER TABLE boards ALTER COLUMN created_at SET DEFAULT NOW();

-- task_lists tablosu
ALTER TABLE task_lists ALTER COLUMN name SET NOT NULL;
ALTER TABLE task_lists ALTER COLUMN board_id SET NOT NULL;

-- tasks tablosu
ALTER TABLE tasks ALTER COLUMN title SET NOT NULL;
ALTER TABLE tasks ALTER COLUMN task_list_id SET NOT NULL;
ALTER TABLE tasks ALTER COLUMN created_at SET NOT NULL;
ALTER TABLE tasks ALTER COLUMN created_at SET DEFAULT NOW();

-- user_profile_pictures tablosu
ALTER TABLE user_profile_pictures ALTER COLUMN file_path SET NOT NULL;
