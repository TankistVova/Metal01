-- Добавляем поле owner_name в таблицу aptechkas
ALTER TABLE aptechkas ADD COLUMN IF NOT EXISTS owner_name TEXT;

-- Обновляем существующие записи (опционально)
-- UPDATE aptechkas SET owner_name = 'Владелец' WHERE owner_name IS NULL;
