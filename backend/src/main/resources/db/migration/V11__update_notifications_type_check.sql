-- V11: Update notifications type check constraint to include new notification types
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
    CHECK (type IN ('CONNECTION_REQUEST', 'CONNECTION_ACCEPTED', 'CONNECTION_REJECTED', 'BOARD_MEMBER_INVITATION', 'BOARD_MEMBER_ACCEPTED'));
