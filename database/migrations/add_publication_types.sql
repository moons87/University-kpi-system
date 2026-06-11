-- Extend publication.type column and its CHECK constraint (MySQL 8).
-- For fresh installs the final definition already lives in schema.sql;
-- this migration only upgrades an already-populated database.

ALTER TABLE publications MODIFY COLUMN type VARCHAR(50) NOT NULL;

-- Drop the previous type CHECK first. MySQL auto-generates the constraint
-- name (e.g. publications_chk_1) — adjust to the actual name if it differs:
-- ALTER TABLE publications DROP CHECK publications_chk_1;

ALTER TABLE publications
    ADD CONSTRAINT publications_type_check CHECK (
        type IN (
            'Scopus',
            'WoS',
            'Вестник',
            'Конференция',
            'КОКСНВО',
            'Международная конференция',
            'Монография',
            'Учебное пособие',
            'Зарубежные журналы'
        )
    );
