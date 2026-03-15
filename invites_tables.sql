-- Таблица приглашений в аптечку
CREATE TABLE IF NOT EXISTS aptechka_invites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  aptechka_id UUID REFERENCES aptechkas(id) ON DELETE CASCADE,
  invited_email TEXT NOT NULL,
  invited_by UUID REFERENCES auth.users(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица участников аптечки
CREATE TABLE IF NOT EXISTS aptechka_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  aptechka_id UUID REFERENCES aptechkas(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(aptechka_id, user_id)
);

-- RLS
ALTER TABLE aptechka_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE aptechka_members ENABLE ROW LEVEL SECURITY;

-- Политики для приглашений
CREATE POLICY "Users can view invites for their aptechkas" ON aptechka_invites
  FOR SELECT USING (
    aptechka_id IN (SELECT id FROM aptechkas WHERE owner_id = auth.uid())
    OR invited_email = auth.email()
  );

CREATE POLICY "Owners can create invites" ON aptechka_invites
  FOR INSERT WITH CHECK (
    aptechka_id IN (SELECT id FROM aptechkas WHERE owner_id = auth.uid())
  );

CREATE POLICY "Users can update their invites" ON aptechka_invites
  FOR UPDATE USING (invited_email = auth.email());

CREATE POLICY "Owners can delete invites" ON aptechka_invites
  FOR DELETE USING (
    aptechka_id IN (SELECT id FROM aptechkas WHERE owner_id = auth.uid())
  );

-- Политики для участников
CREATE POLICY "Users can view members of their aptechkas" ON aptechka_members
  FOR SELECT USING (
    aptechka_id IN (
      SELECT id FROM aptechkas WHERE owner_id = auth.uid()
      UNION
      SELECT aptechka_id FROM aptechka_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can add themselves as members" ON aptechka_members
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Owners can delete members" ON aptechka_members
  FOR DELETE USING (
    aptechka_id IN (SELECT id FROM aptechkas WHERE owner_id = auth.uid())
  );

-- Индексы
CREATE INDEX IF NOT EXISTS idx_invites_aptechka ON aptechka_invites(aptechka_id);
CREATE INDEX IF NOT EXISTS idx_invites_email ON aptechka_invites(invited_email);
CREATE INDEX IF NOT EXISTS idx_members_aptechka ON aptechka_members(aptechka_id);
CREATE INDEX IF NOT EXISTS idx_members_user ON aptechka_members(user_id);
