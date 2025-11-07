-- Add sample data for gallery, events, and team with correct file types

-- Sample gallery items
INSERT INTO gallery_items (id, title_uk, title_ru, title_pl, description_uk, description_ru, description_pl, file_url, file_type, thumbnail_url, uploaded_by) VALUES
(gen_random_uuid(), 'Тактична гра Штурм', 'Тактическая игра Штурм', 'Gra taktyczna Szturm', 'Захоплюючі кадри з тактичної гри', 'Захватывающие кадры с тактической игры', 'Fascynujące ujęcia z gry taktycznej', '/src/assets/field-arena.jpg', 'image', '/src/assets/field-arena.jpg', (SELECT id FROM auth.users LIMIT 1)),
(gen_random_uuid(), 'Командне фото', 'Командное фото', 'Zdjęcie zespołowe', 'Наша команда після успішної операції', 'Наша команда после успешной операции', 'Nasz zespół po udanej operacji', '/src/assets/team-photo.jpg', 'image', '/src/assets/team-photo.jpg', (SELECT id FROM auth.users LIMIT 1)),
(gen_random_uuid(), 'Герой Airsoft', 'Герой Airsoft', 'Bohater Airsoft', 'Епічний момент у грі', 'Эпический момент в игре', 'Epicki moment w grze', '/src/assets/hero-airsoft.jpg', 'image', '/src/assets/hero-airsoft.jpg', (SELECT id FROM auth.users LIMIT 1));

-- Sample events
INSERT INTO events (id, title_uk, title_ru, title_pl, description_uk, description_ru, description_pl, location_uk, location_ru, location_pl, event_date, price, max_participants, status, created_by) VALUES
(gen_random_uuid(), 'Операція Зелений вовк', 'Операция Зеленый волк', 'Operacja Zielony wilk', 'Тактична гра у лісовій місцевості з елементами виживання', 'Тактическая игра в лесной местности с элементами выживания', 'Gra taktyczna na terenie leśnym z elementami survivalowymi', 'Лісова база біля Києва', 'Лесная база под Киевом', 'Baza leśna pod Kijowem', '2024-04-15 10:00:00+00', 150.00, 40, 'upcoming', (SELECT id FROM auth.users LIMIT 1)),
(gen_random_uuid(), 'Нічна операція Тінь', 'Ночная операция Тень', 'Nocna operacja Cień', 'Нічна тактична гра з використанням НВП', 'Ночная тактическая игра с использованием ПНВ', 'Nocna gra taktyczna z użyciem noktowizorów', 'Полігон Захід', 'Полигон Запад', 'Poligon Zachód', '2024-05-20 20:00:00+00', 200.00, 30, 'registration_open', (SELECT id FROM auth.users LIMIT 1)),
(gen_random_uuid(), 'Турнір Raven Cup', 'Турнир Raven Cup', 'Turniej Raven Cup', 'Щорічний турнір нашої команди', 'Ежегодный турнир нашей команды', 'Coroczny turniej naszego zespołu', 'Спортивний комплекс', 'Спортивный комплекс', 'Kompleks sportowy', '2024-03-10 09:00:00+00', 100.00, 60, 'completed', (SELECT id FROM auth.users LIMIT 1));

-- Sample team members
INSERT INTO team_members (id, callsign, real_name, role_uk, role_ru, role_pl, bio_uk, bio_ru, bio_pl, photo_url, is_active, display_order) VALUES
(gen_random_uuid(), 'RAVEN-01', 'Олександр', 'Командир команди', 'Командир команды', 'Dowódca zespołu', 'Досвідчений гравець з 8-річним стажем', 'Опытный игрок с 8-летним стажем', 'Doświadczony gracz z 8-letnim stażem', '/src/assets/team-photo.jpg', true, 1),
(gen_random_uuid(), 'RAVEN-02', 'Дмитро', 'Снайпер', 'Снайпер', 'Snajper', 'Спеціаліст по далекобійній стрільбі', 'Специалист по дальнобойной стрельбе', 'Specialista strzelania dalekobieżnego', '/src/assets/hero-airsoft.jpg', true, 2),
(gen_random_uuid(), 'RAVEN-03', 'Андрій', 'Медик', 'Медик', 'Medyk', 'Відповідальний за безпеку та першу допомогу', 'Ответственный за безопасность и первую помощь', 'Odpowiedzialny za bezpieczeństwo i pierwszą pomoc', '/src/assets/field-arena.jpg', true, 3),
(gen_random_uuid(), 'RAVEN-04', 'Максим', 'Радист', 'Радист', 'Radiotelegrafista', 'Забезпечує звязок між підрозділами', 'Обеспечивает связь между подразделениями', 'Zapewnia łączność między pododdziałami', '/src/assets/team-photo.jpg', true, 4);