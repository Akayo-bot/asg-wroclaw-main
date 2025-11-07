-- Add missing translation keys for complete localization

-- Games page translations
INSERT INTO ui_strings (key, category, text_uk, text_ru, text_pl, text_en) VALUES
('pages.games.status.closed', 'games', 'Набір закрито', 'Набор закрыт', 'Nabór zamknięty', 'Registration Closed'),
('pages.games.status.open', 'games', 'Реєстрація відкрита', 'Регистрация открыта', 'Rejestracja otwarta', 'Registration Open'),
('pages.games.status.waitlist', 'games', 'Очікування', 'Ожидание', 'Lista oczекujących', 'Waitlist'),
('pages.games.players_count', 'games', 'гравців', 'игроков', 'graczy', 'players'),
('pages.games.scenario_label', 'games', 'Сценарій:', 'Сценарий:', 'Scenariusz:', 'Scenario:'),
('pages.games.button.register', 'games', 'ЗАПИСАТИСЯ', 'ЗАПИСАТЬСЯ', 'ZAPISAĆ SIĘ', 'REGISTER'),
('pages.games.button.waitlist', 'games', 'СПИСОК ОЧІКУВАННЯ', 'СПИСОК ОЖИДАНИЯ', 'LISTA OCZEKUJĄCYCH', 'WAITLIST')
ON CONFLICT (key) DO UPDATE SET
  text_uk = EXCLUDED.text_uk,
  text_ru = EXCLUDED.text_ru,
  text_pl = EXCLUDED.text_pl,
  text_en = EXCLUDED.text_en,
  updated_at = now();