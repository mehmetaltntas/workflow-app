-- V3: Connections, Notifications, Privacy

-- 1. Users tablosuna profil gizlilik alani ekle
ALTER TABLE users ADD COLUMN is_profile_public BOOLEAN NOT NULL DEFAULT TRUE;

-- 2. Connections (Baglanti) tablosu
CREATE TABLE connections (
    id BIGSERIAL PRIMARY KEY,
    version BIGINT NOT NULL DEFAULT 0,
    sender_id BIGINT NOT NULL,
    receiver_id BIGINT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_connections_sender FOREIGN KEY (sender_id) REFERENCES users(id),
    CONSTRAINT fk_connections_receiver FOREIGN KEY (receiver_id) REFERENCES users(id),
    CONSTRAINT uq_connections_sender_receiver UNIQUE (sender_id, receiver_id),
    CONSTRAINT chk_connections_no_self CHECK (sender_id <> receiver_id)
);

CREATE INDEX idx_connections_sender_id ON connections(sender_id);
CREATE INDEX idx_connections_receiver_id ON connections(receiver_id);
CREATE INDEX idx_connections_status ON connections(status);

-- 3. Notifications (Bildirim) tablosu
CREATE TABLE notifications (
    id BIGSERIAL PRIMARY KEY,
    version BIGINT NOT NULL DEFAULT 0,
    recipient_id BIGINT NOT NULL,
    actor_id BIGINT NOT NULL,
    type VARCHAR(30) NOT NULL,
    message VARCHAR(500) NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    reference_id BIGINT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_notifications_recipient FOREIGN KEY (recipient_id) REFERENCES users(id),
    CONSTRAINT fk_notifications_actor FOREIGN KEY (actor_id) REFERENCES users(id)
);

CREATE INDEX idx_notifications_recipient_id ON notifications(recipient_id);
CREATE INDEX idx_notifications_is_read ON notifications(recipient_id, is_read);
CREATE INDEX idx_notifications_created_at ON notifications(recipient_id, created_at DESC);
