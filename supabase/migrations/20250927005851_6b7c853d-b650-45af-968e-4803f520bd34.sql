-- Step 1: Add new simplified fields to site_settings
ALTER TABLE public.site_settings 
ADD COLUMN tagline_base TEXT DEFAULT 'Airsoft is more than a game',
ADD COLUMN logo_url TEXT;

-- Step 2: Migrate existing tagline data to tagline_base (use UK version as base)
UPDATE public.site_settings 
SET tagline_base = COALESCE(tagline_uk, 'Airsoft is more than a game');

-- Step 3: Migrate existing logo data to single logo_url (prefer light version)
UPDATE public.site_settings 
SET logo_url = COALESCE(logo_light_url, logo_dark_url);

-- Step 4: Remove old language-specific tagline fields
ALTER TABLE public.site_settings 
DROP COLUMN IF EXISTS tagline_uk,
DROP COLUMN IF EXISTS tagline_ru, 
DROP COLUMN IF EXISTS tagline_pl,
DROP COLUMN IF EXISTS tagline_en;

-- Step 5: Remove old logo fields
ALTER TABLE public.site_settings 
DROP COLUMN IF EXISTS logo_light_url,
DROP COLUMN IF EXISTS logo_dark_url;

-- Step 6: Add brand.tagline key to ui_strings for translations
INSERT INTO public.ui_strings (key, category, text_uk, text_ru, text_pl, text_en) 
VALUES (
  'brand.tagline',
  'brand',
  'Страйкбол — це більше, ніж гра',
  'Страйкбол — это больше, чем игра', 
  'Airsoft to coś więcej niż gra',
  'Airsoft is more than a game'
) ON CONFLICT (key) DO NOTHING;

-- Step 7: Add essential UI translation keys for full localization
INSERT INTO public.ui_strings (key, category, text_uk, text_ru, text_pl, text_en) VALUES
('nav.games', 'navigation', 'Ігри', 'Игры', 'Gry', 'Games'),
('nav.team', 'navigation', 'Команда', 'Команда', 'Zespół', 'Team'),
('nav.gallery', 'navigation', 'Галерея', 'Галерея', 'Galeria', 'Gallery'),
('nav.articles', 'navigation', 'Статті', 'Статьи', 'Artykuły', 'Articles'),
('nav.contacts', 'navigation', 'Контакти', 'Контакты', 'Kontakty', 'Contacts'),
('nav.about', 'navigation', 'Про нас', 'О нас', 'O nas', 'About'),

('auth.login', 'auth', 'Увійти', 'Войти', 'Zaloguj się', 'Login'),
('auth.logout', 'auth', 'Вийти', 'Выйти', 'Wyloguj się', 'Logout'),
('auth.profile', 'auth', 'Профіль', 'Профиль', 'Profil', 'Profile'),

('buttons.register', 'buttons', 'Записатися', 'Записаться', 'Zapisz się', 'Register'),
('buttons.view_details', 'buttons', 'Детальніше', 'Подробнее', 'Zobacz szczegóły', 'View Details'),
('buttons.back', 'buttons', 'Назад', 'Назад', 'Wstecz', 'Back'),
('buttons.save', 'buttons', 'Зберегти', 'Сохранить', 'Zapisz', 'Save'),
('buttons.cancel', 'buttons', 'Скасувати', 'Отменить', 'Anuluj', 'Cancel'),
('buttons.edit', 'buttons', 'Редагувати', 'Редактировать', 'Edytuj', 'Edit'),
('buttons.delete', 'buttons', 'Видалити', 'Удалить', 'Usuń', 'Delete'),

('status.open', 'status', 'Відкрито', 'Открыто', 'Otwarte', 'Open'),
('status.closed', 'status', 'Закрито', 'Закрыто', 'Zamknięte', 'Closed'),
('status.registration_open', 'status', 'Реєстрація відкрита', 'Регистрация открыта', 'Rejestracja otwarta', 'Registration Open'),
('status.waitlist', 'status', 'Список очікування', 'Список ожидания', 'Lista oczekujących', 'Waitlist'),

('games.all', 'games', 'Всі', 'Все', 'Wszystkie', 'All'),
('games.upcoming', 'games', 'Майбутні', 'Предстоящие', 'Nadchodzące', 'Upcoming'), 
('games.past', 'games', 'Минулі', 'Прошедшие', 'Przeszłe', 'Past'),
('games.no_games', 'games', 'Немає ігор для відображення', 'Нет игр для отображения', 'Brak gier do wyświetlenia', 'No games to display'),

('common.loading', 'common', 'Завантаження...', 'Загрузка...', 'Ładowanie...', 'Loading...'),
('common.error', 'common', 'Помилка', 'Ошибка', 'Błąd', 'Error'),
('common.success', 'common', 'Успішно', 'Успешно', 'Sukces', 'Success')

ON CONFLICT (key) DO NOTHING;