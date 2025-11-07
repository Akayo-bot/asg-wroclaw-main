-- Create branding settings table
CREATE TABLE public.site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_name text NOT NULL DEFAULT 'Raven Strike Force',
  tagline_uk text DEFAULT 'Страйкбол — це більше, ніж гра',
  tagline_ru text DEFAULT 'Страйкбол — это больше, чем игра', 
  tagline_pl text DEFAULT 'Airsoft to coś więcej niż gra',
  tagline_en text DEFAULT 'Airsoft is more than a game',
  logo_light_url text,
  logo_dark_url text,
  favicon_url text,
  og_image_url text,
  primary_color text DEFAULT 'hsl(122 39% 49%)',
  accent_color text DEFAULT 'hsl(4 90% 58%)',
  default_language text DEFAULT 'uk',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Insert default settings
INSERT INTO public.site_settings (site_name) VALUES ('Raven Strike Force');

-- Enable RLS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies for site_settings
CREATE POLICY "Everyone can view site settings" ON public.site_settings 
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage site settings" ON public.site_settings 
  FOR ALL USING (get_current_user_role() = 'admin');

-- Create UI strings table for interface translations
CREATE TABLE public.ui_strings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  text_uk text NOT NULL,
  text_ru text NOT NULL,
  text_pl text NOT NULL,
  text_en text NOT NULL,
  category text DEFAULT 'general',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS for ui_strings
ALTER TABLE public.ui_strings ENABLE ROW LEVEL SECURITY;

-- RLS policies for ui_strings
CREATE POLICY "Everyone can view ui strings" ON public.ui_strings 
  FOR SELECT USING (true);

CREATE POLICY "Admins and editors can manage ui strings" ON public.ui_strings 
  FOR ALL USING (get_current_user_role() = ANY(ARRAY['admin'::user_role, 'editor'::user_role]));

-- Insert core UI strings
INSERT INTO public.ui_strings (key, text_uk, text_ru, text_pl, text_en, category) VALUES
('site.title', 'Raven Strike Force', 'Raven Strike Force', 'Raven Strike Force', 'Raven Strike Force', 'branding'),
('site.tagline', 'Страйкбол — це більше, ніж гра', 'Страйкбол — это больше, чем игра', 'Airsoft to coś więcej niż gra', 'Airsoft is more than a game', 'branding'),
('nav.games', 'Ігри', 'Игры', 'Gry', 'Games', 'navigation'),
('nav.team', 'Команда', 'Команда', 'Zespół', 'Team', 'navigation'),
('nav.gallery', 'Галерея', 'Галерея', 'Galeria', 'Gallery', 'navigation'),
('nav.articles', 'Статті', 'Статьи', 'Artykuły', 'Articles', 'navigation'),
('nav.contacts', 'Контакти', 'Контакты', 'Kontakt', 'Contacts', 'navigation'),
('auth.login', 'Увійти', 'Войти', 'Zaloguj się', 'Login', 'auth'),
('auth.logout', 'Вийти', 'Выйти', 'Wyloguj się', 'Logout', 'auth'),
('auth.register', 'Зареєструватися', 'Зарегистрироваться', 'Zarejestruj się', 'Register', 'auth'),
('common.loading', 'Завантаження...', 'Загрузка...', 'Ładowanie...', 'Loading...', 'common'),
('common.save', 'Зберегти', 'Сохранить', 'Zapisz', 'Save', 'common'),
('common.cancel', 'Скасувати', 'Отменить', 'Anuluj', 'Cancel', 'common'),
('common.delete', 'Видалити', 'Удалить', 'Usuń', 'Delete', 'common'),
('common.edit', 'Редагувати', 'Редактировать', 'Edytuj', 'Edit', 'common'),
('hero.cta', 'Приєднатися до команди', 'Присоединиться к команде', 'Dołącz do zespołu', 'Join the team', 'hero'),
('games.register', 'Записатися на гру', 'Записаться на игру', 'Zapisz się na grę', 'Register for game', 'games');

-- Add updated_at trigger
CREATE TRIGGER update_site_settings_updated_at
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ui_strings_updated_at
  BEFORE UPDATE ON public.ui_strings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to get site settings
CREATE OR REPLACE FUNCTION public.get_site_settings()
RETURNS jsonb
LANGUAGE sql
STABLE
AS $$
  SELECT row_to_json(s)::jsonb
  FROM public.site_settings s
  ORDER BY created_at DESC
  LIMIT 1;
$$;