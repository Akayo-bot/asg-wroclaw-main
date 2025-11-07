-- Add team page translations
INSERT INTO ui_strings (key, category, text_uk, text_ru, text_pl, text_en) VALUES
('pages.team.stats.active_members', 'team', 'Активних учасників', 'Активных членов', 'Aktywnych członków', 'Active Members'),
('pages.team.stats.games_played', 'team', 'Проведено ігор', 'Проведено игр', 'Rozegranych gier', 'Games Played'),
('pages.team.stats.win_rate', 'team', 'Відсоток перемог', 'Процент побед', 'Procent zwycięstw', 'Win Rate'),
('pages.team.stats.years_active', 'team', 'Років існування', 'Лет существования', 'Lat istnienia', 'Years Active'),
('pages.team.stats.games_label', 'team', 'Ігор', 'Игр', 'Gier', 'Games'),
('pages.team.stats.wins_label', 'team', 'Перемог', 'Побед', 'Zwycięstw', 'Wins'),
('pages.team.stats.accuracy_label', 'team', 'Точність', 'Точность', 'Celność', 'Accuracy'),
('pages.team.experience_label', 'team', 'Досвід:', 'Опыт:', 'Doświadczenie:', 'Experience:'),
('pages.team.mission.title', 'team', 'Наша місія', 'Наша миссия', 'Nasza misja', 'Our Mission'),
('pages.team.mission.description', 'team', 'Raven Strike Force - це команда професіоналів, об''єднаних пристрастю до тактичного страйкболу. Ми прагнемо досконалості в кожній операції, розвиваємо навички командної роботи та просуваємо культуру безпечного та чесного геймплею. Наша мета - не просто перемагати, а надихати інших гравців на досягнення нових висот у світі страйкболу.', 'Raven Strike Force - это команда профессионалов, объединенных страстью к тактическому страйкболу. Мы стремимся к совершенству в каждой операции, развиваем навыки командной работы и продвигаем культуру безопасного и честного геймплея. Наша цель - не просто побеждать, но и вдохновлять других игроков на достижение новых высот в мире страйкбола.', 'Raven Strike Force to zespół profesjonalistów zjednoczonych pasją do taktycznego ASG. Dążymy do doskonałości w każdej operacji, rozwijamy umiejętności pracy zespołowej i promujemy kulturę bezpiecznej i uczciwej rozgrywki. Naszym celem jest nie tylko wygrywanie, ale także inspirowanie innych graczy do osiągania nowych wysokości w świecie ASG.', 'Raven Strike Force is a team of professionals united by passion for tactical airsoft. We strive for excellence in every operation, develop teamwork skills and promote a culture of safe and fair gameplay. Our goal is not just to win, but to inspire other players to reach new heights in the world of airsoft.')
ON CONFLICT (key) DO UPDATE SET
  text_uk = EXCLUDED.text_uk,
  text_ru = EXCLUDED.text_ru,
  text_pl = EXCLUDED.text_pl,
  text_en = EXCLUDED.text_en,
  updated_at = now();