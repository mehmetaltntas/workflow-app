-- =============================================
-- V2__separate_profile_picture_table.sql
-- Profil resmini ayri tabloya tasir (performans iyilestirmesi).
-- Bu sayede her User sorgusu buyuk Base64 verisini cekmez.
-- =============================================

-- 1. Yeni tablo olustur
CREATE TABLE IF NOT EXISTS user_profile_pictures (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    picture_data TEXT,
    CONSTRAINT fk_user_profile_pictures_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 2. Mevcut profil resimlerini yeni tabloya tasi
INSERT INTO user_profile_pictures (user_id, picture_data)
SELECT id, profile_picture
FROM users
WHERE profile_picture IS NOT NULL;

-- 3. Eski sutunu kaldir
ALTER TABLE users DROP COLUMN IF EXISTS profile_picture;

-- 4. Index ekle (user_id uzerinden hizli erisim)
CREATE INDEX IF NOT EXISTS idx_user_profile_pictures_user_id ON user_profile_pictures(user_id);
