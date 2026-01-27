-- V4: Yeni kullanicilarin varsayilan profil gizlilik ayarini gizli (FALSE) yap
ALTER TABLE users ALTER COLUMN is_profile_public SET DEFAULT FALSE;
