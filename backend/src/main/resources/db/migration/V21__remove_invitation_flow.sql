-- V21: Remove invitation flow - convert all PENDING/REJECTED members to ACCEPTED, clean up invitation notifications

-- Convert all PENDING and REJECTED board members to ACCEPTED
UPDATE board_members SET status = 'ACCEPTED' WHERE status IN ('PENDING', 'REJECTED');

-- Delete all board member invitation and accepted notifications
DELETE FROM notifications WHERE type IN ('BOARD_MEMBER_INVITATION', 'BOARD_MEMBER_ACCEPTED');

-- Update notifications type check constraint to remove invitation types
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
    CHECK (type IN ('CONNECTION_REQUEST', 'CONNECTION_ACCEPTED', 'CONNECTION_REJECTED'));
