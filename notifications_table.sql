-- Таблица уведомлений
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('medicine_added', 'medicine_deleted', 'invite')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  aptechka_id UUID REFERENCES aptechkas(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Политики
CREATE POLICY "Users can view their notifications" ON notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their notifications" ON notifications
  FOR UPDATE USING (user_id = auth.uid());

-- Индексы
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);

-- Функция для создания уведомлений при добавлении лекарства
CREATE OR REPLACE FUNCTION notify_medicine_added()
RETURNS TRIGGER AS $$
DECLARE
  member_id UUID;
  aptechka_name TEXT;
  medicine_name TEXT;
BEGIN
  SELECT name INTO aptechka_name FROM aptechkas WHERE id = NEW.aptechka_id;
  medicine_name := NEW.name;
  
  -- Уведомляем всех участников кроме того кто добавил
  FOR member_id IN 
    SELECT owner_id FROM aptechkas WHERE id = NEW.aptechka_id
    UNION
    SELECT user_id FROM aptechka_members WHERE aptechka_id = NEW.aptechka_id
  LOOP
    IF member_id != auth.uid() THEN
      INSERT INTO notifications (user_id, type, title, message, aptechka_id)
      VALUES (
        member_id,
        'medicine_added',
        'Добавлено лекарство',
        'В аптечку "' || aptechka_name || '" добавлено: ' || medicine_name,
        NEW.aptechka_id
      );
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Триггер
DROP TRIGGER IF EXISTS on_medicine_added ON medicines;
CREATE TRIGGER on_medicine_added
  AFTER INSERT ON medicines
  FOR EACH ROW EXECUTE FUNCTION notify_medicine_added();
