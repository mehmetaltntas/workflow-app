-- V27: Make remaining version columns nullable to match entity model (Long type)
-- V18 missed these 4 tables. Hibernate 7.2.1 strictly validates nullability.

ALTER TABLE board_members ALTER COLUMN version DROP NOT NULL;
ALTER TABLE connections ALTER COLUMN version DROP NOT NULL;
ALTER TABLE notifications ALTER COLUMN version DROP NOT NULL;
ALTER TABLE user_privacy_settings ALTER COLUMN version DROP NOT NULL;
