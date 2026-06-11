-- Extend publication type column and update CHECK constraint
-- Adds: КОКНВО, Международная конференция, Монография, Учебное пособие

ALTER TABLE publications
    DROP CONSTRAINT IF EXISTS publications_type_check;

ALTER TABLE publications
    ALTER COLUMN type TYPE VARCHAR(50);

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
