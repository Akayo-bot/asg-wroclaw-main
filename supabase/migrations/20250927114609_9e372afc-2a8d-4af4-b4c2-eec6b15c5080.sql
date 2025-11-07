-- Add English language support to all i18n tables
ALTER TABLE articles ADD COLUMN title_en TEXT;
ALTER TABLE articles ADD COLUMN content_en TEXT;  
ALTER TABLE articles ADD COLUMN preview_en TEXT;

ALTER TABLE events ADD COLUMN title_en TEXT;
ALTER TABLE events ADD COLUMN description_en TEXT;
ALTER TABLE events ADD COLUMN location_en TEXT;
ALTER TABLE events ADD COLUMN rules_en TEXT;
ALTER TABLE events ADD COLUMN scenario_en TEXT;

ALTER TABLE gallery_items ADD COLUMN title_en TEXT;
ALTER TABLE gallery_items ADD COLUMN description_en TEXT;

ALTER TABLE team_members ADD COLUMN role_en TEXT;
ALTER TABLE team_members ADD COLUMN bio_en TEXT;

-- Add status fields to tables that need them
ALTER TABLE gallery_items ADD COLUMN status TEXT DEFAULT 'published' CHECK (status IN ('draft', 'published', 'hidden'));
ALTER TABLE events ADD COLUMN limit_mode TEXT DEFAULT 'unlimited' CHECK (limit_mode IN ('unlimited', 'ranged'));
ALTER TABLE events ADD COLUMN min_players INTEGER;
ALTER TABLE events ADD COLUMN max_players INTEGER;
ALTER TABLE events ADD COLUMN price_currency TEXT DEFAULT 'PLN' CHECK (price_currency IN ('PLN', 'USD', 'EUR', 'UAH'));

-- Add validation triggers for events
CREATE OR REPLACE FUNCTION validate_event_limits()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate ranged limits
  IF NEW.limit_mode = 'ranged' THEN
    IF NEW.min_players IS NULL OR NEW.max_players IS NULL THEN
      RAISE EXCEPTION 'min_players and max_players are required when limit_mode is ranged';
    END IF;
    
    IF NEW.min_players <= 0 OR NEW.max_players <= 0 THEN
      RAISE EXCEPTION 'min_players and max_players must be greater than 0';
    END IF;
    
    IF NEW.min_players > NEW.max_players THEN
      RAISE EXCEPTION 'min_players cannot be greater than max_players';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_event_limits_trigger
  BEFORE INSERT OR UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION validate_event_limits();

-- Create team settings table for mission and KPIs
CREATE TABLE team_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_title_uk TEXT NOT NULL,
  mission_title_ru TEXT NOT NULL,
  mission_title_pl TEXT NOT NULL,
  mission_title_en TEXT NOT NULL,
  mission_description_uk TEXT NOT NULL,
  mission_description_ru TEXT NOT NULL,
  mission_description_pl TEXT NOT NULL,
  mission_description_en TEXT NOT NULL,
  active_members INTEGER DEFAULT 12,
  games_played INTEGER DEFAULT 156,
  win_rate INTEGER DEFAULT 89,
  years_active INTEGER DEFAULT 5,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS for team_settings
ALTER TABLE team_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view team settings" ON team_settings
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage team settings" ON team_settings
  FOR ALL USING (get_current_user_role() = 'admin');

-- Insert default team settings
INSERT INTO team_settings (
  mission_title_uk, mission_title_ru, mission_title_pl, mission_title_en,
  mission_description_uk, mission_description_ru, mission_description_pl, mission_description_en
) VALUES (
  'Наша місія',
  'Наша миссия', 
  'Nasza misja',
  'Our Mission',
  'Raven Strike Force - це команда професіоналів, об''єднаних пристрастю до тактичного страйкболу та духом братерства. Ми прагнемо до досконалості в кожній операції, підтримуючи найвищі стандарти тактичної підготовки та командної роботи.',
  'Raven Strike Force - это команда профессионалов, объединенных страстью к тактическому страйкболу и духом братства. Мы стремимся к совершенству в каждой операции, поддерживая высочайшие стандарты тактической подготовки и командной работы.',
  'Raven Strike Force to zespół profesjonalistów zjednoczonych pasją do taktycznego airsoftu i duchem braterstwa. Dążymy do doskonałości w każdej operacji, utrzymując najwyższe standardy przygotowania taktycznego i pracy zespołowej.',
  'Raven Strike Force is a team of professionals united by passion for tactical airsoft and the spirit of brotherhood. We strive for excellence in every operation, maintaining the highest standards of tactical preparation and teamwork.'
);

-- Create trigger for team_settings updated_at
CREATE TRIGGER update_team_settings_updated_at
  BEFORE UPDATE ON team_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create edge function for event auto-cancellation (will be implemented separately)
-- This is just the database setup for it

-- Update existing sample data with English translations
UPDATE events SET 
  title_en = CASE 
    WHEN title_uk LIKE '%Чорний Орел%' THEN 'Operation "Black Eagle"'
    WHEN title_uk LIKE '%Залізний Вовк%' THEN 'Iron Wolf Tournament'
    WHEN title_uk LIKE '%Тиха Охота%' THEN 'Operation "Silent Hunt"'
    ELSE 'Tactical Operation'
  END,
  description_en = 'Tactical airsoft operation with CQB elements and strategic objectives',
  location_en = CASE
    WHEN location_uk LIKE '%Легніца%' THEN 'Legnica Forest'
    WHEN location_uk LIKE '%Вроцлав%' THEN 'Wroclaw CQB Arena'
    ELSE 'Tactical Training Ground'
  END,
  rules_en = 'Standard MilSim rules apply. Safety equipment mandatory.',
  scenario_en = 'Territory capture and hold mission with multiple objectives'
WHERE title_en IS NULL;

UPDATE team_members SET
  role_en = CASE
    WHEN role_uk LIKE '%командир%' THEN 'Squad Leader'
    WHEN role_uk LIKE '%снайпер%' THEN 'Sniper'
    WHEN role_uk LIKE '%медик%' THEN 'Medic'
    WHEN role_uk LIKE '%штурмовик%' THEN 'Assault'
    WHEN role_uk LIKE '%розвідник%' THEN 'Scout'
    ELSE 'Operator'
  END,
  bio_en = 'Experienced tactical airsoft operator with extensive field training and competitive background'
WHERE role_en IS NULL;

UPDATE gallery_items SET
  title_en = CASE
    WHEN title_uk LIKE '%Чорний Орел%' THEN 'Black Eagle Operation Highlights'
    WHEN title_uk LIKE '%тренування%' THEN 'Team Training Session'
    WHEN title_uk LIKE '%турнір%' THEN 'Tournament Victory'
    ELSE 'Tactical Operation'
  END,
  description_en = 'Action shots from our tactical airsoft operations and training sessions'
WHERE title_en IS NULL;