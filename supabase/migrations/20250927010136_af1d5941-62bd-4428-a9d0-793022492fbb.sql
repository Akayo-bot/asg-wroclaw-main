-- Add more essential UI translation keys for complete localization
INSERT INTO public.ui_strings (key, category, text_uk, text_ru, text_pl, text_en) VALUES

-- Site/Brand keys
('site.tagline', 'brand', 'Страйкбол — це більше, ніж гра', 'Страйкбол — это больше, чем игра', 'Airsoft to coś więcej niż gra', 'Airsoft is more than a game'),

-- Navigation
('nav.admin_panel', 'navigation', 'Панель адміна', 'Панель администратора', 'Panel administracyjny', 'Admin Panel'),

-- Profile
('profile.title', 'profile', 'Профіль', 'Профиль', 'Profil', 'Profile'),

-- Admin
('admin.title', 'admin', 'Панель адміна', 'Панель администратора', 'Panel administracyjny', 'Admin Panel'),
('admin.branding.title', 'admin', 'Управління брендом', 'Управление брендом', 'Zarządzanie marką', 'Brand Management'),
('admin.branding.description', 'admin', 'Налаштуйте зовнішній вигляд і брендинг вашого сайту', 'Настройте внешний вид и брендинг вашего сайта', 'Dostosuj wygląd i branding swojej strony', 'Customize your site appearance and branding'),
('admin.branding.basic', 'admin', 'Основна інформація', 'Основная информация', 'Podstawowe informacje', 'Basic Information'),
('admin.branding.basic_desc', 'admin', 'Назва сайту та базовий слоган', 'Название сайта и базовый слоган', 'Nazwa strony i podstawowy slogan', 'Site name and base tagline'),
('admin.branding.site_name', 'admin', 'Назва сайту', 'Название сайта', 'Nazwa strony', 'Site Name'),
('admin.branding.tagline_base', 'admin', 'Базовий слоган', 'Базовый слоган', 'Podstawowy slogan', 'Base Tagline'),
('admin.branding.tagline_help', 'admin', 'Базовий текст слогана. Переклади керуються в', 'Базовый текст слогана. Переводы управляются в', 'Podstawowy tekst sloganu. Tłumaczenia są zarządzane w', 'Base tagline text. Translations are managed in the'),
('admin.branding.translations_link', 'admin', 'Менеджері перекладів', 'Менеджере переводов', 'Menedżerze tłumaczeń', 'Translations Manager'),
('admin.branding.assets', 'admin', 'Візуальні ресурси', 'Визуальные ресурсы', 'Zasoby wizualne', 'Visual Assets'),
('admin.branding.assets_desc', 'admin', 'Логотипи, фавікон та зображення для соціальних мереж', 'Логотипы, фавикон и изображения для соцсетей', 'Loga, favicon i obrazy dla mediów społecznościowych', 'Logos, favicon, and social media images'),
('admin.branding.logo_url', 'admin', 'URL логотипу', 'URL логотипа', 'URL logo', 'Logo URL'),
('admin.branding.favicon_url', 'admin', 'URL фавікону', 'URL фавикона', 'URL favicon', 'Favicon URL'),
('admin.branding.og_image_url', 'admin', 'URL зображення для соціальних мереж', 'URL изображения для соцсетей', 'URL obrazu dla mediów społecznościowych', 'Social Media Image URL'),
('admin.branding.colors', 'admin', 'Кольори бренду', 'Цвета бренда', 'Kolory marki', 'Brand Colors'),
('admin.branding.colors_desc', 'admin', 'Основний і акцентний кольори вашого бренду', 'Основной и акцентный цвета вашего бренда', 'Podstawowe i akcentowe kolory twojej marki', 'Primary and accent colors for your brand'),
('admin.branding.primary_color', 'admin', 'Основний колір', 'Основной цвет', 'Kolor podstawowy', 'Primary Color'),
('admin.branding.accent_color', 'admin', 'Акцентний колір', 'Акцентный цвет', 'Kolor akcentowy', 'Accent Color'),
('admin.branding.settings', 'admin', 'Налаштування', 'Настройки', 'Ustawienia', 'Settings'),
('admin.branding.settings_desc', 'admin', 'Глобальні налаштування сайту', 'Глобальные настройки сайта', 'Globalne ustawienia strony', 'Global site settings'),
('admin.branding.default_language', 'admin', 'Мова за замовчуванням', 'Язык по умолчанию', 'Język domyślny', 'Default Language'),
('admin.branding.saved', 'admin', 'Налаштування брендингу збережено успішно', 'Настройки брендинга сохранены успешно', 'Ustawienia brandingu zostały pomyślnie zapisane', 'Branding settings saved successfully'),
('admin.branding.error', 'admin', 'Не вдалося зберегти налаштування брендингу', 'Не удалось сохранить настройки брендинга', 'Nie udało się zapisać ustawień brandingu', 'Failed to save branding settings'),

-- Common
('common.save', 'common', 'Зберегти зміни', 'Сохранить изменения', 'Zapisz zmiany', 'Save Changes')

ON CONFLICT (key) DO UPDATE SET
  text_uk = EXCLUDED.text_uk,
  text_ru = EXCLUDED.text_ru,
  text_pl = EXCLUDED.text_pl,
  text_en = EXCLUDED.text_en,
  updated_at = now();