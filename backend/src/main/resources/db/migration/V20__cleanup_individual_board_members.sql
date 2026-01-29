-- Güvenlik düzeltmesi: Bireysel (INDIVIDUAL) panolardaki eski üyelik kayıtlarını temizle.
-- V5 migration'ında status sütunu DEFAULT 'ACCEPTED' ile eklendiğinde,
-- V8 migration'ında board_type DEFAULT 'INDIVIDUAL' ile eklendiğinde,
-- eski board_member kayıtları otomatik olarak ACCEPTED + INDIVIDUAL kombinasyonuna düştü.
-- Bireysel panolara üye eklenemez (addMember bunu engelliyor), bu yüzden bu kayıtlar geçersizdir.
-- Önce board_member_assignments tablosundaki referansları temizle
-- (Hibernate'in oluşturduğu duplicate FK constraint ON DELETE CASCADE içermiyor)
DELETE FROM board_member_assignments
WHERE board_member_id IN (
    SELECT bm.id FROM board_members bm
    JOIN boards b ON bm.board_id = b.id
    WHERE b.board_type = 'INDIVIDUAL'
);

-- Ardından board_members kayıtlarını temizle
DELETE FROM board_members
WHERE board_id IN (
    SELECT id FROM boards WHERE board_type = 'INDIVIDUAL'
);
