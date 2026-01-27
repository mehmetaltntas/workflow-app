-- Add firstName and lastName columns
ALTER TABLE users ADD COLUMN first_name VARCHAR(50);
ALTER TABLE users ADD COLUMN last_name VARCHAR(50);

-- Assign random Turkish names to existing users
UPDATE users SET first_name = CASE (FLOOR(RANDOM() * 20)::int)
    WHEN 0 THEN 'Ahmet'
    WHEN 1 THEN 'Mehmet'
    WHEN 2 THEN 'Ali'
    WHEN 3 THEN 'Ayse'
    WHEN 4 THEN 'Fatma'
    WHEN 5 THEN 'Zeynep'
    WHEN 6 THEN 'Mustafa'
    WHEN 7 THEN 'Emine'
    WHEN 8 THEN 'Hasan'
    WHEN 9 THEN 'Huseyin'
    WHEN 10 THEN 'Elif'
    WHEN 11 THEN 'Murat'
    WHEN 12 THEN 'Ozlem'
    WHEN 13 THEN 'Burak'
    WHEN 14 THEN 'Selin'
    WHEN 15 THEN 'Emre'
    WHEN 16 THEN 'Derya'
    WHEN 17 THEN 'Cem'
    WHEN 18 THEN 'Deniz'
    WHEN 19 THEN 'Gul'
END,
last_name = CASE (FLOOR(RANDOM() * 20)::int)
    WHEN 0 THEN 'Yilmaz'
    WHEN 1 THEN 'Kaya'
    WHEN 2 THEN 'Demir'
    WHEN 3 THEN 'Celik'
    WHEN 4 THEN 'Sahin'
    WHEN 5 THEN 'Yildiz'
    WHEN 6 THEN 'Aydin'
    WHEN 7 THEN 'Ozdemir'
    WHEN 8 THEN 'Arslan'
    WHEN 9 THEN 'Dogan'
    WHEN 10 THEN 'Kilic'
    WHEN 11 THEN 'Aslan'
    WHEN 12 THEN 'Cetin'
    WHEN 13 THEN 'Koc'
    WHEN 14 THEN 'Kurt'
    WHEN 15 THEN 'Ozturk'
    WHEN 16 THEN 'Erdogan'
    WHEN 17 THEN 'Aksoy'
    WHEN 18 THEN 'Gunes'
    WHEN 19 THEN 'Korkmaz'
END
WHERE first_name IS NULL;

-- Now set NOT NULL constraint
ALTER TABLE users ALTER COLUMN first_name SET NOT NULL;
ALTER TABLE users ALTER COLUMN last_name SET NOT NULL;
