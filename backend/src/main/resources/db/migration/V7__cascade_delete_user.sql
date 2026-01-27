-- Add ON DELETE CASCADE to connections table foreign keys
ALTER TABLE connections DROP CONSTRAINT fk_connections_sender;
ALTER TABLE connections ADD CONSTRAINT fk_connections_sender FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE connections DROP CONSTRAINT fk_connections_receiver;
ALTER TABLE connections ADD CONSTRAINT fk_connections_receiver FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE;

-- Add ON DELETE CASCADE to notifications table foreign keys
ALTER TABLE notifications DROP CONSTRAINT fk_notifications_recipient;
ALTER TABLE notifications ADD CONSTRAINT fk_notifications_recipient FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE notifications DROP CONSTRAINT fk_notifications_actor;
ALTER TABLE notifications ADD CONSTRAINT fk_notifications_actor FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE CASCADE;
