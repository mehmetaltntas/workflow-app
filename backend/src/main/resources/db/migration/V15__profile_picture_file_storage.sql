-- V15: Profil resimlerini Base64 (DB) yerine dosya sisteminde sakla
-- Eski Base64 verisi kaybolacak (dev proje icin kabul edilebilir)

-- Yeni file_path kolonu ekle
ALTER TABLE user_profile_pictures ADD COLUMN file_path VARCHAR(500);

-- Eski picture_data kolonunu kaldir
ALTER TABLE user_profile_pictures DROP COLUMN IF EXISTS picture_data;
