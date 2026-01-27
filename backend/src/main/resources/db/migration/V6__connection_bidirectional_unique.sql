-- Prevent bidirectional duplicate connections
-- This ensures only one connection can exist between any two users regardless of direction
CREATE UNIQUE INDEX uq_connections_user_pair ON connections (LEAST(sender_id, receiver_id), GREATEST(sender_id, receiver_id));
