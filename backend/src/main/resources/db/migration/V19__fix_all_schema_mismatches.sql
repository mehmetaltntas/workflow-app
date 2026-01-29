-- V19: Fix all entity-vs-schema mismatches for Hibernate 7.2.1 validate mode

-- 1) tasks.description: Entity VARCHAR(500), DB VARCHAR(100)
ALTER TABLE tasks ALTER COLUMN description TYPE VARCHAR(500);

-- 2) email_verification_tokens.attempts: Entity'de var, DB'de yok
ALTER TABLE email_verification_tokens ADD COLUMN attempts INTEGER NOT NULL DEFAULT 0;

-- 3) email_verification_tokens.version: Entity'de @Version var, DB'de yok
ALTER TABLE email_verification_tokens ADD COLUMN version BIGINT;

-- 4) password_reset_tokens.attempts: Entity'de var, DB'de yok
ALTER TABLE password_reset_tokens ADD COLUMN attempts INTEGER NOT NULL DEFAULT 0;

-- 5) password_reset_tokens.version: Entity'de @Version var, DB'de yok
ALTER TABLE password_reset_tokens ADD COLUMN version BIGINT;

-- 6) refresh_tokens.version: Entity'de @Version var, DB'de yok
ALTER TABLE refresh_tokens ADD COLUMN version BIGINT;

-- 7) user_profile_pictures.version: Entity'de @Version var, DB'de yok
ALTER TABLE user_profile_pictures ADD COLUMN version BIGINT;
