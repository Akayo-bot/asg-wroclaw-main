-- Add gallery, articles, and contact page translations
INSERT INTO ui_strings (key, category, text_uk, text_ru, text_pl, text_en) VALUES
('pages.gallery.badge.video', 'gallery', 'ВІДЕО', 'ВИДЕО', 'WIDEO', 'VIDEO'),
('pages.gallery.badge.photo', 'gallery', 'ФОТО', 'ФОТО', 'ZDJĘCIE', 'PHOTO'),
('pages.gallery.video_loading', 'gallery', 'Відео буде завантажено', 'Видео будет загружено', 'Wideo zostanie załadowane', 'Video will be loaded'),
('pages.gallery.stats.photos', 'gallery', 'Фотографій', 'Фотографий', 'Zdjęć', 'Photos'),
('pages.gallery.stats.videos', 'gallery', 'Відео', 'Видео', 'Filmów', 'Videos'),
('pages.gallery.stats.events', 'gallery', 'Подій', 'Событий', 'Wydarzeń', 'Events'),
('pages.gallery.stats.content', 'gallery', 'Контенту', 'Контента', 'Treści', 'Content'),
('pages.articles.featured', 'articles', 'Рекомендовані статті', 'Рекомендуемые статьи', 'Polecane artykuły', 'Featured Articles'),
('common.read_more', 'common', 'Читати далі', 'Читать далее', 'Czytaj dalej', 'Read More')
ON CONFLICT (key) DO UPDATE SET
  text_uk = EXCLUDED.text_uk,
  text_ru = EXCLUDED.text_ru,
  text_pl = EXCLUDED.text_pl,
  text_en = EXCLUDED.text_en,
  updated_at = now();