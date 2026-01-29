-- Güvenlik düzeltmesi: Bireysel (INDIVIDUAL) panolardaki eski üyelik kayıtlarını temizle.
-- V5 migration'ında status sütunu DEFAULT 'ACCEPTED' ile eklendiğinde,
-- V8 migration'ında board_type DEFAULT 'INDIVIDUAL' ile eklendiğinde,
-- eski board_member kayıtları otomatik olarak ACCEPTED + INDIVIDUAL kombinasyonuna düştü.
-- Bireysel panolara üye eklenemez (addMember bunu engelliyor), bu yüzden bu kayıtlar geçersizdir.
DELETE FROM board_members
WHERE board_id IN (
    SELECT id FROM boards WHERE board_type = 'INDIVIDUAL'
);
